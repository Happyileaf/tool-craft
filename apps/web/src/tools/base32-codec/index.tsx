'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Input, Radio, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { decodeBase32, encodeBase32 } from './utils/base32';
import { CodecModeEnum, DEFAULT_BASE32, DEFAULT_TEXT, MODE_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * Base32 编解码工具，提供 RFC 4648 标准字母表的文本编解码与合法性校验，
 * 支持填充与去填充变体，全部运算在浏览器本地完成，不发起任何网络请求
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns Base32 编解码交互界面
 */
const Base32Codec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<CodecModeEnum>(CodecModeEnum.ENCODE);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_TEXT);
  const [unpadded, setUnpadded] = React.useState(false);

  const result = React.useMemo<{ output: string; error: string | null }>(() => {
    if (mode === CodecModeEnum.ENCODE) {
      return { output: encodeBase32(input, { padding: !unpadded }), error: null };
    }
    const decoded = decodeBase32(input);
    return { output: decoded.text ?? '', error: decoded.error };
  }, [mode, input, unpadded]);

  /**
   * 切换编解码方向并载入对应示例
   *
   * @param next - 目标方向
   */
  const handleModeChange = (next: CodecModeEnum) => {
    setMode(next);
    setInput(next === CodecModeEnum.ENCODE ? DEFAULT_TEXT : DEFAULT_BASE32);
  };

  /**
   * 载入当前方向的默认示例
   */
  const handleLoadSample = () => {
    setInput(mode === CodecModeEnum.ENCODE ? DEFAULT_TEXT : DEFAULT_BASE32);
  };

  /**
   * 清空输入
   */
  const handleClear = () => {
    setInput('');
  };

  /**
   * 复制转换结果
   */
  const handleCopy = async () => {
    if (!result.output) {
      return;
    }
    await copyToClipboard(result.output);
    message.success('复制成功');
  };

  const isEncode = mode === CodecModeEnum.ENCODE;

  return (
    <div className={styles.container}>
      <Card title="Base32 编解码">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as CodecModeEnum)}
            options={MODE_OPTIONS}
          />
          <Checkbox
            checked={unpadded}
            disabled={!isEncode}
            onChange={(event) => setUnpadded(event.target.checked)}
          >
            去填充（不输出 =）
          </Checkbox>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleLoadSample}>
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleClear}>
              清空
            </Button>
          </Space>
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>{isEncode ? '原始文本：' : 'Base32 字符串：'}</span>
        </div>
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={isEncode ? '输入要编码的文本' : '输入要解码的 Base32 字符串'}
          autoSize={{ minRows: 4, maxRows: 12 }}
        />
      </Card>

      <Card
        title={isEncode ? 'Base32 结果' : '解码文本'}
        extra={
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={handleCopy}
            disabled={Boolean(result.error) || !result.output}
          >
            复制结果
          </Button>
        }
      >
        {result.error ? (
          <Alert type="error" showIcon message="解码失败" description={result.error} />
        ) : (
          <Input.TextArea
            value={result.output}
            readOnly
            autoSize={{ minRows: 4, maxRows: 12 }}
          />
        )}
        <div className={styles.hint}>
          {isEncode
            ? '按 RFC 4648 标准字母表 A-Z2-7 编码，输入按 UTF-8 处理。'
            : '解码大小写不敏感，兼容带填充与去填充输入；合法性校验会报告具体问题位置。'}
        </div>
      </Card>
    </div>
  );
};

export default Base32Codec;
