'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Card, Input, Result } from 'antd';
import styles from './index.module.css';

interface UrlParserState {
  url: string;
  parsed: URL | null;
  error: string | null;
}

const UrlParser: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [state, setState] = React.useState<UrlParserState>({
    url: defaultInput || '',
    parsed: null,
    error: null,
  });

  const parseUrl = (urlStr: string) => {
    if (!urlStr.trim()) {
      setState({ url: urlStr, parsed: null, error: null });
      return;
    }
    try {
      // If no protocol, add https://
      let urlToParse = urlStr;
      if (!urlToParse.includes('://')) {
        urlToParse = `https://${urlToParse}`;
      }
      const parsed = new URL(urlToParse);
      setState({ url: urlStr, parsed, error: null });
    } catch (e) {
      setState({ url: urlStr, parsed: null, error: (e as Error).message });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    parseUrl(e.target.value);
  };

  const renderResultItem = (label: string, value: string | null) => {
    return (
      <div className={styles.resultItem}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value || '-'}</span>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Card title="输入 URL" className={styles.card}>
        <Input
          value={state.url}
          onChange={handleInputChange}
          placeholder="例如: https://example.com/path?query=value#anchor"
          size="large"
          allowClear
        />
      </Card>

      {state.error ? (
        <Card className={styles.card}>
          <Result
            status="error"
            title="URL 解析错误"
            subTitle={state.error}
          />
        </Card>
      ) : state.parsed ? (
        <Card title="解析结果" className={styles.card}>
          <div className={styles.resultGrid}>
            {renderResultItem('协议 (protocol)', state.parsed.protocol)}
            {renderResultItem('主机 (host)', state.parsed.host)}
            {renderResultItem('主机名 (hostname)', state.parsed.hostname)}
            {renderResultItem('端口 (port)', state.parsed.port || null)}
            {renderResultItem('路径 (pathname)', state.parsed.pathname)}
            {renderResultItem('搜索 (search)', state.parsed.search)}
            {renderResultItem('哈希 (hash)', state.parsed.hash)}
            {renderResultItem('用户名 (username)', state.parsed.username)}
            {renderResultItem('密码 (password)', state.parsed.password)}
            {renderResultItem('起源 (origin)', state.parsed.origin)}
          </div>
          {state.parsed.searchParams.size > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4>查询参数 (Search Params)</h4>
              <div className={styles.resultGrid}>
                {Array.from(state.parsed.searchParams.entries()).map(([key, value]) => (
                  <div key={key} className={styles.resultItem}>
                    <span className={styles.label}>{key}</span>
                    <span className={styles.value}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
};

export default UrlParser;
