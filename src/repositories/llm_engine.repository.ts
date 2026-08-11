import {Op} from "sequelize";
import {LlmEngineModel} from "../models/llm_engine_model";
import {DefaultSearchParams} from "../types/api/search_types";
import {APILlmEngine, APILlmEngineCreate} from "../types/api/llm_engine_types";

export class LlmEngineRepository {

  static async findAll(params: DefaultSearchParams): Promise<APILlmEngine[]> {
    const models = await LlmEngineModel.findAll({
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

    return models.map((model) => this.toApi(model));
  }

  static async findById(id: string): Promise<APILlmEngine | null> {
    const model = await LlmEngineModel.findByPk(id);

    if (!model) {
      return null;
    }

    return this.toApi(model);
  }

  static async create(data: APILlmEngineCreate): Promise<APILlmEngine> {
    const model = await LlmEngineModel.create(data);

    return this.toApi(model);
  }

  static async update(id: string, data: Partial<APILlmEngineCreate>): Promise<APILlmEngine | null> {
    const model = await LlmEngineModel.findByPk(id);

    if (!model) {
      return null;
    }

    await model.update(data);

    return this.toApi(model);
  }

  static async delete(id: string): Promise<boolean> {
    const model = await LlmEngineModel.findByPk(id);

    if (!model) {
      return false;
    }

    await model.destroy();
    return true;
  }

  private static toApi(model: LlmEngineModel): APILlmEngine {
    return {
      id: model.id,
      name: model.name,
      model_name: model.model_name,
      provider: model.provider,
      api_base_url: model.api_base_url,
      enabled: model.enabled,
      config: model.config,
      metadata: model.metadata,
    };
  }
}
