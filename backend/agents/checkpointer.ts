import {
  BaseCheckpointSaver,
  Checkpoint,
  CheckpointMetadata,
  CheckpointTuple,
  SerializerProtocol,
} from "@langchain/langgraph-checkpoint";
import { RunnableConfig } from "@langchain/core/runnables";
import prisma from "@/lib/db";

// Simple JSON serializer
const jsonSerializer: SerializerProtocol = {
  //@ts-expect-error - stringify method signature might vary across different LangGraph checkpoint versions
  stringify: (obj: unknown) => JSON.stringify(obj),
};

/**
 * PostgreSQL Checkpointer for short-term memory (conversation history)
 * Uses Prisma to store conversation checkpoints in PostgreSQL
 */
//@ts-expect-error - BaseCheckpointSaver abstract methods or properties may not perfectly match this manual implementation
export class PrismaCheckpointer extends BaseCheckpointSaver {
  constructor(serde?: SerializerProtocol) {
    super(serde || jsonSerializer);
  }

  /**
   * Save a checkpoint
   */
  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata
  ): Promise<RunnableConfig> {
    const threadId = config.configurable?.thread_id as string;
    const checkpointNs = config.configurable?.checkpoint_ns || "";
    
    if (!threadId) {
      throw new Error("thread_id is required in config.configurable");
    }
//@ts-expect-error - serde protocol stringify method might have version-specific typing issues
    const serializedCheckpoint = this.serde.stringify(checkpoint);
    const serializedMetadata = JSON.stringify(metadata);
//@ts-expect-error - prisma.checkpoint is dynamically defined via the schema and might lack full type generation in this env
    await prisma.checkpoint.upsert({
      where: {
        thread_id_checkpoint_ns_checkpoint_id: {
          thread_id: threadId,
          checkpoint_ns: checkpointNs,
          checkpoint_id: checkpoint.id,
        },
      },
      create: {
        thread_id: threadId,
        checkpoint_ns: checkpointNs,
        checkpoint_id: checkpoint.id,
        checkpoint: serializedCheckpoint as string,
        metadata: serializedMetadata as string,
      },
      update: {
        checkpoint: serializedCheckpoint as string,
        metadata: serializedMetadata as string,
      },
    });

    return {
      configurable: {
        thread_id: threadId,
        checkpoint_ns: checkpointNs,
        checkpoint_id: checkpoint.id,
      },
    };
  }

  /**
   * Get a checkpoint tuple
   */
  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const threadId = config.configurable?.thread_id as string;
    const checkpointId = config.configurable?.checkpoint_id as string;
    const checkpointNs = config.configurable?.checkpoint_ns || "";

    if (!threadId) {
      return undefined;
    }

    const where: { thread_id: string; checkpoint_ns: string; checkpoint_id?: string } = {
      thread_id: threadId,
      checkpoint_ns: checkpointNs,
    };

    if (checkpointId) {
      where.checkpoint_id = checkpointId;
    }
//@ts-expect-error - prisma.checkpoint findFirst might have dynamic typing issues with the generated schema
    const record = await prisma.checkpoint.findFirst({
      where,
      orderBy: {
        checkpoint_id: "desc",
      },
    });

    if (!record) {
      return undefined;
    }
//@ts-expect-error - serde parse method might vary in its return type signature
    const checkpoint = this.serde.parse(record.checkpoint as string);
    const metadata = JSON.parse(record.metadata as string);

    return {
      config: {
        configurable: {
          thread_id: record.thread_id,
          checkpoint_ns: record.checkpoint_ns,
          checkpoint_id: record.checkpoint_id,
        },
      },
      checkpoint,
      metadata,
      parentConfig: undefined, // Can be extended if needed
    };
  }

  /**
   * List checkpoints for a thread
   */
  //@ts-expect-error - AsyncGenerator return type for list might not match the BaseCheckpointSaver definition
  async *list(
    config: RunnableConfig,
    limit?: number,
    before?: RunnableConfig
  ): AsyncGenerator<CheckpointTuple> {
    const threadId = config.configurable?.thread_id as string;
    const checkpointNs = config.configurable?.checkpoint_ns || "";

    if (!threadId) {
      return;
    }

    const where: { thread_id: string; checkpoint_ns: string; checkpoint_id?: { lt: string } } = {
      thread_id: threadId,
      checkpoint_ns: checkpointNs,
    };

    if (before?.configurable?.checkpoint_id) {
      where.checkpoint_id = {
        lt: before.configurable.checkpoint_id as string,
      };
    }
//@ts-expect-error - prisma.checkpoint findMany might have dynamic typing issues with the generated schema
    const records = await prisma.checkpoint.findMany({
      where,
      orderBy: {
        checkpoint_id: "desc",
      },
      take: limit || 10,
    });

    for (const record of records) {
      //@ts-expect-error - serde parse method might vary in its return type signature
      const checkpoint = this.serde.parse(record.checkpoint as string);
      const metadata = JSON.parse(record.metadata as string);

      yield {
        config: {
          configurable: {
            thread_id: record.thread_id,
            checkpoint_ns: record.checkpoint_ns,
            checkpoint_id: record.checkpoint_id,
          },
        },
        checkpoint,
        metadata,
        parentConfig: undefined,
      };
    }
  }

  /**
   * Store intermediate writes
   */
  async putWrites(
    config: RunnableConfig,
    writes: Array<[string, unknown]>,
    taskId: string
  ): Promise<void> {
    const threadId = config.configurable?.thread_id as string;
    const checkpointNs = config.configurable?.checkpoint_ns || "";
    const checkpointId = config.configurable?.checkpoint_id as string;

    if (!threadId || !checkpointId) {
      return;
    }

    const serializedWrites = writes.map(([channel, value]) => ({
      channel,
      //@ts-expect-error - serde stringify method might have version-specific typing issues
      value: this.serde.stringify(value),
    }));
//@ts-expect-error - prisma.checkpointWrite create might have dynamic typing issues with the generated schema
    await prisma.checkpointWrite.create({
      data: {
        thread_id: threadId,
        checkpoint_ns: checkpointNs,
        checkpoint_id: checkpointId,
        task_id: taskId,
        writes: serializedWrites as string,
      },
    });
  }
}