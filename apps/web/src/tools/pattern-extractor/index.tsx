'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Empty, Input, Space, Statistic, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { BUILTIN_PATTERNS } from './utils/patterns';
import { extractPatterns, resultToText, type CustomPattern } from './utils/extract';
import { DEFAULT_SAMPLE, DEFAULT_SELECTED_KEYS } from './constants';
import styles from './index.module.css';

/**
 * 文本模式批量提取器：勾选邮箱 / URL / IP / UUID / 日期时间 / 十六进制色值等内置模式，
 * 从粘贴文本中批量提取并按模式分组、去重计数，另支持追加一条自定义正则，全程浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入文本
 * @returns 模式提取交互界面
 */
const PatternExtractor: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [text, setText] = React.useState<string>(defaultInput || DEFAULT_SAMPLE);
  const [selectedKeys, setSelectedKeys] = React.useState<string[]>(DEFAULT_SELECTED_KEYS);
  const [customEnabled, setCustomEnabled] = React.useState<boolean>(false);
  const [customName, setCustomName] = React.useState<string>('');
  const [customSource, setCustomSource] = React.useState<string>('');
  const [ignoreCase, setIgnoreCase] = React.useState<boolean>(true);

  const custom: CustomPattern | null = customEnabled
    ? { name: customName, source: customSource, ignoreCase }
    : null;

  const result = React.useMemo(
    () => extractPatterns(text, selectedKeys, custom),
    [text, selectedKeys, customEnabled, customName, customSource, ignoreCase],
  );

  const customError = result.groups.find((group) => group.key === 'custom')?.error ?? null;

  const copyResult = async (): Promise<void> => {
    await copyToClipboard(resultToText(result));
    message.success('提取结果已复制');
  };

  const resetSample = (): void => {
    setText(DEFAULT_SAMPLE);
    setSelectedKeys(DEFAULT_SELECTED_KEYS);
    setCustomEnabled(false);
    setCustomName('');
    setCustomSource('');
    setIgnoreCase(true);
  };

  return (
    <div className={styles.container}>
      <Card title="文本模式批量提取器">
        <div className={styles.controls}>
          <span className={styles.label}>提取模式：</span>
          <Checkbox.Group
            options={BUILTIN_PATTERNS.map((pattern) => ({
              label: pattern.label,
              value: pattern.key,
            }))}
            value={selectedKeys}
            onChange={(values) => setSelectedKeys(values as string[])}
          />
        </div>

        <Input.TextArea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="粘贴日志、代码或文档文本……"
          autoSize={{ minRows: 6, maxRows: 18 }}
          className={styles.textarea}
        />

        <div className={styles.customBlock}>
          <Checkbox
            checked={customEnabled}
            onChange={(event) => setCustomEnabled(event.target.checked)}
          >
            追加一条自定义正则
          </Checkbox>
          {customEnabled ? (
            <div className={styles.customFields}>
              <Input
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="分组名称（可选，默认「自定义」）"
                className={styles.customName}
              />
              <Input
                value={customSource}
                onChange={(event) => setCustomSource(event.target.value)}
                placeholder="正则源码（不含两侧 /），如 \\bfoo-\\d+\\b"
                className={styles.customSource}
              />
              <Checkbox
                checked={ignoreCase}
                onChange={(event) => setIgnoreCase(event.target.checked)}
              >
                忽略大小写
              </Checkbox>
            </div>
          ) : null}
          {customError ? <Alert type="warning" showIcon message={`自定义正则无效：${customError}`} /> : null}
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={resetSample}>
            载入示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setText('')}>
            清空文本
          </Button>
        </Space>
      </Card>

      <Card title="提取结果">
        <Space size="large" className={styles.stats}>
          <Statistic title="去重后匹配项" value={result.uniqueCount} />
          <Statistic title="总命中次数" value={result.totalCount} />
        </Space>

        {result.groups.length === 0 ? (
          <Empty description="请至少选择一个提取模式" />
        ) : result.uniqueCount === 0 && !customError ? (
          <Empty description="未匹配到任何内容" />
        ) : (
          <div className={styles.groups}>
            {result.groups.map((group) => (
              <div key={group.key} className={styles.group}>
                <div className={styles.groupHeader}>
                  <strong>{group.label}</strong>
                  <Tag color={group.error ? 'red' : 'blue'}>
                    {group.error ? '正则错误' : `${group.items.length} 项 / ${group.total} 次`}
                  </Tag>
                </div>
                {group.error ? (
                  <Alert type="error" showIcon message={group.error} />
                ) : group.items.length === 0 ? (
                  <span className={styles.muted}>（无匹配）</span>
                ) : (
                  <ul className={styles.itemList}>
                    {group.items.map((item) => (
                      <li key={item.value} className={styles.item}>
                        <code className={styles.itemValue}>{item.value}</code>
                        <Tag>×{item.count}</Tag>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        <Button
          type="primary"
          icon={<CopyOutlined />}
          onClick={copyResult}
          disabled={result.totalCount === 0 && !customError}
        >
          复制结果文本
        </Button>
        <div className={styles.hint}>所有提取均在浏览器本地完成，文本不会被上传。</div>
      </Card>
    </div>
  );
};

export default PatternExtractor;
