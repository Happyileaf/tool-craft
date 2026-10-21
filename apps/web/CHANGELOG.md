# apps/web 变更日志

> 变更日志填写规范见 [docs/guide/changelog-guide.md](../../docs/guide/changelog-guide.md)。

## 日志

## 2026-10-21 ：【Agent自主迭代】新增 5 个数值、集合、编码与开发运维工具

- **新增**：百分比计算器（percentage-calculator）— 一键完成「X 的 Y%」「X 是 Y 的百分之几」「X 较 Y 增减百分比」三类运算，实时联动并提示除零与非法输入
- **新增**：CSS 单位换算（px / rem / em / pt）（css-unit-converter）— px、rem、em、pt 实时互转，可自定义根字号与父级字号基准，并附常用 px 值四单位对照表
- **新增**：列表集合运算（交集 / 并集 / 差集）（list-set-operations）— 对两段逐行列表执行交集、并集、左右差集与对称差集，支持忽略空白、忽略大小写与结果去重
- **新增**：哈希类型识别器（hash-type-identifier）— 依据 crypt(3) 前缀与十六进制长度推断候选散列算法，覆盖 MD5、SHA 系列、CRC32、bcrypt 等并给出置信度与歧义说明
- **新增**：chmod 权限计算器（chmod-calculator）— 八进制数字、符号串与读/写/执行勾选网格三向联动换算，实时生成可复制的 chmod 命令
- **修改**：列表集合运算（list-set-operations）— 明确交集语义为以列表 A 为基准保留 A 中的全部重复项，同步更新中英文 FAQ 表述

## 2026-10-17 ：【Agent自主迭代】新增 15 个数据、编码、文本与开发工具

- **新增**：JSON转YAML（json-to-yaml）— 将 JSON 文本序列化为等效 YAML，支持自定义缩进与字符串引号保护
- **新增**：CSV 与 JSON 双向转换（csv-json-converter）— 在 CSV 与 JSON 之间双向转换，支持分隔符与表头选项
- **新增**：CRON 表达式解析器（cron-parser）— 解析校验 5 段 CRON 表达式并预览后续执行时间
- **新增**：HTML 实体编解码（html-entity-codec）— 文本与 HTML 实体双向转换，覆盖命名与数字实体
- **新增**：Lorem Ipsum 占位文本生成器（lorem-ipsum-generator）— 按段落 / 句子 / 单词生成占位假文
- **新增**：JSON 转 TypeScript 类型（json-to-typescript）— 由 JSON 示例递归推断类型并生成 interface / type 定义
- **新增**：文本命名风格转换（text-case-converter）— 在 camelCase / snake_case / kebab-case 等 10 种命名风格间转换
- **新增**：TOTP 动态验证码生成器（totp-generator）— 按 RFC 6238 由 Base32 密钥生成实时一次性验证码
- **新增**：CIDR / IP 子网计算器（cidr-subnet-calculator）— 计算网络地址、广播地址、可用主机范围与掩码信息，支持 IPv4 / IPv6
- **新增**：cURL 转代码（curl-to-code）— 解析 cURL 命令并生成 fetch / axios / requests / Go 代码片段
- **新增**：行级文本处理（line-operations）— 对多行文本批量排序、去重、反转与过滤
- **新增**：语义化版本解析与比较（semver-parser）— 解析 SemVer 2.0.0 版本号并比较、匹配 npm 风格范围表达式
- **新增**：进制互转与位运算（number-base-converter）— 在 2 / 8 / 10 / 16 等进制间互转并可视化位与执行位运算
- **新增**：URL 解析与查询参数编辑（url-parser）— 结构化拆解 URL 各组成部分并编辑查询参数
- **新增**：Base32 编解码（base32-codec）— RFC 4648 Base32 文本编解码、去填充变体与合法性校验
- **修改**：JSON转YAML（json-to-yaml）— 调整布局结构，补齐顶栏与双栏网格容器

## 2026-09-22 ：【自主迭代】新增 3 个文本处理工具

- **新增**：字数统计（word-count）— 实时统计文本字符数、字数、行数和段落数
- **新增**：YAML转JSON（yaml-to-json）— 将YAML格式数据转换为格式化JSON
- **新增**：UUID生成器（uuid-generator）— 生成符合RFC4122标准的v4 UUID

## 2026-09-22 ：【人工迭代】基于 quickkit 原型重建工具套件，新增 9 个工具并引入 i18n 与主题系统

- **新增**：图片智能压缩与裁剪（image-resizer）— 浏览器本地压缩、缩放与格式转换
- **新增**：文本差异对比（text-diff）— 双栏比对文本，实时高亮增删改
- **新增**：正则表达式实时测试（regex-tester）— 实时匹配高亮与捕获分组解析
- **新增**：Base64 & URL 编解码（base64-codec）— Base64 / URL / Hex 双向编解码
- **新增**：调色板与 WCAG 对比度检查（color-palette）— 色阶生成与无障碍对比度计算
- **新增**：时间戳与时区转换器（timestamp-converter）— Unix 时间戳与日期互转、多时区对照
- **新增**：Markdown 在线预览与排版（markdown-preview）— 双栏实时渲染与 HTML 导出
- **新增**：哈希生成与文本指纹（hash-generator）— MD5 / SHA 系列摘要与 HMAC 计算
- **新增**：极简二维码生成器（qr-generator）— 文本 / 网址生成高清二维码
- **修改**：JSON 格式化与校验器（json-formatter）— 组件结构随工具套件重构调整

## 2026-09-21 ：【人工迭代】Stage 1 骨架落地，上线首个工具 JSON 格式化与校验器

- **新增**：JSON 格式化与校验器（json-formatter）— 一键格式化、压缩与实时语法校验
- **备注**：建立工具注册表、构建期页面生成与测试基建
