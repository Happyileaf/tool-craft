# Tool-Craft 技术栈文档

## 一、文档目的

本文档确定 Tool-Craft 初期的技术选型，回答"用什么技术、为什么用、什么时候换"三个问题。选型的判定标准全部来自 PRD 的核心约束：以尽可能低的成本持续增加工具，简单优先，两条产品线独立发展，问题出现之后再抽象。`[Data-backed]`

文档面向参与项目的所有工程师。全部选型以大版本粒度锁定（允许同一大版本内的 minor/patch 升级），版本间兼容性核查结论见第四章。参考版本号更新于 2026-09-21。`[Research-backed]`

## 二、选型原则

每条技术选择都必须同时满足以下条件，否则不予引入：

1. 学习与上手成本低，新工具可以在最少的样板代码下运行起来。
2. 能部署到 Serverless 平台，不依赖需要长期运维的服务器。
3. 不强迫 Web 与 API 两条产品线共享运行时；共享只发生在 packages/ 下无副作用的纯代码层面。
4. 引入一项技术时必须能指认它服务的具体场景；"以后可能有用"不构成引入理由。

## 三、总体技术栈一览

| 分类 | 选型 | 锁定大版本 | 参考版本（2026-09-21） | 适用范围 |
|------|------|------------|------------------------|----------|
| 语言 | TypeScript（strict 模式） | ^5 | 5.x（≥5.1） | 全部应用与共享包 |
| 运行时 | Node.js（LTS，代号 Krypton） | ^24 | 24.21.0 | 本地开发、构建、API 运行 |
| 包管理 / Monorepo | pnpm workspaces | ^11 | 11.26 | 全仓库 |
| 任务编排 | Turborepo | ^2 | 2.11.2 | 全仓库构建与缓存 |
| Web 框架 | Next.js（App Router） | ^16 | 16.3.x | apps/web |
| UI 库 | React（跟随 Next.js） | ^19 | 19.2.x | apps/web |
| API 框架 | Hono | ^4 | 4.x | apps/api |
| 输入校验 | Zod | ^4 | 4.x | apps/api 为主，web 表单可选 |
| API 文档 | @hono/zod-openapi + @scalar/hono-api-reference | ^1 / ^0.12 | 1.x / 0.12.x | apps/api |
| 样式 | Tailwind CSS | ^4 | 4.x | apps/web |
| 基础组件 | shadcn/ui（源码入仓） | 不锁版本 | 跟随 Tailwind v4 + React 19 | apps/web |
| 浏览器内计算 | Web Worker / WebAssembly / WebGPU（按需） | 平台能力，无独立版本 | — | apps/web 各工具内部 |
| 测试 | Vitest（单元）、Playwright（端到端） | ^5 / ^1 | 5.x / 1.63.x | 全仓库 |
| 代码质量 | ESLint + Prettier，共享配置包 | ^10 / ^3 | 10.11.x / 3.9.x | 全仓库 |
| CI | GitHub Actions | 平台能力，无独立版本 | — | 全仓库 |
| 部署 | Serverless 平台（Vercel 或同类型平台） | 平台能力，无独立版本 | — | apps/web、apps/api |
| 错误监控 | Sentry（@sentry/nextjs、@sentry/hono） | ^10 | 10.x | 两个应用 |
| 访问统计 | 隐私友好型统计（Plausible / Umami） | 选型后锁定 | `[To be confirmed]` | apps/web |

## 四、语言与工程基础

### 4.1 TypeScript

全仓库统一使用 TypeScript 并开启 strict 模式，锁定大版本 ^5（参考 5.x，Next.js 16 要求 ≥5.1）。理由是两条产品线的输入输出都高度依赖结构化数据：Web 工具的参数、API 的请求与响应都需要在编译期发现类型错误，避免接口契约靠口头约定。`[Expert judgment]` Web 与 API 共享的类型（如工具元信息）可以放入 packages/，但业务逻辑不共享。

### 4.2 Node.js 版本

按项目要求使用 Node.js 24 大版本的最新版本：参考版本 24.21.0（Node.js 24 LTS，代号 Krypton）。锁定方式：

- 根 package.json 的 engines 字段声明 `"node": ">=24 <25"`。
- 仓库根目录 .nvmrc 写入 `24`，跟随 v24 最新版本。
- CI 与部署平台统一选用 Node 24 运行时。

