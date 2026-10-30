import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MODEL,
  GENERIC_PRESET,
} from '../constants';
import {
  generateEditorConfig,
  parseEditorConfig,
  type EditorConfigModel,
} from './editorconfig';

describe('generateEditorConfig', () => {
  it('输出 root=true、[*] 段，属性顺序固定且布尔值为小写', () => {
    const result = generateEditorConfig(DEFAULT_MODEL);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
    expect(result.output).toBe(
      [
        'root = true',
        '',
        '[*]',
        'charset = utf-8',
        'end_of_line = lf',
        'indent_style = space',
        'indent_size = 2',
        'insert_final_newline = true',
        'trim_trailing_whitespace = true',
        'max_line_length = off',
      ].join('\n'),
    );
  });

  it('未启用 root 时不含 root 行，undefined 属性被跳过', () => {
    const model: EditorConfigModel = {
      root: false,
      sections: [
        {
          glob: '*.{js,ts}',
          settings: { indentStyle: 'space', indentSize: 2, tabWidth: undefined },
        },
      ],
    };
    const result = generateEditorConfig(model);
    expect(result.valid).toBe(true);
    expect(result.output.startsWith('root')).toBe(false);
    expect(result.output).toBe('[*.{js,ts}]\nindent_style = space\nindent_size = 2');
    expect(result.output).not.toContain('tab_width');
  });

  it('多段之间以空行分隔，indent_size 支持特殊值 tab', () => {
    const result = generateEditorConfig({
      root: true,
      sections: [
        { glob: '*', settings: { indentStyle: 'space' } },
        { glob: 'Makefile', settings: { indentStyle: 'tab', indentSize: 'tab' } },
      ],
    });
    expect(result.valid).toBe(true);
    expect(result.output).toBe(
      'root = true\n\n[*]\nindent_style = space\n\n[Makefile]\nindent_style = tab\nindent_size = tab',
    );
  });

  it('空 glob 与含换行的 glob 返回 valid:false', () => {
    const empty = generateEditorConfig({
      root: false,
      sections: [{ glob: '   ', settings: { indentStyle: 'space' } }],
    });
    expect(empty.valid).toBe(false);
    expect(empty.error).toMatch(/glob 不能为空/);
    expect(empty.output).toBe('');

    const newline = generateEditorConfig({
      root: false,
      sections: [{ glob: '*.ts\n[evil]', settings: {} }],
    });
    expect(newline.valid).toBe(false);
    expect(newline.error).toMatch(/换行/);
  });

  it('indent_size 为 0 或 25 报错，tab_width 超界报错', () => {
    const zero = generateEditorConfig({
      root: false,
      sections: [{ glob: '*', settings: { indentSize: 0 } }],
    });
    expect(zero.valid).toBe(false);
    expect(zero.error).toMatch(/indent_size/);

    const tooLarge = generateEditorConfig({
      root: false,
      sections: [{ glob: '*', settings: { indentSize: 25 } }],
    });
    expect(tooLarge.valid).toBe(false);
    expect(tooLarge.error).toMatch(/indent_size/);

    const tabWidthBad = generateEditorConfig({
      root: false,
      sections: [{ glob: '*', settings: { tabWidth: 0 } }],
    });
    expect(tabWidthBad.valid).toBe(false);
    expect(tabWidthBad.error).toMatch(/tab_width/);
  });

  it('max_line_length = 0 报错，合法正整数与 off 均可输出', () => {
    const bad = generateEditorConfig({
      root: false,
      sections: [{ glob: '*', settings: { maxLineLength: 0 } }],
    });
    expect(bad.valid).toBe(false);
    expect(bad.error).toMatch(/max_line_length/);

    const good = generateEditorConfig({
      root: false,
      sections: [
        { glob: '*', settings: { maxLineLength: 120 } },
        { glob: '*.md', settings: { maxLineLength: 'off' } },
      ],
    });
    expect(good.valid).toBe(true);
    expect(good.output).toContain('max_line_length = 120');
    expect(good.output).toContain('max_line_length = off');
  });

  it('重复 glob 产生 warning 但仍输出两段', () => {
    const result = generateEditorConfig({
      root: false,
      sections: [
        { glob: '*', settings: { indentStyle: 'space' } },
        { glob: '*', settings: { endOfLine: 'lf' } },
      ],
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/多个 section/);
    expect(result.output.split(/\n\n/)).toHaveLength(2);
    expect(result.output).toContain('indent_style = space');
    expect(result.output).toContain('end_of_line = lf');
  });

  it('没有 section 或全部无属性时给出 warning', () => {
    const none = generateEditorConfig({ root: true, sections: [] });
    expect(none.valid).toBe(true);
    expect(none.warnings).toHaveLength(1);

    const emptyProps = generateEditorConfig({
      root: false,
      sections: [{ glob: '*', settings: {} }],
    });
    expect(emptyProps.warnings).toHaveLength(1);
  });

  it('通用预设包含任务要求的全部默认属性', () => {
    expect(GENERIC_PRESET.settings).toMatchObject({
      charset: 'utf-8',
      endOfLine: 'lf',
      indentStyle: 'space',
      indentSize: 2,
      insertFinalNewline: true,
      trimTrailingWhitespace: true,
      maxLineLength: 'off',
    });
  });
});

describe('parseEditorConfig', () => {
  it('解析 root 与多个 section，忽略 # 与 ; 注释及空行', () => {
    const text = [
      '# top comment',
      '; another comment',
      'root = true',
      '',
      '[*]',
      '  charset = UTF-8 ',
      'indent_style = space',
      '',
      '; Makefile 必须使用 Tab',
      '[Makefile]',
      'indent_style = tab',
    ].join('\n');
    const result = parseEditorConfig(text);
    expect(result.valid).toBe(true);
    expect(result.model.root).toBe(true);
    expect(result.model.sections).toHaveLength(2);
    expect(result.model.sections[0]!.glob).toBe('*');
    expect(result.model.sections[0]!.settings.charset).toBe('UTF-8');
    expect(result.model.sections[0]!.settings.indentStyle).toBe('space');
    expect(result.model.sections[1]!.settings.indentStyle).toBe('tab');
  });

  it('布尔转 boolean、纯数字转 number、indent_size=tab 原样保留', () => {
    const result = parseEditorConfig(
      ['[*]', 'insert_final_newline = true', 'trim_trailing_whitespace = false', 'indent_size = 4', 'tab_width = 8', 'indent_size = tab', 'max_line_length = off'].join('\n'),
    );
    const settings = result.model.sections[0]!.settings;
    expect(settings.insertFinalNewline).toBe(true);
    expect(settings.trimTrailingWhitespace).toBe(false);
    expect(settings.tabWidth).toBe(8);
    // indent_size 后出现 tab，覆盖前面的数字，保留字符串
    expect(settings.indentSize).toBe('tab');
    expect(settings.maxLineLength).toBe('off');
  });

  it('未知 key 与畸形行产生 warning 并跳过', () => {
    const result = parseEditorConfig(
      ['root = false', '[*]', 'unknown_prop = 1', 'this line has no equals sign', 'charset ='].join('\n'),
    );
    expect(result.model.root).toBe(false);
    expect(result.warnings.some((w) => w.includes('未知属性'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('无法识别'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('缺少取值'))).toBe(true);
  });

  it('section 之后的 root=true 被忽略并告警', () => {
    const result = parseEditorConfig(['[*]', 'charset = utf-8', 'root = true'].join('\n'));
    expect(result.model.root).toBe(false);
    expect(result.warnings.some((w) => w.includes('root 仅在首个 section 之前有效'))).toBe(true);
  });

  it('空 section 头与 section 外属性均告警', () => {
    const result = parseEditorConfig(['indent_style = space', '[]'].join('\n'));
    expect(result.warnings.some((w) => w.includes('section 之外'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('glob 为空'))).toBe(true);
  });
});

describe('generate → parse → generate 往返', () => {
  it('DEFAULT_MODEL 两次生成的文本完全一致', () => {
    const first = generateEditorConfig(DEFAULT_MODEL);
    expect(first.valid).toBe(true);

    const parsed = parseEditorConfig(first.output);
    expect(parsed.warnings).toEqual([]);
    expect(parsed.model.root).toBe(true);
    expect(parsed.model.sections).toHaveLength(1);

    const second = generateEditorConfig(parsed.model);
    expect(second.output).toBe(first.output);
  });
});
