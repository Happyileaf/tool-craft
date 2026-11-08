# apps/web 变更日志

> 变更日志填写规范见 [docs/guide/changelog-guide.md](../../docs/guide/changelog-guide.md)。

## 日志

## 2026-11-09 ：【Agent自主迭代】新增 10 个 Hamming 纠错、月相月龄、MessagePack 编解码、HTTP 报文解析、调度场可视化、CSS Transform 矩阵、多时区会议、个税、Frontmatter 编辑与 cron/systemd 定时器互转工具

- **新增**：CSS Transform 矩阵计算器（css-transform-matrix-calculator）— 按书写顺序把 translate/scale/rotate/skew 函数链合成为 4×4 列主序矩阵并输出 matrix()/matrix3d()，支持反向 unmatrix 分解与实时预览，纯函数零依赖，纯本地运算
- **新增**：多时区会议规划器（multi-timezone-meeting-planner）— 基于浏览器原生 Intl 时区能力为多个 IANA 时区生成 24 小时可开会热力网格与未来 7 天全员工作时间重叠区间，DST 自适应、无外部时区数据库，纯本地运算
- **新增**：中国个人所得税计算器（cn-income-tax-calculator）— 按 7 级超额累进税率计算工资薪金累计预扣预缴 12 个月明细与税后到手，支持四项收入年度汇算（80%/56% 口径）与全年一次性奖金单独计税并给出补退税结论，纯本地运算
- **新增**：Markdown Frontmatter 编辑器（markdown-frontmatter-editor）— 识别 --- YAML 与 +++ TOML 两种定界并切分元数据与正文，键值表单增删改、单层嵌套键与数组编辑后实时回写且正文原样保留，支持 YAML/TOML 互转与错误行号定位，纯本地运算
- **新增**：cron 表达式与 systemd OnCalendar 定时器互转工具（cron-systemd-timer-converter）— 标准 5 段 cron 与 OnCalendar 双向转换（列表/范围/步进/命名快捷方式），提示日与星期 OR/AND 语义陷阱及秒级年级降级，双引擎推演未来触发时刻对照，纯本地运算
- **新增**：Hamming(7,4) 编解码与纠错演示（hamming-codec）— 对 4 位数据位生成 3 位校验位并支持单比特错误注入与自动纠错，逐位展示校验子（syndrome）定位过程，纯函数零依赖，纯本地运算
- **新增**：月相查询与月龄计算器（moon-phase-calculator）— 基于 Julian Day 与朔望月 29.53059 天取模计算月龄、八相位分档、照亮比例与邻近新月/满月日期，CSS clip-path 绘制月相，纯本地运算
- **新增**：MessagePack ↔ JSON 双向编解码器（messagepack-codec）— 按 msgpack 规范实现完整类型表与整数最紧凑宽度（含 BigInt 64 位路径），支持 HEX/Base64 输入、字节转储与带偏移错误，官方向量逐字节验证，纯本地运算
- **新增**：原始 HTTP 报文解析器（http-message-parser）— 自动识别请求/响应并结构化起始行、Query、Headers 与 Body，兼容 CRLF/裸 LF、折叠续行与重复头，展开 Cookie/Set-Cookie/Authorization/chunked 等并定位畸形报文，纯本地运算
- **新增**：调度场算法可视化（shunting-yard-visualizer）— Dijkstra 调度场把中缀表达式转后缀 RPN 并逐步值栈求值，回放运算符栈/输出队列每步快照，支持一元负号、右结合幂、函数与常量及带定位错误，纯本地运算

## 2026-11-08 ：【Agent自主迭代】新增 15 个 Java 描述符、E.123 电话格式、DMARC 记录、Plus Codes、CHANGELOG 生成、LRC 歌词解析、BAC 估算、LC 谐振、加班工资、定价计算、抽样样本量、任意进制转换、CRC 模型、三相功率与音乐音高工具

