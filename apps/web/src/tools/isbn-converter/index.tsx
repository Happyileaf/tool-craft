'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, Space, Statistic, Tag, Tooltip } from 'antd';
import { ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import { inspectIsbnBatch } from './utils/isbn';
import type { IsbnResult } from './utils/isbn';
import { DEFAULT_SAMPLE } from './constants';
import styles from './index.module.css';

interface IsbnResultItemProps {
  info: IsbnResult;
  index: number;
}

function IsbnResultItemCard({ info, index }: IsbnResultItemProps) {
  if (!info.valid) {
    return (
      <Card size="small" className={styles.resultItem}>
        <div className={styles.itemHeader}>
          <span className={styles.itemIndex}>#{index + 1}</span>
          <span className={styles.mono}>{info.input}</span>
          <Tag color="red">非法</Tag>
        </div>
        <Alert
          style={{ marginTop: 8 }}
          type="error"
          showIcon
          message={info.error ?? '不是合法的 ISBN'}
        />
      </Card>
    );
  }

  return (
    <Card size="small" className={styles.resultItem}>
      <div className={styles.itemHeader}>
        <span className={styles.itemIndex}>#{index + 1}</span>
        <span className={styles.mono}>{info.compact}</span>
        <Tag color={info.kind === 'isbn13' ? 'blue' : 'geekblue'}>
          {info.kind === 'isbn13' ? 'ISBN-13' : 'ISBN-10'}
        </Tag>
        {info.isDuplicate && <Tag color="orange">重复</Tag>}
      </div>
      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>ISBN-13</span>
          <span className={styles.metaValue}>
            <Tooltip title={info.formatted13 ?? info.isbn13}>
              <span className={styles.mono}>{info.isbn13}</span>
            </Tooltip>
          </span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>ISBN-10</span>
          <span className={styles.metaValue}>
            {info.isbn10 ? (
              <Tooltip title={info.formatted10 ?? info.isbn10}>
                <span className={styles.mono}>{info.isbn10}</span>
              </Tooltip>
            ) : (
              <Tooltip title="979 前缀是 2007 年启用的新前缀，不存在对应的 ISBN-10">
                <span className={styles.mono}>不适用（979）</span>
              </Tooltip>
            )}
          </span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>规范分组</span>
          <span className={styles.metaValue}>
            <span className={styles.mono}>{info.formatted13}</span>
          </span>
        </div>
      </div>
    </Card>
  );
}

/**
 * ISBN-10 / ISBN-13 批量校验与互转工具：识别类型、校验校验位、
 * 双向互转（978 前缀）并输出带组区分隔的规范形式，全部本地计算
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns ISBN 校验转换界面
 */
const IsbnConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_SAMPLE);

  const result = React.useMemo(() => inspectIsbnBatch(input), [input]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => setInput(DEFAULT_SAMPLE)}>
            载入示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
            清空
          </Button>
        </Space>
      </div>

      <Card title="输入 ISBN（每行一个，也可用逗号/分号/空格分隔）" className={styles.card}>
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={'每行一个 ISBN，例如 9780201616224 或 020161622X'}
          rows={10}
          autoSize={{ minRows: 8, maxRows: 20 }}
        />
        <div className={styles.hint}>
          自动忽略连字符与空白，兼容小写 x；ISBN-10 与其对应的 ISBN-13 视为同一条。所有计算均在本地完成。
        </div>
      </Card>

      {result.summary.total > 0 && (
        <Card className={styles.card}>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <Statistic title="片段总数" value={result.summary.total} />
            </div>
            <div className={styles.statItem}>
              <Statistic title="合法" value={result.summary.valid} valueStyle={{ color: '#3f8600' }} />
            </div>
            <div className={styles.statItem}>
              <Statistic
                title="非法"
                value={result.summary.invalid}
                valueStyle={{ color: result.summary.invalid > 0 ? '#cf1322' : undefined }}
              />
            </div>
            <div className={styles.statItem}>
              <Statistic title="去重后" value={result.summary.unique} />
            </div>
            <div className={styles.statItem}>
              <Statistic
                title="重复次数"
                value={result.summary.duplicate}
                valueStyle={{ color: result.summary.duplicate > 0 ? '#d46b08' : undefined }}
              />
            </div>
          </div>
        </Card>
      )}

      {result.items.length > 0 ? (
        <div className={styles.resultList}>
          {result.items.map((info, index) => (
            <IsbnResultItemCard key={`${index}-${info.input}`} info={info} index={index} />
          ))}
        </div>
      ) : (
        <Card className={styles.card}>
          <Empty description="粘贴 ISBN 后将在此显示校验与转换结果" />
        </Card>
      )}
    </div>
  );
};

export default IsbnConverter;
