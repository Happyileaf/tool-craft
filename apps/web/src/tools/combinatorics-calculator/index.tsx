'use client';

import React from 'react';
import { Alert, Card, Input, Tag, Tooltip } from 'antd';
import type { ToolComponentProps } from '../loaders';
import { DEFAULT_N, DEFAULT_R, ITEM_METAS, ITEM_ORDER } from './constants';
import {
  calculateCombinatorics,
  groupThousands,
  MAX_INPUT,
  parseNonNegativeInteger,
  type CombinatoricResultItem,
} from './utils/combinatorics';
import styles from './index.module.css';

/**
 * 单个排列组合变体的结果卡片
 *
 * @param props - 卡片属性
 * @param props.item - 变体计算结果
 * @returns 结果卡片节点
 */
function ResultItemCard({ item }: { item: CombinatoricResultItem }) {
  const meta = ITEM_METAS[item.key];
  return (
    <div
      className={`${styles.resultCard} ${item.available ? '' : styles.resultCardUnavailable}`}
    >
      <div className={styles.itemHeader}>
        <span className={styles.itemLabel}>{meta.label}</span>
        <Tooltip title={`${meta.formula}｜${meta.description}`}>
          <span className={styles.itemNotation}>{meta.notation}</span>
        </Tooltip>
      </div>
      {item.available ? (
        <>
          <Tooltip title={item.exact ?? ''}>
            <span className={styles.exactValue}>{groupThousands(item.exact ?? '')}</span>
          </Tooltip>
          {item.scientific && (
            <span className={styles.scientificValue}>≈ {item.scientific}（科学计数法）</span>
          )}
        </>
      ) : (
        <div>
          <Tag>不适用</Tag>
          <span className={styles.unavailableText}>{item.reason}</span>
        </div>
      )}
    </div>
  );
}

/**
 * 排列组合计算器：输入 n 与 r，实时计算阶乘、排列、组合、重复排列、
 * 重复组合与圆排列六类结果，全部使用 BigInt 精确计算并在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入（未使用，本工具为双输入结构）
 * @returns 排列组合计算器交互界面
 */
const CombinatoricsCalculator: React.FC<ToolComponentProps> = () => {
  const [nInput, setNInput] = React.useState(DEFAULT_N);
  const [rInput, setRInput] = React.useState(DEFAULT_R);

  const nError = parseNonNegativeInteger(nInput, 'n');
  const rError = parseNonNegativeInteger(rInput, 'r');

  const result = React.useMemo(() => {
    if (nError || rError) {
      return null;
    }
    const n = Number(nInput.trim());
    const r = Number(rInput.trim());
    if (n + r - 1 > MAX_INPUT) {
      return null;
    }
    return calculateCombinatorics(n, r);
  }, [nInput, rInput, nError, rError]);

  const overflow = !nError && !rError && Number(nInput.trim()) + Number(rInput.trim()) - 1 > MAX_INPUT;

  return (
    <div className={styles.container}>
      <Card title="排列组合计算器">
        <div className={styles.row}>
          <span className={styles.fieldLabel}>n</span>
          <Input
            value={nInput}
            onChange={(event) => setNInput(event.target.value)}
            style={{ maxWidth: 160 }}
            placeholder="元素总数 n"
          />
          <span className={styles.fieldLabel}>r</span>
          <Input
            value={rInput}
            onChange={(event) => setRInput(event.target.value)}
            style={{ maxWidth: 160 }}
            placeholder="选取数量 r"
          />
        </div>
        <div className={styles.hint} style={{ marginTop: 8 }}>
          支持 0～{MAX_INPUT} 的非负整数；结果使用 BigInt 精确计算，超大整数（10^15 以上）附科学计数法近似值。
        </div>

        {nError ? (
          <Alert style={{ marginTop: 16 }} type="error" showIcon message={`n ${nError.message}`} />
        ) : rError ? (
          <Alert style={{ marginTop: 16 }} type="error" showIcon message={`r ${rError.message}`} />
        ) : overflow ? (
          <Alert
            style={{ marginTop: 16 }}
            type="warning"
            showIcon
            message={`n + r − 1 不能超过 ${MAX_INPUT}，以保证重复组合的计算规模`}
          />
        ) : result ? (
          <div className={styles.resultGrid} style={{ marginTop: 16 }}>
            {ITEM_ORDER.map((key) => {
              const item = result.items.find((entry) => entry.key === key);
              return item ? <ResultItemCard key={key} item={item} /> : null;
            })}
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default CombinatoricsCalculator;
