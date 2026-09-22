# Idea Generation SOP

## 概述

本文档定义了 Tool-Craft 自主迭代体系中 Idea 生成的标准流程。

### 目的

建立一个独立的 Idea 生成机制，使 Tool-Craft 可以：
1. 定期探索项目当前状态、已有能力和潜在需求
2. 发现值得实现的新 Idea
3. 对发现的 Idea 进行基本整理和去重
4. 将有效 Idea 放入统一的 Idea Pool
5. 由后续独立的 Development SOP 从 Idea Pool 中获取并实现

### 整体关系

```text
┌──────────────────────┐
│   Idea Generation    │
│        SOP           │
└──────────┬───────────┘
           │
           │ 产生 / 整理
           ▼
┌──────────────────────┐
│      Idea Pool       │
│                      │
│      Pending         │
│      Claimed         │
│      In Progress     │
│      Completed       │
│      Rejected        │
└──────────┬───────────┘
           │
           │ 获取 Idea
           ▼
┌──────────────────────┐
│ Development SOP      │
│                      │
│ 评估 → 实现 → 验证    │
│ → 变更日志 → PR       │
└──────────────────────┘
```

## 流程

```text
探索
 ↓
发现候选想法
 ↓
理解问题 / 机会
 ↓
检查已有能力与已有 Idea
 ↓
去重
 ↓
形成明确 Idea
 ↓
写入 Idea Pool
```

### 1. 探索

Idea Generator 可以从以下方向探索：

* 当前 Tool-Craft 已有能力
* 当前 Web Tools
* Capability 体系
* API / MCP 能力
* 已有工具之间的能力缺口
* 常见用户需求
* 工具使用过程中的体验问题
* 可以通过本地计算解决的问题
* 外部工具或产品提供的有价值能力
* 项目自身的发展方向

探索的目标是：**找到值得 Tool-Craft 考虑的新增能力或改进机会**。

> 不要为了产生数量而机械制造 Idea。

### 2. 候选 Idea

发现一个可能值得做的方向后，需要先判断：

* 是否能够明确描述？
* 是否确实解决某个问题？
* 是否与 Tool-Craft 的定位相关？
* 是否已经存在相同或高度相似的能力？
* 是否已经存在相同或高度相似的 Idea？

如果只是模糊想法，不要立即写入 Idea Pool。

### 3. 去重

写入 Idea Pool 前必须检查：

1. Tool-Craft 当前已经实现的能力。
2. Idea Pool 中已有的 Idea。
3. 已经 `Completed` 的历史 Idea。
4. 已经 `Rejected` 的历史 Idea。

如果发现已有相同或高度相似 Idea：
> 不创建重复 Idea。

如果一个已经 `Rejected` 的 Idea 因为新的条件发生变化而重新值得考虑：
> 创建一个新的 Idea，而不是修改历史 `Rejected` Idea。

### 4. Idea 的粒度

一个 Idea 应当能够独立成为一个研发任务。

例如：
```text
JSON 格式化
图片尺寸调整
Base64 编解码
时间戳转换
颜色格式转换
```

而不要写成：
```text
把 Tool-Craft 做得更好
增加更多工具
优化用户体验
```

Idea 应回答：**具体想增加什么能力或解决什么问题？**

形成 Idea 时，请遵循 [Idea Pool README](../../../.autonomous/idea-pool/README.md) 中定义的格式规范和状态规则。

## 并发与协作规则

当前 Idea Pool 存储在 Git 仓库中，Idea 可以由 Idea Generator 自动生成，也可以由开发者手动添加。任何人都可以添加 Idea 到 Idea Pool。

自动生成 Idea 写入前：
1. 读取最新的 `.autonomous/idea-pool/idea-pool.md`。
2. 检查是否存在重复 Idea。
3. 检查是否已经有人添加了相同 Idea。
4. 再写入新的 Idea。

## 文件职责边界

```text
docs/sop/idea-generation/
│
└── idea-generation-sop.md
          │
          └── 定义「如何产生 Idea」（只包含生成流程和生成规则）

.autonomous/
│
└── idea-pool/
        │
        ├── README.md
        │   │
        │   └── 定义 Idea 格式规范、类型、来源和状态机（由 Idea 本身遵循）
        │
        └── idea-pool.md
            │
            └── 保存「现在有哪些 Idea 以及它们处于什么状态」
```

不要将以下内容加入 `idea-pool.md`:
* 详细技术方案
* 代码实现步骤
* 详细测试方案
* 工时估算
* 复杂优先级系统
* 数据库设计
* Agent 思考过程

这些内容属于后续 Development SOP.