'use client';

import React from 'react';
import { Alert, Button, Card, Input, message, Segmented, Tag } from 'antd';
import { ArrowRightLeft, Braces, Copy } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';
import { META_CHARACTERS, REGEX_FLAG_OPTIONS, SAMPLE_INPUT } from './constants';
import {
  buildRegexLiteral,
  buildRegExpConstructor,
  escapeRegex,
  unescapeRegex,
} from './utils/regexEscape';
import styles from './index.module.css';

type Mode = 'escape' | 'unescape';

const RegexEscapeTool: React.FC = () => {
  const [mode, setMode] = React.useState<Mode>('escape');
  const [input, setInput] = React.useState(SAMPLE_INPUT);
  const [flags, setFlags] = React.useState<string[]>([]);

  const flagString = React.useMemo(() => {
    // RegExp flags 必须按字母序，REGEX_FLAG_OPTIONS 已按 d/g/i/m/s/u/v/y 排列
    return REGEX_FLAG_OPTIONS.map((option) => option.value)
      .filter((value) => flags.includes(value))
      .join('');
  }, [flags]);

  const escaped = React.useMemo(() => escapeRegex(input), [input]);
  const unescaped = React.useMemo(() => unescapeRegex(input), [input]);

  const toggleFlag = (value: string) => {
    setFlags((previous) =>
      previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value],
    );
  };

  const copy = (text: string, label: string) => {
    if (!text) {
      message.warning('暂无可复制内容');
      return;
    }
    copyToClipboard(text);
    message.success(`已复制${label}`);
  };

  return (
    <div className={styles.container}>
      <Alert
        type="info"
        showIcon
        message="正则表达式元字符转义 / 反转义工具"
        description="把普通文本安全转义为可嵌入正则的字面量片段（对齐 ECMA-262 RegExp.escape 语义，自研确定性实现，不依赖运行时支持），并输出 new RegExp 构造源码与 /.../ 字面量；也可把已转义片段还原为原始文本。全程本地处理。"
      />

      <Card
        size="small"
        title={
          <span>
            <ArrowRightLeft size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
            输入
          </span>
        }
        extra={
          <Segmented
            value={mode}
            onChange={(value) => setMode(value as Mode)}
            options={[
              { label: '转义（文本 → 正则）', value: 'escape' },
              { label: '反转义（正则 → 文本）', value: 'unescape' },
            ]}
          />
        }
      >
        <Input.TextArea
          value={input}
          rows={6}
          placeholder={mode === 'escape' ? '粘贴需要作为字面量匹配的普通文本' : '粘贴已转义的正则片段'}
          onChange={(e) => setInput(e.target.value)}
          style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13 }}
        />
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <Button size="small" onClick={() => setInput(SAMPLE_INPUT)}>
            填入示例
          </Button>
          <Button size="small" onClick={() => setInput('')}>
            清空
          </Button>
        </div>

        {mode === 'escape' ? (
          <div style={{ marginTop: 12 }}>
            <div className={styles.outputLabel}>RegExp flags（点击切换，自动按字母序）</div>
            <div className={styles.flags}>
              {REGEX_FLAG_OPTIONS.map((option) => (
                <Tag.CheckableTag
                  key={option.value}
                  checked={flags.includes(option.value)}
                  onChange={() => toggleFlag(option.value)}
                  className={styles.flagChip}
                >
                  {option.label}
                </Tag.CheckableTag>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      <div className={styles.layout}>
        {mode === 'escape' ? (
          <>
            <Card size="small" title="转义后的字面量片段">
              <div className={styles.outputBlock}>
                <div className={styles.outputLabel}>
                  <span>正则字面量</span>
                  <Button size="small" icon={<Copy size={13} />} onClick={() => copy(buildRegexLiteral(escaped, { flags: flagString }), '正则字面量')}>
                    复制
                  </Button>
                </div>
                <div className={styles.codeBox}>
                  <code className={styles.codeText}>{buildRegexLiteral(escaped, { flags: flagString })}</code>
                </div>
              </div>
              <div className={styles.outputBlock}>
                <div className={styles.outputLabel}>
                  <span>
                    <Braces size={13} style={{ verticalAlign: -2 }} /> new RegExp 构造源码
                  </span>
                  <Button size="small" icon={<Copy size={13} />} onClick={() => copy(buildRegExpConstructor(escaped, { flags: flagString }), '构造源码')}>
                    复制
                  </Button>
                </div>
                <div className={styles.codeBox}>
                  <code className={styles.codeText}>{buildRegExpConstructor(escaped, { flags: flagString })}</code>
                </div>
              </div>
            </Card>
            <Card size="small" title="说明与元字符">
              <Alert
                type="success"
                showIcon
                message="可直接用于匹配的确定性结果"
                description="转义集合覆盖 ECMA-262 SyntaxCharacter 以及正斜杠、连字符与换行符。转义后的片段作为 new RegExp 的参数可精确匹配原始文本，避免 . * + 等被当作正则语法。"
                style={{ marginBottom: 12 }}
              />
              <div className={styles.outputLabel}>本工具处理的特殊字符</div>
              <div className={styles.metaList}>
                {META_CHARACTERS.map((char) => (
                  <span key={char} className={styles.metaChar}>
                    {char}
                  </span>
                ))}
              </div>
            </Card>
          </>
        ) : (
          <Card size="small" title="还原后的原始文本" style={{ gridColumn: '1 / -1' }}>
            <div className={styles.outputLabel}>
              <span>反转义结果</span>
              <Button size="small" icon={<Copy size={13} />} onClick={() => copy(unescaped, '反转义结果')}>
                复制
              </Button>
            </div>
            <div className={styles.codeBox}>
              <code className={styles.codeText}>{unescaped || '（空）'}</code>
            </div>
            <Alert
              style={{ marginTop: 12 }}
              type="warning"
              showIcon
              message="反转义范围"
              description="支持还原元字符反斜杠转义、\\n \\r \\t 等控制序列以及 \\uXXXX、\\xXX 码点转义；对不属于转义序列的反斜杠会安全地保留或去除前缀。"
            />
          </Card>
        )}
      </div>
    </div>
  );
};

export default RegexEscapeTool;
