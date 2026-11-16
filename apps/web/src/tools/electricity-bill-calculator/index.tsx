'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  message,
} from 'antd';
import { DeleteOutlined, PlusOutlined, CopyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  createDefaultAppliance,
  DEFAULT_APPLIANCES,
  DEFAULT_FLAT_PRICE,
  DEFAULT_PEAK_PRICE,
  DEFAULT_PEAK_RATIO,
  DEFAULT_VALLEY_PRICE,
  LIMITS,
  type ApplianceInput,
  type PriceMode,
} from './constants';
import {
  calculateBill,
  round,
  annualKwhToAveragePower,
  type ApplianceResult,
  type PriceConfig,
} from './utils/bill';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 家庭用电量与电费计算器
 *
 * 多电器功率 × 时长 × 天数 × 数量 → 日 / 月 / 年用电量与电费，
 * 支持单一电价与峰谷电价、能效反推与耗电排行，全部在浏览器本地估算。
 */
const ElectricityBillCalculator: React.FC<ToolComponentProps> = () => {
  const [appliances, setAppliances] = React.useState<ApplianceInput[]>(DEFAULT_APPLIANCES);
  const [priceMode, setPriceMode] = React.useState<PriceMode>('flat');
  const [flatPrice, setFlatPrice] = React.useState<number | null>(DEFAULT_FLAT_PRICE);
  const [peakPrice, setPeakPrice] = React.useState<number | null>(DEFAULT_PEAK_PRICE);
  const [valleyPrice, setValleyPrice] = React.useState<number | null>(DEFAULT_VALLEY_PRICE);
  const [peakRatio, setPeakRatio] = React.useState<number | null>(DEFAULT_PEAK_RATIO);
  const [annualKwh, setAnnualKwh] = React.useState<number | null>(365);

  const priceConfig: PriceConfig = React.useMemo(
    () => ({ mode: priceMode, flatPrice, peakPrice, valleyPrice, peakRatio }),
    [priceMode, flatPrice, peakPrice, valleyPrice, peakRatio],
  );

  const result = React.useMemo(() => calculateBill(appliances, priceConfig), [appliances, priceConfig]);

  const reverse = React.useMemo(() => annualKwhToAveragePower(annualKwh), [annualKwh]);

  const updateRow = (id: string, patch: Partial<ApplianceInput>) => {
    setAppliances((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    setAppliances((rows) => [
      ...rows,
      createDefaultAppliance({ name: `电器 ${rows.length + 1}`, hoursPerDay: 1, daysPerMonth: 30 }),
    ]);
  };

  const removeRow = (id: string) => {
    setAppliances((rows) => rows.filter((row) => row.id !== id));
  };

  const handleCopySummary = () => {
    if (!result.summary) {
      message.error('结果存在错误，无法复制');
      return;
    }
    const lines = [
      '家庭用电估算汇总',
      ...result.rows.map(
        (row) =>
          `${row.name || '未命名'}：月 ${round(row.monthlyKwh, 3)} kWh / ${round(row.monthlyCost, 2)} 元`,
      ),
      `合计：月 ${round(result.summary.monthlyKwh, 3)} kWh / ${round(result.summary.monthlyCost, 2)} 元`,
      `年度：${round(result.summary.yearlyKwh, 3)} kWh / ${round(result.summary.yearlyCost, 2)} 元`,
    ];
    copyToClipboard(lines.join('\n'));
    message.success('已复制汇总');
  };

  const columns: ColumnsType<ApplianceInput> = [
    {
      title: '电器名称',
      dataIndex: 'name',
      width: 140,
      render: (_, row) => (
        <Input
          value={row.name}
          placeholder="如：空调"
          onChange={(e) => updateRow(row.id, { name: e.target.value })}
        />
      ),
    },
    {
      title: '额定功率',
      dataIndex: 'power',
      width: 190,
      render: (_, row) => (
        <InputNumber
          addonAfter={
            <Select
              size="small"
              variant="borderless"
              value={row.powerUnit}
              style={{ width: 56 }}
              onChange={(value) => updateRow(row.id, { powerUnit: value })}
              options={[
                { value: 'W', label: 'W' },
                { value: 'kW', label: 'kW' },
              ]}
            />
          }
          min={0}
          max={LIMITS.maxPowerW}
          value={row.power}
          onChange={(value) => updateRow(row.id, { power: value })}
          style={{ width: 140 }}
        />
      ),
    },
    {
      title: '每日时长 (h)',
      dataIndex: 'hoursPerDay',
      width: 130,
      render: (_, row) => (
        <InputNumber
          min={0}
          max={24}
          step={0.5}
          value={row.hoursPerDay}
          onChange={(value) => updateRow(row.id, { hoursPerDay: value })}
          style={{ width: 110 }}
        />
      ),
    },
    {
      title: '每月天数',
      dataIndex: 'daysPerMonth',
      width: 120,
      render: (_, row) => (
        <InputNumber
          min={0}
          max={31}
          value={row.daysPerMonth}
          onChange={(value) => updateRow(row.id, { daysPerMonth: value })}
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 100,
      render: (_, row) => (
        <InputNumber
          min={1}
          max={100}
          value={row.quantity}
          onChange={(value) => updateRow(row.id, { quantity: value })}
          style={{ width: 80 }}
        />
      ),
    },
    {
      title: '月用电 (kWh)',
      width: 130,
      render: (_, row) => {
        const computed = result.rows.find((item) => item.id === row.id);
        return computed ? round(computed.monthlyKwh, 3).toFixed(3) : '—';
      },
    },
    {
      title: '月电费 (元)',
      width: 120,
      render: (_, row) => {
        const computed = result.rows.find((item) => item.id === row.id);
        return computed ? round(computed.monthlyCost, 2).toFixed(2) : '—';
      },
    },
    {
      title: '操作',
      width: 70,
      render: (_, row) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => removeRow(row.id)} />
      ),
    },
  ];

  const ranking: ApplianceResult[] = React.useMemo(
    () => [...result.rows].sort((a, b) => b.monthlyCost - a.monthlyCost),
    [result.rows],
  );
  const maxRankingCost = ranking.length > 0 ? (ranking[0]?.monthlyCost ?? 0) : 0;

  return (
    <div className={styles.container}>
      <Card
        title="电器清单"
        extra={
          <Space>
            <Button type="primary" ghost icon={<PlusOutlined />} onClick={addRow}>
              添加电器
            </Button>
            <Button icon={<CopyOutlined />} onClick={handleCopySummary}>
              复制汇总
            </Button>
          </Space>
        }
      >
        <Table<ApplianceInput>
          rowKey="id"
          columns={columns}
          dataSource={appliances}
          pagination={false}
          size="small"
          scroll={{ x: 980 }}
          locale={{ emptyText: <Empty description="暂无电器，请点击「添加电器」" /> }}
        />
      </Card>

      {result.errors.length > 0 ? (
        <Alert
          type="error"
          showIcon
          message="输入有误，请修正后查看结果"
          description={
            <ul className={styles.errorList}>
              {result.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          }
        />
      ) : null}

      <Card title="电价设置">
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={priceMode}
          options={[
            { value: 'flat', label: '单一电价' },
            { value: 'tou', label: '峰谷电价' },
          ]}
          onChange={(e) => setPriceMode(e.target.value as PriceMode)}
        />
        <div className={styles.priceFields}>
          {priceMode === 'flat' ? (
            <label className={styles.priceField}>
              电价（元/kWh）
              <InputNumber
                min={0}
                max={10}
                step={0.05}
                value={flatPrice}
                onChange={setFlatPrice}
                addonAfter="元"
              />
            </label>
          ) : (
            <>
              <label className={styles.priceField}>
                峰价（元/kWh）
                <InputNumber min={0} max={10} step={0.05} value={peakPrice} onChange={setPeakPrice} addonAfter="元" />
              </label>
              <label className={styles.priceField}>
                谷价（元/kWh）
                <InputNumber min={0} max={10} step={0.05} value={valleyPrice} onChange={setValleyPrice} addonAfter="元" />
              </label>
              <label className={styles.priceField}>
                峰段用电占比
                <InputNumber min={0} max={100} value={peakRatio} onChange={setPeakRatio} addonAfter="%" />
              </label>
            </>
          )}
        </div>
        {result.summary?.zeroPrice ? (
          <Alert className={styles.inlineAlert} type="warning" showIcon message="当前电价为 0，所有费用结果均为 0 元" />
        ) : null}
      </Card>

      {result.summary ? (
        <Card title="合计面板（估算值）">
          <Row gutter={[16, 16]}>
            <Col xs={12} md={8}>
              <Statistic title="月度总用电" value={round(result.summary.monthlyKwh, 3)} suffix="kWh" />
            </Col>
            <Col xs={12} md={8}>
              <Statistic title="月度总电费" value={round(result.summary.monthlyCost, 2)} suffix="元" />
            </Col>
            <Col xs={12} md={8}>
              <Statistic title="年度总用电" value={round(result.summary.yearlyKwh, 3)} suffix="kWh" />
            </Col>
            <Col xs={12} md={8}>
              <Statistic title="年度总电费" value={round(result.summary.yearlyCost, 2)} suffix="元" />
            </Col>
            <Col xs={12} md={8}>
              <Statistic title="平均每日电费" value={round(result.summary.averageDailyCost, 2)} suffix="元" />
            </Col>
            <Col xs={12} md={8}>
              <Statistic title="月度平均功率" value={round(result.summary.averagePowerW, 1)} suffix="W" />
            </Col>
          </Row>
          <p className={styles.assumption}>
            年度值按月度 × 12 估算（不区分大小月）；结果不含阶梯加价、基本电费、税费与待机功耗。
          </p>
        </Card>
      ) : null}

      {ranking.length > 0 ? (
        <Card title="电器耗电排行（按月电费）">
          <div className={styles.ranking}>
            {ranking.map((row) => (
              <div key={row.id} className={styles.rankRow}>
                <span className={styles.rankName}>{row.name || '未命名'}</span>
                <div className={styles.rankBarTrack}>
                  <div
                    className={styles.rankBar}
                    style={{ width: `${maxRankingCost > 0 ? (row.monthlyCost / maxRankingCost) * 100 : 0}%` }}
                  />
                </div>
                <span className={styles.rankValue}>
                  {round(row.monthlyCost, 2)} 元 · 占比 {(row.monthlyShare * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card title="能效反推：年耗电量 → 平均功率">
        <Space wrap align="center">
          <label className={styles.priceField}>
            年耗电量
            <InputNumber
              min={0}
              max={LIMITS.maxAnnualKwh}
              value={annualKwh}
              onChange={setAnnualKwh}
              addonAfter="kWh/年"
            />
          </label>
          {reverse.error ? (
            <Tag color="error">{reverse.error}</Tag>
          ) : (
            <Tag color="green">平均功率 {round(reverse.powerW as number, 2)} W（365×24 小时）</Tag>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default ElectricityBillCalculator;
