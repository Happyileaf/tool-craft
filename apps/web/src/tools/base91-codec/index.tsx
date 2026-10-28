'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Input, Radio, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  bytesToHex,
  decodeBase91ToBytes,
  encodeBase91,
  encodeBytesBase91,
  hexToBytes,
} from './utils/base91';
import {
  CodecModeEnum,
  DEFAULT_BASE91,
  DEFAULT_HEX,
  DEFAULT_TEXT,
  INPUT_TYPE_OPTIONS,
  InputTypeEnum,
  MODE_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * basE91（Joachim Henke）编解码工具，支持 UTF-8 文本与十六进制字节两种载体，
 * 解码时严格校验非法字符并给出带位置的错误提示，可配置是否忽略空白，
 * 全部运算在浏览器本地完成，不发起任何网络请求
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns basE91 编解码交互界面
 */
const Base91Codec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<CodecModeEnum>(CodecModeEnum.ENCODE);
  const [inputType, setInputType] = React.useState<InputTypeEnum>(InputTypeEnum.TEXT);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_TEXT);
  const [ignoreWhitespace, setIgnoreWhitespace] = React.useState<boolean>(true);

  const result = React.useMemo<{ output: string; error: string | null }>(() => {
    if (mode === CodecModeEnum.ENCODE) {
      if (inputType === InputTypeEnum.HEX) {
        const bytes = hexToBytes(input);
        if (!bytes) {
          return { output: '', error: '十六进制输入非法：需为偶数位的 0-9 / A-F 字符，可含空白与 0x 前缀' };
        }
        return { output: encodeBytesBase91(bytes), error: null };
      }
      return { output: encodeBase91(input), error: null };
    }

    const decoded = decodeBase91ToBytes(input, ignoreWhitespace);
    if (decoded.error || !decoded.bytes) {
      return { output: '', error: decoded.error };
    }
    if (inputType === InputTypeEnum.HEX) {
      return { output: bytesToHex(decoded.bytes), error: null };
    }
    try {
      return {
        output: new TextDecoder('utf-8', { fatal: true }).decode(decoded.bytes),
        error: null,
      };
    } catch {
      return {
        output: '',
        error: '解码所得字节不是合法的 UTF-8 序列，请切换到十六进制字节模式查看原始结果',
      };
    }
  }, [mode, inputType, input, ignoreWhitespace]);

  /**
   * 切换编解码方向并保持输入载体
   *
   * @param next - 目标方向
   */
  const handleModeChange = (next: CodecModeEnum) => {
    setMode(next);
    if (next === CodecModeEnum.ENCODE) {
      setInput(inputType === InputTypeEnum.HEX ? DEFAULT_HEX : DEFAULT_TEXT);
    } else {
      setInput(DEFAULT_BASE91);
    }
  };

  /**
   * 切换输入载体并载入对应示例
   *
   * @param next - 目标载体
   */
  const handleInputTypeChange = (next: InputTypeEnum) => {
    setInputType(next);
    setInput(mode === CodecModeEnum.ENCODE ? (next === InputTypeEnum.HEX ? DEFAULT_HEX : DEFAULT_TEXT) : DEFAULT_BASE91);
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
      <Card title="basE91 编解码">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as CodecModeEnum)}
            options={MODE_OPTIONS}
          />
          <Radio.Group
            value={inputType}
            onChange={(event) => handleInputTypeChange(event.target.value as InputTypeEnum)}
            options={INPUT_TYPE_OPTIONS}
            optionType="button"
            buttonStyle="solid"
          />
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() =>
                setInput(isEncode ? (inputType === InputTypeEnum.HEX ? DEFAULT_HEX : DEFAULT_TEXT) : DEFAULT_BASE91)
              }
            >
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
              清空
            </Button>
          </Space>
        </div>

        {!isEncode && (
          <div className={styles.toolbar} style={{ marginTop: 16 }}>
            <Checkbox
              checked={ignoreWhitespace}
              onChange={(event) => setIgnoreWhitespace(event.target.checked)}
            >
              忽略空白字符（空格、制表、换行）
            </Checkbox>
          </div>
        )}

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>
            {isEncode
              ? inputType === InputTypeEnum.TEXT
                ? '原始文本：'
                : '原始字节（十六进制）：'
              : 'basE91 字符串：'}
          </span>
        </div>
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            isEncode
              ? inputType === InputTypeEnum.TEXT
                ? '输入要编码的文本（按 UTF-8 处理）'
                : '输入要编码的十六进制字节，如 48 69'
              : '输入要解码的 basE91 字符串'
          }
          autoSize={{ minRows: 4, maxRows: 12 }}
        />
      </Card>

      <Card
        title={isEncode ? 'basE91 结果' : inputType === InputTypeEnum.TEXT ? '解码文本' : '解码字节（十六进制）'}
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
          <Alert type="error" showIcon message="转换失败" description={result.error} />
        ) : (
          <Input.TextArea value={result.output} readOnly autoSize={{ minRows: 4, maxRows: 12 }} />
        )}
        <div className={styles.hint}>
          {isEncode
            ? 'basE91 使用除 -、\\、\' 外的 91 个可打印 ASCII 字符，以可变 13/14 bit 分组承载数据，无填充，编码体积比 Base64 再小约 8%–10%。'
            : '解码按 basE91 可变分组还原字节；非字母表字符会报告具体位置，文本模式下还会校验 UTF-8 合法性。'}
        </div>
      </Card>
    </div>
  );
};

export default Base91Codec;
