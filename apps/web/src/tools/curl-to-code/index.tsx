'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Select, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { generateCode, parseCurl, type ParsedCurlRequest } from './utils/curl';
import {
  DEFAULT_CURL,
  LANGUAGE_LABELS,
  LANGUAGE_OPTIONS,
  TargetLanguageEnum,
} from './constants';
import styles from './index.module.css';
import { copyToClipboard } from '@/lib/utils';

/**
 * cURL 转代码工具，解析一条 cURL 命令并生成等价的
 * JavaScript fetch / Node axios / Python requests / Go 代码片段，
 * 全部运算在浏览器本地完成，不发起任何网络请求
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns cURL 转代码交互界面
 */
const CurlToCode: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_CURL);
  const [language, setLanguage] = React.useState<TargetLanguageEnum>(
    TargetLanguageEnum.JAVASCRIPT_FETCH,
  );

  const { output, error } = React.useMemo<{ output: string; error: string | null }>(() => {
    if (!input.trim()) {
      return { output: '', error: null };
    }
    try {
      const parsed: ParsedCurlRequest = parseCurl(input);
      return { output: generateCode(parsed, language), error: null };
    } catch (caught) {
      return {
        output: '',
        error: caught instanceof Error ? caught.message : 'cURL 命令解析失败',
      };
    }
  }, [input, language]);

  /**
   * 载入默认示例命令
   */
  const handleLoadSample = () => {
    setInput(DEFAULT_CURL);
  };

  /**
   * 清空输入
   */
  const handleClear = () => {
    setInput('');
  };

  /**
   * 复制生成结果
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
      <div className={styles.toolbar}>
        <Space wrap>
          <span>目标语言：</span>
          <Select
            value={language}
            onChange={setLanguage}
            options={LANGUAGE_OPTIONS}
            style={{ width: 200 }}
          />
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleLoadSample}>
            载入示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            清空
          </Button>
        </Space>
      </div>

      <div className={styles.panels}>
        <Card title="cURL 命令" className={styles.card}>
          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴一条 cURL 命令，例如 curl -X POST 'https://api.example.com/items' -d '{}'"
            rows={16}
            autoSize={{ minRows: 12, maxRows: 24 }}
          />
        </Card>

        <Card
          title={`生成代码（${LANGUAGE_LABELS[language]}）`}
          className={styles.card}
          extra={
            error ? null : (
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={handleCopy}
                disabled={!output}
              >
                复制代码
              </Button>
            )
          }
        >
          {error ? (
            <Alert type="error" showIcon message="cURL 命令解析失败" description={error} />
          ) : (
            <Input.TextArea
              value={output}
              readOnly
              rows={16}
              autoSize={{ minRows: 12, maxRows: 24 }}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default CurlToCode;
