'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Input,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  MODULAR_MODES,
  CRT_INITIAL_ROWS,
  type ModularMode,
} from './constants';
import {
  chineseRemainder,
  modularInverse,
  modularPow,
  parseBigInt,
  solveLinearCongruence,
  type Congruence,
} from './utils/modular';
import styles from './index.module.css';
import { copyToClipboard } from '@/lib/utils';

/** CRT 编辑器的一行输入 */
interface CrtRow {
  key: string;
  remainder: string;
  modulus: string;
}

let rowSeed = 0;

/** 生成 CRT 行的本地唯一 key */
function nextRowKey(): string {
  rowSeed += 1;
  return `crt-${Date.now()}-${rowSeed}`;
}

/** 构造初始 CRT 行 */
function createInitialRows(): CrtRow[] {
  return CRT_INITIAL_ROWS.map((row) => ({ ...row, key: nextRowKey() }));
}

/**
 * 模运算计算器：覆盖模逆元、模幂、模线性方程与中国剩余定理，
 * 全部基于 BigInt 在浏览器本地完成，支持十进制与 0x 十六进制输入
 *
 * @returns 模运算交互界面
 */
const ModularArithmeticCalculator: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<ModularMode>('inverse');
  const [base, setBase] = React.useState<string>('3');
  const [exponent, setExponent] = React.useState<string>('10');
  const [modulus, setModulus] = React.useState<string>('7');
  const [rightHand, setRightHand] = React.useState<string>('4');
  const [crtRows, setCrtRows] = React.useState<CrtRow[]>(createInitialRows);
  const [result, setResult] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  /**
   * 按当前模式执行计算，错误以 Alert 形式展示而不抛到界面外
   */
  const handleCompute = () => {
    try {
      let output = '';
      if (mode === 'inverse') {
        const a = parseBigInt(base);
        const m = parseBigInt(modulus);
        output = `a⁻¹ mod m = ${modularInverse(a, m).toString()}`;
      } else if (mode === 'pow') {
        const a = parseBigInt(base);
        const e = parseBigInt(exponent);
        const m = parseBigInt(modulus);
        output = `a^e mod m = ${modularPow(a, e, m).toString()}`;
      } else if (mode === 'linear') {
        const a = parseBigInt(base);
        const b = parseBigInt(rightHand);
        const m = parseBigInt(modulus);
        const solved = solveLinearCongruence(a, b, m);
        output = [
          `解的个数：${solved.count.toString()}（gcd(a, m)）`,
          `最小非负特解：x ≡ ${solved.particular.toString()} (mod ${solved.step.toString()})`,
          `模 ${solved.modulus.toString()} 下的全部剩余类解：${solved.solutions
            .map((item) => item.toString())
            .join(', ')}`,
        ].join('\n');
      } else {
        const congruences: Congruence[] = crtRows.map((row) => ({
          remainder: parseBigInt(row.remainder),
          modulus: parseBigInt(row.modulus),
        }));
        const crt = chineseRemainder(congruences);
        output = `x ≡ ${crt.remainder.toString()} (mod ${crt.modulus.toString()})`;
      }
      setResult(output);
      setError(null);
    } catch (caught) {
      setResult('');
      setError(caught instanceof Error ? caught.message : '计算失败');
    }
  };

  /**
   * 复制当前结果文本
   */
  const handleCopy = async () => {
    if (!result) {
      message.warning('当前没有可复制的结果');
      return;
    }
    await copyToClipboard(result);
    message.success('复制成功');
  };

  /** 更新指定 CRT 行的字段 */
  const updateRow = (key: string, field: keyof Omit<CrtRow, 'key'>, value: string) => {
    setCrtRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  };

  /** 追加一行 CRT 方程 */
  const addRow = () => {
    setCrtRows((rows) => [
      ...rows,
      { key: nextRowKey(), remainder: '0', modulus: '11' },
    ]);
  };

  /** 删除指定 CRT 行（至少保留两行） */
  const removeRow = (key: string) => {
    setCrtRows((rows) => (rows.length <= 2 ? rows : rows.filter((row) => row.key !== key)));
  };

  const showExponent = mode === 'pow';
  const showRightHand = mode === 'linear';
  const showCrt = mode === 'crt';

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap>
          <span>计算模式：</span>
          <Select
            value={mode}
            onChange={(value: ModularMode) => setMode(value)}
            options={MODULAR_MODES.map((item) => ({
              label: item.labelZh,
              value: item.value,
            }))}
            style={{ width: 240 }}
          />
        </Space>
        <Button type="primary" onClick={handleCompute}>
          计算
        </Button>
      </div>

      {!showCrt && (
        <Card className={styles.card} title="输入参数（支持十进制与 0x 十六进制）">
          <Space wrap size="middle" className={styles.fieldRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{showExponent ? '底数 a' : showRightHand ? '系数 a' : '底数 a'}</span>
              <Input value={base} onChange={(event) => setBase(event.target.value)} className={styles.numberInput} />
            </label>
            {showExponent && (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>指数 e（可为负）</span>
                <Input value={exponent} onChange={(event) => setExponent(event.target.value)} className={styles.numberInput} />
              </label>
            )}
            {showRightHand && (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>右端项 b</span>
                <Input value={rightHand} onChange={(event) => setRightHand(event.target.value)} className={styles.numberInput} />
              </label>
            )}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>模数 m（正整数）</span>
              <Input value={modulus} onChange={(event) => setModulus(event.target.value)} className={styles.numberInput} />
            </label>
          </Space>
        </Card>
      )}

      {showCrt && (
        <Card
          className={styles.card}
          title="同余方程组（每行：x ≡ remainder (mod modulus)）"
          extra={
            <Button icon={<PlusOutlined />} onClick={addRow}>
              添加方程
            </Button>
          }
        >
          <Table
            size="small"
            pagination={false}
            rowKey="key"
            dataSource={crtRows}
            columns={[
              {
                title: '余数 remainder',
                dataIndex: 'remainder',
                render: (_: unknown, row: CrtRow) => (
                  <Input
                    value={row.remainder}
                    onChange={(event) => updateRow(row.key, 'remainder', event.target.value)}
                  />
                ),
              },
              {
                title: '模数 modulus',
                dataIndex: 'modulus',
                render: (_: unknown, row: CrtRow) => (
                  <Input
                    value={row.modulus}
                    onChange={(event) => updateRow(row.key, 'modulus', event.target.value)}
                  />
                ),
              },
              {
                title: '操作',
                width: 90,
                render: (_: unknown, row: CrtRow) => (
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    disabled={crtRows.length <= 2}
                    onClick={() => removeRow(row.key)}
                  />
                ),
              },
            ]}
          />
        </Card>
      )}

      <Card
        className={styles.card}
        title="计算结果"
        extra={
          <Button icon={<CopyOutlined />} onClick={handleCopy} disabled={!result}>
            复制结果
          </Button>
        }
      >
        {error ? (
          <Alert type="error" showIcon message="计算失败" description={error} />
        ) : result ? (
          <pre className={styles.result}>
            {result.split('\n').map((line, index) => (
              <div key={index} className={styles.resultLine}>
                <Tag color="blue" className={styles.lineTag}>
                  {index + 1}
                </Tag>
                {line}
              </div>
            ))}
          </pre>
        ) : (
          <Alert type="info" showIcon message="填写参数后点击「计算」查看结果" />
        )}
      </Card>
    </div>
  );
};

export default ModularArithmeticCalculator;
