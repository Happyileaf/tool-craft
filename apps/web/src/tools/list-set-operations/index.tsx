'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Button, Card, Empty, Input, Space, Switch, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { parseList, setOperations } from './utils/set-ops';
import { DEFAULT_LIST_A, DEFAULT_LIST_B, INPUT_ROWS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 结果区展示配置 */
interface ResultSection {
  /** 区域标识 */
  key: keyof ReturnType<typeof setOperations>;
  /** 中文标题 */
  title: string;
  /** 数学符号副标题 */
  symbol: string;
}

const RESULT_SECTIONS: ResultSection[] = [
  { key: 'intersection', title: '交集', symbol: 'A ∩ B' },
  { key: 'union', title: '并集', symbol: 'A ∪ B' },
  { key: 'leftOnly', title: '仅左侧独有', symbol: 'A − B' },
  { key: 'rightOnly', title: '仅右侧独有', symbol: 'B − A' },
  { key: 'symmetricDifference', title: '对称差集', symbol: 'A △ B' },
];

/**
 * 列表集合运算工具，对两段逐行列表执行交集、并集、左右差集与对称差集运算，
 * 支持 trim、忽略大小写与结果去重开关，输入实时联动，全部运算在浏览器本地完成
 *
 * @returns 列表集合运算交互界面
 */
const ListSetOperations: React.FC<ToolComponentProps> = () => {
  const [textA, setTextA] = React.useState(DEFAULT_LIST_A);
  const [textB, setTextB] = React.useState(DEFAULT_LIST_B);
  const [trim, setTrim] = React.useState(true);
  const [lowercase, setLowercase] = React.useState(false);
  const [dedupe, setDedupe] = React.useState(true);

  const result = React.useMemo(() => {
    const listA = parseList(textA, { trim, lowercase });
    const listB = parseList(textB, { trim, lowercase });
    return setOperations(listA, listB, { dedupe });
  }, [textA, textB, trim, lowercase, dedupe]);

  /**
   * 复制指定结果区的条目到剪贴板
   *
   * @param key - 结果区标识
   * @param title - 结果区中文标题
   */
  const handleCopy = async (key: ResultSection['key'], title: string) => {
    const lines = result[key];
    if (lines.length === 0) {
      return;
    }
    await copyToClipboard(lines.join('\n'));
    message.success(`已复制${title}（${lines.length} 条）`);
  };

  return (
    <div className={styles.container}>
      <Card title="列表集合运算（交集 / 并集 / 差集）">
        <div className={styles.inputGrid}>
            <Input.TextArea
              value={textA}
              onChange={(event) => setTextA(event.target.value)}
              rows={INPUT_ROWS}
              placeholder="列表 A，每行一项"
            />
            <Input.TextArea
              value={textB}
              onChange={(event) => setTextB(event.target.value)}
              rows={INPUT_ROWS}
              placeholder="列表 B，每行一项"
            />
        </div>

        <div className={styles.switchRow} style={{ marginTop: 16 }}>
          <Space>
            <span>忽略首尾空白</span>
            <Switch checked={trim} onChange={setTrim} />
          </Space>
          <Space>
            <span>忽略大小写</span>
            <Switch checked={lowercase} onChange={setLowercase} />
          </Space>
          <Space>
            <span>结果去重</span>
            <Switch checked={dedupe} onChange={setDedupe} />
          </Space>
        </div>
      </Card>

      <div className={styles.resultGrid}>
        {RESULT_SECTIONS.map((section) => {
          const lines = result[section.key];
          return (
            <Card
              key={section.key}
              size="small"
              title={
                <Space>
                  <span>{section.title}</span>
                  <Tag>{section.symbol}</Tag>
                  <Tag color="blue">{lines.length} 条</Tag>
                </Space>
              }
              extra={
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  disabled={lines.length === 0}
                  onClick={() => handleCopy(section.key, section.title)}
                >
                  复制
                </Button>
              }
            >
              {lines.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span className={styles.emptyText}>无条目</span>}
                />
              ) : (
                <pre className={styles.resultBody}>
                  {lines.map((line, index) => (
                    <div key={`${line}-${index}`} className={styles.resultLine}>
                      {line}
                    </div>
                  ))}
                </pre>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ListSetOperations;
