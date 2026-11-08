'use client';

import React from 'react';
import { Alert, Button, Card, Form, InputNumber, Space, Table, Tag } from 'antd';
import type { ToolComponentProps } from '../loaders';
import {
  calculateOvertimePay,
  roundCurrency,
  MONTHLY_PAY_DAYS,
  WORK_HOURS_PER_DAY,
  type OvertimeHours,
} from './utils/overtime';
import { OVERTIME_CATEGORIES, BASE_PRESETS } from './constants';
import styles from './index.module.css';

/**
 * 中国大陆劳动法加班工资计算器：按月工资基数与三类加班小时数，
 * 依 21.75 月计薪天数、8 小时工作制与 150%/200%/300% 倍率分项核算，全部本地运算。
 */
const OvertimePayCalculator: React.FC<ToolComponentProps> = () => {
  const [monthlyBase, setMonthlyBase] = React.useState(8000);
  const [hours, setHours] = React.useState<OvertimeHours>({
    workday: 10,
    restDay: 8,
    statutoryHoliday: 4,
  });

  const result = React.useMemo(() => {
    try {
      return calculateOvertimePay(monthlyBase, hours);
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [monthlyBase, hours]);

  const columns = [
    {
      title: '加班类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: keyof OvertimeHours) => {
        const config = OVERTIME_CATEGORIES.find((item) => item.key === type);
        return (
          <Space direction="vertical" size={0}>
            <span>{config?.label}</span>
            <Tag color={config?.color}>倍率 {config?.rateText}</Tag>
          </Space>
        );
      },
    },
    {
      title: '加班小时',
      dataIndex: 'hours',
      key: 'hours',
      render: (value: number, record: { type: keyof OvertimeHours }) => (
        <InputNumber
          min={0}
          step={0.5}
          style={{ width: 120 }}
          value={value}
          onChange={(v) =>
            setHours((previous) => ({ ...previous, [record.type]: Number(v ?? 0) }))
          }
        />
      ),
    },
    {
      title: '法定依据',
      dataIndex: 'type',
      key: 'basis',
      render: (type: keyof OvertimeHours) => (
        <span className={styles.hint}>
          {OVERTIME_CATEGORIES.find((item) => item.key === type)?.legalBasis}
        </span>
      ),
    },
    {
      title: '加班费（元）',
      dataIndex: 'pay',
      key: 'pay',
      align: 'right' as const,
      render: (value: number) => <span className={styles.mono}>{roundCurrency(value).toFixed(2)}</span>,
    },
  ];

  return (
    <div className={styles.container}>
      <Card title="加班工资计算器（中国大陆劳动法）">
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="依据《中华人民共和国劳动法》第四十四条与劳社部发〔2008〕3 号：月计薪天数 21.75 天，日工作 8 小时。结果按法定最低倍率估算，劳动合同约定更高标准的从其约定。"
        />

        <Form layout="vertical">
          <Form.Item label="月工资计薪基数（元/月）">
            <InputNumber
              style={{ width: 240 }}
              min={0}
              step={100}
              value={monthlyBase}
              onChange={(v) => setMonthlyBase(Number(v ?? 0))}
              addonAfter="元"
            />
            <Space wrap style={{ marginLeft: 12 }}>
              {BASE_PRESETS.map((preset) => (
                <Button key={preset} size="small" onClick={() => setMonthlyBase(preset)}>
                  {preset}
                </Button>
              ))}
            </Space>
          </Form.Item>
        </Form>

        {'error' in result ? (
          <Alert type="error" showIcon message={result.error} />
        ) : (
          <>
            <div className={styles.fieldGrid} style={{ marginBottom: 16 }}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>折算日工资</div>
                <div className={`${styles.statValue} ${styles.mono}`}>{roundCurrency(result.dailyWage).toFixed(2)} 元</div>
                <div className={styles.hint}>月工资 ÷ {MONTHLY_PAY_DAYS} 天</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>折算小时工资</div>
                <div className={`${styles.statValue} ${styles.mono}`}>{roundCurrency(result.hourlyWage).toFixed(2)} 元</div>
                <div className={styles.hint}>日工资 ÷ {WORK_HOURS_PER_DAY} 小时</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>加班总时长</div>
                <div className={`${styles.statValue} ${styles.mono}`}>{result.totalHours} 小时</div>
                <div className={styles.hint}>三类加班合计</div>
              </div>
            </div>

            <Table
              size="small"
              pagination={false}
              rowKey="type"
              columns={columns}
              dataSource={result.breakdown}
            />

            <div className={styles.statGrid} style={{ marginTop: 16 }}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>加班费合计</div>
                <div className={`${styles.statValue} ${styles.mono}`}>
                  {roundCurrency(result.totalOvertimePay).toFixed(2)} 元
                </div>
              </div>
              <div className={`${styles.statCard} ${styles.highlight}`}>
                <div className={styles.statLabel}>当月应发总额（基数 + 加班费）</div>
                <div className={`${styles.statValue} ${styles.mono}`}>{roundCurrency(result.grossPay).toFixed(2)} 元</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>加班费占基数比例</div>
                <div className={`${styles.statValue} ${styles.mono}`}>
                  {result.monthlyBase > 0
                    ? `${((result.totalOvertimePay / result.monthlyBase) * 100).toFixed(2)}%`
                    : '—'}
                </div>
              </div>
            </div>

            <Alert
              style={{ marginTop: 16 }}
              type="warning"
              showIcon
              message="休息日加班如用人单位安排了同等时间补休，则无需支付 200% 加班费；法定节假日加班不得以补休替代 300% 加班工资。"
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default OvertimePayCalculator;
