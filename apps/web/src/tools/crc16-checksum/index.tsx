'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Space, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  computeAll,
  parseHexBytes,
  textToBytes,
  type InputMode,
} from './utils/crc';
import { DEFAULT_HEX, DEFAULT_TEXT } from './constants';
import styles from './index.module.css';

/**
 * CRC-16 / Adler-32 多算法校验和计算器：对文本（UTF-8）或十六进制字节流
 * 计算 6 种常见 CRC-16 参数模型与 Adler-32，输出十进制与定长十六进制结果，
 * 全部在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入（作为文本内容）
 * @returns 校验和计算交互界面
 */
const Crc16Checksum: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<InputMode>('text');
  const [text, setText] = React.useState<string>(defaultInput || DEFAULT_TEXT);
  const [hexInput, setHexInput] = React.useState<string>(DEFAULT_HEX);

  const { bytes, error } = React.useMemo(() => {
    if (mode === 'text') {
      return { bytes: textToBytes(text), error: null as string | null };
    }
    try {
      return { bytes: parseHexBytes(hexInput), error: null as string | null };
    } catch (caught) {
      return { bytes: [] as number[], error: caught instanceof Error ? caught.message : '十六进制解析失败' };
    }
  }, [mode, text, hexInput]);

  const results = React.useMemo(() => (error ? [] : computeAll(bytes)), [bytes, error]);

  const copyHex = async (hex: string, name: string): Promise<void> => {
    await copyToClipboard(hex);
    message.success(`${name} 结果已复制`);
  };

  return (
    <div className={styles.container}>
      <Card title="CRC-16 / Adler-32 校验和计算器">
        <Radio.Group
          value={mode}
          onChange={(event) => setMode(event.target.value as InputMode)}
          optionType="button"
          buttonStyle="solid"
          style={{ marginBottom: 12 }}
          options={[
            { label: '文本（UTF-8 字节）', value: 'text' },
            { label: '十六进制字节流', value: 'hex' },
          ]}
        />
        <div className={styles.formColumn}>
          {mode === 'text' ? (
            <Input.TextArea
              className={styles.inputArea}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="输入文本，将按 UTF-8 编码为字节"
              autoSize={{ minRows: 4, maxRows: 14 }}
            />
          ) : (
            <Input.TextArea
              className={styles.inputArea}
              value={hexInput}
              onChange={(event) => setHexInput(event.target.value)}
              placeholder="十六进制字节，可用空格/逗号分隔，支持 0x 前缀，如 31 32 33 或 0x31,0x32"
              autoSize={{ minRows: 4, maxRows: 14 }}
            />
          )}
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setText(defaultInput || DEFAULT_TEXT);
              setHexInput(DEFAULT_HEX);
            }}
          >
            载入示例
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              setText('');
              setHexInput('');
            }}
          >
            清空
          </Button>
          <Tag color="blue">{mode === 'text' ? new TextEncoder().encode(text).length : bytes.length} 字节</Tag>
        </Space>
        {error ? <Alert type="error" showIcon message={error} style={{ marginTop: 12 }} /> : null}
      </Card>

      <Card title="校验和结果">
        {results.map((item) => (
          <div className={styles.resultRow} key={item.key}>
            <span className={styles.resultName}>{item.name}</span>
            <span className={styles.resultHex}>0x{item.hex}</span>
            <span className={styles.resultDec}>{item.decimal}</span>
            <Button size="small" icon={<CopyOutlined />} onClick={() => copyHex(item.hex, item.name)}>
              复制
            </Button>
          </div>
        ))}
        <div className={styles.hint}>
          CRC-16 按 width=16 的 RockSoft 参数模型（poly / init / refin / refout / xorout）直驱实现，覆盖
          CCITT-FALSE、ARC、XMODEM、MODBUS、GENIBUS、KERMIT 六种常见变体；Adler-32 遵循 RFC 1950。
          标准向量 "123456789" 的 CCITT-FALSE 为 0x29B1、ARC 为 0xBB3D、XMODEM 为 0x31C3、Adler-32 为
          0x091E01DE。所有计算仅在浏览器本地完成。
        </div>
      </Card>
    </div>
  );
};

export default Crc16Checksum;
