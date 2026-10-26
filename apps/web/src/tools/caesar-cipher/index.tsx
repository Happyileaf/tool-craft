'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Button, Card, Input, InputNumber, Radio, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { caesarDecrypt, caesarEncrypt } from './utils/caesar';
import {
  CaesarModeEnum,
  DEFAULT_SHIFT,
  DEFAULT_TEXT,
  MAX_SHIFT,
  MIN_SHIFT,
  MODE_OPTIONS,
  ROT13_SHIFT,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 凯撒密码 / ROT13 工具：对英文字母按 0–25 的位移量做循环替换，
 * 加密为正移、解密为反移；数字、标点、空格与中文等非字母字符原样保留。
 * 全部运算在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns 凯撒密码加解密交互界面
 */
const CaesarCipher: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<CaesarModeEnum>(CaesarModeEnum.ENCRYPT);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_TEXT);
  const [shift, setShift] = React.useState<number>(DEFAULT_SHIFT);

  const isEncrypt = mode === CaesarModeEnum.ENCRYPT;

  const output = React.useMemo<string>(() => {
    if (!input) {
      return '';
    }
    return isEncrypt ? caesarEncrypt(input, shift) : caesarDecrypt(input, shift);
  }, [input, isEncrypt, shift]);

  /**
   * 复制转换结果
   */
  const handleCopy = async () => {
    if (!output) {
      return;
    }
    await copyToClipboard(output);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card title="凯撒密码 / ROT13 加解密（仅变换英文字母，保留大小写与其他字符）">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => setMode(event.target.value as CaesarModeEnum)}
            options={MODE_OPTIONS}
          />
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => setInput(DEFAULT_TEXT)}>
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
              清空
            </Button>
          </Space>
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>位移量（0–25）：</span>
          <InputNumber
            className={styles.shiftInput}
            min={MIN_SHIFT}
            max={MAX_SHIFT}
            precision={0}
            value={shift}
            onChange={(value) => setShift(value ?? MIN_SHIFT)}
          />
          <Button
            type={shift === ROT13_SHIFT ? 'primary' : 'default'}
            onClick={() => setShift(ROT13_SHIFT)}
          >
            ROT13（位移 13）
          </Button>
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>{isEncrypt ? '明文输入：' : '密文输入：'}</span>
        </div>
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="输入英文字母文本，数字、标点、空格与中文等非字母字符将原样保留"
          autoSize={{ minRows: 5, maxRows: 14 }}
          spellCheck={false}
        />
      </Card>

      <Card
        title={isEncrypt ? '密文结果' : '明文结果'}
        extra={
          <Button type="text" icon={<CopyOutlined />} onClick={handleCopy} disabled={!output}>
            复制结果
          </Button>
        }
      >
        <Input.TextArea
          value={output}
          readOnly
          autoSize={{ minRows: 5, maxRows: 14 }}
          className={styles.monoOutput}
        />
        <div className={styles.hint}>
          凯撒密码对 A–Z / a–z 按字母表循环位移并保持大小写，其余字符不动；位移 26 位等价于不变。ROT13
          是位移 13 的特例，加密与解密互为同一操作，对结果再执行一次即可还原原文。
        </div>
      </Card>
    </div>
  );
};

export default CaesarCipher;
