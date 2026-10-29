/**
 * Conventional Commits 1.0.0 提交信息生成与校验的纯函数实现
 * 规范参考：https://www.conventionalcommits.org/en/v1.0.0/
 */

/** 内置提交类型 */
export type CommitType =
  | 'feat'
  | 'fix'
  | 'docs'
  | 'style'
  | 'refactor'
  | 'perf'
  | 'test'
  | 'build'
  | 'ci'
  | 'chore'
  | 'revert';

/** 提交信息表单数据 */
export interface CommitInput {
  /** 提交类型 */
  type: CommitType;
  /** 作用域（可留空） */
  scope: string;
  /** 主题（subject） */
  subject: string;
  /** 正文（可留空，多行） */
  body: string;
  /** 是否标记破坏性变更 */
  breaking: boolean;
  /** 破坏性变更说明（可留空，写入 footer） */
  breakingNote: string;
  /** 关联的 issue / PR 编号，每行一个，如 #123 或 Closes #42 */
  issues: string;
  /** 其他 footer，每行一个 token: value 或 token #value */
  footers: string;
}

/** 校验条目 */
export interface CommitIssue {
  /** 错误级别：error 阻止规范输出，warning 为建议 */
  level: 'error' | 'warning';
  /** 问题说明 */
  message: string;
}

/** 生成结果 */
export interface CommitResult {
  /** 拼接后的完整提交信息（输入不完整时可能为空串） */
  message: string;
  /** 首行 header，用于长度统计 */
  header: string;
  /** 校验问题集合 */
  issues: CommitIssue[];
}

/** Conventional Commits 1.0.0 允许的类型集合 */
export const COMMIT_TYPES: { value: CommitType; label: string; description: string }[] = [
  { value: 'feat', label: 'feat', description: '新增功能' },
  { value: 'fix', label: 'fix', description: '缺陷修复' },
  { value: 'docs', label: 'docs', description: '文档变更' },
  { value: 'style', label: 'style', description: '代码风格（不影响逻辑）' },
  { value: 'refactor', label: 'refactor', description: '重构（非新增功能、非修复）' },
  { value: 'perf', label: 'perf', description: '性能优化' },
  { value: 'test', label: 'test', description: '新增或修改测试' },
  { value: 'build', label: 'build', description: '构建系统或外部依赖' },
  { value: 'ci', label: 'ci', description: 'CI 配置与脚本' },
  { value: 'chore', label: 'chore', description: '杂项（不影响源码与测试）' },
  { value: 'revert', label: 'revert', description: '回滚历史提交' },
];

/** header 建议长度上限（社区通用 72 列） */
export const HEADER_MAX_LENGTH = 72;
/** body 每行建议长度上限 */
export const BODY_LINE_MAX_LENGTH = 100;
/** 主题最大长度（硬性） */
export const SUBJECT_MAX_LENGTH = 120;

const VALID_TYPE_SET = new Set<string>(COMMIT_TYPES.map((item) => item.value));

/** 祈使语气提示中需要避免的常见第三人称/过去式英文前缀 */
const NON_IMPERATIVE_PREFIXES = [
  'adds ',
  'added ',
  'fixes ',
  'fixed ',
  'changes ',
  'changed ',
  'removes ',
  'removed ',
  'updates ',
  'updated ',
  'allows ',
  'allowed ',
  'makes ',
  'made ',
  'supports ',
  'supported ',
];

/**
 * 判断字符串是否包含拉丁字母
 */
function hasLatinLetters(value: string): boolean {
  return /[A-Za-z]/.test(value);
}

/**
 * 规范化多行文本：去掉每行首尾空白，丢弃空行
 */
export function normalizeLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * 拼接 header：type(scope)!: subject
 */
export function buildHeader(input: Pick<CommitInput, 'type' | 'scope' | 'breaking' | 'subject'>): string {
  const subject = input.subject.trim();
  if (!subject) {
    return '';
  }
  const scope = input.scope.trim();
  const scopePart = scope ? `(${scope})` : '';
  const breakingPart = input.breaking ? '!' : '';
  return `${input.type}${scopePart}${breakingPart}: ${subject}`;
}

