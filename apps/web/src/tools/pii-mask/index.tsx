'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Input, Radio, Space, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  CATEGORY_LABELS,
  compileCustomPattern,
  maskPii,
  type MaskStrategy,
  type PiiCategory,
} from './utils/mask';
import { DEFAULT_INPUT } from './constants';
import styles from './index.module.css';

/** 支持开关的内置类别顺序（custom 由自定义正则输入单独控制） */
const CATEGORY_ORDER: PiiCategory[] = [
  'email',
  'phone',
  'idCard',
  'bankCard',
  'ipv4',
  'ipv6',
  'apiKey',
];

/** 默认全部内置类别启用 */
function createDefaultEnabled(): Record<PiiCategory, boolean> {
  return {
    email: true,
    phone: true,
    idCard: true,
    bankCard: true,
    ipv4: true,
    ipv6: true,
    apiKey: true,
    custom: false,
  };
}

/**
 * PII 敏感信息脱敏工具：在浏览器本地识别文本中的邮箱、手机号、身份证号、银行卡号、
 * IPv4 / IPv6 与通用 API Key / Token，并按保留首尾或整体替换策略脱敏。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入文本
 * @returns PII 脱敏交互界面
 */
const PiiMask: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_INPUT);
  const [strategy, setStrategy] = React.useState<MaskStrategy>('partial');
  const [maskChar, setMaskChar] = React.useState<string>('*');
  const [enabled, setEnabled] = React.useState<Record<PiiCategory, boolean>>(
    createDefaultEnabled,
  );
  const [customPatternSource, setCustomPatternSource] = React.useState<string>('');

  const effectiveMaskChar = maskChar.trim().length > 0 ? maskChar.trim()[0] : '*';
  const { patterns: customPatterns, error: customError } = React.useMemo<{
    patterns: RegExp[];
    error: string | null;
  }>(() => {
    const sources = customPatternSource
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '');
    const compiled: RegExp[] = [];
    for (const source of sources) {
      try {
        compiled.push(compileCustomPattern(source));
      } catch {
        return { patterns: [], error: `自定义正则「${source}」格式不正确` };
      }
    }
    return { patterns: compiled, error: null };
  }, [customPatternSource]);

  const effectiveEnabled = React.useMemo<Record<PiiCategory, boolean>>(
    () => ({ ...enabled, custom: customPatterns.length > 0 }),
    [enabled, customPatterns],
  );

  const result = React.useMemo(
    () => maskPii(input, strategy, effectiveMaskChar, effectiveEnabled, customPatterns),
    [input, strategy, effectiveMaskChar, effectiveEnabled, customPatterns],
  );

  const activeCategories = ([...CATEGORY_ORDER, 'custom'] as PiiCategory[]).filter(
    (category) => result.counts[category] > 0,
  );

  const copyOutput = async (): Promise<void> => {
    await copyToClipboard(result.output);
    message.success('脱敏结果已复制');
  };

  const resetSample = (): void => {
    setInput(defaultInput || DEFAULT_INPUT);
    setStrategy('partial');
    setMaskChar('*');
    setEnabled(createDefaultEnabled());
    setCustomPatternSource('');
  };

  return (
    <div className={styles.container}>
      <Card title="PII 敏感信息脱敏">
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="粘贴需要脱敏的日志、配置或文本，识别与脱敏均在浏览器本地完成"
          autoSize={{ minRows: 8, maxRows: 20 }}
        />

        <div className={styles.controls}>
          <Space size="large" wrap>
            <span>
              <span className={styles.label}>掩码策略：</span>
              <Radio.Group
                value={strategy}
                onChange={(event) => setStrategy(event.target.value as MaskStrategy)}
                optionType="button"
                buttonStyle="solid"
                options={[
                  { label: '保留首尾', value: 'partial' },
                  { label: '整体替换', value: 'full' },
                ]}
              />
            </span>
            <span>
              <span className={styles.label}>掩码字符：</span>
              <Input
                value={maskChar}
                onChange={(event) => setMaskChar(event.target.value)}
                maxLength={1}
                className={styles.maskCharInput}
              />
            </span>
          </Space>

          <div className={styles.categoryRow}>
            <span className={styles.label}>识别类别：</span>
            <Checkbox.Group
              value={CATEGORY_ORDER.filter((category) => enabled[category])}
              onChange={(values) => {
                const active = new Set(values as PiiCategory[]);
                setEnabled(
                  CATEGORY_ORDER.reduce(
                    (accumulator, category) => ({
                      ...accumulator,
                      [category]: active.has(category),
                    }),
                    createDefaultEnabled(),
                  ),
                );
              }}
              options={CATEGORY_ORDER.map((category) => ({
                label: CATEGORY_LABELS[category],
                value: category,
              }))}
            />
          </div>

          <div className={styles.categoryRow}>
            <span className={styles.label}>自定义正则：</span>
            <Input.TextArea
              value={customPatternSource}
              onChange={(event) => setCustomPatternSource(event.target.value)}
              placeholder="每行一条，如 订单号：\d{6}；也支持 /pattern/flags 写法。内置规则优先生效，自定义规则之间按行顺序占位"
              autoSize={{ minRows: 1, maxRows: 4 }}
              className={styles.customInput}
            />
          </div>
          {customError ? (
            <Alert type="error" showIcon message={customError} />
          ) : null}
        </div>

        <Space style={{ marginTop: 12 }}>
          <Button icon={<ReloadOutlined />} onClick={resetSample}>
            载入示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
            清空
          </Button>
        </Space>
      </Card>

      <Card title={`脱敏结果（共 ${result.total} 处命中）`}>
        {activeCategories.length > 0 ? (
          <div className={styles.statsRow}>
            {activeCategories.map((category) => (
              <Tag color="blue" key={category}>
                {CATEGORY_LABELS[category]} × {result.counts[category]}
              </Tag>
            ))}
          </div>
        ) : (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message="未识别到任何已启用类别的敏感信息"
          />
        )}
        <Input.TextArea
          value={result.output}
          readOnly
          autoSize={{ minRows: 8, maxRows: 20 }}
          className={styles.output}
        />
        <Button
          type="primary"
          icon={<CopyOutlined />}
          style={{ marginTop: 12 }}
          onClick={copyOutput}
        >
          复制脱敏结果
        </Button>
        <div className={styles.hint}>
          全部识别与替换均在浏览器本地完成，文本不会上传到任何服务器。内置规则按
          邮箱 → 身份证号 → 银行卡号 → 手机号 → API Key / Token → IPv6 → IPv4
          的优先级占位，用户自定义正则优先级最低；已命中的片段不会被重复掩码，URL
          中的域名与端口不会被误判为 IP 地址。
        </div>
      </Card>
    </div>
  );
};

export default PiiMask;
