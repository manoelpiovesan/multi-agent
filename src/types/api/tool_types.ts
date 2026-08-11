export interface APITool {
  id: string;
  name: string;
  description?: string;
  type: string;
  enabled?: boolean;
  version?: number;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface APIToolCreate {
  name: string;
  description?: string;
  type: string;
  enabled?: boolean;
  version?: number;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
