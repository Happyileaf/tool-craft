# Idea Pool（创意池）

> 本文件是创意池的**唯一活动台账**：新 Idea 追加到「Active Pending Ideas」末尾，状态变更只改本文件与 `idea-details/<ID>.md`，**不移动、不重命名详情文件**；归档只在本文件内移动条目区块。
>
> **状态机**：`Pending`（待领取，在本文件 Active 区）→ `Claimed`（已领取，仍留 Active 区）→ `Completed` / `Rejected`（完成或拒绝，移动到本文件对应归档区，详情文件留在 `idea-details/` 原地）。
>
> ID 与 `idea-details/<ID>.md` 一一对应、永久绑定，归档不重新分配 ID。字段与状态机的权威定义见 `README.md` 与 `../sop/idea-generation/idea-generation-sop.md`；本文件只存当前状态与归档索引。

## Active Pending Ideas（待领取 / 进行中）

> 状态为 Pending 或 Claimed 的 Idea 全部保留在本区，按创建时间升序排列。
> Claimed 条目必须填写 Claimed By / 轮次 ID / 分支 / 工具 slug（与详情文件一致）。

- （暂无活动 Idea；2026-11-12 轮次 20261112000140 领取的 5 个 Idea 已全部完成并归档至下方 Completed 区）

## Completed Ideas（已完成归档）

> 从 Active 区原样迁移的已完成 Idea，最新完成的排在**本区最前面**；条目内字段保持完成时状态，详情见 `idea-details/<ID>.md`。

### 2026-11-12 完成（轮次 20261112000140，PR #210）

- **[20261028081033] 以太坊地址 EIP-55 校验和编码与校验器**
  - 状态：Completed ｜ 类型：Web Tool ｜ 来源：Existing Gap
  - Claimed By：trae-agent ｜ 轮次 ID：20261112000140 ｜ 分支：feat/tool-development-20261112000140-trae-agent
  - 工具 slug：eip55-address-checksum ｜ PR：https://github.com/xianlaoban/tool-craft/pull/210
  - 详情：[idea-details/20261028081033.md](./idea-details/20261028081033.md)

- **[20261031080656] MRZ 机读旅行证件校验器（TD1 / TD2 / TD3 护照机读码校验）**
  - 状态：Completed ｜ 类型：Web Tool ｜ 来源：External Reference
  - Claimed By：trae-agent ｜ 轮次 ID：20261112000140 ｜ 分支：feat/tool-development-20261112000140-trae-agent
  - 工具 slug：mrz-checksum-validator ｜ PR：https://github.com/xianlaoban/tool-craft/pull/210
  - 详情：[idea-details/20261031080656.md](./idea-details/20261031080656.md)

- **[20261101140216] TypeID 标识符生成与解析器（typeid 规范）**
  - 状态：Completed ｜ 类型：Web Tool ｜ 来源：External Reference
  - Claimed By：trae-agent ｜ 轮次 ID：20261112000140 ｜ 分支：feat/tool-development-20261112000140-trae-agent
  - 工具 slug：typeid-codec ｜ PR：https://github.com/xianlaoban/tool-craft/pull/210
  - 详情：[idea-details/20261101140216.md](./idea-details/20261101140216.md)

- **[20261031201039] 定点数 Qm.n / Q 格式转换与运算可视化器**
  - 状态：Completed ｜ 类型：Web Tool ｜ 来源：Existing Gap
  - Claimed By：trae-agent ｜ 轮次 ID：20261112000140 ｜ 分支：feat/tool-development-20261112000140-trae-agent
  - 工具 slug：fixed-point-q-converter ｜ PR：https://github.com/xianlaoban/tool-craft/pull/210
  - 详情：[idea-details/20261031201039.md](./idea-details/20261031201039.md)

- **[20261109020214] APR 实际年利率计算器（EAR 等效年费率与贷款成本对比）**
  - 状态：Completed ｜ 类型：Web Tool ｜ 来源：Existing Gap
  - Claimed By：trae-agent ｜ 轮次 ID：20261112000140 ｜ 分支：feat/tool-development-20261112000140-trae-agent
  - 工具 slug：apr-ear-calculator ｜ PR：https://github.com/xianlaoban/tool-craft/pull/210
  - 详情：[idea-details/20261109020214.md](./idea-details/20261109020214.md)

### 2026-11-09 完成

- **[20261109081157] RLE 游程编码编解码器（PackBits 兼容）**
  - 状态：Completed ｜ 类型：Web Tool ｜ 来源：External Reference
  - Claimed By：trae-agent ｜ 轮次 ID：20261109001148 ｜ 分支：feat/tool-development-20261109001148-trae-agent
  - 工具 slug：rle-codec ｜ PR：https://github.com/xianlaoban/tool-craft/pull/193
  - 详情：[idea-details/20261109081157.md](./idea-details/20261109081157.md)

