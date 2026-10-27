'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Select, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  bytesToHex,
  decodeBase62ToText,
  decodeInteger,
  decodeToBytes,
  encodeInteger,
  encodeTextToBase62,
  parseInteger,
  type Base62AlphabetKind,
} from './utils/base62';
import {
  ALPHABET_OPTIONS,
  Base62ModeEnum,
  CodecDirectionEnum,
  DEFAULT_BASE62_INTEGER,
  DEFAULT_BASE62_TEXT,
  DEFAULT_INTEGER,
  DEFAULT_TEXT,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * Base62 编解码工具：支持 GMP（0-9A-Za-z）与替代（0-9a-zA-Z）两种字母表，
 * 区分整数模式（非负大整数 ↔ Base62）与字节模式（UTF-8 文本 ↔ Base62，
 * 保留前导零字节）。全部运算在浏览器本地完成，不发起任何网络请求。
 *
 * @returns Base62 编解码交互界面
 */
const Base62Codec: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<Base62ModeEnum>(Base62ModeEnum.INTEGER);
  const [direction, setDirection] = React.useState<CodecDirectionEnum>(
    CodecDirectionEnum.ENCODE,
  );
  const [alphabet, setAlphabet] = React.useState<Base62AlphabetKind>('gmp');
  const [integerInput, setIntegerInput] = React.useState<string>(DEFAULT_INTEGER);
  const [textInput, setTextInput] = React.useState<string>(DEFAULT_TEXT);
  const [base62IntegerInput, setBase62IntegerInput] =
    React.useState<string>(DEFAULT_BASE62_INTEGER);
  const [base62TextInput, setBase62TextInput] =
    React.useState<string>(DEFAULT_BASE62_TEXT);

  // 整数模式：输入非负整数（十进制 / 0x 十六进制）或 Base62，实时换算
  const integerOutput = React.useMemo<{ output: string; error: string | null }>(
    () => {
      if (mode !== Base62ModeEnum.INTEGER) {
        return { output: '', error: null };
      }
      if (direction === CodecDirectionEnum.ENCODE) {
        const parsed = parseInteger(integerInput);
        if (parsed.error || parsed.value === null) {
          return { output: '', error: parsed.error };
        }
        try {
          return {
            output: encodeInteger(parsed.value, { alphabet }),
            error: null,
          };
        } catch (error) {
          return {
            output: '',
            error: error instanceof Error ? error.message : '编码失败',
          };
        }
      }
      const decoded = decodeInteger(base62IntegerInput, { alphabet });
      if (decoded.error || decoded.value === null) {
        return { output: '', error: decoded.error };
      }
      return { output: decoded.value.toString(), error: null };
    },
    [mode, direction, integerInput, base62IntegerInput, alphabet],
  );

  // 整数解码同时给出十六进制表示，便于协议场景使用
  const integerHex = React.useMemo<string>(() => {
    if (
      mode !== Base62ModeEnum.INTEGER ||
      direction !== CodecDirectionEnum.DECODE ||
      integerOutput.error
    ) {
      return '';
    }
    return `0x${BigInt(integerOutput.output).toString(16).toUpperCase()}`;
  }, [mode, direction, integerOutput.error, integerOutput.output]);

  // 字节模式：UTF-8 文本 ↔ Base62
  const bytesOutput = React.useMemo<{ output: string; error: string | null }>(
    () => {
      if (mode !== Base62ModeEnum.BYTES) {
        return { output: '', error: null };
      }
      if (direction === CodecDirectionEnum.ENCODE) {
        return { output: encodeTextToBase62(textInput, { alphabet }), error: null };
      }
      const decoded = decodeBase62ToText(base62TextInput, { alphabet });
      return { output: decoded.text ?? '', error: decoded.error };
    },
    [mode, direction, textInput, base62TextInput, alphabet],
  );

  // 字节模式解码失败时附带十六进制预览，便于查看非文本字节
  const decodedHex = React.useMemo<string>(() => {
    if (
      mode !== Base62ModeEnum.BYTES ||
      direction !== CodecDirectionEnum.DECODE ||
      !bytesOutput.error
    ) {
      return '';
    }
    const raw = decodeToBytes(base62TextInput, { alphabet });
    return raw.bytes ? bytesToHex(raw.bytes) : '';
  }, [mode, direction, bytesOutput.error, base62TextInput, alphabet]);

  /**
   * 复制结果文本
   *
   * @param value - 待复制内容
   */
  const handleCopy = async (value: string) => {
    if (!value) {
      message.warning('当前没有可复制的内容');
      return;
    }
    await copyToClipboard(value);
    message.success('复制成功');
  };

  /**
   * 切换模式时载入对应默认示例
   *
   * @param next - 目标模式
   */
  const handleModeChange = (next: Base62ModeEnum) => {
    setMode(next);
    setDirection(CodecDirectionEnum.ENCODE);
    if (next === Base62ModeEnum.INTEGER) {
      setIntegerInput(DEFAULT_INTEGER);
      setBase62IntegerInput(DEFAULT_BASE62_INTEGER);
    } else {
      setTextInput(DEFAULT_TEXT);
      setBase62TextInput(DEFAULT_BASE62_TEXT);
    }
  };

  const isInteger = mode === Base62ModeEnum.INTEGER;
  const inputValue = isInteger
    ? direction === CodecDirectionEnum.ENCODE
      ? integerInput
      : base62IntegerInput
    : direction === CodecDirectionEnum.ENCODE
      ? textInput
      : base62TextInput;
  const setInputValue = (value: string) => {
    if (isInteger) {
      if (direction === CodecDirectionEnum.ENCODE) {
        setIntegerInput(value);
      } else {
        setBase62IntegerInput(value);
      }
    } else if (direction === CodecDirectionEnum.ENCODE) {
      setTextInput(value);
    } else {
      setBase62TextInput(value);
    }
  };
  const currentOutput = isInteger ? integerOutput : bytesOutput;
  const inputTitle =
    direction === CodecDirectionEnum.ENCODE
      ? isInteger
        ? '非负整数（十进制或 0x 十六进制）'
        : '原始文本（UTF-8）'
      : 'Base62 字符串';
  const outputTitle =
    direction === CodecDirectionEnum.ENCODE
      ? 'Base62 结果'
      : isInteger
        ? '解码整数（十进制）'
        : '解码文本';
  const placeholder =
    direction === CodecDirectionEnum.ENCODE
      ? isInteger
        ? '输入非负整数，如 256 或 0x10；支持逗号 / 下划线分隔'
        : '输入要编码的文本（按 UTF-8 处理）'
      : '输入要解码的 Base62 字符串';

  return (
    <div className={styles.container}>
      <Card title="Base62 编解码">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as Base62ModeEnum)}
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: '整数模式', value: Base62ModeEnum.INTEGER },
              { label: '字节 / 文本模式', value: Base62ModeEnum.BYTES },
            ]}
          />
          <div className={styles.field}>
            <span className={styles.label}>字母表</span>
            <Select
              value={alphabet}
              onChange={(value) => setAlphabet(value)}
              options={ALPHABET_OPTIONS}
              style={{ width: 220 }}
            />
          </div>
        </div>
        <div className={styles.hint}>
          Base62 使用 0-9、A-Z、a-z 共 62 个字符，无填充、URL-safe，常用于短链 token 与短
          ID。整数模式按 62 进制表示非负大整数；字节模式按字节换算并保留前导零字节（与
          Base58 做法一致），适合任意二进制与 UTF-8 文本。
        </div>
      </Card>

      <Card
        title={inputTitle}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() =>
                setInputValue(
                  isInteger
                    ? direction === CodecDirectionEnum.ENCODE
                      ? DEFAULT_INTEGER
                      : DEFAULT_BASE62_INTEGER
                    : direction === CodecDirectionEnum.ENCODE
                      ? DEFAULT_TEXT
                      : DEFAULT_BASE62_TEXT,
                )
              }
            >
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setInputValue('')}>
              清空
            </Button>
          </Space>
        }
        className={styles.card}
      >
        <Radio.Group
          value={direction}
          onChange={(event) => setDirection(event.target.value as CodecDirectionEnum)}
          optionType="button"
          options={[
            { label: '编码', value: CodecDirectionEnum.ENCODE },
            { label: '解码', value: CodecDirectionEnum.DECODE },
          ]}
          style={{ marginBottom: 12 }}
        />
        <Input.TextArea
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          autoSize={{ minRows: 4, maxRows: 12 }}
          placeholder={placeholder}
        />
      </Card>

      <Card
        title={outputTitle}
        extra={
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(currentOutput.output)}
            disabled={Boolean(currentOutput.error) || !currentOutput.output}
          >
            复制结果
          </Button>
        }
        className={styles.card}
      >
        {currentOutput.error ? (
          <Alert
            type="error"
            showIcon
            message="无法处理"
            description={currentOutput.error}
          />
        ) : (
          <Input.TextArea
            value={currentOutput.output}
            readOnly
            autoSize={{ minRows: 4, maxRows: 12 }}
          />
        )}
        {integerHex && <div className={styles.meta}>{`十六进制：${integerHex}`}</div>}
        {decodedHex && (
          <div className={styles.meta}>{`解码字节（十六进制）：${decodedHex}`}</div>
        )}
      </Card>
    </div>
  );
};

export default Base62Codec;
