'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  InputNumber,
  Radio,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  calculateBac,
  bacToPermille,
  formatDurationHours,
  DEFAULT_ELIMINATION,
  type DrinkInput,
  type Gender,
} from './utils/bac';
import { DRINK_PRESETS, DEFAULT_DRINKS, BAC_THRESHOLDS } from './constants';
import styles from './index.module.css';

/**
 * Widmark BAC 估算器：按饮品明细与体重估算峰值/当前血液酒精浓度，
 * 并给出代谢到 0 的所需时间与法定阈值风险提示，全部本地运算。
 */
const BacCalculator: React.FC<ToolComponentProps> = () => {
  const [weightKg, setWeightKg] = React.useState(70);
  const [gender, setGender] = React.useState<Gender>('male');
  const [elapsedHours, setElapsedHours] = React.useState(0);
  const [drinks, setDrinks] = React.useState<DrinkInput[]>(DEFAULT_DRINKS);

  const result = React.useMemo(() => {
    try {
      return calculateBac({ weightKg, gender, elapsedHours, drinks });
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [weightKg, gender, elapsedHours, drinks]);

  const updateDrink = (index: number, patch: Partial<DrinkInput>) => {
    setDrinks((previous) =>
      previous.map((drink, i) => (i === index ? { ...drink, ...patch } : drink)),
    );
  };

  const columns = [
    {
      title: '饮品',
      dataIndex: 'name',
      render: (value: string, _: DrinkInput, index: number) => (
        <InputNumber
          style={{ width: 110 }}
          value={value}
          onChange={(v) => updateDrink(index, { name: String(v ?? '') })}
        />
      ),
    },
    {
      title: '容量 (mL)',
      dataIndex: 'volumeMl',
      render: (value: number, _: DrinkInput, index: number) => (
        <InputNumber
          min={0}
          style={{ width: 110 }}
          value={value}
          onChange={(v) => updateDrink(index, { volumeMl: Number(v ?? 0) })}
        />
      ),
    },
    {
      title: 'ABV (%)',
      dataIndex: 'abvPercent',
      render: (value: number, _: DrinkInput, index: number) => (
        <InputNumber
          min={0}
          max={100}
          step={0.5}
          style={{ width: 100 }}
          value={value}
          onChange={(v) => updateDrink(index, { abvPercent: Number(v ?? 0) })}
        />
      ),
    },
    {
      title: '份数',
      dataIndex: 'quantity',
      render: (value: number, _: DrinkInput, index: number) => (
        <InputNumber
          min={0}
          style={{ width: 90 }}
          value={value}
          onChange={(v) => updateDrink(index, { quantity: Number(v ?? 0) })}
        />
      ),
    },
    {
      title: '纯酒精 (g)',
      key: 'alcohol',
      render: (_: unknown, __: DrinkInput, index: number) =>
        'error' in (result as object)
          ? '-'
          : (result as ReturnType<typeof calculateBac>).details[index]?.alcoholGrams.toFixed(2),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, __: DrinkInput, index: number) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => setDrinks((previous) => previous.filter((_, i) => i !== index))}
        />
      ),
    },
  ];

  const activeThreshold =
    'currentBac' in result
      ? BAC_THRESHOLDS.find((threshold) => result.currentBac >= threshold.value)
      : undefined;

  return (
    <div className={styles.container}>
      <Card title="Widmark 血液酒精浓度（BAC）估算器">
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="结果仅用于安全教育与科普，个体差异（肝功能、进食、药物等）会显著影响真实 BAC，切勿据此判断能否驾驶。"
        />

        <div className={styles.fieldGrid}>
          <Form layout="vertical">
            <Form.Item label="体重 (kg)">
              <InputNumber
                style={{ width: '100%' }}
                min={20}
                max={300}
                value={weightKg}
                onChange={(v) => setWeightKg(Number(v ?? 0))}
              />
            </Form.Item>
            <Form.Item label="生理性别（决定默认 Widmark r 因子）">
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                value={gender}
                options={[
                  { value: 'male', label: `男性 (r=0.68)` },
                  { value: 'female', label: `女性 (r=0.55)` },
                ]}
                onChange={(event) => setGender(event.target.value as Gender)}
              />
            </Form.Item>
            <Form.Item label="从开始饮酒到现在经过的小时数">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={0.25}
                value={elapsedHours}
                onChange={(v) => setElapsedHours(Number(v ?? 0))}
              />
            </Form.Item>
          </Form>

          <Card size="small" title="快速添加常见饮品">
            <Space wrap className={styles.presetBar}>
              {DRINK_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  size="small"
                  onClick={() =>
                    setDrinks((previous) => [
                      ...previous,
                      { ...preset.drink, quantity: 1 },
                    ])
                  }
                >
                  {preset.label}
                </Button>
              ))}
            </Space>
            <p className={styles.hint} style={{ marginTop: 12 }}>
              也可以直接在下表修改容量、ABV 与份数，或自定义饮品名称。
            </p>
          </Card>
        </div>

        <div style={{ marginTop: 8 }}>
          <Space style={{ marginBottom: 8 }}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() =>
                setDrinks((previous) => [
                  ...previous,
                  { name: '自定义', volumeMl: 330, abvPercent: 5, quantity: 1 },
                ])
              }
            >
              添加饮品
            </Button>
            <Select
              size="middle"
              style={{ width: 220 }}
              placeholder="代谢速率（默认 0.015/h）"
              value={DEFAULT_ELIMINATION}
              disabled
              options={[{ value: DEFAULT_ELIMINATION, label: '代谢速率 0.015 BAC/小时（NHTSA 均值）' }]}
            />
          </Space>
          <Table
            size="small"
            pagination={false}
            rowKey={(_, index) => String(index)}
            columns={columns}
            dataSource={drinks}
          />
        </div>

        {'error' in result ? (
          <Alert style={{ marginTop: 16 }} type="error" showIcon message={result.error} />
        ) : (
          <>
            <div className={styles.statGrid} style={{ marginTop: 16 }}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>纯酒精总量</div>
                <div className={styles.statValue}>{result.totalAlcoholGrams.toFixed(1)} g</div>
                <div className={styles.hint}>
                  ≈ {result.totalStandardDrinks.toFixed(1)} 份标准饮品 (14g/份)
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>峰值 BAC</div>
                <div className={styles.statValue}>{result.peakBac.toFixed(4)}%</div>
                <div className={styles.hint}>{bacToPermille(result.peakBac).toFixed(3)} ‰</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>当前估算 BAC</div>
                <div className={styles.statValue}>{result.currentBac.toFixed(4)}%</div>
                <div className={styles.hint}>{bacToPermille(result.currentBac).toFixed(3)} ‰</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>代谢到 0 还需</div>
                <div className={styles.statValue}>{formatDurationHours(result.hoursToSober)}</div>
                <div className={styles.hint}>按 {result.eliminationPerHour} BAC/小时线性代谢</div>
              </div>
            </div>

            {activeThreshold ? (
              <Alert
                style={{ marginTop: 16 }}
                type="warning"
                showIcon
                message={
                  <span>
                    当前 BAC 已达到风险区间：<Tag color={activeThreshold.color}>{activeThreshold.label}</Tag>
                  </span>
                }
              />
            ) : (
              <Alert
                style={{ marginTop: 16 }}
                type="success"
                showIcon
                message="按模型估算当前 BAC 低于 0.02%，但任何含酒精摄入后都不建议驾驶。"
              />
            )}

            <Card size="small" title="BAC 阈值参考" style={{ marginTop: 16 }}>
              <Space wrap>
                {BAC_THRESHOLDS.map((threshold) => (
                  <Tag key={threshold.value} color={threshold.color}>
                    {threshold.label}
                  </Tag>
                ))}
              </Space>
            </Card>
          </>
        )}
      </Card>
    </div>
  );
};

export default BacCalculator;
