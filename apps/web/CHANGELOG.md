# apps/web 变更日志

> 变更日志填写规范见 [docs/guide/changelog-guide.md](../../docs/guide/changelog-guide.md)。

## 日志

## 2026-10-27 ：【Agent自主迭代】新增 20 个文本规范化、数值转换、开发计算、编码密码、地理坐标、浮点调试、音乐与嵌入式颜色工具

- **新增**：Quoted-Printable 编解码（quoted-printable-codec）— 按 RFC 2045 在文本与 Quoted-Printable 间双向转换，支持 `=XX` 转义、软换行（`=`）与硬换行解码，内置 RFC 经典向量并逐行批量处理
- **新增**：文本信息熵计算器（text-entropy-calculator）— 基于 Shannon 熵公式统计字符频率、信息熵、归一化熵与理论最短编码位数，按出现频次降序展示字符占比表
- **新增**：维吉尼亚密码（vigenere-cipher）— 按密钥字母位移流双向加解密，非字母字符不推进密钥位，支持密钥校验与逐字符保留原大小写
- **新增**：MIDI 音符与频率互转计算器（midi-note-converter）— MIDI 编号、音名（C4/A#4/Bb3）与频率三向互转，支持自定义 A4 基准（如 432Hz）、音分偏差与任意八度 12 音频率表
- **新增**：RGB565 / RGB555 嵌入式颜色格式转换器（rgb565-converter）— 在 #RRGGBB 与 16 位帧缓冲像素间批量双向转换，输出 C 字面量、HIGH/LOW 字节与大小端字节序，反向位域补 1 还原并给出量化色差

- **新增**：换行符转换器（line-ending-converter）— 在 LF（Unix）、CRLF（Windows）、CR（经典 Mac）三种换行风格间批量转换，实时统计各类换行数量并支持一键复制
- **新增**：小数分数互转器（decimal-fraction-converter）— 有限小数与最简分数双向互转，展示约分过程与分母质因数判定，支持超长整数与循环小数提示
- **新增**：MAC 地址格式转换与校验（mac-address-converter）— 解析冒号 / 连字符 / Cisco 点分 / 裸十六进制四种 MAC-48、EUI-64 格式，解读 I/G、U/L 标志位、OUI 与设备标识并推导 EUI-64
- **新增**：数字英文读法转换器（number-to-words）— 按短级差（short scale）输出基数词、序数词与美元支票读法，支持负数、小数逐位读法、连字符开关与千分位输入
- **新增**：全角半角字符转换器（fullwidth-halfwidth-converter）— 依据 Unicode U+FF01–FF5E 与 U+3000 固定码位映射双向转换，可限定全部 / 字母数字 / 标点与空格范围并分类统计变更数
- **新增**：宽高比计算器（aspect-ratio-calculator）— 化简宽高为最简整数比，已知尺寸与比值时补全缺失边长，支持按目标宽高或倍数等比缩放并识别 16:9、4:3 等常见标准比例
- **新增**：CSS 选择器权重计算器（css-specificity-calculator）— 逐行解析选择器并按标准三元组 (a, b, c) 计算权重，正确处理 :is()/:not()/:has()/:where()、伪元素与 nth-child of 语法，自动标出最高权重行
- **新增**：数字千分位与货币格式化（number-locale-formatter）— 同一数值按多区域设置渲染本地化排版，覆盖千分位、小数位与舍入、货币符号、负数括号、百分比与紧凑记法，基于原生 Intl.NumberFormat
- **新增**：NATO 音标字母转换器（nato-phonetic-converter）— 普通文本与 NATO/ICAO 标准音标（Alfa / Bravo … Zero–Niner）双向转换，覆盖 A–Z 与 0–9，逐字符给出拼写对照并兼容常见异写
- **新增**：ISO 8601 时长解析与格式化（iso8601-duration）— 解析 P1Y2M3DT4H5M6S、PT90M、P2W 等时长字符串为七分量明细与折算总秒数，或把秒数反向归一化为标准格式，支持负时长、小数分量与严格语法诊断

- **新增**：Geohash 编解码器（geohash-codec）— 经纬度与 Base32 Geohash 串互转，支持 1–12 位精度选择、邻居格计算与相邻方向（N/S/E/W）编码
- **新增**：Unicode 规范化与同形字检测器（unicode-normalization）— NFC/NFD/NFKC/NFKD 四种规范化、可视化码点序列、同形字（混淆字符）检测与兼容字符分解对比
- **新增**：JSON Merge Patch 生成与应用器（json-merge-patch）— 按 RFC 7386 / 7396 应用或生成最小 merge patch（null 删除键），非法 JSON 带行列定位，覆盖 RFC 附录 A 全部官方向量
- **新增**：WGS-84 / GCJ-02 / BD-09 坐标系互转器（coordinate-system-converter）— GPS、高德 / 腾讯火星坐标与百度坐标两两批量互转，逐行校验、境外坐标不偏移并给出明细表
- **新增**：IEEE 754 浮点数转换器（ieee754-float-converter）— 十进制与 32 位单精度 / 64 位双精度二进制、十六进制位表示互转，拆解符号位、偏置指数与尾数位域，支持 ±0、±Infinity、NaN

