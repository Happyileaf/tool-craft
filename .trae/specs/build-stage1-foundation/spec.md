# 阶段 1：首个版本（Monorepo 骨架 + 首批工具）Spec

## Why

PRD 与技术方案文档已完成，当前仓库只有文档，没有任何可运行代码。需要按技术方案"阶段 1：首个版本"的范围建立工程骨架，并上线若干简单工具，验证两条产品线（Web Tools、API Tools）的端到端链路：构建、测试、本地运行与部署就绪。

## What Changes

- 初始化 pnpm workspaces Monorepo，运行时基线锁定 Node.js ^24、pnpm ^11（与技术栈文档一致）。
- 引入 Turborepo 做任务编排；通过 pnpm catalog 统一管理跨包复用依赖版本。
- 建立 packages/config：共享 TypeScript 编译选项、ESLint、Prettier 配置。
- 建立 apps/web：Next.js 16（App Router）+ React 19 + Tailwind CSS v4 + shadcn/ui（源码入仓），含工具注册表、首页、分类页、工具详情页的构建期静态生成，以及最近使用（localStorage）机制。
- 在 apps/web 上线第一个纯主线程工具：JSON Formatter。
- 建立 apps/api：Hono 4 + Zod 4 + @hono/zod-openapi，含统一错误处理中间件、结构化请求日志、OpenAPI/Scalar 文档页。
- 在 apps/api 上线 GET /v1/health 与 POST /v1/image/compress 两个端点（契约严格遵循技术方案 §5.2）。
- 建立质量保障：Vitest 单元测试、Playwright 端到端测试脚手架、GitHub Actions CI（install 缓存、lint、typecheck、test、build、pnpm audit）。
- 提供两个应用的本地运行方式与 Serverless 平台部署配置（部署配置就位，真实上线与平台 Node 24 运行时支持以首次实测为准）。

明确不在本阶段范围：packages/ui、API Key/鉴权/限流/计量、数据库或 KV、账号体系、工作流、MCP/Agent、站内搜索。不预留这些能力的接口或目录。

## Impact

- Affected specs：平台工程结构（Monorepo）、Web Tools（信息架构与工具承载机制）、API Tools（接口契约与错误处理）、质量保障（测试与 CI）。
- Affected code：全部为新增代码。
  - 根目录：package.json、pnpm-workspace.yaml、.nvmrc、turbo.json、tsconfig.base.json、.npmrc（如 pnpm 11 需要）、.github/workflows/。
  - packages/config/。
  - apps/web/（Next.js 应用，含 src/app、src/tools、src/lib、src/components）。
  - apps/api/（Hono 应用，含 src/routes、src/middleware、src/schemas、src/services、src/lib）。

## ADDED Requirements

### Requirement: Monorepo 工程基线

系统 SHALL 使用 pnpm workspaces 管理 apps/ 与 packages/，并锁定 Node.js 大版本 ^24、pnpm 大版本 ^11。

#### Scenario: 版本基线生效
- **WHEN** 开发者在 Node.js 24 环境克隆仓库并执行 pnpm install
- **THEN** 所有 workspace 依赖安装成功，lockfile 可用
- **AND** engines（`>=24 <25`）与 packageManager（pnpm 11）声明存在
- **AND** 跨包复用依赖通过 pnpm catalog 统一版本，仓库内 zod 仅存在一个实例

### Requirement: 共享配置包

系统 SHALL 提供 packages/config，导出共享的 TypeScript、ESLint、Prettier 配置，供两个应用引用。

#### Scenario: 应用复用统一配置
- **WHEN** 任一应用执行 lint 或 typecheck
- **THEN** 使用来自 packages/config 的规则
- **AND** TypeScript 以 strict 模式编译通过

### Requirement: Web 工具注册表与静态页面

apps/web SHALL 维护单一工具注册表（ToolMeta：slug、name、description、category、path、processing 等），首页、分类页、工具详情页在构建期由该注册表生成。

