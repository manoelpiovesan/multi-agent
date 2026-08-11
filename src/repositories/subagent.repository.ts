import {Op} from "sequelize";
import {SubagentModel} from "../models/subagent_model";
import {LlmEngineModel} from "../models/llm_engine_model";
import {ToolModel} from "../models/tool_model";
import {SkillModel} from "../models/skill_model";
import {DefaultSearchParams} from "../types/api/search_types";
import {APISubagent, APISubagentCreate} from "../types/api/subagent_types";

export class SubagentRepository {

  static async findAll(params: DefaultSearchParams): Promise<APISubagent[]> {
    const subagents = await SubagentModel.findAll({
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

    return subagents.map((subagent) => this.toApi(subagent));
  }

  static async findById(id: string): Promise<APISubagent | null> {
    const subagent = await SubagentModel.findByPk(id);

    if (!subagent) {
      return null;
    }

    return this.toApi(subagent);
  }

  static async findRuntimeById(id: string): Promise<SubagentModel | null> {
    return await SubagentModel.findByPk(id, {
      include: [
        {
          model: LlmEngineModel,
        },
        {
          model: ToolModel,
        },
        {
          model: SkillModel,
        },
      ],
    });
  }

  static async create(data: APISubagentCreate): Promise<APISubagent | null> {
    const llmEngine = await LlmEngineModel.findByPk(data.llm_model_id);

    if (!llmEngine) {
      return null;
    }

    const subagent = await SubagentModel.create(data);

    return this.toApi(subagent);
  }

  static async update(id: string, data: Partial<APISubagentCreate>): Promise<APISubagent | null> {
    const subagent = await SubagentModel.findByPk(id);

    if (!subagent) {
      return null;
    }

    if (data.llm_model_id) {
      const llmEngine = await LlmEngineModel.findByPk(data.llm_model_id);

      if (!llmEngine) {
        return null;
      }
    }

    await subagent.update(data);

    return this.toApi(subagent);
  }

  static async delete(id: string): Promise<boolean> {
    const subagent = await SubagentModel.findByPk(id);

    if (!subagent) {
      return false;
    }

    await subagent.destroy();
    return true;
  }

  private static toApi(subagent: SubagentModel): APISubagent {
    return {
      id: subagent.id,
      llm_model_id: subagent.llm_model_id,
      name: subagent.name,
      description: subagent.description,
      system_prompt: subagent.system_prompt,
      enabled: subagent.enabled,
      version: subagent.version,
      metadata: subagent.metadata,
    };
  }
}
