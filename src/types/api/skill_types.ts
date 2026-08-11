export interface APISkill {
  id: string;
  name: string;
  description?: string;
  instructions: string;
  enabled?: boolean;
  version?: number;
  metadata?: Record<string, unknown>;
}

export interface APISkillCreate {
  name: string;
  description?: string;
  instructions: string;
  enabled?: boolean;
  version?: number;
  metadata?: Record<string, unknown>;
}
