import {Body, Controller, Delete, Get, Path, Post, Put, Queries, Route, Security, Tags} from "tsoa";
import {AbstractController} from "./abstract_controller";
import {DefaultSearchParams} from "../types/api/search_types";
import {APILlmEngine, APILlmEngineCreate} from "../types/api/llm_engine_types";
import {LlmEngineRepository} from "../repositories/llm_engine.repository";

@Route('llm-engines')
@Tags("LlmEngines")
@Security("jwt", ["admin"])
export class LlmEngineController extends AbstractController<string, APILlmEngine, APILlmEngineCreate> {

  @Get()
  async getAll(
    @Queries() params: DefaultSearchParams,
  ): Promise<APILlmEngine[]> {
    return LlmEngineRepository.findAll(params);
  }

  @Get('{id}')
  async getById(
    @Path() id: string,
  ): Promise<APILlmEngine> {
    const llmEngine = await LlmEngineRepository.findById(id);

    if (!llmEngine) {
      return Promise.reject({status: 404, message: 'LLM engine not found'});
    }

    return llmEngine;
  }

  @Put('{id}')
  async update(
    @Path() id: string,
    @Body() data: Partial<APILlmEngineCreate>,
  ): Promise<APILlmEngine> {
    this.validatePayload(data, true);

    const llmEngine = await LlmEngineRepository.update(id, data);

    if (!llmEngine) {
      return Promise.reject({status: 404, message: 'LLM engine not found'});
    }

    return llmEngine;
  }

  @Post()
  async create(
    @Body() data: APILlmEngineCreate,
  ): Promise<APILlmEngine> {
    this.validatePayload(data);
    this.setStatus(201);

    return LlmEngineRepository.create(data);
  }

  @Delete('{id}')
  async delete(
    @Path() id: string,
  ): Promise<void> {
    const deleted = await LlmEngineRepository.delete(id);

    if (!deleted) {
      return Promise.reject({status: 404, message: 'LLM engine not found'});
    }

    this.setStatus(204);
  }

  private validatePayload(data: Partial<APILlmEngineCreate>, allowPartial = false): void {
    if (!allowPartial || data.name !== undefined) {
      if (!data.name?.trim()) {
        throw {status: 400, message: 'Name is required'};
      }
    }

    if (!allowPartial || data.model_name !== undefined) {
      if (!data.model_name?.trim()) {
        throw {status: 400, message: 'Model name is required'};
      }
    }

    if (!allowPartial || data.provider !== undefined) {
      if (!data.provider?.trim()) {
        throw {status: 400, message: 'Provider is required'};
      }
    }
  }
}
