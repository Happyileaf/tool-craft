'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  message,
} from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  bytesToHex,
  decodeBase58,
  decodeBase58Check,
  decodeBase58ToText,
  encodeBase58Check,
  encodeTextToBase58,
  hexToBytes,
  type Base58AlphabetKind,
} from './utils/base58';
import {
  ALPHABET_OPTIONS,
  Base58ModeEnum,
  CodecDirectionEnum,
  DEFAULT_ADDRESS,
  DEFAULT_BASE58,
  DEFAULT_PAYLOAD_HEX,
  DEFAULT_TEXT,
  DEFAULT_VERSION,
  MODE_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * Base58 / Base58Check 编解码工具，支持 Bitcoin / Flickr / Ripple 字母表，
 * 覆盖文本互转与带版本前缀、double-SHA256 校验和的 Base58Check，
 * 全部运算在浏览器本地完成，不发起任何网络请求
 *
 * @returns Base58 编解码交互界面
 */
const Base58Codec: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<Base58ModeEnum>(Base58ModeEnum.CODEC);
  const [direction, setDirection] = React.useState<CodecDirectionEnum>(
    CodecDirectionEnum.ENCODE,
  );
  const [alphabet, setAlphabet] = React.useState<Base58AlphabetKind>('bitcoin');
  const [text, setText] = React.useState<string>(DEFAULT_TEXT);
  const [base58Input, setBase58Input] = React.useState<string>(DEFAULT_BASE58);
  const [payloadHex, setPayloadHex] = React.useState<string>(DEFAULT_PAYLOAD_HEX);
  const [version, setVersion] = React.useState<number>(DEFAULT_VERSION);
  const [addressInput, setAddressInput] = React.useState<string>(DEFAULT_ADDRESS);
  const [encoded, setEncoded] = React.useState<string>('');
  const [checkResult, setCheckResult] = React.useState<{
    version: number | null;
    payloadHex: string;
    error: string | null;
  }>({ version: null, payloadHex: '', error: null });

  // 文本 → Base58 为同步纯运算
  const codecOutput = React.useMemo<{ output: string; error: string | null }>(() => {
    if (mode !== Base58ModeEnum.CODEC) {
      return { output: '', error: null };
    }
    if (direction === CodecDirectionEnum.ENCODE) {
      return { output: encodeTextToBase58(text, { alphabet }), error: null };
    }
    const decoded = decodeBase58ToText(base58Input, { alphabet });
    if (decoded.error) {
      return { output: '', error: decoded.error };
    }
    return { output: decoded.text ?? '', error: null };
  }, [mode, direction, text, base58Input, alphabet]);

  // Base58 解码失败时附带十六进制预览，便于查看非文本字节
  const decodedHex = React.useMemo<string>(() => {
    if (
      mode !== Base58ModeEnum.CODEC ||
      direction !== CodecDirectionEnum.DECODE ||
      !codecOutput.error
    ) {
      return '';
    }
    const raw = decodeBase58(base58Input, { alphabet });
    return raw.bytes ? bytesToHex(raw.bytes) : '';
  }, [mode, direction, codecOutput.error, base58Input, alphabet]);

  // Base58Check 编码（异步摘要）
  React.useEffect(() => {
    if (mode !== Base58ModeEnum.CHECK_ENCODE) {
      return;
    }
    let isCancelled = false;

    async function run() {
      const parsed = hexToBytes(payloadHex);
      if (parsed.error || !parsed.bytes) {
        if (!isCancelled) {
          setEncoded('');
        }
        return;
      }
      if (!Number.isInteger(version) || version < 0 || version > 255) {
        if (!isCancelled) {
          setEncoded('');
        }
        return;
      }
      try {
        const result = await encodeBase58Check(parsed.bytes, version, { alphabet });
        if (!isCancelled) {
          setEncoded(result);
        }
      } catch {
        if (!isCancelled) {
          setEncoded('');
        }
      }
    }

    run();
    return () => {
      isCancelled = true;
    };
  }, [mode, payloadHex, version, alphabet]);

  // Base58Check 解码与校验（异步摘要）
  React.useEffect(() => {
    if (mode !== Base58ModeEnum.CHECK_DECODE) {
      return;
    }
    let isCancelled = false;

    async function run() {
      const result = await decodeBase58Check(addressInput, { alphabet });
      if (!isCancelled) {
        setCheckResult({
          version: result.version,
          payloadHex: result.payload ? bytesToHex(result.payload) : '',
          error: result.error,
        });
      }
    }

    run();
    return () => {
      isCancelled = true;
    };
  }, [mode, addressInput, alphabet]);

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
  const handleModeChange = (next: Base58ModeEnum) => {
    setMode(next);
    if (next === Base58ModeEnum.CODEC) {
      setDirection(CodecDirectionEnum.ENCODE);
      setText(DEFAULT_TEXT);
      setBase58Input(DEFAULT_BASE58);
    } else if (next === Base58ModeEnum.CHECK_ENCODE) {
      setPayloadHex(DEFAULT_PAYLOAD_HEX);
      setVersion(DEFAULT_VERSION);
    } else {
      setAddressInput(DEFAULT_ADDRESS);
    }
  };

  return (
    <div className={styles.container}>
      <Card title="Base58 / Base58Check 编解码">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as Base58ModeEnum)}
            optionType="button"
            buttonStyle="solid"
            options={MODE_OPTIONS}
          />
          <div className={styles.field}>
            <span className={styles.label}>字母表</span>
            <Select
              value={alphabet}
              onChange={(value) => setAlphabet(value)}
              options={ALPHABET_OPTIONS}
              style={{ width: 200 }}
            />
          </div>
        </div>
        <div className={styles.hint}>
          Base58 去除了 0、O、I、l 及 +、/ 等易混字符；Base58Check 额外携带 1 字节版本前缀与 4
          字节 double-SHA256 校验和。
        </div>
      </Card>

      {mode === Base58ModeEnum.CODEC && (
        <>
          <Card
            title={direction === CodecDirectionEnum.ENCODE ? '原始文本' : 'Base58 字符串'}
            extra={
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() =>
                    direction === CodecDirectionEnum.ENCODE
                      ? setText(DEFAULT_TEXT)
                      : setBase58Input(DEFAULT_BASE58)
                  }
                >
                  载入示例
                </Button>
                <Button
                  icon={<ClearOutlined />}
                  onClick={() =>
                    direction === CodecDirectionEnum.ENCODE ? setText('') : setBase58Input('')
                  }
                >
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
                { label: '编码（文本 → Base58）', value: CodecDirectionEnum.ENCODE },
                { label: '解码（Base58 → 文本）', value: CodecDirectionEnum.DECODE },
              ]}
              style={{ marginBottom: 12 }}
            />
            <Input.TextArea
              value={direction === CodecDirectionEnum.ENCODE ? text : base58Input}
              onChange={(event) =>
                direction === CodecDirectionEnum.ENCODE
                  ? setText(event.target.value)
                  : setBase58Input(event.target.value)
              }
              autoSize={{ minRows: 4, maxRows: 12 }}
              placeholder={
                direction === CodecDirectionEnum.ENCODE
                  ? '输入要编码的文本（按 UTF-8 处理）'
                  : '输入要解码的 Base58 字符串'
              }
            />
          </Card>

          <Card
            title={direction === CodecDirectionEnum.ENCODE ? 'Base58 结果' : '解码文本'}
            extra={
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(codecOutput.output)}
                disabled={Boolean(codecOutput.error) || !codecOutput.output}
              >
                复制结果
              </Button>
            }
            className={styles.card}
          >
            {codecOutput.error ? (
              <Alert type="error" showIcon message="解码失败" description={codecOutput.error} />
            ) : (
              <Input.TextArea value={codecOutput.output} readOnly autoSize={{ minRows: 4, maxRows: 12 }} />
            )}
            {decodedHex && (
              <div className={styles.meta}>{`解码字节（十六进制）：${decodedHex}`}</div>
            )}
          </Card>
        </>
      )}

      {mode === Base58ModeEnum.CHECK_ENCODE && (
        <>
          <Card title="载荷（十六进制）与版本字节" className={styles.card}>
            <Space wrap style={{ marginBottom: 12 }}>
              <span className={styles.label}>版本字节</span>
              <InputNumber
                min={0}
                max={255}
                value={version}
                onChange={(value) => setVersion(typeof value === 'number' ? value : 0)}
                style={{ width: 100 }}
              />
              <span className={styles.meta}>
                0x00 = P2PKH，0x05 = P2SH（均为比特币主网）
              </span>
            </Space>
            <Input.TextArea
              value={payloadHex}
              onChange={(event) => setPayloadHex(event.target.value)}
              autoSize={{ minRows: 3, maxRows: 8 }}
              placeholder="输入偶数长度的十六进制载荷，可含空格与 0x 前缀"
            />
          </Card>

          <Card
            title="Base58Check 编码结果"
            extra={
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(encoded)}
                disabled={!encoded}
              >
                复制结果
              </Button>
            }
            className={styles.card}
          >
            {encoded ? (
              <p className={styles.meta} style={{ fontSize: 14, color: '#1677ff' }}>
                {encoded}
              </p>
            ) : (
              <Alert
                type="warning"
                showIcon
                message="无法编码"
                description="请检查载荷是否为合法偶数长度十六进制、版本字节是否在 0-255 之间。"
              />
            )}
          </Card>
        </>
      )}

      {mode === Base58ModeEnum.CHECK_DECODE && (
        <>
          <Card title="Base58Check 字符串（如比特币 / XRP 地址）" className={styles.card}>
            <Input.TextArea
              value={addressInput}
              onChange={(event) => setAddressInput(event.target.value)}
              autoSize={{ minRows: 2, maxRows: 6 }}
              placeholder="输入待校验解码的 Base58Check 字符串"
            />
          </Card>

          <Card
            title="解码与校验结果"
            extra={
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(checkResult.payloadHex)}
                disabled={Boolean(checkResult.error) || !checkResult.payloadHex}
              >
                复制载荷
              </Button>
            }
            className={styles.card}
          >
            {checkResult.error ? (
              <Alert type="error" showIcon message="校验失败" description={checkResult.error} />
            ) : (
              <>
                <div className={styles.meta}>{`版本字节：${checkResult.version}（0x${(
                  checkResult.version ?? 0
                )
                  .toString(16)
                  .padStart(2, '0')}）`}</div>
                <Input.TextArea
                  style={{ marginTop: 8 }}
                  value={checkResult.payloadHex}
                  readOnly
                  autoSize={{ minRows: 2, maxRows: 6 }}
                />
                <div className={styles.meta}>校验和验证通过：double-SHA256 前 4 字节一致。</div>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default Base58Codec;
