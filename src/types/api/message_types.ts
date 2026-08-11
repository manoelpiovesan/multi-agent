import {MessageRole} from "../../models/message_model";

export interface APIMessage {
  id: string;
  thread_id: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface APIMessageCreate {
  content: string;
  metadata?: Record<string, unknown>;
}
