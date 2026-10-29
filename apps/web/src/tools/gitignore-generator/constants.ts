/**
 * .gitignore 生成器内常量：内置语言 / 框架、编辑器 / IDE、操作系统与常用目录模板
 */

/** 模板分组定义 */
export interface GitignoreTemplate {
  /** 模板唯一 key */
  key: string;
  /** 展示名称（中文） */
  label: string;
  /** 展示名称（英文） */
  labelEn: string;
  /** 该模板包含的忽略规则 */
  rules: string[];
}

/** 全部可选模板，顺序即生成文本中的分组顺序 */
export const TEMPLATE_GROUPS: GitignoreTemplate[] = [
  {
    key: 'node',
    label: 'Node.js',
    labelEn: 'Node.js',
    rules: [
      'node_modules/',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'pnpm-debug.log*',
      '.npm',
      '.pnpm-store/',
      'dist/',
      'build/',
      '.next/',
      '.nuxt/',
      '.turbo/',
      '*.tsbuildinfo',
      'coverage/',
      '.eslintcache',
    ],
  },
  {
    key: 'python',
    label: 'Python',
    labelEn: 'Python',
    rules: [
      '__pycache__/',
      '*.py[cod]',
      '*$py.class',
      '*.egg-info/',
      '*.egg',
      '.eggs/',
      'build/',
      'dist/',
      'develop-eggs/',
      'downloads/',
      'eggs/',
      'lib/',
      'lib64/',
      'parts/',
      'sdist/',
      'var/',
      'wheels/',
      '.venv/',
      'venv/',
      'env/',
      '.env',
      '.pytest_cache/',
      '.mypy_cache/',
      '.ruff_cache/',
      '.tox/',
      '.coverage',
      'htmlcov/',
    ],
  },
  {
    key: 'java',
    label: 'Java',
    labelEn: 'Java',
    rules: [
      '*.class',
      '*.log',
      '.classpath',
      '.project',
      '.settings/',
      'target/',
      '.gradle/',
      'build/',
      'out/',
      '*.jar',
      '*.war',
      '*.ear',
      '.mvn/',
      'dependency-reduced-pom.xml',
    ],
  },
  {
    key: 'go',
    label: 'Go',
    labelEn: 'Go',
    rules: ['*.exe', '*.exe~', '*.dll', '*.so', '*.dylib', '*.test', '*.out', 'vendor/', 'bin/'],
  },
  {
    key: 'rust',
    label: 'Rust',
    labelEn: 'Rust',
    rules: ['target/', 'Cargo.lock', '**/*.rs.bk', '*.pdb'],
  },
  {
    key: 'vscode',
    label: 'VS Code',
    labelEn: 'VS Code',
    rules: ['.vscode/*', '!.vscode/extensions.json', '!.vscode/settings.json', '!.vscode/tasks.json', '*.code-workspace', '.history/'],
  },
  {
    key: 'jetbrains',
    label: 'JetBrains IDE',
    labelEn: 'JetBrains IDE',
    rules: ['.idea/', '*.iml', '*.iws', '*.ipr', 'out/'],
  },
  {
    key: 'vim',
    label: 'Vim',
    labelEn: 'Vim',
    rules: ['*.swp', '*.swo', '*~', '.netrwhist'],
  },
  {
    key: 'macos',
    label: 'macOS',
    labelEn: 'macOS',
    rules: ['.DS_Store', '.AppleDouble', '.LSOverride', '._*', '.Spotlight-V100', '.Trashes'],
  },
  {
    key: 'windows',
    label: 'Windows',
    labelEn: 'Windows',
    rules: ['Thumbs.db', 'ehthumbs.db', 'Desktop.ini', '$RECYCLE.BIN/', '*.cab', '*.msi', '*.msix', '*.msm', '*.msp'],
  },
  {
    key: 'linux',
    label: 'Linux',
    labelEn: 'Linux',
    rules: ['*~', '.fuse_hidden*', '.directory', '.Trash-*'],
  },
  {
    key: 'env',
    label: '环境变量',
    labelEn: 'Environment files',
    rules: ['.env', '.env.local', '.env.*.local', '.env.development', '.env.production'],
  },
  {
    key: 'logs',
    label: '日志文件',
    labelEn: 'Log files',
    rules: ['logs/', '*.log', 'npm-debug.log*', 'yarn-error.log*'],
  },
];

/** 默认勾选的模板 key */
export const DEFAULT_SELECTED_KEYS = ['node', 'macos', 'env'];

/** 默认自定义规则（每行一条） */
export const DEFAULT_CUSTOM_RULES = '';
