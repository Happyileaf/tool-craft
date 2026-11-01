'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Space, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { decodeRfc2047 } from './utils/rfc2047';
import { DEFAULT_INPUT, EMPTY_TEXT, HINT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * RFC 2047 邮件头编码字解码工具：解析 =?charset?B/Q?text?= 结构，
 * 支持 B / Q 两种编码、多种字符集与多段编码字混排，全部运算在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns RFC 2047 解码交互界面
 */
const Rfc2047Decoder: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_INPUT);

  const result = React.useMemo(() => decodeRfc2047(input), [input]);

  /**
   * 复制解码结果
   */
  const handleCopy = async () => {
    if (!result.text) {
      return;
    }
    await copyToClipboard(result.text);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card
        title="RFC 2047 邮件头编码字解码"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => setInput(DEFAULT_INPUT)}>
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
              清空
            </Button>
          </Space>
        }
      >
        <div className={styles.meta}>
          <span>原始邮件头：</span>
          {result.encodedWordCount > 0 && (
            <Tag color="blue">识别到 {result.encodedWordCount} 个编码字</Tag>
          )}
        </div>
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="粘贴含 =?charset?B/Q?…?= 编码字的邮件头，如 Subject、From 显示名"
          autoSize={{ minRows: 4, maxRows: 12 }}
          style={{ fontFamily: 'monospace', marginTop: 8 }}
        />
        <div className={styles.hint}>{HINT}</div>
      </Card>

      <Card
        title="解码文本"
        extra={
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={handleCopy}
            disabled={Boolean(result.error) || !result.text}
          >
            复制结果
          </Button>
        }
      >
        {input.trim() === '' ? (
          <Alert type="info" showIcon message={EMPTY_TEXT} />
        ) : result.error ? (
          <Alert type="error" showIcon message="解码失败" description={result.error} />
        ) : (
          <Input.TextArea
            value={result.text ?? ''}
            readOnly
            autoSize={{ minRows: 4, maxRows: 12 }}
            style={{ fontFamily: 'monospace' }}
          />
        )}
        <div className={styles.hint}>
          B 编码使用标准 Base64；Q 编码中 “_” 表示空格、“=XX” 表示字节。字符集由编码字自身声明，
          相邻编码字之间的折行空白会被折叠，编码字与明文之间的普通空格则原样保留。
        </div>
      </Card>
    </div>
  );
};

export default Rfc2047Decoder;
