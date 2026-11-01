# apps/web 变更日志

> 变更日志填写规范见 [docs/guide/changelog-guide.md](../../docs/guide/changelog-guide.md)。

## 日志

## 2026-11-02 ：【Agent自主迭代】新增 5 个数学表达式求值、INI/JSON 互转、线性代数矩阵、文本相似度与 JSON 转 Python dataclass 工具

- **新增**：数学表达式求值器（math-expression-evaluator）— 支持运算符优先级、括号嵌套、阶乘、三角函数与对数等常用数学函数及 pi/e/tau 常量，多行变量赋值复用、弧度 / 角度切换，输出逐步计算过程与行列定位的语法错误，纯本地词法 / 语法分析
- **新增**：INI 配置 ↔ JSON 双向转换（ini-json-converter）— 支持 [section] 分节、= / : 分隔符、; / # 注释、引号转义、布尔 / 数字类型推断、同名分节合并与可选点号嵌套键，双向实时转换并对格式错误给出中文提示
- **新增**：线性代数矩阵计算器（matrix-calculator）— 基于 BigInt 精确分数的矩阵加减、标量乘、矩阵乘法、转置、行列式、逆矩阵、秩与 RREF 逐步消元，并求解 Ax = b（唯一解 / 无解 / 无穷多解判定），支持空格逗号换行分隔粘贴
- **新增**：文本相似度计算器（text-similarity）— 同时计算 Levenshtein 编辑距离与归一化相似度、最长公共子序列 LCS、Jaro-Winkler 与 Sørensen–Dice 双字组系数四种指标，展示字符级编辑对齐视图，支持忽略大小写
- **新增**：JSON 转 Python dataclass 生成器（json-to-python-dataclass）— 粘贴 JSON 递归推断结构并生成 @dataclass 或 TypedDict 定义，支持嵌套类、Optional 缺失字段、异构对象数组合并、空数组退化裸 list、snake_case / PascalCase 命名规范化与可选 from_dict / to_dict 辅助方法

## 2026-11-01 ：【Agent自主迭代】新增 20 个 IBAN 校验、三维姿态转换、Go 结构生成、Unicode 检视、RSA 非对称密码、集装箱校验位、多纪元时间戳、NMEA 解析、电阻色环、JSON 表单互转、内容协商头解析、KSUID、security.txt、定宽文本转换、NPV/IRR 计算、贷款月供、复利定投、RFC 2047 解码、.properties 转换与磁力链接工具

