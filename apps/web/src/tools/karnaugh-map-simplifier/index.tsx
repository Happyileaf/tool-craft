'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, Input, Segmented, Space, Tag } from 'antd';
import {
  parseMintermString,
  simplifyKmap,
  type CellValue,
  type SimplifyResult,
} from './utils/kmap';
import { CELL_CYCLE, EXAMPLE_INPUTS, GRAY_ORDER, GROUP_STYLES, MINTERM_PLACEHOLDER, VAR_COUNTS } from './constants';
import styles from './index.module.css';

/** 网格布局信息 */
interface GridLayout {
  /** 行维度格雷码宽度（位） */
  rowBits: number;
  /** 列维度格雷码宽度（位） */
  colBits: number;
  /** 行格雷码索引序列 */
  rowCodes: readonly number[];
  /** 列格雷码索引序列 */
  colCodes: readonly number[];
}

/**
 * 按变量数计算卡诺图行列切分：2 变量 2×2、3 变量 2×4、4 变量 4×4
 *
 * @param varCount - 变量数
 * @returns 行列位宽与格雷码序列
 */
function buildGridLayout(varCount: number): GridLayout {
  const rowBits = varCount <= 2 ? 1 : 2;
  const colBits = varCount - rowBits;
  return {
    rowBits,
    colBits,
    rowCodes: GRAY_ORDER.slice(0, 1 << rowBits),
    colCodes: GRAY_ORDER.slice(0, 1 << colBits),
  };
}

/**
 * 由行列格雷码索引与位宽还原最小项编号（A 为最高位）
 *
 * @param rowIndex - 行格雷码索引（对应高位变量）
 * @param colIndex - 列格雷码索引（对应低位变量）
 * @param colBits - 列维度位宽
 * @returns 最小项编号
 */
function mintermOf(rowIndex: number, colIndex: number, colBits: number): number {
  return (rowIndex << colBits) | colIndex;
}

/** 取指定长度的二进制标签，如 2 → "01" */
function binaryLabel(value: number, bits: number): string {
  return value.toString(2).padStart(bits, '0');
}

/** 取长度为 2^n 的全 0 单元格数组 */
function createCells(varCount: number): CellValue[] {
  return new Array<CellValue>(1 << varCount).fill(0);
}

/**
 * 卡诺图化简器：交互式标记 0/1/无关项，Quine–McCluskey 求 SOP/POS 最简表达式
 *
 * @returns 卡诺图化简器交互界面
 */
