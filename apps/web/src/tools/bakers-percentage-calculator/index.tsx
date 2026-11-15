'use client';

import { Alert, Button, Card, Input, InputNumber, Radio, Select, Space, Table, Tag } from 'antd';
import { useMemo, useRef, useState } from 'react';
import {
  DEFAULT_FLOUR_GRAMS,
  DEFAULT_INGREDIENTS,
  DEFAULT_MOLD_NEW,
  DEFAULT_MOLD_ORIGINAL,
  MOLD_SHAPES,
  PRESET_RECIPES,
  SCALE_TARGETS,
} from './constants';
import {
  analyzeRecipe,
  formatPercent,
  moldFactor,
  roundGrams,
  scaleRecipe,
} from './utils/bakers';
import type { MoldShape, RecipeAnalysis, ScaleTarget } from './utils/bakers';
import styles from './index.module.css';

type EntryMode = 'grams' | 'percent';

interface IngredientRow {
  id: number;
  name: string;
  value: number | null;
}

interface ResultRow {
  key: number;
  name: string;
  grams: string;
  percent: string;
  kind: string;
}

const KIND_LABEL: Record<string, string> = {
  water: '水',
  salt: '盐',
  yeast: '酵母',
  other: '其他',
};

/**
 * 基于当前面粉重量与配料，尝试生成分析结果
 */
function tryAnalyze(flour: number | null, rows: IngredientRow[], mode: EntryMode): RecipeAnalysis | null {
  if (flour === null) {
    return null;
  }
  try {
    return analyzeRecipe(
      flour,
      rows.map((row) => ({
        name: row.name,
        grams: mode === 'grams' ? row.value : undefined,
        percent: mode === 'percent' ? row.value : undefined,
      })),
    );
  } catch {
    return null;
  }
}

