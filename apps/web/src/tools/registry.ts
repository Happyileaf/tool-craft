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
    slug: 'json-to-yaml',
    name: 'JSON 转 YAML',
    nameEn: 'JSON to YAML Converter',
    description:
      '将 JSON 格式数据转换为格式化的 YAML 数据，补齐 YAML 转 JSON 的反向转换能力。',
    descriptionEn:
      'Convert JSON data into formatted YAML, completing the reverse of the YAML to JSON conversion.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/json-to-yaml',
    iconName: 'Code',
    tags: ['JSON', 'YAML', '转换', '开发'],
    tagsEn: ['JSON', 'YAML', 'Convert', 'Dev'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: `{
  "name": "ToolCraft",
  "version": "2.4.0",
  "offlineReady": true,
  "modules": ["Formatter", "Encoder", "Diff"]
}`,
    doc: {
      zh: {
        whatIsIt:
          '便捷的 JSON 到 YAML 格式转换器，无需上传服务器，实时把 JSON 数据转换为等效的 YAML 文本，与站点现有的「YAML 转 JSON」工具形成双向互转闭环。',
        coreFeatures: [
          '实时转换：输入 JSON 后即刻生成缩进规整的 YAML',
          '类型安全：会被 YAML 误判为数字/布尔/null 的字符串自动加引号，保证类型不丢失',
          '错误提示：JSON 语法错误时清晰展示错误原因，不产出错误结果',
          '纯本地运行：所有转换在浏览器中完成，数据不离开设备',
        ],
        howToUse: [
          '在左侧输入框粘贴或输入需要转换的 JSON 内容',
          '右侧会自动显示转换后的 YAML 结果',
          '可按需切换缩进宽度（2 空格 / 4 空格）或重新载入示例',
          '点击右上角复制按钮获取转换结果',
        ],
        useCases: [
          '开发中把 JSON 接口数据整理为 YAML 配置',
          'Kubernetes / CI 配置编写时由 JSON 快速转成 YAML',
          '核对 JSON 与 YAML 两种表示是否等价',
        ],
        privacyNote:
          '所有转换运算都在本地浏览器完成，数据不会上传到任何服务器，保护隐私安全。',
        faqs: [
          {
            question: '为什么有些字符串会自动加上双引号？',
            answer:
              '当字符串看起来像数字、布尔值或 null，或含有会破坏 YAML 结构的特殊字符时，YAML 会把它误解析为其他类型，因此工具会自动加双引号以保持原始字符串类型。',
          },
          {
            question: '支持嵌套对象与数组吗？',
            answer:
              '支持。对象、数组、字符串、数字、布尔与 null 的任意嵌套都会被正确转换，并保持层级缩进。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A convenient JSON to YAML converter that runs entirely in your browser, turning JSON data into equivalent YAML text in real-time and completing the round trip with the existing YAML to JSON tool.',
        coreFeatures: [
          'Real-time conversion: get well-indented YAML instantly as you type JSON',
          'Type safe: strings that look like numbers, booleans, or null are quoted automatically so their type is preserved',
          'Error reporting: invalid JSON shows a clear reason without emitting a wrong result',
          '100% local: all conversion happens in-browser, data never leaves your device',
        ],
        howToUse: [
          'Paste or type the JSON you want to convert into the left input box',
          'The converted YAML appears automatically on the right',
          'Switch the indent width (2 or 4 spaces) or reload the sample as needed',
          'Click the copy button in the top right to grab the result',
        ],
        useCases: [
          'Turning JSON API payloads into YAML config while developing',
          'Quickly deriving YAML from JSON for Kubernetes or CI configuration',
          'Checking that a JSON and a YAML representation are equivalent',
        ],
        privacyNote:
          'All conversion is done locally in your browser. Data is never uploaded to any server, keeping your data private.',
        faqs: [
          {
            question: 'Why are some strings wrapped in double quotes?',
            answer:
              'When a string looks like a number, boolean, or null, or contains special characters that would break YAML structure, the tool adds double quotes so the original string type is preserved.',
          },
          {
            question: 'Does it support nested objects and arrays?',
            answer:
              'Yes. Any nesting of objects, arrays, strings, numbers, booleans, and null is converted correctly with proper indentation.',
          },
        ],
      },
    },
  },
  {
    slug: 'csv-json-converter',
    name: 'CSV 与 JSON 双向转换',
    nameEn: 'CSV to JSON / JSON to CSV Converter',
    description:
      '在 CSV 与 JSON 之间双向转换，支持自定义分隔符与表头开关，完整处理引号与换行转义。',
    descriptionEn:
      'Convert between CSV and JSON in both directions with custom delimiters, header toggle, and full quote/escape handling.',
    category: ToolCategoryEnum.DATA_JSON,
    path: '/tools/csv-json-converter',
    iconName: 'FileText',
    tags: ['CSV', 'JSON', '转换', '表格', '数据'],
    tagsEn: ['CSV', 'JSON', 'Convert', 'Table', 'Data'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: `name,age,city
"Smith, John",30,New York
Jane,25,London`,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的 CSV 与 JSON 双向转换器，可在不上传数据的前提下，把表格数据与 JSON 对象数组相互转换，并完整处理引号、分隔符与换行等转义场景。',
        coreFeatures: [
          '双向转换：支持 CSV → JSON 与 JSON → CSV 两个方向',
          'RFC 4180 兼容：正确处理引号包裹字段内的分隔符、换行与双引号',
          '灵活选项：可切换逗号 / 制表符 / 分号分隔符，并控制首行是否作为表头',
          '纯本地运行：所有解析与生成均在浏览器完成，数据不离开设备',
        ],
        howToUse: [
          '在顶部选择转换方向（CSV → JSON 或 JSON → CSV）',
          '按需选择字段分隔符，CSV → JSON 时可关闭「首行作为表头」',
          '在左侧输入原始文本，右侧会自动显示转换结果',
          '出现错误时会展示具体原因，成功后可点击复制按钮取用结果',
        ],
        useCases: [
          '把导出的 CSV 报表转换为 JSON 供程序处理',
          '把接口返回的 JSON 数组整理为可直接导入表格软件的 CSV',
          '核对两种格式互转后的数据是否一致',
        ],
        privacyNote:
          '所有解析与生成均在浏览器本地完成，数据不会上传到任何服务器，保护隐私安全。',
        faqs: [
          {
            question: '字段里包含逗号或换行会出错吗？',
            answer:
              '不会。工具遵循 RFC 4180 规则，会自动识别并处理引号包裹字段内的分隔符、换行与双引号转义。',
          },
          {
            question: 'JSON 转 CSV 时表头是怎么确定的？',
            answer:
              '工具会按对象键出现顺序取并集作为表头；某个对象缺少的键会填入空值。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-based CSV ↔ JSON converter that turns tabular data and JSON object arrays into each other without uploading anything, correctly handling quotes, delimiters, and newlines.',
        coreFeatures: [
          'Bidirectional: convert CSV → JSON and JSON → CSV',
          'RFC 4180 compliant: correctly handles delimiters, newlines, and escaped quotes inside quoted fields',
          'Flexible options: switch between comma, tab, and semicolon delimiters, and toggle the header row',
          '100% local: all parsing and generation happen in-browser, data never leaves your device',
        ],
        howToUse: [
          'Choose the conversion direction (CSV → JSON or JSON → CSV) at the top',
          'Pick a field delimiter, and turn off "first row as header" when needed',
          'Type or paste your source text on the left; the result appears on the right',
          'Errors are shown with a concrete reason; copy the result once successful',
        ],
        useCases: [
          'Turning exported CSV reports into JSON for programmatic use',
          'Turning a JSON array from an API into CSV ready for spreadsheet import',
          'Verifying that data stays consistent when converted between the two formats',
        ],
        privacyNote:
          'All parsing and generation happen locally in your browser. Data is never uploaded to any server, keeping your data private.',
        faqs: [
          {
            question: 'Will commas or newlines inside fields break the output?',
            answer:
              'No. The tool follows RFC 4180, recognizing and handling delimiters, newlines, and escaped quotes inside quoted fields.',
          },
          {
            question: 'How is the header row determined for JSON → CSV?',
            answer:
              'The tool takes the union of object keys in order of appearance as the header; any missing key in a record becomes an empty cell.',
          },
        ],
      },
    },
  },
  {
    slug: 'cron-parser',
    name: 'CRON 表达式解析器',
    nameEn: 'CRON Expression Parser',
    description:
      '解析与校验标准 5 段 CRON 表达式，逐字段展示解析结果与人类可读说明，并预览未来执行时间。',
    descriptionEn:
      'Parse and validate standard 5-field CRON expressions, inspect each field in plain language, and preview upcoming run times.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/cron-parser',
    iconName: 'Clock',
    tags: ['CRON', '表达式', '定时任务', '调度', '解析'],
    tagsEn: ['CRON', 'Expression', 'Scheduler', 'Cron Job', 'Parser'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '*/15 9-17 * * MON-FRI',
    doc: {
      zh: {
        whatIsIt:
          'CRON 表达式解析器是一款纯浏览器本地运算的工具，帮助你在不上传任何数据的前提下解析、校验标准 5 段 CRON 表达式，并直观预览未来的执行时间。',
        coreFeatures: [
          '逐字段解析：展示分、时、日、月、周五个字段的原始写法、展开取值与人类可读说明',
          '完整语法支持：兼容 `*`、`,`（列表）、`-`（范围）、`/`（步长）以及月份、星期英文缩写',
          '精确报错：字段数量、取值越界、步长为 0 等问题均给出具体错误定位',
          '执行时间预览：按浏览器本地时区推算接下来的执行时刻，并设有搜索上限避免死循环',
        ],
        howToUse: [
          '在输入框中输入或粘贴 CRON 表达式，例如 `*/15 9-17 * * MON-FRI`',
          '左侧「解析结果」面板会实时展示各字段的解析区间与说明，非法表达式会给出错误提示',
          '右侧「执行时间预览」面板按本地时区列出后续执行时间，可切换预览条数',
          '点击顶部示例按钮可快速载入常用表达式，「清空」可重置输入',
        ],
        useCases: [
          '编写或审查服务器定时任务（crontab）时快速核对表达式',
          '确认表达式是否按预期在每周一至周五的指定时段触发',
          '向团队解释一条复杂 CRON 表达式的实际含义',
        ],
        privacyNote:
          '所有解析与时间推算均在浏览器本地完成，表达式内容不会上传到任何服务器，也不发起任何网络请求。',
        faqs: [
          {
            question: '支持 6 段（含秒）或 7 段（含年份）的 CRON 吗？',
            answer:
              '本工具聚焦标准 5 段写法（分 时 日 月 周）。输入字段数量不为 5 时会给出明确提示，请先裁剪为 5 段。',
          },
          {
            question: '执行时间按哪个时区计算？',
            answer:
              '按浏览器所在设备的本地时区计算，与服务器 crontab 的时区可能不同，跨时区使用时请留意时差。',
          },
        ],
      },
      en: {
        whatIsIt:
          'CRON Expression Parser is a fully browser-based utility that helps you parse and validate standard 5-field CRON expressions and preview upcoming run times without uploading any data.',
        coreFeatures: [
          'Field-by-field parsing: see the raw text, expanded values, and plain-language description for minute, hour, day, month, and weekday',
          'Full syntax support: `*`, lists (`,`), ranges (`-`), steps (`/`), plus month and weekday name aliases',
          'Precise errors: wrong field count, out-of-range values, and zero steps are all reported with a concrete message',
          'Run-time preview: computes upcoming runs in your local timezone with a search cap that prevents infinite loops',
        ],
        howToUse: [
          'Type or paste a CRON expression such as `*/15 9-17 * * MON-FRI`',
          'The "Parse result" panel shows each field\u2019s range and description in real time, and flags invalid expressions',
          'The "Upcoming runs" panel lists the next run times in your local timezone; you can change how many to preview',
          'Click the sample buttons to load common expressions, or "Clear" to reset the input',
        ],
        useCases: [
          'Double-checking a crontab expression before deploying',
          'Confirming an expression triggers only during weekday business hours as intended',
          'Explaining what a complex CRON expression actually means to your team',
        ],
        privacyNote:
          'All parsing and time computation run locally in your browser. Your expression is never uploaded and no network request is made.',
        faqs: [
          {
            question: 'Does it support 6-field (with seconds) or 7-field CRON?',
            answer:
              'This tool focuses on the standard 5-field form (minute hour day month weekday). Any other field count is reported with a clear message.',
          },
          {
            question: 'Which timezone are the run times in?',
            answer:
              'The local timezone of your device. This may differ from a server\u2019s crontab timezone, so mind the offset when working across regions.',
          },
        ],
      },
    },
  },
  {
    slug: 'html-entity-codec',
    name: 'HTML 实体编解码',
    nameEn: 'HTML Entity Encoder / Decoder',
    description:
      '在文本与 HTML 实体之间双向转换，覆盖命名实体与十进制、十六进制数字实体，可选编码非 ASCII 字符。',
    descriptionEn:
      'Convert between plain text and HTML entities in both directions, covering named and numeric entities with an optional non-ASCII mode.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/html-entity-codec',
    iconName: 'Code',
    tags: ['HTML', '实体', '编解码', '转义', 'Escape'],
    tagsEn: ['HTML', 'Entity', 'Encode', 'Decode', 'Escape'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '© 2026 <ToolCraft> — "fast & offline"',
    doc: {
      zh: {
        whatIsIt:
          'HTML 实体编解码是一款纯浏览器本地运算的工具，可在不上传数据的前提下，把文本中的敏感字符转义为 HTML 实体，或把 HTML 实体还原为原始字符。',
        coreFeatures: [
          '双向转换：支持「文本 → HTML 实体」编码与「HTML 实体 → 文本」解码',
          '覆盖常见实体：`&` `<` `>` `"` 与单引号分别转义为 `&amp;` `&lt;` `&gt;` `&quot;` `&#39;`，并避免 `&` 二次转义',
          '数字实体解码：十进制 `&#123;` 与十六进制 `&#x1F600;`（含 emoji）均可还原为字符',
          '可选编码非 ASCII：开启后 Unicode 字符命中命名实体表则用命名实体，否则用十进制数字实体',
        ],
        howToUse: [
          '在顶部选择「编码」或「解码」方向',
          '编码模式下可开启「编码非 ASCII 字符」，决定是否把中文、符号等转成实体',
          '在左侧输入原始文本或含实体的文本，右侧会实时显示转换结果',
          '点击「复制结果」取用输出，或「载入示例 / 清空」重置输入',
        ],
        useCases: [
          '把用户输入内容转义后再嵌入 HTML 模板，避免 XSS 与结构破坏',
          '排查网页源码里 `&amp;`、`&#x1F600;` 等实体的真实含义',
          '在富文本、邮件模板与纯文本之间安全互转内容',
        ],
        privacyNote:
          '所有编码与解码均在浏览器本地完成，输入内容不会上传到任何服务器，也不发起任何网络请求。',
        faqs: [
          {
            question: '为什么输出的 `&` 没有被再次转义？',
            answer:
              '工具对文本逐字符单次处理，`&` 只在遇到原文时才转为 `&amp;`，不会对已生成的实体二次转义。',
          },
          {
            question: '遇到未知实体或非法数字实体会怎样？',
            answer:
              '未知命名实体与非法数字实体（如 `&#xZZ;`、超出 Unicode 范围的码点）会保留原文，不会报错或丢字符。',
          },
        ],
      },
      en: {
        whatIsIt:
          'HTML Entity Encoder / Decoder is a fully browser-based utility that escapes sensitive characters into HTML entities or restores entities back to plain characters without uploading any data.',
        coreFeatures: [
          'Two-way conversion: encode plain text into HTML entities, or decode entities back into text',
          'Common coverage: escapes `&`, `<`, `>`, `"`, and the apostrophe into `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` without double-escaping `&`',
          'Numeric decoding: restores decimal `&#123;` and hexadecimal `&#x1F600;` (including emoji) entities',
          'Optional non-ASCII mode: uses a named entity when available, otherwise a decimal numeric entity',
        ],
        howToUse: [
          'Pick "Encode" or "Decode" at the top',
          'In encode mode, toggle "Encode non-ASCII" to control whether symbols and CJK become entities',
          'Type your text on the left; the converted result appears instantly on the right',
          'Click "Copy" to grab the result, or "Sample" / "Clear" to reset the input',
        ],
        useCases: [
          'Escaping user input before embedding it into an HTML template to avoid XSS and broken markup',
          'Figuring out what `&amp;` or `&#x1F600;` actually means in a page source',
          'Safely moving content between rich text, email templates, and plain text',
        ],
        privacyNote:
          'All encoding and decoding run locally in your browser. Your input is never uploaded and no network request is made.',
        faqs: [
          {
            question: 'Why is the generated `&` not escaped again?',
            answer:
              'The tool processes the text character by character in a single pass, so `&` only becomes `&amp;` when it appears literally in the source.',
          },
          {
            question: 'What happens with unknown or invalid entities?',
            answer:
              'Unknown named entities and invalid numeric entities (such as `&#xZZ;` or out-of-range code points) are kept as-is, without throwing or losing characters.',
          },
        ],
      },
    },
  },
  {
    slug: 'lorem-ipsum-generator',
    name: 'Lorem Ipsum 占位文本生成器',
    nameEn: 'Lorem Ipsum Generator',
    description:
      '按段落、句子或单词三种单位生成 Lorem Ipsum 占位文本，可控制数量并选择以经典开头起始。',
    descriptionEn:
      'Generate Lorem Ipsum placeholder text by paragraph, sentence, or word, with a count control and an option to start with the classic opening.',
    category: ToolCategoryEnum.TEXT_CONTENT,
    path: '/tools/lorem-ipsum-generator',
    iconName: 'FileText',
    tags: ['Lorem', '占位文本', '假文', '测试数据', '段落'],
    tagsEn: ['Lorem', 'Ipsum', 'Placeholder', 'Dummy Text', 'Generator'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    doc: {
      zh: {
        whatIsIt:
          'Lorem Ipsum 占位文本生成器是一款纯浏览器本地运算的工具，可按段落、句子或单词三种单位快速生成排版用的假文占位内容，无需联网、不上传任何数据。',
        coreFeatures: [
          '三种计量单位：按段落、句子或单词生成，数量可自由调节',
          '经典开头选项：可让首句以经典 Lorem ipsum dolor sit amet... 起始',
          '一键重新生成：每次点击都会换一批随机内容，便于反复挑选',
          '安全上限：对极大数量做合理限制，避免生成过多导致页面卡顿',
        ],
        howToUse: [
          '在顶部选择生成单位（段落 / 句子 / 单词）与数量',
          '按需开启「以经典 Lorem ipsum 开头」，让首句使用经典文案',
          '结果区会即时展示生成的占位文本，点击「重新生成」可换一批',
          '点击「复制结果」把占位文本粘贴到设计稿或草稿中',
        ],
        useCases: [
          '设计稿与原型中填充占位文案，专注排版与视觉呈现',
          '开发联调时快速生成批量测试文本',
          '演示文档、邮件模板中需要假文占位的场景',
        ],
        privacyNote:
          '所有占位文本均基于浏览器本地随机词库即时生成，不使用任何服务器计算，也不发起网络请求。',
        faqs: [
          {
            question: '生成的文本有实际含义吗？',
            answer:
              '没有。Lorem Ipsum 是用于排版的占位假文，本身不含实际语义，请勿直接作为正式对外的生产内容。',
          },
          {
            question: '为什么每次生成的内容都不一样？',
            answer:
              '文本由本地随机词库即时组合而成，「重新生成」会重新采样，因此每次结果都会变化。',
          },
        ],
      },
      en: {
        whatIsIt:
          'Lorem Ipsum Generator is a fully browser-based utility that instantly produces placeholder copy by paragraph, sentence, or word for layout work, with no network access and no data upload.',
        coreFeatures: [
          'Three units: generate by paragraph, sentence, or word with an adjustable count',
          'Classic opening option: start the first sentence with the classic Lorem ipsum dolor sit amet opening',
          'One-click regenerate: every click reshuffles the random content for easy comparison',
          'Safe caps: extreme counts are capped to keep the page responsive',
        ],
        howToUse: [
          'Pick the unit (paragraph, sentence, or word) and the count at the top',
          'Toggle "Start with classic Lorem ipsum" to begin with the classic opening sentence',
          'The output panel shows the generated text instantly; click "Regenerate" for a new batch',
          'Click "Copy" to paste the placeholder text into your design or draft',
        ],
        useCases: [
          'Filling design mockups and prototypes with placeholder copy to focus on layout',
          'Quickly producing bulk test text during development',
          'Providing dummy text for demos, slide decks, and email templates',
        ],
        privacyNote:
          'All placeholder text is generated locally from a built-in random word bank. No server computation is used and no network request is made.',
        faqs: [
          {
            question: 'Is the generated text meaningful?',
            answer:
              'No. Lorem Ipsum is placeholder text with no real meaning; do not use it as production copy.',
          },
          {
            question: 'Why does each generation differ?',
            answer:
              'The text is assembled on the fly from a local random word bank, so "Regenerate" re-samples and produces different content every time.',
          },
        ],
      },
    },
  },
  {
    slug: 'json-to-typescript',
    name: 'JSON 转 TypeScript 类型',
    nameEn: 'JSON to TypeScript Interface Generator',
    description:
      '根据 JSON 样例数据自动推断结构并生成等价的 TypeScript 接口与类型定义，支持嵌套命名、数组联合类型与键名安全。',
    descriptionEn:
      'Infer TypeScript interfaces and type definitions from sample JSON data, with nested naming, array union types, and safe key quoting.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/json-to-typescript',
    iconName: 'FileCode',
    tags: ['JSON', 'TypeScript', '类型', '接口', '开发'],
    tagsEn: ['JSON', 'TypeScript', 'Type', 'Interface', 'Dev'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: `{
  "id": 1024,
  "name": "ToolCraft",
  "active": true,
  "tags": ["json", "typescript"],
  "profile": {
    "email": "dev@toolcraft.io",
    "score": 4.5
  },
  "projects": [
    { "title": "Formatter", "stars": 128 },
    { "title": "Diff", "stars": 64 }
  ]
}`,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的 JSON 转 TypeScript 类型生成器，粘贴 JSON 样例数据即可自动推断结构，生成可直接复用的 interface / type 定义，无需上传任何数据。',
        coreFeatures: [
          '结构推断：递归分析对象、数组、字符串、数字、布尔与 null，自动生成对应类型',
          '嵌套命名：嵌套对象生成独立 interface，名称由父类型与属性名组合并自动去重',
          '数组联合类型：同一数组内元素类型不一致时合并为联合类型，空数组推断为 unknown[]',
          '键名安全：不是合法标识符的键自动加双引号，保证输出为合法 TypeScript',
          '纯本地运行：所有推断都在浏览器完成，数据不离开设备',
        ],
        howToUse: [
          '在左侧输入框粘贴 JSON 样例数据',
          '按需填写根类型名、选择缩进宽度、决定是否导出根类型',
          '右侧实时显示生成的 TypeScript 类型定义',
          '点击右上角复制按钮取用生成结果',
        ],
        useCases: [
          '把接口返回的 JSON 样例快速转成 TypeScript 接口定义',
          '第三方 API 缺少类型文档时，由样例数据反推类型',
          '为 mock 数据生成类型定义，保证前后端类型一致',
        ],
        privacyNote:
          '所有类型推断都在本地浏览器完成，数据不会上传到任何服务器，保护隐私安全。',
        faqs: [
          {
            question: '数组里元素类型不一致会怎么处理？',
            answer:
              '工具会收集数组内所有元素推断出的类型并合并为联合类型，例如同时出现字符串与数字时输出 (string | number)[]；空数组则推断为 unknown[]。',
          },
          {
            question: '嵌套对象会生成什么？',
            answer:
              '每个嵌套对象都会生成一个独立 interface，名称由父类型名与属性名组合（如 RootUser）并自动去重，属性类型引用对应接口。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-based JSON to TypeScript generator that infers the shape from sample JSON data and emits ready-to-use interface / type definitions without uploading anything.',
        coreFeatures: [
          'Shape inference: recursively analyzes objects, arrays, strings, numbers, booleans, and null to emit matching types',
          'Nested naming: nested objects become dedicated interfaces named from parent type plus property, with automatic de-duplication',
          'Array unions: mixed element types are merged into a union, and empty arrays become unknown[]',
          'Safe keys: keys that are not valid identifiers are automatically double-quoted so the output is valid TypeScript',
          '100% local: all inference happens in-browser, data never leaves your device',
        ],
        howToUse: [
          'Paste your sample JSON into the left input box',
          'Optionally set the root type name, choose the indent width, and toggle exporting the root type',
          'The generated TypeScript appears instantly on the right',
          'Click the copy button in the top right to grab the result',
        ],
        useCases: [
          'Turning a sample API response into a TypeScript interface quickly',
          'Reverse-engineering types from sample data when third-party API docs lack type info',
          'Generating type definitions for mock data to keep frontend and backend in sync',
        ],
        privacyNote:
          'All type inference is done locally in your browser. Data is never uploaded to any server, keeping your data private.',
        faqs: [
          {
            question: 'What happens when array elements have different types?',
            answer:
              'The tool collects every inferred element type and merges them into a union, e.g. (string | number)[] when both strings and numbers appear; an empty array becomes unknown[].',
          },
          {
            question: 'What is generated for nested objects?',
            answer:
              'Each nested object becomes its own interface, named from the parent type plus the property (such as RootUser) with automatic de-duplication, and the property references that interface.',
          },
        ],
      },
    },
  },
  {
    slug: 'text-case-converter',
    name: '文本命名风格转换',
    nameEn: 'Text Case Converter',
    description:
      '把文本在 camelCase、PascalCase、snake_case、kebab-case、CONSTANT_CASE、Title Case 等常见命名风格之间一键互转。',
    descriptionEn:
      'Convert text between common naming styles such as camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, and Title Case.',
    category: ToolCategoryEnum.TEXT_CONTENT,
    path: '/tools/text-case-converter',
    iconName: 'FileText',
    tags: ['命名', '大小写', '驼峰', '下划线', '文本'],
    tagsEn: ['Case', 'Naming', 'Camel', 'Snake', 'Text'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'get user profile',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的文本命名风格转换器，把任意文本一键在 camelCase、PascalCase、snake_case、kebab-case、CONSTANT_CASE、Title Case 等常见风格之间互转，全部在本地完成。',
        coreFeatures: [
          '十种风格：支持 camelCase / PascalCase / snake_case / SCREAMING_SNAKE_CASE / kebab-case / dot.case / Title Case / Sentence case / lower / UPPER',
          '智能分词：自动识别 camelCase / PascalCase 边界与连续大写缩写，如 getUserID 可正确拆为 get + user + id',
          '全量对照：一次列出所有风格结果，逐项一键复制',
          '纯本地运行：无任何网络请求，输入内容不离开设备',
        ],
        howToUse: [
          '在输入框输入或粘贴任意文本',
          '选择目标风格查看主结果，或直接查看下方全部风格对照',
          '点击对应条目的复制按钮取用结果',
          '需要时可清空输入或重新载入示例',
        ],
        useCases: [
          '把后端 snake_case 字段名转成前端 camelCase',
          '把自然语言文案转成常量名 CONSTANT_CASE 或类名 PascalCase',
          '统一团队命名风格，快速生成变量名与文件名',
        ],
        privacyNote:
          '所有转换都在本地浏览器完成，输入内容不会上传到任何服务器，保护隐私安全。',
        faqs: [
          {
            question: '输入 camelCase 或 PascalCase 文本能正确拆分吗？',
            answer:
              '可以。工具会按大小写边界拆分，并把连续大写缩写视为一个词，如 HTTPResponse 拆为 HTTP + Response，getUserID 拆为 get + User + ID。',
          },
          {
            question: '空输入会怎样？',
            answer:
              '输入为空或只包含分隔符时，所有风格都返回空结果，并给出提示，不会产出错误内容。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-based text case converter that switches any text between camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, Title Case, and more, all locally.',
        coreFeatures: [
          'Ten styles: camelCase / PascalCase / snake_case / SCREAMING_SNAKE_CASE / kebab-case / dot.case / Title Case / Sentence case / lower / UPPER',
          'Smart tokenizing: detects camelCase / PascalCase boundaries and acronym runs, so getUserID splits into get + user + id',
          'Full comparison: lists every style at once, each with one-click copy',
          '100% local: no network requests, your input never leaves your device',
        ],
        howToUse: [
          'Type or paste any text into the input box',
          'Pick a target style to see the main result, or scan the full comparison below',
          'Click the copy button on any entry to grab that result',
          'Clear the input or reload the sample whenever needed',
        ],
        useCases: [
          'Converting snake_case backend field names to camelCase for the frontend',
          'Turning copy text into CONSTANT_CASE constants or PascalCase class names',
          'Standardizing naming conventions across a team',
        ],
        privacyNote:
          'All conversion happens locally in your browser. Your input is never uploaded to any server, keeping your data private.',
        faqs: [
          {
            question: 'Can it split camelCase or PascalCase input correctly?',
            answer:
              'Yes. It splits on case boundaries and treats runs of capitals as one word, so HTTPResponse becomes HTTP + Response and getUserID becomes get + User + ID.',
          },
          {
            question: 'What happens with empty input?',
            answer:
              'When the input is empty or only separators, every style returns an empty result and a hint is shown instead of wrong content.',
          },
        ],
      },
    },
  },
  {
    slug: 'totp-generator',
    name: 'TOTP 动态验证码生成器',
    nameEn: 'TOTP (2FA) Code Generator',
    description:
      '按 RFC 6238 由 Base32 密钥生成基于时间的一次性密码，实时显示当前验证码与剩余有效期，用于本地调试两步验证。',
    descriptionEn:
      'Generate RFC 6238 time-based one-time passwords from a Base32 secret, with a live code and remaining validity window for local 2FA debugging.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/totp-generator',
    iconName: 'ShieldCheck',
    tags: ['TOTP', '2FA', '验证码', '双因素', '安全'],
    tagsEn: ['TOTP', '2FA', 'OTP', 'Authenticator', 'Security'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的 TOTP 动态验证码生成器，输入 Base32 密钥即可按 RFC 6238 生成与认证器一致的六位或八位一次性密码，并实时显示剩余有效期，用于本地调试两步验证流程。',
        coreFeatures: [
          '标准实现：遵循 RFC 6238 / RFC 4226，支持 SHA-1 / SHA-256 / SHA-512 与 6 / 8 位验证码',
          '实时倒计时：展示当前验证码的剩余有效秒数与进度条，随系统时间自动刷新',
          '参数可调：时间步长（30s / 60s）与哈希算法可按需切换，便于对齐不同服务端配置',
          '测试向量：内置 RFC 6238 附录 B 测试向量，一键载入校验实现正确性',
          '纯本地运行：密钥与验证码都不离开浏览器，绝不发起网络请求',
        ],
        howToUse: [
          '在输入框填入 Base32 编码的共享密钥（可含空格与 = 填充）',
          '按需选择哈希算法、验证码位数与时间步长',
          '页面实时显示当前验证码与剩余有效期，并自动刷新',
          '点击复制按钮取用验证码，或用「载入测试向量」校验实现',
        ],
        useCases: [
          '本地调试 TOTP 双因素认证时快速获取当前验证码',
          '核对服务端与认证器实现是否一致',
          '学习 RFC 6238 算法时对照标准测试向量验证结果',
        ],
        privacyNote:
          '密钥仅在浏览器内存中参与本地 HMAC 运算，绝不上传、不记录、不发送到任何服务器。',
        faqs: [
          {
            question: '密钥有什么格式要求？',
            answer:
              '需为 Base32 编码（字母 A-Z 与数字 2-7）。工具会自动忽略空格、统一大小写并去掉 = 填充；包含其他字符时会给出明确错误。',
          },
          {
            question: '为什么验证码每 30 秒会变化？',
            answer:
              'TOTP 以时间步长为单位计算计数器，默认每 30 秒进入下一个时间步，验证码随之更新，界面同时展示本步剩余秒数。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-based TOTP generator that turns a Base32 secret into RFC 6238 time-based one-time passwords matching your authenticator, with a live code and remaining validity window for local 2FA debugging.',
        coreFeatures: [
          'Standards-based: follows RFC 6238 / RFC 4226 with SHA-1 / SHA-256 / SHA-512 and 6- or 8-digit codes',
          'Live countdown: shows the remaining seconds of the current code with a progress bar that refreshes automatically',
          'Tunable parameters: switch the time step (30s / 60s) and hash algorithm to match different server settings',
          'Test vectors: built-in RFC 6238 Appendix B vectors let you validate the implementation in one click',
          '100% local: neither the secret nor the code ever leaves your browser, with zero network requests',
        ],
        howToUse: [
          'Enter the Base32 shared secret in the input box (spaces and = padding are allowed)',
          'Optionally pick the hash algorithm, code length, and time step',
          'The current code and remaining validity update live and refresh automatically',
          'Copy the code, or click "Load test vector" to validate the implementation',
        ],
        useCases: [
          'Grabbing the current code quickly while debugging TOTP two-factor auth locally',
          'Checking that a server implementation matches a standard authenticator',
          'Verifying results against RFC 6238 test vectors while studying the algorithm',
        ],
        privacyNote:
          'The secret only participates in local HMAC computation in browser memory. Nothing is uploaded, logged, or sent to any server.',
        faqs: [
          {
            question: 'What format does the secret need?',
            answer:
              'It must be Base32 (letters A-Z and digits 2-7). The tool ignores spaces, normalizes case, and strips = padding; any other character produces a clear error.',
          },
          {
            question: 'Why does the code change every 30 seconds?',
            answer:
              'TOTP derives a counter per time step. With the default 30-second step, a new step begins every 30 seconds and the code updates, while the UI shows the remaining seconds.',
          },
        ],
      },
    },
  },
  {
    slug: 'cidr-subnet-calculator',
    name: 'CIDR / IP 子网计算器',
    nameEn: 'CIDR / IP Subnet Calculator',
    description:
      '输入 IP 地址与 CIDR 前缀或子网掩码，一键计算网络地址、广播地址、可用主机范围、主机数量与掩码信息，支持 IPv4 与 IPv6。',
    descriptionEn:
      'Enter an IP address with a CIDR prefix or netmask to compute the network address, broadcast address, usable host range, host count, and mask details for IPv4 and IPv6.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/cidr-subnet-calculator',
    iconName: 'Gauge',
    tags: ['CIDR', '子网', 'IP', '网络', 'IPv6'],
    tagsEn: ['CIDR', 'Subnet', 'IP', 'Networking', 'IPv6'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '192.168.1.10/24',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的 CIDR / IP 子网计算器，输入 IP 地址与 CIDR 前缀（或点分掩码）即可得到网络地址、广播地址、可用主机范围、主机数量、掩码与地址类别，并支持 IPv6 前缀长度计算，便于网络规划与排障。',
        coreFeatures: [
          '双栈支持：同时计算 IPv4 与 IPv6，IPv6 前缀运算使用 BigInt 保证大地址空间精度',
          '多输入形式：接受 `IP/前缀`、`IP 掩码`、`IP` 等写法，自动识别地址族',
          '结果齐全：给出网络地址、广播地址、首个/最后可用主机、地址总数与可用主机数',
          '掩码视图：展示子网掩码、通配符掩码与 32 位二进制分组视图',
          '纯本地运行：所有计算都在浏览器内完成，不发起任何网络探测或请求',
        ],
        howToUse: [
          '在输入框填写 IP 地址与 CIDR 前缀，例如 192.168.1.10/24，或使用「IP 掩码」形式',
          '按需切换识别模式（自动 / IPv4 / IPv6）或点击常用示例按钮',
          '查看右侧结果卡片中的网络地址、可用主机范围、掩码与地址类别等信息',
          '点击「复制结果」导出全部计算字段',
        ],
        useCases: [
          '划分网段、规划子网掩码时快速核算可用主机数量',
          '排查网络不通问题时确认网络地址与广播地址是否正确',
          '学习 IPv4 / IPv6 寻址与 CIDR 记法时对照计算结果',
        ],
        privacyNote:
          '输入内容仅在浏览器本地参与计算，绝不会上传、记录或发送到任何服务器。',
        faqs: [
          {
            question: '支持哪些输入格式？',
            answer:
              '支持 `192.168.1.10/24`、`192.168.1.10 255.255.255.0`、单独的 `192.168.1.10`（按 /32 计算）以及 `2001:db8::1/64` 等 IPv6 写法；非法输入会给出明确错误提示。',
          },
          {
            question: '/31 和 /32 的主机数为什么要特殊处理？',
            answer:
              '按 RFC 3021，/31 的两个地址可用于点对点链路，因此可用主机数为 2；而 /32 为单主机地址。小前缀等级下不存在传统意义上的广播地址。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-based CIDR / IP subnet calculator. Enter an IP address with a CIDR prefix (or dotted netmask) to get the network address, broadcast address, usable host range, host count, netmask, and address class, with IPv6 prefix support for network planning and troubleshooting.',
        coreFeatures: [
          'Dual-stack: computes both IPv4 and IPv6, using BigInt for IPv6 prefix math to keep large address spaces precise',
          'Flexible input: accepts `IP/prefix`, `IP netmask`, and plain `IP` forms with automatic address-family detection',
          'Complete results: network address, broadcast address, first/last usable host, total addresses, and usable host count',
          'Mask view: shows the subnet mask, wildcard mask, and a grouped 32-bit binary view',
          '100% local: every calculation runs in your browser with zero network probing or requests',
        ],
        howToUse: [
          'Enter an IP address and CIDR prefix, such as 192.168.1.10/24, or use the "IP netmask" form',
          'Switch the detection mode (auto / IPv4 / IPv6) or click a common sample button',
          'Read the network address, usable host range, mask, and address class from the result card',
          'Click "Copy result" to export every computed field',
        ],
        useCases: [
          'Quickly verifying usable host counts while carving subnets and planning netmasks',
          'Confirming network and broadcast addresses while debugging connectivity problems',
          'Learning IPv4 / IPv6 addressing and CIDR notation against computed results',
        ],
        privacyNote:
          'Your input only participates in local computation in the browser. Nothing is uploaded, logged, or sent to any server.',
        faqs: [
          {
            question: 'Which input formats are supported?',
            answer:
              'Forms like `192.168.1.10/24`, `192.168.1.10 255.255.255.0`, a bare `192.168.1.10` (treated as /32), and IPv6 like `2001:db8::1/64` are supported; invalid input produces a clear error.',
          },
          {
            question: 'Why are /31 and /32 host counts special?',
            answer:
              'Per RFC 3021, both addresses in a /31 can be used on point-to-point links, so the usable host count is 2, while /32 is a single host address. These prefixes have no traditional broadcast address.',
          },
        ],
      },
    },
  },
  {
    slug: 'curl-to-code',
    name: 'cURL 转代码',
    nameEn: 'cURL to Code Converter',
    description:
      '把一条 cURL 命令解析为请求方法、URL、请求头与请求体，一键生成 JavaScript fetch、Node axios、Python requests 或 Go 代码片段。',
    descriptionEn:
      'Parse a cURL command into its method, URL, headers, and body, then generate equivalent JavaScript fetch, Node axios, Python requests, or Go code in one click.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/curl-to-code',
    iconName: 'Code',
    tags: ['cURL', '代码生成', 'HTTP', 'API', '调试'],
    tagsEn: ['cURL', 'Codegen', 'HTTP', 'API', 'Debug'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: `curl -X POST 'https://api.example.com/items' \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json' \\
  -d '{"name": "A", "price": 12}'`,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的 cURL 转代码工具，粘贴一条 cURL 命令即可解析出请求方法、URL、请求头与请求体，并生成等价的多语言代码片段，省去手工改写 API 调用的时间。',
        coreFeatures: [
          '完整解析：识别 -X 方法、-H 请求头、-d/--data 请求体、-u 基本认证、--data-raw 等常用参数',
          '多目标语言：一键生成 JavaScript fetch、Node.js axios、Python requests 与 Go net/http 代码',
          '转义感知：正确处理单引号 / 双引号、反斜杠换行与转义字符',
          '实时预览：输入即解析并生成代码，解析失败时给出明确错误定位',
          '纯本地运行：命令内容不离开浏览器，绝不发起任何网络请求',
        ],
        howToUse: [
          '把从浏览器开发者工具「Copy as cURL」复制到的命令粘贴到左侧输入框',
          '在顶部选择目标语言（JavaScript fetch / Node axios / Python requests / Go）',
          '右侧实时生成等价代码，点击「复制代码」取用',
          '若命令格式不被识别，按提示检查引号与参数写法',
        ],
        useCases: [
          '把浏览器里复制的请求快速转写成项目使用的 HTTP 客户端代码',
          '对照不同语言实现同一请求时的差异',
          '教学或文档中生成标准的多语言请求示例',
        ],
        privacyNote:
          '粘贴的 cURL 命令只在浏览器内存中解析与生成，绝不会上传、记录或发送到任何服务器。',
        faqs: [
          {
            question: '支持哪些 cURL 参数？',
            answer:
              '目前支持 -X/--request、-H/--header、-d/--data、--data-raw/--data-binary、-u/--user 等最常用参数；复杂或不常见参数可能不被识别，会给出提示。',
          },
          {
            question: '生成的代码能直接运行吗？',
            answer:
              '生成的是等价的标准代码片段。axios 与 requests 等示例可能需要在项目中先安装对应依赖，请按目标语言环境补充。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-based cURL-to-code converter. Paste a cURL command and it parses the method, URL, headers, and body, then generates equivalent multi-language code snippets so you can skip manually rewriting API calls.',
        coreFeatures: [
          'Full parsing: recognizes -X method, -H headers, -d/--data body, -u basic auth, --data-raw, and other common flags',
          'Multiple targets: generate JavaScript fetch, Node.js axios, Python requests, and Go net/http code in one click',
          'Escape-aware: correctly handles single/double quotes, backslash line continuations, and escaped characters',
          'Live preview: parse and generate as you type, with clear error messages on failure',
          '100% local: the command never leaves your browser and no network request is ever made',
        ],
        howToUse: [
          'Paste a command copied with "Copy as cURL" from your browser devtools into the left input',
          'Pick the target language (JavaScript fetch / Node axios / Python requests / Go) at the top',
          'The equivalent code appears live on the right; click "Copy code" to use it',
          'If the command is not recognized, follow the hint to check quotes and argument syntax',
        ],
        useCases: [
          'Quickly rewriting a request copied from the browser into your project HTTP client code',
          'Comparing how the same request looks across different languages',
          'Producing standard multi-language request samples for teaching or docs',
        ],
        privacyNote:
          'The pasted cURL command is only parsed and rendered in browser memory. Nothing is uploaded, logged, or sent to any server.',
        faqs: [
          {
            question: 'Which cURL flags are supported?',
            answer:
              'The most common flags are supported: -X/--request, -H/--header, -d/--data, --data-raw/--data-binary, -u/--user, and more. Uncommon or complex flags may not be recognized and will produce a hint.',
          },
          {
            question: 'Can the generated code run directly?',
            answer:
              'It is an equivalent standard snippet. Examples using axios or requests may require installing those dependencies in your project first, per your target language environment.',
          },
        ],
      },
    },
  },
  {
    slug: 'line-operations',
    name: '行级文本处理',
    nameEn: 'Line Operations',
    description:
      '对多行文本执行排序、去重、反转行序与过滤（去空行、按关键字或正则保留 / 剔除），用于清洗日志与整理列表。',
    descriptionEn:
      'Sort, deduplicate, reverse, and filter the lines of multi-line text — remove blank lines, or keep/remove lines by keyword or regex — to clean up logs and tidy lists.',
    category: ToolCategoryEnum.TEXT_CONTENT,
    path: '/tools/line-operations',
    iconName: 'Shuffle',
    tags: ['文本', '行操作', '排序', '去重', '过滤', '日志'],
    tagsEn: ['Text', 'Lines', 'Sort', 'Dedupe', 'Filter', 'Log'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: `error: failed to connect 10.0.0.2
info: cache warmed

warn: retry scheduled
error: failed to connect 10.0.0.2
info: request finished`,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的行级文本处理工具，针对日志、清单等逐行数据提供排序、去重、反转与过滤等操作，粘贴文本即可实时得到清洗结果。',
        coreFeatures: [
          '排序：支持字典序、自然序（数字按数值比较）、按行长、按数值四种方式，可升可降',
          '去重：去除重复行并保留首次出现，可切换是否区分大小写',
          '反转：一键按行反转顺序',
          '过滤：移除空行，或按关键字 / 正则保留、剔除命中行',
          '兼容换行：自动识别 LF / CRLF 并保持原有行尾风格',
          '纯本地运行：文本不离开浏览器，绝不发起任何网络请求',
        ],
        howToUse: [
          '把需要处理的多行文本粘贴到左侧输入框',
          '在顶部选择排序方式与方向，并按需勾选去重、反转、去空白、移除空行等选项',
          '需要筛选时选择过滤模式（关键字 / 正则）并输入条件，选择保留或剔除命中行',
          '右侧实时展示处理结果与行数变化，点击「复制结果」取用',
        ],
        useCases: [
          '清洗日志：去除重复报错行、剔除空行、提取包含某关键字的相关行',
          '整理列表：对配置项、域名、版本号等排序与去重',
          '数据预处理：把文本清单按长度或数值排序后再使用',
        ],
        privacyNote:
          '所有文本处理均基于纯浏览器本地运算，绝不记录或向云端传输任何数据。',
        faqs: [
          {
            question: '“自然序”和“字典序”有什么区别？',
            answer:
              '字典序按字符逐位比较，会出现 item10 排在 item2 之前；自然序会把连续数字当作数值比较，因此 item2 排在 item10 之前，更符合人的直觉。',
          },
          {
            question: '过滤时正则表达式写错了会怎样？',
            answer:
              '工具会捕获非法正则并给出明确错误提示，不会中断页面或抛异常，修正后即可继续使用。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-based line processing tool for multi-line text such as logs and lists. Paste your text and get sorting, deduplication, reversal, and filtering results in real time.',
        coreFeatures: [
          'Sorting: lexical, natural (numeric-aware), by line length, or by numeric value — ascending or descending',
          'Deduplication: drop duplicate lines while keeping the first occurrence, with a case-sensitivity toggle',
          'Reverse: flip the line order in one click',
          'Filtering: remove blank lines, or keep/remove lines by keyword or regex',
          'Newline-aware: detects LF / CRLF and preserves the original line endings',
          '100% local: text never leaves your browser and no network request is ever made',
        ],
        howToUse: [
          'Paste the multi-line text you want to process into the left input',
          'Pick a sort mode and direction at the top, and toggle dedupe, reverse, trim, or blank-line removal as needed',
          'To filter, choose keyword or regex mode, enter your condition, and pick whether to keep or remove matches',
          'The right panel shows the result and the line-count change; click "Copy result" to use it',
        ],
        useCases: [
          'Cleaning logs: drop duplicate errors, remove blank lines, extract lines matching a keyword',
          'Tidying lists: sort and deduplicate config entries, domains, or version strings',
          'Data prep: sort a text list by length or numeric value before reuse',
        ],
        privacyNote:
          'All processing happens locally in your browser. Nothing is logged or sent to any server.',
        faqs: [
          {
            question: 'How is "natural" sorting different from "lexical"?',
            answer:
              'Lexical sorting compares characters one by one, so item10 comes before item2. Natural sorting treats runs of digits as numbers, so item2 comes before item10, matching human intuition.',
          },
          {
            question: 'What happens if my filter regex is invalid?',
            answer:
              'The tool catches the invalid pattern and shows a clear error instead of crashing, so you can fix it and continue.',
          },
        ],
      },
    },
  },
  {
    slug: 'semver-parser',
    name: '语义化版本解析与比较',
    nameEn: 'SemVer Parser & Comparator',
    description:
      '解析与校验 SemVer 2.0.0 版本号，比较两个版本大小，并判断指定版本是否命中 ^、~、>= < 等 npm 风格范围表达式。',
    descriptionEn:
      'Parse and validate SemVer 2.0.0 versions, compare two versions, and check whether a given version satisfies npm-style ranges such as ^, ~, and >= <.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/semver-parser',
    iconName: 'Tags',
    tags: ['SemVer', '版本', '比较', '范围', 'npm', '依赖'],
    tagsEn: ['SemVer', 'Version', 'Compare', 'Range', 'npm', 'Dependency'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '1.2.3-alpha.1+build.7',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的语义化版本工具，可校验并拆解 SemVer 2.0.0 版本号、比较两个版本的大小关系，并判断某个版本是否落入指定的 npm 风格范围表达式。',
        coreFeatures: [
          '版本解析：拆出 major / minor / patch 与 pre-release、build 元数据',
          '合法性校验：严格遵循 SemVer 2.0.0（数字段不得有前导零、必须三段式）',
          '版本比较：按规范比较主次修订号与预发布优先级',
          '范围匹配：支持 ^、~、>=、<=、>、<、=、x 通配、空格（与）、||（或）与连字符区间',
          '预发布语义：普通范围不会命中预发布版本，与 npm 规则一致',
          '纯本地运行：所有运算在浏览器内完成，绝不发起任何网络请求',
        ],
        howToUse: [
          '在「版本校验与解析」输入版本号，查看是否合法与各段取值',
          '在「版本比较」输入 A、B 两个版本，查看大小关系',
          '在「范围命中判断」输入范围表达式与版本号，查看是否命中',
        ],
        useCases: [
          '排查依赖冲突：确认某版本是否满足依赖声明的范围',
          '发版校验：检查版本字符串是否符合语义化版本规范',
          '文档与脚本编写：验证版本比较与范围表达式行为',
        ],
        privacyNote:
          '所有解析与比较均在浏览器本地完成，输入的版本信息不会被上传或记录。',
        faqs: [
          {
            question: '为什么 1.0 会被判为非法？',
            answer:
              'SemVer 2.0.0 要求版本号必须是 major.minor.patch 三段式，1.0 缺少修订号，因此非法。',
          },
          {
            question: '为什么 ^1.2.3 不命中 1.3.0-alpha？',
            answer:
              '按 npm 语义，不含预发布标识的范围默认不会命中预发布版本，以避免不稳定版本被意外选中。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-based Semantic Versioning tool. Validate and break down SemVer 2.0.0 strings, compare two versions, and check whether a version satisfies an npm-style range expression.',
        coreFeatures: [
          'Version parsing: decompose major / minor / patch plus pre-release and build metadata',
          'Validation: strict SemVer 2.0.0 (no leading zeros, three segments required)',
          'Comparison: compares major/minor/patch and pre-release precedence per spec',
          'Range matching: ^, ~, >=, <=, >, <, =, x wildcards, space (AND), || (OR), and hyphen ranges',
          'Pre-release semantics: plain ranges do not match pre-release versions, consistent with npm',
          '100% local: everything runs in your browser and no network request is ever made',
        ],
        howToUse: [
          'Enter a version in "Validation & parsing" to check validity and see each segment',
          'Enter two versions in "Comparison" to see their ordering',
          'Enter a range expression and a version in "Range matching" to see whether it is satisfied',
        ],
        useCases: [
          'Debugging dependency conflicts: check whether a version satisfies a declared range',
          'Release validation: verify a version string against the semantic versioning spec',
          'Docs and scripting: confirm version comparison and range behavior',
        ],
        privacyNote:
          'All parsing and comparison happen locally in your browser. Entered versions are never uploaded or logged.',
        faqs: [
          {
            question: 'Why is 1.0 considered invalid?',
            answer:
              'SemVer 2.0.0 requires three segments (major.minor.patch). 1.0 is missing the patch segment, so it is invalid.',
          },
          {
            question: 'Why does ^1.2.3 not match 1.3.0-alpha?',
            answer:
              'Per npm semantics, ranges without a pre-release identifier do not match pre-release versions by default, so unstable versions are not accidentally selected.',
          },
        ],
      },
    },
  },
  {
    slug: 'number-base-converter',
    name: '进制互转与位运算',
    nameEn: 'Number Base & Bit Converter',
    description:
      '在二进制 / 八进制 / 十进制 / 十六进制之间互转，支持大整数与正负号，并可视化二进制位与位运算结果。',
    descriptionEn:
      'Convert numbers between binary, octal, decimal, and hexadecimal with big-integer support, and visualize bit groups plus bitwise operations.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/number-base-converter',
    iconName: 'Gauge',
    tags: ['进制', '二进制', '十六进制', '位运算', 'BigInt'],
    tagsEn: ['Base', 'Binary', 'Hex', 'Bitwise', 'BigInt'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '255',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的进制与位运算工具，可在二进制 / 八进制 / 十进制 / 十六进制之间互转，展示指定位宽下的二进制位分组与置位统计，并执行 AND / OR / XOR / NOT / 位移等位运算。',
        coreFeatures: [
          '进制互转：2 / 8 / 10 / 16 进制一览输出，支持正负号与常见前缀',
          '大整数：基于 BigInt，超出 32 位的整数不丢精度',
          '位可视化：按 8 / 16 / 32 / 64 位宽分组展示二进制位并统计置位个数',
          '位运算：AND / OR / XOR / NOT / 左移 / 右移，按定位宽处理补位',
          '错误提示：非法字符、超出所选进制范围的输入给出明确提示',
          '纯本地运行：所有运算在浏览器内完成，绝不发起任何网络请求',
        ],
        howToUse: [
          '在「进制互转」选择输入进制并输入数值，查看各进制结果',
          '在「位可视化」选择位宽，查看分组后的二进制位与置位统计',
          '在「位运算」输入操作数 A / B 选择运算符，或对 A 执行取反与位移',
        ],
        useCases: [
          '底层调试：快速查看数值的二进制与十六进制表示',
          '权限与标志位：解析 chmod 权限位、协议标志字段',
          '协议解析：换算报文中的字段与校验值',
        ],
        privacyNote: '所有转换与位运算均在浏览器本地完成，输入的数值不会被上传或记录。',
        faqs: [
          {
            question: '为什么可以处理超过 32 位的整数？',
            answer:
              '工具内部使用 BigInt 进行运算，不经过 JavaScript 的 32 位位运算截断，因此大整数不会丢失精度。',
          },
          {
            question: 'NOT 取反的结果如何计算？',
            answer:
              '取反按所选位宽处理：先在位宽内对原值取补码，再与全 1 掩码异或，得到该位宽下的取反结果。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first number base and bit tool that converts between binary, octal, decimal, and hexadecimal, shows grouped bits and popcount at a chosen width, and performs AND / OR / XOR / NOT and shift operations.',
        coreFeatures: [
          'Base conversion: binary / octal / decimal / hexadecimal output with sign and prefix support',
          'Big integers: powered by BigInt so values beyond 32 bits keep full precision',
          'Bit visualization: grouped bits and set-bit count at 8 / 16 / 32 / 64 bit widths',
          'Bitwise operations: AND / OR / XOR / NOT / left and right shift within the selected width',
          'Clear errors: explicit messages for invalid characters or digits out of range',
          'Local-first: all computation runs in the browser with no network requests',
        ],
        howToUse: [
          'In "Base conversion", pick the input base and enter a value to see every base',
          'In "Bit visualization", choose a bit width to see grouped bits and popcount',
          'In "Bitwise", enter operands A / B with an operator, or apply NOT and shifts to A',
        ],
        useCases: [
          'Low-level debugging: inspect the binary and hex form of a value',
          'Permissions and flags: decode chmod bits and protocol flag fields',
          'Protocol parsing: convert field values and checksums',
        ],
        privacyNote:
          'All conversions and bitwise operations run locally in the browser; entered values are never uploaded or logged.',
        faqs: [
          {
            question: 'How can it handle integers beyond 32 bits?',
            answer:
              'The tool uses BigInt internally, avoiding the 32-bit truncation of JavaScript bitwise operators, so large integers keep full precision.',
          },
          {
            question: 'How is NOT computed?',
            answer:
              'NOT works within the selected width: the value is normalized to its two’s-complement form and XORed with an all-ones mask.',
          },
        ],
      },
    },
  },
  {
    slug: 'url-parser',
    name: 'URL 解析与查询参数编辑',
    nameEn: 'URL Parser & Query Editor',
    description:
      '将 URL 拆解为协议、主机、端口、路径、查询参数与哈希，支持增删改查询参数后实时重新拼接。',
    descriptionEn:
      'Break a URL into scheme, host, port, path, query parameters, and hash, then add, edit, or remove params and re-assemble it live.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/url-parser',
    iconName: 'Layers',
    tags: ['URL', '查询参数', '解析', '编辑', '链接'],
    tagsEn: ['URL', 'Query', 'Parse', 'Edit', 'Link'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput:
      'https://example.com/search?q=hello%20world&tag=a&tag=b&flag#results',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的 URL 工具，可将链接拆解为协议、用户名、密码、主机、端口、路径、查询参数与哈希，并以表格形式增删改查询参数，实时重新拼接出完整 URL。',
        coreFeatures: [
          '结构化解析：拆出 scheme / username / password / host / port / pathname / query / hash',
          '查询参数编辑：增删改参数、启用停用，支持重复键与无值参数',
          '原始与解码：每个键值同时展示原始与百分号解码后的形式',
          '实时拼接：按 encodeURIComponent 规范重新编码，可切换保留原始编码',
          '相对地址：支持无协议、仅有路径的输入',
          '纯本地运行：所有解析与拼接在浏览器内完成，绝不发起任何网络请求',
        ],
        howToUse: [
          '在顶部输入 URL，中部会即时展示拆解出的各组件',
          '在「查询参数编辑」增删改参数，或停用不需要的参数',
          '查看「实时拼接结果」并复制，可切换「保留原始编码」',
        ],
        useCases: [
          '接口调试：拆解复杂链接，确认各查询参数取值',
          '清理跟踪参数：删除 utm 等无用的查询参数',
          '构造分享链接：增改参数后得到规整的 URL',
        ],
        privacyNote: '所有解析与拼接均在浏览器本地完成，输入的 URL 不会被上传或记录。',
        faqs: [
          {
            question: '为什么 + 会被解码成空格？',
            answer:
              '查询串沿用 application/x-www-form-urlencoded 约定，+ 代表空格；工具会同时给出原始与解码后的形式。',
          },
          {
            question: '重复的查询参数会被合并吗？',
            answer: '不会。工具按出现顺序保留所有参数，重复键会原样保留并参与重新拼接。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first URL tool that breaks a link into scheme, username, password, host, port, path, query params, and hash, and lets you add, edit, or remove query parameters to re-assemble the URL live.',
        coreFeatures: [
          'Structured parsing: scheme / username / password / host / port / pathname / query / hash',
          'Query editing: add, edit, remove, enable or disable params, with duplicate keys and valueless params',
          'Raw and decoded: each key and value is shown in both raw and percent-decoded form',
          'Live re-assembly: re-encodes per encodeURIComponent, with an option to keep the raw encoding',
          'Relative addresses: supports inputs with no scheme, path only',
          'Local-first: all parsing and assembly run in the browser with no network requests',
        ],
        howToUse: [
          'Enter a URL at the top to see its components parsed instantly',
          'In "Query parameters", add, edit, or remove params, or disable ones you do not need',
          'Review the "Assembled URL" and copy it, optionally keeping the raw encoding',
        ],
        useCases: [
          'API debugging: break a complex link down and confirm each query value',
          'Cleaning tracking params: drop UTM and other noisy query parameters',
          'Building share links: tweak params to get a tidy URL',
        ],
        privacyNote:
          'All parsing and assembly run locally in the browser; entered URLs are never uploaded or logged.',
        faqs: [
          {
            question: 'Why is + decoded as a space?',
            answer:
              'Query strings follow the application/x-www-form-urlencoded convention where + means a space; the tool shows both raw and decoded forms.',
          },
          {
            question: 'Are duplicate query parameters merged?',
            answer:
              'No. All params are kept in order; duplicate keys are preserved as-is and included when re-assembling.',
          },
        ],
      },
    },
  },
  {
    slug: 'base32-codec',
    name: 'Base32 编解码',
    nameEn: 'Base32 Encoder & Decoder',
    description:
      '按 RFC 4648 标准字母表做 Base32 文本编解码，支持填充与去填充变体，并校验非法字符与长度。',
    descriptionEn:
      'Encode and decode Base32 text with the RFC 4648 alphabet, supporting padded and unpadded variants with validation.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/base32-codec',
    iconName: 'Fingerprint',
    tags: ['Base32', '编解码', 'RFC 4648', 'TOTP', '密钥'],
    tagsEn: ['Base32', 'Encode', 'RFC 4648', 'TOTP', 'Secret'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'foobar',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的 Base32 编解码工具，使用 RFC 4648 标准字母表 A-Z2-7 在文本与 Base32 字符串之间双向转换，支持填充与去填充变体，并对输入做合法性校验。',
        coreFeatures: [
          '编码：文本按 UTF-8 编码为 Base32，可选输出填充 = 或去填充变体',
          '解码：大小写不敏感，兼容带填充与去填充输入',
          '校验：非法字符、非法长度、填充位置或数量错误均给出明确提示与位置',
          '实用场景：快速转换 TOTP secret、密钥材料等 Base32 字符串',
          '纯本地运行：所有转换在浏览器内完成，绝不发起任何网络请求',
        ],
        howToUse: [
          '选择「编码」或「解码」方向',
          '在输入框粘贴文本或 Base32 字符串，结果即时更新',
          '编码时可勾选「去填充」省略 =；解码失败会展示具体原因',
        ],
        useCases: [
          '认证配置：把 TOTP secret 的 Base32 字符串转回原始字节或反向生成',
          '密钥处理：在 Base32 与文本之间做快速转换',
          '数据核对：校验 Base32 字符串是否合法及其问题位置',
        ],
        privacyNote: '所有编解码均在浏览器本地完成，输入的文本与 Base32 字符串不会被上传或记录。',
        faqs: [
          {
            question: 'Base32 和 Base64 有什么区别？',
            answer:
              'Base32 使用 32 个字符（A-Z 与 2-7），编码后体积更大但对大小写不敏感的场合更友好，常用于 TOTP 密钥等场景。',
          },
          {
            question: '为什么解码会提示填充字符数量不正确？',
            answer:
              '带填充的 Base32 长度必须是 8 的倍数，且填充数量由数据长度唯一确定；数量不匹配说明输入被破坏。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first Base32 codec that converts between text and Base32 strings using the RFC 4648 alphabet A-Z2-7, with padded and unpadded variants plus validation.',
        coreFeatures: [
          'Encode: UTF-8 text to Base32, with padded or unpadded output',
          'Decode: case-insensitive, accepting both padded and unpadded input',
          'Validation: clear messages with positions for invalid characters, lengths, and padding',
          'Handy for converting TOTP secrets and key material in Base32',
          'Local-first: all conversion runs in the browser with no network requests',
        ],
        howToUse: [
          'Pick the "Encode" or "Decode" direction',
          'Paste text or a Base32 string and the result updates instantly',
          'When encoding, tick "Unpadded" to omit =; decode failures show the exact reason',
        ],
        useCases: [
          'Auth setup: turn a TOTP secret Base32 string back into bytes or the other way',
          'Key handling: convert quickly between Base32 and text',
          'Data checks: validate whether a Base32 string is well-formed and where problems are',
        ],
        privacyNote:
          'All encoding and decoding run locally in the browser; entered text and Base32 strings are never uploaded or logged.',
        faqs: [
          {
            question: 'How is Base32 different from Base64?',
            answer:
              'Base32 uses 32 characters (A-Z and 2-7); it is larger in size but friendlier for case-insensitive contexts, and is common for TOTP secrets.',
          },
          {
            question: 'Why does decoding report an incorrect padding count?',
            answer:
              'Padded Base32 must be a multiple of 8 characters, and the padding count is uniquely determined by the data length; a mismatch means the input was corrupted.',
          },
        ],
      },
    },
  },
  {
    slug: 'percentage-calculator',
    name: '百分比计算器',
    nameEn: 'Percentage Calculator',
    description:
      '一键完成三类常用百分比运算：X 的 Y% 是多少、X 是 Y 的百分之几、X 较 Y 增长或下降百分之几，输入实时联动，除零与非法输入有明确提示。',
    descriptionEn:
      'Perform three everyday percentage calculations instantly: Y% of X, what percent X is of Y, and the percentage increase or decrease from Y to X, with live updates and clear messages for invalid input or division by zero.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/percentage-calculator',
    iconName: 'Gauge',
    tags: ['百分比', '折扣', '增长率', '比例', '换算'],
    tagsEn: ['Percentage', 'Discount', 'Growth Rate', 'Ratio', 'Calculator'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的百分比工具，覆盖「X 的 Y% 是多少」「X 是 Y 的百分之几」「X 较 Y 增长/下降百分之几」三类高频场景，输入即时联动并对除零、非法输入给出明确提示。',
        coreFeatures: [
          '三种模式：求部分值、求占比、求变化率，按钮式切换',
          '实时联动：输入即算，无需点击按钮',
          '智能提示：任一输入为空或非法时显示空态，除数为 0 时明确警示',
          '增减标识：变化模式用标签区分增长、下降与无变化',
          '精度控制：内部全精度计算，展示至多 6 位小数并去除尾随 0',
          '纯本地运行：所有运算在浏览器内完成，绝不发起任何网络请求',
        ],
        howToUse: [
          '点击顶部按钮选择要使用的百分比运算模式',
          '在输入框中填入十进制数字（支持小数与负数），结果即时更新',
          '变化率模式下注意「变化后」与「变化前」的填写顺序',
        ],
        useCases: [
          '购物打折：快速计算原价的折扣价与优惠金额',
          '财务统计：计算增长率、下降率与完成率',
          '日常换算：求部分占整体的百分比或反向求部分值',
        ],
        privacyNote:
          '所有计算均在浏览器本地完成，输入的数字不会被上传或记录。',
        faqs: [
          {
            question: '为什么变化前的值为 0 时无法计算？',
            answer:
              '变化率公式为（变化后 − 变化前）÷ 变化前 × 100%，变化前为 0 时数学上未定义，因此工具会给出提示而非输出结果。',
          },
          {
            question: '为什么结果有时会被截断小数位？',
            answer:
              '内部始终使用完整精度计算，仅在展示时保留至多 6 位小数并去除尾随 0，以避免长小数影响阅读。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-based percentage tool covering three everyday cases: Y% of X, what percent X is of Y, and the percentage increase or decrease from Y to X, with live updates and clear messages for invalid input or division by zero.',
        coreFeatures: [
          'Three modes: percentage of a value, ratio, and percentage change, switched with segmented buttons',
          'Live calculation: results update as you type, no button required',
          'Smart hints: an empty state for blank or invalid input, and a clear warning on division by zero',
          'Trend tag: the change mode tags results as increase, decrease, or no change',
          'Precision control: full-precision math internally, displayed with up to 6 decimals and trailing zeros trimmed',
          '100% local: everything runs in your browser and no network request is ever made',
        ],
        howToUse: [
          'Use the top buttons to pick the percentage operation you need',
          'Enter decimal numbers (decimals and negatives are supported); the result updates instantly',
          'In change mode, mind the order of the "after" and "before" inputs',
        ],
        useCases: [
          'Shopping discounts: quickly find discounted prices and savings',
          'Finance: calculate growth rates, decline rates, and completion ratios',
          'Everyday math: find what share a part is of a whole, or reverse it',
        ],
        privacyNote:
          'All calculations run locally in your browser; the numbers you enter are never uploaded or logged.',
        faqs: [
          {
            question: 'Why is there no result when the "before" value is 0?',
            answer:
              'Percentage change is (after − before) ÷ before × 100%. When "before" is 0 the value is mathematically undefined, so the tool shows a hint instead of a result.',
          },
          {
            question: 'Why are some decimal digits trimmed?',
            answer:
              'Calculations always use full precision internally; only the display keeps up to 6 decimals and trims trailing zeros for readability.',
          },
        ],
      },
    },
  },
  {
    slug: 'css-unit-converter',
    name: 'CSS 单位换算（px / rem / em / pt）',
    nameEn: 'CSS Unit Converter (px / rem / em / pt)',
    description:
      '在 px、rem、em、pt 之间实时互转，可自定义根字号与父级字号基准，并提供常用 px 值四单位对照表，适配设计稿还原与响应式开发。',
    descriptionEn:
      'Convert between px, rem, em, and pt in real time with customizable root and parent font sizes, plus a quick-reference scale table for design-to-code and responsive workflows.',
    category: ToolCategoryEnum.DESIGN_COLOR,
    path: '/tools/css-unit-converter',
    iconName: 'Pipette',
    tags: ['CSS', '单位换算', 'px', 'rem', 'em', 'pt', '响应式'],
    tagsEn: ['CSS', 'Unit', 'px', 'rem', 'em', 'pt', 'Responsive'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的 CSS 长度单位换算工具，以 px 为内部基准（1in = 96px = 72pt），支持 px / rem / em / pt 四向互转，根字号与父级字号可调，并给出常用数值对照表。',
        coreFeatures: [
          '四向互转：px / rem / em / pt 任一作为源，实时输出其余三个单位',
          '基准可调：根字号（rem 基准）与父级字号（em 基准）均可自定义',
          '对照表：1–48px 常用数值对应的 rem / em / pt 一览',
          '实时联动：修改数值或基准后所有结果即时刷新',
          '严谨提示：基准为空、非数字或小于等于 0 时明确警示',
          '纯本地运行：所有运算在浏览器内完成，绝不发起任何网络请求',
        ],
        howToUse: [
          '输入数值并选择源单位，其余三个单位结果即时展示',
          '按项目设置修改根字号（rem 基准）与父级字号（em 基准）',
          '在下方对照表中快速查阅常用 px 值的换算结果',
        ],
        useCases: [
          '设计稿还原：按设计稿根字号在 px 与 rem 之间快速换算',
          '响应式适配：确认不同基准下 rem / em 的实际像素值',
          '排版校对：在 pt 与 px 之间换算打印或设计软件数值',
        ],
        privacyNote:
          '所有换算均在浏览器本地完成，输入的数值不会被上传或记录。',
        faqs: [
          {
            question: 'rem 和 em 的区别是什么？',
            answer:
              'rem 相对于根元素（html）的字号，em 相对于当前元素继承到的字号；工具中分别用「根字号」与「父级字号」两个基准计算。',
          },
          {
            question: '为什么基准必须大于 0？',
            answer:
              'rem 与 em 的换算需要用数值除以基准字号，基准为 0 时数学上未定义，非正数也没有实际排版意义，因此会提示修正。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-based CSS length converter using px as the internal base (1in = 96px = 72pt). It converts between px, rem, em, and pt in every direction with adjustable root and parent font sizes and a quick-reference scale table.',
        coreFeatures: [
          'All-direction conversion: pick any of px / rem / em / pt as the source and see the other three instantly',
          'Adjustable bases: customize the root font size (rem) and parent font size (em)',
          'Scale table: common 1–48px values mapped to rem, em, and pt',
          'Live updates: results refresh immediately when values or bases change',
          'Strict validation: clear warnings for empty, non-numeric, or non-positive bases',
          '100% local: everything runs in your browser and no network request is ever made',
        ],
        howToUse: [
          'Enter a value and choose the source unit; the other three units update instantly',
          'Set the root font size (rem base) and parent font size (em base) to match your project',
          'Use the scale table below to look up common px values at a glance',
        ],
        useCases: [
          'Design handoff: convert px to rem with the design root font size',
          'Responsive layouts: verify actual pixels of rem/em under different bases',
          'Typography checks: convert pt values from print or design tools to px',
        ],
        privacyNote:
          'All conversions run locally in your browser; entered values are never uploaded or logged.',
        faqs: [
          {
            question: 'What is the difference between rem and em?',
            answer:
              'rem is relative to the root (html) font size, while em is relative to the font size inherited by the current element. The tool computes them with separate "root" and "parent" bases.',
          },
          {
            question: 'Why must the base be greater than 0?',
            answer:
              'rem and em conversion divides by the base font size. A zero base is mathematically undefined, and non-positive values have no typographic meaning, so a warning is shown.',
          },
        ],
      },
    },
  },
  {
    slug: 'list-set-operations',
    name: '列表集合运算（交集 / 并集 / 差集）',
    nameEn: 'List Set Operations',
    description:
      '对两段逐行列表执行交集、并集、左右差集与对称差集运算，支持忽略空白、忽略大小写与结果去重开关，适用于账号、权限、ID 等清单的差异比对。',
    descriptionEn:
      'Compute intersection, union, left/right difference, and symmetric difference between two line-by-line lists, with options to trim whitespace, ignore case, and deduplicate — ideal for comparing accounts, permissions, and ID lists.',
    category: ToolCategoryEnum.TEXT_CONTENT,
    path: '/tools/list-set-operations',
    iconName: 'Layers',
    tags: ['集合', '交集', '并集', '差集', '列表', '比对'],
    tagsEn: ['Set', 'Intersection', 'Union', 'Difference', 'List', 'Compare'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的双列表集合工具，对两段每行一项的文本列表执行交集、并集、仅左侧独有、仅右侧独有与对称差集五种运算，并统计每个结果集的条目数量。',
        coreFeatures: [
          '五种运算：交集、并集、A−B、B−A、对称差集同屏展示',
          '预处理开关：忽略首尾空白、忽略大小写，比较前两侧统一归一',
          '重复项语义：结果去重可开关，关闭时保留基准列表中的重复次数',
          '稳定保序：结果一律按在 A / B 中首次出现的顺序排列',
          '实时联动：输入或开关变化即刻重算，每个结果区可一键复制',
          '纯本地运行：所有运算在浏览器内完成，绝不发起任何网络请求',
        ],
        howToUse: [
          '在两个文本框中分别粘贴列表 A 与列表 B，每行一项',
          '按需切换「忽略首尾空白」「忽略大小写」「结果去重」开关',
          '查看五个结果区的条目与计数，使用复制按钮导出结果',
        ],
        useCases: [
          '权限核对：比对两人或两环境的账号、权限、标签差异',
          '数据清洗：找出两份 ID / 邮箱清单的重合与遗漏项',
          '发布检查：对比灰度名单与全量名单，确认覆盖范围',
        ],
        privacyNote:
          '所有列表与运算均在浏览器本地完成，粘贴的清单内容不会被上传或记录。',
        faqs: [
          {
            question: '关闭「结果去重」后重复项如何处理？',
            answer:
              '命中的交集项以列表 A 为基准，保留其在 A 中全部重复次数；差集保留两侧相减后剩余的次数，顺序仍以对应基准列表（A 或 B）中首次出现的位置为准。',
          },
          {
            question: '空行和首尾空白会参与比较吗？',
            answer:
              '「忽略首尾空白」开启（默认）时每行先 trim，trim 后为空的行直接丢弃；关闭后空白行会被视为空字符串条目。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-based tool for two line-by-line lists. It computes intersection, union, left-only, right-only, and symmetric difference, and counts the items in every result set.',
        coreFeatures: [
          'Five operations at once: intersection, union, A−B, B−A, and symmetric difference',
          'Preprocessing toggles: trim whitespace and ignore case normalize both sides before comparing',
          'Duplicate semantics: deduplication can be switched off to keep multiplicities from the base list',
          'Stable ordering: results always follow first-occurrence order in A or B',
          'Live recomputation on every input or toggle change, with copy buttons per result',
          '100% local: everything runs in your browser and no network request is ever made',
        ],
        howToUse: [
          'Paste list A and list B into the two text areas, one item per line',
          'Toggle "Trim whitespace", "Ignore case", and "Deduplicate results" as needed',
          'Review the five result sets with counts and export any of them with the copy button',
        ],
        useCases: [
          'Access reviews: compare accounts, permissions, or tags across people or environments',
          'Data cleanup: find overlaps and missing entries between ID or email lists',
          'Rollout checks: compare canary and full-rollout lists to confirm coverage',
        ],
        privacyNote:
          'All lists and calculations stay in your browser. Pasted content is never uploaded or logged.',
        faqs: [
          {
            question: 'How are duplicates handled when deduplication is off?',
            answer:
              'Matched intersection items follow list A and keep all of its repetitions; differences keep the remainder after subtraction, and ordering still follows first occurrence in the base list (A or B).',
          },
          {
            question: 'Do blank lines and surrounding spaces participate in comparison?',
            answer:
              'With "Trim whitespace" on (default), each line is trimmed first and lines that become empty are dropped. When off, blank lines are treated as empty-string items.',
          },
        ],
      },
    },
  },
  {
    slug: 'hash-type-identifier',
    name: '哈希类型识别器',
    nameEn: 'Hash Type Identifier',
    description:
      '粘贴一段散列值，依据 crypt(3) 前缀结构与十六进制长度推断候选算法，覆盖 MD5、SHA-1/224/256/384/512、CRC32、bcrypt 与各类 crypt 加盐格式，并给出 high/medium/low 置信度与歧义说明。',
    descriptionEn:
      'Paste a hash and infer candidate algorithms from its crypt(3) prefix structure and hex length — covering MD5, SHA-1/224/256/384/512, CRC32, bcrypt, and crypt salted formats — with high/medium/low confidence and ambiguity notes.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/hash-type-identifier',
    iconName: 'Fingerprint',
    tags: ['哈希', '算法识别', 'MD5', 'SHA', 'bcrypt', 'crypt'],
    tagsEn: ['Hash', 'Algorithm Detection', 'MD5', 'SHA', 'bcrypt', 'crypt'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的哈希类型识别工具：输入一段散列值，它依据 $ 分隔的 crypt 前缀结构与纯十六进制摘要长度，列出可能的算法候选及置信度，而非给出武断的单一结论。',
        coreFeatures: [
          'crypt(3) 前缀优先：识别 $1$、$apr1$、$5$（可选 rounds）、$6$、$2[aby]?$ 等加盐格式',
          '长度规则：32/40/56/64/96/128 位对应 MD5 与 SHA 系列，8 位提示 CRC32',
          '歧义标注：32 位同时列出 MD5（高）与 NTLM/MD4（低），8 位提示可能是截断摘要',
          'bcrypt cost 校验：cost 超出 4–31 常见范围时置信度降级为中',
          '自动归一：去除首尾空白、不区分大小写，输入即识别',
          '纯本地运行：识别过程不发起任何网络请求，不持久化输入',
        ],
        howToUse: [
          '在输入框粘贴待识别的散列值（支持带前后空白或大写形式）',
          '工具即时列出候选算法，按置信度从高到低排列',
          '阅读每条候选的判定依据；低置信度表示仅凭长度无法确认',
        ],
        useCases: [
          '应急分析：拿到未知来源的散列值时快速缩小算法范围',
          'CTF 与安全研究：区分裸 MD5/SHA 与 crypt、bcrypt 加盐结构',
          '数据迁移：核对旧系统密码字段的存储格式',
        ],
        privacyNote:
          '所有识别均在浏览器本地完成，粘贴的散列值不会被上传、记录或持久化。',
        faqs: [
          {
            question: '为什么 32 位哈希同时给出 MD5 和 NTLM/MD4？',
            answer:
              'MD5、NTLM（MD4）摘要同为 32 位十六进制，仅凭摘要本身无法区分，因此 MD5 标为高置信度候选，NTLM/MD4 作为等长低置信度候选一并列出。',
          },
          {
            question: '识别结果能否作为算法的最终确认？',
            answer:
              '不能。本工具只依据结构与长度推断，无法逆向验证算法；加盐自定义格式、RIPEMD 等冷门算法无结构特征时会提示无法识别。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-based hash type identifier: paste a digest and it lists candidate algorithms with confidence levels based on $-delimited crypt prefixes or plain hex length, instead of jumping to a single arbitrary verdict.',
        coreFeatures: [
          'crypt(3) prefix first: recognizes $1$, $apr1$, $5$ (optional rounds), $6$, and $2[aby]?$ salted formats',
          'Length rules: 32/40/56/64/96/128 hex chars map to MD5 and the SHA family; 8 chars suggest CRC32',
          'Ambiguity notes: 32 chars list MD5 (high) plus NTLM/MD4 (low); 8 chars warn it may be a truncated digest',
          'bcrypt cost check: confidence drops to medium when cost is outside the usual 4–31 range',
          'Automatic normalization: trims surrounding whitespace, ignores case, and detects as you type',
          '100% local: detection makes no network request and never persists input',
        ],
        howToUse: [
          'Paste the hash into the input field (leading/trailing whitespace and uppercase are fine)',
          'Candidate algorithms appear instantly, ordered by confidence',
          'Read the rationale for each candidate; low confidence means length alone cannot confirm it',
        ],
        useCases: [
          'Incident analysis: quickly narrow down the algorithm of a hash from an unknown source',
          'CTF and security research: tell raw MD5/SHA apart from crypt and bcrypt salted structures',
          'Data migration: inspect password storage formats in legacy systems',
        ],
        privacyNote:
          'All detection runs locally in your browser. Pasted hashes are never uploaded, logged, or persisted.',
        faqs: [
          {
            question: 'Why does a 32-character hash return MD5 together with NTLM/MD4?',
            answer:
              'MD5 and NTLM (MD4) digests are all 32 hex characters and cannot be distinguished from the digest alone, so MD5 is shown as the high-confidence candidate while NTLM/MD4 are listed as equal-length low-confidence candidates.',
          },
          {
            question: 'Can the result be treated as a definitive algorithm confirmation?',
            answer:
              'No. The tool only infers from structure and length and cannot verify an algorithm by reversal; custom salted formats or uncommon algorithms such as RIPEMD without structural features are reported as unrecognized.',
          },
        ],
      },
    },
  },
  {
    slug: 'chmod-calculator',
    name: 'chmod 权限计算器',
    nameEn: 'chmod Permission Calculator',
    description:
      '在 3 位八进制数字（如 755）、9 字符符号串（如 rwxr-xr-x）与读/写/执行勾选网格之间三向联动换算，并实时生成可复制的 chmod 命令，文件名可编辑，用于服务器权限排查与设置。',
    descriptionEn:
      'Convert between 3-digit octal modes (e.g. 755), 9-character symbolic strings (e.g. rwxr-xr-x), and a read/write/execute checkbox grid, with a live, copyable chmod command and an editable file name — built for server permission troubleshooting.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/chmod-calculator',
    iconName: 'Lock',
    tags: ['chmod', '权限', 'Unix', 'Linux', '八进制', '运维'],
    tagsEn: ['chmod', 'Permissions', 'Unix', 'Linux', 'Octal', 'DevOps'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的 Unix 文件权限换算工具，覆盖属主 / 属组 / 其他三类角色与读（4）/ 写（2）/ 执行（1）三种权限，共基础 9 个权限位，并即时生成 chmod 命令文本。',
        coreFeatures: [
          '三向联动：勾选网格、八进制数字、符号串任一变化实时刷新其余两者',
          '典型值覆盖：755、644、000、777、400 等常见模式即时换算',
          '严格校验：数字限 3 位 0–7 八进制，符号限 9 字符且按 r/w/x 顺序',
          '非法输入提示：格式错误时明确告警且不破坏当前权限网格',
          '命令生成：输出形如 chmod 755 myfile.txt 的命令，文件名可编辑、一键复制',
          '纯本地运行：不执行任何系统命令，不发起网络请求',
        ],
        howToUse: [
          '直接勾选三类角色的读 / 写 / 执行位，或在数字框输入 3 位八进制、在符号框输入 9 字符符号串',
          '三种表示会自动保持同步，非法输入会在失焦后回填为当前有效值',
          '在命令区编辑目标文件名，复制生成的 chmod 命令到终端使用',
        ],
        useCases: [
          '部署排障：快速确认 Web 目录 755 / 文件 644 等权限是否正确',
          '脚本授权：给可执行脚本添加属主执行位并查看对应数字模式',
          '运维教学：直观理解 rwx 符号与 4/2/1 权重、三组角色的对应关系',
        ],
        privacyNote:
          '所有换算均在浏览器本地完成，文件名与权限设置不会被上传或记录，工具不会执行任何系统命令。',
        faqs: [
          {
            question: '支持 setuid、setgid、sticky 等特殊位吗？',
            answer:
              '不支持。本工具仅覆盖基础 9 个权限位（三组 rwx），暂不处理 4 位数字模式中的特殊位，也不支持 u+x 风格的符号赋值语法。',
          },
          {
            question: '为什么输入含空格的文件名无法生成命令？',
            answer:
              '为保证生成的命令可直接粘贴执行，文件名不允许包含空白；如需对含空格的文件使用 chmod，请在终端中自行为文件名加引号。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-based Unix file permission converter covering owner / group / other roles and read (4) / write (2) / execute (1) permissions — the nine basic permission bits — with an instantly generated chmod command.',
        coreFeatures: [
          'Three-way sync: editing the checkbox grid, octal number, or symbolic string updates the other two live',
          'Common modes: 755, 644, 000, 777, 400 and more convert instantly',
          'Strict validation: the number must be 3 octal digits (0–7), the symbolic string 9 characters in r/w/x order',
          'Invalid-input handling: clear warnings without corrupting the current permission grid',
          'Command builder: outputs commands like chmod 755 myfile.txt with an editable, copyable file name',
          '100% local: no system commands are executed and no network requests are made',
        ],
        howToUse: [
          'Toggle read/write/execute bits for the three roles, or type a 3-digit octal mode / 9-character symbolic string',
          'All three representations stay in sync; invalid input reverts to the current valid value on blur',
          'Edit the target file name in the command panel and copy the generated chmod command into your terminal',
        ],
        useCases: [
          'Deployment troubleshooting: quickly verify 755 directories and 644 files on web servers',
          'Script authorization: add the owner execute bit and see the matching numeric mode',
          'Ops training: visualize how rwx symbols, 4/2/1 weights, and the three roles relate',
        ],
        privacyNote:
          'All conversion runs locally in your browser. File names and permission settings are never uploaded or logged, and the tool executes no system commands.',
        faqs: [
          {
            question: 'Does it support setuid, setgid, or sticky bits?',
            answer:
              'No. The tool covers only the nine basic permission bits (three groups of rwx); it does not handle the special bits of 4-digit modes or symbolic assignment syntax such as u+x.',
          },
          {
            question: 'Why cannot a file name containing spaces produce a command?',
            answer:
              'To keep generated commands ready to paste and run, file names cannot contain whitespace; for such files, quote the name yourself when running chmod in a terminal.',
          },
        ],
      },
    },
  },
  {
    slug: 'pkce-generator',
    name: 'OAuth2 PKCE 生成器',
    nameEn: 'OAuth2 PKCE Generator',
    description:
      '生成符合 RFC 7636 的 PKCE 参数对：密码学安全随机 code_verifier（43–128 位 unreserved 字符）与对应 code_challenge（S256 为无填充 BASE64URL(SHA-256)，可选 plain），支持长度切换、手动编辑校验、一键复制与重新生成，用于 OAuth 2.0 授权码流程联调。',
    descriptionEn:
      'Generate RFC 7636 PKCE parameter pairs: a cryptographically random code_verifier (43–128 unreserved characters) and its code_challenge (S256 = unpadded BASE64URL(SHA-256), with plain as a fallback), with length presets, manual-edit validation, one-click copy, and regeneration — built for OAuth 2.0 authorization-code debugging.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/pkce-generator',
    iconName: 'ShieldCheck',
    tags: ['PKCE', 'OAuth2', 'RFC 7636', 'code_verifier', 'code_challenge', 'S256'],
    tagsEn: ['PKCE', 'OAuth2', 'RFC 7636', 'code_verifier', 'code_challenge', 'S256'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的 OAuth 2.0 PKCE（Proof Key for Code Exchange，RFC 7636）参数生成器，使用 Web Crypto 的 CSPRNG 生成 code_verifier，并用 SHA-256 推导 code_challenge，供 SPA、移动端、CLI 等公共客户端在授权码流程中联调使用。',
        coreFeatures: [
          '标准合规：严格按 RFC 7636 §4.1/§4.2 生成 43–128 位 unreserved 字符的 code_verifier',
          '无偏随机：基于 crypto.getRandomValues 的拒绝采样，每个字符等概率出现',
          'S256 派生：输出无填充的 BASE64URL(SHA-256(ASCII(verifier)))，命中 RFC 7636 附录 B 测试向量',
          'plain 兼容：服务端不支持 S256 时可切换 plain 方法（界面明确提示不推荐）',
          '可编辑校验：粘贴已有 code_verifier 时实时校验长度与字符集，非法输入给出具体原因',
          '长度预设：提供 43 / 64 / 96 / 128 位快捷选项与一键重新生成、一键复制',
        ],
        howToUse: [
          '打开工具即自动生成一组合法参数，选择所需的 code_verifier 长度后点击「重新生成」可换一组',
          '保持方法为 S256，将 code_challenge 填入授权请求的 code_challenge 参数，方法名填入 code_challenge_method',
          'code_verifier 只保存在本地，在换取令牌（token endpoint）时原样上送，切勿提前发送或外泄',
          '也可以粘贴已有的 code_verifier，工具会实时校验并推导其 code_challenge',
        ],
        useCases: [
          '前端联调：为 SPA / 移动端的 OAuth 2.0 授权码 + PKCE 流程快速准备合法参数',
          '后端自测：验证授权服务器的 S256 校验逻辑是否符合 RFC 7636',
          '协议学习：直观观察 verifier 与 challenge 的派生关系及 plain / S256 差异',
        ],
        privacyNote:
          '所有随机数生成与 SHA-256 摘要均在浏览器本地通过 Web Crypto 完成，code_verifier 与 code_challenge 不会被上传、记录或持久化。',
        faqs: [
          {
            question: 'S256 和 plain 有什么区别，该选哪个？',
            answer:
              'S256 对 code_verifier 做 SHA-256 后再 base64url 编码，授权链路上只暴露 challenge，能防截获，是 RFC 7636 的强制推荐；plain 直接上送原文，仅在服务端不支持 S256 时临时使用。',
          },
          {
            question: 'code_verifier 为什么必须是 43 位以上？',
            answer:
              'RFC 7636 §4.1 规定 code_verifier 长度为 43–128 位，且只能使用 A-Z、a-z、0-9 与 - . _ ~；43 位取自 68 字符表时可提供约 256 位熵，保证拦截者无法暴力猜测。',
          },
          {
            question: '每次重新生成后旧参数还能用吗？',
            answer:
              '不能。授权请求中登记的 code_challenge 必须与换取令牌时上送的 code_verifier 配对，请对同一次授权流程固定使用同一组参数，不要在流程中途重新生成。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-local generator for OAuth 2.0 PKCE (Proof Key for Code Exchange, RFC 7636). It creates the code_verifier with the Web Crypto CSPRNG and derives the code_challenge with SHA-256, helping public clients such as SPAs, mobile apps, and CLIs debug the authorization-code flow.',
        coreFeatures: [
          'Standards-compliant: code_verifier uses 43–128 unreserved characters exactly per RFC 7636 §4.1/§4.2',
          'Unbiased randomness: rejection sampling over crypto.getRandomValues makes every character equiprobable',
          'S256 derivation: outputs unpadded BASE64URL(SHA-256(ASCII(verifier))), matching RFC 7636 Appendix B',
          'plain fallback: switch to plain when the server lacks S256 support (clearly marked as discouraged)',
          'Editable validation: pasting an existing verifier checks length and charset live, with specific error reasons',
          'Length presets: 43 / 64 / 96 / 128 characters, plus one-click regeneration and copy',
        ],
        howToUse: [
          'A valid pair is generated on open; pick a verifier length and click "Regenerate" for a new pair',
          'Keep S256 selected, put code_challenge into the authorization request and S256 into code_challenge_method',
          'Keep code_verifier local and send it unchanged only at the token endpoint — never send or leak it earlier',
          'You can also paste an existing code_verifier; the tool validates it live and derives its challenge',
        ],
        useCases: [
          'Frontend debugging: prepare valid parameters for OAuth 2.0 authorization-code + PKCE flows in SPAs and mobile apps',
          'Backend testing: verify an authorization server implements S256 checks per RFC 7636',
          'Protocol learning: visualize the verifier-to-challenge derivation and the plain vs S256 difference',
        ],
        privacyNote:
          'All random generation and SHA-256 hashing run locally in your browser via Web Crypto; the code_verifier and code_challenge are never uploaded, logged, or persisted.',
        faqs: [
          {
            question: 'What is the difference between S256 and plain?',
            answer:
              'S256 hashes the code_verifier with SHA-256 and base64url-encodes it, exposing only the challenge on the authorization request so interception is mitigated — it is the RFC 7636-mandated default. plain sends the verifier as-is and should be used only temporarily when the server cannot do S256.',
          },
          {
            question: 'Why must the code_verifier be at least 43 characters?',
            answer:
              'RFC 7636 §4.1 requires 43–128 characters from A-Z, a-z, 0-9, and - . _ ~. Forty-three characters from a 68-symbol alphabet provide about 256 bits of entropy, making brute-force guessing by an interceptor infeasible.',
          },
          {
            question: 'Does an old pair still work after I regenerate?',
            answer:
              'No. The code_challenge registered in the authorization request must match the code_verifier sent at token exchange. Keep one fixed pair per authorization flow and never regenerate midway through it.',
          },
        ],
      },
    },
  },
  {
    slug: 'base58-codec',
    name: 'Base58 / Base58Check 编解码',
    nameEn: 'Base58 & Base58Check Encoder & Decoder',
    description:
      '在文本与 Base58 之间双向编解码，并支持带版本前缀与 4 字节 double-SHA256 校验和的 Base58Check（比特币地址、IPFS CID、XRP 地址等），可切换 Bitcoin / Flickr / Ripple 三种字母表，非法字符与校验和失败均有明确提示。',
    descriptionEn:
      'Encode and decode text with Base58, plus Base58Check with a version prefix and a 4-byte double-SHA256 checksum (Bitcoin addresses, IPFS CIDs, XRP addresses), with switchable Bitcoin / Flickr / Ripple alphabets and clear errors for bad characters or checksum mismatch.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/base58-codec',
    iconName: 'Fingerprint',
    tags: ['Base58', 'Base58Check', '比特币', 'Bitcoin', 'IPFS', 'XRP', '编解码'],
    tagsEn: ['Base58', 'Base58Check', 'Bitcoin', 'IPFS', 'XRP', 'Codec'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的 Base58 系列编解码工具。Base58 在 Base62 的基础上再去掉易混的 0、O、I、l，是比特币地址、IPFS CID 等的通用表示；Base58Check 进一步附加 1 字节版本前缀与 4 字节 double-SHA256 校验和，可发现抄写或传输错误。',
        coreFeatures: [
          '三向模式：Base58 文本互转、Base58Check 编码、Base58Check 解码校验',
          '三种字母表：Bitcoin / IPFS 标准表、Flickr 表、Ripple / XRP Ledger 表',
          '严格校验：字母表外字符给出具体位置，Base58Check 校验和不匹配时明确告警',
          'UTF-8 支持：文本按 UTF-8 编码；解码结果非合法 UTF-8 时同时给出原始十六进制字节',
          '十六进制载荷：Base58Check 模式以 hex 编辑载荷与版本字节（0x00 P2PKH / 0x05 P2SH）',
          '纯本地运行：SHA-256 经 Web Crypto 完成，不发起网络请求',
        ],
        howToUse: [
          '选择字母表（一般区块链地址保持默认 Bitcoin 表，XRP 地址切换 Ripple 表）',
          '「Base58 文本编码」模式下直接输入文本或粘贴 Base58 并切换编 / 解方向',
          '「Base58Check 编码」模式下输入偶数长度十六进制载荷与版本字节，即时生成地址样式字符串',
          '「Base58Check 解码」模式下粘贴地址，可查看版本字节、载荷 hex 与校验和是否通过',
        ],
        useCases: [
          '区块链开发：手工构造 / 解析 P2PKH、P2SH 地址，验证地址抄写是否正确',
          'IPFS / 分布式系统：在 CID 片段与原始字节、十六进制之间转换',
          '协议学习：理解前导零保留（1）、版本前缀与校验和的作用',
        ],
        privacyNote:
          '所有编码、解码与 SHA-256 校验和均在浏览器本地完成，输入文本、地址与密钥材料不会被上传或记录。',
        faqs: [
          {
            question: 'Base58 和 Base64 有什么区别？',
            answer:
              'Base58 去掉了 0、O、I、l 以及 +、/ 等肉眼或抄写时易混淆的字符，且没有填充符；它也不是 2 的幂进制，需按大整数（BigInt）逐字节换算。代价是相同数据编码后略长于 Base64。',
          },
          {
            question: '为什么解出来不是正常文本？',
            answer:
              '地址、哈希等 Base58 内容本来就是任意字节而非 UTF-8 文本，工具会在报错时同时给出解码字节的十六进制表示；Base58Check 场景请直接使用「解码校验」模式查看版本字节与载荷 hex。',
          },
          {
            question: 'Base58Check 的版本字节是什么？',
            answer:
              '编码数据的第一字节，用于区分数据类型与网络：比特币主网 P2PKH 地址为 0x00（地址以 1 开头）、P2SH 为 0x05（以 3 开头）；其后再附 4 字节 double-SHA256 校验和。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-local Base58 family codec. Base58 removes the easily confused 0, O, I, and l from Base62 and is used by Bitcoin addresses and IPFS CIDs; Base58Check adds a 1-byte version prefix and a 4-byte double-SHA256 checksum so transcription errors are detectable.',
        coreFeatures: [
          'Three modes: Base58 text codec, Base58Check encode, and Base58Check decode with verification',
          'Three alphabets: Bitcoin / IPFS standard, Flickr, and Ripple / XRP Ledger',
          'Strict validation: out-of-alphabet characters report their position, and Base58Check checksum failures raise a clear warning',
          'UTF-8 aware: text is encoded as UTF-8; non-UTF-8 decode results still show the raw hex bytes',
          'Hex payload: edit payload and version byte (0x00 P2PKH / 0x05 P2SH) in Base58Check mode',
          '100% local: SHA-256 runs through Web Crypto with no network requests',
        ],
        howToUse: [
          'Pick an alphabet (keep the default Bitcoin table for most chains; switch to Ripple for XRP addresses)',
          'In "Base58 text codec", type text or paste Base58 and toggle the encode / decode direction',
          'In "Base58Check encode", enter an even-length hex payload and a version byte to get an address-style string',
          'In "Base58Check decode", paste an address to inspect its version byte, payload hex, and checksum',
        ],
        useCases: [
          'Blockchain development: manually build or parse P2PKH / P2SH addresses and verify transcriptions',
          'IPFS / distributed systems: convert CID fragments to and from raw bytes or hexadecimal',
          'Protocol learning: see leading-zero preservation (1), version prefixes, and checksums in action',
        ],
        privacyNote:
          'All encoding, decoding, and SHA-256 checksums run locally in your browser. Input text, addresses, and key material are never uploaded or logged.',
        faqs: [
          {
            question: 'How is Base58 different from Base64?',
            answer:
              'Base58 drops 0, O, I, l, +, and / — characters that are easy to confuse when read or copied — and has no padding. Because 58 is not a power of two, conversion uses big-integer (BigInt) arithmetic per byte, so the output is slightly longer than Base64 for the same data.',
          },
          {
            question: 'Why does decoding not produce readable text?',
            answer:
              'Base58 content such as addresses and hashes is arbitrary bytes rather than UTF-8 text. The tool shows the decoded bytes in hexadecimal alongside the error; for Base58Check data use the dedicated decode mode to inspect version and payload hex.',
          },
          {
            question: 'What is the Base58Check version byte?',
            answer:
              'The first byte of the encoded payload, identifying network and data type: Bitcoin mainnet P2PKH is 0x00 (addresses start with 1) and P2SH is 0x05 (starts with 3). Four bytes of double-SHA256 checksum follow the payload.',
          },
        ],
      },
    },
  },
  {
    slug: 'chinese-currency',
    name: '数字转中文大写金额',
    nameEn: 'Number to Chinese RMB Amount',
    description:
      '将阿拉伯数字金额实时转换为人民币中文大写（壹贰叁、元角分、整），用于发票、收据与合同填写；正确处理零、连续零、万 / 亿节进位与角分边界，支持千分位逗号，两位以上小数自动四舍五入到分。',
    descriptionEn:
      'Convert numeric amounts into formal Chinese RMB uppercase text (壹贰叁, 元角分, 整) for invoices, receipts, and contracts, with correct handling of zeros, ten-thousand / hundred-million sections, and jiao/fen boundaries, thousands separators, and rounding to cents.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/chinese-currency',
    iconName: 'Gauge',
    tags: ['中文大写', '人民币', '金额', '发票', '财务', '元角分'],
    tagsEn: ['Chinese Uppercase', 'RMB', 'Currency', 'Invoice', 'Finance'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的金额大写转换工具，把阿拉伯数字金额转换为票据规范的中文大写人民币，覆盖零、连续零、万 / 亿节单位、角分与「整」字等中文金额书写难点，输入即转换。',
        coreFeatures: [
          '实时转换：输入阿拉伯数字即时输出中文大写，无需点击',
          '边界完整：零元、整元、有角无分、有分、角为零均按票据规范处理',
          '大节进位：按 4 位分节正确处理万、亿、万亿（最高 16 位整数）',
          '容错输入：允许首尾空白与标准千分位逗号，三位以上小数四舍五入到分',
          '明确提示：非法字符、负数、超长整数给出可读错误',
          '纯本地运行：不发起任何网络请求，合同金额不出本机',
        ],
        howToUse: [
          '在输入框填写阿拉伯数字金额（如 12345.67），可点击示例快速填充',
          '结果区即时显示中文大写，点击「复制」即可粘贴到发票或合同',
          '千分位逗号（如 1,234.56）可直接粘贴，无需手工去除',
          '超过两位小数时自动按分四舍五入；整数金额末尾自动补「整」',
        ],
        useCases: [
          '财务开票：填写发票、收据、报销单上的人民币大写栏',
          '合同与公文：撰写合同金额条款、支票与结算凭证',
          '学习核对：验证已有大写金额书写是否规范',
        ],
        privacyNote:
          '所有转换均在浏览器本地完成，金额数字不会被上传或记录。',
        faqs: [
          {
            question: '为什么有的金额后面有「整」，有的没有？',
            answer:
              '按票据填写规范，金额到「元」为止时在元后写「整」；到「角」为止时角后可以不写「整」（本工具统一省略）；有「分」时分后不写「整」。',
          },
          {
            question: '0.05 元为什么是「伍分」而不是「零元零角伍分」？',
            answer:
              '整数部分为零时不输出「零元」；角为零而分非零时，若存在整数部分会用「零」连接（如 1.05 → 壹元零伍分），纯角分金额直接输出「伍分」。',
          },
          {
            question: '支持的最大金额是多少？',
            answer:
              '整数部分最多 16 位（即壹仟万亿元以内），小数最多 2 位；超出范围会给出明确提示，避免节单位（万、亿）歧义。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-local converter that turns numeric amounts into formal Chinese RMB uppercase wording used on financial vouchers, covering zeros, ten-thousand / hundred-million section units, jiao/fen, and the trailing 整 marker, with instant conversion.',
        coreFeatures: [
          'Instant conversion: Arabic numerals become Chinese uppercase text as you type',
          'Complete edge cases: zero, whole yuan, jiao without fen, fen present, and zero jiao follow voucher conventions',
          'Large sections: groups digits by four with correct 万 / 亿 / 万亿 units (up to 16 integer digits)',
          'Forgiving input: surrounding whitespace and standard thousands commas are accepted; extra decimals round to fen',
          'Clear errors: illegal characters, negative values, and oversized integers are explained',
          '100% local: no network requests, contract amounts never leave the device',
        ],
        howToUse: [
          'Type an Arabic-numeral amount (e.g. 12345.67) or click an example chip',
          'The result area shows the Chinese uppercase wording instantly; click Copy to paste it onto an invoice or contract',
          'Thousands separators such as 1,234.56 can be pasted directly',
          'More than two decimal places are rounded to fen; whole-yuan amounts automatically end with 整',
        ],
        useCases: [
          'Invoicing: fill the RMB uppercase field on invoices, receipts, and expense claims',
          'Contracts and vouchers: draft amount clauses, cheques, and settlement documents',
          'Review and learning: verify whether an existing uppercase amount is written correctly',
        ],
        privacyNote:
          'All conversion runs locally in your browser; amount figures are never uploaded or logged.',
        faqs: [
          {
            question: 'When is 整 appended at the end?',
            answer:
              'Per Chinese voucher conventions, 整 follows 元 for whole-yuan amounts; it may be omitted after 角 when there is no fen, and never follows 分. This tool follows that convention consistently.',
          },
          {
            question: 'Why is 0.05 just 伍分, without 零元?',
            answer:
              'When the integer part is zero, 零元 is omitted. When jiao is zero but fen is present and an integer part exists, 零 links the two, as in 1.05 → 壹元零伍分; a pure jiao/fen amount is rendered directly as 伍分.',
          },
          {
            question: 'What is the maximum supported amount?',
            answer:
              'Up to 16 integer digits (within one thousand trillion yuan) and 2 decimal places. Larger input raises a clear message to avoid ambiguity around section units (万, 亿).',
          },
        ],
      },
    },
  },
  {
    slug: 'json-flatten',
    name: 'JSON 扁平化 / 还原',
    nameEn: 'JSON Flatten / Unflatten',
    description:
      '在嵌套 JSON 与点路径单层键值 JSON 之间双向转换（如 a.b[0].c ↔ 嵌套对象），支持自定义分隔符、数组展开开关与根数组，路径冲突（如 a 与 a.b 并存）给出明确报错；纯浏览器本地运算。',
    descriptionEn:
      'Bidirectionally convert between nested JSON and dot-path flat key-value JSON (e.g. a.b[0].c), with custom separators, an array-expansion toggle, root-array support, and clear path-conflict errors (a vs a.b). Runs entirely in your browser.',
    category: ToolCategoryEnum.DATA_JSON,
    path: '/tools/json-flatten',
    iconName: 'LayoutGrid',
    tags: ['JSON', '扁平化', 'flatten', '嵌套', '点路径', '数据转换'],
    tagsEn: ['JSON', 'Flatten', 'Unflatten', 'Dot Path', 'Nested', 'Data Transform'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的 JSON 结构转换工具，可把任意嵌套对象 / 数组扁平化为点路径单层键值（如 {"a":{"b":[1]}} → {"a.b[0]":1}），也可把扁平键值无损还原为嵌套结构，常用于数据比对、表格导入导出与配置排查。',
        coreFeatures: [
          '双向转换：扁平化 Flatten 与反向还原 Unflatten 一键切换',
          '数组处理：数组项以 [索引] 标记（如 users[0].name），支持根数组与嵌套数组',
          '自定义分隔符：点号、下划线、斜杠、连字符可选，适配不同扁平化约定',
          '数组开关：可关闭数组展开，把整个数组作为叶子值保留',
          '叶子保留：null、空对象 {}、空数组 [] 等边界值正确保留并可往返还原',
          '冲突检测：同一节点既是叶子又有下级路径（如 a 与 a.b）时给出明确错误',
        ],
        howToUse: [
          '选择方向：「扁平化」把嵌套 JSON 转为单层键值，「还原」执行反向操作',
          '在左侧粘贴 JSON，右侧实时显示转换结果，点击「复制结果」即可使用',
          '通过「分隔符」下拉切换路径连接符；扁平化时可用复选框控制是否展开数组',
          '输入非法 JSON 或还原时路径冲突，结果区会显示具体错误位置与原因',
        ],
        useCases: [
          '数据比对：把深层嵌套 JSON 压平后按路径做字段级 diff',
          '表格互转：与 CSV / Excel 行列结构互导时预处理 JSON 字段',
          '配置排查：快速定位深路径字段、核对环境变量映射（如 a.b.c → A_B_C）',
          '接口调试：理解或构造 Elasticsearch、表单序列化等点路径风格数据',
        ],
        privacyNote:
          '所有解析与转换均在浏览器本地完成，JSON 内容不会被上传或记录。',
        faqs: [
          {
            question: '扁平化后还能无损还原吗？',
            answer:
              '可以。数组以 [数字] 标记、对象键以分隔符连接，还原时按 token 重建对象与数组；null、空对象、空数组都会保留。前提是键路径本身不含与分隔符 / 方括号冲突的歧义，或换用不冲突的分隔符。',
          },
          {
            question: '什么是「路径冲突」？',
            answer:
              '还原时同一路径不能既是叶子又包含下级，例如 {"a":1,"a.b":2} 中 a 已经是数字，无法再容纳键 b。工具会直接报错而不是静默覆盖，避免数据丢失。',
          },
          {
            question: '关闭「展开数组」会怎样？',
            answer:
              '扁平化时数组整体作为一个叶子值保留（如 {"a":[1,2]} 原样保留），对象仍会继续展开；适合下游不支持 [索引] 路径、只需要对象层级压平的场景。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-local tool that flattens arbitrarily nested JSON objects / arrays into single-level dot-path key-value pairs (e.g. {"a":{"b":[1]}} → {"a.b[0]":1}) and unflattens them back losslessly — useful for data comparison, spreadsheet import/export, and config inspection.',
        coreFeatures: [
          'Bidirectional: switch between Flatten and Unflatten instantly',
          'Array paths: array items use [index] markers (e.g. users[0].name), including root and nested arrays',
          'Custom separators: dot, underscore, slash, or hyphen to match different flattening conventions',
          'Array toggle: keep whole arrays as leaf values instead of expanding them',
          'Edge-safe leaves: null, empty objects {}, and empty arrays [] are preserved and survive a round trip',
          'Conflict detection: a node that is both a leaf and has children (e.g. a vs a.b) raises a clear error',
        ],
        howToUse: [
          'Pick a direction: Flatten turns nested JSON into flat key-value pairs; Unflatten reverses it',
          'Paste JSON on the left; the result appears on the right in real time, then click Copy',
          'Switch the path separator from the dropdown; toggle array expansion while flattening',
          'Invalid JSON or unflatten path conflicts produce a specific error in the result panel',
        ],
        useCases: [
          'Data comparison: flatten deep JSON before field-level diffing by path',
          'Spreadsheet exchange: preprocess JSON fields when importing from / exporting to CSV or Excel',
          'Config inspection: locate deep fields and derive environment-variable mappings (a.b.c → A_B_C)',
          'API debugging: work with dot-path styles used by Elasticsearch, form serialization, and similar systems',
        ],
        privacyNote:
          'All parsing and conversion happens locally in your browser; JSON content is never uploaded or logged.',
        faqs: [
          {
            question: 'Is the conversion reversible?',
            answer:
              'Yes. Arrays are marked with [index] and object keys are joined with the separator; unflatten rebuilds objects and arrays, preserving null, empty objects, and empty arrays — provided keys do not ambiguously contain the separator or brackets (choose another separator if they do).',
          },
          {
            question: 'What is a "path conflict"?',
            answer:
              'During unflatten, the same path cannot be both a leaf and contain children, e.g. {"a":1,"a.b":2} makes a a number that cannot also hold b. The tool reports this instead of silently overwriting data.',
          },
          {
            question: 'What happens when array expansion is off?',
            answer:
              'Arrays are kept intact as leaf values while flattening (e.g. {"a":[1,2]} stays as-is), while objects are still expanded — handy when the downstream tool does not understand [index] paths.',
          },
        ],
      },
    },
  },
  {
    slug: 'string-escape',
    name: '字符串字面量转义 / 反转义',
    nameEn: 'String Literal Escape / Unescape',
    description:
      '在多行原始文本与 JavaScript / JSON、Python、Java 字符串字面量之间双向转义（\\n、\\t、\\"、\\xHH、\\uXXXX、\\u{码点}、\\Uxxxxxxxx、代理对），可自动包裹或剥离外层引号；语言不支持的序列给出明确报错，纯浏览器本地运算。',
    descriptionEn:
      'Escape and unescape between raw multiline text and JavaScript / JSON, Python, or Java string literals (\\n, \\t, \\", \\xHH, \\uXXXX, \\u{code point}, \\Uxxxxxxxx, surrogate pairs), with optional quote wrapping/stripping and clear errors for unsupported sequences. Runs entirely in your browser.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/string-escape',
    iconName: 'FileCode',
    tags: ['字符串转义', 'Escape', '字面量', 'JavaScript', 'Python', 'Java'],
    tagsEn: ['String Escape', 'Literal', 'JavaScript', 'Python', 'Java', 'Unicode'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的编程语言字符串转义工具，把含换行、制表符、引号、反斜杠、中文与 emoji 的原始文本转换为可直接粘贴进代码的双引号字面量内容，也可把日志中的 \\n、\\uXXXX 等转义串还原为可读明文；覆盖 JavaScript / JSON、Python、Java 三种主流风格。',
        coreFeatures: [
          '双向转换：原始文本 → 字面量内容（Escape）与字面量内容 → 原始文本（Unescape）一键切换',
          '三种语言：JavaScript / JSON（含 \\/、\\u{码点}）、Python（\\xHH、\\Uxxxxxxxx、\\a、行连接）、Java（\\uXXXX）',
          '完整序列：\\b \\f \\n \\r \\t \\" \\\\ 以及控制字符与非 ASCII 字符',
          'Unicode 完整：BMP 码点输出 \\uXXXX，astral 码点（如 emoji）自动拆成代理对，反转义时重新合并',
          '引号处理：转义结果可选包裹双引号；反转义时自动剥离成对的 "…" / \'…\' / `…` 外层引号',
          '安全报错：孤立反斜杠、位数不足、语言不支持的序列（如 Java 的 \\x）给出具体原因，孤立代理替换为 U+FFFD 而非崩溃',
        ],
        howToUse: [
          '选择转换方向与目标语言，在左侧粘贴原始文本或转义串',
          '右侧实时显示结果，点击「复制结果」即可粘贴进源码或日志分析工具',
          '转义时可用复选框控制是否在外层包裹双引号；反转义时可开关自动剥离外层引号',
          '遇到红色错误面板时，按提示检查反斜杠序列的位数与当前语言是否支持',
        ],
        useCases: [
          '代码开发：把多行文案、正则、SQL 片段安全嵌入 JavaScript / Python / Java 字符串',
          '日志排查：把日志里的 \\n、\\u003c 等转义内容还原为可读明文',
          '接口调试：手工构造或核对 JSON 字符串字段中的转义内容',
          '教学演示：理解不同语言字符串转义规则与 Unicode 代理对编码',
        ],
        privacyNote:
          '所有转义与反转义均在浏览器本地完成，文本内容不会被上传或记录。',
        faqs: [
          {
            question: 'JavaScript / JSON 与 Python、Java 的转义有什么区别？',
            answer:
              '通用短转义（\\n、\\t、\\"、\\\\、\\uXXXX）三者一致；差异在于 JavaScript 额外接受 \\/ 与 \\u{码点}，Python 使用 \\xHH 和 8 位的 \\Uxxxxxxxx 并支持行连接反斜杠，而 Java 只认标准短转义与 4 位 \\uXXXX，不支持 \\x 与 \\u{}。切换语言后工具会按对应规则校验。',
          },
          {
            question: 'emoji 等 4 字节字符会怎样处理？',
            answer:
              '转义时自动编码为一对 UTF-16 代理单元（如 😀 → \\ud83d\\ude00），反转义时识别连续的高 / 低代理并合并回原字符；若只出现孤立的半个代理，则替换为 U+FFFD 替代字符而不是报错中断。',
          },
          {
            question: '输入带引号的完整字面量（如 "a\\nb"）需要先手动去引号吗？',
            answer:
              '不需要。反转义模式默认开启「自动剥离成对外层引号」，会先去掉首尾成对的双引号、单引号或反引号再解析；若你处理的只是字面量内部片段，可关闭该开关。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-local string-literal escaper that converts raw multiline text — with newlines, tabs, quotes, backslashes, CJK characters, and emoji — into double-quoted literal content ready to paste into code, and unescapes log strings such as \\n or \\uXXXX back into readable plaintext. It covers three mainstream dialects: JavaScript / JSON, Python, and Java.',
        coreFeatures: [
          'Bidirectional: switch between Escape (raw text → literal content) and Unescape (literal content → raw text)',
          'Three dialects: JavaScript / JSON (including \\/ and \\u{code point}), Python (\\xHH, \\Uxxxxxxxx, \\a, line continuation), and Java (\\uXXXX)',
          'Complete sequences: \\b \\f \\n \\r \\t \\" \\\\ plus control and non-ASCII characters',
          'Full Unicode: BMP code points become \\uXXXX, astral code points (e.g. emoji) are split into surrogate pairs and recombined when unescaping',
          'Quote handling: optionally wrap escaped output in double quotes; unescape auto-strips matching outer "…", \'…\', or `…` quotes',
          'Safe errors: dangling backslashes, truncated hex digits, and unsupported sequences (e.g. \\x in Java) produce specific messages; lone surrogates become U+FFFD instead of crashing',
        ],
        howToUse: [
          'Pick a direction and a target language, then paste raw text or an escaped string on the left',
          'The result updates on the right in real time; click Copy to paste it into source code or a log analyzer',
          'Toggle outer double-quote wrapping when escaping, or automatic outer-quote stripping when unescaping',
          'When the error panel appears, check the hex digit count and whether the selected language supports the sequence',
        ],
        useCases: [
          'Development: embed multiline copy, regexes, or SQL snippets safely in JavaScript / Python / Java strings',
          'Log analysis: turn \\n and \\u003c style log content back into readable plaintext',
          'API debugging: handcraft or verify escaped JSON string fields',
          'Learning: compare string escape rules and Unicode surrogate-pair encoding across languages',
        ],
        privacyNote:
          'All escaping and unescaping runs locally in your browser; text content is never uploaded or logged.',
        faqs: [
          {
            question: 'How do JavaScript / JSON, Python, and Java escapes differ?',
            answer:
              'Common short escapes (\\n, \\t, \\", \\\\, \\uXXXX) are identical. JavaScript additionally accepts \\/ and \\u{code point}; Python uses \\xHH and 8-digit \\Uxxxxxxxx with line continuation; Java only accepts the standard short escapes and 4-digit \\uXXXX — no \\x or \\u{}. The tool validates against the selected dialect.',
          },
          {
            question: 'How are 4-byte characters such as emoji handled?',
            answer:
              'They are encoded as a UTF-16 surrogate pair (e.g. 😀 → \\ud83d\\ude00). When unescaping, consecutive high/low surrogates are merged back into the original character; a lone half-surrogate becomes U+FFFD instead of aborting the conversion.',
          },
          {
            question: 'Do I have to remove the surrounding quotes from a full literal like "a\\nb"?',
            answer:
              'No. Unescape mode strips matching outer double, single, or backtick quotes automatically before parsing. Turn the toggle off if your input is just the inner fragment without quotes.',
          },
        ],
      },
    },
  },
  {
    slug: 'ascii85-codec',
    name: 'Ascii85（Base85）编解码',
    nameEn: 'Ascii85 (Base85) Encoder & Decoder',
    description:
      '在文本与 Ascii85/Base85 之间双向转换，兼容标准 Adobe/PostScript 变体（<~ ~> 定界、z 压缩）与 btoa v4.2 变体（xbtoa 定界、y=4 空格），自动识别并报告错误位置。',
    descriptionEn:
      'Convert between text and Ascii85/Base85, supporting both the standard Adobe/PostScript variant (<~ ~> delimiters, z shorthand) and the btoa v4.2 variant (xbtoa delimiters, y for four spaces), with auto-detection and position-aware errors.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/ascii85-codec',
    iconName: 'Binary',
    tags: ['Ascii85', 'Base85', '编解码', 'PostScript', 'PDF'],
    tagsEn: ['Ascii85', 'Base85', 'Encode', 'PostScript', 'PDF'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'foobar',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的 Ascii85（Base85）编解码工具，使用 !–u 字母表把文本（按 UTF-8 处理）与 Ascii85 字符串双向转换，兼容 Adobe/PostScript 标准变体与 UNIX btoa v4.2 变体，并对损坏输入给出带位置的错误提示。',
        coreFeatures: [
          '双变体：标准 Ascii85（Adobe，<~ ~> 定界、z=4 零字节压缩）与 btoa v4.2（xbtoa Begin/End 定界，额外支持 y=4 空格）',
          '自动识别：解码时按 <~ ~>、xbtoa Begin/End 定界符或 y 简写自动判断变体，并忽略其中任意空白',
          '严谨尾组：尾组按补位与半档偏置规则还原，与 Python base64.a85decode 向量逐一交叉验证',
          '错误定位：非法字符、缺失定界符、尾组溢出、简写位置错误均给出具体字符位置',
          '纯本地运行：所有转换在浏览器内完成，绝不发起任何网络请求',
        ],
        howToUse: [
          '选择「编码」或「解码」方向，并选择标准 Ascii85 或 btoa v4.2 变体',
          '在输入框粘贴文本或 Ascii85 字符串，结果即时更新',
          '编码时可勾选是否输出定界符、是否启用 z/y 压缩简写；解码时无需手动设置，自动识别',
        ],
        useCases: [
          'PDF/PostScript 调试：解析内容流中的 ASCII85Encode 数据（<~ … ~>）',
          '遗留系统：处理老式 UNIX btoa/atob 工具生成的 xbtoa Begin/End 数据',
          '数据核对：校验 Ascii85 字符串是否合法、定位损坏字符的具体位置',
        ],
        privacyNote: '所有编解码均在浏览器本地完成，输入的文本与 Ascii85 字符串不会被上传或记录。',
        faqs: [
          {
            question: 'Ascii85 和 Base64 有什么区别？',
            answer:
              'Ascii85 用 85 个字符表示数据，每 4 字节编码为 5 个字符，体积仅膨胀 25%，比 Base64 的 33% 更紧凑；它常见于 PDF/PostScript，并支持 z 这样的零字节压缩简写。',
          },
          {
            question: '标准 Ascii85 与 btoa 变体有什么不同？',
            answer:
              '两者使用相同的 !–u 字母表，区别在封装与简写：标准 Ascii85 用 <~ ~> 定界、z 代表 4 个零字节；UNIX btoa v4.2 用 xbtoa Begin/End 定界，除 z 外还额外用 y 代表 4 个空格。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first Ascii85 (Base85) codec that converts between UTF-8 text and Ascii85 strings using the !–u alphabet, compatible with both the Adobe/PostScript variant and the UNIX btoa v4.2 variant, with position-aware errors for corrupted input.',
        coreFeatures: [
          'Two variants: standard Ascii85 (Adobe, <~ ~> delimiters, z for four zero bytes) and btoa v4.2 (xbtoa Begin/End delimiters, plus y for four spaces)',
          'Auto-detection: the decoder detects the variant from <~ ~>, xbtoa Begin/End, or the y shorthand, and ignores any whitespace',
          'Correct tail groups: tails are reconstructed with padding and half-step bias, cross-checked against Python base64.a85decode vectors',
          'Position-aware errors for invalid characters, missing delimiters, tail overflow, and misplaced shorthands',
          'Local-first: all conversion runs in the browser with no network requests',
        ],
        howToUse: [
          'Pick the "Encode" or "Decode" direction and choose standard Ascii85 or btoa v4.2',
          'Paste text or an Ascii85 string and the result updates instantly',
          'When encoding, optionally enable delimiters and z/y shorthands; decoding detects everything automatically',
        ],
        useCases: [
          'PDF/PostScript debugging: parse ASCII85Encode data (<~ … ~>) in content streams',
          'Legacy systems: handle xbtoa Begin/End data produced by old UNIX btoa/atob tools',
          'Data checks: validate Ascii85 strings and locate the exact position of corrupted characters',
        ],
        privacyNote:
          'All encoding and decoding run locally in the browser; entered text and Ascii85 strings are never uploaded or logged.',
        faqs: [
          {
            question: 'How is Ascii85 different from Base64?',
            answer:
              'Ascii85 uses 85 characters and encodes every 4 bytes into 5 characters — only 25% overhead versus 33% for Base64. It is common in PDF/PostScript and supports shorthands such as z for zero bytes.',
          },
          {
            question: 'What differs between standard Ascii85 and the btoa variant?',
            answer:
              'Both share the same !–u alphabet; they differ in wrapping and shorthands. Standard Ascii85 uses <~ ~> delimiters and z for four zero bytes, while UNIX btoa v4.2 uses xbtoa Begin/End and adds y for four spaces.',
          },
        ],
      },
    },
  },
  {
    slug: 'json-ndjson-converter',
    name: 'JSON ↔ NDJSON（JSON Lines）互转',
    nameEn: 'JSON to NDJSON / JSON Lines Converter',
    description:
      '在 JSON 数组与 JSON Lines（NDJSON，每行一个独立 JSON 对象）之间双向转换，兼容日志采集与数据管道的批量导入导出，错误提示精确定位到行号。',
    descriptionEn:
      'Convert between a JSON array and JSON Lines (NDJSON, one JSON value per line), suitable for log ingestion and batch import/export in data pipelines, with line-precise error messages.',
    category: ToolCategoryEnum.DATA_JSON,
    path: '/tools/json-ndjson-converter',
    iconName: 'UnorderedList',
    tags: ['JSON', 'NDJSON', 'JSON Lines', '日志', '数据转换'],
    tagsEn: ['JSON', 'NDJSON', 'JSON Lines', 'Logs', 'Convert'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '[\n  { "id": 1, "name": "Alice" },\n  { "id": 2, "name": "Bob" }\n]',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的 JSON 数组与 JSON Lines（NDJSON）互转工具。JSON Lines 把数组的每个元素独立序列化为一行 JSON，没有外层数组与行尾逗号，是结构化日志与数据管道中的事实标准格式。',
        coreFeatures: [
          '双向转换：JSON 数组逐元素展开为 NDJSON，NDJSON 逐行解析回 JSON 数组',
          '规范输出：JSON → NDJSON 时每条记录紧凑单行，内部换行自动转义，不破坏行结构',
          '容错解析：NDJSON → JSON 时自动忽略空行、兼容 CRLF 与每行前后空白',
          '精确报错：非法 JSON 行直接指出所在行号，便于快速定位脏数据',
          '纯本地运行：所有解析与序列化在浏览器内完成，绝不发起任何网络请求',
        ],
        howToUse: [
          '选择「JSON 数组 → NDJSON」或「NDJSON → JSON 数组」方向',
          '在输入框粘贴内容，输出即时更新；切换方向会自动载入对应示例',
          '点击「复制结果」获取转换内容，或「清空」重新输入',
        ],
        useCases: [
          '结构化日志：把日志系统导出的 NDJSON 聚合成 JSON 数组做查看与二次处理',
          '数据管道：准备 BigQuery、Elasticsearch Bulk 等按行 JSON 记录的导入数据',
          '接口调试：在 JSON 数组与逐行记录格式之间快速互转',
        ],
        privacyNote: '所有转换均在浏览器本地完成，输入的 JSON 数据不会被上传或记录。',
        faqs: [
          {
            question: 'NDJSON 和普通 JSON 文件有什么区别？',
            answer:
              'NDJSON（JSON Lines）没有外层数组和逗号，每一行本身就是一个完整合法的 JSON 值。它特别适合日志这类持续追加的写入场景：单行损坏不影响其他行，且无需读取整个文件就能流式处理。',
          },
          {
            question: '为什么某一行提示不是合法 JSON？',
            answer:
              'NDJSON 要求每行都是完整、紧凑的单行 JSON，不支持跨行对象，也不能带行尾逗号或 JavaScript 风格注释。错误信息会给出具体行号，修正该行后即可继续转换。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first converter between a JSON array and JSON Lines (NDJSON). JSON Lines serializes each array element onto its own line — no wrapping array or trailing commas — making it the de facto format for structured logs and data pipelines.',
        coreFeatures: [
          'Bidirectional: expand a JSON array into NDJSON lines, or parse NDJSON lines back into a JSON array',
          'Spec-compliant output: JSON → NDJSON emits compact single-line records with embedded newlines properly escaped',
          'Tolerant parsing: NDJSON → JSON ignores empty lines, accepts CRLF, and trims surrounding whitespace per line',
          'Line-precise errors: invalid JSON lines are reported with their line number for quick dirty-data location',
          'Local-first: all parsing and serialization run in the browser with no network requests',
        ],
        howToUse: [
          'Choose "JSON array → NDJSON" or "NDJSON → JSON array"',
          'Paste content and the output updates instantly; switching direction loads the matching sample',
          'Use "Copy result" to grab the output, or "Clear" to start over',
        ],
        useCases: [
          'Structured logs: aggregate NDJSON exports from logging systems into a JSON array for inspection',
          'Data pipelines: prepare line-delimited records for BigQuery, Elasticsearch Bulk, and similar imports',
          'API debugging: quickly switch between array payloads and line-delimited record streams',
        ],
        privacyNote:
          'All conversion runs locally in the browser; entered JSON data is never uploaded or logged.',
        faqs: [
          {
            question: 'How is NDJSON different from a regular JSON file?',
            answer:
              'NDJSON (JSON Lines) has no wrapping array or commas: every line is a complete, standalone JSON value. It suits append-only logs well — a corrupted line does not break the others, and the file can be processed as a stream without reading it all.',
          },
          {
            question: 'Why is a line reported as invalid JSON?',
            answer:
              'Each NDJSON line must be complete, compact, single-line JSON with no multi-line objects, trailing commas, or JavaScript-style comments. The error message includes the line number; fix that line and convert again.',
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
