'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Input, InputNumber, Radio, Select, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  generateAnsi,
  palette256ToCss,
  type AnsiResult,
  type ColorSpec,
  type ColorSpace,
} from './utils/ansi';
import { DEFAULT_TEXT, SPACE_OPTIONS, STANDARD_OPTIONS, STYLE_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface ColorState {
  space: ColorSpace;
  name: string;
  index: string;
  r: string;
  g: string;
  b: string;
}

const freshColor = (space: ColorSpace = 'none'): ColorState => ({
  space,
  name: 'red',
  index: '196',
  r: '255',
  g: '0',
  b: '128',
});

function toSpec(state: ColorState): ColorSpec {
  if (state.space === 'standard') {
    return { space: 'standard', name: state.name };
  }
  if (state.space === 'palette256') {
    return { space: 'palette256', index: Number.parseInt(state.index, 10) };
  }
  if (state.space === 'rgb') {
    return {
      space: 'rgb',
      r: Number.parseInt(state.r, 10),
      g: Number.parseInt(state.g, 10),
      b: Number.parseInt(state.b, 10),
    };
  }
  return { space: 'none' };
}

function buildPreviewStyle(result: AnsiResult, activeStyles: string[]): React.CSSProperties {
  const css: React.CSSProperties = { ...result.previewCss };
  const decorations: string[] = [];
  for (const style of activeStyles) {
    if (style === 'bold') {
      css.fontWeight = 700;
    } else if (style === 'italic') {
      css.fontStyle = 'italic';
    } else if (style === 'underline') {
      decorations.push('underline');
    } else if (style === 'strikethrough') {
      decorations.push('line-through');
    } else if (style === 'dim') {
      css.opacity = 0.6;
    } else if (style === 'hidden') {
      css.visibility = 'hidden';
    } else if (style === 'blink') {
      css.animation = 'ansiBlink 1s step-start infinite';
    }
  }
  if (decorations.length > 0) {
    css.textDecoration = decorations.join(' ');
  }
  if (activeStyles.includes('reverse')) {
    const fg = css.color;
    css.color = (css.background as string | undefined) ?? '#ffffff';
    css.background = fg ?? '#000000';
  }
  return css;
}

interface ColorFieldsProps {
  label: string;
  value: ColorState;
  onChange: (next: ColorState) => void;
}

const width64: React.CSSProperties = { width: 64 };

const ColorFields: React.FC<ColorFieldsProps> = ({ label, value, onChange }) => (
  <div className={styles.colorBlock}>
    <span className={styles.colorLabel}>{label}</span>
    <Radio.Group
      optionType="button"
      size="small"
      options={SPACE_OPTIONS}
      value={value.space}
      onChange={(e) => onChange({ ...value, space: e.target.value as ColorSpace })}
    />
    {value.space === 'standard' ? (
      <Select
        size="small"
        className={styles.colorSelect}
        value={value.name}
        onChange={(name: string) => onChange({ ...value, name })}
        options={STANDARD_OPTIONS.map((opt) => ({
          value: opt.value,
          label: (
            <span>
              <span className={styles.swatch} style={{ background: opt.css }} />
              {opt.label}
            </span>
          ),
        }))}
      />
    ) : null}
    {value.space === 'palette256' ? (
      <span className={styles.rgbRow}>
        <InputNumber
          size="small"
          min={0}
          max={255}
          precision={0}
          style={width64}
          value={value.index === '' ? null : Number(value.index)}
          onChange={(v: number | null) => onChange({ ...value, index: v === null ? '' : String(v) })}
        />
        <span
          className={styles.swatch}
          style={{
            background: palette256ToCss(Number.parseInt(value.index, 10)) ?? 'transparent',
          }}
        />
      </span>
    ) : null}
    {value.space === 'rgb' ? (
      <span className={styles.rgbRow}>
        {(['r', 'g', 'b'] as const).map((channel) => (
          <InputNumber
            key={channel}
            size="small"
            min={0}
            max={255}
            precision={0}
            style={width64}
            value={value[channel] === '' ? null : Number(value[channel])}
            onChange={(v: number | null) =>
              onChange({ ...value, [channel]: v === null ? '' : String(v) })
            }
          />
        ))}
        <span
          className={styles.swatch}
          style={{
            background: `rgb(${value.r || 0}, ${value.g || 0}, ${value.b || 0})`,
          }}
        />
      </span>
    ) : null}
  </div>
);

interface ResultRowProps {
  label: string;
  value: string | null;
  /** 文本框中的展示值；缺省时展示 value */
  display?: string | null;
}

const ResultRow: React.FC<ResultRowProps> = ({ label, value, display }) => {
  const copy = () => {
    if (!value) {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(value);
    message.success(`已复制${label}`);
  };
  return (
    <div className={styles.resultRow}>
      <div className={styles.resultLabel}>{label}</div>
      <Input.TextArea
        value={display ?? value ?? ''}
        readOnly
        autoSize={{ minRows: 1, maxRows: 4 }}
        spellCheck={false}
        className={styles.mono}
      />
      <Button size="small" icon={<CopyOutlined />} onClick={copy}>
        复制
      </Button>
    </div>
  );
};

const AnsiColorGenerator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [text, setText] = React.useState(defaultInput || DEFAULT_TEXT);
  const [fg, setFg] = React.useState<ColorState>(freshColor('standard'));
  const [bg, setBg] = React.useState<ColorState>(freshColor('none'));
  const [activeStyles, setActiveStyles] = React.useState<string[]>([]);

  const result = React.useMemo(
    () =>
      generateAnsi({
        text,
        fg: toSpec(fg),
        bg: toSpec(bg),
        styles: activeStyles,
      }),
    [text, fg, bg, activeStyles],
  );

  // 真实序列含不可见的 ESC(U+001B)，界面上以 ESC 文字可见化展示
  const sequenceDisplay = result.sequence ? result.sequence.replace(/\x1b/g, 'ESC') : null;

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card className={styles.card} title="文本与样式">
          <div className={styles.field}>
            <span className={styles.colorLabel}>文本</span>
            <Input
              value={text}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
              spellCheck={false}
              placeholder="要着色的文本"
            />
          </div>
          <ColorFields label="前景色" value={fg} onChange={setFg} />
          <ColorFields label="背景色" value={bg} onChange={setBg} />
          <div className={styles.field}>
            <span className={styles.colorLabel}>样式</span>
            <Checkbox.Group
              options={STYLE_OPTIONS}
              value={activeStyles}
              onChange={(values: (string | number)[]) => setActiveStyles(values.map(String))}
            />
          </div>
          {result.error ? (
            <Alert type="error" showIcon message={result.error} className={styles.alert} />
          ) : null}
        </Card>

        <Card className={styles.card} title="终端预览">
          <div className={styles.terminal}>
            <span className={styles.terminalPrompt}>$ </span>
            <span className={styles.terminalText} style={buildPreviewStyle(result, activeStyles)}>
              {text || ' '}
            </span>
          </div>
          <div className={styles.results}>
            <ResultRow
              label="ANSI 转义序列"
              value={result.sequence}
              display={sequenceDisplay}
            />
            <ResultRow label="JS 字符串字面量" value={result.jsLiteral} />
            <ResultRow label="Shell 命令（echo -e）" value={result.shellCommand} />
          </div>
        </Card>
      </div>

      <Alert
        type="info"
        showIcon
        message="标准 16 色使用 SGR 30–37 / 40–47（亮色 90–97 / 100–107），256 色使用 38;5;n / 48;5;n，真彩色使用 38;2;r;g;b / 48;2;r;g;b；序列以 ESC[0m 复位。预览为本地 CSS 模拟，实际效果以终端模拟器为准。全部计算在浏览器本地完成。"
      />
    </div>
  );
};

export default AnsiColorGenerator;