- **新增**：Java 内部类名与描述符转换器（java-descriptor-converter）— 按 JVMS §4.2/§4.3 在内部名与源码类名之间互转，生成并解析字段与方法描述符，覆盖数组维度、原始类型与引用类型，非法描述符定位到具体字符，纯本地运算
- **新增**：ITU E.123 电话号码格式化器（e123-phone-formatter）— 按 ITU-T E.123 剥离可视分隔符，在 E.164 无分隔形式与人类可读分组形式之间双向转换，支持空格/点号/连字符、本地括号长途区号与批量逐行处理，非法字符逐条标记，纯本地运算
- **新增**：DMARC 记录生成与校验器（dmarc-record-generator）— 按 RFC 7489 拼装 _dmarc DNS TXT 记录，可视化配置 p/sp/rua/ruf/adkim/aspf/fo/pct/rf/ri 标签，并对现有记录做语法校验、未知标签提示与策略冲突检查，超长记录按 255 字符分段，纯本地运算
- **新增**：Plus Codes 编解码器（plus-code-codec）— 移植 Google 官方 Open Location Code 整数算法，经纬度编码支持 2–15 位码长，完整码解码输出中心点、边界框与格子精度，并支持参考点短码 shorten/recover，结果与官方全量测试向量逐位一致，纯本地运算
- **新增**：CHANGELOG.md 生成器（Keep a Changelog）（changelog-generator）— 把一批 Conventional Commits 提交信息（含 git oneline 短哈希）解析分组为 Keep a Changelog 1.1.0 片段，安全/弃用/移除关键词语义识别，破坏性变更置顶，支持版本日期标题、作用域前缀、内部类型收录开关与 CHANGELOG.md 下载，纯本地运算
- **新增**：LRC 歌词时间戳生成与解析器（lrc-parser）— 在 [mm:ss.xx] 时间戳与毫秒之间双向换算（支持百分秒四舍五入进位），解析多时间标签、元数据标签与重复段落并可重新序列化，纯函数零依赖，纯本地运算
- **新增**：Widmark 血液酒精浓度（BAC）估算器（bac-calculator）— 按 Widmark 公式由性别、体重、饮酒明细（体积/酒精度/饮品数）与经过时间估算峰值与当前 BAC，区分男 0.68/女 0.55 水分系数、0.015/小时代谢率与 14g 标准杯，含清醒所需时间与安全提示，纯本地运算
- **新增**：LC 谐振频率与电抗计算器（lc-resonance-calculator）— 按 f₀=1/(2π√(LC)) 双向求解谐振频率/电感/电容，自动换算 H/mH/µH/nH 与 F/µF/nF/pF 工程单位，并计算容抗 Xc、感抗 Xl 与常用标准 L/C 组合参考，纯本地运算
- **新增**：加班工资计算器（中国大陆劳动法）（overtime-pay-calculator）— 依据劳动法第四十四条按 21.75 月计薪天数与 8 小时工时折算日薪/时薪，分项计算工作日延时 150%、休息日 200%、法定节假日 300% 加班费与当月应发总额，附倍率法规依据，纯本地运算
- **新增**：毛利率 / 加价率 / 售价双向定价计算器（pricing-margin-calculator）— 严格区分毛利率（分母为售价）与加价率 markup（分母为成本），在成本/售价/毛利率/加价率/毛利额间双向求解，支持批量定价 CSV、多档折扣保本分析与口径互转对照表，纯本地运算
- **新增**：调查抽样样本量与误差范围计算器（survey-sample-size-calculator）— 基于 Cochran 公式与有限总体校正 FPC 双向求解所需样本量与可达误差幅度，内置 80%–99.9% 置信水平 z 分位数（逆正态 CDF 逼近），并按设计效应与应答率折算实际招募量，纯本地运算
- **新增**：任意进制（2–36）转换器（base-n-radix-converter）— 全程 BigInt 支持任意长度整数与 2–36 进制互转，兼容 0x/0o/0b 前缀、下划线分隔与负数，内置标准 0–9A–Z 与 Crockford Base32 字母表、非法字符逐位定位及常用进制对照表，纯本地运算
- **新增**：CRC 模型参数化计算器（crc-model-calculator）— 按 Rocksoft 模型用 BigInt 实现 width 1–64 通用 CRC，内置 CRC-8/16/32/32C/64-XZ 等 12 个标准模型并附 check 自检，支持多项式/初值/反射/异或输出自定义、字节流文本与 HEX 双输入及结果位宽校验，纯本地运算
- **新增**：三相交流电路功率 / 功率因数 / 扭矩换算计算器（three-phase-power-calculator）— 按 P=√3·U·I·cosφ 与功率三角 S²=P²+Q² 双向求解有功/无功/视在功率与相位角，区分星形/三角形相电压相电流，反推线电流并按 T=9550P/n 计算电机轴扭矩，纯本地运算
- **新增**：音乐音高与频率互算器（music-pitch-converter）— 基于十二平均律在科学音高记法（A4、C#5）与 Hz 间双向换算，支持自定义 A4 调音基准（440/432/442/415 Hz），计算任意两音半音数、音程名称、频率比与音分距离并输出整八度频率表，纯本地运算

## 2026-11-07 ：【Agent自主迭代】新增 5 个 Luhn 校验、闰秒 TAI 转换、CORS 头、DKIM 记录与 PO/JSON 转换工具

- **新增**：Luhn 模 10 校验码生成与批量校验器（luhn-check-generator）— 按 ISO/IEC 7812 Luhn 模 10 算法生成校验位并批量验证卡号/IMEI 等编号，自动归一空格连字符，输出逐行合法/非法判定与统计，非法或空输入带行号告警，纯本地运算
- **新增**：闰秒 TAI ↔ Unix 时间转换器（leap-second-tai-converter）— 内置截至 2017 年的 IERS 闰秒表（28 条边界、TAI−UTC 偏移 10→37 秒），双向换算 Unix 与 TAI 秒、闰秒日判定与 UTC 格式化，边界表区间定位避免迭代不收敛，附闰秒明细可查表，纯本地运算
- **新增**：CORS 响应头与 nginx 片段生成器（cors-header-generator）— 按 Fetch 标准由来源模式（通配/反射/白名单）、凭证、方法与头配置生成 Access-Control-* 响应头与预检头，拦截凭证与通配互斥等非法组合，反射模式自动补 Vary: Origin 并输出可直接粘贴的 nginx 配置，纯本地运算
- **新增**：DKIM DNS TXT 记录生成器（dkim-record-generator）— 按 RFC 6376 拼装 <selector>._domainkey.<domain> 的 v=DKIM1 TXT 记录，接受 PEM 或裸 Base64 公钥并自动清洗，校验选择器/域名/tag-value 语法、弱 RSA 密钥告警，超长记录按 RFC 1035 自动 255 字符分段，纯本地运算
- **新增**：gettext PO/POT ↔ JSON 双向转换器（po-json-converter）— 零依赖行状态机解析 msgctxt、msgid_plural 复数、msgstr[n]、跨行续行字符串、C 风格转义与 # 注释并输出结构化 JSON，也可从 JSON 反向序列化合法 PO，错误带原文行提示，固定样本往返单测覆盖，纯本地运算

## 2026-11-07 ：【Agent自主迭代】新增 5 个集合相似度、邮箱语法、骰子概率、Syslog 解析与 Markdown 链接检查工具

- **新增**：集合相似度计算器（set-similarity-calculator）— 多组命名集合的成员解析与去重，两两计算 Jaccard、Dice（Sørensen）与 Overlap 三种系数，两空集判 1、单空集判 0 并内置除零保护，输出配对表与对称热力矩阵（对角线为 1），支持忽略大小写、最多 6 组集合与 CSV 导出，纯本地运算
- **新增**：邮箱语法校验器（email-syntax-validator）— 依据 RFC 5321/5322 校验本地点原子串、引号字符串、IPv4/IPv6（含字面量标签）与域名层次，覆盖 local≤64、总长≤254、连续点、首尾点、IDN 非 ASCII 等规则，逐条给出错误与警告并拆解 local/domain 结构，仅做语法校验不验证邮箱真实性，纯本地运算
- **新增**：骰子投掷概率计算器（dice-roll-probability）— 解析 NdS±M 与 kh/kl/dh/dl 保留/重掷规则表达式（含数量边界与负骰子项校验），基于概率动态规划输出精确分布、期望值、极值与 P(X≥目标)，规避大组合数整数溢出，RNG 可注入且默认使用 crypto.getRandomValues，含投掷历史与分布直方图，纯本地运算
- **新增**：Syslog 日志行解析器（syslog-parser）— 自动识别 RFC 5424 / RFC 3164 与无 PRI 未知文本，解码 PRI 为 facility/severity 编码与标准名称并对越界值报错，按括号深度匹配展开多相邻结构化数据（SD）块与转义还原，处理 NILVALUE 与 UTF-8 BOM，批量输出格式计数与错误行统计、空行跳过，纯本地运算
- **新增**：Markdown 链接检查器（markdown-link-checker）— 静态提取行内、引用式（含紧凑/简写）、引用定义、自动链接与裸 URL 五类链接并标注图片，按 CommonMark 标签折叠检查未定义引用、未使用定义与重复定义，按 GitHub slug 规则校验 ATX/Setext 标题的页内锚点，围栏与行内代码自动跳过、零网络请求，纯本地运算

