export interface APISubagent {
  id: string;
  llm_model_id: string;
  name: string;
  description?: string;
  system_prompt: string;
  enabled?: boolean;
  version?: number;
  metadata?: Record<string, unknown>;
}

export interface APISubagentCreate {
  llm_model_id: string;
  name: string;
  description?: string;
  system_prompt: string;
  enabled?: boolean;
  version?: number;
  metadata?: Record<string, unknown>;
}
