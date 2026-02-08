export type AgentStep = {
  agent: string;
  task: string;
  output: string;
  timestamp: number;
};

export type SharedMemory = {
  conversationId: string;
  steps: AgentStep[];
  context?: unknown;
};

export function createSharedMemory(conversationId: string): SharedMemory {
  return {
    conversationId,
    steps: [],
    context: undefined,
  };
}
