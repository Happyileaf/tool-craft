'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CopyOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  computeSimilarity,
  parseNamedSets,
  type SetPair,
  type SimilarityResult,
} from './utils/similarity';
import {
  DECIMAL_DIGITS,
  DEFAULT_SET_TEXTS,
  INPUT_ROWS,
  MAX_SETS,
  MIN_SETS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 将 0–1 系数映射为热力背景色（透明度随系数增强） */
function heatColor(value: number): string {
  return `rgba(22, 119, 255, ${(value * 0.85).toFixed(3)})`;
}

/** 格式化系数为百分比与固定小数 */
function formatCoefficient(value: number): string {
  return `${(value * 100).toFixed(2)}%（${value.toFixed(DECIMAL_DIGITS)}）`;
}

/**
 * 集合相似度计算器，对多个命名集合计算两两 Jaccard / Sørensen–Dice / Overlap
 * 系数，输出配对明细表、Jaccard 对称热力矩阵与交并集明细，全部在浏览器本地完成
 *
 * @returns 集合相似度计算交互界面
 */
const SetSimilarityCalculator: React.FC<ToolComponentProps> = () => {
  const [texts, setTexts] = React.useState<string[]>(DEFAULT_SET_TEXTS);
  const [lowercase, setLowercase] = React.useState(false);

  const result: SimilarityResult | null = React.useMemo(() => {
    const sets = parseNamedSets(texts, { lowercase });
    if (sets.length < MIN_SETS) {
      return null;
    }
    return computeSimilarity(sets);
  }, [texts, lowercase]);

  /** 更新指定下标的集合输入文本 */
  const updateText = (index: number, value: string) => {
    setTexts((previous) => previous.map((text, i) => (i === index ? value : text)));
  };

  /** 追加一个空集合输入框 */
  const addSet = () => {
    setTexts((previous) =>
      previous.length >= MAX_SETS ? previous : [...previous, `集合${previous.length + 1}\n`],
    );
  };

  /** 导出配对明细与矩阵为 CSV */
  const exportCsv = () => {
    if (!result) {
      return;
    }
    const pairRows = result.pairs
      .map(
        (pair) =>
          `${pair.a},${pair.b},${pair.intersectionSize},${pair.unionSize},${pair.jaccard.toFixed(
            DECIMAL_DIGITS,
          )},${pair.dice.toFixed(DECIMAL_DIGITS)},${pair.overlap.toFixed(DECIMAL_DIGITS)}`,
      )
      .join('\n');
    const header = '集合A,集合B,交集数,并集数,Jaccard,Dice,Overlap';
    const matrixHeader = `\n\nJaccard 矩阵,${result.sets.map((set) => set.name).join(',')}`;
    const matrixRows = result.sets
      .map(
        (set, rowIndex) =>
          `${set.name},${result.matrix[rowIndex]!
            .map((value) => value.toFixed(DECIMAL_DIGITS))
            .join(',')}`,
      )
      .join('\n');
    const blob = new Blob([`${header}\n${pairRows}${matrixHeader}\n${matrixRows}`], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'set-similarity.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    message.success('已导出 CSV');
  };

  const columns: ColumnsType<SetPair> = [
    { title: '集合 A', dataIndex: 'a', key: 'a' },
    { title: '集合 B', dataIndex: 'b', key: 'b' },
    {
      title: '交集 / 并集',
      key: 'sizes',
      render: (_, record) => `${record.intersectionSize} / ${record.unionSize}`,
    },
    {
      title: 'Jaccard',
      dataIndex: 'jaccard',
      key: 'jaccard',
      render: (value: number) => formatCoefficient(value),
    },
    {
      title: 'Sørensen–Dice',
      dataIndex: 'dice',
      key: 'dice',
      render: (value: number) => formatCoefficient(value),
    },
    {
      title: 'Overlap',
      dataIndex: 'overlap',
      key: 'overlap',
      render: (value: number) => formatCoefficient(value),
    },
    {
      title: '交集明细',
      dataIndex: 'intersection',
      key: 'intersection',
      render: (elements: string[]) =>
        elements.length === 0 ? (
          <span className={styles.detailLine}>—</span>
        ) : (
          <Space size={4} wrap>
            {elements.map((element) => (
              <Tag key={element}>{element}</Tag>
            ))}
          </Space>
        ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card
        title="集合输入（每段首个词为集合名，其余为元素，支持换行 / 逗号 / 空格分隔）"
        extra={
          <Space>
            <Button icon={<PlusOutlined />} onClick={addSet} disabled={texts.length >= MAX_SETS}>
              添加集合
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={exportCsv}
              disabled={result === null}
            >
              导出 CSV
            </Button>
          </Space>
        }
      >
        <div className={styles.inputGrid}>
          {texts.map((text, index) => (
            <Input.TextArea
              key={index}
              value={text}
              rows={INPUT_ROWS}
              onChange={(event) => updateText(index, event.target.value)}
              placeholder={`集合 ${index + 1}，首行为集合名`}
            />
          ))}
        </div>
        <div className={styles.switchRow}>
          <Space>
            <span>忽略大小写</span>
            <Switch checked={lowercase} onChange={setLowercase} />
          </Space>
        </div>
      </Card>

      {result === null ? (
        <Alert
          type="info"
          showIcon
          message={`至少需要 ${MIN_SETS} 个含元素的非空集合才能计算相似度`}
        />
      ) : (
        <>
          <div className={styles.statGrid}>
            {result.sets.map((set) => (
              <div key={set.name} className={styles.statCard}>
                <div className={styles.statValue}>{set.elements.length}</div>
                <div className={styles.statLabel}>{set.name}（去重后元素数）</div>
              </div>
            ))}
          </div>

          <Card title="两两相似度系数" size="small">
            <Table<SetPair>
              rowKey={(record) => `${record.a}-${record.b}`}
              columns={columns}
              dataSource={result.pairs}
              pagination={false}
              size="small"
            />
          </Card>

          <Card
            title="Jaccard 相似度热力矩阵"
            size="small"
            extra={
              <Tooltip title="颜色越深表示 Jaccard 系数越高，对角线为集合自身（恒为 1）">
                <Tag>色阶 0 → 1</Tag>
              </Tooltip>
            }
          >
            <div className={styles.matrixWrap}>
              <table className={styles.matrix}>
                <thead>
                  <tr>
                    <th>集合</th>
                    {result.sets.map((set) => (
                      <th key={set.name}>{set.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.sets.map((rowSet, rowIndex) => (
                    <tr key={rowSet.name}>
                      <th>{rowSet.name}</th>
                      {result.matrix[rowIndex]!.map((value, colIndex) => (
                        <td
                          key={colIndex}
                          className={styles.cell}
                          style={{ background: heatColor(value) }}
                        >
                          {value.toFixed(DECIMAL_DIGITS)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="交并集明细" size="small">
            {result.pairs.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无配对结果" />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {result.pairs.map((pair) => (
                  <Card
                    key={`${pair.a}-${pair.b}`}
                    size="small"
                    type="inner"
                    title={`${pair.a} ↔ ${pair.b}`}
                    extra={
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={async () => {
                          await copyToClipboard(pair.union.join('\n'));
                          message.success('已复制并集元素');
                        }}
                      >
                        复制并集
                      </Button>
                    }
                  >
                    <div className={styles.detailLine}>交集：{pair.intersection.join(', ') || '—'}</div>
                    <div className={styles.detailLine}>并集：{pair.union.join(', ')}</div>
                  </Card>
                ))}
              </Space>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default SetSimilarityCalculator;
