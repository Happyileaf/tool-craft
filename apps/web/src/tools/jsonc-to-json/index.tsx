'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Tag, message } from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  RightOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { convertJsonc, type JsoncIndent } from './utils/jsonc';
import { DEFAULT_INDENT, DEFAULT_JSONC_SAMPLE } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * JSONC / 宽松 JSON 转标准 JSON：
 * 左侧粘贴带 //、/* *\/ 注释或尾随逗号的 JSONC 文本，
 * 右侧实时呈现词法清洗并重新序列化后的严格 JSON。
 * 全部处理在浏览器本地完成，不发起任何网络请求。
 */
const JsoncToJson: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || '');
  const [indent, setIndent] = React.useState<JsoncIndent>(DEFAULT_INDENT);

  const result = React.useMemo(() => convertJsonc(input, indent), [input, indent]);
  const output = result.success ? (result.output ?? '') : '';
  const error = result.success ? null : result.errorMessage ?? null;

  const handleCopy = async () => {
    if (!output) {
      return;
    }
    await copyToClipboard(output);
    message.success('标准 JSON 已复制');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarLabel}>输出缩进</span>
        <Radio.Group
          value={indent}
          onChange={(event) => setIndent(event.target.value as JsoncIndent)}
          optionType="button"
          buttonStyle="solid"
          size="small"
          options={[
            { label: '2 空格', value: 2 },
            { label: '4 空格', value: 4 },
            { label: '压缩单行', value: 0 },
          ]}
        />
        <Button
          size="small"
          icon={<ThunderboltOutlined />}
          onClick={() => setInput(DEFAULT_JSONC_SAMPLE)}
        >
          载入示例
        </Button>
        <Button
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => setInput('')}
          disabled={!input}
        >
          清空
        </Button>
      </div>

      <div className={styles.grid}>
        <Card
          size="small"
          title={
            <Space size={8}>
              <span>JSONC 输入</span>
              <Tag>{input.length} 字符</Tag>
            </Space>
          }
        >
          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={'粘贴带 // 或 /* */ 注释、尾随逗号的 JSONC，例如 tsconfig.json 片段'}
            spellCheck={false}
            autoSize={{ minRows: 16, maxRows: 28 }}
            className={styles.monoArea}
          />
        </Card>

        <Card
          size="small"
          title={
            <Space size={8}>
              <RightOutlined />
              <span>标准 JSON 输出</span>
              {result.success ? <Tag color="green">合法</Tag> : null}
            </Space>
          }
          extra={
            <Button
              size="small"
              type="text"
              icon={<CopyOutlined />}
              disabled={!output}
              onClick={handleCopy}
            >
              复制
            </Button>
          }
        >
          {error ? (
            <Alert
              type="error"
              showIcon
              message="转换失败"
              description={error}
            />
          ) : output ? (
            <Input.TextArea
              value={output}
              readOnly
              spellCheck={false}
              autoSize={{ minRows: 16, maxRows: 28 }}
              className={styles.monoArea}
            />
          ) : (
            <Alert type="info" showIcon message="等待输入" description="在左侧粘贴 JSONC 后将实时转换" />
          )}
        </Card>
      </div>

      <div className={styles.hint}>
        词法扫描会正确跳过双引号字符串内部的 <code>//</code>、<code>/*</code> 与逗号，
        仅剥离真正的注释与 <code>{']'}</code>/<code>{'}'}</code> 前的尾随逗号；不会修复单引号或未加引号的键名。
        全程浏览器本地运算，零新增依赖，不发起网络请求。
      </div>
    </div>
  );
};

export default JsoncToJson;
