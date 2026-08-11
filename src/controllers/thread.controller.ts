import {Body, Controller, Delete, Get, Path, Post, Queries, Request, Route, Security, Tags} from "tsoa";
import {DefaultSearchParams} from "../types/api/search_types";
import {APIThread, APIThreadConversationResponse, APIThreadCreate, APIThreadDetail} from "../types/api/thread_types";
import {ThreadRepository} from "../repositories/thread.repository";
import {APIMessageCreate} from "../types/api/message_types";
import {AgentRuntimeService} from "../services/agent_runtime.service";

@Route('threads')
@Tags("Threads")
@Security("jwt")
export class ThreadController extends Controller {

  @Get()
  async getAll(
    @Request() request: Express.Request,
    @Queries() params: DefaultSearchParams,
  ): Promise<APIThread[]> {
    return ThreadRepository.findAllByUser(request.jwt_user!.id, params);
  }

  @Get('{id}')
  async getById(
    @Request() request: Express.Request,
    @Path() id: string,
  ): Promise<APIThreadDetail> {
    const thread = await ThreadRepository.findByIdForUser(id, request.jwt_user!.id);

    if (!thread) {
      return Promise.reject({status: 404, message: 'Thread not found'});
    }

    return thread;
  }

  @Post()
  async create(
    @Request() request: Express.Request,
    @Body() data: APIThreadCreate,
  ): Promise<APIThread> {
    this.validateCreatePayload(data);

    const thread = await ThreadRepository.createForUser(request.jwt_user!.id, data);

    if (!thread) {
      return Promise.reject({status: 400, message: 'Invalid supervisor or subagent target'});
    }

    this.setStatus(201);
    return thread;
  }

  @Post('{id}/messages')
  async sendMessage(
    @Request() request: Express.Request,
    @Path() id: string,
    @Body() payload: APIMessageCreate,
  ): Promise<APIThreadConversationResponse> {
    if (!payload.content?.trim()) {
      return Promise.reject({status: 400, message: 'Message content is required'});
    }

    const thread = await AgentRuntimeService.invokeThread(id, request.jwt_user!.id, payload);

    if (!thread) {
      return Promise.reject({status: 404, message: 'Thread not found'});
    }

    return thread;
  }

  @Delete('{id}')
  async delete(
    @Request() request: Express.Request,
    @Path() id: string,
  ): Promise<void> {
    const deleted = await ThreadRepository.deleteForUser(id, request.jwt_user!.id);

    if (!deleted) {
      return Promise.reject({status: 404, message: 'Thread not found'});
    }

    this.setStatus(204);
  }

  private validateCreatePayload(data: APIThreadCreate): void {
    const hasSupervisor = Boolean(data.supervisor_id?.trim());
    const hasSubagent = Boolean(data.subagent_id?.trim());

    if (hasSupervisor === hasSubagent) {
      throw {status: 400, message: 'Provide exactly one target: supervisor_id or subagent_id'};
    }
  }
}
