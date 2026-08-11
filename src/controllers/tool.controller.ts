import {Body, Controller, Delete, Get, Path, Post, Put, Queries, Route, Security, Tags} from "tsoa";
import {AbstractController} from "./abstract_controller";
import {UserRole} from "../models/api/user";
import {DefaultSearchParams} from "../types/api/search_types";
import {APITool, APIToolCreate} from "../types/api/tool_types";
import {ToolRepository} from "../repositories/tool.repository";

@Route('tools')
@Tags("Tools")
@Security("jwt", [UserRole.ADMIN])
export class ToolController extends AbstractController<string, APITool, APIToolCreate> {

  @Get()
  async getAll(
    @Queries() params: DefaultSearchParams,
  ): Promise<APITool[]> {
    return ToolRepository.findAll(params);
  }

  @Get('{id}')
  async getById(
    @Path() id: string,
  ): Promise<APITool> {
    const tool = await ToolRepository.findById(id);

    if (!tool) {
      return Promise.reject({status: 404, message: 'Tool not found'});
    }

    return tool;
  }

  @Put('{id}')
  async update(
    @Path() id: string,
    @Body() data: Partial<APIToolCreate>,
  ): Promise<APITool> {
    this.validatePayload(data, true);

    const tool = await ToolRepository.update(id, data);

    if (!tool) {
      return Promise.reject({status: 404, message: 'Tool not found'});
    }

    return tool;
  }

  @Post()
  async create(
    @Body() data: APIToolCreate,
  ): Promise<APITool> {
    this.validatePayload(data);
    this.setStatus(201);

    return ToolRepository.create(data);
  }

  @Delete('{id}')
  async delete(
    @Path() id: string,
  ): Promise<void> {
    const deleted = await ToolRepository.delete(id);

    if (!deleted) {
      return Promise.reject({status: 404, message: 'Tool not found'});
    }

    this.setStatus(204);
  }

  private validatePayload(data: Partial<APIToolCreate>, allowPartial = false): void {
    if (!allowPartial || data.name !== undefined) {
      if (!data.name?.trim()) {
        throw {status: 400, message: 'Name is required'};
      }
    }

    if (!allowPartial || data.type !== undefined) {
      if (!data.type?.trim()) {
        throw {status: 400, message: 'Type is required'};
      }
    }
  }
}
