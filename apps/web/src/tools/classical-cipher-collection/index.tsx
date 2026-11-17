'use client';

import React from 'react';
import { Alert, Button, Card, Empty, Input, InputNumber, Radio, Segmented, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  CIPHER_OPTIONS,
  DEFAULT_PLAYFAIR_KEY,
  DEFAULT_RAILS,
  DEFAULT_TEXT,
  type CipherId,
} from './constants';
import {
  atbash,
  baconDecrypt,
  baconEncrypt,
  playfairDecrypt,
  playfairEncrypt,
  railFenceDecrypt,
  railFenceEncrypt,
  type CipherResult,
} from './utils/ciphers';
import styles from './index.module.css';

type Mode = 'encrypt' | 'decrypt';

/** 按所选密码与模式统一调度纯函数 */
function runCipher(id: CipherId, mode: Mode, text: string, rails: number, key: string): CipherResult {
  if (id === 'atbash') {
    return atbash(text);
  }
  if (id === 'bacon') {
    return mode === 'encrypt' ? baconEncrypt(text) : baconDecrypt(text);
  }
  if (id === 'railfence') {
    return mode === 'encrypt'
      ? railFenceEncrypt(text, rails)
      : railFenceDecrypt(text, rails);
  }
  return mode === 'encrypt'
    ? playfairEncrypt(text, key)
    : playfairDecrypt(text, key);
}

/**
 * 古典密码合集：培根 / 栅栏 / Playfair / Atbash 四种教学级密码的加解密
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认明文
 * @returns 古典密码工具界面
 */
const ClassicalCipherCollection: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [cipherId, setCipherId] = React.useState<CipherId>('bacon');
  const [mode, setMode] = React.useState<Mode>('encrypt');
  const [text, setText] = React.useState<string>(defaultInput || DEFAULT_TEXT);
  const [rails, setRails] = React.useState<number>(DEFAULT_RAILS);
  const [playfairKey, setPlayfairKey] = React.useState<string>(DEFAULT_PLAYFAIR_KEY);

  const result = React.useMemo(() => {
    if (!text.trim()) {
      return null;
    }
    try {
      return runCipher(cipherId, mode, text, rails, playfairKey);
    } catch (error) {
      return {
        output: '',
        steps: [`处理失败：${error instanceof Error ? error.message : String(error)}`],
      };
    }
  }, [cipherId, mode, text, rails, playfairKey]);

  const copyResult = () => {
    if (!result?.output) {
      return;
    }
    void copyToClipboard(result.output);
    message.success('已复制结果');
  };

  const reset = () => {
    setCipherId('bacon');
    setMode('encrypt');
    setText(defaultInput || DEFAULT_TEXT);
    setRails(DEFAULT_RAILS);
    setPlayfairKey(DEFAULT_PLAYFAIR_KEY);
  };

  return (
    <div className={styles.container}>
      <Alert
        type="info"
        showIcon
        message="古典密码教学工具，全部加解密在浏览器本地完成"
        description="收录培根（5 位 AB 编码 / 隐写基础）、栅栏（行列置换）、Playfair（5×5 双字母方阵）与 Atbash（字母表反转）四种古典密码。这些算法仅用于学习密码学历史与原理，不提供任何现代安全强度，切勿用于真实机密信息。"
      />

      <Card title="算法与模式">
        <div className={styles.formColumn}>
          <Segmented
            block
            value={cipherId}
            onChange={(value) => setCipherId(value as CipherId)}
            options={CIPHER_OPTIONS.map((c) => ({ label: c.name, value: c.id }))}
          />
          <Radio.Group
            value={mode}
            onChange={(event) => setMode(event.target.value as Mode)}
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: '加密', value: 'encrypt' },
              { label: '解密', value: 'decrypt' },
            ]}
          />
          {cipherId === 'railfence' && (
            <label className={styles.paramRow}>
              <span>栅栏行数</span>
              <InputNumber
                min={2}
                max={12}
                value={rails}
                onChange={(value) => setRails(typeof value === 'number' ? value : DEFAULT_RAILS)}
              />
            </label>
          )}
          {cipherId === 'playfair' && (
            <label className={styles.paramRow}>
              <span>密钥（字母，J 按 I 处理）</span>
              <Input
                className={styles.mono}
                value={playfairKey}
                onChange={(event) => setPlayfairKey(event.target.value)}
                placeholder="例如 MONARCHY"
                spellCheck={false}
              />
            </label>
          )}
        </div>
      </Card>

      <Card
        title={mode === 'encrypt' ? '明文输入' : '密文输入'}
        extra={
          <Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={reset}>
              载入样例
            </Button>
            <Button size="small" icon={<ClearOutlined />} onClick={() => setText('')}>
              清空
            </Button>
          </Space>
        }
      >
        <Input.TextArea
          className={styles.mono}
          value={text}
          onChange={(event) => setText(event.target.value)}
          autoSize={{ minRows: 5, maxRows: 14 }}
          spellCheck={false}
          placeholder={mode === 'encrypt' ? '输入待加密文本…' : '输入待解密文本…'}
        />
      </Card>

      <Card
        title={mode === 'encrypt' ? '密文输出' : '明文输出'}
        extra={
          <Button size="small" icon={<CopyOutlined />} onClick={copyResult}>
            复制结果
          </Button>
        }
      >
        {result?.output ? (
          <div className={styles.resultBox}>{result.output}</div>
        ) : (
          <Empty description="输入文本后实时输出结果" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
        {result?.steps.length ? (
          <ul className={styles.steps}>
            {result.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        ) : null}
      </Card>
    </div>
  );
};

export default ClassicalCipherCollection;