export default function BakersPercentageCalculatorTool() {
  const [flour, setFlour] = useState<number | null>(DEFAULT_FLOUR_GRAMS);
  const [entryMode, setEntryMode] = useState<EntryMode>('grams');
  const [rows, setRows] = useState<IngredientRow[]>(
    DEFAULT_INGREDIENTS.map((item, index) => ({ id: index + 1, name: item.name, value: item.grams })),
  );
  const nextId = useRef(DEFAULT_INGREDIENTS.length + 1);

  const [scaleTarget, setScaleTarget] = useState<ScaleTarget>('flour');
  const [scaleValue, setScaleValue] = useState<number | null>(2000);

  const [moldShape, setMoldShape] = useState<MoldShape>('round');
  const [moldOriginal, setMoldOriginal] = useState<number | null>(DEFAULT_MOLD_ORIGINAL);
  const [moldNew, setMoldNew] = useState<number | null>(DEFAULT_MOLD_NEW);

  const analysis = useMemo(() => tryAnalyze(flour, rows, entryMode), [entryMode, flour, rows]);

  const scaled = useMemo(() => {
    if (!analysis || scaleValue === null) {
      return null;
    }
    try {
      return scaleRecipe(analysis, scaleTarget, scaleValue);
    } catch {
      return null;
    }
  }, [analysis, scaleTarget, scaleValue]);

  const mold = useMemo(() => {
    if (moldOriginal === null || moldNew === null) {
      return null;
    }
    try {
      return moldFactor(moldShape, moldOriginal, moldNew);
    } catch {
      return null;
    }
  }, [moldNew, moldOriginal, moldShape]);

  const updateRow = (id: number, patch: Partial<IngredientRow>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    const id = nextId.current;
    nextId.current += 1;
    setRows((current) => [...current, { id, name: '', value: null }]);
  };

  const removeRow = (id: number) => {
    setRows((current) => current.filter((row) => row.id !== id));
  };

  const applyPreset = (key: string) => {
    const preset = PRESET_RECIPES.find((item) => item.key === key);
    if (!preset) {
      return;
    }
    setEntryMode('grams');
    setRows(
      preset.ingredients.map((item, index) => ({
        id: index + 1,
        name: item.name,
        value: item.grams,
      })),
    );
    nextId.current = preset.ingredients.length + 1;
  };

  const resultRows: ResultRow[] = (analysis?.rows ?? []).map((row, index) => ({
    key: index,
    name: row.name,
    grams: `${roundGrams(row.grams)} g`,
    percent: formatPercent(row.percent),
    kind: KIND_LABEL[row.kind] ?? '其他',
  }));

  const scaledRows: ResultRow[] = (scaled?.rows ?? []).map((row, index) => ({
    key: index,
    name: row.name,
    grams: `${roundGrams(row.grams)} g`,
    percent: formatPercent(row.percent),
    kind: KIND_LABEL[row.kind] ?? '其他',
  }));

  return (
    <div className={styles.container}>
      <Card title="配方输入">
        <div className={styles.inputs}>
          <label className={styles.field}>
            <span className={styles.label}>面粉总重量（g）</span>
            <InputNumber
              min={1}
              step={50}
              value={flour}
              onChange={setFlour}
              className={styles.control}
            />
          </label>
          <div className={styles.field}>
            <span className={styles.label}>配料录入方式</span>
            <Radio.Group
              value={entryMode}
              onChange={(event) => setEntryMode(event.target.value)}
              options={[
                { label: '按克数', value: 'grams' },
                { label: '按烘焙百分比', value: 'percent' },
              ]}
            />
          </div>
        </div>

        <Space wrap className={styles.presets}>
          {PRESET_RECIPES.map((preset) => (
            <Tag key={preset.key} color="blue" className={styles.preset} onClick={() => applyPreset(preset.key)}>
              {preset.label}
            </Tag>
          ))}
        </Space>

        <div className={styles.rows}>
          {rows.map((row) => (
            <div key={row.id} className={styles.row}>
              <Input
                value={row.name}
                placeholder="配料名称，如 水 / 盐 / 黄油"
                onChange={(event) => updateRow(row.id, { name: event.target.value })}
                className={styles.nameInput}
              />
              <InputNumber
                min={0}
                step={entryMode === 'grams' ? 5 : 1}
                value={row.value}
                placeholder={entryMode === 'grams' ? '克数' : '百分比'}
                onChange={(value) => updateRow(row.id, { value })}
                className={styles.valueInput}
              />
              <span className={styles.unit}>{entryMode === 'grams' ? 'g' : '%'}</span>
              <Button size="small" danger onClick={() => removeRow(row.id)}>
                删除
              </Button>
            </div>
          ))}
        </div>
        <Button type="dashed" block onClick={addRow}>
          + 添加配料
        </Button>
      </Card>

      <Card title="烘焙百分比分析（面粉 = 100%）">
        {analysis ? (
          <>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>含水量</span>
                <span className={styles.value}>{formatPercent(analysis.hydration)}</span>
                <span className={styles.sub}>水的重量 ÷ 面粉重量</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>盐比例</span>
                <span className={styles.value}>{formatPercent(analysis.saltPercent)}</span>
                <span className={styles.sub}>建议 1.5% ~ 2.5%</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>酵母比例</span>
                <span className={styles.value}>{formatPercent(analysis.yeastPercent)}</span>
                <span className={styles.sub}>干酵母通常 0.8% ~ 1.5%</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>总百分比</span>
                <span className={styles.value}>{formatPercent(analysis.totalPercent)}</span>
                <span className={styles.sub}>面粉 100% + 全部配料</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>面团总重</span>
                <span className={styles.value}>{roundGrams(analysis.totalWeight)} g</span>
                <span className={styles.sub}>面粉 {roundGrams(analysis.flourGrams)} g</span>
              </div>
            </div>

            <Table<ResultRow>
              size="small"
              rowKey="key"
              pagination={false}
              dataSource={resultRows}
              columns={[
                { title: '配料', dataIndex: 'name' },
                { title: '克数', dataIndex: 'grams' },
                { title: '烘焙百分比', dataIndex: 'percent' },
                {
                  title: '类型',
                  dataIndex: 'kind',
                  render: (value: string) => <Tag>{value}</Tag>,
                },
              ]}
            />
          </>
        ) : (
          <Alert type="warning" showIcon message="请填写有效的面粉重量与配料（克数或百分比）" />
        )}
      </Card>

      <Card title="配方缩放">
        <div className={styles.inputs}>
          <label className={styles.field}>
            <span className={styles.label}>缩放目标</span>
            <Select
              value={scaleTarget}
              onChange={setScaleTarget}
              options={SCALE_TARGETS.map((item) => ({ label: item.label, value: item.value }))}
              className={styles.control}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>
              {scaleTarget === 'flour'
                ? '目标面粉重量（g）'
                : scaleTarget === 'factor'
                  ? '缩放倍数'
                  : '目标面团总重（g）'}
            </span>
            <InputNumber min={0.1} step={scaleTarget === 'factor' ? 0.1 : 50} value={scaleValue} onChange={setScaleValue} className={styles.control} />
          </label>
        </div>

        {scaled ? (
          <>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>缩放倍数</span>
                <span className={styles.value}>{scaled.factor.toFixed(2)}×</span>
                <span className={styles.sub}>全部配料等比缩放</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>缩放后面粉</span>
                <span className={styles.value}>{roundGrams(scaled.flourGrams)} g</span>
                <span className={styles.sub}>面粉仍为 100%</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>缩放后面团总重</span>
                <span className={styles.value}>{roundGrams(scaled.totalWeight)} g</span>
                <span className={styles.sub}>烘焙百分比保持不变</span>
              </div>
            </div>

            <Table<ResultRow>
              size="small"
              rowKey="key"
              pagination={false}
              dataSource={scaledRows}
              columns={[
                { title: '配料', dataIndex: 'name' },
                { title: '缩放后克数', dataIndex: 'grams' },
                { title: '烘焙百分比', dataIndex: 'percent' },
                { title: '类型', dataIndex: 'kind' },
              ]}
            />
          </>
        ) : (
          <Alert type="warning" showIcon message="请填写有效的缩放目标，且先保证配方可解析" />
        )}
      </Card>

      <Card title="模具换算">
        <div className={styles.inputs}>
          <label className={styles.field}>
            <span className={styles.label}>模具类型</span>
            <Select
              value={moldShape}
              onChange={setMoldShape}
              options={MOLD_SHAPES.map((item) => ({ label: item.label, value: item.value }))}
              className={styles.control}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>
              {moldShape === 'height' ? '原高度（cm）' : '原尺寸（cm）'}
            </span>
            <InputNumber min={0.1} step={0.5} value={moldOriginal} onChange={setMoldOriginal} className={styles.control} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>
              {moldShape === 'height' ? '新高度（cm）' : '新尺寸（cm）'}
            </span>
            <InputNumber min={0.1} step={0.5} value={moldNew} onChange={setMoldNew} className={styles.control} />
          </label>
        </div>

        {mold ? (
          <Space wrap>
            <Tag color="green">面团用量倍数 {mold.toFixed(3)}×</Tag>
            <Tag>
              {moldShape === 'height'
                ? '同底面积时，高度之比即面团倍数'
                : '圆形与方形模具按尺寸平方比换算'}
            </Tag>
          </Space>
        ) : (
          <Alert type="warning" showIcon message="请填写有效的模具尺寸" />
        )}
      </Card>
    </div>
  );
}
