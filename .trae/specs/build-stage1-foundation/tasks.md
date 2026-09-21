# Tasks

- [x] Task 1: 初始化 Monorepo 工程基线
  - [x] SubTask 1.1: 在仓库根创建 package.json，声明 engines（`node: >=24 <25`）、packageManager（pnpm 11 最新）、根脚本
  - [x] SubTask 1.2: 创建 pnpm-workspace.yaml，配置 apps/* 与 packages/*，并用 catalog 统一 typescript、zod、hono 等跨包复用依赖版本
  - [x] SubTask 1.3: 创建 .nvmrc（24）、tsconfig.base.json、.npmrc（按 pnpm 11 需要）、.gitignore 补充 node_modules 与构建产物
  - [x] SubTask 1.4: 引入 Turborepo（^2）并创建 turbo.json，定义 lint、typecheck、test、build 任务及输出缓存
  - [x] SubTask 1.5: 执行 pnpm install 验证基线可用

- [x] Task 2: 建立 packages/config 共享配置包
  - [x] SubTask 2.1: 创建包结构与 package.json，引用 catalog 中的 typescript、eslint、prettier
  - [x] SubTask 2.2: 导出 strict 模式的 TypeScript 基础配置
  - [x] SubTask 2.3: 导出 ESLint（^10）基础配置与 Prettier（^3）配置
  - [x] SubTask 2.4: 验证配置可被其他 workspace 解析引用

- [x] Task 3: 搭建 apps/web 应用骨架（Next.js 16 + Tailwind v4 + shadcn/ui）
  - [x] SubTask 3.1: 在 apps/web 初始化 Next.js 16（App Router、TypeScript strict、Turbopack），React 19 由 Next 管理
  - [x] SubTask 3.2: 接入 Tailwind CSS v4 与 shadcn/ui（源码入仓，初始化最小基础组件），应用使用 packages/config 的规则
  - [x] SubTask 3.3: 定义 ToolMeta 类型与工具注册表，建立 src/tools、src/lib、src/components 目录
  - [x] SubTask 3.4: 实现基础布局与导航（站点标题、分类入口）

- [x] Task 4: 实现 Web 信息架构页面与最近使用机制
  - [x] SubTask 4.1: 构建期生成首页：平台简介、分类、工具入口
  - [x] SubTask 4.2: 构建期生成分类页与工具详情页（动态路由由注册表驱动）
  - [x] SubTask 4.3: 在 src/lib 实现 localStorage 最近使用读写（键 `tool-craft:recent`，上限 10 条），并在首页展示

- [x] Task 5: 实现 JSON Formatter 工具
  - [x] SubTask 5.1: 在工具目录实现输入区、格式化按钮、输出区
  - [x] SubTask 5.2: 实现主线程 JSON 解析与格式化，非法输入在结果区域展示可读错误且保留已输入内容
  - [x] SubTask 5.3: 将工具注册到注册表（slug: json-formatter，category: developer，processing: mainthread）
  - [x] SubTask 5.4: 为格式化逻辑编写 Vitest 单元测试

- [x] Task 6: 搭建 apps/api 应用骨架（Hono + Zod + OpenAPI）
  - [x] SubTask 6.1: 在 apps/api 初始化 Hono（^4）+ TypeScript strict，建立 src/routes、src/middleware、src/schemas、src/services、src/lib 目录
  - [x] SubTask 6.2: 实现结构化请求日志中间件（请求 ID、路径、状态码、耗时，不记录请求体）
  - [x] SubTask 6.3: 实现统一错误处理中间件与标准错误体，覆盖校验错误（400）、领域错误（422）、内部异常（500）
  - [x] SubTask 6.4: 接入 @hono/zod-openapi（^1）与 @scalar/hono-api-reference，提供 /docs 文档页
  - [x] SubTask 6.5: 提供本地启动入口（Node 24），zod 版本收敛到 catalog 单一实例

- [x] Task 7: 实现 API 端点
  - [x] SubTask 7.1: 实现 GET /v1/health，返回 `{ "status": "ok" }`，并纳入 OpenAPI
  - [x] SubTask 7.2: 在 Schema 层定义 POST /v1/image/compress 的 multipart 输入（image、quality 缺省 80、format 缺省原格式）与响应结构
  - [x] SubTask 7.3: 在服务层以纯函数实现图片压缩（jpeg/png/webp），计算逻辑不依赖请求上下文
  - [x] SubTask 7.4: 路由层串联校验、处理函数与响应头（X-Image-Width/Height、X-Original-Size、X-Processed-Size）
  - [x] SubTask 7.5: 损坏图片返回 422 PROCESSING_ERROR；编写服务层与校验的 Vitest 单元测试

- [x] Task 8: 测试脚手架与 GitHub Actions CI
  - [x] SubTask 8.1: 配置全仓库 Vitest（^5）运行方式
  - [x] SubTask 8.2: 初始化 Playwright（^1），为 Web 首页与 JSON Formatter、API health 提供最小端到端用例
  - [x] SubTask 8.3: 编写 GitHub Actions workflow：pnpm 安装缓存、lint、typecheck、test、build、pnpm audit，Node 24 / pnpm 11

- [x] Task 9: 部署配置与端到端验证
  - [x] SubTask 9.1: 为 apps/web 与 apps/api 添加 Serverless 平台部署配置（独立项目、环境变量隔离、Node 24 运行时）
  - [x] SubTask 9.2: 本地完整跑通 lint、typecheck、test、build 与两个应用的运行
  - [x] SubTask 9.3: 记录平台 Node 24 运行时支持与函数时限等待实测项（文档中维持 [To be confirmed]）

# Task Dependencies

- Task 2 depends on Task 1
- Task 3、Task 6 depend on Task 2（两者可并行）
- Task 4 depends on Task 3
- Task 5 depends on Task 4
- Task 7 depends on Task 6
- Task 8 depends on Task 5 与 Task 7
- Task 9 depends on Task 8
