'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { CopyOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { ALGORITHM_OPTIONS, DIGITS_OPTIONS, SECRET_FORMAT_OPTIONS } from './constants';
import {
  DEFAULT_DIGITS,
  HOTP_ALGORITHMS,
  RFC4226_SECRET_BASE32,
  RFC4226_VECTORS,
  generateHotp,
  parseSecret,
  verifyHotp,
  type HotpAlgorithm,
  type SecretFormat,
} from './utils/hotp';
import styles from './index.module.css';
import { copyToClipboard } from '@/lib/utils';

/**
 * HOTP（RFC 4226）生成与校验器：支持任意计数器、三种密钥格式、
 * 6–8 位与 SHA-1/256/512，并内置官方向量与服务端窗口校验
 *
 * @returns HOTP 交互界面
 */
const HotpGenerator: React.FC<ToolComponentProps> = () => {
  const [secretInput, setSecretInput] = React.useState<string>(RFC4226_SECRET_BASE32);
  const [secretFormat, setSecretFormat] = React.useState<SecretFormat>('base32');
  const [algorithm, setAlgorithm] = React.useState<HotpAlgorithm>(HOTP_ALGORITHMS[0]);
  const [digits, setDigits] = React.useState<number>(DEFAULT_DIGITS);
  const [counter, setCounter] = React.useState<number>(0);
  const [code, setCode] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);
  const [tokenInput, setTokenInput] = React.useState<string>('');
  const [windowSize, setWindowSize] = React.useState<number>(5);
  const [verifyOutput, setVerifyOutput] = React.useState<string | null>(null);

  /**
   * 按当前参数生成指定计数器的 HOTP
   */
  const handleGenerate = React.useCallback(async () => {
    try {
      const keyBytes = parseSecret(secretInput, secretFormat);
      const next = await generateHotp(keyBytes, BigInt(counter), { digits, algorithm });
      setCode(next);
      setError(null);
    } catch (caught) {
      setCode('');
      setError(caught instanceof Error ? caught.message : '生成失败');
    }
  }, [secretInput, secretFormat, counter, digits, algorithm]);

  // 参数变化后自动重新生成，保证展示码与输入始终一致
  React.useEffect(() => {
    void handleGenerate();
  }, [handleGenerate]);

  /** 计数器步进 */
  const stepCounter = (delta: number) => {
    setCounter((value) => Math.max(0, value + delta));
  };

  /** 复制当前验证码 */
  const handleCopy = async () => {
    if (!code) {
      return;
    }
    await copyToClipboard(code);
    message.success('验证码已复制');
  };

  /** 载入 RFC 4226 附录 D 官方向量的演示参数 */
  const loadRfcSample = () => {
    setSecretInput(RFC4226_SECRET_BASE32);
    setSecretFormat('base32');
    setAlgorithm('SHA-1');
    setDigits(6);
    setCounter(0);
    message.success('已载入 RFC 4226 附录 D 官方向量参数');
  };

  /**
   * 服务端视角窗口校验：检查提交码在 current ~ current+window 内是否命中
   */
  const handleVerify = async () => {
    try {
      const keyBytes = parseSecret(secretInput, secretFormat);
      const result = await verifyHotp(
        keyBytes,
        tokenInput,
        BigInt(counter),
        windowSize,
        { digits, algorithm },
      );
      if (result.valid) {
        setVerifyOutput(
          `校验通过：命中计数器 ${result.matchedCounter?.toString()}，相对当前计数器前进 ${result.ahead} 步，服务端应推进到 ${(
            (result.matchedCounter ?? BigInt(0)) + BigInt(1)
          ).toString()}`,
        );
      } else {
        setVerifyOutput(
          `校验失败：在计数器 ${counter} ~ ${counter + windowSize} 的窗口内未找到匹配码（重放或窗口外均会拒绝）`,
        );
      }
      setError(null);
    } catch (caught) {
      setVerifyOutput(null);
      setError(caught instanceof Error ? caught.message : '校验失败');
    }
  };

  return (
    <div className={styles.container}>
      <Card
        title="密钥与参数"
        extra={
          <Button onClick={loadRfcSample}>载入 RFC 4226 官方向量</Button>
        }
      >
        <Space wrap size="middle">
          <label>
            <div className="mb-1 text-xs text-black/45">密钥格式</div>
            <Select
              value={secretFormat}
              onChange={(value: SecretFormat) => setSecretFormat(value)}
              options={SECRET_FORMAT_OPTIONS}
              style={{ width: 180 }}
            />
          </label>
          <label>
            <div className="mb-1 text-xs text-black/45">哈希算法</div>
            <Select
              value={algorithm}
              onChange={(value: HotpAlgorithm) => setAlgorithm(value)}
              options={ALGORITHM_OPTIONS}
              style={{ width: 200 }}
            />
          </label>
          <label>
            <div className="mb-1 text-xs text-black/45">位数</div>
            <Select
              value={digits}
              onChange={(value: number) => setDigits(value)}
              options={DIGITS_OPTIONS}
              style={{ width: 100 }}
            />
          </label>
        </Space>
        <div className="mt-4">
          <div className="mb-1 text-xs text-black/45">共享密钥（本地解析，不上传）</div>
          <Input.TextArea
            value={secretInput}
            onChange={(event) => setSecretInput(event.target.value)}
            rows={2}
            className={styles.mono}
          />
        </div>
      </Card>

      <Card title="生成验证码">
        <Space wrap className="mb-4" align="end">
          <label>
            <div className="mb-1 text-xs text-black/45">计数器 counter</div>
            <Space>
              <Button icon={<MinusOutlined />} onClick={() => stepCounter(-1)} />
              <InputNumber
                min={0}
                value={counter}
                onChange={(value) => setCounter(value ?? 0)}
                style={{ width: 140 }}
              />
              <Button icon={<PlusOutlined />} onClick={() => stepCounter(1)} />
            </Space>
          </label>
          <Button type="primary" onClick={() => void handleGenerate()}>
            生成
          </Button>
        </Space>

        {error ? (
          <Alert type="error" showIcon message={error} />
        ) : (
          <div className={styles.codeDisplay}>
            {code || '------'}
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => void handleCopy()}
              aria-label="复制验证码"
            />
          </div>
        )}
      </Card>

      <Card title="服务端校验（look-ahead 窗口与重放检测）">
        <Space wrap className="mb-3" align="end">
          <label>
            <div className="mb-1 text-xs text-black/45">用户提交码</div>
            <Input
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder="6–8 位数字"
              style={{ width: 180 }}
              className={styles.mono}
            />
          </label>
          <label>
            <div className="mb-1 text-xs text-black/45">窗口大小（向前查找步数）</div>
            <InputNumber
              min={0}
              max={20}
              value={windowSize}
              onChange={(value) => setWindowSize(value ?? 0)}
              style={{ width: 140 }}
            />
          </label>
          <Button type="primary" onClick={() => void handleVerify()}>
            校验
          </Button>
        </Space>
        {verifyOutput && (
          <Alert
            type={verifyOutput.startsWith('校验通过') ? 'success' : 'warning'}
            showIcon
            message={verifyOutput}
          />
        )}
      </Card>

      <Card title="RFC 4226 附录 D 官方向量（SHA-1 / 6 位，密钥即上方演示密钥）">
        <Table
          size="small"
          pagination={false}
          rowKey="counter"
          className={styles.vectorTable}
          dataSource={RFC4226_VECTORS.map((item) => ({ ...item, counter: Number(item.counter) }))}
          columns={[
            { title: 'Counter', dataIndex: 'counter', width: 120 },
            {
              title: '官方期望值',
              dataIndex: 'code',
              render: (value: string) => <span className={styles.mono}>{value}</span>,
            },
            {
              title: '本工具实时输出',
              render: (_: unknown, row: { counter: number; code: string }) => (
                <LiveCode
                  counter={row.counter}
                  secret={RFC4226_SECRET_BASE32}
                  expected={row.code}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

/**
 * 官方向量表中的实时对照单元格：异步生成当前计数器的码并与期望值比对
 */
const LiveCode: React.FC<{ counter: number; secret: string; expected: string }> = ({
  counter,
  secret,
  expected,
}) => {
  const [live, setLive] = React.useState<string>('');

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const value = await generateHotp(parseSecret(secret, 'base32'), BigInt(counter));
      if (!cancelled) {
        setLive(value);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [counter, secret]);

  const matched = live === expected;
  return (
    <Space>
      <span className={styles.mono}>{live || '...'}</span>
      {live && (
        <Tag color={matched ? 'green' : 'red'} className={styles.matchTag}>
          {matched ? '一致' : '不一致'}
        </Tag>
      )}
    </Space>
  );
};

export default HotpGenerator;