Serverless 平台的函数运行时选用同一大版本，避免本地与线上行为不一致。所选平台对 Node.js 24 的支持情况在首次部署时实测确认。`[To be confirmed]`

### 4.3 pnpm

pnpm 是 PRD 指定的包管理方式，按项目要求锁定大版本 ^11（参考版本 11.26），通过根 package.json 的 packageManager 字段与 Corepack 固定，所有开发者与 CI 使用同一版本。lockfile 必须提交。`[Data-backed]` pnpm 11 为纯 ESM 包，要求 Node.js ≥22，与 Node.js 24 运行环境兼容。`[Research-backed]`

其 workspace 能力天然匹配 apps/ + packages/ 的仓库结构，硬链接机制节省磁盘空间，对包含多个工具依赖的前端项目意义明显。

### 4.4 Turborepo

Turborepo 锁定大版本 ^2（参考版本 2.11.2），只承担任务编排与构建缓存：一条命令完成所有包的 lint、test、build，并缓存未变动的产物。它不规定模块间的依赖关系，也不引入运行时耦合，符合"Monorepo 只为方便管理"的定位。`[Data-backed]` turbo 包自身不依赖 Node 版本特性，在 Node 24 下无运行时要求冲突。

### 4.5 版本锁定策略

1. 锁定粒度为大版本：package.json 中使用 `^MAJOR` 范围，允许同一大版本内的 minor 与 patch 升级；大版本升级视为独立变更，须重新执行本章的兼容性核查。
2. 跨包复用的依赖版本通过 pnpm catalog 在 pnpm-workspace.yaml 中统一定义，各 workspace 引用 catalog，避免同一依赖出现多个版本。
3. 平台能力项（GitHub Actions、Serverless 平台、浏览器 API）不存在 npm 版本，不写入依赖清单，其能力边界在首次部署时确认。
4. shadcn/ui 以源码形式进入 apps/web 仓库，不作为依赖锁定版本；初始化时使用支持 Tailwind CSS v4 与 React 19 的官方版本，后续随仓库代码独立演进。

### 4.6 版本兼容性核查

核查日期：2026-09-21。结论：上述锁定版本之间不存在阻断性冲突，可以共存。`[Research-backed]`

| 核查项 | 官方要求 | 与锁定版本的关系 |
|--------|----------|------------------|
| pnpm 11 ↔ Node.js | 要求 Node.js ≥22 | Node.js 24 满足 |
| Next.js 16 ↔ Node.js / TypeScript | 要求 Node.js ≥20.9、TypeScript ≥5.1 | Node.js 24、TypeScript ^5 满足 |
| Next.js 16 ↔ React | 配套 React 19 | React ^19 由 Next.js 统一管理，不单独升级 |
| Vitest 5 ↔ Node.js / Vite | 要求 Node.js ≥22.12、Vite ≥6.4 | Node.js 24 满足；Vite 作为其内部依赖由 Vitest 管理 |
| ESLint 10 ↔ Node.js | 要求 Node.js ≥20.19 | Node.js 24 满足 |
| @hono/zod-openapi 1 ↔ Zod | peerDependencies 要求 zod ^4 | Zod ^4 满足；Zod 3 不在支持范围，不允许引入 |
| Tailwind CSS v4 ↔ shadcn/ui / React 19 | shadcn/ui 当前版本面向 Tailwind v4 与 React 19 | 满足 |
| Sentry JS SDK 10（@sentry/nextjs、@sentry/hono） | 统一大版本，支持 Next.js 16 与 Hono 4 运行于 Node 24 | 满足；@sentry/hono 已为稳定版本 |

需要在工程上主动规避的风险：

