import {APIMessage} from "./message_types";

export enum ThreadTargetType {
  SUPERVISOR = 'supervisor',
  SUBAGENT = 'subagent',
}

export interface APIThread {
  id: string;
  user_id: string;
  title?: string;
  supervisor_id?: string;
  subagent_id?: string;
  target_type: ThreadTargetType;
  metadata?: Record<string, unknown>;
}

export interface APIThreadDetail extends APIThread {
  messages: APIMessage[];
}

export interface APIThreadCreate {
  title?: string;
  supervisor_id?: string;
  subagent_id?: string;
  metadata?: Record<string, unknown>;
}

export interface APIThreadConversationResponse extends APIThreadDetail {
  output: string;
}
