'use client';

import React from 'react';
import { Alert, Button, Card, Empty, Input, Space, Switch, Tag } from 'antd';
import { CheckCircleFilled, ClearOutlined, CopyOutlined, MinusCircleFilled, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import { globToRegExp, globToRegExpLiteral, matchPaths } from './utils/glob';
import { DEFAULT_PATHS, DEFAULT_PATTERN } from './constants';
import styles from './index.module.css';

/**
 * Glob 模式匹配测试器：在浏览器本地将 glob 模式确定性翻译为 JavaScript RegExp，
 * 实时显示每个测试路径是否匹配，并输出等价的正则字面量
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认 glob 模式
 * @returns Glob 匹配测试界面
 */
const GlobTester: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [pattern, setPattern] = React.useState<string>(defaultInput || DEFAULT_PATTERN);
  const [pathsText, setPathsText] = React.useState<string>(DEFAULT_PATHS);
  const [caseSensitive, setCaseSensitive] = React.useState<boolean>(true);

  const compiled = React.useMemo<{ regexp: RegExp; literal: string } | { error: string }>(() => {
    try {
      return {
        regexp: globToRegExp(pattern, { caseSensitive }),
        literal: globToRegExpLiteral(pattern, { caseSensitive }),
      };
    } catch (caught) {
      return { error: caught instanceof Error ? caught.message : '正则编译失败' };
    }
  }, [pattern, caseSensitive]);

  const results = React.useMemo(() => {
    if (!('regexp' in compiled)) {
      return null;
    }
    const paths = pathsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    return matchPaths(pattern, paths, { caseSensitive });
  }, [compiled, pathsText, pattern, caseSensitive]);

  const matchedCount = results?.filter((item) => item.matched).length ?? 0;

  return (
    <div className={styles.container}>
      <Card title="Glob 模式">
        <div className={styles.formColumn}>
          <span className={styles.label}>Glob 模式（支持 *、**、?、{'{a,b}'}、[abc]）</span>
          <Input
            className={styles.mono}
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            placeholder="src/**/*.{ts,tsx}"
            spellCheck={false}
          />
        </div>
        <Space wrap>
          <span className={styles.switchLabel}>
            <Switch checked={caseSensitive} onChange={setCaseSensitive} size="small" /> 区分大小写
          </span>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => {
              setPattern(defaultInput || DEFAULT_PATTERN);
              setPathsText(DEFAULT_PATHS);
              setCaseSensitive(true);
            }}
          >
            载入示例
          </Button>
          <Button size="small" icon={<ClearOutlined />} onClick={() => setPathsText('')}>
            清空路径
          </Button>
        </Space>
        {'error' in compiled ? (
          <Alert type="error" showIcon message={compiled.error} style={{ marginTop: 12 }} />
        ) : (
          <div style={{ marginTop: 12 }}>
            <span className={styles.label}>等价 JavaScript 正则</span>
            <pre className={styles.regexOutput}>
              {compiled.literal}
              <Button
                size="small"
                type="text"
                icon={<CopyOutlined />}
                onClick={() => void copyToClipboard(compiled.literal)}
                style={{ float: 'right' }}
              >
                复制
              </Button>
            </pre>
          </div>
        )}
      </Card>

      <Card
        title="测试路径（每行一条）"
        extra={
          results ? (
            <Space>
              <Tag color="green">匹配 {matchedCount}</Tag>
              <Tag>{results.length - matchedCount} 条不匹配</Tag>
            </Space>
          ) : null
        }
      >
        <Input.TextArea
          className={styles.mono}
          value={pathsText}
          onChange={(event) => setPathsText(event.target.value)}
          autoSize={{ minRows: 6, maxRows: 18 }}
          spellCheck={false}
          placeholder={'src/index.ts\nsrc/lib/format.ts'}
        />
        {results && results.length === 0 ? (
          <Empty description="输入测试路径后实时显示匹配结果" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : null}
        {results && results.length > 0 ? (
          <div className={styles.resultList} style={{ marginTop: 12 }}>
            {results.map((item) => (
              <div
                key={item.path}
                className={`${styles.resultRow} ${item.matched ? styles.matched : styles.unmatched}`}
              >
                {item.matched ? (
                  <CheckCircleFilled style={{ color: '#22c55e' }} />
                ) : (
                  <MinusCircleFilled style={{ color: '#9ca3af' }} />
                )}
                <span className={styles.pathText}>{item.path}</span>
                <Tag color={item.matched ? 'green' : 'default'}>{item.matched ? '匹配' : '不匹配'}</Tag>
              </div>
            ))}
          </div>
        ) : null}
        <div className={styles.hint}>
          语法：<code>*</code> 匹配单段内任意字符（不含 /），<code>**</code> 可跨越路径分隔符，
          <code>?</code> 匹配单个字符，<code>{'{a,b}'}</code> 为分支组，<code>[abc]</code> /{' '}
          <code>[!abc]</code> 为字符类。所有翻译与匹配均在浏览器本地完成。
        </div>
      </Card>
    </div>
  );
};

export default GlobTester;
