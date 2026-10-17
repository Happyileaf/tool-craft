# Idea 池（活动索引）

> 本文件是所有**未终态 Idea**的唯一活动索引，由「Idea Generation SOP」（`docs/sop/idea-generation/idea-generation-sop.md`）与「Tool Development SOP」（`docs/sop/tool-development/tool-development-sop.md`）共同维护。格式规范、类型、来源与状态机见 [README.md](./README.md)。

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
| 20261017100231 | JSON to TypeScript interface generator | Web Tool | Existing Gap | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017100231.md) |
| 20261017100232 | Text case converter | Web Tool | Exploration | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017100232.md) |
| 20261017100233 | Number base and bit converter | Web Tool | Exploration | Claimed | 2026-10-17 | trae-agent | [详情](./idea-details/20261017100233.md) |
| 20261017100234 | TOTP (2FA) code generator | Web Tool | Existing Gap | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017100234.md) |
| 20261017100237 | CIDR / IP subnet calculator | Web Tool | Exploration | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017100237.md) |
| 20261017100238 | cURL to code converter | Web Tool | Exploration | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017100238.md) |
| 20261017125916 | URL parser & query string editor | Web Tool | Exploration | Claimed | 2026-10-17 | trae-agent | [详情](./idea-details/20261017125916.md) |
| 20261017125917 | Line operations (sort, dedupe, reverse, filter) | Web Tool | Existing Gap | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017125917.md) |
| 20261017125919 | Random data generator | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017125919.md) |
| 20261017140151 | Unix file permission (chmod) calculator | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017140151.md) |
| 20261017140152 | .gitignore generator | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017140152.md) |
| 20261017140153 | User-Agent parser | Web Tool | Existing Gap | Pending | 2026-10-17 | | [详情](./idea-details/20261017140153.md) |
| 20261017140154 | Base32 encoder/decoder | Web Tool | Existing Gap | Claimed | 2026-10-17 | trae-agent | [详情](./idea-details/20261017140154.md) |
| 20261017140155 | Programming string literal escape/unescape | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017140155.md) |
| 20261017140156 | Barcode generator | Web Tool | External Reference | Pending | 2026-10-17 | | [详情](./idea-details/20261017140156.md) |
| 20261017140158 | Date & business day calculator | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017140158.md) |
| 20261017140159 | .env parser & converter | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017140159.md) |
| 20261017160148 | ULID generator | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017160148.md) |
| 20261017160149 | CSS unit converter (px / rem / em / pt) | Web Tool | Existing Gap | Pending | 2026-10-17 | | [详情](./idea-details/20261017160149.md) |
| 20261017160151 | Semantic version (SemVer) parser & comparator | Web Tool | Exploration | Claimed | 2026-10-17 | trae-agent | [详情](./idea-details/20261017160151.md) |
| 20261017160152 | Unit & measurement converter | Web Tool | Existing Gap | Pending | 2026-10-17 | | [详情](./idea-details/20261017160152.md) |
| 20261017160153 | Unicode character inspector & invisible character detector | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017160153.md) |
| 20261017183430 | RSA / 非对称密钥对生成器与加解密 | Web Tool | Existing Gap | Pending | 2026-10-17 | | [详情](./idea-details/20261017183430.md) |
| 20261017183431 | Base58 & Base58Check 编解码器 | Web Tool | Existing Gap | Pending | 2026-10-17 | | [详情](./idea-details/20261017183431.md) |
| 20261017183432 | 摩尔斯电码编解码器 | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017183432.md) |
| 20261017183433 | ROT13 与凯撒密码 | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017183433.md) |
| 20261017183434 | 数字转中文大写金额 | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017183434.md) |
| 20261017183435 | Punycode / IDN 域名转换器 | Web Tool | Existing Gap | Pending | 2026-10-17 | | [详情](./idea-details/20261017183435.md) |
| 20261017183436 | HTTP 状态码速查 | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017183436.md) |
| 20261017183437 | 百分比计算器 | Web Tool | Existing Gap | Pending | 2026-10-17 | | [详情](./idea-details/20261017183437.md) |
| 20261017183438 | 图片与 Base64 Data URI 互转 | Web Tool | Existing Gap | Pending | 2026-10-17 | | [详情](./idea-details/20261017183438.md) |
| 20261017183439 | IEEE 754 浮点数转换器 | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017183439.md) |
| 20261017200232 | 字符集解码与乱码修复 | Web Tool | Existing Gap | Pending | 2026-10-17 | | [详情](./idea-details/20261017200232.md) |
| 20261017200233 | 数学表达式求值器 | Web Tool | Existing Gap | Pending | 2026-10-17 | | [详情](./idea-details/20261017200233.md) |
| 20261017200234 | 描述性统计计算器 | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017200234.md) |
| 20261017200235 | 最大公约数 / 最小公倍数 / 质因数分解计算器 | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017200235.md) |
| 20261017200236 | CSS 缓动函数（cubic-bezier）生成器 | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017200236.md) |
| 20261017200237 | JSONPath 查询表达式求值器 | Web Tool | Existing Gap | Pending | 2026-10-17 | | [详情](./idea-details/20261017200237.md) |
| 20261017200238 | Markdown 表格生成器 | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017200238.md) |
| 20261017200239 | robots.txt 生成器 | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017200239.md) |
| 20261017200240 | MIME 类型速查与识别 | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017200240.md) |
| 20261017200241 | Emoji 表情检索与复制 | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017200241.md) |
| 20261017220041 | 罗马数字转换器 | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017220041.md) |
| 20261017220042 | 银行卡号校验与卡种识别 | Web Tool | Existing Gap | Pending | 2026-10-17 | | [详情](./idea-details/20261017220042.md) |
| 20261017220043 | 地理坐标格式转换（十进制 ↔ 度分秒） | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017220043.md) |
| 20261017220044 | 数字千分位与货币格式化 | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017220044.md) |
| 20261017220045 | vCard（VCF）名片生成器 | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017220045.md) |
| 20261017220046 | 敏感信息脱敏（PII 掩码） | Web Tool | Existing Gap | Pending | 2026-10-17 | | [详情](./idea-details/20261017220046.md) |
| 20261017220047 | 开源许可证生成器 | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017220047.md) |
| 20261017220048 | HTTP 安全响应头生成器（CSP / HSTS 等） | Web Tool | Existing Gap | Pending | 2026-10-17 | | [详情](./idea-details/20261017220048.md) |
| 20261017220049 | 列表集合运算（交集 / 并集 / 差集） | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017220049.md) |
| 20261017220050 | 小数与分数互转 | Web Tool | Exploration | Pending | 2026-10-17 | | [详情](./idea-details/20261017220050.md) |
| 20261018000141 | CSS 选择器权重计算器 | Web Tool | Existing Gap | Pending | 2026-10-18 | | [详情](./idea-details/20261018000141.md) |
| 20261018000142 | Open Graph / SEO 元标签生成器 | Web Tool | Exploration | Pending | 2026-10-18 | | [详情](./idea-details/20261018000142.md) |
| 20261018000143 | JSON 结构化差异对比 | Web Tool | Existing Gap | Pending | 2026-10-18 | | [详情](./idea-details/20261018000143.md) |
| 20261018000144 | ISO 8601 时长解析与格式化 | Web Tool | Exploration | Pending | 2026-10-18 | | [详情](./idea-details/20261018000144.md) |
| 20261018000145 | MAC 地址格式转换与校验 | Web Tool | Exploration | Pending | 2026-10-18 | | [详情](./idea-details/20261018000145.md) |
| 20261018000146 | Markdown 目录（TOC）生成器 | Web Tool | Exploration | Pending | 2026-10-18 | | [详情](./idea-details/20261018000146.md) |
| 20261018000147 | CSV 转 SQL INSERT 生成器 | Web Tool | Existing Gap | Pending | 2026-10-18 | | [详情](./idea-details/20261018000147.md) |
| 20261018000148 | 哈希类型识别器 | Web Tool | Existing Gap | Pending | 2026-10-18 | | [详情](./idea-details/20261018000148.md) |
| 20261018000149 | CSS clamp() 流式排版生成器 | Web Tool | Exploration | Pending | 2026-10-18 | | [详情](./idea-details/20261018000149.md) |
