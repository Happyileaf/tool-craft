# 已淘汰 / 失败 Idea 归档

> 所有被淘汰或开发失败的 Idea（状态 `Rejected`）从 [idea-pool.md](./idea-pool.md) 移入本索引。
> 每条记录必须写明**具体原因**（不允许只写“失败”）与失败/淘汰阶段，避免后续重复提出相同或高度相似的创意。详情文档保留在 `idea-details/` 中，原始 ID 不删除、不复用。

| ID | Idea | Type | Source | 阶段（评估/开发/验收） | Reject Reason | 处理时间 | 详情 |
|---|---|---|---|---|---|---|---|
| 20260928103004 | URL encoder/decoder | Web Tool | Exploration | 评估 | 查重未通过：与已注册工具 base64-codec（"Base64 & URL Encoder/Decoder"）功能实质重复，其 `runCodec` 已内置 URL 编解码模式 | 2026-10-17 | [详情](./idea-details/20260928103004.md) |
| 20260928103006 | JWT decoder | Web Tool | Exploration | 评估 | 查重未通过：与已注册工具 jwt-parser（JWT 生成器/解析器）功能实质重复，其 `parseJWT` 已覆盖 header/payload 解析，本条为其真子集 | 2026-10-17 | [详情](./idea-details/20260928103006.md) |
| 20260928103008 | Password generator | Web Tool | Exploration | 评估 | 查重未通过：与已注册工具 strong-password-generator 功能实质重复，其 `generatePassword` 已提供安全随机密码生成 | 2026-10-17 | [详情](./idea-details/20260928103008.md) |
| 20261017100235 | QR code decoder | Web Tool | Existing Gap | 评估 | 实现复杂度与依赖量未通过：二维码识别需完整实现图像二值化 / 定位检测 / 透视校正 / Reed-Solomon 纠错译码，自研属 L 级（超出本轮 S–M 范围）；引入 jsQR 等解码库则属新增图像解码依赖 | 2026-10-17 | [详情](./idea-details/20261017100235.md) |
| 20261017100236 | X.509 certificate decoder | Web Tool | Exploration | 评估 | 实现复杂度未通过：需自研 ASN.1 DER 编解码器（TLV / 长度编码 / 各种 tag）并在其上解析 X.509 v3 结构（TBSCertificate / AlgorithmIdentifier / 扩展与 SAN / OID 映射 / DN 字符串化 / 指纹），自研属 L 级（超出本轮 S–M 范围）；引入 @peculiar/x509 属新增运行时依赖 | 2026-10-17 | [详情](./idea-details/20261017100236.md) |
| 20261017125912 | XML formatter & validator | Web Tool | Existing Gap | 评估 | 实现复杂度未通过：需完整 XML 语法解析（标签 / 属性 / CDATA / 注释 / PI / DOCTYPE / 命名空间 / 闭合校验）并精确定位错误行号，自研属 L 级；浏览器 DOMParser 无错误行号且无法在纯函数单测环境运行，违背 §3.3 交付要求 | 2026-10-17 | [详情](./idea-details/20261017125912.md) |
| 20261017125913 | XML ↔ JSON converter | Web Tool | Existing Gap | 评估 | 实现复杂度未通过：需完整 XML 解析（元素 / 属性 / 命名空间 / CDATA / 混合内容）加双向结构映射规则并保证 JSON → XML 合法输出，自研属 L 级；依赖 DOMParser 无法在纯函数单测环境运行，引入 fast-xml-parser 属新增依赖 | 2026-10-17 | [详情](./idea-details/20261017125913.md) |
| 20261017125914 | SQL formatter & beautifier | Web Tool | Exploration | 评估 | 实现复杂度未通过：可靠格式化需 SQL 词法与语法分析（引号标识符 / 字符串与注释 / 子查询与括号层级 / JOIN、CASE 子句缩进对齐），自研属 L 级；仅靠正则美化无法满足"复杂查询排版"验收且易破坏语义 | 2026-10-17 | [详情](./idea-details/20261017125914.md) |
| 20261017125915 | Code minifier & beautifier (HTML/CSS/JS) | Web Tool | Existing Gap | 评估 | 实现复杂度与依赖量未通过：JS 压缩 / 美化需真实词法与语法分析（正则字面量 / 模板字符串 / ASI），自研属 L 级；引入 terser、prettier 属新增运行时依赖。三合一交付范围整体超出本轮 S–M 上限 | 2026-10-17 | [详情](./idea-details/20261017125915.md) |
| 20261017125918 | HMAC signature generator | Web Tool | Existing Gap | 评估 | 查重未通过：与已注册工具 hash-generator 功能实质重复，其 `computeHmac` 与组件 HMAC 区块已提供「原文 + 密钥 → HMAC 摘要」，CHANGELOG 亦记载其覆盖 "HMAC 计算"；本条描述与实际不符，能力为其子集 | 2026-10-17 | [详情](./idea-details/20261017125918.md) |
| 20261017140157 | Image EXIF metadata viewer & stripper | Web Tool | Existing Gap | 评估 | 实现复杂度未通过：需覆盖 JPEG（APP1/EXIF）、PNG（eXIf）、WebP（RIFF chunk）三种容器解析，并实现 TIFF/EXIF IFD 标签解码（含 GPS IFD、时间、坐标换算）与剥离后按原容器重新导出，自研属 L 级；引入 exifr / piexifjs 属新增依赖 | 2026-10-17 | [详情](./idea-details/20261017140157.md) |
| 20261017160146 | TOML ↔ JSON converter | Web Tool | Existing Gap | 评估 | 实现复杂度未通过：需完整 TOML 1.0 语法解析（标准表 / 内联表 / 表数组 / 点分键 / 多行与字面字符串 / 日期时间类型）并带行号错误定位，JSON → TOML 还需键序与引号规则，自研属 L 级；引入 smol-toml / @iarna/toml 属新增依赖 | 2026-10-17 | [详情](./idea-details/20261017160146.md) |
| 20261017160147 | HTML to Markdown converter | Web Tool | Existing Gap | 评估 | 实现复杂度未通过：需完整 HTML DOM 解析并逐节点映射为 Markdown（嵌套列表 / 表格 / 代码块 / 内联元素换行与转义），自研属 L 级；改用 DOMParser 无法在纯函数单测环境运行，引入 html-to-md 属新增依赖 | 2026-10-17 | [详情](./idea-details/20261017160147.md) |
| 20261017160150 | JSON Schema generator & validator | Web Tool | Existing Gap | 评估 | 实现复杂度未通过：校验需完整实现 Draft-07 语义（type / required / properties / items / pattern / enum / oneOf / anyOf / allOf / const 及数值与字符串约束）与 `$ref` / `$defs` 解析及错误路径定位，自研属 L 级；引入 ajv 属新增依赖 | 2026-10-17 | [详情](./idea-details/20261017160150.md) |
