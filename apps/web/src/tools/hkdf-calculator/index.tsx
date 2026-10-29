'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Input,
  InputNumber,
  Radio,
  Space,
  Spin,
  Tag,
  message,
} from 'antd';
import { CopyOutlined, ExperimentOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import {
  DEFAULT_HASH,
  DEFAULT_IKM,
  DEFAULT_INFO,
  DEFAULT_OUTPUT_LENGTH,
  DEFAULT_SALT,
  ENCODING_OPTIONS,
  HASH_OPTIONS,
  RFC_SAMPLE,
} from './constants';
import {
  deriveHkdf,
  HASH_LENGTH_MAP,
  type HkdfHash,
  type HkdfResult,
  type InputEncoding,
} from './utils/hkdf';
import styles from './index.module.css';

/**
 * HKDF（RFC 5869）密钥派生计算器：对 IKM 执行 Extract-then-Expand，
 * 展示中间伪随机密钥 PRK 与输出密钥材料 OKM（Hex + Base64），
 * 支持文本 / Hex / Base64 三种输入载体与 SHA-256/384/512，
 * 全部基于 Web Crypto 在浏览器本地完成，密钥材料不离开设备
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认 IKM 文本
 * @returns HKDF 派生交互界面
 */
const HkdfCalculator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [ikm, setIkm] = React.useState<string>(defaultInput || DEFAULT_IKM);
  const [ikmEncoding, setIkmEncoding] = React.useState<InputEncoding>('text');
  const [salt, setSalt] = React.useState<string>(DEFAULT_SALT);
  const [saltEncoding, setSaltEncoding] = React.useState<InputEncoding>('text');
  const [info, setInfo] = React.useState<string>(DEFAULT_INFO);
  const [infoEncoding, setInfoEncoding] = React.useState<InputEncoding>('text');
  const [hash, setHash] = React.useState<HkdfHash>(DEFAULT_HASH);
  const [outputLength, setOutputLength] = React.useState<number>(
    DEFAULT_OUTPUT_LENGTH,
  );
  const [result, setResult] = React.useState<HkdfResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [computing, setComputing] = React.useState<boolean>(false);

  /**
   * 一键载入 RFC 5869 Test Case 1 官方向量（三段输入均为 Hex）
   */
  const handleLoadSample = () => {
    setIkm(RFC_SAMPLE.ikm);
    setIkmEncoding('hex');
    setSalt(RFC_SAMPLE.salt);
    setSaltEncoding('hex');
    setInfo(RFC_SAMPLE.info);
    setInfoEncoding('hex');
    setHash(RFC_SAMPLE.hash);
    setOutputLength(RFC_SAMPLE.outputLength);
  };

  React.useEffect(() => {
    let cancelled = false;

    /**
     * 任意输入变化时重新执行完整 HKDF 派生
     */
    async function recompute() {
      if (!Number.isInteger(outputLength) || outputLength <= 0) {
        setResult(null);
        setError('输出长度需为正整数（字节）');
        return;
      }
      setComputing(true);
      const derived = await deriveHkdf(
        ikm,
        ikmEncoding,
        salt,
        saltEncoding,
        info,
        infoEncoding,
        hash,
        outputLength,
      );
      if (cancelled) {
        return;
      }
      if ('error' in derived) {
        setResult(null);
        setError(derived.error);
      } else {
        setResult(derived);
        setError(null);
      }
      setComputing(false);
    }

    recompute();
    return () => {
      cancelled = true;
    };
  }, [
    ikm,
    ikmEncoding,
    salt,
    saltEncoding,
    info,
    infoEncoding,
    hash,
    outputLength,
  ]);

  /**
   * 复制派生结果
   *
   * @param value - 待复制内容
   */
  const handleCopy = async (value: string) => {
    await copyToClipboard(value);
    message.success('复制成功');
  };

  const maxLength = 255 * HASH_LENGTH_MAP[hash];

  return (
    <div className={styles.container}>
      <Card
        title="HKDF 密钥派生参数"
        extra={
          <Button
            icon={<ExperimentOutlined />}
            onClick={handleLoadSample}
          >
            RFC 5869 向量示例
          </Button>
        }
      >
        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <span className={styles.label}>IKM（输入密钥材料）</span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              size="small"
              value={ikmEncoding}
              onChange={(event) =>
                setIkmEncoding(event.target.value as InputEncoding)
              }
              options={ENCODING_OPTIONS}
            />
          </div>
          <Input.TextArea
            value={ikm}
            onChange={(event) => setIkm(event.target.value)}
            placeholder="输入 IKM；Hex/Base64 模式下按对应编码解析"
            autoSize={{ minRows: 2, maxRows: 6 }}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <span className={styles.label}>
              salt（可选，留空使用全零 salt）
            </span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              size="small"
              value={saltEncoding}
              onChange={(event) =>
                setSaltEncoding(event.target.value as InputEncoding)
              }
              options={ENCODING_OPTIONS}
            />
          </div>
          <Input
            value={salt}
            onChange={(event) => setSalt(event.target.value)}
            placeholder="可选 salt；留空时按 RFC 5869 使用 HashLen 个全零字节"
          />
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <span className={styles.label}>info（可选，上下文信息）</span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              size="small"
              value={infoEncoding}
              onChange={(event) =>
                setInfoEncoding(event.target.value as InputEncoding)
              }
              options={ENCODING_OPTIONS}
            />
          </div>
          <Input
            value={info}
            onChange={(event) => setInfo(event.target.value)}
            placeholder="可选 info；绑定协议 / 场景的上下文信息"
          />
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>哈希算法：</span>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={hash}
            onChange={(event) => setHash(event.target.value as HkdfHash)}
            options={HASH_OPTIONS}
          />
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>输出长度：</span>
          <InputNumber
            min={1}
            max={maxLength}
            value={outputLength}
            onChange={(value) => setOutputLength(typeof value === 'number' ? value : 0)}
            addonAfter="字节"
          />
          <span className={styles.hint} style={{ marginTop: 0 }}>
            {hash} 最多 {maxLength} 字节（255 × {HASH_LENGTH_MAP[hash]}）
          </span>
        </div>
      </Card>

      <Card title="派生结果（PRK / OKM）">
        {computing ? (
          <Spin size="small" />
        ) : error ? (
          <Alert type="error" showIcon message="派生失败" description={error} />
        ) : result ? (
          <div>
            <div className={styles.resultRow}>
              <Space>
                <Tag color="purple">PRK</Tag>
                <span className={styles.hint} style={{ marginTop: 0 }}>
                  Extract 阶段输出：HMAC-Hash(salt, IKM)
                </span>
              </Space>
              <Space.Compact style={{ width: '100%', marginTop: 4 }}>
                <code className={styles.resultCode}>{result.prk}</code>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(result.prk)}
                >
                  复制
                </Button>
              </Space.Compact>
            </div>

            <div className={styles.resultRow}>
              <Space>
                <Tag color="blue">OKM · Hex</Tag>
                <span className={styles.hint} style={{ marginTop: 0 }}>
                  Expand 阶段输出（{outputLength} 字节）
                </span>
              </Space>
              <Space.Compact style={{ width: '100%', marginTop: 4 }}>
                <code className={styles.resultCode}>{result.okm}</code>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(result.okm)}
                >
                  复制
                </Button>
              </Space.Compact>
            </div>

            <div className={styles.resultRow}>
              <Tag color="geekblue">OKM · Base64</Tag>
              <Space.Compact style={{ width: '100%', marginTop: 4 }}>
                <code className={styles.resultCode}>{result.okmBase64}</code>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(result.okmBase64)}
                >
                  复制
                </Button>
              </Space.Compact>
            </div>

            <div className={styles.hint}>
              所有计算均在浏览器本地通过 Web Crypto 完成，IKM 不会上传。
            </div>
          </div>
        ) : (
          <div className={styles.hint}>输入参数后即时派生。</div>
        )}
      </Card>
    </div>
  );
};

export default HkdfCalculator;
