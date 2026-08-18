import {IncomingMessage, Server as HttpServer} from "http";
import {WebSocket, WebSocketServer} from "ws";
import {authenticateJwtToken} from "../middlewares/authorization";
import {APIUser} from "../types/api/user_types";
import {
  WsIncomingEvent,
  WsIncomingEventType,
  WsOutgoingEvent,
  WsOutgoingEventType,
  WsUserMessagePayload,
} from "../types/api/ws_chat_types";
import {ThreadRepository} from "../repositories/thread.repository";
import {AgentRuntimeService} from "./agent_runtime.service";
import {ThreadModel} from "../models/thread_model";
import {SupervisorModel} from "../models/supervisor_model";

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
        const rawMessageText = rawMessage.toString();

        processingQueue = processingQueue
          .then(async () => {
            await this.handleIncomingMessage(socket, user, rawMessageText);
          })
          .catch((error: unknown) => {
            this.logWsError('Queue processing failed', {
              user_id: user.id,
              raw_message: this.safeParseRawMessage(rawMessageText),
              error,
            });
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

    if (!parsedMessage.content?.trim()) {
      this.sendError(socket, 'INVALID_PAYLOAD', 'content is required');
      return;
    }

    const threadResolution = await this.resolveSupervisorThread(user.id, parsedMessage);

    if (threadResolution.error) {
      this.sendError(socket, threadResolution.error.code, threadResolution.error.message);
      return;
    }

    const thread = threadResolution.thread!;

    this.send(socket, {
      type: WsOutgoingEventType.PROCESSING,
      thread_id: thread.id,
    });

    try {
      const conversation = await AgentRuntimeService.invokeThread(thread.id, user.id, {
        content: parsedMessage.content,
        metadata: parsedMessage.metadata,
      });

      if (!conversation) {
        this.sendError(socket, 'THREAD_NOT_FOUND', 'Thread not found');
        return;
      }

      this.send(socket, {
        type: WsOutgoingEventType.ASSISTANT_MESSAGE,
        thread_id: thread.id,
        content: conversation.output,
        message_id: conversation.messages[conversation.messages.length - 1]?.id,
      });
    } catch (error: unknown) {
      this.logWsError('Supervisor runtime failed', {
        user_id: user.id,
        thread_id: thread.id,
        payload: this.sanitizeUserPayload(parsedMessage),
        error,
      });
      this.sendError(socket, 'RUNTIME_ERROR', 'Supervisor runtime failed');
    }
  }

  private static async resolveSupervisorThread(
    userId: string,
    payload: WsUserMessagePayload,
  ): Promise<{
    thread?: ThreadModel;
    error?: {
      code: 'INVALID_PAYLOAD' | 'THREAD_NOT_FOUND' | 'THREAD_NOT_SUPERVISOR';
      message: string;
    };
  }> {
    const threadId = payload.thread_id?.trim();

    if (threadId) {
      const existingThread = await ThreadRepository.findRuntimeByIdForUser(threadId, userId);

      if (!existingThread) {
        return {
          error: {
            code: 'THREAD_NOT_FOUND',
            message: 'Thread not found',
          },
        };
      }

      if (!existingThread.supervisor_id) {
        return {
          error: {
            code: 'THREAD_NOT_SUPERVISOR',
            message: 'Thread target must be a supervisor',
          },
        };
      }

      return {thread: existingThread};
    }

    const preferredSupervisorId = payload.supervisor_id?.trim();
    const supervisorId = preferredSupervisorId || await this.findDefaultSupervisorId();

    if (!supervisorId) {
      return {
        error: {
          code: 'THREAD_NOT_SUPERVISOR',
          message: 'No supervisor is available to create a thread',
        },
      };
    }

    const createdThread = await ThreadRepository.createForUser(userId, {
      supervisor_id: supervisorId,
    });

    if (!createdThread) {
      return {
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Unable to create a thread for the requested supervisor',
        },
      };
    }

    const runtimeThread = await ThreadRepository.findRuntimeByIdForUser(createdThread.id, userId);

    if (!runtimeThread) {
      return {
        error: {
          code: 'THREAD_NOT_FOUND',
          message: 'Thread not found',
        },
      };
    }

    return {thread: runtimeThread};
  }

  private static async findDefaultSupervisorId(): Promise<string | null> {
    const supervisors = await SupervisorModel.findAll({
      where: {
        enabled: true,
      },
      order: [['createdAt', 'ASC']],
    });

    if (supervisors.length === 0) {
      return null;
    }

    const genericSupervisor = supervisors.find((supervisor) => {
      return supervisor.metadata?.['bootstrap_generic'] === true;
    });

    return (genericSupervisor || supervisors[0]).id;
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

  private static safeParseRawMessage(rawMessage: string): unknown {
    try {
      return JSON.parse(rawMessage);
    } catch {
      return rawMessage;
    }
  }

  private static sanitizeUserPayload(payload: WsUserMessagePayload): Record<string, unknown> {
    return {
      type: payload.type,
      thread_id: payload.thread_id,
      supervisor_id: payload.supervisor_id,
      content_preview: payload.content.slice(0, 300),
      content_length: payload.content.length,
      has_metadata: payload.metadata !== undefined,
    };
  }

  private static logWsError(
    message: string,
    context: {
      user_id?: string;
      thread_id?: string;
      payload?: Record<string, unknown>;
      raw_message?: unknown;
      error: unknown;
    },
  ): void {
    const normalizedError = context.error instanceof Error ? context.error : new Error(String(context.error));

    console.error('[WS_CHAT_ERROR]', {
      message,
      user_id: context.user_id,
      thread_id: context.thread_id,
      payload: context.payload,
      raw_message: context.raw_message,
      error_message: normalizedError.message,
      error_stack: normalizedError.stack,
    });
  }
}
