/**
 * Vercel Serverless 函数入口（仅用于云端部署，本地开发与启动仍使用 index.ts）
 *
 * 通过 @hono/node-server 提供的 Vercel 适配器，将本地 Node 服务共用的
 * Hono 应用实例（src/lib/app.ts）转换为 Vercel Node 函数处理器，
 * 保证云端与本地行为一致、不重复维护路由。
 *
 * 运行时：nodejs24.x 已由 Vercel 官方确认 GA 并作为新项目默认版本
 * （Supported Node.js versions 文档，更新于 2026-02-27）；
 * 首次部署时仍需在构建日志中核实实际生效的 Node 版本。
 *
 * multipart 请求：需在 Vercel Dashboard 为 API 项目配置环境变量
 * NODEJS_HELPERS=0（所有环境），关闭平台对请求体的预解析，
 * 确保图片压缩接口可以读取到原始请求流。
 */
import { handle } from '@hono/node-server/vercel';
import app from './lib/app.js';

/**
 * Vercel 函数构建配置
 *
 * 由 @vercel/node 在构建期通过 @vercel/static-config 静态提取，
 * 仅声明运行时版本；memory、maxDuration、regions 等其余项保持平台默认。
 */
export const config = {
  runtime: 'nodejs24.x',
};

export default handle(app);