- **[20261109083312] 哈夫曼编码可视化器（Huffman Coding Tree）**
  - 状态：Completed ｜ 类型：Web Tool ｜ 来源：Existing Gap
  - Claimed By：trae-agent ｜ 轮次 ID：20261109001148 ｜ 分支：feat/tool-development-20261109001148-trae-agent
  - 工具 slug：huffman-coding-visualizer ｜ PR：https://github.com/xianlaoban/tool-craft/pull/193
  - 详情：[idea-details/20261109083312.md](./idea-details/20261109083312.md)

- **[20261109084803] 国际标准连续出版物号 ISSN 校验器**
  - 状态：Completed ｜ 类型：Web Tool ｜ 来源：External Reference
  - Claimed By：trae-agent ｜ 轮次 ID：20261109001148 ｜ 分支：feat/tool-development-20261109001148-trae-agent
  - 工具 slug：issn-validator ｜ PR：https://github.com/xianlaoban/tool-craft/pull/193
  - 详情：[idea-details/20261109084803.md](./idea-details/20261109084803.md)

- **[20261109090225] LED 限流电阻计算器**
  - 状态：Completed ｜ 类型：Web Tool ｜ 来源：Existing Gap
  - Claimed By：trae-agent ｜ 轮次 ID：20261109001148 ｜ 分支：feat/tool-development-20261109001148-trae-agent
  - 工具 slug：led-resistor-calculator ｜ PR：https://github.com/xianlaoban/tool-craft/pull/193
  - 详情：[idea-details/20261109090225.md](./idea-details/20261109090225.md)

- **[20261109091733] logfmt 日志格式解析器**
  - 状态：Completed ｜ 类型：Web Tool ｜ 来源：Existing Gap
  - Claimed By：trae-agent ｜ 轮次 ID：20261109001148 ｜ 分支：feat/tool-development-20261109001148-trae-agent
  - 工具 slug：logfmt-parser ｜ PR：https://github.com/xianlaoban/tool-craft/pull/193
  - 详情：[idea-details/20261109091733.md](./idea-details/20261109091733.md)

### 2026-11-06 完成

- **[20261031111038] LRC 纵向冗余校验计算器**
  - 状态：Completed ｜ 类型：Web Tool ｜ 来源：External Reference
  - Claimed By：trae-agent ｜ 轮次 ID：20261106001528 ｜ 分支：feat/tool-development-20261106001528-trae-agent
  - 工具 slug：lrc-checksum ｜ PR：https://github.com/xianlaoban/tool-craft/pull/173
  - 详情：[idea-details/20261031111038.md](./idea-details/20261031111038.md)

- **[20261105091830] 阿德勒 Adler-32 校验和计算器**
  - 状态：Completed ｜ 类型：Web Tool ｜ 来源：External Reference
  - Claimed By：trae-agent ｜ 轮次 ID：20261106001528 ｜ 分支：feat/tool-development-20261106001528-trae-agent
  - 工具 slug：adler32-checksum ｜ PR：https://github.com/xianlaoban/tool-craft/pull/173
  - 详情：[idea-details/20261105091830.md](./idea-details/20261105091830.md)

- **[20261106075530] Bencode 编解码练习沙盒**
  - 状态：Completed ｜ 类型：Web Tool ｜ 来源：Existing Gap
  - Claimed By：trae-agent ｜ 轮次 ID：20261106001528 ｜ 分支：feat/tool-development-20261106001528-trae-agent
  - 工具 slug：bencode-playground ｜ PR：https://github.com/xianlaoban/tool-craft/pull/173
  - 详情：[idea-details/20261106075530.md](./idea-details/20261106075530.md)

- **[20261106083104] TOML 与 JSON / YAML 互转器**
  - 状态：Completed ｜ 类型：Web Tool ｜ 来源：Existing Gap
  - Claimed By：trae-agent ｜ 轮次 ID：20261106001528 ｜ 分支：feat/tool-development-20261106001528-trae-agent
  - 工具 slug：toml-converter ｜ PR：https://github.com/xianlaoban/tool-craft/pull/173
  - 详情：[idea-details/20261106083104.md](./idea-details/20261106083104.md)

- **[20261106084517] JSONPath 查询练习器**
  - 状态：Completed ｜ 类型：Web Tool ｜ 来源：Existing Gap
  - Claimed By：trae-agent ｜ 轮次 ID：20261106001528 ｜ 分支：feat/tool-development-20261106001528-trae-agent
  - 工具 slug：jsonpath-tester ｜ PR：https://github.com/xianlaoban/tool-craft/pull/173
  - 详情：[idea-details/20261106084517.md](./idea-details/20261106084517.md)

## Rejected Ideas（已拒绝归档）

> 从 Active 区原样迁移的被拒绝 Idea，最新拒绝的排在**本区最前面**；拒绝理由与复核记录见详情文件。

- （暂无已拒绝 Idea）
