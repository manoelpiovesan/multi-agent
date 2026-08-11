export interface APIAgentRuntimeInitializeResponse {
  id: string;
  type: 'supervisor' | 'subagent';
  name: string;
  llm_model: {
    id: string;
    name: string;
    model_name: string;
    provider: string;
  };
  tools: string[];
  skills: string[];
  subagents: string[];
}

export interface APIAgentRuntimeInvokeRequest {
  message: string;
}

export interface APIAgentRuntimeMessage {
  role: string;
  content: string;
}

export interface APIAgentRuntimeInvokeResponse extends APIAgentRuntimeInitializeResponse {
  output: string;
  messages: APIAgentRuntimeMessage[];
}