1. Zod 单实例风险：@hono/zod-openapi 通过原型扩展在 Zod 上挂载 openapi 方法。pnpm 的严格依赖布局下，如果不同 workspace 引入了不同版本的 zod，会解析出两份实例，出现 `.openapi is not a function` 一类的运行时错误。`[Research-backed]` 应对方式：zod 版本统一收敛到 pnpm catalog（锁定 ^4），并在安装后用 `pnpm why zod` 核查全仓库只有一个版本；必要时用根 package.json 的 pnpm.overrides 强制收敛。
2. Serverless 平台 Node 24 运行时：平台对 Node.js 24 的提供方式（内置运行时或自定义层）以首次部署实测为准；若平台暂未提供，API 可临时使用平台支持的 Node 22 运行时（满足全部依赖下限），但本地仍保持 Node 24，不作为长期状态。`[To be confirmed]`
3. pnpm 11 的构建脚本审批与新版安全默认值与旧版行为不同（依赖构建脚本需显式允许），仓库初始化时按 pnpm 11 的配置方式一次性声明，不沿用旧版配置项。

## 五、Web Tools 技术栈

### 5.1 Next.js（App Router）

apps/web 使用 Next.js。工具页面本身是纯客户端交互，但 Next.js 带来两项对本产品有实际价值的能力：

- 静态生成首页、分类页、工具列表页，输出可直接分发到 CDN，首屏快且有利于搜索引擎收录工具页面。`[Expert judgment]`
- 文件式路由让新增一个工具等价于新增一个目录，配合工具元信息文件即可完成"加入分类、发布"，契合 PRD 中新增工具的固定流程。`[Data-backed]`

工具页面统一在页面顶部声明客户端渲染，服务端能力默认不使用。不为不需要 SSR 的工具引入服务端组件复杂度。部署到 Serverless 平台时，静态页面走 CDN，只有真正需要服务端的路由才产生函数调用。

React 跟随 Next.js 16 官方支持的版本（^19），不单独升级。

### 5.2 Tailwind CSS 与 shadcn/ui

Tailwind CSS 用于样式。工具页面结构简单（输入区、操作区、输出区），工具类写法可以让每个工具在不维护大量独立 CSS 文件的情况下保持布局一致。`[Expert judgment]`

shadcn/ui 提供按钮、输入框、对话框等基础组件。它不是传统依赖库，组件源码直接进入 apps/web 仓库，工具可以复制后自由修改，与 PRD"工具内部允许自由设计、只保持基本产品一致性"的要求一致。`[Data-backed]` packages/ui 只在确认两个应用出现重复 UI 需求后才建立，初期不预先创建。

### 5.3 浏览器内计算能力

local-first 要求图片、文件、文本处理全部在用户设备完成，按工具需要分三档选择，优先用最简单的一档：

| 档位 | 技术 | 适用场景 |
|------|------|----------|
| 主线程 JavaScript | 原生 API、轻量第三方库 | JSON 格式化、文本处理、颜色计算等毫秒级任务 |
| Web Worker | Worker 线程 + JS/WASM 库 | 图片压缩、大文件解析等会阻塞 UI 的任务 |
| WebAssembly / WebGPU | Rust/C++ 编译产物、GPU 计算 | 编解码、图像算法等 JS 性能不足的场景 |

选用第三方库（如图片处理的 wasm 库）时，优先选择支持按需加载、产物可由 CDN 分发的库，避免为单个工具拖慢整站首屏。

### 5.4 状态与数据

不引入全局状态管理库作为默认项。单个工具的状态保留在自身页面内；跨页面只需记住"最近使用的工具"，使用 localStorage 即可。不接入任何追踪用户内容的统计 SDK，访问统计只上报页面级事件，不上报用户输入。

## 六、API Tools 技术栈

### 6.1 Hono

apps/api 使用 Hono 作为 HTTP 框架。它的代码体积小、冷启动开销低，原生适配 Serverless 函数与边缘运行时，路由与中间件写法接近标准 Web API，从 Express/Fastify 迁移几乎没有学习成本。`[Expert judgment]` 选型不使用绑定单一平台的框架，以保留未来在 Vercel、Cloudflare Workers、VPS 之间迁移的自由。

### 6.2 Zod 校验与 OpenAPI 文档

每个端点用 Zod（^4）定义请求参数与响应结构，校验失败统一由中间件转换为标准错误响应。@hono/zod-openapi（^1）直接从 Zod Schema 生成 OpenAPI 描述，@scalar/hono-api-reference（^0.12）渲染为可交互文档页面，文档地址随服务发布（如 /docs）。这样输入 Schema、输出 Schema、文档三者只有一处定义，符合 PRD 对"输入输出明确、文档清晰"的要求。`[Data-backed]`