- **新增**：IBAN 校验器（iban-validator）— 依据 ISO 13616 内置 111 个国家 / 地区长度表，按 ISO 7064 mod 97-10 算法核验校验位，自动归一化空格连字符、识别国家并给出具体失败原因，机器格式与 4 位分组易读格式互转，纯本地运算
- **新增**：四元数欧拉角转换器（quaternion-converter）— 在四元数 (x, y, z, w)、欧拉角（roll / pitch / yaw）与 3×3 旋转矩阵间三向互转，支持六种 Tait-Bryan 内旋顺序与角度 / 弧度切换，自动归一化并提示万向锁与矩阵正交性问题
- **新增**：JSON 转 Go Struct（json-to-go）— 粘贴 JSON 实时生成带 json tag 的 Go struct，整数推断 int64、null 推断 interface{}，嵌套对象提升为具名类型、异构数组并集合并，支持根结构名自定义与 omitempty 开关
- **新增**：Unicode 字符检视器（unicode-character-inspector）— 逐码点展示 U+ 码点、字符名、UTF-8 / UTF-16 字节与 Unicode 类别，识别零宽字符、双向控制符、不间断空格等 27 种不可见字符并高亮，支持 NFC / NFD 归一化对比
- **新增**：RSA 密钥对生成器（rsa-keypair-tool）— 基于浏览器原生 Web Crypto 生成 RSA-OAEP（加解密）/ RSA-PSS（签名验签）密钥对，模长 2048 / 3072 / 4096，SPKI / PKCS8 PEM 导出导入，提供公钥加密私钥解密与签名验签工作台，密钥仅存内存
- **新增**：集装箱校验码计算器（container-code-checksum）— 按 ISO 6346 对 4 位属主代码 + 类别码 + 6 位流水号计算第 11 位校验码，数值 10/20/30 映射 0 并给出逐字符映射、加权乘积与取模明细，支持校验位核验与大写 / 空格自动归一化，纯本地查表运算
- **新增**：多纪元时间戳转换器（multi-epoch-timestamp）— 支持 Unix、Windows FILETIME、.NET DateTime.Ticks、COBOL、Chrome、NTFS、Mac HFS+、Java Instant 等 8 种纪元的秒 / 毫秒 / 微秒 / 纳秒时间戳与 UTC / 北京时间双向互转，BigInt 任意精度内核避免纳秒溢出，纯本地运算
- **新增**：NMEA 0183 语句解析器（nmea-parser）— 解析 GGA / RMC / GLL / GSA / GSV / VTG 六类定位语句，校验 `$` 起始、星号异或校验和与字段结构，输出定位坐标、卫星、精度、航迹等结构化结果与逐字段中文释义，支持多语句批量与错误定位，纯字符串解析零依赖
- **新增**：电阻色环计算器（resistor-color-calculator）— 4 / 5 / 6 环双向计算：正向按色环查表输出标称阻值、误差区间与温度系数并绘制色环 SVG，反向由阻值与精度匹配环序，附 E12 / E24 / E96 标准阻值最近邻提示，0Ω 跨接与非法环序明确报错，纯本地查表运算
- **新增**：JSON ↔ 表单请求体转换器（json-form-urlencoded）— 在 JSON 对象与 application/x-www-form-urlencoded 请求体间双向转换，严格 RFC 3986 百分号编码（补编码 !'()*、~ 不转义），空格 + / %20 可切换，数组与嵌套对象支持括号 / PHP a[] / 点路径三种风格，重复键聚合数组，畸形编码与键值类型冲突明确报错，纯本地运算
- **新增**：HTTP 内容协商头解析与排序器（content-negotiation-parser）— 按 RFC 9110 §12.5 解析 Accept / Accept-Language / Accept-Encoding / Accept-Charset，展开通配匹配与 q 质量因子（缺省 1、非法 q 忽略、q=0 标记拒绝），按质量因子降序、同质量具体度优先输出服务端选择排序，纯本地解析零依赖
- **新增**：KSUID 标识符生成与解析器（ksuid-generator）— 实现 Segment KSUID：4 字节自定义纪元（1400000000）秒时间戳 + 16 字节随机 payload 的 20 字节结构，BigInt Base62（0-9A-Za-z）定长 27 字符编码，crypto.getRandomValues 生成，解析反解 UTC 时间与 payload 十六进制，非法字符 / 长度 / 越界明确报错，随机源可注入便于向量验证
- **新增**：security.txt 安全联系人文件生成器（security-txt-generator）— 按 RFC 9116 表单化生成 /.well-known/security.txt，Contact / Expires 必填，Encryption / Acknowledgments / Preferred-Languages / Canonical / Policy / CSAF 可选且按规范字段顺序输出 CRLF 文本；解析模式校验必填缺失、未知字段、Expires 过期 / 30 天临期并检测 PGP 签名块
- **新增**：定宽文本 FWF ↔ CSV 转换器（fwf-csv-converter）— 在固定列宽文本与 CSV 间双向转换：零依赖 RFC 4180 CSV 解析生成（引号、字段内逗号换行、"" 转义），按列宽与左 / 右对齐做空格填充或累计位置切片，单侧 trim 保留内容侧空格，超长字段可截断计数或带行号列名报错，支持表头与 LF/CRLF 切换
- **新增**：NPV / IRR 投资现金流计算器（npv-irr-calculator）— 按期录入现金流（t=0 首期不折现）与贴现率计算净现值及逐期折现明细，IRR 在 [-99.99%, 1000%] 区间有界二分求解（容差 1e-10），全同号现金流提示 IRR 不存在，可选门槛率按 NPV>0 且 IRR 严格高于门槛给出投资判定，纯本地数值计算零依赖
- **新增**：贷款 / 月供计算器（loan-calculator）— 输入本金、年利率与期限，按等额本息或等额本金计算月供、利息总额、还款总额，输出逐月本金 / 利息 / 剩余本金还款计划，支持提前还款场景参考，纯本地数值计算
- **新增**：复利与定投收益计算器（compound-interest-calculator）— 按本金、年化收益率、期限与年 / 季 / 月 / 日复利频率测算复利终值，支持每期定投与期初 / 期末投入，给出逐期资产增长明细及单利对比
- **新增**：RFC 2047 邮件头编码字解码（rfc2047-decoder）— 解析邮件头 =?charset?B/Q?…?= 编码字并还原可读文本，支持 B（Base64）与 Q（下划线表空格、=XX 十六进制）编码、UTF-8 / GBK / GB2312 等字符集、多段编码字与明文混排（相邻编码字间折行空白按 RFC 折叠），非法结构与不支持字符集明确报错，纯本地运算
- **新增**：Java .properties ↔ JSON 双向转换（properties-json-converter）— .properties 解析支持 = / : / 空白分隔符、行尾反斜杠续行、\n \t \r \\ \uXXXX 转义、# / ! 注释与重复键覆盖，输出扁平 JSON；反向序列化自动转义特殊字符、逻辑行超 72 字符续行，键保持扁平不臆造嵌套
- **新增**：Magnet 磁力链接解析与生成器（magnet-link-parser）— 按 BEP 9 / BEP 12 解析 magnet:? 链接并结构化展示 urn:btih 40 位 v1 info hash（大写归一）、dn、可重复 tr、xl、ws、kt、as 与未知参数，表单可反向拼装合法 magnet URI，百分号自动编解码，非法编码 / 缺 xt / xl 非整数明确报错，纯本地运算