## 2026-11-07 ：【Agent自主迭代】新增 5 个电话号码规范化、向量运算、多边形量算、GPA 与电阻网络工具

- **新增**：E.164 电话号码规范化器（phone-e164-normalizer）— 内置 CN/HK/TW/JP/GB/US 六个国家/地区区号与规则，把自由文本中的固话、手机号清洗为 E.164 国际格式，支持批量逐行解析、默认国家/地区兜底与结构合法性校验，明确提示仅做结构校验不保证号码真实存在，纯本地运算
- **新增**：二维/三维向量运算计算器（vector-calculator）— 支持加减、数乘、点积、叉积（仅 3D）、模长、归一化、夹角（弧度/角度）、标量与向量投影，零向量归一化/投影与 2D 叉积等非法操作逐条报错，纯本地运算
- **新增**：多边形面积与周长计算器（polygon-area-calculator）— 鞋带公式量算有符号/绝对面积、周长与环方向（CCW/CW），支持手动坐标逐行输入与 GeoJSON Polygon/MultiPolygon 粘贴，孔洞环净面积扣减、闭合点自动去重、自相交检测告警，纯本地运算
- **新增**：GPA 平均绩点计算器（gpa-calculator）— 百分制分数与字母等级混录，并列对照标准 4.0、改良 4.3（A+ = 4.3）与中国高校百分制分段三套口径的学分加权 GPA，附总学分、算术平均分与逐课程绩点明细，学分非正、成绩越界、未知等级逐条报错，纯本地运算
- **新增**：电阻串并联等效与公差累积计算器（resistor-network-calculator）— 解析 10k/4k7/2R2/1M 工程简写，计算纯串/纯并拓扑标称等效、最坏情况阻值上下界与按并联灵敏度加权的 RSS 公差，跨数量级推荐最接近 E24 标准阻值，并联 0Ω 短路等非法输入明确报错，纯本地运算

## 2026-11-06 ：【Agent自主迭代】新增 5 个 BCP 47 解析、CSS 命名颜色、正则速查、HTTP 方法与 HTTP 头字段参考工具

- **新增**：BCP 47 语言标签解析器（unicode-bcp47-lookup）— 依据 RFC 5646 ABNF 把标签拆分为 language/extlang/script/region/variant/extension/privateuse，输出推荐大小写规范化标签并支持复制，结构化解析 Unicode u 扩展的 attribute 与 keyword，识别 grandfathered 遗留标签与 x- 私有段，对非法字符、下划线分隔、重复扩展前缀、超长等问题逐条给出错误或警告，内置常用 ISO 639/15924/3166/UN M.49 子标签表交叉验证，纯本地运算
- **新增**：CSS 命名颜色速查（css-named-colors-lookup）— 内置 CSS Color Level 4 全部 148 个命名颜色（含 rebeccapurple）与标准 RGB/HEX/HSL 值，支持名称片段搜索、#hex/rgb()/hsl() 颜色值反查、RGB 欧氏距离最近 5 色推荐、基础 16 色分组与字母/色相排序，色卡一键复制 HEX 并附 transparent/currentcolor 关键字说明，纯本地离线运算
- **新增**：正则表达式语法速查（regex-cheatsheet）— 8 大分类 32 条 JavaScript 正则语法（字符类、量词、锚点、分组引用、环视、交替转义、g/i/m/s/u/y 标志位、Unicode 属性转义），每条附可运行示例与匹配/不匹配样例并由浏览器原生 RegExp 渲染时实时实测、展示实际命中文本与零宽匹配，支持关键字搜索（look 直达环视）与分类折叠，另附 JS 与 Python/Java/PCRE 引擎差异说明，纯本地离线运算
- **新增**：HTTP 请求方法速查（http-methods-reference）— 依据 RFC 9110/9111/5789 内置 GET/HEAD/POST/PUT/DELETE/CONNECT/OPTIONS/TRACE/PATCH 共 9 个标准方法的 safe/idempotent/cacheable/请求体属性、RFC 来源、典型场景、常见误用与请求响应文本示例，支持方法名与「幂等」等关键字搜索及常用/特殊方法分组，附 PUT vs PATCH、POST vs PUT、OPTIONS 与 CORS 预检三组专题对比，纯本地离线运算
- **新增**：HTTP 头字段速查（http-headers-reference）— 内置 7 大类 51 个常用头（通用/请求/响应/实体/缓存/CORS/安全），逐条标注请求响应方向、逐跳 hop-by-hop 与 Fetch 标准禁止修改属性、RFC 来源、取值示例与安全注意（含 Authorization/Cookie/Set-Cookie 及全部安全头），支持关键字、分类与方向三维过滤，另附基础安全头组合、Cookie 安全属性、CORS 凭据搭配三组安全实践专题，纯本地离线运算

## 2026-11-06 ：【Agent自主迭代】新增 5 个 JSON 差异、SSE 编解码、.gitattributes 生成、Intel HEX 解析与 Patch 解析工具

