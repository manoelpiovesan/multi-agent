import {Op} from "sequelize";
import {ThreadModel} from "../models/thread_model";
import {SupervisorModel} from "../models/supervisor_model";
import {SubagentModel} from "../models/subagent_model";
import {DefaultSearchParams} from "../types/api/search_types";
import {APIThread, APIThreadCreate, APIThreadDetail, ThreadTargetType} from "../types/api/thread_types";
import {MessageRepository} from "./message.repository";

export class ThreadRepository {

  static async findAllByUser(user_id: string, params: DefaultSearchParams): Promise<APIThread[]> {
    const threads = await ThreadModel.findAll({
      where: {
        user_id,
        ...(params.search ? {
          title: {
            [Op.iLike]: `%${params.search}%`
          },
        } : {}),
      },
      limit: params.size && params.size > 0 ? params.size : 10,
      offset: params.page && params.page > 0 ? (params.page - 1) *
        (params.size && params.size > 0 ? params.size : 10) : 0,
      order: [['createdAt', 'DESC']],
    });

    return threads.map((thread) => this.toApi(thread));
  }

  static async findByIdForUser(id: string, user_id: string): Promise<APIThreadDetail | null> {
    const thread = await ThreadModel.findOne({
      where: {id, user_id},
    });

    if (!thread) {
      return null;
    }

    return {
      ...this.toApi(thread),
      messages: await MessageRepository.findAllByThread(thread.id),
    };
  }

  static async findRuntimeByIdForUser(id: string, user_id: string): Promise<ThreadModel | null> {
    return await ThreadModel.findOne({
      where: {id, user_id},
    });
  }

  static async createForUser(user_id: string, data: APIThreadCreate): Promise<APIThread | null> {
    const targetType = this.resolveTargetType(data);

    if (!targetType) {
      return null;
    }

    if (targetType === ThreadTargetType.SUPERVISOR) {
      const supervisor = await SupervisorModel.findByPk(data.supervisor_id!);

      if (!supervisor) {
        return null;
      }
    }

    if (targetType === ThreadTargetType.SUBAGENT) {
      const subagent = await SubagentModel.findByPk(data.subagent_id!);

      if (!subagent) {
        return null;
      }
    }

    const thread = await ThreadModel.create({
      user_id,
      title: data.title?.trim(),
      supervisor_id: targetType === ThreadTargetType.SUPERVISOR ? data.supervisor_id!.trim() : null,
      subagent_id: targetType === ThreadTargetType.SUBAGENT ? data.subagent_id!.trim() : null,
      metadata: data.metadata,
    });

    return this.toApi(thread);
  }

  static async deleteForUser(id: string, user_id: string): Promise<boolean> {
    const thread = await ThreadModel.findOne({
      where: {id, user_id},
    });

    if (!thread) {
      return false;
    }

    await thread.destroy();
    return true;
  }

  static getTargetType(thread: Pick<ThreadModel, 'supervisor_id' | 'subagent_id'>): ThreadTargetType {
    return thread.supervisor_id ? ThreadTargetType.SUPERVISOR : ThreadTargetType.SUBAGENT;
  }

  private static resolveTargetType(data: APIThreadCreate): ThreadTargetType | null {
    const hasSupervisor = Boolean(data.supervisor_id?.trim());
    const hasSubagent = Boolean(data.subagent_id?.trim());

    if (hasSupervisor === hasSubagent) {
      return null;
    }

    return hasSupervisor ? ThreadTargetType.SUPERVISOR : ThreadTargetType.SUBAGENT;
  }

  private static toApi(thread: ThreadModel): APIThread {
    return {
      id: thread.id,
      user_id: thread.user_id,
      title: thread.title,
      supervisor_id: thread.supervisor_id || undefined,
      subagent_id: thread.subagent_id || undefined,
      target_type: this.getTargetType(thread),
      metadata: thread.metadata,
    };
  }
}
