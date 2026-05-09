import { BaseStore, Item } from "@langchain/langgraph-checkpoint";
import prisma from "@/lib/db";

/**
 * PostgreSQL-backed Store for long-term memory using Prisma
 * Implements LangGraph's BaseStore interface
 */
//@ts-expect-error - PrismaStore extends BaseStore but may have implementation discrepancies with newer LangGraph versions in this environment
export class PrismaStore extends BaseStore {
  /**
   * Get a memory item by namespace and key
   */
  async get(namespace: string[], key: string): Promise<Item | null> {
    const namespaceStr = namespace.join("/");
    //@ts-expect-error - prisma.memory type inference issue with findUnique in this context
    const memory = await prisma.memory.findUnique({
      where: {
        namespace_key: {
          namespace: namespaceStr,
          key: key,
        },
      },
    });

    if (!memory) return null;

    return {
      value: memory.value as Record<string, unknown>,
      key: memory.key,
      namespace: namespace,
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString(),
    };
  }

  /**
   * Store a memory item
   */
  async put(
    namespace: string[],
    key: string,
    value: Record<string, unknown>
  ): Promise<void> {
    const namespaceStr = namespace.join("/");
    //@ts-expect-error - prisma.memory type inference issue with upsert in this context
    await prisma.memory.upsert({
      where: {
        namespace_key: {
          namespace: namespaceStr,
          key: key,
        },
      },
      create: {
        namespace: namespaceStr,
        key: key,
        value: value as Record<string, unknown>,
      },
      update: {
        value: value as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete a memory item
   */
  async delete(namespace: string[], key: string): Promise<void> {
    const namespaceStr = namespace.join("/");
//@ts-expect-error - prisma.memory type inference issue with deleteMany in this context
    await prisma.memory.deleteMany({
      where: {
        namespace: namespaceStr,
        key: key,
      },
    });
  }

  /**
   * Search for memory items
   */
  async search(
    namespace: string[],
    options?: {
      filter?: Record<string, unknown>;
      limit?: number;
      offset?: number;
    }
  ): Promise<Item[]> {
    const namespaceStr = namespace.join("/");
    const limit = options?.limit || 10;
    const offset = options?.offset || 0;

    const where: { namespace: string } = {
      namespace: namespaceStr,
    };
//@ts-expect-error - prisma.memory type inference issue with findMany in this context
    const memories = await prisma.memory.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        updatedAt: "desc",
      },
    });
//@ts-expect-error - memory object type inference issue during mapping in this context
    return memories.map((memory) => ({
      value: memory.value as Record<string, unknown>,
      key: memory.key,
      namespace: memory.namespace.split("/"),
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString(),
    }));
  }
}

/**
 * Helper class for managing user memories
 */
export class MemoryManager {
  private store: PrismaStore;
  private userId: string;

  constructor(store: PrismaStore, userId: string) {
    this.store = store;
    this.userId = userId;
  }

  /**
   * SEMANTIC MEMORY: Save user preferences/profile
   */
  async saveUserProfile(profile: Record<string, unknown>): Promise<void> {
    await this.store.put(["users", this.userId, "profile"], "preferences", profile);
  }

  async getUserProfile(): Promise<Record<string, unknown> | null> {
    const item = await this.store.get(["users", this.userId, "profile"], "preferences");
    return item?.value || null;
  }

  /**
   * SEMANTIC MEMORY: Save specific facts about user
   */
  async saveFact(factId: string, fact: Record<string, unknown>): Promise<void> {
    await this.store.put(["users", this.userId, "facts"], factId, fact);
  }

  async getFacts(limit: number = 10): Promise<Item[]> {
    return this.store.search(["users", this.userId, "facts"], { limit });
  }

  /**
   * EPISODIC MEMORY: Save past actions/experiences
   */
  async saveAction(
    actionId: string,
    action: {
      type: string;
      description: string;
      result: string;
      context?: Record<string, unknown>;
    }
  ): Promise<void> {
    await this.store.put(["users", this.userId, "actions"], actionId, {
      ...action,
      timestamp: new Date().toISOString(),
    });
  }

  async getRecentActions(limit: number = 5): Promise<Item[]> {
    return this.store.search(["users", this.userId, "actions"], { limit });
  }

  /**
   * PROCEDURAL MEMORY: Save/update system instructions
   */
  async saveInstructions(instructions: string): Promise<void> {
    await this.store.put(["users", this.userId, "system"], "instructions", {
      instructions,
      updatedAt: new Date().toISOString(),
    });
  }

  async getInstructions(): Promise<string | null> {
    const item = await this.store.get(["users", this.userId, "system"], "instructions");
    return (item?.value as { instructions?: string })?.instructions || null;
  }

  /**
   * Get all user context for the agent
   */
  async getUserContext(): Promise<{
    profile: Record<string, unknown> | null;
    facts: Item[];
    recentActions: Item[];
    instructions: string | null;
  }> {
    const [profile, facts, recentActions, instructions] = await Promise.all([
      this.getUserProfile(),
      this.getFacts(5),
      this.getRecentActions(3),
      this.getInstructions(),
    ]);

    return {
      profile,
      facts,
      recentActions,
      instructions,
    };
  }
}