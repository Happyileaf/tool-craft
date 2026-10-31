'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Select, Space, Tabs, Tag, message } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  ALGORITHM_OPTIONS,
  DEFAULT_ALGORITHM,
  DEFAULT_MODULUS_LENGTH,
  MODULUS_LENGTH_OPTIONS,
  SAMPLE_TEXT,
  type RsaAlgorithm,
} from './constants';
import {
  decryptTextOaep,
  detectPemType,
  encryptTextOaep,
  exportPrivateKeyPem,
  exportPublicKeyPem,
  generateRsaKeyPair,
  importPrivateKeyPem,
  importPublicKeyPem,
  oaepMaxMessageBytes,
  signTextPss,
  verifyTextPss,
} from './utils/rsa';
import styles from './index.module.css';

/** 工作台中持有的密钥集合（仅存在于内存 state） */
interface WorkspaceKeys {
  /** 公钥（加密 / 验签） */
  publicKey?: CryptoKey;
  /** 私钥（解密 / 签名） */
  privateKey?: CryptoKey;
  /** 密钥算法 */
  algorithm: RsaAlgorithm;
  /** 模长（位），取自 CryptoKey 或生成参数 */
  modulusLength: number;
}

/**
 * 读取 RSA CryptoKey 上记录的模长
 *
 * @param key - RSA 公钥或私钥
 * @returns 模长（位）
 */
function readModulusLength(key: CryptoKey): number {
  return (key.algorithm as RsaHashedKeyAlgorithm).modulusLength;
}

/**
 * 计算字符串 UTF-8 编码后的字节数
 *
 * @param text - 输入文本
 * @returns 字节数
 */
function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/**
 * RSA 非对称密钥对生成器与加解密：
 * 基于浏览器原生 Web Crypto 生成 RSA-OAEP / RSA-PSS 密钥对（SHA-256，
 * publicExponent 65537），支持 SPKI / PKCS8 PEM 导出导入、OAEP 加解密
 * 与 PSS 签名验签。全部运算在本地完成，密钥仅保存在内存中。
 *
 * @returns RSA 密钥工具交互界面
 */
