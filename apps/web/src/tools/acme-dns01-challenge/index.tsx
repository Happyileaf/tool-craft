'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Input,
  Radio,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { CopyOutlined, KeyOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_DOMAIN,
  DEFAULT_KEY_AUTHORIZATION,
  DEFAULT_THUMBPRINT,
  DEFAULT_TOKEN,
  INPUT_MODE_OPTIONS,
  MODE_OPTIONS,
  SUGGESTED_TTL,
} from './constants';
import styles from './index.module.css';
import {
  AcmeError,
  buildKeyAuthorization,
  buildRecordName,
  computeDns01TxtValue,
  generateP256KeyPair,
  normalizeDomain,
  parseKeyAuthorization,
  type GeneratedP256Key,
} from './utils/acme';

const { Text, Paragraph, Title } = Typography;
const { TextArea } = Input;

type Mode = 'generate' | 'verify';
type InputMode = 'manual' | 'keypair';

interface GeneratedResult {
  recordName: string;
  txtValue: string;
  keyAuthorization: string;
  wildcard: boolean;
  idn: boolean;
}

interface AsyncState<T> {
  data: T | null;
  error: string | null;
}

export default function AcmeDns01ChallengeTool(_props: ToolComponentProps) {
  const [mode, setMode] = useState<Mode>('generate');
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [domain, setDomain] = useState(DEFAULT_DOMAIN);
  const [token, setToken] = useState(DEFAULT_TOKEN);
  const [thumbprint, setThumbprint] = useState(DEFAULT_THUMBPRINT);
  const [verifyInput, setVerifyInput] = useState(DEFAULT_KEY_AUTHORIZATION);
  const [generatedKey, setGeneratedKey] = useState<GeneratedP256Key | null>(null);
  const [generating, setGenerating] = useState(false);

  const effectiveThumbprint = inputMode === 'keypair' ? (generatedKey?.thumbprint ?? '') : thumbprint;

  const [challengeState, setChallengeState] = useState<AsyncState<GeneratedResult>>({
    data: null,
    error: null,
  });
  const [verifyState, setVerifyState] = useState<AsyncState<GeneratedResult>>({
    data: null,
    error: null,
  });

  useEffect(() => {
    if (mode !== 'generate') {
      return;
    }
    let cancelled = false;
    if (!domain.trim() || !token.trim() || !effectiveThumbprint.trim()) {
      setChallengeState({ data: null, error: null });
      return;
    }
    (async () => {
      try {
        const normalized = normalizeDomain(domain);
        const keyAuthorization = buildKeyAuthorization(token, effectiveThumbprint);
        const txtValue = await computeDns01TxtValue(keyAuthorization);
        if (!cancelled) {
          setChallengeState({
            data: {
              recordName: buildRecordName(normalized),
              txtValue,
              keyAuthorization,
              wildcard: normalized.wildcard,
              idn: normalized.idn,
            },
            error: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setChallengeState({
            data: null,
            error: error instanceof AcmeError ? error.message : '生成失败',
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, domain, token, effectiveThumbprint]);

  useEffect(() => {
    if (mode !== 'verify') {
      return;
    }
    let cancelled = false;
    if (!verifyInput.trim()) {
      setVerifyState({ data: null, error: null });
      return;
    }
    (async () => {
      try {
        const parsed = parseKeyAuthorization(verifyInput);
        const keyAuthorization = buildKeyAuthorization(parsed.token, parsed.thumbprint);
        const txtValue = await computeDns01TxtValue(keyAuthorization);
        if (!cancelled) {
          setVerifyState({
            data: {
              recordName: '（校验模式不涉及域名，TXT 值如下）',
              txtValue,
              keyAuthorization,
              wildcard: false,
              idn: false,
            },
            error: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setVerifyState({
            data: null,
            error: error instanceof AcmeError ? error.message : '校验失败',
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, verifyInput]);

  const handleCopy = async (text: string, label: string) => {
    try {
      await copyToClipboard(text);
      message.success(`${label}已复制`);
    } catch {
      message.error('复制失败，请手动选择文本复制');
    }
  };

  const handleGenerateKey = async () => {
    setGenerating(true);
    try {
      const key = await generateP256KeyPair();
      setGeneratedKey(key);
      message.success('P-256 密钥对已在本机生成');
    } catch (error) {
      message.error(error instanceof AcmeError ? error.message : '密钥对生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const dnsColumns = useMemo(
    () => [
      { title: '类型', dataIndex: 'type', key: 'type', render: (value: string) => <Tag>{value}</Tag> },
      { title: '主机记录 / 名称', dataIndex: 'name', key: 'name' },
      { title: '记录值', dataIndex: 'value', key: 'value' },
      { title: 'TTL（秒）', dataIndex: 'ttl', key: 'ttl' },
    ],
    [],
  );

  const renderOutputCard = (state: AsyncState<GeneratedResult>, title: string) => {
    if (state.error) {
      return <Alert type="error" showIcon message="输入不合法" description={state.error} />;
    }
    if (!state.data) {
      return null;
    }
    const data = state.data;
    return (
      <Card size="small" title={<Space><SafetyCertificateOutlined />{title}</Space>}>
        <Space direction="vertical" className="w-full" size={12}>
          {mode === 'generate' && (data.wildcard || data.idn) ? (
            <Alert
              type="info"
              showIcon
              message={
                data.wildcard
                  ? '通配符证书：挑战记录已去掉 *. 前缀，写在裸域 example.com 这一级即可同时覆盖通配域名'
                  : 'IDN 域名：当前按原文处理，实际 DNS 中应使用 Punycode（xn--）形式，请先转换后再配置记录'
              }
            />
          ) : null}

          {mode === 'generate' ? (
            <div className={styles.hexBlock}>
              <div className={styles.hexHeader}>
                <span>TXT 记录名</span>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(data.recordName, 'TXT 记录名')}
                >
                  复制
                </Button>
              </div>
              <div className={styles.hexText}>{data.recordName}</div>
            </div>
          ) : null}

          <div className={styles.hexBlock}>
            <div className={styles.hexHeader}>
              <span>TXT 记录值（43 字符 Base64URL，SHA-256 摘要）</span>
              <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(data.txtValue, 'TXT 记录值')}>
                复制
              </Button>
            </div>
            <div className={styles.hexText}>{data.txtValue}</div>
          </div>

          <div className={styles.hexBlock}>
            <div className={styles.hexHeader}>
              <span>完整 key authorization（token.thumbprint）</span>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(data.keyAuthorization, 'key authorization')}
              >
                复制
              </Button>
            </div>
            <div className={styles.hexText}>{data.keyAuthorization}</div>
          </div>

          {mode === 'generate' ? (
            <Table
              size="small"
              pagination={false}
              columns={dnsColumns}
              dataSource={[
                {
                  key: 'txt',
                  type: 'TXT',
                  name: data.recordName,
                  value: data.txtValue,
                  ttl: SUGGESTED_TTL,
                },
              ]}
            />
          ) : (
            <Alert type="success" showIcon message="结构与字符集校验通过，重算 TXT 值如上，可与 DNS 中现有记录对照" />
          )}
        </Space>
      </Card>
    );
  };

  return (
    <div className={styles.container}>
      <Radio.Group
        value={mode}
        onChange={(event) => setMode(event.target.value as Mode)}
        optionType="button"
        buttonStyle="solid"
        options={MODE_OPTIONS}
      />

      {mode === 'generate' ? (
        <>
          <Card size="small" title="挑战输入">
            <Space direction="vertical" className="w-full" size={12}>
              <div>
                <span className={styles.label}>域名（支持裸域、多级子域与 *. 通配符，末尾点自动去除）</span>
                <Input
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  placeholder="例如 example.com 或 *.example.com"
                  className={styles.monoInput}
                  allowClear
                />
              </div>
              <div>
                <span className={styles.label}>challenge token（ACME 服务端下发，Base64URL）</span>
                <Input
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  className={styles.monoInput}
                  allowClear
                />
              </div>

              <Radio.Group
                value={inputMode}
                onChange={(event) => setInputMode(event.target.value as InputMode)}
                optionType="button"
                size="small"
                options={INPUT_MODE_OPTIONS}
              />

              {inputMode === 'manual' ? (
                <div>
                  <span className={styles.label}>账户 JWK thumbprint（Base64URL，无填充）</span>
                  <Input
                    value={thumbprint}
                    onChange={(event) => setThumbprint(event.target.value)}
                    className={styles.monoInput}
                    allowClear
                  />
                </div>
              ) : (
                <Card type="inner" size="small" title={<Space><KeyOutlined />P-256 密钥对（Web Crypto 本机生成）</Space>}>
                  <Space direction="vertical" className="w-full" size={8}>
                    <Button type="primary" size="small" loading={generating} onClick={handleGenerateKey}>
                      {generatedKey ? '重新生成 P-256 密钥对' : '生成 P-256 密钥对并计算 thumbprint'}
                    </Button>
                    {generatedKey ? (
                      <>
                        <Text type="secondary" className={styles.hint}>
                          公钥 JWK（thumbprint 仅由 crv/kty/x/y 四成员计算，私钥成员 d 不会离开本机内存）
                        </Text>
                        <TextArea
                          readOnly
                          autoSize={{ minRows: 3, maxRows: 6 }}
                          value={JSON.stringify(generatedKey.publicJwk, null, 2)}
                          className={styles.inputArea}
                        />
                        <div className={styles.hexBlock}>
                          <div className={styles.hexHeader}>
                            <span>公钥 JWK thumbprint（已自动填入上方计算）</span>
                            <Button
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() => handleCopy(generatedKey.thumbprint, 'thumbprint')}
                            >
                              复制
                            </Button>
                          </div>
                          <div className={styles.hexText}>{generatedKey.thumbprint}</div>
                        </div>
                      </>
                    ) : (
                      <Text type="secondary" className={styles.hint}>
                        点击按钮后调用 crypto.subtle.generateKey（ECDSA / P-256），全程不触网。
                      </Text>
                    )}
                  </Space>
                </Card>
              )}

              <Space wrap>
                <Button
                  size="small"
                  onClick={() => {
                    setDomain(DEFAULT_DOMAIN);
                    setToken(DEFAULT_TOKEN);
                    setThumbprint(DEFAULT_THUMBPRINT);
                  }}
                >
                  填充示例
                </Button>
              </Space>
            </Space>
          </Card>

          {renderOutputCard(challengeState, 'dns-01 挑战记录输出')}
        </>
      ) : (
        <>
          <Card size="small" title="粘贴待校验的 key authorization">
            <Space direction="vertical" className="w-full" size={8}>
              <TextArea
                value={verifyInput}
                onChange={(event) => setVerifyInput(event.target.value)}
                rows={4}
                placeholder="格式：token.thumbprint（仅含一个点分隔符，两段均为 Base64URL）"
                className={styles.inputArea}
              />
              <Button size="small" onClick={() => setVerifyInput(DEFAULT_KEY_AUTHORIZATION)}>
                填充合法示例
              </Button>
            </Space>
          </Card>
          {renderOutputCard(verifyState, '校验结果')}
        </>
      )}

      <Title level={5} className="!mb-0">工作原理</Title>
      <Paragraph type="secondary" className={styles.hint}>
        RFC 8555 规定 key authorization = token + &quot;.&quot; + base64url(JWK 公钥指纹)；
        dns-01 挑战再对其 UTF-8 字节求 SHA-256 并做无填充 Base64URL 编码，得到 43 字符 TXT 记录值，
        写入 <Text code>_acme-challenge.&lt;域名&gt;</Text>。JWK 指纹按 RFC 7638 仅取必需成员、词典序紧凑 JSON 后摘要。
        所有运算均在浏览器本地完成，不发起网络请求，也不读取账户私钥。
      </Paragraph>
    </div>
  );
}