- **新增**：JSON 结构化差异对比（json-diff）— 解析两份 JSON 后递归做语义级对比，按 JSONPath 风格路径输出新增、删除、值修改与类型变化四类差异，数组按索引逐项对比并报告长度变化，忽略键序与缩进差异，左右解析失败分别报错，支持交换左右与复制结果，纯本地运算
- **新增**：SSE 消息格式编解码器（sse-codec）— 依据 HTML 标准 §9.2 实现 text/event-stream 双向转换，编码支持 data/event/id/retry 与注释心跳、多行 data 自动拆分，解码兼容 LF/CR/CRLF、空行派发与缓冲重置，无 data 事件按规范跳过并计数，畸形 retry 等输入带行号告警，编解码往返一致，纯本地运算
- **新增**：.gitattributes 生成器（gitattributes-generator）— 表单化配置全局换行符策略、文本/二进制属性、merge/diff driver、Linguist 覆盖与 export-ignore，内置图片/字体/压缩包等二进制预设与 Node/Python/Unity/Web 项目模板，规则可逐条启用停用，实时预览并校验空 pattern 与缺值属性，纯本地运算
- **新增**：Intel HEX 解析与校验和工具（intel-hex-parser）— 逐行解析六种 record type 并验证校验和（错误给出行号、期望值与实际值），基于扩展段/线性地址记录计算绝对地址与地址范围，汇总数据字节数与类型分布、检查 EOF 合法性，支持一键重算修复全部校验和，畸形行带行号定位且不中断解析，纯本地运算
- **新增**：Unified Diff / Patch 解析查看器（diff-patch-parser）— 消费现成 unified diff/git patch 文本，识别 diff --git、new/deleted file mode、rename/copy 与权限变化，按 @@ hunk 头分组统计每文件新增/删除行数并着色展示，缺 hunk 头、行数声明不符、坏前缀等畸形补丁带行号定位，纯本地运算

## 2026-11-05 ：【Agent自主迭代】新增 10 个文本换行、UPC-E、BCD、干支纪年与 SQL 字面量等工具

- **新增**：文本自动换行与行宽格式化器（text-wrap-formatter）— 按指定列宽对纯文本/注释/段落做硬换行与软换行重组，支持 Markdown 列表与引用前缀续行、保留代码块与空段落、中英混排按显示宽度折行，可批量处理多行并一键复制，纯本地运算
- **新增**：UPC-E 与 UPC-A 条码转换器（upc-e-converter）— 按 GS1 规则在 12 位 UPC-A 与 8 位 UPC-E 之间双向转换，零抑制压缩模式 N0–N4 自动判别、校验位按 UPC-A 全长重算，批量逐行处理并对非法系统码、零抑制条件与校验位逐条报错，纯本地运算
- **新增**：BCD 码编解码器（bcd-codec）— 支持 8421、余 3、2421 三种码制的编码/解码与打包 BCD（packed BCD）字节打包/解包，奇数位数字末 nibble 按 0xF 惯例填充并双向提示，非法码组（如 1010 在 8421 下）逐条定位报错，纯本地查表运算
- **新增**：干支纪年与生肖转换器（sexagenary-cycle）— 公历年与六十甲子双向换算，正向输出天干地支、甲子序号（1–60）、生肖、五行与阴阳，反向按序号或干支组合推算指定区间内全部公历年份，含完整六十甲子循环表与非法干支组合校验，按 year-based 口径标注立春/春节差异，支持公元前年份，纯本地运算
- **新增**：SQL 字符串转义与 LIKE 通配符工具（sql-literal-escape）— 标准 SQL 双写单引号与 MySQL 反斜杠序列双向转义，反转义严格校验未闭合引号、未知转义序列与孤立反斜杠；LIKE 模式转义 %、_ 通配符并生成 LIKE '...' ESCAPE '\' 完整表达式，支持批量处理，纯本地运算
- **新增**：安全随机数据生成器（random-data-generator）— 基于 crypto.getRandomValues 拒绝采样消除取模偏差，支持整数/浮点/布尔、十六进制与 RGB 颜色、UUID v4、姓名/邮箱/手机号、英文单词与 Lorem 段落、ISO 日期时间共 12 类随机数据，数量 1–500 可调，结果一键复制/导出，纯本地运算
- **新增**：单位换算器（unit-converter）— 覆盖长度、质量、温度、面积、体积、速度、数据存储（KB/KiB 双体系）、时间、角度、压力、能量 11 大分类 70+ 单位，factor+offset 统一线性模型正确处理温标平移，支持单位互换与同分类全单位快速换算表，纯本地运算
- **新增**：图片与 Base64 Data URI 互转器（image-data-uri-converter）— 支持 PNG/JPEG/GIF/WebP/SVG/BMP/ICO/AVIF 图片拖拽或点选编码为 data:image/...;base64 文本，反向解码时做 MIME 白名单校验与文件头魔数交叉验证（不一致告警），含图片预览、复制与下载、20MB 大小限制，组件卸载自动回收 ObjectURL，纯本地运算
- **新增**：开源许可证生成器（license-generator）— 内置 MIT、Apache-2.0、BSD-2-Clause、BSD-3-Clause、ISC、GPL-3.0、Unlicense 共 7 种 SPDX 官方完整许可证文本，仅替换年份与著作权人占位符、条款原文逐字保留，提供 copyleft 强度/专利授权/适用场景对比，支持全文复制与 LICENSE 文件下载，纯本地运算
- **新增**：CSS clamp 流式排版生成器（clamp-typography-generator）— 输入最小/最大字号与对应视口宽度自动推导线性斜率、vw/cqw 系数与截距，生成可直接粘贴的 font-size: clamp() 声明，支持 vw 与 cqw 容器查询单位、实时文字预览及 320–1920px 多视口字号采样表（标注钳制/线性区间），参数非法即时报错，纯本地运算

## 2026-11-05 ：【Agent自主迭代】新增 5 个模运算、位掩码、HOTP、IP 范围聚合与 JSON 转 DDL 工具

