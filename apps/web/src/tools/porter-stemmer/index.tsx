'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Empty, Input, Space, Statistic, Table, Tabs, Tag } from 'antd';
import { stemText } from './utils/porter';
import { DEFAULT_TEXT, HINT } from './constants';
import styles from './index.module.css';

const { TextArea } = Input;

const PorterStemmer: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [text, setText] = React.useState(defaultInput || DEFAULT_TEXT);
  const result = React.useMemo(() => stemText(text), [text]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Tag color="blue">Porter 1980</Tag>
        <span className={styles.hint}>{HINT}</span>
      </div>

      <Card className={styles.card} title="输入英文文本">
        <TextArea
          className={styles.textarea}
          rows={6}
          value={text}
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
          placeholder="粘贴英文段落，按非字母字符自动分词……"
        />
      </Card>

      {result.totalTokens === 0 ? (
        <Empty description="暂无可分析的英文单词" />
      ) : (
        <>
          <Card className={styles.card} title="汇总统计">
            <Space size="large" wrap>
              <Statistic title="总词数" value={result.totalTokens} />
              <Statistic title="词干数" value={result.uniqueStems} />
              <Statistic
                title="归并压缩比"
                value={(result.mergeRatio * 100).toFixed(1)}
                suffix="%"
              />
            </Space>
          </Card>

          <Card className={styles.card} title="提取结果">
            <Tabs
              defaultActiveKey="groups"
              items={[
                {
                  key: 'groups',
                  label: `词形归并（${result.groups.length}）`,
                  children: (
                    <Table
                      size="small"
                      pagination={result.groups.length > 20 ? { pageSize: 20 } : false}
                      rowKey="stem"
                      dataSource={result.groups}
                      columns={[
                        { title: '词干', dataIndex: 'stem', key: 'stem', className: styles.mono },
                        {
                          title: '出现次数',
                          dataIndex: 'count',
                          key: 'count',
                          width: 100,
                          sorter: (a, b) => a.count - b.count,
                        },
                        {
                          title: '原始词形',
                          dataIndex: 'variants',
                          key: 'variants',
                          render: (variants: string[]) => (
                            <Space size={[4, 4]} wrap>
                              {variants.map((v) => (
                                <Tag key={v}>{v}</Tag>
                              ))}
                            </Space>
                          ),
                        },
                      ]}
                    />
                  ),
                },
                {
                  key: 'tokens',
                  label: `逐词明细（${result.tokens.length}）`,
                  children: (
                    <Table
                      size="small"
                      pagination={result.tokens.length > 20 ? { pageSize: 20 } : false}
                      rowKey={(_, i) => String(i)}
                      dataSource={result.tokens}
                      columns={[
                        {
                          title: '#',
                          key: 'index',
                          width: 60,
                          render: (_, __, i) => i + 1,
                        },
                        { title: '原词', dataIndex: 'original', key: 'original', className: styles.mono },
                        { title: '词干', dataIndex: 'stem', key: 'stem', className: styles.mono },
                      ]}
                    />
                  ),
                },
              ]}
            />
          </Card>

          <Alert
            type="info"
            showIcon
            message="Porter 提取的是词干（stem）而非词典词根（root），同一词干下的屈折/派生形式会被归并；短于 3 个字符的词原样保留。"
          />
        </>
      )}
    </div>
  );
};

export default PorterStemmer;
