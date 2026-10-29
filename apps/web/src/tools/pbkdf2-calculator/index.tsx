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
  DEFAULT_DKLEN,
  DEFAULT_HASH,
  DEFAULT_ITERATIONS,
  DEFAULT_PASSWORD,
  DEFAULT_SALT,
  HASH_OPTIONS,
  RFC_SAMPLE,
  SALT_ENCODING_OPTIONS,
} from './constants';
import {
  derivePbkdf2,
  type Pbkdf2Hash,
  type Pbkdf2Result,
  type SaltEncoding,
} from './utils/pbkdf2';
import styles from './index.module.css';

/** 高迭代次数计算阈值，超过时提示派生可能需要等待 */
const SLOW_ITERATIONS = 1_000_000;

/**
 * PBKDF2（RFC 8018）口令密钥派生计算器：给定口令、salt、迭代次数、
 * 派生密钥长度与底层哈希（SHA-1/256/384/512），输出 DK 的 Hex 与 Base64，
 * 用于对照标准测试向量、校验后端口令哈希配置；全部经 Web Crypto 本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认口令
 * @returns PBKDF2 派生交互界面
 */
const Pbkdf2Calculator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [password, setPassword] = React.useState<string>(
    defaultInput || DEFAULT_PASSWORD,
  );
  const [salt, setSalt] = React.useState<string>(DEFAULT_SALT);
  const [saltEncoding, setSaltEncoding] = React.useState<SaltEncoding>('text');
  const [iterations, setIterations] = React.useState<number>(DEFAULT_ITERATIONS);
  const [dkLen, setDkLen] = React.useState<number>(DEFAULT_DKLEN);
  const [hash, setHash] = React.useState<Pbkdf2Hash>(DEFAULT_HASH);
  const [result, setResult] = React.useState<Pbkdf2Result | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [computing, setComputing] = React.useState<boolean>(false);

  /**
   * 一键载入 RFC 8018 §B.1 向量 3（c=4096，SHA-1，dkLen=20）
   */
  const handleLoadSample = () => {
    setPassword(RFC_SAMPLE.password);
    setSalt(RFC_SAMPLE.salt);
    setSaltEncoding('text');
    setHash(RFC_SAMPLE.hash);
    setIterations(RFC_SAMPLE.iterations);
    setDkLen(RFC_SAMPLE.dkLen);
  };

  React.useEffect(() => {
    let cancelled = false;

    /**
     * 任意参数变化时重新执行 PBKDF2 派生
     */
    async function recompute() {
      if (!Number.isInteger(iterations) || iterations <= 0) {
        setResult(null);
        setError('迭代次数需为正整数');
        return;
      }
      if (!Number.isInteger(dkLen) || dkLen <= 0) {
        setResult(null);
        setError('派生密钥长度需为正整数（字节）');
        return;
      }
      setComputing(true);
      const derived = await derivePbkdf2(
        password,
        salt,
        saltEncoding,
        iterations,
        hash,
        dkLen,
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
  }, [password, salt, saltEncoding, iterations, dkLen, hash]);

  /**
   * 复制派生结果
   *
   * @param value - 待复制内容
   */
  const handleCopy = async (value: string) => {
    await copyToClipboard(value);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card
        title="PBKDF2 密钥派生参数"
        extra={
          <Button icon={<ExperimentOutlined />} onClick={handleLoadSample}>
            RFC 8018 向量示例
          </Button>
        }
      >
        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <span className={styles.label}>口令 P（按 UTF-8 编码）</span>
          </div>
          <Input.Password
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="输入口令 / 密码"
          />
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <span className={styles.label}>salt</span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              size="small"
              value={saltEncoding}
              onChange={(event) =>
                setSaltEncoding(event.target.value as SaltEncoding)
              }
              options={SALT_ENCODING_OPTIONS}
            />
          </div>
          <Input
            value={salt}
            onChange={(event) => setSalt(event.target.value)}
            placeholder={
              saltEncoding === 'hex'
                ? '十六进制 salt，如 73616c74（允许 0x 前缀与空白）'
                : '文本 salt，按 UTF-8 编码'
            }
          />
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>哈希算法：</span>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={hash}
            onChange={(event) => setHash(event.target.value as Pbkdf2Hash)}
            options={HASH_OPTIONS}
          />
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>迭代次数 c：</span>
          <InputNumber
            min={1}
            value={iterations}
            onChange={(value) =>
              setIterations(typeof value === 'number' ? value : 0)
            }
            addonAfter="次"
          />
          <span className={styles.label} style={{ marginLeft: 8 }}>
            输出长度：
          </span>
          <InputNumber
            min={1}
            max={65536}
            value={dkLen}
            onChange={(value) => setDkLen(typeof value === 'number' ? value : 0)}
            addonAfter="字节"
          />
        </div>
        {iterations >= SLOW_ITERATIONS ? (
          <div className={styles.hint}>
            迭代次数较高（≥ {SLOW_ITERATIONS.toLocaleString()}），SHA-1
            等算法下浏览器可能需要数秒，属正常现象。
          </div>
        ) : null}
      </Card>

      <Card title="派生密钥 DK">
        {computing ? (
          <Spin size="small" />
        ) : error ? (
          <Alert type="error" showIcon message="派生失败" description={error} />
        ) : result ? (
          <div>
            <div className={styles.resultRow}>
              <Tag color="blue">DK · Hex</Tag>
              <Space.Compact style={{ width: '100%', marginTop: 4 }}>
                <code className={styles.resultCode}>{result.dkHex}</code>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(result.dkHex)}
                >
                  复制
                </Button>
              </Space.Compact>
            </div>

            <div className={styles.resultRow}>
              <Tag color="geekblue">DK · Base64</Tag>
              <Space.Compact style={{ width: '100%', marginTop: 4 }}>
                <code className={styles.resultCode}>{result.dkBase64}</code>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(result.dkBase64)}
                >
                  复制
                </Button>
              </Space.Compact>
            </div>

            <div className={styles.hint}>
              所有计算均在浏览器本地通过 Web Crypto 完成，口令不会上传。
              PBKDF2 用于口令校验场景时，salt 应随机且每用户唯一。
            </div>
          </div>
        ) : (
          <div className={styles.hint}>输入参数后即时派生。</div>
        )}
      </Card>
    </div>
  );
};

export default Pbkdf2Calculator;
