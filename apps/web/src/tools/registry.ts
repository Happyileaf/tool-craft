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
