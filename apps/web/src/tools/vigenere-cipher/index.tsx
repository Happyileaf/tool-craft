'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { vigenereDecrypt, vigenereEncrypt } from './utils/vigenere';
import {
  CipherModeEnum,
  DEFAULT_CIPHER,
  DEFAULT_KEY,
  DEFAULT_TEXT,
  MODE_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 维吉尼亚（Vigenère）密码加解密工具：关键词按字母循环提供位移，
 * 加密 Ci=(Pi+Ki) mod 26、解密反之；仅变换 A–Z / a–z 并保留大小写，
 * 其余字符原样保留且不消耗密钥位。全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns 维吉尼亚密码加解密交互界面
 */
const VigenereCipher: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<CipherModeEnum>(CipherModeEnum.ENCRYPT);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_TEXT);
  const [key, setKey] = React.useState<string>(DEFAULT_KEY);

  const isEncrypt = mode === CipherModeEnum.ENCRYPT;

  const result = React.useMemo<{ output: string; error: string | null }>(() => {
    const transformed = isEncrypt
      ? vigenereEncrypt(input, key)
      : vigenereDecrypt(input, key);
    return { output: transformed.text ?? '', error: transformed.error };
  }, [input, key, isEncrypt]);

  /**
   * 切换加解密方向并载入对应示例
   *
   * @param next - 目标方向
   */
  const handleModeChange = (next: CipherModeEnum) => {
    setMode(next);
    setInput(next === CipherModeEnum.ENCRYPT ? DEFAULT_TEXT : DEFAULT_CIPHER);
  };

  /**
   * 复制转换结果
   */
  const handleCopy = async () => {
    if (!result.output) {
      return;
    }
    await copyToClipboard(result.output);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card title="维吉尼亚（Vigenère）密码加解密（仅变换英文字母，保留大小写与其他字符）">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as CipherModeEnum)}
            options={MODE_OPTIONS}
          />
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setInput(isEncrypt ? DEFAULT_TEXT : DEFAULT_CIPHER)}
            >
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
              清空
            </Button>
          </Space>
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>关键词（仅取其中英文字母，循环复用）：</span>
          <Input
            className={styles.keyInput}
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder="例如 LEMON"
            spellCheck={false}
          />
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>{isEncrypt ? '明文输入：' : '密文输入：'}</span>
        </div>
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="输入英文字母文本，数字、标点、空格与中文等非字母字符将原样保留且不消耗密钥位"
          autoSize={{ minRows: 5, maxRows: 14 }}
          spellCheck={false}
        />
      </Card>

      <Card
        title={isEncrypt ? '密文结果' : '明文结果'}
        extra={
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={handleCopy}
            disabled={Boolean(result.error) || !result.output}
          >
            复制结果
          </Button>
        }
      >
        {result.error ? (
          <Alert type="error" showIcon message="无法加解密" description={result.error} />
        ) : (
          <Input.TextArea
            value={result.output}
            readOnly
            autoSize={{ minRows: 5, maxRows: 14 }}
            className={styles.monoOutput}
          />
        )}
        <div className={styles.hint}>
          维吉尼亚密码按关键词字母循环位移：加密 Ci=(Pi+Ki) mod 26，解密 Pi=(Ci−Ki)
          mod 26，密钥短于文本时自动循环。它是多表替换，与所有字母同一位移量的凯撒密码不同；
          非字母字符原样保留且不推进密钥位置。
        </div>
      </Card>
    </div>
  );
};

export default VigenereCipher;
