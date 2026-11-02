'use client';

import React from 'react';
import { Alert, Button, Card, Input, Segmented, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { randomartFromPublicKey, type SshKeyInfo } from './utils/randomart';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type DigestAlgo = 'SHA256' | 'MD5';

const SAMPLE_KEY =
  'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIF2d+G0hRw+2gHpUzsYJLiT+BmA1nEU4IPIR+BP6NSmT demo@example.com';

function formatFingerprint(hex: string, algo: DigestAlgo): string {
  if (algo === 'MD5') {
    return hex.match(/.{2}/g)?.join(':') ?? hex;
  }
  // SHA256: 摘要转 base64（去 padding），与 ssh-keygen 展示一致
  const bytes = Uint8Array.from(
    hex.match(/.{2}/g) ?? [],
    (pair) => parseInt(pair, 16),
  );
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/=+$/, '');
}

const OpensshRandomart: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState(defaultInput ?? SAMPLE_KEY);
  const [algo, setAlgo] = React.useState<DigestAlgo>('SHA256');
  const [info, setInfo] = React.useState<SshKeyInfo | null>(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const generate = React.useCallback(
    async (text: string, nextAlgo: DigestAlgo) => {
      if (!text.trim()) {
        setInfo(null);
        setError('请粘贴 OpenSSH 公钥（或纯 base64 公钥主体）');
        return;
      }
      setLoading(true);
      try {
        const result = await randomartFromPublicKey(text, nextAlgo);
        setInfo(result);
        setError('');
      } catch (err) {
        setInfo(null);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // 已提交生成的输入；编辑输入框不会自动重算，由「生成 randomart」按钮触发。
  // 首次挂载（样例）与切换摘要算法时基于最近一次提交的输入自动重算。
  const submittedRef = React.useRef(input);
  React.useEffect(() => {
    void generate(submittedRef.current, algo);
  }, [algo, generate]);

  const handleGenerate = () => {
    submittedRef.current = input;
    void generate(input, algo);
  };

  const handleCopyArt = () => {
    if (!info) {
      return;
    }
    copyToClipboard(info.art);
    message.success('randomart 已复制');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="OpenSSH 公钥">
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Input.TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 3, maxRows: 10 }}
            placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... user@host"
          />
          <div className={styles.controls}>
            <Button type="primary" loading={loading} onClick={handleGenerate}>
              生成 randomart
            </Button>
            <Segmented
              value={algo}
              options={[
                { value: 'SHA256', label: 'SHA-256（现代 ssh-keygen）' },
                { value: 'MD5', label: 'MD5（旧版兼容）' },
              ]}
              onChange={(value) => setAlgo(value as DigestAlgo)}
            />
          </div>
          <p className={styles.hint}>
            支持 authorized_keys 单行格式（末尾注释可保留）、折行的 base64、以及纯 base64
            主体；所有计算均在浏览器本地完成。
          </p>
          {error ? <Alert type="error" showIcon message={error} /> : null}
        </Space>
      </Card>

      {info ? (
        <Card className={styles.card} title="Randomart（与 ssh-keygen -lv 完全一致）">
          <div className={styles.metaRow}>
            <Tag color="blue">{info.labelType}</Tag>
            <Tag>{info.bits} bits</Tag>
            <Tag>{info.digestAlgo === 'SHA256' ? 'SHA-256' : 'MD5'}</Tag>
          </div>
          <pre className={styles.fingerprint}>
            {info.digestAlgo === 'MD5' ? 'MD5:' : 'SHA256:'}
            {formatFingerprint(info.digestHex, info.digestAlgo)}
          </pre>
          <pre className={styles.art}>{info.art}</pre>
          <div className={styles.controls}>
            <Button icon={<CopyOutlined />} onClick={handleCopyArt}>
              复制 randomart
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
};

export default OpensshRandomart;
