import {Body, Delete, Get, Path, Post, Put, Queries, Route, Security, Tags} from "tsoa";
import {AbstractController} from "./abstract_controller";
import {UserRole} from "../models/api/user";
import {DefaultSearchParams} from "../types/api/search_types";
import {APISubagent, APISubagentCreate} from "../types/api/subagent_types";
import {SubagentRepository} from "../repositories/subagent.repository";

@Route('subagents')
@Tags("Subagents")
@Security("jwt", [UserRole.ADMIN])
export class SubagentController extends AbstractController<string, APISubagent, APISubagentCreate> {

  @Get()
  async getAll(
    @Queries() params: DefaultSearchParams,
  ): Promise<APISubagent[]> {
    return SubagentRepository.findAll(params);
  }

  @Get('{id}')
  async getById(
    @Path() id: string,
  ): Promise<APISubagent> {
    const subagent = await SubagentRepository.findById(id);

    if (!subagent) {
      return Promise.reject({status: 404, message: 'Subagent not found'});
    }

    return subagent;
  }

  @Put('{id}')
  async update(
    @Path() id: string,
    @Body() data: Partial<APISubagentCreate>,
  ): Promise<APISubagent> {
    this.validatePayload(data, true);

    const subagent = await SubagentRepository.update(id, data);

    if (!subagent) {
      return Promise.reject({status: 404, message: 'Subagent or LLM engine not found'});
    }

    return subagent;
  }

  @Post()
  async create(
    @Body() data: APISubagentCreate,
  ): Promise<APISubagent> {
    this.validatePayload(data);

    const subagent = await SubagentRepository.create(data);

    if (!subagent) {
      return Promise.reject({status: 400, message: 'Invalid LLM engine'});
    }

    this.setStatus(201);
    return subagent;
  }

  @Delete('{id}')
  async delete(
    @Path() id: string,
  ): Promise<void> {
    const deleted = await SubagentRepository.delete(id);

    if (!deleted) {
      return Promise.reject({status: 404, message: 'Subagent not found'});
    }

    this.setStatus(204);
  }

  private validatePayload(data: Partial<APISubagentCreate>, allowPartial = false): void {
    if (!allowPartial || data.llm_model_id !== undefined) {
      if (!data.llm_model_id?.trim()) {
        throw {status: 400, message: 'LLM model is required'};
      }
    }

    if (!allowPartial || data.name !== undefined) {
      if (!data.name?.trim()) {
        throw {status: 400, message: 'Name is required'};
      }
    }

    if (!allowPartial || data.system_prompt !== undefined) {
      if (!data.system_prompt?.trim()) {
        throw {status: 400, message: 'System prompt is required'};
      }
    }
  }
}
