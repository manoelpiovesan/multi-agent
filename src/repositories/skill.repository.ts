import {Op} from "sequelize";
import {SkillModel} from "../models/skill_model";
import {DefaultSearchParams} from "../types/api/search_types";
import {APISkill, APISkillCreate} from "../types/api/skill_types";

export class SkillRepository {

  static async findAll(params: DefaultSearchParams): Promise<APISkill[]> {
    const skills = await SkillModel.findAll({
      where: params.search ? {
        name: {
          [Op.iLike]: `%${params.search}%`
        }
      } : {},
      limit: params.size && params.size > 0 ? params.size : 10,
      offset: params.page && params.page > 0 ? (params.page - 1) *
        (params.size && params.size > 0 ? params.size : 10) : 0,
      order: [['name', 'ASC']],
    });

    return skills.map((skill) => this.toApi(skill));
  }

  static async findById(id: string): Promise<APISkill | null> {
    const skill = await SkillModel.findByPk(id);

    if (!skill) {
      return null;
    }

    return this.toApi(skill);
  }

  static async create(data: APISkillCreate): Promise<APISkill> {
    const skill = await SkillModel.create(data);

    return this.toApi(skill);
  }

  static async update(id: string, data: Partial<APISkillCreate>): Promise<APISkill | null> {
    const skill = await SkillModel.findByPk(id);

    if (!skill) {
      return null;
    }

    await skill.update(data);

    return this.toApi(skill);
  }

  static async delete(id: string): Promise<boolean> {
    const skill = await SkillModel.findByPk(id);

    if (!skill) {
      return false;
    }

    await skill.destroy();
    return true;
  }

  private static toApi(skill: SkillModel): APISkill {
    return {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      instructions: skill.instructions,
      enabled: skill.enabled,
      version: skill.version,
      metadata: skill.metadata,
    };
  }
}