#### Scenario: 构建期生成页面
- **WHEN** 执行 web 应用构建
- **THEN** 首页展示分类与工具入口，分类页与工具详情页由注册表静态生成
- **AND** 运行时不查询任何数据源

#### Scenario: 记录最近使用
- **WHEN** 用户使用某个工具
- **THEN** 该工具 slug 写入 localStorage 键 `tool-craft:recent`（上限 10 条以内）
- **AND** 不记录用户输入内容或处理结果

### Requirement: JSON Formatter 工具

apps/web SHALL 提供 JSON Formatter 工具，全部处理在浏览器主线程本地完成。

#### Scenario: 格式化成功
- **WHEN** 用户输入合法 JSON 并触发格式化
- **THEN** 页面展示格式化后的 JSON
- **AND** 全程不产生任何网络请求发送用户数据

#### Scenario: 非法输入
- **WHEN** 用户输入无法解析的内容并触发格式化
- **THEN** 结果区域展示可读错误信息，页面已输入内容不丢失，可修正后重试

### Requirement: API 统一错误处理与日志

apps/api SHALL 通过中间件对校验失败与异常统一转换为标准错误响应，并为每个请求输出一行结构化 JSON 日志。

#### Scenario: 校验失败
- **WHEN** 请求参数缺失、类型不符或超出取值范围
- **THEN** 返回 400，响应体为 `{ "error": { "code": "VALIDATION_ERROR", "message": ..., "details": [...] } }`

#### Scenario: 内部异常
- **WHEN** 发生未预期异常
- **THEN** 返回 500 INTERNAL_ERROR，响应不包含堆栈、环境变量或内部路径

#### Scenario: 请求日志
- **WHEN** 处理任一请求
- **THEN** 输出包含请求 ID、路径、状态码、耗时的单行 JSON，且不记录请求体内容

### Requirement: GET /v1/health

apps/api SHALL 提供存活检查端点。

#### Scenario: 探活成功
- **WHEN** 调用 GET /v1/health
- **THEN** 返回 200，响应体为 `{ "status": "ok" }`

### Requirement: POST /v1/image/compress

apps/api SHALL 提供图片压缩端点，严格遵循技术方案 §5.2 的契约，计算逻辑以纯函数放在服务层。

#### Scenario: 压缩成功
- **WHEN** 以 multipart/form-data 上传 image（jpeg/png/webp），可选 quality（1–100，缺省 80）与 format（jpeg/png/webp，缺省原格式）
- **THEN** 返回 200 与处理后图片二进制，Content-Type 与输出格式一致
- **AND** 响应头附带 X-Image-Width、X-Image-Height、X-Original-Size、X-Processed-Size

#### Scenario: 文件无法处理
- **WHEN** 上传文件类型正确但图片已损坏
- **THEN** 返回 422 PROCESSING_ERROR，错误体符合统一结构

#### Scenario: 幂等
- **WHEN** 使用相同输入重复调用
- **THEN** 产生相同输出，调用方可安全重试

### Requirement: API 文档

apps/api SHALL 由 Zod Schema 生成 OpenAPI 描述并通过 Scalar 渲染可交互文档页。

#### Scenario: 文档与契约一致
- **WHEN** 访问 /docs
- **THEN** 看到由当前 Schema 生成的接口文档
- **AND** 修改端点契约时只需修改 Schema 即可同步文档

### Requirement: 测试与持续集成

系统 SHALL 使用 Vitest 编写单元测试（重点覆盖 API 服务层纯函数与校验逻辑），使用 Playwright 提供端到端测试脚手架，并通过 GitHub Actions 在每次变更时执行安装缓存、lint、typecheck、test、build 与 pnpm audit。

#### Scenario: CI 通过
- **WHEN** 向主分支推送或发起 Pull Request
- **THEN** CI 依次执行上述检查并全部通过
