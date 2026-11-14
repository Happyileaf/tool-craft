'use client';

import { Alert, Button, Card, Input, Select, Switch, message } from 'antd';
import { useEffect, useState } from 'react';
import {
  ALGORITHM_OPTIONS,
  DEFAULT_DIGEST_INPUT,
  METHOD_OPTIONS,
  QOP_OPTIONS,
  type DigestAlgorithm,
  type DigestQop,
} from './constants';
import { computeDigest, type DigestInput, type DigestResult } from './utils/digest';
import styles from './index.module.css';

const { TextArea } = Input;

export default function HttpDigestAuthTool() {
  const [input, setInput] = useState<DigestInput>(DEFAULT_DIGEST_INPUT);
  const [result, setResult] = useState<DigestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    computeDigest(input)
      .then((value) => {
        if (!cancelled) {
          setResult(value);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setResult(null);
          setError(reason instanceof Error ? reason.message : '计算失败');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [input]);

  const update = (patch: Partial<DigestInput>) => {
    setInput((current) => ({ ...current, ...patch }));
  };

  const copyAuthorization = async () => {
    if (!result) {
      message.warning('当前没有可复制的结果');
      return;
    }
    try {
      await navigator.clipboard.writeText(result.authorization);
      message.success('已复制 Authorization 请求头');
    } catch {
      message.error('复制失败，请手动选择复制');
    }
  };

  return (
    <div className={styles.container}>
      <Card title="认证参数">
        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.label}>用户名</span>
            <Input value={input.username} onChange={(event) => update({ username: event.target.value })} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>密码</span>
            <Input
              value={input.password}
              onChange={(event) => update({ password: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>realm</span>
            <Input value={input.realm} onChange={(event) => update({ realm: event.target.value })} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>nonce</span>
            <Input value={input.nonce} onChange={(event) => update({ nonce: event.target.value })} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>请求 URI</span>
            <Input value={input.uri} onChange={(event) => update({ uri: event.target.value })} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>请求方法</span>
            <Select
              options={METHOD_OPTIONS}
              value={input.method}
              onChange={(value) => update({ method: value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>摘要算法</span>
            <Select
              options={ALGORITHM_OPTIONS}
              value={input.algorithm}
              onChange={(value: DigestAlgorithm) => update({ algorithm: value, nc: '00000001' })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>qop</span>
            <Select
              options={QOP_OPTIONS}
              value={input.qop}
              onChange={(value: DigestQop) => update({ qop: value })}
            />
          </label>
          {input.qop !== 'none' && (
            <>
              <label className={styles.field}>
                <span className={styles.label}>nonce-count（十六进制）</span>
                <Input value={input.nc} onChange={(event) => update({ nc: event.target.value })} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>cnonce</span>
                <Input
                  value={input.cnonce}
                  onChange={(event) => update({ cnonce: event.target.value })}
                />
              </label>
            </>
          )}
          <label className={styles.field}>
            <span className={styles.label}>opaque（可选）</span>
            <Input value={input.opaque} onChange={(event) => update({ opaque: event.target.value })} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>启用 userhash</span>
            <Switch
              checked={input.userhash}
              onChange={(checked) => update({ userhash: checked })}
            />
          </label>
        </div>
        {input.qop === 'auth-int' && (
          <label className={styles.fieldFull}>
            <span className={styles.label}>实体请求体（auth-int 时参与摘要）</span>
            <TextArea
              rows={3}
              value={input.entityBody}
              onChange={(event) => update({ entityBody: event.target.value })}
            />
          </label>
        )}
      </Card>

      {error && <Alert type="error" showIcon message={error} />}

      {result && (
        <Card
          title="计算结果"
          extra={<Button onClick={copyAuthorization}>复制 Authorization</Button>}
        >
          <div className={styles.digestGrid}>
            <div className={styles.digestItem}>
              <span className={styles.label}>HA1</span>
              <code className={styles.code}>{result.ha1}</code>
            </div>
            <div className={styles.digestItem}>
              <span className={styles.label}>HA2</span>
              <code className={styles.code}>{result.ha2}</code>
            </div>
            <div className={styles.digestItem}>
              <span className={styles.label}>response</span>
              <code className={styles.code}>{result.response}</code>
            </div>
            {input.userhash && (
              <div className={styles.digestItem}>
                <span className={styles.label}>userhash 用户名</span>
                <code className={styles.code}>{result.userName}</code>
              </div>
            )}
          </div>
          <div className={styles.authorization}>
            <span className={styles.label}>Authorization 请求头</span>
            <code className={styles.authorizationCode}>{result.authorization}</code>
          </div>
        </Card>
      )}
    </div>
  );
}