## 2026-10-26 ：【Agent自主迭代】新增 5 个密码学、标识、数论与数制转换工具

- **新增**：凯撒密码（Caesar Cipher）编解码（caesar-cipher）— 文本按位移量双向加密解密，支持 25 档位移、保留大小写与非字母字符、全 25 位移暴力破解与批量处理
- **新增**：ULID 生成器（ulid-generator）— Crockford Base32 的单调有序 ULID 批量生成与字段解析，时间戳 / 随机段可视化，支持自定义时间与解析校验
- **新增**：雪花 ID 解析器（snowflake-id-parser）— Twitter / Discord 等多纪元 64 位 Snowflake ID 拆解（时间戳、机器位、worker/process、序列号）与反向拼装，BigInt 全程精确
- **新增**：数论计算器（GCD/LCM/质因数分解）（number-theory-calculator）— 2–10 个整数的最大公约数 / 最小公倍数、单整数质因数分解、全部正因数枚举与质数 / 合数判定
- **新增**：罗马数字转换器（roman-numeral-converter）— 1–3999 整数与标准减法记法罗马数字双向转换，严格拒绝 IIII、VX、IC、MMMM 等非法写法，支持逐行批量转换

## 2026-10-26 ：【Agent自主迭代】新增 5 个编码、标识、哈希与无线电工具

- **新增**：Base45（RFC 9285）编解码（base45-codec）— 文本与 Base45 双向编解码，覆盖 EU DCC 常用字符集，带严格校验与逐字符错误定位
- **新增**：Nano ID 生成器（nano-id-generator）— 基于 Web Crypto 与拒绝采样的无偏 ID 批量生成，支持自定义长度、字母表与 URL-safe 预设
- **新增**：Bencode 编解码器（bencode-codec）— .torrent 使用的 Bencode 与 JSON 双向转换，字典键自动字节序排序，非 UTF-8 字节串以标记对象无损承载
- **新增**：非加密哈希批量计算（non-crypto-hash）— 一次算出 FNV-1/1a（32/64 位）、MurmurHash3（种子可调）、djb2、sdbm 与 Java hashCode 的十进制与十六进制结果
- **新增**：摩尔斯电码编解码器（morse-codec）— 文本 ⇄ 国际摩尔斯电码双向转换，覆盖字母数字与常用标点，字符/单词间隔可调，内置 Web Audio 音频播放

## 2026-10-26 ：【Agent自主迭代】新增 5 个编码、数据清洗、标识与数学计算工具

- **新增**：Ascii85 / Base85 编解码（ascii85-codec）— 文本与 Ascii85（含 btoa/adobe 风格 `<~ ~>` 包裹与 z 简写）及 Z85 双向编解码，带严格模式、错误位置提示与实时校验
- **新增**：JSON ↔ NDJSON 互转（json-ndjson-converter）— JSON 数组与逐行 NDJSON 双向转换，支持单对象输入、容错解析与批量分隔设置
- **新增**：UUID 检查器（uuid-inspector）— 批量识别 RFC 9562 的 v1/v3/v4/v5/v6/v7，提取时间戳（v1/v6/v7）、节点（v1/v6）、命名空间（v3/v5）等字段，按规范形式去重并统计
- **新增**：ISBN-10 / ISBN-13 校验与互转（isbn-converter）— 按 ISO 2108 核验校验位并定位错误，978 前缀双向互转（979 明确提示不适用），输出组区分隔规范形式并按 ISBN-13 去重
- **新增**：排列组合计算器（combinatorics-calculator）— 一次算出阶乘、排列、组合、重复排列、重复组合与圆排列六项，全程 BigInt 任意精度精确计算，超大整数附科学计数法近似值

## 2026-10-26 ：【Agent自主迭代】新增 5 个安全认证、编码、财务与开发工具

- **新增**：OAuth2 PKCE 生成器（pkce-generator）— 生成符合 RFC 7636 的 code_verifier / code_challenge 参数对，支持 S256 与 plain、长度切换、手动编辑校验与一键复制
- **新增**：Base58 / Base58Check 编解码（base58-codec）— 文本与 Base58 双向编解码，支持 Bitcoin / Flickr / Ripple 字母表与带版本前缀、double-SHA256 校验和的 Base58Check
- **新增**：数字转中文大写金额（chinese-currency）— 阿拉伯数字金额实时转换为人民币中文大写，正确处理连续零、万 / 亿进位与角分边界，支持千分位与四舍五入到分
- **新增**：JSON 扁平化 / 还原（json-flatten）— 嵌套 JSON 与点路径单层键值 JSON 双向转换，支持自定义分隔符、数组展开开关与路径冲突报错
- **新增**：字符串字面量转义 / 反转义（string-escape）— 原始文本与 JavaScript / JSON、Python、Java 字符串字面量双向转义，覆盖代理对、`\xHH`、`\u{码点}` 等方言差异并可包裹 / 剥离外层引号

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