## 2026-10-31 ：【Agent自主迭代】新增 20 个协议校验和、数据转换、通配符测试、文本统计、地理计算、天文历法、网络地址、终端颜色、密码学指纹、生活计算、统计回归、MIME 与端口速查、目录树、英文可读性及 vCard 名片工具

- **新增**：儒略日转换器（julian-date-converter）— 按 Meeus 公式在 UTC 日期时间与儒略日 JD / 约化儒略日 MJD / Unix 时间戳之间双向转换，含 J2000.0 与 Unix 纪元参考点，严格校验闰年与日期范围，纯本地运算
- **新增**：EUI-64 / SLAAC IPv6 地址计算器（ipv6-eui64-slaac）— 按 RFC 4291 由 48 位 MAC 插入 ff:fe 并翻转 U/L 位派生 EUI-64 接口标识符，生成 fe80::/64 链路本地地址并可与任意 /64 前缀组合 SLAAC 地址，兼容 Cisco 等多种 MAC 写法
- **新增**：ANSI 终端颜色码生成器（ansi-color-generator）— 可视化选择标准 16 色 / 256 色 / RGB 真彩前景背景与八种文字样式，深色终端实时预览，生成 ANSI SGR 转义序列、JS 字符串字面量与 echo -e Shell 命令
- **新增**：JWK Thumbprint 指纹计算器（jwk-thumbprint）— 按 RFC 7638 对 RSA/EC/OKP/oct JWK 做必需成员白名单裁剪、词典序紧凑 JSON 规范化，经 Web Crypto 计算 SHA-256/384/512 摘要并输出 base64url 指纹，内置 RFC 7638 §3.1 官方向量
- **新增**：地理坐标格式转换器（geo-coordinate-converter）— 在 DD 十进制度 / DDM 度分 / DMS 度分秒之间互转，兼容 N/S/E/W 半球字母与正负号写法，校验纬度 ±90、经度 ±180，支持单点三格式同显与批量逐行解析标注
- **新增**：TCP/IP 互联网校验和计算器（tcpip-checksum）— 按 RFC 1071 对 Hex / 文本 / 十进制字节流计算 16 位反码求和校验和，支持偶数字节自动补零、逐组进位回卷明细与标准向量（`45 00 ...`）校验，纯本地运算
- **新增**：CSV 转 SQL INSERT 语句生成器（csv-to-sql）— 首行列名解析 RFC 4180 CSV（BOM、CRLF、引号转义、分隔符自动探测），支持自定义表名 / 列名、分批行数、反引号 / 双引号 / 方括号标识符风格与 NULL 策略，一键复制生成的 INSERT
- **新增**：Glob 通配符测试器（glob-tester）— 将 glob 模式实时翻译为等价正则表达式，支持 `**` 跨目录段、`{a,b}` 花括号展开、`[abc]` / `[!abc]` 字符类与 `?` 单字符匹配，对多行路径逐条给出命中结果与匹配统计
- **新增**：文本词频统计与高频词分析（word-frequency）— Unicode 感知切词并统计每词次数与频率，支持中文逐字 / 相邻汉字二元组两种模式、内置英文停用词与自定义停用词、排序、Top N、频率条形与 CSV 复制 / 导出
- **新增**：大圆距离与方位角计算器（great-circle）— 基于 WGS-84 与 Haversine 公式计算两点大圆距离（km / mi / nmi）与初始、终点、反方位角，输出 16 方位罗盘方位，内置六城市坐标预设与起终点互换
- **新增**：AA 账单均分与转账计算器（expense-splitter）— 定点整数分记账，按人均分摊并用最大余数法处理零头，贪心对冲生成最少笔数的成员间转账方案，纯本地、无浮点误差
- **新增**：BPM 音符时长与延迟时间计算器（bpm-calculator）— 由 BPM 计算全音符至三十二分音符（含附点、三连音）的毫秒时长与 delay / reverb 常用节拍同步时间（1/4、1/8 附点、1/16 等），支持由拍数时长反算 BPM
- **新增**：屏幕 PPI / 像素密度计算器（ppi-calculator）— 由分辨率宽高与对角英寸计算 PPI、PPCM、像素点距、物理宽高与面积、总像素与宽高比（含竖屏识别），附常见设备密度参考与 6 档密度分级
- **新增**：BMI 身体质量指数计算器（bmi-calculator）— 公制 cm/kg 与英制 ft+in/lb 双制式计算 BMI，同时按中国卫生行业标准与 WHO 标准双分级，反解正常体重区间并给出增重 / 减重建议与阈值对照表
- **新增**：一元线性回归与相关系数计算器（linear-regression）— 粘贴 CSV / 表格两列 / 每行 "x,y" 数据，最小二乘拟合 y = a + bx，输出斜率、截距、Pearson r、R²、SSE/SSR/SST 与逐点残差表，内置 Anscombe 经典示例
- **新增**：MIME 类型速查与识别（mime-type-lookup）— 内置 53 个常用 MIME 类型，支持扩展名 ↔ MIME 双向互查、中英文关键词模糊检索与按主类型（text/image/audio/video/application 等）分组浏览，展开查看推荐扩展名、charset 与浏览器内联安全性，数据内置纯本地检索
- **新增**：知名端口速查器（well-known-ports）— 内置 30 个 IANA 稳定端口（20/21/22/53/80/443/3306/6379 等），支持单端口 / 批量端口解析、协议过滤、well-known / registered / dynamic 区间判定与中英文关键词检索，数据截至 2026-10，纯本地查询
- **新增**：ASCII 文件树生成器（ascii-tree-generator）— 将路径列表（兼容 `/` 与 `\`）生成 tree 风格 ASCII 目录树，隐式中间目录自动补全，支持字典序 / 输入顺序、最大深度、仅目录与隐藏条目过滤、根名与目录 / 文件统计，一键复制
- **新增**：英文文本可读性评分器（readability-score）— 纯浏览器本地按确定性公式计算 Flesch Reading Ease 与 Flesch–Kincaid Grade Level，输出句 / 词 / 启发式音节计数、平均句长 ASL、平均每词音节 ASY 与七档难度分级及学龄说明，仅支持英文，零词典依赖
- **新增**：vCard 名片生成器（vcard-generator）— 结构化表单生成符合 vCard 3.0（RFC 2426）/ 4.0（RFC 6350）的 .vcf 文本，自动转义反斜杠 / 逗号 / 分号 / 换行，N 五段与 ADR 七段结构化拼接，多电话 / 邮箱、tel: URI、75 字符折行与 CRLF 行尾，支持复制与 Blob 下载

## 2026-10-30 ：【Agent自主迭代】新增 20 个文本脱敏、提交规范、校验和、排版留白、DNS 运维、开发 / SEO 配置、字幕转换、读音编码、ID / 遗留编码、校验位算法、健康代谢、中文数字、几何求解与代数求根工具

- **新增**：PII 敏感信息脱敏工具（pii-mask）— 按手机号、身份证号、银行卡号、邮箱、IPv4 / IPv6 地址、API Key 等规则识别敏感信息并以 `*` / `#` 掩码或整体替换，支持逐行批量、自定义掩码字符与保留前后位数，纯本地正则识别不上传数据
- **新增**：Conventional Commits 提交信息生成器（conventional-commit-generator）— 表单选择 type / scope / 破坏性变更并填写描述与正文，实时生成符合 Conventional Commits 1.0.0 规范的提交信息，内置 feat / fix / docs 等全部类型说明与复制、载入示例
- **新增**：CRC-16 / Adler-32 校验和计算器（crc16-checksum）— 支持 CRC-16/ARC、CCITT-FALSE、XMODEM、MODBUS、GENIBUS、KERMIT 六种 CRC-16 变体与 Adler-32，文本 / Hex 双载体输入，输出十进制与 `0x` 十六进制结果并附各变体多项式、初值、反射参数对照，内置标准校验向量
- **新增**：中英文混排自动留白（盘古之白）格式化器（pangu-spacing）— 在中文与英文 / 数字边界自动插入或移除空格，围栏代码块、行内代码与 URL 内部保持原样，支持双向处理、变更数统计与逐段保护
- **新增**：DNS PTR 反向解析记录名构造器（dns-ptr-builder）— 按 RFC 1035 / RFC 3596 §2.5 将 IPv4 / IPv6 地址构造为 `in-addr.arpa` / `ip6.arpa` 反向域名，支持 `::` 压缩与内嵌 IPv4 解析、按前缀长度（/24、/32 等）生成 zone 名、规范化地址展示与非法输入报错
- **新增**：.gitignore 文件生成器（gitignore-generator）— 勾选语言、框架、编辑器与操作系统模板并追加自定义规则，跨组去重、带分组注释一键生成 .gitignore，内置常见模板与恢复示例
- **新增**：robots.txt 生成器（robots-txt-generator）— 表单配置多组 User-agent、Allow / Disallow、Crawl-delay 与 Sitemap，内置常见爬虫（Googlebot / GPTBot 等）预设与路径校验，生成规范 robots.txt
- **新增**：sitemap.xml 生成器（sitemap-generator）— 粘贴 URL 清单并设置全局 lastmod / changefreq / priority，生成符合 sitemaps.org 协议的 XML 站点地图，自动 XML 转义，非法 URL 报错且超过 5 万条提示拆分
- **新增**：Markdown 目录（TOC）生成器（markdown-toc-generator）— 粘贴 Markdown 自动提取各级标题，生成带 GitHub 风格锚点的嵌套目录，支持有序 / 无序列表、层级范围过滤与一键插回原文，围栏代码块与转义 `#` 自动忽略
- **新增**：Web App Manifest 生成器（web-manifest-generator）— 填写应用名、图标（sizes / type / purpose）、shortcuts、主题色与显示模式等表单，实时生成 PWA manifest.json 与配套 head 引入片段，必填项、颜色与 URL 格式自动校验，空字段自动省略
- **新增**：SRT ↔ WebVTT 字幕转换器（srt-vtt-converter）— 在 SRT 与 WebVTT 之间双向转换，处理逗号 / 点时间戳分隔符、WEBVTT 文件头、NOTE / REGION / STYLE 块、Cue 编号与定位设置，支持整体毫秒级时间轴平移，非法时间戳与负偏移报错
- **新增**：UUID v7 生成器（uuid-v7-generator）— 按 RFC 9562 批量生成 48 位毫秒时间戳前缀的时间有序 UUID v7，批内严格单调递增（rand_b / rand_a 进位），支持反解时间戳与随机段、宽容花括号 / urn:uuid: 输入，基于 crypto.getRandomValues 纯本地生成
- **新增**：.editorconfig 文件生成器（editorconfig-generator）— 表单配置 root 标记、缩进风格与大小、行尾符、字符集、末尾换行与行尾去空格，勾选 JS / TS、JSON / YAML、Markdown、Makefile、HTML / CSS 预设生成覆盖段，实时预览并支持反向解析既有 .editorconfig 回填表单
- **新增**：Soundex 英文读音编码计算器（soundex-codec）— 按 American Soundex（NARA）规则把英文姓名编码为「首字母 + 3 位数字」，实现相邻同音合并、元音分隔与 H / W 不隔断规则，支持逐词批量、同音分组与逐字符推导，内置 Robert / Ashcraft / Tymczak 标准向量
- **新增**：uuencode / uudecode 编解码器（uuencode-codec）— 在文本与经典 Unix uuencode 格式（`begin <mode> <name>` / 6 位分组 / 45 字节分行 / `` ` `` 结束行）间双向转换，解析文件名与权限、长度字节校验截断坏行，兼容空格替代反引号，经典 `Cat`→`#0V%T` 向量可验
- **新增**：Verhoeff / Damm 校验位计算器（verhoeff-damm-checksum）— 按 Verhoeff 置换群五表算法与 Damm 拟群算法为数字串追加或校验校验位，支持批量、逐位推导明细与标准向量验证，纯本地查表运算
- **新增**：BMR 基础代谢与 TDEE 总消耗计算器（bmr-tdee-calculator）— 支持 Mifflin-St Jeor 与 Harris-Benedict 修订版双公式，按性别、身高、体重、年龄计算 BMR，结合活动系数得出 TDEE 并给出减脂 / 维持 / 增肌三档摄入建议
- **新增**：阿拉伯数字 ↔ 中文数字转换器（chinese-number-converter）— 阿拉伯数字与中文数字（普通 / 财务大写 / 口语简式）互转，支持万、亿、万亿分节、零的连读规则与反向解析，基于 BigInt 任意精度纯本地运算
- **新增**：三角形求解器（triangle-solver）— 支持 SSS / SAS / ASA / AAS / SSA 五种已知条件，用正弦定理、余弦定理与海伦公式求解全部边角、面积、周长，SSA 歧义时列出全部两解，并按结果等比绘制 SVG 示意图
- **新增**：一元二次/三次方程求根计算器（polynomial-root-calculator）— 输入系数求解全部实根与共轭复根，二次给出判别式与求根公式代入，三次用 Cardano 法覆盖三实根（casus irreducibilis）、复根与二重/三重根，首项为 0 自动降次，附复平面根分布图与求解步骤

