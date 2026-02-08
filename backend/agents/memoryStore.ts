import { BaseStore, Item } from "@langchain/langgraph-checkpoint";
import prisma from "../../../web/lib/db";

/**
 * PostgreSQL-backed Store for long-term memory using Prisma
 * Implements LangGraph's BaseStore interface
 */
export class PrismaStore extends BaseStore {
  /**
   * Get a memory item by namespace and key
   */
  async get(namespace: string[], key: string): Promise<Item | null> {
    const namespaceStr = namespace.join("/");
    
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
      value: memory.value as Record<string, any>,
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
    value: Record<string, any>
  ): Promise<void> {
    const namespaceStr = namespace.join("/");

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
        value: value as any,
      },
      update: {
        value: value as any,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete a memory item
   */
  async delete(namespace: string[], key: string): Promise<void> {
    const namespaceStr = namespace.join("/");

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
      filter?: Record<string, any>;
      limit?: number;
      offset?: number;
    }
  ): Promise<Item[]> {
    const namespaceStr = namespace.join("/");
    const limit = options?.limit || 10;
    const offset = options?.offset || 0;

    const where: any = {
      namespace: namespaceStr,
    };

    const memories = await prisma.memory.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        updatedAt: "desc",
      },
    });

    return memories.map((memory) => ({
      value: memory.value as Record<string, any>,
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
  async saveUserProfile(profile: Record<string, any>): Promise<void> {
    await this.store.put(["users", this.userId, "profile"], "preferences", profile);
  }

  async getUserProfile(): Promise<Record<string, any> | null> {
    const item = await this.store.get(["users", this.userId, "profile"], "preferences");
    return item?.value || null;
  }

  /**
   * SEMANTIC MEMORY: Save specific facts about user
   */
  async saveFact(factId: string, fact: Record<string, any>): Promise<void> {
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
      context?: Record<string, any>;
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
    return item?.value.instructions || null;
  }

  /**
   * Get all user context for the agent
   */
  async getUserContext(): Promise<{
    profile: Record<string, any> | null;
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
// import { BaseStore, Item} from "@langchain/langgraph-checkpoint";
// import {GetOp, PutOp, SearchOp, ListNamespacesOp, DeleteOp } from "langchain";
// import { InMemoryStore } from "@langchain/langgraph-checkpoint";
// import prisma from "../../../web/lib/db";
// import { MemorySaver } from "@langchain/langgraph";


// /**
//  * PostgreSQL-backed memory store using Prisma
//  * Stores long-term memories in your Neon database
//  */
// export class PrismaMemoryStore extends BaseStore {
//   private prisma: this.prisma;

//   constructor(prisma: prisma) {
//     super();
//     this.prisma = prisma;
//   }

//   /**
//    * Get a memory by namespace and key
//    */
//   async get(namespace: string[], key: string): Promise<Item | null> {
//     const namespaceStr = namespace.join("/");
    
//     const memory = await this.prisma.memory.findUnique({
//       where: {
//         namespace_key: {
//           namespace: namespaceStr,
//           key: key,
//         },
//       },
//     });

//     if (!memory) return null;

//     return {
//       value: memory.value as Record<string, any>,
//       key: memory.key,
//       namespace: namespace,
//       created_at: memory.createdAt.toISOString(),
//       updated_at: memory.updatedAt.toISOString(),
//     };
//   }

//   /**
//    * Save a memory
//    */
//   async put(namespace: string[], key: string, value: Record<string, any>): Promise<void> {
//     const namespaceStr = namespace.join("/");

//     await this.prisma.memory.upsert({
//       where: {
//         namespace_key: {
//           namespace: namespaceStr,
//           key: key,
//         },
//       },
//       create: {
//         namespace: namespaceStr,
//         key: key,
//         value: value as any,
//       },
//       update: {
//         value: value as any,
//         updatedAt: new Date(),
//       },
//     });
//   }

//   /**
//    * Delete a memory
//    */
//   async delete(namespace: string[], key: string): Promise<void> {
//     const namespaceStr = namespace.join("/");

//     await this.prisma.memory.deleteMany({
//       where: {
//         namespace: namespaceStr,
//         key: key,
//       },
//     });
//   }

//   /**
//    * Search memories with filters
//    */
//   async search(namespace: string[], options?: { 
//     filter?: Record<string, any>;
//     limit?: number;
//     offset?: number;
//   }): Promise<Item[]> {
//     const namespaceStr = namespace.join("/");
//     const limit = options?.limit || 10;
//     const offset = options?.offset || 0;

//     // Build where clause
//     const where: any = {
//       namespace: namespaceStr,
//     };

//     // Add JSON filtering if filter is provided
//     if (options?.filter) {
//       where.value = {
//         path: Object.keys(options.filter),
//         equals: Object.values(options.filter)[0],
//       };
//     }

//     const memories = await this.prisma.memory.findMany({
//       where,
//       take: limit,
//       skip: offset,
//       orderBy: {
//         updatedAt: "desc",
//       },
//     });

//     return memories.map((memory) => ({
//       value: memory.value as Record<string, any>,
//       key: memory.key,
//       namespace: memory.namespace.split("/"),
//       created_at: memory.createdAt.toISOString(),
//       updated_at: memory.updatedAt.toISOString(),
//     }));
//   }

//   /**
//    * List all memories in a namespace
//    */
//   async list(namespace: string[]): Promise<Item[]> {
//     const namespaceStr = namespace.join("/");

//     const memories = await this.prisma.memory.findMany({
//       where: {
//         namespace: namespaceStr,
//       },
//       orderBy: {
//         updatedAt: "desc",
//       },
//     });

//     return memories.map((memory) => ({
//       value: memory.value as Record<string, any>,
//       key: memory.key,
//       namespace: memory.namespace.split("/"),
//       created_at: memory.createdAt.toISOString(),
//       updated_at: memory.updatedAt.toISOString(),
//     }));
//   }

//   /**
//    * List all namespaces (optional - for debugging)
//    */
//   async listNamespaces(prefix?: string[]): Promise<string[][]> {
//     const prefixStr = prefix ? prefix.join("/") : "";

//     const namespaces = await this.prisma.memory.findMany({
//       where: prefixStr ? {
//         namespace: {
//           startsWith: prefixStr,
//         },
//       } : undefined,
//       select: {
//         namespace: true,
//       },
//       distinct: ["namespace"],
//     });

//     return namespaces.map((n) => n.namespace.split("/"));
//   }

//   // Required by BaseStore interface
//   async batch(operations: (GetOp | PutOp | SearchOp | ListNamespacesOp | DeleteOp)[]): Promise<(Item | Item[] | string[][] | null)[]> {
//     return Promise.all(
//       operations.map(async (op) => {
//         if (op.constructor.name === "GetOp") {
//           const getOp = op as GetOp;
//           return this.get(getOp.namespace, getOp.key);
//         } else if (op.constructor.name === "PutOp") {
//           const putOp = op as PutOp;
//           await this.put(putOp.namespace, putOp.key, putOp.value);
//           return null;
//         } else if (op.constructor.name === "SearchOp") {
//           const searchOp = op as SearchOp;
//           return this.search(searchOp.namespace, searchOp as any);
//         } else if (op.constructor.name === "DeleteOp") {
//           const deleteOp = op as DeleteOp;
//           await this.delete(deleteOp.namespace, deleteOp.key);
//           return null;
//         } else if (op.constructor.name === "ListNamespacesOp") {
//           const listOp = op as ListNamespacesOp;
//           return this.listNamespaces(listOp.prefix);
//         }
//         throw new Error(`Unknown operation: ${op.constructor.name}`);
//       })
//     );
//   }
// }

// /**
//  * Helper functions for memory management
//  */

// export class MemoryManager {
//   private store: PrismaMemoryStore;
//   private userId: string;

//   constructor(store: PrismaMemoryStore, userId: string) {
//     this.store = store;
//     this.userId = userId;
//   }

//   /**
//    * SEMANTIC MEMORY: Save user preferences/profile
//    */
//   async saveUserProfile(profile: Record<string, any>): Promise<void> {
//     await this.store.put(
//       ["users", this.userId, "profile"],
//       "preferences",
//       profile
//     );
//   }

//   async getUserProfile(): Promise<Record<string, any> | null> {
//     const item = await this.store.get(
//       ["users", this.userId, "profile"],
//       "preferences"
//     );
//     return item?.value || null;
//   }

//   /**
//    * SEMANTIC MEMORY: Save specific facts about user
//    */
//   async saveFact(factId: string, fact: Record<string, any>): Promise<void> {
//     await this.store.put(
//       ["users", this.userId, "facts"],
//       factId,
//       fact
//     );
//   }

//   async getFacts(limit: number = 10): Promise<Item[]> {
//     return this.store.search(
//       ["users", this.userId, "facts"],
//       { limit }
//     );
//   }

//   /**
//    * EPISODIC MEMORY: Save past actions/experiences
//    */
//   async saveAction(actionId: string, action: {
//     type: string;
//     description: string;
//     result: string;
//     context?: Record<string, any>;
//   }): Promise<void> {
//     await this.store.put(
//       ["users", this.userId, "actions"],
//       actionId,
//       {
//         ...action,
//         timestamp: new Date().toISOString(),
//       }
//     );
//   }

//   async getRecentActions(limit: number = 5): Promise<Item[]> {
//     return this.store.search(
//       ["users", this.userId, "actions"],
//       { limit }
//     );
//   }

//   /**
//    * PROCEDURAL MEMORY: Save/update system instructions
//    */
//   async saveInstructions(instructions: string): Promise<void> {
//     await this.store.put(
//       ["users", this.userId, "system"],
//       "instructions",
//       { instructions, updatedAt: new Date().toISOString() }
//     );
//   }

//   async getInstructions(): Promise<string | null> {
//     const item = await this.store.get(
//       ["users", this.userId, "system"],
//       "instructions"
//     );
//     return item?.value.instructions || null;
//   }

//   /**
//    * Get all user context for the agent
//    */
//   async getUserContext(): Promise<{
//     profile: Record<string, any> | null;
//     facts: Item[];
//     recentActions: Item[];
//     instructions: string | null;
//   }> {
//     const [profile, facts, recentActions, instructions] = await Promise.all([
//       this.getUserProfile(),
//       this.getFacts(5),
//       this.getRecentActions(3),
//       this.getInstructions(),
//     ]);

//     return {
//       profile,
//       facts,
//       recentActions,
//       instructions,
//     };
//   }
// }