/**
 * 汇总 footer 行：破坏性变更说明、issue 引用、自定义 footer
 */
export function buildFooterLines(input: CommitInput): string[] {
  const lines: string[] = [];
  if (input.breaking) {
    const note = input.breakingNote.trim();
    lines.push(note ? `BREAKING CHANGE: ${note}` : 'BREAKING CHANGE:');
  }
  for (const line of normalizeLines(input.issues)) {
    lines.push(line);
  }
  for (const line of normalizeLines(input.footers)) {
    lines.push(line);
  }
  return lines;
}

/**
 * 对输入执行规范校验，返回错误与警告
 */
export function validateCommit(input: CommitInput, header: string): CommitIssue[] {
  const issues: CommitIssue[] = [];
  const type = input.type.trim();
  const scope = input.scope.trim();
  const subject = input.subject.trim();

  if (!VALID_TYPE_SET.has(type)) {
    issues.push({ level: 'error', message: `提交类型「${type}」不在 Conventional Commits 允许集合中` });
  }
  if (scope && !/^[a-zA-Z0-9._/-]+$/.test(scope)) {
    issues.push({ level: 'error', message: '作用域只能包含字母、数字、点、斜杠、连字符与下划线' });
  }
  if (!subject) {
    issues.push({ level: 'error', message: '主题（subject）不能为空' });
  } else {
    if (NON_IMPERATIVE_PREFIXES.some((prefix) => subject.toLowerCase().startsWith(prefix))) {
      issues.push({
        level: 'warning',
        message: '英文主题建议使用祈使语气，如 "add" 而非 "added / adds"',
      });
    }
    if (hasLatinLetters(subject) && /^[A-Z]/.test(subject)) {
      issues.push({ level: 'warning', message: '英文主题首字母建议小写，且结尾不要加句号' });
    }
    if (subject.charAt(subject.length - 1) === '.' || subject.charAt(subject.length - 1) === '。') {
      issues.push({ level: 'warning', message: '主题结尾不要加句号' });
    }
    if (subject.length > SUBJECT_MAX_LENGTH) {
      issues.push({ level: 'error', message: `主题过长（${subject.length} > ${SUBJECT_MAX_LENGTH} 字符）` });
    }
  }
  if (header && header.length > HEADER_MAX_LENGTH) {
    issues.push({
      level: 'warning',
      message: `header 长度为 ${header.length} 字符，建议控制在 ${HEADER_MAX_LENGTH} 字符以内`,
    });
  }
  for (const line of normalizeLines(input.body)) {
    if (line.length > BODY_LINE_MAX_LENGTH) {
      issues.push({
        level: 'warning',
        message: `正文存在 ${line.length} 字符的超长行，建议每行不超过 ${BODY_LINE_MAX_LENGTH} 字符`,
      });
      break;
    }
  }
  if (input.breaking && !input.breakingNote.trim()) {
    issues.push({ level: 'warning', message: '已标记破坏性变更，建议在 footer 中补充 BREAKING CHANGE 说明' });
  }
  for (const line of normalizeLines(input.footers)) {
    if (!/^[\w-]+(\s+#|:\s).+/.test(line)) {
      issues.push({
        level: 'warning',
        message: `footer「${line}」建议写作 "token: value" 或 "token #value" 形式`,
      });
      break;
    }
  }
  return issues;
}

/**
 * 生成完整提交信息并附带校验结果
 */
export function generateCommit(input: CommitInput): CommitResult {
  const header = buildHeader(input);
  const issues = validateCommit(input, header);
  if (!header) {
    return { message: '', header: '', issues };
  }
  const parts: string[] = [header];
  const body = input.body.trim();
  if (body) {
    parts.push('', body);
  }
  const footerLines = buildFooterLines(input);
  if (footerLines.length > 0) {
    parts.push('', footerLines.join('\n'));
  }
  return { message: parts.join('\n'), header, issues };
}
