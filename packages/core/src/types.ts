import { z } from 'zod';

/**
 * 传输层编码提示，Adapter 据此做通用编解码，避免按 capability 分支
 */
type TransportEncoding = 'json' | 'base64';

/**
 * Capability 定义接口，描述一个能力的完整契约
 */
interface CapabilityDefinition<TInput = unknown, TParams = unknown, TOutput = unknown> {
  /** 能力唯一标识，格式 domain.name，例如 text.base64-encode */
  id: string;
  /** 人类可读的能力名称 */
  name: string;
  /** 能力描述 */
  description: string;
  /** 输入数据 schema（被处理的数据） */
  inputSchema: z.ZodType<TInput>;
  /** 参数 schema（处理方式） */
  paramsSchema: z.ZodType<TParams>;
  /** 输出 schema */
  outputSchema: z.ZodType<TOutput>;
  /** 供 API/MCP 等序列化传输的 Adapter 使用；默认均为 json */
  transport: { input: TransportEncoding; output: TransportEncoding };
  /** 执行函数，接收校验后的 input 和 params，返回 output */
  execute(input: TInput, params: TParams): TOutput | Promise<TOutput>;
}

/**
 * Capability 摘要，用于 registry.list() 返回不含执行逻辑的轻量信息
 */
interface CapabilitySummary {
  /** 能力唯一标识 */
  id: string;
  /** 人类可读的能力名称 */
  name: string;
  /** 能力描述 */
  description: string;
}

export type { CapabilityDefinition, CapabilitySummary, TransportEncoding };
