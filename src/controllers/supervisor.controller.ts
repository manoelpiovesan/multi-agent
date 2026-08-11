import {Body, Delete, Get, Path, Post, Put, Queries, Route, Security, Tags} from "tsoa";
import {AbstractController} from "./abstract_controller";
import {UserRole} from "../models/api/user";
import {DefaultSearchParams} from "../types/api/search_types";
import {APISupervisor, APISupervisorCreate} from "../types/api/supervisor_types";
import {SupervisorRepository} from "../repositories/supervisor.repository";
import {APIAgentRuntimeInitializeResponse} from "../types/api/agent_runtime_types";
import {AgentRuntimeService} from "../services/agent_runtime.service";

@Route('supervisors')
@Tags("Supervisors")
@Security("jwt", [UserRole.ADMIN])
export class SupervisorController extends AbstractController<string, APISupervisor, APISupervisorCreate> {

  @Get()
  async getAll(
    @Queries() params: DefaultSearchParams,
  ): Promise<APISupervisor[]> {
    return SupervisorRepository.findAll(params);
  }

  @Get('{id}')
  async getById(
    @Path() id: string,
  ): Promise<APISupervisor> {
    const supervisor = await SupervisorRepository.findById(id);

    if (!supervisor) {
      return Promise.reject({status: 404, message: 'Supervisor not found'});
    }

    return supervisor;
  }

  @Put('{id}')
  async update(
    @Path() id: string,
    @Body() data: Partial<APISupervisorCreate>,
  ): Promise<APISupervisor> {
    this.validatePayload(data, true);

    const supervisor = await SupervisorRepository.update(id, data);

    if (!supervisor) {
      return Promise.reject({status: 404, message: 'Supervisor or LLM engine not found'});
    }

    return supervisor;
  }

  @Post()
  async create(
    @Body() data: APISupervisorCreate,
  ): Promise<APISupervisor> {
    this.validatePayload(data);

    const supervisor = await SupervisorRepository.create(data);

    if (!supervisor) {
      return Promise.reject({status: 400, message: 'Invalid LLM engine'});
    }

    this.setStatus(201);
    return supervisor;
  }

  @Delete('{id}')
  async delete(
    @Path() id: string,
  ): Promise<void> {
    const deleted = await SupervisorRepository.delete(id);

    if (!deleted) {
      return Promise.reject({status: 404, message: 'Supervisor not found'});
    }

    this.setStatus(204);
  }

  @Post('{id}/initialize')
  async initialize(
    @Path() id: string,
  ): Promise<APIAgentRuntimeInitializeResponse> {
    const runtime = await AgentRuntimeService.initializeSupervisor(id);

    if (!runtime) {
      return Promise.reject({status: 404, message: 'Supervisor not found'});
    }

    return runtime;
  }

  private validatePayload(data: Partial<APISupervisorCreate>, allowPartial = false): void {
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
