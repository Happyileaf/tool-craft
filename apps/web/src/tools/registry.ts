import { ToolCategoryEnum, ToolProcessingEnum } from './constants';
import type { ToolMeta } from './types';

/**
 * 已注册工具的元数据集合，覆盖站点当前提供的全部工具
 */
export const tools: ToolMeta[] = [
  {
    slug: 'json-formatter',
    name: 'JSON 格式化与校验器',
    nameEn: 'JSON Formatter & Validator',
    description:
      '一键格式化凌乱的 JSON 数据，实时语法报错高亮定位，支持一键压缩与属性排序。',
    descriptionEn:
      'Format messy JSON data with real-time error highlighting, indentation controls, key sorting, and instant minification.',
    category: ToolCategoryEnum.DATA_JSON,
    path: '/tools/json-formatter',
    iconName: 'Braces',
    tags: ['JSON', '格式化', '校验', '压缩', 'API'],
    tagsEn: ['JSON', 'Format', 'Validate', 'Minify', 'API'],
    isPopular: true,
    isNew: false,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: JSON.stringify(
      {
        status: 'success',
        statusCode: 200,
        data: {
          platform: 'ToolCraft',
          version: '2.4.0',
          modules: ['Formatter', 'Encoder', 'Diff', 'Regex'],
          settings: {
            theme: 'auto',
            offlineReady: true,
            telemetry: false,
          },
          activeUsers: 14280,
        },
        timestamp: 1774001200,
      },
      null,
      2,
    ),
    doc: {
      zh: {
        whatIsIt:
          'JSON 格式化与校验器是一款基于纯浏览器本地运算的实用工具，可在无需上传数据至服务器的情况下，瞬间整理复杂、嵌套密集的 JSON 文本。',
        coreFeatures: [
          '智能语法检测：精确定位语法缺失（如遗漏逗号、未闭合引号）并展示行号',
          '双向缩进切换：支持 2 格缩进、4 格缩进与极致单行 Minify 压缩',
          '键名排序功能：按字母升序自动重排 Object 键，便于数据比对',
          '纯浏览器本地运算：完全在用户浏览器沙盒中运行，绝不经过远端服务器',
        ],
        howToUse: [
          '在左侧或上方编辑框中粘贴需要处理的原始 JSON 文本',
          '点击「格式化 (2格/4格)」美化排版，或点击「压缩」生成单行数据',
          '如存在语法错误，界面会立即红框告警并给出具体修改建议',
          '点击「复制结果」或「导出文件」获取处理后的标准文本',
        ],
        useCases: [
          '前后端联调排查 API 返回数据报文',
          '配置文件（如 tsconfig、package.json）排版修复',
          '清洗带转义字符的日志文本',
        ],
        privacyNote:
          '所有 JSON 解析和字符串构建均基于纯浏览器本地运算，绝不记录或向云端传输任何业务敏感数据。',
        faqs: [
          {
            question: '为什么输入大文件时不会卡顿？',
            answer:
              '本工具针对大文本进行了分块渲染与轻量解析优化，即使处理数十兆日志也能秒级响应。',
          },
          {
            question: '支持带有单引号或尾随逗号的宽松 JSON 吗？',
            answer:
              '工具内置宽松修复开关，能自动尝试修正 JavaScript 对象字面量为合规的标准 JSON 规范。',
          },
        ],
      },
      en: {
        whatIsIt:
          'JSON Formatter & Validator is a fully browser-based utility that instantly tidies complex, deeply nested JSON text without uploading any data to a server.',
        coreFeatures: [
          'Smart syntax detection: pinpoint missing commas, unclosed quotes, and more with exact line numbers',
          'Flexible indentation: switch between 2-space, 4-space, and single-line minified output',
          'Key sorting: automatically reorder object keys alphabetically for easier comparison',
          '100% in-browser: runs entirely inside your browser sandbox and never touches a remote server',
        ],
        howToUse: [
          'Paste the raw JSON text you want to process into the editor',
          'Click "Format (2/4 spaces)" to beautify it, or "Minify" to produce a single-line payload',
          'If there is a syntax error, an inline alert immediately points to the exact fix',
          'Click "Copy" or "Download" to grab the standardized result',
        ],
        useCases: [
          'Inspecting API responses during frontend-backend integration',
          'Fixing the layout of config files such as tsconfig and package.json',
          'Cleaning up log text full of escape characters',
        ],
        privacyNote:
          'All JSON parsing and string building happens locally in your browser. Business-sensitive data is never logged or sent to the cloud.',
        faqs: [
          {
            question: 'Why does it stay smooth with very large files?',
            answer:
              'The tool uses lightweight parsing and optimized rendering for large text, responding in seconds even with multi-megabyte logs.',
          },
          {
            question: 'Does it support lenient JSON with single quotes or trailing commas?',
            answer:
              'A built-in repair toggle attempts to convert JavaScript object literals into valid standard JSON.',
          },
        ],
      },
    },
  },
  {
    slug: 'image-resizer',
    name: '图片智能压缩与裁剪',
    nameEn: 'Image Compressor & Resizer',
    description:
      '无需上传服务器，纯浏览器 Canvas 极速压缩图片体积，支持自由缩放尺寸与格式转换。',
    descriptionEn:
      'Fast in-browser image compression and resizing using HTML5 Canvas with quality presets and format conversion.',
    category: ToolCategoryEnum.IMAGE_MEDIA,
    path: '/tools/image-resizer',
    iconName: 'Image',
    tags: ['图片', '压缩', '裁剪', 'WebP', '尺寸'],
    tagsEn: ['Image', 'Compress', 'Crop', 'WebP', 'Resize'],
    isPopular: true,
    isNew: false,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '专为网页配图、头像设计与移动端轻量化打造的图片处理工作台。基于现代 HTML5 Canvas API 与 WebP 编码算法，直接在设备端实现高质量减重。',
        coreFeatures: [
          '无损/有损智能压缩：质量滑动调节，实时预估输出体积与压缩率',
          '常用比例一键应用：16:9、4:3、1:1 正方形与常见自媒体封面比例预设',
          '多格式导出：支持平滑转换为 WebP、PNG 与 JPEG',
          '私密图片绝不离机：所有图像像素直接由 GPU/CPU 内存渲染计算',
        ],
        howToUse: [
          '将图片拖拽至上传区域，或点击选择本地图片（也可使用预置样例图片）',
          '在操作面板中调整目标宽度、高度或缩放百分比',
          '拖动压缩质量滑块（建议 80%~85% 保持肉眼无损视效）',
          '对比前后的文件大小变化，满意后点击「下载优化后的图片」',
        ],
        useCases: [
          '网站内容发布前减少图片带宽开销，提升首屏速度',
          '报名单、证件照等平台对图片大小严格限制在 200KB 以内的场景',
          '自媒体、博客横幅裁剪与统一比例排版',
        ],
        privacyNote:
          '绝无服务器存储与转发行为，即使断网离线也能正常完成压缩与导出。',
        faqs: [
          {
            question: '压缩成 WebP 格式在所有现代浏览器中都能看吗？',
            answer:
              '是的，当前 Chrome, Safari, Firefox, Edge 全线已 100% 普及 WebP 支持。',
          },
        ],
      },
      en: {
        whatIsIt:
          'An image-processing workbench built for web graphics, avatars, and mobile optimization. Powered by the modern HTML5 Canvas API and WebP encoding, it reduces file size with high quality right on your device.',
        coreFeatures: [
          'Smart lossy/lossless compression: adjust quality with a slider and preview output size and savings live',
          'One-click aspect ratios: 16:9, 4:3, 1:1, and common social-media cover presets',
          'Multi-format export: smoothly convert between WebP, PNG, and JPEG',
          'Private images never leave the device: pixels are rendered entirely in local memory',
        ],
        howToUse: [
          'Drag an image into the drop zone or click to pick a local file (samples are also available)',
          'Adjust target width, height, or scale percentage in the control panel',
          'Drag the quality slider (80%-85% is recommended for visually lossless results)',
          'Compare the before/after file sizes, then click "Download" when you are happy',
        ],
        useCases: [
          'Cutting image bandwidth and speeding up first paint before publishing web content',
          'Meeting strict size limits such as 200KB for application forms and ID photos',
          'Cropping blog and social-media banners to unified aspect ratios',
        ],
        privacyNote:
          'There is no server-side storage or forwarding. Compression and export work even fully offline.',
        faqs: [
          {
            question: 'Is compressed WebP viewable in all modern browsers?',
            answer:
              'Yes. Chrome, Safari, Firefox, and Edge all support WebP across the board today.',
          },
        ],
      },
    },
  },
  {
    slug: 'text-diff',
    name: '文本差异对比 (Diff)',
    nameEn: 'Text Diff & Compare',
    description:
      '双栏直观比对两段文本或代码片段，实时高亮增加、删除与修改行，快速查出细微差异。',
    descriptionEn:
      'Side-by-side or unified text and code comparison with real-time insertion, deletion, and modification highlights.',
    category: ToolCategoryEnum.TEXT_CONTENT,
    path: '/tools/text-diff',
    iconName: 'FileText',
    tags: ['文本', '比对', 'Diff', '代码审查', '变更'],
    tagsEn: ['Text', 'Compare', 'Diff', 'Code Review', 'Changes'],
    isPopular: true,
    isNew: false,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'Original Text',
    doc: {
      zh: {
        whatIsIt:
          '专业的纯文本与代码变更比对工具。无需启动复杂的 Git 终端或重型 IDE，随时随地在浏览器中粘贴两段内容，精准捕捉文字字句、符号或空白符的增删改动。',
        coreFeatures: [
          '行级别与字符级高亮：绿色标识新增，红色标识删除，变动处醒目清晰',
          '并排 (Split) 与统一 (Unified) 模式随时切换',
          '忽略空白选项：可选择忽略空格和空行带来的干扰',
          '统计面板：直观展示总新增字数、删除字数与字符相似度比率',
        ],
        howToUse: [
          '在左侧面板粘贴原始内容（版本 A）',
          '在右侧面板粘贴修改后的内容（版本 B）',
          '系统将实时生成对比差异，点击顶部视图模式切换展现方式',
          '通过右侧差异统计卡片快速审核变更量',
        ],
        useCases: [
          '审核合同文书、法律条款细微文字修改',
          '配置文件或 SQL 脚本在升级前后的差异核对',
          '学生论文或多稿文章改动比对',
        ],
        privacyNote:
          '比对算法在本地内存执行，商业机密合同与内部私有代码均可放心对比。',
        faqs: [
          {
            question: '如果只想比对英文字母大小写差异可以吗？',
            answer: '可以，勾选“严格区分大小写”即可立刻精准反映大小写变化。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A professional plain-text and code change comparison tool. Without opening a Git terminal or heavyweight IDE, paste two pieces of content anywhere in your browser and precisely catch added or removed words, symbols, and whitespace.',
        coreFeatures: [
          'Line- and character-level highlighting: green for additions, red for deletions',
          'Switch freely between side-by-side (split) and unified views',
          'Ignore-whitespace option to filter out noise from spaces and blank lines',
          'Stats panel showing additions, deletions, and character similarity at a glance',
        ],
        howToUse: [
          'Paste the original content (version A) into the left panel',
          'Paste the revised content (version B) into the right panel',
          'The diff updates in real time; use the top toggle to switch view modes',
          'Review the magnitude of change through the stats card',
        ],
        useCases: [
          'Reviewing subtle wording changes in contracts and legal clauses',
          'Comparing config files or SQL scripts before and after upgrades',
          'Comparing drafts of student papers or multi-version articles',
        ],
        privacyNote:
          'The comparison algorithm runs in local memory, so confidential contracts and private code are safe.',
        faqs: [
          {
            question: 'Can I compare only letter-case differences?',
            answer:
              'Yes. Enable "Case sensitive" and case changes will be reflected precisely.',
          },
        ],
      },
    },
  },
  {
    slug: 'regex-tester',
    name: '正则表达式实时测试',
    nameEn: 'Regex Tester & Matcher',
    description:
      '实时匹配测试正则表达式，高亮匹配项与捕获分组，附带常用正则语法速查表。',
    descriptionEn:
      'Live regular expression testing tool with match highlightings, capture group explorer, and cheat sheets.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/regex-tester',
    iconName: 'Code',
    tags: ['正则', 'Regex', '匹配', '代码', '调试'],
    tagsEn: ['Regex', 'Pattern', 'Match', 'Debug', 'Code'],
    isPopular: true,
    isNew: false,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput:
      'user_alex@example.com, support-team@craft-tools.org, invalid-email@@test',
    doc: {
      zh: {
        whatIsIt:
          '直观高效的正则表达式编写与调试环境。边输入表达式边看实时匹配反馈，提供 flags 开关与常用模板，彻底摆脱写正则全靠猜的低效困境。',
        coreFeatures: [
          '实时无延迟匹配：支持全局 (g)、不区分大小写 (i)、多行 (m) 等修饰符切换',
          '分组可视化解析：清晰展开 Group 1, Group 2 等括号捕获项与位置区间',
          '常见语法一键填充：手机号、邮箱、IPv4、URL、中文字符等内置标准模板',
          '错误防御机制：自动捕获无效语法错误，避免浏览器死循环',
        ],
        howToUse: [
          '在顶部规则框中输入正则表达式，例如 `([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+)`',
          '勾选所需的 Flags（如 g, i）',
          '在测试文本框中输入需要检验的目标字符串',
          '在下方实时查看高亮区域与分组捕获详情',
        ],
        useCases: [
          '前端表单校验规则开发与边界测试',
          '日志数据结构化抽取与关键字段切片',
          '爬虫文本数据清理与敏感词过滤',
        ],
        privacyNote: '规则与测试文本均在当前页面环境解析，零网络传输。',
        faqs: [
          {
            question: '支持 RegExp 命名捕获组语法吗？',
            answer:
              '现代主流浏览器 JavaScript 引擎（如 V8）完全支持命名捕获组及后行断言语法。',
          },
        ],
      },
      en: {
        whatIsIt:
          'An intuitive environment for writing and debugging regular expressions. See live match feedback as you type, with flag toggles and ready-made templates, so you never have to guess your way through regex again.',
        coreFeatures: [
          'Real-time matching with no delay: toggle global (g), ignore case (i), multiline (m), and more',
          'Visual group explorer: expand Group 1, Group 2, and other captures with their positions',
          'One-click templates for phone numbers, emails, IPv4, URLs, and Chinese characters',
          'Error defense: invalid syntax is caught automatically to prevent browser hangs',
        ],
        howToUse: [
          'Enter a regular expression in the top box, e.g. ([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+)',
          'Enable the flags you need (such as g and i)',
          'Type the target string into the test-text box',
          'Review highlighted matches and capture-group details below',
        ],
        useCases: [
          'Developing and boundary-testing frontend form-validation rules',
          'Extracting structured data and key fields from logs',
          'Cleaning crawler text and filtering sensitive words',
        ],
        privacyNote:
          'Patterns and test text are parsed entirely on the current page with zero network transfer.',
        faqs: [
          {
            question: 'Does it support named capture groups?',
            answer:
              'Modern JavaScript engines such as V8 fully support named capture groups and lookbehind assertions.',
          },
        ],
      },
    },
  },
  {
    slug: 'base64-codec',
    name: 'Base64 & URL 编解码',
    nameEn: 'Base64 & URL Encoder/Decoder',
    description:
      '支持文本、URL 参数、Hex 的双向极速编解码转换，支持 UTF-8 中文完整兼容。',
    descriptionEn:
      'High-speed bidirectional Base64, URL Component, and Hex encoder/decoder with full UTF-8 Unicode support.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/base64-codec',
    iconName: 'ShieldCheck',
    tags: ['Base64', 'URL', '解码', '编码', '加密'],
    tagsEn: ['Base64', 'URL', 'Decode', 'Encode', 'Crypto'],
    isPopular: false,
    isNew: false,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'ToolCraft 在线工具箱 - 简单、高效、直接！',
    doc: {
      zh: {
        whatIsIt:
          '一站式通用数据编解码转换台。涵盖开发者最高频接触的 Base64 编码、URL Component 转义以及十六进制 Hex 转换，彻底解决中文乱码与字符安全传递问题。',
        coreFeatures: [
          '完美支持 UTF-8：彻底规避传统 btoa/atob 遇到中文字符报 InvalidCharacterError 缺陷',
          '多模式一键切换：Base64 文本、URL 转义、URI 完整编码、Hex 十六进制',
          '智能双向互转：一键翻转输入/输出流，支持自动侦测已编码文本并智能反解',
          '快捷复制与清空：支持快速将结果载入系统剪贴板',
        ],
        howToUse: [
          '选择所需的转换协议（Base64 或 URL Encode）',
          '在输入框中填入原始文本或编码串',
          '点击「编码」或「解码」，下方即刻显示正确转换结果',
          '点击复制按钮直接取走结果',
        ],
        useCases: [
          '分析带有复杂 Query 参数的 HTTP 请求重定向链接',
          '生成轻量级 Data URL 或接口鉴权请求头',
          '排查乱码接口与转义传输问题',
        ],
        privacyNote:
          '编解码基于纯浏览器本地运算与原生 Web APIs 实现，不产生任何网络日志。',
        faqs: [
          {
            question: '为什么有些中文 Base64 在其它工具里解出来是乱码？',
            answer:
              '本工具采用标准的 UTF-8 字节序编码，兼容现代国际化标准，可无缝对接 Java/Python/Node.js 后端。',
          },
        ],
      },
      en: {
        whatIsIt:
          'An all-in-one data encoding and decoding console. It covers the most common developer needs — Base64, URL component escaping, and hexadecimal conversion — solving Chinese-character mojibake and safe character transfer once and for all.',
        coreFeatures: [
          'Full UTF-8 support: avoids the InvalidCharacterError that classic btoa/atob throw on Chinese characters',
          'Switch modes instantly: Base64 text, URL escaping, full URI encoding, and hex',
          'Smart bidirectional conversion: swap input/output in one click with automatic detection of encoded text',
          'Quick copy and clear: send results straight to the system clipboard',
        ],
        howToUse: [
          'Choose the conversion protocol you need (Base64 or URL encoding)',
          'Enter the raw text or encoded string in the input box',
          'Click "Encode" or "Decode" and the correct result appears immediately below',
          'Click the copy button to take the result away',
        ],
        useCases: [
          'Analyzing HTTP redirect links with complex query parameters',
          'Generating lightweight data URLs or auth request headers',
          'Debugging mojibake APIs and escaped-transport issues',
        ],
        privacyNote:
          'Encoding and decoding run locally in your browser using native Web APIs, with no network logs.',
        faqs: [
          {
            question: 'Why do some Chinese Base64 strings decode as gibberish in other tools?',
            answer:
              'This tool uses standard UTF-8 byte encoding compatible with modern international standards and with Java, Python, and Node.js backends.',
          },
        ],
      },
    },
  },
  {
    slug: 'color-palette',
    name: '调色板与 WCAG 对比度检查',
    nameEn: 'Color Palette & Contrast Checker',
    description:
      '智能生成色阶渐变，精确计算文字与背景的 WCAG 2.1 无障碍对比度（AA/AAA）。',
    descriptionEn:
      'Generate Tailwind-compatible shade scales and compute WCAG 2.1 AA/AAA accessibility contrast ratios.',
    category: ToolCategoryEnum.DESIGN_COLOR,
    path: '/tools/color-palette',
    iconName: 'Palette',
    tags: ['颜色', '调色板', '对比度', 'WCAG', 'HEX'],
    tagsEn: ['Color', 'Palette', 'Contrast', 'WCAG', 'HEX'],
    isPopular: false,
    isNew: false,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '#2563EB',
    doc: {
      zh: {
        whatIsIt:
          '面向 UI/UX 设计师和前端工程师的色彩度量与无障碍检验工具。提供直观的 HEX / RGB 色值互换，并按照国际 Web 内容无障碍指南（WCAG 2.1）标准进行科学比率计算。',
        coreFeatures: [
          'WCAG 合规性打分：清晰显示在 16px 常规文字及 24px 大号文字下的 AA / AAA 通过状态',
          '单色衍生色阶：自动生成 50~950 完整的 10 级 Tailwind 风格渐变色系',
          '一键取色与色彩空间转换：HEX、RGB、HSL 多格式即时联动',
          '预置流行设计配色：包含科技蓝、翡翠绿、琥珀橙、深空紫等精美基底',
        ],
        howToUse: [
          '在颜色选择器中选取颜色，或直接输入 6 位 HEX 代码（如 #2563EB）',
          '实时查看其在浅色模式及深色背景下的对比度数值（如 7.2:1）',
          '参考右侧的 WCAG AA / AAA 徽标评级判断是否适合用于正文或按钮',
          '点击色阶方块直接复制对应的 CSS 代码',
        ],
        useCases: [
          '产品设计系统（Design System）色彩规范制定',
          '网页可访问性与弱视群体阅读友好性排查',
          '快速提取品牌主色的阴影与高亮配套色彩',
        ],
        privacyNote:
          '无需任何外部依赖，完全基于纯浏览器本地运算与色彩光学公式。',
        faqs: [
          {
            question: 'WCAG AA 与 AAA 的达标阈值是多少？',
            answer:
              '常规正文文字 AA 级要求对比度至少 4.5:1，AAA 级要求至少 7.0:1；大号字或加粗文字 AA 级要求 3.0:1。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A color-measurement and accessibility tool for UI/UX designers and frontend engineers. It offers intuitive HEX/RGB conversion and scientifically computes ratios according to the international Web Content Accessibility Guidelines (WCAG 2.1).',
        coreFeatures: [
          'WCAG compliance scoring: clearly show AA/AAA pass status for 16px body text and 24px large text',
          'Derived shade scales: auto-generate a full 10-step, 50–950 Tailwind-style palette from one color',
          'One-click color picking and space conversion: HEX, RGB, and HSL stay in sync instantly',
          'Built-in popular palettes including tech blue, emerald, amber, and deep space purple',
        ],
        howToUse: [
          'Pick a color in the color picker or type a 6-digit HEX code (such as #2563EB)',
          'View its contrast ratios against light and dark backgrounds in real time (such as 7.2:1)',
          'Use the WCAG AA/AAA badges to decide whether it suits body text or buttons',
          'Click a shade tile to copy its CSS value directly',
        ],
        useCases: [
          'Defining color rules for a product design system',
          'Auditing web accessibility and readability for low-vision users',
          'Quickly deriving matching shadows and highlights from a brand color',
        ],
        privacyNote:
          'No external dependencies are needed — everything is computed locally with color-science formulas.',
        faqs: [
          {
            question: 'What are the WCAG AA and AAA thresholds?',
            answer:
              'Body text requires a contrast ratio of at least 4.5:1 for AA and 7.0:1 for AAA; large or bold text requires 3.0:1 for AA.',
          },
        ],
      },
    },
  },
  {
    slug: 'timestamp-converter',
    name: '时间戳与时区转换器',
    nameEn: 'Timestamp & Timezone Converter',
    description:
      'Unix 毫秒/秒级时间戳与人类易读日期互相转换，支持 UTC 与全球各大时区对照。',
    descriptionEn:
      'Convert Unix epoch timestamps (seconds/milliseconds) to readable dates with global timezone support.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/timestamp-converter',
    iconName: 'Clock',
    tags: ['时间戳', 'Unix', '时区', 'UTC', '日期'],
    tagsEn: ['Timestamp', 'Unix', 'Timezone', 'UTC', 'Date'],
    isPopular: false,
    isNew: false,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '高效的系统时间调试工具。实时呈现当前秒级与毫秒级 Epoch 时间戳，支持从杂乱的数字快速还原为当地时刻、UTC 标准时及 ISO 8601 格式。',
        coreFeatures: [
          '实时跳动时钟：动态显示当下时刻的秒级与毫秒级 Unix Timestamp，随时暂停复制',
          '双向灵活互转：输入数字戳反解为年月日，或选定日历直接输出时间戳',
          '时差计算器：直观显示距离现在已经过去了多久或还剩多少时间（相对时间语义）',
          '常见格式速查：提供 ISO 8601, RFC 2822, 格式化短日期等多款输出',
        ],
        howToUse: [
          '在“时间戳转日期”区域填入 10 位秒级或 13 位毫秒级数值',
          '系统自动识别精度并转换为本地时间和国际标准时间',
          '在“日期转时间戳”区域选择日期时间选择器，即刻获取对应的 Epoch 整数',
          '点击当前时钟旁的「复制」按钮，快速获取当下秒级时间戳',
        ],
        useCases: [
          '排查数据库存储的 created_at 整数与实际业务发生时间对应关系',
          '跨国分布式系统接口调试与 Token 过期时间核对',
          '日志时间线对齐与定位故障时刻',
        ],
        privacyNote: '基于纯浏览器本地运算与 Intl 国际化标准，保护隐私。',
        faqs: [
          {
            question: '10 位时间戳和 13 位时间戳有什么区别？',
            answer:
              '10 位代表秒级（常见于 Unix/Linux/PHP/Go），13 位代表毫秒级（常见于 JavaScript/Java）。本工具具备智能位数自动检测能力。',
          },
        ],
      },
      en: {
        whatIsIt:
          'An efficient system-time debugging tool. It shows the current second and millisecond epoch timestamps in real time and quickly turns raw numbers into local time, UTC, and ISO 8601 formats.',
        coreFeatures: [
          'Live ticking clock displaying current second- and millisecond-level Unix timestamps, with pause and copy anytime',
          'Flexible two-way conversion: decode numeric timestamps into dates or pick a calendar date to get the timestamp',
          'Relative-time calculator showing how long ago or how far away a moment is',
          'Quick reference for common formats including ISO 8601, RFC 2822, and short formatted dates',
        ],
        howToUse: [
          'Enter a 10-digit (seconds) or 13-digit (milliseconds) value in the "Timestamp to date" area',
          'The precision is detected automatically and converted to local and standard times',
          'Use the date-time picker in the "Date to timestamp" area to get the epoch integer instantly',
          'Click "Copy" next to the live clock to grab the current seconds timestamp',
        ],
        useCases: [
          'Mapping database-stored created_at integers to real business event times',
          'Debugging distributed international systems and checking token expiry',
          'Aligning log timelines and locating the moment of failure',
        ],
        privacyNote:
          'Built on local in-browser computation and the Intl internationalization standard to protect privacy.',
        faqs: [
          {
            question: 'What is the difference between 10-digit and 13-digit timestamps?',
            answer:
              '10 digits represent seconds (common in Unix/Linux/PHP/Go), while 13 digits represent milliseconds (common in JavaScript/Java). The tool auto-detects the precision.',
          },
        ],
      },
    },
  },
  {
    slug: 'markdown-preview',
    name: 'Markdown 在线预览与排版',
    nameEn: 'Markdown Live Previewer',
    description:
      '轻量沉浸的 Markdown 双栏写作台，实时渲染 GitHub 风格排版，支持一键复制富文本或 HTML。',
    descriptionEn:
      'Minimalist two-pane Markdown workspace with real-time GitHub styling preview and HTML/rich-text export.',
    category: ToolCategoryEnum.TEXT_CONTENT,
    path: '/tools/markdown-preview',
    iconName: 'FileCode',
    tags: ['Markdown', '排版', '预览', 'HTML', '富文本'],
    tagsEn: ['Markdown', 'Preview', 'HTML', 'Typography', 'RichText'],
    isPopular: false,
    isNew: false,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: `# ToolCraft 在线工具箱

**简单、高效、直接** 是我们的核心设计哲学。

## 为什么选择 ToolCraft？
1. **纯浏览器本地运算**：您的数据绝不离开您的设备
2. **极速响应**：毫秒级转换与计算反馈
3. **沉浸式交互**：去掉一切臃肿装饰与繁琐弹窗

### 代码块演示
\`\`\`typescript
const tool = {
  name: "Markdown Preview",
  privacy: "100% Client-side",
  speed: "Instant"
};
\`\`\`

> 工具的核心不是展示设计，而是让用户感觉工具本身极好用。
`,
    doc: {
      zh: {
        whatIsIt:
          '开箱即用的 Markdown 写作与即时渲染工作台。提供标准 CommonMark 规范支持，适合撰写 README、技术文档草稿或自媒体排版。',
        coreFeatures: [
          '双栏同步实时渲染：左侧打字，右侧即刻刷新排版视效',
          '多格式导出提取：支持快速复制纯文本、HTML 代码片段',
          '字符与阅读时长统计：自动计算总字数、段落数与预估阅读时间',
          '排版规范美观：精心调校的代码高亮背景、表格边框与引用块视觉层次',
        ],
        howToUse: [
          '在左侧编辑器中直接输入或粘贴 Markdown 源码',
          '右侧将无缝展现排版完成后的样式效果',
          '点击顶部快捷工具栏可快速插入常用语法片段',
          '点击右上角「复制 HTML」可将编译后标签贴入自己的博客后台',
        ],
        useCases: [
          'GitHub 项目 README.md 编写与预校验',
          '将 Markdown 笔记转换为富文本粘贴至公众号或邮件',
          '临时草稿撰写与字数精细核验',
        ],
        privacyNote:
          '内容基于纯浏览器本地运算处理，关闭页面前请及时复制保存。',
        faqs: [
          {
            question: '支持 GFM 表格和任务清单列表语法吗？',
            answer: '支持标准的 GFM 表格语法与任务列表语法展示。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A ready-to-use Markdown writing and live-rendering workbench. It supports standard CommonMark and is ideal for README files, technical draft docs, or content-creator formatting.',
        coreFeatures: [
          'Synced two-pane rendering: type on the left and see formatted output on the right instantly',
          'Multi-format export: quickly copy plain text or HTML snippets',
          'Character and reading-time stats: word count, paragraphs, and estimated reading time are automatic',
          'Beautiful typography with carefully tuned code backgrounds, table borders, and blockquote hierarchy',
        ],
        howToUse: [
          'Type or paste Markdown source directly into the left editor',
          'The right side seamlessly shows the formatted result',
          'Use the top quick-insert toolbar for common syntax snippets',
          'Click "Copy HTML" in the top right to paste compiled tags into your blog backend',
        ],
        useCases: [
          'Writing and pre-checking GitHub project README.md files',
          'Turning Markdown notes into rich text for newsletters or emails',
          'Drafting temporary notes with precise word-count checks',
        ],
        privacyNote:
          'Content is processed entirely in your browser. Copy and save your work before closing the page.',
        faqs: [
          {
            question: 'Does it support GFM tables and task-list syntax?',
            answer:
              'Standard GFM table syntax and task-list rendering are supported.',
          },
        ],
      },
    },
  },
  {
    slug: 'hash-generator',
    name: '哈希生成与文本指纹',
    nameEn: 'Hash & Checksum Generator',
    description:
      '快速生成字符串的 MD5, SHA-1, SHA-256, SHA-512 数字指纹校验和。',
    descriptionEn:
      'Cryptographic hash and checksum generator using native Web Crypto for SHA-256, SHA-512, SHA-1 and MD5.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/hash-generator',
    iconName: 'Fingerprint',
    tags: ['哈希', 'SHA256', 'MD5', '指纹', '校验'],
    tagsEn: ['Hash', 'SHA256', 'MD5', 'Checksum', 'Fingerprint'],
    isPopular: false,
    isNew: false,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'The quick brown fox jumps over the lazy dog',
    doc: {
      zh: {
        whatIsIt:
          '基于现代 Web Crypto API 的密码学单向哈希生成器。提供常用数字指纹摘要计算，用于验证数据完整性与密码学校验。',
        coreFeatures: [
          '多算法并行输出：一次输入，同时呈现 SHA-256, SHA-512, SHA-1 与 MD5 摘要',
          '大写/小写一键切换：适配不同系统对 Hex 字符串的大小写偏好',
          '硬件级加密加速：调用浏览器底层 WebCrypto 接口，毫秒级得出运算结果',
          '绝不上报数据：敏感密匙和待算字符串绝不离开设备',
        ],
        howToUse: [
          '在输入框中粘贴需要计算哈希的原始字符串',
          '下方列表自动联动刷新各加密算法的指纹结果',
          '点击对应算法行右侧的复制按钮取用',
        ],
        useCases: [
          '验证文件下载提供的校验和（Checksum）',
          '数据库设计中用户标识或缓存键的固定长度散列生成',
          '接口签名（Signature）调试比对',
        ],
        privacyNote:
          '基于纯浏览器本地运算与原生 WebCrypto 接口，严格保护输入内容。',
        faqs: [
          {
            question: 'SHA-256 会存在碰撞吗？',
            answer:
              '在目前已知算力范围内，SHA-256 的抗碰撞性极其坚固，被公认为行业标准安全哈希。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A cryptographic one-way hash generator built on the modern Web Crypto API. It provides common fingerprint digests for verifying data integrity and cryptographic checks.',
        coreFeatures: [
          'Multiple algorithms at once: a single input produces SHA-256, SHA-512, SHA-1, and MD5 digests',
          'Uppercase/lowercase toggle to match different systems’ hex-string preferences',
          'Hardware-accelerated crypto via the browser’s native WebCrypto interface for millisecond results',
          'No data reporting: sensitive keys and source strings never leave the device',
        ],
        howToUse: [
          'Paste the raw string you want to hash into the input box',
          'The list below automatically refreshes with fingerprint results for every algorithm',
          'Click the copy button on a row to take that algorithm’s result',
        ],
        useCases: [
          'Verifying checksums provided with file downloads',
          'Generating fixed-length hashes for user identifiers or cache keys in database design',
          'Debugging and comparing API signature values',
        ],
        privacyNote:
          'Built on local in-browser computation and the native WebCrypto interface to protect your input strictly.',
        faqs: [
          {
            question: 'Can SHA-256 collisions occur?',
            answer:
              'Within today’s known computing power, SHA-256 collision resistance is extremely strong and it is recognized as the industry-standard secure hash.',
          },
        ],
      },
    },
  },
  {
    slug: 'qr-generator',
    name: '极简二维码生成器',
    nameEn: 'QR Code Generator',
    description:
      '输入任何网址或文本，即刻生成高清矢量二维码，支持尺寸调节与直接下载 PNG。',
    descriptionEn:
      'Generate high-resolution QR codes from any URL or text offline with customizable sizes and error correction.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/qr-generator',
    iconName: 'QrCode',
    tags: ['二维码', 'QR', '生成', '链接', '分享'],
    tagsEn: ['QRCode', 'Generator', 'Link', 'Share', 'Barcode'],
    isPopular: false,
    isNew: false,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'https://toolkit.craft/tools',
    doc: {
      zh: {
        whatIsIt:
          '极简纯净的二维码生成工具。告别那些充斥广告与收费门槛的第三方生成站，在本地瞬间将文本、Wi-Fi 密码或网址转为可扫码的清晰矩阵图。',
        coreFeatures: [
          '纯净无广告：生成的二维码永久有效，不走任何中间跳转链接',
          '尺寸动态调节：支持 128px ~ 512px 多种分辨率自定义',
          '容错率控制：多级错误纠正配置，即使表面部分破损仍能准确识别',
          '一键下载与复制：支持直接保存为高清 PNG 图像',
        ],
        howToUse: [
          '在文本框中输入需要转为二维码的内容（如网址链接）',
          '调节滑块设置二维码的边长与容错级别',
          '二维码画布即时完成绘制，支持使用手机相机测试扫描',
          '点击「下载图片」保存到本地',
        ],
        useCases: [
          '将电脑端长网址快速同步到手机扫码访问',
          '海报、展架、传单物料的印刷二维码制作',
          'Wi-Fi 连接串或支付信息快速展示',
        ],
        privacyNote:
          '二维码矩阵完全由纯浏览器本地运算与 Canvas 绘制，网址与私密信息零云端中转。',
        faqs: [
          {
            question: '这个二维码会过期吗？',
            answer:
              '不会。这是“静态二维码”，所有信息直接编码在黑白模块中，只要不删除图片即可永久扫描。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A minimal, clean QR code generator. Skip the ad-filled, paywalled third-party sites and turn text, Wi-Fi passwords, or URLs into scannable, crisp matrix images locally in an instant.',
        coreFeatures: [
          'Clean and ad-free: generated QR codes work forever with no intermediate redirect links',
          'Dynamic sizing: customize resolution from 128px to 512px',
          'Error-correction control: multiple correction levels keep codes readable even if partially damaged',
          'One-click download and copy, including high-resolution PNG export',
        ],
        howToUse: [
          'Enter the content you want to encode (such as a URL) in the text box',
          'Adjust the sliders to set the QR code size and error-correction level',
          'The canvas renders instantly — test it with your phone camera',
          'Click "Download" to save the image locally',
        ],
        useCases: [
          'Quickly sending long desktop URLs to a phone by scanning',
          'Producing print-ready QR codes for posters, stands, and flyers',
          'Showing Wi-Fi connection strings or payment information on the spot',
        ],
        privacyNote:
          'The QR matrix is generated and drawn entirely in your browser via Canvas, with zero cloud relay of URLs or private information.',
        faqs: [
          {
            question: 'Will this QR code expire?',
            answer:
              'No. It is a static QR code — all information is encoded directly in the black-and-white modules, so it remains scannable as long as the image exists.',
          },
        ],
      },
    },
  },
  {
    slug: 'uuid-generator',
    name: 'UUID 生成器',
    nameEn: 'UUID Generator',
    description:
      '一键生成多个符合 RFC4122 标准的 v4 版本 UUID，支持批量生成多个。',
    descriptionEn:
      'Generate multiple RFC4122 compliant version 4 UUIDs in one click, supports bulk generation.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/uuid-generator',
    iconName: 'Key',
    tags: ['UUID', '生成器', '开发', 'ID'],
    tagsEn: ['UUID', 'Generator', 'Dev', 'ID'],
    isPopular: true,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '基于浏览器原生 Crypto API 的安全 UUID v4 生成工具，可一次性生成多个符合 RFC4122 标准的 UUID。',
        coreFeatures: [
          '安全随机：使用浏览器原生 Crypto API 生成，随机性更强',
          '批量生成：支持一次性生成 1、5、10、20 个 UUID',
          '一键复制：生成结果可一次性全部复制到剪贴板',
          '纯本地生成：所有操作都在本地完成，不依赖服务器',
        ],
        howToUse: [
          '选择需要生成的数量',
          '点击「重新生成」按钮即可得到新的 UUID',
          '点击「复制全部」将所有生成的 UUID 复制到剪贴板',
        ],
        useCases: [
          '开发中生成测试数据唯一标识',
          '分布式系统生成全局唯一ID',
          '快速生成临时会话ID',
        ],
        privacyNote:
          '所有生成都在本地浏览器完成，不与服务器交互，安全可靠。',
        faqs: [
          {
            question: '生成的 UUID 会重复吗？',
            answer:
              'UUID v4 有极其巨大的空间（128 bits），发生重复的概率可以忽略不计，满足绝大多数应用场景需求。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A secure UUID v4 generator based on browser native Crypto API, generates multiple RFC4122 compliant UUIDs in one go.',
        coreFeatures: [
          'Secure random: uses browser native Crypto API for stronger randomness',
          'Bulk generation: supports generating 1, 5, 10, or 20 UUIDs at once',
          'One-click copy: copy all generated UUIDs to clipboard in one click',
          '100% local: all operations done locally, no server dependency',
        ],
        howToUse: [
          'Select how many UUIDs you want to generate',
          'Click "Regenerate" to get new UUIDs',
          'Click "Copy All" to copy all generated UUIDs to clipboard',
        ],
        useCases: [
          'Generating unique identifiers for test data in development',
          'Generating globally unique IDs for distributed systems',
          'Quickly generating temporary session IDs',
        ],
        privacyNote:
          'All generation is done locally in your browser, no server interaction, safe and reliable.',
        faqs: [
          {
            question: 'Can generated UUIDs duplicate?',
            answer:
              'UUID v4 has an extremely large space (128 bits), the probability of collision is negligible for most applications.',
          },
        ],
      },
    },
  },
  {
    slug: 'yaml-to-json',
    name: 'YAML 转 JSON',
    nameEn: 'YAML to JSON Converter',
    description:
      '将 YAML 格式数据转换为格式化的 JSON 数据，支持实时预览转换结果。',
    descriptionEn:
      'Convert YAML formatted data to pretty-printed JSON with real-time preview.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/yaml-to-json',
    iconName: 'Code',
    tags: ['YAML', 'JSON', '转换', '开发'],
    tagsEn: ['YAML', 'JSON', 'Convert', 'Dev'],
    isPopular: true,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: `name: ToolCraft
version: 1.0.0
description: Online Toolkit
features:
  - yaml-to-json
  - word-count
  - online-tools
author:
  name: Developer
  email: dev@example.com
`,
    doc: {
      zh: {
        whatIsIt:
          '便捷的 YAML 到 JSON 格式转换器，无需上传服务器，实时转换 YAML 配置为格式化 JSON。',
        coreFeatures: [
          '实时转换：输入 YAML 后即刻生成格式化 JSON',
          '错误提示：YAML 语法错误时清晰展示错误信息',
          '一键复制：转换成功后快速复制 JSON 结果',
          '纯本地运行：所有转换在浏览器中完成，配置不离开设备',
        ],
        howToUse: [
          '在左侧输入框粘贴需要转换的 YAML 内容',
          '右侧会自动显示转换后的 JSON 结果',
          '如果有语法错误，会显示错误详情',
          '转换成功后点击右上角复制按钮获取结果',
        ],
        useCases: [
          '开发中 YAML 配置文件转 JSON',
          'API 文档 YAML 示例转 JSON',
          'CI/CD 配置转换测试',
        ],
        privacyNote:
          '所有转换运算都在本地浏览器完成，配置内容不会上传到任何服务器，保护隐私安全。',
        faqs: [
          {
            question: '支持所有 YAML 语法吗？',
            answer:
              '目前支持大多数常用 YAML 语法，包括键值对、嵌套对象、注释等，满足日常开发需求。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A convenient YAML to JSON converter that works entirely in your browser, converting YAML to formatted JSON in real-time.',
        coreFeatures: [
          'Real-time conversion: get formatted JSON instantly as you type YAML',
          'Error reporting: clearly displays syntax errors when they occur',
          'One-click copy: quickly copy JSON result after conversion',
          '100% local: all conversion done in-browser, config never leaves your device',
        ],
        howToUse: [
          'Paste your YAML content in the left input box',
          'The converted JSON will automatically appear on the right',
          'If there are syntax errors, error details will be displayed',
          'Click the copy button in the top right to get the result',
        ],useCases: [
          'Converting YAML config files to JSON in development',
          'Converting YAML API examples to JSON',
          'Testing CI/CD configuration conversions',
        ],
        privacyNote:
          'All conversion is done locally in your browser. Configuration content is never uploaded to any server, keeping your data private.',
        faqs: [
          {
            question: 'Does it support all YAML syntax?',
            answer:
              'It supports most commonly used YAML syntax including key-value pairs, nested objects, comments, etc., meeting daily development needs.',
          },
        ],
      },
    },
  },
  {
    slug: 'word-count',
    name: '字数统计',
    nameEn: 'Word & Character Counter',
    description:
      '实时统计文本的字符数、字数、行数和段落数，支持中英文混合统计。',
    descriptionEn:
      'Real-time count characters, words, lines, and paragraphs in text, supports mixed Chinese and English.',
    category: ToolCategoryEnum.TEXT_CONTENT,
    path: '/tools/word-count',
    iconName: 'FileText',
    tags: ['文本', '字数', '统计', '字符'],
    tagsEn: ['Text', 'Word', 'Count', 'Character'],
    isPopular: true,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'Hello World!\n\n这是一段测试文本，用于统计字数和字符数。\n\n包含多个段落。',
    doc: {
      zh: {
        whatIsIt:
          '简洁高效的文本统计工具，一键获取字符数（含空格）、字数、行数和段落数，支持中英文混合文本统计。',
        coreFeatures: [
          '多维度统计：同时输出字符数、字数、行数、段落数四个维度',
          '实时更新：输入文字时统计结果自动刷新，无需额外点击',
          '支持中英文：智能分词，中文字符和英文单词都能准确统计',
          '纯本地运行：所有统计都在浏览器内完成，文本不离开设备',
        ],
        howToUse: [
          '在输入框中粘贴或输入需要统计的文本',
          '下方四个统计卡片会自动展示统计结果',
          '结果实时更新，修改文本后即刻刷新',
        ],
        useCases: [
          '写作时统计文章字数，满足投稿或作文要求',
          '文案撰写时预估篇幅和阅读时间',
          '代码开发前统计注释文本长度',
        ],
        privacyNote:
          '所有统计运算都在本地浏览器完成，文本内容不会上传到任何服务器，保护隐私安全。',
        faqs: [
          {
            question: '中文会统计成一个字吗？',
            answer:
              '是的，每个中文字符会被统计为一个字，同时也会计入总字符数。',
          },
          {
            question: '空格会被计入字符数吗？',
            answer: '是的，空格、换行符都会统计到总字符数中。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A simple and efficient text statistics tool that instantly gets character count (including spaces), word count, line count, and paragraph count, supports mixed Chinese and English text.',
        coreFeatures: [
          'Multi-dimensional statistics: output four dimensions at the same time: characters, words, lines, paragraphs',
          'Real-time update: results refresh automatically as you type, no extra clicks needed',
          'Chinese & English support: intelligent word segmentation for accurate counting',
          '100% local: all processing done in-browser, text never leaves your device',
        ],
        howToUse: [
          'Paste or type your text in the input area',
          'Four statistic cards will automatically show the results',
          'Results update in real-time when you modify the text',
        ],
        useCases: [
          'Counting words for essays and article submissions',
          'Estimating article length and reading time for copywriting',
          'Checking comment length before coding',
        ],
        privacyNote:
          'All counting is done locally in your browser. Text content is never uploaded to any server, keeping your content private.',
        faqs: [
          {
            question: 'Are Chinese characters counted as one word?',
            answer:
              'Yes, each Chinese character is counted as one word and is also included in the total character count.',
          },
          {
            question: 'Are spaces included in the character count?',
            answer: 'Yes, spaces and newlines are included in the total character count.',
          },
        ],
      },
    },
  },
  {
    slug: 'strong-password-generator',
    name: '强密码生成器',
    nameEn: 'Strong Password Generator',
    description:
      '生成自定义长度、包含大小写、数字、特殊符号的高强度随机密码。',
    descriptionEn:
      'Generate strong random passwords with customizable length, mixed case, numbers, and symbols.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/strong-password-generator',
    iconName: 'Key',
    tags: ['密码', '随机', '安全', '生成', '强度'],
    tagsEn: ['Password', 'Random', 'Security', 'Generator', 'Strength'],
    isPopular: true,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '基于浏览器原生 Crypto API 的安全随机密码生成器，帮你快速创建符合安全要求的高强度密码。',
        coreFeatures: [
          '自定义密码长度 4~32 位',
          '可选择包含小写、大写、数字、特殊符号',
          '强制至少包含一个选中类型的字符，避免生成不满足要求的密码',
          '纯浏览器本地生成，密码绝不离开设备',
        ],
        howToUse: [
          'Drag the slider to adjust password length',
          'Check the character types you want to include (at least one)',
          '点击刷新按钮重新生成',
          '点击复制按钮复制生成的密码',
        ],
        useCases: [
          '注册网站/APP 账号时生成安全密码',
          '重置密码时创建新的高强度密码',
          '为不同网站生成唯一密码',
        ],
        privacyNote:
          '所有生成过程都在浏览器本地完成，使用原生加密安全随机数生成器，绝不记录生成的密码。',
        faqs: [
          {
            question: '为什么这个生成器比普通的更安全？',
            answer:
              '本工具使用浏览器原生 `crypto.getRandomValues` API 生成随机数，相比 `Math.random()` 提供更高熵值，更难被破解。',
          },
          {
            question: '可以生成多长的密码？',
            answer:
              '支持 4 到 32 位长度，一般推荐 12 位以上，对安全性要求高的场景可以使用 16 位以上。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A cryptographically secure random password generator based on browser native Crypto API, helps you quickly create strong passwords that meet security requirements.',
        coreFeatures: [
          'Customizable password length from 4 to 32 characters',
          'Option to include lowercase, uppercase, numbers, and symbols',
          'Enforces at least one character from each selected category',
          '100% local generation, password never leaves your device',
        ],
        howToUse: [
          'Drag the slider to adjust password length',
          'Check the character types you want to include (at least one)',
          'Click the refresh button to regenerate',
          'Click the copy button to copy the generated password',
        ],
        useCases: [
          'Generating secure passwords when registering for websites/apps',
          'Creating new strong passwords when resetting',
          'Generating unique passwords for different sites',
        ],
        privacyNote:
          'All generation is done locally in your browser using the native cryptographically secure random number generator, passwords are never logged.',
        faqs: [
          {
            question: 'Why is this generator more secure than others?',
            answer:
              'This tool uses the browser native `crypto.getRandomValues` API to generate random numbers, which provides higher entropy than `Math.random()` and is harder to crack.',
          },
          {
            question: 'What length of password can I generate?',
            answer:
              'Supports 4 to 32 characters. 12+ characters is generally recommended, use 16+ for higher security requirements.',
          },
        ],
      },
    },
  },
  {
    slug: 'password-strength-checker',
    name: '密码强度检测器',
    nameEn: 'Password Strength Checker',
    description:
      '检测密码强度，根据长度和字符多样性给出安全性评分和改进建议。',
    descriptionEn:
      'Check password security strength based on length and character diversity, gives improvement suggestions.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/password-strength-checker',
    iconName: 'Shield',
    tags: ['密码', '安全', '检测', '强度', '评分'],
    tagsEn: ['Password', 'Security', 'Check', 'Strength', 'Score'],
    isPopular: true,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '帮助你评估密码安全性，根据长度、大小写混合、数字和特殊符号给出评分，提供具体改进建议。',
        coreFeatures: [
          '实时检测输入密码强度',
          '评分分为弱/中/强三级',
          '给出具体改进建议，告诉你缺少什么字符类型',
          '纯浏览器本地运算，不泄露你的密码',
        ],
        howToUse: [
          '在输入框中输入要检测的密码',
          '下方会实时显示强度评分和进度条',
          '如果密码不够强，会列出具体改进建议',
        ],
        useCases: [
          '注册账号时评估你选择的密码强度',
          '修改密码时确保新密码足够安全',
          '检查现有密码安全性',
        ],
        privacyNote:
          '所有检测都在浏览器本地完成，你的密码不会上传到任何服务器，隐私安全有保障。',
        faqs: [
          {
            question: '什么样的密码算强密码？',
            answer:
              '一般建议长度至少 8 位，最好 12 位以上，同时包含大小写字母、数字和特殊符号，就是一个强度足够的密码。',
          },
          {
            question: '为什么要混合不同类型的字符？',
            answer:
              '混合更多类型的字符会大大增加密码的熵值，让暴力破解需要尝试更多组合，所以安全性更高。',
          },
        ],
      },
      en: {
        whatIsIt:
          'Helps you evaluate password security, gives a score based on length, mixed case, numbers, and symbols, and provides specific improvement suggestions.',
        coreFeatures: [
          'Real-time password strength detection',
          'Three levels of rating: weak, medium, strong',
          'Provides specific improvement suggestions to tell you what character types are missing',
          'Pure in-browser calculation, does not leak your password',
        ],
        howToUse: [
          'Enter the password you want to check in the input box',
          'The strength score and progress bar are displayed in real time below',
          'If the password is not strong enough, specific improvement suggestions will be listed',
        ],
        useCases: [
          'Evaluate the strength of the password you choose when registering an account',
          'Ensure the new password is secure enough when changing password',
          'Check the security of existing passwords',
        ],
        privacyNote:
          'All checking is done locally in your browser, your password will not be uploaded to any server, so privacy and security are guaranteed.',
        faqs: [
          {
            question: 'What counts as a strong password?',
            answer:
              'It is generally recommended to be at least 8 characters in length, preferably 12+ characters, and contain lowercase, uppercase, numbers, and special symbols. That would be a sufficiently strong password.',
          },
          {
            question: 'Why mix different types of characters?',
            answer:
              'Mixing more types of characters greatly increases the entropy of the password. Brute force cracking needs to try more combinations, so the security is higher.',
          },
        ],
      },
    },
  },
  {
    slug: 'jwt-parser',
    name: 'JWT 生成器/解析器',
    nameEn: 'JWT Generator & Parser',
    description:
      '解析 JSON Web Token，查看 Header/Payload，验证签名，也可以生成新的 JWT。',
    descriptionEn:
      'Parse JSON Web Token, inspect Header/Payload, verify signature, and also generate new JWT.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/jwt-parser',
    iconName: 'Key',
    tags: ['JWT', 'Token', '解析', '生成', '签名'],
    tagsEn: ['JWT', 'Token', 'Parser', 'Generator', 'Signature'],
    isPopular: true,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '一站式 JWT 工具，支持解析已有 Token，查看 Header 和 Payload 信息，验证 HMAC-SHA256 签名，也可以根据自定义 Header 和 Payload 生成新的 JWT。',
        coreFeatures: [
          '解析模式：输入 JWT 自动解析，格式化展示 JSON',
          '生成模式：输入 Header、Payload 和密钥，生成签名后的 JWT',
          '支持验证 HMAC-SHA256 签名',
          '纯浏览器本地操作，密钥不会离开设备',
        ],
        howToUse: [
          '选择「解析」模式，粘贴 JWT Token，就能看到解析后的 Header 和 Payload',
          '输入签名密钥可以验证签名有效性',
          '选择「生成」模式，输入 JSON 格式的 Header 和 Payload，输入密钥，点击生成即可',
        ],
        useCases: [
          '开发调试 API 鉴权时解析 JWT 内容',
          '验证 JWT 签名是否正确',
          '生成测试用的 JWT Token',
        ],
        privacyNote:
          '所有操作都在浏览器本地完成，JWT 和密钥都不会上传到服务器，保护你的密钥安全。',
        faqs: [
          {
            question: '支持哪些算法？',
            answer: '目前只支持 HS256 (HMAC-SHA256)，这是最常用的对称签名算法。',
          },
          {
            question: '验证失败一定是密钥错了吗？',
            answer:
              '验证失败可能是密钥错误，也可能是算法不匹配，或者 Token 本身格式不正确。请检查 Token 格式和密钥。',
          },
        ],
      },
      en: {
        whatIsIt:
          'All-in-one JWT tool. Supports parsing existing tokens, viewing Header and Payload information, verifying HMAC-SHA256 signatures, and can also generate new JWTs with custom Headers and Payloads.',
        coreFeatures: [
          'Parse mode: input JWT and automatically parse, format and display JSON',
          'Generate mode: input custom Header, Payload and secret, generate signed JWT',
          'Supports HMAC-SHA256 signature verification',
          'Pure in-browser operation, secret never leaves your device',
        ],
        howToUse: [
          'Select "Parse" mode, paste your JWT Token, you will see the parsed Header and Payload',
          'Enter the signature secret to verify the signature validity',
          'Select "Generate" mode, enter JSON format Header and Payload, enter secret, click generate',
        ],
        useCases: [
          'Parsing JWT content when developing and debugging API authentication',
          'Verifying if JWT signature is correct',
          'Generating JWT tokens for testing',
        ],
        privacyNote:
          'All operations are done locally in your browser, JWT and secret will not be uploaded to any server, protects your secret security.',
        faqs: [
          {
            question: 'What algorithms are supported?',
            answer: 'Currently only HS256 (HMAC-SHA256) is supported, which is the most commonly used symmetric signature algorithm.',
          },
          {
            question: 'Does verification failure always mean wrong secret?',
            answer:
              'Verification failure may be due to wrong secret, mismatched algorithm, or incorrect Token format. Please check the Token format and secret.',
          },
        ],
      },
    },
  },
  {
    slug: 'crc32-checksum',
    name: 'CRC32 校验和',
    nameEn: 'CRC32 Checksum',
    description:
      '计算文本/字符串的 CRC32 校验值，用于数据完整性校验。',
    descriptionEn:
      'Calculate CRC32 checksum for text/string, used for data integrity verification.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/crc32-checksum',
    iconName: 'Fingerprint',
    tags: ['CRC32', '校验', '完整性', '哈希'],
    tagsEn: ['CRC32', 'Checksum', 'Integrity', 'Hash'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '计算文本的 CRC32 校验和，用于验证数据在传输或存储后是否完整。',
        coreFeatures: [
          '实时计算输入文本的 CRC32 值',
          '输出十六进制小写结果',
          '纯浏览器本地运算，大文本也能秒出结果',
          '标准 CRC32 算法，结果与其他工具兼容',
        ],
        howToUse: [
          '在输入框中输入需要计算的文本',
          '下方会自动显示计算结果',
          '点击复制按钮复制结果',
        ],
        useCases: [
          '验证下载文件的完整性，和下载站提供的校验值对比',
          '检查文本内容是否被修改',
          '快速生成数据的短指纹',
        ],
        privacyNote:
          '所有计算都在浏览器本地完成，你的文本不会上传到任何服务器。',
        faqs: [
          {
            question: 'CRC32 可以用于加密吗？',
            answer:
              'CRC32 是校验算法，不是加密算法，主要用于检测数据完整性，不适合用于密码存储或加密用途。',
          },
          {
            question: '结果和其他工具算出来不一样？',
            answer:
              '本工具使用标准的 CRC32 算法，如果你使用不同初始值或不同多项式，结果会不一样。一般来说结果和大多数标准工具一致。',
          },
        ],
      },
      en: {
        whatIsIt:
          'Calculate CRC32 checksum for text, used to verify if data is complete after transmission or storage.',
        coreFeatures: [
          'Real-time calculation of CRC32 value for input text',
          'Output hexadecimal lowercase result',
          'Pure in-browser calculation, fast even for large text',
          'Standard CRC32 algorithm, result compatible with other tools',
        ],
        howToUse: [
          'Enter the text you need to calculate in the input box',
          'The calculation result is automatically displayed below',
          'Click the copy button to copy the result',
        ],
        useCases: [
          'Verify the integrity of downloaded files, compare with the checksum provided by the download site',
          'Check if text content has been modified',
          'Quickly generate a short fingerprint of data',
        ],
        privacyNote:
          'All calculations are done locally in your browser, your text will not be uploaded to any server.',
        faqs: [
          {
            question: 'Can CRC32 be used for encryption?',
            answer:
              'CRC32 is a checksum algorithm, not an encryption algorithm. It is mainly used for detecting data integrity and is not suitable for password storage or encryption purposes.',
          },
          {
            question: 'The result is different from other tools, why?',
            answer:
              'This tool uses the standard CRC32 algorithm. If you use a different initial value or a different polynomial, the result will be different. Generally speaking, the result is consistent with most standard tools.',
          },
        ],
      },
    },
  },
  {
    slug: 'bcrypt-hash',
    name: 'BCrypt 哈希',
    nameEn: 'BCrypt Hash',
    description:
      '对密码进行 BCrypt 哈希加密，也可以验证密码是否匹配哈希值。',
    descriptionEn:
      'Generate BCrypt password hashes, and verify if a password matches a hash.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/bcrypt-hash',
    iconName: 'Lock',
    tags: ['BCrypt', '哈希', '密码', '加密', '验证'],
    tagsEn: ['BCrypt', 'Hash', 'Password', 'Crypto', 'Verify'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          'BCrypt 密码哈希工具，支持生成密码哈希和验证密码匹配，可自定义 cost factor 控制计算难度。',
        coreFeatures: [
          '生成模式：输入密码生成 BCrypt 哈希',
          '验证模式：输入密码和哈希，验证是否匹配',
          '可自定义 cost factor (rounds)，从 4 到 16',
          '纯浏览器本地运算，密码不离开设备',
        ],
        howToUse: [
          '选择「生成」模式，输入密码，调整 cost factor，即可生成哈希',
          '选择「验证」模式，输入密码和要验证的哈希，点击验证按钮',
        ],
        useCases: [
          '开发调试时生成 BCrypt 密码哈希用于测试',
          '验证某个密码是否匹配已知哈希',
          '测试不同 cost factor 对生成时间的影响',
        ],
        privacyNote:
          '所有运算都在浏览器本地完成，密码和哈希都不会上传到服务器，保护你的隐私安全。',
        faqs: [
          {
            question: '什么是 cost factor (rounds)?',
            answer:
              'cost factor 决定了哈希计算的迭代次数，数值越大，计算越慢，暴力破解越困难。每增加 1，计算时间翻倍。一般 10~12 就足够安全了。',
          },
          {
            question: '为什么生成很慢当 rounds 很大时？',
            answer:
              '这是设计如此，BCrypt 故意设计成计算缓慢，用来抵抗暴力破解。rounds 越大，安全性越高，但生成和验证也越慢。',
          },
        ],
      },
      en: {
        whatIsIt:
          'BCrypt password hash tool, supports generating password hashes and verifying password matches, with customizable cost factor to control computational difficulty.',
        coreFeatures: [
          'Generate mode: input password and generate BCrypt hash',
          'Verify mode: input password and hash, verify if they match',
          'Customizable cost factor (rounds), from 4 to 16',
          'Pure in-browser operation, password never leaves your device',
        ],
        howToUse: [
          'Select "Generate" mode, enter password, adjust cost factor, generate the hash',
          'Select "Verify" mode, enter password and hash to verify, click verify button',
        ],
        useCases: [
          'Generating BCrypt password hashes for testing during development debugging',
          'Verifying if a password matches a known hash',
          'Testing the effect of different cost factors on generation time',
        ],
        privacyNote:
          'All operations are done locally in your browser, passwords and hashes will not be uploaded to any server, protects your privacy.',
        faqs: [
          {
            question: 'What is cost factor (rounds)?',
            answer:
              'The cost factor determines the number of hashing iterations. A larger value means slower computation and harder brute force cracking. Increasing by 1 doubles the computation time. Generally 10~12 is sufficiently secure.',
          },
          {
            question: 'Why is generation slow when rounds is large?',
            answer:
              'This is by design. BCrypt is intentionally slow to resist brute force attacks. Larger rounds mean higher security but slower generation and verification.',
          },
        ],
      },
    },
  },
  {
    slug: 'symmetric-crypto',
    name: 'AES 对称加密',
    nameEn: 'AES Symmetric Encryption',
    description:
      '使用 AES-GCM 算法对文本进行加密/解密，分享敏感信息只有知道密钥才能解密。',
    descriptionEn:
      'Encrypt/decrypt text with AES-GCM algorithm, share sensitive information only those who know the key can decrypt.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/symmetric-crypto',
    iconName: 'Lock',
    tags: ['AES', '加密', '解密', '对称加密', 'GCM'],
    tagsEn: ['AES', 'Encrypt', 'Decrypt', 'Symmetric', 'GCM'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '使用浏览器原生 AES-GCM 算法加密文本，方便分享敏感信息，只有知道密钥的人才能解密查看内容。',
        coreFeatures: [
          '同时支持加密和解密，一站式加解密',
          '使用推荐的 12 字节随机 IV，每次加密生成不同的 IV',
          '输出格式为 iv.ciphertext，标准格式可直接在其他工具中使用',
          '纯浏览器本地运算，使用原生 Web Crypto API 硬件加速，密钥绝不离开设备',
        ],
        howToUse: [
          '左边输入要加密的明文和密钥，右边会自动生成加密结果',
          '右边粘贴加密后的内容和相同的密钥，点击解密就能得到明文',
          '分享加密结果时记得同时分享密钥给对方（通过其他渠道安全分享）',
        ],
        useCases: [
          '通过不安全渠道分享敏感信息，只有知道密钥才能解密',
          '加密存储敏感文本在公共笔记中',
          '交换加密信息，双方提前约定好密钥即可',
        ],
        privacyNote:
          '所有加解密运算都在浏览器本地完成，明文和密钥都不会上传到任何服务器，完全隐私保护。',
        faqs: [
          {
            question: '密钥长度有要求吗？',
            answer:
              'AES 支持 128 位（16 字节）、192 位（24 字节）、256 位（32 字节）密钥。如果你的密钥是文本，会直接使用 UTF-8 编码作为密钥，长度取决于你输入多少字符。推荐使用至少 16 字符（16 字节 128 位）密钥。',
          },
          {
            question: '为什么每次加密相同明文结果不一样？',
            answer:
              '每次加密都会生成一个新的随机初始化向量（IV），所以即使相同明文密钥结果也不一样，这是 AES-GCM 推荐做法，提高安全性。',
          },
        ],
      },
      en: {
        whatIsIt:
          'Encrypt text with browser native AES-GCM algorithm, convenient for sharing sensitive information. Only people with the key can decrypt and view the content.',
        coreFeatures: [
          'Supports both encryption and decryption, all-in-one tool',
          'Uses recommended 12-byte random IV, generates different IV for each encryption',
          'Output format is iv.ciphertext, standard format can be used directly in other tools',
          'Pure in-browser operation uses native Web Crypto API hardware acceleration, key never leaves your device',
        ],
        howToUse: [
          'Enter plaintext and key on the left, encrypted result is automatically generated on the right',
          'Paste encrypted content and the same key on the right, click decrypt to get plaintext',
          'When sharing encrypted result, remember to share the key with the other party (share securely through another channel)',
        ],
        useCases: [
          'Share sensitive information through insecure channels, only those with key can decrypt',
          'Encrypt and store sensitive text in public notes',
          'Exchange encrypted messages, both parties agree on the key in advance',
        ],
        privacyNote:
          'All encryption and decryption operations are done locally in your browser, plaintext and key will not be uploaded to any server, complete privacy protection.',
        faqs: [
          {
            question: 'Is there any requirement on key length?',
            answer:
              'AES supports 128-bit (16 bytes), 192-bit (24 bytes), and 256-bit (32 bytes) keys. If your key is text, it will be directly encoded as UTF-8 bytes, length depends on how many characters you enter. It is recommended to use at least 16 characters (16 bytes = 128 bits) key.',
          },
          {
            question: 'Why is the result different every time even for the same plaintext?',
            answer:
              'A new random initialization vector (IV) is generated for each encryption, so even with the same plaintext and key the result is different. This is the recommended practice for AES-GCM to improve security.',
          },
        ],
      },
    },
  },
  {
    slug: 'image-color-extractor',
    name: '图片调色板提取器',
    nameEn: 'Image Color Extractor',
    description:
      '上传图片自动提取主色调，基于中位切分量化算法生成调色板，一键复制 CSS 变量。',
    descriptionEn:
      'Upload an image to extract its dominant colors with median-cut quantization, and copy them as CSS variables in one click.',
    category: ToolCategoryEnum.DESIGN_COLOR,
    path: '/tools/image-color-extractor',
    iconName: 'Pipette',
    tags: ['取色', '图片', '调色板', '主色调', 'CSS 变量'],
    tagsEn: ['Color Picker', 'Image', 'Palette', 'Dominant Colors', 'CSS Variables'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '图片调色板提取器是一款纯浏览器本地运行的取色工具，通过 Canvas 读取图片像素并使用中位切分量化算法，从任意图片中提取出具有代表性的主色调。',
        coreFeatures: [
          '中位切分量化：对海量像素聚类，输出视觉上最具代表性的颜色',
          '颜色数量可调：支持 4 / 6 / 8 色三档提取',
          '一键导出：点击色块复制 HEX，或批量复制、下载 CSS 变量',
          '纯本地运算：图片只在浏览器 Canvas 中处理，绝不会上传',
        ],
        howToUse: [
          '点击上传区域或直接拖入一张本地图片',
          '通过分段按钮选择需要提取的颜色数量',
          '在提取结果中点击任意色块复制单个 HEX 值',
          '点击「复制 CSS 变量」或「下载 CSS」获取完整调色板代码',
        ],
        useCases: [
          '从参考图、摄影作品中提炼品牌色与设计灵感',
          '为网页或 App 配图提取与画面协调的配色方案',
          '快速生成设计规范中的 CSS 颜色变量',
        ],
        privacyNote:
          '图片像素仅在浏览器本地 Canvas 中读取与计算，文件不会上传至任何服务器。',
        faqs: [
          {
            question: '提取的颜色和肉眼看到的主色不一致？',
            answer:
              '颜色提取基于像素中位切分量化，会综合出现频率与色彩分布。可以尝试切换颜色数量，通常 6 色或 8 色结果更接近视觉主色。',
          },
        ],
      },
      en: {
        whatIsIt:
          'Image Color Extractor is a fully browser-based color picker. It reads image pixels through Canvas and uses median-cut quantization to extract representative dominant colors from any image.',
        coreFeatures: [
          'Median-cut quantization: clusters millions of pixels into the most representative colors',
          'Adjustable palette size: extract 4, 6, or 8 colors',
          'One-click export: click a swatch to copy HEX, or copy/download CSS variables in bulk',
          '100% local: images are processed only in the browser Canvas and never uploaded',
        ],
        howToUse: [
          'Click the upload area or drag in a local image',
          'Choose the number of colors to extract with the segmented buttons',
          'Click any swatch in the result list to copy its HEX value',
          'Click "Copy CSS Variables" or "Download CSS" to get the full palette code',
        ],
        useCases: [
          'Deriving brand colors and inspiration from reference photos or artwork',
          'Building color schemes that match the imagery of a website or app',
          'Quickly producing CSS color variables for design specs',
        ],
        privacyNote:
          'Image pixels are read and computed only in the local browser Canvas. Files are never uploaded to any server.',
        faqs: [
          {
            question: 'Why do extracted colors differ from the dominant colors I see?',
            answer:
              'Extraction is based on median-cut quantization of pixels, combining frequency and color distribution. Try switching the color count; 6 or 8 colors usually match visual perception best.',
          },
        ],
      },
    },
  },
  {
    slug: 'gradient-generator',
    name: '渐变色生成器',
    nameEn: 'CSS Gradient Generator',
    description:
      '可视化调节线性、径向、圆锥渐变与颜色节点，实时预览并输出 CSS 与 Tailwind 代码。',
    descriptionEn:
      'Visually craft linear, radial, and conic gradients with editable color stops, then copy ready-to-use CSS and Tailwind code.',
    category: ToolCategoryEnum.DESIGN_COLOR,
    path: '/tools/gradient-generator',
    iconName: 'Blend',
    tags: ['渐变', 'CSS', 'Tailwind', '背景', 'linear-gradient'],
    tagsEn: ['Gradient', 'CSS', 'Tailwind', 'Background', 'linear-gradient'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '渐变色生成器是一款可视化的 CSS 渐变设计工具，支持线性、径向与圆锥三种渐变类型，可自由增删颜色节点并实时预览效果。',
        coreFeatures: [
          '三种渐变类型：线性、径向、圆锥一键切换',
          '节点自由编辑：增删颜色节点、调节位置与取色',
          '内置精选预设：一键套用美观的渐变方案',
          '双格式输出：同时生成标准 CSS 与 Tailwind 类名',
        ],
        howToUse: [
          '选择渐变类型，并在线性模式下调整角度',
          '在颜色节点区修改颜色或位置，点击「添加节点」扩展渐变',
          '也可直接点击预设快速套用方案',
          '在底部复制 CSS 代码或 Tailwind 类名',
        ],
        useCases: [
          '制作网页 Hero 横幅、按钮与卡片背景',
          '为海报、封面快速试验渐变配色',
          '生成可直接粘贴到样式文件的渐变代码',
        ],
        privacyNote:
          '所有渐变计算与预览均在浏览器本地完成，不涉及任何数据上传。',
        faqs: [
          {
            question: '支持哪些浏览器？',
            answer:
              '生成的 linear-gradient 与 radial-gradient 被所有现代浏览器支持；conic-gradient 在 Chrome、Safari、Firefox、Edge 现行版本中同样可用。',
          },
        ],
      },
      en: {
        whatIsIt:
          'CSS Gradient Generator is a visual tool for designing CSS gradients. It supports linear, radial, and conic types with freely editable color stops and live preview.',
        coreFeatures: [
          'Three gradient types: switch between linear, radial, and conic',
          'Freely editable stops: add or remove stops, adjust position and color',
          'Curated presets: apply beautiful gradient schemes in one click',
          'Dual output: generates both standard CSS and Tailwind class names',
        ],
        howToUse: [
          'Choose a gradient type and adjust the angle in linear mode',
          'Edit colors or positions in the stops area, or click "Add Stop" to extend the gradient',
          'You can also click a preset to apply a scheme instantly',
          'Copy the CSS code or Tailwind class at the bottom',
        ],
        useCases: [
          'Creating hero banners, button backgrounds, and card backgrounds',
          'Experimenting with gradient colors for posters and covers',
          'Generating gradient code ready to paste into stylesheets',
        ],
        privacyNote:
          'All gradient computation and preview happen locally in the browser with no data upload.',
        faqs: [
          {
            question: 'Which browsers are supported?',
            answer:
              'The generated linear-gradient and radial-gradient work in all modern browsers; conic-gradient is also supported in current versions of Chrome, Safari, Firefox, and Edge.',
          },
        ],
      },
    },
  },
  {
    slug: 'oklch-workbench',
    name: 'OKLCH 色彩工作台',
    nameEn: 'OKLCH Color Workbench',
    description:
      '基于感知均匀的 OKLCH 色彩空间调色，拖动 L/C/H 滑杆并生成感知均匀的色阶。',
    descriptionEn:
      'Mix colors in the perceptually uniform OKLCH space with L/C/H sliders, and generate perceptually even shade scales.',
    category: ToolCategoryEnum.DESIGN_COLOR,
    path: '/tools/oklch-workbench',
    iconName: 'Gauge',
    tags: ['OKLCH', '色彩空间', '色阶', 'Tailwind', 'CSS Color 4'],
    tagsEn: ['OKLCH', 'Color Space', 'Shades', 'Tailwind', 'CSS Color 4'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          'OKLCH 色彩工作台基于现代 CSS Color 4 标准中的 OKLCH 色彩空间。相比 HSL，OKLCH 在感知上更加均匀，调整亮度或色度时颜色变化更符合人眼直觉。',
        coreFeatures: [
          '精确转换：HEX 与 OKLCH 互转，基于 OKLab 数学模型',
          '三轴调节：亮度 L、色度 C、色相 H 滑杆实时调色',
          '色域保护：超 sRGB 色域时自动收缩色度，避免输出无效颜色',
          '感知均匀色阶：一键生成从浅到深过渡自然的 10 档色阶',
        ],
        howToUse: [
          '在取色器中选择颜色，或直接输入 HEX 值',
          '拖动 L、C、H 滑杆微调颜色，超色域时会自动裁剪',
          '查看下方感知均匀色阶，点击任意色块复制',
          '点击「复制 oklch()」获取可直接使用的 CSS 值',
        ],
        useCases: [
          '构建 Tailwind 风格的感知均匀色阶体系',
          '为设计系统选择视觉亮度一致的功能色',
          '在现代项目中使用 oklch() 提升配色可控性',
        ],
        privacyNote:
          '所有色彩数学运算均在浏览器本地完成，不会上传任何数据。',
        faqs: [
          {
            question: 'OKLCH 与 HSL 有什么区别？',
            answer:
              'HSL 是几何均匀但感知不均匀的色彩空间，相同亮度的不同色相看起来明暗不一；OKLCH 基于 OKLab，相同 L 值在视觉上亮度一致，因此更适合构建色阶与设计系统。',
          },
        ],
      },
      en: {
        whatIsIt:
          'OKLCH Color Workbench is built on the OKLCH color space from the modern CSS Color 4 standard. Compared with HSL, OKLCH is perceptually uniform, so lightness and chroma changes match human vision.',
        coreFeatures: [
          'Accurate conversion: HEX to OKLCH and back, based on the OKLab model',
          'Three-axis control: tune lightness L, chroma C, and hue H with live sliders',
          'Gamut protection: automatically reduces chroma beyond sRGB to avoid invalid colors',
          'Perceptual shades: generate 10 evenly transitioning shades in one click',
        ],
        howToUse: [
          'Pick a color in the color picker or enter a HEX value directly',
          'Drag the L, C, and H sliders to fine-tune; out-of-gamut colors are clipped automatically',
          'Review the perceptually uniform shades below and click any swatch to copy',
          'Click "Copy oklch()" to get a ready-to-use CSS value',
        ],
        useCases: [
          'Building Tailwind-style perceptually uniform shade scales',
          'Choosing functional colors with consistent visual lightness in design systems',
          'Using oklch() in modern projects for more controllable palettes',
        ],
        privacyNote:
          'All color math runs locally in the browser; no data is uploaded.',
        faqs: [
          {
            question: 'What is the difference between OKLCH and HSL?',
            answer:
              'HSL is geometrically uniform but perceptually uneven: hues with the same lightness can look quite different. OKLCH is based on OKLab, so the same L value looks equally bright, making it better for shade scales and design systems.',
          },
        ],
      },
    },
  },
  {
    slug: 'color-harmony',
    name: '色彩调和方案生成器',
    nameEn: 'Color Harmony Generator',
    description:
      '基于色轮理论生成互补、邻近、三色、分裂互补等六种调和方案，一键复制搭配。',
    descriptionEn:
      'Generate six color-wheel harmony schemes including complementary, analogous, triadic, and more, then copy the palette in one click.',
    category: ToolCategoryEnum.DESIGN_COLOR,
    path: '/tools/color-harmony',
    iconName: 'Shuffle',
    tags: ['色彩调和', '色轮', '配色方案', '互补色', '邻近色'],
    tagsEn: ['Color Harmony', 'Color Wheel', 'Palette', 'Complementary', 'Analogous'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '色彩调和方案生成器基于经典色轮理论，输入一个基色即可自动生成互补、邻近、三色、分裂互补、四色与单色六种科学配色方案。',
        coreFeatures: [
          '六种调和规则：覆盖主流色彩理论中的经典搭配',
          '基色自由输入：取色器或 HEX 输入，支持随机基色',
          '条纹与卡片双预览：直观查看颜色搭配关系',
          '一键复制：点击色块复制 HEX，或批量复制全部颜色',
        ],
        howToUse: [
          '选择基色（取色器、HEX 输入或随机生成）',
          '在分段控件中切换调和类型',
          '在预览区查看搭配效果与各色 HEX / HSL 值',
          '点击单个色块复制，或点击「复制全部」',
        ],
        useCases: [
          '为 UI、海报、品牌设计快速寻找配色方向',
          '为已有主色推导辅助色与强调色',
          '学习和理解色轮与色彩调和理论',
        ],
        privacyNote:
          '全部配色计算都在浏览器本地完成，不涉及数据上传。',
        faqs: [
          {
            question: '六种方案分别适合什么场景？',
            answer:
              '互补色对比强烈适合强调；邻近色和谐自然适合大面积配色；三色活泼均衡；分裂互补对比柔和；四色层次丰富；单色系克制统一，适合数据界面与极简风格。',
          },
        ],
      },
      en: {
        whatIsIt:
          'Color Harmony Generator is based on classic color-wheel theory. Given a base color, it automatically produces six scientific schemes: complementary, analogous, triadic, split-complementary, tetradic, and monochromatic.',
        coreFeatures: [
          'Six harmony rules covering the classic combinations in color theory',
          'Flexible base color: picker, HEX input, or random generation',
          'Dual preview: stripes and cards show how colors relate',
          'One-click copy: copy individual swatches or the whole palette',
        ],
        howToUse: [
          'Choose a base color (picker, HEX input, or random)',
          'Switch harmony type in the segmented control',
          'Review the palette and each color’s HEX / HSL values in the preview',
          'Click a single swatch to copy, or click "Copy All"',
        ],
        useCases: [
          'Quickly finding color directions for UI, posters, and branding',
          'Deriving supporting and accent colors from an existing primary color',
          'Learning color-wheel and harmony theory',
        ],
        privacyNote:
          'All palette computation runs locally in the browser with no data upload.',
        faqs: [
          {
            question: 'Which scheme fits which situation?',
            answer:
              'Complementary gives strong contrast for accents; analogous is harmonious for large areas; triadic is lively and balanced; split-complementary offers softer contrast; tetradic is rich and layered; monochromatic is restrained and unified for dashboards and minimal styles.',
          },
        ],
      },
    },
  },
  {
    slug: 'dark-mode-converter',
    name: '深色模式配色转换器',
    nameEn: 'Dark Mode Color Converter',
    description:
      '将浅色语义令牌自动转换为深色模式配色，三种策略可选，输出 :root 与 .dark 变量。',
    descriptionEn:
      'Convert light semantic tokens into dark-mode palettes with three strategies, outputting :root and .dark variables.',
    category: ToolCategoryEnum.DESIGN_COLOR,
    path: '/tools/dark-mode-converter',
    iconName: 'MoonStar',
    tags: ['深色模式', '暗色主题', 'CSS 变量', '语义令牌', '主题切换'],
    tagsEn: ['Dark Mode', 'Dark Theme', 'CSS Variables', 'Semantic Tokens', 'Theming'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '深色模式配色转换器可将一套浅色语义颜色令牌自动映射为深色模式对应值，避免简单反色带来的刺眼与脏色问题，直接产出可用的 CSS 变量。',
        coreFeatures: [
          '三种转换策略：反转明度、柔和降低、保持鲜艳，适配不同风格',
          '语义化对照：背景、前景、边框、主色等令牌浅深并排展示',
          '实时预览：每个令牌均可直接看到浅色与深色效果',
          '标准 CSS 输出：生成 :root 与 .dark 两套变量，直接接入主题切换',
        ],
        howToUse: [
          '在策略分段控件中选择深色转换策略',
          '在对照表中查看并按需微调颜色（可使用取色器）',
          '预览各令牌在浅色与深色下的实际效果',
          '点击「复制 CSS」将变量代码粘贴到项目样式文件',
        ],
        useCases: [
          '为现有网站或应用补齐深色模式主题',
          '设计系统中维护浅 / 深双套语义令牌',
          '快速评估产品在暗色环境下的配色表现',
        ],
        privacyNote:
          '所有颜色转换均在浏览器本地完成，颜色数据不会离开设备。',
        faqs: [
          {
            question: '为什么不直接反色？',
            answer:
              '直接反色会让深色背景过于纯黑、品牌色色相偏移且对比刺眼。本工具在 HSL 空间按策略重新映射明度与饱和度，深色更柔和、层次更自然。',
          },
        ],
      },
      en: {
        whatIsIt:
          'Dark Mode Color Converter automatically maps a set of light semantic color tokens to their dark-mode counterparts. It avoids the harsh and muddy results of naive inversion and produces ready-to-use CSS variables.',
        coreFeatures: [
          'Three strategies: invert lightness, soft reduction, and keep vivid for different styles',
          'Semantic comparison: background, foreground, border, and primary tokens shown side by side',
          'Live preview: see light and dark versions of every token instantly',
          'Standard CSS output: generates :root and .dark variable sets for theme switching',
        ],
        howToUse: [
          'Choose a dark conversion strategy in the segmented control',
          'Review and fine-tune colors in the comparison table (a color picker is available)',
          'Preview how each token looks in light and dark modes',
          'Click "Copy CSS" and paste the variables into your stylesheet',
        ],
        useCases: [
          'Adding a dark theme to an existing website or application',
          'Maintaining light/dark semantic tokens in a design system',
          'Quickly evaluating how a product palette performs in dark environments',
        ],
        privacyNote:
          'All color conversion runs locally in the browser; color data never leaves the device.',
        faqs: [
          {
            question: 'Why not just invert colors?',
            answer:
              'Naive inversion produces pure-black backgrounds, shifted brand hues, and harsh contrast. This tool remaps lightness and saturation in HSL according to a strategy, yielding softer darks and more natural layering.',
          },
        ],
      },
    },
  },
  {
    slug: 'color-mixer',
    name: '混合色调色计算器',
    nameEn: 'Color Mixer',
    description:
      '按比例混合两种颜色，生成等分中间色带，并输出 CSS color-mix() 函数代码。',
    descriptionEn:
      'Mix two colors by ratio, generate an evenly spaced intermediate scale, and output CSS color-mix() code.',
    category: ToolCategoryEnum.DESIGN_COLOR,
    path: '/tools/color-mixer',
    iconName: 'Droplets',
    tags: ['混色', 'color-mix', '调色', '渐变色带', 'CSS Color 5'],
    tagsEn: ['Color Mixing', 'color-mix', 'Palette', 'Color Scale', 'CSS Color 5'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '混合色调色计算器可按任意比例混合两个 HEX 颜色，实时查看混合结果与等分中间色带，并生成现代浏览器支持的 color-mix() 代码。',
        coreFeatures: [
          '任意比例混合：拖动滑杆在 0%–100% 间精确控制',
          '等分中间色：自动生成从颜色 A 到颜色 B 的过渡色带',
          '双通道计算：在 sRGB 空间线性混合，结果稳定可预期',
          '现代 CSS 输出：直接生成 color-mix(in srgb, ...) 函数',
        ],
        howToUse: [
          '分别设置颜色 A 与颜色 B（支持取色器与 HEX 输入）',
          '拖动混合比例滑杆查看混合结果',
          '在等分中间色区域点击色块复制过渡色',
          '复制 color-mix() 代码用于支持该函数的浏览器环境',
        ],
        useCases: [
          '为 hover、禁用等交互状态推导颜色变体',
          '在两种品牌色之间寻找过渡色',
          '为不支持 color-mix() 的环境预算实际混合色值',
        ],
        privacyNote:
          '混色计算完全在浏览器本地进行，不收集任何输入数据。',
        faqs: [
          {
            question: 'color-mix() 的浏览器兼容性如何？',
            answer:
              'color-mix() 已在 Chrome 111+、Safari 16.2+、Firefox 113+ 中支持。对于旧环境，可直接使用工具计算出的混合 HEX 值。',
          },
        ],
      },
      en: {
        whatIsIt:
          'Color Mixer blends two HEX colors at any ratio, showing the result and an evenly spaced intermediate scale live, and generates code for the modern color-mix() function.',
        coreFeatures: [
          'Any-ratio mixing: precise control from 0% to 100% with a slider',
          'Intermediate steps: automatically generate a scale from color A to color B',
          'Dual-channel math: linear mixing in sRGB for stable, predictable results',
          'Modern CSS output: generates color-mix(in srgb, ...) directly',
        ],
        howToUse: [
          'Set color A and color B (picker and HEX input supported)',
          'Drag the mix ratio slider to see the mixed result',
          'Click swatches in the intermediate scale to copy transition colors',
          'Copy the color-mix() code for browsers that support it',
        ],
        useCases: [
          'Deriving color variants for hover and disabled states',
          'Finding transition colors between two brand colors',
          'Precomputing mixed values for environments without color-mix()',
        ],
        privacyNote:
          'Mixing runs entirely in the browser; no input data is collected.',
        faqs: [
          {
            question: 'How good is browser support for color-mix()?',
            answer:
              'color-mix() is supported in Chrome 111+, Safari 16.2+, and Firefox 113+. For older environments, use the mixed HEX values computed by the tool directly.',
          },
        ],
      },
    },
  },
  {
    slug: 'box-shadow-generator',
    name: '阴影生成器',
    nameEn: 'Box Shadow Generator',
    description:
      '可视化叠加多层 box-shadow，调节偏移、模糊、扩散与透明度，实时预览并复制 CSS。',
    descriptionEn:
      'Visually stack multiple box-shadow layers with offset, blur, spread, and opacity controls, then copy the CSS.',
    category: ToolCategoryEnum.DESIGN_COLOR,
    path: '/tools/box-shadow-generator',
    iconName: 'Layers',
    tags: ['阴影', 'box-shadow', 'CSS', '层级', '投影'],
    tagsEn: ['Shadow', 'box-shadow', 'CSS', 'Layers', 'Elevation'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '阴影生成器是一款可视化的 box-shadow 设计工具，支持多层阴影叠加，可精细调节每层的偏移、模糊、扩散、透明度与内阴影，打造真实的层级与投影效果。',
        coreFeatures: [
          '多层叠加：自由添加、删除阴影层，组合出复杂投影',
          '完整参数：水平 / 垂直偏移、模糊、扩散、透明度、inset 全覆盖',
          '实时预览：在卡片上即时呈现阴影效果',
          '预设方案：内置柔和、悬浮、Neumorphism 等常用阴影',
        ],
        howToUse: [
          '点击预设快速起步，或直接在参数面板调节当前阴影层',
          '通过层级切换选择要编辑的阴影，点击「添加阴影层」扩展',
          '在预览区查看卡片的实际投影效果',
          '满意后复制 box-shadow CSS 代码',
        ],
        useCases: [
          '设计卡片、弹窗、按钮的悬浮与点击投影',
          '制作 Neumorphism 新拟态等特殊风格',
          '为设计系统定义统一的 elevation 层级阴影',
        ],
        privacyNote:
          '所有参数调节与代码生成均在浏览器本地完成。',
        faqs: [
          {
            question: '多层阴影的顺序有影响吗？',
            answer:
              '有。box-shadow 列表中先写的阴影渲染在上层，多层叠加时顺序会影响视觉效果，工具按列表顺序生成代码，可通过层级列表调整。',
          },
        ],
      },
      en: {
        whatIsIt:
          'Box Shadow Generator is a visual tool for designing box-shadow effects. It supports stacking multiple shadow layers with fine control over offset, blur, spread, opacity, and inset to create realistic elevation.',
        coreFeatures: [
          'Multi-layer stacking: freely add and remove layers for complex shadows',
          'Complete controls: horizontal/vertical offset, blur, spread, opacity, and inset',
          'Live preview: see the shadow on a card instantly',
          'Presets: soft, hover, neumorphism, and other common shadows built in',
        ],
        howToUse: [
          'Start from a preset or adjust the current shadow layer directly in the panel',
          'Switch between layers to edit, and click "Add Shadow Layer" to expand',
          'Check the actual effect on the card in the preview area',
          'Copy the box-shadow CSS when you are satisfied',
        ],
        useCases: [
          'Designing hover and press shadows for cards, modals, and buttons',
          'Creating special styles such as neumorphism',
          'Defining unified elevation shadows for design systems',
        ],
        privacyNote:
          'All adjustments and code generation happen locally in the browser.',
        faqs: [
          {
            question: 'Does the order of multiple shadows matter?',
            answer:
              'Yes. Shadows listed first render on top, so order affects the look of stacked shadows. The tool generates code in list order, adjustable via the layer list.',
          },
        ],
      },
    },
  },
  {
    slug: 'color-naming-token',
    name: '颜色令牌生成器',
    nameEn: 'Color Naming & Token Generator',
    description:
      '为颜色统一命名并同步生成 CSS、JS、SCSS 三种格式的设计令牌代码。',
    descriptionEn:
      'Name colors consistently and synchronize them into CSS, JS, and SCSS design-token formats.',
    category: ToolCategoryEnum.DESIGN_COLOR,
    path: '/tools/color-naming-token',
    iconName: 'Tags',
    tags: ['设计令牌', '命名', 'CSS 变量', 'SCSS', 'Design Token'],
    tagsEn: ['Design Tokens', 'Naming', 'CSS Variables', 'SCSS', 'Design Token'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '颜色令牌生成器帮助你为一组颜色进行语义化命名，并将同一份颜色数据同步输出为 CSS 变量、JavaScript 对象与 SCSS 变量，保证多端样式令牌一致。',
        coreFeatures: [
          '一处维护：增删改颜色令牌，三种格式同步更新',
          '自动命名规范化：名称自动转换为 kebab-case、camelCase 等格式',
          '三种输出：CSS 自定义属性、JS / TS 对象、SCSS 变量',
          '语义化默认令牌：内置 primary、success、warning 等常用令牌',
        ],
        howToUse: [
          '在令牌列表中修改名称与颜色值，或点击「添加令牌」',
          '名称会按各格式要求自动规范化',
          '在输出区切换 CSS / JS / SCSS 查看代码',
          '点击复制按钮将令牌代码粘贴到项目中',
        ],
        useCases: [
          '构建设计系统的多平台颜色令牌',
          '在 CSS、JS 主题配置与 SCSS 之间保持颜色同步',
          '规范团队内部对颜色的语义化命名',
        ],
        privacyNote:
          '所有令牌数据仅保存在浏览器内存中，不会上传或持久化到服务器。',
        faqs: [
          {
            question: '命名支持哪些格式？',
            answer:
              '输入名称后会自动生成 kebab-case（如 color-primary）、camelCase（colorPrimary）与 SCREAMING_SNAKE_CASE，分别用于 CSS、JS 与常量场景。',
          },
        ],
      },
      en: {
        whatIsIt:
          'Color Naming & Token Generator helps you semantically name a set of colors and synchronize the same data into CSS variables, JavaScript objects, and SCSS variables, keeping tokens consistent across platforms.',
        coreFeatures: [
          'Single source of truth: add, edit, or remove tokens and all formats update together',
          'Automatic normalization: names convert to kebab-case, camelCase, and more',
          'Three outputs: CSS custom properties, JS/TS objects, and SCSS variables',
          'Semantic defaults: primary, success, warning, and other common tokens built in',
        ],
        howToUse: [
          'Edit names and colors in the token list, or click "Add Token"',
          'Names are automatically normalized per output format',
          'Switch between CSS / JS / SCSS in the output area',
          'Click copy to paste the token code into your project',
        ],
        useCases: [
          'Building cross-platform color tokens for design systems',
          'Keeping colors in sync between CSS, JS theme config, and SCSS',
          'Standardizing semantic color naming within a team',
        ],
        privacyNote:
          'All token data stays in browser memory and is never uploaded or persisted on a server.',
        faqs: [
          {
            question: 'Which naming formats are supported?',
            answer:
              'From your input it generates kebab-case (e.g. color-primary), camelCase (colorPrimary), and SCREAMING_SNAKE_CASE for CSS, JS, and constant use respectively.',
          },
        ],
      },
    },
  },
  {
    slug: 'color-blind-simulator',
    name: '色盲模拟器与安全调色板',
    nameEn: 'Color Blind Simulator',
    description:
      '上传图片模拟四种色觉效果，校验调色板可读性，并提供 Okabe-Ito 安全配色。',
    descriptionEn:
      'Upload an image to simulate four color-vision types, verify palette legibility, and get the Okabe-Ito safe palette.',
    category: ToolCategoryEnum.DESIGN_COLOR,
    path: '/tools/color-blind-simulator',
    iconName: 'Eye',
    tags: ['色盲', '无障碍', '可访问性', '安全配色', 'a11y'],
    tagsEn: ['Color Blindness', 'Accessibility', 'A11y', 'Safe Palette', 'WCAG'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '色盲模拟器通过 LMS 色彩空间矩阵，在浏览器本地模拟红色盲、绿色盲、蓝色盲与全色盲四种色觉效果，并可校验任意调色板在色觉差异下是否仍可区分。',
        coreFeatures: [
          '四种色觉模拟：基于科学的 LMS 矩阵转换图片像素',
          '并排对比：正常色觉与模拟效果同屏查看',
          '调色板校验：粘贴 HEX 列表检查颜色是否会混淆',
          '安全配色推荐：内置业界经典的 Okabe-Ito 色盲友好调色板',
        ],
        howToUse: [
          '上传一张本地图片，查看不同色觉条件下的模拟效果',
          '在调色板输入框中粘贴逗号或空格分隔的 HEX 颜色',
          '查看每对颜色的 PASS / RISK 安全状态',
          '从安全配色区复制 Okabe-Ito 推荐颜色',
        ],
        useCases: [
          '检查数据图表中仅靠颜色区分的系列是否可读',
          '优化状态色（成功 / 警告 / 错误）的可访问性',
          '设计在色觉差异人群中依然清晰的界面与信息图',
        ],
        privacyNote:
          '图片与调色板数据均在浏览器本地处理，绝不会上传服务器。',
        faqs: [
          {
            question: '模拟结果可以代替真实用户测试吗？',
            answer:
              '模拟算法基于色觉缺陷的数学模型，可用于设计阶段的快速自查，但不能完全替代真实用户测试。重要产品建议结合图标、文字标签等冗余编码，并邀请相关用户参与验证。',
          },
        ],
      },
      en: {
        whatIsIt:
          'Color Blind Simulator uses LMS color-space matrices to simulate protanopia, deuteranopia, tritanopia, and achromatopsia locally in the browser, and checks whether any palette stays distinguishable across color-vision differences.',
        coreFeatures: [
          'Four vision simulations: scientifically based LMS matrices transform image pixels',
          'Side-by-side comparison: normal vision and simulations on one screen',
          'Palette checking: paste HEX values to see whether colors collapse together',
          'Safe palette recommendation: the classic Okabe-Ito color-blind-friendly set built in',
        ],
        howToUse: [
          'Upload a local image to see simulations under different vision types',
          'Paste comma- or space-separated HEX colors into the palette input',
          'Review the PASS / RISK status for each color pair',
          'Copy recommended colors from the Okabe-Ito safe palette',
        ],
        useCases: [
          'Checking whether chart series distinguished only by color remain readable',
          'Improving accessibility of status colors (success / warning / error)',
          'Designing interfaces and infographics that stay clear for color-vision-deficient users',
        ],
        privacyNote:
          'Images and palette data are processed locally in the browser and never uploaded.',
        faqs: [
          {
            question: 'Can simulation replace testing with real users?',
            answer:
              'The simulation is a mathematical model useful for quick self-checks during design, but it cannot fully replace real-user testing. For important products, add redundant encoding such as icons and text labels and involve affected users in validation.',
          },
        ],
      },
    },
  },
  {
    slug: 'css-filter-generator',
    name: 'CSS 滤镜与毛玻璃生成器',
    nameEn: 'CSS Filter & Glassmorphism Generator',
    description:
      '可视化调节图片 filter 滤镜或毛玻璃卡片参数，实时预览并输出 filter / backdrop-filter 代码。',
    descriptionEn:
      'Visually tune image filter or glassmorphism card parameters, preview live, and copy filter / backdrop-filter CSS.',
    category: ToolCategoryEnum.DESIGN_COLOR,
    path: '/tools/css-filter-generator',
    iconName: 'Sparkles',
    tags: ['滤镜', '毛玻璃', 'backdrop-filter', 'Glassmorphism', 'filter'],
    tagsEn: ['Filter', 'Frosted Glass', 'backdrop-filter', 'Glassmorphism', 'CSS'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          'CSS 滤镜与毛玻璃生成器是一款双模式可视化工具：既可调节 blur、亮度、对比度等图片滤镜，也可设计背景透明、模糊、高光边框的毛玻璃（Glassmorphism）卡片，并直接生成可用 CSS。',
        coreFeatures: [
          '双模式切换：图片滤镜与毛玻璃卡片一站式设计',
          '八项滤镜参数：模糊、亮度、对比度、饱和度、灰度、褐色、反相、色相旋转',
          '真实毛玻璃效果：透明度、模糊、饱和度、圆角与半透明边框实时渲染',
          '内置预设与图片上传：快速起步，图片仅在本地处理',
        ],
        howToUse: [
          '在顶部切换「图片滤镜」或「毛玻璃」模式',
          '滤镜模式下可上传本地图片并应用预设或手动调节滑杆',
          '毛玻璃模式下调节透明度、模糊、圆角与边框参数',
          '在底部复制 filter 或 backdrop-filter CSS 代码',
        ],
        useCases: [
          '制作弹窗、导航栏、卡片的毛玻璃效果',
          '为网页图片快速添加风格化滤镜',
          '学习与试验现代 CSS 视觉效果',
        ],
        privacyNote:
          '上传的图片通过 FileReader 在浏览器本地读取，不会上传至任何服务器。',
        faqs: [
          {
            question: '毛玻璃效果需要注意什么？',
            answer:
              'backdrop-filter 作用于元素背后的内容，因此元素背景需保留一定透明度才能看到模糊效果；同时建议添加 -webkit-backdrop-filter 以兼容 Safari，工具生成的代码已包含该前缀。',
          },
        ],
      },
      en: {
        whatIsIt:
          'CSS Filter & Glassmorphism Generator is a dual-mode visual tool: tune image filters such as blur, brightness, and contrast, or design frosted-glass cards with translucent backgrounds, blur, and highlight borders, and generate ready-to-use CSS.',
        coreFeatures: [
          'Dual modes: image filter and frosted-glass card design in one tool',
          'Eight filter parameters: blur, brightness, contrast, saturate, grayscale, sepia, invert, and hue-rotate',
          'Realistic glassmorphism: opacity, blur, saturate, radius, and translucent border rendered live',
          'Built-in presets and image upload: quick start, images processed locally only',
        ],
        howToUse: [
          'Switch between "Image Filter" and "Frosted Glass" modes at the top',
          'In filter mode, upload a local image and apply presets or drag the sliders manually',
          'In glass mode, adjust opacity, blur, radius, and border parameters',
          'Copy the filter or backdrop-filter CSS at the bottom',
        ],
        useCases: [
          'Creating glassmorphism effects for modals, navigation bars, and cards',
          'Quickly adding stylized filters to web images',
          'Experimenting with modern CSS visual effects',
        ],
        privacyNote:
          'Uploaded images are read locally via FileReader in the browser and are never uploaded to any server.',
        faqs: [
          {
            question: 'What should I note for frosted-glass effects?',
            answer:
              'backdrop-filter applies to content behind the element, so the element background must keep some transparency to see the blur. It is also advisable to include -webkit-backdrop-filter for Safari, which the generated code already contains.',
          },
        ],
      },
    },
  },
  {
    slug: 'strong-password-generator',
    name: '强密码生成器',
    nameEn: 'Strong Password Generator',
    description:
      '生成自定义长度、包含大小写、数字、特殊符号的高强度随机密码。',
    descriptionEn:
      'Generate strong random passwords with customizable length, mixed case, numbers, and symbols.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/strong-password-generator',
    iconName: 'Key',
    tags: ['密码', '随机', '安全', '生成', '强度'],
    tagsEn: ['Password', 'Random', 'Security', 'Generator', 'Strength'],
    isPopular: true,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '基于浏览器原生 Crypto API 的安全随机密码生成器，帮你快速创建符合安全要求的高强度密码。',
        coreFeatures: [
          '自定义密码长度 4~64 位',
          '可选择包含小写、大写、数字、特殊符号',
          '强制至少包含一个选中类型的字符，避免生成不满足要求的密码',
          '纯浏览器本地生成，密码绝不离开设备',
          '一键复制生成结果',
        ],
        howToUse: [
          '拖动滑块调整密码长度',
          '勾选想要包含的字符类型（至少勾选一个）',
          '点击「重新生成」按钮获取新密码',
          '点击「复制」按钮复制生成的密码',
        ],
        useCases: [
          '注册网站/APP 账号时生成安全密码',
          '重置密码时创建新的高强度密码',
          '为不同网站生成唯一密码',
        ],
        privacyNote:
          '所有生成过程都在浏览器本地完成，使用原生加密安全随机数生成器，绝不记录生成的密码。',
        faqs: [
          {
            question: '为什么这个生成器比普通的更安全？',
            answer:
              '本工具使用浏览器原生 `crypto.getRandomValues` API 生成随机数，相比 `Math.random()` 提供更高熵值，更难被破解。',
          },
          {
            question: '可以生成多长的密码？',
            answer: '支持 4 到 64 位长度的密码，满足绝大多数场景对密码长度的要求。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A secure random password generator based on the browser native Crypto API that helps you quickly create high-strength passwords that meet security requirements.',
        coreFeatures: [
          'Customizable password length from 4 to 64 characters',
          'Toggle inclusion of lowercase, uppercase, numbers, and special symbols',
          'Ensures at least one character from each selected type to avoid invalid passwords',
          '100% browser-local generation, passwords never leave your device',
          'One-click copy to clipboard',
        ],
        howToUse: [
          'Drag the slider to adjust password length',
          'Check the character types you want to include (at least one)',
          'Click "Regenerate" to get a new password',
          'Click "Copy" to copy the generated password',
        ],
        useCases: [
          'Generating secure passwords when registering website/app accounts',
          'Creating new high-strength passwords when resetting passwords',
          'Generating unique passwords for different websites',
        ],
        privacyNote:
          'All generation is done locally in your browser using the native cryptographically secure random number generator. Generated passwords are never logged.',
        faqs: [
          {
            question: 'Why is this generator more secure than others?',
            answer:
              'This tool uses the browser native `crypto.getRandomValues` API to generate random numbers, which provides higher entropy than `Math.random()` and is much harder to crack.',
          },
          {
            question: 'What is the maximum password length supported?',
            answer: 'Supports passwords from 4 to 64 characters long, meeting the requirements of most scenarios.',
          },
        ],
      },
    },
  },
  {
    slug: 'password-strength-checker',
    name: '密码强度检测器',
    nameEn: 'Password Strength Checker',
    description:
      '检测密码强度，根据长度、字符多样性给出安全性评分和改进建议。',
    descriptionEn:
      'Check password security strength and give improvement suggestions based on length and character diversity.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/password-strength-checker',
    iconName: 'ShieldCheck',
    tags: ['密码', '安全', '检测', '评分', '强度'],
    tagsEn: ['Password', 'Security', 'Check', 'Score', 'Strength'],
    isPopular: true,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '帮助你评估密码安全性的工具，根据密码长度、字符多样性给出分数和强度等级，并提供具体的改进建议。',
        coreFeatures: [
          '即时分析：输入密码实时显示强度评分和等级',
          '多维度评估：检查长度、小写、大写、数字、特殊符号',
          '识别常见缺陷：连续字符、重复字符、全同字符等弱密码模式',
          '给出明确改进建议：告诉你具体需要增加什么',
          '纯本地运算：密码绝不离开你的浏览器',
        ],
        howToUse: [
          '在输入框中输入你想要检查的密码',
          '下方会自动显示强度评分和强度条',
          '如果有改进建议，会列出具体需要优化的点',
          '强度达到「强」且无改进建议就是安全密码',
        ],
        useCases: [
          '设置新密码时检查强度是否达标',
          '评估现有密码安全性，决定是否需要更换',
          '学习什么样的密码更安全',
        ],
        privacyNote:
          '所有分析都在浏览器本地完成，密码不会被记录或上传到任何服务器，隐私完全保障。',
        faqs: [
          {
            question: '分数是怎么计算的？',
            answer:
              '满分 6 分：长度达标得 2 分，包含小写、大写、数字、特殊符号各得 1 分，弱密码模式会扣分。0-2 分为弱，3-4 分为中，5-6 分为强。',
          },
          {
            question: '多少分算安全密码？',
            answer:
              '一般网站至少需要中强度（分数≥3），敏感账号（如邮箱、支付）建议使用高强度（分数≥5）。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A tool to help you evaluate password security, gives a score and strength rating based on password length and character diversity, and provides specific improvement suggestions.',
        coreFeatures: [
          'Instant analysis: displays strength score and rating in real-time as you type',
          'Multi-dimensional assessment: checks length, lowercase, uppercase, numbers, and special symbols',
          'Detects common weaknesses: sequential characters, repeated characters, all identical characters and other weak patterns',
          'Provides clear improvement suggestions: tells you exactly what needs to be added',
          '100% local processing: password never leaves your browser',
        ],
        howToUse: [
          'Enter the password you want to check in the input box',
          'The strength score and bar will automatically display below',
          'If there are suggestions for improvement, it will list what specifically needs to be optimized',
          'A password that reaches "Strong" with no suggestions is a secure password',
        ],
        useCases: [
          'Check if your new password meets strength requirements',
          'Evaluate the security of existing passwords and decide if you need to change it',
          'Learn what makes a password more secure',
        ],
        privacyNote:
          'All analysis is done locally in your browser. Passwords are never logged or uploaded to any server, so your privacy is fully protected.',
        faqs: [
          {
            question: 'How is the score calculated?',
            answer:
              'Maximum score is 6 points: 2 points for sufficient length, 1 point each for including lowercase, uppercase, numbers, and special symbols. Weak patterns will deduct points. 0-2 points = Weak, 3-4 points = Medium, 5-6 points = Strong.',
          },
          {
            question: 'What score is considered a secure password?',
            answer:
              'Most regular websites require at least medium strength (score ≥3). Sensitive accounts like email or banking should use strong strength (score ≥5).',
          },
        ],
      },
    },
  },
  {
    slug: 'jwt-parser',
    name: 'JWT 解析器',
    nameEn: 'JWT Parser & Viewer',
    description:
      '解析并查看 JSON Web Token 的 Header、Payload，支持 HS256 签名验证。',
    descriptionEn:
      'Parse and view JSON Web Token Header and Payload, with HS256 signature verification.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/jwt-parser',
    iconName: 'Key',
    tags: ['JWT', 'JSON', 'Web', 'Token', '解析', '签名'],
    tagsEn: ['JWT', 'JSON', 'Web', 'Token', 'Parser', 'Signature'],
    isPopular: true,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
    doc: {
      zh: {
        whatIsIt:
          '开发调试常用的 JWT 解析工具，可以即时解析 JSON Web Token，清晰展示 Header 和 Payload 内容，并支持使用密钥验证 HS256 签名。',
        coreFeatures: [
          '即时解析：粘贴 Token 后立即解析，格式化展示 JSON',
          '分别展示 Header 和 Payload，一目了然',
          '支持 HS256 算法签名验证，检查 Token 是否被篡改',
          '纯浏览器本地处理，Token 不上传服务器',
        ],
        howToUse: [
          '在上方文本框中粘贴 JWT token',
          '下方会自动解析并展示 Header 和 Payload 的格式化 JSON',
          '如果需要验证签名，在签名验证区域输入密钥，点击验证按钮',
          '结果会告诉你签名是否通过',
        ],
        useCases: [
          '开发调试 API 认证时查看 JWT 内容',
          '验证 JWT 签名是否正确',
          '学习 JWT 结构组成',
        ],
        privacyNote:
          '所有解析和验证都在浏览器本地完成，你的 JWT 不会发送到任何服务器，保障密钥和 token 的隐私安全。',
        faqs: [
          {
            question: '支持哪些算法？',
            answer: '目前仅支持解析任意 JWT，并验证 HS256 (HMAC-SHA256) 算法生成的签名，其他算法签名验证将在后续版本支持。',
          },
          {
            question: '为什么需要验证签名？',
            answer: '验证签名可以确认 JWT 内容没有被篡改，并且确认签发方持有正确的密钥，帮助你判断 JWT 是否可信。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A commonly used JWT parsing tool for development debugging that instantly parses JSON Web Tokens, clearly displays Header and Payload content, and supports HS256 signature verification with a secret.',
        coreFeatures: [
          'Instant parsing: parses token immediately after pasting, displays formatted JSON',
          'Separately displays Header and Payload for easy inspection',
          'Supports HS256 algorithm signature verification to check if token has been tampered with',
          '100% browser-local processing, tokens never uploaded to any server',
        ],
        howToUse: [
          'Paste your JWT token in the text box above',
          'The formatted JSON for Header and Payload will be automatically displayed below',
          'To verify the signature, enter your secret in the signature verification section and click the verify button',
          'The result will tell you if the signature is valid',
        ],
        useCases: [
          'View JWT content during API authentication development and debugging',
          'Verify that JWT signature is correct',
          'Learn about JWT structure',
        ],
        privacyNote:
          'All parsing and verification is done locally in your browser. Your JWT and secret are never sent to any server, keeping your privacy protected.',
        faqs: [
          {
            question: 'What algorithms are supported?',
            answer: 'Currently supports parsing any JWT and verifying signatures generated by the HS256 (HMAC-SHA256) algorithm. Signature verification for other algorithms will be supported in future versions.',
          },
          {
            question: 'Why verify the signature?',
            answer: 'Signature verification confirms that the JWT content has not been tampered with and confirms that the issuer holds the correct secret, helping you determine if the JWT is trustworthy.',
          },
        ],
      },
    },
  },
  {
    slug: 'crc32-checksum',
    name: 'CRC32 校验和',
    nameEn: 'CRC32 Checksum Calculator',
    description:
      '计算文本字符串的 CRC32 校验值，用于数据完整性验证。',
    descriptionEn:
      'Calculate CRC32 checksum for text strings, used for data integrity verification.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/crc32-checksum',
    iconName: 'Fingerprint',
    tags: ['CRC32', '校验', '哈希', '完整性'],
    tagsEn: ['CRC32', 'Checksum', 'Hash', 'Integrity'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'The quick brown fox jumps over the lazy dog',
    doc: {
      zh: {
        whatIsIt:
          '纯浏览器本地的 CRC32 校验和计算器，快速计算文本字符串的 32 位循环冗余校验值，输出十六进制结果。',
        coreFeatures: [
          '实时计算：输入文本变化即时更新结果',
          '支持任意长度文本，大文本计算也流畅',
          '一键复制十六进制结果',
          '纯本地运算，数据不离开设备',
        ],
        howToUse: [
          '在输入框中粘贴或输入需要计算的文本',
          '下方会自动显示计算得到的 CRC32 校验和',
          '点击复制按钮获取结果',
        ],
        useCases: [
          '验证文件/数据下载后的完整性',
          '快速比对两段文本是否完全一致',
          '为数据生成简短的指纹摘要',
        ],
        privacyNote:
          '所有计算都在浏览器本地完成，输入数据绝不会上传到任何服务器，保障数据隐私。',
        faqs: [
          {
            question: 'CRC32 有什么用途？',
            answer: 'CRC32 主要用于数据完整性校验，下载文件后可以比对计算出的 CRC32 值和网站提供的值是否一致，确认文件在传输过程中没有损坏或被篡改。',
          },
          {
            question: '结果输出格式是什么？',
            answer: '输出小写十六进制格式，总是补齐 8 位字符，方便直接复制使用。',
          },
        ],
      },
      en: {
        whatIsIt:
          '100% browser-local CRC32 checksum calculator, quickly calculates 32-bit cyclic redundancy check value for text strings, outputs hexadecimal result.',
        coreFeatures: [
          'Real-time calculation: result updates instantly as you type',
          'Supports any length of text, even large text calculates smoothly',
          'One-click copy of hexadecimal result',
          '100% local processing, data never leaves your device',
        ],
        howToUse: [
          'Paste or enter the text you want to calculate in the input box',
          'The calculated CRC32 checksum will automatically appear below',
          'Click the copy button to get the result',
        ],
        useCases: [
          'Verify integrity after downloading files/data',
          'Quickly compare if two texts are exactly the same',
          'Generate a short fingerprint digest for data',
        ],
        privacyNote:
          'All calculations are done locally in your browser. Input data is never uploaded to any server, keeping your data private.',
        faqs: [
          {
            question: 'What is CRC32 used for?',
            answer: 'CRC32 is mainly used for data integrity verification. After downloading a file, you can compare the calculated CRC32 value with the value provided by the website to confirm that the file has not been corrupted or tampered with during transmission.',
          },
          {
            question: 'What is the output format?',
            answer: 'Outputs lowercase hexadecimal format, always padded to 8 characters for easy copying and use.',
          },
        ],
      },
    },
  },
];

/**
 * 根据工具短标识查找对应的工具元数据
 *
 * @param slug - 工具的唯一短标识
 * @returns 匹配的工具元数据；不存在时返回 undefined
 */
export function getToolBySlug(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}

/**
 * 获取指定分类下的全部工具
 *
 * @param category - 工具分类
 * @returns 属于该分类的工具元数据集合
 */
export function getToolsByCategory(category: ToolMeta['category']) {
  return tools.filter((tool) => tool.category === category);
}

/**
 * 获取与指定工具相关的推荐工具，优先同分类，其次热门工具
 *
 * @param slug - 当前工具的唯一短标识
 * @param limit - 返回的推荐工具数量上限
 * @returns 相关工具元数据集合
 */
export function getRelatedTools(slug: string, limit = 3) {
  const current = getToolBySlug(slug);
  if (!current) {
    return [];
  }

  const sameCategory = tools.filter(
    (tool) => tool.slug !== slug && tool.category === current.category,
  );
  const others = tools.filter(
    (tool) =>
      tool.slug !== slug &&
      tool.category !== current.category &&
      tool.isPopular,
  );

  return [...sameCategory, ...others].slice(0, limit);
}
