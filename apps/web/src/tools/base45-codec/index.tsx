'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { decodeBase45, encodeBase45 } from './utils/base45';
import { CodecModeEnum, DEFAULT_BASE45, DEFAULT_TEXT, MODE_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * Base45（RFC 9285）编解码工具，在 UTF-8 文本与 45 字符集字符串之间双向转换，
 * 解码时严格校验非法字符、非法尾序列与数值溢出并给出带位置的错误提示，
 * 全部运算在浏览器本地完成，不发起任何网络请求
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns Base45 编解码交互界面
 */
const Base45Codec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<CodecModeEnum>(CodecModeEnum.ENCODE);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_TEXT);

  const result = React.useMemo<{ output: string; error: string | null }>(() => {
    if (mode === CodecModeEnum.ENCODE) {
      return { output: encodeBase45(input), error: null };
    }
    const decoded = decodeBase45(input);
    return { output: decoded.text ?? '', error: decoded.error };
  }, [mode, input]);

  /**
   * 切换编解码方向并载入对应示例
   *
   * @param next - 目标方向
   */
  const handleModeChange = (next: CodecModeEnum) => {
    setMode(next);
    setInput(next === CodecModeEnum.ENCODE ? DEFAULT_TEXT : DEFAULT_BASE45);
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
      <Card title="Base45（RFC 9285）编解码">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as CodecModeEnum)}
            options={MODE_OPTIONS}
          />
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setInput(isEncode ? DEFAULT_TEXT : DEFAULT_BASE45)}
            >
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
              清空
            </Button>
          </Space>
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>{isEncode ? '原始文本：' : 'Base45 字符串：'}</span>
        </div>
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={isEncode ? '输入要编码的文本（按 UTF-8 处理）' : '输入要解码的 Base45 字符串'}
          autoSize={{ minRows: 4, maxRows: 12 }}
        />
      </Card>

      <Card
        title={isEncode ? 'Base45 结果' : '解码文本'}
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
          <Input.TextArea value={result.output} readOnly autoSize={{ minRows: 4, maxRows: 12 }} />
        )}
        <div className={styles.hint}>
          {isEncode
            ? 'Base45 使用 0–9、A–Z 与 " $%*+-./:" 共 45 个字符，每 2 字节编码为 3 个字符，是欧盟数字健康证书（DCC）二维码的标准承载编码。'
            : '解码按 2 字节→3 字符分块还原 UTF-8 文本；非法字符、非法尾序列与数值溢出均会报告具体位置。'}
        </div>
      </Card>
    </div>
  );
};

export default Base45Codec;