const KarnaughMapSimplifier: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [varCount, setVarCount] = React.useState<number>(4);
  const [cells, setCells] = React.useState<CellValue[]>(() => createCells(4));
  const [mintermText, setMintermText] = React.useState<string>(defaultInput ?? '');
  const [parseError, setParseError] = React.useState<string | null>(null);
  /** 当前高亮的乘积项下标，null 表示不高亮 */
  const [activeTerm, setActiveTerm] = React.useState<number | null>(null);

  const layout = React.useMemo(() => buildGridLayout(varCount), [varCount]);

  /** 切换变量数后重建网格 */
  const handleVarCountChange = (value: number | string) => {
    const next = Number(value);
    setVarCount(next);
    setCells(createCells(next));
    setParseError(null);
    setActiveTerm(null);
  };

  /** 单元格在 0 → 1 → X → 0 之间循环 */
  const cycleCell = (minterm: number) => {
    setCells((previous) => {
      const next = [...previous];
      const current = next[minterm] ?? 0;
      const currentIndex = CELL_CYCLE.indexOf(current as (typeof CELL_CYCLE)[number]);
      const following = CELL_CYCLE[(currentIndex + 1) % CELL_CYCLE.length] as CellValue;
      next[minterm] = following;
      return next;
    });
    setParseError(null);
  };

  /** 解析 Σm 字符串并填充网格 */
  const handleParse = () => {
    try {
      const parsed = parseMintermString(mintermText, varCount);
      const next = createCells(varCount);
      for (const term of parsed.ones) {
        next[term] = 1;
      }
      for (const term of parsed.dontCares) {
        next[term] = 'x';
      }
      setCells(next);
      setParseError(null);
      setActiveTerm(null);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleClear = () => {
    setCells(createCells(varCount));
    setParseError(null);
    setActiveTerm(null);
  };

  /** 化简结果（含错误态），任何异常都不允许崩溃 */
  const outcome = React.useMemo<{ result?: SimplifyResult; error?: string }>(() => {
    try {
      return { result: simplifyKmap(cells, varCount) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [cells, varCount]);

  /** 当前高亮乘积项覆盖的最小项集合 */
  const highlightedMinterms = React.useMemo<Set<number>>(() => {
    if (outcome.result === undefined || activeTerm === null) {
      return new Set();
    }
    const term = outcome.result.sop[activeTerm];
    return new Set(term?.minterms ?? []);
  }, [outcome.result, activeTerm]);

  /** 取最小项对应的高亮 CSS 类名（同组同色） */
  const groupClassOf = (minterm: number): string | null => {
    if (!highlightedMinterms.has(minterm)) {
      return null;
    }
    const style = activeTerm !== null ? GROUP_STYLES[activeTerm] : undefined;
    return style ? (styles[style.className] ?? null) : null;
  };

  /** 单元格按钮的状态样式与文本 */
  const cellStateClass = (value: CellValue): string => {
    if (value === 1) {
      return styles.cellOne ?? '';
    }
    if (value === 'x') {
      return styles.cellDontCare ?? '';
    }
    return styles.cellZero ?? '';
  };

  const gridClass =
    varCount === 2 ? styles.grid2 : varCount === 3 ? styles.grid3 : styles.grid4;
  const rowHeaderNames = varCount === 2 ? 'A' : 'AB';
  const colHeaderNames = varCount === 2 ? 'B' : varCount === 3 ? 'C' : 'CD';

  return (
    <div className={styles.container}>
      <Card title="卡诺图化简器（2–4 变量，SOP / POS）">
        <p className={styles.hint}>
          点击单元格可在 0 → 1 → X（无关项）→ 0 之间循环；算法基于 Quine–McCluskey，
          变量顺序 A/B/C/D，A 为最高位，行列按格雷码排列并自动支持环绕相邻。
        </p>

        <div className={styles.controls}>
          <span className={styles.label}>变量数</span>
          <Segmented
            options={VAR_COUNTS.map((count) => ({ label: `${count} 变量`, value: count }))}
            value={varCount}
            onChange={handleVarCountChange}
          />
          <Button size="small" onClick={handleClear}>
            清空网格
          </Button>
        </div>

        <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 16 }}>
          <div className={styles.mintermRow}>
            <Input
              className={styles.mintermInput}
              value={mintermText}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setMintermText(event.target.value)
              }
              placeholder={MINTERM_PLACEHOLDER}
              spellCheck={false}
            />
            <Button type="primary" onClick={handleParse}>
              解析填充
            </Button>
          </div>
          <Space wrap size={[8, 8]}>
            <span className={styles.label}>示例：</span>
            {EXAMPLE_INPUTS.map((example) => (
              <Button
                key={example}
                size="small"
                onClick={() => setMintermText(example)}
              >
                {example}
              </Button>
            ))}
          </Space>
          {parseError ? (
            <Alert type="error" showIcon message="Σm 字符串解析失败" description={parseError} />
          ) : null}
        </Space>
      </Card>

      <Card title="卡诺图网格（格雷码）">
        <div className={`${styles.mapGrid} ${gridClass}`}>
          <div className={styles.corner}>
            {rowHeaderNames}＼{colHeaderNames}
          </div>
          {layout.colCodes.map((colCode) => (
            <div key={`col-${colCode}`} className={styles.colHeader}>
              {binaryLabel(colCode, layout.colBits)}
            </div>
          ))}
          {layout.rowCodes.map((rowCode) => (
            <React.Fragment key={`row-${rowCode}`}>
              <div className={styles.rowHeader}>{binaryLabel(rowCode, layout.rowBits)}</div>
              {layout.colCodes.map((colCode) => {
                const minterm = mintermOf(rowCode, colCode, layout.colBits);
                const value = cells[minterm] ?? 0;
                const groupClass = groupClassOf(minterm);
                return (
                  <button
                    type="button"
                    key={`cell-${minterm}`}
                    className={[styles.cell, cellStateClass(value), groupClass]
                      .filter((name) => name !== null)
                      .join(' ')}
                    onClick={() => cycleCell(minterm)}
                    aria-label={`最小项 ${minterm}，当前值 ${value === 'x' ? '无关项' : value}`}
                  >
                    <span className={styles.cellIndex}>m{minterm}</span>
                    {value === 'x' ? 'X' : value}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {outcome.error ? (
        <Alert type="warning" showIcon message="暂无法化简" description={outcome.error} />
      ) : outcome.result ? (
        <Card title="化简结果">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div className={styles.expressionBlock}>
              <div className={styles.label}>SOP（积之和）</div>
              <div className={styles.mono}>{outcome.result.sopExpression}</div>
            </div>
            <div className={styles.expressionBlock}>
              <div className={styles.label}>POS（和之积）</div>
              <div className={styles.mono}>{outcome.result.posExpression}</div>
            </div>

            <div>
              <div className={styles.label} style={{ marginBottom: 8 }}>
                SOP 乘积项（点击高亮对应网格单元格，同组同色）
              </div>
              <div className={styles.termList}>
                {outcome.result.sop.length === 0 ? (
                  <Tag>无乘积项（常量 0）</Tag>
                ) : (
                  outcome.result.sop.map((term, index) => {
                    const style = GROUP_STYLES[index];
                    const label = term.literals.length === 0 ? '1' : term.literals.join('');
                    return (
                      <button
                        type="button"
                        key={`${label}-${index}`}
                        className={[
                          styles.termTag,
                          activeTerm === index ? styles.termTagActive : '',
                        ].join(' ')}
                        onClick={() =>
                          setActiveTerm((previous) => (previous === index ? null : index))
                        }
                      >
                        {style ? `${style.label}：${label}` : label}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <Descriptions size="small" bordered column={4} title="门电路统计（基于 SOP 两级与或电路）">
              <Descriptions.Item label="与门">
                {outcome.result.gateStats.andGates}
              </Descriptions.Item>
              <Descriptions.Item label="或门">
                {outcome.result.gateStats.orGates}
              </Descriptions.Item>
              <Descriptions.Item label="非门">
                {outcome.result.gateStats.notGates}
              </Descriptions.Item>
              <Descriptions.Item label="字面量总数">
                {outcome.result.gateStats.literals}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        </Card>
      ) : null}
    </div>
  );
};

export default KarnaughMapSimplifier;