## 2026-10-29 ：【Agent自主迭代】新增 20 个证照校验、地址换算、逻辑运算、周历、区间整理、编码、工程计算、文本抽取、卡校验、统计数学日期与密码学/JSON 工具

- **新增**：居民身份证号校验与解析器（id-card-validator）— 按 GB 11643-1999 校验 18 位身份证（前 17 位加权模 11 校验码），解析签发地行政区划（省级名称）、出生日期、性别与年龄，支持 15 位升 18 位并逐行批量处理
- **新增**：IP 地址格式转换器（ip-address-converter）— IPv4 / IPv6 在点分十进制、压缩写法、整数（BigInt）、十六进制与二进制之间双向批量转换，自动识别输入格式，覆盖 IPv4-mapped IPv6 等边界
- **新增**：布尔表达式真值表生成器（boolean-truth-table）— 解析 AND / OR / NOT / XOR / 蕴含 / 等价表达式（支持符号与关键字两种写法、2–8 个变量），按变量组合输出真值表并判定重言式 / 矛盾式 / 偶真式，结果可一键复制
- **新增**：ISO 8601 周边历双向转换器（iso-week-date-converter）— 公历 YYYY-MM-DD 与 ISO 周边历 YYYY-Www-D 基于序数日算法双向换算，自动识别方向、标注 52/53 周年并对跨年周边界给出归属提示，支持逐行批量
- **新增**：数值区间批量展开器与压缩器（number-range-expander）— 在 `1-5, 10, 12-14` 紧凑区间表达式与离散整数列表间双向批量转换，支持步长 `0-10:2`、负数区间 `-5--1` 与 BigInt 任意精度，压缩时排序去重合并连续段，四种输出分隔符可选
- **新增**：Base91（basE91）文本与字节编解码器（base91-codec）— 按 basE91 算法在文本 / 字节与 91 字符 ASCII 紧凑编码间双向转换，支持 UTF-8、逐行批量与大小写保持，非法字符给出可读错误
- **新增**：增值税计算器（vat-calculator）— 不含税金额 + 税率正向算税额与含税合计、含税总额反向拆分不含税金额与税额，内置 13% / 9% / 6% / 3% / 1% 档位与自定义税率，四舍五入到分且反向拆分三项轧差一致
- **新增**：跑步配速计算器（running-pace-calculator）— 在配速（mm:ss/km）、完赛时间、距离与速度（km/h）间知二求余，内置 5K / 10K / 半马 / 全马预设，配速与速度双向联动，时间格式严格校验
- **新增**：分贝 dB 与增益 / 衰减倍数互转器（db-converter）— 区分功率量（×10·log₁₀）与场量（×20·log₁₀）双定义双向换算，±3 / ±6 / ±10 / ±20 dB 参考值速查，多级增益级联求和，−∞ dB 对应 0 倍
- **新增**：mailto 邮件链接生成器（mailto-link-generator）— 按 RFC 6068 由收件人 / 抄送 / 密送 / 主题 / 正文表单生成 mailto 链接（空格 %20、换行 %0D%0A、hfield 内 @ 编码 %40、多收件人逗号连接），支持一键复制、唤起邮件客户端与反向解析回填，生成 / 解析往返一致
- **新增**：通用正则模式抽取器（pattern-extractor）— 输入正则表达式（字面量或 new RegExp）与文本，实时列出全部匹配、捕获分组与位置索引，支持 g/m/s/u/i/y 标志、matchAll 提取、逐行批量与结果复制，非法正则给出可读错误
- **新增**：银行卡号校验与卡种识别器（bank-card-validator）— Luhn 模 10 校验并推导校验位，按前缀与长度识别 Visa / Mastercard / 银联 / Amex / Discover / JCB / 大来，展示逐位加倍贡献明细与公开测试号一键填入，空格连字符自动归一
- **新增**：描述性统计计算器（descriptive-statistics）— 批量解析数值序列，输出均值、中位数、众数、极差、四分位距、总体 / 样本方差与标准差、和、最值、分位数 Q1/Q3 等 12 项指标，众数多值并列、非法 token 行内提示
- **新增**：复数四则运算与极坐标转换器（complex-number-calculator）— 在 a+bi 与 r∠θ、r·e^iθ 间双向转换（角度 / 弧度可切），两复数加减乘除同时给出直角与极坐标结果、模、主辐角与共轭，除零报错
- **新增**：日期时间差计算与日期加减计算器（date-diff-calculator）— 两日期的年 / 月 / 日分解与总天 / 时 / 分，支持含起止日、仅工作日开关与精确到分钟；基准日施加多段年 / 月 / 周 / 日 / 时 / 分正负偏移，月末按日历月钳制并输出星期，全程 UTC 毫秒运算不受夏令时影响
- **新增**：SRI 子资源完整性哈希生成器（sri-hash-generator）— 按 Subresource Integrity 规范对脚本 / 样式资源内容计算 SHA-256 / 384 / 512 摘要并生成 `algorithm-base64` 完整性字符串与对应 `<script>` / `<link>` 标签，支持文本 / Hex / Base64 多载体输入与多算法并存，纯浏览器本地计算
- **新增**：HKDF 密钥派生计算器（hkdf-calculator）— 按 RFC 5869 展示 Extract（HMAC 输出 PRK）与 Expand（输出 OKM）两阶段，IKM / salt / info 支持文本 / Hex / Base64 载体切换，可选 SHA-256 / 384 / 512 与输出长度（1..255×HashLen），内置 RFC 官方向量自测
- **新增**：PBKDF2 密钥派生计算器（pbkdf2-calculator）— 按 RFC 8018 基于 Web Crypto 执行口令派生，支持 SHA-1 / 256 / 384 / 512、任意正整数迭代次数与 dkLen（上限 65536 字节），salt 支持文本 / Hex 双载体，覆盖 RFC 8018 与 RFC 7914 官方向量并给出参数越界错误
- **新增**：JSON Patch 补丁工具（json-patch）— 按 RFC 6902 顺序应用 add / remove / replace / move / copy / test 六操作与 RFC 6901 JSON Pointer（~0/~1 转义、数组下标、"-" 追加），实时展示结果或带操作序号的精确错误，失败原子回滚、零依赖纯函数
- **新增**：JSON 键名命名风格转换（json-key-case）— 递归遍历嵌套对象与数组，把全部键名在 camelCase / PascalCase / snake_case / SCREAMING_SNAKE_CASE / kebab-case 间批量互转，智能识别缩写与数字边界（v2→v_2），同级撞键给出含路径错误，值与层级原样保留

