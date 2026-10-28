'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, InputNumber, Radio, Space, Statistic } from 'antd';
import { ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import { calculateVat, VatDirectionEnum } from './utils/vat';
import { DEFAULT_AMOUNT, DEFAULT_RATE, DIRECTION_OPTIONS, PRESET_RATES } from './constants';
import styles from './index.module.css';

/**
 * 增值税计算器，支持不含税金额与含税金额两个方向互算，
 * 提供 13% / 9% / 6% / 3% / 1% 常用档位与自定义税率，
 * 金额按两位小数四舍五入，全部运算在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入（作为金额）
 * @returns 增值税计算交互界面
 */
const VatCalculator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<VatDirectionEnum>(
    VatDirectionEnum.EXCLUSIVE_TO_INCLUSIVE,
  );
  const [amountText, setAmountText] = React.useState<string>(defaultInput || DEFAULT_AMOUNT);
  const [rate, setRate] = React.useState<number | null>(DEFAULT_RATE);

  const result = React.useMemo(() => {
    const amount = Number.parseFloat(amountText);
    if (amountText.trim() === '' || Number.isNaN(amount)) {
      return null;
    }
    if (rate === null) {
      return { amountExcludingVat: 0, taxAmount: 0, amountIncludingVat: 0, error: '请输入税率' };
    }
    return calculateVat(direction, amount, rate);
  }, [direction, amountText, rate]);

  const isForward = direction === VatDirectionEnum.EXCLUSIVE_TO_INCLUSIVE;

  return (
    <div className={styles.container}>
      <Card title="增值税计算器（含税 / 不含税互算）">
        <div className={styles.toolbar}>
          <Radio.Group
            value={direction}
            onChange={(event) => setDirection(event.target.value as VatDirectionEnum)}
            optionType="button"
            buttonStyle="solid"
            options={DIRECTION_OPTIONS}
          />
        </div>

        <div className={styles.formRow}>
          <span className={styles.label}>{isForward ? '不含税金额（元）：' : '含税金额（元）：'}</span>
          <Input
            value={amountText}
            onChange={(event) => setAmountText(event.target.value)}
            placeholder="请输入金额"
            style={{ width: 200 }}
            inputMode="decimal"
          />
        </div>

        <div className={styles.formRow}>
          <span className={styles.label}>税率：</span>
          <Space wrap>
            {PRESET_RATES.map((preset) => (
              <Button
                key={preset}
                type={rate === preset ? 'primary' : 'default'}
                onClick={() => setRate(preset)}
              >
                {preset}%
              </Button>
            ))}
            <InputNumber
              value={rate}
              onChange={(value) => setRate(value)}
              min={0}
              max={99.999}
              step={0.5}
              addonAfter="%"
              style={{ width: 130 }}
              placeholder="自定义税率"
            />
          </Space>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { setAmountText(DEFAULT_AMOUNT); setRate(DEFAULT_RATE); }}>
            载入示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setAmountText('')}>
            清空
          </Button>
        </Space>
      </Card>

      <Card title="计算结果">
        {result?.error ? (
          <Alert type="error" showIcon message="无法计算" description={result.error} />
        ) : result ? (
          <div className={styles.resultGrid}>
            <Statistic
              title="不含税金额（元）"
              value={result.amountExcludingVat}
              precision={2}
            />
            <Statistic title="税额（元）" value={result.taxAmount} precision={2} />
            <Statistic
              title="含税合计（元）"
              value={result.amountIncludingVat}
              precision={2}
            />
          </div>
        ) : (
          <Alert type="info" showIcon message="请输入有效金额与税率" />
        )}
        <div className={styles.hint}>
          计算公式：税额 = 不含税金额 × 税率；含税金额 = 不含税金额 × (1 + 税率)；反向拆分时不含税金额 = 含税金额 ÷ (1 +
          税率)，金额均四舍五入保留两位小数。适用于开票、报价与报销核对，不作为法定计税依据。
        </div>
      </Card>
    </div>
  );
};

export default VatCalculator;