- **新增**：模运算计算器（modular-arithmetic-calculator）— 支持模逆元（扩展欧几里得）、模幂（平方-乘，含负指数）、线性同余方程求解与中国剩余定理 CRT（支持非互素模数与冲突检测），大整数全程 BigInt 运算，CRT 同余方程组可增删编辑，非法输入逐条中文报错，纯本地运算
- **新增**：位掩码可视化计算器（bitmask-calculator）— 8/16/32/64 位宽下的可点击比特网格与二进制/八进制/十进制/十六进制四进制联动，支持置位/清位/取反/测位、AND/OR/XOR/NOT/NAND、逻辑与算术移位及循环移位（含 64 位回绕）、MSB/LSB/置位数与有符号二补码互转，纯本地运算
- **新增**：HOTP 一次性密码生成与校验器（hotp-generator）— 遵循 RFC 4226，支持 Base32/Hex/文本密钥与 SHA-1/SHA-256/SHA-512、6–10 位验证码，基于 Web Crypto HMAC 动态截断生成，提供计数器步进、look-ahead 窗口校验（常量时间比较）与 RFC 4226 标准向量实时对照表，纯本地运算
- **新增**：IP 范围转 CIDR 聚合与超网合并器（ip-range-to-cidr）— 把 IPv4/IPv6 起止地址范围贪心聚合为数量最少且无重叠无遗漏的 CIDR 前缀，并支持一组重叠/相邻 CIDR 的去重与逐级超网合并，全程 BigInt 承载 128 位地址、IPv6 输出遵循 RFC 5952，结果表格含每块起止地址与地址总数，纯本地运算
- **新增**：JSON 转 SQL 建表语句生成器（json-to-sql-ddl）— 粘贴 JSON 对象或对象数组，综合多样本推断 BOOLEAN/INTEGER/BIGINT/DOUBLE/VARCHAR·TEXT/JSON 类型、VARCHAR 长度余量与阈值退化、null 与缺失驱动的 NOT NULL、snake_case 列名与保留字处理，生成 MySQL/PostgreSQL/SQLite 三方言 CREATE TABLE（自增主键、IF NOT EXISTS、DROP TABLE 前缀、列注释），JSON 语法错误行号级提示，纯本地运算

## 2026-11-04 ：【Agent自主迭代】新增 5 个 555 多谐振荡、露点、墨卡托瓦片、访问日志解析与以太坊 RLP 编解码工具

- **新增**：NE555 非稳态多谐振荡器计算器（ne555-astable-calculator）— 按 f = 1.44/((R_A+2R_B)C) 计算频率、周期、占空比与高低电平时间，支持 nF/µF、Ω/kΩ/MΩ 词头自适应与给定目标频率的参数估算，输出充放电波形示意，电阻 / 电容非法值逐条中文报错，纯本地运算
- **新增**：露点 / 湿球温度计算器（dew-point-calculator）— 按 Magnus 公式与 Stull（2011）湿球经验式由温度与相对湿度计算露点温度、湿球温度、绝对湿度（g/m³）、水汽压与热指数，支持摄氏 / 华氏切换，并由气压与露点反算压力高度，超范围输入给出告警，纯本地运算
- **新增**：Web 墨卡托 XYZ 瓦片计算器（mercator-tile-calculator）— 在经纬度、缩放级（z0–z22）与 Google/OSM XYZ 瓦片号之间双向换算，支持 TMS 瓦片号翻转、瓦片边界经纬度框、分辨率（m/px）与比例尺，批量表格逐行计算并对纬度 ±85.0511° 范围外输入报错，纯本地运算
- **新增**：NCSA 访问日志解析器（access-log-parser）— tokenizer 级解析 Common / Combined Log Format（引号与方括号转义、可选 request_time 扩展），CLF 本地时间带偏移转 UTC ISO（含跨 UTC 日期的近午夜时间与闰日校验），一次遍历聚合成功率、状态码分类 / Top、流量字节、Top IP/路径/UA、时间跨度与 QPS，畸形行不中断批量解析并带行号定位，纯本地运算
- **新增**：以太坊 RLP 编解码器（rlp-codec）— 按黄皮书附录 B 实现递归长度前缀双向编解码，支持 UTF-8 文本与 `["hex","0x.."]` 原始字节输入、任意嵌套列表，解码以类型树（单字节 / 短字符串 / 长字符串 / 短列表 / 长列表）与扁平表格展示偏移与长度；严格 canonical 校验（前导零、长短格式误用、单字节包裹、截断、根外尾字节均带偏移报错），嵌套深度上限 64，官方向量（dog / Lorem 56B / 1024 零字节等）逐字节验证，纯本地运算

## 2026-11-04 ：【Agent自主迭代】新增 5 个 JSON 转 Java、C#、Kotlin、PHP 数组与 Swift 模型代码生成工具

- **新增**：JSON → Java class/record 生成器（json-to-java）— 粘贴 JSON 推断生成嵌套 Java 模型：整数按范围映射 int/long/BigInteger、浮点 double/BigDecimal、boolean/String/Object，同型对象数组合并字段生成 List<Item>，空/异型数组回退 List<Object> 并告警，null 与缺失字段输出装箱类型，支持 record 与传统 class（含 isXxx boolean 访问器）、List/[] 集合、大数类型与 package 声明，纯本地运算
- **新增**：JSON → C# record/class 生成器（json-to-csharp）— 粘贴 JSON 推断生成嵌套 C# 模型：int/long/double/bool/string/object 映射、List<T> 集合、同型对象数组合并字段，PascalCase 属性名与 @ 关键字转义，支持 record 与传统 class（{ get; set; }）、#nullable enable 可空引用类型（null/缺失字段加 ?）与 namespace 声明，纯本地运算
- **新增**：JSON → Kotlin data class 生成器（json-to-kotlin）— 粘贴 JSON 推断生成内嵌 data class：Int/Long/Double/Boolean/String/Any 映射与 Int→Long→Double 数值拓宽，List<T>/Array<T> 可切换，null/缺失字段输出 T? = null，preserve/camelCase 属性命名，非法键与硬关键字自动转义并附加 Gson @SerializedName 注解，重名嵌套类编号，可选 package，纯本地运算
- **新增**：JSON → PHP 数组生成器（json-to-php）— JSON 对象转关联数组（'key' =>）、数组转索引数组，递归任意嵌套，字符串按 PHP 单引号规则转义，int/float 保留字面量精度，布尔/null/空数组忠实映射，支持短数组 [] 与传统 array() 语法、4 空格/Tab 缩进、结尾分号开关，输出 $data 赋值语句，纯本地运算
- **新增**：JSON → Swift struct 生成器（json-to-swift）— 粘贴 JSON 推断生成 struct: Codable 模型：Int/Double/Bool/String/Any 映射、[T] 数组与同型对象数组合并，空/异型数组回退 [Any] 并告警，null/缺失字段输出 T?，snake_case/连字符键转 camelCase 并生成 CodingKeys（保留未改名字段），Swift 关键字反引号转义，重名结构体编号，顶层数组/标量自动包装，纯本地运算

## 2026-11-04 ：【Agent自主迭代】新增 5 个 SMD 电阻码、AWG 线规、CUSIP/SEDOL、ABA 路由号校验与 JSON 转 Zod 工具

