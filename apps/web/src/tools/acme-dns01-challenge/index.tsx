'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Tabs, Tag, message } from 'antd';
import { EXAMPLE_INPUTS, EXAMPLE_KEY_AUTHORIZATION } from './constants';
import {
  generateDns01Challenge,
  verifyKeyAuthorization,
  type Dns01GenerationResult,
  type Dns01VerificationResult,
} from './utils/acme';
import styles from './index.module.css';

const { TextArea } = Input;

/** 异步计算状态包装 */
type AsyncState<T> = { data?: T; error?: string; loading: boolean };

/** 可复制的结果块 */
function ResultBlock({ name, value, onCopy }: { name: string; value: string; onCopy: () => void }) {
  return (
    <div className={styles.resultBlock}>
      <div className={styles.resultName}>{name}</div>
      <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
        <span className={styles.resultValue}>{value}</span>
        <Button size="small" onClick={onCopy}>
          复制
        </Button>
      </Space>
    </div>
  );
}

/**
 * ACME dns-01 挑战生成器：本地完成 RFC 8555 key authorization 拼装、
 * SHA-256 TXT 记录值计算与记录名生成，并支持已有 key authorization 的反向校验。
 *
 * @returns 生成 / 校验双模式界面
 */
const AcmeDns01Challenge: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<'generate' | 'verify'>('generate');

  // 生成模式输入
  const [domain, setDomain] = React.useState(EXAMPLE_INPUTS.domain);
  const [token, setToken] = React.useState(EXAMPLE_INPUTS.token);
  const [thumbprint, setThumbprint] = React.useState(EXAMPLE_INPUTS.thumbprint);

  // 校验模式输入
  const [keyAuthInput, setKeyAuthInput] = React.useState('');

  const [generation, setGeneration] = React.useState<AsyncState<Dns01GenerationResult>>({
    loading: false,
  });
  const [verification, setVerification] = React.useState<AsyncState<Dns01VerificationResult>>({
    loading: false,
  });

  // 生成模式：输入变化后异步重算
  React.useEffect(() => {
    let cancelled = false;
    if (mode !== 'generate') return;
    if (domain.trim() === '' || token.trim() === '' || thumbprint.trim() === '') {
      setGeneration({ loading: false, error: '请填写域名、Challenge token 与账户 JWK 指纹' });
      return;
    }
    setGeneration((previous) => ({ ...previous, loading: true }));
    generateDns01Challenge(domain, token, thumbprint)
      .then((data) => {
        if (!cancelled) setGeneration({ data, loading: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setGeneration({ loading: false, error: error instanceof Error ? error.message : String(error) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode, domain, token, thumbprint]);

  // 校验模式：输入变化后异步重算
  React.useEffect(() => {
    let cancelled = false;
    if (mode !== 'verify') return;
    if (keyAuthInput.trim() === '') {
      setVerification({ loading: false });
      return;
    }
    setVerification((previous) => ({ ...previous, loading: true }));
    verifyKeyAuthorization(keyAuthInput)
      .then((data) => {
        if (!cancelled) setVerification({ data, loading: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setVerification({ loading: false, error: error instanceof Error ? error.message : String(error) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode, keyAuthInput]);

  const copyText = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => message.success(`${label}已复制`))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  const generateTab = (
    <div>
      <p className={styles.hint}>
        按 RFC 8555 §8.1/§8.4 在本地计算：keyAuthorization = token + &quot;.&quot; + 账户 JWK
        指纹；TXT 记录值 = Base64URL(SHA-256(keyAuthorization))。不接触账户私钥，不发起任何网络请求。
      </p>
      <div className={styles.fieldStack}>
        <div>
          <div className={styles.fieldLabel}>域名（裸域 / 子域 / 通配符 / 带末尾点均可）</div>
          <Input value={domain} onChange={(event) => setDomain(event.target.value)} allowClear />
        </div>
        <div>
          <div className={styles.fieldLabel}>Challenge token</div>
          <Input value={token} onChange={(event) => setToken(event.target.value)} allowClear />
        </div>
        <div>
          <div className={styles.fieldLabel}>账户 JWK 指纹（Thumbprint，Base64URL）</div>
          <Input value={thumbprint} onChange={(event) => setThumbprint(event.target.value)} allowClear />
        </div>
      </div>

      <Space wrap style={{ marginTop: 12 }}>
        <Button
          size="small"
          onClick={() => {
            setDomain(EXAMPLE_INPUTS.domain);
            setToken(EXAMPLE_INPUTS.token);
            setThumbprint(EXAMPLE_INPUTS.thumbprint);
          }}
        >
          填入示例
        </Button>
      </Space>

      {generation.error ? (
        <Alert style={{ marginTop: 16 }} type="error" showIcon message="输入不合法" description={generation.error} />
      ) : null}

      {generation.data ? (
        <div className={styles.resultStack}>
          {generation.data.wildcard ? (
            <Alert
              type="info"
              showIcon
              message="通配符证书"
              description="已剥离 *. 前缀：通配符标识符的 dns-01 挑战记录同样落在基础域名上（RFC 8555 §8.4）。"
            />
          ) : null}
          <ResultBlock
            name="TXT 记录名"
            value={generation.data.recordName}
            onCopy={() => copyText(generation.data!.recordName, '记录名')}
          />
          <ResultBlock
            name="TXT 记录值（43 字符 Base64URL）"
            value={generation.data.txtValue}
            onCopy={() => copyText(generation.data!.txtValue, '记录值')}
          />
          <ResultBlock
            name="Key Authorization"
            value={generation.data.keyAuthorization}
            onCopy={() => copyText(generation.data!.keyAuthorization, 'Key authorization')}
          />
        </div>
      ) : null}
    </div>
  );

  const verifyTab = (
    <div>
      <p className={styles.hint}>
        粘贴已有的 key authorization，校验其两段式结构与 Base64URL 字符集，并重算应有的 dns-01 TXT 记录值供对照。
      </p>
      <div className={styles.fieldLabel}>Key Authorization（token.thumbprint）</div>
      <TextArea
        rows={4}
        placeholder="粘贴 token.thumbprint 形式的字符串…"
        value={keyAuthInput}
        onChange={(event) => setKeyAuthInput(event.target.value)}
      />
      <Space style={{ marginTop: 12 }}>
        <Button size="small" onClick={() => setKeyAuthInput(EXAMPLE_KEY_AUTHORIZATION)}>
          填入示例
        </Button>
        <Button size="small" onClick={() => setKeyAuthInput('')}>
          清空
        </Button>
      </Space>

      {verification.error ? (
        <Alert style={{ marginTop: 16 }} type="error" showIcon message="校验失败" description={verification.error} />
      ) : null}

      {verification.data ? (
        <div className={styles.resultStack}>
          <Alert type="success" showIcon message="结构与字符集校验通过" />
          <Space wrap>
            <Tag color="blue">token：{verification.data.token}</Tag>
            <Tag color="purple">thumbprint：{verification.data.accountThumbprint}</Tag>
          </Space>
          <ResultBlock
            name="重算的 dns-01 TXT 记录值"
            value={verification.data.recomputedTxtValue}
            onCopy={() => copyText(verification.data!.recomputedTxtValue, 'TXT 记录值')}
          />
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={styles.container}>
      <Card
        title="ACME dns-01 挑战 TXT 记录生成器（RFC 8555）"
        extra={
          <Radio.Group
            size="small"
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            options={[
              { label: '生成挑战', value: 'generate' },
              { label: '校验已有值', value: 'verify' },
            ]}
            optionType="button"
            buttonStyle="solid"
          />
        }
      >
        <Tabs
          activeKey={mode}
          onTabClick={(key) => setMode(key as 'generate' | 'verify')}
          items={[
            { key: 'generate', label: '生成挑战', children: generateTab },
            { key: 'verify', label: '校验已有值', children: verifyTab },
          ]}
        />
      </Card>
    </div>
  );
};

export default AcmeDns01Challenge;
