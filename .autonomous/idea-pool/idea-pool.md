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
| 20261017125919 | Random data generator | Web Tool | Exploration | Claimed | 2026-10-17 | trae-agent | [详情](./idea-details/20261017125919.md) |
| 20261017140151 | Unix file permission (chmod) calculator | Web Tool | Exploration | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017140151.md) |
| 20261017140152 | .gitignore generator | Web Tool | Exploration | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017140152.md) |
| 20261017140154 | Base32 encoder/decoder | Web Tool | Existing Gap | Claimed | 2026-10-17 | trae-agent | [详情](./idea-details/20261017140154.md) |
| 20261017140155 | Programming string literal escape/unescape | Web Tool | Exploration | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017140155.md) |
| 20261017160149 | CSS unit converter (px / rem / em / pt) | Web Tool | Existing Gap | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017160149.md) |
| 20261017160151 | Semantic version (SemVer) parser & comparator | Web Tool | Exploration | Claimed | 2026-10-17 | trae-agent | [详情](./idea-details/20261017160151.md) |
| 20261017160152 | Unit & measurement converter | Web Tool | Existing Gap | Claimed | 2026-10-17 | trae-agent | [详情](./idea-details/20261017160152.md) |
| 20261017160153 | Unicode character inspector & invisible character detector | Web Tool | Exploration | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017160153.md) |
| 20261017183430 | RSA / 非对称密钥对生成器与加解密 | Web Tool | Existing Gap | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017183430.md) |
| 20261017183431 | Base58 & Base58Check 编解码器 | Web Tool | Existing Gap | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017183431.md) |
| 20261017183432 | 摩尔斯电码编解码器 | Web Tool | Exploration | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017183432.md) |
| 20261017183434 | 数字转中文大写金额 | Web Tool | Exploration | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017183434.md) |
| 20261017183437 | 百分比计算器 | Web Tool | Existing Gap | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017183437.md) |
| 20261017183438 | 图片与 Base64 Data URI 互转 | Web Tool | Existing Gap | Claimed | 2026-10-17 | trae-agent | [详情](./idea-details/20261017183438.md) |
| 20261017200232 | 字符集解码与乱码修复 | Web Tool | Existing Gap | Pending | 2026-10-17 | | [详情](./idea-details/20261017200232.md) |
| 20261017200238 | Markdown 表格生成器 | Web Tool | Exploration | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017200238.md) |
| 20261017200239 | robots.txt 生成器 | Web Tool | Exploration | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017200239.md) |
| 20261017200240 | MIME 类型速查与识别 | Web Tool | Exploration | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017200240.md) |
| 20261017220043 | 地理坐标格式转换（十进制 ↔ 度分秒） | Web Tool | Exploration | In Progress | 2026-10-31 | trae-agent | [详情](./idea-details/20261017220043.md) |
| 20261017220045 | vCard（VCF）名片生成器 | Web Tool | Exploration | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017220045.md) |
| 20261017220047 | 开源许可证生成器 | Web Tool | Exploration | Claimed | 2026-10-17 | trae-agent | [详情](./idea-details/20261017220047.md) |
| 20261017220048 | HTTP 安全响应头生成器（CSP / HSTS 等） | Web Tool | Existing Gap | In Progress | 2026-10-17 | trae-agent @ 2026-11-03 18:05 CST | [详情](./idea-details/20261017220048.md) |
| 20261017220049 | 列表集合运算（交集 / 并集 / 差集） | Web Tool | Exploration | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017220049.md) |
| 20261017220050 | 小数与分数互转 | Web Tool | Exploration | In Progress | 2026-10-17 | trae-agent | [详情](./idea-details/20261017220050.md) |
| 20261018000142 | Open Graph / SEO 元标签生成器 | Web Tool | Exploration | In Progress | 2026-10-18 | trae-agent @ 2026-11-03 18:05 CST | [详情](./idea-details/20261018000142.md) |
| 20261018000143 | JSON 结构化差异对比 | Web Tool | Existing Gap | In Progress | 2026-10-18 | trae-agent | [详情](./idea-details/20261018000143.md) |
| 20261018000145 | MAC 地址格式转换与校验 | Web Tool | Exploration | In Progress | 2026-10-18 | trae-agent | [详情](./idea-details/20261018000145.md) |
| 20261018000146 | Markdown 目录（TOC）生成器 | Web Tool | Exploration | In Progress | 2026-10-18 | trae-agent | [详情](./idea-details/20261018000146.md) |
| 20261018000148 | 哈希类型识别器 | Web Tool | Existing Gap | In Progress | 2026-10-18 | trae-agent | [详情](./idea-details/20261018000148.md) |
| 20261018000149 | CSS clamp() 流式排版生成器 | Web Tool | Exploration | Claimed | 2026-10-18 | trae-agent | [详情](./idea-details/20261018000149.md) |
| 20261021180759 | JSON flatten / unflatten（嵌套对象与点路径互转） | Web Tool | Existing Gap | In Progress | 2026-10-21 | trae-agent | [详情](./idea-details/20261021180759.md) |
| 20261021180800 | Cookie 字符串解析与生成器 | Web Tool | Exploration | In Progress | 2026-10-21 | trae-agent | [详情](./idea-details/20261021180800.md) |
| 20261021180803 | 贷款 / 月供计算器（等额本息与等额本金） | Web Tool | Exploration | In Progress | 2026-10-21 | trae-agent | [详情](./idea-details/20261021180803.md) |
| 20261021180804 | JSON to CSV flatten 导出（嵌套数组展开） | Web Tool | Existing Gap | Pending | 2026-10-21 | | [详情](./idea-details/20261021180804.md) |
| 20261021221301 | 本地文件哈希校验（拖拽文件计算 MD5/SHA 校验和） | Web Tool | Existing Gap | Pending | 2026-10-21 | | [详情](./idea-details/20261021221301.md) |
| 20261021221302 | UUID 解析校验器（版本/变体/时间戳提取与合法性检查） | Web Tool | Existing Gap | In Progress | 2026-10-21 | trae-agent | [详情](./idea-details/20261021221302.md) |
| 20261021221303 | Favicon 生成器（图片导出多尺寸 PNG 与 .ico） | Web Tool | Exploration | Pending | 2026-10-21 | | [详情](./idea-details/20261021221303.md) |
| 20261021221304 | Flexbox 布局可视化生成器（输出 CSS） | Web Tool | Exploration | Pending | 2026-10-21 | | [详情](./idea-details/20261021221304.md) |
| 20261021221306 | IBAN 银行账号校验与格式化（校验位算法） | Web Tool | External Reference | In Progress | 2026-10-21 | trae-agent | [详情](./idea-details/20261021221306.md) |
| 20261021221308 | docker run 命令转 docker-compose.yml | Web Tool | External Reference | Pending | 2026-10-21 | | [详情](./idea-details/20261021221308.md) |
| 20261022221403 | 全角/半角字符批量转换器 | Web Tool | Existing Gap | In Progress | 2026-10-22 | trae-agent | [详情](./idea-details/20261022221403.md) |
| 20261022221408 | ASCII 文件树生成器 | Web Tool | Exploration | In Progress | 2026-10-22 | trae-agent | [详情](./idea-details/20261022221408.md) |
| 20261022221409 | ANSI 终端颜色码生成器 | Web Tool | Exploration | In Progress | 2026-10-31 | trae-agent | [详情](./idea-details/20261022221409.md) |
| 20261023020508 | iCalendar (.ics) 日历事件文件生成器 | Web Tool | Exploration | Pending | 2026-10-23 | | [详情](./idea-details/20261023020508.md) |
| 20261023020509 | Web App Manifest 生成器 | Web Tool | Existing Gap | In Progress | 2026-10-23 | trae-agent | [详情](./idea-details/20261023020509.md) |
| 20261023020510 | CSS 形状生成器 | Web Tool | Exploration | Pending | 2026-10-23 | | [详情](./idea-details/20261023020510.md) |
| 20261023020513 | sitemap.xml 生成器 | Web Tool | Existing Gap | In Progress | 2026-10-23 | trae-agent | [详情](./idea-details/20261023020513.md) |
| 20261023020514 | 占位图片生成器 | Web Tool | External Reference | Pending | 2026-10-23 | | [详情](./idea-details/20261023020514.md) |
| 20261023040530 | CSS Grid 布局可视化生成器 | Web Tool | Existing Gap | Pending | 2026-10-23 | | [详情](./idea-details/20261023040530.md) |
| 20261023040531 | SVG 源码预览与 PNG 导出 | Web Tool | Existing Gap | Pending | 2026-10-23 | | [详情](./idea-details/20261023040531.md) |
| 20261023040532 | CSS @keyframes 动画生成器 | Web Tool | Existing Gap | Pending | 2026-10-23 | | [详情](./idea-details/20261023040532.md) |
| 20261023040533 | 排列组合计算器 | Web Tool | Exploration | In Progress | 2026-10-23 | trae-agent | [详情](./idea-details/20261023040533.md) |
| 20261023040535 | nginx server 配置生成器 | Web Tool | External Reference | Pending | 2026-10-23 | | [详情](./idea-details/20261023040535.md) |
| 20261023040539 | ISBN-10 ↔ ISBN-13 校验与互转 | Web Tool | Exploration | In Progress | 2026-10-23 | trae-agent | [详情](./idea-details/20261023040539.md) |
| 20261023081556 | CHANGELOG.md 生成器（Keep a Changelog） | Web Tool | Exploration | Pending | 2026-10-23 | | [详情](./idea-details/20261023081556.md) |
| 20261023141142 | CSS transform 矩阵计算器 | Web Tool | Existing Gap | Pending | 2026-10-23 | | [详情](./idea-details/20261023141142.md) |
| 20261023141143 | 日出日落与晨昏时刻计算器 | Web Tool | Existing Gap | Pending | 2026-10-23 | | [详情](./idea-details/20261023141143.md) |
| 20261023141144 | 屏幕 PPI / 像素密度计算器 | Web Tool | Existing Gap | In Progress | 2026-10-23 | trae-agent | [详情](./idea-details/20261023141144.md) |
| 20261023141145 | 文件下载时间估算器 | Web Tool | Exploration | In Progress | 2026-10-23 | trae-agent | [详情](./idea-details/20261023141145.md) |
| 20261023141146 | JSON-LD 结构化数据生成器 | Web Tool | Existing Gap | Pending | 2026-10-23 | | [详情](./idea-details/20261023141146.md) |
| 20261023141147 | BPM 音符时长与延迟时间计算器 | Web Tool | Exploration | In Progress | 2026-10-23 | trae-agent | [详情](./idea-details/20261023141147.md) |
| 20261023200245 | OAuth2 PKCE 生成器（code_verifier / code_challenge） | Web Tool | Existing Gap | In Progress | 2026-10-23 | trae-agent | [详情](./idea-details/20261023200245.md) |
| 20261026020134 | Ascii85 / Base85 编解码器 | Web Tool | Existing Gap | In Progress | 2026-10-26 | trae-agent | [详情](./idea-details/20261026020134.md) |
| 20261026020135 | 统一社会信用代码校验与解析器 | Web Tool | Exploration | In Progress | 2026-10-26 | trae-agent | [详情](./idea-details/20261026020135.md) |
| 20261026020137 | 密码学安全随机整数 / 抽签 / 分组 / 洗牌工具 | Web Tool | Exploration | In Progress | 2026-10-26 | trae-agent | [详情](./idea-details/20261026020137.md) |
| 20261026020139 | JSON ↔ JSON Lines（NDJSON）互转器 | Web Tool | Existing Gap | In Progress | 2026-10-26 | trae-agent | [详情](./idea-details/20261026020139.md) |
| 20261026082024 | Nano ID 字符串标识符生成器 | Web Tool | Existing Gap | In Progress | 2026-10-26 | trae-agent | [详情](./idea-details/20261026082024.md) |
| 20261026082025 | Base45（RFC 9285）编解码器 | Web Tool | Existing Gap | In Progress | 2026-10-26 | trae-agent | [详情](./idea-details/20261026082025.md) |
| 20261026082026 | Bencode 编解码器（.torrent 数据解析与生成） | Web Tool | External Reference | In Progress | 2026-10-26 | trae-agent | [详情](./idea-details/20261026082026.md) |
| 20261026082027 | 非加密哈希计算器（FNV / MurmurHash3 / djb2 等） | Web Tool | Existing Gap | In Progress | 2026-10-26 | trae-agent | [详情](./idea-details/20261026082027.md) |
| 20261026082028 | 复利与定投收益计算器 | Web Tool | Exploration | In Progress | 2026-10-26 | trae-agent | [详情](./idea-details/20261026082028.md) |
| 20261026140923 | 数字英文读法转换器（Number to English Words） | Web Tool | Exploration | In Progress | 2026-10-26 | trae-agent | [详情](./idea-details/20261026140923.md) |
| 20261026140924 | MessagePack ↔ JSON 双向编解码器 | Web Tool | Existing Gap | Pending | 2026-10-26 | | [详情](./idea-details/20261026140924.md) |
| 20261026140926 | 换行符检测与批量转换器（LF / CRLF / CR） | Web Tool | Existing Gap | In Progress | 2026-10-26 | trae-agent | [详情](./idea-details/20261026140926.md) |
| 20261026140927 | 知名 TCP/UDP 端口号速查表 | Web Tool | External Reference | In Progress | 2026-10-26 | trae-agent | [详情](./idea-details/20261026140927.md) |
| 20261026200350 | 原始 HTTP 报文解析器（请求 / 响应） | Web Tool | Existing Gap | Pending | 2026-10-26 | | [详情](./idea-details/20261026200350.md) |
| 20261027020214 | DMARC 记录生成与校验器 | Web Tool | Existing Gap | Pending | 2026-10-27 | | [详情](./idea-details/20261027020214.md) |
| 20261027020216 | 多时区会议时间规划器 | Web Tool | Exploration | Pending | 2026-10-27 | | [详情](./idea-details/20261027020216.md) |
| 20261027020217 | CSS clip-path 可视化生成器 | Web Tool | Existing Gap | Pending | 2026-10-27 | | [详情](./idea-details/20261027020217.md) |
| 20261027040226 | 色温 ↔ RGB/HEX 双向转换器（开尔文色温计算器） | Web Tool | Existing Gap | In Progress | 2026-10-27 | trae-agent | [详情](./idea-details/20261027040226.md) |
| 20261027081101 | 文件魔数（Magic Number）签名识别器 | Web Tool | Existing Gap | Pending | 2026-10-27 | | [详情](./idea-details/20261027081101.md) |
| 20261027081102 | 线性回归与相关系数计算器 | Web Tool | Existing Gap | In Progress | 2026-10-27 | trae-agent | [详情](./idea-details/20261027081102.md) |
| 20261027081103 | 个人所得税计算器（工资薪金 / 年终奖） | Web Tool | Exploration | Pending | 2026-10-27 | | [详情](./idea-details/20261027081103.md) |
| 20261027081105 | RSS / Atom Feed 生成器 | Web Tool | Exploration | Pending | 2026-10-27 | | [详情](./idea-details/20261027081105.md) |
| 20261027140131 | PBKDF2 密钥派生计算器（RFC 8018） | Web Tool | Existing Gap | In Progress | 2026-10-27 | trae-agent | [详情](./idea-details/20261027140131.md) |
| 20261027140132 | Bech32 / Bech32m 编解码器（BIP-173 / BIP-350） | Web Tool | Existing Gap | In Progress | 2026-10-27 | trae-agent | [详情](./idea-details/20261027140132.md) |
| 20261027140134 | IP 地址范围 → 最小 CIDR 列表聚合器（IPv4 / IPv6） | Web Tool | Existing Gap | In Progress | 2026-10-27 | trae-agent | [详情](./idea-details/20261027140134.md) |
| 20261027201026 | ASCII 码表查询器（字符 / 十进制 / 十六进制 / 二进制对照） | Web Tool | External Reference | In Progress | 2026-10-27 | trae-agent | [详情](./idea-details/20261027201026.md) |
| 20261027201028 | 概率分布计算器（正态 / 二项 / 泊松 PMF、PDF、CDF 与分位） | Web Tool | Exploration | Pending | 2026-10-27 | | [详情](./idea-details/20261027201028.md) |
| 20261027201029 | 欧姆定律与功率计算器（V / I / R / P 知二求二） | Web Tool | Exploration | In Progress | 2026-10-27 | trae-agent | [详情](./idea-details/20261027201029.md) |
| 20261028020202 | Sqids / Hashids 短 ID 编解码器 | Web Tool | External Reference | Pending | 2026-10-28 | | [详情](./idea-details/20261028020202.md) |
| 20261028020204 | BIP-39 助记词生成与校验器 | Web Tool | External Reference | Pending | 2026-10-28 | | [详情](./idea-details/20261028020204.md) |
| 20261028020206 | Java .properties 配置与 JSON 双向转换器 | Web Tool | Existing Gap | In Progress | 2026-10-28 | trae-agent | [详情](./idea-details/20261028020206.md) |
| 20261028081033 | 以太坊地址 EIP-55 校验和编码与校验器 | Web Tool | Existing Gap | Pending | 2026-10-28 | | [详情](./idea-details/20261028081033.md) |
| 20261028081035 | BMI 身体质量指数计算器（中国 / WHO 双标准分级） | Web Tool | Exploration | In Progress | 2026-10-28 | trae-agent | [详情](./idea-details/20261028081035.md) |
| 20261028140205 | JSONC / 宽松 JSON 转标准 JSON（注释与尾随逗号剥离） | Web Tool | Existing Gap | In Progress | 2026-10-28 | trae-agent | [详情](./idea-details/20261028140205.md) |
| 20261028140206 | 二进制 ↔ Gray 码（格雷码）双向转换器 | Web Tool | Exploration | In Progress | 2026-10-28 | trae-agent | [详情](./idea-details/20261028140206.md) |
| 20261028140207 | WebSocket Sec-WebSocket-Accept 握手头计算器 | Web Tool | Exploration | In Progress | 2026-10-28 | trae-agent | [详情](./idea-details/20261028140207.md) |
| 20261028140208 | MongoDB ObjectId 生成与解析器（时间戳 / 随机 / 计数器拆解） | Web Tool | Exploration | In Progress | 2026-10-28 | trae-agent | [详情](./idea-details/20261028140208.md) |
| 20261028140209 | 以太坊 RLP（Recursive Length Prefix）递归长度前缀编解码器 | Web Tool | Exploration | In Progress | 2026-10-28 | trae-agent | [详情](./idea-details/20261028140209.md) |
| 20261028202203 | JSON 键名命名风格批量递归转换器（camelCase / snake_case / kebab-case 等） | Web Tool | Existing Gap | In Progress | 2026-10-28 | trae-agent | [详情](./idea-details/20261028202203.md) |
| 20261028202205 | 三角形求解器（已知三边/两边夹角/两角一边解三角形） | Web Tool | Exploration | In Progress | 2026-10-28 | trae-agent | [详情](./idea-details/20261028202205.md) |
| 20261029020231 | Base91（basE91）文本与字节编解码器 | Web Tool | Existing Gap | In Progress | 2026-10-29 | trae-agent | [详情](./idea-details/20261029020231.md) |
| 20261029020232 | 增值税计算器（含税 / 不含税互算与税额拆分） | Web Tool | Exploration | In Progress | 2026-10-29 | trae-agent | [详情](./idea-details/20261029020232.md) |
| 20261029020233 | 跑步配速、完赛时间与速度互算计算器 | Web Tool | Exploration | In Progress | 2026-10-29 | trae-agent | [详情](./idea-details/20261029020233.md) |
| 20261029020234 | 分贝 dB 与增益 / 衰减倍数互转器 | Web Tool | Exploration | In Progress | 2026-10-29 | trae-agent | [详情](./idea-details/20261029020234.md) |
| 20261029020235 | mailto 邮件链接生成器（收件人 / 抄送 / 密送 / 主题 / 正文） | Web Tool | Exploration | In Progress | 2026-10-29 | trae-agent | [详情](./idea-details/20261029020235.md) |
| 20261029080301 | Magnet 磁力链接解析与生成器 | Web Tool | Existing Gap | In Progress | 2026-10-29 | trae-agent | [详情](./idea-details/20261029080301.md) |
| 20261029080302 | Web Mercator 瓦片坐标计算器 | Web Tool | External Reference | In Progress | 2026-10-29 | trae-agent | [详情](./idea-details/20261029080302.md) |
| 20261029080304 | 儒略日（JD / MJD）与公历日期互转器 | Web Tool | Existing Gap | In Progress | 2026-10-31 | trae-agent | [详情](./idea-details/20261029080304.md) |
| 20261029080306 | 一元二次 / 三次方程求根计算器 | Web Tool | Exploration | In Progress | 2026-10-29 | trae-agent | [详情](./idea-details/20261029080306.md) |
| 20261029140201 | SRI 子资源完整性哈希生成器（Subresource Integrity） | Web Tool | Existing Gap | In Progress | 2026-10-29 | trae-agent | [详情](./idea-details/20261029140201.md) |
| 20261029140202 | HKDF 密钥派生计算器（RFC 5869） | Web Tool | Existing Gap | In Progress | 2026-10-29 | trae-agent | [详情](./idea-details/20261029140202.md) |
| 20261029140203 | JSON Patch 应用器（RFC 6902） | Web Tool | Existing Gap | In Progress | 2026-10-29 | trae-agent | [详情](./idea-details/20261029140203.md) |
| 20261029140204 | Plus Codes（Open Location Code）编解码器 | Web Tool | Exploration | Pending | 2026-10-29 | | [详情](./idea-details/20261029140204.md) |
| 20261029140205 | 中文数字 ↔ 阿拉伯数字双向转换器（含大写金额用字） | Web Tool | Existing Gap | In Progress | 2026-10-29 | trae-agent | [详情](./idea-details/20261029140205.md) |
| 20261029200825 | UUID v3 / v5 名称型 UUID 生成器（RFC 9562 命名空间哈希） | Web Tool | Existing Gap | In Progress | 2026-10-29 | trae-agent | [详情](./idea-details/20261029200825.md) |
| 20261029200826 | JWK Thumbprint 指纹计算器（RFC 7638） | Web Tool | Existing Gap | In Progress | 2026-10-31 | trae-agent | [详情](./idea-details/20261029200826.md) |
| 20261030021004 | AWS SigV4 请求签名生成器 | Web Tool | Exploration | Pending | 2026-10-30 | | [详情](./idea-details/20261030021004.md) |
| 20261030021005 | OpenSSH 公钥指纹计算器 | Web Tool | Existing Gap | Pending | 2026-10-30 | | [详情](./idea-details/20261030021005.md) |
| 20261030021006 | JSON 转 Zod schema 生成器 | Web Tool | Existing Gap | Claimed | 2026-10-30 | trae-agent | [详情](./idea-details/20261030021006.md) |
| 20261030021007 | multipart/form-data 请求体构造器 | Web Tool | Existing Gap | Pending | 2026-10-30 | | [详情](./idea-details/20261030021007.md) |
| 20261030021008 | SHA-3 / Keccak 哈希计算器（FIPS 202） | Web Tool | Existing Gap | Pending | 2026-10-30 | | [详情](./idea-details/20261030021008.md) |
| 20261030080719 | Intel HEX 解析与校验和工具 | Web Tool | Existing Gap | In Progress | 2026-10-30 | trae-agent | [详情](./idea-details/20261030080719.md) |
| 20261030080720 | UTM ↔ WGS84 经纬度坐标互转器 | Web Tool | Existing Gap | Pending | 2026-10-30 | | [详情](./idea-details/20261030080720.md) |
| 20261030080721 | ISIN 证券识别码校验器 | Web Tool | External Reference | In Progress | 2026-10-30 | trae-agent | [详情](./idea-details/20261030080721.md) |
| 20261030140201 | JSON 转 Go struct 生成器 | Web Tool | Existing Gap | In Progress | 2026-10-30 | trae-agent | [详情](./idea-details/20261030140201.md) |
| 20261030140202 | Maidenhead 网格定位（QTH Locator）编解码器 | Web Tool | External Reference | Pending | 2026-10-30 | | [详情](./idea-details/20261030140202.md) |
| 20261030140203 | EUI-64 / SLAAC IPv6 链路本地地址计算器 | Web Tool | Existing Gap | In Progress | 2026-10-31 | trae-agent | [详情](./idea-details/20261030140203.md) |
| 20261030140204 | Verhoeff / Damm 校验位计算器 | Web Tool | Exploration | In Progress | 2026-10-30 | trae-agent | [详情](./idea-details/20261030140204.md) |
| 20261030140205 | BMR 基础代谢与 TDEE 每日热量消耗计算器 | Web Tool | Exploration | In Progress | 2026-10-30 | trae-agent | [详情](./idea-details/20261030140205.md) |
| 20261030200909 | MGRS 军用地形图坐标 ↔ WGS-84 经纬度编解码器 | Web Tool | External Reference | Pending | 2026-10-30 | | [详情](./idea-details/20261030200909.md) |
| 20261030200911 | systemd .service 单元文件生成器 | Web Tool | Exploration | Pending | 2026-10-30 | | [详情](./idea-details/20261030200911.md) |
| 20261031020750 | Unified Diff / Patch 解析与统计查看器 | Web Tool | Existing Gap | In Progress | 2026-10-31 | trae-agent | [详情](./idea-details/20261031020750.md) |
| 20261031020752 | ELF 文件头解析器 | Web Tool | Exploration | Pending | 2026-10-31 | | [详情](./idea-details/20261031020752.md) |
| 20261031020753 | C 结构体位域打包 / 解包器 | Web Tool | Existing Gap | Pending | 2026-10-31 | | [详情](./idea-details/20261031020753.md) |
| 20261031080655 | ZIP 归档结构解析器（只读列目录与元数据展示） | Web Tool | Exploration | Pending | 2026-10-31 | | [详情](./idea-details/20261031080655.md) |
| 20261031080656 | MRZ 机读旅行证件校验器（TD1 / TD2 / TD3 护照机读码校验） | Web Tool | External Reference | Pending | 2026-10-31 | | [详情](./idea-details/20261031080656.md) |
| 20261031080657 | AA 分账计算器（多人费用分摊与最小转账结算） | Web Tool | Exploration | In Progress | 2026-10-31 | trae-agent | [详情](./idea-details/20261031080657.md) |
| 20261031080659 | CBOR (RFC 8949) ↔ JSON 编解码器（含诊断记法与十六进制互转） | Web Tool | Existing Gap | Pending | 2026-10-31 | | [详情](./idea-details/20261031080659.md) |
| 20261031080660 | 数独（Sudoku）求解器与题目生成器（9×9，含多解/无解检测） | Web Tool | Exploration | Pending | 2026-10-31 | | [详情](./idea-details/20261031080660.md) |
| 20261031140456 | PNG 文件 chunk 结构解析器（IHDR / IDAT / IEND 等） | Web Tool | Existing Gap | Pending | 2026-10-31 | | [详情](./idea-details/20261031140456.md) |
| 20261031140457 | TAR 归档结构解析器（512 字节头与文件目录树展示） | Web Tool | Existing Gap | Pending | 2026-10-31 | | [详情](./idea-details/20261031140457.md) |
| 20261031140458 | 四元数 ↔ 欧拉角 ↔ 旋转矩阵互转器 | Web Tool | Exploration | In Progress | 2026-10-31 | trae-agent | [详情](./idea-details/20261031140458.md) |
| 20261031140459 | 英文文本可读性评分器（Flesch Reading Ease / Grade Level） | Web Tool | Exploration | In Progress | 2026-10-31 | trae-agent | [详情](./idea-details/20261031140459.md) |
| 20261031201036 | WAV（RIFF）音频文件头与 chunk 解析器 | Web Tool | Existing Gap | Pending | 2026-10-31 | | [详情](./idea-details/20261031201036.md) |
| 20261031201037 | SQLite 数据库文件头解析器（前 100 字节只读） | Web Tool | Existing Gap | Pending | 2026-10-31 | | [详情](./idea-details/20261031201037.md) |
| 20261031201038 | 无 schema 的 Protobuf 线格式原始解码器 | Web Tool | Existing Gap | Pending | 2026-10-31 | | [详情](./idea-details/20261031201038.md) |
| 20261031201039 | 定点数 Qm.n / Q 格式转换与运算可视化器 | Web Tool | Existing Gap | Pending | 2026-10-31 | | [详情](./idea-details/20261031201039.md) |
| 20261031201040 | HTTP Digest 认证响应计算器（RFC 2617 / RFC 7616） | Web Tool | Existing Gap | Pending | 2026-10-31 | | [详情](./idea-details/20261031201040.md) |
| 20261101020825 | MP4 / ISO-BMFF atom（box）结构解析器（只读树） | Web Tool | Existing Gap | Pending | 2026-11-01 | | [详情](./idea-details/20261101020825.md) |
| 20261101020826 | MP3 ID3v2 标签解析器与剥离器 | Web Tool | Existing Gap | Pending | 2026-11-01 | | [详情](./idea-details/20261101020826.md) |
| 20261101020827 | Shamir 秘密分片与恢复工具（GF(2⁸)，Shamir's Secret Sharing） | Web Tool | Existing Gap | Pending | 2026-11-01 | | [详情](./idea-details/20261101020827.md) |
| 20261101080346 | CIE Lab 色差计算器（ΔE76 / ΔE94 / ΔE2000，sRGB ↔ Lab） | Web Tool | Existing Gap | Pending | 2026-11-01 | | [详情](./idea-details/20261101080346.md) |
| 20261101140214 | RFC 2047 邮件头编码字解码器（=?…?= encoded-word） | Web Tool | Existing Gap | In Progress | 2026-11-01 | trae-agent | [详情](./idea-details/20261101140214.md) |
| 20261101140216 | TypeID 标识符生成与解析器（typeid 规范） | Web Tool | External Reference | Pending | 2026-11-01 | | [详情](./idea-details/20261101140216.md) |
| 20261101140217 | PHP serialize ↔ JSON 双向转换器 | Web Tool | Existing Gap | In Progress | 2026-11-01 | trae-agent @ 2026-11-03 18:05 CST | [详情](./idea-details/20261101140217.md) |
| 20261101140218 | HTTP Cache-Control 指令解析与缓存新鲜度计算器（RFC 9111） | Web Tool | Existing Gap | Pending | 2026-11-01 | | [详情](./idea-details/20261101140218.md) |
| 20261101201002 | Encoded Polyline Algorithm Format 折线编解码器（Google 精度 5 / 精度 6） | Web Tool | External Reference | In Progress | 2026-11-01 | trae-agent @ 2026-11-03 18:05 CST | [详情](./idea-details/20261101201002.md) |
| 20261101201003 | Redis RESP2/RESP3 协议编解码器（含 inline 与 RESP3 类型） | Web Tool | Existing Gap | Pending | 2026-11-01 | | [详情](./idea-details/20261101201003.md) |
| 20261101201004 | HAR 1.2 / 1.3 归档文件解析与请求摘要查看器（JSON 安全解析） | Web Tool | Existing Gap | Pending | 2026-11-01 | | [详情](./idea-details/20261101201004.md) |
| 20261102020124 | Git 底层对象哈希计算器（blob / tree / commit / tag，git hash-object 等价） | Web Tool | Exploration | In Progress | 2026-11-02 | trae-agent | [详情](./idea-details/20261102020124.md) |
| 20261102020125 | Java .class 字节码文件头解析器（魔数 / 版本 / 常量池计数与条目只读树） | Web Tool | Exploration | Pending | 2026-11-02 | | [详情](./idea-details/20261102020125.md) |
| 20261102020126 | CAS 化学物质登记号校验器（CAS Registry Number 模 10 校验位） | Web Tool | Exploration | In Progress | 2026-11-02 | trae-agent | [详情](./idea-details/20261102020126.md) |
| 20261102020127 | RC 滤波器参数计算器（一阶低通 / 高通截止频率、时间常数与电阻电容互求） | Web Tool | Exploration | In Progress | 2026-11-02 | trae-agent | [详情](./idea-details/20261102020127.md) |
| 20261102020128 | Apple .strings 本地化文件 ↔ JSON 双向转换器（iOS / macOS Localizable.strings） | Web Tool | Existing Gap | In Progress | 2026-11-02 | trae-agent | [详情](./idea-details/20261102020128.md) |
| 20261102080701 | Enigma 转子密码机加解密模拟器 | Web Tool | External Reference | Pending | 2026-11-02 | | [详情](./idea-details/20261102080701.md) |
| 20261102080702 | DNS 报文（message）线格式编码与解析器 | Web Tool | Existing Gap | Pending | 2026-11-02 | | [详情](./idea-details/20261102080702.md) |
| 20261102080704 | 体感温度计算器（热指数 Heat Index / 风寒 Wind Chill） | Web Tool | Exploration | In Progress | 2026-11-02 | trae-agent | [详情](./idea-details/20261102080704.md) |
| 20261102080705 | ECDH 密钥协商与 Ed25519 签名 / 验签工具 | Web Tool | Existing Gap | Pending | 2026-11-02 | | [详情](./idea-details/20261102080705.md) |
| 20261102200311 | WebAssembly 二进制模块（.wasm）section 结构只读解析器 | Web Tool | Existing Gap | Pending | 2026-11-02 | | [详情](./idea-details/20261102200311.md) |
| 20261102200312 | 原始 EML / MIME 邮件只读解析器（multipart 树与邮件头展示） | Web Tool | Existing Gap | Pending | 2026-11-02 | | [详情](./idea-details/20261102200312.md) |
| 20261102200313 | PE 文件头只读解析器（DOS header / COFF header / Optional header / Section table） | Web Tool | Existing Gap | Pending | 2026-11-02 | | [详情](./idea-details/20261102200313.md) |
| 20261102200314 | Source Map（.map）查看器与 VLQ mappings 解码器 | Web Tool | Existing Gap | Pending | 2026-11-02 | | [详情](./idea-details/20261102200314.md) |
| 20261102200315 | 露点 / 湿球温度与气压海拔计算器 | Web Tool | Existing Gap | In Progress | 2026-11-02 | trae-agent | [详情](./idea-details/20261102200315.md) |
| 20261103081157 | JSON5 ↔ JSON 双向转换器 | Web Tool | Existing Gap | In Progress | 2026-11-03 | trae-agent @ 2026-11-03 18:05 CST | [详情](./idea-details/20261103081157.md) |
| 20261103081158 | BibTeX 条目解析器（.bib ↔ JSON / 格式化引用） | Web Tool | External Reference | Pending | 2026-11-03 | | [详情](./idea-details/20261103081158.md) |
| 20261103140201 | 假设检验计算器（t 检验 / 卡方检验） | Web Tool | External Reference | Pending | 2026-11-03 | | [详情](./idea-details/20261103140201.md) |
| 20261103140202 | 月相查询与月龄计算器 | Web Tool | External Reference | Pending | 2026-11-03 | | [详情](./idea-details/20261103140202.md) |
| 20261103140203 | VLSM 可变长子网划分规划器 | Web Tool | External Reference | Pending | 2026-11-03 | | [详情](./idea-details/20261103140203.md) |
| 20261103140204 | Syslog 日志行解析与字段拆分器 | Web Tool | External Reference | In Progress | 2026-11-03 | trae-agent | [详情](./idea-details/20261103140204.md) |
| 20261103140205 | 加班工资计算器（中国大陆劳动法） | Web Tool | External Reference | Pending | 2026-11-03 | | [详情](./idea-details/20261103140205.md) |
| 20261103200232 | Black-Scholes 期权定价计算器（含 Greeks） | Web Tool | Exploration | Pending | 2026-11-03 | | [详情](./idea-details/20261103200232.md) |
| 20261103200233 | Apache / Nginx Combined Log Format 访问日志解析器 | Web Tool | Existing Gap | In Progress | 2026-11-03 | trae-agent | [详情](./idea-details/20261103200233.md) |
| 20261103200234 | IPv4 数据报头解析与校验和验证器（RFC 791） | Web Tool | Existing Gap | Pending | 2026-11-03 | | [详情](./idea-details/20261103200234.md) |
| 20261103200235 | 化学方程式配平器与摩尔计量计算器 | Web Tool | Exploration | Pending | 2026-11-03 | | [详情](./idea-details/20261103200235.md) |
| 20261104020112 | SMD 电阻阻值码计算器（3 位数字码与 EIA-96 字母码双向） | Web Tool | Exploration | Claimed | 2026-11-04 | trae-agent | [详情](./idea-details/20261104020112.md) |
| 20261104020113 | AWG 美国线规计算器（线号 ↔ 直径 / 截面积 / 电阻 / 载流量） | Web Tool | Exploration | Claimed | 2026-11-04 | trae-agent | [详情](./idea-details/20261104020113.md) |
| 20261104020114 | CUSIP / SEDOL 证券识别码校验器（模 10 加权校验位与模 10 双倍加权） | Web Tool | Exploration | Claimed | 2026-11-04 | trae-agent | [详情](./idea-details/20261104020114.md) |
| 20261104020115 | ABA 银行路由号码（RTN / Routing Number）校验器 | Web Tool | Exploration | Claimed | 2026-11-04 | trae-agent | [详情](./idea-details/20261104020115.md) |
| 20261104020116 | IPFS CID 解析器与格式转换器（CIDv0/CIDv1、multibase 与 multihash 拆解） | Web Tool | Existing Gap | Pending | 2026-11-04 | | [详情](./idea-details/20261104020116.md) |
| 20261104081012 | APCA（WCAG 3）感知对比度计算器 | Web Tool | Existing Gap | Pending | 2026-11-04 | | [详情](./idea-details/20261104081012.md) |
| 20261104081013 | 555 定时器（Astable / Monostable）参数计算器 | Web Tool | Exploration | In Progress | 2026-11-04 | trae-agent | [详情](./idea-details/20261104081013.md) |
| 20261104081014 | EPC QR Code（SEPA 转账）负载生成与解析器 | Web Tool | Existing Gap | Pending | 2026-11-04 | | [详情](./idea-details/20261104081014.md) |
| 20261104081015 | BMP / DIB 位图文件头结构只读解析器 | Web Tool | Existing Gap | Pending | 2026-11-04 | | [详情](./idea-details/20261104081015.md) |
| 20261104140121 | JSON → Dart model 类代码生成器（freezed / json_serializable 风格可选） | Web Tool | Existing Gap | Pending | 2026-11-04 | | [详情](./idea-details/20261104140121.md) |
| 20261104140122 | WebSocket 帧（RFC 6455）线格式编解码与掩码/分片解析器 | Web Tool | Existing Gap | Pending | 2026-11-04 | | [详情](./idea-details/20261104140122.md) |
| 20261104140123 | 模运算计算器（模逆 / 模幂 / 中国剩余定理 / 同余方程） | Web Tool | Exploration | In Progress | 2026-11-04 | trae-agent | [详情](./idea-details/20261104140123.md) |
| 20261104140124 | Mach-O / Fat Mach-O 文件头只读解析器（macOS 二进制 load commands 树） | Web Tool | Existing Gap | Pending | 2026-11-04 | | [详情](./idea-details/20261104140124.md) |
| 20261104140125 | .gitattributes 文件生成器（换行符 / 二进制标记 / merge driver / linguist 规则） | Web Tool | Existing Gap | In Progress | 2026-11-04 | trae-agent | [详情](./idea-details/20261104140125.md) |
| 20261104200903 | HOTP（RFC 4226）基于计数器的一次性密码生成与校验器 | Web Tool | Existing Gap | In Progress | 2026-11-04 | trae-agent | [详情](./idea-details/20261104200903.md) |
| 20261104200904 | 位掩码（Bitmask / 位标志）可视化计算器 | Web Tool | Exploration | In Progress | 2026-11-04 | trae-agent | [详情](./idea-details/20261104200904.md) |
| 20261104200905 | LC 谐振频率与电抗计算器（谐振频率 / 容抗 / 感抗互求） | Web Tool | Existing Gap | Pending | 2026-11-04 | | [详情](./idea-details/20261104200905.md) |
| 20261104200906 | JSON 推断并生成 SQL CREATE TABLE 建表语句（DDL）生成器 | Web Tool | Existing Gap | In Progress | 2026-11-04 | trae-agent | [详情](./idea-details/20261104200906.md) |
| 20261104200907 | GIF（GIF87a / GIF89a）文件结构只读解析器（块树与帧时序展示） | Web Tool | Existing Gap | Pending | 2026-11-04 | | [详情](./idea-details/20261104200907.md) |
| 20261105020213 | 文本自动换行与行宽格式化器（hard wrap / unwrap，按宽度折行与还原） | Web Tool | Existing Gap | Claimed | 2026-11-05 | trae-agent | [详情](./idea-details/20261105020213.md) |
| 20261105020214 | UPC-E 与 UPC-A 条码压缩/展开转换器（含模 10 校验位） | Web Tool | Existing Gap | Claimed | 2026-11-05 | trae-agent | [详情](./idea-details/20261105020214.md) |
| 20261105020215 | BCD 码编解码器（8421 / 余3码 / 2421 码与打包 BCD 字节） | Web Tool | Existing Gap | Claimed | 2026-11-05 | trae-agent | [详情](./idea-details/20261105020215.md) |
| 20261105020216 | 干支纪年与生肖转换器（公历年份 ↔ 天干地支/六十甲子/生肖） | Web Tool | Exploration | In Progress | 2026-11-05 | trae-agent | [详情](./idea-details/20261105020216.md) |
| 20261105080301 | ITU E.123 电话号码格式化器（国际/本地分组、可视分隔与 E.164 互转） | Web Tool | Existing Gap | Pending | 2026-11-05 | | [详情](./idea-details/20261105080301.md) |
| 20261105080302 | Java 内部类名与描述符（Descriptor / Signature）转换器 | Web Tool | Existing Gap | Pending | 2026-11-05 | | [详情](./idea-details/20261105080302.md) |
| 20261105080303 | DICOM UID 生成器与校验器（医疗影像唯一标识符，根 UID + 后缀） | Web Tool | External Reference | Pending | 2026-11-05 | | [详情](./idea-details/20261105080303.md) |
| 20261105080304 | Markdown 链接检查器（引用一致性、重复引用定义与本地锚点校验） | Web Tool | Existing Gap | Claimed | 2026-11-05 | trae-agent | [详情](./idea-details/20261105080304.md) |
| 20261105080305 | gettext PO / POT 消息目录 ↔ JSON 双向转换器 | Web Tool | Existing Gap | Pending | 2026-11-05 | | [详情](./idea-details/20261105080305.md) |
| 20261105080308 | SQL 字符串字面量转义 / 反转义工具（标准单引号与 LIKE 通配符转义） | Web Tool | Existing Gap | In Progress | 2026-11-05 | trae-agent | [详情](./idea-details/20261105080308.md) |
| 20261105140800 | DKIM DNS TXT 记录生成器（选择器公钥记录拼装与标签语法校验） | Web Tool | Existing Gap | Pending | 2026-11-05 | | [详情](./idea-details/20261105140800.md) |
| 20261105140801 | 摄影景深与超焦距计算器（弥散圆 / 光圈 / 焦距 / 对焦距离互求） | Web Tool | Existing Gap | Pending | 2026-11-05 | | [详情](./idea-details/20261105140801.md) |
| 20261105140802 | CORS 响应头配置生成器（Allow-Origin / Credentials / 预检缓存策略拼装与校验） | Web Tool | External Reference | Pending | 2026-11-05 | | [详情](./idea-details/20261105140802.md) |
| 20261105140803 | SSE（Server-Sent Events）消息格式编码 / 解码器（event/data/id/retry 字段与多行 data） | Web Tool | External Reference | In Progress | 2026-11-05 | trae-agent | [详情](./idea-details/20261105140803.md) |
| 20261105140804 | 表达式调度场算法可视化器（中缀转后缀 RPN 与逐步求值过程演示） | Web Tool | Exploration | Pending | 2026-11-05 | | [详情](./idea-details/20261105140804.md) |
| 20261106020725 | BCP 47 语言标签解析器 | Web Tool | Exploration | Claimed | 2026-11-06 | trae-agent | [详情](./idea-details/20261106020725.md) |
| 20261106020726 | CSS 命名颜色速查 | Web Tool | Exploration | Claimed | 2026-11-06 | trae-agent | [详情](./idea-details/20261106020726.md) |
| 20261106020727 | 正则表达式语法速查 | Web Tool | Exploration | Claimed | 2026-11-06 | trae-agent | [详情](./idea-details/20261106020727.md) |
| 20261106020728 | HTTP 请求方法速查 | Web Tool | Exploration | Claimed | 2026-11-06 | trae-agent | [详情](./idea-details/20261106020728.md) |
| 20261106020729 | HTTP 头字段速查 | Web Tool | Exploration | Claimed | 2026-11-06 | trae-agent | [详情](./idea-details/20261106020729.md) |
| 20261106060111 | 邮箱地址语法校验与结构解析器 | Web Tool | Existing Gap | In Progress | 2026-11-06 | trae-agent | [详情](./idea-details/20261106060111.md) |
| 20261106060112 | iCalendar RRULE 重复规则解析与展开器（RFC 5545） | Web Tool | Existing Gap | Pending | 2026-11-06 | | [详情](./idea-details/20261106060112.md) |
| 20261106060114 | JPEG 文件 marker 段结构只读解析器（SOI / APP / DQT / SOF / SOS / EOI） | Web Tool | Existing Gap | Pending | 2026-11-06 | | [详情](./idea-details/20261106060114.md) |
| 20261106060116 | 多面骰子（d4/d6/d20 等）投掷模拟与点数和概率分布计算器 | Web Tool | Exploration | In Progress | 2026-11-06 | trae-agent | [详情](./idea-details/20261106060116.md) |
| 20261106160207 | GS1-128 / SSCC / EAN-14 校验位计算器与包装层级条码助手 | Web Tool | External Reference | Pending | 2026-11-06 | | [详情](./idea-details/20261106160207.md) |
| 20261106160208 | Netpbm（PPM / PGM / PBM）图像生成与解析器 | Web Tool | External Reference | Pending | 2026-11-06 | | [详情](./idea-details/20261106160208.md) |
| 20261106160209 | Markdown Frontmatter（YAML / TOML）解析与编辑器 | Web Tool | Existing Gap | Pending | 2026-11-06 | | [详情](./idea-details/20261106160209.md) |
| 20261106160210 | 集合 Jaccard / 重叠系数 / Dice 相似度计算器 | Web Tool | Existing Gap | In Progress | 2026-11-06 | trae-agent | [详情](./idea-details/20261106160210.md) |

