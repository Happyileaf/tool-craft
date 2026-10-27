'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, Input, Radio, Select, Space, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  bytesToHex,
  convertBits,
  decodeBech32,
  encodeBech32,
  hexToBytes,
  interpretSegwit,
  type Bech32Decoded,
  type EncodeKind,
  type SegwitInfo,
} from './utils/bech32';
import {
  Bech32DirectionEnum,
  DEFAULT_ADDRESS,
  DEFAULT_HRP,
  DEFAULT_PROGRAM_HEX,
  DEFAULT_WITNESS_VERSION,
  ENCODE_KIND_OPTIONS,
  WITNESS_VERSION_OPTIONS,
  type Bech32KindValue,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface DecodeResult {
  decoded?: Bech32Decoded;
  segwit?: SegwitInfo | null;
  programHex?: string;
  error?: string;
}

/**
 * Bech32 / Bech32m 编解码器（BIP-173 / BIP-350）
 *
 * 编码区：HRP + witness 版本 + hex program → bech32 字符串；
 * 解码区：bech32 字符串 → HRP / 数据 / 校验和类型 / SegWit 解读。
 * 全部为本地同步运算，不发起任何网络请求。
 *
 * @returns Bech32 编解码界面
 */
const Bech32Codec: React.FC<ToolComponentProps> = () => {
  const [direction, setDirection] = React.useState<Bech32DirectionEnum>(
    Bech32DirectionEnum.ENCODE,
  );
  const [hrp, setHrp] = React.useState<string>(DEFAULT_HRP);
  const [programHex, setProgramHex] = React.useState<string>(DEFAULT_PROGRAM_HEX);
  const [witnessVersion, setWitnessVersion] = React.useState<number>(DEFAULT_WITNESS_VERSION);
  const [kind, setKind] = React.useState<Bech32KindValue>('auto');
  const [addressInput, setAddressInput] = React.useState<string>(DEFAULT_ADDRESS);

  const encodeResult = React.useMemo<{ output: string; error?: string }>(() => {
    try {
      const bytes = hexToBytes(programHex);
      const fiveBit = convertBits(bytes, 8, 5, true);
      const data = witnessVersion >= 0 ? [witnessVersion, ...fiveBit] : fiveBit;
      const output = encodeBech32(hrp, data, kind as EncodeKind);
      if (output.length > 90) {
        return { output, error: `结果长度 ${output.length} 超过 BIP-173 建议上限 90 字符` };
      }
      return { output };
    } catch (cause) {
      return { output: '', error: cause instanceof Error ? cause.message : String(cause) };
    }
  }, [hrp, programHex, witnessVersion, kind]);

  const decodeResult = React.useMemo<DecodeResult>(() => {
    try {
      const decoded = decodeBech32(addressInput);
      let segwit: SegwitInfo | null = null;
      let programHex: string | undefined;
      let error: string | undefined;
      try {
        segwit = interpretSegwit(decoded);
        if (segwit) {
          programHex = segwit.programHex;
        } else {
          // 非已知 SegWit 网络：尝试展示跳过首字节后的 5→8bit 还原（严格 padding），
          // 失败则展示全部 5-bit 原始值
          try {
            programHex = bytesToHex(convertBits(decoded.data.slice(1), 5, 8, false));
          } catch {
            programHex = decoded.data.map((v) => v.toString(16).padStart(2, '0')).join(' ');
          }
        }
      } catch (segwitError) {
        error = segwitError instanceof Error ? segwitError.message : String(segwitError);
      }
      return { decoded, segwit, programHex, error };
    } catch (cause) {
      return { error: cause instanceof Error ? cause.message : String(cause) };
    }
  }, [addressInput]);

  /**
   * 复制结果
   *
   * @param value - 待复制文本
   */
  const handleCopy = async (value: string) => {
    if (!value) {
      message.warning('当前没有可复制的内容');
      return;
    }
    await copyToClipboard(value);
    message.success('复制成功');
  };

  const resetEncode = () => {
    setHrp(DEFAULT_HRP);
    setProgramHex(DEFAULT_PROGRAM_HEX);
    setWitnessVersion(DEFAULT_WITNESS_VERSION);
    setKind('auto');
  };

  return (
    <div className={styles.container}>
      <Card title="Bech32 / Bech32m 编解码器（BIP-173 / BIP-350）">
        <Radio.Group
          value={direction}
          onChange={(event) => setDirection(event.target.value as Bech32DirectionEnum)}
          optionType="button"
          buttonStyle="solid"
          options={[
            { label: '编码（HRP + 数据 → Bech32）', value: Bech32DirectionEnum.ENCODE },
            { label: '解码（Bech32 → HRP + 数据 / SegWit 解读）', value: Bech32DirectionEnum.DECODE },
          ]}
        />
        <div className={styles.hint}>
          Bech32 用于 witness v0 地址（P2WPKH/P2WSH），Bech32m 用于 v1+（如 Taproot P2TR）；
          校验和为 30 位 BCH 码，可检出常见抄写错误。全部运算在浏览器本地完成。
        </div>
      </Card>

      {direction === Bech32DirectionEnum.ENCODE && (
        <>
          <Card
            title="编码输入"
            extra={
              <Space>
                <Button icon={<ReloadOutlined />} onClick={resetEncode}>
                  载入示例
                </Button>
                <Button
                  icon={<ClearOutlined />}
                  onClick={() => {
                    setHrp('');
                    setProgramHex('');
                  }}
                >
                  清空
                </Button>
              </Space>
            }
            className={styles.card}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <div className={styles.fieldRow}>
                <span className={styles.label}>HRP</span>
                <Input
                  value={hrp}
                  onChange={(event) => setHrp(event.target.value)}
                  placeholder="如 bc（主网）/ tb（测试网）/ bcrt（regtest），或任意自定义前缀"
                  style={{ width: 360 }}
                />
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.label}>Witness 版本</span>
                <Select
                  value={witnessVersion}
                  onChange={setWitnessVersion}
                  options={WITNESS_VERSION_OPTIONS}
                  style={{ width: 420 }}
                />
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.label}>校验和类型</span>
                <Select
                  value={kind}
                  onChange={(value) => setKind(value)}
                  options={ENCODE_KIND_OPTIONS}
                  style={{ width: 520 }}
                />
              </div>
              <div>
                <div className={styles.label}>数据（十六进制 witness program / 字节）</div>
                <Input.TextArea
                  value={programHex}
                  onChange={(event) => setProgramHex(event.target.value)}
                  autoSize={{ minRows: 3, maxRows: 10 }}
                  placeholder="偶数长度 hex，可含空格与 0x 前缀；v0 填 20 或 32 字节，v1 Taproot 填 32 字节"
                />
              </div>
            </Space>
          </Card>

          <Card
            title="编码结果"
            extra={
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(encodeResult.output)}
                disabled={!encodeResult.output}
              >
                复制结果
              </Button>
            }
            className={styles.card}
          >
            {encodeResult.error ? (
              <Alert
                type={encodeResult.output ? 'warning' : 'error'}
                showIcon
                message={encodeResult.output ? '已生成但需注意' : '编码失败'}
                description={encodeResult.error}
              />
            ) : null}
            {encodeResult.output ? (
              <p className={styles.output}>{encodeResult.output}</p>
            ) : null}
          </Card>
        </>
      )}

      {direction === Bech32DirectionEnum.DECODE && (
        <>
          <Card
            title="待解码字符串"
            extra={
              <Space>
                <Button icon={<ReloadOutlined />} onClick={() => setAddressInput(DEFAULT_ADDRESS)}>
                  P2WPKH 示例
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() =>
                    setAddressInput(
                      'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0',
                    )
                  }
                >
                  Taproot 示例
                </Button>
                <Button icon={<ClearOutlined />} onClick={() => setAddressInput('')}>
                  清空
                </Button>
              </Space>
            }
            className={styles.card}
          >
            <Input.TextArea
              value={addressInput}
              onChange={(event) => setAddressInput(event.target.value)}
              autoSize={{ minRows: 2, maxRows: 6 }}
              placeholder="粘贴 bech32 / bech32m 字符串，如比特币隔离见证地址"
            />
          </Card>

          <Card title="解码与校验结果" className={styles.card}>
            {decodeResult.error && !decodeResult.decoded ? (
              <Alert type="error" showIcon message="解码失败" description={decodeResult.error} />
            ) : (
              <>
                {decodeResult.error ? (
                  <Alert
                    type="error"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message="SegWit 解读失败"
                    description={decodeResult.error}
                  />
                ) : null}
                {decodeResult.decoded ? (
                  <Descriptions bordered size="small" column={1}>
                    <Descriptions.Item label="HRP（前缀）">
                      {decodeResult.decoded.hrp}
                    </Descriptions.Item>
                    <Descriptions.Item label="校验和类型">
                      {decodeResult.decoded.checksumType === 'bech32' ? (
                        <Tag color="blue">Bech32（常量 1）</Tag>
                      ) : (
                        <Tag color="purple">Bech32m（常量 0x2bc830a3）</Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="长度">
                      {`${addressInput.trim().length} 字符（BIP-173 上限 90）`}
                    </Descriptions.Item>
                    {decodeResult.segwit ? (
                      <>
                        <Descriptions.Item label="网络">
                          {decodeResult.segwit.network}
                        </Descriptions.Item>
                        <Descriptions.Item label="Witness 版本">
                          {`v${decodeResult.segwit.witnessVersion}`}
                        </Descriptions.Item>
                        <Descriptions.Item label="脚本类型">
                          {decodeResult.segwit.scriptType ? (
                            <Tag color="green">{decodeResult.segwit.scriptType}</Tag>
                          ) : (
                            <Tag>未来版本 / 未命名脚本</Tag>
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Witness program（hex）">
                          <Space>
                            <span className={styles.mono}>{decodeResult.programHex}</span>
                            <Button
                              type="link"
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() => handleCopy(decodeResult.programHex ?? '')}
                            >
                              复制
                            </Button>
                          </Space>
                        </Descriptions.Item>
                      </>
                    ) : (
                      <Descriptions.Item label="数据（5bit，hex 还原）">
                        <span className={styles.mono}>{decodeResult.programHex ?? '—'}</span>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                ) : null}
                {!decodeResult.error && decodeResult.segwit === null ? (
                  <Alert
                    style={{ marginTop: 12 }}
                    type="info"
                    showIcon
                    message="非已知 SegWit 网络（HRP 不是 bc / tb / bcrt），仅给出通用解码结果。"
                  />
                ) : null}
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default Bech32Codec;
