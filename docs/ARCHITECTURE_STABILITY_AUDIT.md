# Capability Foundation — Architecture Stability Audit

## 1. 审计目标

本审计清单用于独立审计 **Capability Foundation 的架构稳定性**。

审计的核心问题：

> 当前架构是否能够在 Capability 从 100 个增长到 1000 个甚至更多时，仍然保持稳定，而不需要持续修改或重构底层能力基座？

本审计暂时**不关注新增功能本身**，只关注现有架构是否稳定。

### 暂不审计

- 新增 Capability 的具体功能
- UI 是否美观
- 产品功能是否完整
- Workflow
- AI 能力
- 用户增长
- 商业化
- Analytics
- 性能优化细节

---

# 2. 审计原则

## 2.1 独立审计

设计 Agent 与审计 Agent 应保持职责分离。

设计 Agent 的目标是：

> 设计并实现系统。

审计 Agent 的目标是：

> 主动寻找当前架构中的结构性问题。

审计 Agent 不应该尝试证明当前设计正确，而应该主动寻找：

- 反例
- 隐藏耦合
- 反向依赖
- 抽象泄漏
- 重复实现
- 特殊案例污染
- 过度架构
- 可扩展性问题

---

# 3. 核心架构原则

当前项目有以下核心架构原则。

## 3.1 Multi-platform by Design

Capability 从设计之初就必须考虑多端复用。

Capability 不是 Web 专属能力。

典型消费者包括：

- Web
- API
- MCP
- CLI
- 其他程序
- Agent

Web 只是 Capability 的一种 Consumer。

### 审计问题

- Capability 是否可以脱离 Web 独立存在？
- 是否存在 Web-first、之后再抽象 Capability 的情况？
- 是否需要先创建 Web 页面才能创建 Capability？
- Capability 是否拥有清晰独立的输入和输出边界？

### 风险信号

```text
Web Page
    ↓
内部业务逻辑
    ↓
再包装成 Capability
```

正确方向：

```text
Capability
    ↓
Web Product
```

---

# 4. Reuse Before Reimplement

不同端应该优先复用同一套底层实现逻辑。

理想结构：

```text
                 Capability
                      │
                Shared Logic
                /     |     \
              Web    API    MCP
```

### 审计问题

- Web、API、MCP 是否重复实现相同计算逻辑？
- 是否存在复制粘贴的 Capability 实现？
- MCP 是否绕过 Capability 直接实现业务逻辑？
- API 是否拥有独立于 Capability 的第二套实现？
- 是否因为入口不同就重复实现相同算法？

需要区分：

```text
不同 Adapter
```

和：

```text
不同 Computation
```

前者正常，后者需要重点审查。

---

# 5. Pragmatic Consistency

项目不要求所有端实现绝对一致。

允许由于运行环境差异而产生平台特定实现。

例如：

```text
Browser
  ↓
Browser API / Canvas

Server
  ↓
Node-compatible implementation
```

如果技术条件允许，优先复用。

如果无法合理复用，可以使用平台特定实现。

因此项目不要求：

> 所有端必须得到完全相同的底层计算结果。

而是：

> **尽可能共享实现，并保持 Capability 的核心行为和输入输出契约稳定。**

### 审计问题

- 平台差异是否确实由运行环境造成？
- 是否存在可以复用却被重复实现的逻辑？
- 平台差异是否被限制在合理边界？
- 差异是否已经扩散到 Capability Contract？
- 是否为了追求完全一致而引入过度复杂架构？

---

# 6. Web Presentation Freedom

Web 是产品表现层。

Capability 负责：

> **“能做什么。”**

Web Product 负责：

> **“用户怎么使用它。”**

Web 可以自由设计：

- UI
- UX
- 页面结构
- 交互方式
- 产品流程
- 工具展示方式

### 审计问题

- Capability 是否被 UI 结构限制？
- Capability 是否直接操作 UI？
- Capability 是否知道页面布局？
- Capability 是否知道路由？
- Capability 是否知道组件结构？
- 是否存在统一 UI Schema 强行限制所有工具？
- 是否为了统一页面而反向修改 Capability？

正确方向：

```text
Capability
      ↓
Web Adapter
      ↓
Web Product
      ↓
UI / UX
```

---

# 7. Technology-Agnostic Foundation

Web 使用什么技术栈属于更上层的产品实现细节。

例如：

- Next.js
- React
- Vue
- Nuxt
- Svelte
- Vanilla JS
- CSS
- Tailwind

