'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import { SAMPLE_HEXFLOATS, SAMPLE_NUMBERS } from './constants';
import { parseHexfloat, toHexfloat } from './utils/hexfloat';
import styles from './index.module.css';

type Mode = 'parse' | 'build';

/**
 * C99 十六进制浮点（hexfloat）字面量与十进制数双向转换器。
 * 解析：0x1.8p+1 这类字面量 → JS number；构造：number → 规范化 0x1.xxxp±n。
 */
const HexfloatConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<Mode>('parse');
  const [hexInput, setHexInput] = React.useState<string>(defaultInput ?? SAMPLE_HEXFLOATS[0] ?? '');
  const [numInput, setNumInput] = React.useState<string>(SAMPLE_NUMBERS[0] ?? '');

  const parsed = React.useMemo(() => parseHexfloat(hexInput), [hexInput]);

  const built = React.useMemo(() => {
    const trimmed = numInput.trim();
    if (!trimmed) {
      return { ok: false as const, text: '', error: '输入为空' };
    }
    const value = Number(trimmed);
    if (Number.isNaN(value) && trimmed !== 'NaN') {
      return { ok: false as const, text: '', error: '无法解析为十进制数字' };
    }
    return { ok: true as const, text: toHexfloat(value), error: undefined };
  }, [numInput]);

  const handleCopy = async (text: string) => {
    if (!text) {
      message.warning('暂无可复制的内容');
      return;
    }
    await copyToClipboard(text);
    message.success('已复制到剪贴板');
  };

  return (
    <div className={styles.container}>
      <Radio.Group
        value={mode}
        onChange={(event) => setMode(event.target.value as Mode)}
        optionType="button"
        buttonStyle="solid"
        options={[
          { label: '解析 hexfloat → 十进制', value: 'parse' },
          { label: '构造 十进制 → hexfloat', value: 'build' },
        ]}
      />

      {mode === 'parse' ? (
        <Card
          title="解析 C99 hexfloat 字面量"
          extra={
            <Button size="small" onClick={() => setHexInput(SAMPLE_HEXFLOATS[0] ?? '')}>
              示例
            </Button>
          }
        >
          <Input
            className={styles.mono}
            value={hexInput}
            onChange={(event) => setHexInput(event.target.value)}
            placeholder="例如 0x1.8p+1"
          />
          <div className={styles.samples} style={{ marginTop: 12 }}>
            {SAMPLE_HEXFLOATS.map((sample) => (
              <Tag
                key={sample}
                className={styles.mono}
                onClick={() => sample !== undefined && setHexInput(sample)}
              >
                {sample}
              </Tag>
            ))}
          </div>

          {parsed.ok ? (
            <Card type="inner" title="解析结果" style={{ marginTop: 12 }}>
              <Space direction="vertical" size={4}>
                <span>
                  十进制值：
                  <strong className={styles.mono}>{formatNumber(parsed.value)}</strong>
                </span>
                <span className={styles.hint}>
                  科学计数法：
                  <span className={styles.mono}>{parsed.value.toExponential()}</span>
                </span>
              </Space>
              <Button
                size="small"
                icon={<CopyOutlined />}
                style={{ marginTop: 8 }}
                onClick={() => handleCopy(String(parsed.value))}
              >
                复制十进制值
              </Button>
            </Card>
          ) : (
            <Alert
              style={{ marginTop: 12 }}
              type="error"
              showIcon
              message="解析失败"
              description={parsed.error}
            />
          )}
        </Card>
      ) : (
        <Card
          title="构造规范化 hexfloat"
          extra={
            <Button size="small" onClick={() => setNumInput(SAMPLE_NUMBERS[0] ?? '')}>
              示例
            </Button>
          }
        >
          <Input
            className={styles.mono}
            value={numInput}
            onChange={(event) => setNumInput(event.target.value)}
            placeholder="输入十进制数，例如 3 或 0.1"
          />
          <div className={styles.samples} style={{ marginTop: 12 }}>
            {SAMPLE_NUMBERS.map((sample) => (
              <Tag
                key={sample}
                className={styles.mono}
                onClick={() => sample !== undefined && setNumInput(sample)}
              >
                {sample}
              </Tag>
            ))}
          </div>

          {built.ok ? (
            <Card type="inner" title="生成结果" style={{ marginTop: 12 }}>
              <div className={`${styles.resultBox} ${styles.mono}`}>{built.text}</div>
              <Button
                size="small"
                type="primary"
                icon={<CopyOutlined />}
                style={{ marginTop: 8 }}
                onClick={() => handleCopy(built.text)}
              >
                复制 hexfloat
              </Button>
            </Card>
          ) : (
            <Alert
              style={{ marginTop: 12 }}
              type="error"
              showIcon
              message="构造失败"
              description={built.error}
            />
          )}
        </Card>
      )}

      <Alert
        type="info"
        showIcon
        message="hexfloat 速记"
        description={
          <div className={styles.hint}>
            <p>
              语法：
              <span className={styles.mono}>{'[sign]0x 尾数 p 二进制指数'}</span>
              ，值为
              <span className={styles.mono}>{' (-1)^s × 尾数 × 2^指数'}</span>
              ；尾数按十六进制累加，小数点后每位权重 ×16⁻¹（等价 ×2⁻⁴）。
            </p>
            <p>
              注意 <span className={styles.mono}>p</span> 指数是<strong>二进制</strong>（以 2
              为底）而非十六进制；规范化输出统一为
              <span className={styles.mono}>{' 0x1.xxxp±n'}</span>，并正确处理 ±0、Infinity、NaN
              与 subnormal。
            </p>
          </div>
        }
      />
    </div>
  );
};

function formatNumber(value: number): string {
  if (Object.is(value, -0)) {
    return '-0';
  }
  return String(value);
}

export default HexfloatConverter;
