'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  buildSpellGroups,
  decodePhonetic,
  encodePhonetic,
  type SpellGroup,
} from './utils/phonetic';
import {
  DEFAULT_PHONETIC,
  DEFAULT_TEXT,
  MODE_OPTIONS,
  PhoneticModeEnum,
  WORD_SEPARATOR,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * NATO 音标字母双向转换工具：普通文本与 Alpha / Bravo / Charlie …
 * 标准拼读之间互相转换，数字采用标准读法（Zero / One / … / Niner）。
 * 全部运算在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns NATO 音标转换交互界面
 */
const NatoPhoneticConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<PhoneticModeEnum>(PhoneticModeEnum.ENCODE);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_TEXT);

  const isEncode = mode === PhoneticModeEnum.ENCODE;

  const result = React.useMemo<{
    output: string;
    error: string | null;
    groups: SpellGroup[];
  }>(() => {
    if (!input.trim()) {
      return { output: '', error: null, groups: [] };
    }
    if (isEncode) {
      const built = buildSpellGroups(input);
      if (built instanceof Error) {
        return { output: '', error: built.message, groups: [] };
      }
      const encoded = encodePhonetic(input);
      return {
        output: encoded.output ?? '',
        error: encoded.error,
        groups: built,
      };
    }
    const decoded = decodePhonetic(input);
    return { output: decoded.output ?? '', error: decoded.error, groups: [] };
  }, [input, isEncode]);

  /**
   * 切换转换方向并载入对应示例
   *
   * @param next - 目标方向
   */
  const handleModeChange = (next: PhoneticModeEnum) => {
    setMode(next);
    setInput(next === PhoneticModeEnum.ENCODE ? DEFAULT_TEXT : DEFAULT_PHONETIC);
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
      <Card title="NATO 音标字母转换器（文本 ⇄ Alpha / Bravo / Charlie）">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as PhoneticModeEnum)}
            options={MODE_OPTIONS}
          />
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setInput(isEncode ? DEFAULT_TEXT : DEFAULT_PHONETIC)}
            >
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
              清空
            </Button>
          </Space>
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>{isEncode ? '文本输入：' : '音标输入：'}</span>
        </div>
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            isEncode
              ? '输入字母 A–Z 与数字 0–9，自动逐字符拼写为标准音标'
              : '输入音标单词（如 Alfa Bravo），单词间以斜杠（/）或更长空白分隔'
          }
          autoSize={{ minRows: 4, maxRows: 12 }}
          spellCheck={false}
          className={isEncode ? undefined : styles.mono}
        />
      </Card>

      <Card
        title={isEncode ? '音标拼写结果' : '还原文本'}
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
          <Alert
            type="error"
            showIcon
            message={isEncode ? '拼写失败' : '还原失败'}
            description={result.error}
          />
        ) : isEncode ? (
          <>
            <Input.TextArea
              value={result.output}
              readOnly
              autoSize={{ minRows: 3, maxRows: 10 }}
              className={styles.mono}
            />
            {result.groups.length > 0 && (
              <div className={styles.groups} style={{ marginTop: 16 }}>
                {result.groups.map((group, groupIndex) => (
                  <React.Fragment key={`${group.source}-${groupIndex}`}>
                    {groupIndex > 0 && <Tag color="default">{WORD_SEPARATOR}</Tag>}
                    <div className={styles.group}>
                      {group.tokens.map((token, tokenIndex) => (
                        <div className={styles.token} key={`${token.char}-${tokenIndex}`}>
                          <span className={styles.tokenChar}>{token.char}</span>
                          <span className={styles.tokenWord}>{token.word}</span>
                        </div>
                      ))}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </>
        ) : (
          <Input.TextArea
            value={result.output}
            readOnly
            autoSize={{ minRows: 3, maxRows: 10 }}
            className={styles.mono}
          />
        )}
        <div className={styles.hint}>
          {isEncode
            ? '采用 ITU/ICAO 标准音标表（A–Z 共 26 词，数字 Zero–Eight 与 Niner）；源单词之间以 “ / ” 分隔，电话报读时可按斜杠停顿。仅支持字母与数字。'
            : '还原时忽略音标大小写，并兼容 Alpha（Alfa）、Juliet（Juliett）、Nine（Niner）等常见异写；X-ray 等带连字符的单词可直接输入。'}
        </div>
      </Card>
    </div>
  );
};

export default NatoPhoneticConverter;