## 2026-10-28 ：【Agent自主迭代】新增 5 个数制、协议、标识、配置与证照校验工具

- **新增**：二进制 ↔ Gray 码（格雷码）双向转换器（gray-code-converter）— 按 G = B xor (B >> 1) 编码、最高位起逐位异或还原，基于 BigInt 支持任意位宽大整数，输出十进制 / 十六进制对照与逐位推导过程，容忍 0b 前缀、空白与下划线并支持多行批量处理
- **新增**：WebSocket Sec-WebSocket-Accept 握手头计算器（websocket-accept）— 按 RFC 6455 对 Sec-WebSocket-Key 拼接 GUID `258EAFA5-E914-47DA-95CA-C5AB0DC85B11` 后计算 SHA-1 + Base64 得到握手响应头，纯客户端异步摘要并支持一键复制
- **新增**：MongoDB ObjectId 生成与解析器（mongodb-objectid）— 批量生成 24 位十六进制 ObjectId 并反向拆解 4 字节时间戳、5 字节随机值与 3 字节计数器，还原创建时间（UTC / 本地），基于 Web Crypto 生成随机段
- **新增**：JSONC 转标准 JSON（jsonc-to-json）— 词法扫描剥离 `//` 行注释、`/* */` 块注释与 `}/]` 前尾随逗号（正确跳过字符串内部），经 JSON.parse 校验后按 2 空格 / 4 空格 / 压缩单行重新序列化，适合清理 tsconfig.json 等带注释配置
- **新增**：统一社会信用代码校验与解析器（unified-social-credit-code）— 按 GB 32100-2015 以 31 字符集与 17 位加权因子模 31 校验 18 位代码，解析登记管理部门、机构类别、行政区划省级名称（GB/T 2260）与主体标识，末位错误时给出正确校验码

