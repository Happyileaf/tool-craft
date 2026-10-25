'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Select, Space, Tag, message } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { deriveChallenge, generateVerifier } from './utils/pkce';
import {
  DEFAULT_METHOD,
  DEFAULT_VERIFIER_LENGTH,
  METHOD_OPTIONS,
  VERIFIER_LENGTH_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * OAuth 2.0 PKCE 参数生成器，按 RFC 7636 生成 code_verifier 与
 * code_challenge（S256 / plain），支持自定义长度、重新生成与手动编辑，
 * 全部运算在浏览器本地通过 Web Crypto 完成
 *
 * @returns PKCE 参数生成交互界面
 */
const PkceGenerator: React.FC<ToolComponentProps> = () => {
  const [verifierLength, setVerifierLength] = React.useState<number>(
    DEFAULT_VERIFIER_LENGTH,
  );
  const [verifier, setVerifier] = React.useState<string>('');
  const [method, setMethod] = React.useState<(typeof METHOD_OPTIONS)[number]['value']>(
    DEFAULT_METHOD,
  );
  const [challenge, setChallenge] = React.useState<string>('');
  const [deriveError, setDeriveError] = React.useState<string | null>(null);

  // 首次挂载生成一组合法默认参数，避免首屏空白
  React.useEffect(() => {
    setVerifier(generateVerifier(DEFAULT_VERIFIER_LENGTH));
  }, []);

  /**
   * 按选定长度重新生成 code_verifier
   */
  const handleRegenerate = () => {
    setVerifier(generateVerifier(verifierLength));
  };

  /**
   * verifier 或方法变化时重新推导 code_challenge，
   * verifier 非法时保留校验错误供界面提示
   */
  React.useEffect(() => {
    let isCancelled = false;

    async function updateChallenge() {
      if (!verifier) {
        setChallenge('');
        setDeriveError(null);
        return;
      }
      try {
        const next = await deriveChallenge(verifier, method);
        if (!isCancelled) {
          setChallenge(next);
          setDeriveError(null);
        }
      } catch (caught) {
        if (!isCancelled) {
          setChallenge('');
          setDeriveError(caught instanceof Error ? caught.message : 'code_challenge 推导失败');
        }
      }
    }

    updateChallenge();
    return () => {
      isCancelled = true;
    };
  }, [verifier, method]);

  /**
   * 复制指定文本
   *
   * @param value - 待复制内容
   * @param label - 成功提示中的字段名
   */
  const handleCopy = async (value: string, label: string) => {
    if (!value) {
      message.warning('当前没有可复制的内容');
      return;
    }
    await copyToClipboard(value);
    message.success(`${label}已复制`);
  };

  return (
    <div className={styles.container}>
      <Card
        title="code_verifier（仅在客户端本地保存，授权时原样上送）"
        extra={
          <Space wrap>
            <span className={styles.label}>长度</span>
            <Select
              value={verifierLength}
              onChange={(value) => setVerifierLength(value)}
              options={VERIFIER_LENGTH_OPTIONS.map((value) => ({
                label: `${value} 位`,
                value,
              }))}
              style={{ width: 100 }}
            />
            <Button type="primary" icon={<ReloadOutlined />} onClick={handleRegenerate}>
              重新生成
            </Button>
            <Button
              icon={<CopyOutlined />}
              onClick={() => handleCopy(verifier, 'code_verifier')}
              disabled={Boolean(deriveError) || !verifier}
            >
              复制
            </Button>
          </Space>
        }
        className={styles.card}
      >
        <Input.TextArea
          value={verifier}
          onChange={(event) => setVerifier(event.target.value)}
          autoSize={{ minRows: 2, maxRows: 6 }}
          placeholder="点击「重新生成」或粘贴已有的 code_verifier"
        />
        <div className={styles.meta}>
          {deriveError ? (
            <Tag color="error">不符合 RFC 7636</Tag>
          ) : (
            <Tag color="success">符合 RFC 7636（43-128 位 unreserved 字符）</Tag>
          )}
          当前长度 {verifier.length} 位
        </div>
      </Card>

      <Card
        title="code_challenge（注册到授权请求的派生值）"
        extra={
          <Button
            icon={<CopyOutlined />}
            onClick={() => handleCopy(challenge, 'code_challenge')}
            disabled={Boolean(deriveError) || !challenge}
          >
            复制
          </Button>
        }
        className={styles.card}
      >
        <div className={styles.toolbar}>
          <Radio.Group
            value={method}
            onChange={(event) => setMethod(event.target.value as typeof method)}
            options={METHOD_OPTIONS}
            optionType="button"
            buttonStyle="solid"
          />
        </div>
        {deriveError ? (
          <Alert
            style={{ marginTop: 16 }}
            type="error"
            showIcon
            message="无法推导 code_challenge"
            description={deriveError}
          />
        ) : (
          <>
            <p className={styles.value}>{challenge}</p>
            <div className={styles.meta}>
              方法 {method}
              {method === 'S256'
                ? '：BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))，无填充'
                : '：code_challenge 与 code_verifier 相同，仅建议在服务端不支持 S256 时使用'}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default PkceGenerator;
