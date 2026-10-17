# Idea 池（活动索引）

> 本文件是所有**未终态 Idea** 的唯一活动索引，由「Idea Generation SOP」（`docs/sop/idea-generation/idea-generation-sop.md`）与「Tool Development SOP」（`docs/sop/tool-development/tool-development-sop.md`）共同维护。格式规范、类型、来源与状态机见 [README.md](./README.md)。

## 规则

- 只有状态为 `Pending`、`Claimed`、`In Progress` 的 Idea 出现在本表，并占用 Idea 池容量。
- `Completed` / `Rejected` 必须从本表移除，分别归档至 [completed.md](./completed.md) / [rejected.md](./rejected.md)，不再占用容量；详情文件保留在 `idea-details/` 中，原始 ID 不删除、不复用。
- 每行的「状态」必须与对应详情文档中的状态严格一致；描述、设计内容与验收标准写在详情文件中，本表只保留索引字段。
- 容量上限以 README 配置（`MAX_PENDING_IDEAS`）为准，只统计 `Pending` 状态的 Idea。
- 详情链接使用相对路径 `./idea-details/<ID>.md`，新增或移动文件时必须保持链接有效。

## Idea 列表

| ID | Idea | Type | Source | Status | Created At | Claimed By | 详情 |
|---|---|---|---|---|---|---|---|
| 20260928103001 | CSV to JSON/JSON to CSV converter | Web Tool | Exploration | In Progress | 2026-09-28 | trae-agent | [详情](./idea-details/20260928103001.md) |
| 20260928103002 | CSS prefixer | Web Tool | Exploration | Pending | 2026-09-28 | | [详情](./idea-details/20260928103002.md) |
| 20260928103003 | Regular expression generator | Web Tool | Existing Gap | Pending | 2026-09-28 | | [详情](./idea-details/20260928103003.md) |
| 20260928103005 | HTML entity encoder/decoder | Web Tool | Exploration | In Progress | 2026-09-28 | trae-agent | [详情](./idea-details/20260928103005.md) |
| 20260928103007 | Lorem Ipsum generator | Web Tool | Exploration | In Progress | 2026-09-28 | trae-agent | [详情](./idea-details/20260928103007.md) |
| 20260928103009 | CRON expression parser | Web Tool | Exploration | In Progress | 2026-09-28 | trae-agent | [详情](./idea-details/20260928103009.md) |
| 20261017075143 | JSON to YAML converter | Web Tool | Existing Gap | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017075143.md) |
| 20261017100231 | JSON to TypeScript interface generator | Web Tool | Existing Gap | Claimed | 2026-10-17 | trae-agent | [详情](./idea-details/20261017100231.md) |
| 20261017100232 | Text case converter | Web Tool | Exploration | Claimed | 2026-10-17 | trae-agent | [详情](./idea-details/20261017100232.md) |
| 20261017100233 | Number base and bit converter | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017100233.md) |
| 20261017100234 | TOTP (2FA) code generator | Web Tool | Existing Gap | Claimed | 2026-10-17 | trae-agent | [详情](./idea-details/20261017100234.md) |
| 20261017100236 | X.509 certificate decoder | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017100236.md) |
| 20261017100237 | CIDR / IP subnet calculator | Web Tool | Exploration | Claimed | 2026-10-17 | trae-agent | [详情](./idea-details/20261017100237.md) |
| 20261017100238 | cURL to code converter | Web Tool | Exploration | Claimed | 2026-10-17 | trae-agent | [详情](./idea-details/20261017100238.md) |