- **新增**：SMD 电阻码计算器（smd-resistor-code）— 支持 3 位（含 R 小数点）、4 位（精密）、EIA-96（两位代码 + 倍率字母，01–96 查表）三种贴片电阻打码体系双向换算与允差判定，内置阻值→标准 E 系列最近邻匹配与非法代码逐条报错，批量模式逐行解析多枚电阻打码，纯本地查表运算
- **新增**：AWG 美国线规计算器（awg-wire-calculator）— 按 ASTM B258 标准以 0.127 mm × 92^((36-n)/39) 计算 0000–40 AWG 裸线直径与截面积，支持 mΩ/Ω/kΩ per 1000 ft/km、电阻↔长度互算、单股↔多股绞线等效换算，mm/AWG/in²/mil² 单位自适应，内置常用线规速查表，纯本地运算
- **新增**：CUSIP / SEDOL 证券识别码校验器（cusip-sedol-validator）— 按长度自动识别体系：CUSIP 9 位按偶数位 ×2 拆位求和模 10、SEDOL 7 位按 1,3,1,7,3,9 加权并禁用元音字母，输出实际 / 期望校验位与逐字符加权明细，支持主体补全校验位、空白连字符归一与批量逐行校验，纯本地运算
- **新增**：ABA 路由转账号校验器（aba-routing-validator）— 按美国银行家协会标准对 9 位 RTN 执行 3,7,1 循环加权模 10 校验，核验前两位 FRB 分区合法前缀（01–12 / 21–32 / 61–72 / 80），拆解联邦路由符号（4 位）、机构标识（4 位）与校验位并给出分区名称，支持空格 / 连字符归一与批量逐行校验带行号定位，纯本地运算
- **新增**：JSON → Zod schema 生成器（json-to-zod）— 粘贴一个或空行分隔的多个 JSON 样例推断生成 Zod v3 schema 源码：整数 z.number().int()、布尔、null、空数组退化 z.unknown()，字符串按样本提示 email/uuid/url/datetime/date，重复离散值推断 z.enum，嵌套对象提升为具名 const（按依赖深度排序输出，无 TDZ），多样例合并缺失字段 .optional()、null 字段 .nullable()、异型值 z.union / z.literal，支持根名、2/4 空格缩进与导出开关，仅生成代码文本不引入 zod 运行时依赖，纯本地运算

## 2026-11-04 ：【Agent自主迭代】新增 5 个 SPF 记录、VIN 校验、电阻分压、摩尔质量与字节数组代码生成工具

- **新增**：SPF 记录生成与校验器（spf-record-generator）— 按 RFC 7208 可视化拼装与词法校验 v=spf1 TXT 记录，支持限定符与 ip4/ip6/a/mx/ptr/include/exists/all 机制及 redirect=，逐项报错非法机制 / IP / CIDR / 域名，按 §4.6.4 统计 10 次 DNS 查询上限，提示 +all 风险、all 非末尾、all 与 redirect 共存与超 255 字节，内置常见邮件服务商 include 模板，纯本地运算
- **新增**：VIN 车辆识别代号校验位计算器（vin-validator）— 按 ISO 3779 / GB 16735 对 17 位 VIN 执行转码 × 权重求和模 11 校验（余数 10 → X），校验长度与禁用字母 I/O/Q，自动归一化大写 / 空白 / 连字符，antd 表格逐位展示字符 / 转码值 / 权重 / 乘积并高亮校验位，纯本地运算
- **新增**：电阻分压器计算器（resistor-voltage-divider）— 按 Vout = Vin·R2∥RL/(R1+R2∥RL) 计算分压输出、分压比、电流与功耗，支持负载电阻效应与输出跌落百分比、给定目标电压反解 R2，Ω/kΩ/MΩ 与 mV/V 单位自适应切换，附 SVG 电路示意与示例预设，纯本地计算
- **新增**：化学式摩尔质量计算器（molar-mass-calculator）— 递归下降解析元素符号、数字下标、()/[] 嵌套括号与 ·nH2O 结晶水 / 加合物记法，内置 1–118 号元素 IUPAC/CIAAW 2021 常规原子量静态表（放射性元素标注近似值），输出摩尔质量、原子总数及各元素原子数 / 质量贡献 / 质量百分比，支持批量逐行计算，纯本地运算
- **新增**：字节数组代码生成器（byte-array-codegen）— Hex / Base64（RFC 4648）/ UTF-8 文本 / 本地文件与 C、Java、Python、Go 字节数组声明双向转换，变量名与每行字节数可配，Java 大于 127 自动 (byte) 强转、C 附 _len、Python 输出 b"\x.." 多行形式，反向解析数组字面量与转义字符串并还原 Hex / Base64 / 文本，内置 Base64 与 TextEncoder 零依赖实现

## 2026-11-03 ：【Agent自主迭代】新增 5 个 Polyline 编解码、PHP 序列化转换、JSON5 转换、Open Graph 元信息与 HTTP 安全响应头工具

- **新增**：Google Polyline 折线编码 / 解码器（polyline-codec）— 按 Google Encoded Polyline Algorithm Format 实现 zigzag + 5 位分块 ASCII 编解码，支持精度 5（Directions API 经典格式）与精度 6（官方推荐精度），含坐标越界 / 截断 / 非法字符的定位报错与多行「纬度,经度」文本批量解析，双向往返校验，纯本地运算
- **新增**：PHP serialize ↔ JSON 互转器（php-serialize-json）— 手写解析器支持 s:/i:/d:/b:/a:/O:/N; 等 PHP 序列化类型与关联数组 / 列表自动判别，对象与数组种类以 $$phpObject$$ / $$phpArrayKind$$ 标记保真，反向序列化按 JSON 值类型生成对应 PHP 表示，错误带列位置提示，纯本地零依赖
- **新增**：JSON5 ↔ JSON 转换器（json5-json-converter）— 手写 JSON5 解析器支持 // 与块注释、单引号字符串、未加引号标识符键、尾逗号、十六进制、正号数字、前导小数点、±Infinity/NaN、行尾反斜杠续行与 \\x/\\u 转义，输出标准 JSON（2/4 格缩进或压缩），数字后非法字符等错误带行列定位，纯本地运算
- **新增**：Open Graph / 社交分享 Meta 标签生成器（og-meta-generator）— 按 Open Graph / Twitter Cards 规范生成 title、description、canonical、og:title/description/url/type/site_name/locale/image(+alt/width/height) 与 twitter:card/site/creator 标签，标题 60 字 / 描述 160 字长度提示，URL 与 Twitter 账号（@ 归一）合法性校验，属性值 HTML 转义，附分享卡片实时预览，纯本地运算
- **新增**：HTTP 安全响应头生成器（security-headers-generator）— 可视化配置并生成 CSP（含 12 条常用指令、Report-Only 头名切换、无值指令）、HSTS（含 preload 最低 max-age 校验）、X-Frame-Options、X-Content-Type-Options、Referrer-Policy、Permissions-Policy、COOP/COEP/CORP，支持原始文本 / Nginx / Apache / HTML meta 四种输出格式（meta 不支持的头以注释列出），逐条配置告警与错误提示，纯本地运算

