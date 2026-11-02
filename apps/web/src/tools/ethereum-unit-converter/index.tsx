'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Select, Space, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  ETH_UNITS,
  eip1559GasFee,
  fromWei,
  groupThousands,
  legacyGasFee,
  toWei,
} from './utils/ethUnits';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface UnitRow {
  key: string;
  name: string;
  value: string;
  factor: number;
  description: string;
}

type ConvertResult = { error: string } | { rows: UnitRow[]; weiText: string };

type LegacyResult =
  | { error: string }
  | { wei: string; gwei: string; eth: string };

type Eip1559Result =
  | { error: string }
  | ReturnType<typeof eip1559GasFee>;

const unitOptions = ETH_UNITS.map((u) => ({
  value: u.name,
  label: `${u.name}（10^${u.factor} Wei）`,
}));

const numInputProps = {
  spellCheck: false,
  inputMode: 'decimal' as const,
  className: styles.editor,
};

const EthereumUnitConverter: React.FC<ToolComponentProps> = () => {
  // —— 单位换算 ——
  const [amount, setAmount] = React.useState('1');
  const [fromUnit, setFromUnit] = React.useState('ETH');

  // —— Legacy Gas ——
  const [gasUsed, setGasUsed] = React.useState('21000');
  const [gasPrice, setGasPrice] = React.useState('20');

  // —— EIP-1559 ——
  const [baseFee, setBaseFee] = React.useState('20');
  const [priorityFee, setPriorityFee] = React.useState('2');
  const [maxFee, setMaxFee] = React.useState('40');
  const [eipGasUsed, setEipGasUsed] = React.useState('21000');
  const [gasLimit, setGasLimit] = React.useState('21000');

  const convertResult: ConvertResult = React.useMemo(() => {
    try {
      const unit = ETH_UNITS.find((u) => u.name === fromUnit) ?? ETH_UNITS[0]!;
      const wei = toWei(amount, unit);
      const rows: UnitRow[] = ETH_UNITS.map((u) => ({
        key: u.name,
        name: u.name,
        value: groupThousands(fromWei(wei, u)),
        factor: u.factor,
        description: u.description,
      }));
      return { rows, weiText: groupThousands(wei.toString()) };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }, [amount, fromUnit]);

  const legacyResult: LegacyResult = React.useMemo(() => {
    try {
      const r = legacyGasFee(gasUsed, gasPrice);
      return {
        wei: groupThousands(r.wei.toString()),
        gwei: groupThousands(r.gwei),
        eth: r.eth,
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }, [gasUsed, gasPrice]);

  const eipResult: Eip1559Result = React.useMemo(() => {
    try {
      return eip1559GasFee({
        baseFeeGwei: baseFee,
        priorityFeeGwei: priorityFee,
        maxFeeGwei: maxFee,
        gasUsedText: eipGasUsed,
        gasLimitText: gasLimit,
      });
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }, [baseFee, priorityFee, maxFee, eipGasUsed, gasLimit]);

  const unitColumns = [
    { title: '单位', dataIndex: 'name', key: 'name', width: 120, render: (v: string) => <strong>{v}</strong> },
    {
      title: '折合金额',
      dataIndex: 'value',
      key: 'value',
      render: (v: string) => <code className={styles.mono}>{v}</code>,
    },
    { title: '说明', dataIndex: 'description', key: 'description' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Tag color="gold">BigInt 高精度</Tag>
        <Tag color="blue">Wei · Gwei · ETH</Tag>
        <Tag>Legacy / EIP-1559 Gas</Tag>
        <span className={styles.hint}>
          全部运算在本地以整数完成，Wei 级金额不经过浮点、不丢精度
        </span>
      </div>

      {/* 单位换算 */}
      <Card className={styles.card} title="单位换算">
        <Space direction="vertical" size={12} className={styles.fullWidth}>
          <div className={styles.inputRow}>
            <Input
              {...numInputProps}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="输入金额，如 1、0.00042、1_000"
            />
            <Select
              className={styles.unitSelect}
              value={fromUnit}
              options={unitOptions}
              onChange={(v) => setFromUnit(v)}
            />
            <Button
              onClick={() => {
                setAmount('1');
                setFromUnit('ETH');
              }}
            >
              重置为 1 ETH
            </Button>
          </div>
          {'error' in convertResult ? (
            <Alert type="error" showIcon message={convertResult.error} />
          ) : (
            <>
              <div className={styles.weiBar}>
                <span className={styles.metricLabel}>Wei 原子值</span>
                <code className={styles.bigMono}>{convertResult.weiText}</code>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    copyToClipboard(convertResult.weiText.replace(/,/g, ''));
                    message.success('已复制 Wei 金额');
                  }}
                >
                  复制
                </Button>
              </div>
              <Table
                size="small"
                pagination={false}
                columns={unitColumns}
                dataSource={convertResult.rows}
              />
            </>
          )}
        </Space>
      </Card>

      {/* Legacy Gas */}
      <Card className={styles.card} title="Legacy Gas 费用（gasUsed × gasPrice）">
        <Space direction="vertical" size={12} className={styles.fullWidth}>
          <div className={styles.inputRow}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Gas 用量</span>
              <Input
                {...numInputProps}
                value={gasUsed}
                onChange={(e) => setGasUsed(e.target.value)}
                placeholder="21000"
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Gas Price（Gwei）</span>
              <Input
                {...numInputProps}
                value={gasPrice}
                onChange={(e) => setGasPrice(e.target.value)}
                placeholder="20"
              />
            </div>
          </div>
          {'error' in legacyResult ? (
            <Alert type="error" showIcon message={legacyResult.error} />
          ) : (
            <div className={styles.resultGrid}>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>费用（Wei）</div>
                <code className={styles.bigMono}>{legacyResult.wei}</code>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>费用（Gwei）</div>
                <code className={styles.bigMono}>{legacyResult.gwei}</code>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>费用（ETH）</div>
                <code className={styles.bigMono}>{legacyResult.eth}</code>
              </div>
            </div>
          )}
          <span className={styles.hint}>
            标准转账：21000 gas × 20 Gwei = 420000 Gwei = 0.00042 ETH
          </span>
        </Space>
      </Card>

      {/* EIP-1559 */}
      <Card
        className={styles.card}
        title="EIP-1559 Gas 费用估算（base fee 被燃烧，tip 归矿工）"
      >
        <Space direction="vertical" size={12} className={styles.fullWidth}>
          <div className={styles.inputRow}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Base Fee（Gwei）</span>
              <Input
                {...numInputProps}
                value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Priority Fee / Tip（Gwei）</span>
              <Input
                {...numInputProps}
                value={priorityFee}
                onChange={(e) => setPriorityFee(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Max Fee（Gwei）</span>
              <Input
                {...numInputProps}
                value={maxFee}
                onChange={(e) => setMaxFee(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.inputRow}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Gas 已用量</span>
              <Input
                {...numInputProps}
                value={eipGasUsed}
                onChange={(e) => setEipGasUsed(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Gas 上限（Limit）</span>
              <Input
                {...numInputProps}
                value={gasLimit}
                onChange={(e) => setGasLimit(e.target.value)}
              />
            </div>
          </div>
          {'error' in eipResult ? (
            <Alert type="error" showIcon message={eipResult.error} />
          ) : (
            <>
              {eipResult.warning ? (
                <Alert type="warning" showIcon message={eipResult.warning} />
              ) : null}
              <div className={styles.resultGrid}>
                <div className={styles.metric}>
                  <div className={styles.metricLabel}>优先费 Tip（归矿工）</div>
                  <code className={styles.bigMono}>{eipResult.priorityEth} ETH</code>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricLabel}>基础费 Base（被燃烧）</div>
                  <code className={styles.bigMono}>{eipResult.baseEth} ETH</code>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricLabel}>实际总费用（按已用量）</div>
                  <code className={styles.bigMono}>{eipResult.totalEth} ETH</code>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricLabel}>授权上限（Limit × Max Fee）</div>
                  <code className={styles.bigMono}>{eipResult.maxEth} ETH</code>
                </div>
              </div>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default EthereumUnitConverter;
