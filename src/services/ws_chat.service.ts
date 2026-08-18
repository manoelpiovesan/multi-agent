import {IncomingMessage, Server as HttpServer} from "http";
import {WebSocket, WebSocketServer} from "ws";
import {authenticateJwtToken} from "../middlewares/authorization";
import {APIUser} from "../types/api/user_types";
import {
  WsIncomingEvent,
  WsIncomingEventType,
  WsOutgoingEvent,
  WsOutgoingEventType,
} from "../types/api/ws_chat_types";
import {ThreadRepository} from "../repositories/thread.repository";
import {AgentRuntimeService} from "./agent_runtime.service";

export class WsChatService {

  static initialize(server: HttpServer): void {
    const wss = new WebSocketServer({
      server,
      path: '/ws/chat',
    });

    wss.on('connection', (socket, request) => {
      const user = this.authenticateConnection(request);

      if (!user) {
        socket.close(1008, 'Unauthorized');
        return;
      }

      this.send(socket, {
        type: WsOutgoingEventType.CONNECTED,
        user_id: user.id,
      });

      let processingQueue = Promise.resolve();

      socket.on('message', (rawMessage) => {
        processingQueue = processingQueue
          .then(async () => {
            await this.handleIncomingMessage(socket, user, rawMessage.toString());
          })
          .catch(() => {
            this.sendError(socket, 'RUNTIME_ERROR', 'Failed to process websocket message');
          });
      });
    });
  }

  private static authenticateConnection(request: IncomingMessage): APIUser | null {
    const headerToken = this.extractBearerToken(request.headers.authorization);
    const queryToken = this.extractTokenFromQuery(request.url);
    const token = headerToken || queryToken;

    if (!token) {
      return null;
    }

    try {
      return authenticateJwtToken(token);
    } catch {
      return null;
    }
  }

  private static extractBearerToken(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.split(' ')[1];
  }

  private static extractTokenFromQuery(rawUrl?: string): string | null {
    if (!rawUrl) {
      return null;
    }

    const url = new URL(rawUrl, 'http://localhost');
    return url.searchParams.get('token');
  }

  private static async handleIncomingMessage(socket: WebSocket, user: APIUser, rawMessage: string): Promise<void> {
    const parsedMessage = this.parseIncomingEvent(rawMessage);

    if (!parsedMessage) {
      this.sendError(socket, 'INVALID_JSON', 'Invalid JSON payload');
      return;
    }

    if (parsedMessage.type !== WsIncomingEventType.USER_MESSAGE) {
      this.sendError(socket, 'INVALID_PAYLOAD', 'Unsupported event type');
      return;
    }

    if (!parsedMessage.thread_id?.trim() || !parsedMessage.content?.trim()) {
      this.sendError(socket, 'INVALID_PAYLOAD', 'thread_id and content are required');
      return;
    }

    const thread = await ThreadRepository.findRuntimeByIdForUser(parsedMessage.thread_id, user.id);

    if (!thread) {
      this.sendError(socket, 'THREAD_NOT_FOUND', 'Thread not found');
      return;
    }

    if (!thread.supervisor_id) {
      this.sendError(socket, 'THREAD_NOT_SUPERVISOR', 'Thread target must be a supervisor');
      return;
    }

    this.send(socket, {
      type: WsOutgoingEventType.PROCESSING,
      thread_id: parsedMessage.thread_id,
    });

    try {
      const conversation = await AgentRuntimeService.invokeThread(parsedMessage.thread_id, user.id, {
        content: parsedMessage.content,
        metadata: parsedMessage.metadata,
      });

      if (!conversation) {
        this.sendError(socket, 'THREAD_NOT_FOUND', 'Thread not found');
        return;
      }

      this.send(socket, {
        type: WsOutgoingEventType.ASSISTANT_MESSAGE,
        thread_id: parsedMessage.thread_id,
        content: conversation.output,
        message_id: conversation.messages[conversation.messages.length - 1]?.id,
      });
    } catch {
      this.sendError(socket, 'RUNTIME_ERROR', 'Supervisor runtime failed');
    }
  }

  private static parseIncomingEvent(rawMessage: string): WsIncomingEvent | null {
    try {
      return JSON.parse(rawMessage) as WsIncomingEvent;
    } catch {
      return null;
    }
  }

  private static sendError(
    socket: WebSocket,
    code: 'INVALID_JSON' | 'INVALID_PAYLOAD' | 'THREAD_NOT_FOUND' | 'THREAD_NOT_SUPERVISOR' | 'RUNTIME_ERROR',
    message: string,
  ): void {
    this.send(socket, {
      type: WsOutgoingEventType.ERROR,
      code,
      message,
    });
  }

  private static send(socket: WebSocket, event: WsOutgoingEvent): void {
    if (socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify(event));
  }
}

