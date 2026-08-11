import {MessageModel, MessageRole} from "../models/message_model";
import {APIMessage} from "../types/api/message_types";

export class MessageRepository {

  static async findAllByThread(thread_id: string): Promise<APIMessage[]> {
    const messages = await MessageModel.findAll({
      where: {thread_id},
      order: [['createdAt', 'ASC']],
    });

    return messages.map((message) => this.toApi(message));
  }

  static async create(
    thread_id: string,
    role: MessageRole,
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<APIMessage> {
    const message = await MessageModel.create({
      thread_id,
      role,
      content,
      metadata,
    });

    return this.toApi(message);
  }

  private static toApi(message: MessageModel): APIMessage {
    return {
      id: message.id,
      thread_id: message.thread_id,
      role: message.role,
      content: message.content,
      metadata: message.metadata,
    };
  }
}
