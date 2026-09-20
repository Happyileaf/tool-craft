# 在线工具平台项目总纲

## 一、项目定位

这是一个以 **Capability（能力单元）** 为核心的在线工具平台。

产品表面上是一个提供大量独立在线工具的 Toolbox，例如：

- JSON Formatter
- Base64 Encoder / Decoder
- Timestamp Converter
- Regex Tester
- Image Resize
- Image Compression
- Text Processing
- 各类开发者工具、文件工具和实用工具

但产品的核心并不是简单地积累网页工具，而是：

> **建立一个稳定的能力底座，让大量独立工具建立在统一的 Capability 体系之上，并天然支持多端复用。**

工具本身可以快速、持续地增加。

---

## 二、核心产品思路

项目采用：

> **Capability First**

的设计方式。

一个在线工具不是底层的核心对象，而是一个 Capability 的具体产品表现。

例如：

```text
image.resize
```

这是一个 Capability。

Web 上可以把它设计成一个完整的图片处理工具：

```text
上传图片
↓
设置尺寸
↓
预览
↓
处理
↓
下载
```

但这个 Web 页面只是 Capability 的一种使用方式。

同一个 Capability 未来还可以被：

```text
Web
API
MCP
CLI
其他程序
Agent
```

调用。

因此：

```text
Capability
   ├── Web
   ├── API
   ├── MCP
   └── Other Consumers
```

---

## 三、Capability 从第一天就必须支持多端

这是项目最重要的设计原则之一。

不能采用：

```text
先做 Web
↓
工具做多了
↓
再把 Web 工具抽象成 API
↓
再考虑 MCP
```

而应该从第一天就是：

```text
Capability
   ↓
多端可消费
```

Web 只是其中一个 Consumer。

因此新增一个 Capability 时，就应该按照独立能力来设计，而不是按照一个页面来设计。

---

## 四、底层实现尽可能复用

虽然一个 Capability 可以被多个端调用，但并不意味着每个端都重新实现一遍。

核心原则：

> **Reuse Before Reimplement。**

优先让：

```text
Web
API
MCP
```

共享同一套底层实现逻辑。

理想情况：

```text
                 Capability
                      │
                Shared Logic
                /     |     \
              Web    API    MCP
```

例如：

```text
base64.encode()
```

Web、API、MCP 都尽量调用同一个实现。

---

## 五、不追求绝对的跨端一致

不同运行环境天然存在差异。

例如某些图像处理能力：

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

如果某些特殊场景存在合理的平台差异，可以接受。

不为了消除这些差异而引入复杂的架构。

---

## 六、Web 是产品表现层，而不是 Capability 的实现层

Capability 负责：

> **“能做什么。”**

Web Product 负责：

> **“用户怎么使用它。”**

因此 Web 页面可以非常自由。

例如同一个：

```text
image.resize
```

可以设计成：

- 简单表单工具
- 拖拽上传工具
- 图片预览编辑器
- 批量处理界面
- 更复杂的图片工作台

这些变化都不应该影响底层 Capability。

因此：

```text
Capability
      ↓
Web Adapter
      ↓
Web Product
      ↓
UI / UX
```

Web UI 不需要被 Capability 强行规定成统一模板。

---

## 七、Web 技术栈属于更上层

Web 使用什么框架，不应该成为 Capability Foundation 的架构问题。

例如现在可以：

```text
Next.js
```

以后完全可以换成：

```text
Vue
```

或者：

```text
React
Svelte
Vanilla JS
```

都不应该影响 Capability。

理想结构：

```text
┌─────────────────────────────┐
│        Web Product          │
│                             │
│ Next / Vue / React / ...    │
└──────────────┬──────────────┘
               │
          Web Adapter
               │
┌──────────────▼──────────────┐
│    Capability Foundation    │
│                             │
│ Capability                  │
│ Contract                    │
│ Registry                    │
│ Shared Implementation       │
└──────────────┬──────────────┘
               │
          API / MCP / ...
```

因此：

> **Web 技术栈可以快速变化，而 Capability Foundation 应该保持稳定。**

---

## 八、Web Local Compute First

Web 端还有一个重要原则：

> **尽可能在用户浏览器本地完成计算。**

例如：

```text
JSON Format
Base64
Regex
Text Processing
Image Resize
Image Compression
```

如果适合浏览器执行：

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

而不是默认上传服务器。

这能够带来：

- 更低延迟
- 更少数据传输
- 更低服务端成本
- 更好的隐私
- 更好的离线潜力

但 Local Compute 不是所有 Capability 的强制要求。

如果某项能力无法合理地在浏览器执行，可以使用服务端执行。

---

## 九、Capability 底座必须稳定

这是整个项目的长期目标。

工具数量可能不断增长：

```text
10
 ↓
100
 ↓
1000
 ↓
10000
```

但底层 Capability Foundation 不应该跟着不断重构。

理想情况：

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

新增工具的主要工作应该是：

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

一个非常重要的架构判断标准是：