都不应该成为 Capability Foundation 的架构依赖。

### 核心测试

假设：

```text
Next.js
```

完全替换成：

```text
Vue
```

那么：

> Capability Foundation 是否可以保持不变？

### 审计问题

- Core 是否依赖 React？
- Core 是否依赖 Vue？
- Core 是否依赖 Next.js？
- Core 是否依赖 DOM？
- Capability 是否依赖页面生命周期？
- Capability 是否依赖具体 Web Framework？

---

# 8. Local Compute First

Web 端在条件允许时优先进行本地计算。

理想执行路径：

```text
User
  ↓
Web
  ↓
Capability
  ↓
Browser Local Compute
  ↓
Result
```

### 审计问题

- Web 是否能够优先使用本地计算？
- Local Compute 是否被正确限制在 Web 执行层？
- Capability Core 是否依赖 Browser API？
- 是否为了 Local Compute 引入复杂 Runtime？
- 是否因为某个 Capability 需要浏览器而修改整个 Core？

### 核心原则

> Local Compute 是 Web 的执行策略，而不是 Capability Foundation 的核心依赖。

---

# 9. Stable Foundation

这是本审计最重要的部分。

核心目标：

> Capability 数量从 100 增长到 1000 时，底层 Foundation 仍然保持稳定。

理想状态：

```text
                Stable Foundation
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
     Tool 1         Tool 2         Tool 3
        │              │              │
       ...            ...            ...
                       │
                  Tool 1000
```

### 判断标准

新增 Capability 的主要工作应该是：

```text
定义 Capability
      ↓
定义 Input / Parameters / Output
      ↓
实现计算逻辑
      ↓
注册 Capability
      ↓
设计 Web 产品
```

而不是：

```text
新增工具
↓
修改 Core
↓
修改 Runtime
↓
修改 API
↓
修改 MCP
↓
重构整个系统
```

---

# 10. 100 → 1000 Stability Test

进行一次假设测试：

> 当前系统拥有 100 个 Capability，现在增加到 1000 个。

检查以下内容是否需要结构性修改：

- Capability Core
- Capability Contract
- Registry
- Execution Model
- Adapter Model
- Web Adapter
- API Adapter
- MCP Adapter
- 基础数据结构
- 核心依赖关系

### 判断标准

如果新增 Capability 主要只是：

```text
新增实现
+
新增 Contract
+
注册
```

则架构方向良好。

如果不断出现：

```text
新增 Capability
↓
修改 Core
```

则需要重点调查。

---

# 11. Reverse Dependency Audit

检查底层是否依赖上层。

正确方向：

```text
Web Product
      ↓
Adapter
      ↓
Capability
      ↓
Implementation
```

需要警惕：

```text
Capability
      ↓
Web Product
```

或者：

```text
Core
      ↓
Next.js
```

或者：

```text
Capability
      ↓
MCP
```

### 审计问题

- Core 是否依赖 Web？
- Capability 是否依赖 Adapter？
- Capability 是否依赖 UI？
- Core 是否依赖某个具体 Consumer？
- 底层是否出现上层概念？

---

# 12. Abstraction Leakage Audit

检查不同层之间是否发生职责泄漏。

## Web 层不应该决定

- Capability 核心计算规则
- API 内部实现
- MCP 行为
- Core 生命周期

## Adapter 不应该决定

- Capability 算法
- Capability 核心业务逻辑

## Capability 不应该决定

- 页面布局
- UI 交互
- 路由
- Web Framework
- 用户体验

## Core 不应该

为了某一个具体 Capability 加入大量特殊逻辑。

---

# 13. Special-case Pollution Audit

AI 很容易为了满足一个特殊案例而修改 Core。

例如：

```text
Capability A
    ↓
特殊需求
    ↓
修改 Core
    ↓
增加通用抽象
```

需要重点审计。

### 核心问题

> 这个抽象是真正的通用能力，还是为了一个特殊案例制造出来的抽象？

检查：

- 是否只有一个 Consumer？
- 是否只有一个 Capability 使用？
- 是否拥有明确的通用语义？
- 是否只是为了预测未来需求？
- 是否可以留在 Capability 自身？

如果只是单一案例，不应该轻易污染 Core。

---

# 14. Over-Architecture Audit

重点检查系统是否存在：

> 为未来可能出现的问题提前建设复杂基础设施。

重点关注：

- Workflow Engine
- Plugin System
- Complex Runtime
- Distributed Execution
- Database
- Event Bus
- Message Queue
- AI Orchestration
- Complex Cache
- Complex Version System
- Complex Permission System
- Complex State Management

