import {SupervisorModel} from "../models/supervisor_model";
import {SubagentModel} from "../models/subagent_model";
import {SkillModel} from "../models/skill_model";
import {ToolModel} from "../models/tool_model";
import {LlmEngineModel} from "../models/llm_engine_model";
import {SupervisorSubagentModel} from "../models/relational/supervisor_subagent_model";
import {SubagentSkillModel} from "../models/relational/subagent_skill_model";
import {SubagentToolModel} from "../models/relational/subagent_tool_model";
import {SkillToolModel} from "../models/relational/skill_tool_model";
import {APITopologyResponse, TopologyNode} from "../types/api/topology_types";

export class TopologyRepository {

  static async findFullTopology(): Promise<APITopologyResponse> {
    const llmEngines = await LlmEngineModel.findAll();
    const supervisors = await SupervisorModel.findAll();
    const subagents = await SubagentModel.findAll();
    const skills = await SkillModel.findAll();
    const tools = await ToolModel.findAll();
    const supervisorSubagents = await SupervisorSubagentModel.findAll();
    const subagentSkills = await SubagentSkillModel.findAll();
    const subagentTools = await SubagentToolModel.findAll();
    const skillTools = await SkillToolModel.findAll();

    const nodes: TopologyNode[] = [
      ...llmEngines.map((llmEngine) => ({
        id: llmEngine.id,
        type: 'llm_engine',
      })),
      ...supervisors.map((supervisor) => ({
        id: supervisor.id,
        type: 'supervisor',
      })),
      ...subagents.map((subagent) => ({
        id: subagent.id,
        type: 'subagent',
      })),
      ...skills.map((skill) => ({
        id: skill.id,
        type: 'skill',
      })),
      ...tools.map((tool) => ({
        id: tool.id,
        type: this.resolveToolNodeType(tool.type),
      })),
    ];

    const edges = [
      ...supervisors.map((supervisor) => ({
        source: supervisor.llm_model_id,
        target: supervisor.id,
        type: 'llm_to_supervisor',
      })),
      ...subagents.map((subagent) => ({
        source: subagent.llm_model_id,
        target: subagent.id,
        type: 'llm_to_subagent',
      })),
      ...supervisorSubagents.map((link) => ({
        source: link.supervisor_id,
        target: link.subagent_id,
        type: 'supervisor_to_subagent',
      })),
      ...subagentSkills.map((link) => ({
        source: link.subagent_id,
        target: link.skill_id,
        type: 'subagent_to_skill',
      })),
      ...subagentTools.map((link) => ({
        source: link.subagent_id,
        target: link.tool_id,
        type: 'subagent_to_tool',
      })),
      ...skillTools.map((link) => ({
        source: link.skill_id,
        target: link.tool_id,
        type: 'skill_to_tool',
      })),
    ];

    return {nodes, edges};
  }

  private static resolveToolNodeType(toolType: string): string {
    const normalizedType = toolType.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

    if (!normalizedType) {
      return 'tool';
    }

    return normalizedType.endsWith('_tool') ? normalizedType : `${normalizedType}_tool`;
  }
}
