import {Op} from "sequelize";
import {SupervisorModel} from "../models/supervisor_model";
import {LlmEngineModel} from "../models/llm_engine_model";
import {SubagentModel} from "../models/subagent_model";
import {ToolModel} from "../models/tool_model";
import {SkillModel} from "../models/skill_model";
import {DefaultSearchParams} from "../types/api/search_types";
import {APISupervisor, APISupervisorCreate} from "../types/api/supervisor_types";

export class SupervisorRepository {

  static async findAll(params: DefaultSearchParams): Promise<APISupervisor[]> {
    const supervisors = await SupervisorModel.findAll({
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

    return supervisors.map((supervisor) => this.toApi(supervisor));
  }

  static async findById(id: string): Promise<APISupervisor | null> {
    const supervisor = await SupervisorModel.findByPk(id);

    if (!supervisor) {
      return null;
    }

    return this.toApi(supervisor);
  }

  static async findRuntimeById(id: string): Promise<SupervisorModel | null> {
    return await SupervisorModel.findByPk(id, {
      include: [
        {
          model: LlmEngineModel,
        },
        {
          model: SubagentModel,
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
        },
      ],
    });
  }

  static async create(data: APISupervisorCreate): Promise<APISupervisor | null> {
    const llmEngine = await LlmEngineModel.findByPk(data.llm_model_id);

    if (!llmEngine) {
      return null;
    }

    const supervisor = await SupervisorModel.create(data);

    return this.toApi(supervisor);
  }

  static async update(id: string, data: Partial<APISupervisorCreate>): Promise<APISupervisor | null> {
    const supervisor = await SupervisorModel.findByPk(id);

    if (!supervisor) {
      return null;
    }

    if (data.llm_model_id) {
      const llmEngine = await LlmEngineModel.findByPk(data.llm_model_id);

      if (!llmEngine) {
        return null;
      }
    }

    await supervisor.update(data);

    return this.toApi(supervisor);
  }

  static async delete(id: string): Promise<boolean> {
    const supervisor = await SupervisorModel.findByPk(id);

    if (!supervisor) {
      return false;
    }

    await supervisor.destroy();
    return true;
  }

  private static toApi(supervisor: SupervisorModel): APISupervisor {
    return {
      id: supervisor.id,
      llm_model_id: supervisor.llm_model_id,
      name: supervisor.name,
      description: supervisor.description,
      system_prompt: supervisor.system_prompt,
      enabled: supervisor.enabled,
      version: supervisor.version,
      metadata: supervisor.metadata,
    };
  }
}