### 审计原则

看到这些组件并不意味着它们一定错误。

需要问：

> 当前核心架构是否真的需要它？

如果只是：

> “未来可能需要。”

则需要谨慎。

---

# 15. Capability Independence Audit

选择多个不同类型的 Capability：

```text
Text Capability
Structured Data Capability
Binary / Image Capability
```

分别检查：

```text
Capability
    ↓
Implementation
    ↓
Registry
    ↓
Web
    ↓
API
    ↓
MCP
```

### 核心测试

不同类型的 Capability 是否都能够自然进入同一套底座？

如果每出现一种新的 Capability 类型，就需要扩展 Core：

```text
Text
    ↓
修改 Core

Image
    ↓
再次修改 Core

File
    ↓
再次修改 Core
```

则说明底座可能存在抽象问题。

---

# 16. Registry Stability Audit

Registry 应该主要负责：

- Register
- Resolve
- List
- Search
- Metadata

而不是逐渐演变成：

- 业务逻辑中心
- Workflow Engine
- Execution Engine
- AI Planner
- 巨型配置中心

### 审计问题

- Registry 是否保持职责单一？
- 新增 Capability 是否需要修改 Registry Core？
- Registry 是否包含具体 Capability 的特殊逻辑？
- Registry 是否逐渐成为 God Object？

---

# 17. Contract Stability Audit

Capability Contract 应该提供稳定的边界：

```text
Input
Parameters
Output
```

### 审计问题

- Contract 是否足够明确？
- 是否存在大量 Capability-specific 特殊字段？
- 是否为了少数 Capability 不断扩展基础 Contract？
- Contract 是否依赖 Web UI？
- Contract 是否依赖某个 Adapter？
- Contract 是否包含不属于 Capability 的产品信息？

核心目标：

> Contract 应该描述“能力”，而不是描述“某个页面”。

---

# 18. Core Complexity Audit

随着架构演进，持续检查 Core 是否出现：

- 大量 if / else
- Capability-specific branching
- Platform-specific branching
- Consumer-specific branching
- UI-specific branching
- 大量特殊配置
- 大量 Feature Flag
- 大量隐式约定

特别关注这种结构：

```text
if capability === A
    ...

if capability === B
    ...

if capability === C
    ...
```

如果不断出现，则说明 Core 可能正在被具体 Capability 污染。

---

# 19. New Consumer Test

假设未来新增一个完全没有预先设计过的 Consumer：

```text
Desktop App
```

或者：

```text
CLI
```

检查：

> 是否可以在不修改 Capability 核心实现的情况下增加这个 Consumer？

理想情况：

```text
Capability
     │
     ├── Web Adapter
     ├── API Adapter
     ├── MCP Adapter
     └── New Adapter
```

---

# 20. Framework Replacement Test

假设：

```text
Current:
Next.js
```

完全替换成：

```text
Vue
```

检查：

- Capability 是否无需修改？
- Registry 是否无需修改？
- Core 是否无需修改？
- Shared Implementation 是否无需修改？
- API 是否无需修改？
- MCP 是否无需修改？

理想情况：

> 只有 Web Product 层发生变化。

---

# 21. Implementation Replacement Test

假设某个 Capability 的底层实现需要替换：

```text
Implementation A
```

替换成：

```text
Implementation B
```

检查：

- Contract 是否可以保持稳定？
- Consumer 是否不需要变化？
- Web 是否不需要变化？
- API 是否不需要变化？
- MCP 是否不需要变化？

理想结构：

```text
Capability Contract
       ↑
       │
Implementation
```

实现可以变化，但 Capability 对外契约保持稳定。

---

# 22. Anti-patterns

## Anti-pattern 1：Web-first Architecture

```text
Web
 ↓
Business Logic
 ↓
再抽象 Capability
```

## Anti-pattern 2：One Implementation Per Consumer

```text
Web Implementation
API Implementation
MCP Implementation
```

而三者实际上执行的是同一个能力。

## Anti-pattern 3：Core Depends on Framework

```text
Capability
 ↓
React / Vue / Next.js
```

## Anti-pattern 4：Special Case Core Pollution

```text
某一个 Capability
 ↓
修改 Core
 ↓
增加大量通用抽象
```

## Anti-pattern 5：Premature Workflow

还没有大量 Capability，就提前建设复杂 Workflow Engine。

## Anti-pattern 6：Premature Infrastructure

