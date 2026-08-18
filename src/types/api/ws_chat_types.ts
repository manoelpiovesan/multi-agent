export enum WsIncomingEventType {
  USER_MESSAGE = 'user_message',
}

export enum WsOutgoingEventType {
  CONNECTED = 'connected',
  PROCESSING = 'processing',
  ASSISTANT_MESSAGE = 'assistant_message',
  ERROR = 'error',
}

export interface WsUserMessagePayload {
  type: WsIncomingEventType.USER_MESSAGE;
  thread_id: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export type WsIncomingEvent = WsUserMessagePayload;

export interface WsConnectedEvent {
  type: WsOutgoingEventType.CONNECTED;
  user_id: string;
}

export interface WsProcessingEvent {
  type: WsOutgoingEventType.PROCESSING;
  thread_id: string;
}

export interface WsAssistantMessageEvent {
  type: WsOutgoingEventType.ASSISTANT_MESSAGE;
  thread_id: string;
  content: string;
  message_id?: string;
}

export interface WsErrorEvent {
  type: WsOutgoingEventType.ERROR;
  code: 'INVALID_JSON' | 'INVALID_PAYLOAD' | 'THREAD_NOT_FOUND' | 'THREAD_NOT_SUPERVISOR' | 'RUNTIME_ERROR';
  message: string;
}

export type WsOutgoingEvent =
  | WsConnectedEvent
  | WsProcessingEvent
  | WsAssistantMessageEvent
  | WsErrorEvent;