## 2026-10-28 ：【Agent自主迭代】新增 5 个域名编码、字节查看、表格与条码工具

- **新增**：Punycode / IDNA 域名编解码器（punycode-converter）— 按 RFC 3492 在 Unicode 国际化域名与 `xn--` ASCII 兼容编码间双向批量转换，自动处理 `xn--` 前缀、逐标签编解码与越界 / 非基本字符错误
- **新增**：Hex Dump 字节查看器（hex-dump-viewer）— 文本 ⇄ 十六进制双向批量转换，UTF-8 编码、可选空格 / 冒号 / 0x 分隔与大小写，支持偏移量 + 十六进制字节 + ASCII 对照的经典 hexdump 视图
- **新增**：Excel 列名转换器（excel-column-converter）— bijective base-26 列字母（A、AA、XFD）与列序号（1、27、16384）双向批量互转，严格限定 1–16384 列并逐行标注非法输入
- **新增**：文件大小格式化转换器（file-size-converter）— 字节数与人类可读大小双向批量转换，支持 IEC 1024（KiB/MiB）与 SI 1000（KB/MB）双标准、智能小数与千分位解析
- **新增**：EAN-13 / UPC-A 条码校验位工具（ean13-checksum）— 按 GS1 模 10 加权算法为 12/11 位主体补全校验位或校验 13/12 位完整条码，错误时给出正确校验位与纠正编码

