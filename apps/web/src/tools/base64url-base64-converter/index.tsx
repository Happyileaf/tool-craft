'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  convertLines,
  decodeForVerification,
  detectVariant,
  type Base64Variant,
} from './utils/base64url';
import { DEFAULT_INPUT, DEFAULT_TARGET, TARGET_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * Base64URL ↔ 标准 Base64 规范化互转器
 *
 * 在 RFC 4648 两种字母表变体之间双向转换，自动识别输入变体、补齐或去除填充，
 * 支持多行令牌批量处理与字节级解码验证，全部计算在浏览器本地完成。
 */
const Base64UrlBase64Converter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [target, setTarget] = React.useState<Base64Variant>(DEFAULT_TARGET);
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const result = React.useMemo(() => convertLines(input, target), [input, target]);

  const verification = React.useMemo(() => {
    const firstLine = input.split('\n').find((line) => line.trim() !== '');
    if (!firstLine) {
      return null;
    }
    const variant = detectVariant(firstLine.trim());
    return decodeForVerification(firstLine, variant);
  }, [input]);

  const handleCopy = () => {
    if (result.output === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.output);
    message.success('已复制转换结果');
  };

  const activeTarget = TARGET_OPTIONS.find((option) => option.value === target);

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card
          className={styles.card}
          title="输入（每行一个令牌，自动识别变体）"
          extra={
            <Radio.Group
              size="small"
              optionType="button"
              buttonStyle="solid"
              value={target}
              options={TARGET_OPTIONS.map((option) => ({
                value: option.value,
                label: option.value === 'standard' ? '→ 标准 Base64' : '→ Base64URL',
              }))}
              onChange={(e) => setTarget(e.target.value as Base64Variant)}
            />
          }
        >
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder="粘贴 Base64 或 Base64URL 令牌，支持多行批量转换（如 JWT 片段、OIDC nonce）…"
          />
        </Card>

        <Card
          className={styles.card}
          title="输出"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          <Input.TextArea
            value={result.output}
            readOnly
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
          />
          {result.warnings.length > 0 ? (
            <div className={styles.warnings}>
              {result.warnings.map((warning, index) => (
                <Alert
                  key={`${index}-${warning}`}
                  type="warning"
                  showIcon
                  className={styles.warningItem}
                  message={warning}
                />
              ))}
            </div>
          ) : null}
        </Card>
      </div>

      <div className={styles.toolbar}>
        <Tag color="blue">{activeTarget?.label}</Tag>
        <span className={styles.hint}>{activeTarget?.hint}</span>
      </div>

      {verification ? (
        verification.error ? (
          <Alert type="error" showIcon message="字节级解码验证失败" description={verification.error} />
        ) : (
          <Alert
            type="success"
            showIcon
            message={`字节级解码验证通过：首行可还原为 ${verification.bytes} 字节`}
            description={`十六进制预览：${verification.hexPreview || '（空）'}`}
          />
        )
      ) : null}
    </div>
  );
};

export default Base64UrlBase64Converter;
