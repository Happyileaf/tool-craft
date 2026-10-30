'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { computeThumbprint, type HashAlgorithm, type ThumbprintResult } from './utils/thumbprint';
import { DEFAULT_JWK, HASH_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const EMPTY_RESULT: ThumbprintResult = {
  canonicalJson: null,
  thumbprint: null,
  error: null,
};

const JwkThumbprint: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [jwkText, setJwkText] = React.useState(defaultInput || DEFAULT_JWK);
  const [algorithm, setAlgorithm] = React.useState<HashAlgorithm>('SHA-256');
  const [result, setResult] = React.useState<ThumbprintResult>(EMPTY_RESULT);

  React.useEffect(() => {
    let cancelled = false;
    if (jwkText.trim() === '') {
      setResult(EMPTY_RESULT);
      return;
    }
    void computeThumbprint(jwkText, algorithm).then((res) => {
      if (!cancelled) {
        setResult(res);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [jwkText, algorithm]);

  const copy = (text: string | null, label: string) => {
    if (!text) {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(text);
    message.success(`已复制${label}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card className={styles.card} title="JWK 输入">
          <Input.TextArea
            value={jwkText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJwkText(e.target.value)}
            spellCheck={false}
            autoSize={{ minRows: 12, maxRows: 22 }}
            className={styles.mono}
          />
          <div className={styles.algorithmRow}>
            <span className={styles.label}>哈希算法</span>
            <Radio.Group
              optionType="button"
              size="small"
              options={HASH_OPTIONS}
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as HashAlgorithm)}
            />
          </div>
          <Button size="small" onClick={() => setJwkText(DEFAULT_JWK)}>
            填入 RFC 7638 §3.1 样例
          </Button>
          {result.error ? (
            <Alert type="error" showIcon message={result.error} className={styles.alert} />
          ) : null}
        </Card>

        <Card className={styles.card} title="指纹结果">
          {result.thumbprint ? (
            <>
              <div className={styles.resultBlock}>
                <div className={styles.label}>
                  Thumbprint（base64url） <Tag color="blue">{result.thumbprint.length} 字符</Tag>
                </div>
                <div className={styles.thumbprint}>
                  <span className={styles.mono}>{result.thumbprint}</span>
                  <Button
                    size="small"
                    type="link"
                    icon={<CopyOutlined />}
                    onClick={() => copy(result.thumbprint, 'Thumbprint')}
                  >
                    复制
                  </Button>
                </div>
              </div>
              <div className={styles.resultBlock}>
                <div className={styles.label}>规范化 JSON（成员裁剪 + 词典序，紧凑无空白）</div>
                <Input.TextArea
                  value={result.canonicalJson ?? ''}
                  readOnly
                  autoSize={{ minRows: 4, maxRows: 12 }}
                  spellCheck={false}
                  className={styles.mono}
                />
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copy(result.canonicalJson, '规范化 JSON')}
                >
                  复制规范化 JSON
                </Button>
              </div>
            </>
          ) : (
            <Alert
              type="warning"
              showIcon
              message={result.error ?? '请输入合法的 JWK JSON'}
            />
          )}
        </Card>
      </div>

      <Alert
        type="info"
        showIcon
        message="RFC 7638 规定：仅保留各 kty 的必需成员（RSA：e/kty/n；EC：crv/kty/x/y；OKP：crv/kty/x；oct：k/kty），按成员名词典序排列后以无空白紧凑 JSON 做 SHA-256 摘要并 base64url（无 padding）编码；alg、use、kid、x5c 等成员一律剔除，故同一公钥携带不同额外成员时指纹保持一致。全部计算在浏览器本地完成。"
      />
    </div>
  );
};

export default JwkThumbprint;
