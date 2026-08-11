export interface APISupervisor {
  id: string;
  llm_model_id: string;
  name: string;
  description?: string;
  system_prompt: string;
  enabled?: boolean;
  version?: number;
  metadata?: Record<string, unknown>;
}

export interface APISupervisorCreate {
  llm_model_id: string;
  name: string;
  description?: string;
  system_prompt: string;
  enabled?: boolean;
  version?: number;
  metadata?: Record<string, unknown>;
}
