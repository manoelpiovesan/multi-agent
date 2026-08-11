import {Op} from "sequelize";
import {ToolModel} from "../models/tool_model";
import {DefaultSearchParams} from "../types/api/search_types";
import {APITool, APIToolCreate} from "../types/api/tool_types";

export class ToolRepository {

  static async findAll(params: DefaultSearchParams): Promise<APITool[]> {
    const tools = await ToolModel.findAll({
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

    return tools.map((tool) => this.toApi(tool));
  }

  static async findById(id: string): Promise<APITool | null> {
    const tool = await ToolModel.findByPk(id);

    if (!tool) {
      return null;
    }

    return this.toApi(tool);
  }

  static async create(data: APIToolCreate): Promise<APITool> {
    const tool = await ToolModel.create(data);

    return this.toApi(tool);
  }

  static async update(id: string, data: Partial<APIToolCreate>): Promise<APITool | null> {
    const tool = await ToolModel.findByPk(id);

    if (!tool) {
      return null;
    }

    await tool.update(data);

    return this.toApi(tool);
  }

  static async delete(id: string): Promise<boolean> {
    const tool = await ToolModel.findByPk(id);

    if (!tool) {
      return false;
    }

    await tool.destroy();
    return true;
  }

  private static toApi(tool: ToolModel): APITool {
    return {
      id: tool.id,
      name: tool.name,
      description: tool.description,
      type: tool.type,
      enabled: tool.enabled,
      version: tool.version,
      config: tool.config,
      metadata: tool.metadata,
    };
  }
}
