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
  {
    slug: 'uuid-inspector',
    name: 'UUID 解析与校验',
    nameEn: 'UUID Inspector',
    description:
      '批量解析 UUID（RFC 4122 / RFC 9562），识别版本 v1–v8 与 nil/max、判定变体，提取 v1/v2/v6/v7 内嵌时间戳及 v1/v2 节点与时钟序列，并统计重复。',
    descriptionEn:
      'Inspect UUIDs in bulk against RFC 4122 / RFC 9562: detect versions v1–v8 and nil/max, identify the variant, extract timestamps embedded in v1/v2/v6/v7 plus node and clock sequence for v1/v2, and count duplicates.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/uuid-inspector',
    iconName: 'Fingerprint',
    tags: ['UUID', 'GUID', 'RFC 4122', 'RFC 9562', '校验'],
    tagsEn: ['UUID', 'GUID', 'RFC 4122', 'RFC 9562', 'Validator'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput:
      'f81d4fae-7dec-11d0-a765-00a0c91e6bf6\n550e8400-e29b-41d4-a716-446655440000\n017f22e2-79b0-7cc3-98c4-dc0c0c07398f',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的 UUID 解析与批量校验工具。它把一个或多个 UUID 规范化为标准小写连字符形式，识别其版本（v1–v8、nil、max）与变体（RFC 4122、NCS、Microsoft、保留），并从时间型 UUID 中还原生成时间，辅助开发排障与数据审计。',
        coreFeatures: [
          '版本识别：支持 v1–v8 及 nil/max 特殊 UUID，未知版本字段给出保留值提示',
          '变体判定：识别 RFC 4122、NCS 遗留、Microsoft 与保留变体，并对版本/变体不匹配给出警告',
          '时间戳提取：还原 v1/v2/v6（UUID 纪元 100ns 计数）与 v7（Unix 毫秒）内嵌时间',
          '节点信息：提取 v1/v2 的 MAC 风格节点与时钟序列',
          '批量统计：按空白、逗号、分号分隔多个 UUID，统计合法/非法数量并按规范化形式去重、标记重复',
          '格式兼容：接受大写、urn:uuid: 前缀与花括号包裹，输出统一的规范形式',
        ],
        howToUse: [
          '把一个或多个 UUID 粘贴到输入框，每行一个（也支持逗号、分号或空格分隔）',
          '解析结果即时更新，逐条展示规范形式、版本、变体与时间戳等信息',
          '查看顶部统计卡片了解合法、非法、去重后数量与重复次数',
          '点击「载入示例」查看混合样例，或点击「清空」重新输入',
        ],
        useCases: [
          '排障审计：核对日志、数据库或消息队列中的 UUID 版本是否符合约定',
          '时间还原：从 v1/v6/v7 UUID 直接读出记录创建时间，无需额外元数据',
          '数据清洗：批量校验导入数据中的 UUID 格式并发现重复主键',
          '协议分析：判断第三方系统使用的 UUID 变体与生成策略',
        ],
        privacyNote:
          '所有解析均在浏览器本地完成，输入的 UUID 不会被上传、存储或记录。',
        faqs: [
          {
            question: 'v1、v4、v7 UUID 有什么区别？',
            answer:
              'v1 基于时间戳与节点 MAC 生成，可还原生成时间与节点；v4 完全随机，不含可提取信息；v7 以 Unix 毫秒时间戳开头，天然按时间有序，适合数据库主键。v6 是 v1 时间字段的重排版本，时间有序且同样可还原时间。',
          },
          {
            question: '为什么有的 UUID 被标记为「重复」？',
            answer:
              '工具会先把每个片段规范化（小写、去 urn:uuid: 前缀与花括号），再按规范形式比较。同一 UUID 的大写形式、花括号或 URN 写法都会被视为同一条，出现两次及以上时每条都会标记为重复，并计入「重复次数」。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first UUID parser and bulk validator. It normalizes one or more UUIDs to the canonical lowercase hyphenated form, detects the version (v1–v8, nil, max) and variant (RFC 4122, NCS, Microsoft, reserved), and recovers the embedded generation time from time-based UUIDs to aid debugging and data audits.',
        coreFeatures: [
          'Version detection: v1–v8 plus the nil/max special UUIDs, with reserved-value hints for unknown version fields',
          'Variant detection: RFC 4122, legacy NCS, Microsoft, and reserved variants, with warnings on version/variant mismatch',
          'Timestamp extraction: recovers embedded times from v1/v2/v6 (UUID-epoch 100ns ticks) and v7 (Unix milliseconds)',
          'Node info: extracts the MAC-style node and clock sequence from v1/v2 UUIDs',
          'Bulk statistics: splits on whitespace, commas, and semicolons; counts valid/invalid, dedupes by canonical form, and flags duplicates',
          'Format tolerance: accepts uppercase, the urn:uuid: prefix, and curly braces, and outputs the canonical form',
        ],
        howToUse: [
          'Paste one or more UUIDs into the input box, one per line (commas, semicolons, and spaces also work as separators)',
          'Results update instantly, showing the canonical form, version, variant, timestamp, and other fields per item',
          'Check the summary cards for valid/invalid counts, unique count, and duplicate occurrences',
          'Use "Load sample" for a mixed example or "Clear" to start over',
        ],
        useCases: [
          'Debugging and audits: verify whether UUIDs in logs, databases, or message queues match the agreed version',
          'Time recovery: read record creation times directly from v1/v6/v7 UUIDs without extra metadata',
          'Data cleansing: bulk-validate UUID formats in imports and spot duplicate keys',
          'Protocol analysis: identify the UUID variant and generation strategy used by third-party systems',
        ],
        privacyNote:
          'All parsing runs locally in your browser; entered UUIDs are never uploaded, stored, or logged.',
        faqs: [
          {
            question: 'What is the difference between v1, v4, and v7 UUIDs?',
            answer:
              'v1 is based on a timestamp and the node MAC, so its generation time and node can be recovered; v4 is fully random with no extractable information; v7 starts with a Unix-millisecond timestamp and is naturally time-ordered, making it a good database primary key. v6 is a reordered layout of the v1 time fields — also time-ordered and recoverable.',
          },
          {
            question: 'Why are some UUIDs flagged as duplicates?',
            answer:
              'Each token is first canonicalized (lowercase, with urn:uuid: prefix and curly braces removed) and compared by canonical form. Uppercase, brace-wrapped, or URN spellings of the same UUID count as one entry; when it appears two or more times, every occurrence is flagged and counted under "duplicate occurrences".',
          },
        ],
      },
    },
  },
  {
    slug: 'isbn-converter',
    name: 'ISBN-10 / ISBN-13 校验与互转',
    nameEn: 'ISBN Converter & Validator',
    description:
      '批量校验 ISBN-10 / ISBN-13，按 ISO 2108 加权规则核验校验位并指出错误，在两种格式间双向互转（978 前缀；979 不适用），输出带 GS1/组区分隔的规范形式并按换算后的 ISBN-13 去重。',
    descriptionEn:
      'Bulk-validate ISBN-10 / ISBN-13 codes against ISO 2108 weighted check digits with error reporting, convert between the two formats (978 prefix; not applicable for 979), render canonical GS1/group-hyphenated forms, and dedupe by the resulting ISBN-13.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/isbn-converter',
    iconName: 'Tags',
    tags: ['ISBN', '图书', '校验位', '数据清洗', '出版'],
    tagsEn: ['ISBN', 'Books', 'Check Digit', 'Data Cleansing', 'Publishing'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '020161622X\n9780201616224\n978-0-13-235088-4',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的 ISBN 校验与互转工具。它依据 ISO 2108 标准核验 ISBN-10（10..2 加权模 11，末位 10 记为 X）与 ISBN-13（1/3 交替加权模 10）的校验位，在两种格式之间双向转换，并给出带 GS1 前缀与组区分隔的规范展示，适合出版、图书馆与图书电商的数据核对场景。',
        coreFeatures: [
          '双格式校验：同时支持 ISBN-10 与 ISBN-13，校验位错误时给出期望值与错误位置',
          '双向互转：ISBN-10 自动换算为 978 前缀 ISBN-13；978 前缀 ISBN-13 可反向转换，979 前缀明确提示不存在 ISBN-10',
          '规范分组：依据 ISBN International 组区范围表输出「前缀-组区号-出版段-校验位」分隔形式',
          '批量去重：ISBN-10 与其对应 ISBN-13 视为同一条，按换算后的 ISBN-13 统计重复',
          '格式兼容：自动忽略连字符、空白，兼容小写 x 与各种非规范分隔写法',
          '错误诊断：区分长度错误、非法字符、X 位置错误、前缀错误与校验位不匹配',
        ],
        howToUse: [
          '把一个或多个 ISBN 粘贴到输入框，每行一个（也支持逗号、分号或空格分隔）',
          '结果即时更新，逐条展示类型、ISBN-13、ISBN-10 与规范分组形式',
          '鼠标悬停紧凑编号可查看带分隔的规范形式；非法条目会显示具体错误原因',
          '点击「载入示例」查看混合样例，或点击「清空」重新输入',
        ],
        useCases: [
          '出版编目：核对版权页、CIP 数据与库存系统中的 ISBN 是否一致',
          '图书电商：批量清洗导入表格中的 ISBN，找出错号、混格式与重复条目',
          '图书馆：在旧版 ISBN-10 馆藏数据与新版 ISBN-13 系统之间迁移转换',
          '爬虫与数据分析：把抓取到的多种 ISBN 写法统一为规范的 13 位形式',
        ],
        privacyNote:
          '所有校验与转换均在浏览器本地完成，输入的 ISBN 不会被上传、存储或记录。',
        faqs: [
          {
            question: '为什么有些 ISBN-13 不能转换成 ISBN-10？',
            answer:
              'ISBN-13 使用 978 和 979 两个 GS1 前缀。978 前缀只是在原 ISBN-10 前加前缀并重算校验位，可以双向转换；979 前缀是 2007 年号码资源扩充后启用的，从来没有对应的 10 位形式，因此无法转换。',
          },
          {
            question: '规范分组为什么只分到组区号，不拆分出版社代码？',
            answer:
              '完整的组区号-出版者码-书名码边界由 ISBN International 维护的范围表逐号段定义，数据庞大且定期更新。本工具内置前缀与组区号规则，保证前缀、组区与校验位的分隔准确；出版者与书名码合并为一段展示，避免凭猜测切分产生错误。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first ISBN validator and converter. It checks ISBN-10 (10..2 weighted mod 11, with 10 written as X) and ISBN-13 (alternating 1/3 weights mod 10) check digits per ISO 2108, converts between the two formats, and renders canonical GS1/group-hyphenated forms for publishing, library, and book-retail data checks.',
        coreFeatures: [
          'Dual-format validation: supports both ISBN-10 and ISBN-13, reporting the expected check digit and the error position on mismatch',
          'Two-way conversion: ISBN-10 maps to a 978-prefixed ISBN-13 and back; 979-prefixed codes are clearly marked as having no ISBN-10 form',
          'Canonical grouping: renders "prefix-group-publication-check" hyphenation from the ISBN International group range table',
          'Bulk dedupe: an ISBN-10 and its ISBN-13 twin count as one entry, with duplicates keyed by the resulting ISBN-13',
          'Tolerant input: hyphens and whitespace are ignored; lowercase x and irregular separators are accepted',
          'Error diagnosis: distinguishes length, illegal-character, X-placement, prefix, and check-digit errors',
        ],
        howToUse: [
          'Paste one or more ISBNs into the input box, one per line (commas, semicolons, and spaces also work)',
          'Results update instantly, showing the kind, ISBN-13, ISBN-10, and canonical grouped form per item',
          'Hover over a compact code to see the hyphenated form; invalid items show a specific error reason',
          'Use "Load sample" for a mixed example or "Clear" to start over',
        ],
        useCases: [
          'Publishing cataloguing: reconcile ISBNs across copyright pages, CIP records, and inventory systems',
          'Book retail: clean imported spreadsheets, spotting bad codes, mixed formats, and duplicates',
          'Libraries: migrate legacy ISBN-10 holdings to ISBN-13-based systems',
          'Scraping and analytics: normalize ISBNs captured in assorted formats into canonical 13-digit codes',
        ],
        privacyNote:
          'All validation and conversion run locally in your browser; entered ISBNs are never uploaded, stored, or logged.',
        faqs: [
          {
            question: 'Why can some ISBN-13 codes not be converted to ISBN-10?',
            answer:
              'ISBN-13 uses two GS1 prefixes, 978 and 979. The 978 prefix simply prepends a prefix to the old ISBN-10 and recomputes the check digit, so conversion works both ways. The 979 prefix was introduced in 2007 to expand numbering capacity and never had a 10-digit counterpart, so no conversion exists.',
          },
          {
            question: 'Why does the grouped output stop at the group, without splitting the publisher code?',
            answer:
              'The exact group-publisher-title boundaries are defined segment by segment in the large, periodically updated range file maintained by ISBN International. This tool embeds prefix and group rules so the prefix, group, and check digit splits are exact; the publisher and title parts are shown as one publication segment to avoid guessing boundaries.',
          },
        ],
      },
    },
  },
  {
    slug: 'combinatorics-calculator',
    name: '排列组合计算器',
    nameEn: 'Combinatorics Calculator',
    description:
      '输入 n 与 r，一次算出阶乘 n!、排列 P(n,r)、组合 C(n,r)、重复排列 nʳ、重复组合 C(n+r−1,r) 与圆排列 (n−1)!，全程 BigInt 精确计算，超大整数附科学计数法近似值。',
    descriptionEn:
      'Enter n and r to get factorial n!, permutation P(n,r), combination C(n,r), repetition permutation n^r, repetition combination C(n+r-1,r), and circular permutation (n-1)! at once — exact BigInt arithmetic with scientific-notation approximations for huge results.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/combinatorics-calculator',
    iconName: 'Shuffle',
    tags: ['排列组合', '阶乘', '组合数学', '概率', 'BigInt'],
    tagsEn: ['Permutation', 'Combination', 'Factorial', 'Combinatorics', 'Probability'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的排列组合计算器。给定元素总数 n 与选取数量 r，它同时给出阶乘、排列、组合、可放回排列（nʳ）、可放回组合与圆排列六类常见计数结果，全部使用 BigInt 精确整数运算，即便是 1000! 这样有 2568 位的大整数也逐位精确，并对超大结果附科学计数法近似值，服务于算法复杂度估算、概率统计与竞赛数学等场景。',
        coreFeatures: [
          '六项合一：阶乘、排列、组合、重复排列、重复组合、圆排列一次全部算出',
          'BigInt 精确计算：不使用浮点近似，任意大的计数结果逐位精确并带千位分隔',
          '科学计数法：结果超过 10^15 时自动给出保留 10 位有效数字的近似值',
          '边界完备：正确处理 0! = 1、C(n,0) = 1、n=0、r>n 等边界与退化情形',
          '适用性提示：r>n 时排列与组合明确标注不适用及原因，圆排列对 n≥1 才可用',
          '输入校验：仅接受 0～1000 的非负整数，非法、超限输入即时给出错误提示',
        ],
        howToUse: [
          '在 n 输入框填写元素总数，在 r 输入框填写选取数量（均为非负整数）',
          '结果随输入实时更新，每个卡片显示名称、记号、公式与精确值',
          '悬停记号可查看公式与语义说明；悬停精确值可查看未加分隔的完整数字',
          '不适用的变体（如 r>n 时的排列）会置灰并解释原因',
        ],
        useCases: [
          '算法分析：估算暴力搜索、全排列、子集枚举等方案的复杂度规模',
          '概率统计：计算抽样、彩票、扑克牌型等问题的样本空间与有利事件数',
          '竞赛数学：快速核对排列组合、隔板法与环形排列题目的计数结果',
          '教学演示：对比有无放回、是否计顺序、直线与环形排列之间的数量差异',
        ],
        privacyNote:
          '所有计算均在浏览器本地完成，输入的 n、r 不会被上传、存储或记录。',
        faqs: [
          {
            question: '为什么结果能显示几百上千位而不失真？',
            answer:
              '内部全程使用 JavaScript 的 BigInt 任意精度整数类型做乘除运算，不经过浮点数，因此不存在 Number 的安全整数上限（约 9e15）问题；界面上展示的精确值逐位可靠，科学计数法仅作为阅读超长数字时的辅助近似。',
          },
          {
            question: '重复排列 nʳ 和重复组合 C(n+r−1,r) 有什么区别？',
            answer:
              '两者都假设每次选取后放回、n 保持不变。重复排列计顺序，例如两次掷骰子的结果 (1,2) 与 (2,1) 不同，共 nʳ 种；重复组合不计顺序，(1,2) 与 (2,1) 视为同一种多重集，数量为 C(n+r−1,r)。普通的 P(n,r)、C(n,r) 则是不放回的情形。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first combinatorics calculator. Given a population size n and selection size r, it returns six common counts at once — factorial, permutation, combination, repetition permutation (n^r), repetition combination, and circular permutation. Everything is computed with exact BigInt integer arithmetic, so even 2568-digit results like 1000! stay exact, with scientific-notation approximations appended for readability.',
        coreFeatures: [
          'Six results at once: factorial, permutation, combination, repetition permutation, repetition combination, and circular permutation',
          'Exact BigInt arithmetic: no floating-point approximation, with digit-perfect results and thousands separators',
          'Scientific notation: results above 10^15 get an approximation rounded to 10 significant figures',
          'Edge-case complete: handles 0! = 1, C(n,0) = 1, n=0, and r>n degeneracies correctly',
          'Applicability hints: permutation and combination are marked not applicable (with reasons) when r>n; circular permutation requires n≥1',
          'Input validation: only non-negative integers from 0 to 1000 are accepted, with instant error messages',
        ],
        howToUse: [
          'Enter the population size in the n field and the selection size in the r field (non-negative integers)',
          'All cards update live, each showing the name, notation, formula, and exact value',
          'Hover the notation for its formula and meaning; hover the exact value for the raw digit string',
          'Inapplicable variants (e.g. permutation when r>n) are greyed out with an explanation',
        ],
        useCases: [
          'Algorithm analysis: gauge the scale of brute-force, full-permutation, or subset-enumeration approaches',
          'Probability and statistics: count sample spaces and favorable outcomes in sampling, lottery, or poker problems',
          'Math competitions: quickly verify permutation, stars-and-bars, and circular-arrangement answers',
          'Teaching: contrast with/without replacement, ordered vs unordered, and linear vs circular arrangements',
        ],
        privacyNote:
          'All computation happens locally in your browser; the entered n and r are never uploaded, stored, or logged.',
        faqs: [
          {
            question: 'How can it show hundreds or thousands of digits without losing precision?',
            answer:
              'Internally every multiplication and division uses JavaScript BigInt arbitrary-precision integers instead of floating point, so the Number safe-integer limit (~9e15) never applies. The displayed exact values are reliable digit by digit; scientific notation is only a reading aid for very long numbers.',
          },
          {
            question: 'What is the difference between repetition permutation n^r and repetition combination C(n+r-1,r)?',
            answer:
              'Both assume selection with replacement, so n stays constant. Repetition permutation cares about order — two dice rolls (1,2) and (2,1) differ, giving n^r outcomes. Repetition combination ignores order, treating (1,2) and (2,1) as the same multiset, counted by C(n+r-1,r). The plain P(n,r) and C(n,r) are the without-replacement cases.',
          },
        ],
      },
    },
  },
  {
    slug: 'base45-codec',
    name: 'Base45（RFC 9285）编解码',
    nameEn: 'Base45 (RFC 9285) Encoder & Decoder',
    description:
      '在 UTF-8 文本与 Base45 字符串之间双向转换，使用 RFC 9285 定义的 0-9、A-Z 与 " $%*+-./:" 共 45 字符集，严格校验非法字符、非法尾序列与数值溢出并报告位置。',
    descriptionEn:
      'Convert between UTF-8 text and Base45 strings using the RFC 9285 alphabet (0-9, A-Z, and " $%*+-./:"), with strict validation of illegal characters, illegal tail groups, and value overflow, reporting exact positions.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/base45-codec',
    iconName: 'Binary',
    tags: ['Base45', 'RFC 9285', '编解码', '二维码', 'DCC'],
    tagsEn: ['Base45', 'RFC 9285', 'Encode', 'QR Code', 'DCC'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'Hello!!',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的 Base45 编解码工具。Base45 由 RFC 9285 定义，使用 45 个可打印字符表示二进制数据，每 2 个字节编码为 3 个字符，是欧盟数字健康证书（DCC）二维码等字符集受限介质的标准承载编码。',
        coreFeatures: [
          '严格遵循 RFC 9285：字符集为 0-9、A-Z 与 " $%*+-./:"，2 字节→3 字符、末字节→2 字符',
          '双向转换：UTF-8 文本即时编码为 Base45，Base45 严格解码回文本',
          '精确报错：非法字符、非法单字符尾序列、尾组数值溢出均报告具体位置与原因',
          'UTF-8 校验：解码后字节不是合法 UTF-8 序列时明确提示，不输出乱码',
          '纯本地运行：所有转换在浏览器内完成，绝不发起任何网络请求',
        ],
        howToUse: [
          '选择「编码」或「解码」方向，切换时自动载入对应示例',
          '在输入框粘贴文本或 Base45 字符串，结果即时更新',
          '点击「复制结果」获取转换内容，或「清空」重新输入',
        ],
        useCases: [
          '解析欧盟数字健康证书（DCC）二维码 Payload 中的 Base45 数据',
          '在可表示字符集受限的二维码、票据、印刷介质上承载二进制内容',
          '校验 Base45 字符串是否合法并定位损坏字符的具体位置',
        ],
        privacyNote: '所有编解码均在浏览器本地完成，输入的文本与 Base45 字符串不会被上传或记录。',
        faqs: [
          {
            question: 'Base45 和 Base64 有什么区别？',
            answer:
              'Base64 面向 8 位字节通道，每 3 字节编码为 4 字符（A-Z、a-z、0-9、+、/）；Base45 面向只能高效表示大写字母与数字的二维码等介质，字符表更小（含部分标点），每 2 字节编码为 3 字符，且单字节尾组合法。',
          },
          {
            question: '为什么解码时提示尾序列非法？',
            answer:
              'RFC 9285 规定输入长度只能是 3 的倍数（完整双字节组）或模 3 余 2（末尾一个单字节组）。长度余 1 时最后一个字符无法对应任何字节，属于损坏或截断的输入。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first Base45 codec. Defined by RFC 9285, Base45 represents binary data with 45 printable characters, encoding every 2 bytes into 3 characters. It is the standard transport encoding for payloads such as the EU Digital COVID Certificate (DCC) QR codes.',
        coreFeatures: [
          'Strict RFC 9285: alphabet 0-9, A-Z, and " $%*+-./:"; 2 bytes to 3 chars, one trailing byte to 2 chars',
          'Bidirectional: UTF-8 text to Base45 instantly, and strict Base45 decoding back to text',
          'Precise errors: illegal characters, illegal single-char tails, and overflow report exact position and reason',
          'UTF-8 validation: decoded bytes that are not valid UTF-8 are reported instead of showing mojibake',
          'Local-first: all conversion runs in the browser with no network requests',
        ],
        howToUse: [
          'Pick the "Encode" or "Decode" direction; switching loads the matching sample automatically',
          'Paste text or a Base45 string into the input area and the result updates instantly',
          'Click "Copy result" to copy the conversion, or "Clear" to start over',
        ],
        useCases: [
          'Decode Base45 payloads inside EU Digital COVID Certificate (DCC) QR codes',
          'Carry binary content over QR codes, tickets, or printed media with restricted character sets',
          'Validate whether a Base45 string is well-formed and locate corrupted characters',
        ],
        privacyNote:
          'All encoding and decoding run locally in the browser; entered text and Base45 strings are never uploaded or logged.',
        faqs: [
          {
            question: 'How does Base45 differ from Base64?',
            answer:
              'Base64 targets 8-bit channels and encodes 3 bytes into 4 characters (A-Z, a-z, 0-9, +, /). Base45 targets media such as QR codes that efficiently represent uppercase letters and digits; it uses a smaller alphabet (with selected punctuation), encodes 2 bytes into 3 characters, and allows a one-byte tail group.',
          },
          {
            question: 'Why does decoding report an illegal tail sequence?',
            answer:
              'RFC 9285 allows input lengths that are multiples of 3 (full two-byte groups) or with a remainder of 2 (one trailing single-byte group). A remainder of 1 means the final character cannot map to any byte, indicating corrupted or truncated input.',
          },
        ],
      },
    },
  },
  {
    slug: 'nano-id-generator',
    name: 'Nano ID 生成器',
    nameEn: 'Nano ID Generator',
    description:
      '生成 URL-safe 的紧凑随机标识符：支持自定义长度与字母表、批量生成，使用 Web Crypto 密码学安全随机源并以拒绝采样消除取模偏置。',
    descriptionEn:
      'Generate compact URL-safe random identifiers with custom length and alphabet and bulk output. Uses the Web Crypto secure source with rejection sampling to remove modulo bias.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/nano-id-generator',
    iconName: 'Shuffle',
    tags: ['Nano ID', '随机ID', '标识符', 'URL-safe', '生成器'],
    tagsEn: ['Nano ID', 'Random ID', 'Identifier', 'URL-safe', 'Generator'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的 Nano ID 风格随机标识符生成器。Nano ID 使用 A-Za-z0-9_- 共 64 个 URL-safe 字符，默认 21 位即可达到与 UUID v4 相近的碰撞概率，产物更短、对 URL 与 HTML id 友好，且长度与字母表均可自定义。',
        coreFeatures: [
          '密码学安全：随机字节来自 Web Crypto getRandomValues，非 Math.random 伪随机',
          '拒绝采样：丢弃落入偏置区间的字节，保证字母表内每个字符严格等概率',
          '灵活定制：长度可选 12/21/32/64，字母表内置 5 套预设并支持自定义（字符不可重复）',
          '批量生成：一次生成 1/5/10/20 个 ID 并一键复制全部',
          '纯本地运行：生成过程不发起任何网络请求，标识符不会离开浏览器',
        ],
        howToUse: [
          '选择需要的长度与生成数量，页面会自动按当前参数生成',
          '需要定制字符集时把字母表切换为「自定义」并输入 1–256 个不重复字符',
          '点击「重新生成」刷新结果，或「复制全部」按行复制所有 ID',
        ],
        useCases: [
          '前端本地数据、草稿、看板卡片的短主键与 DOM id',
          'URL 短链、文件名、日志 trace 等对长度与字符集敏感的标识',
          '需要自定义字母表（如纯数字、十六进制）的测试数据与 mock 场景',
        ],
        privacyNote: '所有 ID 均在浏览器本地由密码学安全随机源生成，不会上传或记录。',
        faqs: [
          {
            question: 'Nano ID 和 UUID 有什么区别？',
            answer:
              'UUID v4 固定 36 字符且结构固定（含连字符与版本位）；Nano ID 默认仅 21 个 URL-safe 字符，体积更小、可直接放进 URL 与 HTML id，长度和字母表还可按需调整。两者碰撞概率在默认配置下处于同一量级。',
          },
          {
            question: '什么是取模偏置？为什么要拒绝采样？',
            answer:
              '当 256 不能被字母表字符数整除时，直接对随机字节取模会让靠前的字符出现概率略高。拒绝采样会丢弃落在最后一个不完整区间内的字节（例如 63 字符字母表时丢弃 252–255）后重抽，保证每个字符等概率。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first Nano ID style random identifier generator. Nano ID uses a 64-character URL-safe alphabet (A-Za-z0-9_-); the default 21-character ID has a collision probability comparable to UUID v4 while being shorter and URL/HTML-id friendly, with customizable length and alphabet.',
        coreFeatures: [
          'Cryptographically secure: bytes come from Web Crypto getRandomValues, not Math.random',
          'Rejection sampling: bytes in the biased tail are discarded so every character is uniformly distributed',
          'Flexible: lengths 12/21/32/64 and five built-in alphabet presets plus a custom alphabet (no duplicate chars)',
          'Bulk output: generate 1/5/10/20 IDs at once and copy all of them in one click',
          'Local-first: generation makes no network requests and identifiers never leave the browser',
        ],
        howToUse: [
          'Pick the desired length and count; IDs regenerate automatically from current settings',
          'Switch the alphabet to "Custom" and enter 1–256 unique characters for a custom charset',
          'Click "Regenerate" for fresh IDs or "Copy all" to copy every ID as newline-separated text',
        ],
        useCases: [
          'Short primary keys and DOM ids for local frontend data, drafts, and kanban cards',
          'Identifiers for short URLs, filenames, and log traces where length and charset matter',
          'Test data and mocks requiring special alphabets such as digits-only or hexadecimal',
        ],
        privacyNote:
          'All IDs are generated locally in the browser from a cryptographically secure source and are never uploaded or logged.',
        faqs: [
          {
            question: 'How does Nano ID differ from UUID?',
            answer:
              'UUID v4 is fixed at 36 characters with hyphens and version/variant bits. Nano ID defaults to just 21 URL-safe characters, is smaller, can be embedded directly in URLs and HTML ids, and supports custom lengths and alphabets. Default configurations offer collision probabilities in the same order of magnitude.',
          },
          {
            question: 'What is modulo bias and why use rejection sampling?',
            answer:
              'When 256 is not evenly divisible by the alphabet size, reducing random bytes with modulo makes earlier characters slightly more likely. Rejection sampling discards bytes in the final incomplete bucket (e.g. 252–255 for a 63-character alphabet) and redraws, keeping every character equiprobable.',
          },
        ],
      },
    },
  },
  {
    slug: 'bencode-codec',
    name: 'Bencode 编解码器',
    nameEn: 'Bencode Encoder & Decoder',
    description:
      '解析与生成 BitTorrent 生态的 Bencode 格式（整数、二进制安全字节串、列表、按键字节序排序的字典），支持与 JSON 双向转换，原始字节串以标记对象呈现，非法语法与字典键乱序等错误带精确定位。',
    descriptionEn:
      'Parse and generate the BitTorrent Bencode format (integers, binary-safe byte strings, lists, and dictionaries sorted by raw key bytes), convert to and from JSON, represent raw byte strings with a marker object, and pinpoint errors such as invalid syntax or unsorted dictionary keys.',
    category: ToolCategoryEnum.DATA_JSON,
    path: '/tools/bencode-codec',
    iconName: 'Braces',
    tags: ['Bencode', 'BitTorrent', 'torrent', '编解码', 'JSON'],
    tagsEn: ['Bencode', 'BitTorrent', 'torrent', 'Codec', 'JSON'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'd4:spami1ee',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的 Bencode 编解码器。Bencode 是 BitTorrent 协议与 .torrent 文件使用的序列化格式，仅包含四种结构：整数 i<数字>e、二进制安全字节串 <长度>:<字节>、列表 l..e 与字典 d..e（键必须是字节串并按原始字节序升序排列）。本工具可将 Bencode 解析为格式化 JSON 预览，也可把 JSON 编码回 Bencode。',
        coreFeatures: [
          '四种结构全覆盖：整数、字节串、列表、字典的严格解析与生成',
          'Bencode ↔ JSON 双向转换，解码结果按缩进格式化，便于阅读 .torrent 字段',
          '二进制安全：非 UTF-8 字节串以 {"$$bencodeBytes$$": "<十六进制>"} 标记对象呈现并可无损还原',
          '精确报错：非法起始字符、前导零、长度不符、字典键乱序或重复等错误均报告具体位置',
          '编码时字典键自动按字节序升序排列，纯本地运算、零新增依赖',
        ],
        howToUse: [
          '选择「解码（Bencode → JSON）」或「编码（JSON → Bencode）」，切换时自动载入示例',
          '粘贴 .torrent 片段等 Bencode 文本或合法 JSON，结果即时更新',
          '需要承载原始字节时，在 JSON 中使用 {"$$bencodeBytes$$": "<偶数位十六进制>"} 标记对象',
        ],
        useCases: [
          '解析 .torrent 文件的 announce、info.name、piece length、文件列表等字段',
          '调试 BitTorrent 扩展协议（BEP）中以 Bencode 承载的消息与元数据',
          '从 JSON 快速生成符合规范（字典键排序、整数严格）的 Bencode 数据',
        ],
        privacyNote: '所有解析与编码均在浏览器本地完成，输入的 Bencode 与 JSON 数据不会被上传或记录。',
        faqs: [
          {
            question: 'Bencode 和 JSON 有什么区别？',
            answer:
              'Bencode 只有整数、字节串、列表、字典四种类型，没有布尔、null 或浮点数；字节串是二进制安全的（可承载任意字节，不限于文本）；字典键必须是字节串且严格按原始字节序升序排列，不允许重复键。JSON 则是面向文本的通用格式，类型更丰富但不保证键序。',
          },
          {
            question: '$$bencodeBytes$$ 标记对象是什么？',
            answer:
              'Bencode 字节串可以包含任意字节，不一定是合法 UTF-8 文本，无法直接显示为 JSON 字符串。遇到这类字节串时，解码结果用 {"$$bencodeBytes$$": "十六进制"} 表示其原始字节；反向编码时该标记会被还原为字节串，保证往返无损。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first Bencode encoder and decoder. Bencode is the serialization format used by the BitTorrent protocol and .torrent files, with exactly four structures: integers i<digits>e, binary-safe byte strings <length>:<bytes>, lists l..e, and dictionaries d..e (keys must be byte strings sorted lexicographically by raw bytes). It decodes Bencode into pretty-printed JSON and encodes JSON back to Bencode.',
        coreFeatures: [
          'All four structures: strict parsing and generation of integers, byte strings, lists, and dictionaries',
          'Bidirectional Bencode ↔ JSON conversion with indented, easy-to-read .torrent field previews',
          'Binary-safe: non-UTF-8 byte strings appear as {"$$bencodeBytes$$": "<hex>"} marker objects and round-trip losslessly',
          'Precise errors: illegal start characters, leading zeros, length mismatches, unsorted or duplicate keys all report exact positions',
          'Dictionary keys are automatically sorted by raw byte order on encode; fully local, zero new dependencies',
        ],
        howToUse: [
          'Choose "Decode (Bencode → JSON)" or "Encode (JSON → Bencode)"; switching loads the matching sample',
          'Paste a .torrent-style Bencode fragment or valid JSON and the result updates instantly',
          'To carry raw bytes, use the marker object {"$$bencodeBytes$$": "<even-length hex>"} in JSON',
        ],
        useCases: [
          'Inspect announce, info.name, piece length, and file list fields of .torrent files',
          'Debug Bencode payloads in BitTorrent Extension Protocol (BEP) messages and metadata',
          'Generate spec-compliant Bencode (sorted dictionary keys, strict integers) from JSON',
        ],
        privacyNote:
          'All parsing and encoding run locally in the browser; entered Bencode and JSON data are never uploaded or logged.',
        faqs: [
          {
            question: 'How does Bencode differ from JSON?',
            answer:
              'Bencode has only four types — integers, byte strings, lists, and dictionaries — with no booleans, null, or floats. Byte strings are binary-safe (arbitrary bytes, not just text), and dictionary keys must be byte strings strictly sorted by raw byte order with no duplicates. JSON is a text-oriented general format with richer types and no mandated key order.',
          },
          {
            question: 'What is the $$bencodeBytes$$ marker object?',
            answer:
              'Bencode byte strings may contain arbitrary bytes that are not valid UTF-8 and therefore cannot be shown as JSON strings. Such strings are decoded as {"$$bencodeBytes$$": "hexadecimal"}; when encoding, the marker is converted back into a byte string, ensuring lossless round trips.',
          },
        ],
      },
    },
  },
  {
    slug: 'non-crypto-hash',
    name: '非加密哈希批量计算',
    nameEn: 'Non-cryptographic Hash Calculator',
    description:
      '一次输入同时计算 FNV-1 / FNV-1a（32 位与 64 位）、MurmurHash3 x86 32 位（种子可调）、djb2、sdbm 与 Java String.hashCode()，输出十进制与十六进制结果，用于哈希表分桶、分片路由与算法教学。',
    descriptionEn:
      'Compute FNV-1 / FNV-1a (32-bit and 64-bit), MurmurHash3 x86 32-bit with adjustable seed, djb2, sdbm, and Java String.hashCode() in one pass, showing both decimal and hexadecimal output for hash bucketing, shard routing, and algorithm teaching.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/non-crypto-hash',
    iconName: 'Gauge',
    tags: ['FNV', 'MurmurHash', 'djb2', 'sdbm', '哈希'],
    tagsEn: ['FNV', 'MurmurHash', 'djb2', 'sdbm', 'Hash'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'The quick brown fox jumps over the lazy dog',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的非加密哈希批量计算器。非加密哈希（Non-cryptographic Hash）追求极致速度与均匀分布，而非抗碰撞能力，常用于哈希表、数据分片、负载均衡路由键与算法教学。本工具一次输入同时输出 8 个经典算法结果：FNV-1 与 FNV-1a 的 32 位 / 64 位版本、MurmurHash3 x86 32 位（支持自定义种子）、djb2、sdbm，以及 Java String.hashCode()。',
        coreFeatures: [
          '8 个结果一次出齐：FNV-1/1a 32 位与 64 位、MurmurHash3、djb2、sdbm、Java hashCode',
          'MurmurHash3 种子（seed）可任意指定，提供 0、1、42 等常用值快捷按钮',
          '每个结果同时给出十进制与无符号十六进制，64 位结果以 BigInt 完整呈现不丢精度',
          '统一按 UTF-8 字节计算（Java hashCode 按 UTF-16 码元，与 JVM 行为一致），空串也合法',
          '纯函数实现、零依赖、纯本地运算，逐行复制或一键复制全部结果',
        ],
        howToUse: [
          '在输入框中粘贴待计算文本，结果表格随输入实时刷新',
          '需要复现特定 MurmurHash3 结果时，在顶部调整种子（0 为算法默认值）',
          '点击单行「复制」取用十六进制值，或用右上角「复制全部」导出 TSV',
        ],
        useCases: [
          '设计分库分表 / 一致性哈希路由时，比较不同哈希函数对业务键的分布效果',
          '复现 Java、C++、Go 等代码里历史遗留的 FNV、djb2、sdbm、hashCode 数值',
          '算法与数据结构教学中直观对比同一输入在不同经典哈希函数下的输出',
        ],
        privacyNote: '所有哈希均在浏览器本地由纯函数计算，输入文本不会被上传或记录。',
        faqs: [
          {
            question: '这些哈希能用来校验文件完整性或存储密码吗？',
            answer:
              '不能。非加密哈希不具备抗碰撞能力，攻击者可以轻易构造不同输入得到相同输出，因此不适合完整性校验、数字签名或密码存储；这类需求应使用 SHA-256 等密码学哈希。非加密哈希的价值在于速度快、分布均匀，适合哈希表分桶与分片路由。',
          },
          {
            question: '为什么 Java hashCode 的十进制可能是负数，而其他算法不是？',
            answer:
              'Java 的 int 是 32 位有符号整数，String.hashCode() 直接返回这个有符号值，所以可能为负；表中其十六进制仍按无符号呈现以便对照。其余算法统一按无符号 32 位 / 64 位整数展示。另外 Java hashCode 按 UTF-16 码元迭代，而其他算法按 UTF-8 字节迭代，因此非 ASCII 文本的结果口径不同。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first batch calculator for non-cryptographic hashes. Non-cryptographic hashes optimize for speed and uniform distribution rather than collision resistance, and are widely used in hash tables, data sharding, load-balancing routing keys, and algorithm education. One input produces eight classic results at once: FNV-1 and FNV-1a in both 32-bit and 64-bit variants, MurmurHash3 x86 32-bit (with a custom seed), djb2, sdbm, and Java String.hashCode().',
        coreFeatures: [
          'Eight results at once: FNV-1/1a 32-bit and 64-bit, MurmurHash3, djb2, sdbm, and Java hashCode',
          'Adjustable MurmurHash3 seed with quick presets such as 0, 1, and 42',
          'Every result shows both decimal and unsigned hexadecimal; 64-bit values use BigInt with no precision loss',
          'Consistent UTF-8 byte semantics (Java hashCode uses UTF-16 code units, matching the JVM); empty input is valid',
          'Pure-function, zero-dependency, fully local computation; copy one row or export all results as TSV',
        ],
        howToUse: [
          'Paste the text into the input box; the result table refreshes in real time',
          'Set the seed at the top (0 is the algorithm default) when reproducing a specific MurmurHash3 value',
          'Use the row "Copy" action for its hexadecimal value, or "Copy all" to export all rows as TSV',
        ],
        useCases: [
          'Compare how different hash functions distribute business keys when designing sharding or consistent-hashing routing',
          'Reproduce legacy FNV, djb2, sdbm, or hashCode values found in Java, C++, or Go code',
          'Teach algorithms and data structures by showing outputs of classic hash functions side by side',
        ],
        privacyNote:
          'All hashes are computed locally in the browser by pure functions; entered text is never uploaded or logged.',
        faqs: [
          {
            question: 'Can these hashes verify file integrity or store passwords?',
            answer:
              'No. Non-cryptographic hashes are not collision-resistant: an attacker can easily craft different inputs with the same output, so they must not be used for integrity checks, digital signatures, or password storage — use cryptographic hashes such as SHA-256 instead. Their value is speed and uniform distribution for hash-table bucketing and shard routing.',
          },
          {
            question: 'Why can the Java hashCode decimal be negative while the others cannot?',
            answer:
              'A Java int is a signed 32-bit integer and String.hashCode() returns that signed value directly, so it may be negative; its hexadecimal in the table is still shown unsigned for easy comparison. The other algorithms are shown as unsigned 32-bit/64-bit integers. Also, Java hashCode iterates UTF-16 code units while the other algorithms iterate UTF-8 bytes, so non-ASCII inputs follow different byte semantics.',
          },
        ],
      },
    },
  },
  {
    slug: 'morse-codec',
    name: '摩尔斯电码编解码器',
    nameEn: 'Morse Code Translator',
    description:
      '在普通文本与国际摩尔斯电码（点 . / 划 -）之间双向转换，覆盖 A–Z、0–9 与常用标点，支持可调字符 / 单词间隔与本地音频播放，适用于业余无线电、谜题解密与报务教学。',
    descriptionEn:
      'Translate between plain text and International Morse Code (dots and dashes) in both directions, covering A–Z, 0–9, and common punctuation, with adjustable letter/word gaps and local audio playback for amateur radio, puzzles, and telegraphy training.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/morse-codec',
    iconName: 'Sparkles',
    tags: ['摩尔斯', 'Morse', '编码', '音频'],
    tagsEn: ['Morse', 'Codec', 'Encoding', 'Audio'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'SOS MORSE CODE 1844',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的摩尔斯电码双向转换工具，遵循 ITU-R M.1677-1 国际摩尔斯电码表，支持 A–Z 字母、0–9 数字以及句号、逗号、问号、@ 等 18 个常用标点与业务符号。编码方向把文本转为点（.）划（-）序列，字符间隔与单词间隔均可按点长单位调整（标准为 3 与 7）；解码方向容忍手写输入的空格差异，也接受斜杠（/）作为单词分隔。内置 Web Audio 振荡器，可按慢 / 标准 / 快三档速度把电码真实发声播放出来。',
        coreFeatures: [
          '文本与摩尔斯电码双向转换，覆盖 26 个字母、10 个数字与 18 个常用标点符号',
          '字符间隔（标准 3 点长）与单词间隔（标准 7 点长）均可调，范围 1–20 且自动校验',
          '解码容错：1–4 空格视为字符间隔，斜杠或 5 个以上空格视为单词间隔',
          '基于 Web Audio 的音频播放，600Hz 正弦波、三档点长速度，可随时停止',
          '纯函数 + 零依赖实现，转换与发声均在本地完成，支持一键复制结果',
        ],
        howToUse: [
          '选择「编码」或「解码」方向，在输入框中粘贴文本或点划电码，结果实时刷新',
          '编码方向可调整字符 / 单词间隔（单词间隔必须大于字符间隔），解码方向可直接粘贴斜杠格式',
          '点击「播放电码」按当前速度收听，可切换慢 / 标准 / 快速；满意后点「复制结果」取用',
        ],
        useCases: [
          '业余无线电（CW 通联）练习收发报文，对照标准点划与时序听辨训练',
          '密室逃脱、解谜游戏与 CTF 中遇到摩尔斯线索时快速编解码',
          '通信史与信息技术课堂上演示点划编码、间隔规则与电报发声原理',
        ],
        privacyNote: '转换与音频播放全部在浏览器本地完成，输入内容不会被上传或记录。',
        faqs: [
          {
            question: '编码后每个字符之间的三个空格有什么用？',
            answer:
              '空格承载的是时间间隔而不是可见符号：按 ITU 标准，码元（点划）间隔为 1 个点长、字符间隔为 3 个点长、单词间隔为 7 个点长。本工具直接用对应数量的空格表示间隔，因此默认输出中字符间是 3 个空格、单词间是 7 个空格；音频播放时这些空格会被换算成真实的静默时长。',
          },
          {
            question: '解码时怎样区分字符间隔和单词间隔？',
            answer:
              '规则为：1–4 个空格一律视为字符间隔（对手写输入容错），斜杠（/，前后是否带空格均可）或 5 个及以上空格视为单词间隔。标准编码器输出的 3 空格 / 7 空格可以无损往返；若你把间隔调成了很小的值再想解码，建议用斜杠显式分隔单词，例如 “.... .. / - .... . .-. .”。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully local, bidirectional translator for International Morse Code per ITU-R M.1677-1, covering A–Z, 0–9, and 18 common punctuation and procedural symbols such as period, comma, question mark, and @. Encoding turns text into dots (.) and dashes (-) with adjustable letter and word gaps (3 and 7 dot lengths by standard); decoding tolerates handwritten spacing variations and also accepts a slash (/) as the word separator. A built-in Web Audio oscillator plays the code aloud at slow, standard, or fast speed.',
        coreFeatures: [
          'Bidirectional translation covering 26 letters, 10 digits, and 18 common punctuation/procedural symbols',
          'Adjustable letter gap (standard 3 dot lengths) and word gap (standard 7), range 1–20 with automatic validation',
          'Lenient decoding: 1–4 spaces are letter gaps; a slash or 5+ spaces denotes a word gap',
          'Web Audio playback with a 600 Hz sine wave, three dot-length speeds, and instant stop',
          'Pure-function, zero-dependency implementation; conversion and audio stay local, one-click copy included',
        ],
        howToUse: [
          'Pick the Encode or Decode direction and paste text or dot-dash code; the result refreshes live',
          'Tune letter/word gaps when encoding (the word gap must be larger); paste slash-separated code when decoding',
          'Click "Play code" to listen at the current speed (slow/standard/fast), then use "Copy result"',
        ],
        useCases: [
          'Practice CW traffic in amateur radio and train ear copy against standard timing',
          'Encode or decode Morse clues in escape rooms, puzzle games, and CTF challenges',
          'Demonstrate dot-dash encoding, gap rules, and telegraph sound in communications-history classes',
        ],
        privacyNote:
          'All conversion and audio playback run locally in the browser; input is never uploaded or logged.',
        faqs: [
          {
            question: 'What is the purpose of the three spaces between encoded letters?',
            answer:
              'The spaces encode timing rather than a visible symbol: per the ITU standard the gap between elements (dots/dashes) is 1 dot length, between letters 3 dot lengths, and between words 7 dot lengths. The tool represents these gaps with the matching number of spaces, so default output shows 3 spaces between letters and 7 between words; audio playback converts the spaces into real silence.',
          },
          {
            question: 'How does decoding distinguish letter gaps from word gaps?',
            answer:
              'The rule is: 1–4 spaces are always treated as letter gaps (tolerant of handwritten input), while a slash (with or without surrounding spaces) or 5+ spaces marks a word gap. Standard encoder output (3/7 spaces) round-trips losslessly; if you encoded with very small custom gaps, separate words explicitly with a slash, e.g. ".... .. / - .... . .-. .".',
          },
        ],
      },
    },
  },
  {
    slug: 'caesar-cipher',
    name: '凯撒密码 / ROT13',
    nameEn: 'Caesar Cipher & ROT13',
    description:
      '对英文字母执行 0–25 自定义位移的凯撒密码加解密，内置 ROT13 快捷变换；仅替换 A–Z / a–z 并保留大小写，数字、标点、空格与中文原样输出，适用于 CTF 解谜与轻度文本混淆。',
    descriptionEn:
      'Encrypt and decrypt text with a Caesar shift of 0–25, including a one-click ROT13 mode. Only A–Z / a–z letters are substituted while case is kept; digits, punctuation, spaces, and CJK text pass through untouched — handy for CTF puzzles and light obfuscation.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/caesar-cipher',
    iconName: 'ShieldCheck',
    tags: ['凯撒密码', 'ROT13', '位移', 'CTF'],
    tagsEn: ['Caesar Cipher', 'ROT13', 'Shift', 'CTF'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'Hello, World!',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的凯撒密码（Caesar cipher）工具，对 26 个英文字母做循环位移替换，支持 0–25 的自定义位移量以及一键 ROT13（位移 13）特例。加密方向把字母沿字母表正移，解密方向反移；变换只作用于 A–Z / a–z，数字、标点、空格、换行与中文等字符一律原样保留，大小写也保持不变。',
        coreFeatures: [
          '0–25 任意位移量的凯撒加密与解密，位移量自动按 26 取模归一化',
          '一键 ROT13：加密解密同一变换，对结果再执行一次即可还原原文',
          '仅替换英文字母并保持大小写，数字、符号、空白与中文原样保留',
          '输入、方向与位移量实时联动，结果即时刷新，支持一键复制',
          '纯函数 + 零依赖实现，全部运算在浏览器本地完成',
        ],
        howToUse: [
          '选择「加密」或「解密」方向，在输入框中粘贴文本，结果实时刷新',
          '通过数字输入框调整位移量（0–25），或点击「ROT13（位移 13）」快捷按钮',
          '满意后点击「复制结果」取用；对密文切换到解密方向并使用相同位移即可还原',
        ],
        useCases: [
          'CTF 夺旗赛、密室逃脱与解谜游戏中破解或构造凯撒 / ROT13 线索',
          '阅读被轻度混淆的文本（论坛剧透、彩蛋、谜语）时快速还原',
          '密码学入门教学中演示古典替换密码的原理与脆弱性',
        ],
        privacyNote: '全部变换在浏览器本地完成，输入内容不会被上传或记录。',
        faqs: [
          {
            question: 'ROT13 和凯撒密码是什么关系？',
            answer:
              'ROT13 就是位移量为 13 的凯撒密码。因为英文字母表有 26 个字母，正移 13 位与反移 13 位是同一个变换，所以 ROT13 的加密和解密是同一个操作：对任意文本连续执行两次 ROT13 即可还原原文。',
          },
          {
            question: '为什么数字、标点和中文没有被加密？',
            answer:
              '凯撒密码只定义了字母表上的循环位移，本工具仅对 A–Z / a–z 生效，且保持原有大小写；数字、标点、空格、换行以及中文等非字母字符一律原样保留，这也是凯撒密码的标准行为。若需要加密这些字符，请使用本站的现代加密工具（如 AES 对称加密）。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully local Caesar cipher tool that cyclically shifts the 26 Latin letters with any custom shift of 0–25, plus a one-click ROT13 (shift 13) mode. Encryption shifts letters forward through the alphabet and decryption shifts them backward; only A–Z / a–z are affected while case is preserved, and digits, punctuation, spaces, newlines, and CJK text pass through completely untouched.',
        coreFeatures: [
          'Caesar encryption and decryption with any shift 0–25, normalized modulo 26',
          'One-click ROT13 where encryption and decryption are the same operation; applying it twice restores the text',
          'Only Latin letters are substituted with case preserved; digits, symbols, whitespace, and CJK stay intact',
          'Live result that reacts instantly to input, direction, and shift changes, with one-click copy',
          'Pure-function, zero-dependency implementation running entirely in the browser',
        ],
        howToUse: [
          'Pick the Encrypt or Decrypt direction and paste text; the result refreshes live',
          'Adjust the shift with the number input (0–25), or click the "ROT13 (shift 13)" button',
          'Use "Copy result" when satisfied; switch ciphertext to Decrypt with the same shift to recover the plaintext',
        ],
        useCases: [
          'Solve or craft Caesar/ROT13 clues in CTF competitions, escape rooms, and puzzle games',
          'Reveal lightly obfuscated text such as forum spoilers, easter eggs, and riddles',
          'Demonstrate classical substitution ciphers and their weakness in introductory cryptography lessons',
        ],
        privacyNote:
          'All transforms run locally in the browser; input is never uploaded or logged.',
        faqs: [
          {
            question: 'How is ROT13 related to the Caesar cipher?',
            answer:
              'ROT13 is simply the Caesar cipher with a shift of 13. Because the Latin alphabet has 26 letters, shifting forward by 13 is the same as shifting backward by 13, so ROT13 encryption and decryption are the identical operation: applying ROT13 twice to any text restores the original.',
          },
          {
            question: 'Why are digits, punctuation, and Chinese characters left unencrypted?',
            answer:
              'The Caesar cipher is defined only as a shift over an alphabet, and this tool applies it exclusively to A–Z / a–z while preserving case. Digits, punctuation, spaces, newlines, and non-letter scripts such as Chinese pass through unchanged, which is the standard Caesar behavior. To protect those characters, use a modern cipher such as the AES symmetric encryption tool on this site.',
          },
        ],
      },
    },
  },
  {
    slug: 'ulid-generator',
    name: 'ULID 生成器与解析器',
    nameEn: 'ULID Generator & Parser',
    description:
      '生成符合规范的 26 字符 ULID（10 字符毫秒时间戳 + 16 字符 Crockford Base32 随机段），支持批量生成、指定时间戳与同毫秒单调递增，并可把 ULID 反解为 UTC / 本地时间与随机段十六进制。',
    descriptionEn:
      'Generate spec-compliant 26-char ULIDs (a 10-char millisecond timestamp plus a 16-char Crockford Base32 random part) in bulk, with an optional fixed timestamp and same-millisecond monotonicity, and parse any ULID back into UTC/local time and the random-part hex.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/ulid-generator',
    iconName: 'Fingerprint',
    tags: ['ULID', '标识符', 'Crockford Base32', '有序主键'],
    tagsEn: ['ULID', 'Identifier', 'Crockford Base32', 'Sortable ID'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '01ARYZ6S41TSV4RRFFQ69G5FAV',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的 ULID（Universally Unique Lexicographically Sortable Identifier）生成与解析工具，遵循 ULID 规范：固定 26 个字符，采用 Crockford Base32（0–9A–Z，排除易混淆的 I、L、O、U），前 10 字符编码 48 位毫秒时间戳，后 16 字符编码 80 位随机数。随机字节取自 Web Crypto getRandomValues，同一毫秒内连续生成时随机段自动加一，保证标识符既唯一又可直接按字符串字典序排序。',
        coreFeatures: [
          '符合规范的 26 字符 ULID，Crockford Base32 字符集，时间戳段 + 随机段布局',
          '批量生成 1–500 个，结果严格按字典序升序，支持一键复制全部',
          '可指定毫秒时间戳前缀；同毫秒单调递增，时钟回拨直接报错',
          'Web Crypto 密码学安全随机源，80 位随机段无取模偏置',
          '反解任意 ULID：毫秒时间戳、UTC / 本地时间、分段与随机段 20 位十六进制，非法字符与长度即时报错',
        ],
        howToUse: [
          '选择生成数量，可选填写固定毫秒时间戳（留空使用当前时间），点击「重新生成」',
          '点击「复制全部」获取按行分隔的 ULID；它们可直接按字典序排序并反映创建先后',
          '在「ULID 解析」卡片粘贴任意 ULID，即时查看时间与随机段信息',
        ],
        useCases: [
          '分布式系统与数据库中需要时间有序的唯一主键（日志、事件、订单号）',
          '替代自增 ID 暴露业务量，同时保持索引友好的字典序特性',
          '排查问题时把他人给出的 ULID 反解为可读的生成时间',
        ],
        privacyNote: '时间戳与随机数全部在浏览器本地生成和解析，不发起任何网络请求。',
        faqs: [
          {
            question: 'ULID 和 UUID v4 有什么区别？',
            answer:
              'UUID v4 是 36 字符（含连字符）的纯随机标识，字符串顺序与创建时间无关；ULID 是 26 字符、URL 友好的 Crockford Base32 标识，前 48 位直接编码毫秒时间戳，因此按字符串字典序排序就等于按创建时间排序，更适合做数据库有序主键与日志标识，同时保留 80 位随机空间保证碰撞概率极低。',
          },
          {
            question: '同一毫秒内连续生成会不会重复？',
            answer:
              '不会。本工具实现了 ULID 规范的单调性（monotonicity）：当时间戳前进时重新抽取随机段；当多次生成落在同一毫秒时，对 80 位随机段做整数加一并在溢出时报错，因此同一毫秒内的结果严格递增。只有随机段在该毫秒内全部进位到上界（约 2^80 次）才会失败，正常使用不可能触发。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully local generator and parser for ULIDs (Universally Unique Lexicographically Sortable Identifier) following the ULID spec: always 26 characters in Crockford Base32 (0–9A–Z without the confusing I, L, O, U), where the first 10 characters encode a 48-bit millisecond timestamp and the last 16 encode 80 random bits. Random bytes come from Web Crypto getRandomValues, and generations within the same millisecond increment the random part, so IDs are both unique and sortable by plain lexicographic order.',
        coreFeatures: [
          'Spec-compliant 26-char ULIDs in Crockford Base32 with a timestamp part and a random part',
          'Bulk generation of 1–500 IDs in strict lexicographic order, with one-click copy',
          'Optional fixed millisecond timestamp; same-millisecond monotonicity; clock-rollback errors',
          'Web Crypto secure randomness with 80 unbiased random bits',
          'Parse any ULID into its millisecond timestamp, UTC/local time, parts, and 20-hex randomness, with instant errors for bad length or characters',
        ],
        howToUse: [
          'Pick a count, optionally enter a fixed millisecond timestamp (or leave it blank for now), then click "Regenerate"',
          'Click "Copy all" to get newline-separated ULIDs that sort lexicographically by creation time',
          'Paste any ULID into the parse card to inspect its time and random part instantly',
        ],
        useCases: [
          'Time-sortable unique keys in distributed systems and databases (logs, events, orders)',
          'Replacing auto-increment IDs that reveal business volume while keeping index-friendly ordering',
          'Decoding a ULID from elsewhere into a readable creation time during debugging',
        ],
        privacyNote:
          'Timestamps and random values are generated and parsed entirely in the browser with no network requests.',
        faqs: [
          {
            question: 'How is a ULID different from a UUID v4?',
            answer:
              'A UUID v4 is a 36-character (hyphenated) fully random identifier whose string order is unrelated to creation time; a ULID is a 26-character, URL-friendly Crockford Base32 identifier whose first 48 bits encode the millisecond timestamp, so lexicographic sorting equals chronological sorting. That makes ULIDs better suited as sortable database keys and log IDs, while 80 random bits still keep collisions negligible.',
          },
          {
            question: 'Can IDs generated in the same millisecond collide?',
            answer:
              'No. The tool implements spec monotonicity: when time moves forward it draws fresh randomness, and when several IDs fall in the same millisecond it increments the 80-bit random part as an integer and errors only on overflow, keeping results strictly increasing. Failure requires exhausting the random part within one millisecond (roughly 2^80 increments), which cannot happen in practice.',
          },
        ],
      },
    },
  },
  {
    slug: 'snowflake-id-parser',
    name: 'Snowflake ID 解析器',
    nameEn: 'Snowflake ID Parser',
    description:
      '按「纪元 + 41 位毫秒时间戳 + 10 位机器位 + 12 位序列号」位布局拆解 Snowflake ID，内置 Twitter/X 与 Discord 纪元并支持自定义纪元，输出创建时间（UTC/本地）、机器位、序列号与十六进制/二进制，并支持反向拼装示例 ID。',
    descriptionEn:
      'Decompose Snowflake IDs into epoch + a 41-bit millisecond timestamp + a 10-bit machine ID + a 12-bit sequence, with built-in Twitter/X and Discord epochs (plus custom epochs), showing the creation time in UTC/local, machine and worker/process fields, sequence, hex and binary, with reverse ID building.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/snowflake-id-parser',
    iconName: 'Snowflake',
    tags: ['Snowflake', 'Discord', '位运算', 'ID 解析'],
    tagsEn: ['Snowflake', 'Discord', 'Bit Twiddling', 'ID Parser'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '175928847299117063',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的 Snowflake ID 解析与拼装工具。Snowflake 是 Twitter/X 提出、Discord 等平台广泛采用的 64 位分布式 ID 方案：最高位保留，随后 41 位是相对平台纪元的毫秒时间戳，再 10 位是机器/Worker 标识（Discord 进一步拆成 5 位 worker + 5 位 process），最低 12 位是同毫秒内自增的序列号。工具基于 BigInt 做无精度损失的 64 位运算，并把结果还原为可读时间。',
        coreFeatures: [
          '64 位 Snowflake ID 位拆解：41 位时间戳 + 10 位机器位 + 12 位序列号',
          '内置 Twitter/X（1288834974657）与 Discord（1420070400000）纪元，支持自定义纪元毫秒值',
          '输出毫秒时间戳、UTC 与本地时间、机器 ID 及 worker/process 拆分、序列号',
          '同步展示十进制、十六进制与补齐 64 位的二进制，方便核对位布局',
          '反向拼装：给定时间戳、机器位与序列号生成示例 ID，再解析可字段一致地往返',
        ],
        howToUse: [
          '粘贴 Snowflake ID（如 Discord 消息/用户/频道链接中的长数字），选择对应平台纪元',
          '查看创建时间、机器位与序列号；Discord ID 会同时显示 worker 与 process 拆分',
          '在「反向拼装」卡片选择时间与机器位/序列号，点击「拼装 ID」生成示例',
        ],
        useCases: [
          '社区运营与客服根据 Discord 消息/用户 ID 还原内容或账号的创建时间',
          '数据迁移与排障时核对 Twitter/X、Discord 等平台 Snowflake ID 的来源机器与顺序',
          '开发联调时构造指定时间戳的测试 Snowflake ID',
        ],
        privacyNote: 'ID 解析与拼装全部在浏览器本地完成，不发起任何网络请求。',
        faqs: [
          {
            question: '为什么不同平台解析同一个 ID 得到的时间不一样？',
            answer:
              'Snowflake 的时间戳是相对各自平台纪元的毫秒差。Twitter/X 纪元是 2010-11-04 的 1288834974657，Discord 纪元是 2015-01-01 的 1420070400000。同一个 ID 套用错误纪元会整体偏移，因此解析前要先选择正确的平台纪元；工具在结果早于纪元时会给出提示。',
          },
          {
            question: '机器位为什么还拆成 worker 和 process？',
            answer:
              '标准 Snowflake 用 10 位机器位（0–1023）标识产生 ID 的节点。Discord 在其官方文档中把这 10 位进一步拆成 5 位内部 worker（0–31）与 5 位 process（0–31）。工具同时展示两种视角：机器 ID 是完整 10 位值，worker/process 是 Discord 风格的 5+5 拆分。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully local parser and builder for 64-bit Snowflake IDs, the distributed identifier scheme introduced by Twitter/X and used by Discord and many others: a reserved top bit, then 41 bits of milliseconds since a platform epoch, then 10 bits of machine/worker identity (Discord splits this into 5 worker bits + 5 process bits), and finally 12 bits of a per-millisecond sequence. All math uses BigInt so 64-bit values stay exact, and timestamps render as readable dates.',
        coreFeatures: [
          '64-bit decomposition into a 41-bit timestamp, 10-bit machine ID, and 12-bit sequence',
          'Built-in Twitter/X (1288834974657) and Discord (1420070400000) epochs plus a custom epoch',
          'Millisecond timestamp, UTC and local time, machine ID with worker/process split, and sequence',
          'Decimal, hexadecimal, and zero-padded 64-bit binary views for checking the bit layout',
          'Reverse builder: assemble an example ID from timestamp, machine, and sequence and round-trip it',
        ],
        howToUse: [
          'Paste a Snowflake ID (such as the long number in a Discord message/user/channel link) and pick the matching epoch',
          'Inspect the creation time, machine fields, and sequence; Discord IDs also show worker and process',
          'Use the builder card with a time, machine ID, and sequence to create an example ID',
        ],
        useCases: [
          'Community managers and support staff dating Discord messages or accounts from their IDs',
          'Data migration and debugging of Snowflake IDs from Twitter/X, Discord, and similar platforms',
          'Generating test Snowflake IDs pinned to specific timestamps during development',
        ],
        privacyNote:
          'All parsing and building happens locally in your browser with no network requests.',
        faqs: [
          {
            question: 'Why does the same ID show different times on different platforms?',
            answer:
              'A Snowflake timestamp is milliseconds relative to each platform\u2019s own epoch. The Twitter/X epoch is 1288834974657 (2010-11-04) and Discord\u2019s is 1420070400000 (2015-01-01), so applying the wrong epoch shifts the result; choose the correct platform before parsing, and the tool warns when the result predates the epoch.',
          },
          {
            question: 'Why is the machine ID also split into worker and process?',
            answer:
              'Classic Snowflake uses 10 machine bits (0\u20131023) for the node that issued the ID. Discord documents those 10 bits as 5 internal worker bits (0\u201331) plus 5 process bits (0\u201331). The tool shows both views: the full 10-bit machine ID and the Discord-style 5+5 worker/process split.',
          },
        ],
      },
    },
  },
  {
    slug: 'number-theory-calculator',
    name: '数论计算器（GCD/LCM/质因数分解）',
    nameEn: 'Number Theory Calculator',
    description:
      '输入 2–10 个整数计算最大公约数 GCD 与最小公倍数 LCM（欧几里得算法、先除后乘防溢出），并对单个整数做质因数分解、列出全部正因数、判定质数/合数，负数自动按绝对值分析。',
    descriptionEn:
      'Compute the GCD and LCM of 2–10 integers with Euclid\u2019s algorithm and overflow-safe division-first multiplication, and analyze a single integer with prime factorization, a sorted list of all positive divisors, and prime/composite classification (negatives use their absolute value).',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/number-theory-calculator',
    iconName: 'Calculator',
    tags: ['最大公约数', '最小公倍数', '质因数分解', '质数'],
    tagsEn: ['GCD', 'LCM', 'Prime Factorization', 'Prime Number'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '360',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的整数数论工具，覆盖算法学习、分数化简与数论验证中最常用的四类计算：多个整数的最大公约数（GCD）与最小公倍数（LCM）、单个数的质因数分解、全部正因数枚举、质数与合数判定。GCD 使用欧几里得辗转相除，LCM 采用先除后乘避免中间乘积溢出，质因数分解与因数枚举均用试除法在 √n 范围内完成。',
        coreFeatures: [
          '2–10 个整数的 GCD / LCM，支持负数与含 0 输入（含 0 时 LCM 为 0）',
          '欧几里得算法 + LCM 先除后乘，结果在安全整数范围内精确',
          '质因数分解输出 n = p1^e1 × p2^e2 形式，并统计正因数个数',
          '成对枚举至 √n，给出升序排列的全部正因数',
          '质数 / 合数 / 单位数（1）/ 零四态分类，负数自动取绝对值',
        ],
        howToUse: [
          '在第一张卡片输入 2–10 个整数（逗号、空格、换行、顿号等分隔），即时得到 GCD 与 LCM',
          '在第二张卡片输入单个整数，查看质因数分解、因数个数、全部因数与质数判定',
          '输入非整数或超出安全整数范围时会给出明确错误提示',
        ],
        useCases: [
          '分数通分与化简、比例合并时求 GCD / LCM',
          '算法与数论学习中验证质因数分解、因数个数与质数判定',
          '编程题与 CTF 中快速分析整数结构',
        ],
        privacyNote: '所有计算均在浏览器本地完成，不发起任何网络请求。',
        faqs: [
          {
            question: '为什么 LCM 要“先除后乘”？',
            answer:
              '直接计算 |a × b| / GCD 时，两个数即使各自在安全整数范围内，乘积也可能超出 Number.MAX_SAFE_INTEGER 而丢失精度。先把其中一个数除以 GCD（结果必然整除），再与另一个数相乘，可以显著缩小中间值；工具内部按 (a / gcd) × b 的顺序计算。',
          },
          {
            question: '0 和 1 算质数吗？负数呢？',
            answer:
              '质数定义是“大于 1 且只有 1 与自身两个正因数”的自然数，因此 0 与 1 既不是质数也不是合数（1 称为单位数）。负整数按其绝对值分析，例如 -13 被视为质数 13。0 没有有限的正因数集合，LCM 中只要含 0 结果就规定为 0。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully local integer number-theory tool covering four everyday tasks for algorithm study, fraction simplification, and verification: the greatest common divisor (GCD) and least common multiple (LCM) of several integers, prime factorization of one integer, enumeration of all its positive divisors, and prime/composite classification. GCD uses Euclid\u2019s algorithm, LCM divides before multiplying to avoid intermediate overflow, and factorization/divisor enumeration use trial division up to \u221An.',
        coreFeatures: [
          'GCD/LCM for 2–10 integers, including negatives and zero (LCM is 0 when any input is 0)',
          'Euclid\u2019s algorithm with division-first LCM, exact within the safe-integer range',
          'Factorization rendered as n = p1^e1 × p2^e2 with the divisor count',
          'Pairwise enumeration to \u221An producing every positive divisor in ascending order',
          'Four-way classification (prime/composite/unit 1/zero); negatives use the absolute value',
        ],
        howToUse: [
          'Enter 2–10 integers in the first card (separated by commas, spaces, newlines, etc.) to get GCD and LCM instantly',
          'Enter one integer in the second card to see its factorization, divisor count, divisors, and primality',
          'Non-integers or values beyond the safe-integer range produce a clear error',
        ],
        useCases: [
          'Reducing fractions and finding common denominators or merged ratios',
          'Verifying factorizations, divisor counts, and primality while learning algorithms or number theory',
          'Quick integer analysis for programming problems and CTF challenges',
        ],
        privacyNote: 'Every computation runs locally in the browser with no network requests.',
        faqs: [
          {
            question: 'Why divide before multiplying for the LCM?',
            answer:
              'Computing |a × b| / GCD directly can overflow Number.MAX_SAFE_INTEGER even when both inputs are safe individually. Dividing one operand by the GCD first (an exact division) and then multiplying by the other keeps the intermediate value much smaller; the tool computes (a / gcd) × b.',
          },
          {
            question: 'Are 0 or 1 prime? What about negative numbers?',
            answer:
              'A prime is a natural number greater than 1 with exactly two positive divisors (1 and itself), so 0 and 1 are neither prime nor composite (1 is a unit). Negative integers are analyzed by absolute value, so -13 is treated as the prime 13. Zero has no finite divisor set, and an LCM containing zero is defined as 0.',
          },
        ],
      },
    },
  },
  {
    slug: 'roman-numeral-converter',
    name: '罗马数字转换器',
    nameEn: 'Roman Numeral Converter',
    description:
      '在 1–3999 范围内完成整数与标准减法记法罗马数字的双向精确转换（IV/IX/XL/XC/CD/CM），严格拒绝 IIII、VX、IC、MMMM 等非法写法，并支持逐行批量转换。',
    descriptionEn:
      'Convert integers (1–3999) to and from standard subtractive Roman numerals (IV/IX/XL/XC/CD/CM), strictly rejecting non-canonical forms such as IIII, VX, IC, and MMMM, with line-by-line batch conversion.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/roman-numeral-converter',
    iconName: 'Type',
    tags: ['罗马数字', '数制转换', '编号', '批量转换'],
    tagsEn: ['Roman Numerals', 'Number Conversion', 'Numbering', 'Batch Conversion'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '1994',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的罗马数字转换工具，在 1–3999 范围内完成整数与罗马数字的双向精确转换。整数转罗马按 1000/900/500/400/…/1 的「值-符号」降序表贪心匹配，天然输出标准减法记法（IV、IX、XL、XC、CD、CM）；罗马转整数逐字符查表，当前字符值小于右侧字符值时减去、否则累加，并通过「解码后重新规范化编码必须与输入一致」严格校验合法性，拒绝 IIII、VX、IC、MMMM 等非标准写法。',
        coreFeatures: [
          '整数 ↔ 罗马数字双向转换，自动识别输入方向，也可手动指定',
          '标准减法记法：1994 → MCMXCIV、3999 → MMMCMXCIX',
          '严格合法性校验：拒绝 IIII、VX、IC、MMMM 及含非罗马字符、空串等输入',
          '0、负数、大于 3999、小数等越界整数给出明确错误提示',
          '逐行批量转换，表格展示每行结果或错误，一键复制全部输出',
        ],
        howToUse: [
          '在单行卡片输入整数（如 1994）或罗马数字（如 MCMXCIV），即时显示转换结果',
          '通过顶部切换按钮可强制「整数 → 罗马」或「罗马 → 整数」方向',
          '在批量卡片中每行输入一个值，结果表格逐行给出转换值或错误原因',
          '罗马数字输入容忍大小写与首尾空白，但必须是标准减法记法',
        ],
        useCases: [
          '文档编号、书籍章节、影视续集与钟表刻度等罗马数字书写',
          '年份、君主/教皇名号等罗马数字的解读与换算',
          '编程题与算法学习中验证罗马数字转换逻辑',
        ],
        privacyNote: '所有转换均在浏览器本地完成，不发起任何网络请求。',
        faqs: [
          {
            question: '为什么 IIII、VX、IC、MMMM 会被判定为非法？',
            answer:
              '标准罗马数字采用减法记法并有固定规则：4 写作 IV 而非 IIII，9 写作 IX；减法组合只允许 I/ X/ C 出现在 V/ X、L/ C、D/ M 之前（即 IV、IX、XL、XC、CD、CM 六种），V、L、D 永不做减法，因此 VX（5 当作 5-10）、IC（99 直接用 I 减 C）都不合法；同一符号连续重复最多 3 次，所以 4000 不能写作 MMMM，工具支持的上限是 3999（MMMCMXCIX）。',
          },
          {
            question: '工具是如何保证罗马数字输入合法的？',
            answer:
              '先按字符查表累加（左小右大则减），得到整数后再用贪心算法把该整数重新编码为标准罗马数字；只有重新编码的结果与去空白、大写化后的输入完全一致时才接受。任何非标准写法在这一步都会暴露，从而给出明确错误，同时也保证双向转换互为逆运算。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully local tool that converts between integers (1–3999) and Roman numerals in both directions. Integer-to-Roman uses a greedy match against the descending value-symbol table (1000/900/500/400/…/1), which always yields canonical subtractive notation (IV, IX, XL, XC, CD, CM). Roman-to-integer reads the symbol table character by character, subtracting when a symbol is smaller than the one to its right and adding otherwise, then validates canonicity by re-encoding the decoded integer—rejecting non-standard forms such as IIII, VX, IC, and MMMM.',
        coreFeatures: [
          'Bidirectional integer ↔ Roman numeral conversion with automatic direction detection (or manual override)',
          'Canonical subtractive notation: 1994 → MCMXCIV, 3999 → MMMCMXCIX',
          'Strict validation rejecting IIII, VX, IC, MMMM, non-Roman characters, and empty input',
          'Clear errors for out-of-range integers: zero, negatives, values above 3999, and decimals',
          'Line-by-line batch conversion with a per-row result/error table and one-click copy',
        ],
        howToUse: [
          'Enter an integer (e.g., 1994) or a Roman numeral (e.g., MCMXCIV) in the single-line card to see the result instantly',
          'Use the top toggle to force "integer → Roman" or "Roman → integer" direction',
          'Put one value per line in the batch card; the table shows each converted value or its error',
          'Roman input is case-insensitive and tolerates surrounding whitespace but must use canonical subtractive notation',
        ],
        useCases: [
          'Writing Roman numerals for document numbering, book chapters, sequels, and clock faces',
          'Reading and converting years or regnal/papal names written in Roman numerals',
          'Verifying Roman-numeral conversion logic for programming problems and algorithm study',
        ],
        privacyNote: 'Every conversion runs locally in the browser with no network requests.',
        faqs: [
          {
            question: 'Why are IIII, VX, IC, and MMMM considered invalid?',
            answer:
              'Canonical Roman numerals follow fixed subtractive rules: 4 is IV rather than IIII, 9 is IX; subtractive pairs are limited to IV, IX, XL, XC, CD, and CM, and V, L, D are never subtracted, so VX and IC are invalid. No symbol may repeat more than three times, so 4000 cannot be written as MMMM—the supported maximum is 3999 (MMMCMXCIX).',
          },
          {
            question: 'How does the tool validate Roman numeral input?',
            answer:
              'It first decodes the symbols into an integer (subtracting when a smaller symbol precedes a larger one), then greedily re-encodes that integer into canonical form. The input is accepted only if the re-encoded string exactly matches the trimmed, uppercased input. Every non-standard spelling fails this round-trip check, which also guarantees the two directions are exact inverses.',
          },
        ],
      },
    },
  },
  {
    slug: 'line-ending-converter',
    name: '换行符转换器',
    nameEn: 'Line Ending Converter',
    description:
      '检测文本中 LF / CRLF / CR 行结束符的数量与混排情况、UTF-8 BOM、末尾换行与字节大小，并一键在 LF（Unix/macOS）、CRLF（Windows）、CR（经典 Mac）之间归一化转换。',
    descriptionEn:
      'Detect LF/CRLF/CR line ending counts and mixed endings, UTF-8 BOM, final newline, and byte size, then normalize line endings in one click between LF (Unix/macOS), CRLF (Windows), and CR (classic Mac).',
    category: ToolCategoryEnum.TEXT_CONTENT,
    path: '/tools/line-ending-converter',
    iconName: 'AlignLeft',
    tags: ['换行符', 'LF', 'CRLF', 'BOM', '文本规范化'],
    tagsEn: ['Line Endings', 'LF', 'CRLF', 'BOM', 'Text Normalization'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'name,email\r\n张三,zhangsan@example.com\r\n李四,lisi@example.com\r\n',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的换行符检测与转换工具。它按「先匹配 CRLF（\\r\\n），再匹配独立 LF（\\n）与 CR（\\r）」的顺序扫描文本，精确统计三种行结束符各自的出现次数、判定是否混排（mixed line endings），并报告总行数、UTF-8 字节大小、末尾是否以换行符结尾以及开头是否存在 UTF-8 BOM（U+FEFF / EF BB BF）；转换时将全部行结束符统一替换为目标格式（LF / CRLF / CR），可选剥离开头 BOM，并给出转换前后的字节变化（如 CRLF→LF 每个换行节省 1 字节）。',
        coreFeatures: [
          '检测 LF、CRLF、CR 三种行结束符的数量、主导类型与混排情况',
          '一键在 LF（Unix/macOS）、CRLF（Windows）、CR（经典 Mac）之间归一化',
          '检测开头 UTF-8 BOM（EF BB BF），转换时可选剥离',
          '显示总行数、末尾换行有无、转换前后 UTF-8 字节大小与差值',
          '纯字符串扫描，零新增依赖，全部处理在浏览器本地完成',
        ],
        howToUse: [
          '将文本粘贴到输入框，下方立即显示各类换行符计数与文本结构信息',
          '通过按钮选择目标换行符（LF / CRLF / CR），输出框实时给出归一化结果',
          '勾选或取消「剥离开头 BOM」控制是否移除开头的 U+FEFF 字符',
          '点击「复制转换结果」获取归一化后的文本',
        ],
        useCases: [
          '消除跨平台协作时 git diff 因 CRLF/LF 不一致导致的整文件变动',
          '修复 shell 脚本在 Linux 上的 bad interpreter: ^M 报错',
          '清洗从旧 Windows 系统或大型机导出的 CR / CRLF 文本',
          '检查文件是否带 BOM、是否缺少末尾换行等提交规范问题',
        ],
        privacyNote: '所有检测与转换均在浏览器本地完成，不发起任何网络请求。',
        faqs: [
          {
            question: '混排时三种换行符的计数会不会重复？',
            answer:
              '不会。扫描正则按 \\r\\n、\\r、\\n 的优先级匹配：一个 CRLF 会被整体识别为 1 个 CRLF，而不是 1 个 CR 加 1 个 LF；只有独立出现的 \\n 与 \\r 才计入各自计数，因此总数与实际行结束符数量严格相等。',
          },
          {
            question: '转换后字节数是如何变化的？',
            answer:
              'CRLF 占 2 字节、LF 与 CR 各占 1 字节：CRLF→LF/CR 每个换行节省 1 字节，LF/CR→CRLF 每个换行增加 1 字节，同格式转换字节不变。若同时剥离了开头 BOM（UTF-8 下 EF BB BF 占 3 字节），差值中还会包含这 3 字节的减少。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully local tool that inspects and converts text line endings. It scans in priority order—CRLF (\\r\\n) first, then standalone LF (\\n) and CR (\\r)—to count each ending precisely, detect mixed line endings, and report the total line count, UTF-8 byte size, final-newline presence, and a leading UTF-8 BOM (U+FEFF / EF BB BF). Conversion replaces every ending with the chosen target (LF, CRLF, or CR), optionally strips a leading BOM, and shows the byte-size delta (e.g., CRLF→LF saves one byte per line).',
        coreFeatures: [
          'Counts LF, CRLF, and CR endings with dominant type and mixed-ending detection',
          'One-click normalization among LF (Unix/macOS), CRLF (Windows), and CR (classic Mac)',
          'Detects a leading UTF-8 BOM (EF BB BF) with optional stripping',
          'Shows line count, final newline state, and UTF-8 byte size before/after conversion',
          'Pure string scanning with zero new dependencies, entirely in the browser',
        ],
        howToUse: [
          'Paste text into the input area; per-type ending counts and structure info appear immediately',
          'Pick the target ending (LF / CRLF / CR) to see the normalized output in real time',
          'Toggle "strip leading BOM" to control removal of the leading U+FEFF character',
          'Click "copy result" to take the normalized text',
        ],
        useCases: [
          'Removing whole-file git diff noise caused by inconsistent CRLF/LF across platforms',
          'Fixing "bad interpreter: ^M" errors when shell scripts run on Linux',
          'Cleaning CR/CRLF text exported from legacy Windows or mainframe systems',
          'Checking files for BOM presence and missing final newline before committing',
        ],
        privacyNote: 'All analysis and conversion run locally in the browser with no network requests.',
        faqs: [
          {
            question: 'Are the three ending counts double-counted when endings are mixed?',
            answer:
              'No. The scanner matches \\r\\n before \\r and \\n: a CRLF is counted once as CRLF rather than as one CR plus one LF, and only standalone \\n and \\r characters are counted separately, so the totals exactly equal the real ending occurrences.',
          },
          {
            question: 'How does the byte size change after conversion?',
            answer:
              'CRLF takes 2 bytes while LF and CR each take 1: CRLF→LF/CR saves one byte per ending, LF/CR→CRLF adds one, and converting to the same format changes nothing. If the leading BOM is also stripped (EF BB BF is 3 bytes in UTF-8), the delta includes an additional 3-byte reduction.',
          },
        ],
      },
    },
  },
  {
    slug: 'decimal-fraction-converter',
    name: '小数分数互转器',
    nameEn: 'Decimal Fraction Converter',
    description:
      '基于 BigInt 有理数运算，在有限小数、循环小数（圆括号记法）、最简分数、带分数与百分数之间精确互转，自动标注循环节并展示约分与长除法过程，无浮点误差。',
    descriptionEn:
      'Exact conversion between terminating/repeating decimals (parenthesis notation), reduced fractions, mixed numbers, and percentages using BigInt rational arithmetic—with repeat detection and step-by-step reduction, free of floating-point error.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/decimal-fraction-converter',
    iconName: 'Percentage',
    tags: ['小数', '分数', '百分数', '循环小数', '有理数'],
    tagsEn: ['Decimal', 'Fraction', 'Percentage', 'Repeating Decimal', 'Rational Number'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '0.1(6)',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的小数与分数精确互转工具。所有数值都以 BigInt 表示的有理数（分子/分母）参与运算，从根本上避免 0.1 + 0.2 这类浮点误差。小数转分数时，有限小数直接写成分母 10ⁿ 再约分；循环小数（如 0.1(6)、33.(3)%）按代数法处理——设 A 为含整数部分与不循环部分的数字、B 为 A 后接循环节组成的数字，分子 = B − A，分母 = 10^m × (10^n − 1)（m 为不循环位数、n 为循环节长度）。分数转小数用长除法并记录每个余数首次出现的位置，余数重复即定位循环节，以圆括号输出（如 1/7 → 0.(142857)）。',
        coreFeatures: [
          '小数（含负数、.5 简写）→ 最简分数，自动约分并给出带分数写法',
          '循环小数识别与互转：0.(3)、0.1(6)、1.2(14) 等圆括号记法，循环节最长支持 1000 位',
          '分数 → 小数长除法展开，自动判定有限 / 循环并标出循环节与循环节长度',
          '百分数 ↔ 分数互转（25% ↔ 1/4、33.(3)% ↔ 1/3），带分数与假分数互化',
          '展示约分（gcd）与循环小数代数推导过程；BigInt 精确运算，零新增依赖',
        ],
        howToUse: [
          '通过顶部按钮选择转换方向：小数→分数、分数→小数、百分数→分数、分数→百分数、带分数↔假分数',
          '小数模式输入如 0.25、-1.25、0.(3)、0.1(6)，循环节放在圆括号内',
          '分数模式输入如 3/4、-5/2，带分数写作「1 1/2」（整数与分数间空格）',
          '结果区即时显示最简形式、循环节标签与可复制的结果，并附计算过程说明',
        ],
        useCases: [
          '数学作业中循环小数化分数、分数化小数的答案核对与步骤讲解',
          '配方、配比与工程取值中把无限小数表达为精确分数，避免舍入误差',
          '百分数与分数互化时处理 33.(3)% 这类非有限百分数',
        ],
        privacyNote: '所有运算均在浏览器本地完成，不发起任何网络请求。',
        faqs: [
          {
            question: '循环小数是怎样化成分数的？',
            answer:
              '采用代数消元法。对 0.1(6)（1 位不循环、1 位循环）：设 A=1、B=16，分子 = B − A = 15，分母 = 10¹ × (10¹ − 1) = 90，即 15/90，约分得 1/6。一般地，m 位不循环、n 位循环时，分子 =（含整数部分的全部数字拼接值）−（整数与不循环部分的拼接值），分母 = 10^m × (10^n − 1)，最后用 gcd 约分。纯循环小数（如 0.(142857)）m=0，分母即 999999。',
          },
          {
            question: '为什么不直接用 JavaScript 的 Number 计算？',
            answer:
              'Number 是 IEEE-754 双精度浮点数，0.1 + 0.2 = 0.30000000000000004，且无法精确表达 1/3 这类无限循环小数。本工具全部使用 BigInt 分子/分母运算：比较、约分（欧几里得 gcd）、长除法都在整数域完成，只有最终展示时才转成十进制文本，因此任意有理数都能精确往返互转（如 17/23 → 0.(7391304347826086956521) → 17/23）。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully local tool for exact conversion between decimals and fractions. Every value is represented as a BigInt rational (numerator/denominator), eliminating floating-point errors such as 0.1 + 0.2. Terminating decimals are written over 10ⁿ and reduced; repeating decimals (e.g., 0.1(6), 33.(3)%) use the algebraic method—if A is the digits through the non-repeating part and B is A followed by the repeat block, numerator = B − A and denominator = 10^m × (10^n − 1), where m is the non-repeating length and n the repeat length. Fraction-to-decimal performs long division while recording the first position of each remainder; a repeated remainder locates the cycle, printed in parentheses (e.g., 1/7 → 0.(142857)).',
        coreFeatures: [
          'Decimals (including negatives and .5 shorthand) to reduced fractions with mixed-number form',
          'Repeating-decimal support: 0.(3), 0.1(6), 1.2(14) in parenthesis notation, cycles up to 1000 digits',
          'Fraction-to-decimal long division with automatic terminating/repeating detection and cycle length',
          'Percentage ↔ fraction conversion (25% ↔ 1/4, 33.(3)% ↔ 1/3) and mixed ↔ improper fraction conversion',
          'Shows gcd reduction and the algebraic derivation; precise BigInt arithmetic, zero new dependencies',
        ],
        howToUse: [
          'Pick a direction at the top: decimal→fraction, fraction→decimal, percent→fraction, fraction→percent, or mixed↔improper',
          'In decimal mode enter values like 0.25, -1.25, 0.(3), 0.1(6), placing the repeat block in parentheses',
          'In fraction mode enter values like 3/4 or -5/2; mixed numbers are written as "1 1/2" (space between)',
          'The result area instantly shows the reduced form, repeat tags, a copyable value, and step-by-step work',
        ],
        useCases: [
          'Checking homework answers for repeating-decimal/fraction conversion with explanatory steps',
          'Expressing endless decimals as exact fractions in recipes, ratios, and engineering values',
          'Handling non-terminating percentages such as 33.(3)% when converting between percent and fraction',
        ],
        privacyNote: 'All computation runs locally in the browser with no network requests.',
        faqs: [
          {
            question: 'How is a repeating decimal converted to a fraction?',
            answer:
              'Via algebraic elimination. For 0.1(6) (one non-repeating digit, one repeating digit): let A = 1 and B = 16; numerator = B − A = 15, denominator = 10¹ × (10¹ − 1) = 90, giving 15/90, which reduces to 1/6. In general, with m non-repeating and n repeating digits, numerator = (all digits concatenated) − (integer and non-repeating digits concatenated), denominator = 10^m × (10^n − 1), then reduce by the gcd. A purely repeating decimal such as 0.(142857) has m = 0 and denominator 999999.',
          },
          {
            question: 'Why not just use JavaScript Number?',
            answer:
              'Number is an IEEE-754 double, so 0.1 + 0.2 = 0.30000000000000004 and values like 1/3 cannot be represented exactly. This tool keeps everything as BigInt numerator/denominator pairs—comparison, gcd reduction, and long division all happen over integers—and decimal text is produced only for display, so any rational number round-trips exactly (e.g., 17/23 → 0.(7391304347826086956521) → 17/23).',
          },
        ],
      },
    },
  },
  {
    slug: 'mac-address-converter',
    name: 'MAC 地址格式转换与校验',
    nameEn: 'MAC Address Format Converter & Validator',
    description:
      '解析冒号、连字符、Cisco 点分与裸十六进制四种写法的 MAC-48 / EUI-64 地址，一键互转并规范化大小写，同时校验合法性、解读 I/G 单播组播位与 U/L 全球/本地管理位、拆分 OUI 与设备标识，并为 MAC-48 派生 EUI-64。',
    descriptionEn:
      'Parse MAC-48/EUI-64 addresses in colon, hyphen, Cisco dotted, and bare-hex notations, convert between all four formats with normalized case, validate input, decode the I/G (unicast/multicast) and U/L (universal/local) bits, split OUI from device identifier, and derive EUI-64 from a MAC-48 address.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/mac-address-converter',
    iconName: 'Fingerprint',
    tags: ['MAC 地址', 'EUI-64', 'OUI', '网络', '格式转换'],
    tagsEn: ['MAC Address', 'EUI-64', 'OUI', 'Networking', 'Format Conversion'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'AA:BB:CC:DD:EE:FF',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的 MAC 地址校验与格式转换工具。输入任意一种常见写法——冒号分隔（AA:BB:CC:DD:EE:FF）、连字符分隔（AA-BB-CC-DD-EE-FF）、Cisco 三点分（aabb.ccdd.eeff）或连续裸十六进制（AABBCCDDEEFF）——即可自动识别格式、校验合法性，并同时输出四种规范写法。工具还会解读首位字节的两个标志位：最低位 bit0 为 I/G 位（0 单播、1 组播），次低位 bit1 为 U/L 位（0 厂商分配的全球唯一地址 UAA、1 软件设置的本地管理地址 LAA）；同时拆分前 3 字节 OUI 厂商代码与其余字节的设备标识。对 6 字节 MAC-48，工具按 RFC 2373 在 OUI 与设备标识之间插入 FF:FE 派生 8 字节 EUI-64（不翻转 U/L 位）。',
        coreFeatures: [
          '自动识别冒号、连字符、Cisco 点分、裸十六进制四种输入，同时支持 MAC-48（6 字节）与 EUI-64（8 字节）',
          '一次解析输出全部四种规范格式，可切换 A-F 大小写，每行结果一键复制',
          '严格校验：每组位数、非法字符、组数（如 Cisco 3 组 / 4 组）与总长度，错误信息中文说明原因',
          '解读首字节 I/G（单播/组播）与 U/L（全球唯一/本地管理）标志位，给出 8 位二进制与 OUI、设备标识拆分',
          'MAC-48 → EUI-64 派生（插入 FF:FE）；纯本地运算，零新增依赖',
        ],
        howToUse: [
          '在输入框粘贴或输入 MAC 地址，四种写法均可，工具会自动识别并即时校验',
          '勾选「大写输出」可在大写（AA:BB:...）与小写（aa:bb:...）之间切换全部结果',
          '查看结果区的传输类型、管理方式标签，以及 OUI 厂商代码与设备标识',
          'MAC-48 地址会额外显示 EUI-64 派生值；在输出表格中点击「复制」即可取走所需格式',
        ],
        useCases: [
          '网络运维中把交换机、路由器配置里的 MAC 写法互转（如 Cisco aabb.ccdd.eeff ↔ 标准冒号格式）',
          '配置白名单 / ACL / DHCP 静态绑定时核对 MAC 合法性并统一大小写与分隔符',
          'IPv6 无状态自动配置（SLAAC）教学中理解 MAC-48 到 EUI-64 的 FF:FE 插入过程',
        ],
        privacyNote: '所有解析与转换均在浏览器本地完成，不发起任何网络请求。',
        faqs: [
          {
            question: 'I/G 位和 U/L 位分别是什么？',
            answer:
              '它们是 MAC 地址首字节最低的两个比特。bit0 是 I/G（Individual/Group）位：0 表示单播地址（指向一块网卡），1 表示组播地址（如 01:00:5E:...），FF:FF:FF:FF:FF:FF 广播地址该位也为 1。bit1 是 U/L（Universal/Local）位：0 表示由厂商烧录、OUI 全局唯一的地址（UAA），1 表示由软件/管理员自行设置的本地管理地址（LAA，常见于虚拟机、随机化 MAC）。例如首字节 0x02 = 00000010，即全球单播位不变、本地管理位置位。',
          },
          {
            question: 'MAC-48 派生 EUI-64 时为什么插入 FF:FE？会不会翻转 U/L 位？',
            answer:
              '按 RFC 2373 的 IPv6 接口标识符规则，把 6 字节 MAC-48 从中间（OUI 之后）切开，插入固定两字节 FF:FE，即得到 8 字节 EUI-64，如 AA:BB:CC:DD:EE:FF → AA:BB:CC:FF:FE:DD:EE:FF。需要注意：EUI-64 标识符本身只是插入 FF:FE；而从 EUI-64 生成 IPv6 链路本地地址（fe80::/64）时才要求把首字节的 U/L 位翻转。本工具只做 EUI-64 派生，不翻转 U/L 位，并在结果中保留原地址的标志位解读。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully local MAC address validator and format converter. Paste any common notation—colon-separated (AA:BB:CC:DD:EE:FF), hyphen-separated (AA-BB-CC-DD-EE-FF), Cisco dotted (aabb.ccdd.eeff), or contiguous bare hex (AABBCCDDEEFF)—and the tool auto-detects the format, validates it, and emits all four canonical notations at once. It also decodes the two flag bits in the first octet: the least-significant bit (bit 0) is the I/G bit (0 unicast, 1 multicast), and bit 1 is the U/L bit (0 universally administered/UAA burned in by the vendor, 1 locally administered/LAA set by software). It splits the 3-byte OUI from the device identifier and, for a 6-byte MAC-48, derives an 8-byte EUI-64 per RFC 2373 by inserting FF:FE between the OUI and device identifier (without flipping the U/L bit).',
        coreFeatures: [
          'Auto-detects colon, hyphen, Cisco dotted, and bare-hex input; supports both MAC-48 (6 bytes) and EUI-64 (8 bytes)',
          'One parse emits all four canonical notations, with an A-F uppercase toggle and per-row copy buttons',
          'Strict validation of per-group width, illegal characters, group count (e.g., Cisco 3 vs 4 groups), and total length, with clear error messages',
          'Decodes the first-octet I/G (unicast/multicast) and U/L (universal/local) bits, shows 8-bit binary, and splits OUI from device identifier',
          'MAC-48 → EUI-64 derivation (FF:FE insertion); purely local computation with zero new dependencies',
        ],
        howToUse: [
          'Paste or type a MAC address in any of the four notations; the format is detected and validated instantly',
          'Toggle "uppercase output" to switch every result between uppercase (AA:BB:...) and lowercase (aa:bb:...)',
          'Review the transmission-type and administration tags plus the OUI vendor code and device identifier',
          'MAC-48 input additionally shows the derived EUI-64; click "copy" on any output row to take the notation you need',
        ],
        useCases: [
          'Converting MAC notations across switch/router configs in network operations (e.g., Cisco aabb.ccdd.eeff ↔ standard colon form)',
          'Validating MAC addresses and normalizing case/separators for whitelists, ACLs, or static DHCP bindings',
          'Teaching the MAC-48 to EUI-64 FF:FE insertion used by IPv6 stateless autoconfiguration (SLAAC)',
        ],
        privacyNote: 'All parsing and conversion run locally in the browser with no network requests.',
        faqs: [
          {
            question: 'What are the I/G bit and the U/L bit?',
            answer:
              'They are the two least-significant bits of the first MAC octet. Bit 0 is the I/G (Individual/Group) bit: 0 means unicast (a single NIC) and 1 means multicast (e.g., 01:00:5E:...); the broadcast FF:FF:FF:FF:FF:FF also has this bit set. Bit 1 is the U/L (Universal/Local) bit: 0 means a vendor-burned, OUI-globally-unique address (UAA), while 1 means a locally administered address (LAA) set by software or an administrator, common for VMs and randomized MACs. For example, a first octet of 0x02 (00000010) is unicast but locally administered.',
          },
          {
            question: 'Why is FF:FE inserted for EUI-64, and is the U/L bit flipped?',
            answer:
              'Per RFC 2373, the 6-byte MAC-48 is split after the OUI and the fixed two bytes FF:FE are inserted to form an 8-byte EUI-64—AA:BB:CC:DD:EE:FF becomes AA:BB:CC:FF:FE:DD:EE:FF. Note that EUI-64 derivation itself only inserts FF:FE; flipping the first-octet U/L bit is a separate step applied only when building an IPv6 link-local address (fe80::/64) from the EUI-64 identifier. This tool performs EUI-64 derivation only, leaves the U/L bit untouched, and keeps the original flag-bit analysis in its output.',
          },
        ],
      },
    },
  },
  {
    slug: 'number-to-words',
    name: '数字英文读法转换器',
    nameEn: 'Number to English Words',
    description:
      '将整数或金额数字转换为规范英文读法：基数词（12345 → twelve thousand three hundred forty-five）、序数词（21st → twenty-first）与美元支票读法（123.45 → one hundred twenty-three dollars and forty-five cents），支持短级差大数、负数与连字符开关。',
    descriptionEn:
      'Convert numbers to canonical English: cardinal words (12345 → twelve thousand three hundred forty-five), ordinals (21st → twenty-first), and USD check amounts (123.45 → one hundred twenty-three dollars and forty-five cents), with short-scale large numbers, negatives, and a hyphenation toggle.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/number-to-words',
    iconName: 'UnorderedList',
    tags: ['数字读法', '英文', '基数词', '序数词', '支票金额'],
    tagsEn: ['Number Words', 'English', 'Cardinal', 'Ordinal', 'Check Amount'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '12345',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的数字英文读法工具，输出符合英语书写规范的 cardinal number words。整数采用短级差（short scale）按 3 位分节：thousand、million、billion、trillion；21-99 的复合词默认加连字符（twenty-one，遵循 Chicago/APA 等主流风格指南）。提供三种模式：基数词（整数或小数，小数按 point 逐位读出，如 3.14 → three point one four）、序数词（1 → first、21 → twenty-first、100 → one hundredth，复合序数词仅末位变形）、美元金额支票读法（123.45 → one hundred twenty-three dollars and forty-five cents，自动处理 dollar/dollars 与 cent/cents 单复数）。支持前导正负号、千分位逗号输入，内部用 BigInt 处理整数避免大数丢精度，支持绝对值小于 10¹⁵ 的整数。',
        coreFeatures: [
          '基数词模式：短级差 thousand / million / billion / trillion，覆盖负数与零（zero）',
          '序数词模式：first、second、third、fifth、twelfth 等不规则变形，复合词仅末位变序数',
          '美元金额模式：dollars and cents 支票读法，一位小数按十分位补零，自动单复数',
          '支持千分位逗号、正负号、小数逐位读法；可切换 twenty-one 连字符规则',
          'BigInt 整数运算，支持至 999 万亿；纯本地确定性算法，零新增依赖',
        ],
        howToUse: [
          '顶部选择模式：基数词、序数词或美元金额',
          '输入数字，如 12345、1,234,567、-42、3.14（基数词）、21（序数词）、123.45（金额）',
          '通过复选框切换复合词连字符（twenty-one ↔ twenty one）',
          '结果即时显示在绿色结果条中，点击「复制英文读法」即可取走',
        ],
        useCases: [
          '填写英文支票、合同与发票金额的美元英文表述',
          '生成测试数据、英文报表中的数字自然语言描述',
          '英语学习与教学中核对基数词、序数词与大数分节读法',
        ],
        privacyNote: '所有运算均在浏览器本地完成，不发起任何网络请求。',
        faqs: [
          {
            question: '什么是短级差（short scale）？',
            answer:
              '短级差是美式英语及当代英语世界通用的大数命名体系，每增加 3 位（1000 倍）换一个新单位：thousand（10³）、million（10⁶）、billion（10⁹）、trillion（10¹²）。例如 1,234,567 读作 one million two hundred thirty-four thousand five hundred sixty-seven。注意它与英式旧称「长级差」（billion 表示 10¹²）不同；本工具遵循短级差。',
          },
          {
            question: '为什么 forty-two 有连字符？金额里 1 dollar 为什么是单数？',
            answer:
              'Chicago Manual of Style、APA 等主流英文写作规范要求 21-99 的复合基数词在书写时加连字符，如 forty-two、twenty-one、one hundred twenty-three；序数词同理（twenty-first）。可通过复选框关闭。金额模式遵循支票惯例：整数部分精确为 1 时用单数 dollar（one dollar and ...），其余一律 dollars；美分精确为 1 时用 cent，否则 cents；没有小数时读作 ... and zero cents。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully local tool that turns numbers into canonical English cardinal number words. Integers use the short scale in groups of three: thousand, million, billion, trillion; compound numbers 21–99 are hyphenated by default (twenty-one, per mainstream style guides such as Chicago/APA). Three modes are offered: cardinals (integers or decimals, with the fraction read digit by digit after "point", e.g., 3.14 → three point one four), ordinals (1 → first, 21 → twenty-first, 100 → one hundredth; only the final word is ordinalized), and USD check amounts (123.45 → one hundred twenty-three dollars and forty-five cents, with automatic dollar/dollars and cent/cents singular forms). Signed input and thousands separators are accepted, integers are handled with BigInt to avoid precision loss, and absolute values below 10¹⁵ are supported.',
        coreFeatures: [
          'Cardinal mode: short-scale thousand/million/billion/trillion, including negatives and zero',
          'Ordinal mode: irregular forms (first, second, third, fifth, twelfth); only the last word of a compound is ordinalized',
          'USD money mode: dollars-and-cents check reading, one decimal digit zero-padded as dimes, automatic singular/plural units',
          'Accepts thousands separators, signs, and digit-by-digit decimals; toggleable twenty-one hyphenation rule',
          'BigInt integer math up to 999 trillion; deterministic local algorithm with zero new dependencies',
        ],
        howToUse: [
          'Pick a mode at the top: cardinal, ordinal, or USD money',
          'Enter a number such as 12345, 1,234,567, -42, 3.14 (cardinal), 21 (ordinal), or 123.45 (money)',
          'Use the checkbox to toggle compound hyphenation (twenty-one vs twenty one)',
          'The result appears instantly in the green banner; click "copy English words" to take it',
        ],
        useCases: [
          'Writing USD amounts on English-language checks, contracts, and invoices',
          'Generating natural-language numbers for test data and English reports',
          'Learning or teaching English cardinal words, ordinals, and large-number grouping',
        ],
        privacyNote: 'All computation runs locally in the browser with no network requests.',
        faqs: [
          {
            question: 'What is the short scale?',
            answer:
              'The short scale is the large-number naming system used in American English and today’s English-speaking world: every additional group of three digits (a factor of 1000) introduces a new unit—thousand (10³), million (10⁶), billion (10⁹), trillion (10¹²). For example, 1,234,567 is read as one million two hundred thirty-four thousand five hundred sixty-seven. It differs from the historical British "long scale" (where a billion meant 10¹²); this tool follows the short scale.',
          },
          {
            question: 'Why is forty-two hyphenated, and why is 1 dollar singular?',
            answer:
              'Mainstream English style guides (Chicago Manual of Style, APA) require compound cardinals from 21 to 99 to be hyphenated—forty-two, twenty-one, one hundred twenty-three—and ordinals follow suit (twenty-first). The checkbox disables this. Money mode follows check-writing convention: exactly one whole unit uses the singular "one dollar and ...", everything else uses dollars; exactly one cent uses cent, otherwise cents; with no fractional part it reads "... and zero cents".',
          },
        ],
      },
    },
  },
  {
    slug: 'fullwidth-halfwidth-converter',
    name: '全角半角字符转换器',
    nameEn: 'Fullwidth / Halfwidth Converter',
    description:
      '基于固定 Unicode 码位映射（U+FF01–U+FF5E ↔ U+0021–U+007E、U+3000 ↔ U+0020）在全角与半角之间双向批量转换，支持按全部 / 仅字母数字 / 仅标点与空格三种范围处理，并统计字母数字、标点、空格的替换数量。',
    descriptionEn:
      'Batch-convert between fullwidth and halfwidth characters via fixed Unicode mappings (U+FF01–U+FF5E ↔ U+0021–U+007E and U+3000 ↔ U+0020), with all / alphanumeric-only / punctuation-and-space scopes and per-category replacement counts.',
    category: ToolCategoryEnum.TEXT_CONTENT,
    path: '/tools/fullwidth-halfwidth-converter',
    iconName: 'Shuffle',
    tags: ['全角', '半角', 'Unicode', '文本处理', '标点'],
    tagsEn: ['Fullwidth', 'Halfwidth', 'Unicode', 'Text Tools', 'Punctuation'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'Ｈｅｌｌｏ，Ｗｏｒｌｄ！',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的全角 / 半角批量转换工具。中文输入法误切换时常在代码、命令行参数、配置文件、SQL 中混入全角字符（如 ＡＢＣ、１２３、全角逗号与感叹号、全角空格），引发难以定位的语法错误。本工具依据固定的 Unicode 码位映射进行双向转换：全角区 U+FF01–U+FF5E 与 ASCII 可打印区 U+0021–U+007E 一一对应（码位差恰好为 0xFEE0），全角空格 U+3000（表意文字空格）对应普通空格 U+0020。可选择三种范围：全部、仅字母数字（A-Z/a-z/0-9）、仅标点与空格，并分别统计三类替换数量。映射区之外的字符（中文汉字、中文弯引号 “”、emoji 等）原样保留。',
        coreFeatures: [
          '全角 → 半角、半角 → 全角双向一键转换，大文本实时处理',
          '固定码位映射 U+FF01–FF5E ↔ U+0021–007E（偏移 0xFEE0）及 U+3000 ↔ U+0020',
          '三种范围：全部字符 / 仅字母数字 / 仅标点与空格，互不干扰',
          '分类统计替换数量：字母数字、标点、空格，转换结果一键复制',
          '中文汉字、中文弯引号、emoji 等非映射区字符原样保留；纯函数实现，零新增依赖',
        ],
        howToUse: [
          '粘贴或输入待处理文本到上方文本框',
          '选择方向：全角→半角（清理误输入）或半角→全角（排版需要）',
          '选择范围：全部字符、仅字母数字，或仅标点与空格',
          '下方即时显示转换结果与各类替换计数，点击「复制转换结果」取走',
        ],
        useCases: [
          '清理代码、命令行、配置、SQL 中因中文输入法产生的全角字母数字与标点',
          '整理从文档、PDF、聊天记录复制出来的含全角空格（U+3000）的文本',
          '面向日文 / 全角排版场景把 ASCII 内容批量转为全角形式',
        ],
        privacyNote: '所有处理均在浏览器本地完成，不发起任何网络请求。',
        faqs: [
          {
            question: '为什么中文逗号「，」有时会被转换、有时不会？',
            answer:
              '取决于该字符的实际码位。常用的全角逗号「，」是 U+FF0C、全角感叹号「！」是 U+FF01、全角句号「．」是 U+FF0E，它们都落在 U+FF01–FF5E 的「半角及全角形式」区块内，与 ASCII 有一一映射，所以会被转换为 ","、"!"、"."。而中文弯引号 “ ”（U+201C/U+201D）、中文书名号《》、顿号「、」（U+3001）等没有对应的 ASCII 码位，不在映射范围内，会原样保留。',
          },
          {
            question: '全角空格（U+3000）和普通空格有什么区别？',
            answer:
              '普通空格是 U+0020（ASCII Space），全角空格是 U+3000（Ideographic Space，表意文字空格），宽度通常等于一个 CJK 字符，常见于中文排版与日文文本。肉眼几乎无法区分，但代码、Markdown 缩进、CSV 与命令行参数中混入 U+3000 会导致解析失败。本工具把 U+3000 ↔ U+0020 纳入映射，并在统计中单列空格数量，便于发现这类隐形问题。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully local tool for batch fullwidth/halfwidth conversion. Accidentally leaving an IME in fullwidth mode often injects fullwidth characters (ＡＢＣ, １２３, fullwidth comma and exclamation mark, ideographic space) into code, CLI arguments, config files, or SQL, causing hard-to-find syntax errors. The tool converts in both directions using fixed Unicode mappings: the fullwidth block U+FF01–U+FF5E corresponds one-to-one with printable ASCII U+0021–U+007E (a constant code-point offset of 0xFEE0), and the ideographic space U+3000 maps to the ordinary space U+0020. Three scopes are available—all, alphanumeric only (A-Z/a-z/0-9), or punctuation and space only—with separate replacement counts. Characters outside the mapping (CJK ideographs, curly quotes “”, emoji) are left untouched.',
        coreFeatures: [
          'One-click fullwidth→halfwidth and halfwidth→fullwidth conversion, live for large text',
          'Fixed mappings U+FF01–FF5E ↔ U+0021–007E (offset 0xFEE0) plus U+3000 ↔ U+0020',
          'Three scopes: all characters, alphanumeric only, or punctuation and space only',
          'Per-category counts for alphanumeric, punctuation, and space replacements; copyable output',
          'Non-mapped characters (CJK ideographs, curly quotes, emoji) preserved; pure functions with zero new dependencies',
        ],
        howToUse: [
          'Paste or type the text into the upper text area',
          'Choose a direction: fullwidth→halfwidth (cleanup) or halfwidth→fullwidth (typesetting)',
          'Choose a scope: all characters, alphanumeric only, or punctuation and space only',
          'The result and per-category counts appear instantly below; click "copy result" to take it',
        ],
        useCases: [
          'Cleaning fullwidth letters, digits, and punctuation accidentally typed into code, CLI input, config, or SQL',
          'Normalizing text copied from documents, PDFs, or chats that contains ideographic spaces (U+3000)',
          'Bulk-converting ASCII content to fullwidth form for Japanese or fullwidth typesetting scenarios',
        ],
        privacyNote: 'All processing runs locally in the browser with no network requests.',
        faqs: [
          {
            question: 'Why is the Chinese comma "，" sometimes converted and sometimes not?',
            answer:
              'It depends on the actual code point. The common fullwidth comma "，" is U+FF0C, the fullwidth exclamation mark "！" is U+FF01, and the fullwidth full stop "．" is U+FF0E—all inside the Halfwidth and Fullwidth Forms block U+FF01–FF5E, which maps one-to-one with ASCII, so they become ",", "!", and ".". By contrast, curly quotes “ ” (U+201C/U+201D), CJK book-title brackets 《》, and the ideographic comma "、" (U+3001) have no ASCII counterpart and are left untouched.',
          },
          {
            question: 'What is the difference between an ideographic space (U+3000) and a normal space?',
            answer:
              'A normal space is U+0020 (ASCII Space); the ideographic space is U+3000, typically as wide as a CJK character and common in Chinese/Japanese typesetting. They are nearly indistinguishable visually, but a stray U+3000 in code, Markdown indentation, CSV, or CLI arguments breaks parsing. This tool maps U+3000 ↔ U+0020 and reports space replacements in a dedicated count so the invisible issue is easy to spot.',
          },
        ],
      },
    },
  },
  {
    slug: 'aspect-ratio-calculator',
    name: '宽高比计算器',
    nameEn: 'Aspect Ratio Calculator',
    description:
      '化简宽高为最简整数比，已知尺寸与比值时补全缺失边长，支持按目标宽高或倍数等比缩放，并识别 16:9、4:3、3:2、21:9 等常见标准比例。',
    descriptionEn:
      'Simplify width and height to the smallest integer ratio, solve the missing side from a ratio and one known dimension, scale proportionally to a target side or factor, and detect common ratios such as 16:9, 4:3, 3:2, and 21:9.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/aspect-ratio-calculator',
    iconName: 'Calculator',
    tags: ['宽高比', '比例', '分辨率', '缩放', '尺寸'],
    tagsEn: ['Aspect Ratio', 'Ratio', 'Resolution', 'Scale', 'Dimension'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '1920×1080',
    doc: {
      zh: {
        whatIsIt:
          '宽高比计算器用于在宽度、高度与比值之间快速换算：输入任意宽高即可得到最简整数比（如 1920×1080 → 16:9），并自动与 16:9、4:3、3:2、16:10、21:9、9:16 等常见标准比例做近似匹配（容差 1%）；也可以给定比值与一条边补全另一条边，或把原始尺寸按目标宽度、目标高度或倍数等比缩放。全部计算在浏览器本地实时完成，不涉及任何网络请求。',
        coreFeatures: [
          '任意正实数宽高一键化简为最简整数比（内部按 6 位小数整数化后约去最大公约数）',
          '自动识别 16:9、4:3、3:2、16:10、21:9、9:16、1:1 等常见标准比例，给出相对误差',
          '「知二求三」：给定 W:H 比值与一条边，补全另一条边',
          '按目标宽度、目标高度或缩放倍数等比缩放，自动换算另一维度',
          '纯函数计算、零新依赖、结果实时联动',
        ],
        howToUse: [
          '在顶部选择模式：化简比例、知二求三或按比例缩放',
          '化简比例：输入宽度与高度，下方即时显示最简整数比与标准比例匹配结果',
          '知二求三：选择求宽度还是求高度，输入形如 16:9 的比值与已知边长',
          '按比例缩放：输入原始宽高，选择缩放到宽度 / 高度或按倍数，并填入目标值',
        ],
        useCases: [
          '图片、视频导出时根据分辨率确认应使用的宽高比（如 1920×1080 对应 16:9）',
          '前端响应式布局与 Canvas / 视频容器尺寸推导，保持画面不变形',
          '设计稿等比缩放到目标宽度或高度，快速得到另一维度像素值',
          '竖版短视频（9:16）、超宽屏（21:9）等场景的比例核对',
        ],
        privacyNote: '所有计算均在浏览器本地完成，不发送任何数据到服务器。',
        faqs: [
          {
            question: '输入的宽高不是整数，能正确化简吗？',
            answer:
              '可以。内部会先把宽高按 6 位小数放大并四舍五入为整数，再用欧几里得算法约去最大公约数，因此 1.6:0.9 这类小数比例也能正确化简为 16:9。',
          },
          {
            question: '标准比例的「近似匹配」是怎么判定的？',
            answer:
              '工具会计算实际宽高比与参考表中每个标准比例的相对误差，取误差最小者；只有相对误差不超过 1% 才判定为近似命中，并展示具体误差百分比，否则提示无匹配。',
          },
          {
            question: '缩放结果为什么是小数？',
            answer:
              '按目标宽度或高度等比缩放时，另一维度按同一比例换算，结果不一定是整数。工具最多保留 4 位小数并去掉尾随 0；实际用于像素时可自行取整（CSS 中浏览器也支持小数像素）。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Aspect Ratio Calculator converts between width, height, and ratio values: enter any width and height to get the smallest integer ratio (e.g. 1920×1080 → 16:9) and an automatic nearest-match against common standards such as 16:9, 4:3, 3:2, 16:10, 21:9, and 9:16 (1% tolerance). You can also solve the missing side when a W:H ratio and one side are known, or scale an original size proportionally to a target width, target height, or factor. Everything runs locally in the browser with no network requests.',
        coreFeatures: [
          'Reduce any positive numeric width/height to the smallest integer ratio (integerized at 6 decimals, then divided by the GCD)',
          'Detect common standards including 16:9, 4:3, 3:2, 16:10, 21:9, 9:16, and 1:1 with relative deviation',
          'Solve-for-side mode: given a W:H ratio and one dimension, compute the other',
          'Scale proportionally to a target width, target height, or factor, deriving the other dimension',
          'Pure functions, zero new dependencies, live-linked results',
        ],
        howToUse: [
          'Choose a mode at the top: simplify, solve, or scale',
          'Simplify: enter width and height to see the reduced ratio and the nearest standard ratio',
          'Solve: choose whether the width or height is unknown, enter a ratio such as 16:9 and the known side',
          'Scale: enter the original width and height, choose target width/height or factor, and type the target value',
        ],
        useCases: [
          'Confirming the aspect ratio of an image or video export resolution (e.g. 1920×1080 is 16:9)',
          'Responsive layout, Canvas, and video container math without distorting the picture',
          'Scaling a design to a target width or height and quickly deriving the other pixel dimension',
          'Checking portrait short-video (9:16) and ultrawide (21:9) deliverables',
        ],
        privacyNote: 'All calculations run locally in the browser; no data is sent anywhere.',
        faqs: [
          {
            question: 'Can it simplify non-integer dimensions?',
            answer:
              'Yes. Width and height are scaled by 1,000,000 and rounded to integers before the Euclidean GCD reduction, so decimal inputs such as 1.6:0.9 correctly reduce to 16:9.',
          },
          {
            question: 'How is the "nearest standard ratio" decided?',
            answer:
              'The tool computes the relative deviation between the actual ratio and every standard ratio in the reference table, picks the smallest one, and reports a match only when the deviation is within 1%; otherwise it shows no match along with the exact deviation when matched.',
          },
          {
            question: 'Why are some scaled results fractional?',
            answer:
              'When scaling to a target width or height, the other dimension is derived by the same proportion and may not be an integer. Results keep at most 4 decimals with trailing zeros removed; round as needed for whole-pixel use cases.',
          },
        ],
      },
    },
  },
  {
    slug: 'css-specificity-calculator',
    name: 'CSS 选择器权重计算器',
    nameEn: 'CSS Specificity Calculator',
    description:
      '逐行解析 CSS 选择器，按标准三元组 (a, b, c) 计算权重，正确处理 ID、类、属性、伪类、伪元素、:is()/:not()/:has()/:where() 及 nth-child of 语法，并自动标出权重最高的选择器。',
    descriptionEn:
      'Parse CSS selectors line by line and compute the standard specificity triple (a, b, c), with correct handling of IDs, classes, attributes, pseudo-classes, pseudo-elements, :is()/:not()/:has()/:where(), and nth-child(... of S), highlighting the highest-specificity selector.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/css-specificity-calculator',
    iconName: 'Code',
    tags: ['CSS', '选择器', '权重', 'Specificity', '前端'],
    tagsEn: ['CSS', 'Selector', 'Specificity', 'Frontend'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '#nav .item > a:hover',
    doc: {
      zh: {
        whatIsIt:
          'CSS 选择器权重（Specificity）决定多条规则同时命中一个元素时哪条生效。本工具逐行解析选择器，输出标准三元组 (a, b, c)：a 为 ID 选择器数量，b 为类、属性与伪类数量，c 为类型与伪元素数量；比较顺序为 a → b → c。工具内置零依赖的递归下降解析器，正确处理后代 / 子代 / 相邻 / 兄弟组合子、属性选择器（含引号与逗号）、:is() / :not() / :has()（采纳参数列表最高权重）、:where()（权重恒为 0）以及 :nth-child(An+B of S) 过滤语法，并在多行输入中标记权重最高的一条。全部计算在浏览器本地实时完成。',
        coreFeatures: [
          '标准三元组 (a, b, c) 计算：ID / 类·属性·伪类 / 类型·伪元素',
          '支持后代、子代（>）、相邻（+）、兄弟（~）组合子与选择器列表',
          '正确处理 :is()、:not()、:has() 采纳参数最高权重，:where() 恒为 0',
          '支持旧式单冒号伪元素（:before）与 :nth-child(... of S) 的过滤选择器权重叠加',
          '多行批量对比，自动高亮权重最高的选择器，非法选择器逐行报错',
        ],
        howToUse: [
          '在文本框中每行输入一个 CSS 选择器',
          '结果区实时显示每个选择器的 (a, b, c) 三元组',
          '绿色底色行表示当前所有合法选择器中权重最高（将优先生效）的一条',
          '无法解析的行会以错误提示标出，可据此检查括号配对或尾随组合子',
        ],
        useCases: [
          '排查「样式为什么被覆盖」：对比命中同一元素的多条选择器权重',
          '编写组件库或 CSS 方案时评估选择器优先级，避免 !important 滥用',
          '面试与教学中验证 :is()、:where()、:has() 等新伪类的权重规则',
          '代码评审中快速核对复杂嵌套选择器的实际权重',
        ],
        privacyNote: '所有计算均在浏览器本地完成，不发送任何数据到服务器。',
        faqs: [
          {
            question: '为什么 div::before 的 c 是 2 而不是 1？',
            answer:
              '三元组统计的是各类简单选择器的数量：div 是一个类型选择器（c +1），::before 是一个伪元素（c +1），合计 (0, 0, 2)。旧式单冒号 :before 在规范中同样按伪元素计。',
          },
          {
            question: ':has() 自己会不会加一个伪类权重？',
            answer:
              '不会。与 :is()、:not() 一样，:has() 的权重采纳参数列表中最高权重的选择器，函数伪类自身不额外 +1。例如 section:has(> h2) 的权重为 (0, 0, 2)；:where() 则特殊，无论参数如何权重恒为 0。',
          },
          {
            question: '权重相同的多条选择器怎么判定？',
            answer:
              '当三元组完全相同时，工具会把最先出现的一条标记为「权重最高」；这与浏览器行为一致——特异性相同时，由源码顺序（后出现的规则生效）决定，本工具只负责权重计算，源码顺序需结合实际样式表判断。',
          },
        ],
      },
      en: {
        whatIsIt:
          'CSS specificity decides which rule wins when multiple rules match the same element. This tool parses selectors line by line and outputs the standard triple (a, b, c): a counts ID selectors, b counts classes, attribute selectors, and pseudo-classes, and c counts type selectors and pseudo-elements; comparison proceeds a → b → c. A zero-dependency recursive-descent parser correctly handles descendant / child / adjacent / sibling combinators, attribute selectors (including quotes and commas), :is() / :not() / :has() (which take the highest specificity of their arguments), :where() (always zero), and :nth-child(An+B of S) filters. Among multiple lines the highest-specificity selector is highlighted. Everything runs locally in the browser.',
        coreFeatures: [
          'Standard (a, b, c) triple: IDs / classes·attributes·pseudo-classes / types·pseudo-elements',
          'Descendant, child (>), adjacent (+), and sibling (~) combinators plus selector lists',
          ':is(), :not(), and :has() adopt the maximum argument specificity; :where() is always zero',
          'Legacy single-colon pseudo-elements (:before) and :nth-child(... of S) filter specificity',
          'Batch line-by-line comparison with the winner highlighted and per-line errors for invalid input',
        ],
        howToUse: [
          'Enter one CSS selector per line in the text area',
          'The result list shows the (a, b, c) triple for every selector in real time',
          'The green-tinted row is the highest-specificity valid selector (the one that would win)',
          'Unparseable lines are flagged with an error message so you can spot unmatched parentheses or trailing combinators',
        ],
        useCases: [
          'Debugging "why is my style overridden" by comparing selectors that match the same element',
          'Evaluating selector priorities when authoring component libraries to avoid !important',
          'Verifying the rules of newer pseudo-classes such as :is(), :where(), and :has() in interviews or teaching',
          'Quickly checking the real specificity of deeply nested selectors during code review',
        ],
        privacyNote: 'All calculations run locally in the browser; no data is sent anywhere.',
        faqs: [
          {
            question: 'Why does div::before give c = 2 instead of 1?',
            answer:
              'The triple counts simple selectors: div is one type selector (c +1) and ::before is one pseudo-element (c +1), totaling (0, 0, 2). The legacy single-colon :before is also treated as a pseudo-element per spec.',
          },
          {
            question: 'Does :has() add its own pseudo-class weight?',
            answer:
              'No. Like :is() and :not(), :has() takes the highest specificity of its argument list without adding +1 for the functional pseudo-class itself. For example, section:has(> h2) is (0, 0, 2). :where() is the special case whose specificity is always zero regardless of its arguments.',
          },
          {
            question: 'How are ties between equal-specificity selectors decided?',
            answer:
              'When triples are identical the tool marks the first occurrence as the winner; this mirrors the browser model—equal specificity is resolved by source order (the later rule wins). The tool computes specificity only; source order must be checked against the actual stylesheet.',
          },
        ],
      },
    },
  },
  {
    slug: 'number-locale-formatter',
    name: '数字千分位与货币格式化',
    nameEn: 'Number & Currency Locale Formatter',
    description:
      '把同一数值按多个区域设置渲染成本地化排版：千分位分组符、小数点、小数位与舍入、货币符号与位置、负数括号、百分比与紧凑记法（1.2K / 123 万），基于浏览器原生 Intl.NumberFormat，零新依赖。',
    descriptionEn:
      'Render one number in multiple locales at once: thousands separators, decimal marks, fraction digits and rounding, currency symbols and placement, accounting parentheses, percentages, and compact notation (1.2K / 123 万), powered by the native Intl.NumberFormat with zero new dependencies.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/number-locale-formatter',
    iconName: 'Gauge',
    tags: ['数字格式化', '千分位', '货币', 'Intl', '本地化', 'i18n'],
    tagsEn: ['Number Format', 'Thousands Separator', 'Currency', 'Intl', 'Locale', 'i18n'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '1234567.895',
    doc: {
      zh: {
        whatIsIt:
          '数字千分位与货币格式化工具把同一个数值按一个或多个 BCP 47 区域设置（如 zh-CN、en-US、de-DE）渲染为本地化文本，直观对比各地区的千分位分组符、小数点符号、货币符号及其位置、小数位与舍入、负数会计括号写法、百分比以及紧凑记法（1.2K / 123 万）。工具是浏览器原生 Intl.NumberFormat 的纯函数封装，不引入任何运行时依赖，也不发送网络请求，常用于多语言产品文案、报价单与财务报表的格式核对。',
        coreFeatures: [
          '同一数值同时对比多个区域设置，覆盖中、英、德、法、日、印地语等常用地区',
          '数字 / 货币（ISO 4217 代码）/ 百分比三种模式，货币符号位置与默认小数位随区域自动变化',
          '标准与紧凑记法切换（1,234,567 ↔ 1.2M / 123 万），可开关千分位分组',
          '可选固定小数位（0-20，四舍五入）与负数括号写法（如 ($1,234.50)）',
          '纯函数 + 原生 Intl 封装、零新依赖、输入实时联动',
        ],
        howToUse: [
          '在顶部输入一个有限数字（不要带千分位逗号），例如 -1234567.89',
          '选择数字、货币或百分比模式；货币模式再选择 ISO 货币代码（如 USD、CNY、JPY）',
          '按需切换紧凑记法、千分位分组、负数括号与固定小数位',
          '在「对比区域」中勾选一个或多个区域设置，下方即时列出各区域排版结果',
        ],
        useCases: [
          '多语言产品中核对同一金额在不同地区的展示（$1,234.50 / 1.234,50 € / ￥1,235）',
          '财务报表与发票的会计括号负数写法、固定小数位核对',
          '前端开发验证 Intl.NumberFormat 参数（notation、currencyDisplay、分组）的实际输出',
          '运营文案中 K / M / 万等紧凑数字在各语言下的写法确认',
        ],
        privacyNote: '所有格式化均在浏览器本地通过原生 Intl 完成，不发送任何数据到服务器。',
        faqs: [
          {
            question: '和已有的「数字转中文大写金额」工具有什么区别？',
            answer:
              '中文大写金额工具输出的是壹贰叁、元角分形式的发票合同文本；本工具关注的是各地区的数字排版（分组符、小数点、货币符号位置、负数与百分比写法），两者用途不同、互不替代。',
          },
          {
            question: '为什么输入 1,234.5 提示无法解析？',
            answer:
              '输入框要求的是纯数字字面量，千分位逗号属于「输出排版」而不是输入语法。请直接输入 1234.5；如需查看带逗号的结果，选择对应区域设置后会自动渲染。',
          },
          {
            question: '紧凑记法在中文下为什么没有空格？',
            answer:
              '输出由浏览器内置 ICU 数据决定，不同区域（甚至不同浏览器 / ICU 版本）可能存在空格或字形的细微差异，例如部分环境输出「123万」，另一些输出「123 万」。工具如实反映当前运行环境的 Intl 结果。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Number & Currency Locale Formatter renders one numeric value in one or more BCP 47 locales (such as zh-CN, en-US, de-DE), making it easy to compare thousands separators, decimal marks, currency symbols and their placement, fraction digits and rounding, accounting parentheses for negatives, percentages, and compact notation (1.2K / 123 万). It is a thin pure-function wrapper over the native Intl.NumberFormat API with no runtime dependencies and no network requests, ideal for checking formats in localized copy, quotations, and financial reports.',
        coreFeatures: [
          'Compare several locales simultaneously, including Chinese, English, German, French, Japanese, and Hindi regions',
          'Decimal, currency (ISO 4217 codes), and percent modes with locale-driven symbol placement and default digits',
          'Switch between standard and compact notation (1,234,567 ↔ 1.2M / 123 万) and toggle grouping',
          'Optional fixed fraction digits (0-20, rounded) and accounting parentheses for negatives (e.g. ($1,234.50))',
          'Pure functions over native Intl, zero new dependencies, live-linked results',
        ],
        howToUse: [
          'Enter a finite number at the top (without thousands commas), for example -1234567.89',
          'Pick decimal, currency, or percent mode; in currency mode choose an ISO code such as USD, CNY, or JPY',
          'Toggle compact notation, grouping, negative parentheses, and fixed fraction digits as needed',
          'Select one or more locales in the comparison selector to see every localized rendering instantly',
        ],
        useCases: [
          'Checking how one amount appears across regions ($1,234.50 / 1.234,50 € / ￥1,235) in localized products',
          'Verifying accounting parentheses and fixed decimals on financial statements and invoices',
          'Testing the actual output of Intl.NumberFormat options (notation, currencyDisplay, grouping) during frontend work',
          'Confirming compact K / M / 万 styles across languages for marketing copy',
        ],
        privacyNote: 'All formatting runs locally in the browser via native Intl; no data is sent anywhere.',
        faqs: [
          {
            question: 'How is this different from the existing Chinese RMB amount tool?',
            answer:
              'The RMB tool produces formal uppercase Chinese text (壹贰叁, 元角分) for invoices and contracts; this tool focuses on regional numeric typography—grouping separators, decimal marks, currency symbol placement, negatives, and percentages. They serve different purposes.',
          },
          {
            question: 'Why is 1,234.5 rejected as input?',
            answer:
              'The input expects a plain numeric literal; thousands commas are output typography, not input syntax. Type 1234.5 directly, then choose a locale to render the grouped representation.',
          },
          {
            question: 'Why does Chinese compact output sometimes lack a space?',
            answer:
              'Output comes from the browser’s built-in ICU data, so minor spacing or glyph differences can occur across locales and even across browsers or ICU versions (e.g. "123万" vs "123 万"). The tool faithfully reports the Intl result of the current runtime.',
          },
        ],
      },
    },
  },
  {
    slug: 'nato-phonetic-converter',
    name: 'NATO 音标字母转换器',
    nameEn: 'NATO Phonetic Alphabet Converter',
    description:
      '在普通文本与 NATO/ICAO 标准音标字母（Alpha / Bravo / Charlie …）之间双向转换，覆盖 A–Z 与 0–9（数字读 Zero–Niner），逐字符给出拼写对照，适用于客服报读订单号、电话核对验证码与无线电航空通信。',
    descriptionEn:
      'Convert between plain text and the NATO/ICAO radiotelephony spelling alphabet (Alpha / Bravo / Charlie …) in both directions, covering A–Z and 0–9 (Zero–Niner) with character-by-character spelling cards—ideal for reading order numbers over support calls, verifying codes by phone, and radio/aviation communication.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/nato-phonetic-converter',
    iconName: 'Type',
    tags: ['NATO 音标', '字母解释法', '拼读', '无线电', '客服'],
    tagsEn: ['NATO Phonetic', 'Spelling Alphabet', 'ICAO', 'Radio', 'Codec'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'TRAE 42',
    doc: {
      zh: {
        whatIsIt:
          'NATO 音标字母转换器把普通文本与国际无线电音标字母（ITU/ICAO 标准拼读表）互相转换：输入文本时逐字符拼出 Alfa、Bravo、Charlie …… 并以斜杠区分不同源单词；输入音标串时可还原为大写文本。覆盖 26 个字母与 10 个数字（数字采用 Zero、One、…、Niner 标准读法，9 读 Niner 以与 5 的发音区分），常用于客服口述订单号、电话核对验证码、航空与无线电通信等需要无歧义拼写确认的场景。全部计算在浏览器本地完成，不发送任何数据。',
        coreFeatures: [
          '双向转换：文本拼写为音标，音标串一键还原为大写文本',
          '完整覆盖 A–Z 与 0–9 共 36 个字符的 ITU/ICAO 标准拼读表',
          '逐字符拼写卡片，源字符与音标单词一一对应，便于边看边读',
          '以 “ / ” 标记源单词边界，还原时支持斜杠或多段空白',
          '还原忽略大小写，并兼容 Alpha / Juliet / Nine 等常见异写，零新依赖',
        ],
        howToUse: [
          '默认处于「拼写」模式，输入字母与数字（如 TRAE 42），即时得到音标串与逐字符卡片',
          '源文本中的空格会变成输出中的 “ / ”，朗读时可在斜杠处停顿',
          '切换到「还原」模式，粘贴或输入音标单词（如 Tango Romeo Alfa Echo / Four Two）',
          '使用「复制结果」可一键复制音标串或还原文本',
        ],
        useCases: [
          '客服 / 电话销售向客户逐字母确认订单号、优惠券码与邮箱拼写',
          '电话中核对短信验证码、银行卡号等易错读的数字字母串',
          '航空、无线电、应急通信按标准拼读表呼叫呼号与坐标',
          '英语学习者记忆 NATO 字母解释法，或为剧本 / 游戏制作对讲台词',
        ],
        privacyNote: '所有转换均在浏览器本地完成，不发送任何输入数据到服务器。',
        faqs: [
          {
            question: '和已有的摩尔斯电码编解码器有什么区别？',
            answer:
              '摩尔斯电码是点（.）划（-）电报编码，面向电报与信号；本工具是把字母读成 Alfa、Bravo 这类单词的口头拼读表，面向人声无歧义确认，两套映射体系与使用场景完全不同。',
          },
          {
            question: '为什么数字 9 拼成 Niner 而不是 Nine？',
            answer:
              '这是 ITU/ICAO 航空通信标准：9 读 Niner（奈纳）以避免与德语词 Nein（不）混淆，同时与 5（Five / Fife）的发音更清晰地区分。还原时 Nine 与 Niner 都会被识别为 9。',
          },
          {
            question: '为什么输入标点或中文会报错？',
            answer:
              '标准音标表只定义了 A–Z 与 0–9 共 36 个字符的读法，没有统一的标点拼读规范。遇到连字符、符号等字符时工具会明确指出，避免在通信中产生歧义。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The NATO Phonetic Alphabet Converter translates between plain text and the international radiotelephony spelling alphabet (the ITU/ICAO standard): type text to spell it out character by character as Alfa, Bravo, Charlie … with slashes separating source words, or paste a phonetic string to reconstruct the uppercase text. It covers all 26 letters and 10 digits (read as Zero, One, …, Niner; 9 is "Niner" to stay distinct from 5). It is built for unambiguous spelling confirmation in customer support calls, code verification by phone, aviation, and radio communication. Everything runs locally in the browser.',
        coreFeatures: [
          'Bidirectional: spell text into code words, or reconstruct uppercase text from a phonetic string',
          'Complete ITU/ICAO table for A–Z and 0–9, 36 characters in total',
          'Character-by-character spelling cards pairing each source character with its code word',
          'Source word boundaries marked with “ / ”; reconstruction accepts slashes or extra whitespace',
          'Case-insensitive decoding with aliases such as Alpha / Juliet / Nine; zero new dependencies',
        ],
        howToUse: [
          'In the default "Spell" mode, type letters and digits (e.g. TRAE 42) to get the phonetic string and per-character cards instantly',
          'Spaces in the source text become “ / ” in the output—pause at each slash when reading aloud',
          'Switch to "Reconstruct" mode and paste code words, e.g. Tango Romeo Alfa Echo / Four Two',
          'Use "Copy result" to copy either the phonetic string or the reconstructed text',
        ],
        useCases: [
          'Support agents confirming order numbers, coupon codes, and email spelling letter by letter',
          'Verifying SMS codes and bank numbers that are easy to mishear over the phone',
          'Aviation, radio, and emergency communication of call signs and coordinates per the standard table',
          'Learners memorizing the NATO alphabet, or scriptwriters preparing radio dialogue',
        ],
        privacyNote: 'All conversion happens locally in the browser; no input ever leaves your device.',
        faqs: [
          {
            question: 'How is this different from the existing Morse code tool?',
            answer:
              'Morse code is a dot/dash telegraph encoding for signals, while this tool is a spoken spelling alphabet that turns letters into words like Alfa and Bravo for unambiguous voice communication. The mappings and use cases are entirely different.',
          },
          {
            question: 'Why is the digit 9 spelled "Niner" instead of "Nine"?',
            answer:
              'It is the ITU/ICAO aviation standard: 9 becomes "Niner" to avoid confusion with the German word "nein" (no) and to stay clearly distinct from 5 (Five/Fife). When decoding, both Nine and Niner map to 9.',
          },
          {
            question: 'Why do punctuation or Chinese characters raise an error?',
            answer:
              'The standard spelling table only defines readings for A–Z and 0–9; there is no unified convention for punctuation. The tool flags unsupported characters explicitly rather than inventing ambiguous readings.',
          },
        ],
      },
    },
  },
  {
    slug: 'iso8601-duration',
    name: 'ISO 8601 时长解析与格式化',
    nameEn: 'ISO 8601 Duration Parser & Formatter',
    description:
      '解析 P1Y2M3DT4H5M6S、PT90M、P2W 等 ISO 8601 时长字符串为年 / 月 / 周 / 日 / 时 / 分 / 秒明细与折算总秒数，并可把任意秒数反向进位归一化为标准时长；支持负时长、小数分量与非法语法诊断。',
    descriptionEn:
      'Parse ISO 8601 durations such as P1Y2M3DT4H5M6S, PT90M, and P2W into year/month/week/day/hour/minute/second components and an approximate total in seconds, or normalize any number of seconds back into the standard format—with support for negative durations, fractional components, and strict syntax diagnostics.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/iso8601-duration',
    iconName: 'Clock',
    tags: ['ISO 8601', '时长', 'Duration', '时间间隔', 'PT1H'],
    tagsEn: ['ISO 8601', 'Duration', 'Time Interval', 'Parser', 'Formatter'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'P1Y2M3DT4H5M6S',
    doc: {
      zh: {
        whatIsIt:
          'ISO 8601 时长解析与格式化工具处理「时长 / 间隔」维度的标准表示：解析方向把 PnYnMnDTnHnMnS（及 PnW）字符串拆解为年、月、周、日、时、分、秒七个分量，并按 365 天/年、30 天/月、7 天/周折算总秒数；格式化方向把任意秒数（含负数与小数）按「日 → 时 → 分 → 秒」进位归一化后输出标准字符串。解析器严格校验语法：分量顺序、重复分量、周与其他分量互斥、只有最后一个分量允许小数等，出错时给出具体原因。所有计算在浏览器本地完成。',
        coreFeatures: [
          '严格解析 ISO 8601 时长：PnYnMnDTnHnMnS 与周表示 PnW，支持负号（-P1D）与正号',
          '七分量明细展示（年/月/周/日/时/分/秒），并按固定折算给出总秒数',
          '秒数反向格式化：自动进位归一化、零时长 PT0S、负数输出 -PT…',
          '支持逗号或点的小数分量（PT1,5H）、大小写 t、毫秒级小数秒（最多 3 位）',
          '纯函数零依赖与明确的语法诊断（重复单位、周混用、小数位置、T 段错位等）',
        ],
        howToUse: [
          '在「解析」模式输入 ISO 时长（如 P1Y2M3DT4H5M6S 或 PT90M），即时看到七个分量与总秒数',
          '切换到「格式化」模式，输入任意秒数（如 90540），得到归一化的 P1DT1H9M 与中文可读描述',
          '输入负秒数或负时长（-PT30S）可验证负向时间间隔的表示',
          '点击「复制」可复制原始 ISO 字符串或新生成的标准时长',
        ],
        useCases: [
          '阅读 API 文档或日志中的 ISO 时长字段（视频时长、缓存 TTL、任务超时）',
          '构造媒体播放时长（ISO BMFF / FFmpeg 等常用 PT#H#M#S）并核对总秒数',
          '把用户输入的秒数配置转换为符合 ISO 8601 的配置值',
          '排查非法时长字符串：快速定位是分量重复、周混用还是小数位置错误',
        ],
        privacyNote: '所有解析与格式化均在浏览器本地完成，不发送任何数据到服务器。',
        faqs: [
          {
            question: '为什么总秒数对「年 / 月」是近似值？',
            answer:
              '公历年可能是 365 或 366 天，月份从 28 到 31 天不等，ISO 8601 的年月分量本身没有固定秒数。工具按常见工程约定（365 天/年、30 天/月）折算并明确标注；需要精确历法加减应改用具体起止日期计算。',
          },
          {
            question: '为什么 P1W1D 报错？',
            answer:
              'ISO 8601 规定周（W）分量不能与年、月、日及时间分量混用。两周就是 P2W；如需「一周零一天」请统一折算为 P8D。',
          },
          {
            question: 'P1Y0.5M 为什么不合法？',
            answer:
              '标准规定小数只能出现在最后一个（最小）分量上。带小数时应直接用最小单位表达，例如 1 年 6 个月写作 P1.5Y，或一个半小时写作 PT1.5H 而不是 PT1H0.5M。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The ISO 8601 Duration Parser & Formatter covers the "duration / interval" dimension of the standard: the parser breaks PnYnMnDTnHnMnS (and PnW) strings into year, month, week, day, hour, minute, and second components and approximates the total seconds using 365 days/year, 30 days/month, and 7 days/week; the formatter normalizes any number of seconds (negative or fractional) with day → hour → minute → second carry and emits a standard string. The parser validates syntax strictly—component order, duplicates, the week-exclusivity rule, and fractional components only in the last position—and explains exact error causes. Everything runs locally in the browser.',
        coreFeatures: [
          'Strict parsing of PnYnMnDTnHnMnS and week form PnW, with negative (-P1D) and positive signs',
          'Seven-component breakdown plus an approximate total-seconds figure with fixed conversions',
          'Reverse formatting of arbitrary seconds with carry normalization, PT0S for zero, and -PT… for negatives',
          'Fractional components via comma or dot (PT1,5H), lowercase t, and millisecond precision (up to 3 decimals)',
          'Pure functions, zero dependencies, and precise diagnostics (duplicates, mixed weeks, fraction position, T-section errors)',
        ],
        howToUse: [
          'In Parse mode, enter an ISO duration (e.g. P1Y2M3DT4H5M6S or PT90M) to see the seven components and total seconds instantly',
          'Switch to Format mode, type any number of seconds (e.g. 90540), and get normalized output like P1DT1H9M plus a readable description',
          'Try negative seconds or durations (-PT30S) to see how negative intervals are represented',
          'Use Copy to grab either the original ISO string or the freshly formatted duration',
        ],
        useCases: [
          'Reading ISO duration fields in API docs or logs (video length, cache TTL, task timeout)',
          'Building media durations (PT#H#M#S common in ISO BMFF / FFmpeg) and checking total seconds',
          'Converting second-based configuration values into ISO 8601 strings',
          'Debugging malformed durations—duplicate units, mixed weeks, or misplaced fractions',
        ],
        privacyNote: 'All parsing and formatting run locally in the browser; no data is sent anywhere.',
        faqs: [
          {
            question: 'Why are total seconds only approximate for years and months?',
            answer:
              'Calendar years have 365 or 366 days and months range from 28 to 31, so ISO year/month components have no fixed length in seconds. The tool uses the common engineering convention (365 days/year, 30 days/month) and labels it as such; exact calendar arithmetic should use concrete start and end dates.',
          },
          {
            question: 'Why does P1W1D fail?',
            answer:
              'ISO 8601 forbids combining the week (W) component with years, months, days, or time components. Two weeks is P2W; for "one week and one day", express it uniformly as P8D.',
          },
          {
            question: 'Why is P1Y0.5M invalid?',
            answer:
              'The standard allows a fraction only on the final (smallest) component. Use the smallest unit instead—1 year 6 months as P1.5Y, or one and a half hours as PT1.5H rather than PT1H0.5M.',
          },
        ],
      },
    },
  },
  {
    slug: 'quoted-printable-codec',
    name: 'Quoted-Printable（RFC 2045）编解码',
    nameEn: 'Quoted-Printable (RFC 2045) Encoder & Decoder',
    description:
      '在 UTF-8 文本与 Quoted-Printable 转义串之间双向转换，遵循 RFC 2045：非可打印字节与等号编码为 =XX、76 列软换行（=CRLF）、行尾空白转义；解码严格校验非法转义并报告行列位置。',
    descriptionEn:
      'Convert between UTF-8 text and Quoted-Printable strings per RFC 2045: non-printable bytes and "=" are encoded as =XX with 76-column soft line breaks (=CRLF) and escaped trailing whitespace; decoding strictly validates illegal escapes with row/column positions.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/quoted-printable-codec',
    iconName: 'Binary',
    tags: ['Quoted-Printable', 'RFC 2045', 'MIME', '邮件编码', '编解码'],
    tagsEn: ['Quoted-Printable', 'RFC 2045', 'MIME', 'Email Encoding', 'Codec'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'Quoted-Printable 编码示例：café = 42€。',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的 Quoted-Printable 编解码工具。Quoted-Printable 是 RFC 2045 定义的 MIME 内容传输编码，用可打印 ASCII 表示任意字节：可打印字符（除等号）原样保留，等号与非 ASCII 字节（文本按 UTF-8）编码为 =XX 大写十六进制，每行不超过 76 字符并以“=”加换行作软换行，广泛用于电子邮件正文与 MIME 头。',
        coreFeatures: [
          '严格遵循 RFC 2045：可打印 ASCII 原样输出，等号转义为 =3D，非 ASCII 按 UTF-8 编码为 =XX',
          '76 列软换行：超长行自动以 =CRLF 断开，行尾空格 / 制表符转义为 =20 / =09 防止被传输剥离',
          '双向转换：文本即时编码，含软换行的转义串严格解码回文本，支持 CRLF / LF 行结束符',
          '精确报错：不完整或非十六进制的 =XX 转义均报告具体行列位置，非法 UTF-8 字节明确提示',
          '纯本地运行：所有编解码在浏览器内完成，绝不发起任何网络请求',
        ],
        howToUse: [
          '选择「编码」或「解码」方向，切换时自动载入对应示例',
          '编码时可选择 CRLF（RFC 标准）或 LF 行结束符，结果随输入实时更新',
          '在输入框粘贴文本或 Quoted-Printable 串，点击「复制结果」获取内容，或「清空」重输',
        ],
        useCases: [
          '查看或构造 MIME 邮件（Content-Transfer-Encoding: quoted-printable）正文与头字段',
          '排查邮件乱码：验证转义串是否合法并定位损坏的 =XX 序列',
          '调试以 Quoted-Printable 承载 UTF-8 文本的协议数据与签名原文',
        ],
        privacyNote: '所有编解码均在浏览器本地完成，输入的文本与转义串不会被上传或记录。',
        faqs: [
          {
            question: 'Quoted-Printable 和 Base64 有什么区别？',
            answer:
              '二者都是 MIME 内容传输编码。Base64 把每 3 字节编码为 4 个字符，适合二进制数据（图片、附件）；Quoted-Printable 以 =XX 只转义非可打印字节，大部分 ASCII 文本仍可读，适合以 ASCII 为主、偶有非 ASCII 字符的邮件正文。',
          },
          {
            question: '行尾单独的“=”是什么意思？',
            answer:
              '那是 RFC 2045 的软换行标记：当一行内容超过 75/76 字符时，编码器在断行处放一个“=”，解码时该“=”与紧随的换行符会被一并删除、把前后两段重新拼接，不属于原始内容。真正的换行仍以普通 CRLF 表示。',
          },
          {
            question: '为什么行尾空格变成了 =20？',
            answer:
              '邮件传输中允许对行尾空白做规整，可能被悄悄删除。RFC 2045 因此要求硬换行前的空格（0x20）与制表符（0x09）必须用 =20 / =09 转义，以保证解码后内容与原文逐字节一致。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first Quoted-Printable codec. Quoted-Printable is the MIME content-transfer encoding defined by RFC 2045 that represents arbitrary bytes with printable ASCII: printable characters (except "=") stay literal while "=" and non-ASCII bytes (text handled as UTF-8) become uppercase =XX hex, with lines limited to 76 characters and "=" plus a newline as a soft line break. It is widely used in email bodies and MIME headers.',
        coreFeatures: [
          'Strict RFC 2045: printable ASCII stays literal, "=" becomes =3D, non-ASCII bytes are encoded as =XX via UTF-8',
          '76-column soft breaks: long lines split with =CRLF and trailing spaces/tabs become =20/=09 to survive transport',
          'Bidirectional: instant text encoding and strict decoding of escaped strings with soft breaks, CRLF/LF selectable',
          'Precise errors: incomplete or non-hex =XX escapes report exact row/column; invalid UTF-8 is clearly reported',
          'Local-first: all encoding and decoding run in the browser with no network requests',
        ],
        howToUse: [
          'Pick the "Encode" or "Decode" direction; switching loads the matching sample automatically',
          'When encoding, choose CRLF (RFC standard) or LF line endings; the result updates as you type',
          'Paste text or a Quoted-Printable string, click "Copy result" to copy it, or "Clear" to start over',
        ],
        useCases: [
          'Inspect or build MIME email bodies and headers using Content-Transfer-Encoding: quoted-printable',
          'Debug email mojibake: validate an escaped string and locate corrupted =XX sequences',
          'Work with protocol payloads or canonical signing text that carry UTF-8 via Quoted-Printable',
        ],
        privacyNote:
          'All encoding and decoding run locally in the browser; entered text and escaped strings are never uploaded or logged.',
        faqs: [
          {
            question: 'How does Quoted-Printable differ from Base64?',
            answer:
              'Both are MIME content-transfer encodings. Base64 encodes every 3 bytes into 4 characters and suits binary data such as images and attachments. Quoted-Printable escapes only non-printable bytes as =XX, leaving most ASCII text readable, which suits mostly-ASCII email bodies with occasional non-ASCII characters.',
          },
          {
            question: 'What does a standalone "=" at the end of a line mean?',
            answer:
              'It is the RFC 2045 soft line break: when content exceeds the line limit, the encoder places "=" before the break, and decoding removes that "=" together with the following newline to rejoin the segments. It is not part of the original content; real line breaks remain ordinary CRLF.',
          },
          {
            question: 'Why did a trailing space turn into =20?',
            answer:
              'Mail transport may normalize or strip trailing whitespace. RFC 2045 therefore requires a space (0x20) or tab (0x09) before a hard line break to be escaped as =20 / =09 so the decoded output matches the original byte for byte.',
          },
        ],
      },
    },
  },
  {
    slug: 'text-entropy-calculator',
    name: '文本信息熵计算器',
    nameEn: 'Text Entropy Calculator',
    description:
      '计算文本的 Shannon 信息熵、归一化熵、最小编码位数与字符频率分布，评估密钥与令牌的随机性。',
    descriptionEn:
      'Compute Shannon entropy, normalized entropy, minimum encoded bits, and character frequency distribution to assess the randomness of keys and tokens.',
    category: ToolCategoryEnum.TEXT_CONTENT,
    path: '/tools/text-entropy-calculator',
    iconName: 'Sigma',
    tags: ['信息熵', '香农熵', '随机性', '频率', '密码'],
    tagsEn: ['Entropy', 'Shannon', 'Randomness', 'Frequency', 'Password'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '8f3Kp2Xv9QmZ7Lt4Rh6Yc1Bw5Ns0De7G',
    doc: {
      zh: {
        whatIsIt:
          '文本信息熵计算器基于 Claude Shannon 的信息论公式 H = -Σ p·log2(p)，实时计算输入文本中每个字符平均携带的信息量（bit），并给出唯一字符数、归一化熵、理论最小编码位数和完整的字符频率分布表，常用于评估密钥、令牌、口令的随机程度以及文本可压缩性。',
        coreFeatures: [
          'Shannon 熵：按字符出现概率计算 bits/字符，熵越高随机性越强',
          '归一化熵：熵与 log2(唯一字符数) 的比值，0–1 之间，便于跨文本比较均匀程度',
          '最小编码位数：ceil(熵 × 长度)，估算文本无损压缩或定长编码的理论下界',
          '频率分布：按次数降序列出每个字符的计数、概率与可视化占比条',
          'Unicode 正确计数：按 code point 切分，emoji 等代理对字符计为一个字符',
        ],
        howToUse: [
          '在输入框中粘贴或输入待分析文本（密钥、令牌、文章等）',
          '查看上方六个指标卡：字符总数、唯一字符、信息熵、最大熵、归一化熵、最小编码位数',
          '在频率分布表中查看各字符计数、概率与占比条，支持分页',
        ],
        useCases: [
          '评估生成的 API Key / 恢复码 / 口令是否足够随机、字符分布是否均匀',
          '分析日志或数据样本的可压缩性，估算无损编码的理论空间',
          '信息论教学中直观理解概率分布与熵的关系',
        ],
        privacyNote:
          '所有计算均在本地浏览器内完成，输入文本不会被上传或记录，可安全粘贴敏感令牌。',
        faqs: [
          {
            question: '信息熵多少算「随机」？',
            answer:
              '归一化熵越接近 1 表示字符分布越均匀。若令牌取自 64 种字符的字母表，理论最大熵为 log2(64)=6 bits/字符，实际熵接近 6 说明分布均匀；但高熵只代表不可预测性高，并不等于密码学安全，安全的令牌仍应由 CSPRNG 生成。',
          },
          {
            question: '熵和最大熵有什么区别？',
            answer:
              '最大熵 log2(唯一字符数) 是这些字符在等概率出现时的熵上界；实际熵会因为字符出现次数不均而小于它，两者之比即归一化熵。',
          },
          {
            question: 'emoji 和中文如何计数？',
            answer:
              '工具按 Unicode code point 而非 UTF-16 码元切分文本，因此 😀 等代理对 emoji 计为一个字符，每个汉字也计为一个字符。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Text Entropy Calculator applies Claude Shannon\u2019s formula H = -Σ p·log2(p) to compute the average information per character in bits, along with unique character count, normalized entropy, theoretical minimum encoded bits, and a full character frequency table. It is commonly used to assess the randomness of keys, tokens, and passwords and to estimate compressibility.',
        coreFeatures: [
          'Shannon entropy: bits per character from character probabilities; higher means more random',
          'Normalized entropy: entropy divided by log2(unique characters), 0–1 for cross-text comparison',
          'Minimum encoded bits: ceil(entropy × length), a theoretical lower bound for lossless coding',
          'Frequency table: count, probability, and a visual ratio bar per character, sorted by frequency',
          'Unicode-correct counting: split by code point so surrogate-pair emoji count as one character',
        ],
        howToUse: [
          'Paste or type the text to analyze (key, token, article) in the input area',
          'Read the six metric cards: length, unique characters, entropy, max entropy, normalized entropy, minimum bits',
          'Inspect per-character counts, probabilities, and ratio bars in the paginated frequency table',
        ],
        useCases: [
          'Checking whether generated API keys, recovery codes, or passwords are random and uniformly distributed',
          'Estimating compressibility of logs or data samples via the theoretical coding lower bound',
          'Teaching information theory with a live view of probability distributions and entropy',
        ],
        privacyNote:
          'All computation runs locally in the browser; entered text is never uploaded or logged, so sensitive tokens are safe to paste.',
        faqs: [
          {
            question: 'What entropy counts as "random"?',
            answer:
              'Normalized entropy close to 1 means a near-uniform distribution. A token drawn from a 64-symbol alphabet has a theoretical maximum of log2(64) = 6 bits per character; entropy near 6 indicates uniform use. High entropy only means unpredictability, not cryptographic security — secure tokens still require a CSPRNG.',
          },
          {
            question: 'How is entropy different from max entropy?',
            answer:
              'Max entropy log2(unique characters) is the upper bound when every character is equally likely. Real entropy is lower when character frequencies are uneven, and their ratio is the normalized entropy.',
          },
          {
            question: 'How are emoji and Chinese counted?',
            answer:
              'Text is split by Unicode code point instead of UTF-16 code units, so a surrogate-pair emoji like 😀 counts as one character and each Han character counts as one character.',
          },
        ],
      },
    },
  },
  {
    slug: 'vigenere-cipher',
    name: '维吉尼亚密码加解密',
    nameEn: 'Vigenère Cipher',
    description:
      '经典 Vigenère 多表替换密码：输入文本与关键词，按字母循环位移完成加解密，保留大小写、非字母字符原样保留。',
    descriptionEn:
      'Classic Vigenère polyalphabetic substitution: encrypt or decrypt text with a repeating keyword, preserving case and leaving non-letters untouched.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/vigenere-cipher',
    iconName: 'KeyRound',
    tags: ['维吉尼亚', 'Vigenere', '古典密码', '多表替换', '加解密'],
    tagsEn: ['Vigenere', 'Classical Cipher', 'Polyalphabetic', 'Cryptography'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'Hello, World!',
    doc: {
      zh: {
        whatIsIt:
          '维吉尼亚密码（Vigenère cipher）是一种使用关键词循环位移的多表替换古典密码：明文中每个字母按关键词对应字母在字母表中的位置位移，加密公式 Ci=(Pi+Ki) mod 26，解密则反向减去。本工具在浏览器本地完成加解密，保留原文本大小写，数字、标点、空格与中文等非字母字符原样保留且不消耗密钥位。',
        coreFeatures: [
          '双向变换：一键在加密（明文→密文）与解密（密文→明文）间切换',
          '循环密钥：关键词短于文本时自动循环复用，长度不限',
          '大小写保持：大写仍为大写、小写仍为小写，密文大小写跟随原文',
          '非字母透传：数字、标点、空白、中文原样保留，且不推进密钥位置',
          '严格校验：关键词去除非字母后为空时给出明确错误提示',
        ],
        howToUse: [
          '选择加密或解密方向',
          '在关键词框输入仅含英文字母的密钥（大小写不敏感，非字母自动忽略）',
          '在文本框输入明文或密文，结果实时生成，可一键复制',
        ],
        useCases: [
          '古典密码与密码学入门教学，直观理解多表替换与频率分析难点',
          '解谜游戏、CTF 入门题中的 Vigenère 加解密',
          '理解 HTTPS / TLS 之前的历史加密手段及其弱点',
        ],
        privacyNote:
          '所有加解密均在本地浏览器完成，文本与密钥不会被上传或记录。维吉尼亚密码不具备现代安全性，切勿用于保护真实敏感信息。',
        faqs: [
          {
            question: '维吉尼亚密码和凯撒密码有什么区别？',
            answer:
              '凯撒密码是单表替换，所有字母使用同一个固定位移；维吉尼亚密码是多表替换，每个字母的位移由循环关键词决定（如 LEMON 提供 11/4/12/14/13 的循环位移序列），因此更能抵抗简单的字母频率分析。',
          },
          {
            question: '密钥为什么会循环复用？',
            answer:
              '当明文比密钥长时，密钥字母会从头重复使用：例如 KEY 对 7 个字母的位移序列是 K-E-Y-K-E-Y-K。这是经典 Vigenère 的标准规则，也正是其可被 Kasiski / 重合指数分析破解的原因。',
          },
          {
            question: '空格、数字和中文会怎样处理？',
            answer:
              '非英文字母字符一律原样输出，并且不会推进密钥位置——即密钥只在遇到 A–Z / a–z 时才消耗一位，这保证加解密对带标点的文本严格往返一致。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Vigenère cipher is a classical polyalphabetic substitution that shifts each letter by a repeating keyword: encryption is Ci=(Pi+Ki) mod 26 and decryption subtracts the same shifts. This tool runs entirely in the browser, preserves letter case, and passes digits, punctuation, whitespace, and CJK characters through without consuming key positions.',
        coreFeatures: [
          'Bidirectional: switch between encryption (plaintext → ciphertext) and decryption',
          'Repeating key: a keyword shorter than the text is cycled automatically',
          'Case preserved: uppercase stays uppercase and lowercase stays lowercase',
          'Non-letters passed through: digits, punctuation, whitespace, and Chinese are untouched and do not advance the key',
          'Validation: a clear error is shown when the key contains no letters after stripping non-letters',
        ],
        howToUse: [
          'Choose the encrypt or decrypt direction',
          'Enter a keyword of English letters (case-insensitive; non-letters are ignored)',
          'Type plaintext or ciphertext; the result updates live and can be copied with one click',
        ],
        useCases: [
          'Teaching classical cryptography and why polyalphabetic ciphers resist simple frequency analysis',
          'Solving puzzles and introductory CTF challenges involving Vigenère',
          'Exploring historical encryption and its weaknesses compared with modern TLS',
        ],
        privacyNote:
          'All encryption and decryption run locally in the browser; text and keys are never uploaded or logged. Vigenère is not secure by modern standards and must not protect real sensitive data.',
        faqs: [
          {
            question: 'How is Vigenère different from the Caesar cipher?',
            answer:
              'Caesar is monoalphabetic with one fixed shift for every letter. Vigenère is polyalphabetic: each letter is shifted according to a repeating keyword (e.g. LEMON gives the cycle 11/4/12/14/13), which resists simple letter-frequency analysis.',
          },
          {
            question: 'Why is the key repeated?',
            answer:
              'When the plaintext is longer than the key, the key cycles from the start: KEY over seven letters gives K-E-Y-K-E-Y-K. This is the standard Vigenère rule and the property exploited by Kasiski / index-of-coincidence attacks.',
          },
          {
            question: 'How are spaces, numbers, and Chinese handled?',
            answer:
              'Non-letter characters are emitted unchanged and do not advance the key — a key position is consumed only on A–Z / a–z — so punctuated text round-trips exactly between encryption and decryption.',
          },
        ],
      },
    },
  },
  {
    slug: 'midi-note-converter',
    name: 'MIDI 音符与频率互转计算器',
    nameEn: 'MIDI Note & Frequency Converter',
    description:
      '输入 MIDI 编号、音名（C4/A#4/Bb3）或频率任一项实时互转，支持自定义 A4 基准频率（如 432Hz），附八度 12 音频率表。',
    descriptionEn:
      'Convert between MIDI numbers, note names (C4/A#4/Bb3), and frequencies in real time with a customizable A4 reference (e.g. 432Hz), plus a 12-tone octave frequency table.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/midi-note-converter',
    iconName: 'Music',
    tags: ['MIDI', '音符', '频率', '十二平均律', '调音'],
    tagsEn: ['MIDI', 'Note', 'Frequency', 'Equal Temperament', 'Tuning'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '69',
    doc: {
      zh: {
        whatIsIt:
          'MIDI 音符与频率互转计算器基于十二平均律公式 f = A4 × 2^((MIDI − 69) / 12)，输入 MIDI 编号（0–127）、音名（如 C4、A#4、Bb3）或频率（Hz）任一项，即可实时得到其余两项，并显示频率模式下与最近音符的音分偏差；支持自定义 A4 基准频率（国际标准 440Hz，亦可选 432Hz 等），还可展开任意八度（-1–9）的 12 音频率表。全部计算在浏览器本地完成。',
        coreFeatures: [
          '三向互转：MIDI 编号、音名、频率任输入一项实时得到其余结果',
          '升降号兼容：音名支持 A#4 / Bb3 等升号与降号写法，大小写不敏感',
          '自定义 A4：修改基准频率（如 432Hz）后所有换算与八度表同步更新',
          '音分偏差：频率模式给出与最近音符的 cents 偏差，便于调音与误差分析',
          '八度频率表：C 到 B 共 12 个半音的 MIDI 编号与精确频率一览',
        ],
        howToUse: [
          '选择输入方式：MIDI 编号、音名或频率 (Hz)',
          '在输入框中键入数值，结果卡片实时刷新',
          '需要非标准定调时修改 A4 基准频率；在八度表中切换八度查看 12 音',
        ],
        useCases: [
          '音乐制作与编曲时查 MIDI 音符编号、核对音名与频率',
          '乐器 / 合成器调音，分析测量频率与标准音高的音分偏差',
          '嵌入式音频与 DSP 开发中由 MIDI note 计算振荡器频率',
        ],
        privacyNote:
          '所有换算均在本地浏览器完成，不涉及任何网络请求或数据上传。',
        faqs: [
          {
            question: '为什么 MIDI 69 是 A4？',
            answer:
              'MIDI 标准将 88 键钢琴中央 C 上方的 A 定为编号 69，即 A4（440Hz 国际标准音高）；中央 C 为编号 60（C4）。每增加 1 编号升高一个半音，故 70 为 A#4。',
          },
          {
            question: '十二平均律的频率公式是什么？',
            answer:
              'f = A4 × 2^((MIDI − 69) / 12)：每 12 个半音频率翻倍（一个八度），相邻半音频率比恒为 2^(1/12) ≈ 1.05946，例如 MIDI 70 ≈ 466.16Hz。',
          },
          {
            question: '自定义 432Hz 基准有什么作用？',
            answer:
              '部分乐手偏好以 A4 = 432Hz 而非 440Hz 定调。修改基准后 MIDI 69 即对应 432Hz，所有音符频率与八度表按比例变化；也可用于分析一段 432Hz 音频在标准 440Hz 体系下偏低约 31.77 音分。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The MIDI Note & Frequency Converter uses the equal-temperament formula f = A4 × 2^((MIDI − 69) / 12). Enter any one of a MIDI number (0–127), note name (e.g. C4, A#4, Bb3), or frequency (Hz) to instantly obtain the others, including the cents offset in frequency mode. The A4 reference is customizable (440Hz standard or 432Hz), and any octave (-1–9) can be expanded into a 12-tone frequency table. Everything is computed locally in the browser.',
        coreFeatures: [
          'Three-way conversion: enter MIDI number, note name, or frequency and get the rest live',
          'Accidentals supported: sharp (A#4) and flat (Bb3) spellings, case-insensitive',
          'Custom A4: changing the reference (e.g. 432Hz) updates all results and the octave table',
          'Cents offset: frequency mode shows deviation from the nearest note for tuning analysis',
          'Octave table: MIDI numbers and exact frequencies for all 12 semitones C through B',
        ],
        howToUse: [
          'Choose an input mode: MIDI number, note name, or frequency (Hz)',
          'Type a value; the result cards update in real time',
          'Change the A4 reference for alternate pitch standards and switch octaves in the table',
        ],
        useCases: [
          'Looking up MIDI numbers and note frequencies while producing or arranging music',
          'Tuning instruments and synthesizers by analyzing cents deviation from standard pitch',
          'Computing oscillator frequencies from MIDI notes in embedded audio and DSP development',
        ],
        privacyNote:
          'All conversions run locally in your browser with no network requests or uploads.',
        faqs: [
          {
            question: 'Why is MIDI 69 A4?',
            answer:
              'The MIDI standard assigns number 69 to the A above middle C, A4 (440Hz concert pitch); middle C is number 60 (C4). Each increment raises pitch by one semitone, so 70 is A#4.',
          },
          {
            question: 'What is the equal-temperament frequency formula?',
            answer:
              'f = A4 × 2^((MIDI − 69) / 12): every 12 semitones doubles the frequency (one octave), and the semitone ratio is always 2^(1/12) ≈ 1.05946, so MIDI 70 ≈ 466.16Hz.',
          },
          {
            question: 'Why use a 432Hz reference?',
            answer:
              'Some musicians tune to A4 = 432Hz instead of 440Hz. With that reference MIDI 69 maps to 432Hz and every frequency scales accordingly; it also shows that a 432Hz tone sits about 31.77 cents flat in the standard 440Hz system.',
          },
        ],
      },
    },
  },
  {
    slug: 'rgb565-converter',
    name: 'RGB565 / RGB555 嵌入式颜色格式转换器',
    nameEn: 'RGB565 / RGB555 Embedded Color Converter',
    description:
      '在 #RRGGBB 与 16 位帧缓冲像素（RGB565 / RGB555）之间批量双向转换，输出大小端字节序、C 字面量与 HIGH/LOW 字节拆分，反向还原量化色差。',
    descriptionEn:
      'Batch-convert between #RRGGBB and 16-bit framebuffer pixels (RGB565 / RGB555) with big/little endian bytes, C literals, HIGH/LOW byte split, and reverse RGB888 reconstruction with quantization delta.',
    category: ToolCategoryEnum.DESIGN_COLOR,
    path: '/tools/rgb565-converter',
    iconName: 'Layers',
    tags: ['RGB565', 'RGB555', '嵌入式', '帧缓冲', '字节序'],
    tagsEn: ['RGB565', 'RGB555', 'Embedded', 'Framebuffer', 'Endian'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '#3B82F6',
    doc: {
      zh: {
        whatIsIt:
          'RGB565 / RGB555 嵌入式颜色格式转换器面向单片机、LCD 驱动与帧缓冲开发：把 24 位 RGB888（#RRGGBB）打包为 16 位像素值（ST7735 / ILI9341 等 TFT 屏常用的 RGB565，或各通道 5 位的 RGB555），输出 0x 开头的 C 语言十六进制字面量、HIGH_BYTE / LOW_BYTE 拆分以及大端 / 小端两种字节序；反向可把调试器中的 16 位像素值还原为最接近的 RGB888 并给出量化色差。支持每行一个颜色的批量转换，全部为本地位运算。',
        coreFeatures: [
          '两种位布局：RGB565（红 5 / 绿 6 / 蓝 5）与 RGB555（各 5 位、最高位未用）',
          '字节序可选：大端高位在前、小端低位在前，并拆分 HIGH_BYTE / LOW_BYTE',
          '批量转换：每行一个值，空行跳过，单行非法仅该行报错不影响其他行',
          '反向还原：位域低位补 1 扩展（5 位 OR 0x07、6 位 OR 0x03）并显示 RGB 色差 Δ',
          '输入宽松：颜色可省略 #，像素值可省略 0x，大小写不敏感',
        ],
        howToUse: [
          '选择模式（正向 #RRGGBB→16 位 / 反向 16 位→#RRGGBB）、像素格式与字节序',
          '在左侧文本框每行粘贴一个颜色或像素值，结果与逐行明细实时刷新',
          '点击复制结果获取一列字面量或颜色，HIGH/LOW 字节可直接用于取模代码',
        ],
        useCases: [
          '为 ST7735 / ILI9341 等 TFT 屏编写配色表与取模代码',
          '对着调试器 / 逻辑分析仪中的像素值反查实际颜色',
          '核对帧缓冲大小端布局与 DMA 字节序，排查花屏问题',
        ],
        privacyNote:
          '所有转换均在浏览器本地完成，仅涉及位运算，不发起任何网络请求或数据上传。',
        faqs: [
          {
            question: 'RGB565 与 RGB555 的位布局有什么区别？',
            answer:
              'RGB565 共 16 位全部使用：bit15–11 红 5 位、bit10–5 绿 6 位、bit4–0 蓝 5 位，绿色通道精度更高，是 TFT 屏的主流格式；RGB555 三个通道各占 5 位，最高位 bit15 未使用（有时作为 a 透明位），故白色编码为 0x7FFF 而非 0xFFFF。',
          },
          {
            question: '大端和小端如何选择？',
            answer:
              '大端（高位在前）把像素 0xF800 存为字节 F8 00，小端（低位在前）存为 00 F8。大多数 SPI TFT 屏按大端（高位字节先发）配置；若屏幕显示红蓝错位或颜色异常，可切换字节序核对，HIGH_BYTE 与 LOW_BYTE 列给出确定的两个字节。',
          },
          {
            question: '为什么反向还原的颜色与原色不完全一致？',
            answer:
              '16 位像素每个通道只有 5–6 位精度，打包时低位被丢弃（量化）。还原时对低位补 1（5 位用 0b111、6 位用 0b11）可使误差最小且纯白恰好还原为 255，但像纯红 0xF800 会还原为 #FF0307，与 #FF0000 存在轻微色差，色差 Δ 列以 RGB 欧氏距离量化该误差。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The RGB565 / RGB555 Embedded Color Converter targets MCU, LCD driver, and framebuffer development: pack 24-bit RGB888 (#RRGGBB) into 16-bit pixels (RGB565 used by ST7735/ILI9341 TFT panels, or 5-bit-per-channel RGB555), producing C hex literals, HIGH_BYTE/LOW_BYTE split, and big/little endian byte order. It also decodes 16-bit values from a debugger back to the nearest RGB888 with a quantization color delta. Batch conversion takes one value per line and everything is local bit math.',
        coreFeatures: [
          'Two bit layouts: RGB565 (5/6/5) and RGB555 (5 bits each, top bit unused)',
          'Selectable endianness: big-endian high byte first or little-endian low byte first, plus HIGH/LOW bytes',
          'Batch mode: one value per line, blank lines skipped, a bad line is flagged without blocking others',
          'Reverse decode: bit fields are expanded by filling low bits (5-bit OR 0x07, 6-bit OR 0x03) with RGB delta',
          'Lenient input: # and 0x prefixes optional, case-insensitive',
        ],
        howToUse: [
          'Pick the mode (#RRGGBB→16-bit or 16-bit→#RRGGBB), pixel format, and endianness',
          'Paste one color or pixel value per line in the left textarea; the result and per-row table update live',
          'Use copy result to get a column of literals or colors, and HIGH/LOW bytes directly in pixel-setup code',
        ],
        useCases: [
          'Building color tables and pixel-setup code for ST7735 / ILI9341 TFT displays',
          'Looking up the real color behind pixel values seen in a debugger or logic analyzer',
          'Verifying framebuffer endianness and DMA byte order when debugging garbled colors',
        ],
        privacyNote:
          'All conversions run locally in your browser using only bit operations, with no network requests or uploads.',
        faqs: [
          {
            question: 'What is the bit-layout difference between RGB565 and RGB555?',
            answer:
              'RGB565 uses all 16 bits: red 5 bits (15–11), green 6 bits (10–5), blue 5 bits (4–0), giving green more precision; it is the mainstream TFT format. RGB555 gives each channel 5 bits and leaves bit15 unused (sometimes an alpha flag), so white encodes as 0x7FFF instead of 0xFFFF.',
          },
          {
            question: 'How do I choose big-endian or little-endian?',
            answer:
              'Big-endian stores 0xF800 as bytes F8 00 (high byte first); little-endian stores 00 F8. Most SPI TFT panels expect the high byte first. If colors look swapped or garbled, toggle the endianness; the HIGH_BYTE and LOW_BYTE columns always show the exact two bytes.',
          },
          {
            question: 'Why does decoding not reproduce the original color exactly?',
            answer:
              'A 16-bit pixel keeps only 5–6 bits per channel, so low bits are dropped when packing. Decoding fills the low bits with ones (0b111 for 5-bit, 0b11 for 6-bit) to minimize error and make pure white decode to 255, but pure red 0xF800 decodes to #FF0307, slightly off #FF0000. The delta column quantifies that error as RGB Euclidean distance.',
          },
        ],
      },
    },
  },
  {
    slug: 'geohash-codec',
    name: 'Geohash 编解码器',
    nameEn: 'Geohash Encode & Decode',
    description:
      '在经纬度与 Geohash base32 字符串之间双向转换：编码支持 1–12 位精度并展示逐字符区间二分过程，解码输出中心点、边界框与误差范围，全部本地计算。',
    descriptionEn:
      'Convert between latitude/longitude and Geohash base32 strings: encode with 1–12 character precision and per-character interval bisection steps, or decode to center point, bounding box, and error margin. All local.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/geohash-codec',
    iconName: 'Binary',
    tags: ['Geohash', '经纬度', '地理编码', 'Base32', 'LBS'],
    tagsEn: ['Geohash', 'Coordinates', 'Geocoding', 'Base32', 'LBS'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '57.64911,10.40744',
    doc: {
      zh: {
        whatIsIt:
          'Geohash 编解码器面向地图与 LBS 开发：把经纬度坐标编码为 Geohash 字符串（一种用 base32 字符对地球表面做层次化网格划分的空间索引方案），也可以把 Geohash 解码回中心点坐标、边界框与误差范围。编码时逐字符展示经纬度区间如何被交替二分收窄，便于理解 geohash 的网格结构；全部计算为本地纯函数，不涉及任何网络坐标服务。',
        coreFeatures: [
          '双向转换：经纬度 → geohash（1–12 位可选）与 geohash → 中心点 / 边界框',
          '过程可视化：逐字符给出 5 bit、纬度区间与经度区间的二分收窄过程',
          '误差量化：解码输出格子边界框与经纬度误差（格子半宽）',
          '输入宽容：自动 trim、大写自动转小写，非法字符（a/i/l/o 等）明确报错',
          '零依赖本地运算：固定算法、固定测试向量，结果与 Wikipedia 标准示例一致',
        ],
        howToUse: [
          '选择模式（编码 / 解码）：编码侧填入纬度、经度与精度，结果实时刷新',
          '复制 geohash 结果用于短链接、附近搜索前缀匹配或空间索引',
          '解码侧粘贴 geohash 字符串，查看中心点、边界框与误差，可一键复制中心点',
        ],
        useCases: [
          '地图应用中按 geohash 前缀做附近的人 / 地点聚合查询',
          '把坐标压缩为短字符串用于短链接、二维码或离线数据交换',
          '学习与验证 geohash 区间二分算法，调试 LBS 服务端编解码逻辑',
        ],
        privacyNote:
          '所有编解码均在浏览器本地完成，仅涉及区间二分与 base32 映射，不发起任何网络请求或位置数据上传。',
        faqs: [
          {
            question: 'geohash 精度与误差是什么关系？',
            answer:
              '每个 geohash 字符携带 5 个 bit（偶数位用于经度、奇数位用于纬度），字符越多格子越小。1 位字符的格子误差可达数十度，而 8 位字符的经纬度误差约在 20 米 / 40 米量级，11–12 位已达到厘米级以下。解码结果给出的误差即格子半宽，中心点为区间中点。',
          },
          {
            question: '为什么相邻位置的 geohash 前缀相同？',
            answer:
              'Geohash 是层次化网格：同一个父格子内的所有位置共享父格子前缀。因此附近搜索常用前缀匹配快速缩小范围，但需注意网格边界两侧的位置即使物理上很近，前缀也可能完全不同，生产环境通常还需查询周围 8 个邻居格子。',
          },
          {
            question: 'Geohash 和经纬度的度分秒格式转换是一回事吗？',
            answer:
              '不是。度分秒（DMS）转换只是同一个点位的不同文本表示（十进制度 ↔ 度分秒），坐标本身没有网格化；geohash 则是用 base32 字符对经纬度区间反复二分得到的空间索引串，字符串代表一块区域而非一个精确点，因此才有边界框与误差概念。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Geohash codec serves map and LBS development: encode latitude/longitude into a Geohash string (a hierarchical grid of the earth indexed by base32 characters), or decode a Geohash back to its center point, bounding box, and error margin. While encoding, it shows how the latitude and longitude intervals are alternately bisected character by character, making the grid structure transparent. Everything runs as local pure functions with no network geocoding service.',
        coreFeatures: [
          'Bidirectional: coordinates → geohash (1–12 chars) and geohash → center / bounding box',
          'Visualized steps: per-character 5 bits plus latitude/longitude interval bisection',
          'Error quantified: decoded cell bounding box and lat/lng error (half cell width)',
          'Lenient input: automatic trim and lowercasing, with clear errors for invalid letters (a/i/l/o)',
          'Zero-dependency local math matching the canonical Wikipedia test vector',
        ],
        howToUse: [
          'Pick encode or decode; for encode enter latitude, longitude, and precision and watch the result update live',
          'Copy the geohash for short links, nearby-search prefix matching, or spatial indexing',
          'For decode paste a geohash to inspect the center, bounding box, and error, with one-click center copy',
        ],
        useCases: [
          'Nearby people/place aggregation by geohash prefix in map applications',
          'Compressing coordinates into short strings for short links, QR codes, or offline exchange',
          'Learning the geohash bisection algorithm and debugging LBS backend codec logic',
        ],
        privacyNote:
          'All encoding and decoding runs locally in your browser using only interval bisection and base32 mapping, with no network requests or location uploads.',
        faqs: [
          {
            question: 'What is the relationship between geohash precision and error?',
            answer:
              'Each geohash character carries 5 bits (even-indexed bits for longitude, odd-indexed for latitude), so more characters mean smaller cells. A 1-character cell can span tens of degrees, an 8-character cell is on the order of 20m/40m error, and 11–12 characters reach sub-centimeter precision. The reported error is the half-width of the cell, with the center at the interval midpoint.',
          },
          {
            question: 'Why do nearby points share a geohash prefix?',
            answer:
              'Geohash is a hierarchical grid: every point inside a parent cell shares the parent prefix, which is why prefix matching quickly narrows nearby searches. Note that points on opposite sides of a grid boundary can have completely different prefixes despite being physically close; production systems usually also query the 8 neighboring cells.',
          },
          {
            question: 'Is geohash the same as converting degrees-minutes-seconds?',
            answer:
              'No. DMS conversion merely rewrites the same point in another text representation (decimal degrees ↔ degrees/minutes/seconds) without gridding. A geohash is a spatial index produced by repeatedly bisecting lat/lng intervals with base32 characters; the string denotes an area rather than an exact point, which is why it has a bounding box and an error margin.',
          },
        ],
      },
    },
  },
  {
    slug: 'unicode-normalization',
    name: 'Unicode 规范化转换器（NFC / NFD / NFKC / NFKD）',
    nameEn: 'Unicode Normalization Converter (NFC / NFD / NFKC / NFKD)',
    description:
      '对文本应用四种 Unicode 标准规范化形式，展示转换前后码点数、UTF-16 码元、UTF-8 字节与逐码点 LCS 差异，正确处理组合标记、兼容字符、emoji 与代理对。',
    descriptionEn:
      'Apply the four standard Unicode normalization forms to text, showing code-point count, UTF-16 units, UTF-8 bytes, and a per-code-point LCS diff, with proper handling of combining marks, compatibility characters, emoji, and surrogate pairs.',
    category: ToolCategoryEnum.TEXT_CONTENT,
    path: '/tools/unicode-normalization',
    iconName: 'Type',
    tags: ['Unicode', '规范化', 'NFC', 'NFD', '码点'],
    tagsEn: ['Unicode', 'Normalization', 'NFC', 'NFD', 'Code Point'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'Café é\n①②③ ＡＢＣ',
    doc: {
      zh: {
        whatIsIt:
          'Unicode 规范化转换器对任意文本应用 Unicode 标准定义的四种规范化形式（NFC / NFD / NFKC / NFKD），用于排查「看起来相同但字节不同」的字符串比较问题：预组合字符（如 é，U+00E9）与分解序列（e U+0065 + 组合重音 U+0301）可互相转换；全角字母、① 序号、连字 ﬁ、半角片假名等兼容字符可在 KC/KD 形式下折叠为普通等价字符。工具同时给出码点数、UTF-16 码元数、UTF-8 字节数与逐码点差异高亮，全部基于浏览器原生 String.prototype.normalize 与 TextEncoder 本地完成。',
        coreFeatures: [
          '四种标准形式：NFC 规范合成、NFD 规范分解、NFKC 兼容合成、NFKD 兼容分解',
          '逐码点差异：LCS 对齐转换前后序列，灰 / 红 / 蓝标记不变、删除、新增',
          '三项长度指标：码点数、UTF-16 码元数（.length）、UTF-8 字节数实时对比',
          '正确处理代理对与 emoji ZWJ 序列，增补平面字符不被拆成孤立代理',
          '零新依赖：直接使用浏览器内置 normalize / TextEncoder，结果可与原生 API 逐项对照',
        ],
        howToUse: [
          '选择规范化形式（默认 NFC），在左侧粘贴或输入文本，右侧实时显示结果',
          '查看码点 Tag：组合重音、全角折叠等变化以红色删除 / 蓝色新增标注',
          '一键复制规范化结果，用于服务端比较前的输入归一化或数据清洗',
        ],
        useCases: [
          '排查用户名、文件名、搜索词「看着相同却不相等」的规范化问题',
          '安全场景下对用户输入做 NFKC 归一化，防止同形字符混淆',
          '处理含组合标记、半角片假名、连字、全角符号的多语言文本数据',
        ],
        privacyNote:
          '所有转换均在浏览器本地通过 String.prototype.normalize 与 TextEncoder 完成，不发起任何网络请求或文本上传。',
        faqs: [
          {
            question: 'NFC 和 NFD 有什么区别？',
            answer:
              '二者只处理「规范等价」的字符：NFC（Canonical Composition）把基字符与组合标记合成为单个预组合码点（如 e + 重音 → U+00E9 é）；NFD（Canonical Decomposition）做反向展开。两者显示外观相同，但字节与码点序列不同，macOS 的 HFS+ 文件名就曾默认使用 NFD，跨系统比较前需先统一形式。',
          },
          {
            question: '为什么 NFKC 会改变字符外观（① 变成 1）？',
            answer:
              '带 K 的形式额外执行「兼容性分解」：①、全角 Ａ、上标 ²、连字 ﬁ、半角片假名等字符在 Unicode 中是为兼容旧字符集而保留的，与普通写法仅「兼容等价」。NFKC/NFKD 会把它们折叠成普通字符，利于搜索与比较，但可能丢失排版语义或圈号外观，因此不适合所有场景。',
          },
          {
            question: 'emoji 和 ZWJ 序列会受影响吗？',
            answer:
              '普通 emoji（如 😀，U+1F600）位于增补平面，工具按码点迭代而非 UTF-16 码元，不会拆成乱码代理；家庭、职业等 emoji 使用 ZWJ（U+200D）连接多个码点，规范化不会移除 ZWJ，序列保持完整。但 emoji 修饰符（肤色、旗标分组）本身不属于规范化范畴，结果仍以浏览器 Unicode 数据表为准。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Unicode Normalization Converter applies the four standard Unicode normalization forms (NFC / NFD / NFKC / NFKD) to any text, solving "looks identical but bytes differ" comparison issues: precomposed characters (é, U+00E9) convert to and from decomposed sequences (e U+0065 + combining acute U+0301), while compatibility characters such as full-width letters, circled digits ①, the ﬁ ligature, and half-width katakana fold to ordinary equivalents under KC/KD. It reports code-point count, UTF-16 units, UTF-8 bytes, and a per-code-point diff, all locally via the native String.prototype.normalize and TextEncoder APIs.',
        coreFeatures: [
          'All four standard forms: NFC canonical composition, NFD canonical decomposition, NFKC/NFKD compatibility forms',
          'Per-code-point diff: LCS alignment with gray/red/blue tags for unchanged, removed, and added',
          'Three length metrics: code points, UTF-16 units (.length), and UTF-8 bytes compared live',
          'Correct surrogate-pair and emoji ZWJ handling; supplementary-plane characters are never split',
          'Zero dependencies: built on native normalize / TextEncoder, directly cross-checkable against the platform API',
        ],
        howToUse: [
          'Pick a form (NFC by default), paste or type text on the left, and read the live result on the right',
          'Inspect code-point tags: combining marks and full-width folds show as red removals / blue additions',
          'Copy the normalized result for input canonicalization before server-side comparison or data cleaning',
        ],
        useCases: [
          'Debugging usernames, filenames, or search terms that look equal but compare unequal',
          'NFKC canonicalization of user input in security contexts to defeat confusable characters',
          'Processing multilingual text with combining marks, half-width katakana, ligatures, and full-width symbols',
        ],
        privacyNote:
          'All conversion runs locally in your browser via String.prototype.normalize and TextEncoder, with no network requests or text uploads.',
        faqs: [
          {
            question: 'What is the difference between NFC and NFD?',
            answer:
              'Both handle only canonically equivalent characters: NFC composes a base character plus combining marks into a single precomposed code point (e + acute → U+00E9 é), while NFD expands it the other way. They render identically but have different byte and code-point sequences; macOS HFS+ filenames famously defaulted to NFD, so unify the form before cross-system comparison.',
          },
          {
            question: 'Why does NFKC change how characters look (① becomes 1)?',
            answer:
              'The K forms additionally perform compatibility decomposition: ①, full-width Ａ, superscript ², the ﬁ ligature, and half-width katakana exist in Unicode only for compatibility with legacy character sets and are merely compatibility-equivalent to plain spellings. NFKC/NFKD fold them into ordinary characters, which helps search and comparison but can lose typographic semantics or the circled appearance, so it is not appropriate everywhere.',
          },
          {
            question: 'Are emoji and ZWJ sequences affected?',
            answer:
              'Plain emoji such as 😀 (U+1F600) live on a supplementary plane; the tool iterates by code point rather than UTF-16 unit, so they are never split into broken surrogates. Family and profession emoji join multiple code points with ZWJ (U+200D), which normalization never removes, so the sequence stays intact. Emoji modifiers (skin tones, flag sequences) are outside normalization anyway; results follow the browser Unicode data tables.',
          },
        ],
      },
    },
  },
  {
    slug: 'json-merge-patch',
    name: 'JSON Merge Patch 生成与应用器（RFC 7386）',
    nameEn: 'JSON Merge Patch Generator & Applier (RFC 7386)',
    description:
      '按 RFC 7386 / 7396 语义将 merge patch 应用到 JSON 文档，或在两个 JSON 文档之间生成最小补丁（null 表示删除键），错误带行列定位，结果一键复制。',
    descriptionEn:
      'Apply a merge patch to a JSON document or generate a minimal patch between two documents per RFC 7386/7396 (null deletes a key), with line/column-aware errors and one-click copy.',
    category: ToolCategoryEnum.DATA_JSON,
    path: '/tools/json-merge-patch',
    iconName: 'Braces',
    tags: ['JSON', 'Merge Patch', 'RFC 7386', 'PATCH', 'API 调试'],
    tagsEn: ['JSON', 'Merge Patch', 'RFC 7386', 'PATCH', 'API Debugging'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput:
      '{\n  "title": "Goodbye!",\n  "author": {\n    "givenName": "John",\n    "familyName": "Doe"\n  },\n  "tags": ["example", "sample"],\n  "content": "This will be unchanged"\n}',
    doc: {
      zh: {
        whatIsIt:
          'JSON Merge Patch 工具实现 RFC 7386 定义的 merge patch 格式：补丁文档模仿原文档的结构，逐键描述修改——值为 null 表示删除该键，双方都是对象则递归合并，其余情况整体替换，数组按整体替换处理。既可把现成补丁应用到原文档查看结果，也可对比原文档与目标文档自动生成满足 RFC 7396 语义的最小补丁，直接用于 HTTP PATCH 请求。',
        coreFeatures: [
          '双模式：应用补丁（apply）与生成补丁（generate）',
          '严格 RFC 7386 递归语义：null 删除键、对象递归合并、数组 / 标量整体替换',
          '生成最小补丁：applyPatch(原文, 生成补丁) 与目标文档深度一致',
          '错误可定位：非法 JSON 报告具体行列号，不产生静默结果',
          '零依赖本地运算，覆盖 RFC 7386 附录 A 全部官方测试向量',
        ],
        howToUse: [
          '选择模式：应用补丁时左栏填原文档、右栏填 merge patch；生成补丁时右栏填目标文档',
          '结果栏实时展示应用结果或生成的补丁 JSON（2 空格缩进），可一键复制',
          '点击「载入示例」查看 RFC 官方示例；删除键时在补丁里把该键值写为 null',
        ],
        useCases: [
          '构造并调试 application/merge-patch+json 类型的 HTTP PATCH 请求体',
          '对比两份配置 / 接口响应，快速生成只含差异的最小更新文档',
          '学习 RFC 7386 语义，验证服务端 merge patch 实现是否符合附录 A 向量',
        ],
        privacyNote:
          '所有 JSON 解析与补丁运算均在浏览器本地完成，文档内容不会上传或离开当前页面。',
        faqs: [
          {
            question: '补丁里的 null 是什么含义？如何把一个键更新为 null？',
            answer:
              '在 merge patch 中，键值为 null 专门表示「删除目标对象的这个键」。因此 merge patch 无法表达「把值更新为 null」这一操作——这是 RFC 7386 的有意设计，它建议只对不使用显式 null 值的文档采用 merge patch；需要区分两种语义时应改用 JSON Patch（RFC 6902）。',
          },
          {
            question: '为什么数组是整体替换而不是按元素合并？',
            answer:
              'RFC 7386 明确规定补丁不是对象时整体替换目标，而数组不是「对象」：合并算法无法判断你是想按下标改元素、插入、删除还是重排，逐元素猜测会造成歧义。因此要把 [1,2] 改成 [1,3]，补丁必须给出完整的 [1,3]。需要路径级数组操作请使用 RFC 6902。',
          },
          {
            question: 'JSON Merge Patch（RFC 7386）和 JSON Patch（RFC 6902）有什么区别？',
            answer:
              'Merge patch 是「声明目标样子」的文档：键值即修改、null 即删除，写法简单但表达力有限，无法操作数组元素或把值设为 null。JSON Patch 是一组有序操作（add/remove/replace/move/copy/test），带 JSON Pointer 路径，能精确操作数组但语法更繁琐。本工具仅支持 merge patch。',
          },
        ],
      },
      en: {
        whatIsIt:
          'This tool implements the merge patch format defined in RFC 7386: the patch mimics the structure of the original document and describes changes key by key — a null value deletes the key, two objects merge recursively, and anything else (including arrays) is replaced wholesale. Apply an existing patch to see the result, or compare an original with a target to generate the minimal RFC 7396 patch ready to send in an HTTP PATCH request.',
        coreFeatures: [
          'Two modes: apply a patch and generate a patch',
          'Strict RFC 7386 recursion: null deletes, plain objects merge, arrays/scalars replace wholesale',
          'Minimal patch generation so that applying it to the original deep-equals the target',
          'Actionable errors: invalid JSON reports the exact line and column with no silent output',
          'Zero-dependency local computation, covering every official Appendix A test vector',
        ],
        howToUse: [
          'Pick a mode: for apply, put the original on the left and the merge patch on the right; for generate, put the target document on the right',
          'The result panel shows the applied result or generated patch as 2-space-indented JSON, copyable in one click',
          'Use "Load sample" for the canonical RFC example; to delete a key, set it to null in the patch',
        ],
        useCases: [
          'Building and debugging HTTP PATCH bodies of type application/merge-patch+json',
          'Diffing two configs or API responses into a minimal update document',
          'Learning RFC 7386 semantics and validating a server implementation against Appendix A',
        ],
        privacyNote:
          'All JSON parsing and patching runs locally in your browser; document content is never uploaded and never leaves the page.',
        faqs: [
          {
            question: 'What does null in a patch mean? How do I set a key to null?',
            answer:
              'In a merge patch, a key whose value is null specifically means "remove this key from the target". A merge patch therefore cannot express "change the value to null" — this is intentional in RFC 7386, which recommends merge patch only for documents without explicit null values. If you need to distinguish the two, use JSON Patch (RFC 6902) instead.',
          },
          {
            question: 'Why are arrays replaced wholesale instead of merged element by element?',
            answer:
              'RFC 7386 states that a non-object patch replaces the target entirely, and arrays are not "objects": the algorithm cannot tell whether you meant to edit by index, insert, delete, or reorder, so guessing would be ambiguous. To change [1,2] into [1,3], the patch must supply the full [1,3]. For path-level array operations, use RFC 6902.',
          },
          {
            question: 'How does JSON Merge Patch (RFC 7386) differ from JSON Patch (RFC 6902)?',
            answer:
              'A merge patch is a document declaring the desired shape: values are edits and null means delete — simple but limited, with no array-element operations and no way to set a value to null. JSON Patch is an ordered list of operations (add/remove/replace/move/copy/test) with JSON Pointer paths, precise for arrays but more verbose. This tool supports merge patch only.',
          },
        ],
      },
    },
  },
  {
    slug: 'coordinate-system-converter',
    name: 'WGS-84 / GCJ-02 / BD-09 坐标系互转器',
    nameEn: 'Coordinate System Converter (WGS-84 / GCJ-02 / BD-09)',
    description:
      '批量互转 GPS（WGS-84）、火星坐标（GCJ-02，高德 / 腾讯）与百度坐标（BD-09），每行「经度,纬度」，逐行校验并给出明细，境外坐标不偏移，结果一键复制。',
    descriptionEn:
      'Batch-convert between GPS (WGS-84), GCJ-02 (Mars coordinates, AMap/Tencent) and BD-09 (Baidu), one "lng,lat" pair per line, with per-row validation and detail table; out-of-China points are returned unshifted. One-click copy.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/coordinate-system-converter',
    iconName: 'Code',
    tags: ['坐标系转换', 'WGS84', 'GCJ02', 'BD09', '地图开发'],
    tagsEn: ['Coordinate Transform', 'WGS84', 'GCJ02', 'BD09', 'Map Development'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '116.404,39.915\n121.4737,31.2304',
    doc: {
      zh: {
        whatIsIt:
          '坐标系互转器用于解决国内地图开发中最常见的坐标不一致问题：GPS 设备与国际标准使用 WGS-84，高德、腾讯等国内地图服务使用加入非线性偏移的 GCJ-02（火星坐标系），百度地图在 GCJ-02 基础上再做一次加密得到 BD-09。工具实现通行的偏移算法及其逆运算，支持三种坐标系两两互转、批量处理与逐行错误提示，全部计算在浏览器本地完成。',
        coreFeatures: [
          'WGS-84、GCJ-02、BD-09 三种坐标系两两互转（共 9 种方向组合）',
          '批量转换：每行一对「经度,纬度」，支持英文 / 中文逗号、分号与空白分隔，自动跳过空行',
          '逐行校验：字段缺失、非数字、经纬度越界等错误只标记对应行，不影响其他行',
          '明细表格：展示每行转换结果，并对中国境外坐标标注「境外未偏移」',
          '结果统一保留 6 位小数，可一键复制，纯本地运算零依赖',
        ],
        howToUse: [
          '在顶部选择源坐标系与目标坐标系，在左栏每行输入一对「经度,纬度」（十进制）',
          '右栏实时显示转换结果；下方表格逐行展示明细，错误行会给出具体原因',
          '点击「复制结果」复制全部输出（成功行为坐标，失败行为以 # 开头的错误说明）',
        ],
        useCases: [
          '把 GPS 轨迹 / 设备上报的 WGS-84 坐标转换为高德、腾讯地图可用的 GCJ-02 坐标',
          '将百度地图取点结果（BD-09）转换为 WGS-84 后入库或与国际数据源对齐',
          '批量清洗 CSV 中的坐标列，快速定位格式错误与境外数据',
        ],
        privacyNote:
          '所有坐标计算均在浏览器本地完成，输入的位置数据不会上传或离开当前页面。',
        faqs: [
          {
            question: 'WGS-84、GCJ-02、BD-09 分别是什么？',
            answer:
              'WGS-84 是 GPS 使用的国际标准坐标系；GCJ-02（火星坐标系）是国家规定的加密坐标系，在 WGS-84 上叠加非线性偏移，高德、腾讯等国内地图使用；BD-09 是百度在 GCJ-02 基础上再次加密得到的坐标系，仅用于百度地图。同一真实地点在三套坐标下的经纬度数值不同，直接混用会出现几百米偏差。',
          },
          {
            question: '为什么中国境外的坐标不做偏移？',
            answer:
              'GCJ-02 偏移只针对中国境内有效，通行实现（coordtransform 等）会用矩形范围（经度 72.004–137.8347、纬度 0.8293–55.8271）粗略判断，范围外的坐标直接原样返回。工具沿用这一约定并在明细中标注「境外未偏移」。',
          },
          {
            question: 'GCJ-02 转 WGS-84 的结果为什么说是近似的？',
            answer:
              'GCJ-02 偏移算法没有官方逆函数，本工具采用业界通行的减法近似（用 WGS→GCJ 的偏移量反减），往返误差通常在 1–2 米量级，对打点、展示等场景足够；对测绘级精度要求的场景请使用官方坐标转换服务。BD-09 与 WGS-84 之间的转换统一经 GCJ-02 中转。',
          },
        ],
      },
      en: {
        whatIsIt:
          'This converter solves the most common coordinate mismatch in China map development: GPS devices and international standards use WGS-84; mainland services such as AMap and Tencent Maps use GCJ-02 (the "Mars" system), which applies a non-linear offset to WGS-84; and Baidu Maps adds another encryption layer on top of GCJ-02 called BD-09. The tool implements the widely used offset algorithm and its inverse, supports all pairwise conversions between the three systems with batch processing and per-row error reporting, and runs entirely in the browser.',
        coreFeatures: [
          'All pairwise conversions among WGS-84, GCJ-02 and BD-09 (9 direction combinations)',
          'Batch mode: one "lng,lat" pair per line; accepts commas (ASCII/full-width), semicolons and whitespace; blank lines skipped',
          'Per-row validation: missing fields, non-numeric values and out-of-range coordinates only fail that row',
          'Detail table showing every converted row, with an "out of China, unshifted" tag for points outside the offset rectangle',
          'Output rounded to 6 decimal places, one-click copy, zero-dependency local computation',
        ],
        howToUse: [
          'Pick the source and target coordinate systems at the top, then enter one decimal "lng,lat" pair per line in the left panel',
          'The right panel updates with results in real time; the table below shows per-row details and error reasons',
          'Click "Copy results" to copy all output (successful rows as coordinates, failed rows as #-prefixed error lines)',
        ],
        useCases: [
          'Converting GPS tracks or device-reported WGS-84 points to GCJ-02 for AMap/Tencent display',
          'Converting Baidu BD-09 points back to WGS-84 for storage or alignment with international data',
          'Cleaning coordinate columns in CSV files, quickly spotting malformed rows and overseas data',
        ],
        privacyNote:
          'All coordinate calculations run locally in your browser; location data is never uploaded and never leaves this page.',
        faqs: [
          {
            question: 'What are WGS-84, GCJ-02 and BD-09?',
            answer:
              'WGS-84 is the international standard used by GPS. GCJ-02 ("Mars coordinates") is the legally required encrypted system in mainland China that adds a non-linear offset to WGS-84, used by AMap and Tencent Maps. BD-09 is Baidu\u2019s further encryption on top of GCJ-02, used only by Baidu Maps. The same real place has different numeric coordinates in the three systems; mixing them causes offsets of hundreds of meters.',
          },
          {
            question: 'Why are points outside China returned without any offset?',
            answer:
              'The GCJ-02 offset is only defined inside China. The de-facto implementations (e.g. coordtransform) use a rough bounding rectangle (lng 72.004\u2013137.8347, lat 0.8293\u201355.8271) and return points outside it unchanged. This tool follows that convention and tags such rows as "out of China, unshifted".',
          },
          {
            question: 'Why is GCJ-02 to WGS-84 described as approximate?',
            answer:
              'There is no official inverse of the GCJ-02 offset. This tool uses the standard subtraction approximation (subtracting the WGS\u2192GCJ shift), whose round-trip error is typically within 1\u20132 meters \u2014 fine for markers and display, but surveying-grade workloads should use an authorized conversion service. BD-09 to/from WGS-84 always goes through GCJ-02.',
          },
        ],
      },
    },
  },
  {
    slug: 'ieee754-float-converter',
    name: 'IEEE 754 浮点数转换器（32 / 64 位）',
    nameEn: 'IEEE 754 Float Converter (32/64-bit)',
    description:
      '在十进制数值与 IEEE 754 单精度（32 位）、双精度（64 位）的二进制 / 十六进制表示之间互转，拆解符号位、偏置指数与尾数位域，支持 ±0、±Infinity、NaN，结果一键复制。',
    descriptionEn:
      'Convert between decimal numbers and IEEE 754 binary/hex representations in single (32-bit) and double (64-bit) precision, with sign/biased-exponent/mantissa bit-field breakdown and ±0, ±Infinity, NaN support. One-click copy.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/ieee754-float-converter',
    iconName: 'Binary',
    tags: ['IEEE 754', '浮点数', '二进制', '十六进制', '底层调试'],
    tagsEn: ['IEEE 754', 'Floating Point', 'Binary', 'Hexadecimal', 'Low-level Debug'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '0.1',
    doc: {
      zh: {
        whatIsIt:
          'IEEE 754 是现代 CPU 与 JavaScript（number 即 64 位双精度）通用的二进制浮点标准。本工具把十进制数值编码为 32 位单精度或 64 位双精度的二进制 / 十六进制位串，并逐位拆解符号位、含偏置的指数位与尾数位；也支持把任意合法位串还原为十进制数值，正确处理 ±0、±Infinity 与 NaN。底层通过 ArrayBuffer / DataView / BigInt 完成确定性位操作，全部在浏览器本地运行。',
        coreFeatures: [
          '支持 binary32（1+8+23，偏置 127）与 binary64（1+11+52，偏置 1023）',
          '十进制 → 位表示：输出十六进制与按位域着色分段的二进制串',
          '位表示 → 十进制：自动识别二进制 / 十六进制（支持 0b、0x 前缀与空格、下划线分隔）',
          '位域拆解表：符号、指数原始位、去偏置指数、尾数二进制与十六进制',
          '完整支持 ±0、±Infinity、NaN 特殊值；非法位宽 / 字符明确报错不静默',
        ],
        howToUse: [
          '选择精度（单精度 32 位 / 双精度 64 位）与转换模式，在输入框中填入十进制数值或位串',
          '正向模式实时显示十六进制、分段二进制串与位域表；反向模式显示还原的十进制值',
          '点击「复制结果」复制十六进制与二进制（正向）或十进制值（反向）',
        ],
        useCases: [
          '排查浮点精度问题：直观看到 0.1、金额、累加误差在二进制层面的真实存储',
          '调试网络协议 / 嵌入式 / 二进制文件中的 float、double 字段，核对字节序与位模式',
          '教学辅助：理解隐藏位、偏置指数、非规约数、Infinity / NaN 的编码规则',
        ],
        privacyNote:
          '所有位运算均在浏览器本地通过 ArrayBuffer / DataView 完成，输入数值不会上传或离开当前页面。',
        faqs: [
          {
            question: '为什么 0.1 不能被精确表示？',
            answer:
              'IEEE 754 用二进制分数逼近十进制小数，0.1 = 1/10 的分母含有因子 5，无法表示为有限个 2 的负幂次之和，只能存为最接近的二进制值。双精度下实际约为 0.10000000000000000555（3FB999999999999A），单精度舍入为 3DCCCCCD，这正是 0.1 + 0.2 不等于 0.3 的根本原因。',
          },
          {
            question: '什么是偏置指数（biased exponent）？',
            answer:
              '指数字段是无符号整数，存储的是「真实指数 + 偏置值」：32 位偏置为 127、64 位为 1023。例如 1.0 的真实指数为 0，64 位字段存 1023（01111111111）。这样指数可以直接按无符号整数比较大小，也省掉了指数本身的符号位。指数全 0 表示零或非规约数，全 1 表示 Infinity 或 NaN。',
          },
          {
            question: '32 位单精度与 64 位双精度有什么差异？',
            answer:
              '二者位域布局相同（符号 1 位 + 指数 + 尾数），但 32 位为 8 位指数、23 位尾数（约 7 位十进制有效数字、±3.4×10³⁸ 量程），64 位为 11 位指数、52 位尾数（约 15–17 位有效数字、±1.8×10³⁰⁸ 量程）。JavaScript 的 number 统一使用 64 位双精度；本工具单精度结果按 IEEE 754 round-to-nearest 舍入，并会提示实际存储值。',
          },
        ],
      },
      en: {
        whatIsIt:
          'IEEE 754 is the binary floating-point standard used by CPUs and by JavaScript itself (every number is a 64-bit double). This tool encodes a decimal value into its 32-bit single or 64-bit double binary/hex bit pattern, breaks the bits down into sign, biased exponent and mantissa fields, and decodes any valid bit pattern back to decimal \u2014 correctly handling \u00b10, \u00b1Infinity and NaN. Bit operations use ArrayBuffer / DataView / BigInt and run entirely locally in the browser.',
        coreFeatures: [
          'Supports binary32 (1+8+23, bias 127) and binary64 (1+11+52, bias 1023)',
          'Decimal \u2192 bits: outputs hexadecimal plus a binary string color-segmented by field',
          'Bits \u2192 decimal: auto-detects binary vs hex (0b/0x prefixes and spaces/underscores accepted)',
          'Field table: sign, raw exponent bits, unbiased exponent, mantissa in binary and hex',
          'Full support for \u00b10, \u00b1Infinity and NaN; invalid width/characters raise clear errors',
        ],
        howToUse: [
          'Pick the precision (32-bit single / 64-bit double) and direction, then enter a decimal number or a bit string',
          'Forward mode shows hex, the segmented binary stream and the field table; reverse mode shows the decoded decimal value',
          'Click "Copy results" to copy hex+binary (forward) or the decimal value (reverse)',
        ],
        useCases: [
          'Diagnosing floating-point surprises: seeing how 0.1, money values and accumulated errors are really stored',
          'Inspecting float/double fields in network protocols, firmware dumps or binary files (bit patterns and endianness)',
          'Teaching the hidden bit, biased exponent, subnormal numbers and Infinity/NaN encodings',
        ],
        privacyNote:
          'All bit manipulation runs locally in your browser via ArrayBuffer / DataView; entered values are never uploaded.',
        faqs: [
          {
            question: 'Why cannot 0.1 be represented exactly?',
            answer:
              'IEEE 754 approximates decimal fractions with binary fractions. Since 0.1 = 1/10 has a factor of 5 in the denominator, it cannot be written as a finite sum of negative powers of two; the closest double is about 0.10000000000000000555 (3FB999999999999A), and the nearest float is 3DCCCCCD. This is exactly why 0.1 + 0.2 is not 0.3.',
          },
          {
            question: 'What is a biased exponent?',
            answer:
              'The exponent field is unsigned and stores the true exponent plus a bias: 127 for 32-bit, 1023 for 64-bit. For 1.0 the true exponent is 0, so the 64-bit field holds 1023 (01111111111). Bias lets exponents be compared as plain unsigned integers and removes the need for a sign bit on the exponent. All-zero exponent means zero/subnormal; all-ones means Infinity or NaN.',
          },
          {
            question: 'What differs between 32-bit single and 64-bit double?',
            answer:
              'The layout is the same (1 sign + exponent + mantissa), but single uses 8 exponent and 23 mantissa bits (\u22487 significant decimal digits, range \u00b13.4\u00d710\u00b3\u2078), while double uses 11 and 52 (\u224815\u201317 digits, range \u00b11.8\u00d710\u00b3\u2070\u2078). JavaScript numbers are always 64-bit doubles; single-precision output here follows round-to-nearest and the tool shows the actually stored value.',
          },
        ],
      },
    },
  },
  {
    slug: 'secure-random-picker',
    name: '密码学安全随机工具（抽签 / 分组 / 洗牌）',
    nameEn: 'Secure Random Picker (Draw / Group / Shuffle)',
    description:
      '基于浏览器 crypto.getRandomValues 的无偏随机：区间随机整数（拒绝采样消除取模偏置）、名单不放回抽签、随机均分分组与 Fisher–Yates 洗牌，适合抽奖、随机分组与随机排序。',
    descriptionEn:
      'Unbiased randomness powered by crypto.getRandomValues: ranged integers with rejection sampling (no modulo bias), no-replacement draws, balanced random grouping and Fisher–Yates shuffling for raffles, team assignment and random ordering.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/secure-random-picker',
    iconName: 'Shuffle',
    tags: ['随机数', '抽签', '抽奖', '随机分组', '洗牌', 'CSPRNG'],
    tagsEn: ['Random', 'Raffle', 'Draw', 'Random Group', 'Shuffle', 'CSPRNG'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '张三\n李四\n王五\n赵六\n钱七\n孙八',
    doc: {
      zh: {
        whatIsIt:
          '本工具基于浏览器原生 Web Crypto（crypto.getRandomValues，CSPRNG）提供密码学安全的随机选择与排列：区间随机整数采用拒绝采样，避免区间长度不是 2 的幂时的取模偏置；抽签、分组与洗牌均建立在无偏 Fisher–Yates 之上，所有运算在本地完成。',
        coreFeatures: [
          '随机整数：闭区间 [min, max] 内生成，支持允许 / 不允许重复，拒绝采样保证每个整数等概率',
          '抽签：从名单中不放回抽取指定数量，结果无重复',
          '随机分组：Fisher–Yates 洗牌后均分到指定组数，各组人数相差至多 1',
          '列表洗牌：完整无偏 Fisher–Yates，返回打乱后的顺序',
          '使用 crypto.getRandomValues 而非 Math.random()，适合需要公正性的抽奖与分组场景',
        ],
        howToUse: [
          '选择模式（随机整数 / 抽签 / 随机分组 / 洗牌）',
          '随机整数模式填写最小、最大值与数量；其余模式在文本框中每行填写一个候选项',
          '点击「生成随机结果」，结果可一键复制',
        ],
        useCases: [
          '抽奖 / 抽签：从参与者名单中公正地抽出中奖者',
          '随机分组：会议、课堂、比赛中把名单随机均分为若干组',
          '生成不偏不倚的随机整数序列，或把播放 / 答题列表随机排序',
        ],
        privacyNote:
          '全部随机过程在浏览器本地通过 Web Crypto 完成，候选名单与结果不会上传或离开当前页面。',
        faqs: [
          {
            question: '为什么不用 Math.random()？',
            answer:
              'Math.random() 是伪随机数，各浏览器实现不提供密码学安全保证，不适合抽奖等需要防预测、防操纵的场景。crypto.getRandomValues 由操作系统的 CSPRNG 提供熵，可用于安全敏感用途。',
          },
          {
            question: '什么是「取模偏置」？如何消除？',
            answer:
              '把 [0,2³²) 的随机数直接对区间长度 n 取模时，只有当 n 整除 2³² 时每个结果才等概率；否则区间头部的结果概率略高。本工具采用拒绝采样：丢弃落在「不完整尾部」的随机数后重新生成，严格保证均匀分布。',
          },
          {
            question: '抽签结果可以重复吗？',
            answer:
              '抽签为不放回抽样，同一个候选项最多出现一次，因此抽取数量不能超过候选数量。随机分组后所有组的并集恰好等于原名单，不会遗漏或重复。',
          },
        ],
      },
      en: {
        whatIsIt:
          'This tool builds cryptographically secure random selection and permutation on the native Web Crypto API (crypto.getRandomValues, a CSPRNG). Ranged integers use rejection sampling to avoid modulo bias when the range is not a power of two; draws, grouping and shuffling all run on top of an unbiased Fisher–Yates shuffle. Everything is computed locally.',
        coreFeatures: [
          'Ranged integers: inclusive [min, max], with/without duplicates; rejection sampling gives every integer equal probability',
          'Draw: pick a given number of entries without replacement, never repeating',
          'Random grouping: Fisher–Yates shuffle then balanced split into N groups, sizes differ by at most one',
          'List shuffle: a full unbiased Fisher–Yates shuffle returning the new ordering',
          'Uses crypto.getRandomValues instead of Math.random(), suitable when fairness matters',
        ],
        howToUse: [
          'Choose a mode (integers / draw / random groups / shuffle)',
          'For integers set min, max and count; for the other modes enter one candidate per line',
          'Click "Generate" and copy the results with one click',
        ],
        useCases: [
          'Fair raffles and lucky draws from a list of participants',
          'Splitting attendees or students randomly into balanced groups',
          'Producing unbiased integer sequences or randomizing playlists / question orders',
        ],
        privacyNote:
          'All randomness is generated locally in your browser via Web Crypto; candidates and results are never uploaded.',
        faqs: [
          {
            question: 'Why not Math.random()?',
            answer:
              'Math.random() is a non-cryptographic PRNG with no security guarantee across browsers, so it is unsuitable for raffles that must resist prediction or manipulation. crypto.getRandomValues is seeded by the operating system CSPRNG and is safe for security-sensitive use.',
          },
          {
            question: 'What is modulo bias and how is it removed?',
            answer:
              'Reduction of a [0,2³²) draw modulo n is only uniform when n divides 2³²; otherwise lower results are slightly more likely. This tool uses rejection sampling: draws falling in the incomplete tail are discarded and regenerated, guaranteeing a strictly uniform distribution.',
          },
          {
            question: 'Can a draw contain duplicates?',
            answer:
              'No. A draw is sampling without replacement, so each candidate appears at most once and the count cannot exceed the candidate count. After random grouping, the union of all groups equals exactly the original list, with neither omission nor duplication.',
          },
        ],
      },
    },
  },
  {
    slug: 'bech32-codec',
    name: 'Bech32 / Bech32m 编解码',
    nameEn: 'Bech32 / Bech32m Encoder & Decoder',
    description:
      '实现 BIP-173 / BIP-350 的 Bech32 与 Bech32m 编解码：支持任意 HRP 与 hex 数据编码、自动按 witness 版本选择校验常量（v0 用 Bech32，v1+ 用 Bech32m），解码时双常量探测并给出明确错误，自动识别 SegWit 地址（P2WPKH / P2WSH / P2TR）网络、版本与 witness program。',
    descriptionEn:
      'BIP-173 / BIP-350 Bech32 and Bech32m encoder/decoder: encode any HRP with hex data, auto-select the checksum constant by witness version (Bech32 for v0, Bech32m for v1+), decode with dual-constant detection and clear errors, and interpret SegWit addresses (P2WPKH / P2WSH / P2TR) including network, version and witness program.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/bech32-codec',
    iconName: 'KeyRound',
    tags: ['Bech32', 'Bech32m', 'BIP-173', 'BIP-350', '比特币', 'SegWit', 'Taproot'],
    tagsEn: ['Bech32', 'Bech32m', 'BIP-173', 'BIP-350', 'Bitcoin', 'SegWit', 'Taproot'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    doc: {
      zh: {
        whatIsIt:
          'Bech32 / Bech32m 是 BIP-173 与 BIP-350 定义的带 30 位校验和的 base32 编码，广泛用于比特币原生隔离见证地址：v0 的 P2WPKH/P2WSH 使用 Bech32，v1+（含 Taproot P2TR）使用修复了长度篡改弱点的 Bech32m。',
        coreFeatures: [
          '任意 HRP + hex 数据编码，自动 / 强制选择 Bech32（常量 1）或 Bech32m（常量 0x2bc830a3）',
          '解码时校验大小写、字符集、90 字符长度上限，并用两种常量同时探测校验和类型',
          '自动解读 SegWit 地址：网络（bc/tb/bcrt）、witness 版本、P2WPKH/P2WSH/P2TR 与 witness program hex',
          '严格 convertbits padding 校验，覆盖 BIP-173 / BIP-350 官方 VALID/INVALID 向量',
        ],
        howToUse: [
          '编码：填写 HRP（如 bc）、选择 witness 版本与校验和类型、粘贴偶数长度 hex program，即时生成地址',
          '解码：粘贴 bech32 字符串，查看 HRP、校验和类型、SegWit 网络/版本/脚本类型与 program',
          '报错信息会指出大小写混用、非法字符、长度超限或常量不匹配等具体原因',
        ],
        useCases: [
          '核对比特币主网 / 测试网隔离见证与 Taproot 地址的正确性',
          '调试自定义 HRP 的 Bech32/Bech32m 数据（如 Lightning、其他链的地址方案）',
          '教学与协议开发：观察 polymod 校验和与 5/8-bit convertbits 的实际行为',
        ],
        privacyNote:
          '全部为浏览器本地同步运算，地址与数据不会离开设备，也不发起任何网络请求。',
        faqs: [
          {
            question: 'Bech32 和 Bech32m 有什么区别？',
            answer:
              '两者编码结构相同，仅末尾异或的校验常量不同：Bech32 为 1，Bech32m 为 0x2bc830a3。Bech32m 修复了 Bech32 在末位为 p 时插入/删除 q 不破坏校验和的弱点；按 BIP-350，witness v0 仍用 Bech32，v1 及以上必须用 Bech32m。',
          },
          {
            question: '为什么解码时要同时尝试两种常量？',
            answer:
              '通用 Bech32 数据不带「我用了哪个常量」的标记。解码器分别用常量 1 与 0x2bc830a3 计算 polymod：恰好一个匹配即为对应类型；都不匹配说明字符串被篡改或抄写错误。BIP-350 证明同一字符串不可能同时通过两种校验。',
          },
          {
            question: 'v0 地址用 Bech32m 编码会怎样？',
            answer:
              '属于非法地址。工具在 SegWit 解读阶段会明确报错「witness version 0 必须使用 Bech32 校验常量」；反之 v1+ 使用 Bech32 同样会被拒绝，避免向错误编码的地址付款造成资金损失。',
          },
        ],
      },
      en: {
        whatIsIt:
          'Bech32 / Bech32m are checksummed base32 formats defined by BIP-173 and BIP-350, widely used for Bitcoin native SegWit addresses: v0 P2WPKH/P2WSH uses Bech32, while v1+ (including Taproot P2TR) uses Bech32m, which fixes a length-mutation weakness.',
        coreFeatures: [
          'Encode any HRP plus hex data with auto or forced Bech32 (constant 1) / Bech32m (constant 0x2bc830a3)',
          'Decode validates case, charset and the 90-character limit while probing both checksum constants',
          'Interprets SegWit addresses: network (bc/tb/bcrt), witness version, P2WPKH/P2WSH/P2TR and program hex',
          'Strict convertbits padding checks, verified against official BIP-173 / BIP-350 VALID/INVALID vectors',
        ],
        howToUse: [
          'Encode: enter the HRP (e.g. bc), pick the witness version and checksum kind, paste even-length hex program, and the address is generated live',
          'Decode: paste a bech32 string to see HRP, checksum type, SegWit network/version/script type and program',
          'Errors pinpoint mixed case, invalid characters, over-length input or mismatched checksum constants',
        ],
        useCases: [
          'Verify Bitcoin mainnet/testnet SegWit and Taproot addresses',
          'Debug Bech32/Bech32m data with custom HRPs (Lightning and other addressing schemes)',
          'Learning and protocol development: observe polymod checksums and 5/8-bit convertbits in practice',
        ],
        privacyNote:
          'Everything is computed synchronously and locally in your browser; addresses and data never leave your device and no network requests are made.',
        faqs: [
          {
            question: 'What is the difference between Bech32 and Bech32m?',
            answer:
              'The structure is identical; only the final XOR checksum constant differs: 1 for Bech32 and 0x2bc830a3 for Bech32m. Bech32m fixes a weakness where inserting/deleting a q before a final p did not invalidate the Bech32 checksum. Per BIP-350, witness v0 keeps Bech32 while v1+ must use Bech32m.',
          },
          {
            question: 'Why does decoding try both constants?',
            answer:
              'Generic Bech32 payloads carry no flag saying which constant was used. The decoder computes the polymod against both 1 and 0x2bc830a3: exactly one match identifies the type, while neither match means corruption or a typo. BIP-350 proves a string can never pass both checks simultaneously.',
          },
          {
            question: 'What if a v0 address is encoded with Bech32m?',
            answer:
              'It is invalid. The SegWit interpreter explicitly reports that witness version 0 requires the Bech32 constant; likewise v1+ encoded with Bech32 is rejected, preventing payments to incorrectly encoded addresses.',
          },
        ],
      },
    },
  },
  {
    slug: 'ohms-law-calculator',
    name: '欧姆定律与功率计算器（V / I / R / P 知二求二）',
    nameEn: 'Ohm\'s Law & Power Calculator (Solve V / I / R / P)',
    description:
      '输入电压 V、电流 I、电阻 R、功率 P 中任意两个量，自动联立求解其余两个量（V=I·R、P=V·I=I²R=V²/R），展示所用公式与自适应单位换算；R、P 组合开方给出正负极性双解，并对零除、负功率/电阻等物理无意义输入给出明确提示。',
    descriptionEn:
      'Enter any two of voltage V, current I, resistance R and power P to solve the other two using V=I·R and P=V·I=I²R=V²/R, with formulas and auto unit conversion. The R/P combination shows both positive and negative square-root solutions, while division by zero and negative power/resistance are clearly rejected.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/ohms-law-calculator',
    iconName: 'Gauge',
    tags: ['欧姆定律', '功率', '电阻', '电压', '电流', '电子', '硬件'],
    tagsEn: ['Ohm\'s Law', 'Power', 'Resistance', 'Voltage', 'Current', 'Electronics', 'Hardware'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '5 V,1 kΩ',
    doc: {
      zh: {
        whatIsIt:
          '本工具联立求解欧姆定律 V = I·R 与功率方程 P = V·I = I²·R = V²/R：给定电压、电流、电阻、功率中的任意两个已知量，即可求出其余两个量，标注每个结果所用的公式，并在 V/mV、A/mA、Ω/kΩ/MΩ、W/mW/kW 之间自动换算。所有计算在浏览器本地完成。',
        coreFeatures: [
          '知二求二：六种已知量组合全部支持，结果标注推导公式',
          '单位换算：每个量带单位下拉，统一换算到基准单位求解并自适应展示',
          '双解提示：仅给 R、P 需要开方时，同时给出正、负极性数学解',
          '严格校验：零除、负电阻/负功率、过定或不足的输入均给出明确错误',
        ],
        howToUse: [
          '在电压、电流、电阻、功率四个输入框中恰好填写两个，可使用右侧下拉切换单位',
          '其余两个量即时自动求解，表格显示自适应单位值、基准单位值与公式',
          '需要开方的组合会在结果下方展示负极性解；也可点击示例预设快速体验',
        ],
        useCases: [
          '估算 LED 限流电阻阻值与功耗（如 5V 供电、1kΩ 电阻的电流与功率）',
          '调试电源与负载：由额定电压 / 功率推算工作电流与等效电阻',
          '电子教学：直观对照 V、I、R、P 四个量之间的换算关系',
        ],
        privacyNote:
          '全部为浏览器本地同步运算，电路参数不会离开设备，也不发起任何网络请求。',
        faqs: [
          {
            question: '为什么有时会出现正、负两个解？',
            answer:
              '当只给定电阻 R 与功率 P 时，V = ±√(P·R)、I = ±√(P/R) 在数学上有正负极性两组解，分别代表相反的电压 / 电流方向。常规直流电路取正极性解，工具同时展示负解以保证数学完整性。',
          },
          {
            question: '为什么填三个量反而报错？',
            answer:
              '四个量由两条独立方程约束，自由度为 2：恰好两个已知量才能唯一确定其余两个。填三个量构成过定方程组，只有当三者恰好自洽时才有解，因此工具要求只填两个以避免给出与输入矛盾的结果。',
          },
          {
            question: '零电阻（短路）时为什么不能计算？',
            answer:
              '理想导体 R = 0 时 I = V/R 的电流无界（除以零），仅在 V 也为 0 的退化情形下功率为 0；给定非零电压或非零功率都会产生物理矛盾，工具会明确指出而非给出虚假数值。',
          },
        ],
      },
      en: {
        whatIsIt:
          'This tool combines Ohm\'s law V = I·R with the power equations P = V·I = I²·R = V²/R: provide any two of voltage, current, resistance and power and the other two are solved with their derivation formulas, converting automatically among V/mV, A/mA, Ω/kΩ/MΩ and W/mW/kW. Everything runs locally in the browser.',
        coreFeatures: [
          'Solve two from two: all six input pairs supported, each result labelled with its formula',
          'Unit conversion: per-field unit dropdowns normalize to base units and format output adaptively',
          'Dual solutions: the R/P square-root case shows both positive and negative polarities',
          'Strict validation: division by zero, negative resistance/power and under/over-determined input are clearly reported',
        ],
        howToUse: [
          'Fill exactly two of the four inputs (voltage, current, resistance, power), switching units in the dropdowns',
          'The other two quantities are solved instantly; the table shows adapted units, base units and formulas',
          'Square-root cases additionally show the negative solutions below the table; example presets are available',
        ],
        useCases: [
          'Estimate an LED current-limiting resistor and its dissipation (e.g. 5V across 1kΩ)',
          'Debug power supplies and loads: derive operating current and equivalent resistance from ratings',
          'Electronics education: see the V/I/R/P relationships side by side',
        ],
        privacyNote:
          'Everything is computed synchronously and locally in your browser; circuit values never leave your device and no network requests are made.',
        faqs: [
          {
            question: 'Why are there sometimes positive and negative solutions?',
            answer:
              'With only R and P given, V = ±√(P·R) and I = ±√(P/R) have two mathematical polarities representing opposite voltage/current directions. Ordinary DC circuits take the positive solution; the negative one is shown for mathematical completeness.',
          },
          {
            question: 'Why does filling three quantities raise an error?',
            answer:
              'The four quantities are constrained by two independent equations, leaving two degrees of freedom: exactly two known values uniquely determine the rest. Three values over-determine the system and are only consistent if they happen to agree, so the tool requires exactly two inputs to avoid contradictory output.',
          },
          {
            question: 'Why can\'t a zero-resistance short circuit be calculated?',
            answer:
              'With ideal R = 0 the current I = V/R is unbounded (division by zero); only the degenerate V = 0 case yields zero power. A nonzero voltage or power with R = 0 is physically impossible, so the tool reports it instead of returning bogus numbers.',
          },
        ],
      },
    },
  },
  {
    slug: 'cookie-parser',
    name: 'Cookie 字符串解析与生成器',
    nameEn: 'Cookie Parser & Set-Cookie Builder',
    description:
      '在浏览器本地解析 Cookie 请求头为名称 / 值表格（可选 URL 编码解码、重复名提示），并可编辑后重新序列化；同时支持按 RFC 6265 生成与回填 Set-Cookie 字符串，覆盖 Expires、Max-Age、Domain、Path、Secure、HttpOnly、SameSite 等属性，自动校验 SameSite=None 必须配 Secure 等常见问题。',
    descriptionEn:
      'Parse a Cookie request header into a name/value table locally (optional URL decoding with duplicate-name warnings), edit rows and re-serialize; also build and back-fill RFC 6265 Set-Cookie strings covering Expires, Max-Age, Domain, Path, Secure, HttpOnly and SameSite, with checks such as SameSite=None requiring Secure.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/cookie-parser',
    iconName: 'Tags',
    tags: ['Cookie', 'Set-Cookie', 'HTTP', 'RFC 6265', '请求头', '前端开发'],
    tagsEn: ['Cookie', 'Set-Cookie', 'HTTP', 'RFC 6265', 'Request Header', 'Frontend'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'sessionId=3f8a9c2e-7b41; theme=dark',
    doc: {
      zh: {
        whatIsIt:
          '本工具面向 Web 开发中的 Cookie 调试场景，包含两个相互独立的区域：其一，把 Cookie 请求头（如 a=1; b=2）解析成可编辑的名称 / 值表格，支持按行增删改、可选 URL 编码 / 解码并实时重新序列化；其二，按 RFC 6265 组装或解析 Set-Cookie 响应头，覆盖 Expires、Max-Age、Domain、Path、Secure、HttpOnly、SameSite 等属性。所有处理均在浏览器本地完成。',
        coreFeatures: [
          'Cookie 请求头双向转换：字符串解析为表格，表格编辑后即时序列化',
          '可选 URL 编码 / 解码，畸形编码与重复名称会给出告警',
          'Set-Cookie 生成器：图形化设置各属性，按标准顺序输出完整字符串',
          'Set-Cookie 回填解析：粘贴已有字符串即可还原表单，未知属性扩展保留',
          '合规校验：SameSite=None 缺少 Secure、Expires 与 Max-Age 同时设置等均有提示',
        ],
        howToUse: [
          '在上方区域粘贴 Cookie 请求头，用开关控制是否做 URL 解码，直接在表格中编辑名称和值',
          '可点击「添加一行」新增键值，或用删除按钮移除某行，序列化结果随编辑实时更新',
          '在下方区域填写名称、值与各属性开关，右侧即时生成 Set-Cookie 字符串',
          '也可把已有的 Set-Cookie 粘贴到输入框并点击回填，表单会自动还原其属性',
        ],
        useCases: [
          '调试登录态：解析复杂 Cookie 头，快速定位某个会话标识的值',
          '构造测试用 Cookie：编辑表格后复制序列化字符串，用于接口调试或浏览器控制台',
          '编写后端 Set-Cookie：图形化确认属性格式与顺序，避免 SameSite/Secure 配置错误',
        ],
        privacyNote:
          'Cookie 内容可能包含会话标识等敏感信息，本工具所有解析与生成均在浏览器本地完成，不会上传或存储任何数据。',
        faqs: [
          {
            question: 'Cookie 请求头和 Set-Cookie 有什么区别？',
            answer:
              'Cookie 请求头由浏览器发往服务器，形如 a=1; b=2，只包含一系列名称 = 值对；Set-Cookie 由服务器在响应中下发，形如 name=value; Path=/; HttpOnly，单个头只描述一个 Cookie 及其属性。两者语法不同，因此本工具用两个独立区域分别处理。',
          },
          {
            question: '为什么 SameSite=None 时提示必须设置 Secure？',
            answer:
              '现代浏览器规定 SameSite=None 的 Cookie 必须同时带 Secure 属性，即只能通过 HTTPS 发送，否则该 Cookie 会被直接拒绝。工具检测到这一组合时会给出告警，提醒勾选 Secure。',
          },
          {
            question: 'Expires 和 Max-Age 同时设置会怎样？',
            answer:
              '按 RFC 6265，两者同时存在时 Max-Age 优先生效，Expires 仅作为旧浏览器兼容。工具允许同时生成，但会给出提示说明优先级关系。',
          },
        ],
      },
      en: {
        whatIsIt:
          'This tool supports Cookie debugging in web development with two independent areas: it parses a Cookie request header (e.g. a=1; b=2) into an editable name/value table with optional URL encoding/decoding and live re-serialization, and it builds or parses RFC 6265 Set-Cookie response headers covering Expires, Max-Age, Domain, Path, Secure, HttpOnly and SameSite. Everything runs locally in the browser.',
        coreFeatures: [
          'Bidirectional Cookie header conversion: string to table and back as you edit',
          'Optional URL encoding/decoding with warnings for malformed escapes and duplicate names',
          'Set-Cookie builder: toggle attributes in a form and get a correctly ordered string',
          'Set-Cookie back-fill: paste an existing string to restore the form, unknown extensions kept',
          'Compliance checks: SameSite=None without Secure, and Expires with Max-Age are flagged',
        ],
        howToUse: [
          'Paste a Cookie request header in the top area, toggle URL decoding, and edit names/values in the table',
          'Add rows with the add button or remove them; the serialized header updates instantly',
          'Fill the name, value and attribute controls in the bottom area to generate a Set-Cookie string',
          'Or paste an existing Set-Cookie into its input and back-fill the form to inspect its attributes',
        ],
        useCases: [
          'Debug sessions: parse a long Cookie header to quickly find a specific identifier',
          'Build test cookies: edit the table and copy the serialized string for API debugging',
          'Author backend Set-Cookie headers: verify attribute formatting and SameSite/Secure rules visually',
        ],
        privacyNote:
          'Cookies may contain sensitive session identifiers. All parsing and generation happen locally in your browser; no data is uploaded or stored.',
        faqs: [
          {
            question: 'What is the difference between the Cookie header and Set-Cookie?',
            answer:
              'The Cookie request header is sent by the browser as a sequence of name=value pairs like a=1; b=2, while a Set-Cookie response header describes one cookie plus attributes, like name=value; Path=/; HttpOnly. Their syntax differs, so the tool handles them in two separate areas.',
          },
          {
            question: 'Why does SameSite=None require Secure?',
            answer:
              'Modern browsers require cookies with SameSite=None to also carry Secure, meaning they are only sent over HTTPS; otherwise the cookie is rejected. The tool warns when this combination is detected and suggests enabling Secure.',
          },
          {
            question: 'What if both Expires and Max-Age are set?',
            answer:
              'Per RFC 6265, when both are present Max-Age takes precedence and Expires remains only for legacy compatibility. The builder allows both but shows an informational note about the precedence.',
          },
        ],
      },
    },
  },
  {
    slug: 'ascii-table',
    name: 'ASCII 码表查询器（字符 / Dec / Hex / Oct / Bin 对照）',
    nameEn: 'ASCII Table Lookup (Char / Dec / Hex / Oct / Bin)',
    description:
      '完整标准 ASCII（US-ASCII，0–127）码表：逐字符展示十进制、十六进制、八进制、二进制、可打印字符、控制字符缩写（NUL / LF / CR / ESC / DEL 等）与说明；支持字符 ↔ 码位双向检索（65、0x41、41h）、按分类与关键字筛选、Ctrl+A…Ctrl+Z 组合键速查，点击行即可复制。',
    descriptionEn:
      'A complete standard ASCII (US-ASCII, 0–127) table showing decimal, hex, octal, binary, printable characters, control-code abbreviations (NUL / LF / CR / ESC / DEL) and descriptions, with bidirectional char/code lookup (65, 0x41, 41h), category and keyword filters, Ctrl+A…Ctrl+Z shortcuts, and click-to-copy rows.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/ascii-table',
    iconName: 'Type',
    tags: ['ASCII', '码表', '字符编码', '十六进制', '二进制', '控制字符'],
    tagsEn: ['ASCII', 'Code Table', 'Character Encoding', 'Hex', 'Binary', 'Control Characters'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '0x41',
    doc: {
      zh: {
        whatIsIt:
          '本工具提供标准 US-ASCII（码位 0–127）的静态对照码表：每一行给出十进制 Dec、十六进制 Hex、八进制 Oct、七位二进制 Bin、可打印字符、控制字符缩写（NUL、LF、CR、ESC、DEL 等）以及中文说明。支持由字符查码位、由码位反查字符，按分类或关键字筛选，并提供 Ctrl 组合键与常用控制键速查。数据为公开标准表，全部在浏览器本地检索与渲染。',
        coreFeatures: [
          '完整覆盖 0–127 共 128 个码位，五种进制 / 字符表示一一对应',
          '双向检索：单字符（含空格）、十进制 65、十六进制 0x41 或 41h 自动识别',
          '分类筛选（控制字符 / 可打印 / DEL）与缩写、说明、码位关键字搜索',
          'Ctrl+A…Ctrl+Z 与 ESC、Tab、LF、CR、空格、DEL 常用键速查',
          '空格以可见占位 ␠ 呈现；点击任意行或标签即可复制码位信息',
        ],
        howToUse: [
          '在顶部检索框输入字符（如 A 或一个空格）或码位（65、0x41、41h）查看完整对照',
          '在码表上方切换分类按钮或在搜索框输入缩写、说明、字符、码位进行筛选',
          '点击码表任意行复制该行完整信息，或在速查区点击组合键标签复制',
        ],
        useCases: [
          '调试串口 / 网络协议中的控制符：确认 LF、CR、ESC、DEL 等码位',
          '终端与嵌入式开发：速查 Ctrl+字母 对应的 0x01–0x1A 码位',
          '学习字符编码：对照字母、数字、标点与 Dec/Hex/Oct/Bin 表示',
        ],
        privacyNote:
          '码表为内置公开标准数据，所有检索与复制均在浏览器本地完成，不发起任何网络请求。',
        faqs: [
          {
            question: '为什么只到 127？扩展 ASCII（如 128–255）呢？',
            answer:
              'US-ASCII 标准只定义 0–127 共 128 个码位，单字节最高位为 0；128–255 的含义取决于具体代码页（如 Windows-1252、ISO-8859-1），并无统一标准。工具只覆盖无歧义的 US-ASCII，超出范围的输入会明确提示。',
          },
          {
            question: 'Ctrl+M 为什么等于回车 CR？',
            answer:
              '终端中按住 Ctrl 再按字母时，键盘会把该字母码位与 0x1F 按位与，等价于大写字母码位减 64。M 的大写码位是 77，减去 64 得到 13，即回车 CR；同理 Ctrl+J 是 10（LF），Ctrl+[ 是 27（ESC）。',
          },
          {
            question: '空格为什么显示成 ␠？',
            answer:
              '空格（码位 32）本身是不可见的可打印字符，直接放在表格里无法与空白区分，因此用可见占位符 ␠（SP）呈现，复制与检索仍按真实空格处理。',
          },
        ],
      },
      en: {
        whatIsIt:
          'This tool provides a static reference for standard US-ASCII (codes 0–127): each row lists decimal, hex, octal, 7-bit binary, the printable character, control-code abbreviations (NUL, LF, CR, ESC, DEL, etc.) and a description. It supports character-to-code and code-to-character lookup, category and keyword filtering, and Ctrl/control-key shortcuts. The data is a public standard table and everything is searched and rendered locally in the browser.',
        coreFeatures: [
          'All 128 codes 0–127 with five representations per row',
          'Bidirectional lookup: a single character (including space), decimal 65, hex 0x41 or 41h auto-detected',
          'Category filters (control / printable / DEL) and keyword search over abbr, description, char and code',
          'Ctrl+A…Ctrl+Z shortcuts plus ESC, Tab, LF, CR, space and DEL quick chips',
          'Space shown as the visible ␠ glyph; click any row or chip to copy',
        ],
        howToUse: [
          'Type a character (e.g. A or a space) or a code (65, 0x41, 41h) in the top lookup box',
          'Switch category buttons or search by abbreviation, description, character or code above the table',
          'Click a table row to copy its full info, or click a shortcut chip in the quick-reference area',
        ],
        useCases: [
          'Debug control characters in serial or network protocols (LF, CR, ESC, DEL)',
          'Terminal and embedded work: look up the 0x01–0x1A codes behind Ctrl+letter combos',
          'Learn character encodings by comparing letters, digits and punctuation across Dec/Hex/Oct/Bin',
        ],
        privacyNote:
          'The table is built-in public standard data; all lookup and copying happen locally in your browser with no network requests.',
        faqs: [
          {
            question: 'Why does it stop at 127? What about extended ASCII (128–255)?',
            answer:
              'US-ASCII defines only codes 0–127 with the top bit clear. Codes 128–255 depend on the specific code page (Windows-1252, ISO-8859-1, etc.) and have no single universal meaning, so the tool covers unambiguous US-ASCII and warns on out-of-range input.',
          },
          {
            question: 'Why is Ctrl+M a carriage return?',
            answer:
              'In a terminal, Ctrl plus a letter masks the letter code with 0x1F, equivalent to subtracting 64 from the uppercase code. Uppercase M is 77, minus 64 gives 13 (CR); likewise Ctrl+J is 10 (LF) and Ctrl+[ is 27 (ESC).',
          },
          {
            question: 'Why is space displayed as ␠?',
            answer:
              'Space (code 32) is a printable but invisible character, indistinguishable from blank space in a table, so it is shown with the visible ␠ (SP) glyph. Copy and lookup still use the real space character.',
          },
        ],
      },
    },
  },
  {
    slug: 'base62-codec',
    name: 'Base62 编解码（整数 / 字节双模式）',
    nameEn: 'Base62 Encoder & Decoder (Integer / Byte Modes)',
    description:
      '在非负整数、UTF-8 文本与 Base62（0-9、A-Z、a-z 共 62 字符）之间双向编解码，支持 GMP（0-9A-Za-z）与替代（0-9a-zA-Z）两种字母表；整数模式按 62 进制处理任意大整数，字节模式保留前导零字节，非法字符给出具体位置。',
    descriptionEn:
      'Encode and decode non-negative integers and UTF-8 text with Base62 (0-9, A-Z, a-z), supporting both the GMP (0-9A-Za-z) and alternate (0-9a-zA-Z) alphabets. Integer mode handles arbitrarily large numbers in base 62; byte mode preserves leading zero bytes, and illegal characters are reported with their exact position.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/base62-codec',
    iconName: 'Binary',
    tags: ['Base62', '短链', '短ID', 'URL-safe', '大整数', '编解码'],
    tagsEn: ['Base62', 'Short Link', 'Short ID', 'URL-safe', 'BigInt', 'Codec'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的 Base62 编解码工具。Base62 使用数字 0-9、大写 A-Z、小写 a-z 共 62 个字符，没有 +、/ 等符号与填充符，可直接放进 URL、域名路径或数据库短 ID，是短链 token、分享码最常见的编码方式。工具区分两种语义：整数模式把非负大整数按 62 进制表示；字节模式把任意字节（含 UTF-8 文本）换算为 Base62，并保留前导零字节，保证往返一致。',
        coreFeatures: [
          '双模式：非负整数 ↔ Base62（支持十进制与 0x 十六进制输入）、UTF-8 文本 / 字节 ↔ Base62',
          '两种字母表：GMP 风格 0-9A-Za-z 与替代风格 0-9a-zA-Z，一键切换',
          '任意精度：基于 BigInt，可处理远超 Number 安全范围的大整数',
          '前导零保留：字节模式参照 Base58 做法，前导零字节不丢失',
          '严格校验：字母表外字符报出具体位置；非 UTF-8 解码结果同时显示原始十六进制',
          '纯本地运行：全部为确定性运算，不发起网络请求、零新增依赖',
        ],
        howToUse: [
          '选择模式：整数互转使用「整数模式」，文本或二进制数据使用「字节 / 文本模式」',
          '需要与 PHP gmp_strval、多数短链库对齐时保持 GMP 字母表；对接 0-9a-zA-Z 体系（部分短链 / Nano ID 风格）时切换替代字母表',
          '在输入框粘贴整数或文本并选择编码方向，结果区实时输出；解码方向可直接粘贴 Base62 字符串',
          '整数解码结果同时给出十进制与 0x 十六进制表示，便于协议调试',
        ],
        useCases: [
          '短链 / 邀请码开发：在数据库自增 ID、雪花 ID 与短码之间互转',
          '接口调试：核对 Base62 短 ID 对应的原始整数，或验证字母表顺序差异',
          '数据表示：把任意字节或 UTF-8 文本编码为 URL-safe、无需转义的可打印字符串',
        ],
        privacyNote:
          '所有编解码均在浏览器本地通过 BigInt 完成，输入的整数、文本与 token 不会被上传或记录。',
        faqs: [
          {
            question: 'GMP 字母表和替代字母表有什么区别？',
            answer:
              '两者字符集完全相同，只是大小写排列不同：GMP 风格为 0-9A-Za-z（数字后大写在前），替代风格为 0-9a-zA-Z（小写在前）。同一个数字在两种表下编码结果可能不同，例如数字 10 分别是 A 和 a，对接第三方系统时必须确认对方使用的顺序。',
          },
          {
            question: '整数模式和字节模式有什么不同？',
            answer:
              '整数模式把输入视为一个非负大整数，按 62 进制直接表示，0 编码为 "0"，适合短 ID、序号；字节模式先把数据视为字节串再整体换算，并显式保留前导零字节（类似 Base58），适合任意二进制与 UTF-8 文本的可逆编码。对字符串内容做编解码时应使用字节模式。',
          },
          {
            question: '为什么解码出来不是正常文本？',
            answer:
              'Base62 承载的可能是哈希、压缩数据等任意字节而非 UTF-8 文本。工具在报错的同时会给出解码字节的十六进制表示；若预期是数字，请切换到整数模式查看十进制结果。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-local Base62 codec. Base62 uses the 62 characters 0-9, A-Z, and a-z with no +, /, or padding, so encoded data can be placed directly in URLs, paths, or database short IDs — the standard choice for short-link tokens and share codes. Two semantics are supported: integer mode represents non-negative big integers in base 62, while byte mode converts arbitrary bytes (including UTF-8 text) to Base62 while preserving leading zero bytes for exact round trips.',
        coreFeatures: [
          'Two modes: non-negative integer <-> Base62 (decimal or 0x hex input) and UTF-8 text / bytes <-> Base62',
          'Two alphabets: GMP style 0-9A-Za-z and alternate 0-9a-zA-Z, switchable with one click',
          'Arbitrary precision: built on BigInt, far beyond the Number safe-integer range',
          'Leading-zero preservation: byte mode follows the Base58 approach, no zero bytes lost',
          'Strict validation: out-of-alphabet characters report their exact position; non-UTF-8 output also shows raw hex',
          '100% local: deterministic computation with no network requests and no new dependencies',
        ],
        howToUse: [
          'Pick a mode: use Integer Mode for integer conversion and Byte / Text Mode for text or binary data',
          'Keep the GMP alphabet for PHP gmp_strval and most short-link libraries; switch to the alternate alphabet for 0-9a-zA-Z schemes (some short-link and Nano ID style systems)',
          'Paste an integer or text, choose the direction, and read the live result; paste Base62 directly in decode direction',
          'Integer decode shows both decimal and 0x hexadecimal forms for protocol debugging',
        ],
        useCases: [
          'Short-link / invite-code development: convert auto-increment or snowflake IDs to short codes and back',
          'API debugging: map a Base62 short ID back to its source integer or spot alphabet-order mismatches',
          'Data representation: encode arbitrary bytes or UTF-8 text as URL-safe printable strings without escaping',
        ],
        privacyNote:
          'All encoding and decoding runs locally in your browser via BigInt. Integers, text, and tokens you enter are never uploaded or logged.',
        faqs: [
          {
            question: 'What is the difference between the GMP and alternate alphabets?',
            answer:
              'Both contain the same 62 characters but in a different order: GMP is 0-9A-Za-z (uppercase first) and the alternate is 0-9a-zA-Z (lowercase first). The same number can encode differently, e.g. 10 is A versus a. Always confirm which order a third-party system expects.',
          },
          {
            question: 'How do integer mode and byte mode differ?',
            answer:
              'Integer mode treats the input as one non-negative big integer represented directly in base 62 (0 encodes as "0"), which suits short IDs and sequences. Byte mode treats the input as a byte stream and preserves leading zero bytes (like Base58), suiting arbitrary binary and UTF-8 text with a reversible round trip. Use byte mode when encoding string content.',
          },
          {
            question: 'Why does decoding not produce readable text?',
            answer:
              'Base62 may carry arbitrary bytes such as hashes or compressed data rather than UTF-8 text. The tool shows the decoded bytes in hexadecimal alongside the error; if you expected a number, switch to integer mode to see the decimal value.',
          },
        ],
      },
    },
  },
  {
    slug: 'varint-codec',
    name: 'VarInt / ZigZag / LEB128 编解码（逐字节可视化）',
    nameEn: 'VarInt / ZigZag / LEB128 Codec with Byte Breakdown',
    description:
      '在整数与 Protocol Buffers Base-128 VarInt 字节之间双向转换，支持无符号 VarInt / ULEB128、sint32 / sint64 的 ZigZag 映射与有符号 LEB128；逐字节展示续位标记与 7 位载荷分组，严格识别截断、非规范冗余编码与超范围输入。',
    descriptionEn:
      'Convert integers to and from Protocol Buffers Base-128 VarInt bytes, supporting unsigned VarInt / ULEB128, ZigZag-encoded sint32 / sint64, and signed LEB128. Every byte is visualized with its continuation bit and 7-bit payload group, while truncated, non-canonical (overlong), and out-of-range encodings are strictly rejected.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/varint-codec',
    iconName: 'Sigma',
    tags: ['VarInt', 'ZigZag', 'LEB128', 'Protobuf', 'Protocol Buffers', '编解码'],
    tagsEn: ['VarInt', 'ZigZag', 'LEB128', 'Protobuf', 'Protocol Buffers', 'Codec'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的变长整数编解码工具。VarInt（Base-128）把整数编码为若干字节：每字节低 7 位承载数据、最高位（MSB）是续位标记，小整数只需 1 字节，是 Protocol Buffers、SQLite、LEB128（DWARF / WebAssembly）等格式的共同基础。本工具同时覆盖有符号整数的两种主流方案：Protobuf sint32 / sint64 使用的 ZigZag 映射，以及 DWARF / WASM 使用的有符号 LEB128，并把每个字节的续位与载荷逐位拆开可视化。',
        coreFeatures: [
          '四种类型：无符号 VarInt / ULEB128、ZigZag sint32、ZigZag sint64、有符号 LEB128',
          '双向转换：整数（十进制或 0x 十六进制、支持负数）↔ 十六进制字节（支持 0x、空格、逗号分隔）',
          '逐字节可视化：表格展示十六进制、二进制、续位 MSB 与 7 位载荷分组',
          '边界完整：基于 BigInt 精确处理 int32 / int64 / uint64 上下限',
          '严格校验：截断输入、非规范（冗余）编码、第 10 字节越界等均给出明确错误',
          '纯本地运行：全部为确定性位运算，不发起网络请求、零新增依赖',
        ],
        howToUse: [
          '先选择编码类型：无符号场景选「无符号 VarInt / ULEB128」；Protobuf sint32 / sint64 选对应 ZigZag；调试 DWARF / WASM 选「有符号 LEB128」',
          '编码方向输入整数（如 300、-1、0x12C），实时得到字节，例如 300 → AC 02',
          '解码方向粘贴十六进制字节（如 AC 02），实时得到整数；ZigZag 下 -1 → 01、2147483647 → FE FF FF FF 0F',
          '查看「逐字节拆解」表格：橙色 1 表示后续有字节，绿色 0 表示末字节，可核对 7 位分组拼接过程',
        ],
        useCases: [
          'Protobuf 协议调试：手工核对字段后的 VarInt 数字、sint32 / sint64 的 ZigZag 编码',
          '二进制格式研究：解析 SQLite record format、自定义 TLV、多码点编码中的变长整数',
          '编译器 / WASM 学习：理解 DWARF 调试信息与 WebAssembly 中的有符号 LEB128',
        ],
        privacyNote:
          '所有编解码均在浏览器本地通过 BigInt 位运算完成，输入的整数与字节不会被上传或记录。',
        faqs: [
          {
            question: '为什么 300 编码后是 AC 02 两个字节？',
            answer:
              '300 的二进制是 100101100，按每 7 位分组（从低位起）为 0101100 与 10：低 7 位 0x2C 加上续位 1 得到 0xAC，高 2 位 0x02 作为末字节，即 AC 02。解码时拼接顺序为 0x2C | (0x02 << 7) = 300。',
          },
          {
            question: 'ZigZag 和有符号 LEB128 有什么区别？',
            answer:
              '两者都编码有符号整数但布局不同：ZigZag（Protobuf sint32 / sint64）先把 n 映射为 (n<<1)^(n>>31/63)，使 -1 → 1、1 → 2，小绝对值的负数只需很少字节；有符号 LEB128（DWARF / WASM）直接编码补码位流，符号位固定在每字节的第 6 位（0x40），-1 单字节即 0x7F。对接 Protobuf 字段应选 ZigZag，解析 DWARF / WASM 应选有符号 LEB128。',
          },
          {
            question: '什么是「非规范（冗余）编码」？',
            answer:
              '同一数值存在更短的合法表示时，较长的序列即为非规范编码，例如 0 本应编码为 00，80 00 也能解出 0 但多了一个冗余字节。严格解析器（包括本工具）会拒绝这类编码，以避免绕过长度 / 等值校验的歧义；合法的 int64 边界（I64_MIN / I64_MAX 恰需 10 字节）不受影响。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-local variable-length integer codec. VarInt (Base-128) encodes an integer into bytes where each byte carries 7 payload bits and uses its most significant bit (MSB) as a continuation flag, so small integers need only one byte. It is the common basis of Protocol Buffers, SQLite, and LEB128 (DWARF / WebAssembly). The tool covers both mainstream signed-integer schemes: ZigZag mapping for Protobuf sint32 / sint64, and signed LEB128 for DWARF / WASM, with a bit-by-bit visualization of continuation flags and payload groups.',
        coreFeatures: [
          'Four types: unsigned VarInt / ULEB128, ZigZag sint32, ZigZag sint64, and signed LEB128',
          'Bidirectional: integers (decimal or 0x hex, negatives supported) <-> hex bytes (0x, spaces, and commas accepted)',
          'Byte-level visualization: a table shows hex, binary, continuation MSB, and the 7-bit payload group of every byte',
          'Full boundary support: BigInt precisely handles int32 / int64 / uint64 limits',
          'Strict validation: truncated input, non-canonical (overlong) encodings, and illegal 10th bytes produce clear errors',
          '100% local: deterministic bit operations with no network requests and no new dependencies',
        ],
        howToUse: [
          'Pick the type first: unsigned VarInt / ULEB128 for unsigned data, ZigZag sint32 / sint64 for Protobuf signed fields, and signed LEB128 for DWARF / WASM',
          'In encode direction, enter an integer (e.g. 300, -1, 0x12C) to get bytes instantly, e.g. 300 -> AC 02',
          'In decode direction, paste hex bytes (e.g. AC 02); with ZigZag, -1 -> 01 and 2147483647 -> FE FF FF FF 0F',
          'Inspect the byte breakdown table: orange 1 means more bytes follow, green 0 marks the final byte, and the 7-bit groups show how the value is assembled',
        ],
        useCases: [
          'Protobuf debugging: manually verify VarInt numbers after field tags and ZigZag encoding of sint32 / sint64 values',
          'Binary format research: parse variable-length integers in SQLite records, custom TLV schemes, and other encodings',
          'Compiler / WASM learning: understand signed LEB128 in DWARF debug info and WebAssembly',
        ],
        privacyNote:
          'All encoding and decoding runs locally in your browser via BigInt bit operations. Integers and bytes you enter are never uploaded or logged.',
        faqs: [
          {
            question: 'Why does 300 encode to the two bytes AC 02?',
            answer:
              '300 in binary is 100101100, split into 7-bit groups from the low end: 0101100 and 10. The low group 0x2C gets a continuation bit, yielding 0xAC, and the high group 0x02 is the final byte, giving AC 02. Decoding assembles 0x2C | (0x02 << 7) = 300.',
          },
          {
            question: 'What is the difference between ZigZag and signed LEB128?',
            answer:
              'Both encode signed integers but with different layouts. ZigZag (Protobuf sint32 / sint64) first maps n to (n<<1)^(n>>31/63), so -1 -> 1 and 1 -> 2, keeping small-magnitude negatives short. Signed LEB128 (DWARF / WASM) encodes the two\'s-complement bit stream directly, with the sign bit fixed at bit 6 (0x40) of each byte; -1 is the single byte 0x7F. Choose ZigZag for Protobuf fields and signed LEB128 for DWARF / WASM.',
          },
          {
            question: 'What is a "non-canonical (overlong) encoding"?',
            answer:
              'When a value has a shorter legal representation, a longer sequence is non-canonical: 0 should be 00, while 80 00 also decodes to 0 with a redundant byte. Strict parsers, including this tool, reject such encodings to avoid ambiguity in length or equality checks. Legitimate int64 boundary values (I64_MIN / I64_MAX, which genuinely need 10 bytes) are still accepted.',
          },
        ],
      },
    },
  },
  {
    slug: 'http-status-codes',
    name: 'HTTP 状态码速查',
    nameEn: 'HTTP Status Codes Reference',
    description:
      '按 1xx–5xx 分类速查 IANA 常见 HTTP 状态码（100–511）的中文含义、英文 Reason-Phrase、典型触发场景、排错建议与是否可重试；支持编号前缀（404、4）与中英文关键词（not found、重定向、网关）实时检索，点击条目展开详情。',
    descriptionEn:
      'Look up common IANA HTTP status codes (100–511) grouped by 1xx–5xx, with Chinese meaning, English reason phrase, typical triggers, troubleshooting tips, and retry guidance. Search live by code prefix (404, 4) or Chinese/English keywords (not found, redirect, gateway); click an entry to expand details.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/http-status-codes',
    iconName: 'FileText',
    tags: ['HTTP', '状态码', '协议', '联调', '重定向', '排错'],
    tagsEn: ['HTTP', 'Status Codes', 'Protocol', 'Redirect', 'Debugging'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的 HTTP 状态码参考速查工具，内置 IANA 注册的常见标准状态码（100–511）静态数据表，覆盖 1xx 信息、2xx 成功、3xx 重定向、4xx 客户端错误、5xx 服务器错误五个分段。每个条目提供英文 Reason-Phrase、中文含义、典型触发场景、排错建议以及是否可以安全重试，便于前后端联调与线上排障时快速定位语义。',
        coreFeatures: [
          '覆盖 100–511 常见标准状态码，含 418 彩蛋码与 306 保留码等特殊条目',
          '编号检索：纯数字按前缀匹配（404 精确、4 列出全部 4xx、40 列出 400/401/408 等）',
          '关键词检索：中英文名称、典型场景与排错建议全文模糊匹配（not found、重定向、网关、限流）',
          '分类筛选：一键切换 1xx / 2xx / 3xx / 4xx / 5xx，并按分段分组展示',
          '展开详情：点击条目查看典型触发场景、排错建议与重试建议标签',
          '纯本地运行：静态数据 + 纯函数检索，无网络请求、零新增依赖',
        ],
        howToUse: [
          '在搜索框输入三位编号（如 404）精确定位，或只输首位数字（如 5）浏览整段',
          '也可输入中英文关键词，如 not found、重定向、网关、限流、超时',
          '使用顶部按钮按 1xx–5xx 分段过滤，结果自动分组并显示每组数量',
          '点击任意条目展开，查看典型场景、排错建议与「可安全重试 / 不应直接重试」标签',
        ],
        useCases: [
          '前后端联调：遇到陌生状态码（如 409、412、421）快速确认语义与处理方式',
          '线上排障：根据 502 / 503 / 504 区分上游崩溃、服务不可用与网关超时',
          '接口设计：为新建 REST API 选择语义正确的状态码与重试策略',
        ],
        privacyNote:
          '状态码数据内置在工具中，检索逻辑全部在浏览器本地完成，不发起任何网络请求，也不会记录输入内容。',
        faqs: [
          {
            question: '401 和 403 有什么区别？',
            answer:
              '401 Unauthorized 语义是“未认证”：缺少或携带了无效的登录凭证（Token 缺失 / 过期），补充有效凭证后可能成功；403 Forbidden 是“已认证但禁止访问”：服务器理解请求但拒绝授权，重新登录通常无效，需要调整账号权限或资源访问策略。',
          },
          {
            question: '301、302、307、308 如何选择？',
            answer:
              '按“是否永久”与“是否保持请求方法”两个维度区分：301 永久、302 临时，但历史实现可能把 POST 改写为 GET；308 是方法安全的永久重定向，307 是方法安全的临时重定向，两者明确要求保持原方法与请求体。新系统需要语义严格时优先使用 307 / 308。',
          },
          {
            question: '哪些 5xx 可以安全重试？',
            answer:
              '502 Bad Gateway、503 Service Unavailable、504 Gateway Timeout 通常代表临时性故障，可结合 Retry-After 头做指数退避重试；500 Internal Server Error 原因未知，仅对幂等请求重试，非幂等请求应先确认服务端状态；501 表示功能未实现，重试无意义。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-local reference for common IANA-registered HTTP status codes (100–511), covering all five classes: 1xx informational, 2xx success, 3xx redirection, 4xx client errors, and 5xx server errors. Every entry provides the English reason phrase, a Chinese explanation, typical trigger scenarios, troubleshooting tips, and safe-retry guidance, making API integration and incident triage faster.',
        coreFeatures: [
          'Covers common standard codes from 100 to 511, including special entries such as 418 and the reserved 306',
          'Code search: digits match by prefix (404 exact, 4 lists all 4xx, 40 lists 400/401/408 and more)',
          'Keyword search: fuzzy matching across Chinese/English names, scenarios, and tips (not found, redirect, gateway, rate limit)',
          'Class filter: switch between 1xx / 2xx / 3xx / 4xx / 5xx with grouped results',
          'Expandable entries: click to see typical scenarios, troubleshooting tips, and a retry-guidance tag',
          '100% local: static data plus pure-function search with no network requests and no new dependencies',
        ],
        howToUse: [
          'Type a three-digit code (e.g. 404) for an exact match, or just the first digit (e.g. 5) to browse a class',
          'Or enter Chinese/English keywords such as not found, redirect, gateway, or rate limit',
          'Use the top buttons to filter by 1xx–5xx; results are grouped with per-group counts',
          'Click any entry to expand typical scenarios, troubleshooting advice, and the retry tag',
        ],
        useCases: [
          'API integration: quickly confirm the meaning of less common codes like 409, 412, or 421',
          'Incident triage: distinguish upstream crash (502), unavailable service (503), and gateway timeout (504)',
          'API design: choose semantically correct status codes and retry policies for new REST endpoints',
        ],
        privacyNote:
          'The status-code dataset is bundled with the tool and all search logic runs locally in your browser; no network requests are made and your input is never logged.',
        faqs: [
          {
            question: 'What is the difference between 401 and 403?',
            answer:
              '401 Unauthorized actually means "unauthenticated": credentials are missing or invalid (token absent or expired), so supplying valid credentials may succeed. 403 Forbidden means the server understands the request but refuses it for an authenticated identity; logging in again usually does not help—permissions or resource policy must change.',
          },
          {
            question: 'How do I choose between 301, 302, 307, and 308?',
            answer:
              'Use two dimensions—permanent vs temporary and method-preserving vs not. 301 is permanent and 302 temporary, but historical implementations may rewrite POST to GET. 308 is the method-safe permanent redirect and 307 the method-safe temporary one; both explicitly require preserving the original method and body. Prefer 307 / 308 when strict semantics matter.',
          },
          {
            question: 'Which 5xx errors are safe to retry?',
            answer:
              '502 Bad Gateway, 503 Service Unavailable, and 504 Gateway Timeout usually indicate transient failures and can be retried with exponential backoff, honoring Retry-After. 500 has an unknown cause—retry only idempotent requests and verify server state for non-idempotent ones. 501 means the feature is not implemented, so retrying is pointless.',
          },
        ],
      },
    },
  },
  {
    slug: 'rgb-cmyk-converter',
    name: 'RGB / CMYK 色彩转换器',
    nameEn: 'RGB / CMYK Color Converter',
    description:
      '在屏幕色 RGB / HEX 与印刷四色 CMYK 之间双向实时换算，并同步输出 HSL 与大色块预览。拖动 RGB 滑块、输入 HEX（支持 #RGB 简写与原生取色器）或调整 CMYK 四通道百分比，任一改动立即联动；非法 HEX 或越界百分比即时报错，纯浏览器本地计算，适合印刷校色与跨媒介配色。',
    descriptionEn:
      'Convert between screen colors (RGB / HEX) and process colors (CMYK) in real time, with synchronized HSL values and a large color swatch preview. Drag RGB sliders, type a HEX code (#RGB shorthand and a native color picker supported), or adjust the four CMYK percentage channels—every change updates all outputs instantly. Invalid HEX or out-of-range percentages are flagged immediately. Everything runs locally in the browser for print color checking and cross-media design.',
    category: ToolCategoryEnum.DESIGN_COLOR,
    path: '/tools/rgb-cmyk-converter',
    iconName: 'Pipette',
    tags: ['CMYK', 'RGB', '印刷', '色彩转换', '校色', 'HEX'],
    tagsEn: ['CMYK', 'RGB', 'Print', 'Color Conversion', 'HEX'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的色彩空间转换工具，打通屏幕发光的加色模型 RGB（含 HEX / HSL 表示）与印刷反光的减色模型 CMYK。采用标准 black-generation 公式（K = 1 − max(R,G,B)，纯黑时 C/M/Y 归零；反向 R = 255·(1−C)·(1−K)），左侧调整 RGB 滑块或 HEX，右侧 CMYK 四通道百分比立即更新，反之亦然，底部色块与 HEX / RGB / CMYK / HSL 文本同步输出。',
        coreFeatures: [
          'RGB ↔ CMYK 双向实时换算，任一通道改动立即联动全部输出',
          'HEX 输入支持 6 位与 3 位简写、可省略 #，并提供浏览器原生取色器',
          '同步输出 HSL（色相 / 饱和度 / 亮度）与大尺寸色块预览',
          'RGB 滑块 + 数字输入（0–255），CMYK 滑块步进 0.1%（0–100）',
          '非法 HEX、越界百分比即时红字报错，不产生错误结果',
          '纯本地计算：换算逻辑为纯函数，无网络请求、零新增依赖',
        ],
        howToUse: [
          '在「屏幕色」卡片拖动 R / G / B 滑块或直接输入数字，也可在 HEX 框输入如 #3B82F6 或 3b8，或点击取色器选色',
          '在「印刷四色」卡片拖动 C / M / Y / K 滑块（单位 %），屏幕色与预览同步更新',
          '在底部预览卡片查看色块以及 HEX、RGB、CMYK、HSL 四组数值，直接抄用',
          '若 HEX 格式非法或数值越界，对应卡片会出现红色提示，修正后结果立即恢复',
        ],
        useCases: [
          '平面设计：把屏幕选定的品牌色换算为印刷 CMYK 四色数值，交付印厂',
          '跨媒介配色：核对 UI 用色在印刷物料上的大致呈现，提前规避高饱和色偏差',
          '前端联调：与设计师沟通时在 HEX / RGB / CMYK / HSL 之间快速互查',
        ],
        privacyNote:
          '所有色彩换算均在浏览器本地由纯函数完成，不发起任何网络请求，输入的颜色值不会离开设备。',
        faqs: [
          {
            question: '为什么 CMYK 转回 RGB 再回 CMYK，数值会有少量偏差？',
            answer:
              'CMYK 是为印刷定义的减色模型，没有唯一的 RGB 对应；反向换算时黑版 K 由 RGB 最大通道派生，经过 8 位（0–255）通道取整后，黑场可能出现几个百分点的固有漂移。屏幕色方向的严格往返 RGB → CMYK → RGB 保证每通道误差不超过 2，不影响实际选色。',
          },
          {
            question: '换算出的 CMYK 可以直接用于印刷吗？',
            answer:
              '本工具使用标准理论公式，适合沟通、预估与轻量物料。正式印刷还受纸张、油墨、ICC 配置文件与印刷标准（如 Japan Color、FOGRA）影响，关键印品应以印厂的色彩管理流程与打样为准。',
          },
          {
            question: '为什么同一个颜色看起来屏幕比印刷品更鲜艳？',
            answer:
              'RGB 是发光加色模型，色域通常大于印刷用的 CMYK 减色模型，高饱和的蓝、绿等颜色往往超出 CMYK 可复制范围，落到纸面后会变暗或偏色。预览卡给出的色块是屏幕显示值，印刷呈现需以打样为准。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-local color-space converter connecting the additive screen model RGB (with HEX / HSL notations) and the subtractive print model CMYK. It uses the standard black-generation formula (K = 1 − max(R,G,B), with C/M/Y forced to zero for pure black; inverse R = 255·(1−C)·(1−K)). Adjust RGB sliders or a HEX code on the left and the four CMYK percentage channels update instantly on the right, and vice versa, while a swatch plus HEX / RGB / CMYK / HSL text stays in sync at the bottom.',
        coreFeatures: [
          'Bidirectional RGB ↔ CMYK conversion; changing any channel updates every output instantly',
          'HEX input accepts 6-digit and 3-digit shorthand with or without #, plus a native color picker',
          'Synchronized HSL (hue / saturation / lightness) output with a large color swatch',
          'RGB sliders with numeric inputs (0–255); CMYK sliders in 0.1% steps (0–100)',
          'Invalid HEX or out-of-range percentages trigger immediate inline errors instead of wrong results',
          '100% local: conversion logic is pure functions with no network requests and no new dependencies',
        ],
        howToUse: [
          'In the Screen Color card, drag the R / G / B sliders or type numbers; you can also enter a HEX value like #3B82F6 or 3b8, or use the color picker',
          'In the Process Color card, drag the C / M / Y / K sliders (%)—screen color and preview update together',
          'Read the swatch and the four value groups (HEX, RGB, CMYK, HSL) from the preview card at the bottom',
          'If a HEX value is malformed or a number is out of range, a red message appears on the relevant card and results resume as soon as you fix it',
        ],
        useCases: [
          'Graphic design: convert a brand color chosen on screen into CMYK values for the print shop',
          'Cross-media work: estimate how a UI color will appear in print and anticipate gamut clipping',
          'Front-end collaboration: quickly cross-check HEX / RGB / CMYK / HSL when talking with designers',
        ],
        privacyNote:
          'All color math runs locally in your browser via pure functions. No network requests are made and the colors you enter never leave your device.',
        faqs: [
          {
            question: 'Why does CMYK → RGB → CMYK come back slightly different?',
            answer:
              'CMYK is a subtractive model for print with no unique RGB counterpart. On the way back, the black channel K is derived from the largest RGB channel, and after 8-bit (0–255) rounding the black generation can drift by a few percentage points—an inherent artifact. The strict screen-side round trip RGB → CMYK → RGB stays within 2 units per channel, which is imperceptible for color picking.',
          },
          {
            question: 'Can the converted CMYK values go straight to print?',
            answer:
              'The tool applies standard theoretical formulas suitable for discussion, estimation, and lightweight materials. Production printing also depends on paper, ink, ICC profiles, and print standards such as Japan Color or FOGRA. For critical jobs, follow the print shop’s color-management workflow and rely on hard proofs.',
          },
          {
            question: 'Why does the same color look more vivid on screen than in print?',
            answer:
              'RGB is an emissive additive model whose gamut is typically wider than print’s subtractive CMYK gamut; highly saturated blues and greens often exceed what CMYK can reproduce, so they darken or shift on paper. The preview swatch shows the screen-rendered value—judge the printed result from a proof.',
          },
        ],
      },
    },
  },
  {
    slug: 'env-converter',
    name: '.env 配置格式转换器',
    nameEn: '.env Config Converter',
    description:
      '解析 .env 配置并在 dotenv、JSON、扁平 YAML 与 shell export 四种格式间实时互转。支持单/双引号与无引号值、双引号转义（\\n、\\t、\\"、\\\\）、# 注释、export 前缀与值内含 =；非法键名、未闭合引号等错误带行号提示，重复键产生警告并以后值为准。纯浏览器本地运行，适合环境变量整理与跨部署格式迁移。',
    descriptionEn:
      'Parse .env configuration and convert live between dotenv, JSON, flat YAML, and shell export formats. Supports single/double-quoted and unquoted values, double-quote escapes (\\n, \\t, \\", \\\\), # comments, the export prefix, and equals signs inside values. Invalid key names and unclosed quotes are reported with line numbers; duplicate keys produce a warning and the later value wins. Runs entirely in the browser for tidying environment variables and migrating between deployment formats.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/env-converter',
    iconName: 'FileCode',
    tags: ['env', '环境变量', 'dotenv', 'JSON', 'YAML', '配置迁移'],
    tagsEn: ['env', 'Environment Variables', 'dotenv', 'JSON', 'YAML', 'Config'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的环境变量配置解析与格式转换工具。逐行解析 KEY=VALUE 文本，忽略空行与 # 注释，识别可选的 export 前缀，正确处理单引号、双引号（含 \\n、\\t、\\"、\\\\ 转义）与无引号值（含行内注释剥离），并可在 dotenv、JSON、扁平 YAML、shell export 四种格式之间双向互转。非法键名、缺少等号、未闭合引号、嵌套结构等错误带行号提示，重复键给出警告且以后值为准，解析与序列化全部由零依赖纯函数完成。',
        coreFeatures: [
          '四格式互转：.env（dotenv）、JSON、扁平 YAML、shell export 语句',
          '完整解析：空行 / 注释 / export 前缀 / 单双引号 / 双引号转义 / 值内含 =',
          '错误定位：非法键名、缺少分隔符、未闭合引号等错误精确到行号，不抛异常',
          '重复键检测：给出带行号的警告，以后值为准',
          '一键交换输入/输出格式，转换结果可直接复制',
          '纯本地计算：零新增依赖，输入内容不上传',
        ],
        howToUse: [
          '在左侧卡片顶部选择源格式（.env / JSON / YAML / export），粘贴或编辑配置文本',
          '在右侧卡片顶部选择目标格式，结果实时生成；有错时显示带行号的红色提示',
          '出现黄色警告表示存在重复键等可继续的问题，结果仍会生成（以后值为准）',
          '点击「交换输入 / 输出格式」可把当前结果作为新输入，快速做下一段转换',
          '点击「复制」把转换结果复制到剪贴板',
        ],
        useCases: [
          '部署迁移：把 .env 转成容器平台或 CI 系统需要的 JSON / YAML 键值结构',
          '配置整理：检查历史 .env 中的重复键、非法键名与引号错误',
          '脚本协作：在 dotenv 与 shell export 语句之间互转，便于本地 source 或导出',
        ],
        privacyNote:
          '配置解析与转换全部在浏览器本地由纯函数完成，不发起任何网络请求；粘贴的密钥、Token 等敏感内容不会离开设备。',
        faqs: [
          {
            question: '支持嵌套 JSON 或 YAML 吗？',
            answer:
              '不支持。环境变量本质是扁平的 KEY=VALUE 集合，本工具只接受扁平对象与每行一个的 key: value；遇到嵌套对象、数组或缩进行会明确报错提示，避免把层级结构错误拍平。',
          },
          {
            question: '重复键如何处理？',
            answer:
              '重复键不会导致转换失败，而是产生一条带行号的黄色警告，并按 dotenv 常见约定以后出现的值覆盖先出现的值；输出中每个键只保留一个最终值。',
          },
          {
            question: '单引号和双引号有什么区别？',
            answer:
              '双引号内会处理 \\n、\\t、\\"、\\\\ 等转义序列；单引号内的内容原样保留，不做转义，适合存放包含特殊字符的密钥或正则。无引号值会在「空白 + #」处截断行内注释。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A fully browser-local parser and format converter for environment-variable configuration. It parses KEY=VALUE text line by line, skips blank lines and # comments, recognizes an optional export prefix, and handles single-quoted, double-quoted (with \\n, \\t, \\", \\\\ escapes), and unquoted values (including inline-comment stripping). Convert bidirectionally between dotenv, JSON, flat YAML, and shell export. Invalid key names, missing separators, unclosed quotes, and nested structures are reported with line numbers instead of throwing, while duplicate keys produce a warning and the later value wins. Parsing and serialization are zero-dependency pure functions.',
        coreFeatures: [
          'Four-way conversion: dotenv (.env), JSON, flat YAML, and shell export statements',
          'Complete parsing: blank lines, comments, export prefix, single/double quotes, escapes, and equals signs inside values',
          'Error location: invalid key names, missing separators, and unclosed quotes report exact line numbers without throwing',
          'Duplicate-key detection: line-numbered warnings with the later value winning',
          'One click to swap input/output formats, with copy-ready results',
          '100% local: no new dependencies and nothing uploaded',
        ],
        howToUse: [
          'Pick the source format on the left card (.env / JSON / YAML / export) and paste or edit the config',
          'Pick the target format on the right card; output appears live, or a red message with a line number shows the error',
          'A yellow warning means a recoverable issue such as a duplicate key—output is still generated using the later value',
          'Click “Swap input/output formats” to feed the current result back as input for chained conversions',
          'Click Copy to put the result on your clipboard',
        ],
        useCases: [
          'Deployment migration: turn a .env file into the JSON/YAML key-value structure required by container platforms or CI',
          'Config cleanup: detect duplicate keys, invalid names, and quote mistakes in legacy .env files',
          'Scripting: move between dotenv and shell export statements for local sourcing or export',
        ],
        privacyNote:
          'All parsing and conversion run locally in your browser via pure functions. No network requests are made, so secrets and tokens you paste never leave your device.',
        faqs: [
          {
            question: 'Are nested JSON or YAML structures supported?',
            answer:
              'No. Environment variables are inherently a flat KEY=VALUE set, so the tool accepts only flat objects and one key: value pair per line. Nested objects, arrays, or indented lines produce a clear error instead of silently flattening a hierarchy.',
          },
          {
            question: 'How are duplicate keys handled?',
            answer:
              'A duplicate key does not fail conversion. It produces a yellow warning with a line number, and—following common dotenv behavior—the later occurrence overrides the earlier one, so each key appears once in the output with its final value.',
          },
          {
            question: 'What is the difference between single and double quotes?',
            answer:
              'Inside double quotes, escape sequences such as \\n, \\t, \\", and \\\\ are interpreted. Inside single quotes, content is kept verbatim with no escaping—handy for secrets or regexes containing special characters. Unquoted values truncate an inline comment at whitespace followed by #.',
          },
        ],
      },
    },
  },
  {
    slug: 'punycode-converter',
    name: 'Punycode / IDN 域名转换器',
    nameEn: 'Punycode & IDN Domain Converter',
    description:
      '基于 RFC 3492 自实现的 Punycode（Bootstring）编解码器，把含中文、日文、Emoji 等非 ASCII 字符的域名在 Unicode 与 xn-- ACE ASCII 形式之间实时互转，例如「中文.中国」与「xn--fiq228c.xn--fiqs8s」。支持多标签域名、邮箱地址（仅转换 @ 后域名）、中文全角点、多行批量转换与裸 Bootstring 编解码；非法 xn-- 标签给出可读错误而不抛异常。纯浏览器本地运算、零新增依赖。',
    descriptionEn:
      'A from-scratch RFC 3492 Punycode (Bootstring) encoder/decoder that converts internationalized domain names containing Chinese, Japanese, emoji, and other non-ASCII characters between Unicode and the xn-- ASCII Compatible Encoding form—e.g. 中文.中国 ↔ xn--fiq228c.xn--fiqs8s. It supports multi-label domains, email addresses (converting only the domain after @), full-width dots, multi-line batch conversion, and raw Bootstring encoding. Malformed xn-- labels report readable errors instead of throwing. Everything runs locally in the browser with zero new dependencies.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/punycode-converter',
    iconName: 'Globe',
    tags: ['Punycode', 'IDN', '国际化域名', 'xn--', 'RFC 3492', '编码'],
    tagsEn: ['Punycode', 'IDN', 'Internationalized Domain', 'xn--', 'RFC 3492', 'Encoding'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'münchen.de\n中文.中国\n例え.jp\ninfo@bücher.example',
    doc: {
      zh: {
        whatIsIt:
          'Punycode / IDN 域名转换器是一款纯浏览器本地运行的国际化域名工具，依据 RFC 3492 Bootstring 算法从零实现编解码，在 Unicode 域名（如「münchen.de」「中文.中国」）与 DNS 实际使用的 ASCII ACE 形式（xn-- 前缀）之间双向转换。',
        coreFeatures: [
          'RFC 3492 官方向量验证：München、简繁中文、日文、西里尔字母及 Emoji 等代码点编解码正确',
          '域名模式：按点分标签逐个转换，非 ASCII 标签自动加 / 去 xn-- 前缀，纯 ASCII 标签原样保留',
          '支持邮箱地址：仅转换 @ 之后的域名部分，本地部分保持不变',
          '兼容中文全角点（。 ．）输入，输出统一为标准 ASCII 点；支持多行批量转换',
          '裸 Bootstring 模式：对整段任意文本做 Punycode 编解码，便于学习与调试算法',
          '错误友好：非法 xn-- 标签、截断的编码段等返回可读错误或带行号警告，不抛异常',
          '纯本地计算：零新增依赖，输入内容不发起任何网络请求',
        ],
        howToUse: [
          '在输入卡片顶部选择转换方向：Unicode → ASCII 或 ASCII → Unicode',
          '底部可切换「域名 / 邮箱」与「裸 Punycode」两种模式',
          '域名模式下每行一个域名或邮箱，右侧实时输出转换结果；支持一次粘贴多行批量处理',
          '个别行无法转换时该行原样保留并在输出区给出黄色行号警告，不影响其他行',
          '点击「交换输入 / 输出方向」可把结果回填并反向转换；点击「复制」获取结果',
        ],
        useCases: [
          '运维与开发：在 DNS 记录、证书日志、抓包数据中看到 xn-- 域名时还原为可读的本地语言域名',
          '国际化业务：把中文、日文、阿拉伯文等营销域名转换为可配置到 DNS / 服务器的 ASCII 形式',
          '学习调试：对照 RFC 3492 官方向量理解 Bootstring 的偏置自适应与变长整数编码',
        ],
        privacyNote:
          '全部编解码均在浏览器本地由零依赖纯函数完成，不发起任何网络请求；粘贴的域名与邮箱不会离开设备。',
        faqs: [
          {
            question: 'Punycode 与 URL 编码（百分号编码）是一回事吗？',
            answer:
              '不是。Punycode 是 RFC 3492 定义的 Bootstring 编码，专用于把国际化域名表示为 DNS 合法的 ASCII 标签（xn-- 前缀）；百分号编码用于 URL 的路径与查询串。本工具只处理域名标签与裸 Bootstring，不做 URL 百分号编解码。',
          },
          {
            question: '为什么「3-2」在裸 Punycode 模式下编码为「3-2-」？',
            answer:
              'Punycode 用连字符作为基本码点段与扩展编码段的分隔符；当输入全部是 ASCII 字符时，编码结果就是原字符串末尾追加一个分隔符，因此「3-2」编码为「3-2-」。在域名模式下纯 ASCII 标签不会加 xn-- 前缀，原样返回。',
          },
          {
            question: '为什么粘贴的 xn-- 域名报非法错误？',
            answer:
              'xn-- 之后的内容必须是合法的 Bootstring（只含 a-z0-9 且变长整数序列可完整解码）。截断、混入非法字符或解码出超过 Unicode 范围的代码点都会报错。请检查域名是否被复制截断或拼写错误。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Punycode & IDN Domain Converter is a fully browser-local tool that implements the RFC 3492 Bootstring algorithm from scratch, bidirectionally converting internationalized domain names (e.g. münchen.de, 中文.中国) between Unicode and the ASCII Compatible Encoding form (xn-- prefix) used by DNS.',
        coreFeatures: [
          'Validated against RFC 3492 official vectors: German, simplified/traditional Chinese, Japanese, Cyrillic, and emoji code points',
          'Domain mode: converts each dot-separated label, adding/stripping the xn-- prefix only for non-ASCII labels',
          'Email aware: converts only the domain after @ while leaving the local part untouched',
          'Accepts full-width dots (。 ．) and normalizes output to standard ASCII dots; supports multi-line batch conversion',
          'Raw Bootstring mode: Punycode-encodes/decodes arbitrary whole strings for learning and debugging',
          'Friendly errors: malformed xn-- labels and truncated encodings return readable messages or line-numbered warnings instead of throwing',
          '100% local computation with zero new dependencies and no network requests',
        ],
        howToUse: [
          'Pick the direction on the input card: Unicode → ASCII or ASCII → Unicode',
          'Switch between "Domain / Email" and "Raw Punycode" modes in the bottom toolbar',
          'In domain mode, put one domain or email per line; results appear live on the right, including batch pastes',
          'If a single line fails, it is kept verbatim and flagged with a yellow line-numbered warning without affecting other lines',
          'Click "Swap input/output direction" to feed the result back for a reverse conversion, or click Copy',
        ],
        useCases: [
          'DevOps: decode xn-- domains seen in DNS records, certificate logs, or packet captures into readable local-language names',
          'Global business: turn Chinese, Japanese, or Arabic marketing domains into ASCII form for DNS and server configuration',
          'Learning: compare against RFC 3492 vectors to understand bias adaptation and variable-length integer encoding',
        ],
        privacyNote:
          'All encoding and decoding run locally in your browser via zero-dependency pure functions. No network requests are made, so domains and emails you paste never leave your device.',
        faqs: [
          {
            question: 'Is Punycode the same as URL percent-encoding?',
            answer:
              'No. Punycode is the RFC 3492 Bootstring encoding designed specifically to represent internationalized domain names as DNS-legal ASCII labels (xn-- prefix), while percent-encoding applies to URL paths and query strings. This tool handles domain labels and raw Bootstring only.',
          },
          {
            question: 'Why does "3-2" encode as "3-2-" in raw Punycode mode?',
            answer:
              'Punycode uses a hyphen to separate the literal basic-code-point section from the extended encoding. When the input is all ASCII, the output is the original string with a trailing delimiter, so "3-2" becomes "3-2-". In domain mode an all-ASCII label gets no xn-- prefix and is returned unchanged.',
          },
          {
            question: 'Why does my pasted xn-- domain report an invalid error?',
            answer:
              'The part after xn-- must be valid Bootstring: only a-z0-9 characters with a fully decodable variable-length integer sequence. Truncation, illegal characters, or decoded code points beyond the Unicode range all raise an error. Check whether the domain was cut off during copying or misspelled.',
          },
        ],
      },
    },
  },
  {
    slug: 'hex-dump-viewer',
    name: 'Hex / Hex Dump 转换器',
    nameEn: 'Hex & Hex Dump Converter',
    description:
      '在文本与十六进制之间双向转换，按 UTF-8 编码生成或还原字节串：支持连续 Hex、空格 / 冒号分隔、0x 前缀以及大小写切换，并可输出经典十六进制转储（8 位偏移量 + 每行 16 字节分区 + ASCII 预览）。解码时自动容忍空白、换行、逗号、连字符与 0x 前缀，奇数位、非法字符或非法 UTF-8 序列给出可读错误。纯浏览器本地运算、零新增依赖。',
    descriptionEn:
      'Convert text to and from hexadecimal using UTF-8 encoding: continuous hex, space/colon separators, 0x prefixes, and upper/lower case are supported, along with a classic hex dump view (8-digit offset, 16 bytes per row in two groups, and an ASCII preview). Decoding tolerates whitespace, line breaks, commas, hyphens, and 0x prefixes, while odd digit counts, illegal characters, and invalid UTF-8 sequences produce readable errors. Everything runs locally in the browser with zero new dependencies.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/hex-dump-viewer',
    iconName: 'Hash',
    tags: ['Hex', '十六进制', 'Hex Dump', 'UTF-8', '字节', '编码'],
    tagsEn: ['Hex', 'Hexadecimal', 'Hex Dump', 'UTF-8', 'Bytes', 'Encoding'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'Hello, 世界!\nUTF-8 text → hex bytes',
    doc: {
      zh: {
        whatIsIt:
          'Hex / Hex Dump 转换器是一款纯浏览器本地运行的字节级工具，使用标准 TextEncoder / TextDecoder 按 UTF-8 在文本与原始字节之间互转，并把字节渲染为十六进制串或类似 hexdump(1) 的经典转储视图，便于查看二进制数据的真实字节布局。',
        coreFeatures: [
          '文本 → Hex：按 UTF-8 编码，支持无分隔连续串、空格、冒号分隔与每字节 0x 前缀',
          '大小写一键切换：十六进制数字可在小写 a-f 与大写 A-F 之间切换',
          'Hex dump 视图：8 位十六进制偏移量、每行 16 字节（8+8 分组）、右侧 ASCII 预览，不可打印字节显示为点',
          'Hex → 文本：自动剥离 0x 前缀与空格、冒号、换行、逗号、连字符等分隔符，按 UTF-8 严格解码',
          '错误友好：奇数个十六进制位、非法字符或非法 UTF-8 字节序列均返回中文可读错误',
          '纯本地计算：零新增依赖，输入内容不发起任何网络请求',
        ],
        howToUse: [
          '在输入卡片顶部选择方向：文本 → Hex 或 Hex → 文本',
          '编码方向下，底部选择输出模式（Hex 串 / Hex dump）；Hex 串模式还可选择分隔符与大小写',
          '在左侧输入文本或粘贴十六进制内容，右侧实时显示结果',
          '解码方向会自动识别常见分隔符与 0x 前缀，无需手动清洗',
          '点击「交换输入 / 输出方向」可把合法的 Hex 串结果回填反向解码（dump 视图请先切回 Hex 串模式）；点击「复制」获取结果',
        ],
        useCases: [
          '协议调试：查看中文、Emoji 等字符的真实 UTF-8 字节，或把抓包得到的字节串还原为文本',
          '嵌入式 / 固件分析：按偏移量阅读 hex dump，通过 ASCII 预览快速定位字符串',
          '开发排错：核对编码结果、拼接带 0x 前缀的 C 风格字节数组、校验剪贴板中的十六进制数据',
        ],
        privacyNote:
          '全部编解码均在浏览器本地完成，使用运行环境内置的 TextEncoder / TextDecoder，不发起任何网络请求；粘贴的内容不会离开设备。',
        faqs: [
          {
            question: '为什么一个中文字符对应 3 个字节？',
            answer:
              '本工具按 UTF-8 编码，常见汉字的码点位于 U+0800–U+FFFF 区间，UTF-8 下使用 3 字节表示，例如「中」为 e4 b8 ad。Emoji 等辅助平面字符则通常为 4 字节。',
          },
          {
            question: '解码时报「十六进制位数必须为偶数」是什么意思？',
            answer:
              '每个字节由两位十六进制数字表示，因此清洗掉分隔符后的总位数必须是偶数。位数为奇数通常是复制时漏掉了一个字符，补齐后再试即可。',
          },
          {
            question: '为什么 Hex 位数合法却提示非法 UTF-8？',
            answer:
              '任意字节序列并不一定是合法的 UTF-8 文本。解码采用严格（fatal）模式，截断的多字节序列或孤立的连续字节都会报错。若只想查看字节布局，可使用 Hex dump 输出而非文本解码。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Hex & Hex Dump Converter is a fully browser-local byte-level tool that uses the standard TextEncoder/TextDecoder to convert between text and raw bytes via UTF-8, rendering bytes as a hexadecimal string or a classic hexdump(1)-style view so you can inspect the real byte layout of binary data.',
        coreFeatures: [
          'Text to hex: UTF-8 encoded output as a continuous string, space- or colon-separated bytes, or per-byte 0x prefixes',
          'One-click case switch between lowercase a-f and uppercase A-F hex digits',
          'Hex dump view: 8-digit hex offset, 16 bytes per row in two groups of 8, and an ASCII preview with dots for non-printable bytes',
          'Hex to text: automatically strips 0x prefixes and spaces, colons, line breaks, commas, and hyphens, then strictly decodes UTF-8',
          'Friendly errors: odd digit counts, illegal characters, and invalid UTF-8 byte sequences return readable messages',
          '100% local computation with zero new dependencies and no network requests',
        ],
        howToUse: [
          'Pick the direction on the input card: Text → Hex or Hex → Text',
          'When encoding, choose the output mode (hex string or hex dump) in the bottom toolbar; in hex string mode you can also pick the separator and letter case',
          'Type text or paste hexadecimal content on the left; the result appears live on the right',
          'When decoding, common separators and 0x prefixes are recognized automatically—no manual cleanup needed',
          'Click "Swap input/output direction" to feed a valid hex string back for reverse decoding (switch from dump to hex string first), or click Copy',
        ],
        useCases: [
          'Protocol debugging: inspect the real UTF-8 bytes of Chinese characters or emoji, or restore text from captured byte strings',
          'Embedded/firmware analysis: read hex dumps by offset and quickly locate strings through the ASCII preview',
          'Development: verify encodings, build C-style 0x-prefixed byte arrays, and validate hex data from the clipboard',
        ],
        privacyNote:
          'All encoding and decoding run locally in your browser using the built-in TextEncoder/TextDecoder. No network requests are made, so content you paste never leaves your device.',
        faqs: [
          {
            question: 'Why does one Chinese character take 3 bytes?',
            answer:
              'This tool uses UTF-8. Common Chinese characters sit in the U+0800–U+FFFF range and use 3 bytes in UTF-8—for example 中 is e4 b8 ad. Supplementary-plane characters such as emoji typically take 4 bytes.',
          },
          {
            question: 'What does "hex digit count must be even" mean when decoding?',
            answer:
              'Each byte is represented by two hex digits, so the total digit count after stripping separators must be even. An odd count usually means a character was lost while copying; add the missing digit and try again.',
          },
          {
            question: 'Why do I get an invalid UTF-8 error even though the hex digits are legal?',
            answer:
              'Not every byte sequence is valid UTF-8 text. Decoding runs in strict (fatal) mode, so truncated multi-byte sequences or orphaned continuation bytes raise an error. If you only need to inspect the byte layout, use the hex dump output instead of text decoding.',
          },
        ],
      },
    },
  },
  {
    slug: 'excel-column-converter',
    name: 'Excel 列名序号互转器',
    nameEn: 'Excel Column Name & Number Converter',
    description:
      '在 Excel 字母列名（A、Z、AA、XFD）与 1 起始的数字列序号（1、26、27、16384）之间双向批量转换，基于双射二十六进制（bijective base-26）纯函数计算。支持每行一个值的批量处理、大小写不敏感、空白自动裁剪，对 0、负数、A1、超出 XFD 等非法行逐行给出可读错误而不影响其他行。适用于表格公式、R1C1 引用以及 openpyxl / Apache POI 等开发场景的列定位。纯浏览器本地运算、零新增依赖。',
    descriptionEn:
      'Convert bidirectionally between Excel letter column names (A, Z, AA, XFD) and 1-based numeric column indexes (1, 26, 27, 16384) using pure bijective base-26 functions. It supports batch processing with one value per line, is case-insensitive, trims whitespace automatically, and reports readable per-line errors for invalid rows such as 0, negative numbers, A1, or values beyond XFD without affecting other rows. Useful for spreadsheet formulas, R1C1 references, and column lookup in openpyxl/Apache POI development. Everything runs locally in the browser with zero new dependencies.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/excel-column-converter',
    iconName: 'Table2',
    tags: ['Excel', '列名', 'R1C1', 'bijective base-26', '电子表格', 'openpyxl'],
    tagsEn: ['Excel', 'Column Letter', 'R1C1', 'Bijective Base-26', 'Spreadsheet', 'openpyxl'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'A\nZ\nAA\nAZ\nZZ\nAAA\nXFD',
    doc: {
      zh: {
        whatIsIt:
          'Excel 列名序号互转器是一款纯浏览器本地运行的小工具，在电子表格的字母列标（A–XFD）与编程接口常用的 1 起始数字序号（1–16384）之间双向转换，覆盖 Excel 全部 16384 列。',
        coreFeatures: [
          '列名 → 序号：A→1、Z→26、AA→27、AZ→52、ZZ→702、AAA→703、XFD→16384',
          '序号 → 列名：1→A、27→AA、703→AAA、16384→XFD，双射二十六进制严格可逆',
          '大小写不敏感：aa 与 AA 结果一致；自动忽略值两侧空白',
          '多行批量：每行一个值逐行转换，空行保留，非法行原样保留并标注行号错误',
          '范围校验：0、负数、非整数、含非字母字符（如 A1）以及超出 16384 的值均给出明确错误',
          '纯本地计算：零新增依赖，输入内容不发起任何网络请求',
        ],
        howToUse: [
          '在输入卡片顶部选择方向：列名 → 序号或序号 → 列名',
          '每行输入一个列名或序号，右侧实时显示逐行结果，支持一次粘贴整列数据',
          '非法行会原样保留并在输出区以黄色警告标注行号与原因，其余行正常转换',
          '点击「交换输入 / 输出方向」可把全部合法结果回填反向转换；点击「复制」获取结果',
        ],
        useCases: [
          '公式调试：排查 VLOOKUP、INDEX、R1C1 引用中字母列标与数字列的对应关系',
          '开发对接：openpyxl、Apache POI、Excel JS 等库在列字母与列索引之间换算',
          '数据处理：批量把导出的列名清单转成序号，或把脚本生成的序号还原为列名',
        ],
        privacyNote:
          '全部转换均在浏览器本地由零依赖纯函数完成，不发起任何网络请求；粘贴的数据不会离开设备。',
        faqs: [
          {
            question: '为什么 Z 之后是 AA 而不是 BA？',
            answer:
              'Excel 列名采用双射二十六进制：没有表示零的数字，A–Z 对应 1–26，因此 Z（26）进位后是 AA（27），与普通 26 进制（含 0）不同。序号转列名时需先做减一处理，这也是本工具内部使用的算法。',
          },
          {
            question: 'Excel 一共有多少列？最大列名是什么？',
            answer:
              '现代 Excel（.xlsx）单表有 16384 列、1048576 行，最大列名是 XFD（第 16384 列），下一个 XFE 已超出范围，本工具会报错提示。',
          },
          {
            question: '为什么输入 A1 报错？',
            answer:
              'A1 是单元格地址（A 列第 1 行）而不是列名。列名方向只接受纯字母（A–Z），序号方向只接受 1–16384 的整数；请去掉行号部分只保留列字母。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Excel Column Name & Number Converter is a fully browser-local tool that converts between spreadsheet letter column labels (A–XFD) and the 1-based numeric indexes (1–16384) commonly used by programming APIs, covering all 16,384 Excel columns.',
        coreFeatures: [
          'Letters to numbers: A→1, Z→26, AA→27, AZ→52, ZZ→702, AAA→703, XFD→16384',
          'Numbers to letters: 1→A, 27→AA, 703→AAA, 16384→XFD, strictly reversible bijective base-26',
          'Case-insensitive: aa equals AA; surrounding whitespace is trimmed automatically',
          'Batch mode: converts one value per line, preserves blank lines, and flags invalid rows in place with line-numbered errors',
          'Range validation: 0, negatives, non-integers, values with non-letter characters (e.g. A1), and anything beyond 16384 produce clear errors',
          '100% local computation with zero new dependencies and no network requests',
        ],
        howToUse: [
          'Pick the direction on the input card: letters to numbers or numbers to letters',
          'Enter one column name or index per line; per-line results appear live on the right, including pasted columns',
          'Invalid rows are kept verbatim and flagged with yellow line-numbered warnings while all other rows convert normally',
          'Click "Swap input/output direction" to feed all valid results back for reverse conversion, or click Copy',
        ],
        useCases: [
          'Formula debugging: map letter columns to numbers in VLOOKUP, INDEX, and R1C1 references',
          'Development: translate between column letters and indexes in openpyxl, Apache POI, Excel JS, and similar libraries',
          'Data processing: batch-convert exported column-name lists into indexes or turn script-generated indexes back into letters',
        ],
        privacyNote:
          'All conversions run locally in your browser via zero-dependency pure functions. No network requests are made, so data you paste never leaves your device.',
        faqs: [
          {
            question: 'Why is AA next after Z instead of a zero-style carry?',
            answer:
              'Excel column names use bijective base-26: there is no digit for zero, and A–Z map to 1–26, so Z (26) carries to AA (27), unlike regular base-26 which includes zero. Number-to-letter conversion decrements first, which is exactly the algorithm used internally here.',
          },
          {
            question: 'How many columns does Excel have, and what is the last one?',
            answer:
              'Modern Excel (.xlsx) sheets have 16,384 columns and 1,048,576 rows. The last column is XFD (index 16384); the next value XFE is out of range and this tool reports an error.',
          },
          {
            question: 'Why does A1 produce an error?',
            answer:
              'A1 is a cell address (column A, row 1), not a column name. Letter mode accepts pure letters (A–Z) only, and number mode accepts integers from 1 to 16384; remove the row part and keep just the column letters.',
          },
        ],
      },
    },
  },
  {
    slug: 'file-size-converter',
    name: '文件大小格式化转换器',
    nameEn: 'File Size Formatter & Parser',
    description:
      '在原始字节数与人类可读文件大小之间双向批量转换：正向按二进制 IEC（1024，B/KiB/MiB/GiB）或十进制 SI（1000，B/KB/MB/GB）规则格式化，智能保留至多 2 位小数并去尾零，也可固定小数位；反向解析「1.5 MB」「2048 KiB」「3GB」「1,024 KB」等字符串为精确整数字节，自动区分 KiB=1024 与 KB=1000。容忍空白、大小写与千分位逗号；负数、空单位、未知单位（如 1.5 XB）逐行给出可读错误。纯浏览器本地运算、零新增依赖。',
    descriptionEn:
      'Convert bidirectionally between raw byte counts and human-readable file sizes: formatting follows either binary IEC (1024, B/KiB/MiB/GiB) or decimal SI (1000, B/KB/MB/GB) rules with smart up-to-2-decimal output (trailing zeros stripped) or fixed decimals; parsing turns strings like "1.5 MB", "2048 KiB", "3GB", and "1,024 KB" into exact integer bytes, distinguishing KiB=1024 from KB=1000. Whitespace, letter case, and thousands separators are tolerated; negative values, missing units, and unknown units (e.g. 1.5 XB) produce readable per-line errors. Everything runs locally in the browser with zero new dependencies.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/file-size-converter',
    iconName: 'HardDrive',
    tags: ['文件大小', '字节', 'KiB', 'KB', '单位换算', '格式化'],
    tagsEn: ['File Size', 'Bytes', 'KiB', 'KB', 'Unit Conversion', 'Formatting'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '0\n512\n1023\n1024\n1536\n1048576\n1073741824',
    doc: {
      zh: {
        whatIsIt:
          '文件大小格式化转换器是一款纯浏览器本地运行的双向工具，解决开发中最常见的两件事：把字节数显示成人类可读的 KB/MB/KiB/MiB 字符串，以及把这类字符串精确解析回字节数。',
        coreFeatures: [
          '两套标准：IEC 二进制（1024，KiB/MiB/GiB/TiB/PiB）与 SI 十进制（1000，KB/MB/GB/TB/PB）',
          '智能小数：默认至多保留 2 位并去掉尾零（1536→1.5 KiB、1024→1 KiB），也可勾选固定小数位',
          '精确解析：根据单位自动选择 1024 或 1000 基数，结果四舍五入为整数字节',
          '宽松输入：容忍首尾空白、数值与单位间空格、任意大小写与千分位逗号',
          '多行批量：每行一个值逐行转换，空行保留，非法行原样保留并标注行号错误',
          '纯本地计算：零新增依赖，输入内容不发起任何网络请求',
        ],
        howToUse: [
          '在输入卡片顶部选择方向：字节 → 可读大小或可读大小 → 字节',
          '格式化方向下，在底部选择 IEC（1024）或 SI（1000）标准，可勾选固定小数位',
          '每行输入字节数或大小字符串，右侧实时输出，支持一次粘贴多行',
          '解析方向无需选择标准，单位本身（KiB 与 KB）决定基数；非法行以黄色警告逐行标注',
          '点击「交换输入 / 输出方向」可把合法结果回填反向转换；点击「复制」获取结果',
        ],
        useCases: [
          '前端开发：把 Content-Length、文件 API 返回的字节数显示为友好文案',
          '运维排障：把日志、ls/du 输出中的 1.5 GB、2048 MiB 换算成精确字节做比较',
          '脚本与接口：核对不同系统（1000 进制与 1024 进制）文件大小标注的真实差异',
        ],
        privacyNote:
          '全部换算均在浏览器本地由零依赖纯函数完成，不发起任何网络请求；粘贴的数据不会离开设备。',
        faqs: [
          {
            question: 'KiB 和 KB 有什么区别？',
            answer:
              'KiB（kibibyte）按 IEC 二进制标准等于 1024 字节；KB（kilobyte）按 SI 十进制标准等于 1000 字节。本工具在解析时严格按单位拼写选择基数，格式化时由你切换的标准决定使用哪一套单位，因此 1.5 MB = 1500000 字节，而 2048 KiB = 2097152 字节。',
          },
          {
            question: '为什么 1023 字节显示为 1023 B 而不是 1 KiB？',
            answer:
              '只有达到基数（IEC 为 1024、SI 为 1000）才会进位到下一单位，不足基数的值保持以字节显示，这与大多数文件管理器和 ls -h 的习惯一致。',
          },
          {
            question: '解析「1.5 XB」为什么报错？',
            answer:
              'XB 不是受支持的单位。可识别的单位为 B、KB/MB/GB/TB/PB（1000 进制）与 KiB/MiB/GiB/TiB/PiB（1024 进制），拼写不区分大小写，但必须是上述单位之一；完全不写单位同样会报错。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The File Size Formatter & Parser is a fully browser-local bidirectional tool for two everyday development tasks: displaying byte counts as human-readable KB/MB/KiB/MiB strings, and parsing such strings back into exact byte counts.',
        coreFeatures: [
          'Two standards: IEC binary (1024, KiB/MiB/GiB/TiB/PiB) and SI decimal (1000, KB/MB/GB/TB/PB)',
          'Smart decimals: at most 2 digits with trailing zeros stripped by default (1536→1.5 KiB, 1024→1 KiB), with optional fixed decimals',
          'Exact parsing: the unit itself chooses the 1024 or 1000 base, and results round to integer bytes',
          'Lenient input: tolerates leading/trailing whitespace, spaces between value and unit, any letter case, and thousands separators',
          'Batch mode: converts one value per line, preserves blank lines, and flags invalid rows in place with line-numbered errors',
          '100% local computation with zero new dependencies and no network requests',
        ],
        howToUse: [
          'Pick the direction on the input card: bytes to readable size or readable size to bytes',
          'When formatting, choose the IEC (1024) or SI (1000) standard in the bottom toolbar, optionally enabling fixed decimals',
          'Enter byte counts or size strings one per line; results appear live on the right, including multi-line pastes',
          'When parsing, no standard selection is needed—the unit itself (KiB vs KB) determines the base; invalid rows get yellow line-numbered warnings',
          'Click "Swap input/output direction" to feed valid results back for reverse conversion, or click Copy',
        ],
        useCases: [
          'Frontend development: render Content-Length and File API byte counts into friendly labels',
          'Ops troubleshooting: convert 1.5 GB or 2048 MiB from logs and ls/du output into exact bytes for comparison',
          'Scripts and APIs: verify the real difference between sizes labeled using the 1000-based and 1024-based systems',
        ],
        privacyNote:
          'All conversions run locally in your browser via zero-dependency pure functions. No network requests are made, so data you paste never leaves your device.',
        faqs: [
          {
            question: 'What is the difference between KiB and KB?',
            answer:
              'A KiB (kibibyte) is 1024 bytes under the IEC binary standard; a KB (kilobyte) is 1000 bytes under the SI decimal standard. Parsing picks the base strictly from the unit spelling, while formatting uses whichever standard you select—so 1.5 MB = 1,500,000 bytes and 2048 KiB = 2,097,152 bytes.',
          },
          {
            question: 'Why do 1023 bytes show as 1023 B instead of 1 KiB?',
            answer:
              'Values only roll over to the next unit once they reach the base (1024 for IEC, 1000 for SI). Anything below the base stays in bytes, matching the convention used by most file managers and ls -h.',
          },
          {
            question: 'Why does parsing "1.5 XB" fail?',
            answer:
              'XB is not a supported unit. Recognized units are B, KB/MB/GB/TB/PB (base 1000) and KiB/MiB/GiB/TiB/PiB (base 1024). Spelling is case-insensitive, but it must be one of these; omitting the unit entirely also raises an error.',
          },
        ],
      },
    },
  },
  {
    slug: 'ean13-checksum',
    name: 'EAN-13 / UPC-A 条码校验位工具',
    nameEn: 'EAN-13 / UPC-A Check Digit Calculator',
    description:
      '按 GS1 模 10 加权算法批量计算与校验商品条码校验位：输入 12 位 EAN-13（或 11 位 UPC-A）数字主体自动补全末位校验位；输入完整 13 位（或 12 位）则校验合法性，校验位错误时给出正确校验位与纠正后的合法编码。支持 EAN-13/GTIN-13 与 UPC-A/GTIN-12 两种模式，容忍空格与连字符，多行批量处理并逐行标注行号错误；非数字、长度不符等输入给出可读提示。纯浏览器本地运算、零新增依赖。',
    descriptionEn:
      'Batch-compute and verify product barcode check digits using the GS1 modulo-10 weighted algorithm: enter a 12-digit EAN-13 (or 11-digit UPC-A) body to append the check digit, or a full 13-digit (or 12-digit) code to validate it—when wrong, the correct digit and the corrected valid code are shown. Supports both EAN-13/GTIN-13 and UPC-A/GTIN-12 modes, tolerates spaces and hyphens, processes multiple lines with line-numbered errors, and reports non-digit or wrong-length input readably. Everything runs locally in the browser with zero new dependencies.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/ean13-checksum',
    iconName: 'Barcode',
    tags: ['EAN-13', 'UPC-A', '条码', '校验位', 'GTIN', '模10'],
    tagsEn: ['EAN-13', 'UPC-A', 'Barcode', 'Check Digit', 'GTIN', 'Modulo 10'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '590123412345\n400638133393\n5901234123457',
    doc: {
      zh: {
        whatIsIt:
          'EAN-13 / UPC-A 条码校验位工具是一款纯浏览器本地运行的批量计算器，用于为商品条码数字主体补全末位校验位，或检验完整条码的校验位是否正确，覆盖零售场景最常见的 EAN-13（GTIN-13）与 UPC-A（GTIN-12）两种编码。',
        coreFeatures: [
          '双模式：EAN-13（12 位主体 / 13 位完整码）与 UPC-A（11 位主体 / 12 位完整码）',
          '自动判断：输入主体位数则补全校验位，输入完整位数则校验合法性',
          'GS1 标准算法：自右向左对数字交替乘以 3 与 1 求和，校验位 = (10 - 总和 mod 10) mod 10',
          '错误纠正：校验位不匹配时明确给出实际末位、正确校验位与合法编码',
          '宽松输入：自动忽略空格与连字符，多行批量处理，空行保留，非法行逐行标注行号',
          '纯本地计算：零新增依赖，输入内容不发起任何网络请求',
        ],
        howToUse: [
          '在输入卡片顶部选择 EAN-13 或 UPC-A 模式',
          '每行输入一个条码：少一位（主体）自动补全，满位（完整码）自动校验',
          '右侧实时输出补全或纠正后的编码，支持一次粘贴多行',
          '含空格或连字符的编号（如 590 1234 12345 7）可直接粘贴，无需手动清理',
          '非法行会原样保留并在输出区以黄色警告逐行标注原因；点击「复制」获取结果',
        ],
        useCases: [
          '电商与零售：批量核对商品资料中的 EAN-13/UPC-A 条码是否录入正确',
          '仓储与物流：自制标签或打印编码前快速计算校验位',
          '开发与测试：构造条码相关功能时生成合法测试数据、验证解析逻辑',
        ],
        privacyNote:
          '全部计算均在浏览器本地由零依赖纯函数完成，不发起任何网络请求；粘贴的条码数据不会离开设备。',
        faqs: [
          {
            question: 'EAN-13 的校验位是怎么算出来的？',
            answer:
              '采用 GS1 模 10 加权算法：从校验位左侧第一位开始自右向左，各位数字依次乘以 3、1、3、1……求和，校验位等于 (10 -（总和对 10 取模）) 对 10 取模。例如主体 590123412345 计算得到校验位 7，完整码为 5901234123457。',
          },
          {
            question: 'UPC-A 和 EAN-13 有什么关系？',
            answer:
              'UPC-A 是 12 位（11 位主体 + 1 位校验位），主要用于北美；EAN-13 是 13 位（12 位主体 + 1 位校验位），国际通用。二者校验位算法完全相同，只是主体长度不同；事实上 UPC-A 编码可视为前缀补 0 的 EAN-13（036000291452 等价于 0036000291452）。',
          },
          {
            question: '为什么完整条码被提示校验位不正确？',
            answer:
              '说明末位与按前 12 位（UPC-A 为前 11 位）重新计算出的校验位不一致，通常是录入或 OCR 识别时某一位出错。警告会给出正确校验位和纠正后的合法编码，请对照原始条码图像或包装核实是哪一位录错。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The EAN-13 / UPC-A Check Digit Calculator is a fully browser-local batch tool for appending check digits to product barcode number bodies and verifying the check digit of complete codes, covering the two most common retail symbologies: EAN-13 (GTIN-13) and UPC-A (GTIN-12).',
        coreFeatures: [
          'Two modes: EAN-13 (12-digit body / 13-digit full code) and UPC-A (11-digit body / 12-digit full code)',
          'Automatic behavior: body length appends the check digit, full length validates it',
          'GS1 standard algorithm: digits weighted 3 and 1 alternately from right to left, check digit = (10 - sum mod 10) mod 10',
          'Error correction: a mismatched check digit reports the given digit, the correct digit, and the valid corrected code',
          'Lenient input: spaces and hyphens are ignored; multi-line batch processing preserves blank lines and flags invalid rows with line numbers',
          '100% local computation with zero new dependencies and no network requests',
        ],
        howToUse: [
          'Choose EAN-13 or UPC-A mode at the top of the input card',
          'Enter one barcode per line: one digit short (body) is completed, full length is validated',
          'Completed or corrected codes appear live on the right, including multi-line pastes',
          'Codes with spaces or hyphens (e.g. 590 1234 12345 7) can be pasted directly',
          'Invalid rows are kept in place and explained in yellow line-numbered warnings; click Copy to grab results',
        ],
        useCases: [
          'E-commerce and retail: batch-check whether EAN-13/UPC-A codes in product data were entered correctly',
          'Warehousing and logistics: quickly compute check digits before printing self-made labels',
          'Development and testing: generate valid barcode fixtures and verify parsing logic',
        ],
        privacyNote:
          'All calculations run locally in your browser via zero-dependency pure functions. No network requests are made, so barcode data you paste never leaves your device.',
        faqs: [
          {
            question: 'How is the EAN-13 check digit calculated?',
            answer:
              'With the GS1 modulo-10 weighted algorithm: starting immediately left of the check digit and moving right to left, digits are multiplied alternately by 3 and 1 and summed; the check digit is (10 - (sum mod 10)) mod 10. For example, body 590123412345 yields check digit 7, giving 5901234123457.',
          },
          {
            question: 'How do UPC-A and EAN-13 relate?',
            answer:
              'UPC-A has 12 digits (11 body + 1 check digit) and is mainly used in North America; EAN-13 has 13 digits (12 body + 1 check digit) and is used internationally. The check-digit algorithm is identical—only the body length differs. In fact a UPC-A code is equivalent to an EAN-13 code with a leading zero (036000291452 equals 0036000291452).',
          },
          {
            question: 'Why is a complete barcode reported as having a wrong check digit?',
            answer:
              'The last digit does not match the one recomputed from the first 12 digits (11 for UPC-A), usually because a digit was mistyped or misread by OCR. The warning shows the correct digit and the corrected code; compare it against the original barcode image or packaging to find which digit was entered incorrectly.',
          },
        ],
      },
    },
  },
  {
    slug: 'gray-code-converter',
    name: '二进制 ↔ Gray 码（格雷码）双向转换器',
    nameEn: 'Binary ↔ Gray Code Converter',
    description:
      '在普通二进制数与反射二进制格雷码（Gray Code）之间双向转换：二进制 → Gray 按 G = B xor (B >> 1) 编码，Gray → 二进制按最高位起逐位异或累加还原。基于 BigInt 运算，支持任意位宽大整数，输出十进制与十六进制对照并展示逐位推导过程；容忍 0b 前缀、空白与下划线，支持多行批量处理并逐行标注错误。纯浏览器本地运算、零新增依赖。',
    descriptionEn:
      'Convert between plain binary numbers and reflected binary Gray code in both directions: binary → Gray encodes via G = B xor (B >> 1), while Gray → binary reconstructs bits by XOR-accumulating from the most significant bit. Powered by BigInt, it supports arbitrary-width integers, shows decimal and hexadecimal counterparts plus a per-bit derivation, tolerates 0b prefixes, whitespace and underscores, and processes multiple lines with line-numbered errors. Everything runs locally in the browser with zero new dependencies.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/gray-code-converter',
    iconName: 'Binary',
    tags: ['Gray 码', '格雷码', '二进制', '反射二进制', '数字电路', 'BigInt'],
    tagsEn: ['Gray Code', 'Reflected Binary', 'Binary', 'Digital Circuits', 'BigInt', 'Codec'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '110110',
    doc: {
      zh: {
        whatIsIt:
          '二进制 ↔ Gray 码转换器是一款纯浏览器本地运行的编码工具，在普通二进制数与反射二进制格雷码（Gray Code）之间双向转换。格雷码的特点是相邻两个码字之间仅有 1 位不同，因此广泛用于旋转编码器、卡诺图化简、异步 FIFO 指针与数字电路状态机等场景。',
        coreFeatures: [
          '双向转换：二进制 → Gray（G = B xor (B >> 1)）与 Gray → 二进制（逐位异或累加）',
          '任意位宽：基于 BigInt，不受 32 位或 Number.MAX_SAFE_INTEGER 限制',
          '进制对照：同时输出结果的十进制与十六进制形式',
          '逐位推导：展示每一位的异或依据，便于学习与核对',
          '宽松输入：容忍 0b 前缀、空格、换行与下划线分隔，多行批量处理并逐行标注行号',
          '纯本地计算：零新增依赖，输入内容不发起任何网络请求',
        ],
        howToUse: [
          '在输入卡片顶部选择「二进制 → Gray」或「Gray → 二进制」模式',
          '在左侧输入框粘贴二进制串，可携带 0b 前缀或用空格、下划线分组',
          '右侧实时显示转换结果（保持输入位宽），下方给出十进制与十六进制对照',
          '「逐位推导」卡片按位展示异或过程；多行输入时推导展示首个非空行',
          '非法行会原样保留并在输出区以黄色警告逐行标注原因；点击「复制」获取结果',
        ],
        useCases: [
          '数字电路与组成原理：学习格雷码编码、旋转编码器与卡诺图',
          'HDL / FPGA 开发：异步 FIFO 读写指针的格雷码跨时钟域设计核对',
          '调试与笔试：快速在二进制与格雷码之间换算并验证逐位过程',
        ],
        privacyNote:
          '全部计算均在浏览器本地由零依赖纯函数（BigInt）完成，不发起任何网络请求；输入内容不会离开设备。',
        faqs: [
          {
            question: 'Gray 码是怎么从二进制算出来的？',
            answer:
              '编码公式为 G = B xor (B >> 1)：将二进制数右移一位后与自身按位异或。例如二进制 110110（十进制 54）右移一位为 011011，异或结果为 101101，即其格雷码。最高位始终与原二进制最高位相同。',
          },
          {
            question: '已知 Gray 码如何还原二进制？',
            answer:
              '最高位直接保留，其余各位从高到低计算：B[i] = G[i] xor B[i+1]，即每一位 Gray 码与已经还原出的相邻高位二进制异或。本工具的反向模式与逐位推导卡片会完整展示这一前缀异或过程。',
          },
          {
            question: '为什么相邻格雷码只差 1 位？',
            answer:
              '反射构造（镜像前缀 0/1）保证了序列中任意相邻两个码字仅 1 个比特不同，包括最后一个码字回到第一个码字（循环格雷码）。这一性质使其特别适合机械编码器——切换位置时只翻转一位，可消除多位同时变化产生的中间错误状态。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Binary ↔ Gray Code Converter is a fully browser-local tool that converts between plain binary numbers and reflected binary Gray code. Gray code is defined so that adjacent codewords differ in exactly one bit, which makes it widely used in rotary encoders, Karnaugh maps, asynchronous FIFO pointers and digital state machines.',
        coreFeatures: [
          'Bidirectional: binary → Gray (G = B xor (B >> 1)) and Gray → binary (bitwise XOR accumulation from the top)',
          'Arbitrary width: powered by BigInt, beyond 32-bit or Number.MAX_SAFE_INTEGER limits',
          'Base counterparts: decimal and hexadecimal forms of the result are shown together',
          'Per-bit derivation: the XOR reasoning of every bit is displayed for learning and verification',
          'Lenient input: 0b prefixes, spaces, newlines and underscores are accepted; multi-line batches report line-numbered errors',
          '100% local computation with zero new dependencies and no network requests',
        ],
        howToUse: [
          'Pick “Binary → Gray” or “Gray → Binary” mode at the top of the input card',
          'Paste a binary string on the left, optionally with a 0b prefix or space/underscore grouping',
          'The converted result appears live on the right (same width as input), with decimal and hexadecimal values below',
          'The derivation card shows the XOR process per bit; for multi-line input it derives the first non-empty line',
          'Invalid rows are kept in place and explained in yellow line-numbered warnings; click Copy to grab results',
        ],
        useCases: [
          'Digital logic and computer architecture courses: Gray code, rotary encoders and Karnaugh maps',
          'HDL/FPGA development: checking Gray-coded async FIFO pointers crossing clock domains',
          'Debugging and interviews: quickly convert between binary and Gray code with a verifiable derivation',
        ],
        privacyNote:
          'All calculations run locally in your browser via zero-dependency BigInt pure functions. No network requests are made, so your input never leaves your device.',
        faqs: [
          {
            question: 'How is Gray code computed from binary?',
            answer:
              'The encoding is G = B xor (B >> 1): shift the binary number right by one bit and XOR it with itself. For example, binary 110110 (decimal 54) shifted is 011011, and their XOR is 101101, which is its Gray code. The most significant bit always stays the same.',
          },
          {
            question: 'How do I recover binary from a Gray code?',
            answer:
              'Keep the most significant bit, then work from high to low: B[i] = G[i] xor B[i+1]—each Gray bit is XORed with the already-recovered adjacent higher binary bit. The reverse mode and the per-bit derivation card show this prefix-XOR process in full.',
          },
          {
            question: 'Why do adjacent Gray codewords differ by only one bit?',
            answer:
              'The reflected construction (mirroring with 0/1 prefixes) guarantees that any two adjacent codewords, including the last wrapping back to the first in the cyclic Gray code, differ in a single bit. This makes Gray code ideal for mechanical encoders, where flipping just one bit eliminates invalid intermediate states when several bits would otherwise change simultaneously.',
          },
        ],
      },
    },
  },
  {
    slug: 'websocket-accept',
    name: 'WebSocket Sec-WebSocket-Accept 握手头计算器',
    nameEn: 'WebSocket Sec-WebSocket-Accept Handshake Calculator',
    description:
      '按 RFC 6455 §1.3/§4.2.2 计算 WebSocket 握手应答头：将客户端 Sec-WebSocket-Key（16 字节随机数的 Base64）拼接固定 GUID「258EAFA5-E914-47DA-95CA-C5AB0DC85B11」，计算 SHA-1 后 Base64 输出服务端 Sec-WebSocket-Accept；同时支持反向校验模式（每行一对 Key 与 Accept，判断是否匹配，不匹配时给出正确值）。内置 RFC 官方示例向量，多行批量处理并逐行标注错误。纯浏览器本地运算，SHA-1 由 Web Crypto 提供、零新增依赖。',
    descriptionEn:
      'Computes the WebSocket handshake response header per RFC 6455 §1.3/§4.2.2: concatenate the client Sec-WebSocket-Key (Base64 of 16 random bytes) with the fixed GUID “258EAFA5-E914-47DA-95CA-C5AB0DC85B11”, take the SHA-1 hash and Base64-encode it to produce the server Sec-WebSocket-Accept. A reverse verification mode takes a Key/Accept pair per line and reports whether they match (showing the correct value if not). Ships with the official RFC example vector, processes multiple lines with line-numbered errors, and runs fully locally—SHA-1 via Web Crypto, zero new dependencies.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/websocket-accept',
    iconName: 'KeyRound',
    tags: ['WebSocket', 'Sec-WebSocket-Accept', 'RFC 6455', '握手', 'SHA-1', 'Base64'],
    tagsEn: ['WebSocket', 'Sec-WebSocket-Accept', 'RFC 6455', 'Handshake', 'SHA-1', 'Base64'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'dGhlIHNhbXBsZSBub25jZQ==',
    doc: {
      zh: {
        whatIsIt:
          'WebSocket Sec-WebSocket-Accept 握手头计算器是一款纯浏览器本地运行的协议调试工具，严格按 RFC 6455 规定的握手算法，从客户端请求头 Sec-WebSocket-Key 计算服务端应答头 Sec-WebSocket-Accept，并支持给定 Key/Accept 对的反向匹配校验。',
        coreFeatures: [
          'RFC 6455 标准算法：Accept = Base64(SHA-1(Key + 固定 GUID))',
          '固定 GUID 内置：258EAFA5-E914-47DA-95CA-C5AB0DC85B11，无需手填',
          '双向能力：计算模式批量产出 Accept；校验模式逐对判断 Key 与 Accept 是否匹配并给出正确值',
          '输入校验：严格检查 Key 是否为 16 字节随机数的合法 Base64（24 字符）',
          '官方示例：默认样本即 RFC 6455 文档中的标准握手向量，可直接对照',
          '纯本地计算：SHA-1 由浏览器 Web Crypto 完成，零新增依赖、不发起网络请求',
        ],
        howToUse: [
          '选择「计算 Accept」模式，每行粘贴一个 Sec-WebSocket-Key 请求头值',
          '右侧实时显示对应的 Sec-WebSocket-Accept，可直接粘贴到服务端响应头',
          '选择「反向校验」模式，每行输入「Key 空格 Accept」两个字段做匹配判断',
          '不匹配或非法的行会原样保留并以黄色警告逐行标注行号与原因',
          '点击「复制」获取输出；页面下方卡片展示完整 RFC 公式与 GUID',
        ],
        useCases: [
          '手写 WebSocket 服务端：实现 Sec-WebSocket-Accept 应答头时对照验证',
          '抓包调试：核对浏览器升级请求与服务端 101 响应中的握手头是否匹配',
          '协议学习：理解 WebSocket 握手机制，复现 RFC 6455 官方示例',
        ],
        privacyNote:
          'Key 与 Accept 仅在浏览器本地经 Web Crypto 计算 SHA-1，不发起任何网络请求，粘贴的握手数据不会离开设备。',
        faqs: [
          {
            question: 'Sec-WebSocket-Accept 是怎么算出来的？',
            answer:
              '把客户端请求头里的 Sec-WebSocket-Key（一个 16 字节随机数的 Base64 值）与固定字符串 GUID「258EAFA5-E914-47DA-95CA-C5AB0DC85B11」直接拼接，对拼接结果计算 SHA-1 摘要（20 字节），再做 Base64 编码，即为服务端必须返回的 Sec-WebSocket-Accept。例如 RFC 示例 Key dGhlIHNhbXBsZSBub25jZQ== 对应 Accept s3pPLMBiTxaQ9kYGzzhZRbK+xOo=。',
          },
          {
            question: '为什么握手要设计这个 Accept 值？',
            answer:
              '它主要用于让服务端向客户端证明：对方确实理解 WebSocket 协议、确实收到了本次升级请求，而不是一个误接收该请求的普通 HTTP 服务端。由于 GUID 由 RFC 固定且不传输，缓存代理等中间件也无法凭空伪造正确应答。它不是安全认证机制，不提供身份保证。',
          },
          {
            question: 'Sec-WebSocket-Key 的格式有什么要求？',
            answer:
              '按 RFC 6455，Key 必须是 16 字节随机数经 Base64 编码后的结果，因此长度恒为 24 个字符（22 个 Base64 字符加两个等号填充）。工具会严格检查字符集与解码后的字节数；不符合时该输入行将被标记为非法。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The WebSocket Sec-WebSocket-Accept Handshake Calculator is a fully browser-local protocol debugging tool. It strictly follows the RFC 6455 handshake algorithm to derive the server Sec-WebSocket-Accept response header from the client Sec-WebSocket-Key request header, and can also verify a given Key/Accept pair in reverse.',
        coreFeatures: [
          'RFC 6455 algorithm: Accept = Base64(SHA-1(Key + fixed GUID))',
          'Built-in fixed GUID: 258EAFA5-E914-47DA-95CA-C5AB0DC85B11, no manual entry needed',
          'Two directions: compute mode batch-produces Accept values; verify mode checks Key/Accept pairs and shows the correct value on mismatch',
          'Input validation: strictly checks that a Key is valid Base64 of exactly 16 random bytes (24 chars)',
          'Official example: the default sample is the standard handshake vector straight from RFC 6455',
          '100% local: SHA-1 via the browser Web Crypto API, zero new dependencies and no network requests',
        ],
        howToUse: [
          'In “Compute Accept” mode, paste one Sec-WebSocket-Key request-header value per line',
          'The corresponding Sec-WebSocket-Accept appears live on the right, ready for the server response header',
          'Switch to “Verify” mode and enter a “Key whitespace Accept” pair per line for matching',
          'Mismatched or invalid rows are kept in place and flagged with line numbers and reasons',
          'Click Copy to grab the output; the card below shows the full RFC formula and GUID',
        ],
        useCases: [
          'Writing a WebSocket server: cross-checking your Sec-WebSocket-Accept implementation',
          'Packet debugging: verifying browser upgrade requests against 101 response headers',
          'Learning the protocol: reproducing the official RFC 6455 worked example',
        ],
        privacyNote:
          'Keys and Accept values only go through the local Web Crypto SHA-1 implementation in your browser. No network requests are made, so handshake data you paste never leaves your device.',
        faqs: [
          {
            question: 'How is Sec-WebSocket-Accept calculated?',
            answer:
              'Take the Sec-WebSocket-Key request-header value (Base64 of a 16-byte nonce), concatenate it directly with the fixed GUID string “258EAFA5-E914-47DA-95CA-C5AB0DC85B11”, compute the SHA-1 digest (20 bytes) of the concatenation, and Base64-encode it—that is the Sec-WebSocket-Accept the server must return. For example, the RFC sample key dGhlIHNhbXBsZSBub25jZQ== yields s3pPLMBiTxaQ9kYGzzhZRbK+xOo=.',
          },
          {
            question: 'Why does the handshake use this Accept value?',
            answer:
              'It primarily proves to the client that the server genuinely understands the WebSocket protocol and actually received this upgrade request, rather than being an ordinary HTTP server that accepted the request by mistake. Because the GUID is fixed by the RFC and never transmitted, caching proxies and other intermediaries cannot forge a valid response. It is not a security or authentication mechanism.',
          },
          {
            question: 'What are the formatting rules for Sec-WebSocket-Key?',
            answer:
              'Per RFC 6455 the key must be the Base64 encoding of 16 cryptographically random bytes, so it is always exactly 24 characters long (22 Base64 characters plus two equals signs). The tool strictly validates the character set and the decoded byte length; non-conforming input rows are marked invalid.',
          },
        ],
      },
    },
  },
  {
    slug: 'mongodb-objectid',
    name: 'MongoDB ObjectId 生成与解析器',
    nameEn: 'MongoDB ObjectId Generator & Parser',
    description:
      '解析与生成 MongoDB 的 12 字节（24 位十六进制）ObjectId：解析时拆解为前 4 字节 Unix 秒级时间戳（本地 / UTC 时间）、中间 5 字节随机值（传统驱动为 3 字节机器标识 + 2 字节进程标识）与末 3 字节自增计数器；生成时使用 Web Crypto 密码学安全随机源，支持当前时间或自定义秒级时间戳，可生成单个或连续计数器的批量 ID。纯浏览器本地运算、零新增依赖、不访问任何数据库。',
    descriptionEn:
      'Parse and generate MongoDB 12-byte (24 hex characters) ObjectIds: parsing breaks the value into a leading 4-byte Unix timestamp in seconds (shown in local and UTC time), a middle 5-byte random value (traditionally 3 machine bytes + 2 process bytes) and a trailing 3-byte incrementing counter; generation uses the Web Crypto CSPRNG with the current time or a custom seconds timestamp, producing a single ID or a batch with sequential counters. Runs fully locally in the browser with zero new dependencies and never touches a database.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/mongodb-objectid',
    iconName: 'Tags',
    tags: ['MongoDB', 'ObjectId', '主键', '标识符', '时间戳', '数据库'],
    tagsEn: ['MongoDB', 'ObjectId', 'Primary Key', 'Identifier', 'Timestamp', 'Database'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '507f1f77bcf86cd799439011',
    doc: {
      zh: {
        whatIsIt:
          'MongoDB ObjectId 生成与解析器是一款纯浏览器本地运行的数据库标识工具。ObjectId 是 MongoDB 默认的 _id 类型，长度固定为 12 字节（24 位十六进制），由 4 字节秒级时间戳、5 字节随机值与 3 字节计数器组成，既能保证分布式环境下的近似有序与全局唯一，又能从 ID 本身反推出文档的创建时间。',
        coreFeatures: [
          '布局解析：4 字节时间戳 + 5 字节随机值（机器 3 + 进程 2）+ 3 字节计数器逐段拆解',
          '时间换算：同时展示创建时间的本地时区与 UTC 表示，以及 Unix 秒级时间戳',
          '安全生成：随机字节取自 Web Crypto（crypto.getRandomValues）密码学安全随机源',
          '自定义时间：可指定任意 0–2^32-1 的秒级时间戳生成，便于复现与构造边界数据',
          '批量生成：同批共享时间戳与随机值、计数器连续递增，模拟同一进程连续插入的真实分布',
          '纯本地计算：零新增依赖，不连接任何 MongoDB 实例或网络服务',
        ],
        howToUse: [
          '在「解析」卡片粘贴 24 位十六进制 ObjectId（大小写与首尾空白均可容忍），下方立即显示各组成段与时间',
          '在「生成」卡片选择使用当前时间或切换为自定义秒级时间戳',
          '点击「生成 1 个」获取单个 ObjectId，或填写批量数量后点击「批量生成」（1–1000 个）',
          '点击「复制 / 复制全部」把结果写入剪贴板；生成结果可直接粘贴回解析区核对',
        ],
        useCases: [
          '后端开发：根据日志或数据中的 _id 快速判断文档创建时间，排查写入时序',
          '数据构造：单元测试 / Seed 脚本中生成指定时间戳的 ObjectId，构造时间范围查询用例',
          '协议学习：理解 ObjectId 的字节布局、计数器回绕与分布式唯一性来源',
        ],
        privacyNote:
          '全部解析与生成均在浏览器本地完成，随机数来自平台内置 Web Crypto，不连接数据库、不发起任何网络请求，输入与生成内容不会离开设备。',
        faqs: [
          {
            question: 'ObjectId 的 12 字节是如何布局的？',
            answer:
              '前 4 字节是 Unix 秒级时间戳（大端），中间 5 字节在现代驱动中为每次进程初始化生成的随机值（旧版布局为 3 字节机器标识 + 2 字节进程标识），末 3 字节是随机初值的自增计数器。本工具同时按现代与传统两种视角展示这 5 字节。',
          },
          {
            question: '同一秒生成的多个 ObjectId 如何保证唯一？',
            answer:
              '同一进程内计数器每生成一个 ID 递增一次（3 字节空间可达 16777216 个 / 秒，溢出后回绕到 0），加上每进程不同的 5 字节随机值，使不同进程、不同主机在同一秒内也几乎不可能碰撞。批量生成模式正是按这一规则让计数器连续递增。',
          },
          {
            question: '为什么解析出的时间只精确到秒？',
            answer:
              '因为 ObjectId 时间戳段只有 4 字节且单位是 Unix 秒，不包含毫秒。需要毫秒级创建时间时应在文档中另存 createdAt 字段，无法仅凭 ObjectId 还原秒以下精度。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The MongoDB ObjectId Generator & Parser is a fully browser-local tool for MongoDB identifiers. ObjectId is the default _id type in MongoDB: a fixed 12-byte (24 hex characters) value made of a 4-byte timestamp in seconds, a 5-byte random value and a 3-byte counter, providing approximate ordering and global uniqueness in distributed systems while letting you recover the document creation time from the ID itself.',
        coreFeatures: [
          'Layout parsing: splits the value into a 4-byte timestamp, 5-byte random value (3 machine + 2 process bytes in the legacy layout) and a 3-byte counter',
          'Time conversion: shows creation time in both local timezone and UTC, plus the Unix timestamp in seconds',
          'Secure generation: random bytes come from the Web Crypto CSPRNG (crypto.getRandomValues)',
          'Custom timestamps: generate with any 0–2^32-1 seconds value for reproducible fixtures and edge cases',
          'Batch generation: one timestamp/random prefix with a sequentially increasing counter, matching real same-process inserts',
          '100% local: zero new dependencies, never connects to a MongoDB instance or any network service',
        ],
        howToUse: [
          'Paste a 24-character hex ObjectId in the Parse card (case and surrounding spaces are tolerated); the segments and times appear immediately',
          'In the Generate card choose the current time or switch to a custom timestamp in seconds',
          'Click “Generate one” for a single ObjectId, or set a batch count (1–1000) and click “Generate batch”',
          'Use Copy / Copy all to grab the results; generated IDs can be pasted back into the parser to verify',
        ],
        useCases: [
          'Backend work: quickly tell when a document was inserted from an _id found in logs or data, debugging write ordering',
          'Fixtures: generate ObjectIds with specific timestamps for unit tests, seed scripts and time-range query cases',
          'Learning: understand the byte layout, counter wraparound and uniqueness guarantees of ObjectId',
        ],
        privacyNote:
          'Everything runs locally in your browser; randomness comes from the built-in Web Crypto API. It never connects to a database or makes network requests, so neither input nor generated IDs leave your device.',
        faqs: [
          {
            question: 'How are the 12 bytes of an ObjectId laid out?',
            answer:
              'The first 4 bytes are a big-endian Unix timestamp in seconds, the middle 5 bytes are a per-process random value in modern drivers (in the legacy layout: 3 machine-identifier bytes + 2 process-identifier bytes), and the last 3 bytes are an incrementing counter with a random initial value. The tool shows both the modern and the traditional views of those 5 bytes.',
          },
          {
            question: 'How are multiple ObjectIds generated in the same second kept unique?',
            answer:
              'Within a process the counter increments on every generation (3 bytes allow up to 16,777,216 IDs per second before wrapping to 0), and each process has a distinct 5-byte random value, so collisions across processes or hosts in the same second are overwhelmingly unlikely. Batch mode mirrors this by incrementing the counter sequentially.',
          },
          {
            question: 'Why is the parsed time only precise to the second?',
            answer:
              'The ObjectId timestamp segment is 4 bytes measured in Unix seconds and contains no milliseconds. When sub-second precision is required you should store a separate createdAt field; it cannot be recovered from the ObjectId alone.',
          },
        ],
      },
    },
  },
  {
    slug: 'jsonc-to-json',
    name: 'JSONC 转标准 JSON（注释与尾随逗号剥离）',
    nameEn: 'JSONC to JSON Converter',
    description:
      '把带 // 行注释、/* */ 块注释与尾随逗号的 JSONC / 宽松 JSON 文本清洗为严格合法的标准 JSON：词法扫描时正确跳过双引号字符串（含转义引号）内部的注释符号与逗号，仅移除真正的注释与 }/] 前的尾随逗号，再经 JSON.parse 校验后按 2 空格 / 4 空格 / 压缩单行重新序列化。适合清理 tsconfig.json 等带注释配置片段。纯浏览器本地运算、零新增依赖、不发起网络请求。',
    descriptionEn:
      'Turn JSONC / lenient JSON text containing // line comments, /* */ block comments and trailing commas into strict, standards-compliant JSON: a lexical scanner skips comment markers and commas inside double-quoted strings (including escaped quotes), removes only real comments and trailing commas before }/], validates with JSON.parse, and re-serializes with 2-space indent, 4-space indent or a single-line minified layout. Useful for cleaning commented config snippets such as tsconfig.json. Runs fully locally in the browser with zero new dependencies and no network requests.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/jsonc-to-json',
    iconName: 'Braces',
    tags: ['JSONC', 'JSON', '注释剥离', '尾随逗号', '配置文件', '格式化'],
    tagsEn: ['JSONC', 'JSON', 'Comment Stripping', 'Trailing Comma', 'Config', 'Formatter'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput:
      '{\n  // 编译器配置（示例）\n  "compilerOptions": {\n    "strict": true,\n    "target": "ES2020",\n  },\n  /* 包含的文件 */\n  "include": ["src/**/*.ts",],\n}',
    doc: {
      zh: {
        whatIsIt:
          'JSONC 转标准 JSON 是一款纯浏览器本地运行的文本清洗工具。JSONC（JSON with Comments）允许在 JSON 中书写 // 行注释、/* */ 块注释并容忍对象或数组末尾的尾随逗号，常见于 VS Code 的 settings.json、tsconfig.json 等配置；但标准 JSON.parse 无法直接解析它。本工具通过逐字符词法扫描剥离这些非标准语法，输出严格合法、可直接被任何 JSON 解析器消费的文本。',
        coreFeatures: [
          '注释剥离：移除 // 行注释与 /* */ 块注释（含跨行块注释），未闭合块注释会明确报错',
          '尾随逗号清理：删除对象与数组中 } 或 ] 之前的最后一个逗号，保留正常分隔逗号',
          '字符串安全：词法扫描正确跳过双引号字符串与 \" 转义，字符串内的 //、/*、逗号原样保留',
          '严格校验：清洗后经 JSON.parse 验证，非法结构直接展示解析器原始报错与行列信息',
          '三种排版：输出可选 2 空格缩进、4 空格缩进或压缩为单行',
          '纯本地处理：零新增依赖，输入内容不上传、不离开设备',
        ],
        howToUse: [
          '在左侧文本框粘贴 JSONC / 宽松 JSON 文本，右侧立即实时显示转换结果',
          '通过顶部切换按钮选择输出缩进：2 空格、4 空格或压缩单行',
          '点击「载入示例」可查看一份带注释与尾随逗号的 tsconfig 风格样例',
          '结果合法时点击「复制」获取标准 JSON；若存在语法错误，右侧会展示错误原因',
        ],
        useCases: [
          '前端工程：清理 tsconfig.json、VS Code settings.json 等带注释配置后交给脚本或接口消费',
          '接口调试：把文档中带注释说明的 JSON 示例转为可直接粘贴到 Postman / curl 的严格 JSON',
          '数据处理：作为 ETL 或导入流程的预处理步骤，将人工维护的宽松配置转为机器可读 JSON',
        ],
        privacyNote:
          '所有词法扫描、解析与序列化均在浏览器本地完成，不发起任何网络请求，粘贴的配置与数据不会离开设备。',
        faqs: [
          {
            question: '字符串里的 // 或 /* 会被误删吗？',
            answer:
              '不会。工具采用逐字符词法扫描，进入双引号字符串后其中的 //、/*、逗号都按普通字符处理，并正确识别反斜杠转义的 \"，因此类似 "url": "https://example.com" 中的内容会完整保留。',
          },
          {
            question: '它能修复单引号或没加引号的键名吗？',
            answer:
              '不能。本工具只负责剥离注释与尾随逗号两类 JSONC 语法，不会把单引号改成双引号，也不会给键名补引号。需要这些字面修复时可配合「JSON 格式化」工具的修复功能使用。',
          },
          {
            question: '剥离注释后报错行列号对不上原文怎么办？',
            answer:
              '注释在清洗时会被替换为等长空白（并保留换行），因此清洗后文本的行列位置与原文一致，JSON.parse 报错指向的行列号可直接对照原文定位。',
          },
        ],
      },
      en: {
        whatIsIt:
          'JSONC to JSON Converter is a fully browser-local text-cleaning tool. JSONC (JSON with Comments) permits // line comments, /* */ block comments and trailing commas in objects and arrays, as seen in VS Code settings.json or tsconfig.json, but strict JSON.parse cannot read it. This tool performs a character-by-character lexical scan to strip those non-standard constructs and emits strict JSON that any conforming parser can consume.',
        coreFeatures: [
          'Comment stripping: removes // line comments and /* */ block comments (including multi-line ones); an unclosed block comment is reported explicitly',
          'Trailing-comma cleanup: deletes the final comma before } or ] in objects and arrays while keeping normal separator commas',
          'String-safe: the scanner skips double-quoted strings and escaped \" so //, /* and commas inside strings are preserved verbatim',
          'Strict validation: the cleaned text is checked with JSON.parse; invalid structures surface the parser error with its position',
          'Three layouts: output with 2-space indent, 4-space indent or a single minified line',
          '100% local: zero new dependencies; input is never uploaded and never leaves the device',
        ],
        howToUse: [
          'Paste JSONC / lenient JSON into the left textarea; the strict result appears on the right in real time',
          'Use the top toggle to choose 2-space indent, 4-space indent or minified single-line output',
          'Click “Load sample” for a tsconfig-style example with comments and trailing commas',
          'When the result is valid, click Copy; if there is a syntax error, the reason is shown on the right',
        ],
        useCases: [
          'Front-end work: clean commented configs such as tsconfig.json or VS Code settings.json before feeding them to scripts or APIs',
          'API debugging: turn commented JSON examples from documentation into strict JSON ready for Postman or curl',
          'Data pipelines: preprocess human-maintained lenient config into machine-readable JSON for ETL or import jobs',
        ],
        privacyNote:
          'All scanning, parsing and serialization happen locally in your browser. No network requests are made, so pasted configs and data never leave your device.',
        faqs: [
          {
            question: 'Will // or /* inside strings be removed by mistake?',
            answer:
              'No. The tool scans character by character; inside a double-quoted string the sequences //, /* and commas are treated as ordinary characters, and backslash-escaped quotes are handled correctly, so a value such as "url": "https://example.com" is preserved intact.',
          },
          {
            question: 'Can it fix single quotes or unquoted keys?',
            answer:
              'No. It only strips the two JSONC constructs—comments and trailing commas. It does not convert single quotes to double quotes or add quotes around keys; for those literal repairs use the JSON Formatter’s repair feature instead.',
          },
          {
            question: 'Why do error positions still match my original text after comments are removed?',
            answer:
              'Each comment is replaced by spaces of the same length while newlines are kept, so line and column positions in the cleaned text are identical to the original; the line/column reported by JSON.parse can therefore be located directly in your input.',
          },
        ],
      },
    },
  },
  {
    slug: 'unified-social-credit-code',
    name: '统一社会信用代码校验与解析器',
    nameEn: 'Unified Social Credit Code Validator',
    description:
      '依据 GB 32100-2015 校验 18 位法人和其他组织统一社会信用代码：检查长度与 31 字符字符集（0-9 与 A-Z 去除 I、O、Z、S、V），按固定加权因子以 31 为模验证末位校验码，并逐段解析登记管理部门、机构类别、登记管理机关行政区划（省级）与 9 位主体标识码（组织机构代码）。适用于企业信息录入、表单校验与数据清洗。纯浏览器本地确定性计算、零新增依赖、不发起网络请求。',
    descriptionEn:
      'Validate 18-character Unified Social Credit Codes for legal entities per GB 32100-2015: checks length and the 31-character alphabet (0-9 and A-Z excluding I, O, Z, S, V), verifies the final check character with fixed weights modulo 31, and breaks the code into its registration department, organization category, administrative division (province level) and the 9-digit subject identifier (organization code). Built for business data entry, form validation and data cleansing. Fully local deterministic computation in the browser with zero new dependencies and no network requests.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/unified-social-credit-code',
    iconName: 'ShieldCheck',
    tags: ['统一社会信用代码', '校验', 'GB 32100', '组织机构代码', '表单校验', '中国'],
    tagsEn: ['USCC', 'Validation', 'GB 32100', 'Organization Code', 'Form Validation', 'China'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '91110108551385082Q',
    doc: {
      zh: {
        whatIsIt:
          '统一社会信用代码校验与解析器是一款纯浏览器本地运行的法人身份代码工具。统一社会信用代码是中国境内法人和其他组织的唯一身份标识，依据 GB 32100-2015 由 1 位登记管理部门代码、1 位机构类别代码、6 位登记管理机关行政区划码、9 位主体标识码（组织机构代码）与 1 位校验码共 18 位组成。本工具按官方加权模 31 算法判断合法性，并把各段结构解析为可读信息。',
        coreFeatures: [
          '严格校验：长度必须 18 位，字符仅限 31 字符字符集（剔除易混淆的 I、O、Z、S、V）',
          '校验码验证：前 17 位按 GB 32100-2015 固定加权因子求和、模 31 换算末位，并在错误时给出正确值',
          '结构解析：拆解登记管理部门（机构编制 / 民政 / 市场监管等）与机构类别（企业 / 事业单位 / 社会团体等）',
          '行政区划识别：6 位行政区划码按 GB/T 2260 前两位识别省 / 自治区 / 直辖市',
          '主体标识：单独展示第 9–17 位组织机构代码',
          '容错与隐私：自动去除首尾空白并转大写；全部计算本地完成，不上传任何信息',
        ],
        howToUse: [
          '在输入框粘贴 18 位统一社会信用代码（小写或带空格会自动规范化）',
          '合法时显示绿色「校验通过」并列出部门、类别、行政区划、主体标识、校验码',
          '非法时显示红色提示，说明长度、非法字符位置或正确的校验码',
          '下方彩色分段标签直观标注五个组成段的边界',
        ],
        useCases: [
          '企业信息录入：在开户、合同、发票等系统中实时校验对方提供的信用代码',
          '表单开发：前端表单字段校验，避免明显错误的代码进入后端',
          '数据清洗：批量排查存量企业档案中抄录错误或校验位错误的代码',
        ],
        privacyNote:
          '校验与解析均为浏览器本地确定性计算，不发起任何网络请求，输入的代码不会离开设备。',
        faqs: [
          {
            question: '校验码是怎么计算的？',
            answer:
              '将前 17 位字符按 31 进制取值（字符集 0123456789ABCDEFGHJKLMNPQRTUWXY 的下标），分别乘以固定加权因子 1、3、9、27……28 后求和；用 31 减去总和对 31 取模的结果（结果为 31 时取 0），换算回字符集中的字符即为第 18 位校验码。',
          },
          {
            question: '为什么代码里看不到字母 I、O、Z、S、V？',
            answer:
              '为避免与数字 1、0、2、5、8（及字母 U）混淆，GB 32100-2015 的字符集从 0-9 加 A-Z 中剔除了 I、O、Z、S、V 共 5 个字母，只保留 31 个字符，与 31 进制运算一一对应。',
          },
          {
            question: '校验通过能否证明这家企业真实存在？',
            answer:
              '不能。本工具只验证代码本身的编码规则与校验位是否自洽，不联网查询企业登记数据库。校验通过仅说明代码格式合法，企业是否存续、名称是否匹配需以国家企业信用信息公示系统等官方渠道为准。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Unified Social Credit Code Validator is a fully browser-local tool for the legal-entity identifier used in China. Per GB 32100-2015 the 18-character code consists of a registration department digit, an organization category digit, a 6-digit administrative division code, a 9-digit subject identifier (organization code) and one check character. The tool applies the official weighted modulo-31 algorithm to judge validity and decodes every segment into readable information.',
        coreFeatures: [
          'Strict validation: exactly 18 characters using only the 31-character alphabet (confusable I, O, Z, S, V excluded)',
          'Check character: the first 17 characters are weighted by the fixed GB 32100-2015 factors, summed modulo 31; on mismatch the correct character is shown',
          'Structural decoding: identifies the registration department (institutional staffing, civil affairs, market regulation, etc.) and category (enterprise, public institution, social organization, etc.)',
          'Region detection: resolves the first two digits of the 6-digit GB/T 2260 division code to province / region / municipality',
          'Subject identifier: displays the 9-character organization code (positions 9–17) separately',
          'Forgiving and private: trims surrounding whitespace and uppercases automatically; everything runs locally with no uploads',
        ],
        howToUse: [
          'Paste an 18-character code into the input (lowercase and surrounding spaces are normalized automatically)',
          'A valid code shows a green “valid” banner plus department, category, region, subject ID and check character',
          'An invalid code shows a red message explaining the length issue, the illegal character position, or the correct check character',
          'The colored segment tags underneath mark the boundaries of the five components',
        ],
        useCases: [
          'Business onboarding: validate codes supplied by counterparties for accounts, contracts or invoicing',
          'Form development: front-end field validation before obviously wrong codes reach the backend',
          'Data cleansing: find transcription and check-digit errors in archived company records',
        ],
        privacyNote:
          'Validation and parsing are deterministic, fully local browser computations. No network requests are made and entered codes never leave your device.',
        faqs: [
          {
            question: 'How is the check character calculated?',
            answer:
              'Each of the first 17 characters is mapped to its base-31 value (index in 0123456789ABCDEFGHJKLMNPQRTUWXY), multiplied by the fixed weights 1, 3, 9, 27 … 28 and summed; 31 minus the sum modulo 31 (0 when the result would be 31) gives a value mapped back to the alphabet as the 18th character.',
          },
          {
            question: 'Why do the letters I, O, Z, S and V never appear?',
            answer:
              'To avoid confusion with the digits 1, 0, 2 and 5 (and the letter U), the GB 32100-2015 alphabet removes I, O, Z, S and V from 0-9 plus A-Z, leaving exactly 31 characters that map one-to-one to base-31 values.',
          },
          {
            question: 'Does passing validation prove the company exists?',
            answer:
              'No. The tool only checks that the code is self-consistent under the coding and check-digit rules; it does not query any company registry online. A valid result means the format is correct—existence and name matches must be confirmed through official channels such as the National Enterprise Credit Information Publicity System.',
          },
        ],
      },
    },
  },
  {
    slug: 'id-card-validator',
    name: '身份证号码校验与升位器',
    nameEn: 'Chinese ID Number Validator & Upgrade',
    description:
      '依据 GB 11643-1999 校验 18 位居民身份证号：检查 18 位结构、出生日期真实性（含闰年）与 ISO 7064 MOD 11-2 加权校验码（末位可为 X），并解析出生日期、性别与 6 位行政区划码；支持 15 位旧号码在第 6 位后插入 19 自动升位为 18 位，支持逐条与逐行批量校验，非法行带行号提示。适用于表单校验开发、测试数据构造与数据质量核对。纯浏览器本地确定性计算、零新增依赖、不发起网络请求（仅做格式与算法校验，不内置行政区划名称表）。',
    descriptionEn:
      'Validate 18-digit Chinese resident identity card numbers per GB 11643-1999: checks the 18-digit structure, a real date of birth (including leap years) and the ISO 7064 MOD 11-2 weighted check digit (last character may be X), and parses birth date, gender and the 6-digit administrative division code. Legacy 15-digit numbers are upgraded to 18 digits by inserting 19 after the 6th digit, with single-item and line-by-line batch processing and line-numbered warnings. Built for form validation, test data construction and data quality checks. Fully local deterministic computation in the browser with zero new dependencies and no network requests (format/algorithm validation only, no embedded division-name table).',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/id-card-validator',
    iconName: 'Fingerprint',
    tags: ['身份证', '校验', 'GB 11643', '升位', '表单校验', '中国'],
    tagsEn: ['ID Card', 'Validation', 'GB 11643', 'Upgrade', 'Form Validation', 'China'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '110105194912318013\n110105491231801\n11010520210229001X',
    doc: {
      zh: {
        whatIsIt:
          '身份证号码校验与升位器是一款纯浏览器本地运行的中国居民身份证号工具。18 位身份证号由 6 位行政区划码、8 位出生日期（YYYYMMDD）、3 位顺序码与 1 位校验码构成，校验码依据 GB 11643-1999 的 ISO 7064 MOD 11-2 加权算法计算，取值为数字或 X。本工具据此判定号码是否自洽，并把字段解析为可读信息；对早期 15 位旧证号码，可按规则插入世纪位 19 并补全校验码，升位为 18 位。',
        coreFeatures: [
          '18 位校验：结构、出生日期真实性（含闰年 2 月 29 日）与加权校验码逐项检查，校验码错误时给出正确值',
          '15 位升位：在第 6 位行政区划码后插入 19，再按 17 位本体计算末位校验码',
          '字段解析：展示出生日期、性别（顺序码末位奇男偶女）与 6 位行政区划码',
          '批量处理：每行一个号码，合法行输出结构化结果，非法行保留原文并带行号告警',
          '容错与隐私：容忍空白、末位 x 自动转大写；全部计算本地完成，不收集任何输入',
        ],
        howToUse: [
          '在输入框粘贴一个或每行一个身份证号码',
          '18 位号码输出「校验通过」与出生日期、性别、行政区划码；校验码错误时同时给出正确号码',
          '15 位旧证号码自动升位，输出形如「原号 → 18 位新号」',
          '非法行在下方黄色告警中按行号说明原因（长度、字符、日期或校验码）',
        ],
        useCases: [
          '表单校验开发：在注册、实名等表单中复用该校验逻辑构造测试用例',
          '测试数据构造：由 15 位测试号码批量生成合法 18 位号码',
          '数据质量核对：排查存量数据中抄录错误、出生日期非法或校验位错误的号码',
        ],
        privacyNote:
          '校验与升位均为浏览器本地确定性计算，不发起任何网络请求，输入的号码不会离开设备。',
        faqs: [
          {
            question: '校验码是怎么计算的？',
            answer:
              '将前 17 位分别乘以固定加权因子 7、9、10、5、8、4、2、1、6、3、7、9、10、5、8、4、2 后求和，对 11 取模，再以字符串 "10X98765432" 的对应位取值——余数 0 对应 1、余数 2 对应 X，依此类推，即为第 18 位校验码。',
          },
          {
            question: '15 位旧号码是如何升位为 18 位的？',
            answer:
              '15 位号码为 6 位行政区划码 + 6 位两位年出生日期 + 3 位顺序码，没有校验码。升位时在第 6 位后插入世纪位 "19"（旧证均签发于 1900 年代），得到 17 位本体，再按 18 位算法计算并追加校验码。',
          },
          {
            question: '校验通过能否证明这个人真实存在？',
            answer:
              '不能。本工具只验证号码自身的编码规则与校验位是否自洽，不联网查询公安数据库，也不内置行政区划名称表。校验通过仅说明格式合法，个人身份真实性须以官方渠道核验为准。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Chinese ID Number Validator & Upgrade is a fully browser-local tool for Chinese resident identity card numbers. An 18-digit number consists of a 6-digit administrative division code, an 8-digit birth date (YYYYMMDD), a 3-digit sequence code and one check digit computed with the ISO 7064 MOD 11-2 weighted algorithm defined in GB 11643-1999; the check digit is a digit or X. The tool judges whether a number is self-consistent and decodes its fields, and upgrades early 15-digit numbers to 18 digits by inserting the century digits 19 and computing a check digit.',
        coreFeatures: [
          '18-digit validation: structure, a real birth date (including February 29 in leap years) and the weighted check digit are checked one by one; the correct check digit is shown on mismatch',
          '15-digit upgrade: inserts 19 after the 6th digit and computes the final check digit over the resulting 17-digit body',
          'Field decoding: shows birth date, gender (odd sequence-code ending = male, even = female) and the 6-digit division code',
          'Batch processing: one number per line; valid lines emit structured output and invalid lines keep their text with line-numbered warnings',
          'Forgiving and private: tolerates whitespace and uppercases a trailing x; everything runs locally with no collection of input',
        ],
        howToUse: [
          'Paste a single number or one number per line into the input box',
          '18-digit numbers return “validation passed” with birth date, gender and division code; a wrong check digit also yields the corrected number',
          '15-digit legacy numbers are upgraded automatically as “original → 18-digit number”',
          'Invalid lines are explained by line number in the yellow warnings below (length, characters, date or check digit)',
        ],
        useCases: [
          'Form validation: reuse the rules to build test cases for registration and real-name forms',
          'Test data construction: turn 15-digit test numbers into batches of valid 18-digit numbers',
          'Data quality checks: find transcription errors, impossible birth dates and bad check digits in stored data',
        ],
        privacyNote:
          'Validation and upgrade are deterministic, fully local browser computations. No network requests are made and entered numbers never leave your device.',
        faqs: [
          {
            question: 'How is the check digit calculated?',
            answer:
              'Multiply the first 17 digits by the fixed weights 7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, sum them and take modulo 11. The remainder indexes the string "10X98765432"—remainder 0 maps to 1, remainder 2 maps to X, and so on—giving the 18th check digit.',
          },
          {
            question: 'How is a 15-digit number upgraded to 18 digits?',
            answer:
              'A 15-digit number has a 6-digit division code, a 6-digit two-digit-year birth date and a 3-digit sequence code, with no check digit. The upgrade inserts the century digits "19" after the 6th digit (legacy cards were issued in the 1900s), producing a 17-digit body, then computes and appends the 18-digit check digit.',
          },
          {
            question: 'Does passing validation prove the person exists?',
            answer:
              'No. The tool only checks that the number is self-consistent under the coding and check-digit rules; it queries no public-security database and embeds no division-name table. A valid result means the format is correct—identity must be verified through official channels.',
          },
        ],
      },
    },
  },
  {
    slug: 'ip-address-converter',
    name: 'IP 地址格式互转器',
    nameEn: 'IP Address Format Converter',
    description:
      '在 IPv4 点分十进制与 32 位无符号整数 / 十六进制 / 二进制之间双向转换，并把 IPv6 压缩形式（::）解析为 128 位大整数后输出完整展开、RFC 5952 压缩形式、十六进制整数与 128 位二进制，支持末尾内嵌 IPv4（如 ::ffff:192.168.0.1）。支持逐条与逐行批量转换，非法行带行号提示。适用于数据库 IP 整型存储（inet_aton 类场景）、日志字段解析与 ACL 配置核对。BigInt 运算无精度损失，纯浏览器本地确定性计算、零新增依赖、不发起网络请求。',
    descriptionEn:
      'Convert IPv4 dotted-decimal addresses to and from 32-bit unsigned integers, hexadecimal and binary, and parse compressed IPv6 forms (::) into a 128-bit big integer, emitting the fully expanded form, the RFC 5952 compressed form, hexadecimal integer and 128-bit binary. A trailing embedded IPv4 (e.g. ::ffff:192.168.0.1) is supported. Offers single-item and line-by-line batch conversion with line-numbered warnings for invalid lines. Built for integer-column IP storage (inet_aton-style scenarios), log field parsing and ACL configuration checks. BigInt arithmetic avoids precision loss; fully local deterministic computation in the browser with zero new dependencies and no network requests.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/ip-address-converter',
    iconName: 'Globe',
    tags: ['IP 地址', 'IPv4', 'IPv6', 'BigInt', '网络', '格式转换'],
    tagsEn: ['IP Address', 'IPv4', 'IPv6', 'BigInt', 'Network', 'Format Conversion'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '192.168.0.1\n0.0.0.0\n2001:db8::1\n::ffff:192.168.0.1',
    doc: {
      zh: {
        whatIsIt:
          'IP 地址格式互转器是一款纯浏览器本地运行的网络地址工具。IPv4 地址由四个 0–255 的十进制段组成，唯一对应一个 32 位无符号整数，因此可以表示为点分十进制、十进制整数、十六进制或二进制；IPv6 地址为 128 位，常用连续零组压缩记号 :: 缩短书写。本工具在这些表示之间做确定性互转，IPv6 输出遵循 RFC 5952 规范形式（最长零组压缩、小写十六进制），128 位运算全部基于 BigInt，不存在大整数精度丢失。',
        coreFeatures: [
          'IPv4 互转：点分十进制 ↔ uint32 十进制整数 / 0x 十六进制 / 32 位二进制，逐段校验 0–255 并拒绝前导零歧义',
          'IPv6 解析：支持完整形式、:: 压缩形式（含首尾 :: 与 :: 自身）及末尾内嵌 IPv4',
          'IPv6 规范化：输出 8 组四位十六进制完整展开与 RFC 5952 压缩形式（最长零组、并列取最前）',
          '批量处理：每行一个地址，合法行输出全部表示形式，非法行保留原文并带行号告警',
          '纯本地计算：BigInt 运算无精度损失，不发起任何网络请求，不收集输入',
        ],
        howToUse: [
          '在输入框填入一个 IP 地址或每行一个地址（IPv4 或 IPv6 均可）',
          '输出区即时展示规范形式、完整展开、十进制整数、十六进制与二进制',
          'IPv6 压缩地址会自动还原为完整 8 组，再重新压缩以便比对规范形式',
          '非法行在下方黄色告警中按行号说明原因，不影响其他行的转换',
        ],
        useCases: [
          '数据库整型存储：在点分地址与 INT/UNSIGNED 列整数之间换算（IPv4），核对 inet_aton/inet_ntoa 结果',
          '日志与抓包分析：把整数或十六进制地址字段还原为可读的点分 / 冒分形式',
          '网络配置核对：验证 ACL、路由表中的 IPv6 压缩写法是否等价于目标地址',
        ],
        privacyNote:
          '所有解析与换算均为浏览器本地确定性计算，不发起任何网络请求，输入的地址不会离开设备。',
        faqs: [
          {
            question: '为什么输入 01.1.1.1 被判为非法？',
            answer:
              '部分系统的 inet_aton 会把前导零的段按八进制解释（如 010 等于 8），这与十进制直觉不一致且容易造成 ACL 绕过。为避免歧义，本工具只接受单段 0 或无前导零的十进制写法。',
          },
          {
            question: 'IPv6 的压缩形式是按什么规则选 :: 位置的？',
            answer:
              '遵循 RFC 5952：将最长的连续一个或多个全零 16 位组序列替换为 ::，长度至少为 2 组才压缩；出现等长序列时压缩最靠前的一个，其余单组零保留为 0，十六进制字母使用小写。',
          },
          {
            question: 'IPv6 的十进制整数会不会超出安全整数范围？',
            answer:
              '会，IPv6 是 128 位整数，远超 JavaScript Number 的安全整数上限（2^53-1）。本工具内部全程使用 BigInt 运算，输出的十进制与十六进制文本均为精确值，没有精度损失。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The IP Address Format Converter is a fully browser-local networking tool. An IPv4 address consists of four decimal octets from 0 to 255 and maps uniquely to a 32-bit unsigned integer, so it can be written as dotted decimal, a decimal integer, hexadecimal or binary. An IPv6 address is 128 bits wide and is commonly shortened with the :: zero-compression notation. The tool converts deterministically among these representations; IPv6 output follows the RFC 5952 canonical form (longest zero-run compressed, lowercase hexadecimal), and all 128-bit arithmetic uses BigInt, so no precision is lost.',
        coreFeatures: [
          'IPv4 conversion: dotted decimal ↔ uint32 decimal integer / 0x hexadecimal / 32-bit binary, with per-octet 0–255 validation and rejection of ambiguous leading zeros',
          'IPv6 parsing: full form, :: compression (including leading/trailing :: and :: itself) and a trailing embedded IPv4',
          'IPv6 normalization: emits the 8-group four-digit expansion and the RFC 5952 compressed form (longest zero run, first on tie)',
          'Batch processing: one address per line; valid lines emit every representation and invalid lines keep their text with line-numbered warnings',
          'Local computation: BigInt arithmetic with no precision loss, no network requests and no input collection',
        ],
        howToUse: [
          'Enter one IP address or one address per line (IPv4 or IPv6) in the input box',
          'The output instantly shows the canonical form, full expansion, decimal integer, hexadecimal and binary',
          'Compressed IPv6 addresses are expanded into the full 8 groups and recompressed for comparison',
          'Invalid lines are explained by line number in the yellow warnings below without affecting other lines',
        ],
        useCases: [
          'Integer-column storage: convert between dotted addresses and INT/UNSIGNED column values (IPv4), checking inet_aton/inet_ntoa results',
          'Log and packet analysis: turn integer or hexadecimal address fields back into readable dotted/colon form',
          'Configuration checks: verify that compressed IPv6 in ACLs or routing tables is equivalent to the intended address',
        ],
        privacyNote:
          'All parsing and conversion are deterministic, fully local browser computations. No network requests are made and entered addresses never leave your device.',
        faqs: [
          {
            question: 'Why is 01.1.1.1 rejected?',
            answer:
              'Some inet_aton implementations interpret a leading-zero octet as octal (e.g. 010 equals 8), which disagrees with decimal intuition and can lead to ACL bypasses. To remove that ambiguity the tool accepts only a lone 0 or decimal octets without leading zeros.',
          },
          {
            question: 'How is the position of :: chosen for IPv6?',
            answer:
              'Per RFC 5952, the longest sequence of one or more all-zero 16-bit groups is replaced by :: and it must be at least two groups long; ties compress the earliest sequence, isolated zero groups stay as 0, and hexadecimal letters are lowercase.',
          },
          {
            question: 'Can the IPv6 decimal integer exceed the safe-integer range?',
            answer:
              'Yes—IPv6 is a 128-bit integer, far beyond the JavaScript Number safe limit (2^53-1). The tool performs all arithmetic with BigInt, so the emitted decimal and hexadecimal text is exact with no precision loss.',
          },
        ],
      },
    },
  },
  {
    slug: 'boolean-truth-table',
    name: '布尔表达式真值表生成器',
    nameEn: 'Boolean Truth Table Generator',
    description:
      '输入 2–8 个变量的布尔表达式，自动完成词法 / 语法分析并按 2^n 枚举生成完整真值表，支持 AND / OR / NOT / XOR、蕴含（->）、等价（<->）及括号，兼容 &&、||、!、^、·、+ 等常见写法与大小写不敏感关键字；多条表达式同表对比，自动判定重言式（永真）/ 矛盾式（永假）/ 可满足式，语法错误带列号提示且不抛异常。适用于数字逻辑、离散数学学习与复杂条件逻辑核对。纯浏览器本地计算，自实现轻量递归下降解析器，零新增依赖、不发起网络请求。',
    descriptionEn:
      'Enter boolean expressions with 2–8 variables and get a complete truth table built by lexing, parsing and 2^n assignment enumeration. Supports AND / OR / NOT / XOR, implication (->), equivalence (<->) and parentheses, along with &&, ||, !, ^, ·, + spellings and case-insensitive keywords. Several expressions can share one table for comparison, and each is classified as a tautology, contradiction or contingent formula; syntax errors report a column and never throw. Built for digital logic and discrete-math study and for checking complex conditional logic. Runs fully locally in the browser with a small hand-written recursive-descent parser, zero new dependencies and no network requests.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/boolean-truth-table',
    iconName: 'Sigma',
    tags: ['布尔逻辑', '真值表', '离散数学', '表达式解析', '数字逻辑', '教学工具'],
    tagsEn: ['Boolean Logic', 'Truth Table', 'Discrete Math', 'Expression Parser', 'Digital Logic', 'Learning'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'A AND B\nA OR NOT A\nA XOR B\nA -> B\nA <-> B',
    doc: {
      zh: {
        whatIsIt:
          '布尔表达式真值表生成器是一款纯浏览器本地运行的逻辑演算工具。给定含若干命题变量（A–Z 命名）的表达式，工具先通过自实现的词法分析器切分出变量、关键字与运算符，再用递归下降解析器构建抽象语法树，最后对全部变量按 2^n 种取值组合逐一求值，输出教科书式排列的真值表（首个变量为最高位，取值按 00、01、10、11 递增），并依据真值列判定表达式是重言式、矛盾式还是可满足式。',
        coreFeatures: [
          '完整运算符：AND（&、&&、·、AND）、OR（|、||、+、OR）、NOT（!、~、NOT）、XOR（^、XOR）、蕴含 ->、等价 <-> / <=>，支持括号与大小写不敏感关键字',
          '确定性优先级：NOT > AND > XOR > OR > 蕴含 > 等价（遵循 C/JS/Python 对 ^ 位于 & 与 | 之间的约定），蕴含右结合、其余二元运算符左结合',
          '2^n 全枚举：变量 2–8 个，自动生成 4–256 行真值表，多表达式同表逐行对比中间结果',
          '性质判定：按真值列自动标注重言式（永真）、矛盾式（永假）、可满足式',
          '友好错误：非法字符、括号未闭合、缺少操作数、多余内容等均带列号以错误提示返回而非抛出异常',
        ],
        howToUse: [
          '每行输入一条布尔表达式，变量为字母或下划线开头的标识符（如 A、x1、enable）',
          '真值表即时渲染：左侧为各变量取值列（T/F），右侧为每条表达式的结果列，列标题即表达式原文',
          '表格下方的标签给出每条表达式的性质：重言式 / 矛盾式 / 可满足式',
          '点击「复制」可把整张表以制表符分隔文本复制到剪贴板，便于粘贴进文档或表格软件',
        ],
        useCases: [
          '离散数学 / 数字逻辑课程练习：验证德摩根律、分配律、蕴含析取式 A -> B 等价于 NOT A OR B 等恒等式',
          '编程条件核对：把复杂的 if 条件（与、或、异或、取反）枚举成表，确认边界取值下的分支行为',
          '逻辑电路与化简：对比原表达式与等价改写式在每一行的输出是否一致，再决定是否可化简',
        ],
        privacyNote:
          '所有词法分析、解析与枚举求值均在浏览器本地完成，不发起任何网络请求，输入的表达式不会离开设备。',
        faqs: [
          {
            question: '为什么 A | B ^ C 被解析成 A | (B ^ C) 而不是 (A | B) ^ C？',
            answer:
              '运算符优先级遵循 C / JavaScript / Python 的通用约定：AND（&）高于 XOR（^），XOR 又高于 OR（|）。因此异或会先于或运算结合；若需要其他结合方式，请显式加括号。',
          },
          {
            question: '为什么至少要输入 2 个变量？',
            answer:
              '真值表的价值在于展示多变量组合下单变量无法体现的逻辑关系。若只输入一个变量（如 A AND NOT A），工具会提示变量不足；常量性质（永真 / 永假）请至少引入一个无关变量或改用多条表达式对比。',
          },
          {
            question: '支持哪些变量名和关键字写法？',
            answer:
              '变量名是以字母或下划线开头、后跟字母数字下划线的标识符；AND、OR、NOT、XOR 四个关键字大小写不敏感（and、And 均可）。注意 AND/OR/NOT/XOR 是保留字，不能作为变量名。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Boolean Truth Table Generator is a logic-calculation tool that runs entirely in the browser. Given expressions over propositional variables, it first tokenizes variables, keywords and operators with a hand-written lexer, builds an AST with a recursive-descent parser, and then evaluates every one of the 2^n variable assignments. The result is a textbook-ordered truth table (first variable is the most significant bit: 00, 01, 10, 11, …) plus a verdict for each expression: tautology, contradiction or contingent.',
        coreFeatures: [
          'Full operator set: AND (&, &&, ·, AND), OR (|, ||, +, OR), NOT (!, ~, NOT), XOR (^, XOR), implication -> and equivalence <-> / <=>, with parentheses and case-insensitive keywords',
          'Deterministic precedence: NOT > AND > XOR > OR > implication > equivalence (following the C/JS/Python placement of ^ between & and |); implication is right-associative and the other binary operators are left-associative',
          'Full 2^n enumeration: 2–8 variables produce 4–256 rows, and several expressions share one table for row-by-row comparison',
          'Property classification: each column is tagged as tautology (always true), contradiction (always false) or contingent',
          'Friendly errors: illegal characters, unclosed parentheses, missing operands and trailing content are reported with a column number instead of throwing',
        ],
        howToUse: [
          'Enter one boolean expression per line; variable names are identifiers starting with a letter or underscore (e.g. A, x1, enable)',
          'The truth table renders instantly: the left columns show variable assignments (T/F) and the right columns show each expression result, titled with the raw expression',
          'Tags below the table classify every expression as a tautology, contradiction or contingent formula',
          'Click Copy to copy the whole table as tab-separated text for a document or spreadsheet',
        ],
        useCases: [
          'Discrete-math / digital-logic practice: verify De Morgan’s laws, distributivity and identities such as A -> B being equivalent to NOT A OR B',
          'Checking program conditions: enumerate complex if-conditions (and/or/xor/not) to confirm branch behavior at boundary values',
          'Circuit simplification: compare an expression with a rewritten equivalent row by row before simplifying',
        ],
        privacyNote:
          'All lexing, parsing and enumeration happen locally in the browser. No network requests are made and entered expressions never leave your device.',
        faqs: [
          {
            question: 'Why is A | B ^ C parsed as A | (B ^ C) instead of (A | B) ^ C?',
            answer:
              'Precedence follows the common C / JavaScript / Python convention: AND (&) binds tighter than XOR (^), which binds tighter than OR (|). XOR therefore groups before OR; add explicit parentheses when you need another grouping.',
          },
          {
            question: 'Why are at least 2 variables required?',
            answer:
              'A truth table is meant to show logical relationships over combinations that a single variable cannot express. An expression with one variable (such as A AND NOT A) triggers a not-enough-variables message; use at least two variables or compare several expressions instead.',
          },
          {
            question: 'What variable names and keyword spellings are supported?',
            answer:
              'Variables are identifiers starting with a letter or underscore followed by letters, digits or underscores. The keywords AND, OR, NOT and XOR are case-insensitive (and, And both work) and are reserved, so they cannot be used as variable names.',
          },
        ],
      },
    },
  },
  {
    slug: 'iso-week-date-converter',
    name: 'ISO 8601 周边历双向转换器',
    nameEn: 'ISO 8601 Week Date Converter',
    description:
      '在 ISO 8601 周边历（如 2026-W44-4）与公历 YYYY-MM-DD 之间双向转换：输入公历日期自动算出 ISO 周年号、周序号（1–53）、星期几与规范串；输入 YYYY-Www-D 反查公历日期；自动标注该 ISO 年含 52 还是 53 周（长年），并对跨年周边界（如 2021-01-01 属 2020-W53-5、2023-01-01 属 2022-W52-7）给出归属提示。支持逐行批量、自动识别方向，W54、星期 8、2 月 30 日等非法输入带行号报错。适用于财务结算周、教育周次与跨境协作周历核对。纯本地确定性计算（序数日算法、不涉及时区），零新增依赖、不发起网络请求。',
    descriptionEn:
      'Convert between ISO 8601 week dates (e.g. 2026-W44-4) and Gregorian YYYY-MM-DD dates in both directions. A Gregorian date yields the ISO week-year, week number (1–53), weekday and canonical string; a YYYY-Www-D value maps back to a Gregorian date. The tool marks whether the ISO year has 52 or 53 weeks (a long year) and explains cross-year boundaries (e.g. 2021-01-01 is 2020-W53-5 and 2023-01-01 is 2022-W52-7). It processes many lines at a time, auto-detects direction, and reports invalid input such as W54, weekday 8 or February 30 with line numbers. Built for fiscal settlement weeks, academic week numbering and cross-border calendar alignment. Fully local deterministic computation on ordinal days (no time zones), with zero new dependencies and no network requests.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/iso-week-date-converter',
    iconName: 'Clock',
    tags: ['ISO 8601', '周边历', '日期转换', '周次', '公历', '跨年'],
    tagsEn: ['ISO 8601', 'Week Date', 'Date Conversion', 'Week Number', 'Gregorian', 'Cross-Year'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '2026-10-29\n2021-01-01\n2023-01-01\n2020-01-01\n2026-W44-4\n2020-W53-5',
    doc: {
      zh: {
        whatIsIt:
          'ISO 8601 周边历双向转换器是一款纯浏览器本地运行的日期工具。ISO 周边历用「周年号 + 周序号 + 星期」标识日期（形如 2026-W44-4），规则是周一为每周第一天、包含 1 月 4 日的那一周为第 1 周。由于公历年与 ISO 年并不对齐，年初年末的日期可能归属相邻的 ISO 年（例如 2021-01-01 其实是 2020 年第 53 周的周五）。本工具基于公历序数日做确定性换算，不依赖 Date 的时分秒与时区，输出规范串、周总数与跨年归属提示。',
        coreFeatures: [
          '公历 → 周边历：YYYY-MM-DD 输出 ISO 周年、周序号、星期（1–7）与规范串 YYYY-Www-D',
          '周边历 → 公历：YYYY-Www-D 反查公历日期，自动识别输入方向，可逐行批量混排',
          '长年标注：自动判定 ISO 年含 52 还是 53 周（1 月 1 日为周四、或闰年且为周三即长年）',
          '跨年提示：年初年末日期归属上一 / 下一 ISO 年（或周边历落入相邻公历年）时给出明确说明',
          '严格校验：W54、不存在的 W53、星期 0/8、2 月 30 日、格式错误均带原因报错而非抛异常',
        ],
        howToUse: [
          '每行输入一个日期：公历写 YYYY-MM-DD（如 2026-10-29），周边历写 YYYY-Www-D（如 2026-W44-4）',
          '两种方向可在同一次输入中混排，工具按是否含 -W 自动识别',
          '输出区展示公历（含星期）、ISO 规范串、周年与周序号、该 ISO 年总周数',
          '存在跨年周边界时附归属提示；非法行在黄色告警中按行号说明原因',
        ],
        useCases: [
          '财务结算：把发票、对账、工资结算的公历日期换算为财务周 / ISO 周序号，核对年终结算归属年度',
          '教育与项目排期：教学周、冲刺周编号与日历日期互相定位，避免年初第一周口径分歧',
          '跨境协作：与采用 ISO 周边历的欧洲团队对齐周次，快速确认某周周一到周日的具体日期',
        ],
        privacyNote:
          '所有换算均为浏览器本地确定性计算，不使用时区、不发起任何网络请求，输入的日期不会离开设备。',
        faqs: [
          {
            question: '为什么 2021 年 1 月 1 日显示成 2020-W53？',
            answer:
              'ISO 周边历中一周必须完整包含周一到周日，且第 1 周是含 1 月 4 日的那一周。2021-01-01 是周五，它所在的周大部分日子（周一至周四）还在 2020 年，而 2020 年恰为含 53 周的长年，因此该日记作 2020-W53-5。工具会在提示行说明这一跨年归属。',
          },
          {
            question: '什么是 ISO 长年？哪些年有 53 周？',
            answer:
              '若一个 ISO 年的 1 月 1 日是周四，则该年有 53 个完整周；若 1 月 1 日是周三且该年为公历闰年，同样有 53 周。其余年份为 52 周。例如 2020 与 2026 都是 53 周，2021–2023 为 52 周。',
          },
          {
            question: '为什么不用浏览器的 Date 直接取周数？',
            answer:
              'Date 没有标准化的 ISO 周年 / 周序号接口，且受运行环境时区影响，跨年边界可能因时区偏移出现偏差。本工具用纯序数日算法（1970-01-01 为第 0 天、该日为周四）直接推导，结果在任何环境与时区下都一致。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The ISO 8601 Week Date Converter is a date tool that runs entirely in the browser. An ISO week date identifies a day by week-year, week number and weekday (for example 2026-W44-4), with Monday as the first weekday and week 1 being the week that contains January 4. Because Gregorian and ISO week-years do not line up, dates near New Year can belong to the neighboring ISO year (for instance 2021-01-01 is Friday of week 53 of 2020). The tool performs deterministic conversion with a Gregorian ordinal-day algorithm, never relying on Date time-of-day or time zones, and emits the canonical string, week count and a cross-year note.',
        coreFeatures: [
          'Gregorian → week date: YYYY-MM-DD yields ISO week-year, week number, weekday (1–7) and the canonical YYYY-Www-D string',
          'Week date → Gregorian: YYYY-Www-D maps back to a calendar date; direction is auto-detected and many lines can be mixed in one batch',
          'Long-year marking: decides whether the ISO year has 52 or 53 weeks (January 1 is Thursday, or Wednesday in a Gregorian leap year)',
          'Cross-year notes: dates near year boundaries that belong to the previous/next ISO year (or week dates falling in an adjacent Gregorian year) are explained explicitly',
          'Strict validation: W54, a nonexistent W53, weekday 0/8, February 30 and malformed text all produce a reasoned error instead of throwing',
        ],
        howToUse: [
          'Enter one date per line: Gregorian as YYYY-MM-DD (e.g. 2026-10-29) or week date as YYYY-Www-D (e.g. 2026-W44-4)',
          'Both directions may be mixed in the same input; the tool detects direction from the -W marker',
          'Output shows the Gregorian date with weekday, the canonical ISO string, week-year and week number, and the total weeks in that ISO year',
          'Cross-year boundaries get an explanatory note; invalid lines are reported by line number in the yellow warnings',
        ],
        useCases: [
          'Fiscal operations: convert invoice, reconciliation and payroll dates to fiscal/ISO week numbers and verify which year a year-end settlement belongs to',
          'Academic and project scheduling: map teaching weeks and sprint numbers to calendar dates without disagreement over the first week of January',
          'Cross-border collaboration: align week numbering with European teams using ISO week dates and find the Monday–Friday of any week',
        ],
        privacyNote:
          'All conversion is deterministic local browser computation. It uses no time zone, makes no network requests and entered dates never leave your device.',
        faqs: [
          {
            question: 'Why does January 1, 2021 appear as 2020-W53?',
            answer:
              'An ISO week always runs Monday through Sunday, and week 1 is the week containing January 4. January 1, 2021 was a Friday, and most of that week (Monday to Thursday) was still in 2020; 2020 was also a long 53-week ISO year. The day is therefore 2020-W53-5, and the tool explains this cross-year assignment in a note.',
          },
          {
            question: 'What is an ISO long year and which years have 53 weeks?',
            answer:
              'An ISO year has 53 complete weeks when January 1 falls on Thursday, or when January 1 is Wednesday and the Gregorian year is a leap year. All other years have 52 weeks. For example, 2020 and 2026 have 53 weeks while 2021–2023 have 52.',
          },
          {
            question: 'Why not read the week number directly from the browser Date?',
            answer:
              'Date has no standardized ISO week-year/week API and is affected by the runtime time zone, so cross-year boundaries can shift with zone offsets. The tool instead derives everything from a pure ordinal-day algorithm (1970-01-01 is day 0 and a Thursday), giving identical results in every environment and zone.',
          },
        ],
      },
    },
  },
  {
    slug: 'number-range-expander',
    name: '数值区间批量展开器与压缩器',
    nameEn: 'Number Range Expander & Collapser',
    description:
      '在紧凑区间表达式与离散整数列表之间双向批量转换。展开方向把 1-5, 10, 12-14 解析为完整数列（1,2,3,4,5,10,12,13,14），支持可选步长（0-10:2 输出偶数序列）与负数区间（-5--1），逗号、空格、换行均可作为分隔符；压缩方向把乱序、重复的数字列表排序去重后合并为最小区间表示（5,3,1,2,4,4,6,8 → 1-6,8），连续 ≥3 个数才合并、两个连续数保持单列以保证与展开可逆。基于 BigInt 支持超过 2^53 的任意精度整数，可选逗号 / 逗号空格 / 换行 / 空格四种输出分隔符；倒置区间、非正步长、非法 token 均给出明确中文错误，展开结果设 100000 个元素安全上限。适用于端口号清单、ID 段、页码范围等批量数值整理。纯浏览器本地处理、零新增依赖、不发起网络请求。',
    descriptionEn:
      'Convert bidirectionally between compact range expressions and explicit integer lists. Expanding turns 1-5, 10, 12-14 into 1,2,3,4,5,10,12,13,14, supports an optional step (0-10:2 yields evens) and negative ranges (-5--1), and accepts commas, spaces or newlines as separators. Collapsing sorts and de-duplicates a messy number list and merges runs into the minimal range notation (5,3,1,2,4,4,6,8 becomes 1-6,8); only runs of at least three consecutive numbers merge, while pairs stay separate so the transform stays reversible. Built on BigInt for arbitrary-precision integers beyond 2^53, with four output separator choices (comma, comma+space, newline, space). Reversed ranges, non-positive steps and invalid tokens produce clear error messages, and expansion is capped at 100000 elements. Useful for port lists, ID segments and page ranges. Fully local processing with zero new dependencies and no network requests.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/number-range-expander',
    iconName: 'Hash',
    tags: ['区间展开', '数值列表', 'BigInt', '端口号', '批量处理', '去重'],
    tagsEn: ['Range Expansion', 'Number List', 'BigInt', 'Port List', 'Batch', 'Deduplicate'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '1-5, 10, 12-14\n0-10:2\n-5--1',
    doc: {
      zh: {
        whatIsIt:
          '数值区间批量展开器与压缩器是一款纯浏览器本地运行的批量数值整理工具，在「紧凑区间表达式」与「完整离散数列」之间双向转换。展开方向识别单值、a-b 闭区间与 a-b:s 带步长区间（如 1-5、0-10:2、-5--1），按书写顺序输出每个整数；压缩方向把可能乱序、重复、跨行的数字排序去重，再把连续 ≥3 个数合并为 a-b，输出最小区间表示。全部运算基于 BigInt，可安全处理超过 JavaScript 安全整数上限（2^53-1）的编号。',
        coreFeatures: [
          '区间展开：单值、a-b 闭区间、a-b:s 带步长区间混排，逗号 / 空格 / Tab / 换行分隔均可',
          '负数支持：起点或终点为负数时正确识别（-3-2、-5--1），倒置区间（5-1）明确报错',
          '列表压缩：乱序重复数字自动排序去重，连续 ≥3 个合并为 a-b，两个连续数保持单列',
          'BigInt 任意精度：支持远超 2^53 的大整数，展开与压缩往返一致',
          '输出可控：四种输出分隔符可选（逗号、逗号空格、换行、空格），一键复制；100000 元素安全上限防卡顿',
        ],
        howToUse: [
          '顶部切换方向：「展开区间 → 数列」或「压缩数列 → 区间」',
          '展开时在左侧输入如 1-5, 10, 12-14，步长写法 0-10:2，负数区间如 -5--1',
          '压缩时在左侧输入离散整数（允许乱序、重复、换行），如 5,3,1,2,4,4,6,8',
          '右侧实时显示结果与元素数量，底部可切换输出分隔符并复制；输入有误时在输出区显示具体错误',
        ],
        useCases: [
          '运维与网络：把端口段 8000-8010、3000-3005 展开为防火墙 / 扫描器所需的端口号清单，或反向归并',
          '数据与研发：批量整理 ID 段、页码范围、分片编号，去重排序后压缩为最紧凑表达',
          '测试造数：按步长快速生成等差序列（如 0-10:2 的偶数），复制为参数化测试数据',
        ],
        privacyNote:
          '所有解析与计算均在浏览器本地完成，不发起任何网络请求，输入的数字不会离开设备。',
        faqs: [
          {
            question: '为什么压缩时连续两个数不合并（如 1,2 仍输出 1,2）？',
            answer:
              '连续 ≥3 个数合并为 a-b 才能保证「展开 ↔ 压缩」可逆且无歧义；若把 1,2 合并成 1-2，再展开虽然结果相同，但区间记号通常隐含至少跨越一个步长。为让两种方向的输出严格对应、便于核对，本工具仅在连续不少于 3 个数时才合并。',
          },
          {
            question: '如何输入负数区间？-5--1 是什么意思？',
            answer:
              '区间连字符是起点之后的第一个 -，因此起点带负号时写 -3-2（从 -3 到 2），终点也为负时两个连字符紧贴，写作 -5--1（从 -5 到 -1）。解析器会跳过起点位置的正负号再寻找区间连字符。',
          },
          {
            question: '为什么用 BigInt？支持多大的数？',
            answer:
              'JavaScript 普通数字超过 2^53-1 后无法精确表示每个整数，处理雪花 ID、长编号等场景会丢精度。本工具全程使用 BigInt 按十进制字符串精确运算，没有固定位数上限；同时设置单次展开不超过 100000 个元素，避免超大区间拖慢页面。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Number Range Expander & Collapser is a batch number-formatting tool that runs entirely in the browser, converting in both directions between compact range expressions and explicit integer lists. Expanding recognizes single values, a-b closed ranges and a-b:s stepped ranges (e.g. 1-5, 0-10:2, -5--1) and emits every integer in input order. Collapsing sorts and de-duplicates a messy, possibly multi-line list and merges runs of at least three consecutive numbers into a-b, producing the minimal range notation. Every calculation uses BigInt, so identifiers beyond the JavaScript safe-integer limit (2^53-1) are handled exactly.',
        coreFeatures: [
          'Range expansion: single values, a-b closed ranges and a-b:s stepped ranges mixed freely; commas, spaces, tabs and newlines all separate tokens',
          'Negative numbers: negative start or end is parsed correctly (-3-2, -5--1) and reversed ranges such as 5-1 are rejected with a clear message',
          'List collapsing: unsorted, duplicated numbers are sorted and de-duplicated; runs of ≥3 merge into a-b while pairs stay listed separately',
          'Arbitrary precision with BigInt: integers far beyond 2^53 are exact, and expand-then-collapse round-trips consistently',
          'Configurable output: four separators (comma, comma+space, newline, space), one-click copy, and a 100000-element safety cap',
        ],
        howToUse: [
          'Switch direction at the top: "Expand ranges → list" or "Collapse list → ranges"',
          'To expand, enter something like 1-5, 10, 12-14; stepped syntax is 0-10:2 and a negative range looks like -5--1',
          'To collapse, enter discrete integers (unsorted, duplicated and multi-line input is fine), e.g. 5,3,1,2,4,4,6,8',
          'The right panel shows the result and element count live; pick an output separator at the bottom and copy. Invalid input shows a specific error under the output',
        ],
        useCases: [
          'Ops and networking: expand port segments 8000-8010 or 3000-3005 into the explicit lists firewalls and scanners expect, or merge them back',
          'Data and engineering: tidy ID segments, page ranges and shard numbers, de-duplicate and sort them into the most compact expression',
          'Test data: generate arithmetic sequences quickly via steps (e.g. 0-10:2 for evens) and copy them as parameterized test values',
        ],
        privacyNote:
          'All parsing and computation happens locally in the browser with no network requests; the numbers you enter never leave your device.',
        faqs: [
          {
            question: 'Why do two consecutive numbers stay separate when collapsing (1,2 stays 1,2)?',
            answer:
              'Merging only runs of three or more into a-b keeps expand and collapse unambiguous and reversible. If 1,2 became 1-2, re-expanding would still match, but a range notation conventionally spans at least one interior step. To keep both directions strictly corresponding and easy to verify, the tool merges only runs of at least three numbers.',
          },
          {
            question: 'How do I enter negative ranges? What does -5--1 mean?',
            answer:
              'The range dash is the first hyphen after the start value, so a negative start is written -3-2 (from -3 to 2) and when the end is also negative the two hyphens sit together as -5--1 (from -5 to -1). The parser skips the sign at position 0 and then looks for the range hyphen.',
          },
          {
            question: 'Why BigInt and how large can numbers be?',
            answer:
              'Ordinary JavaScript numbers cannot represent every integer beyond 2^53-1, which loses precision with snowflake IDs and long identifiers. This tool computes exactly on BigInt decimal strings with no fixed digit limit, while capping a single expansion at 100000 elements so that huge ranges cannot freeze the page.',
          },
        ],
      },
    },
  },
  {
    slug: 'base91-codec',
    name: 'basE91 编解码（文本与十六进制字节）',
    nameEn: 'basE91 Encoder & Decoder (Text & Hex Bytes)',
    description:
      '在 UTF-8 文本 / 十六进制字节与 basE91 字符串之间双向转换，使用 Joachim Henke 提出的 91 个可打印 ASCII 字符字母表与可变 13/14 bit 分组，编码体积比 Base64 再小约 8%–10% 且无填充；解码严格校验非字母表字符并报告位置，可配置忽略空白。',
    descriptionEn:
      'Convert between UTF-8 text / hex bytes and basE91 strings using Joachim Henke’s 91 printable-ASCII alphabet with variable 13/14-bit grouping, about 8%–10% smaller than Base64 with no padding; decoding strictly rejects non-alphabet characters with exact positions and can optionally ignore whitespace.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/base91-codec',
    iconName: 'Binary',
    tags: ['basE91', 'Base91', '编解码', '紧凑编码', 'CTF'],
    tagsEn: ['basE91', 'Base91', 'Encode', 'Compact Encoding', 'CTF'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'The quick brown fox jumps over the lazy dog',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运算的 basE91 编解码工具。basE91 由 Joachim Henke 提出，使用除 -、\\、\' 外的 91 个可打印 ASCII 字符承载二进制数据，以可变的 13/14 bit 分组（13 bit 值大于 88 时消费 13 bit，否则消费 14 bit）配合除法余数映射到两个字符，没有填充概念，编码体积比 Base64 再小约 8%–10%，常见于紧凑数据传输、配置嵌入与逆向 / CTF 场景。',
        coreFeatures: [
          '严格遵循 basE91 原版算法：91 字符字母表、可变 13/14 bit 分组、无填充，与官方参考实现测试向量一致',
          '双向转换：UTF-8 文本或十六进制字节即时编码，basE91 严格解码回文本或字节',
          '两种载体：文本模式按 UTF-8 处理并校验合法性，十六进制模式直接处理任意原始字节',
          '精确报错：非字母表字符报告具体位置，可配置是否忽略空格、制表与换行',
          '纯本地运行：所有转换在浏览器内完成，绝不发起任何网络请求',
        ],
        howToUse: [
          '选择「编码」或「解码」方向，并选择输入载体为文本（UTF-8）还是十六进制字节',
          '在输入框粘贴文本 / 十六进制字节 / basE91 字符串，结果即时更新',
          '解码时可勾选「忽略空白字符」以处理带换行排版的密文；点击「复制结果」获取转换内容',
        ],
        useCases: [
          '在空间受限的介质（二维码、URL、配置项）中承载比 Base64 更紧凑的二进制数据',
          '解析逆向分析、CTF 题目中常见的 basE91 载荷并还原原始字节',
          '在文本与原始字节（十六进制）两种视图间核对编码结果',
        ],
        privacyNote: '所有编解码均在浏览器本地完成，输入的文本、字节与 basE91 字符串不会被上传或记录。',
        faqs: [
          {
            question: 'basE91 和 Base64 / Base91 有什么区别？',
            answer:
              'Base64 每 3 字节编码为 4 个字符并有填充，体积固定增加约 33%；basE91 使用 91 个字符并以可变 13/14 bit 分组承载数据，无填充，最坏膨胀约 23%、典型场景只增加约 14%，比 Base64 再省 8%–10%。注意它与某些同样自称 Base91 的方案（如 basE91 之外的 RFC 4648 扩展）字母表和算法并不相同，本工具实现的是 Joachim Henke 的原版 basE91。',
          },
          {
            question: '为什么编码结果里会出现 = ？这是填充吗？',
            answer:
              '不是填充。basE91 字母表本身包含 = 作为普通数据字符（字母表为除 -、\\、\' 外的全部可打印 ASCII），它不表示长度补齐，解码时按普通字符处理。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first basE91 codec. Designed by Joachim Henke, basE91 carries binary data with 91 printable ASCII characters (all except -, \\ and \'), using variable 13/14-bit groups (13 bits consumed when the 13-bit value exceeds 88, otherwise 14 bits) mapped through division/remainder onto two characters. It has no padding, is about 8%–10% smaller than Base64, and is commonly used for compact transport, embedded configuration and reverse-engineering/CTF payloads.',
        coreFeatures: [
          'Faithful basE91: the 91-character alphabet, variable 13/14-bit grouping, no padding, matching the official reference test vectors',
          'Bidirectional: UTF-8 text or hex bytes encode instantly and basE91 decodes strictly back to text or bytes',
          'Two carriers: text mode handles UTF-8 with validation, hex mode processes arbitrary raw bytes',
          'Precise errors: non-alphabet characters report exact positions; whitespace can be ignored or rejected',
          'Local-first: all conversion runs in the browser with no network requests',
        ],
        howToUse: [
          'Pick the "Encode" or "Decode" direction and choose the input carrier: UTF-8 text or hex bytes',
          'Paste text / hex bytes / a basE91 string into the input area and the result updates instantly',
          'When decoding, toggle "ignore whitespace" for line-wrapped payloads, then click "Copy result"',
        ],
        useCases: [
          'Carry binary data more compactly than Base64 in space-constrained media (QR codes, URLs, config values)',
          'Decode basE91 payloads encountered in reverse engineering and CTF challenges back to raw bytes',
          'Cross-check encoding between a text view and a raw-byte (hex) view',
        ],
        privacyNote:
          'All encoding and decoding run locally in the browser; entered text, bytes and basE91 strings are never uploaded or logged.',
        faqs: [
          {
            question: 'How does basE91 differ from Base64?',
            answer:
              'Base64 encodes 3 bytes into 4 characters with padding, a fixed ~33% overhead. basE91 uses 91 characters with variable 13/14-bit grouping and no padding, at most ~23% overhead and typically around 14%, saving another 8%–10% versus Base64. It also differs from other schemes that happen to be called "Base91"; this tool implements Joachim Henke’s original basE91 alphabet and algorithm.',
          },
          {
            question: 'Why does the output contain "="? Is that padding?',
            answer:
              'No. The basE91 alphabet includes "=" as an ordinary data character (it uses every printable ASCII character except -, \\ and \'), so it carries data rather than marking length alignment, and the decoder treats it as a normal character.',
          },
        ],
      },
    },
  },
  {
    slug: 'vat-calculator',
    name: '增值税计算器（含税 / 不含税互算）',
    nameEn: 'VAT Calculator (Tax-Inclusive / Exclusive)',
    description:
      '输入金额与税率，一键在不含税金额、税额、含税金额之间互算：支持正向加税与含税反算拆分，内置 13% / 9% / 6% / 3% / 1% 中国常用增值税档位与自定义税率，金额按两位小数四舍五入，非法输入有明确提示。',
    descriptionEn:
      'Enter an amount and a tax rate to convert between VAT-exclusive amount, tax amount and VAT-inclusive amount in both directions, with 13% / 9% / 6% / 3% / 1% China VAT presets and a custom rate. Amounts round to two decimals and invalid input is clearly flagged.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/vat-calculator',
    iconName: 'Calculator',
    tags: ['增值税', '税率', '含税金额', '不含税金额', '发票'],
    tagsEn: ['VAT', 'Tax Rate', 'Tax-Inclusive', 'Tax-Exclusive', 'Invoice'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '1000',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的增值税计算器，覆盖报价与开票中最常见的两个方向：已知不含税金额和税率，计算税额与含税金额；已知含税金额和税率，反向拆分出不含税金额与税额。内置中国现行增值税常用档位 13%、9%、6%、3%、1%，也支持输入自定义税率，所有金额按两位小数四舍五入。',
        coreFeatures: [
          '双向互算：不含税金额 → 税额 / 含税金额，或含税金额 → 不含税金额 / 税额',
          '常用档位：一键选择 13% / 9% / 6% / 3% / 1% 税率，也支持 0–99.999% 自定义税率',
          '金额按两位小数四舍五入，反向拆分时税额以「含税金额 − 不含税金额」轧差，保证三者合计一致',
          '实时计算：输入即出结果，负数、非法数字、税率超出范围均有明确错误提示',
          '纯本地运行：金额与税率不会离开浏览器，不发起任何网络请求',
        ],
        howToUse: [
          '选择计算方向：正向加税（输入不含税金额）或反向拆分（输入含税金额）',
          '输入金额，并通过档位按钮或输入框指定税率',
          '结果区即时显示不含税金额、税额与含税合计，可用于报价单或发票核对',
        ],
        useCases: [
          '销售报价：把不含税报价换算为客户实付的含税金额',
          '发票与报销核对：从价税合计中拆分出不含税金额与可抵扣税额',
          '采购比价：在不同税率的供应商报价之间统一口径比较',
        ],
        privacyNote: '所有金额与税率仅保存在浏览器本地并参与计算，不会被上传、记录或用于其他用途。',
        faqs: [
          {
            question: '反向拆分时税额是怎么计算的？',
            answer:
              '先按「不含税金额 = 含税金额 ÷ (1 + 税率)」计算并四舍五入到分，再用「税额 = 含税金额 − 不含税金额」轧差得到，确保三项金额合计严格一致，例如 100 元含税、13% 税率时不含税 88.50 元、税额 11.50 元。',
          },
          {
            question: '计算结果可以直接作为开票或申报依据吗？',
            answer:
              '本工具按通用数学口径计算并四舍五入到分，适合报价、预估与核对；实际开票与纳税申报请以开票软件、税务机关规则及合同约定（如差额征税、简易计税等特殊情形）为准。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first value-added tax calculator covering the two most common invoicing workflows: from a tax-exclusive amount and rate to the tax and tax-inclusive total, or back-splitting a tax-inclusive total into the exclusive amount and tax. It ships with common China VAT rates of 13%, 9%, 6%, 3% and 1%, plus a custom rate, rounding every amount to two decimals.',
        coreFeatures: [
          'Both directions: exclusive amount → tax / inclusive total, or inclusive total → exclusive amount / tax',
          'Preset rates of 13% / 9% / 6% / 3% / 1% plus any custom rate from 0–99.999%',
          'Two-decimal rounding; on reverse splits the tax is derived as inclusive minus exclusive so the three figures always reconcile',
          'Live results as you type, with explicit errors for negative amounts, invalid numbers and out-of-range rates',
          'Local-first: amounts and rates never leave the browser and no network request is made',
        ],
        howToUse: [
          'Pick a direction: add tax (enter the exclusive amount) or back-split (enter the inclusive total)',
          'Enter the amount and choose a preset rate or type a custom rate',
          'Read the exclusive amount, tax and inclusive total in the result panel for quotes or invoice checks',
        ],
        useCases: [
          'Turn a tax-exclusive quote into the tax-inclusive price a customer actually pays',
          'Split an invoice total into the exclusive amount and deductible tax for reimbursement checks',
          'Normalize supplier quotes that carry different VAT rates for comparison',
        ],
        privacyNote:
          'All amounts and rates stay in your browser for local calculation; they are never uploaded, logged or reused.',
        faqs: [
          {
            question: 'How is the tax computed on a reverse split?',
            answer:
              'The exclusive amount is calculated as inclusive ÷ (1 + rate) and rounded to cents, then the tax is the balance of inclusive minus exclusive, so the three figures always reconcile. For example, 100 inclusive at 13% gives 88.50 exclusive and 11.50 tax.',
          },
          {
            question: 'Can the results be used directly for official invoicing or tax filing?',
            answer:
              'The tool applies standard math with cent-level rounding and is intended for quoting, estimating and cross-checking. For actual invoices and filings, follow your invoicing software, tax-authority rules and contract terms, including special regimes such as simplified or difference taxation.',
          },
        ],
      },
    },
  },
  {
    slug: 'running-pace-calculator',
    name: '跑步配速计算器（配速 / 完赛时间 / 距离 / 速度互算）',
    nameEn: 'Running Pace Calculator (Pace / Finish Time / Distance / Speed)',
    description:
      '在配速（mm:ss 每公里）、完赛总时长、距离与速度（km/h）之间知二求余：内置 5K、10K、半程马拉松 21.0975km、全程马拉松 42.195km 距离预设，配速与速度双向联动，时间格式自动校验，适合训练配速规划与目标完赛时间反推。',
    descriptionEn:
      'Derive any two of pace (mm:ss per km), total finish time, distance and speed (km/h) from the others, with 5K, 10K, half-marathon 21.0975km and marathon 42.195km presets, bidirectional pace/speed linking and strict time-format validation, for training pacing and target finish-time planning.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/running-pace-calculator',
    iconName: 'Gauge',
    tags: ['跑步', '配速', '马拉松', '完赛时间', 'km/h'],
    tagsEn: ['Running', 'Pace', 'Marathon', 'Finish Time', 'km/h'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '10',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的跑步配速互算工具。围绕配速（每公里 mm:ss）、完赛总时长、距离（公里）与速度（km/h）四个量，给定其中两个即可求出其余量，并内置 5K、10K、半程马拉松（21.0975 公里）、全程马拉松（42.195 公里）标准距离预设，配速与速度输入框双向联动。',
        coreFeatures: [
          '三种互算模式：配速 + 距离求完赛时间、完赛时间 + 距离反推配速、配速 + 完赛时间求距离',
          '配速（mm:ss/km）与速度（km/h）双向联动，修改任一项自动换算另一项',
          '内置 5K / 10K / 半马 / 全马距离快捷预设，也支持任意自定义公里数',
          '严格校验时间格式（mm:ss、h:mm:ss）与零 / 负距离，错误提示明确',
          '纯本地运行：输入的训练数据不会发起任何网络请求',
        ],
        howToUse: [
          '选择互算模式：已知哪两个量就选对应模式',
          '填入配速（如 5:00）、完赛时间（如 45:00 或 1:30:00）或距离，可点击赛事预设快速填入距离',
          '结果区即时显示平均配速、完赛时间、距离与速度；也可直接修改速度（km/h）反向设定配速',
        ],
        useCases: [
          '比赛规划：给定目标完赛时间与赛事距离，反推需要维持的平均配速',
          '训练配速换算：把手表上的 km/h 速度换算为 mm:ss/km 配速',
          '成绩预估：按当前训练配速预估半马、全马完赛时间',
        ],
        privacyNote: '所有配速、时间与距离数据仅在浏览器本地计算，不会被上传或记录。',
        faqs: [
          {
            question: '半马和全马的距离按多少算？',
            answer:
              '半程马拉松按 21.0975 公里、全程马拉松按 42.195 公里计。例如全马保持 5:00/km 配速时，完赛时间约为 3:30:59（42.195 × 300 秒 = 12658.5 秒，四舍五入到秒）。',
          },
          {
            question: '配速和速度为什么可以互相修改？',
            answer:
              '二者是同一速度的两种表达：配速是每公里所需秒数，速度是每小时公里数，换算关系为速度 = 3600 ÷ 配速秒数。在任一侧输入有效值，另一侧会自动联动更新。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first running pace calculator built around four quantities—pace (mm:ss per km), total finish time, distance in kilometres and speed in km/h—where any two determine the others. It includes 5K, 10K, half-marathon (21.0975km) and marathon (42.195km) distance presets, and the pace and speed fields stay bidirectionally linked.',
        coreFeatures: [
          'Three solve modes: pace + distance → finish time, finish time + distance → pace, pace + finish time → distance',
          'Pace (mm:ss/km) and speed (km/h) are linked—edit either and the other converts automatically',
          'One-tap 5K / 10K / half / full marathon presets plus any custom distance in kilometres',
          'Strict validation of time formats (mm:ss, h:mm:ss) and zero/negative distance with clear messages',
          'Local-first: training data never triggers a network request',
        ],
        howToUse: [
          'Pick the solve mode matching the two quantities you know',
          'Enter pace (e.g. 5:00), finish time (e.g. 45:00 or 1:30:00) or distance, using the race presets for convenience',
          'Read average pace, finish time, distance and speed instantly; you can also type a km/h speed to set the pace in reverse',
        ],
        useCases: [
          'Race planning: back-solve the average pace needed for a target finish time and race distance',
          'Convert a watch readout in km/h into mm:ss/km pace',
          'Predict half/full marathon finish times from current training pace',
        ],
        privacyNote:
          'All pace, time and distance inputs are computed locally in the browser and are never uploaded or logged.',
        faqs: [
          {
            question: 'What distances are used for the half and full marathon?',
            answer:
              'The half marathon is 21.0975km and the full marathon 42.195km. For example, holding a 5:00/km pace over the full marathon gives about 3:30:59 (42.195 × 300 seconds = 12658.5 seconds, rounded to the nearest second).',
          },
          {
            question: 'Why can pace and speed both be edited?',
            answer:
              'They are two expressions of the same speed: pace is seconds per kilometre and speed is kilometres per hour, related by speed = 3600 ÷ pace seconds. Entering a valid value on either side updates the other automatically.',
          },
        ],
      },
    },
  },
  {
    slug: 'db-converter',
    name: '分贝 dB 与增益 / 衰减倍数互转器',
    nameEn: 'Decibel (dB) & Gain Ratio Converter',
    description:
      '在分贝（dB）与线性倍数之间双向换算，区分功率量（dB=10·log₁₀ 倍数）与场量（电压 / 幅值 / 声压，dB=20·log₁₀ 倍数）两种定义，提供 ±3 / ±6 / ±10 / ±20 dB 常用参考值速查与多级增益级联求和，−∞ dB 对应 0 倍。',
    descriptionEn:
      'Convert between decibels (dB) and linear ratios in both directions, with separate power (10·log₁₀) and field/amplitude (20·log₁₀) definitions, quick ±3 / ±6 / ±10 / ±20 dB references, and multi-stage cascade summing where dB add and ratios multiply; −∞ dB maps to a zero ratio.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/db-converter',
    iconName: 'Sigma',
    tags: ['分贝', 'dB', '增益', '衰减', '音频', '电子'],
    tagsEn: ['Decibel', 'dB', 'Gain', 'Attenuation', 'Audio', 'Electronics'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '3',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的分贝（dB）换算工具，面向音频、电子与射频工程。它严格区分两种分贝定义：功率 / 能量比使用 dB = 10·log₁₀(P/P₀)，电压 / 幅值 / 声压等场量使用 dB = 20·log₁₀(V/V₀)，并在 dB 与线性倍数之间双向实时换算，另支持多级增益级联（dB 相加等价于倍数相乘）。',
        coreFeatures: [
          '双定义切换：功率量 ×10 公式与场量（电压 / 幅值 / 声压）×20 公式，切换模式即时重算',
          '双向换算：输入 dB 得倍数，输入倍数得 dB，−∞ dB 与 0 倍互相对应',
          '常用参考值一键填入：±3、±6、±10、±20 dB，快速核对倍频程与十倍频程',
          '多级级联：输入各级 dB（逗号 / 空格 / 换行分隔），自动求总 dB 与等效倍数',
          '纯本地运行：不发起任何网络请求，零或负倍数等非法输入有明确提示',
        ],
        howToUse: [
          '选择物理量类型：功率 / 能量选「功率量」，电压 / 电流 / 声压 / 幅值选「场量」',
          '在 dB 或线性倍数任一输入框输入数值，另一侧实时联动换算',
          '在级联区粘贴各级增益（如 3, 3, -3），查看总增益与等效倍数',
        ],
        useCases: [
          '音频工程：功放增益、衰减器与音量级（如 −3 dB 功率减半、+6 dB 电压加倍）换算',
          '射频 / 天线：链路预算中级联各级增益与损耗的 dB 求和',
          '电路调试：把示波器测得的电压比换算为 dB，或把 dB 指标还原为倍数',
        ],
        privacyNote: '所有数值仅在浏览器本地参与计算，不会被上传或记录。',
        faqs: [
          {
            question: '为什么功率用 ×10 而电压 / 幅值用 ×20？',
            answer:
              '功率与场量的平方成正比（如 P = V²/R）。功率比直接取 10·log₁₀；电压比先平方再取对数，log₁₀(V₁/V₀)² = 2·log₁₀(V₁/V₀)，所以是 20·log₁₀。因此 +3 dB 表示功率约 ×2，而电压 ×2 对应约 +6 dB，二者描述的物理量不同，不能混用。',
          },
          {
            question: '级联时为什么直接把 dB 相加？',
            answer:
              '对数把乘法变为加法：多级电路的总倍数是各级倍数相乘，取 log 后即各级 dB 相加。例如 +3、+3、−3 dB 级联，总增益为 +3 dB，与倍数 1.995 × 1.995 × 0.501 ≈ 1.995 完全一致。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first decibel (dB) converter for audio, electronics and RF work. It keeps the two dB definitions strictly separate—power/energy ratios use dB = 10·log₁₀(P/P₀), while field quantities such as voltage, amplitude or sound pressure use dB = 20·log₁₀(V/V₀)—and converts between dB and linear ratios in both directions in real time, with multi-stage cascade support (adding dB equals multiplying ratios).',
        coreFeatures: [
          'Two definitions: switch between the ×10 power formula and the ×20 field (voltage/amplitude/pressure) formula with instant recalculation',
          'Bidirectional: type a dB value for the ratio or a ratio for dB; −∞ dB maps to a zero ratio',
          'One-tap references: ±3, ±6, ±10 and ±20 dB for octave and decade sanity checks',
          'Cascade: enter stage gains separated by commas, spaces or newlines to get total dB and the equivalent ratio',
          'Local-first with no network requests; zero/negative ratios and other invalid input are clearly flagged',
        ],
        howToUse: [
          'Pick the physical quantity: "power" for power/energy, "field" for voltage, current, sound pressure or amplitude',
          'Type a dB value or a linear ratio in either field—the other converts live',
          'Paste stage gains (e.g. 3, 3, -3) into the cascade area to see the total gain and equivalent ratio',
        ],
        useCases: [
          'Audio: amplifier gain, pad and level conversions (−3 dB halves power, +6 dB doubles voltage)',
          'RF/antenna link budgets: summing stage gains and losses in dB',
          'Bench work: turning measured voltage ratios into dB or dB specs back into ratios',
        ],
        privacyNote:
          'All numbers are computed locally in the browser and are never uploaded or logged.',
        faqs: [
          {
            question: 'Why ×10 for power but ×20 for voltage/amplitude?',
            answer:
              'Power is proportional to the square of a field quantity (P = V²/R). Power ratios take 10·log₁₀ directly; squaring the voltage ratio first gives log₁₀(V₁/V₀)² = 2·log₁₀(V₁/V₀), hence 20·log₁₀. So +3 dB means roughly ×2 power while ×2 voltage is about +6 dB—the two describe different physical quantities and must not be mixed.',
          },
          {
            question: 'Why do cascaded stages simply add their dB?',
            answer:
              'Logarithms turn multiplication into addition: the total ratio of cascaded stages is the product of individual ratios, which becomes a sum in dB. For example +3, +3 and −3 dB cascade to +3 dB total, matching 1.995 × 1.995 × 0.501 ≈ 1.995.',
          },
        ],
      },
    },
  },
  {
    slug: 'mailto-link-generator',
    name: 'mailto 邮件链接生成器（收件人 / 抄送 / 密送 / 主题 / 正文）',
    nameEn: 'mailto Link Generator (To / Cc / Bcc / Subject / Body)',
    description:
      '通过表单生成符合 RFC 6068 的 mailto: 链接，支持多个收件人、抄送、密送、主题与正文，自动百分号编码（空格 %20、换行 %0D%0A、邮件头内 @ 编码为 %40），可一键复制或唤起邮件客户端；反向粘贴已有 mailto 链接即可解析回填各字段。',
    descriptionEn:
      'Build RFC 6068-compliant mailto: links from a form with multiple To recipients, Cc, Bcc, subject and body, with automatic percent-encoding (spaces as %20, line breaks as %0D%0A, @ as %40 inside header fields), one-click copy and mail-client launch; paste an existing mailto link to parse and back-fill every field.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/mailto-link-generator',
    iconName: 'Tags',
    tags: ['mailto', '邮件链接', 'RFC 6068', '邮件模板', '百分号编码'],
    tagsEn: ['mailto', 'Email Link', 'RFC 6068', 'Email Template', 'Percent-Encoding'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'a@x.com',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的 mailto 链接双向工具。按 RFC 6068 规范，把收件人（to，可多个）、抄送（cc）、密送（bcc）、主题（subject）与正文（body）表单字段序列化为标准 mailto: URI：空格编码为 %20、换行规范化为 CRLF 后编码为 %0D%0A、cc/bcc/subject/body 等邮件头字段中的 @ 编码为 %40，多个收件人用逗号连接；也支持把已有 mailto 链接粘贴解析、解码并回填表单，生成与解析往返一致。',
        coreFeatures: [
          '表单生成：多收件人 / 抄送 / 密送（逗号、分号、中文标点或换行分隔均可）、主题、正文',
          'RFC 6068 编码：空格 %20、换行 %0D%0A、非 ASCII 按 UTF-8 百分号编码，邮件头字段内 @ 编码为 %40',
          '反向解析：粘贴 mailto 链接自动解码 cc / bcc / subject / body 并回填，支持 UTF-8 与换行还原',
          '一键复制链接，或直接点击唤起本机默认邮件客户端并预填全部字段',
          '纯本地运行：联系人与邮件内容不会发起任何网络请求，邮箱格式实时校验',
        ],
        howToUse: [
          '在表单中填写收件人（多个用逗号分隔）、抄送 / 密送、主题与正文，链接实时生成',
          '点击「复制链接」获取 mailto URI，或点击「打开邮件客户端」直接唤起邮件软件',
          '把已有 mailto 链接粘贴到反向解析区，点击「解析并回填」即可还原为可编辑表单',
        ],
        useCases: [
          '在文档、网页、工单或 README 中放置「联系我们」预填邮件链接',
          '为客服 / 销售模板批量生成带固定主题与正文框架的 mailto 链接',
          '核对他人提供的 mailto 链接实际包含哪些抄送、密送与正文内容',
        ],
        privacyNote:
          '所有邮箱地址与邮件内容仅在浏览器本地参与编码与解析，不会被上传、记录或发送；点击打开邮件客户端后由本机邮件软件处理。',
        faqs: [
          {
            question: '为什么生成结果里收件人的 @ 保留，而抄送里的 @ 变成了 %40？',
            answer:
              'RFC 6068 规定 mailto: 后直接跟的 addr-spec 收件人地址中 @ 是合法保留字符，可直接书写；而 cc、bcc、subject、body 都属于查询串中的 hfield（邮件头字段），按 application/x-www-form-urlencoded 风格编码时 @ 需写为 %40。两种形式语义完全等价，邮件客户端都能正确识别。',
          },
          {
            question: '正文里的换行为什么显示成 %0D%0A？',
            answer:
              '邮件头字段统一使用 CRLF（回车 + 换行）作为换行，百分号编码后即 %0D%0A。工具会先把各类换行（LF、CR）规范化为 CRLF 再编码，保证 Gmail、Outlook、Apple Mail 等客户端都能正确还原多行正文。',
          },
          {
            question: '可以不填收件人，只生成主题和正文吗？',
            answer:
              '可以。RFC 6068 允许 mailto: 后收件人部分为空，生成形如 mailto:?subject=...&body=... 的链接，打开客户端后由发件人自行填入地址；但若填写了地址，工具会按邮箱格式实时校验并提示格式不正确的条目。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first, bidirectional mailto link tool. Following RFC 6068, it serializes To (multiple recipients allowed), Cc, Bcc, subject and body form fields into a standard mailto: URI: spaces become %20, line breaks are normalized to CRLF and encoded as %0D%0A, and @ inside header fields such as cc/bcc/subject/body is encoded as %40, with recipients joined by commas. It also parses an existing mailto link, decodes it and back-fills the form, so generation and parsing round-trip cleanly.',
        coreFeatures: [
          'Form-based generation: multiple To / Cc / Bcc recipients (separated by commas, semicolons, Chinese punctuation or newlines), subject and body',
          'RFC 6068 encoding: spaces as %20, line breaks as %0D%0A, non-ASCII as UTF-8 percent-encoding, @ as %40 inside header fields',
          'Reverse parsing: paste a mailto link to decode cc / bcc / subject / body and back-fill the form, restoring UTF-8 and line breaks',
          'One-click copy, or launch the local default mail client with every field pre-filled',
          'Local-first: contacts and message content never trigger a network request; email formats are validated as you type',
        ],
        howToUse: [
          'Fill in recipients (comma-separated for multiple), Cc / Bcc, subject and body; the link updates live',
          'Click "Copy link" for the mailto URI, or "Open mail client" to launch your mail software directly',
          'Paste an existing mailto link into the parsing area and click "Parse & back-fill" to restore an editable form',
        ],
        useCases: [
          'Embed pre-filled "contact us" mail links in docs, web pages, tickets or README files',
          'Generate support/sales template links with fixed subjects and body outlines',
          'Inspect which Cc, Bcc and body content a mailto link provided by someone actually contains',
        ],
        privacyNote:
          'All addresses and message content are encoded and parsed locally in the browser; they are never uploaded, logged or sent. Launching the mail client hands the data to your local mail software.',
        faqs: [
          {
            question: 'Why is @ kept in To addresses but written as %40 in Cc?',
            answer:
              'RFC 6068 allows @ as a legal reserved character in the addr-spec recipients directly following mailto:. In contrast, cc, bcc, subject and body are hfields inside the query string, where @ is percent-encoded as %40 in form-urlencoded style. The two forms are semantically identical and every mail client recognizes both.',
          },
          {
            question: 'Why do body line breaks appear as %0D%0A?',
            answer:
              'Header fields use CRLF (carriage return + line feed) as the line ending, which percent-encodes to %0D%0A. The tool first normalizes LF/CR line breaks to CRLF before encoding, so Gmail, Outlook, Apple Mail and others all restore the multi-line body correctly.',
          },
          {
            question: 'Can I generate a link with no recipients, just subject and body?',
            answer:
              'Yes. RFC 6068 permits an empty recipient part, producing links like mailto:?subject=...&body=...; you fill in the address after the client opens. If addresses are entered, however, they are validated against the email format and invalid entries are flagged.',
          },
        ],
      },
    },
  },
  {
    slug: 'pattern-extractor',
    name: '文本模式批量提取器（邮箱 / URL / IP / UUID / 日期 / 色值）',
    nameEn: 'Pattern Extractor (Email / URL / IP / UUID / Date / Hex Color)',
    description:
      '粘贴日志、代码或文档文本，勾选邮箱、URL、IPv4、IPv6、UUID、日期时间、十六进制色值等内置模式批量提取，结果按模式分组、组内去重并统计出现次数，支持追加一条自定义正则与一键复制，全部在浏览器本地完成。',
    descriptionEn:
      'Paste logs, code or documents and batch-extract emails, URLs, IPv4/IPv6, UUIDs, date-times and hex colors with selectable built-in patterns. Results are grouped by pattern, de-duplicated with occurrence counts, and you can add one custom regex and copy the output—entirely locally in the browser.',
    category: ToolCategoryEnum.TEXT_CONTENT,
    path: '/tools/pattern-extractor',
    iconName: 'Eye',
    tags: ['正则提取', '邮箱', 'URL', 'IP', 'UUID', '文本清洗'],
    tagsEn: ['Pattern Extraction', 'Email', 'URL', 'IP', 'UUID', 'Text Cleaning'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput:
      '联系 support@example.com 或访问 https://example.com，服务器 192.168.1.10 / 2001:db8::1，追踪 550e8400-e29b-41d4-a716-446655440000。',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的文本模式批量提取器。它内置邮箱、URL、IPv4、IPv6、UUID、日期时间、十六进制色值七类常用正则，勾选后即可对粘贴文本一次性批量提取，输出按模式分组、组内去重并带出现次数的清单，还支持追加一条自定义正则（可命名、可忽略大小写），便于从日志、代码、文档中快速清洗结构化片段。',
        coreFeatures: [
          '七类内置模式：邮箱、URL、IPv4、IPv6、UUID、日期时间、十六进制色值，可任意多选组合',
          '分组去重计数：每个匹配项按首次出现顺序去重并统计出现次数，给出去重项数与总命中数',
          '自定义正则：可追加一条命名正则，语法错误时仅该项报错，不影响其他模式',
          '结果一键复制为纯文本，空结果与空输入有明确空状态',
          '纯本地运行：文本不发起任何网络请求，正则在主线程即时扫描',
        ],
        howToUse: [
          '勾选需要提取的模式（默认已选邮箱 / URL / IPv4 / IPv6 / UUID）',
          '把待分析文本粘贴到文本框，结果实时按模式分组展示',
          '需要额外规则时勾选「追加一条自定义正则」，填写名称（可选）与正则源码',
          '点击「复制结果文本」获取分组清单与计数',
        ],
        useCases: [
          '日志分析：从混排日志中批量提取 IP、URL、UUID、时间戳并统计频次',
          '数据清洗：从文档或网页文本中抽取全部邮箱、链接或色值',
          '代码审查：用自定义正则快速定位某类标识符或常量',
        ],
        privacyNote: '所有文本仅在浏览器本地参与正则匹配，不会被上传或记录。',
        faqs: [
          {
            question: '和已有的正则测试器（regex-tester）有什么区别？',
            answer:
              '正则测试器面向编写与调试单条正则、查看匹配与替换预览；本工具面向「预设模式批量提取」：内置七类常用模式可多选组合，自动分组、去重、计数，解决从大段文本中快速收集某类信息的场景，二者不重叠。',
          },
          {
            question: '提取结果如何去重和计数？',
            answer:
              '同一模式下字面值完全相同的匹配只保留一条（按首次出现顺序），但会累计它在原文中出现的次数；每个分组显示「去重项数 / 总命中次数」，顶部还给出所有模式的汇总。',
          },
          {
            question: '自定义正则写错了会怎样？',
            answer:
              '自定义正则存在语法错误时，只会在该分组显示错误信息，内置模式与其他结果照常展示，不会导致整体计算失败。自定义源码不需要写两侧斜杠，例如 \\bfoo-\\d+\\b。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first batch pattern extractor. It ships with seven built-in regexes—email, URL, IPv4, IPv6, UUID, date-time and hex color—and extracts them from pasted text in one pass, grouped by pattern, de-duplicated with occurrence counts. You can also add one named custom regex (optionally case-insensitive), making it easy to clean structured fragments out of logs, code and documents.',
        coreFeatures: [
          'Seven built-in patterns: email, URL, IPv4, IPv6, UUID, date-time and hex color, freely combinable',
          'Grouped, de-duplicated counts: identical matches collapse to one entry in first-seen order with an occurrence count',
          'Custom regex: add one named pattern; a syntax error only flags that group without affecting others',
          'One-click copy of results as plain text, with explicit empty states',
          'Local-first: text never triggers a network request; scanning runs instantly on the main thread',
        ],
        howToUse: [
          'Tick the patterns you need (email / URL / IPv4 / IPv6 / UUID selected by default)',
          'Paste your text into the box; grouped results appear instantly',
          'Optionally tick "add a custom regex" and provide a name (optional) and the pattern source',
          'Click "Copy results" to get the grouped list with counts',
        ],
        useCases: [
          'Log analysis: batch-collect IPs, URLs, UUIDs and timestamps with frequencies',
          'Data cleaning: extract every email, link or color value from docs and pages',
          'Code review: locate a class of identifiers with a quick custom regex',
        ],
        privacyNote: 'All text is matched locally in the browser and is never uploaded or logged.',
        faqs: [
          {
            question: 'How is this different from the existing regex tester?',
            answer:
              'The regex tester is for writing and debugging a single regex with match/replace previews. This tool is for preset-pattern batch extraction: multiple built-in patterns at once, with automatic grouping, de-duplication and counting—collecting a class of information from large text. The two do not overlap.',
          },
          {
            question: 'How are de-duplication and counting done?',
            answer:
              'Within a pattern, identical matches keep a single entry in first-seen order while accumulating the number of occurrences. Each group shows unique items / total hits, and the header summarizes all patterns.',
          },
          {
            question: 'What if my custom regex is invalid?',
            answer:
              'A syntax error only shows an error inside that custom group; built-in patterns and other results remain unaffected. Enter the pattern source without the surrounding slashes, e.g. \\bfoo-\\d+\\b.',
          },
        ],
      },
    },
  },
  {
    slug: 'bank-card-validator',
    name: '银行卡号校验与卡种识别（Luhn / IIN）',
    nameEn: 'Bank Card Validator & Brand Detector (Luhn / IIN)',
    description:
      '输入银行卡 / 信用卡号（自动忽略空格与连字符），执行 Luhn（模 10）校验，依据 IIN 前缀与长度识别 Visa、Mastercard、American Express、银联、JCB、Discover、Diners Club，展示 4 位分组、逐位计算过程与失败原因，全部在浏览器本地完成。',
    descriptionEn:
      'Enter a bank/credit card number (spaces and hyphens ignored) to run the Luhn (mod 10) check and detect Visa, Mastercard, American Express, UnionPay, JCB, Discover or Diners Club from IIN prefixes and length, with 4-digit grouping, a digit-by-digit breakdown and failure reasons—entirely locally in the browser.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/bank-card-validator',
    iconName: 'ShieldCheck',
    tags: ['Luhn', '银行卡', '信用卡', 'IIN', '校验位', '卡种识别'],
    tagsEn: ['Luhn', 'Bank Card', 'Credit Card', 'IIN', 'Check Digit', 'Brand Detection'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '4111 1111 1111 1111',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的银行卡 / 信用卡号校验工具。它先清除空格与连字符，检查长度（12–19 位）与字符合法性，再执行 Luhn（模 10）校验和，并依据 IIN 发卡行识别码前缀与长度规则识别 Visa、Mastercard、American Express、银联 UnionPay、JCB、Discover、Diners Club 等卡组织，同时给出 4 位分组展示与逐位加倍求和的计算明细，便于收单表单前置校验与测试数据准备。',
        coreFeatures: [
          'Luhn（模 10）校验：展示逐位加倍、减 9 的贡献明细与总和，快速定位输错的卡号',
          '卡组织识别：依据 IIN 前缀与长度识别七类常见卡组织，无法匹配时显示未知卡种',
          '容错输入：自动忽略空格与连字符，非数字字符与越界长度给出明确错误提示',
          '4 位分组格式化展示与长度统计，内置各渠道公开测试卡号可一键填入',
          '纯本地运行：卡号不发起任何网络请求，不接触任何服务端',
        ],
        howToUse: [
          '在输入框粘贴或输入卡号，可包含空格或连字符',
          '结果区实时显示有效 / 无效结论、识别卡种、长度与 Luhn 总和',
          '查看「Luhn 计算过程」了解各位数字的加倍与求和明细',
          '可在底部公开测试卡号表中点击任意号码快速填入',
        ],
        useCases: [
          '支付 / 收单表单开发中的前置卡号校验与错误提示实现',
          '准备通过 Luhn 的测试卡号或验证某段卡号是否被篡改',
          '依据 IIN 前缀初步判定用户所持卡片所属卡组织',
        ],
        privacyNote: '卡号仅在浏览器本地参与校验，不会被上传、记录或发送到任何服务端。',
        faqs: [
          {
            question: '校验通过能说明这张卡真实存在或可以扣款吗？',
            answer:
              '不能。Luhn 只能发现抄写 / 输入中的常见错误，校验通过仅代表号码「自洽」，不代表卡片真实发行、账户有效或余额充足；真实有效性必须由发卡行或支付渠道验证。请勿在非可信页面输入真实卡号。',
          },
          {
            question: '为什么显示「未知卡种」？',
            answer:
              '卡组织识别依赖公开的 IIN 前缀区间与长度规则，部分新发行卡段、地区性卡组织或 19 位卡号可能未被规则覆盖。未知卡种不影响 Luhn 结论，号码仍会照常完成模 10 校验。',
          },
          {
            question: 'American Express 卡号为什么分组看起来不整齐？',
            answer:
              'AmEx 卡号为 15 位，行业惯例是 4-6-5 分组；本工具统一按 4 位分组以便与其他卡组织保持一致（显示为 4-4-4-3），不影响校验结果。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first bank/credit card number validator. It strips spaces and hyphens, checks length (12–19 digits) and character validity, runs the Luhn (mod 10) checksum, and detects card brands—Visa, Mastercard, American Express, UnionPay, JCB, Discover and Diners Club—from IIN prefixes and length rules. It also shows 4-digit grouping and a digit-by-digit doubling breakdown, useful for payment-form pre-validation and test-data preparation.',
        coreFeatures: [
          'Luhn (mod 10) check with per-digit doubling/subtract-9 contributions and the total, quickly spotting mistyped numbers',
          'Brand detection from IIN prefixes and lengths for seven common schemes, with an explicit "unknown" fallback',
          'Forgiving input: spaces and hyphens ignored; non-digit characters and out-of-range lengths produce clear errors',
          '4-digit grouped display, length stats, and built-in publicly available test numbers you can fill in one click',
          'Local-first: the card number never triggers a network request or touches a server',
        ],
        howToUse: [
          'Paste or type a card number; spaces and hyphens are allowed',
          'The result area instantly shows valid/invalid, detected brand, length and Luhn total',
          'Open the "Luhn breakdown" to see doubling and summation for every digit',
          'Click any number in the public test-card table to fill it in quickly',
        ],
        useCases: [
          'Pre-submit card validation and error messaging in payment/acquiring forms',
          'Generating Luhn-valid test numbers or checking whether a number was altered',
          'A preliminary brand guess from the IIN prefix',
        ],
        privacyNote:
          'The card number is checked locally in the browser and is never uploaded, logged or sent to any server.',
        faqs: [
          {
            question: 'Does passing the check mean the card exists or can be charged?',
            answer:
              'No. Luhn only catches common transcription/typing errors; passing just means the number is self-consistent, not that it was issued, active or funded. Real validity must be confirmed by the issuer or payment network. Never enter a real card number on an untrusted page.',
          },
          {
            question: 'Why does it say "Unknown brand"?',
            answer:
              'Brand detection relies on public IIN ranges and length rules; some newly issued ranges, regional schemes or 19-digit numbers may not be covered. An unknown brand does not affect the Luhn result—the mod 10 check still runs normally.',
          },
          {
            question: 'Why does American Express grouping look uneven?',
            answer:
              'AmEx numbers are 15 digits and conventionally grouped 4-6-5; this tool groups every card uniformly by 4 digits (shown as 4-4-4-3), which does not affect validation.',
          },
        ],
      },
    },
  },
  {
    slug: 'descriptive-statistics',
    name: '描述性统计计算器（均值 / 中位数 / 众数 / 方差 / 分位数）',
    nameEn: 'Descriptive Statistics Calculator (Mean / Median / Mode / Variance / Quartiles)',
    description:
      '粘贴一列数值（支持逗号、空格、换行、分号等任意分隔），实时计算数量、总和、均值、中位数、众数、极差、总体/样本方差与标准差、Q1/Q3 分位数，展示排序后数据分布，非法项自动忽略并计数，全部在浏览器本地完成。',
    descriptionEn:
      'Paste a column of numbers separated by commas, spaces, newlines or semicolons and instantly get count, sum, mean, median, mode, range, population/sample variance and standard deviation, Q1/Q3 quartiles, plus a sorted distribution view. Invalid tokens are ignored and counted—entirely locally in the browser.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/descriptive-statistics',
    iconName: 'Sigma',
    tags: ['描述统计', '均值', '中位数', '标准差', '分位数', '方差'],
    tagsEn: ['Descriptive Statistics', 'Mean', 'Median', 'Standard Deviation', 'Quartile', 'Variance'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '12.5, 15.2 18.7 21.3; 9.8 14.6 17.1 20.4 16.8 13.9',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的描述性统计计算器。粘贴一列用逗号、空格、换行或分号等任意分隔的数值，即可实时得到数量、总和、均值、中位数、众数（支持多众数）、最小值、最大值、极差、总体/样本方差与标准差，以及采用线性插值法的 Q1/Q2/Q3 分位数，并展示升序排序后的数据分布，便于快速分析日志指标、实验结果或成绩数据。',
        coreFeatures: [
          '集中趋势：数量、总和、均值、中位数与众数（多个众数全部列出，全唯一时明确提示）',
          '离散程度：极差、总体方差/标准差（σ）与样本方差/标准差（s）一键切换',
          '四分位数：Q1/Q2/Q3 采用线性插值法（等价 Excel PERCENTILE.INC / numpy linear）',
          '容错解析：支持负数、小数、科学计数法，非法 token 忽略并单独计数提示',
          '纯本地运行：数据不发起任何网络请求，单元素与空输入均有合理兜底',
        ],
        howToUse: [
          '把一列数值粘贴到文本框，逗号、空格、换行、分号等均可作为分隔符',
          '结果区实时展示全部统计指标与有效/无效计数',
          '点击「总体 σ / 样本 s」切换方差与标准差口径（样本口径分母为 n−1）',
          '需要后续分析时点击「复制结果」获取纯文本指标表',
        ],
        useCases: [
          '快速分析接口耗时、错误率等日志指标的均值、分位数与离散程度',
          '统计实验测量值或考试成绩的中位数、众数与样本标准差',
          '清洗混有非法字符的数值数据并核对有效样本量',
        ],
        privacyNote: '所有数据仅在浏览器本地参与计算，不会被上传或记录。',
        faqs: [
          {
            question: '总体标准差和样本标准差有什么区别？',
            answer:
              '总体标准差（σ）把数据当作全部总体，平方偏差除以 n；样本标准差（s）把数据视为总体的抽样，除以 n−1 以修正偏差（贝塞尔修正）。分析抽样子集一般用 s，只有 1 个数据时 s 不可计算。',
          },
          {
            question: '分位数 Q1/Q3 是怎么算的？',
            answer:
              '采用线性插值法：排序后位置 h=(n−1)×p，落在两数之间时按距离线性插值，与 Excel 的 PERCENTILE.INC、numpy 的 linear 方法一致。例如 [1,2,3,4] 的 Q1 为 1.75、Q3 为 3.25。',
          },
          {
            question: '为什么众数显示「无（所有值唯一）」？',
            answer:
              '众数是出现次数最多的值；当每个值出现次数相同（都只出现一次）时不存在众数。若有多个值并列最高频，会按它们在输入中首次出现的顺序全部列出。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first descriptive statistics calculator. Paste a column of numbers separated by commas, spaces, newlines or semicolons and instantly get count, sum, mean, median, mode (multi-modal supported), min, max, range, population/sample variance and standard deviation, plus linearly interpolated Q1/Q2/Q3 quartiles and an ascending distribution view—handy for quick analysis of log metrics, experiment results or grades.',
        coreFeatures: [
          'Central tendency: count, sum, mean, median and mode (all modes listed; explicit note when all values are unique)',
          'Dispersion: range plus a one-click toggle between population (σ) and sample (s) variance / standard deviation',
          'Quartiles: Q1/Q2/Q3 via linear interpolation (equivalent to Excel PERCENTILE.INC / numpy linear)',
          'Forgiving parsing: negatives, decimals and scientific notation supported; invalid tokens ignored with a separate count',
          'Local-first: data never leaves the browser; single-element and empty inputs handled gracefully',
        ],
        howToUse: [
          'Paste a column of numbers; commas, spaces, newlines and semicolons all work as separators',
          'The result area instantly shows every metric plus valid/invalid counts',
          'Toggle "population σ / sample s" to switch the variance basis (sample uses n−1)',
          'Click "Copy results" for a plain-text metric table',
        ],
        useCases: [
          'Quick mean/quartile/dispersion analysis of latency, error-rate and other log metrics',
          'Median, mode and sample standard deviation for experiment measurements or exam scores',
          'Cleaning numeric data mixed with invalid tokens and checking the valid sample size',
        ],
        privacyNote: 'All data is computed locally in the browser and is never uploaded or logged.',
        faqs: [
          {
            question: 'Population vs sample standard deviation?',
            answer:
              'Population SD (σ) treats the data as the whole population and divides squared deviations by n; sample SD (s) treats it as a sample and divides by n−1 (Bessel correction). Use s for sampled subsets; with a single data point s is undefined.',
          },
          {
            question: 'How are Q1/Q3 quartiles computed?',
            answer:
              'With linear interpolation: after sorting, position h=(n−1)×p, interpolating between neighbors—matching Excel PERCENTILE.INC and numpy linear. For [1,2,3,4], Q1 is 1.75 and Q3 is 3.25.',
          },
          {
            question: 'Why does mode say "none (all values unique)"?',
            answer:
              'Mode is the most frequent value; when every value appears once there is no mode. If several values tie for the highest frequency, all are listed in first-occurrence order.',
          },
        ],
      },
    },
  },
  {
    slug: 'complex-number-calculator',
    name: '复数四则运算与极坐标转换器（a+bi ↔ r·e^iθ）',
    nameEn: 'Complex Number Calculator & Polar Converter (a+bi ↔ r·e^iθ)',
    description:
      '在直角坐标 a+bi 与极坐标/指数形式 r(cosθ+i·sinθ)=r·e^iθ 之间互转，辐角支持角度/弧度切换，并对两个复数执行加、减、乘、除，同时给出模、辐角、共轭与极坐标结果，除零明确报错，全部在浏览器本地完成。',
    descriptionEn:
      'Convert between rectangular a+bi and polar/exponential r(cosθ+i·sinθ)=r·e^iθ form with a degree/radian toggle, and add, subtract, multiply or divide two complex numbers with modulus, argument, conjugate and polar output. Division by zero is flagged—entirely locally in the browser.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/complex-number-calculator',
    iconName: 'Binary',
    tags: ['复数', '极坐标', '四则运算', '辐角', '共轭', '指数形式'],
    tagsEn: ['Complex Number', 'Polar Form', 'Arithmetic', 'Argument', 'Conjugate', 'Exponential Form'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '3 + 4i',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的复数计算工具。它在直角坐标形式 a+bi 与极坐标/指数形式 r(cosθ+i·sinθ)=r·e^iθ 之间双向转换，实时给出模、辐角（主值，范围 (−π, π]）与共轭；四则运算页输入两个复数即可同时得到加、减、乘、除的直角坐标与极坐标结果，辐角可在角度与弧度间切换，适用于电路分析、信号处理与数学学习中的复数换算。',
        coreFeatures: [
          '形式互转：a+bi ↔ r∠θ ↔ r·e^iθ，角度/弧度一键切换',
          '四则运算：两个复数的加、减、乘、除一次算全，结果同时给出直角与极坐标形式',
          '附带模 |z|、主辐角 arg(z) 与共轭 z̄，零复数辐角约定为 0',
          '除零（除数为 0+0i）明确报错，浮点结果保留 6 位小数并去除尾零、归一负零',
          '纯本地运行：输入不发起任何网络请求',
        ],
        howToUse: [
          '在「形式转换」页填入实部 a 与虚部 b，立即查看模、辐角、共轭与指数形式',
          '同页下方填入模 r 与辐角 θ（注意顶部角度/弧度口径），反向得到 a+bi',
          '切换到「四则运算」页，分别填入 z₁、z₂ 的实部虚部即可查看全部运算结果',
          '使用卡片右上角开关在角度 ° 与弧度 rad 间切换辐角显示口径',
        ],
        useCases: [
          '交流电路阻抗、导纳的复数加减乘除与极坐标表示',
          '信号处理中由幅度/相位重建复信号或求复数的模与辐角',
          '数学、物理学习时核对复数作业的手算结果',
        ],
        privacyNote: '所有输入仅在浏览器本地参与计算，不会被上传或记录。',
        faqs: [
          {
            question: '辐角的取值范围和方向是怎样的？',
            answer:
              '辐角取主值，范围为 (−π, π]（即 −180° 到 180°），按 atan2(虚部, 实部) 计算：实轴正向为 0，逆时针为正、顺时针为负。零复数 0+0i 没有几何方向，约定辐角为 0。',
          },
          {
            question: '极坐标转回直角坐标怎么算？',
            answer:
              '由 a=r·cosθ、b=r·sinθ 还原，θ 会按顶部选择的角度/弧度口径自动换算为弧度。例如 r=2、θ=60° 得到 a=1、b≈1.732，即 1+√3 i。',
          },
          {
            question: '除以 0+0i 会怎样？',
            answer:
              '零复数作除数时分母 |z|²=0，运算无定义，结果卡片显示「无法计算」并给出红色错误提示，其他三个运算（加、减、乘）照常展示。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first complex-number tool. It converts between rectangular a+bi and polar/exponential form r(cosθ+i·sinθ)=r·e^iθ, showing modulus, principal argument ((−π, π]) and conjugate; the arithmetic tab takes two complex numbers and returns sum, difference, product and quotient in both rectangular and polar form, with a degree/radian toggle. Useful for circuit analysis, signal processing and math study.',
        coreFeatures: [
          'Bidirectional a+bi ↔ r∠θ ↔ r·e^iθ conversion with a degree/radian toggle',
          'Arithmetic: add, subtract, multiply and divide two numbers at once, each result in both rectangular and polar form',
          'Modulus |z|, principal argument arg(z) and conjugate z̄ included; zero has argument 0 by convention',
          'Division by 0+0i is flagged clearly; outputs round to 6 decimals, strip trailing zeros and normalize −0',
          'Local-first: input never triggers a network request',
        ],
        howToUse: [
          'On the "Convert" tab enter real part a and imaginary part b to see modulus, argument, conjugate and exponential form',
          'Enter r and θ below (matching the degree/radian selector) to convert back to a+bi',
          'Switch to "Arithmetic" and fill in the real/imaginary parts of z₁ and z₂ for all four operations',
          'Use the top-right toggle to switch the argument display between degrees and radians',
        ],
        useCases: [
          'Complex arithmetic and polar representation for AC impedance and admittance',
          'Reconstructing complex signals from magnitude/phase or finding modulus and argument',
          'Checking hand-computed complex-number homework in math and physics',
        ],
        privacyNote: 'All input is computed locally in the browser and is never uploaded or logged.',
        faqs: [
          {
            question: 'What is the argument range and sign convention?',
            answer:
              'The principal argument lies in (−π, π] (−180° to 180°), computed with atan2(imaginary, real): 0 along the positive real axis, positive counterclockwise and negative clockwise. The zero complex number has no geometric direction and is assigned argument 0.',
          },
          {
            question: 'How is polar converted back to rectangular?',
            answer:
              'Via a=r·cosθ and b=r·sinθ, with θ converted from the selected degree/radian unit automatically. For r=2, θ=60° you get a=1, b≈1.732, i.e. 1+√3 i.',
          },
          {
            question: 'What happens when dividing by 0+0i?',
            answer:
              'Dividing by zero makes the denominator |z|²=0, which is undefined; the result card shows "undefined" with a red error message, while add, subtract and multiply are still displayed.',
          },
        ],
      },
    },
  },
  {
    slug: 'date-diff-calculator',
    name: '日期时间差计算与日期加减计算器',
    nameEn: 'Date Difference & Date Arithmetic Calculator',
    description:
      '计算两个日期时间相差的年/月/日分解与总天/总小时/总分钟，可勾选包含起止日与仅计工作日；或对基准日期按年/月/周/日/时/分施加正负偏移得到目标日期与星期，月末按日历月钳制（如 1 月 31 日 +1 月 → 2 月 28/29 日），全部本地完成。',
    descriptionEn:
      'Break down the difference between two dates into years/months/days and total days/hours/minutes, with include-endpoints and weekdays-only (Mon–Fri) options; or add signed year/month/week/day/hour/minute offsets to a base date to get the target date and its weekday. Month-end is clamped (Jan 31 + 1 month → Feb 28/29). Runs entirely locally.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/date-diff-calculator',
    iconName: 'Clock',
    tags: ['日期差', '日期加减', '工作日', '月末钳制', '闰年', '星期'],
    tagsEn: ['Date Diff', 'Date Add', 'Weekdays', 'Month-End Clamp', 'Leap Year', 'Weekday'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '2024-01-01 → 2024-03-01',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的日期运算工具，提供两类确定性计算：日期差——选择起止日期（可精确到分钟），输出年/月/日分解以及总天数、总小时、总分钟，并可勾选「包含起止两天」与「仅统计工作日」（周一至周五，不含节假日调休）；日期加减——给定基准日期与多段带单位（年/月/周/日/时/分）的正负偏移，依次施加后输出目标日期与星期。全部基于 UTC 毫秒时间戳计算，不受浏览器时区与夏令时影响，年/月偏移遇目标月天数不足时钳制到月末。',
        coreFeatures: [
          '两日期差量：年/月/日分解 + 总天/总小时/总分钟，支持精确到日或到分钟',
          '可勾选包含起止两天（总天数 +1）与仅统计工作日（周一至周五）',
          '日期加减支持多段年/月/周/日/时/分偏移，正负混合、依次计算',
          '月末按日历月钳制：2024-01-31 +1 月 → 2024-02-29，2024-02-29 +1 年 → 2025-02-28',
          '输出目标日期的星期；基于 UTC 毫秒运算，纯本地零网络请求',
        ],
        howToUse: [
          '在「日期差」页选择起止日期时间，用顶部开关切换精确到日 / 到分钟',
          '按需勾选「包含起止两天」或「仅统计工作日」，结果即时更新',
          '切换到「日期加减」页，选择基准日期，填写偏移量（可为负数）与单位',
          '点击「添加一段偏移」可组合多段偏移；点击垃圾桶删除该行，结果区给出目标日期与星期',
        ],
        useCases: [
          '计算合同、签证、证件的剩余天数与项目周期（可只看工作日）',
          '推算到期日、还款日：给定基准日加若干个月并自动处理月末',
          '核对年龄、工龄的年月分解，或闰年、跨年日期运算结果',
        ],
        privacyNote: '所有日期输入仅在浏览器本地参与计算，不会被上传或记录。',
        faqs: [
          {
            question: '为什么 1 月 31 日加 1 个月不是 3 月 2/3 日？',
            answer:
              '本工具对年、月偏移采用日历月钳制：先推进月份，再取「原日」与「目标月最后一天」中较小者。因此 2024-01-31 +1 月落在 2 月最后一天 2024-02-29；平年 2023-01-31 +1 月则为 2023-02-28。2024-02-29 +1 年同样钳制为 2025-02-28。',
          },
          {
            question: '日期差的「年/月/日分解」按什么口径计算？',
            answer:
              '采用与 Excel DATEDIF 一致的「完整月 + 借位」口径：先按完整月推进，日位不足时借一个自然月。例如 2024-01-01 → 2024-03-01 为 0 年 2 月 0 日，总天数则为 60 天（含闰年 2 月的 29 天）。结束日早于起始日时所有结果为负。',
          },
          {
            question: '工作日统计包含法定节假日吗？',
            answer:
              '不包含节假日调休表，仅按周一至周五计数，周六、周日剔除。区间采用半开区间 [起始, 结束)；勾选「包含起止两天」后会额外把结束日计入（若结束日为工作日）。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first date arithmetic tool with two deterministic calculators. Date difference: pick a start and end date (down to the minute) and get a years/months/days breakdown plus total days, hours and minutes, with options to include both endpoint days and to count weekdays only (Mon–Fri, no holiday calendar). Date arithmetic: apply one or more signed year/month/week/day/hour/minute offsets to a base date and get the target date and its weekday. Everything is computed from UTC timestamps—immune to browser time zones and DST—and month/year offsets clamp to month-end.',
        coreFeatures: [
          'Two-date difference: years/months/days breakdown plus total days/hours/minutes, with day or minute precision',
          'Options to include both endpoint days (+1) and to count weekdays (Monday–Friday) only',
          'Date arithmetic supports multiple signed year/month/week/day/hour/minute offsets applied in sequence',
          'Month-end clamping: 2024-01-31 + 1 month → 2024-02-29; 2024-02-29 + 1 year → 2025-02-28',
          'Target weekday shown; UTC-millisecond math, fully local with no network requests',
        ],
        howToUse: [
          'On the "Date Difference" tab pick start and end datetimes; toggle day vs minute precision at the top',
          'Check "include both endpoints" or "weekdays only" as needed; results update instantly',
          'Switch to "Date Arithmetic", choose a base date and enter an offset (negative allowed) with its unit',
          'Use "Add another offset" to combine segments and the trash icon to remove one; the result shows target date and weekday',
        ],
        useCases: [
          'Counting days remaining for contracts, visas and certificates, or project duration (weekdays only supported)',
          'Deriving due dates by adding calendar months with automatic month-end handling',
          'Verifying age and tenure breakdowns as well as leap-year and cross-year date math',
        ],
        privacyNote: 'All date input is computed locally in the browser and is never uploaded or logged.',
        faqs: [
          {
            question: 'Why does January 31 plus one month not become March 2 or 3?',
            answer:
              'Year/month offsets use calendar-month clamping: the month advances first and the day becomes min(original day, last day of the target month). So 2024-01-31 + 1 month lands on the last day of February, 2024-02-29; in a common year 2023-01-31 + 1 month is 2023-02-28. Likewise 2024-02-29 + 1 year clamps to 2025-02-28.',
          },
          {
            question: 'What is the years/months/days breakdown based on?',
            answer:
              'It follows the "complete months with borrowing" convention like Excel DATEDIF: advance by whole months first and borrow a calendar month when the day is insufficient. For example 2024-01-01 → 2024-03-01 is 0y 2m 0d, while total days equals 60 (including the 29-day leap February). All results are negative when the end precedes the start.',
          },
          {
            question: 'Does the weekday count include public holidays?',
            answer:
              'No—there is no holiday calendar; it counts Monday to Friday and excludes Saturday and Sunday. The range is half-open [start, end); checking "include both endpoints" additionally counts the end date if it is a weekday.',
          },
        ],
      },
    },
  },
  {
    slug: 'sri-hash-generator',
    name: 'SRI 子资源完整性哈希生成器',
    nameEn: 'SRI Hash Generator (Subresource Integrity)',
    description:
      '输入文本或选择本地文件，计算 SHA-256 / SHA-384 / SHA-512 摘要并生成可直接粘贴到 script / link 标签 integrity 属性的哈希串（sha256-<base64> 格式，支持多算法空格组合）；也可粘贴 integrity 串校验内容是否匹配，逐条给出匹配结论。全程浏览器本地计算，文件不上传。',
    descriptionEn:
      'Paste text or pick a local file to compute SHA-256/SHA-384/SHA-512 digests formatted as integrity strings (sha256-<base64>, combinable with spaces) ready for script/link integrity attributes; or verify content against an existing integrity string with per-hash match results. Everything runs locally in the browser; files are never uploaded.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/sri-hash-generator',
    iconName: 'ShieldCheck',
    tags: ['SRI', 'integrity', '子资源完整性', 'SHA-256', 'CDN', 'CSP'],
    tagsEn: ['SRI', 'Integrity', 'Subresource Integrity', 'SHA-256', 'CDN', 'CSP'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'console.log("Hello, SRI");',
    doc: {
      zh: {
        whatIsIt:
          '一款纯浏览器本地运行的子资源完整性（Subresource Integrity，SRI）工具。对文本或本地文件按 SHA-256 / SHA-384 / SHA-512 计算摘要，并以 SRI 规范要求的 base64 编码产出 `<alg>-<digest>` 形式的哈希串，可直接粘贴到 `<script>` / `<link>` 标签的 integrity 属性中；勾选多个算法时以空格连接（浏览器在至少一条强摘要匹配时放行）。校验模式下，给定 integrity 串与当前内容，逐条报告每个算法是否匹配，用于排查 CDN 资源是否被篡改。文件内容只在浏览器内读取，不发起任何网络请求。',
        coreFeatures: [
          '生成 sha256 / sha384 / sha512 三种 SRI 哈希，输出标准 base64 摘要与算法前缀',
          '支持多算法组合（空格分隔），一次产出可直接粘贴的完整 integrity 属性值',
          '支持文本（UTF-8）与本地文件两种输入载体，100MB 内文件本地读取不上传',
          '校验模式逐条展示每个哈希是否匹配，并解析 ?option 段与大小写归一化',
          '非法元数据（未知算法、缺少摘要、格式错误）给出明确中文错误',
        ],
        howToUse: [
          '在「生成 integrity 哈希」模式输入文本或选择本地文件，勾选需要的算法（可多选）',
          '结果区即时显示每条哈希，点击「复制 integrity 串」获取空格连接的完整属性值',
          '将其粘贴到 script/link 标签的 integrity 属性，并配合 crossorigin="anonymous"',
          '切换到「校验 integrity 串」模式，提供内容并粘贴待校验串，查看逐条匹配结论',
        ],
        useCases: [
          '前端接入 CDN 第三方 JS/CSS 时生成 integrity 属性，替代手写 openssl 命令',
          '核对下载资源与官方文档给出的 SRI 串是否一致，排查供应链篡改',
          '为自建静态资源生成多算法哈希，兼容不同 CSP 与浏览器策略',
        ],
        privacyNote:
          '文本与文件仅在浏览器本地参与摘要计算，不会被上传、记录或发送到任何服务端。',
        faqs: [
          {
            question: '为什么不用现有的哈希生成器？',
            answer:
              '普通哈希工具输出的是十六进制摘要（hex），而 SRI 规范要求 base64 编码的摘要并带 `sha256-` 前缀，最终还要组装成可直接用于 integrity 属性的字符串。本工具产出的就是可直接粘贴的最终格式，并额外提供文件输入与完整性校验模式。',
          },
          {
            question: '多个算法的哈希如何组合？浏览器如何判定？',
            answer:
              '多个哈希以空格连接放在同一个 integrity 属性中，例如 `sha256-AAA sha384-BBB`。按 SRI 规范，浏览器忽略无法识别的算法，只要存在至少一条可识别的强摘要与资源实际摘要相等即通过校验；全部不匹配则拒绝加载该资源。',
          },
          {
            question: '为什么校验时文件输入有大小限制？',
            answer:
              '文件在浏览器内一次性读入内存并交给 Web Crypto 计算，为避免超大文件导致页面内存压力，工具限制为 100MB。SRI 面向的脚本、样式表等静态资源通常远小于该体积。',
          },
        ],
      },
      en: {
        whatIsIt:
          'A local-first Subresource Integrity (SRI) tool. It digests text or local files with SHA-256/SHA-384/SHA-512 and emits base64-encoded `<alg>-<digest>` strings per the SRI spec, ready to paste into the integrity attribute of <script>/<link> tags; multiple algorithms are joined with spaces (the browser loads the resource when at least one strong hash matches). In verify mode, each hash of a given integrity string is checked against the current content individually—handy for detecting CDN tampering. Files are read only inside the browser with no network requests.',
        coreFeatures: [
          'Generates sha256/sha384/sha512 SRI hashes with standard base64 digests and algorithm prefixes',
          'Multi-algorithm combinations joined by spaces produce a ready-to-paste integrity value',
          'Two input sources: UTF-8 text and local files (up to 100MB), never uploaded',
          'Verify mode reports per-hash matches, parses ?option segments and normalizes casing',
          'Clear Chinese error messages for malformed metadata (unknown algorithm, missing digest, bad format)',
        ],
        howToUse: [
          'In "Generate integrity hash" mode, enter text or pick a file and tick the algorithms (multi-select)',
          'Each hash appears instantly; click "Copy integrity string" for the space-joined value',
          'Paste it into a script/link integrity attribute together with crossorigin="anonymous"',
          'Switch to "Verify integrity string", provide content and the string to check per-hash results',
        ],
        useCases: [
          'Generating integrity attributes for third-party CDN JS/CSS without hand-running openssl',
          'Checking downloaded resources against SRI strings from official docs to detect supply-chain tampering',
          'Producing multi-algorithm hashes for self-hosted assets across CSP and browser policies',
        ],
        privacyNote:
          'Text and files are digested locally in the browser and are never uploaded, logged, or sent to any server.',
        faqs: [
          {
            question: 'Why not just use the existing hash generator?',
            answer:
              'A regular hash tool outputs hexadecimal digests, whereas SRI requires base64-encoded digests with a `sha256-` prefix assembled into a final integrity attribute value. This tool emits that final paste-ready format, adds file input, and provides an integrity verification mode.',
          },
          {
            question: 'How are multiple algorithms combined, and how does the browser decide?',
            answer:
              'Hashes are joined with spaces in one integrity attribute, e.g. `sha256-AAA sha384-BBB`. Per the SRI spec, the browser ignores unrecognized algorithms and loads the resource if at least one recognized strong digest equals the actual resource digest; if none match, the resource is blocked.',
          },
          {
            question: 'Why is file input size-limited?',
            answer:
              'Files are read fully into memory and digested via Web Crypto; to avoid memory pressure on very large files the limit is 100MB. Scripts, stylesheets and other static assets protected by SRI are typically far smaller.',
          },
        ],
      },
    },
  },
  {
    slug: 'hkdf-calculator',
    name: 'HKDF 密钥派生计算器',
    nameEn: 'HKDF Key Derivation Calculator (RFC 5869)',
    description:
      '基于 RFC 5869 HKDF（Extract-then-Expand）从输入密钥材料 IKM 派生密钥，支持可选 salt 与 info、SHA-256 / SHA-384 / SHA-512，同时展示 Extract 阶段伪随机密钥 PRK 与 Expand 阶段输出 OKM（Hex + Base64）。IKM/salt/info 均可按文本、Hex、Base64 三种载体输入，内置 RFC 5869 官方向量可一键对照。全程浏览器本地计算。',
    descriptionEn:
      'Derive keys with RFC 5869 HKDF (Extract-then-Expand): optional salt and info, SHA-256/384/512, showing both the Extract-stage pseudorandom key (PRK) and the Expand-stage output keying material (OKM in Hex and Base64). IKM, salt and info each accept text, Hex or Base64; built-in RFC 5869 test vectors load with one click for verification. Everything runs locally in the browser.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/hkdf-calculator',
    iconName: 'KeyRound',
    tags: ['HKDF', 'RFC 5869', '密钥派生', 'KDF', 'PRK', 'Web Crypto'],
    tagsEn: ['HKDF', 'RFC 5869', 'Key Derivation', 'KDF', 'PRK', 'Web Crypto'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'my-secret-key-material',
    doc: {
      zh: {
        whatIsIt:
          'HKDF（HMAC-based Key Derivation Function，RFC 5869）是从高熵输入密钥材料（IKM）派生出一个或多个安全密钥的标准 KDF，广泛用于 TLS 1.3、Signal、JWT 与各类加密 SDK。它分为两步：Extract 以 salt 对 IKM 做 HMAC 得到定长伪随机密钥 PRK；Expand 结合 info 上下文将 PRK 扩展为指定长度的输出密钥材料 OKM。本工具基于浏览器 Web Crypto 原语完整执行两步，并把中间 PRK 一并展示，便于协议调试与跨语言实现对账。IKM、salt、info 均支持文本（UTF-8）、Hex、Base64（含 Base64URL）三种载体，一键载入 RFC 5869 官方案例后可逐字节比对。',
        coreFeatures: [
          '完整实现 RFC 5869 Extract-then-Expand，同时输出 PRK 与 OKM',
          'SHA-256 / SHA-384 / SHA-512 三种底层哈希，OKM 长度 1 至 255×HashLen 可调',
          'IKM、salt、info 各自独立选择文本 / Hex / Base64 载体，Hex 允许 0x 前缀与空白',
          'OKM 同时给出 Hex 与 Base64，一键复制，方便对接各类语言的密钥参数',
          '内置 RFC 5869 Test Case 1 官方向量，一键载入即可反向验证实现正确性',
        ],
        howToUse: [
          '在 IKM 区粘贴输入密钥材料，并用右侧切换按钮选择其载体（文本 / Hex / Base64）',
          '按需填写 salt 与 info（均可留空；salt 留空时按 RFC 使用 HashLen 个全零字节）',
          '选择哈希算法并设置输出长度（字节），结果区即时显示 PRK 与 OKM',
          '点击「RFC 5869 向量示例」载入官方案例，可与 RFC 文档中的 PRK/OKM 逐字节对照',
        ],
        useCases: [
          '调试 TLS / E2EE / JWT 等协议中的密钥派生，与后端或其他语言实现对账',
          '为应用从主密钥派生多个场景子密钥（结合不同 info 做域分离）',
          '学习 HKDF 原理时观察 Extract 与 Expand 的中间产物 PRK / OKM',
        ],
        privacyNote:
          '所有密钥材料仅在浏览器本地通过 Web Crypto 计算，不会被上传、记录或发送到任何服务端。',
        faqs: [
          {
            question: 'PRK 和 OKM 分别是什么？为什么都要展示？',
            answer:
              'PRK（Pseudorandom Key）是 Extract 阶段的输出，即 HMAC-Hash(salt, IKM)，长度固定为 HashLen；OKM（Output Keying Material）是 Expand 阶段结合 info 扩展出的最终密钥，长度由调用方指定。展示 PRK 有助于定位 Extract 与 Expand 哪一步与对端不一致，是协议联调时的关键中间值。',
          },
          {
            question: 'salt 和 info 可以留空吗？',
            answer:
              '都可以。salt 留空时 RFC 5869 规定使用 HashLen 个全零字节执行 Extract；info 留空即不带任何上下文参与 Expand。生产环境建议提供随机且各部署独立的 salt 以获得更好的密钥分离效果，并用不同 info 派生不同用途的子密钥。',
          },
          {
            question: '输出长度为什么有上限？',
            answer:
              'RFC 5869 规定 Expand 最多迭代 255 次，每次输出 HashLen 字节，因此 OKM 最大长度为 255×HashLen：SHA-256 为 8160 字节、SHA-384 为 12240、SHA-512 为 16320。超出上限在数学上不被 HKDF 允许，工具会直接报错。',
          },
        ],
      },
      en: {
        whatIsIt:
          'HKDF (HMAC-based Key Derivation Function, RFC 5869) is the standard KDF for deriving one or more secure keys from high-entropy input keying material (IKM), used in TLS 1.3, Signal, JWT and countless crypto SDKs. It runs in two steps: Extract applies HMAC with a salt to the IKM, producing a fixed-length pseudorandom key (PRK); Expand combines the PRK with context info and expands it to output keying material (OKM) of any requested length. This tool performs both steps with the browser Web Crypto primitives and exposes the intermediate PRK for protocol debugging and cross-language reconciliation. IKM, salt and info each accept text (UTF-8), Hex or Base64 (Base64URL tolerated), and official RFC 5869 test cases load with one click.',
        coreFeatures: [
          'Full RFC 5869 Extract-then-Expand, outputting both PRK and OKM',
          'SHA-256/SHA-384/SHA-512; OKM length adjustable from 1 to 255×HashLen',
          'Independent text/Hex/Base64 source selection for IKM, salt and info (0x prefix and whitespace tolerated in Hex)',
          'OKM shown in both Hex and Base64 with one-click copy for cross-language integration',
          'Built-in RFC 5869 Test Case 1 vector loads instantly to independently verify the implementation',
        ],
        howToUse: [
          'Paste input keying material into the IKM field and pick its source format (text/Hex/Base64) on the right',
          'Optionally fill salt and info (both may be empty; empty salt means HashLen zero bytes per the RFC)',
          'Choose the hash and output length in bytes; PRK and OKM update instantly',
          'Click "RFC 5869 vector sample" to load the official case and compare PRK/OKM byte-by-byte against the RFC',
        ],
        useCases: [
          'Debugging key derivation in TLS/E2EE/JWT protocols and reconciling with backend or other-language implementations',
          'Deriving multiple purpose-bound subkeys from a master key using distinct info values for domain separation',
          'Learning how HKDF works by inspecting the Extract and Expand intermediates PRK and OKM',
        ],
        privacyNote:
          'All key material is computed locally in your browser via Web Crypto and is never uploaded, logged, or sent to any server.',
        faqs: [
          {
            question: 'What are PRK and OKM, and why show both?',
            answer:
              'The PRK (Pseudorandom Key) is the fixed-length HashLen output of Extract, HMAC-Hash(salt, IKM). The OKM (Output Keying Material) is the final caller-specified-length key produced by Expand with info. Showing the PRK helps pinpoint whether a mismatch with a peer lies in Extract or Expand—an essential intermediate value in protocol integration.',
          },
          {
            question: 'Can salt and info be empty?',
            answer:
              'Yes, both. When salt is omitted, RFC 5869 uses HashLen zero bytes for Extract. Empty info simply means no context participates in Expand. In production a random per-deployment salt improves key separation, and distinct info values should derive keys for different purposes.',
          },
          {
            question: 'Why is there an output length limit?',
            answer:
              'RFC 5869 allows at most 255 Expand iterations of HashLen bytes each, so OKM is capped at 255×HashLen: 8160 bytes for SHA-256, 12240 for SHA-384 and 16320 for SHA-512. Longer outputs are mathematically outside HKDF and the tool rejects them.',
          },
        ],
      },
    },
  },
  {
    slug: 'pbkdf2-calculator',
    name: 'PBKDF2 密钥派生计算器',
    nameEn: 'PBKDF2 Key Derivation Calculator (RFC 8018)',
    description:
      '基于 RFC 8018（PKCS#5 v2.1）PBKDF2 从口令派生密钥：输入口令、salt（文本或 Hex）、迭代次数、派生密钥长度与底层哈希（SHA-1 / SHA-256 / SHA-384 / SHA-512），输出派生密钥 DK 的十六进制与 Base64。内置 RFC 8018 官方测试向量可一键载入对照，适合生成测试向量、校验后端口令哈希配置与学习迭代参数。全程浏览器本地计算，口令不上传。',
    descriptionEn:
      'Derive keys from passwords with PBKDF2 (RFC 8018/PKCS#5 v2.1): enter a password, salt (text or Hex), iteration count, derived-key length and hash (SHA-1/SHA-256/SHA-384/SHA-512) to get DK in hex and Base64. Official RFC 8018 test vectors load with one click—handy for generating vectors, validating backend password-hash config and studying iteration costs. Everything runs locally in the browser; passwords never leave the device.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/pbkdf2-calculator',
    iconName: 'Fingerprint',
    tags: ['PBKDF2', 'RFC 8018', '口令派生', '密码哈希', 'KDF', 'Web Crypto'],
    tagsEn: ['PBKDF2', 'RFC 8018', 'Password KDF', 'Password Hashing', 'KDF', 'Web Crypto'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'password',
    doc: {
      zh: {
        whatIsIt:
          'PBKDF2（Password-Based Key Derivation Function 2，RFC 8018 / PKCS#5 v2.1）是从口令派生密钥的标准算法：通过对“口令 + 随机 salt”反复执行 HMAC 数千至数十万次，显著提高离线暴力破解成本，被 NIST SP 800-132、WPA2、iOS 数据保护等广泛采用。本工具暴露 PBKDF2 的全部关键参数——口令 P、salt S、迭代次数 c、派生密钥长度 dkLen 与底层哈希（SHA-1/256/384/512），输出 DK 的十六进制与 Base64，并可一键载入 RFC 8018 §B.1 官方测试向量逐字节对照。与仓库内 symmetric-crypto 不同：其内部 PBKDF2 绑定 AES-GCM、SHA-256 与固定 600000 次迭代且不输出通用 DK，本工具面向任意参数组合。',
        coreFeatures: [
          '支持 SHA-1 / SHA-256 / SHA-384 / SHA-512，迭代次数与 dkLen 完全自定义',
          'DK 同时输出十六进制与 Base64，一键复制对接各语言参数',
          'salt 支持文本（UTF-8）与十六进制两种载体，Hex 允许 0x 前缀与空白，非法格式明确报错',
          '内置 RFC 8018 §B.1 / RFC 7914 官方向量一键载入，可反向验证实现正确性',
          '高迭代次数给出耗时提示；口令以密码框输入，全程经 Web Crypto 本地运算',
        ],
        howToUse: [
          '输入口令 P（按 UTF-8 编码为密钥材料）',
          '填写 salt 并选择其载体（文本或 Hex）；用于真实系统时 salt 应随机且每用户唯一',
          '选择哈希算法，设置迭代次数 c 与输出长度 dkLen（字节），结果区即时显示 DK',
          '点击「RFC 8018 向量示例」载入官方案例（c=4096、SHA-1、dkLen=20）与标准结果对照',
        ],
        useCases: [
          '生成 PBKDF2 测试向量，与后端 Java/Go/Python/Node 实现逐字节对账',
          '校验数据库中既有口令哈希的算法、迭代次数与长度配置是否与文档一致',
          '评估不同迭代次数 / 哈希算法在端侧的耗时，选定安全与体验平衡的参数',
        ],
        privacyNote:
          '口令与 salt 仅在浏览器本地通过 Web Crypto 参与计算，不会被上传、记录或发送到任何服务端。',
        faqs: [
          {
            question: 'PBKDF2 和 HKDF 有什么区别？',
            answer:
              'PBKDF2 的输入是低熵口令，通过大量迭代故意“变慢”来抵抗离线暴力破解；HKDF（RFC 5869）的输入是高熵密钥材料（如协商出的共享密钥），通过 Extract-then-Expand 快速派生多个子密钥，不做慢哈希。前者面向“人记得住的密码”，后者面向“已经很强的密钥”。',
          },
          {
            question: '迭代次数应该设多少？',
            answer:
              '没有固定值，原则是在目标设备可接受的延迟内尽量大。OWASP 2023 建议 PBKDF2-HMAC-SHA-256 至少 600000 次（SHA-512 至少 210000 次）；旧系统常见 10000 / 100000 次。应在自己的服务端与客户端实测后选定，并允许随硬件演进升级。',
          },
          {
            question: '为什么默认参数和 RFC 向量的算法不一样？',
            answer:
              '工具默认采用面向现代用途的 SHA-256、600000 次迭代、32 字节输出；RFC 8018 发布于 2017 年，其官方测试向量为历史上的 SHA-1、c=4096、dkLen=20，仅用于验证实现是否符合规范，不代表推荐的生产参数。点击「RFC 8018 向量示例」即切换到规范参数。',
          },
        ],
      },
      en: {
        whatIsIt:
          'PBKDF2 (Password-Based Key Derivation Function 2, RFC 8018/PKCS#5 v2.1) derives keys from passwords: HMAC is applied thousands to hundreds of thousands of times over the password and a random salt, raising the cost of offline brute-force attacks. It is used by NIST SP 800-132, WPA2 and iOS data protection. This tool exposes every key parameter—password P, salt S, iteration count c, derived-key length dkLen and hash (SHA-1/256/384/512)—and emits DK in hex and Base64. Official RFC 8018 §B.1 vectors load with one click for byte-level comparison. Unlike the built-in symmetric-crypto tool, whose internal PBKDF2 is hardwired to AES-GCM/SHA-256/600000 iterations without exposing a generic DK, this calculator accepts any parameter combination.',
        coreFeatures: [
          'SHA-1/SHA-256/SHA-384/SHA-512 with fully custom iteration count and dkLen',
          'DK output in both hex and Base64 with one-click copy for cross-language integration',
          'Salt accepts UTF-8 text or hex (0x prefix and whitespace tolerated) with explicit errors for malformed hex',
          'Built-in RFC 8018 §B.1 / RFC 7914 vectors load instantly to independently verify the implementation',
          'Timing hint for high iteration counts; password entered in a masked field, computed locally via Web Crypto',
        ],
        howToUse: [
          'Enter the password P (encoded as UTF-8 key material)',
          'Provide the salt and pick its source format (text or Hex); for real systems the salt must be random and unique per user',
          'Choose the hash, set the iteration count c and output length dkLen in bytes; DK appears instantly',
          'Click "RFC 8018 vector sample" to load the official case (c=4096, SHA-1, dkLen=20) and compare against the standard',
        ],
        useCases: [
          'Generating PBKDF2 test vectors to reconcile byte-by-byte with Java/Go/Python/Node backends',
          'Checking whether algorithm, iteration count and length of existing password hashes match the documented config',
          'Benchmarking iteration counts and hashes on-device to pick parameters balancing security and UX',
        ],
        privacyNote:
          'Passwords and salts are computed locally in the browser via Web Crypto and are never uploaded, logged, or sent to any server.',
        faqs: [
          {
            question: 'What is the difference between PBKDF2 and HKDF?',
            answer:
              'PBKDF2 takes a low-entropy password and deliberately slows derivation with many iterations to resist offline brute force. HKDF (RFC 5869) takes high-entropy key material (such as an agreed shared secret) and quickly derives multiple subkeys via Extract-then-Expand—no slow hashing. One is for human-memorable passwords, the other for keys that are already strong.',
          },
          {
            question: 'How many iterations should I use?',
            answer:
              'There is no fixed number; pick the largest value acceptable on the slowest target device. OWASP 2023 recommends at least 600000 for PBKDF2-HMAC-SHA-256 (210000 for SHA-512); 10000/100000 are common in older systems. Benchmark on your own client and server, and keep the value upgradable as hardware evolves.',
          },
          {
            question: 'Why do the defaults differ from the RFC vector parameters?',
            answer:
              'The defaults target modern use (SHA-256, 600000 iterations, 32-byte output). RFC 8018 dates to 2017 and its official vectors use the historical SHA-1, c=4096, dkLen=20 purely to validate spec conformance—not to recommend production parameters. "RFC 8018 vector sample" switches to the spec parameters.',
          },
        ],
      },
    },
  },
  {
    slug: 'json-patch',
    name: 'JSON Patch 补丁工具',
    nameEn: 'JSON Patch Tool (RFC 6902)',
    description:
      '按 RFC 6902 对 JSON 文档顺序应用补丁数组：支持 add / remove / replace / move / copy / test 六个操作与 RFC 6901 JSON Pointer 路径（含 ~0、~1 转义与数组下标、"-" 追加）。实时展示结果文档，或返回带操作序号的精确错误（op 未知、路径不存在、数组越界、test 断言不匹配等），失败时不产生部分结果。纯函数、零依赖、全程离线。',
    descriptionEn:
      'Apply RFC 6902 patch arrays to a JSON document: all six ops (add/remove/replace/move/copy/test) with RFC 6901 JSON Pointer paths (~0/~1 escaping, array indices and "-" append). See the result live, or get a precise error with the operation index—unknown op, missing path, out-of-bounds index, failed test assertion—with no partial result on failure. Pure functions, zero dependencies, fully offline.',
    category: ToolCategoryEnum.DATA_JSON,
    path: '/tools/json-patch',
    iconName: 'Braces',
    tags: ['JSON Patch', 'RFC 6902', 'JSON Pointer', 'RFC 6901', '数据转换', '离线'],
    tagsEn: ['JSON Patch', 'RFC 6902', 'JSON Pointer', 'RFC 6901', 'Data Transform', 'Offline'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '{"title":"Goodbye!","tags":["example"]}',
    doc: {
      zh: {
        whatIsIt:
          'JSON Patch（RFC 6902）是一种用“操作数组”描述 JSON 文档变更的标准格式：每个操作声明 op（add/remove/replace/move/copy/test）、path（RFC 6901 JSON Pointer）以及 value 或 from，补丁按数组顺序依次应用，任一操作失败则整个补丁失败。相比 RFC 7386 Merge Patch 的“整体合并、null 删除”，JSON Patch 能精确表达数组插入、键移动、复制与前置断言，是 Kubernetes、JSON API 等生态采用的补丁格式。本工具以零依赖纯函数实现完整规范，并在出错时给出“第 N 个操作失败 + 具体原因”的操作级诊断。',
        coreFeatures: [
          '完整支持 RFC 6902 六操作：add / remove / replace / move / copy / test，按顺序应用',
          '完整 RFC 6901 JSON Pointer 解析：/ 分段、~1 表示 /、~0 表示 ~，数组下标与 "-" 末尾追加',
          '操作级错误诊断：明确指出失败操作的序号、op 名称与原因（路径不存在、越界、test 不匹配等）',
          '原子语义：任一操作失败即整体返回错误，不会产生半应用状态；原文档绝不被修改',
          '纯函数零依赖，所有解析与运算在浏览器本地完成，可离线使用',
        ],
        howToUse: [
          '在左栏粘贴原始 JSON 文档，右栏填写补丁操作数组（每个元素含 op 与 path）',
          'add/replace/test 需提供 value；move/copy 需提供 from（均为 JSON Pointer 字符串）',
          '结果区实时显示应用后的文档与已应用操作数；点击「错误示例」可查看操作级错误定位',
          '点击「复制结果」复制输出 JSON；数组插入用从 0 开始的下标，追加到末尾使用 "-"',
        ],
        useCases: [
          '构造或调试发送给 Kubernetes / JSON API 等服务的 JSON Patch 请求体',
          '核对多语言 RFC 6902 实现的行为，尤其是 move 数组元素与转义路径等边界情况',
          '用 test 操作作为变更前置断言，安全地批量编辑大型 JSON 配置',
        ],
        privacyNote:
          '文档与补丁仅在浏览器本地解析与运算，不会被上传、记录或发送到任何服务端。',
        faqs: [
          {
            question: 'JSON Patch 和 JSON Merge Patch（RFC 7386）有什么区别？',
            answer:
              'Merge Patch 用一个与原文档同形的补丁做递归合并，补丁中为 null 的键被删除，数组只能整体替换，无法表达数组插入、移动或断言；JSON Patch（RFC 6902）用显式操作数组做路径级修改，支持数组按下标插入/删除、move/copy 与 test 断言，但补丁本身更长。需要简单合并用 Merge Patch，需要精确操作选 JSON Patch。',
          },
          {
            question: '为什么某一步失败后结果整个消失了？',
            answer:
              'RFC 6902 规定操作按顺序应用，任一操作失败则整个补丁失败、文档保持原样（原子性）。错误提示会给出失败操作的序号与原因（如“第 2 个操作（remove）失败：数组下标 9 越界”），修正该操作后重新应用即可。',
          },
          {
            question: '路径中的 ~ 和 / 怎么写？',
            answer:
              'JSON Pointer 以 / 分段，因此键名里若本身含 / 需写成 ~1，含 ~ 需写成 ~0（先转义 ~ 再转义 /）。例如键 "a/b" 的路径是 /a~1b，键 "m~n" 的路径是 /m~0n。空字符串作为键时路径以结尾的 / 表示，如 "/" 指向根下的空键。',
          },
        ],
      },
      en: {
        whatIsIt:
          'JSON Patch (RFC 6902) describes changes to a JSON document as an array of operations: each one declares an op (add/remove/replace/move/copy/test), a path (RFC 6901 JSON Pointer) and a value or from; operations apply in order and any failure aborts the whole patch. Compared with RFC 7386 Merge Patch (whole-document merge, null means delete), JSON Patch precisely expresses array insertion, key moves, copies and preconditions, and is used by Kubernetes and JSON API ecosystems. This tool implements the full spec with zero-dependency pure functions and reports operation-level diagnostics—“operation N failed” plus the exact reason.',
        coreFeatures: [
          'All six RFC 6902 ops: add/remove/replace/move/copy/test, applied in order',
          'Full RFC 6901 JSON Pointer: / segments, ~1 for /, ~0 for ~, array indices and "-" append',
          'Operation-level errors: sequence number, op name and reason (missing path, out of bounds, test mismatch)',
          'Atomic semantics: any failure aborts the patch with no half-applied state; the input document is never mutated',
          'Pure functions and zero dependencies; parsing and computation run entirely in the browser, offline-capable',
        ],
        howToUse: [
          'Paste the original JSON document in the left panel and the patch array (objects with op and path) on the right',
          'add/replace/test require value; move/copy require from (both JSON Pointer strings)',
          'The result document and applied-op count appear live; click "Error sample" to see operation-level error location',
          'Use "Copy result" for the output; array indices are zero-based and "-" appends at the end',
        ],
        useCases: [
          'Building or debugging JSON Patch request bodies for Kubernetes, JSON API and similar services',
          'Cross-checking RFC 6902 implementations across languages, including array move and escaped-path edge cases',
          'Batch-editing large JSON configs safely by using test ops as preconditions',
        ],
        privacyNote:
          'Documents and patches are parsed and computed locally in the browser and are never uploaded, logged, or sent to any server.',
        faqs: [
          {
            question: 'How is JSON Patch different from JSON Merge Patch (RFC 7386)?',
            answer:
              'Merge Patch recursively merges a document-shaped patch: null deletes a key and arrays can only be replaced wholesale, so array insertion, moves and assertions are impossible. JSON Patch (RFC 6902) uses an explicit operation array for path-level changes—indexed array insert/remove, move/copy and test assertions—at the cost of a longer patch. Use Merge Patch for simple merges and JSON Patch for precise operations.',
          },
          {
            question: 'Why does the result disappear entirely after one failed step?',
            answer:
              'RFC 6902 applies operations in order and any failure aborts the entire patch, leaving the document unchanged (atomicity). The error names the failing sequence number and reason—e.g. “operation 2 (remove) failed: array index 9 out of bounds”. Fix that operation and reapply.',
          },
          {
            question: 'How do I write ~ and / inside a path?',
            answer:
              'JSON Pointer splits on /, so a literal / in a key is written ~1 and a literal ~ is ~0 (escape ~ before /). The key "a/b" is addressed as /a~1b and "m~n" as /m~0n. An empty-string key is addressed with a trailing slash, e.g. "/" points at the empty key under root.',
          },
        ],
      },
    },
  },
  {
    slug: 'json-key-case',
    name: 'JSON 键名命名风格转换',
    nameEn: 'JSON Key Case Converter',
    description:
      '粘贴一段 JSON，递归遍历所有嵌套对象与数组，把全部键名在 camelCase、PascalCase、snake_case、SCREAMING_SNAKE_CASE、kebab-case 之间批量互转，数据值与层级结构原样保留。自动识别连续大写缩写（HTMLElement）与数字边界（v2），并检测同级转换后撞键（如 user_id 与 userId）且给出含路径的错误。实时输出、一键复制，纯函数、零新增运行时依赖、全程离线。',
    descriptionEn:
      'Paste JSON and recursively rewrite every object key across nested objects and arrays between camelCase, PascalCase, snake_case, SCREAMING_SNAKE_CASE and kebab-case, while values and structure stay untouched. It recognizes acronym runs (HTMLElement) and digit boundaries (v2), and detects same-level key collisions after conversion (e.g. user_id vs userId) with a path-aware error. Live output, one-click copy, pure functions, zero new runtime dependencies, fully offline.',
    category: ToolCategoryEnum.DATA_JSON,
    path: '/tools/json-key-case',
    iconName: 'Type',
    tags: ['JSON', '键名', 'camelCase', 'snake_case', '命名风格', '离线'],
    tagsEn: ['JSON', 'Keys', 'camelCase', 'snake_case', 'Naming', 'Offline'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '{"user_id":1,"user_name":"alice","is_active":true}',
    doc: {
      zh: {
        whatIsIt:
          '这是一个“感知 JSON 结构”的键名批量转换器：它先把输入解析为 JSON，再递归遍历每一层对象（数组会逐元素深入），仅重写对象的键名，字符串、数字、布尔、null 等数据值以及嵌套层级原样保留。与「文本命名风格转换」只对整段纯文本做替换不同，本工具不会改动值内部的文字；与 JSON Flatten 类工具不同，它不打平层级；与 JSON to TypeScript 类工具不同，它输出的仍是数据而非类型声明。分词采用通用规则：在大小写边界、连续大写缩写边界（HTMLElement → html element）、字母与数字相邻处（v2 → v、2）以及非字母数字分隔符处切分，再按目标风格重组。若同一对象内两个不同原键转换后变成同一名字，会报告包含 JSON 路径的撞键错误以避免静默丢数据。',
        coreFeatures: [
          '五种命名风格互转：camelCase、PascalCase、snake_case、SCREAMING_SNAKE_CASE、kebab-case',
          '递归处理任意深度的嵌套对象与数组，仅改键名，值与键顺序保持不变',
          '智能分词：识别大小写边界、连续大写缩写（UserID、HTMLElement）与数字边界（v2 → v_2）',
          '同级撞键检测：转换后重名时给出含路径的错误（如 /profile 下 user_id 与 userId），杜绝静默覆盖',
          '实时输出并显示实际变更的键数量，一键复制；纯函数零新增依赖，全程本地离线运算',
        ],
        howToUse: [
          '在左栏粘贴或输入合法 JSON（对象、数组或标量均可），右栏实时显示转换结果',
          '通过顶部按钮选择目标命名风格，切换后结果立即重新计算',
          '结果卡片右上角显示「已转换 N 个键」，点击「复制结果」复制输出 JSON',
          '若出现「键名冲突」错误，根据提示的路径在源数据中先消歧（重命名其中一个键）再转换',
        ],
        useCases: [
          '对接命名规范不同的系统：后端 snake_case 接口与前端 camelCase 模型之间批量转换',
          '把第三方 JSON 数据统一为团队约定的键名风格后再落库或生成代码',
          '排查迁移脚本或 ORM 序列化中的键名风格问题，并提前发现转换后撞键风险',
        ],
        privacyNote:
          'JSON 仅在浏览器本地解析与转换，不会被上传、记录或发送到任何服务端。',
        faqs: [
          {
            question: '为什么提示「键名冲突」？应该怎么处理？',
            answer:
              '当同一个对象里存在两个不同的原键，转换后恰好得到相同名字时（例如同时有 user_id 和 userId，转成 camelCase 都会变成 userId），继续转换会丢失其中一个键的数据，因此工具直接报错并给出路径。请按提示路径在源 JSON 中先把其中一个键改名消歧，再重新转换。',
          },
          {
            question: '为什么 v2 被转成了 v_2，而不是 v2？',
            answer:
              '分词规则在字母与数字相邻处强制切分，因此 v2 会被拆成 v 与 2 两个词：snake_case 下为 v_2、camelCase 下重新拼回为 v2、kebab-case 下为 v-2。这样处理可以保证在任何风格之间来回转换结果都稳定、不产生歧义；连续大写缩写同理（HTMLElement → html element → htmlElement）。',
          },
          {
            question: '它和「文本命名风格转换」工具有什么区别？',
            answer:
              '文本工具对整段纯文本做风格替换，不理解 JSON 结构，可能误改字符串值里的内容。本工具先解析 JSON 再只重写对象键名，数组元素、字符串/数字等值内容与嵌套层级完全不动，还能检测转换后的同级撞键并统计变更键数；输出始终是合法 JSON。',
          },
        ],
      },
      en: {
        whatIsIt:
          'This is a JSON-aware batch key converter: it parses the input as JSON, then recursively walks every nested object (descending into arrays element by element) and rewrites only object keys, leaving string, number, boolean and null values as well as the hierarchy untouched. Unlike the plain “Text Case Converter”, which replaces text across an entire blob, it never touches content inside values; unlike flatten tools it does not flatten structure; unlike JSON-to-TypeScript tools its output is still data, not type declarations. Splitting follows common rules: boundaries at case changes, acronym runs (HTMLElement → html element), letter-digit adjacency (v2 → v, 2) and non-alphanumeric separators, then words are recomposed in the target style. If two distinct keys in the same object would become identical after conversion, a path-aware collision error is reported instead of silently dropping data.',
        coreFeatures: [
          'Convert between five styles: camelCase, PascalCase, snake_case, SCREAMING_SNAKE_CASE, kebab-case',
          'Recursively handles objects and arrays at any depth; only keys change, values and key order are preserved',
          'Smart splitting: case boundaries, acronym runs (UserID, HTMLElement) and digit boundaries (v2 → v_2)',
          'Same-level collision detection: a path-aware error when keys merge (e.g. user_id vs userId under /profile), preventing silent overwrite',
          'Live output with a count of changed keys and one-click copy; pure functions, no new dependencies, fully local and offline',
        ],
        howToUse: [
          'Paste valid JSON in the left panel (object, array or scalar); the converted result appears live on the right',
          'Pick the target naming style with the top buttons; the result is recomputed immediately on switch',
          'The result card shows “N keys converted”; click “Copy result” to copy the output JSON',
          'If a “key collision” error appears, follow the path hint to rename one of the clashing keys in the source first',
        ],
        useCases: [
          'Bridge systems with different conventions: convert between snake_case backend APIs and camelCase frontend models',
          'Normalize third-party JSON to your team’s key style before storing it or generating code',
          'Investigate key-style issues in migration scripts or ORM serialization and spot collision risks early',
        ],
        privacyNote:
          'JSON is parsed and converted locally in the browser only and is never uploaded, logged, or sent to any server.',
        faqs: [
          {
            question: 'Why do I get a “key collision” error and how do I fix it?',
            answer:
              'When two distinct keys in the same object would become identical after conversion (e.g. both user_id and userId present, and camelCase turns both into userId), continuing would silently lose one key’s data, so the tool errors out with the path. Rename one of the clashing keys in the source JSON at that path to disambiguate, then convert again.',
          },
          {
            question: 'Why does v2 become v_2 instead of v2?',
            answer:
              'The splitter forces a boundary wherever a letter and digit meet, so v2 is split into the words v and 2: v_2 in snake_case, v2 when recomposed in camelCase, and v-2 in kebab-case. This guarantees stable, unambiguous round-trips between styles. Acronym runs work the same way (HTMLElement → html element → htmlElement).',
          },
          {
            question: 'How is this different from the “Text Case Converter” tool?',
            answer:
              'The text tool rewrites an entire plain-text blob without understanding JSON, so it can also change content inside string values. This tool parses JSON first and rewrites only object keys; array elements, values such as strings and numbers, and the nesting stay completely untouched. It also detects same-level collisions after conversion, counts changed keys, and always emits valid JSON.',
          },
        ],
      },
    },
  },
  {
    slug: 'pii-mask',
    name: 'PII 敏感信息脱敏工具',
    nameEn: 'PII Masking Tool',
    description:
      '纯浏览器本地识别文本中的邮箱、手机号、身份证号、银行卡号、IP 地址与 API Key，一键脱敏并统计命中。',
    descriptionEn:
      'Detect emails, phone numbers, ID and bank card numbers, IP addresses, and API keys in text, then mask them instantly with hit counts — entirely in your browser.',
    category: ToolCategoryEnum.TEXT_CONTENT,
    path: '/tools/pii-mask',
    iconName: 'Eye',
    tags: ['PII', '脱敏', '隐私', '敏感信息', '掩码', '日志'],
    tagsEn: ['PII', 'Masking', 'Privacy', 'Redaction', 'Sensitive Data', 'Logs'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput:
      '联系人：张伟，邮箱 zhangwei@example.com，手机号：13812345678\n身份证号：11010119900307123X\n服务器：192.168.1.100 与 2001:db8::1\nAuthorization: Bearer abcdefghijklmnopqrs',
    doc: {
      zh: {
        whatIsIt:
          'PII 敏感信息脱敏工具基于一组确定性正则规则，在纯浏览器本地识别文本中的邮箱、中国大陆手机号、身份证号、银行卡号、IPv4 / IPv6 地址以及通用 API Key / Token，并按「保留首尾」或「整体替换」策略输出脱敏文本，同时给出分类命中统计。',
        coreFeatures: [
          '七类敏感信息识别：邮箱、手机号、身份证号、银行卡号、IPv4、IPv6、API Key / Token（含 Bearer 与 JWT）',
          '两种掩码策略：保留首尾的部分掩码，或等长整体替换，掩码字符可自定义',
          '类别开关：可按类别单独启用或关闭识别，适配不同脱敏场景',
          '自定义正则：每行一条补充匹配业务专属字段（如订单号），支持 /pattern/flags 写法',
          '命中明细与统计：实时显示各类别命中数量，规则按优先级占位避免重复掩码',
          '纯浏览器本地运算：文本不离开设备，适合日志、工单与配置片段脱敏',
        ],
        howToUse: [
          '将需要脱敏的文本粘贴到输入框（首次进入会自动载入示例）',
          '选择掩码策略：「保留首尾」保留可辨识前缀，「整体替换」隐藏全部字符',
          '如需修改掩码字符（默认为 *），在掩码字符输入框中填写单个字符',
          '通过类别复选框调整需要识别的敏感信息类别',
          '如有业务专属字段，在自定义正则框中每行填写一条正则，格式错误会即时提示',
          '在结果卡片查看命中统计，点击「复制脱敏结果」获取输出文本',
        ],
        useCases: [
          '提交线上日志、报错堆栈前脱敏其中的用户隐私数据',
          '客服工单、数据排障截图配文前去除手机号、证件号与密钥',
          '分享配置文件或接口报文时遮蔽 Token、IP 与银行卡号',
        ],
        privacyNote:
          '所有识别与替换均基于纯浏览器本地运算，输入文本不会被上传、记录或发送到任何服务器。',
        faqs: [
          {
            question: '识别的规则与优先级是什么？',
            answer:
              '工具按 邮箱 → 身份证号 → 银行卡号 → 手机号 → API Key / Token → IPv6 → IPv4 的顺序匹配，先命中的片段会被占位，后续规则不再覆盖同一段文本，从而避免同一段数字被重复掩码。',
          },
          {
            question: 'URL 中的内容会被误判吗？',
            answer:
              'IPv6 候选要求通过完整的地址合法性校验，且边界排除字母、数字、冒号、斜杠与点号；普通域名（如 example.com）与带端口的 URL（如 example.com:8080）不会被误判为 IP 地址。',
          },
          {
            question: '通用 API Key 的识别范围是什么？',
            answer:
              '支持形如 api_key=、token:、Authorization: 等键值赋值中的密钥段（仅掩码密钥本身，不掩码前缀）、Bearer 头中的令牌，以及三段式 JWT（eyJ 开头）。规则偏向保守以减少误报，不符合这些形态的密钥可能不会被识别，必要时可手动处理。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The PII Masking Tool uses deterministic rules to detect emails, Chinese mainland phone numbers, national ID numbers, bank card numbers, IPv4/IPv6 addresses, and generic API keys/tokens entirely in your browser, then outputs masked text with per-category hit counts using either head/tail-preserving or full replacement strategies.',
        coreFeatures: [
          'Seven sensitive categories: email, phone, ID number, bank card, IPv4, IPv6, and API key/token (including Bearer and JWT)',
          'Two masking strategies: partial masking that keeps head and tail characters, or equal-length full replacement, with a custom mask character',
          'Category toggles to enable or disable each type independently for different scenarios',
          'Custom regex rules, one per line, to cover business-specific fields such as order numbers, with /pattern/flags syntax supported',
          'Live hit statistics per category, with priority-based occupancy so one fragment is never masked twice',
          '100% in-browser processing that keeps logs, tickets, and config snippets on your device',
        ],
        howToUse: [
          'Paste the text to mask into the input box (a sample is loaded on first visit)',
          'Pick a strategy: "Keep head/tail" preserves recognizable prefixes, while "Full replace" hides every character',
          'Optionally set a single custom mask character (defaults to *)',
          'Use the category checkboxes to choose which built-in sensitive types are detected',
          'For business-specific fields, add one custom regex per line; invalid patterns trigger an inline error',
          'Review the hit counts in the result card and click "Copy masked result" to grab the output',
        ],
        useCases: [
          'Masking user privacy data before sharing production logs or error stacks',
          'Removing phone numbers, ID numbers, and secrets from support tickets or annotated screenshots',
          'Concealing tokens, IPs, and bank card numbers when sharing config files or API payloads',
        ],
        privacyNote:
          'All detection and replacement happens locally in your browser. Input text is never uploaded, logged, or sent to any server.',
        faqs: [
          {
            question: 'What are the matching rules and their priority?',
            answer:
              'Rules run in the order email → ID number → bank card → phone → API key/token → IPv6 → IPv4. A fragment matched first is occupied, so later rules never cover the same span and the same digits are never masked twice.',
          },
          {
            question: 'Will content inside URLs be misidentified?',
            answer:
              'IPv6 candidates must pass full address validation, and boundaries exclude letters, digits, colons, slashes, and dots. Ordinary domains (example.com) and URLs with ports (example.com:8080) are not mistaken for IP addresses.',
          },
          {
            question: 'What counts as a generic API key?',
            answer:
              'It detects secret segments in key-value assignments such as api_key=, token:, and Authorization: (masking only the secret, never the prefix), tokens in Bearer headers, and three-part JWTs starting with eyJ. The rules are deliberately conservative to limit false positives, so secrets in other shapes may need manual handling.',
          },
        ],
      },
    },
  },
  {
    slug: 'conventional-commit-generator',
    name: 'Conventional Commits 提交信息生成器',
    nameEn: 'Conventional Commit Message Generator',
    description:
      '通过表单选择类型、作用域、主题、正文与 footer，实时生成符合 Conventional Commits 1.0.0 的提交信息，并校验长度、祈使语气等常见问题。',
    descriptionEn:
      'Build Conventional Commits 1.0.0 messages from a form for type, scope, subject, body, and footers, with live checks for length, imperative mood, and footer format.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/conventional-commit-generator',
    iconName: 'Tags',
    tags: ['Conventional Commits', 'Git', '提交信息', '规范', 'commit'],
    tagsEn: ['Conventional Commits', 'Git', 'Commit Message', 'Convention', 'commit'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'add dark mode toggle in settings page',
    doc: {
      zh: {
        whatIsIt:
          'Conventional Commits 提交信息生成器是一款纯浏览器本地工具：通过结构化表单生成 type(scope)!: subject 形式的规范化提交信息，自动拼接正文与 footer，并实时校验主题长度、祈使语气与 footer 格式。',
        coreFeatures: [
          '内置 feat / fix / docs / style / refactor / perf / test / build / ci / chore / revert 共 11 种标准类型',
          '支持可空作用域与破坏性变更（自动追加 ! 与 BREAKING CHANGE footer）',
          '实时校验：主题为空或超长、header 超过 72 字符、英文非祈使语气、首字母大写、结尾句号等',
          'Issue / PR 引用与自定义 footer（Reviewed-by、Co-authored-by 等）逐行管理',
          '内置「新功能 / 修复缺陷 / 破坏性变更」组合模板，一键填充',
        ],
        howToUse: [
          '选择提交类型，可选填写作用域（如 web、api）',
          '用祈使语气填写主题，中文主题直接书写即可，不要加结尾句号',
          '需要时补充正文，说明「做了什么、为什么」',
          '涉及不兼容变更时勾选破坏性变更并填写说明',
          '逐行填写关联的 Issue / PR 编号与其他 footer，复制结果到 git commit',
        ],
        useCases: [
          '在协作仓库中快速写出可被 changelog 工具解析的提交信息',
          '团队新人对照校验规则学习规范化提交格式',
          '生成带 BREAKING CHANGE 与 Closes #编号的完整发布提交',
        ],
        privacyNote:
          '所有内容仅在浏览器本地拼接与校验，不会上传或记录任何信息。',
        faqs: [
          {
            question: 'header 长度限制是多少？',
            answer:
              '工具按社区惯例在 header 超过 72 字符时给出警告，主题超过 120 字符则报错；超长内容应放入正文。',
          },
          {
            question: '为什么会提示「祈使语气」？',
            answer:
              'Git 社区约定英文主题使用祈使句，如 "add" 而非 "added / adds"；该检查仅针对英文，中文主题不受影响。',
          },
          {
            question: 'footer 的合法写法是什么？',
            answer:
              '每行一个，形如 "token: value"（如 Reviewed-by: Alice）或 "token #value"（如 Closes #42）；BREAKING CHANGE 由勾选框自动生成。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Conventional Commit Message Generator is a fully in-browser tool that builds standardized type(scope)!: subject messages from a structured form, assembles body and footers, and checks subject length, imperative mood, and footer format as you type.',
        coreFeatures: [
          'Eleven standard types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, and revert',
          'Optional scope and breaking-change support (appends ! and a BREAKING CHANGE footer automatically)',
          'Live checks for empty or oversized subjects, headers longer than 72 characters, non-imperative English, capitalized first letters, and trailing periods',
          'Per-line issue/PR references and custom footers such as Reviewed-by and Co-authored-by',
          'Ready-made templates for features, bug fixes, and breaking changes',
        ],
        howToUse: [
          'Pick a commit type and optionally fill in a scope such as web or api',
          'Write the subject in imperative mood without a trailing period; Chinese subjects work as-is',
          'Add a body when useful, explaining what changed and why',
          'Check the breaking-change box and describe it for incompatible changes',
          'List related issues/PRs and other footers one per line, then copy the message into git commit',
        ],
        useCases: [
          'Writing commit messages that changelog tools can parse in collaborative repositories',
          'Teaching newcomers the normalized commit format with inline validation',
          'Composing release commits with BREAKING CHANGE and Closes #id footers',
        ],
        privacyNote:
          'Everything is assembled and checked locally in your browser; nothing is uploaded or logged.',
        faqs: [
          {
            question: 'What is the header length limit?',
            answer:
              'Following community convention, the tool warns above 72 header characters and errors when the subject exceeds 120 characters; move detail into the body.',
          },
          {
            question: 'Why am I warned about imperative mood?',
            answer:
              'Git convention asks for an imperative English subject such as "add" instead of "added / adds". The check applies only to English; Chinese subjects are unaffected.',
          },
          {
            question: 'What is a valid footer line?',
            answer:
              'One per line, written as "token: value" (e.g. Reviewed-by: Alice) or "token #value" (e.g. Closes #42). BREAKING CHANGE is generated by the checkbox.',
          },
        ],
      },
    },
  },
  {
    slug: 'crc16-checksum',
    name: 'CRC-16 / Adler-32 校验和计算器',
    nameEn: 'CRC-16 & Adler-32 Checksum Calculator',
    description:
      '对文本（UTF-8）或十六进制字节流计算 CRC-16/CCITT-FALSE、ARC、XMODEM、MODBUS 等六种变体与 Adler-32，输出十六进制与十进制结果。',
    descriptionEn:
      'Compute six CRC-16 variants (CCITT-FALSE, ARC, XMODEM, MODBUS, GENIBUS, KERMIT) and Adler-32 over UTF-8 text or hex byte streams, with hex and decimal output.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/crc16-checksum',
    iconName: 'Barcode',
    tags: ['CRC16', 'Adler-32', '校验和', 'Modbus', '嵌入式'],
    tagsEn: ['CRC16', 'Adler-32', 'Checksum', 'Modbus', 'Embedded'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '123456789',
    doc: {
      zh: {
        whatIsIt:
          'CRC-16 / Adler-32 校验和计算器是一款纯浏览器本地工具：按 RockSoft 参数模型（poly / init / refin / refout / xorout）实现通用 CRC-16，一次覆盖六种工程常用变体，并提供 RFC 1950 Adler-32，结果以定长十六进制与十进制双格式输出。',
        coreFeatures: [
          '六种 CRC-16 变体：CCITT-FALSE、ARC、XMODEM、MODBUS、GENIBUS、KERMIT',
          'RFC 1950 Adler-32，用于 zlib 流校验',
          '支持 UTF-8 文本与十六进制字节流（空格/逗号分隔、0x 前缀）两种输入',
          '参数化直驱实现，结果与 CRC RevEng 标准 check 向量一致',
          '每个结果可单独复制，自动统计输入字节数',
        ],
        howToUse: [
          '选择输入模式：文本或十六进制字节流',
          '文本模式直接输入内容，内部按 UTF-8 编码；十六进制模式逐字节书写，如 31 32 33',
          '结果卡片实时展示每种算法的 0x 十六进制与十进制值',
          '点击对应行的「复制」获取十六进制结果',
        ],
        useCases: [
          '嵌入式串口 / Modbus RTU 通信帧的 CRC 核对',
          'zlib / gzip 数据流的 Adler-32 校验',
          '协议调试时与固件侧实现做标准向量对齐',
        ],
        privacyNote:
          '所有字节运算均在浏览器本地完成，输入数据不会上传或离开设备。',
        faqs: [
          {
            question: '为什么标准输入是 "123456789"？',
            answer:
              'CRC RevEng 目录用 "123456789" 的 check 值作为各参数模型的验收向量；本工具 CCITT-FALSE=0x29B1、ARC=0xBB3D、XMODEM=0x31C3、MODBUS=0x4B37、Adler-32=0x091E01DE，可据此核对。',
          },
          {
            question: 'MODBUS 用的是哪一种 CRC？',
            answer:
              'Modbus RTU 使用 CRC-16/MODBUS（poly=0x8005、init=0xFFFF、输入输出均反转、xorout=0x0000），本工具已直接提供。',
          },
          {
            question: '中文如何参与计算？',
            answer:
              '文本模式按 UTF-8 编码为字节后再计算，例如「你好」对应 6 个字节 E4 BD A0 E5 A5 BD；若协议要求 GBK 等其他编码，可先编码为字节再使用十六进制模式。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The CRC-16 & Adler-32 Checksum Calculator is a fully in-browser tool implementing a generic CRC-16 through the RockSoft parameter model (poly / init / refin / refout / xorout), covering six widely used variants plus RFC 1950 Adler-32, with fixed-width hex and decimal output.',
        coreFeatures: [
          'Six CRC-16 variants: CCITT-FALSE, ARC, XMODEM, MODBUS, GENIBUS, and KERMIT',
          'RFC 1950 Adler-32 for zlib stream verification',
          'Both UTF-8 text and hex byte-stream input (space/comma separated, 0x prefix)',
          'Parameterized bitwise implementation matching CRC RevEng check values',
          'Per-result copy button and live byte-count display',
        ],
        howToUse: [
          'Choose text or hex byte-stream input mode',
          'In text mode, content is encoded as UTF-8; in hex mode write bytes such as 31 32 33',
          'The result card shows every algorithm with 0x hex and decimal values',
          'Click "Copy" on a row to grab its hex result',
        ],
        useCases: [
          'Verifying CRC fields in embedded serial or Modbus RTU frames',
          'Checking Adler-32 of zlib/gzip data streams',
          'Aligning a firmware implementation against standard check vectors',
        ],
        privacyNote:
          'All byte arithmetic runs locally in your browser; input never leaves your device.',
        faqs: [
          {
            question: 'Why is the standard input "123456789"?',
            answer:
              'The CRC RevEng catalogue defines check values over "123456789". Here CCITT-FALSE=0x29B1, ARC=0xBB3D, XMODEM=0x31C3, MODBUS=0x4B37, and Adler-32=0x091E01DE, so you can cross-check any implementation.',
          },
          {
            question: 'Which CRC does Modbus use?',
            answer:
              'Modbus RTU uses CRC-16/MODBUS (poly=0x8005, init=0xFFFF, reflected input/output, xorout=0x0000), which is included directly.',
          },
          {
            question: 'How are non-ASCII characters handled?',
            answer:
              'Text mode encodes to UTF-8 bytes first. If your protocol requires GBK or another encoding, encode externally and paste the bytes in hex mode.',
          },
        ],
      },
    },
  },
  {
    slug: 'pangu-spacing',
    name: '中英文混排自动留白（盘古之白）格式化器',
    nameEn: 'Pangu Spacing Formatter',
    description:
      '在中文与英文/数字之间自动插入一个空格（盘古之白），跳过代码块与 URL，支持反向移除多余空格。',
    descriptionEn:
      'Automatically insert a space between CJK and Latin letters or digits (pangu spacing), skip code blocks and URLs, and remove extra spaces in reverse.',
    category: ToolCategoryEnum.TEXT_CONTENT,
    path: '/tools/pangu-spacing',
    iconName: 'Type',
    tags: ['盘古之白', '中英文混排', '排版', '格式化', '文本'],
    tagsEn: ['Pangu', 'CJK Spacing', 'Typography', 'Format', 'Text'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '中英文混排自动留白（盘古之白）格式化器是一款纯浏览器本地运行的排版工具，在中文（含日文假名、全角标点）与英文、数字的交界处自动插入一个半角空格，让技术文档、README、公众号文章等混排文本更易读；也支持反向移除这些空格。',
        coreFeatures: [
          '边界留白：识别汉字（含扩展 A 区）、日文假名、全角标点与半角字母数字的交界，仅插入一个空格',
          '保护代码与链接：围栏代码块、行内代码（`code`）及 URL 内部原样保留，不破坏 Markdown 语法',
          '反向移除：可一键移除中英文之间的空格，中文词语之间及代码内空格不受影响',
          '纯浏览器本地运算：所有文本处理均在本地完成，不上传任何内容',
        ],
        howToUse: [
          '粘贴中英文混排文本到输入框',
          '选择「自动留白」或「移除留白」模式，结果实时生成',
          '查看插入或移除的空格数量统计',
          '点击「复制处理结果」获取文本',
        ],
        useCases: [
          '规范技术文档与 README 的中英文混排',
          '排版公众号、博客文章前的自动留白',
          '清理已经手工加过空格但风格不统一的稿件',
        ],
        privacyNote:
          '所有文本处理均基于纯正则与状态机在浏览器本地完成，绝不记录或上传任何内容。',
        faqs: [
          {
            question: '什么是「盘古之白」？',
            answer:
              '指中文与英文/数字之间保留一个半角空格的排版惯例，由 pangu.js 推广，能显著提升混排文本的可读性。',
          },
          {
            question: '代码块和链接会被改动吗？',
            answer:
              '不会。围栏代码块（```）、行内代码与 URL 内部完全保持原样，工具只在它们与中文正文的交界处补空格。',
          },
          {
            question: '中文句号前为什么不加空格？',
            answer:
              '句读标点（如句号 U+3002）前后不补空格；全角逗号、冒号等全角形式（U+FF00–U+FFEF）与英文/数字相邻时才参与留白。',
          },
        ],
      },
      en: {
        whatIsIt:
          'Pangu Spacing Formatter is a fully browser-based typography utility that automatically inserts a space between CJK characters (including kana and full-width punctuation) and Latin letters or digits, and can also remove those spaces in reverse.',
        coreFeatures: [
          'Boundary spacing: detect edges between Han ideographs, kana, full-width punctuation and half-width alphanumerics',
          'Code and URL safe: fenced blocks, inline code and URLs are left untouched without breaking Markdown',
          'Reverse mode: remove CJK-Latin spaces while keeping spaces inside Chinese text and code intact',
          '100% in-browser: all processing is local with regex and a small state machine',
        ],
        howToUse: [
          'Paste mixed CJK/Latin text into the input box',
          'Choose "Add spacing" or "Remove spacing"; output updates in real time',
          'Check the count of inserted or removed spaces',
          'Click "Copy result" to grab the processed text',
        ],
        useCases: [
          'Normalizing mixed-language technical docs and README files',
          'Polishing blog posts and articles before publishing',
          'Cleaning manuscripts with inconsistent manual spacing',
        ],
        privacyNote:
          'All processing runs locally in your browser using pure regex and state-machine logic; content is never uploaded.',
        faqs: [
          {
            question: 'What is "pangu spacing"?',
            answer:
              'The typographic convention of keeping one space between CJK and Latin/digit text, popularized by pangu.js, which improves readability of mixed-language content.',
          },
          {
            question: 'Will code blocks and links be modified?',
            answer:
              'No. Fenced code blocks, inline code and URLs are preserved exactly; spaces are only added at the boundary with Chinese prose.',
          },
          {
            question: 'Why no space before the Chinese full stop?',
            answer:
              'CJK sentence punctuation such as U+3002 never gets a space, while full-width forms in U+FF00–U+FFEF (e.g. the full-width comma) do participate in spacing next to Latin text.',
          },
        ],
      },
    },
  },
  {
    slug: 'dns-ptr-builder',
    name: 'DNS PTR 反向解析记录名构造器',
    nameEn: 'DNS PTR Record Name Builder',
    description:
      '由 IPv4/IPv6 地址构造 in-addr.arpa / ip6.arpa 反向解析记录名与 zone 名，符合 RFC 1035 与 RFC 3596。',
    descriptionEn:
      'Build in-addr.arpa / ip6.arpa reverse-DNS PTR names and zone names from IPv4/IPv6 addresses per RFC 1035 and RFC 3596.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/dns-ptr-builder',
    iconName: 'Globe',
    tags: ['DNS', 'PTR', 'rDNS', 'IPv6', '运维'],
    tagsEn: ['DNS', 'PTR', 'rDNS', 'IPv6', 'Ops'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          'DNS PTR 反向解析记录名构造器根据输入的 IPv4 / IPv6 地址生成反向 DNS（PTR 查询）使用的完整域名：IPv4 四段倒序追加 in-addr.arpa，IPv6 展开为 32 个 nibble 全部倒序追加 ip6.arpa，还可按前缀长度生成反向 zone 名。全部在浏览器本地完成。',
        coreFeatures: [
          'IPv4 反向名：如 192.0.2.10 → 10.2.0.192.in-addr.arpa',
          'IPv6 反向名：按 RFC 3596 §2.5 展开并反转 32 个 nibble，支持 :: 压缩与内嵌 IPv4',
          'zone 构造：IPv4 按 /8、/16、/24，IPv6 按 /4 倍数（如 /32、/48、/64）生成委派 zone 名',
          '严格校验：非法地址、越界或未对齐的前缀长度明确报错',
        ],
        howToUse: [
          '在输入框填入 IPv4 或 IPv6 地址',
          '需要配置反向 zone 时填写前缀长度（或点击 /24、/32 等快捷标签）',
          '查看 PTR 记录名、规范化地址与 zone 名',
          '点击对应「复制」按钮获取结果',
        ],
        useCases: [
          '配置 BIND / named 反向解析 zone 文件',
          '编写或核对 dig -x 反向查询与 rDNS 记录',
          '检查 IPv6 ip6.arpa 长域名手工反转是否正确',
        ],
        privacyNote:
          '地址解析与字符串变换全部在浏览器本地完成，不发起任何 DNS 查询或网络请求。',
        faqs: [
          {
            question: 'IPv6 的反向名为什么这么长？',
            answer:
              'RFC 3596 规定先把地址展开为 32 个十六进制 nibble，再逐位反转并用点连接，最后加 ip6.arpa，因此 2001:db8::1 对应 32 个标签级的长域名。',
          },
          {
            question: 'PTR 名和 zone 名有什么区别？',
            answer:
              'PTR 名是完整的查询域名（主机粒度）；zone 名是 DNS 委派边界，只保留前缀覆盖的网络段标签，如 /24 对应 2.0.192.in-addr.arpa。',
          },
          {
            question: '会真的发起 DNS 查询吗？',
            answer: '不会。工具只构造记录名字符串；实际查询可在终端执行 dig -x <地址>。',
          },
        ],
      },
      en: {
        whatIsIt:
          'DNS PTR Record Name Builder generates reverse-DNS names from IPv4/IPv6 addresses: reversed octets under in-addr.arpa for IPv4 and 32 reversed nibbles under ip6.arpa for IPv6, with optional reverse-zone names based on prefix length. Everything runs locally in the browser.',
        coreFeatures: [
          'IPv4 reverse names, e.g. 192.0.2.10 → 10.2.0.192.in-addr.arpa',
          'IPv6 reverse names per RFC 3596 §2.5 with :: compression and embedded IPv4 support',
          'Zone names for /8, /16, /24 on IPv4 and nibble-aligned prefixes (/32, /48, /64) on IPv6',
          'Strict validation with clear errors for bad addresses and invalid or unaligned prefix lengths',
        ],
        howToUse: [
          'Enter an IPv4 or IPv6 address',
          'Optionally set a prefix length (or use the /24, /32 quick tags) to build a zone name',
          'Review the PTR name, normalized address and zone name',
          'Click "Copy" to grab a result',
        ],
        useCases: [
          'Authoring BIND/named reverse-zone files',
          'Verifying dig -x queries and rDNS records',
          'Checking long hand-built IPv6 ip6.arpa names',
        ],
        privacyNote:
          'Address parsing and string transforms run entirely in your browser; no DNS lookups or network requests are made.',
        faqs: [
          {
            question: 'Why is the IPv6 reverse name so long?',
            answer:
              'RFC 3596 expands the address into 32 hexadecimal nibbles, reverses them, joins with dots, and appends ip6.arpa — producing 32 labels before the suffix.',
          },
          {
            question: 'PTR name vs zone name?',
            answer:
              'The PTR name is the full host-granularity query name; the zone name is the delegation boundary and keeps only prefix-covered labels, e.g. 2.0.192.in-addr.arpa for /24.',
          },
          {
            question: 'Does it perform real DNS queries?',
            answer: 'No. It only builds the name strings; run dig -x <address> in a terminal for an actual lookup.',
          },
        ],
      },
    },
  },
  {
    slug: 'gitignore-generator',
    name: '.gitignore 文件生成器',
    nameEn: '.gitignore Generator',
    description:
      '勾选语言、框架、编辑器与操作系统模板并追加自定义规则，一键生成跨组去重、带分组注释的 .gitignore。',
    descriptionEn:
      'Pick language, framework, editor and OS templates, append custom patterns, and generate a deduplicated, section-commented .gitignore.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/gitignore-generator',
    iconName: 'EyeOff',
    tags: ['gitignore', 'Git', '脚手架', '模板', '项目初始化'],
    tagsEn: ['gitignore', 'Git', 'Scaffolding', 'Template', 'Project Setup'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          '.gitignore 文件生成器通过勾选内置的语言 / 框架（Node、Python、Java、Go、Rust）、编辑器 / IDE（VS Code、JetBrains、Vim）、操作系统（macOS、Windows、Linux）与环境变量 / 日志模板，再追加自定义规则，实时拼装出带分组注释头的标准 .gitignore 文本，全部在浏览器本地完成。',
        coreFeatures: [
          '丰富模板库：覆盖主流语言框架、IDE、操作系统与常见构建产物、密钥文件',
          '跨组自动去重：同名规则（如 *.log）只在首次出现的分组保留，顺序稳定',
          '自定义规则：每行一条追加到末尾，自动去除空白行与重复项',
          '一键复制：输出可直接保存为项目根目录 .gitignore',
        ],
        howToUse: [
          '在模板区勾选项目需要的语言、编辑器与操作系统',
          '在自定义规则框中按行补充项目特有的忽略模式',
          '在预览区查看带注释分组的最终 .gitignore 内容',
          '点击「复制」并粘贴保存为项目根目录的 .gitignore',
        ],
        useCases: [
          '为新仓库快速搭建忽略规则，避免提交 node_modules、.env 等',
          '多人协作时统一不同操作系统（.DS_Store、Thumbs.db）的忽略项',
          '为 polyglot 多语言项目合并多套模板规则',
        ],
        privacyNote:
          '模板与自定义规则全部在浏览器本地拼装生成，不发起任何网络请求，也不会读取你的仓库内容。',
        faqs: [
          {
            question: '两个模板里有相同规则怎么办？',
            answer:
              '生成时会全局去重，同名规则只保留在模板顺序中最先出现的分组里，自定义区也会跳过已存在的规则。',
          },
          {
            question: '自定义规则支持哪些写法？',
            answer:
              '支持标准 gitignore 模式语法，如目录（dist/）、通配（*.log）、取反（!keep.log）等，每行一条；空行和首尾空白会被自动忽略。',
          },
        ],
      },
      en: {
        whatIsIt:
          '.gitignore Generator combines built-in templates for languages/frameworks (Node, Python, Java, Go, Rust), editors/IDEs (VS Code, JetBrains, Vim), operating systems (macOS, Windows, Linux), env files and logs with your own custom rules, producing a section-commented .gitignore instantly and entirely in the browser.',
        coreFeatures: [
          'Rich template library for mainstream stacks, IDEs, OSes, build artifacts and secret files',
          'Cross-section deduplication: a pattern such as *.log is kept only where it first appears, with stable ordering',
          'Custom rules appended one per line with blank lines and duplicates removed automatically',
          'One-click copy — save the output straight to your project root as .gitignore',
        ],
        howToUse: [
          'Tick the language, editor and OS templates your project needs',
          'Add project-specific patterns in the custom-rules box, one per line',
          'Review the final commented .gitignore in the preview panel',
          'Click "Copy" and paste it into a .gitignore file at your repository root',
        ],
        useCases: [
          'Bootstrapping ignore rules for a new repo so node_modules, .env, etc. are never committed',
          'Standardizing OS noise (.DS_Store, Thumbs.db) across team members',
          'Merging several template sets for a polyglot multi-language project',
        ],
        privacyNote:
          'Templates and custom rules are assembled locally in your browser; no network requests are made and your repository contents are never read.',
        faqs: [
          {
            question: 'What if the same pattern exists in two templates?',
            answer:
              'The output is globally deduplicated: the pattern is kept only in the earliest section in template order, and the custom section skips patterns already present.',
          },
          {
            question: 'Which pattern syntax is supported in custom rules?',
            answer:
              'Standard gitignore syntax works — directories (dist/), globs (*.log), negations (!keep.log), etc., one per line; blank lines and surrounding whitespace are ignored.',
          },
        ],
      },
    },
  },
  {
    slug: 'robots-txt-generator',
    name: 'robots.txt 生成器',
    nameEn: 'robots.txt Generator',
    description:
      '表单配置多组 User-agent、Allow / Disallow、Crawl-delay 与 Sitemap，内置常见爬虫预设并校验路径，生成规范 robots.txt。',
    descriptionEn:
      'Build robots.txt from multiple User-agent groups with Allow/Disallow, Crawl-delay and Sitemaps, with crawler presets and path validation.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/robots-txt-generator',
    iconName: 'Bot',
    tags: ['robots.txt', 'SEO', '爬虫', '站点配置', '运维'],
    tagsEn: ['robots.txt', 'SEO', 'Crawler', 'Site Config', 'Ops'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          'robots.txt 生成器通过表单编辑多组爬虫抓取规则：每组指定 User-agent（支持 * 通配）、Allow / Disallow 路径与可选 Crawl-delay，全局可配置多条 Sitemap，并内置 Googlebot、Bingbot、百度爬虫等常见预设与全部允许 / 全部禁止模板，实时生成符合 Robots Exclusion Protocol 的 robots.txt 文本。',
        coreFeatures: [
          '多规则组：每组独立的 User-agent、Allow、Disallow 与 Crawl-delay，组间空行分隔',
          '常见爬虫预设：Googlebot、Bingbot、百度、Yandex、GPTBot 一键添加',
          '实时校验：缺少 User-agent、路径未以 / 开头、Crawl-delay 非数字、Sitemap 非 http(s) 均有提示',
          'Sitemap 指令统一输出在末尾，非法内容自动跳过且不阻断其余规则',
        ],
        howToUse: [
          '点击预设快速开始，或直接在规则组卡片中填写 User-agent 与路径（每行一条）',
          '通过下拉框添加常见爬虫为新规则组，按需填写 Crawl-delay（秒）',
          '在 Sitemap 区每行填写一条站点地图的完整 URL',
          '查看底部预览与校验提示，确认无误后点击「复制」保存为站点根目录 robots.txt',
        ],
        useCases: [
          '新站点上线前快速编写爬虫抓取规则并提交搜索引擎',
          '屏蔽管理后台、私有目录或特定 AI 爬虫',
          '排查现有 robots.txt 路径写法是否规范',
        ],
        privacyNote:
          '所有规则仅在浏览器本地拼装生成，不发起任何网络请求，也不会访问你填写的路径。',
        faqs: [
          {
            question: 'robots.txt 能真正阻止页面被收录吗？',
            answer:
              'robots.txt 是君子协议，合规爬虫会遵守，但它不是访问控制；敏感页面应配合鉴权或 noindex 元标签使用。',
          },
          {
            question: 'Allow 和 Disallow 同时匹配时谁优先？',
            answer:
              '按 Google 的规则，长度更长（更具体）的路径指令优先；生成器按你填写的顺序原样输出，不调整优先级。',
          },
        ],
      },
      en: {
        whatIsIt:
          'robots.txt Generator builds multiple crawler rule groups via a form: each group sets User-agent (with * wildcard), Allow/Disallow paths and an optional Crawl-delay, plus global Sitemap lines. It ships with Googlebot, Bingbot, Baiduspider and other presets, allow-all/disallow-all templates, and produces protocol-compliant robots.txt text in real time.',
        coreFeatures: [
          'Multiple rule groups, each with User-agent, Allow, Disallow and Crawl-delay, separated by blank lines',
          'Crawler presets: add Googlebot, Bingbot, Baiduspider, Yandex, GPTBot with one click',
          'Live validation: missing User-agent, paths not starting with /, non-numeric delays, non-http(s) sitemaps all flagged',
          'Sitemap directives emitted at the end; invalid entries are skipped without breaking other rules',
        ],
        howToUse: [
          'Start from a preset, or fill User-agent and paths (one per line) directly in a group card',
          'Add a common crawler as a new group from the dropdown and optionally set Crawl-delay in seconds',
          'List full Sitemap URLs, one per line, in the Sitemap section',
          'Review the preview and validation notes, then click "Copy" and save as robots.txt at the site root',
        ],
        useCases: [
          'Authoring crawler rules before launching a new site and submitting it to search engines',
          'Blocking admin panels, private directories or specific AI crawlers',
          'Sanity-checking path syntax in an existing robots.txt',
        ],
        privacyNote:
          'All rules are assembled locally in your browser; no network requests are made and the paths you enter are never visited.',
        faqs: [
          {
            question: 'Does robots.txt truly prevent indexing?',
            answer:
              'It is a voluntary protocol respected by compliant crawlers, not access control. Protect sensitive pages with authentication or noindex meta tags as well.',
          },
          {
            question: 'When both Allow and Disallow match, which wins?',
            answer:
              'Per Google’s rules, the longer (more specific) path wins. The generator outputs directives in your input order without changing precedence.',
          },
        ],
      },
    },
  },
  {
    slug: 'sitemap-generator',
    name: 'sitemap.xml 生成器',
    nameEn: 'Sitemap XML Generator',
    description:
      '粘贴 URL 清单并设置 lastmod / changefreq / priority，一键生成符合 sitemaps.org 协议的 XML 站点地图，非法 URL 与超量自动提示。',
    descriptionEn:
      'Turn a list of URLs into a sitemaps.org-compliant XML sitemap with global lastmod, changefreq and priority, including invalid-URL and 50k-limit warnings.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/sitemap-generator',
    iconName: 'Map',
    tags: ['Sitemap', 'SEO', 'XML', '搜索引擎', '站点地图'],
    tagsEn: ['Sitemap', 'SEO', 'XML', 'Search Engine', 'sitemaps.org'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          'sitemap.xml 生成器是一款纯浏览器本地运行的站点地图构建工具，把 URL 清单与全局 lastmod / changefreq / priority 选项拼装为符合 sitemaps.org 协议的 urlset XML，帮助搜索引擎高效发现页面。',
        coreFeatures: [
          'URL 清单批量录入：每行一条，自动识别并跳过非法或非 http(s) 链接，按行号报错',
          '全局字段统一设置：lastmod、changefreq（always 至 never 七档）、priority（0.0–1.0），留空即省略对应标签',
          '协议上限保护：单文件超过 50000 条时自动截断并提示改用 sitemap index 拆分',
          'XML 安全转义：loc 等文本节点自动转义 &、<、> 等字符，纯本地运算不上传',
        ],
        howToUse: [
          '在 URL 清单框中粘贴需要收录的页面地址，每行一条，必须以 http:// 或 https:// 开头',
          '设置全局 lastmod（如 2026-10-30）、changefreq 与 priority，不需要的字段留空即可',
          '查看非法 URL 告警与超量截断提示，修正后实时刷新右侧 XML 预览',
          '点击「复制」保存为 sitemap.xml 部署到站点根目录，并在 robots.txt 或搜索站长平台中提交',
        ],
        useCases: [
          '新站上线或站点改版后快速生成可提交给 Google / Bing / 百度的站点地图',
          '为静态站、博客与文档站整理页面清单，检查是否存在拼写错误的 URL',
          '教学与理解 sitemap 协议字段（changefreq、priority）的输出结构',
        ],
        privacyNote:
          '所有 URL 仅在浏览器本地拼装为 XML，工具不会访问、探测或上传任何地址。',
        faqs: [
          {
            question: '超过 50000 个 URL 怎么办？',
            answer:
              'sitemaps.org 规定单个 sitemap 最多 50000 条且不超过 50MB（未压缩）。本工具仅写入前 50000 条，超出部分应拆分为多个 sitemap 文件，再用 sitemap index 文件汇总。',
          },
          {
            question: 'lastmod、changefreq、priority 是必填的吗？',
            answer:
              '都不是必填项，只有 loc 必填。搜索引擎主要参考真实的 lastmod；changefreq 与 priority 仅为提示，权重已被弱化，不确定时可以留空。',
          },
        ],
      },
      en: {
        whatIsIt:
          'Sitemap XML Generator is a fully in-browser tool that turns a list of URLs plus global lastmod / changefreq / priority options into a sitemaps.org-compliant urlset XML, helping search engines discover pages efficiently.',
        coreFeatures: [
          'Bulk URL input: one per line, with non-http(s) or malformed links detected, skipped and reported by line number',
          'Global fields: lastmod, changefreq (seven values from always to never) and priority (0.0–1.0); leave blank to omit a tag',
          'Protocol-limit guard: inputs beyond 50,000 URLs are truncated with a sitemap-index hint',
          'Safe XML escaping: &, <, > and quotes in loc text are escaped automatically; everything runs locally',
        ],
        howToUse: [
          'Paste the page URLs to be indexed, one per line, each starting with http:// or https://',
          'Set global lastmod (e.g. 2026-10-30), changefreq and priority; leave a field blank to omit it',
          'Review invalid-URL warnings and the 50k truncation notice; the XML preview refreshes as you type',
          'Click "Copy", save the result as sitemap.xml at the site root, and submit it via robots.txt or search-console',
        ],
        useCases: [
          'Generating a sitemap for Google, Bing or Baidu when launching or restructuring a site',
          'Organizing pages of static sites, blogs and docs while catching mistyped URLs',
          'Learning how changefreq and priority appear in the sitemap protocol output',
        ],
        privacyNote:
          'URLs are assembled into XML entirely in your browser; the tool never visits, probes or uploads any address.',
        faqs: [
          {
            question: 'What if I have more than 50,000 URLs?',
            answer:
              'The protocol caps a single sitemap at 50,000 URLs and 50MB uncompressed. The tool writes only the first 50,000; split the rest into multiple sitemaps and combine them with a sitemap index file.',
          },
          {
            question: 'Are lastmod, changefreq and priority required?',
            answer:
              'No — only loc is required. Search engines rely mostly on an accurate lastmod; changefreq and priority are weak hints and can simply be omitted when unsure.',
          },
        ],
      },
    },
  },
  {
    slug: 'markdown-toc-generator',
    name: 'Markdown 目录（TOC）生成器',
    nameEn: 'Markdown Table of Contents Generator',
    description:
      '粘贴 Markdown 自动提取各级标题，生成带 GitHub 锚点的嵌套目录，支持有序/无序列表、层级过滤与一键插入原文，代码块内的 # 自动忽略。',
    descriptionEn:
      'Extract ATX headings from Markdown into a nested table of contents with GitHub anchors, ordered/unordered lists, level filtering and one-click insertion, ignoring # inside code fences.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/markdown-toc-generator',
    iconName: 'List',
    tags: ['Markdown', 'TOC', '目录', '锚点', 'README'],
    tagsEn: ['Markdown', 'TOC', 'Table of Contents', 'Anchor', 'README'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          'Markdown 目录（TOC）生成器是一款纯浏览器本地运行的文档工具，逐行扫描 Markdown 中的 ATX（#）标题，按层级缩进生成带 GitHub 风格锚点链接的嵌套目录，长文档无需再手工维护。',
        coreFeatures: [
          '精确标题提取：识别 1–6 级 ATX 标题，自动跳过 ``` 与 ~~~ 围栏代码块、行首转义 # 以及缺少空格的伪标题',
          'GitHub 风格锚点：转小写、空格转连字符、去除标点与行内代码反引号，重复标题自动追加 -1、-2 后缀',
          '灵活输出：有序/无序列表切换、最小/最大层级过滤、可关闭锚点链接，按层级两空格缩进',
          '一键插入原文：存在 <!-- TOC --> 标记块时替换其内容，否则前置到文首，全部本地运算',
        ],
        howToUse: [
          '在左栏粘贴 Markdown 原文，标题数量会实时显示在卡片标题上',
          '选择有序或无序列表、最小/最大标题层级，以及是否生成 GitHub 锚点链接',
          '在右栏核对目录预览，需要时点击「复制全文」得到插入目录后的完整文档',
          '也可在原文中放置 <!-- TOC -->…<!-- /TOC --> 标记，工具会就地更新标记块内容',
        ],
        useCases: [
          '为 README、规范文档与长文博客生成并持续更新目录',
          '向开源项目提交文档前快速核对标题层级是否合理',
          '需要纯文本目录片段贴入 Wiki 或其他渲染器时使用',
        ],
        privacyNote:
          '文档内容仅在浏览器内存中解析，不会上传或存储到任何服务器。',
        faqs: [
          {
            question: '支持 Setext 风格标题（下划线 === / ---）吗？',
            answer:
              '本期只识别 ATX 风格的 # 标题，Setext 标题暂不支持；大多数现代文档都使用 ATX 风格。',
          },
          {
            question: '为什么代码块里的注释 # 没有出现在目录中？',
            answer:
              '解析器会跟踪 ``` 与 ~~~ 围栏代码块状态，代码块内任何以 # 开头的行都会被忽略，与 GitHub 的渲染规则一致。',
          },
        ],
      },
      en: {
        whatIsIt:
          'Markdown Table of Contents Generator is a fully in-browser documentation tool that scans ATX (#) headings and builds a nested, indented TOC with GitHub-style anchor links, so long documents no longer need a hand-maintained outline.',
        coreFeatures: [
          'Accurate extraction: recognizes levels 1–6 ATX headings while skipping ``` and ~~~ fenced code blocks, escaped \\# lines and fake headings without a space after #',
          'GitHub anchors: lowercase, spaces to hyphens, punctuation and inline-code backticks removed; duplicate titles get -1, -2 suffixes',
          'Flexible output: ordered/unordered lists, min/max level filtering, anchor links toggle, and two-space indentation per level',
          'One-click insertion: replaces an existing <!-- TOC --> block or prepends the TOC to the document; everything runs locally',
        ],
        howToUse: [
          'Paste Markdown into the left editor; the detected heading count updates live in the card title',
          'Choose ordered or unordered style, minimum/maximum heading levels, and whether to emit GitHub anchor links',
          'Review the TOC preview on the right and click "Copy full text" when you need the document with TOC inserted',
          'Alternatively place <!-- TOC -->…<!-- /TOC --> markers in your text and the tool updates that block in place',
        ],
        useCases: [
          'Generating and refreshing a TOC for README files, specs and long-form blog posts',
          'Checking heading hierarchy before contributing documentation to open-source projects',
          'Producing a plain-text outline for wikis or other Markdown renderers',
        ],
        privacyNote:
          'Your document is parsed only in browser memory and is never uploaded to or stored on any server.',
        faqs: [
          {
            question: 'Are Setext headings (=== / --- underlines) supported?',
            answer:
              'Only ATX-style # headings are recognized in this version; Setext headings are not supported, although most modern documents use ATX style.',
          },
          {
            question: 'Why do # comments inside code blocks not appear in the TOC?',
            answer:
              'The parser tracks ``` and ~~~ fenced code blocks, so any line starting with # inside them is ignored, matching how GitHub renders Markdown.',
          },
        ],
      },
    },
  },
  {
    slug: 'web-manifest-generator',
    name: 'Web App Manifest 生成器',
    nameEn: 'Web App Manifest Generator',
    description:
      '填写应用名、图标、主题色与显示模式等表单，实时生成 PWA manifest.json 与配套 head 引入片段，必填项、颜色与 URL 格式自动校验。',
    descriptionEn:
      'Fill app name, icons, theme color and display mode to generate a PWA manifest.json plus head snippet in real time, with required-field, color and URL validation.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/web-manifest-generator',
    iconName: 'Smartphone',
    tags: ['PWA', 'Manifest', 'manifest.json', '可安装应用', '前端'],
    tagsEn: ['PWA', 'Manifest', 'manifest.json', 'Installable', 'Frontend'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          'Web App Manifest 生成器是一款纯浏览器本地运行的 PWA 配置工具，通过表单填写应用名称、图标、主题色、显示模式与快捷方式，自动产出符合 W3C Web App Manifest 规范的 manifest.json 与 HTML head 引入片段。',
        coreFeatures: [
          '全字段覆盖：name、short_name、start_url、scope、display、orientation、主题色/背景色、lang、dir、id、categories',
          '图标与快捷方式：多行维护 icons（sizes / type / any·maskable·monochrome purpose）与 shortcuts，空行自动过滤',
          '规范输出：空值字段省略、2 空格缩进 JSON，另生成 manifest link 与 theme-color meta 片段',
          '实时校验：name / start_url 必填，颜色格式与 http(s)、站内路径 URL 均有明确中文报错',
        ],
        howToUse: [
          '在基础信息卡片填写应用名称（name）与起始页（start_url），其余字段按需填写，留空即不出现在 JSON 中',
          '在 icons 区逐行填写图标 src、sizes、MIME 与 purpose；空 src 行会被忽略',
          '需要长按菜单入口时在 shortcuts 区添加快捷方式（至少有 name 与 url）',
          '核对校验告警后复制 manifest.json 部署到站点，并把 head 片段加入 HTML',
        ],
        useCases: [
          '把现有网站快速接入为可安装的 PWA',
          '为移动端 Web 应用配置启动画面背景色、状态栏主题色与 standalone 显示模式',
          '为应用图标补充 maskable 自适应图标声明',
        ],
        privacyNote:
          '所有字段仅在浏览器本地拼装为 JSON，不会上传或请求任何地址，图标 URL 也不会被访问。',
        faqs: [
          {
            question: '为什么有了 manifest 还不能安装？',
            answer:
              '可安装性通常还要求站点通过 HTTPS 提供、注册 Service Worker（含 fetch 处理）并配备合格图标（一般至少 192px 与 512px）。本工具只负责生成 manifest 与 head 片段。',
          },
          {
            question: 'purpose 里的 any 与 maskable 有什么区别？',
            answer:
              'any 表示完整图标、系统不得裁剪；maskable 表示图标四周预留了安全区，系统可按不同外形遮罩裁剪。建议两种各提供一张。',
          },
        ],
      },
      en: {
        whatIsIt:
          'Web App Manifest Generator is a fully in-browser PWA configuration tool. Fill a form with app name, icons, theme colors, display mode and shortcuts, and it produces a W3C-compliant manifest.json plus the HTML head snippet.',
        coreFeatures: [
          'Full field coverage: name, short_name, start_url, scope, display, orientation, theme/background colors, lang, dir, id, categories',
          'Icons and shortcuts: edit multiple icon rows (sizes / type / any, maskable, monochrome purposes) and shortcuts; empty rows are filtered out',
          'Spec-ready output: empty fields omitted, 2-space JSON, plus manifest link and theme-color meta snippet',
          'Live validation: name / start_url required; color formats and http(s) or site-relative URLs checked with clear errors',
        ],
        howToUse: [
          'Fill name and start_url in the basic info card; other fields are optional and omitted from JSON when blank',
          'Add icons row by row (src, sizes, MIME, purpose); rows with an empty src are ignored',
          'Add shortcuts when you need long-press or launcher menu entries (each needs at least name and url)',
          'Resolve validation warnings, copy manifest.json to your site, and insert the head snippet into HTML',
        ],
        useCases: [
          'Turning an existing website into an installable PWA quickly',
          'Configuring splash background, status-bar theme color and standalone mode for a mobile web app',
          'Declaring maskable adaptive icons alongside standard icons',
        ],
        privacyNote:
          'All fields are assembled into JSON locally in your browser; nothing is uploaded and icon URLs are never fetched.',
        faqs: [
          {
            question: 'Why is my app still not installable with a manifest?',
            answer:
              'Installability generally also requires HTTPS, a registered Service Worker handling fetch, and suitable icons (typically at least 192px and 512px). This tool only generates the manifest and head snippet.',
          },
          {
            question: 'What is the difference between any and maskable icon purposes?',
            answer:
              'any icons must be shown uncropped, while maskable icons reserve a safe zone and may be clipped to different platform masks. Providing one of each is recommended.',
          },
        ],
      },
    },
  },
  {
    slug: 'soundex-codec',
    name: 'Soundex 英语读音编码器',
    nameEn: 'Soundex Phonetic Code Generator',
    description:
      '按经典 US Census / NARA American Soundex 规则把英文姓氏编码为「首字母 + 3 位数字」的 4 位读音码：B/F/P/V→1、C/G/J/K/Q/S/X/Z→2、D/T→3、L→4、M/N→5、R→6，相邻同音辅音只编码一次，元音（含 Y）起分隔作用，H/W 不隔断同音合并，不足补 0、超出截断。支持逐字符推导、多行批量编码与同音分组，用于族谱检索与记录链接（record linkage）。纯浏览器本地运算、零新增依赖。',
    descriptionEn:
      'Encode English surnames into the 4-character American Soundex code (first letter plus 3 digits) using the classic US Census / NARA rules: B/F/P/V→1, C/G/J/K/Q/S/X/Z→2, D/T→3, L→4, M/N→5, R→6; adjacent same-sounding consonants collapse into one, vowels (including Y) separate, H/W do not, and the result is zero-padded and truncated. Offers a per-character derivation, multi-line batch encoding and homophone grouping for genealogical lookup and record linkage. Everything runs locally in the browser with zero new dependencies.',
    category: ToolCategoryEnum.TEXT_CONTENT,
    path: '/tools/soundex-codec',
    iconName: 'Type',
    tags: ['Soundex', '读音编码', '语音算法', '姓氏匹配', '族谱', '模糊检索'],
    tagsEn: ['Soundex', 'Phonetic Code', 'Surname Matching', 'Genealogy', 'Fuzzy Search', 'Record Linkage'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'Robert\nRupert\nAshcraft\nTymczak\nHoneyman',
    doc: {
      zh: {
        whatIsIt:
          'Soundex 英语读音编码器是一款纯浏览器本地运行的语音编码工具，按 20 世纪初美国人口普查确立的 American Soundex 规则，把英文姓氏压缩为「首字母 + 3 位数字」的 4 位编码，使拼写不同但读音相近的姓氏（如 Robert 与 Rupert）得到相同编码，广泛用于族谱检索、人口记录链接与去重。',
        coreFeatures: [
          '经典规则：首字母保留，辅音按读音映射 1–6，结果固定 4 位，不足补 0、超出截断',
          '逐字符推导：展示首个单词每个字母的合并、分隔或追加依据，便于学习核对',
          '批量处理：每行可放一个或多个单词，无字母的非法 token 原样保留并逐行告警',
          '同音分组：自动把编码相同的单词聚合到一起，直观查看读音近似的姓氏',
          '纯本地计算：零新增依赖，输入内容不发起任何网络请求',
        ],
        howToUse: [
          '在左侧输入框粘贴英文单词，每行一个或用空格分隔多个单词',
          '右侧实时输出对应的 4 位 Soundex 编码',
          '「逐字符推导」卡片展示首个单词的完整编码过程',
          '「同音分组」卡片按编码聚合读音相近的单词（绿色标签表示组内多于一个）',
          '点击「复制」获取批量编码结果',
        ],
        useCases: [
          '族谱与人口普查检索：按读音找到拼写不同的同一姓氏变体',
          '记录链接与去重：在历史档案、医院或客户数据中合并疑似同一人的记录',
          '学习语音算法：理解 Soundex 同音合并、元音分隔与 H/W 规则',
        ],
        privacyNote:
          '全部计算均在浏览器本地由零依赖纯函数完成，不发起任何网络请求；输入的姓名等内容不会离开设备。',
        faqs: [
          {
            question: '为什么 Tymczak 编码是 T522 而不是 T520？',
            answer:
              '按 NARA 规则，Y 与 A/E/I/O/U 一样作为元音分隔符：T 保留，Y 不编码但重置同音合并，M 记 5；C 记 2，Z 与 C 相邻同音被合并，A 再次分隔，K 记 2，故为 T522。本工具内置该标准向量自测。',
          },
          {
            question: 'Soundex 能处理名字或非英语词汇吗？',
            answer:
              '算法本身只看字母的读音分组，对任何拉丁字母串都能输出编码，但它为英语姓氏设计，对非英语发音（如汉语拼音、法语小舌音）近似效果有限，可作为模糊线索而非唯一判据。',
          },
          {
            question: '两个单词编码相同就一定是同一个姓氏吗？',
            answer:
              '不一定。4 位编码只有 26×6³ 种组合，碰撞并不少见（如 Lee 与 Lew 都是 L000）。Soundex 用于缩小候选范围，实际记录链接还应结合名字、日期、地点等字段综合判断。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Soundex Phonetic Code Generator is a fully browser-local tool that compresses English surnames into a 4-character code (first letter plus 3 digits) using the American Soundex rules established for the early-20th-century US Census. Differently spelled but similar-sounding surnames—such as Robert and Rupert—share the same code, making Soundex a staple of genealogical lookup, census record linkage and deduplication.',
        coreFeatures: [
          'Classic rules: first letter retained, consonants mapped to digits 1–6, fixed 4-character output with zero padding and truncation',
          'Per-character derivation: every letter of the first word is shown as merged, separated or appended, for learning and verification',
          'Batch processing: one or many words per line; tokens without letters are kept as-is with line-numbered warnings',
          'Homophone grouping: words sharing a code are clustered together, surfacing similar-sounding surnames',
          '100% local computation with zero new dependencies and no network requests',
        ],
        howToUse: [
          'Paste English words into the left editor, one per line or several separated by spaces',
          'The right side shows the 4-character Soundex codes live',
          'The derivation card walks through the encoding of the first word character by character',
          'The grouping card clusters words by code (a green tag means the group has more than one word)',
          'Click Copy to grab the batch results',
        ],
        useCases: [
          'Genealogy and census research: finding spelling variants of a surname by pronunciation',
          'Record linkage and deduplication: merging records that likely refer to the same person in archives, hospitals or customer data',
          'Learning phonetic algorithms: same-sound collapsing, vowel separation and the H/W rules',
        ],
        privacyNote:
          'All calculations run locally in your browser via zero-dependency pure functions. No network requests are made, so names and other input never leave your device.',
        faqs: [
          {
            question: 'Why is Tymczak encoded as T522 instead of T520?',
            answer:
              'Under the NARA rules Y acts as a vowel separator like A/E/I/O/U: T is retained, Y is skipped but resets same-sound merging, M gives 5, C gives 2, adjacent Z collapses with C, A separates again, and K gives 2—hence T522. This standard vector is covered by the built-in tests.',
          },
          {
            question: 'Does Soundex work for given names or non-English words?',
            answer:
              'The algorithm emits a code for any Latin-letter string because it only inspects letter groups, but it was designed for English surnames. Approximation quality is limited for other phonetics (such as Hanyu Pinyin or French uvular sounds), so treat its output as a fuzzy hint rather than a verdict.',
          },
          {
            question: 'Does the same code mean two words are the same surname?',
            answer:
              'No. With only 26×6³ possible codes, collisions are common (Lee and Lew are both L000). Soundex narrows candidates; real record linkage should also weigh given names, dates, locations and other fields.',
          },
        ],
      },
    },
  },
  {
    slug: 'srt-vtt-converter',
    name: 'SRT / WebVTT 字幕双向转换器',
    nameEn: 'SRT / WebVTT Subtitle Converter',
    description:
      '在 SRT 与 WebVTT 两种常见字幕格式之间双向转换：SRT → VTT 时自动补 WEBVTT 文件头、时间戳逗号改点号并保留序号、多行正文与定位设置；VTT → SRT 时剥离 WEBVTT 头与 NOTE/REGION/STYLE 块、丢弃 cue 定位设置、时间戳点号改逗号并从 1 重新连续编号。兼容短时间戳（MM:SS.mmm）、CRLF 与 UTF-8 BOM，支持对全部字幕条目整体进行毫秒级时间偏移，偏移后出现负时间戳会明确报错。纯浏览器本地运算、零新增依赖。',
    descriptionEn:
      'Convert between the two most common subtitle formats, SRT and WebVTT. SRT to VTT adds the WEBVTT header, switches timestamp commas to dots and preserves sequence numbers, multi-line text and positioning settings. VTT to SRT strips the WEBVTT header and NOTE/REGION/STYLE blocks, drops cue settings, turns dots back into commas and renumbers cues from 1. Short timestamps (MM:SS.mmm), CRLF and UTF-8 BOM are supported, and every cue can be shifted by a configurable millisecond offset, with a clear error if the shift would produce a negative timestamp. Everything runs locally in the browser with zero new dependencies.',
    category: ToolCategoryEnum.TEXT_CONTENT,
    path: '/tools/srt-vtt-converter',
    iconName: 'FileText',
    tags: ['SRT', 'WebVTT', '字幕转换', '视频字幕', '时间偏移', '字幕'],
    tagsEn: ['SRT', 'WebVTT', 'Subtitle Converter', 'Captions', 'Time Shift', 'Subtitles'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput:
      '1\n00:00:01,000 --> 00:00:04,000\n第一行字幕\n第二行字幕\n\n2\n00:00:05,500 --> 00:00:09,000\nSubtitle line one\nSubtitle line two',
    doc: {
      zh: {
        whatIsIt:
          'SRT / WebVTT 字幕双向转换器是一款纯浏览器本地运行的字幕格式工具。SRT 与 WebVTT 是视频播放、剪辑与流媒体场景中最常见的两种文本字幕格式，二者结构相近但在文件头、时间戳符号、cue 设置与编号上互不兼容，本工具按规范在两者之间无损互转，并支持统一时间偏移。',
        coreFeatures: [
          '双向转换：SRT → WebVTT 自动补头、逗号改点号；WebVTT → SRT 剥离头部与 NOTE/REGION/STYLE 块并重编号',
          '规范兼容：支持 MM:SS.mmm 短时间戳、HH:MM:SS.mmm 长时间戳、CRLF 换行与 UTF-8 BOM',
          '设置处理：保留 VTT 定位设置（如 align/position），转 SRT 时自动剥离无法表达的设置',
          '时间偏移：所有 cue 整体加减毫秒，偏移导致负时间戳时按条目序号报错而非输出非法字幕',
          '容错解析：缺少时间戳行的块、多余头部块会被忽略并逐条告警，不中断整体转换',
        ],
        howToUse: [
          '在右上角切换转换方向：SRT → WebVTT 或 WebVTT → SRT',
          '将字幕文本粘贴到左侧输入框，右侧实时输出转换结果',
          '需要整体移动字幕时间轴时，在底部「时间偏移」中填写毫秒数（可正可负）',
          '转换结果区展示成功解析的字幕条目数，遇到警告或错误会有对应提示',
          '点击「复制」获取转换后的字幕文本',
        ],
        useCases: [
          '把播放器/剪辑软件导出的 SRT 字幕用于只接受 WebVTT 的 HTML5 video 或流媒体管线',
          '将下载的 WebVTT 字幕导入仅支持 SRT 的剪辑软件、刻录工具或老款播放器',
          '多段字幕拼接或音轨裁剪后，用毫秒级整体偏移快速对齐时间轴',
        ],
        privacyNote:
          '全部解析、转换与时间偏移均在浏览器本地由零依赖纯函数完成，字幕内容不会上传或离开设备。',
        faqs: [
          {
            question: 'WebVTT 里的 NOTE、REGION、STYLE 块转成 SRT 后去哪了？',
            answer:
              'SRT 规范没有这些概念，转换时会被识别并剥离；普通 cue 之外的块不会污染输出。同样，cue 时间戳后的 align:start、position:0% 等定位设置在转 SRT 时也会被丢弃，而 SRT → VTT 时这些设置会原样保留。',
          },
          {
            question: '为什么负向偏移时报错而不是输出 00:00:00,000？',
            answer:
              '把负时间钳制为 0 会悄悄改变字幕时长与节奏，导致音画不同步。工具在偏移后任一 cue 起点或终点小于 0 时，按字幕条目序号报错并指出问题位置，便于调整偏移量。',
          },
          {
            question: '会保留 SRT 的序号行吗？',
            answer:
              'SRT → WebVTT 时序号行会作为 cue 标识保留；WebVTT → SRT 时 SRT 规范要求连续编号，因此无论原 VTT 是否带 cue id，输出都会从 1 开始重新编号，确保严格合法。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The SRT / WebVTT Subtitle Converter is a fully browser-local tool for the two most common text subtitle formats. SRT and WebVTT share a similar structure but are incompatible in their file headers, timestamp separators, cue settings and numbering. This tool converts losslessly between them according to the specs and can apply a uniform time shift.',
        coreFeatures: [
          'Bidirectional: SRT to VTT adds the header and swaps commas for dots; VTT to SRT strips the header and NOTE/REGION/STYLE blocks and renumbers cues',
          'Spec-friendly: accepts short MM:SS.mmm timestamps, long HH:MM:SS.mmm timestamps, CRLF and UTF-8 BOM',
          'Settings-aware: keeps VTT positioning settings (align/position) and drops them when targeting SRT, which cannot express them',
          'Time shifting: offset every cue by a configurable number of milliseconds; a shift producing a negative timestamp raises an indexed error instead of emitting invalid subtitles',
          'Resilient parsing: blocks without timing lines and stray header blocks are skipped with per-item warnings instead of aborting the conversion',
        ],
        howToUse: [
          'Pick the direction in the top-right toggle: SRT to WebVTT or WebVTT to SRT',
          'Paste subtitle text into the left editor; the converted result appears live on the right',
          'To move the whole timeline, enter a millisecond offset (positive or negative) in the time-shift control at the bottom',
          'The result panel shows how many cues were parsed, with warnings or errors when applicable',
          'Click Copy to grab the converted subtitle text',
        ],
        useCases: [
          'Feeding SRT subtitles exported by players or editors into HTML5 video or streaming pipelines that only accept WebVTT',
          'Importing downloaded WebVTT subtitles into editors, burn-in tools or legacy players that only support SRT',
          'Re-aligning timelines after concatenating subtitles or trimming an audio track, using a single millisecond offset',
        ],
        privacyNote:
          'All parsing, conversion and shifting run locally in your browser via zero-dependency pure functions. Subtitle content is never uploaded and never leaves your device.',
        faqs: [
          {
            question: 'What happens to NOTE, REGION and STYLE blocks when converting WebVTT to SRT?',
            answer:
              'SRT has no equivalents, so these blocks are detected and stripped; non-cue blocks never leak into the output. Positioning settings after a VTT timestamp (such as align:start or position:0%) are also dropped for SRT, while they are preserved as-is when converting SRT to VTT.',
          },
          {
            question: 'Why does a negative shift error instead of clamping to 00:00:00,000?',
            answer:
              'Silently clamping negative timestamps to zero would change cue durations and timing, causing audio/video desync. If any cue start or end would become negative after the shift, the tool reports an error with the cue index and location so you can adjust the offset.',
          },
          {
            question: 'Are SRT sequence numbers preserved?',
            answer:
              'SRT to WebVTT keeps the number line as a cue identifier. For WebVTT to SRT the SRT spec requires consecutive numbering, so output cues are always renumbered from 1 regardless of the original cue ids, guaranteeing strictly valid output.',
          },
        ],
      },
    },
  },
  {
    slug: 'uuid-v7-generator',
    name: 'UUID v7 生成器与解析器',
    nameEn: 'UUID v7 Generator & Inspector',
    description:
      '按 RFC 9562 生成时间有序的 UUID v7：48 位 Unix 毫秒时间戳 + 版本位 7 + 12 位 rand_a + 变体位 10 + 62 位 rand_b。支持一次批量生成最多 1000 个，随机位来自 Web Crypto getRandomValues，同一毫秒内连续生成时随机段自动加一，保证批内结果严格按字典序递增，可直接用作数据库聚簇主键。同时可反解任意 UUID v7，展示嵌入的毫秒时间戳、UTC 时间、版本、变体与随机段。纯浏览器本地运算、零新增依赖。',
    descriptionEn:
      'Generate time-ordered UUID v7 values per RFC 9562: a 48-bit Unix millisecond timestamp, version digit 7, 12 bits of rand_a, the 10 variant bits and 62 bits of rand_b. Generate up to 1000 UUIDs per batch with randomness from Web Crypto getRandomValues; within the same millisecond the random portion is incremented automatically so batch output is strictly lexicographically increasing and can serve directly as a clustered database primary key. Any UUID v7 can also be inspected to reveal its embedded millisecond timestamp, UTC time, version, variant and random fields. Everything runs locally in the browser with zero new dependencies.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/uuid-v7-generator',
    iconName: 'Fingerprint',
    tags: ['UUID v7', 'RFC 9562', '时间有序 UUID', '唯一标识', '主键', 'Web Crypto'],
    tagsEn: ['UUID v7', 'RFC 9562', 'Time-ordered UUID', 'Unique Identifier', 'Primary Key', 'Web Crypto'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          'UUID v7 生成器与解析器是一款纯浏览器本地运行的标识符工具。UUID v7（RFC 9562）把毫秒级 Unix 时间戳放在 128 位的最高位，使新生成的 UUID 天然按时间排序，既保留 UUID 的去中心化、无需协调即可生成的优点，又解决了 UUID v4 随机主键导致数据库索引页频繁分裂、缓存不友好的问题。',
        coreFeatures: [
          'RFC 9562 布局：48 位毫秒时间戳、版本 7、变体 10、74 位随机段，严格校验位字段',
          '批量生成：一次最多 1000 个，同毫秒随机段单调加一，批内严格字典序递增且全部唯一',
          '密码学随机：随机位来自 crypto.getRandomValues，非 Math.random 伪随机',
          '结构反解：输入任意 UUID v7，展示毫秒时间戳、UTC ISO 时间、版本、变体、rand_a 与 rand_b',
          '输入宽容：解析时容忍首尾空白、花括号、urn:uuid: 前缀与大写，版本/变体/长度错误均有明确中文报错',
        ],
        howToUse: [
          '在顶部输入生成数量（1–1000），点击「生成」得到一批 UUID v7',
          '左栏展示整批结果，点击「复制全部」可直接粘贴到代码或数据文件',
          '右栏自动反解列表中首个 UUID 的时间戳与位字段',
          '同一毫秒内批量生成时随机段自动递增，字符串顺序即生成顺序',
          '所有运算在浏览器本地完成，可安全在离线或内网环境使用',
        ],
        useCases: [
          '数据库主键：替代自增 ID 与 UUID v4，获得去中心化生成与聚簇索引友好的双重优势',
          '分布式系统：多节点无需号段协调即可生成全局大致有序、碰撞可忽略的订单号/事件 ID',
          '调试排障：从已有 UUID v7 反解生成时间，排查日志、消息与数据记录的先后顺序',
        ],
        privacyNote:
          'UUID 的生成与解析全部在浏览器本地完成，随机数来自浏览器内置 Web Crypto，不发起任何网络请求。',
        faqs: [
          {
            question: 'UUID v7 相比 UUID v4 有什么好处？',
            answer:
              'UUID v4 的 122 位全部随机，作为数据库主键时新行随机插入 B+Tree 的不同位置，导致页分裂与缓存失效。UUID v7 最高位是毫秒时间戳，同一毫秒内本工具还会让随机段单调递增，因此新值大致连续追加，索引局部性显著更好，同时仍可在各节点独立生成。',
          },
          {
            question: '同一毫秒批量生成会不会重复？',
            answer:
              '不会。每生成一个 UUID，62 位 rand_b 先加一；rand_b 占满则重新随机并让 12 位 rand_a 进位，相当于在 74 位随机空间内单调递增。即便固定时间戳连续生成 1000 个，结果也严格唯一且字典序升序（内置测试覆盖）。',
          },
          {
            question: '能解析任意 UUID 吗？',
            answer:
              '本工具的解析面向 UUID v7：会先校验 36 位格式、第三段首字符必须为 7、第四段首字符必须在 8/9/a/b。传入 v4 等其他版本会得到明确的版本位错误；时间戳字段也只对 v7 有意义。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The UUID v7 Generator & Inspector is a fully browser-local identifier tool. UUID v7 (RFC 9562) places a millisecond Unix timestamp in the most significant bits of the 128-bit value, making freshly generated UUIDs naturally time-ordered. It keeps the decentralized, coordination-free generation of UUIDs while fixing the index-page splits and poor cache locality that random UUID v4 primary keys cause in databases.',
        coreFeatures: [
          'RFC 9562 layout: 48-bit millisecond timestamp, version 7, variant 10 and 74 random bits, with strict field checks',
          'Batched generation: up to 1000 per call; within the same millisecond the random portion is monotonically incremented, so results are unique and strictly lexicographically ordered',
          'Cryptographic randomness from crypto.getRandomValues rather than the Math.random PRNG',
          'Structural inspection: any UUID v7 reveals its millisecond timestamp, UTC ISO time, version, variant, rand_a and rand_b',
          'Lenient input: parsing tolerates surrounding whitespace, braces, the urn:uuid: prefix and uppercase; length, version and variant errors produce clear messages',
        ],
        howToUse: [
          'Enter a quantity (1–1000) at the top and click Generate to produce a batch of UUID v7 values',
          'The left column lists the whole batch; click Copy All to paste them straight into code or data files',
          'The right column automatically inspects the first UUID, showing its timestamp and bit fields',
          'UUIDs produced within the same millisecond are auto-incremented, so string order equals creation order',
          'Everything runs locally in the browser, safe for offline or intranet use',
        ],
        useCases: [
          'Database primary keys: replacing auto-increment IDs and UUID v4 with decentralized yet index-friendly values',
          'Distributed systems: nodes independently generate roughly ordered, collision-negligible order/event IDs without coordinating ID ranges',
          'Debugging: decoding the embedded generation time from existing UUID v7 values to order logs, messages and records',
        ],
        privacyNote:
          'UUID generation and inspection run entirely in your browser using the built-in Web Crypto randomness; no network requests are made.',
        faqs: [
          {
            question: 'How is UUID v7 better than UUID v4?',
            answer:
              'All 122 variable bits of UUID v4 are random, so using it as a primary key inserts new rows at random B+Tree positions, causing page splits and cache misses. UUID v7 leads with a millisecond timestamp—and within a millisecond this tool also increments the random portion—so new values are appended roughly sequentially with much better index locality while remaining independently generatable on every node.',
          },
          {
            question: 'Can batch generation within one millisecond produce duplicates?',
            answer:
              'No. Each UUID first increments the 62-bit rand_b; when that fills up it is re-randomized and the 12-bit rand_a carries over, effectively monotonic increment over 74 random bits. Even 1000 UUIDs generated with a fixed timestamp are unique and strictly ascending (covered by the built-in tests).',
          },
          {
            question: 'Can it inspect any UUID?',
            answer:
              'Inspection targets UUID v7: it validates the 36-character shape, requires the third group to start with 7 and the fourth group to start with 8/9/a/b. Other versions such as v4 produce an explicit version error, and the timestamp field is meaningful only for v7.',
          },
        ],
      },
    },
  },
  {
    slug: 'editorconfig-generator',
    name: '.editorconfig 生成器与解析器',
    nameEn: '.editorconfig Generator & Parser',
    description:
      '通过表单可视化生成符合 editorconfig.org 规范的 .editorconfig：配置 root 标记、通用 [*] 段的 charset、end_of_line、indent_style、indent_size、tab_width、insert_final_newline、trim_trailing_whitespace、max_line_length，并可一键勾选 JavaScript/TypeScript、JSON/YAML、Markdown、Makefile、HTML/CSS 等常用文件类型预设段，右侧实时预览规范文本。折叠区还支持把已有 .editorconfig 反向解析为 root 与各 section 概览，未知属性与畸形行只告警不中断。纯浏览器本地运算、零新增依赖。',
    descriptionEn:
      'Visually build spec-compliant .editorconfig files (editorconfig.org) through a form: set the root marker and a generic [*] section covering charset, end_of_line, indent_style, indent_size, tab_width, insert_final_newline, trim_trailing_whitespace and max_line_length, then toggle ready-made sections for JavaScript/TypeScript, JSON/YAML, Markdown, Makefile and HTML/CSS, with a live spec-text preview. A collapsible panel also reverse-parses an existing .editorconfig into an overview of root and each section; unknown properties and malformed lines only raise warnings. Everything runs locally in the browser with zero new dependencies.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/editorconfig-generator',
    iconName: 'FileCode',
    tags: ['EditorConfig', '配置生成器', '代码风格', '缩进', '编辑器配置', '团队规范'],
    tagsEn: ['EditorConfig', 'Config Generator', 'Code Style', 'Indentation', 'Editor Settings', 'Team Standards'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '',
    doc: {
      zh: {
        whatIsIt:
          '.editorconfig 生成器与解析器是一款纯浏览器本地运行的开发配置工具。EditorConfig 是被 VS Code、JetBrains IDE、Vim 等主流编辑器广泛支持的开放规范，用一个简单的 INI 风格文件统一多人项目的缩进、换行、编码与尾随空白策略。本工具让不熟悉属性名与取值的开发者通过勾选表单即可得到规范配置，并能反向解析已有文件核对内容。',
        coreFeatures: [
          '全属性覆盖：charset、end_of_line、indent_style/size、tab_width、结尾换行、尾随空白、行宽八项官方属性',
          '文件类型预设：一键勾选 JS/TS、JSON/YAML、Markdown（保留尾随空格）、Makefile（强制 Tab）等专用段',
          '实时预览：表单任意修改即时生成规范文本，属性按固定顺序输出，root 标记置于首行',
          '反向解析：粘贴已有 .editorconfig 即可得到 root 与每个 section 的属性数量概览',
          '严格校验与友好容错：indent_size/tab_width 限 1–24、重复 glob 与未知属性只告警，非法行不中断解析',
        ],
        howToUse: [
          '在左栏设置通用 [*] 段的字符集、换行符、缩进风格与宽度等属性',
          '通过开关决定是否输出 root = true 以及 max_line_length（限长或 off）',
          '在「附加段」勾选需要的文件类型预设，glob 更精确的段会覆盖通用段',
          '右栏实时预览 .editorconfig 文本，点击「复制」保存到项目根目录',
          '展开底部折叠区，可粘贴已有配置进行反向解析与核对',
        ],
        useCases: [
          '新项目初始化：在多人协作仓库根目录快速产出统一缩进与换行的 .editorconfig',
          '跨编辑器团队：让 VS Code、WebStorm、Vim 等不同编辑器的成员共享同一份风格约束',
          '配置审查：反向解析接手项目中的 .editorconfig，快速了解 root 与各 section 覆盖情况',
        ],
        privacyNote:
          '配置的生成与解析全部在浏览器本地由零依赖纯函数完成，不读取项目中的其他文件，也不发起任何网络请求。',
        faqs: [
          {
            question: '多个 section 匹配同一文件时以谁为准？',
            answer:
              'EditorConfig 自顶向下读取，后出现且 glob 匹配的 section 会覆盖先出现 section 中的同名属性。本工具总是先生成通用 [*] 段，再输出勾选的专用段，因此 [*.md] 等更精确的 glob 可以覆盖 [*] 的设置（如 Markdown 保留尾随空格）。',
          },
          {
            question: 'root = true 应该写在哪里？',
            answer:
              '应写在文件首行、任何 section 之前，它告诉编辑器无需继续向父目录查找 .editorconfig。放在 section 之后会被视为无效，反向解析时工具会对此给出告警。',
          },
          {
            question: 'indent_size 为什么限制在 1–24？',
            answer:
              '规范要求 indent_size 为正整数，实际项目中缩进宽度几乎不会超过 24。为尽早拦截手滑输入，表单与生成器把取值限制在 1–24（indent_size 还支持特殊值 tab），越界会直接返回中文校验错误而不生成配置。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The .editorconfig Generator & Parser is a fully browser-local development configuration tool. EditorConfig is an open specification supported by VS Code, JetBrains IDEs, Vim and most other editors, using a simple INI-style file to unify indentation, line endings, encoding and trailing-whitespace policy across a multi-developer project. The form-based interface lets developers produce a spec file without memorizing property names, and can reverse-parse an existing file for review.',
        coreFeatures: [
          'All eight official properties: charset, end_of_line, indent_style/size, tab_width, final newline, trailing whitespace and line length',
          'File-type presets: one click for JS/TS, JSON/YAML, Markdown (keep trailing spaces), Makefile (tabs required) and more',
          'Live preview: any form change instantly regenerates the spec text, properties in a fixed order and root on the first line',
          'Reverse parsing: paste an existing .editorconfig to get an overview of root and the property count of each section',
          'Strict validation with friendly tolerance: indent_size/tab_width are bounded to 1–24, duplicate globs and unknown properties only warn, malformed lines never abort parsing',
        ],
        howToUse: [
          'Configure charset, line endings, indentation style and width for the generic [*] section in the left column',
          'Use the switches to control root = true and max_line_length (a limit or off)',
          'Tick the file-type presets under Additional sections; more specific globs override the generic section',
          'The right column previews the .editorconfig text live; click Copy and save it at the project root',
          'Expand the bottom panel to paste and reverse-parse an existing configuration',
        ],
        useCases: [
          'Bootstrapping a new project: quickly produce unified indentation and line-ending rules at the repository root',
          'Cross-editor teams: sharing one style contract across VS Code, WebStorm, Vim and other editors',
          'Config audits: reverse-parsing an inherited .editorconfig to understand root and section coverage at a glance',
        ],
        privacyNote:
          'Generation and parsing run entirely in your browser via zero-dependency pure functions; no other project files are read and no network requests are made.',
        faqs: [
          {
            question: 'When multiple sections match a file, which one wins?',
            answer:
              'EditorConfig reads top to bottom, and a later section whose glob matches overrides same-named properties from earlier sections. The tool always emits the generic [*] section first and then the ticked presets, so a more specific glob such as [*.md] can override [*] (for example keeping trailing spaces in Markdown).',
          },
          {
            question: 'Where should root = true go?',
            answer:
              'On the first line, before any section. It tells editors not to keep searching parent directories for more .editorconfig files. Placing it after a section has no effect, and the reverse parser warns when it sees that.',
          },
          {
            question: 'Why is indent_size limited to 1–24?',
            answer:
              'The spec requires a positive integer and real-world indentation virtually never exceeds 24. To catch slips early, the form and generator bound values to 1–24 (indent_size also accepts the special value tab); out-of-range input yields a clear validation error and no file is generated.',
          },
        ],
      },
    },
  },
  {
    slug: 'uuencode-codec',
    name: 'Uuencode 编解码器',
    nameEn: 'Uuencode / Uudecode Codec',
    description:
      '对经典 Unix uuencode 格式进行编码与解码：每 3 个字节拆成 4 个 6 位值映射到可打印 ASCII（0 值用反引号），每行最多 45 个输入字节（60 个编码字符），行首为长度字符，并以 begin <权限> <文件名> … end 包裹，与 Python binascii.b2a_uu / a2b_uu 及 BSD uuencode 兼容。编码时可自定义文件名与八进制权限；解码时提取文件名与权限，兼容反引号与空格两种零值写法，按 UTF-8 还原文本，缺 begin/end、长度不符等错误均有明确提示。纯浏览器本地运算、零新增依赖。',
    descriptionEn:
      'Encode to and decode from the classic Unix uuencode format: every 3 bytes become four 6-bit values mapped to printable ASCII (zero rendered as a backtick), each line holds at most 45 input bytes (60 encoded characters) with a length character first, wrapped as begin <mode> <filename> … end. Output is compatible with Python binascii.b2a_uu / a2b_uu and BSD uuencode. Encoding accepts a custom filename and octal permission mode; decoding extracts the filename and mode, accepts both backtick and space zero representations, restores UTF-8 text, and reports missing begin/end or length mismatches clearly. Everything runs locally in the browser with zero new dependencies.',
    category: ToolCategoryEnum.CRYPTO_ENCODING,
    path: '/tools/uuencode-codec',
    iconName: 'Binary',
    tags: ['uuencode', 'uudecode', '二进制编码', 'Unix', 'binascii', '遗留格式'],
    tagsEn: ['uuencode', 'uudecode', 'Binary Encoding', 'Unix', 'binascii', 'Legacy Format'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput:
      'The quick brown fox jumps over the lazy dog.\nThe quick brown fox jumps over the lazy dog.',
    doc: {
      zh: {
        whatIsIt:
          'Uuencode 编解码器是一款纯浏览器本地运行的经典格式转换工具。uuencode 诞生于 1980 年代，用于在只能传输文本的邮件与 Usenet 链路上发送任意二进制数据；尽管如今多被 Base64/MIME 取代，大量历史归档、邮件池与遗留 Unix 系统中仍存在 uuencode 数据，需要在现代环境中解读或生成。',
        coreFeatures: [
          '规范实现：3 字节→4 字符的 6 位分组，0 值用反引号，每行 45 字节自动折行',
          '包裹格式：生成 begin <mode> <filename> … end，文件名与三位八进制权限可自定义并校验',
          '兼容解码：反引号与空格两种零值写法都接受，CRLF 与空白差异自动归一',
          '元数据提取：解码时展示原始文件名、权限模式与字节数，end 之后的残留内容只告警',
          'UTF-8 还原：解码字节按 UTF-8 解码，非法字节以替换字符还原并告警而非崩溃',
        ],
        howToUse: [
          '默认进入编码模式：在左栏输入文本，右栏得到 begin/end 包裹的 uuencode 文本',
          '可在左栏顶部修改 begin 行的文件名与三位八进制权限（如 644、755）',
          '切换到解码模式后粘贴 begin … end 形式的文本，右栏还原原始 UTF-8 文本',
          '结果区展示参与处理的字节数；解码时额外显示提取到的文件名与权限',
          '点击「复制」获取编码或解码结果',
        ],
        useCases: [
          '解读历史邮件、Usenet 归档或老系统导出文件中的 uuencode 数据',
          '在没有 shell 的环境里快速生成与 Python binascii、BSD uuencode 兼容的包裹文本',
          '学习与教学：理解 Base64 之前的 6 位二进制到可打印 ASCII 编码思想',
        ],
        privacyNote:
          '编解码全部在浏览器本地由零依赖纯函数完成，输入的文本或包裹数据不会上传或离开设备。',
        faqs: [
          {
            question: 'uuencode 和 Base64 是什么关系？',
            answer:
              '二者都是把 3 个字节编码为 4 个可打印字符的 6 位分组编码，思想一致但字符表不同。uuencode 字符为 (值+32) 对应的 ASCII（0 值用反引号），Base64 使用 A–Z/a–z/0–9/+/=。uuencode 更早，主要用于 Unix 邮件链路；Base64 是 MIME 与现代系统的主流选择。',
          },
          {
            question: '为什么有的 uuencode 数据零值是空格而不是反引号？',
            answer:
              '历史上不同实现对 6 位零值有反引号 `（0x60）与空格（0x20）两种写法，Python 的 b2a_uu 输出空格、BSD 标准描述为反引号。本工具编码按规范使用反引号，解码则两者都按零值接受，因此可以互通。',
          },
          {
            question: '解码非 UTF-8 的二进制会怎样？',
            answer:
              '本工具面向文本演示，按 UTF-8 还原解码字节。若内容不是合法 UTF-8（例如压缩包、图片等原始二进制），非法字节会以 Unicode 替换字符显示并给出告警，字节级数据本身在算法层仍被正确解析，不会中断。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Uuencode / Uudecode Codec is a fully browser-local converter for a classic encoding format. Born in the 1980s, uuencode carried arbitrary binary data over text-only email and Usenet links. Although Base64/MIME has largely replaced it, huge amounts of uuencode data survive in historical archives, mail spools and legacy Unix systems and still need to be read or produced in modern environments.',
        coreFeatures: [
          'Spec implementation: 3 bytes to four 6-bit characters, zero rendered as a backtick, automatic 45-byte line wrapping',
          'Wrapper format: emits begin <mode> <filename> … end with a customizable, validated filename and three-digit octal mode',
          'Compatible decoding: both backtick and space zero representations accepted, with CRLF and whitespace normalized',
          'Metadata extraction: decoding shows the original filename, permission mode and byte count; trailing content after end only warns',
          'UTF-8 restoration: decoded bytes are interpreted as UTF-8; invalid bytes fall back to replacement characters with a warning instead of crashing',
        ],
        howToUse: [
          'Encoding is the default mode: enter text on the left and get the begin/end-wrapped uuencode text on the right',
          'Optionally change the filename and three-digit octal mode (such as 644 or 755) at the top of the input card',
          'Switch to decode mode, paste begin … end text, and recover the original UTF-8 text on the right',
          'The result panel shows processed bytes; decoding additionally shows the extracted filename and mode',
          'Click Copy to take the encoded or decoded output',
        ],
        useCases: [
          'Reading uuencode data in historical emails, Usenet archives or exports from legacy systems',
          'Producing wrapper text compatible with Python binascii and BSD uuencode without a shell',
          'Education: understanding the pre-Base64 idea of mapping 6-bit groups to printable ASCII',
        ],
        privacyNote:
          'Encoding and decoding run entirely in your browser via zero-dependency pure functions. Input text and wrapped data are never uploaded and never leave your device.',
        faqs: [
          {
            question: 'How does uuencode relate to Base64?',
            answer:
            'Both encode 3 bytes into 4 printable characters using 6-bit groups; the idea is identical but the alphabets differ. Uuencode uses ASCII(value + 32) with a backtick for zero, while Base64 uses A–Z/a–z/0–9/+/=. Uuencode is older and was tied to Unix email links; Base64 is the mainstream choice for MIME and modern systems.',
          },
          {
            question: 'Why do some uuencode payloads use spaces instead of backticks for zero?',
            answer:
            'Historically implementations rendered a 6-bit zero either as a backtick ` (0x60) or a space (0x20): Python b2a_uu emits spaces while the BSD standard describes the backtick. This tool encodes with the standard backtick but accepts both on decode, so the two flavors interoperate.',
          },
          {
            question: 'What happens when decoding non-UTF-8 binary?',
            answer:
            'The tool is oriented toward text demos and restores decoded bytes as UTF-8. If the content is not valid UTF-8 (raw binary such as an archive or image), invalid bytes appear as Unicode replacement characters with a warning; the byte-level payload is still parsed correctly by the algorithm and decoding does not abort.',
          },
        ],
      },
    },
  },
  {
    slug: 'verhoeff-damm-checksum',
    name: 'Verhoeff / Damm 校验位计算器',
    nameEn: 'Verhoeff / Damm Check Digit Calculator',
    description:
      '按 Verhoeff（二面体群 D5 置换表）或 Damm（反对称拟群拉丁方）算法对十进制数字串补全或校验末位校验位，支持逐行批量处理；两种算法均可检出全部单字符错误与相邻换位错误。输入含末位时校验合法性并给出正确校验位，不含末位时自动补全。纯浏览器本地查表运算、零新增依赖。',
    descriptionEn:
      'Append or verify a single decimal check digit with either the Verhoeff algorithm (dihedral group D5 permutation tables) or the Damm algorithm (totally antisymmetric quasigroup Latin square), with line-by-line batch processing. Both schemes catch every single-digit error and every adjacent transposition. A trailing digit is validated and the correct digit suggested; otherwise the check digit is appended. Everything runs locally via table lookups with zero new dependencies.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/verhoeff-damm-checksum',
    iconName: 'ShieldCheck',
    tags: ['Verhoeff', 'Damm', '校验位', '校验和', '数字编号', '批量校验'],
    tagsEn: ['Verhoeff', 'Damm', 'Check Digit', 'Checksum', 'Number Validation', 'Batch'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '123\n12345\n572',
    doc: {
      zh: {
        whatIsIt:
          'Verhoeff / Damm 校验位计算器是一款纯浏览器本地运行的十进制数字校验工具。两种算法都只向原数字串追加一位校验位，却能 100% 检出单字符抄录错误与相邻数字换位错误，因此被广泛用于德国身份证号、Aadhaar 编号、车辆与资产编号等对人工录入容错要求高的编号体系。',
        coreFeatures: [
          'Verhoeff 算法：基于二面体群 D5 乘法表、8 行循环置换表与逆元表的标准实现',
          'Damm 算法：基于 10×10 反对称拟群（弱幂等拉丁方）运算表，状态从 0 出发单行迭代',
          '双模式逐行处理：带末位则校验并指出正确校验位，不带末位则自动补全',
          '批量输入：每行一个编号，非法行（含非数字字符等）原样保留并逐行告警',
          '空白容错：自动忽略空格与连字符，兼容分组排版的编号',
        ],
        howToUse: [
          '在输入区顶部选择 Verhoeff 或 Damm 算法',
          '每行输入一个数字串：不含校验位时输出补全结果，含校验位时校验合法性',
          '查看输出区：校验失败的行会给出「正确校验位」与合法编码的告警',
          '点击「复制」获取全部补全或校验后的编号',
        ],
        useCases: [
          '核对使用 Verhoeff 校验的德国身份证号、Aadhaar 等编号的末位',
          '为车辆、设备、票据等自有编号体系生成可防换位错误的校验位',
          '教学演示：理解群论 / 拉丁方在校验码设计中的应用',
        ],
        privacyNote:
          '全部计算在浏览器本地由零依赖纯函数完成，输入的编号不会上传或离开设备。',
        faqs: [
          {
            question: 'Verhoeff 和 Damm 有什么区别？',
            answer:
              '二者都是单十进制位、可检出全部单字符错误与相邻换位错误的校验方案。Verhoeff（1969）基于二面体群 D5 的三张查表，校验时数字要先做位置相关置换；Damm（2004）基于反对称拟群的一张 10×10 表，状态逐位更新、实现更简洁。两者不兼容，需按编号体系的规定选择。',
          },
          {
            question: '为什么输入 1 位数字也能处理？',
            answer:
              '算法对任意长度（含空前缀）都有定义：空前缀的 Verhoeff/Damm 校验位均为 0，因此单个「0」是合法编码。实际编号体系通常有自己的最小长度，本工具只负责算法层面的校验位计算，不强制业务长度。',
          },
          {
            question: '它和 Luhn（模 10）校验有什么不同？',
            answer:
              'Luhn（银行卡、IMEI 使用）无法检出所有相邻换位（如 09↔90），而 Verhoeff 与 Damm 在数学上保证检出全部相邻换位与全部单字符错误，容错能力更强，但查表实现稍复杂。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Verhoeff / Damm Check Digit Calculator is a fully browser-local decimal-number validation tool. Both algorithms append just one check digit yet detect 100% of single-digit transcription errors and adjacent transpositions, which is why they back numbering schemes such as German ID numbers, Aadhaar and various vehicle or asset identifiers that must tolerate manual entry.',
        coreFeatures: [
          'Verhoeff algorithm: standard implementation with the D5 multiplication table, the eight-row cyclic permutation table and the inverse table',
          'Damm algorithm: a 10x10 totally antisymmetric quasigroup (weakly idempotent Latin square), single-row state iteration from zero',
          'Dual per-line behavior: a trailing digit is validated with the correct one reported, otherwise the check digit is appended',
          'Batch input: one number per line; invalid lines (non-digits, etc.) are preserved with per-line warnings',
          'Whitespace tolerant: spaces and hyphens are ignored to accept grouped typography',
        ],
        howToUse: [
          'Pick the Verhoeff or Damm algorithm at the top of the input panel',
          'Enter one digit string per line: output appends a missing check digit or validates an existing trailing one',
          'Review the output panel: failed lines show the correct check digit and the valid code as warnings',
          'Click Copy to take all completed or validated numbers',
        ],
        useCases: [
          'Verifying the last digit of Verhoeff-protected German ID numbers, Aadhaar and similar identifiers',
          'Generating transposition-proof check digits for in-house vehicle, device or receipt numbering',
          'Teaching how group theory and Latin squares underpin check-code design',
        ],
        privacyNote:
          'All computation runs in your browser via zero-dependency pure functions. Entered numbers are never uploaded and never leave your device.',
        faqs: [
          {
            question: 'How do Verhoeff and Damm differ?',
            answer:
              'Both add one decimal digit and catch every single-digit error and every adjacent transposition. Verhoeff (1969) uses three D5 look-up tables with position-dependent permutation; Damm (2004) uses one 10x10 antisymmetric-quasigroup table updated digit by digit, which is simpler to implement. They are not interchangeable; use whichever the numbering scheme mandates.',
          },
          {
            question: 'Why is a single-digit input accepted?',
            answer:
              'The algorithms are defined for any length including the empty prefix, whose check digit is 0 for both, so a lone "0" is valid. Real-world schemes usually impose their own minimum lengths; this tool only computes the algorithmic check digit and enforces no business length.',
          },
          {
            question: 'How does this differ from the Luhn (mod 10) check?',
            answer:
              'Luhn (bank cards, IMEI) misses some adjacent transpositions (such as 09 vs 90), whereas Verhoeff and Damm mathematically guarantee detection of all adjacent transpositions and all single-digit errors, offering stronger error tolerance at the cost of slightly more involved table lookups.',
          },
        ],
      },
    },
  },
  {
    slug: 'bmr-tdee-calculator',
    name: 'BMR / TDEE 热量计算器',
    nameEn: 'BMR & TDEE Calorie Calculator',
    description:
      '按 Mifflin-St Jeor 与 Harris-Benedict 修订版公式计算基础代谢 BMR 与每日总消耗 TDEE，并给出维持、减脂、增肌的参考热量区间。',
    descriptionEn:
      'Calculate BMR with Mifflin-St Jeor or revised Harris-Benedict, derive TDEE from five activity levels, and get maintain/cut/bulk calorie targets.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/bmr-tdee-calculator',
    iconName: 'Flame',
    tags: ['BMR', 'TDEE', '基础代谢', '热量', '健身'],
    tagsEn: ['BMR', 'TDEE', 'Calories', 'Metabolism', 'Fitness'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          'BMR / TDEE 热量计算器是一款纯浏览器本地运算的健身饮食规划工具：输入性别、年龄、身高、体重，先按经典公式估算静息状态下的基础代谢率（BMR），再乘以活动水平系数得到每日总能量消耗（TDEE），并据此给出维持体重、减脂与增肌三种目标的参考摄入区间。',
        coreFeatures: [
          '双公式对照：默认 Mifflin-St Jeor（1990），可切换 Harris-Benedict 修订版（1984）',
          '五档活动系数：久坐 1.2、轻度 1.375、中度 1.55、高度 1.725、极重 1.9',
          '三种热量目标：维持 = TDEE，减脂取 75%–85%，增肌取 105%–115%',
          '结果一键复制：BMR、TDEE 与各目标区间汇总为文本',
          '纯浏览器本地运算：体征数据绝不上传，断网可用',
        ],
        howToUse: [
          '选择性别并填写年龄（岁）、身高（cm）、体重（kg）',
          '选择 BMR 公式，默认推荐 Mifflin-St Jeor',
          '按每周运动频率选择活动水平，TDEE 与目标区间实时更新',
          '点击「复制结果」保存数值，用于饮食记录或健身计划',
        ],
        useCases: [
          '减脂期制定每日热量缺口（约 TDEE 的 15%–25%）',
          '增肌期确定温和热量盈余（约 TDEE 的 5%–15%）',
          '对比两套公式的估算差异，理解基础代谢的数量级',
        ],
        privacyNote:
          '全部计算由零依赖纯函数在浏览器本地完成，年龄、身高、体重等体征信息不会被记录或上传。',
        faqs: [
          {
            question: 'Mifflin-St Jeor 和 Harris-Benedict 结果为什么不一样？',
            answer:
              '两套公式基于不同年代的人群样本回归得到，正常会有几个百分点的差异。Mifflin-St Jeor（1990）对现代人群的验证误差更小，因此作为默认；Harris-Benedict 修订版便于与旧资料对照。',
          },
          {
            question: '算出的 TDEE 准确吗？',
            answer:
              '公式只使用性别、年龄、身高、体重，无法反映肌肉量、基因、激素与疾病等个体差异，结果是人群层面的估算。建议以 TDEE 为起点执行 2–3 周，再根据体重变化趋势微调。',
          },
          {
            question: '减脂区间为什么取 TDEE 的 75%–85%？',
            answer:
              '这对应每日约 15%–25% 的热量缺口，是多数营养指南认为可持续且尽量保留肌肉的范围；区间而非单值用于配合训练日与休息日的摄入浮动。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The BMR & TDEE Calorie Calculator is a fully in-browser fitness and nutrition planner. Enter sex, age, height and weight to estimate your resting Basal Metabolic Rate, multiply it by an activity factor for Total Daily Energy Expenditure, and see calorie ranges for maintaining, cutting, or bulking.',
        coreFeatures: [
          'Two formulas: Mifflin-St Jeor (1990, default) and revised Harris-Benedict (1984)',
          'Five activity factors: sedentary 1.2, light 1.375, moderate 1.55, very 1.725, extra 1.9',
          'Three goals: maintain at TDEE, cut at 75%-85%, bulk at 105%-115%',
          'One-click copy of BMR, TDEE and every target range',
          '100% in-browser: body metrics are never uploaded',
        ],
        howToUse: [
          'Pick your sex and enter age (years), height (cm) and weight (kg)',
          'Choose a BMR formula; Mifflin-St Jeor is recommended',
          'Select the activity level matching your weekly exercise; TDEE and targets update live',
          'Click "Copy result" to save the numbers for your meal or training plan',
        ],
        useCases: [
          'Setting a fat-loss deficit (roughly 15%-25% below TDEE)',
          'Setting a modest surplus for muscle gain (roughly 5%-15% above TDEE)',
          'Comparing the two published formulas to understand the estimate range',
        ],
        privacyNote:
          'All math runs locally via zero-dependency pure functions. Age, height, weight and other body metrics are never logged or uploaded.',
        faqs: [
          {
            question: 'Why do Mifflin-St Jeor and Harris-Benedict differ?',
            answer:
              'They were regressed on population samples from different eras, so a difference of a few percent is normal. Mifflin-St Jeor (1990) shows smaller validation error on modern populations and is the default; the revised Harris-Benedict is kept for comparison with older literature.',
          },
          {
            question: 'How accurate is the TDEE figure?',
            answer:
              'The formulas use only sex, age, height and weight, so they cannot capture muscle mass, genetics, hormones or medical conditions. Treat TDEE as a starting point for 2-3 weeks and adjust based on measured weight trends.',
          },
          {
            question: 'Why is the cut range 75%-85% of TDEE?',
            answer:
              'That is roughly a 15%-25% daily deficit, a range most nutrition guidelines consider sustainable while preserving muscle; using a band rather than one number allows higher intake on training days and lower on rest days.',
          },
        ],
      },
    },
  },
  {
    slug: 'chinese-number-converter',
    name: '中文数字 ↔ 阿拉伯数字转换器',
    nameEn: 'Chinese Number Converter',
    description:
      '在中文数字与阿拉伯数字之间双向转换，支持小写与财务大写金额用字、万/亿/万亿节、口语简式、负数与角分小数，纯本地解析。',
    descriptionEn:
      'Convert between Chinese numerals and Arabic digits both ways: everyday and financial uppercase forms, 万/亿/万亿 sections, colloquial shorthand, negatives, and jiao/fen decimals.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/chinese-number-converter',
    iconName: 'Sigma',
    tags: ['中文数字', '大写金额', '数字转换', '财务', '解析'],
    tagsEn: ['Chinese Numerals', 'Uppercase Amount', 'Converter', 'Finance', 'Parser'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: '12345.67',
    doc: {
      zh: {
        whatIsIt:
          '中文数字 ↔ 阿拉伯数字转换器是一款纯浏览器本地运算的双向换算工具：既可把阿拉伯数字转成「一万二千三百四十五」式小写或「壹萬贰仟叁佰肆拾伍元」式财务大写，也能把古籍、合同、票据中的中文数字文本解析回阿拉伯数字，正确处理零的连续占位、万/亿/万亿数位节、口语简式与角分小数。',
        coreFeatures: [
          '双向转换：数字 → 中文、中文 → 数字，结果可一键回填反向输入做核对',
          '两套字形：小写零一二…与财务大写零壹贰…、拾佰仟萬億',
          '金额用字：自动生成与解析「元 / 角 / 分 / 整」，符合票据填写习惯',
          '口语简式：「两千三」按主流习惯解释为 2300，并给出明确提示；写「两千零三」则按字面 2003',
          '纯浏览器本地运算：零依赖纯函数解析，合同金额等敏感内容绝不上传',
        ],
        howToUse: [
          '选择方向：「数字 → 中文」或「中文 → 数字」',
          '数字方向下再选择「小写中文数字」或「财务大写金额」，输入数字（支持千分位逗号与负号）',
          '中文方向下直接粘贴中文数字文本，大小写字形与金额用字可自动识别',
          '出现黄色提示时留意口语简式的解释；点击「结果填入反向」可快速往返校验',
        ],
        useCases: [
          '核对合同、发票、报销单上的人民币大写金额',
          '阅读古籍、族谱、碑刻时把中文数字换算为阿拉伯数字',
          '在文案与代码之间统一数字写法，避免「壹拾贰元」与「12 元」不一致',
        ],
        privacyNote:
          '所有转换均由零依赖纯函数在浏览器本地完成，不会记录或上传任何输入文本。',
        faqs: [
          {
            question: '「两千三」到底是 2300 还是 2003？',
            answer:
              '普通话主流口语中「两千三」是「两千三百」的省略，工具按 2300 解释并给出提示；如果想表达 2003，请写作「两千零三」。',
          },
          {
            question: '支持多大的数字？',
            answer:
              '整数部分最多 16 位，即覆盖到「万亿」节（最大 9999 万亿）；小数最多 2 位，对应角、分。超出范围或数位结构不合法会明确报错。',
          },
          {
            question: '财务大写与已有人民币大写工具什么区别？',
            answer:
              '人民币大写工具只做「数字 → 大写金额」单向转换；本工具额外支持反向解析（大写/小写中文 → 数字）与普通小写中文数字、口语简式，适合需要双向核对的场景。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Chinese Number Converter is a fully in-browser, bidirectional tool: turn Arabic digits into everyday Chinese numerals ("一万二千三百四十五") or financial uppercase amounts ("壹萬贰仟叁佰肆拾伍元"), and parse Chinese numerals from classical texts, contracts or receipts back into digits. It handles consecutive zeros, 万/亿/万亿 magnitude sections, colloquial shorthand, and jiao/fen decimals.',
        coreFeatures: [
          'Bidirectional: digits to Chinese and Chinese to digits, with one-click round-trip check',
          'Two glyph sets: everyday 零一二… and financial 零壹贰… with 拾佰仟萬億',
          'Money wording: generates and parses 元/角/分/整 per Chinese receipt conventions',
          'Colloquial shorthand: "两千三" is read as 2300 with an explicit note; "两千零三" stays 2003',
          '100% in-browser: zero-dependency pure functions, contract amounts never leave the device',
        ],
        howToUse: [
          'Pick a direction: digits to Chinese or Chinese to digits',
          'For digits output, choose everyday or financial style and type a number (commas and minus sign allowed)',
          'For parsing, paste any Chinese numeral text; mixed glyphs and money wording are auto-detected',
          'Watch the yellow note for colloquial readings, and use "fill into reverse" to verify round-trips',
        ],
        useCases: [
          'Checking RMB uppercase amounts on contracts, invoices and expense forms',
          'Converting numerals found in classical books, genealogies and inscriptions',
          'Keeping number styles consistent between prose and data',
        ],
        privacyNote:
          'All conversion runs locally through zero-dependency pure functions; entered text is never logged or uploaded.',
        faqs: [
          {
            question: 'Does "两千三" mean 2300 or 2003?',
            answer:
              'In mainstream spoken Mandarin it is short for "两千三百" (2300), which is how the tool reads it, with a note. Write "两千零三" for 2003.',
          },
          {
            question: 'How large a number is supported?',
            answer:
              'Up to 16 integer digits (through the 万亿 section, max 9999 万亿) and 2 decimal places (jiao and fen). Out-of-range or structurally invalid input is rejected with an error.',
          },
          {
            question: 'How is this different from the existing RMB uppercase tool?',
            answer:
              'The RMB tool only converts digits into uppercase money text one way. This tool also parses Chinese text back into digits, supports everyday numerals and colloquial shorthand, and enables bidirectional verification.',
          },
        ],
      },
    },
  },
  {
    slug: 'triangle-solver',
    name: '三角形求解器',
    nameEn: 'Triangle Solver',
    description:
      '已知三边（SSS）、两边夹角（SAS）、两角一边（ASA/AAS）或两边对角（SSA），自动求解剩余边角、面积与周长，SSA 歧义时列出全部两解。',
    descriptionEn:
      'Solve any triangle from SSS, SAS, ASA, AAS, or SSA givens: all remaining sides and angles, area and perimeter, with both solutions listed for the ambiguous SSA case.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/triangle-solver',
    iconName: 'Triangle',
    tags: ['三角形', '解三角形', '余弦定理', '正弦定理', '几何'],
    tagsEn: ['Triangle', 'SSS SAS ASA', 'Law of Cosines', 'Law of Sines', 'Geometry'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'a=3, b=4, c=5（SSS）',
    doc: {
      zh: {
        whatIsIt:
          '三角形求解器是一款纯浏览器本地运算的几何计算工具：给定三个独立已知量（边或角），即可通过正弦定理与余弦定理求出三角形剩余的全部边、角、面积与周长，并按结果等比绘制示意图。',
        coreFeatures: [
          '五种已知条件：SSS 三边、SAS 两边夹角、ASA 两角夹边、AAS 两角对边、SSA 两边对角',
          'SSA 歧义处理：当存在两个合法三角形时同时列出两组解并给出歧义说明',
          '严格合法性校验：三角不等式、内角和 180°、sin 值域等，非法条件给出明确原因',
          '完整结果输出：三边三角、面积（海伦公式）、周长与等比 SVG 示意图',
          '纯浏览器本地运算：所有数学计算均在本地完成，不上传任何数据',
        ],
        howToUse: [
          '选择已知条件类型（SSS / SAS / ASA / AAS / SSA）',
          '在亮起的输入框中填写对应边长与角度（角度以度为单位）',
          '结果区即时显示求解出的全部边角、面积、周长与示意图',
          'SSA 模式下若出现两张解卡片，表示该条件存在歧义，请按实际场景选择',
        ],
        useCases: [
          '中学数学解三角形练习与答案核对',
          '工程测量中间接测距、测角后的现场速算',
          '需要核对边角关系的手工几何计算复核',
        ],
        privacyNote:
          '全部计算在浏览器本地以纯函数完成，不经过任何服务器，输入的尺寸数据不会离开设备。',
        faqs: [
          {
            question: '为什么 SSA 有时会给出两个解？',
            answer:
              '已知两边及其中一边的对角时，满足 sin(B)=b·sin(A)/a 的角 B 可能有锐角与钝角两个取值，对应两个不同的三角形；工具会将两个合法解全部列出。',
          },
          {
            question: '边 a、b、c 与角 A、B、C 如何对应？',
            answer:
              '约定边 a 是角 A 的对边（即顶点 A 对面的边 BC），边 b 对 B、边 c 对 C；SAS 的夹角固定为 C（a 与 b 的夹角），ASA 的夹边固定为 c。',
          },
          {
            question: '为什么输入 1、2、3 报错？',
            answer:
              '三角形必须严格满足任意两边之和大于第三边；1+2=3 是退化情形（三点共线），不构成合法三角形。',
          },
        ],
      },
      en: {
        whatIsIt:
          'Triangle Solver is a fully in-browser geometry utility: give three independent knowns (sides or angles) and it derives every remaining side and angle, the area and perimeter via the Laws of Sines and Cosines, and draws a to-scale figure.',
        coreFeatures: [
          'Five input patterns: SSS, SAS, ASA, AAS, and SSA',
          'Ambiguous SSA case: when two valid triangles exist, both solutions are listed with an explanation',
          'Strict validity checks: triangle inequality, 180° angle sum, and sine range, with clear error reasons',
          'Complete output: all sides and angles, area (Heron\'s formula), perimeter, and a to-scale SVG figure',
          '100% in-browser: every calculation runs locally and no data is uploaded',
        ],
        howToUse: [
          'Choose the known-pattern type (SSS / SAS / ASA / AAS / SSA)',
          'Fill the enabled fields with side lengths and angles in degrees',
          'The result panel instantly shows all derived sides, angles, area, perimeter, and a figure',
          'In SSA mode, two solution cards mean the givens are ambiguous—pick the one matching your scenario',
        ],
        useCases: [
          'Solving and checking school geometry problems',
          'Quick indirect distance/angle calculations in surveying and engineering',
          'Double-checking manual geometry work involving side-angle relations',
        ],
        privacyNote:
          'All calculations run locally as pure functions in the browser. No server is involved and your measurements never leave the device.',
        faqs: [
          {
            question: 'Why does SSA sometimes return two solutions?',
            answer:
              'With two sides and a non-included angle, sin(B)=b·sin(A)/a may admit both an acute and an obtuse B, producing two different triangles; the tool lists every valid solution.',
          },
          {
            question: 'How do sides a/b/c map to angles A/B/C?',
            answer:
              'Side a is opposite angle A (the edge BC across from vertex A), and likewise for b/B and c/C. In SAS the included angle is C (between a and b); in ASA the included side is c.',
          },
          {
            question: 'Why do sides 1, 2, 3 cause an error?',
            answer:
              'A triangle strictly requires any two sides to sum to more than the third; 1+2=3 is a degenerate collinear case, not a valid triangle.',
          },
        ],
      },
    },
  },
  {
    slug: 'polynomial-root-calculator',
    name: '一元二次/三次方程求根计算器',
    nameEn: 'Polynomial Root Calculator',
    description:
      '输入系数求解 ax²+bx+c=0 与 ax³+bx²+cx+d=0 的全部实根与复根，展示判别式、求根公式/Cardano 代入步骤与根的重数，首项为 0 自动降次。',
    descriptionEn:
      'Find every real and complex root of quadratic and cubic equations from their coefficients, with the discriminant, formula/Cardano steps, root multiplicity, and automatic degree reduction.',
    category: ToolCategoryEnum.TIME_MATH,
    path: '/tools/polynomial-root-calculator',
    iconName: 'Radical',
    tags: ['求根', '二次方程', '三次方程', 'Cardano', '复数'],
    tagsEn: ['Polynomial Roots', 'Quadratic', 'Cubic', 'Cardano', 'Complex Numbers'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'x² − 5x + 6 = 0',
    doc: {
      zh: {
        whatIsIt:
          '一元二次/三次方程求根计算器是一款纯浏览器本地运算的代数工具：按高次项到常数项输入系数，即可求出二次或三次方程的全部实根与共轭复根，并展示判别式、求根公式（二次）或 Cardano 法（三次）的逐步代入过程与每个根的重数。',
        coreFeatures: [
          '二次方程求根公式：按判别式 Δ=b²−4ac 给出两实根、二重根或共轭复根',
          '三次方程 Cardano 法：归一化、降阶替换，覆盖三实根（casus irreducibilis）与一实根一对复根',
          '自动降次：首项系数为 0 时自动按二次或一次方程求解，并给出矛盾常数方程等错误提示',
          '重根识别：明确标出二重根、三重根及其重数',
          '复平面分布图与求解步骤：所有根标注在 SVG 复平面上，便于核对',
        ],
        howToUse: [
          '选择方程类型：二次 ax²+bx+c=0 或三次 ax³+bx²+cx+d=0',
          '按系数 a、b、c（、d）顺序填入数字，缺少的项填 0，允许负数与小数',
          '结果区即时显示实际次数、判别式、全部根（含重数）、求解步骤与复平面分布',
          '可点击示例预设快速查看复根、三实根、重根与自动降次等典型情形',
        ],
        useCases: [
          '中学/大学代数作业的求根与判别式核对',
          '工程与物理问题中特征方程、平衡解的快速计算',
          '理解 Cardano 法与复数解、重根概念的教学辅助',
        ],
        privacyNote:
          '全部求根计算均为浏览器本地确定性数值/解析运算，零依赖、不联网，输入的系数不会离开设备。',
        faqs: [
          {
            question: '三次方程为什么有时给出复根？',
            answer:
              '实系数三次方程必有一个实根；当 Cardano 判别式 Δ>0 时另外两个根是一对共轭复根，Δ<0（casus irreducibilis）时三个根全为实数，Δ=0 时出现重根。',
          },
          {
            question: '系数填 0 会怎样？',
            answer:
              '三次方程的 a 填 0 会自动降为二次方程，a、b 都为 0 则降为一次方程；若所有系数都为 0，等式恒成立无法求根；若仅常数项非零则是矛盾方程（无解），工具会明确提示。',
          },
          {
            question: '重数是什么意思？',
            answer:
              '重数表示根在多项式因式分解中重复出现的次数，例如 (x−1)²(x+2) 中 x=1 是二重根、x=−2 是单根；重根处函数图像与横轴相切。',
          },
        ],
      },
      en: {
        whatIsIt:
          'Polynomial Root Calculator is a fully in-browser algebra utility: enter coefficients from the highest term to the constant and it finds every real root and conjugate complex pair of a quadratic or cubic equation, showing the discriminant, formula/Cardano derivation steps, and root multiplicity.',
        coreFeatures: [
          'Quadratic formula: two real roots, a double root, or a conjugate pair according to Δ=b²−4ac',
          'Cardano for cubics: normalization and depressed-cubic substitution, covering three real roots (casus irreducibilis) and one real root plus a complex pair',
          'Automatic degree reduction when leading coefficients are zero, with clear errors for inconsistent constant equations',
          'Repeated-root detection: double and triple roots are labeled with their multiplicity',
          'SVG complex-plane plot and step-by-step derivation for easy verification',
        ],
        howToUse: [
          'Choose the equation type: quadratic ax²+bx+c=0 or cubic ax³+bx²+cx+d=0',
          'Fill coefficients a, b, c (and d) in order; enter 0 for missing terms; negatives and decimals are allowed',
          'The result panel instantly shows the effective degree, discriminant, all roots (with multiplicity), derivation steps, and a complex-plane plot',
          'Click a sample preset to explore complex roots, three real roots, repeated roots, and auto degree reduction',
        ],
        useCases: [
          'Checking roots and discriminants in school or university algebra homework',
          'Quickly solving characteristic or equilibrium equations in engineering and physics',
          'Teaching aid for the Cardano method, complex solutions, and repeated roots',
        ],
        privacyNote:
          'All root finding is deterministic local numerical/analytical computation in the browser with zero dependencies and no network access; coefficients never leave the device.',
        faqs: [
          {
            question: 'Why does a cubic sometimes return complex roots?',
            answer:
              'A real-coefficient cubic always has one real root. With Cardano discriminant Δ>0 the other two roots are a conjugate complex pair; Δ<0 (casus irreducibilis) gives three real roots; Δ=0 yields repeated roots.',
          },
          {
            question: 'What if a coefficient is zero?',
            answer:
              'A zero leading coefficient automatically reduces a cubic to a quadratic (or linear) equation. All-zero coefficients mean an identity with no roots; a lone nonzero constant is an inconsistent equation with no solution—the tool explains each case.',
          },
          {
            question: 'What does multiplicity mean?',
            answer:
              'Multiplicity is how many times a root repeats in the factorization; in (x−1)²(x+2), x=1 is a double root and x=−2 is simple. The graph is tangent to the axis at a repeated root.',
          },
        ],
      },
    },
  },
  {
    slug: 'tcpip-checksum',
    name: 'TCP/IP 互联网校验和计算器',
    nameEn: 'TCP/IP Internet Checksum Calculator',
    description:
      '按 RFC 1071 计算或校验 IPv4 首部、ICMP、TCP、UDP 的 16 位反码校验和，TCP/UDP 自动拼接伪首部，输出校验和与回填后报文。',
    descriptionEn:
      'Compute or verify the RFC 1071 16-bit ones-complement checksum for IPv4 headers, ICMP, TCP, and UDP, with automatic pseudo-header for TCP/UDP, outputting the value and filled packet.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/tcpip-checksum',
    iconName: 'Globe',
    tags: ['TCP', 'UDP', 'IPv4', 'RFC1071', '校验和'],
    tagsEn: ['TCP', 'UDP', 'IPv4', 'RFC1071', 'Checksum'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    doc: {
      zh: {
        whatIsIt:
          'TCP/IP 互联网校验和计算器是一款纯浏览器本地的网络协议调试工具，按 RFC 1071 定义的 16 位反码求和算法工作：支持裸报文（IPv4 首部、ICMP）以及自动拼接 12 字节伪首部的 TCP（RFC 793）/ UDP（RFC 768）段，输出校验和值与回填后的完整报文。',
        coreFeatures: [
          '三种模式：IPv4/ICMP 裸报文、TCP 伪首部、UDP 伪首部',
          '生成模式：自动将校验和字段清零后计算，并回填到正确偏移（TCP=16、UDP=6）',
          '校验模式：对回填后的完整报文（含伪首部）求和，结果为 0xFFFF 即通过',
          '接受空格/逗号分隔、连写与 0x 前缀的十六进制输入，奇数长度按 RFC 补 0 处理',
          '一键复制校验和与回填报文，全程本地运算',
        ],
        howToUse: [
          '选择报文模式：IPv4/ICMP、TCP 或 UDP',
          '在十六进制输入框粘贴报文，校验和字段可填任意值，计算时会自动清零',
          'TCP/UDP 模式填写源 IPv4 与目的 IPv4 地址；raw 模式确认校验和字段偏移（IPv4 首部为 10）',
          '结果卡片实时展示 0x 校验和、十进制值与回填后报文，并给出校验结论',
        ],
        useCases: [
          '协议栈 / 网卡驱动开发时核对 TCP/UDP 校验和实现',
          '抓包分析中验证报文校验和字段是否正确',
          '嵌入式网络课程中手工演算反码求和与伪首部',
        ],
        privacyNote:
          '所有报文解析与校验和运算均在浏览器本地完成，输入的报文内容不会上传或离开设备。',
        faqs: [
          {
            question: 'TCP/UDP 为什么需要伪首部？',
            answer:
              '伪首部由源地址、目的地址、协议号与段长度构成，目的是让接收端确认报文确实送达正确的主机与协议，防止路由错误后被错误接收。它只参与校验和计算，不会在线上传输。',
          },
          {
            question: '为什么校验时求和结果是 0xFFFF 而不是 0？',
            answer:
              '反码算术下，对「数据 + 正确校验和」求和得到 -0，其二进制为全 1（0xFFFF）。部分实现以进位回卷后取低 16 位为 0 判等，二者等价，本工具统一按 0xFFFF 判定。',
          },
          {
            question: 'UDP 校验和不是可以为 0 吗？',
            answer:
              'IPv4 中 UDP 允许把校验和字段传 0 表示发送方未计算校验；本工具始终给出真实计算值，是否在报文中使用 0 由协议实现自行决定。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The TCP/IP Internet Checksum Calculator is a fully local network-protocol debugging tool implementing the RFC 1071 16-bit ones-complement sum. It supports raw packets (IPv4 headers, ICMP) and TCP (RFC 793) / UDP (RFC 768) segments with an automatically built 12-byte pseudo-header, outputting both the checksum value and the packet with the field filled in.',
        coreFeatures: [
          'Three modes: raw IPv4/ICMP, TCP with pseudo-header, and UDP with pseudo-header',
          'Generate: zeroes the checksum field, computes it, and fills it at the right offset (TCP=16, UDP=6)',
          'Verify: sums the complete filled packet (plus pseudo-header); 0xFFFF means valid',
          'Accepts hex input with spaces/commas, run-on bytes, and 0x prefix; odd length is zero-padded per the RFC',
          'One-click copy of the value and the filled packet; everything runs locally',
        ],
        howToUse: [
          'Choose the packet mode: IPv4/ICMP, TCP, or UDP',
          'Paste the packet as hex; the checksum field may hold any value because it is zeroed during calculation',
          'For TCP/UDP enter source and destination IPv4 addresses; in raw mode confirm the checksum offset (10 for IPv4 headers)',
          'The result card shows the 0x checksum, its decimal value, the filled packet, and the verdict in real time',
        ],
        useCases: [
          'Cross-checking TCP/UDP checksum code while developing a stack or NIC driver',
          'Validating checksum fields during packet capture analysis',
          'Working through ones-complement sums and pseudo-headers in networking courses',
        ],
        privacyNote:
          'All packet parsing and checksum arithmetic happens locally in your browser; pasted packets are never uploaded.',
        faqs: [
          {
            question: 'Why do TCP/UDP need a pseudo-header?',
            answer:
              'The pseudo-header (source/destination address, protocol, segment length) lets the receiver confirm the packet reached the right host and protocol, preventing misdelivered segments from being accepted. It only feeds the checksum and is never transmitted.',
          },
          {
            question: 'Why does verification compare against 0xFFFF instead of 0?',
            answer:
              'In ones-complement arithmetic, summing data plus the correct checksum yields -0, represented as all ones (0xFFFF). Equivalent implementations check that the folded sum is 0; this tool uses the 0xFFFF convention.',
          },
          {
            question: "Isn't the UDP checksum allowed to be zero?",
            answer:
              'Over IPv4 a sender may transmit 0 to mean "no checksum computed". This tool always shows the real computed value; whether to place 0 in the packet is left to the protocol implementation.',
          },
        ],
      },
    },
  },
  {
    slug: 'csv-to-sql',
    name: 'CSV 转 SQL INSERT 生成器',
    nameEn: 'CSV to SQL INSERT Generator',
    description:
      '将 CSV（首行为列名）转换为 SQL INSERT 语句，支持自定义表名与列名、分批行数、三种标识符引号风格与 NULL 策略，按 RFC 4180 解析引号与转义。',
    descriptionEn:
      'Convert CSV (first row as columns) into SQL INSERT statements with custom table/columns, batch size, three identifier quoting styles, and NULL handling, parsing quotes per RFC 4180.',
    category: ToolCategoryEnum.DATA_JSON,
    path: '/tools/csv-to-sql',
    iconName: 'Table2',
    tags: ['CSV', 'SQL', 'INSERT', '数据库', '转换'],
    tagsEn: ['CSV', 'SQL', 'INSERT', 'Database', 'Convert'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'id,name,email\n1,Alice,alice@example.com\n2,Bob,bob@example.com',
    doc: {
      zh: {
        whatIsIt:
          'CSV 转 SQL INSERT 生成器是一款纯浏览器本地的数据导入辅助工具：粘贴符合 RFC 4180 约定的 CSV（首行为列名），即可生成可直接执行的 INSERT 语句，支持自定义表名 / 列名、每条语句的批量行数、反引号 / 双引号 / 方括号三种标识符风格，以及空单元格与 NULL 字样的处理策略。',
        coreFeatures: [
          'RFC 4180 解析：支持双引号包裹字段、字段内逗号与换行、双引号用 "" 转义、CRLF 与 BOM',
          '自定义表名与列名（逗号分隔），列名少于 CSV 时自动按序截取',
          '三种标识符引号：反引号（MySQL）、双引号（ANSI / PostgreSQL）、方括号（SQL Server）',
          '可配置每条 INSERT 的行数（0 = 合并为一条多行 VALUES），数字保持裸字面量',
          '空单元格 → NULL 或空字符串，可选择是否把 NULL 字样识别为 SQL NULL',
        ],
        howToUse: [
          '在 CSV 输入框粘贴内容，首行会被当作列名，工具自动探测逗号 / 分号 / Tab / 竖线分隔符',
          '填写目标表名，需要时用逗号分隔填写自定义列名',
          '选择标识符引号风格、空值策略，设置每条 INSERT 的行数（0 表示合并为一条）',
          '在结果卡片中查看生成的 SQL，点击「复制」即可取用',
        ],
        useCases: [
          '把 Excel / 表格软件导出的 CSV 快速转成数据库初始化脚本',
          '数据迁移时为 MySQL / PostgreSQL / SQL Server 生成对应引号风格的 INSERT',
          '构造批量导入语句并控制单条语句大小，避免超出参数上限',
        ],
        privacyNote:
          'CSV 解析与 SQL 生成全部在浏览器本地完成，数据不会上传到任何服务器。',
        faqs: [
          {
            question: '字段里包含逗号或换行怎么办？',
            answer:
              '用双引号包裹该字段即可，例如 "VIP, founder"；字段内部的双引号写成两个双引号 ""，这是 RFC 4180 的标准转义方式。',
          },
          {
            question: '为什么有些值没有加引号？',
            answer:
              '符合整数或小数写法（如 30、-1.5）的字段会作为裸数字字面量输出，其余值按字符串加单引号，内部单引号双写转义。',
          },
          {
            question: '如何让空单元格导入为空字符串而不是 NULL？',
            answer:
              '在「空值处理」中选择「空单元格 → 空字符串」；也可以关闭「识别 NULL 字样」，让文本 NULL 按普通字符串导入。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The CSV to SQL INSERT Generator is a fully local data-import helper. Paste RFC 4180-style CSV with the first row as column names and get ready-to-run INSERT statements, with custom table/column names, configurable rows per statement, backtick/double-quote/bracket identifier styles, and flexible NULL handling.',
        coreFeatures: [
          'RFC 4180 parsing: quoted fields, commas and newlines inside fields, "" escaping, CRLF and BOM support',
          'Custom table and column names (comma-separated); fewer columns than the CSV are taken in order',
          'Three identifier styles: backticks (MySQL), double quotes (ANSI / PostgreSQL), brackets (SQL Server)',
          'Configurable rows per INSERT (0 = one multi-row statement); numbers stay bare literals',
          'Empty cells become NULL or empty strings; optional recognition of the literal word NULL',
        ],
        howToUse: [
          'Paste CSV with the first row as headers; comma/semicolon/tab/pipe delimiters are auto-detected',
          'Enter the target table name and, if needed, custom column names separated by commas',
          'Pick the identifier quote style, the empty-value policy, and the rows per INSERT (0 merges everything)',
          'Review the generated SQL in the result card and click Copy to use it',
        ],
        useCases: [
          'Turning CSV exported from spreadsheets into database seed scripts',
          'Generating INSERTs with the right quoting style for MySQL, PostgreSQL, or SQL Server during migration',
          'Building bulk-import statements while controlling statement size to stay under parameter limits',
        ],
        privacyNote:
          'All CSV parsing and SQL generation happens locally in your browser; data is never uploaded.',
        faqs: [
          {
            question: 'What if a field contains commas or newlines?',
            answer:
              'Wrap the field in double quotes, e.g. "VIP, founder"; a double quote inside is written as two double quotes (""), per RFC 4180.',
          },
          {
            question: 'Why are some values unquoted?',
            answer:
              'Fields matching an integer or decimal pattern (e.g. 30, -1.5) are emitted as bare numeric literals; everything else is single-quoted, with embedded single quotes doubled.',
          },
          {
            question: 'How do I import empty cells as empty strings instead of NULL?',
            answer:
              'Choose "empty cell to empty string" in the NULL handling option. You can also disable NULL-word recognition so the text NULL imports as a plain string.',
          },
        ],
      },
    },
  },
  {
    slug: 'glob-tester',
    name: 'Glob 模式匹配测试器',
    nameEn: 'Glob Pattern Tester',
    description:
      '输入 Glob 模式（*、**、?、{a,b}、[abc] 与路径段规则）与测试路径，实时显示每条路径的匹配结果，并输出等价的 JavaScript RegExp 字面量。',
    descriptionEn:
      'Enter a glob pattern (*, **, ?, {a,b}, [abc], path-segment rules) and test paths to see live match results per path, plus the equivalent JavaScript RegExp literal.',
    category: ToolCategoryEnum.DEV_CODE,
    path: '/tools/glob-tester',
    iconName: 'Braces',
    tags: ['Glob', '正则', '匹配', 'ignore', '路径'],
    tagsEn: ['Glob', 'RegExp', 'Match', 'ignore', 'Path'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput: 'src/**/*.{ts,tsx}',
    doc: {
      zh: {
        whatIsIt:
          'Glob 模式匹配测试器是一款纯浏览器本地的开发调试工具：把文件选择、构建工具 include/exclude、CI 忽略规则中常见的 glob 语法确定性翻译为等价的 JavaScript RegExp，并对一组测试路径逐条给出匹配结论，免去在两种语法间手工转换与反复试错。',
        coreFeatures: [
          '支持 *（单段内匹配）、**（跨路径段）、?（单字符）、{a,b} 分支组（可嵌套）与 [abc] / [!abc] 字符类',
          '实时输出等价的 JavaScript RegExp 字面量，可一键复制',
          '每条测试路径以绿色 / 灰色行展示匹配与否，并汇总匹配数量',
          '可切换是否区分大小写；正则元字符自动转义，未闭合的括号按字面量处理',
          '全部翻译与匹配在浏览器本地完成，零新依赖',
        ],
        howToUse: [
          '在「Glob 模式」输入框填写模式，例如 src/**/*.{ts,tsx}',
          '在「测试路径」中按行粘贴待验证路径，结果随输入实时更新',
          '需要时关闭「区分大小写」开关',
          '复制结果区展示的正则字面量，或直接对照每行的匹配结论调整模式',
        ],
        useCases: [
          '编写 .gitignore、eslint/tsconfig include/exclude 时快速验证模式',
          '把 glob 规则迁移到需要正则的代码或配置中',
          '排查「为什么这个文件被 / 没被匹配」的构建与 CI 问题',
        ],
        privacyNote:
          '模式翻译与路径匹配全部在浏览器本地完成，输入内容不会上传或离开设备。',
        faqs: [
          {
            question: '* 和 ** 有什么区别？',
            answer:
              '* 只在单个路径段内匹配，不会跨越 /；** 可以匹配任意层级的路径段。例如 *.ts 匹配 index.ts 但不匹配 src/index.ts，而 src/**/*.ts 两者都能覆盖。',
          },
          {
            question: '开头的 **/ 为什么能匹配零层目录？',
            answer:
              '按 doublestar、minimatch 等常见实现的约定，**/ 前缀表示「任意深度（含零层）目录下」，因此 **/foo 既能匹配 foo，也能匹配 a/foo 与 a/b/foo。',
          },
          {
            question: '输出的正则为什么带 ^ 和 $？',
            answer:
              '工具做的是整路径匹配，等价于 glob 的默认语义，因此用 ^(?:...)$ 锚定整串；如果你只需要「包含」语义，可删去首尾锚点后使用。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Glob Pattern Tester is a fully local developer tool that deterministically translates glob syntax used by file selection, build include/exclude lists, and CI ignore rules into an equivalent JavaScript RegExp, then checks a list of test paths against it—removing manual glob-to-regex conversion and trial and error.',
        coreFeatures: [
          'Supports * (within a segment), ** (across segments), ? (one char), {a,b} alternatives (nestable), and [abc] / [!abc] character classes',
          'Shows the equivalent JavaScript RegExp literal in real time with one-click copy',
          'Each test path is rendered as a matched/unmatched row with a summary count',
          'Case-sensitivity toggle; regex metacharacters are escaped, unclosed brackets are treated literally',
          'Everything runs locally in the browser with zero new dependencies',
        ],
        howToUse: [
          'Enter a glob pattern such as src/**/*.{ts,tsx} in the pattern box',
          'Paste test paths, one per line; results update as you type',
          'Toggle case sensitivity when needed',
          'Copy the generated regex literal or refine the pattern against the per-path verdicts',
        ],
        useCases: [
          'Verifying .gitignore, eslint, or tsconfig include/exclude patterns',
          'Porting glob rules into code or configuration that expects regex',
          'Debugging why a file is (or is not) matched by build or CI tooling',
        ],
        privacyNote:
          'All translation and matching happens locally in your browser; neither patterns nor paths are uploaded.',
        faqs: [
          {
            question: "What's the difference between * and **?",
            answer:
              '* matches within a single path segment and never crosses /; ** spans any number of segments. For example *.ts matches index.ts but not src/index.ts, while src/**/*.ts covers both.',
          },
          {
            question: 'Why does a leading **/ match even with no directories?',
            answer:
              'Following the convention of doublestar, minimatch, and similar libraries, a **/ prefix means "at any depth, including zero directories", so **/foo matches foo as well as a/foo and a/b/foo.',
          },
          {
            question: 'Why do the generated regexes include ^ and $?',
            answer:
              'The tool performs full-path matching, which is the default glob semantic, so the pattern is anchored with ^(?:...)$. Remove the anchors if you want a "contains" check instead.',
          },
        ],
      },
    },
  },
  {
    slug: 'word-frequency',
    name: '文本词频统计与高频词分析',
    nameEn: 'Word Frequency Analyzer',
    description:
      '统计文本中每个词的出现次数与频率，支持中文逐字 / 二元词模式、停用词过滤、可排序词频表、Top N 与 CSV 导出，用于文案分析与关键词梳理。',
    descriptionEn:
      'Count per-word occurrences and frequency in pasted text, with Chinese character/bigram modes, stop-word filtering, a sortable frequency table, Top N, and CSV export for copy and keyword analysis.',
    category: ToolCategoryEnum.TEXT_CONTENT,
    path: '/tools/word-frequency',
    iconName: 'Sigma',
    tags: ['词频', '文本分析', '关键词', '停用词', 'CSV'],
    tagsEn: ['Word Frequency', 'Text Analysis', 'Keywords', 'Stop Words', 'CSV'],
    isPopular: false,
    isNew: true,
    processing: ToolProcessingEnum.MAINTHREAD,
    defaultSampleInput:
      'The quick brown fox jumps over the lazy dog.\nThe dog barks, and the fox runs quickly.',
    doc: {
      zh: {
        whatIsIt:
          '文本词频统计与高频词分析是一款纯浏览器本地的文本分析工具：粘贴任意中英文文本，自动切词并统计每个词的出现次数与占比，提供中文逐字 / 相邻汉字二元组两种简单分词模式、内置英文停用词与自定义停用词过滤、可排序的词频表格、Top N 截取以及 CSV 复制 / 导出。',
        coreFeatures: [
          'Unicode 感知的拉丁词切分，支持 don\'t、state-of-the-art 等撇号与连字符写法',
          '中文两种简单模式：逐字统计与相邻汉字二元组（bigram）',
          '内置 30+ 英文常用停用词，可一键开关；另支持逗号 / 空格分隔的自定义停用词',
          '次数升降序与字母序排列，Top N 截取（0 = 全部），频率条形可视化',
          '结果一键复制 CSV 或下载 .csv 文件，全程本地运算',
        ],
        howToUse: [
          '在「待统计文本」中粘贴内容，结果随输入实时更新',
          '中英文混排时把分词模式切换为「中文按单字」或「中文按二元词」',
          '按需调整排序、Top N，开关内置停用词或填写自定义停用词',
          '在结果表格中查看次数与频率占比，点击「复制 CSV」或「导出 CSV」取用',
        ],
        useCases: [
          '分析文案 / 标题的高频用词，辅助 SEO 关键词梳理',
          '从日志片段中快速排查高频关键字',
          '统计中文文本中的高频字 / 二字词，做写作风格或主题初判',
        ],
        privacyNote:
          '文本切分与词频统计全部在浏览器本地完成，输入内容不会上传或离开设备。',
        faqs: [
          {
            question: '中文分词为什么只提供逐字和二元词？',
            answer:
              '完整中文分词需要词典或模型，体积大且结果依赖词库版本，不符合零依赖本地工具的定位。逐字与相邻汉字二元组（如「我爱北京」→ 我爱 / 爱北 / 北京）足以覆盖大多数高频词初筛场景。',
          },
          {
            question: '频率百分比是怎么计算的？',
            answer:
              '频率 = 该词出现次数 ÷ 停用词过滤后的有效词次总数。表格条形图按当前结果中的最高频率归一化展示，仅用于直观比较。',
          },
          {
            question: '为什么数字没有被统计？',
            answer:
              '纯数字片段（如 42、2026）默认不作为「词」计入，以避免年份、序号污染高频词结果；包含字母的字母数字组合（如 7zip、abc123）仍会保留。',
          },
        ],
      },
      en: {
        whatIsIt:
          'The Word Frequency Analyzer is a fully local text-analysis tool. Paste any Chinese/English text to get per-word counts and percentages, with two lightweight Chinese modes (single characters or adjacent bigrams), built-in English stop words plus custom stop words, a sortable table, Top N limits, and CSV copy/download.',
        coreFeatures: [
          'Unicode-aware Latin tokenization supporting contractions and hyphenated words like don\'t and state-of-the-art',
          'Two simple Chinese modes: per-character counts and adjacent-character bigrams',
          '30+ built-in English stop words with a toggle, plus custom stop words separated by commas or spaces',
          'Sort by count ascending/descending or alphabetically; Top N limit (0 = all); frequency bars',
          'Copy results as CSV or download a .csv file; everything runs locally',
        ],
        howToUse: [
          'Paste text into the input area; results update in real time',
          'For mixed Chinese text, switch the tokenization mode to per-character or bigram',
          'Adjust sorting and Top N, toggle built-in stop words, or add custom ones',
          'Review counts and percentages in the table, then copy or export CSV',
        ],
        useCases: [
          'Finding high-frequency words in copy or titles for SEO keyword work',
          'Spotting recurring keywords in log excerpts',
          'Profiling frequent characters/bigrams in Chinese text as a quick topic signal',
        ],
        privacyNote:
          'All tokenization and counting happens locally in your browser; pasted text is never uploaded.',
        faqs: [
          {
            question: 'Why only per-character and bigram modes for Chinese?',
            answer:
              'Full Chinese segmentation needs a dictionary or model, which is large and version-dependent. Per-character counting and adjacent bigrams (e.g. 我爱北京 → 我爱 / 爱北 / 北京) cover most high-frequency screening needs with zero dependencies.',
          },
          {
            question: 'How is the percentage computed?',
            answer:
              'Frequency equals the word count divided by the total number of effective tokens after stop-word filtering. The bar is normalized against the highest frequency in the current result for visual comparison only.',
          },
          {
            question: 'Why are numbers excluded?',
            answer:
              'Pure-number tokens like 42 or 2026 are not counted as words by default, preventing years and serial numbers from dominating the results; alphanumeric tokens containing letters (7zip, abc123) are kept.',
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
