'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Progress, Select, Space, message } from 'antd';
import { CopyOutlined, ExperimentOutlined } from '@ant-design/icons';
import {
  base32Decode,
  generateTotp,
  getCounter,
  getRemainingSeconds,
  type TotpAlgorithm,
} from './utils/totp';
import {
  ALGORITHM_OPTIONS,
  DEFAULT_DIGITS,
  DEFAULT_SECRET,
  DEFAULT_STEP_SECONDS,
  DIGITS_OPTIONS,
  RFC6238_TEST_VECTORS,
  STEP_SECONDS_OPTIONS,
} from './constants';
import styles from './index.module.css';
import { copyToClipboard } from '@/lib/utils';

/**
 * 把验证码按前后两半分组展示，例如 6 位显示为「123 456」
 *
 * @param code - 原始验证码数字串
 * @returns 便于阅读的分组文本
 */
function formatCode(code: string): string {
  if (code.length <= 1) {
    return code;
  }
  const half = Math.ceil(code.length / 2);
  return `${code.slice(0, half)} ${code.slice(half)}`;
}

/**
 * TOTP 动态验证码生成工具，根据 Base32 密钥实时生成符合 RFC 6238 的
 * 基于时间的一次性密码，支持算法 / 位数 / 时间步切换与剩余有效期倒计时，
 * 全部运算在浏览器本地通过 Web Crypto 完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认 Base32 密钥
 * @returns TOTP 生成交互界面
 */
const TotpGenerator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [secret, setSecret] = React.useState<string>(defaultInput || DEFAULT_SECRET);
  const [algorithm, setAlgorithm] = React.useState<TotpAlgorithm>('SHA-1');
  const [digits, setDigits] = React.useState<number>(DEFAULT_DIGITS);
  const [stepSeconds, setStepSeconds] = React.useState<number>(DEFAULT_STEP_SECONDS);
  const [now, setNow] = React.useState<number>(() => Date.now());
  const [code, setCode] = React.useState<string>('');
  const [computeError, setComputeError] = React.useState<string | null>(null);

  // 密钥随输入实时解码，解码失败时保留错误信息且不参与计算
  const decoded = React.useMemo<{ secret: Uint8Array | null; error: string | null }>(() => {
    try {
      return { secret: base32Decode(secret), error: null };
    } catch (caught) {
      return {
        secret: null,
        error: caught instanceof Error ? caught.message : 'Base32 密钥非法',
      };
    }
  }, [secret]);

  // 每秒刷新一次当前时间，驱动剩余有效期倒计时与验证码跨步重算
  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // 当前计数器与所在时间步的起点，同一时间步内验证码恒定
  const counter = getCounter(now, stepSeconds);
  const stepStartMs = counter * stepSeconds * 1000;
  const remainingSeconds = getRemainingSeconds(now, stepSeconds);
  const progressPercent = Math.min(
    100,
    Math.max(0, (remainingSeconds / stepSeconds) * 100),
  );

  React.useEffect(() => {
    let isCancelled = false;

    /**
     * 按当前密钥与选项异步生成验证码，密钥非法时清空结果
     */
    async function updateCode() {
      if (!decoded.secret) {
        setCode('');
        return;
      }
      try {
        const nextCode = await generateTotp(decoded.secret, {
          timestampMs: stepStartMs,
          stepSeconds,
          digits,
          algorithm,
        });
        if (!isCancelled) {
          setCode(nextCode);
          setComputeError(null);
        }
      } catch (caught) {
        if (!isCancelled) {
          setCode('');
          setComputeError(caught instanceof Error ? caught.message : '验证码生成失败');
        }
      }
    }

    updateCode();
    return () => {
      isCancelled = true;
    };
  }, [decoded, stepStartMs, stepSeconds, digits, algorithm]);

  const displayError = decoded.error ?? computeError;

  /**
   * 载入与当前算法匹配的 RFC 6238 附录 B 测试向量
   */
  const handleLoadVector = () => {
    const vector =
      RFC6238_TEST_VECTORS.find((item) => item.algorithm === algorithm) ??
      RFC6238_TEST_VECTORS[0];
    if (!vector) {
      return;
    }
    setSecret(vector.base32Secret);
    setAlgorithm(vector.algorithm);
    setDigits(vector.digits);
    setStepSeconds(DEFAULT_STEP_SECONDS);
  };

  /**
   * 复制当前验证码
   */
  const handleCopy = async () => {
    if (displayError || !code) {
      message.warning('当前没有可复制的验证码');
      return;
    }
    await copyToClipboard(code);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap>
          <span>哈希算法：</span>
          <Select
            value={algorithm}
            onChange={(value) => setAlgorithm(value)}
            options={ALGORITHM_OPTIONS}
            style={{ width: 120 }}
          />
          <span>位数：</span>
          <Select
            value={digits}
            onChange={(value) => setDigits(value)}
            options={DIGITS_OPTIONS.map((value) => ({ label: `${value} 位`, value }))}
            style={{ width: 100 }}
          />
          <span>时间步：</span>
          <Select
            value={stepSeconds}
            onChange={(value) => setStepSeconds(value)}
            options={STEP_SECONDS_OPTIONS.map((value) => ({ label: `${value} 秒`, value }))}
            style={{ width: 100 }}
          />
        </Space>
        <Space>
          <Button icon={<ExperimentOutlined />} onClick={handleLoadVector}>
            载入 RFC 6238 测试向量
          </Button>
        </Space>
      </div>

      <div className={styles.input}>
        <Input
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          placeholder="输入 Base32 密钥，例如 JBSWY3DPEHPK3PXP"
          allowClear
        />
      </div>

      <Card
        title="当前验证码"
        className={styles.card}
        extra={
          <Button
            type="primary"
            icon={<CopyOutlined />}
            onClick={handleCopy}
            disabled={Boolean(displayError) || !code}
          >
            复制验证码
          </Button>
        }
      >
        {displayError ? (
          <Alert
            type="error"
            showIcon
            message={decoded.error ? 'Base32 密钥非法' : '验证码生成失败'}
            description={displayError}
          />
        ) : (
          <div className={styles.codeArea}>
            <div className={styles.code}>{formatCode(code)}</div>
            <Progress percent={progressPercent} showInfo={false} status="active" />
            <div className={styles.remaining}>{`剩余有效期 ${remainingSeconds} 秒`}</div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TotpGenerator;
