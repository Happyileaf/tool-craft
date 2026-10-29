import { describe, expect, it } from 'vitest';
import {
  BODY_LINE_MAX_LENGTH,
  HEADER_MAX_LENGTH,
  buildFooterLines,
  buildHeader,
  generateCommit,
  normalizeLines,
  validateCommit,
  type CommitInput,
} from './commit';

const baseInput: CommitInput = {
  type: 'feat',
  scope: 'web',
  subject: 'add dark mode toggle',
  body: '',
  breaking: false,
  breakingNote: '',
  issues: '',
  footers: '',
};

describe('buildHeader', () => {
  it('拼接类型、作用域与主题', () => {
    expect(buildHeader(baseInput)).toBe('feat(web): add dark mode toggle');
  });

  it('无作用域时省略括号', () => {
    expect(buildHeader({ ...baseInput, scope: '  ' })).toBe('feat: add dark mode toggle');
  });

  it('破坏性变更插入感叹号', () => {
    expect(buildHeader({ ...baseInput, breaking: true })).toBe('feat(web)!: add dark mode toggle');
  });

  it('主题为空时返回空串', () => {
    expect(buildHeader({ ...baseInput, subject: '   ' })).toBe('');
  });
});

describe('buildFooterLines', () => {
  it('汇总破坏性变更、issue 引用与自定义 footer，忽略空行', () => {
    const lines = buildFooterLines({
      ...baseInput,
      breaking: true,
      breakingNote: 'remove legacy API',
      issues: 'Closes #42\n\n #43 ',
      footers: 'Reviewed-by: Alice\n\nCo-authored-by: Bob <bob@x.com>',
    });
    expect(lines).toEqual([
      'BREAKING CHANGE: remove legacy API',
      'Closes #42',
      '#43',
      'Reviewed-by: Alice',
      'Co-authored-by: Bob <bob@x.com>',
    ]);
  });

  it('标记破坏性变更但未填说明时输出占位', () => {
    expect(buildFooterLines({ ...baseInput, breaking: true })).toEqual(['BREAKING CHANGE:']);
  });
});

describe('normalizeLines', () => {
  it('裁剪空白并丢弃空行', () => {
    expect(normalizeLines(' a \n\n b \n  ')).toEqual(['a', 'b']);
  });
});

describe('validateCommit', () => {
  it('合法输入无错误与警告', () => {
    const header = buildHeader(baseInput);
    const issues = validateCommit(baseInput, header);
    expect(issues).toEqual([]);
  });

  it('主题为空报错', () => {
    const input = { ...baseInput, subject: '' };
    const issues = validateCommit(input, buildHeader(input));
    expect(issues.some((item) => item.level === 'error' && item.message.includes('不能为空'))).toBe(true);
  });

  it('非法类型与非法作用域字符报错', () => {
    const input = { ...baseInput, type: 'wip' as CommitInput['type'], scope: 'a b' };
    const issues = validateCommit(input, 'wip(a b): add dark mode toggle');
    expect(issues.filter((item) => item.level === 'error')).toHaveLength(2);
  });

  it('非祈使英文、首字母大写、结尾句号给出警告', () => {
    const input = { ...baseInput, subject: 'Added a new button.' };
    const issues = validateCommit(input, buildHeader(input));
    expect(issues.every((item) => item.level === 'warning')).toBe(true);
    expect(issues.length).toBeGreaterThanOrEqual(3);
  });

  it('中文主题不触发英文祈使与大小写警告', () => {
    const input = { ...baseInput, subject: '新增深色模式切换开关' };
    expect(validateCommit(input, buildHeader(input))).toEqual([]);
  });

  it('header 超长给出警告', () => {
    const input = { ...baseInput, subject: 'a'.repeat(HEADER_MAX_LENGTH + 1) };
    const issues = validateCommit(input, buildHeader(input));
    expect(issues.some((item) => item.message.includes('header 长度'))).toBe(true);
  });

  it('正文超长行给出警告', () => {
    const input = { ...baseInput, body: `说明\n${'a'.repeat(BODY_LINE_MAX_LENGTH + 1)}` };
    const issues = validateCommit(input, buildHeader(input));
    expect(issues.some((item) => item.message.includes('超长行'))).toBe(true);
  });

  it('破坏性变更未填说明给出警告', () => {
    const input = { ...baseInput, breaking: true };
    const issues = validateCommit(input, buildHeader(input));
    expect(issues.some((item) => item.message.includes('BREAKING CHANGE'))).toBe(true);
  });

  it('footer 格式不规范给出警告', () => {
    const input = { ...baseInput, footers: '随便写的一行' };
    const issues = validateCommit(input, buildHeader(input));
    expect(issues.some((item) => item.message.includes('footer'))).toBe(true);
  });
});

describe('generateCommit', () => {
  it('完整输入生成规范的多行提交信息', () => {
    const result = generateCommit({
      ...baseInput,
      body: '在设置页新增主题切换入口。\n跟随系统偏好自动初始化。',
      breaking: true,
      breakingNote: '移除 v1 主题接口',
      issues: 'Closes #128',
      footers: 'Reviewed-by: Alice',
    });
    expect(result.message).toBe(
      [
        'feat(web)!: add dark mode toggle',
        '',
        '在设置页新增主题切换入口。',
        '跟随系统偏好自动初始化。',
        '',
        'BREAKING CHANGE: 移除 v1 主题接口',
        'Closes #128',
        'Reviewed-by: Alice',
      ].join('\n'),
    );
  });

  it('只有主题时输出单行', () => {
    const result = generateCommit(baseInput);
    expect(result.message).toBe('feat(web): add dark mode toggle');
  });

  it('主题为空时输出空消息且附带错误', () => {
    const result = generateCommit({ ...baseInput, subject: '' });
    expect(result.message).toBe('');
    expect(result.issues.some((item) => item.level === 'error')).toBe(true);
  });
});