## 2026-10-28 ：【Agent自主迭代】新增 10 个随机抽签、编码、电学、调试、字符集、协议、颜色与配置工具

- **新增**：密码学安全随机工具（secure-random-picker）— 基于 crypto.getRandomValues 拒绝采样的无偏随机整数、抽签、随机分组与列表 Fisher–Yates 洗牌，支持自定义区间、数量、允许重复开关与分组均分
- **新增**：Bech32 / Bech32m 编解码器（bech32-codec）— 按 BIP-173 / BIP-350 在 HRP 与数据间双向转换，自动校验并区分两种校验和常数，覆盖 SegWit 地址等官方测试向量
- **新增**：欧姆定律与功率计算器（ohms-law-calculator）— 输入 V / I / R / P 中任意两个联立求解其余两个，标注推导公式、自适应单位换算，R/P 组合给出正负极性双解并拒绝零除等物理矛盾
- **新增**：Cookie 字符串解析与生成器（cookie-parser）— Cookie 请求头与可编辑名值对表格双向转换（可选 URL 编解码），按 RFC 6265 生成 / 回填 Set-Cookie 全属性并校验 SameSite=None 必须配 Secure
- **新增**：ASCII 码表查询器（ascii-table）— 完整 0–127 码位的 Dec/Hex/Oct/Bin/Char/缩写/说明对照，字符与码位双向检索、分类与关键字筛选、Ctrl 组合键速查及点击行复制
- **新增**：Base62 编解码器（base62-codec）— 文本 / 字节与 Base62 间双向编解码，支持默认与 GMP 两种字母表、原始字节与整数模式、分组批量处理及字符级错误定位
- **新增**：Varint 编解码器（varint-codec）— Protobuf LEB128 无符号 / ZigZag 有符号变长整数与十六进制、字节列表互转，逐字节展示延续位与载荷位拼接，覆盖边界值与非法编码诊断
- **新增**：HTTP 状态码速查（http-status-codes）— 按 1xx–5xx 分类速查 IANA 常见状态码（100–511）的中英文名称、典型场景、排错建议与重试指引，支持编号前缀与中英文关键词实时检索
- **新增**：RGB / CMYK 色彩转换器（rgb-cmyk-converter）— 屏幕色 RGB / HEX 与印刷四色 CMYK 按标准 black-generation 公式双向实时换算，同步 HSL 与色块预览，滑块 / 数字 / 原生取色器联动并内联报错
- **新增**：.env 配置格式转换器（env-converter）— dotenv / JSON / 扁平 YAML / shell export 四格式实时互转，支持引号转义、注释、export 前缀与值内含 =，非法键名等错误带行号、重复键告警

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

- **新增**：Geohash 编解码器（geohash-codec）— 经纬度与 Base32 Geohash 串互转，支持 1–12 位精度选择、逐字符区间二分过程展示与解码中心点 / 边界框 / 误差输出
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
