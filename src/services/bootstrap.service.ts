import {LlmEngineModel} from "../models/llm_engine_model";
import {SupervisorModel} from "../models/supervisor_model";

export class BootstrapService {

  static async ensureGenericSupervisor(): Promise<void> {
    const llmEngine = await this.ensureDefaultLlmEngine();
    const supervisorCount = await SupervisorModel.count();

    if (supervisorCount > 0) {
      return;
    }

    if (!llmEngine) {
      console.warn('[WARN] No enabled LLM engine found. Skipping generic supervisor bootstrap.');
      return;
    }

    await SupervisorModel.create({
      llm_model_id: llmEngine.id,
      name: 'Generic Supervisor',
      description: 'Auto-created default supervisor for websocket chat bootstrap',
      system_prompt: 'You are a helpful supervisor. Answer clearly and safely.',
      enabled: true,
      metadata: {
        bootstrap_generic: true,
      },
    });

    console.log('[INFO] Generic supervisor created during bootstrap');
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
