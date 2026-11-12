'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ToolComponentProps } from '../loaders';
import {
  balanceEquation,
  molesFromMass,
  parseFormula,
  stoichiometryFromMoles,
  type BalanceResult,
  type StoichRow,
} from './utils/chemistry';
import styles from './index.module.css';

const PRESETS = [
  'Fe + O2 -> Fe2O3',
  'C2H6 + O2 -> CO2 + H2O',
  'Al + HCl -> AlCl3 + H2',
  'Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O',
  'CuSO4·5H2O -> CuSO4 + H2O',
];

interface StoichTableRow extends StoichRow {
  key: string;
  side: '反应物' | '生成物';
}

/**
 * 化学方程式配平器与摩尔计量计算器。
 * Tab 1 用分数高斯消元求最小正整数系数；Tab 2 基于配平结果做物质的量/质量/标况体积换算。
 * 全部解析与计算均在浏览器本地完成。
 */
export default function ChemicalEquationBalancer(_props: ToolComponentProps) {
  const [equation, setEquation] = useState('Fe + O2 -> Fe2O3');
  const [referenceIndex, setReferenceIndex] = useState(0);
  const [inputMode, setInputMode] = useState<'moles' | 'mass'>('moles');
  const [inputValue, setInputValue] = useState<number>(1);

  const result: BalanceResult = useMemo(() => balanceEquation(equation), [equation]);

  const compositionPreview = useMemo(() => {
    if (!result.ok || !result.species) {
      return [];
    }
    return result.species.map((species) => ({
      species,
      parsed: parseFormula(species),
    }));
  }, [result]);

  const stoichRows: StoichTableRow[] = useMemo(() => {
    if (!result.ok || !result.species || !result.coefficients) {
      return [];
    }
    const safeIndex = Math.min(referenceIndex, result.species.length - 1);
    const referenceMolarMass = result.molarMasses?.[safeIndex] ?? 0;
    const moles =
      inputMode === 'moles'
        ? inputValue
        : molesFromMass(inputValue, referenceMolarMass);
    if (!Number.isFinite(moles) || moles < 0) {
      return [];
    }
    return stoichiometryFromMoles(result, safeIndex, moles).map((row, index) => ({
      ...row,
      key: row.species,
      side: index < (result.reactantCount ?? 0) ? '反应物' : '生成物',
    }));
  }, [result, referenceIndex, inputMode, inputValue]);

  const stoichColumns: ColumnsType<StoichTableRow> = [
    {
      title: '侧别',
      dataIndex: 'side',
      width: 90,
      render: (side: StoichTableRow['side']) => (
        <Tag color={side === '反应物' ? 'blue' : 'green'}>{side}</Tag>
      ),
    },
    { title: '物种', dataIndex: 'species', className: styles.mono },
    { title: '系数', dataIndex: 'coefficient', width: 80, align: 'center' },
    {
      title: '摩尔质量 (g/mol)',
      dataIndex: 'molarMass',
      width: 140,
      align: 'right',
      render: (value: number) => value.toFixed(3),
    },
    {
      title: '物质的量 (mol)',
      dataIndex: 'moles',
      width: 140,
      align: 'right',
      render: (value: number) => value.toPrecision(5),
    },
    {
      title: '质量 (g)',
      dataIndex: 'mass',
      width: 140,
      align: 'right',
      render: (value: number) => value.toPrecision(5),
    },
    {
      title: '标况气体体积 (L)',
      dataIndex: 'gasVolume',
      width: 160,
      align: 'right',
      render: (value: number) => value.toPrecision(5),
    },
  ];

  return (
    <div className={styles.container}>
      <Alert
        type="info"
        showIcon
        message="化学方程式配平器与摩尔计量计算器"
        description="支持括号嵌套（Ca(OH)2）、水合点（CuSO4·5H2O）与 Unicode 箭头；配平采用 BigInt 分数高斯-约当消元，保证最小正整数系数。所有计算均在本地完成。"
      />

      <Tabs
        defaultActiveKey="balance"
        items={[
          {
            key: 'balance',
            label: '方程式配平',
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Card size="small" title="输入未配平方程式">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Input
                      className={styles.equationInput}
                      value={equation}
                      onChange={(event) => setEquation(event.target.value)}
                      placeholder="例如：Fe + O2 -> Fe2O3"
                      status={result.ok ? '' : 'error'}
                    />
                    <div className={styles.presetRow}>
                      {PRESETS.map((preset) => (
                        <Tag
                          key={preset}
                          color="geekblue"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setEquation(preset)}
                        >
                          {preset}
                        </Tag>
                      ))}
                    </div>
                  </Space>
                </Card>

                {!result.ok && (
                  <Alert type="error" showIcon message="无法配平" description={result.error} />
                )}

                {result.ok && result.balancedEquation && (
                  <>
                    <div className={styles.resultBox}>
                      <Typography.Text type="secondary">配平结果（最小正整数系数）</Typography.Text>
                      <div className={styles.balancedEquation}>{result.balancedEquation}</div>
                    </div>

                    <Card size="small" title="物种系数与元素组成">
                      <Space wrap size="large">
                        {compositionPreview.map(({ species, parsed }) => {
                          const index = result.species?.indexOf(species) ?? -1;
                          const coefficient = result.coefficients?.[index] ?? 1;
                          return (
                            <Card key={species} size="small" type="inner" style={{ minWidth: 200 }}>
                              <Space direction="vertical" size={4}>
                                <Space>
                                  <Tag color="blue" className={styles.coefficientTag}>
                                    ×{coefficient}
                                  </Tag>
                                  <span className={styles.mono}>{species}</span>
                                </Space>
                                {parsed.ok && parsed.composition && (
                                  <div className={styles.compositionList}>
                                    {Object.entries(parsed.composition).map(([element, count]) => (
                                      <Tag key={element}>
                                        {element}
                                        {count}
                                      </Tag>
                                    ))}
                                  </div>
                                )}
                                {parsed.ok && parsed.molarMass !== undefined && (
                                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                    M = {parsed.molarMass.toFixed(3)} g/mol
                                  </Typography.Text>
                                )}
                              </Space>
                            </Card>
                          );
                        })}
                      </Space>
                    </Card>
                  </>
                )}

                <p className={styles.hint}>
                  说明：配平要求零空间维数恰好为 1。燃烧同时生成 CO 与 CO2 等欠定体系、或元素只出现在箭头一侧的
                  方程式无法唯一配平，工具会明确报错而不是猜测系数。
                </p>
              </Space>
            ),
          },
          {
            key: 'stoich',
            label: '摩尔计量换算',
            children: result.ok && result.species ? (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Card size="small" title="设定已知物种的量">
                  <div className={styles.stoichForm}>
                    <div>
                      <Typography.Text type="secondary">已知物种</Typography.Text>
                      <Select
                        style={{ width: '100%' }}
                        value={Math.min(referenceIndex, result.species.length - 1)}
                        onChange={setReferenceIndex}
                        options={result.species.map((species, index) => ({
                          value: index,
                          label: `${result.coefficients?.[index] ?? 1} ${species}`,
                        }))}
                      />
                    </div>
                    <div>
                      <Typography.Text type="secondary">输入方式</Typography.Text>
                      <Select
                        style={{ width: '100%' }}
                        value={inputMode}
                        onChange={setInputMode}
                        options={[
                          { value: 'moles', label: '物质的量 (mol)' },
                          { value: 'mass', label: '质量 (g)' },
                        ]}
                      />
                    </div>
                    <div>
                      <Typography.Text type="secondary">
                        数值（{inputMode === 'moles' ? 'mol' : 'g'}）
                      </Typography.Text>
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        step={0.1}
                        value={inputValue}
                        onChange={(value) => setInputValue(value ?? 0)}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        setInputMode('moles');
                        setInputValue(1);
                      }}
                    >
                      重置为 1 mol
                    </Button>
                  </div>
                </Card>

                <Table<StoichTableRow>
                  columns={stoichColumns}
                  dataSource={stoichRows}
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
                />

                <p className={styles.hint}>
                  气体体积按标准状况（0 ℃、101.325 kPa）摩尔体积 22.4 L/mol 计算，仅对气态物种有物理意义；
                  质量基于内置相对原子质量表（IUPAC 常用约定值）。
                </p>
              </Space>
            ) : (
              <Alert
                type="warning"
                showIcon
                message="请先在「方程式配平」页得到有效配平结果"
                description={result.error ?? '当前方程式无法配平'}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
