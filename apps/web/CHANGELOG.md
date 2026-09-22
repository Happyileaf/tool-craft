# apps/web 变更日志

> 变更日志填写规范见 [docs/guide/changelog-guide.md](../../docs/guide/changelog-guide.md)。

## 日志

## 2026-09-23 ：【自主迭代】新增 2 个开发工具

- **新增**：JSON 转 YAML（json-to-yaml）— 将JSON格式数据转换为格式化YAML
- **新增**：命名格式转换器（case-converter）— 驼峰、下划线、短横线命名格式互转，支持大小写转换

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