因为“未来可能需要”而提前加入：

- Database
- Queue
- Event Bus
- Distributed Runtime
- Complex Plugin System

## Anti-pattern 7：God Core

所有问题最终都通过修改 Core 解决。

```text
New Capability
    ↓
Modify Core

New Consumer
    ↓
Modify Core

New Platform
    ↓
Modify Core

New UI
    ↓
Modify Core
```

---

# 23. 最小稳定性测试

至少选择以下三类 Capability：

```text
1. 纯文本 / 字符串计算
2. 结构化数据计算
3. 图片 / 二进制数据处理
```

验证它们是否可以进入同一套 Foundation。

测试路径：

```text
Capability
    ↓
Contract
    ↓
Implementation
    ↓
Registry
    ↓
Web
    ↓
API
    ↓
MCP
```

重点不是功能是否正确。

重点是：

> 不同类型的 Capability 是否可以在不改变 Core 结构的情况下接入。

---

# 24. 最终 Stability Checklist

## Capability

- [ ] Capability 是系统的一等公民
- [ ] Capability 可以脱离 Web 独立存在
- [ ] Capability 有清晰的输入输出边界
- [ ] Capability 不依赖具体 UI

## Multi-platform

- [ ] Capability 从设计之初支持多端
- [ ] Web 只是 Consumer 之一
- [ ] API 可以消费 Capability
- [ ] MCP 可以消费 Capability
- [ ] 新增 Consumer 不需要修改 Core

## Implementation Reuse

- [ ] 不同端优先共享实现
- [ ] 没有不必要的重复计算逻辑
- [ ] Adapter 没有重新实现 Capability
- [ ] 平台差异被限制在合理边界

## Web Isolation

- [ ] Core 不依赖 React
- [ ] Core 不依赖 Vue
- [ ] Core 不依赖 Next.js
- [ ] Core 不依赖 DOM
- [ ] Capability 不依赖 UI
- [ ] Web 可以自由设计页面

## Local Compute

- [ ] Web 优先本地计算
- [ ] Local Compute 没有污染 Core
- [ ] Browser-specific logic 没有扩散到 Foundation
- [ ] Server execution 可以独立存在

## Stable Foundation

- [ ] 新增 Capability 不需要修改 Core
- [ ] Registry 不需要为具体 Capability 增加特殊逻辑
- [ ] Contract 不因为单一 Capability 不断扩展
- [ ] 100 → 1000 Capability 时 Foundation 仍然成立
- [ ] Core 没有大量 Capability-specific branching

## Dependency Direction

- [ ] Product → Adapter → Capability
- [ ] 没有明显反向依赖
- [ ] Capability 不依赖 Web
- [ ] Core 不依赖 Consumer
- [ ] Core 不依赖具体 Framework

## Over-Architecture

- [ ] 没有为了未来需求提前引入复杂基础设施
- [ ] 没有不必要的 Workflow Engine
- [ ] 没有不必要的 Runtime 抽象
- [ ] 没有不必要的 Database
- [ ] 没有不必要的分布式架构
- [ ] 没有明显的过度抽象

---

# 25. Audit Conclusion

审计结果只允许使用以下三种状态：

## PASS

没有发现影响 Capability Foundation 稳定性的结构性问题。

## NEEDS REVIEW

发现潜在架构风险，需要人工进一步确认。

## BLOCKED

发现违反核心架构原则的结构性问题。

在问题解决之前，不应该继续扩展或固化相关 Foundation。

---

# 26. Audit Report Format

每次审计最终输出：

```text
# Architecture Stability Audit

## Status

PASS / NEEDS REVIEW / BLOCKED

## Critical Findings

- ...

## Foundation Risks

- ...

## Dependency Violations

- ...

## Implementation Duplication

- ...

## Scalability Risks

- ...

## Over-Architecture Risks

- ...

## Required Changes

- ...

## Unresolved Questions

- ...
```

---

# 27. Final Audit Principle

这份审计清单的目的不是让架构越来越复杂。

恰恰相反：

> **它的目标是防止架构在持续开发过程中逐渐腐化、耦合和膨胀。**

始终优先维护：

```text
Simple Capability
        ↓
Stable Foundation
        ↓
Reusable Implementation
        ↓
Thin Adapters
        ↓
Free Web Product
```

最终需要守护的核心不是某个具体技术方案，而是：

> **底层能力基座能够长期稳定，工具可以持续增长，上层产品可以自由变化，而彼此不会不断反向污染。**