> **如果从 100 个工具增长到 1000 个工具，需要频繁修改底层能力基座，那么底座设计就需要重新审视。**

---

## 十、Capability 本身保持简单

第一阶段不把 Capability 设计成复杂的智能系统。

Capability 主要负责：

```text
Input
↓
Computation
↓
Output
```

例如：

```text
image.resize
```

只需要关心：

```text
Input:
Image

Parameters:
width
height
fit

Output:
Image
```

不需要在里面加入：

- LLM
- Agent
- 自动推理
- Workflow Engine
- 复杂状态管理

Capability 越确定、越独立，越容易跨端复用。

---

## 十一、暂时不做复杂 Workflow

项目第一阶段不需要为了“未来可能组合工具”而设计复杂 Workflow 系统。

因为不同 Capability 的输入输出未必天然兼容。

如果强行提前解决：

- 类型兼容
- 数据转换
- 顺序依赖
- 可交换操作
- 错误处理
- 中间状态

很容易导致底层架构过度复杂。

因此当前阶段：

> **优先把 Capability 做好，把大量独立工具快速建立起来。**

未来如果 Capability 足够丰富，可以利用 AI：

```text
用户需求
   ↓
AI
   ↓
选择 Capability
   ↓
决定是否需要多个能力
   ↓
生成执行过程
```

Workflow 可以作为未来能力，而不是当前基础设施。

---

## 十二、Database 不是核心依赖

大部分早期工具都是：

```text
Input
 ↓
Compute
 ↓
Output
```

属于一次性、无状态计算。

因此不需要为了 Capability 本身引入 Database。

未来如果出现：

- 用户账号
- 历史记录
- 收藏
- 保存 Workflow
- 使用统计
- 付费
- 用户配置

再增加对应的数据层。

Database 属于平台外围能力，而不是 Capability 执行的基础设施。

---

## 十三、AI 的位置

AI 不需要进入每一个 Capability。

更合理的长期结构是：

```text
                  User
                    ↓
                   AI
                    ↓
            Capability Registry
                    ↓
          Select / Invoke Capability
                    ↓
               Capability
```

也就是说：

**Capability 负责执行。**

**AI 负责理解、选择和组织。**

这样可以让 Capability 保持简单、确定和可复用。

---

## 十四、项目的六条核心原则

### 1. Multi-platform by Design

**能力单元从设计之初就面向多端复用。**

### 2. Reuse Before Reimplement

**不同端优先复用同一套底层实现逻辑。**

### 3. Pragmatic Consistency

**尽可能保持跨端行为一致，但允许合理的平台差异。**

### 4. Local Compute First

**Web 端在条件允许时优先本地计算。**

### 5. Stable Foundation

**Capability 底座必须稳定，工具数量增长不应该导致底座不断重构。**

### 6. Web Presentation Freedom

**Web 层负责产品体验，可以自由设计 UI、交互和技术栈，不反向约束 Capability。**

---

# 十五、最终的架构思想

整个项目可以理解为：

> **以 Capability 为核心，以多端消费为目标，以稳定的 Foundation 支撑持续扩展。**

```text
                         Capability Foundation
                                  │
                          ┌───────┴───────┐
                          │   Capability  │
                          │   Contract    │
                          │   Registry    │
                          │   Shared Impl │
                          └───────┬───────┘
                                  │
               ┌──────────────────┼──────────────────┐
               │                  │                  │
               ▼                  ▼                  ▼
          Web Adapter        API Adapter        MCP Adapter
               │                  │                  │
               ▼                  ▼                  ▼
          Web Product             API                MCP
```

### 核心原则

**1. Capability 是核心**

Capability 从设计之初就必须支持多端复用，而不是先做 Web，再从 Web 中抽象出来。

**2. 底层优先复用**

Web、API、MCP 等 Consumer 尽可能复用相同的底层实现逻辑。对于特殊运行环境，可以接受合理的平台差异。

**3. Web 保持自由**

Web 只是 Capability 的一种产品化表现，可以自由选择 Next、Vue、React 等技术栈，自由设计 UI 和交互，不应该反向影响底层 Foundation。

**4. Foundation 保持稳定**

从 100 个工具增长到 1000 个工具时，主要应该是不断增加 Capability，而不是不断修改底层能力基座。

因此最终的关系可以简单理解为：

```text
                    Capability
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
         Web            API            MCP
          │
     Web Product
```

**Capability 是中心，Foundation 负责稳定和复用，Adapter 负责连接，Consumer 负责具体使用和产品呈现。**

---

## 十六、一句话定义这个项目

> **一个以 Capability 为核心的在线工具平台：通过稳定的能力底座持续积累大量独立工具，使每个能力从设计之初就可以被多端复用，并尽可能共享底层实现；Web 端则作为自由的产品表现层，在保证本地计算优先的同时，可以独立选择技术栈和设计体验。**

最终希望形成的不是一个“工具网页集合”，而是：

> **一个可以持续积累能力、持续增加工具，而底层架构始终保持稳定的工具能力平台。**
