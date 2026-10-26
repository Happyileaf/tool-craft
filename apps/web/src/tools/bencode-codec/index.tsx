'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { decodeBencodeToJson, encodeJsonToBencode, BYTES_MARKER } from './utils/bencode-json';
import { CodecModeEnum, DEFAULT_BENCODE, DEFAULT_JSON, MODE_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * Bencode（BitTorrent 序列化格式）与 JSON 双向转换工具。
 * Bencode → JSON 时按缩进格式化预览，非 UTF-8 的原始字节串以
 * { "$$bencodeBytes$$": "<十六进制>" } 标记对象呈现；JSON → Bencode 时
 * 字典键自动按字节序排序。非法语法、字典键未排序、长度不符等错误均带定位信息。
 * 全部解析在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns Bencode 编解码交互界面
 */
const BencodeCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<CodecModeEnum>(CodecModeEnum.DECODE);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_BENCODE);

  const result = React.useMemo<{ output: string; error: string | null }>(() => {
    if (!input.trim()) {
      return { output: '', error: null };
    }
    if (mode === CodecModeEnum.DECODE) {
      const decoded = decodeBencodeToJson(input);
      if (decoded.error !== null) {
        return { output: '', error: decoded.error };
      }
      const jsonText = JSON.stringify(decoded.output, null, 2);
      return { output: jsonText, error: null };
    }
    const encoded = encodeJsonToBencode(input);
    if (encoded.error !== null || typeof encoded.output !== 'string') {
      return { output: '', error: encoded.error ?? 'Bencode 编码失败' };
    }
    return { output: encoded.output, error: null };
  }, [mode, input]);

  /**
   * 切换转换方向并载入对应示例
   *
   * @param next - 目标方向
   */
  const handleModeChange = (next: CodecModeEnum) => {
    setMode(next);
    setInput(next === CodecModeEnum.DECODE ? DEFAULT_BENCODE : DEFAULT_JSON);
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

  const isDecode = mode === CodecModeEnum.DECODE;

  return (
    <div className={styles.container}>
      <Card title="Bencode 编解码器（.torrent 数据解析与生成）">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as CodecModeEnum)}
            options={MODE_OPTIONS}
          />
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setInput(isDecode ? DEFAULT_BENCODE : DEFAULT_JSON)}
            >
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
              清空
            </Button>
          </Space>
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>{isDecode ? 'Bencode 输入：' : 'JSON 输入：'}</span>
        </div>
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            isDecode
              ? '输入 Bencode 文本，如 d8:announce...（原始字节按 Latin-1 承载）'
              : '输入合法 JSON，整数/字符串/数组/对象将编码为 Bencode'
          }
          autoSize={{ minRows: 6, maxRows: 16 }}
          spellCheck={false}
        />
      </Card>

      <Card
        title={isDecode ? 'JSON 预览' : 'Bencode 结果'}
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
          <Alert
            type="error"
            showIcon
            message={isDecode ? 'Bencode 解析失败' : 'JSON 编码失败'}
            description={result.error}
          />
        ) : (
          <Input.TextArea value={result.output} readOnly autoSize={{ minRows: 6, maxRows: 16 }} />
        )}
        <div className={styles.hint}>
          {isDecode
            ? `Bencode 支持整数 i..e、字节串 长度:内容、列表 l..e 与字典 d..e；非 UTF-8 的原始字节串以 {"${BYTES_MARKER}": "<十六进制>"} 标记对象呈现，编码方向可原样还原。`
            : '编码时字典键自动按字节序升序排列；要写入原始字节串，使用 {"' +
              BYTES_MARKER +
              '": "<偶数位十六进制>"} 标记对象。'}
        </div>
      </Card>
    </div>
  );
};

export default BencodeCodec;