## 2026-11-03 ：【Agent自主迭代】新增 5 个 NTP 时间戳、IMEI 校验、SMPTE 时间码、GPS 周数与 SMS 分片计算工具

- **新增**：NTP 64 位时间戳互转器（ntp-timestamp-converter）— 按 RFC 5905 解析 NTP 64 位定点时间戳（高 32 位秒 + 低 32 位小数），支持十进制 / 十六进制 / 点分十进制三种写法与 UTC、北京时间、Unix 毫秒双向互转，BigInt 内核可处理超过安全整数的原始值，显式标注 2036-02-07 秒字段回卷（Era 0 → 1）并支持手动指定纪元，纯本地运算
- **新增**：IMEI 移动设备识别码校验器（imei-validator）— 按 3GPP TS 22.030 / GSBR 执行 Luhn mod 10 校验位核验，拆解 TAC（8 位型号核准码）、序列号（6 位）、校验位与软件版本号 IMEISV，支持 14 位补全校验位、批量逐行校验与全角空格归一，逐条给出加权计算过程与非法原因，纯本地运算
- **新增**：SMPTE 时间码互转器（smpte-timecode-converter）— 按 SMPTE ST 12-1 实现 23.976 / 24 / 25 / 29.97 DF / 29.97 NDF / 30 六种帧率下时间码与总帧数、真实时长互转，正确处理 29.97 drop-frame 每分钟丢 2 帧（逢 10 分钟不丢）规则，校验非法帧号与丢帧位置，支持时长表达式（如 90s / 10m）换算，纯本地整数运算
- **新增**：GPS 周数 / 周内秒互转器（gps-week-converter）— 按 GPS 时间体系（1980-01-06 起点、周计数 0–1023 回卷）在 UTC 日期时间与 GPS Week、TOW、日 / 时分秒之间双向转换，内置截至 2017-01-01 的 18 秒闰秒表给出 TAI / UTC 偏移，支持四个回卷周期手动消歧，纯本地日历运算
- **新增**：SMS 短信长度与分片计算器（sms-segment-calculator）— 按 3GPP TS 23.038 计算 GSM 7-bit / UCS-2 编码与长短信（UDH concat）分片：GSM 单条 160 septet、长短信每段 153（6 字节拼接头），UCS-2 单条 70 单元、长短信 67；自动识别扩展字符（^{}\[~]|€）双倍计费与非 GSM 字符切换编码，代理对不跨段拆分，展示每段字符 / 单位 / PDU 字节与计费条数，支持强制编码模式，纯本地运算

## 2026-11-03 ：【Agent自主迭代】新增 5 个盲文编码、CSS 缓动曲线、键盘事件查看、GZip 压缩与 JSON 转 Rust 结构工具

- **新增**：盲文编码 / 解码器（braille-codec）— 基于 Unicode U+2800 八点位掩码实现英文 Grade 1 盲文双向转换（数字号 ⠼ 后 a–j 表示 1–9、0），含八点格可视化、码点 / 点位描述与非法字符告警，纯本地查表运算
- **新增**：CSS 缓动函数 cubic-bezier 生成器（cubic-bezier-generator）— SVG 拖拽编辑两个控制点（x 限制 0–1、y 可过冲），牛顿迭代 + 二分回退数值反解曲线，内置 linear/ease/ease-in/ease-out/ease-in-out/easeInBack 等预设，实时输出 cubic-bezier(...) 代码并附 RAF 动画演示（遵循 prefers-reduced-motion），纯本地计算
- **新增**：键盘事件 / 按键码查看器（keyboard-event-viewer）— 聚焦捕获区域实时展示 KeyboardEvent 的 key/code/keyCode/which/location/repeat 与 ctrl/alt/shift/meta 修饰键，组合键按 Ctrl+Alt+Shift+Meta+主键 固定顺序渲染，保留最近 20 条事件历史与可选 preventDefault，内置 A–Z/0–9/F1–F12/方向键/控制键可过滤速查表
- **新增**：GZip / Deflate 压缩解压工具（gzip-codec）— 基于浏览器原生 CompressionStream/DecompressionStream 本地完成 gzip 与 raw deflate 双向转换，产物支持 Hex / Base64，展示字节数、压缩率与往返校验，魔数 1f 8b 预校验，损坏 / 截断载荷给出中文错误，零依赖无网络请求
- **新增**：JSON → Rust struct 生成器（json-to-rust）— 粘贴 JSON 推断生成 derive(Debug, Clone, Serialize, Deserialize) 结构体：整数 i64、浮点 f64、bool、String、null 退化为 Option，嵌套对象具名 struct，同型对象数组合并为 Vec<T>，空 / 异型数组回退 serde_json::Value 并告警，字段 snake_case 化并自动补 #[serde(rename)]，规避 Rust 关键字与重名

## 2026-11-02 ：【Agent自主迭代】新增 20 个数学表达式求值、INI/JSON 互转、线性代数矩阵、文本相似度、JSON 转 Python dataclass、CAS 登记号校验、RC 滤波器参数、文件下载时间估算、Markdown 表格生成、Apple .strings 转换、色温颜色转换、体感温度、ISIN 校验、名称型 UUID、Git 对象哈希、WIFI 二维码、CVSS 评分、OpenSSH randomart、Excel 序列号日期与以太坊单位换算工具

