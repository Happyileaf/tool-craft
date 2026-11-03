'use client';

import React, { useMemo, useRef, useState } from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Input,
  InputNumber,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  message,
} from 'antd';
import {
  DEFAULT_BYTES_PER_LINE,
  DEFAULT_VARIABLE_NAME,
  EXAMPLE_ARRAY_LITERAL,
  EXAMPLE_HEX,
  INPUT_TYPES,
  LANGUAGES,
  MAX_BYTES_PER_LINE,
  MAX_FILE_BYTES,
  MIN_BYTES_PER_LINE,
  type InputType,
  type Language,
} from './constants';
import {
  bytesToBase64,
  bytesToHex,
  bytesToText,
  decodeInput,
  generateCode,
  parseArrayLiteral,
} from './utils/byteArray';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type Mode = 'generate' | 'parse';

/**
 * 字节数组代码生成器：Hex / Base64 / 文本 → C / Java / Python / Go 字节数组声明，
 * 并支持把粘贴回来的数组字面量反向解析为字节。全部本地计算，零依赖。
 *
 * @param props - 工具组件属性
 * @returns 字节数组代码生成器界面
 */
const ByteArrayCodegen: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = useState<Mode>('generate');
  const [inputType, setInputType] = useState<InputType>('hex');
  const [raw, setRaw] = useState<string>(EXAMPLE_HEX);
  const [language, setLanguage] = useState<Language>('c');
  const [varName, setVarName] = useState<string>(DEFAULT_VARIABLE_NAME);
  const [perLine, setPerLine] = useState<number>(DEFAULT_BYTES_PER_LINE);
  const [parseRaw, setParseRaw] = useState<string>(EXAMPLE_ARRAY_LITERAL);
  const [messageApi, contextHolder] = message.useMessage();
  const fileRef = useRef<HTMLInputElement | null>(null);

  // 生成模式：解析输入字节
  const parsed = useMemo<{ bytes: Uint8Array | null; error: string | null }>(() => {
    try {
      return { bytes: decodeInput(inputType, raw), error: null };
    } catch (error) {
      return { bytes: null, error: error instanceof Error ? error.message : '解析失败' };
    }
  }, [inputType, raw]);

  // 生成模式：渲染代码
  const generated = useMemo<{ code: string; extension: string } | { error: string } | null>(() => {
    if (!parsed.bytes) return null;
    try {
      return generateCode(parsed.bytes, language, {
        variableName: varName,
        bytesPerLine: perLine,
      });
    } catch (error) {
      return { error: error instanceof Error ? error.message : '生成失败' };
    }
  }, [parsed.bytes, language, varName, perLine]);

  // 反向模式：解析数组字面量
  const reversed = useMemo<{ bytes: Uint8Array | null; error: string | null }>(() => {
    try {
      return { bytes: parseArrayLiteral(parseRaw), error: null };
    } catch (error) {
      return { bytes: null, error: error instanceof Error ? error.message : '解析失败' };
    }
  }, [parseRaw]);

  const onPickFile = async (file: File): Promise<void> => {
    if (file.size > MAX_FILE_BYTES) {
      messageApi.error(`文件超过 ${MAX_FILE_BYTES.toLocaleString()} 字节上限`);
      return;
    }
    const buf = new Uint8Array(await file.arrayBuffer());
    setInputType('hex');
    setRaw(bytesToHex(buf, true));
    messageApi.success(`已载入 ${file.name}（${buf.length.toLocaleString()} 字节）`);
  };

  const previewRows = (parsed.bytes ?? new Uint8Array(0)).slice(0, 96);

  return (
    <div className={styles.container}>
      {contextHolder}
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as Mode)}
          options={[
            { label: '生成代码（数据 → 数组）', value: 'generate' },
            { label: '反向解析（数组 → 数据）', value: 'parse' },
          ]}
        />

        {mode === 'generate' && (
          <>
            <Card
              title="1. 输入数据"
              extra={
                <Space>
                  <Select
                    value={inputType}
                    onChange={setInputType}
                    options={INPUT_TYPES}
                    style={{ width: 150 }}
                  />
                  <input
                    ref={fileRef}
                    type="file"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void onPickFile(f);
                      e.target.value = '';
                    }}
                  />
                  <Button size="small" onClick={() => fileRef.current?.click()}>
                    从文件读取
                  </Button>
                </Space>
              }
            >
              <Input.TextArea
                className={styles.inputBox}
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                autoSize={{ minRows: 4, maxRows: 14 }}
                placeholder={
                  inputType === 'hex'
                    ? 'Hex，如 48 65 6C 6C 6F（允许空格、0x、逗号）'
                    : inputType === 'base64'
                      ? 'Base64，如 SGVsbG8='
                      : '任意 UTF-8 文本'
                }
              />
              {parsed.error && (
                <Alert type="error" showIcon style={{ marginTop: 12 }} message={parsed.error} />
              )}
            </Card>

            <Card
              title="2. 生成选项"
              extra={
                <Space size="large">
                  <span>
                    语言：
                    <Select
                      value={language}
                      onChange={setLanguage}
                      options={LANGUAGES}
                      style={{ width: 240 }}
                    />
                  </span>
                  <span>
                    变量名：
                    <Input
                      value={varName}
                      onChange={(e) => setVarName(e.target.value)}
                      className={styles.mono}
                      style={{ width: 120 }}
                    />
                  </span>
                  <span>
                    每行字节数：
                    <InputNumber
                      value={perLine}
                      onChange={(v) => setPerLine(v ?? DEFAULT_BYTES_PER_LINE)}
                      min={MIN_BYTES_PER_LINE}
                      max={MAX_BYTES_PER_LINE}
                      style={{ width: 80 }}
                    />
                  </span>
                </Space>
              }
            >
              <Space size="large">
                <Statistic
                  title="字节数"
                  value={parsed.bytes ? parsed.bytes.length : 0}
                  valueStyle={{ fontSize: 18 }}
                />
                <div>
                  <div className={styles.byteCount}>Hex 预览</div>
                  <div className={styles.mono} style={{ fontSize: 12, wordBreak: 'break-all' }}>
                    {parsed.bytes ? bytesToHex(previewRows, true) : '—'}
                    {parsed.bytes && parsed.bytes.length > previewRows.length && ' …'}
                  </div>
                </div>
              </Space>
            </Card>

            <Card
              title="3. 生成结果"
              extra={
                generated && 'code' in generated && (
                  <Space>
                    <Tag className={styles.mono}>{`.${generated.extension}`}</Tag>
                    <Button
                      type="primary"
                      onClick={async () => {
                        if (generated && 'code' in generated) {
                          await copyToClipboard(generated.code);
                          messageApi.success('代码已复制');
                        }
                      }}
                    >
                      复制代码
                    </Button>
                  </Space>
                )
              }
            >
              {generated && 'error' in generated ? (
                <Alert type="error" showIcon message={generated.error} />
              ) : generated && 'code' in generated ? (
                <pre className={styles.codeBox}>{generated.code}</pre>
              ) : (
                <Alert type="warning" showIcon message="请先修正输入数据" />
              )}
            </Card>
          </>
        )}

        {mode === 'parse' && (
          <>
            <Card
              title="粘贴数组字面量（C / C++ / Java / Go / Python 均可）"
              extra={
                <Button
                  onClick={() => {
                    setParseRaw(EXAMPLE_ARRAY_LITERAL);
                  }}
                >
                  填入示例
                </Button>
              }
            >
              <Input.TextArea
                className={styles.inputBox}
                value={parseRaw}
                onChange={(e) => setParseRaw(e.target.value)}
                autoSize={{ minRows: 6, maxRows: 16 }}
                placeholder={'如：const unsigned char data[] = { 0x48, 0x69 };\n或 Python：data = b"\\x48\\x69"'}
              />
              {reversed.error && (
                <Alert type="error" showIcon style={{ marginTop: 12 }} message={reversed.error} />
              )}
            </Card>

            {reversed.bytes && (
              <Card
                title={`解析结果（${reversed.bytes.length} 字节）`}
                extra={
                  <Space>
                    <Button
                      onClick={async () => {
                        await copyToClipboard(bytesToHex(reversed.bytes as Uint8Array, true));
                        messageApi.success('Hex 已复制');
                      }}
                    >
                      复制 Hex
                    </Button>
                    <Button
                      onClick={async () => {
                        await copyToClipboard(bytesToBase64(reversed.bytes as Uint8Array));
                        messageApi.success('Base64 已复制');
                      }}
                    >
                      复制 Base64
                    </Button>
                  </Space>
                }
              >
                <Table
                  size="small"
                  pagination={false}
                  rowKey={(_, i) => String(i)}
                  dataSource={[
                    {
                      key: 'hex',
                      label: 'Hex（带空格）',
                      value: bytesToHex(reversed.bytes, true),
                    },
                    {
                      key: 'hexcompact',
                      label: 'Hex（连续）',
                      value: bytesToHex(reversed.bytes, false),
                    },
                    { key: 'base64', label: 'Base64', value: bytesToBase64(reversed.bytes) },
                    {
                      key: 'text',
                      label: '文本（UTF-8，非法字节显示为 �）',
                      value: bytesToText(reversed.bytes),
                    },
                  ]}
                  columns={[
                    { title: '格式', dataIndex: 'label', key: 'label', width: 240 },
                    {
                      title: '内容',
                      dataIndex: 'value',
                      key: 'value',
                      render: (v: string) => (
                        <span className={styles.mono} style={{ wordBreak: 'break-all' }}>
                          {v}
                        </span>
                      ),
                    },
                  ]}
                />
              </Card>
            )}
          </>
        )}

        <Alert
          type="info"
          showIcon
          message="所有解析与代码生成均在浏览器本地完成，不上传任何数据；Base64 为内置实现，无新增第三方依赖。"
        />
      </Space>
    </div>
  );
};

export default ByteArrayCodegen;
