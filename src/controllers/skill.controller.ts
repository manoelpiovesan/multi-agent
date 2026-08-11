import {Body, Controller, Delete, Get, Path, Post, Put, Queries, Route, Security, Tags} from "tsoa";
import {AbstractController} from "./abstract_controller";
import {DefaultSearchParams} from "../types/api/search_types";
import {APISkill, APISkillCreate} from "../types/api/skill_types";
import {SkillRepository} from "../repositories/skill.repository";

@Route('skills')
@Tags("Skills")
@Security("jwt", ["admin"])
export class SkillController extends AbstractController<string, APISkill, APISkillCreate> {

  @Get()
  async getAll(
    @Queries() params: DefaultSearchParams,
  ): Promise<APISkill[]> {
    return SkillRepository.findAll(params);
  }

  @Get('{id}')
  async getById(
    @Path() id: string,
  ): Promise<APISkill> {
    const skill = await SkillRepository.findById(id);

    if (!skill) {
      return Promise.reject({status: 404, message: 'Skill not found'});
    }

    return skill;
  }

  @Put('{id}')
  async update(
    @Path() id: string,
    @Body() data: Partial<APISkillCreate>,
  ): Promise<APISkill> {
    this.validatePayload(data, true);

    const skill = await SkillRepository.update(id, data);

    if (!skill) {
      return Promise.reject({status: 404, message: 'Skill not found'});
    }

    return skill;
  }

  @Post()
  async create(
    @Body() data: APISkillCreate,
  ): Promise<APISkill> {
    this.validatePayload(data);
    this.setStatus(201);

    return SkillRepository.create(data);
  }

  @Delete('{id}')
  async delete(
    @Path() id: string,
  ): Promise<void> {
    const deleted = await SkillRepository.delete(id);

    if (!deleted) {
      return Promise.reject({status: 404, message: 'Skill not found'});
    }

    this.setStatus(204);
  }

  private validatePayload(data: Partial<APISkillCreate>, allowPartial = false): void {
    if (!allowPartial || data.name !== undefined) {
      if (!data.name?.trim()) {
        throw {status: 400, message: 'Name is required'};
      }
    }

    if (!allowPartial || data.instructions !== undefined) {
      if (!data.instructions?.trim()) {
        throw {status: 400, message: 'Instructions are required'};
      }
    }
  }
}
