# Idea Pool

本文档是 Tool-Craft 自主迭代体系 Idea Pool 的说明文档。真正的 Idea 存储在 [pool.md](./pool.md)，这里定义 Idea 的格式规范、类型、来源和状态机规则。

## 配置

| 配置项 | 值 | 说明 |
| ------ | --- | ---- |
| `MAX_PENDING_IDEAS` | 10 | `Pending` 状态 Idea 的最大数量。达到上限后，需要先领取一些 Idea 才能添加新的。 |

## 更新规则

任何人都可以添加或更新 Idea：

1. Idea 可以自动生成（通过 [Idea Generation SOP](../../../docs/sop/idea-generation/idea-generation-sop.md)），也可以手动添加
2. 添加新 Idea 时，请在 [idea-pool.md](./idea-pool.md) 的表格末尾追加
3. 遵循本文档中的格式规范和状态规则
4. ID 使用当前时间 `YYYYMMDDHHmmss` 保证唯一性
5. 添加新 Idea 前，需要检查当前 `Pending` 状态 Idea 数量，不能超过配置的最大值

## 表格字段说明

| 字段              | 说明                       |
| --------------- | ------------------------ |
| `ID`            | 唯一标识，使用 `YYYYMMDDHHmmss` |
| `Idea`          | Idea 名称                  |
| `Description`   | 简要描述                     |
| `Type`          | Idea 类型                  |
| `Source`        | Idea 来源                  |
| `Status`        | 当前状态                     |
| `Created At`    | 创建时间                     |
| `Claimed By`    | 当前领取 Agent               |
| `Reject Reason` | 被拒绝时的原因                  |
| `Result`        | 完成后的结果                   |

## Idea Type

使用以下类型：

* `Web Tool`：具体 Web 工具
* `API`：API 能力
* `MCP`：MCP 能力

## Idea Source

使用以下来源：

* `Exploration`：探索发现
* `User Feedback`：用户反馈
* `Existing Gap`：现有能力缺口
* `Improvement`：现有能力改进
* `External Reference`：外部参考
* `Other`：其他来源

## Idea 状态机

Idea 必须遵循以下状态：

* `Pending`：待领取
* `Claimed`：已领取
* `In Progress`：研发中
* `Completed`：已完成
* `Rejected`：已拒绝

完整状态转换：

```text
                    ┌──────────────┐
                    │    Pending   │
                    └──────┬───────┘
                           │
                           │ 领取
                           ▼
                    ┌──────────────┐
                    │    Claimed   │
                    └──────┬───────┘
                           │
                           │ 开始研发
                           ▼
                    ┌──────────────┐
                    │  In Progress │
                    └──────┬───────┘
                           │
                  ┌────────┴────────┐
                  │                 │
                  │ 完成并验证        │ 无法继续
                  ▼                 ▼
           ┌──────────────┐  ┌──────────────┐
           │  Completed   │  │   Rejected   │
           └──────────────┘  └──────────────┘
```

允许的状态转换：

```text
Pending     → Claimed
Pending     → Rejected

Claimed     → In Progress
Claimed     → Rejected

In Progress → Completed
In Progress → Rejected
```

其中：
* `Completed` 是终态。
* `Rejected` 是终态。
* 终态不能继续转换到其他状态。

## Rejected 规则

Idea 在研发过程中如果发现无法继续，可以直接进入 `Rejected`，不要求回退到 `Pending`。

进入 `Rejected` 时必须填写 `Reject Reason`。

`Rejected` 表示：**当前这个 Idea 不再继续执行**。它不代表未来永远不能重新尝试。

如果未来条件发生变化，需要重新考虑该方向：**创建一个新的 Idea，而不是把旧 Idea 从 `Rejected` 修改成 `Pending`**。
