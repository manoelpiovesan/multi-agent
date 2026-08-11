export interface APILlmEngine {
  id: string;
  name: string;
  model_name: string;
  provider: string;
  api_base_url?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface APILlmEngineCreate {
  name: string;
  model_name: string;
  provider: string;
  api_base_url?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