const RsaKeypairTool: React.FC<ToolComponentProps> = () => {
  const [algorithm, setAlgorithm] = React.useState<RsaAlgorithm>(DEFAULT_ALGORITHM);
  const [modulusLength, setModulusLength] = React.useState<number>(DEFAULT_MODULUS_LENGTH);
  const [generating, setGenerating] = React.useState<boolean>(false);
  const [generateError, setGenerateError] = React.useState<string | null>(null);

  const [publicPem, setPublicPem] = React.useState<string>('');
  const [privatePem, setPrivatePem] = React.useState<string>('');
  const [keys, setKeys] = React.useState<WorkspaceKeys | null>(null);

  const [importPemText, setImportPemText] = React.useState<string>('');
  const [importing, setImporting] = React.useState<boolean>(false);
  const [importError, setImportError] = React.useState<string | null>(null);

  const [plaintext, setPlaintext] = React.useState<string>(SAMPLE_TEXT);
  const [encrypting, setEncrypting] = React.useState<boolean>(false);
  const [ciphertext, setCiphertext] = React.useState<string>('');
  const [encryptError, setEncryptError] = React.useState<string | null>(null);

  const [cipherInput, setCipherInput] = React.useState<string>('');
  const [decrypting, setDecrypting] = React.useState<boolean>(false);
  const [decrypted, setDecrypted] = React.useState<string>('');
  const [decryptError, setDecryptError] = React.useState<string | null>(null);

  const [signMessage, setSignMessage] = React.useState<string>(SAMPLE_TEXT);
  const [signing, setSigning] = React.useState<boolean>(false);
  const [signature, setSignature] = React.useState<string>('');
  const [signError, setSignError] = React.useState<string | null>(null);

  const [verifyMessage, setVerifyMessage] = React.useState<string>('');
  const [verifySignature, setVerifySignature] = React.useState<string>('');
  const [verifying, setVerifying] = React.useState<boolean>(false);
  const [verifyResult, setVerifyResult] = React.useState<boolean | null>(null);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);

  /** 清空工作台的全部输入与结果（密钥 PEM 与 state 除外） */
  const resetWorkspaceOutputs = () => {
    setCiphertext('');
    setEncryptError(null);
    setDecrypted('');
    setDecryptError(null);
    setSignature('');
    setSignError(null);
    setVerifyResult(null);
    setVerifyError(null);
  };

  /**
   * 生成新的密钥对并导出 PEM
   */
  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const pair = await generateRsaKeyPair(algorithm, modulusLength);
      const [nextPublicPem, nextPrivatePem] = await Promise.all([
        exportPublicKeyPem(pair.publicKey),
        exportPrivateKeyPem(pair.privateKey),
      ]);
      setPublicPem(nextPublicPem);
      setPrivatePem(nextPrivatePem);
      setKeys({
        publicKey: pair.publicKey,
        privateKey: pair.privateKey,
        algorithm: pair.algorithm,
        modulusLength: pair.modulusLength,
      });
      resetWorkspaceOutputs();
      message.success(`${algorithm} ${modulusLength} 位密钥对已生成`);
    } catch (caught) {
      setGenerateError(caught instanceof Error ? caught.message : '密钥对生成失败');
    } finally {
      setGenerating(false);
    }
  };

  /**
   * 把粘贴的 PEM 文本导回 CryptoKey，公钥 / 私钥自动识别
   */
  const handleImport = async () => {
    const pemType = detectPemType(importPemText);
    if (!pemType) {
      setImportError('无法识别 PEM：需要包含 -----BEGIN PUBLIC KEY----- 或 -----BEGIN PRIVATE KEY----- 头');
      return;
    }
    setImporting(true);
    setImportError(null);
    try {
      const imported =
        pemType === 'public'
          ? await importPublicKeyPem(importPemText, algorithm)
          : await importPrivateKeyPem(importPemText, algorithm);
      const importedModulus = readModulusLength(imported);

      if (keys && keys.algorithm !== algorithm) {
        throw new Error(
          `导入的${pemType === 'public' ? '公钥' : '私钥'}按 ${algorithm} 解析，与工作台现有 ${keys.algorithm} 密钥不一致，请先切换算法或生成新密钥对`,
        );
      }
      const otherKey = pemType === 'public' ? keys?.privateKey : keys?.publicKey;
      if (otherKey && readModulusLength(otherKey) !== importedModulus) {
        throw new Error(
          `导入密钥模长为 ${importedModulus} 位，与工作台现有 ${readModulusLength(otherKey)} 位密钥不一致`,
        );
      }

      setKeys({
        publicKey: pemType === 'public' ? imported : keys?.publicKey,
        privateKey: pemType === 'private' ? imported : keys?.privateKey,
        algorithm,
        modulusLength: importedModulus,
      });
      resetWorkspaceOutputs();
      message.success(`${pemType === 'public' ? '公钥' : '私钥'}已导入工作台`);
      setImportPemText('');
    } catch (caught) {
      setImportError(caught instanceof Error ? caught.message : 'PEM 导入失败');
    } finally {
      setImporting(false);
    }
  };

  /**
   * 复制文本并给出 antd message 反馈
   *
   * @param value - 待复制内容
   * @param label - 成功提示中的字段名
   */
  const handleCopy = async (value: string, label: string) => {
    if (!value) {
      message.warning('当前没有可复制的内容');
      return;
    }
    try {
      await copyToClipboard(value);
      message.success(`${label}已复制`);
    } catch {
      message.error('复制失败，请手动选择文本复制');
    }
  };

  /** RSA-OAEP 公钥加密 */
  const handleEncrypt = async () => {
    if (!keys?.publicKey) {
      setEncryptError('工作台中没有公钥，请先生成或导入密钥对');
      return;
    }
    setEncrypting(true);
    setEncryptError(null);
    try {
      const result = await encryptTextOaep(keys.publicKey, plaintext, keys.modulusLength);
      setCiphertext(result);
      setCipherInput(result);
    } catch (caught) {
      setCiphertext('');
      setEncryptError(caught instanceof Error ? caught.message : '加密失败');
    } finally {
      setEncrypting(false);
    }
  };

  /** RSA-OAEP 私钥解密 */
  const handleDecrypt = async () => {
    if (!keys?.privateKey) {
      setDecryptError('工作台中没有私钥，请先生成或导入密钥对');
      return;
    }
    setDecrypting(true);
    setDecryptError(null);
    try {
      const result = await decryptTextOaep(keys.privateKey, cipherInput);
      setDecrypted(result);
    } catch (caught) {
      setDecrypted('');
      setDecryptError(caught instanceof Error ? caught.message : '解密失败');
    } finally {
      setDecrypting(false);
    }
  };

  /** RSA-PSS 私钥签名 */
  const handleSign = async () => {
    if (!keys?.privateKey) {
      setSignError('工作台中没有私钥，请先生成或导入密钥对');
      return;
    }
    setSigning(true);
    setSignError(null);
    try {
      const result = await signTextPss(keys.privateKey, signMessage);
      setSignature(result);
      setVerifyMessage(signMessage);
      setVerifySignature(result);
      setVerifyResult(null);
    } catch (caught) {
      setSignature('');
      setSignError(caught instanceof Error ? caught.message : '签名失败');
    } finally {
      setSigning(false);
    }
  };

  /** RSA-PSS 公钥验签 */
  const handleVerify = async () => {
    if (!keys?.publicKey) {
      setVerifyError('工作台中没有公钥，请先生成或导入密钥对');
      return;
    }
    if (!verifySignature.trim()) {
      setVerifyError('请填写待校验的 Base64 签名');
      return;
    }
    setVerifying(true);
    setVerifyError(null);
    setVerifyResult(null);
    try {
      setVerifyResult(await verifyTextPss(keys.publicKey, verifyMessage, verifySignature));
    } catch (caught) {
      setVerifyError(caught instanceof Error ? caught.message : '验签失败');
    } finally {
      setVerifying(false);
    }
  };

  /** 当前明文 UTF-8 字节数与 OAEP 上限，用于实时友好提示 */
  const plaintextBytes = utf8ByteLength(plaintext);
  const oaepLimit = keys ? oaepMaxMessageBytes(keys.modulusLength) : null;
  const plaintextOverflow = oaepLimit !== null && plaintextBytes > oaepLimit;

  /** 工作台缺少公钥 / 私钥时给出提示 */
  const missingKeyAlert = !keys ? (
    <Alert
      type="info"
      showIcon
      style={{ marginBottom: 16 }}
      message="工作台中尚无密钥"
      description="请先在上方生成密钥对，或把已有 PEM 粘贴到导入区导回后再进行加解密 / 签名验签操作。"
    />
  ) : !keys.publicKey || !keys.privateKey ? (
    <Alert
      type="warning"
      showIcon
      style={{ marginBottom: 16 }}
      message="密钥不完整"
      description={`当前仅导入${!keys.privateKey ? '公钥（可加密 / 验签）' : '私钥（可解密 / 签名）'}，请继续导入另一半密钥，或直接生成新密钥对。`}
    />
  ) : null;

  /** OAEP 加解密工作台标签页 */
  const oaepTab = (
    <div>
      {missingKeyAlert}
      <Card size="small" title="公钥加密" className={styles.workCard}>
        <Input.TextArea
          className={styles.monoArea}
          value={plaintext}
          onChange={(event) => setPlaintext(event.target.value)}
          autoSize={{ minRows: 3, maxRows: 10 }}
          placeholder="输入待加密明文（UTF-8）"
        />
        <div className={styles.meta}>
          {oaepLimit !== null ? (
            <Tag color={plaintextOverflow ? 'error' : 'default'}>
              {plaintextBytes} / {oaepLimit} 字节
            </Tag>
          ) : null}
          {plaintextOverflow ? (
            <span className={styles.errorText}>
              明文超出 {keys?.modulusLength} 位密钥的单次上限 {oaepLimit} 字节，请缩短文本
            </span>
          ) : (
            <span>明文按 UTF-8 编码，密文以 Base64 输出</span>
          )}
        </div>
        <Space style={{ marginTop: 8 }}>
          <Button
            type="primary"
            loading={encrypting}
            disabled={!keys?.publicKey || plaintextOverflow || !plaintext}
            onClick={handleEncrypt}
          >
            公钥加密
          </Button>
          <Button onClick={() => setPlaintext(SAMPLE_TEXT)}>填入示例</Button>
        </Space>
        {encryptError ? (
          <Alert style={{ marginTop: 12 }} type="error" showIcon message="加密失败" description={encryptError} />
        ) : null}
        {ciphertext ? (
          <div className={styles.resultBlock}>
            <div className={styles.resultHeader}>
              <span className={styles.label}>Base64 密文</span>
              <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(ciphertext, '密文')}>
                复制密文
              </Button>
            </div>
            <Input.TextArea className={styles.monoArea} value={ciphertext} readOnly autoSize={{ minRows: 3, maxRows: 10 }} />
          </div>
        ) : null}
      </Card>

      <Card size="small" title="私钥解密" className={styles.workCard}>
        <Input.TextArea
          className={styles.monoArea}
          value={cipherInput}
          onChange={(event) => setCipherInput(event.target.value)}
          autoSize={{ minRows: 3, maxRows: 10 }}
          placeholder="粘贴 Base64 密文（加密成功后已自动填入）"
        />
        <Space style={{ marginTop: 8 }}>
          <Button type="primary" loading={decrypting} disabled={!keys?.privateKey || !cipherInput} onClick={handleDecrypt}>
            私钥解密
          </Button>
        </Space>
        {decryptError ? (
          <Alert style={{ marginTop: 12 }} type="error" showIcon message="解密失败" description={decryptError} />
        ) : null}
        {decrypted ? (
          <div className={styles.resultBlock}>
            <div className={styles.resultHeader}>
              <span className={styles.label}>解密明文（UTF-8）</span>
              <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(decrypted, '明文')}>
                复制明文
              </Button>
            </div>
            <Input.TextArea className={styles.monoArea} value={decrypted} readOnly autoSize={{ minRows: 2, maxRows: 10 }} />
          </div>
        ) : null}
      </Card>
    </div>
  );

  /** PSS 签名验签工作台标签页 */
  const pssTab = (
    <div>
      {missingKeyAlert}
      <Card size="small" title="私钥签名（SHA-256，saltLength = 32）" className={styles.workCard}>
        <Input.TextArea
          className={styles.monoArea}
          value={signMessage}
          onChange={(event) => setSignMessage(event.target.value)}
          autoSize={{ minRows: 3, maxRows: 10 }}
          placeholder="输入待签名消息（UTF-8）"
        />
        <Space style={{ marginTop: 8 }}>
          <Button type="primary" loading={signing} disabled={!keys?.privateKey || !signMessage} onClick={handleSign}>
            私钥签名
          </Button>
        </Space>
        {signError ? (
          <Alert style={{ marginTop: 12 }} type="error" showIcon message="签名失败" description={signError} />
        ) : null}
        {signature ? (
          <div className={styles.resultBlock}>
            <div className={styles.resultHeader}>
              <span className={styles.label}>Base64 签名</span>
              <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(signature, '签名')}>
                复制签名
              </Button>
            </div>
            <Input.TextArea className={styles.monoArea} value={signature} readOnly autoSize={{ minRows: 3, maxRows: 10 }} />
          </div>
        ) : null}
      </Card>

      <Card size="small" title="公钥验签" className={styles.workCard}>
        <div className={styles.fieldLabel}>原始消息</div>
        <Input.TextArea
          className={styles.monoArea}
          value={verifyMessage}
          onChange={(event) => setVerifyMessage(event.target.value)}
          autoSize={{ minRows: 2, maxRows: 8 }}
          placeholder="待校验的消息原文（签名成功后已自动填入）"
        />
        <div className={styles.fieldLabel} style={{ marginTop: 12 }}>
          Base64 签名
        </div>
        <Input.TextArea
          className={styles.monoArea}
          value={verifySignature}
          onChange={(event) => setVerifySignature(event.target.value)}
          autoSize={{ minRows: 2, maxRows: 8 }}
          placeholder="粘贴待校验的 Base64 签名"
        />
        <Space style={{ marginTop: 8 }}>
          <Button type="primary" loading={verifying} disabled={!keys?.publicKey} onClick={handleVerify}>
            公钥验签
          </Button>
        </Space>
        {verifyError ? (
          <Alert style={{ marginTop: 12 }} type="error" showIcon message="验签失败" description={verifyError} />
        ) : null}
        {verifyResult === true ? (
          <Alert style={{ marginTop: 12 }} type="success" showIcon message="验签通过：签名与消息匹配，且来自对应私钥" />
        ) : null}
        {verifyResult === false ? (
          <Alert style={{ marginTop: 12 }} type="error" showIcon message="验签失败：签名与消息不匹配，或并非对应私钥所签" />
        ) : null}
      </Card>
    </div>
  );

  return (
    <div className={styles.container}>
      <Card title="RSA 非对称密钥对生成器与加解密">
        <p className={styles.hint}>
          基于浏览器原生 Web Crypto（SubtleCrypto）在本地生成 RSA 密钥对并完成加解密 / 签名验签，
          全程不发起网络请求，密钥仅保存在当前页面内存中，刷新即消失。哈希固定 SHA-256，公钥指数 65537。
        </p>

        <Space wrap size="middle">
          <span className={styles.field}>
            <span className={styles.label}>算法</span>
            <Select
              value={algorithm}
              style={{ width: 300 }}
              options={ALGORITHM_OPTIONS}
              onChange={(value: RsaAlgorithm) => setAlgorithm(value)}
            />
          </span>
          <span className={styles.field}>
            <span className={styles.label}>模长</span>
            <Select
              value={modulusLength}
              style={{ width: 130 }}
              options={MODULUS_LENGTH_OPTIONS.map((value) => ({
                label: `${value} 位${value === 4096 ? '（生成较慢）' : ''}`,
                value,
              }))}
              onChange={(value: number) => setModulusLength(value)}
            />
          </span>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={generating}
            onClick={handleGenerate}
          >
            {generating ? '正在生成…' : '生成密钥对'}
          </Button>
          {keys ? (
            <Tag color="blue">
              工作台密钥：{keys.algorithm} / {keys.modulusLength} 位
            </Tag>
          ) : null}
        </Space>

        {generateError ? (
          <Alert style={{ marginTop: 16 }} type="error" showIcon message="密钥对生成失败" description={generateError} />
        ) : null}

        <div className={styles.keyGrid} style={{ marginTop: 16 }}>
          <Card
            size="small"
            title="公钥（SPKI，可公开分享）"
            extra={
              <Button size="small" icon={<CopyOutlined />} disabled={!publicPem} onClick={() => handleCopy(publicPem, '公钥 PEM')}>
                复制
              </Button>
            }
          >
            <Input.TextArea className={styles.monoArea} value={publicPem} readOnly autoSize={{ minRows: 6, maxRows: 14 }} placeholder="点击「生成密钥对」后在此输出公钥 PEM" />
          </Card>
          <Card
            size="small"
            title="私钥（PKCS8，请妥善保管，切勿外泄）"
            extra={
              <Button size="small" icon={<CopyOutlined />} disabled={!privatePem} onClick={() => handleCopy(privatePem, '私钥 PEM')}>
                复制
              </Button>
            }
          >
            <Input.TextArea className={styles.monoArea} value={privatePem} readOnly autoSize={{ minRows: 6, maxRows: 14 }} placeholder="点击「生成密钥对」后在此输出私钥 PEM" />
          </Card>
        </div>

        <Card
          size="small"
          style={{ marginTop: 16 }}
          title="PEM 导入（自动识别公钥 / 私钥，按上方所选算法导回工作台）"
        >
          <Input.TextArea
            className={styles.monoArea}
            value={importPemText}
            onChange={(event) => {
              setImportPemText(event.target.value);
              setImportError(null);
            }}
            autoSize={{ minRows: 3, maxRows: 10 }}
            placeholder="粘贴 -----BEGIN PUBLIC KEY----- 或 -----BEGIN PRIVATE KEY----- 开头的 PEM 文本"
          />
          <Space style={{ marginTop: 8 }}>
            <Button type="primary" loading={importing} disabled={!importPemText.trim()} onClick={handleImport}>
              导入到工作台
            </Button>
            {keys?.publicKey ? <Tag color="green">公钥已就绪</Tag> : <Tag>公钥缺失</Tag>}
            {keys?.privateKey ? <Tag color="green">私钥已就绪</Tag> : <Tag>私钥缺失</Tag>}
          </Space>
          {importError ? (
            <Alert style={{ marginTop: 12 }} type="error" showIcon message="PEM 导入失败" description={importError} />
          ) : null}
        </Card>
      </Card>

      <Card>
        <Tabs
          items={[
            { key: 'oaep', label: 'OAEP 加解密', children: oaepTab },
            { key: 'pss', label: 'PSS 签名验签', children: pssTab },
          ]}
        />
      </Card>
    </div>
  );
};

export default RsaKeypairTool;