- **新增**：WIFI 二维码连接字符串生成器（wifi-qr-payload）— 按 WIFI: 标准拼装 SSID / 密码 / 加密类型（WPA/WEP/nopass）/ 隐藏网络，转义 `\\ ; , " :` 特殊字符，支持明文与二维码双展示，纯本地运算
- **新增**：CVSS v3.1 向量字符串解析与基础分计算器（cvss-calculator）— 解析 AV/AC/PR/UI/S/C/I/A 八个指标并按官方度量表与作用域规则计算 Base Score（0.0–10.0）与 None/Low/Medium/High/Critical 评级，向量合法性逐段校验，支持正向评级与向量双向编辑，纯本地运算
- **新增**：OpenSSH randomart 指纹可视化生成器（openssh-randomart）— 实现 Drunken Bishop 算法把 MD5 主机密钥指纹绘成 Bishop's Art 随机画，边界字符与 RFC 4716 输出一致，支持 MD5 指纹 / 公钥 / 原始十六进制多输入，自实现 RFC 1321 MD5，纯本地零依赖
- **新增**：Excel 序列号日期互转器（excel-date-converter）— 序列号与公历日期时间双向转换，完整复刻 Windows 1900 系统（含 phantom 序列号 60 = 不存在的 1900-02-29）与 Mac 1904 系统（允许负值、两系统恒差 1462），小数部分精确换算到毫秒，纯日历算法不受时区影响
- **新增**：以太坊单位与 Gas 费用计算器（ethereum-unit-converter）— BigInt 整数内核支持 Wei 到 Tether 共 11 个单位高精度互转（1 ETH = 10¹⁸ Wei，超精度小数直接报错），内置 Legacy（gasUsed × gasPrice）与 EIP-1559（tip / base 燃烧 / 实际总费 / 授权上限，21000 × 20 Gwei = 0.00042 ETH）两套费用模型，纯本地运算
- **新增**：数学表达式求值器（math-expression-evaluator）— 支持运算符优先级、括号嵌套、阶乘、三角函数与对数等常用数学函数及 pi/e/tau 常量，多行变量赋值复用、弧度 / 角度切换，输出逐步计算过程与行列定位的语法错误，纯本地词法 / 语法分析
- **新增**：INI 配置 ↔ JSON 双向转换（ini-json-converter）— 支持 [section] 分节、= / : 分隔符、; / # 注释、引号转义、布尔 / 数字类型推断、同名分节合并与可选点号嵌套键，双向实时转换并对格式错误给出中文提示
- **新增**：线性代数矩阵计算器（matrix-calculator）— 基于 BigInt 精确分数的矩阵加减、标量乘、矩阵乘法、转置、行列式、逆矩阵、秩与 RREF 逐步消元，并求解 Ax = b（唯一解 / 无解 / 无穷多解判定），支持空格逗号换行分隔粘贴
- **新增**：文本相似度计算器（text-similarity）— 同时计算 Levenshtein 编辑距离与归一化相似度、最长公共子序列 LCS、Jaro-Winkler 与 Sørensen–Dice 双字组系数四种指标，展示字符级编辑对齐视图，支持忽略大小写
- **新增**：JSON 转 Python dataclass 生成器（json-to-python-dataclass）— 粘贴 JSON 递归推断结构并生成 @dataclass 或 TypedDict 定义，支持嵌套类、Optional 缺失字段、异构对象数组合并、空数组退化裸 list、snake_case / PascalCase 命名规范化与可选 from_dict / to_dict 辅助方法
- **新增**：CAS 化学物质登记号校验器（cas-number-validator）— 按模 10 加权算法核验校验位，支持批量逐行校验、全角连字符归一与结构规则检查，逐条标注合法 / 非法并给出实算校验位，纯本地运算
- **新增**：RC 滤波器参数计算器（rc-filter-calculator）— 依据 fc = 1 /（2πRC）与 τ = RC 在截止频率、电阻、电容、时间常数间知二求三，SI 词头自适应换算并输出角频率 ω、-3.01dB 衰减点与 ±45° 相移参考，纯本地数值计算
- **新增**：文件下载时间估算器（download-time-calculator）— 按文件大小、带宽与有效传输效率估算耗时，输出秒数、hh:mm:ss 与可读时长，并给出 8 档宽带 / 移动网络常见带宽对照表，纯本地计算
- **新增**：Markdown 表格生成器（markdown-table-generator）— 将 CSV / TSV / Excel 粘贴内容转换为 GFM 管道表格，支持首行表头开关、逐列对齐、紧凑 / 补齐空格、竖线转义与列数不足自动补空列，一键复制
- **新增**：Apple .strings ↔ JSON 双向转换（strings-json-converter）— 解析 Localizable.strings 的引号键值与分号语法，剥离 // 与块注释、处理 \U 四位 / 八位转义及 emoji 代理对、检测重复键并按行号定位错误；反向生成支持按键排序，纯本地转换零依赖
- **新增**：色温与颜色双向转换器（color-temperature-converter）— 按黑体辐射近似公式在开尔文色温与 sRGB 颜色间双向转换，支持 HEX / RGB 输出与 McCamy 公式由颜色反向估算相关色温（CCT），内置常用光源色温预设，纯本地计算
- **新增**：体感温度计算器（热指数 / 风寒）（apparent-temperature）— 按 NWS 官方公式计算体感温度：炎热侧 Rothfusz 热指数多项式（含干湿调整项与四级危险等级），寒冷侧 2001 版风寒公式，支持摄氏度 / 华氏度切换，纯本地计算
- **新增**：ISIN 证券识别码校验器（isin-validator）— 按 ISO 6166 校验 12 位 ISIN：字母按 A=10…Z=35 展开后执行 Luhn mod 10，支持批量逐行校验、逐位展开加权过程展示与由 11 位主体补全 / 纠正末位校验位，纯本地运算
- **新增**：UUID v3 / v5 名称型生成器（uuid-name-generator）— 按 RFC 9562 对「命名空间 UUID + 名称」确定性派生 v3（MD5）/ v5（SHA-1）UUID，内置 DNS / URL / OID / X.500 命名空间或使用自定义命名空间，相同输入永远得到相同 UUID，结果展示版本位与变体位，纯本地运算
- **新增**：Git 底层对象哈希计算器（git-object-hash）— 在浏览器本地计算 blob / tree / commit / annotated tag 的 SHA-1 / SHA-256 对象 ID，自动拼接「类型 长度 NUL」头；tree 输入按 Git 规范二进制规范化（40000 目录模式、按名排序、目录隐含 / 比较），等价 git hash-object / git mktree 的只读计算侧，固定向量经 git 2.43 交叉验证，纯本地运算

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
