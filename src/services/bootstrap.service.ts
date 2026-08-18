import {LlmEngineModel} from "../models/llm_engine_model";
import {SupervisorModel} from "../models/supervisor_model";
import {SubagentModel} from "../models/subagent_model";
import {SupervisorSubagentModel} from "../models/relational/supervisor_subagent_model";

const GENERIC_SUBAGENTS = [
  {
    key: 'generic_researcher',
    name: 'Generic Researcher',
    description: 'General-purpose subagent for factual lookup and analysis.',
    systemPrompt: 'You are a research-focused subagent. Break tasks into steps and provide concise findings.',
  },
  {
    key: 'generic_executor',
    name: 'Generic Executor',
    description: 'General-purpose subagent for execution planning and practical outputs.',
    systemPrompt: 'You are an execution-focused subagent. Produce practical, actionable outputs with clear steps.',
  },
];

export class BootstrapService {

  static async ensureGenericSupervisor(): Promise<void> {
    const llmEngine = await this.ensureDefaultLlmEngine();

    if (!llmEngine) {
      console.warn('[WARN] No enabled LLM engine found. Skipping generic supervisor bootstrap.');
      return;
    }

    const supervisor = await this.ensureBootstrapSupervisor(llmEngine);
    await this.ensureGenericSubagents(supervisor, llmEngine);
  }

  private static async ensureBootstrapSupervisor(llmEngine: LlmEngineModel): Promise<SupervisorModel> {
    const supervisors = await SupervisorModel.findAll({
      order: [['createdAt', 'ASC']],
    });

    const genericSupervisor = supervisors.find((supervisor) => {
      return supervisor.metadata?.['bootstrap_generic'] === true;
    });

    if (genericSupervisor) {
      if (!genericSupervisor.enabled) {
        await genericSupervisor.update({enabled: true});
      }

      return genericSupervisor;
    }

    const createdSupervisor = await SupervisorModel.create({
      llm_model_id: llmEngine.id,
      name: 'Generic Supervisor',
      description: 'Auto-created default supervisor for websocket chat bootstrap',
      system_prompt: 'You are a helpful supervisor. Delegate when useful and answer clearly and safely.',
      enabled: true,
      metadata: {
        bootstrap_generic: true,
      },
    });

    console.log('[INFO] Generic supervisor created during bootstrap');
    return createdSupervisor;
  }

  private static async ensureGenericSubagents(supervisor: SupervisorModel, llmEngine: LlmEngineModel): Promise<void> {
    const existingSubagents = await SubagentModel.findAll();

    for (const definition of GENERIC_SUBAGENTS) {
      let subagent = existingSubagents.find((candidate) => {
        return candidate.metadata?.['bootstrap_generic_key'] === definition.key;
      });

      if (!subagent) {
        subagent = await SubagentModel.create({
          llm_model_id: llmEngine.id,
          name: definition.name,
          description: definition.description,
          system_prompt: definition.systemPrompt,
          enabled: true,
          metadata: {
            bootstrap_generic: true,
            bootstrap_generic_key: definition.key,
          },
        });

        console.log(`[INFO] Generic subagent created during bootstrap: ${definition.name}`);
      } else if (!subagent.enabled) {
        await subagent.update({enabled: true});
      }

      await SupervisorSubagentModel.findOrCreate({
        where: {
          supervisor_id: supervisor.id,
          subagent_id: subagent.id,
        },
        defaults: {
          supervisor_id: supervisor.id,
          subagent_id: subagent.id,
        },
      });
    }
  }

  private static async ensureDefaultLlmEngine(): Promise<LlmEngineModel | null> {
    const enabledEngine = await LlmEngineModel.findOne({
      where: {
        enabled: true,
      },
      order: [['createdAt', 'ASC']],
    });

    if (enabledEngine) {
      return enabledEngine;
    }

    const defaultModelName = process.env.DEFAULT_BOOTSTRAP_LLM_MODEL || 'gpt-4o-mini';
    const defaultEngine = await LlmEngineModel.findOne({
      where: {
        provider: 'openai',
        model_name: defaultModelName,
      },
    });

    if (defaultEngine) {
      if (!defaultEngine.enabled) {
        await defaultEngine.update({enabled: true});
      }

      return defaultEngine;
    }

    const createdEngine = await LlmEngineModel.create({
      name: 'Default GPT (cheap)',
      provider: 'openai',
      model_name: defaultModelName,
      enabled: true,
      config: {
        api_key_env: process.env.DEFAULT_BOOTSTRAP_LLM_API_KEY_ENV || 'OPENAI_API_KEY',
        temperature: 0.2,
      },
      metadata: {
        bootstrap_default: true,
      },
    });

    console.log(`[INFO] Default LLM engine created during bootstrap: ${createdEngine.model_name}`);
    return createdEngine;
  }
}
