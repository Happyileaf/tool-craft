'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Select, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { convertAll, convertCase, splitWords } from './utils/case';
import {
  CASE_STYLE_LABELS,
  CASE_STYLE_ORDER,
  CaseStyleEnum,
  DEFAULT_CASE_STYLE,
  DEFAULT_TEXT,
} from './constants';
import styles from './index.module.css';
import { copyToClipboard } from '@/lib/utils';

/**
 * 文本命名风格转换工具，把任意文本在 camelCase、PascalCase、snake_case、
 * kebab-case、SCREAMING_SNAKE_CASE、Title Case 等常见命名风格之间互转，
 * 全部运算在浏览器本地完成，不发起任何网络请求
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入文本
 * @returns 命名风格转换交互界面
 */
const TextCaseConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_TEXT);
  const [style, setStyle] = React.useState<CaseStyleEnum>(DEFAULT_CASE_STYLE);

  const results = React.useMemo(() => convertAll(input), [input]);
  const primary = convertCase(input, style);
  const isEmpty = splitWords(input).length === 0;

  /**
   * 复制指定文本到剪贴板
   *
   * @param text - 待复制文本
   */
  const handleCopy = async (text: string) => {
    if (text === '') {
      message.warning('当前没有可复制的内容');
      return;
    }
    await copyToClipboard(text);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap>
          <span>目标风格：</span>
          <Select
            value={style}
            onChange={setStyle}
            options={CASE_STYLE_ORDER.map((item) => ({
              label: CASE_STYLE_LABELS[item],
              value: item,
            }))}
            style={{ width: 220 }}
          />
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => setInput(DEFAULT_TEXT)}>
            载入示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
            清空
          </Button>
        </Space>
      </div>

      <Card title="输入文本" className={styles.card}>
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="输入待转换文本，支持空格、下划线、中划线、点号以及 camelCase 边界"
          rows={5}
          autoSize={{ minRows: 4, maxRows: 12 }}
        />
      </Card>

      {isEmpty ? (
        <Alert
          type="info"
          showIcon
          className={styles.empty}
          message="请输入文本后再进行转换"
          description="输入可包含字母、数字与分隔符，例如 “get user profile”。"
        />
      ) : (
        <>
          <Card
            title={`目标结果 · ${CASE_STYLE_LABELS[style]}`}
            className={styles.card}
            extra={
              <Button type="text" icon={<CopyOutlined />} onClick={() => handleCopy(primary)}>
                复制
              </Button>
            }
          >
            <div className={styles.primaryValue}>{primary}</div>
          </Card>

          <Card title="全部风格对照" className={styles.card}>
            <div className={styles.grid}>
              {CASE_STYLE_ORDER.map((item) => (
                <div key={item} className={styles.gridItem}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemLabel}>{CASE_STYLE_LABELS[item]}</span>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopy(results[item])}
                    />
                  </div>
                  <code className={styles.itemValue}>{results[item]}</code>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default TextCaseConverter;
