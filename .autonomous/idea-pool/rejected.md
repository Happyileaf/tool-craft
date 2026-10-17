# 已淘汰 / 失败 Idea 归档

> 所有被淘汰或开发失败的 Idea（状态 `Rejected`）从 [idea-pool.md](./idea-pool.md) 移入本索引。
> 每条记录必须写明**具体原因**（不允许只写“失败”）与失败/淘汰阶段，避免后续重复提出相同或高度相似的创意。详情文档保留在 `idea-details/` 中，原始 ID 不删除、不复用。

| ID | Idea | Type | Source | 阶段（评估/开发/验收） | Reject Reason | 处理时间 | 详情 |
|---|---|---|---|---|---|---|---|
| 20260928103004 | URL encoder/decoder | Web Tool | Exploration | 评估 | 查重未通过：与已注册工具 base64-codec（"Base64 & URL Encoder/Decoder"）功能实质重复，其 `runCodec` 已内置 URL 编解码模式 | 2026-10-17 | [详情](./idea-details/20260928103004.md) |
| 20260928103006 | JWT decoder | Web Tool | Exploration | 评估 | 查重未通过：与已注册工具 jwt-parser（JWT 生成器/解析器）功能实质重复，其 `parseJWT` 已覆盖 header/payload 解析，本条为其真子集 | 2026-10-17 | [详情](./idea-details/20260928103006.md) |
| 20260928103008 | Password generator | Web Tool | Exploration | 评估 | 查重未通过：与已注册工具 strong-password-generator 功能实质重复，其 `generatePassword` 已提供安全随机密码生成 | 2026-10-17 | [详情](./idea-details/20260928103008.md) |
| 20261017100235 | QR code decoder | Web Tool | Existing Gap | 评估 | 实现复杂度与依赖量未通过：二维码识别需完整实现图像二值化 / 定位检测 / 透视校正 / Reed-Solomon 纠错译码，自研属 L 级（超出本轮 S–M 范围）；引入 jsQR 等解码库则属新增图像解码依赖 | 2026-10-17 | [详情](./idea-details/20261017100235.md) |