### 6.3 无状态、无数据库

初期 API 全部为"接收输入 → 计算 → 返回结果"的无状态接口，不接入任何数据库或对象存储。`[Data-backed]` 计算所需内存按单次请求分配，函数实例处理完即释放。大文件与超时问题通过请求体大小上限和函数执行时限约束，具体上限值在部署平台配置时确认。`[To be confirmed]`

### 6.4 鉴权与限流

初期默认开放调用，不在代码中预置 API Key 体系，这与 PRD"问题出现之后再抽象"的演进策略一致。`[Data-backed]` 当滥用或商业化需求出现时，按以下顺序补充，每一步都只新增必要的组件：

1. 平台层限流：利用部署平台自带的按 IP 速率限制能力，无需写代码。
2. API Key 校验：轻量中间件读取请求头，Key 存放在平台环境变量或托管 KV 中，不为此引入自建数据库。
3. 用量计量：接入平台 KV/D1 等托管存储做计数，仍不维护独立数据库。

具体限流阈值在真实流量数据出现后制定，本文不虚构容量数字。

## 七、质量保障

### 7.1 测试

- Vitest 用于纯函数与工具逻辑的单元测试。对 Web 工具而言，本地处理函数（解析、转换、校验）是最值得测试的部分。
- Playwright 用于核心链路的端到端测试：首页找到工具、打开工具、完成一次处理、得到结果。
- 测试覆盖以工具为单位，新增工具时附带其核心处理函数的测试用例，不设置全仓库统一的覆盖率门槛。

### 7.2 Lint 与格式化

ESLint（^10）与 Prettier（^3）的共享配置放在 packages/config（仓库初始化时建立），所有应用引用同一套规则。规则集保持精简，以 TypeScript 官方推荐规则和框架官方规则为主，不叠加产生大量噪音的个人化配置。

### 7.3 持续集成

GitHub Actions 在每次推送与 Pull Request 时执行 install、lint、test、build 四个任务，借助 Turborepo 缓存缩短耗时。合并到主分支后触发自动部署。

## 八、部署与运维

### 8.1 Serverless 部署

apps/web 与 apps/api 部署到同一 Serverless 平台（如 Vercel；若后续选择 Cloudflare，Web 需确认其 Next.js 兼容程度）。`[Expert judgment]` 两个应用使用独立的项目与域名，例如：

- Web：主域名，承担工具浏览与使用。
- API：独立子域（如 api 子域），/docs 提供文档。

两个项目的部署、回滚、环境变量各自独立，一条产品线的发布不会影响另一条。

### 8.2 环境变量与密钥

环境变量按应用隔离：apps/api 的变量不会暴露给 apps/web。前端通过 NEXT_PUBLIC_ 前缀暴露的仅限 API 地址等非敏感配置。任何密钥只存在于部署平台与 CI 的加密变量中，不写入仓库。

### 8.3 监控

Sentry（^10，@sentry/nextjs 与 @sentry/hono）接入两个应用，利用其免费额度收集未捕获异常；日志以平台自带的函数日志为主，输出结构化 JSON，不额外搭建日志系统。访问统计使用 Plausible 或自托管 Umami，不使用对用户数据采集较重的统计产品，与免登录、本地处理的产品立场保持一致。

## 九、选型演进触发条件

技术栈不是一成不变，也不提前为变化做设计。以下触发条件出现时，对应组件才进入评估：

| 触发条件 | 评估动作 |
|----------|----------|
| API 出现明确的滥用或计费需求 | 引入 API Key 中间件与平台托管 KV，再评估独立数据库 |
| 单台无状态函数无法满足计算量（处理时长/内存超限） | 将重计算拆为独立服务或改为异步任务模式 |
| Web 与 API 出现三处以上重复的纯逻辑代码 | 提取到 packages/ 下共享包 |
| 两个应用出现重复 UI 组件需求 | 建立 packages/ui |
| Serverless 账单或冷启动成为实际问题 | 评估 VPS + Docker 部署，Hono 应用可直接迁移 |
| 工具数量增长到分类浏览难以查找 | 在现有静态生成架构上增加站内搜索索引，不引入后端服务 |

除上表所列情形外，新框架、新运行时、新基础设施一律不预先引入。
