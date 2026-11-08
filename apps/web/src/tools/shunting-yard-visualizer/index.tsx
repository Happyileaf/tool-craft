'use client';

import React from 'react';
import { Alert, Button, Card, Input, Segmented, Space, Table, Tag, message } from 'antd';
import {
  CaretRightOutlined,
  LeftOutlined,
  PauseOutlined,
  RightOutlined,
  StepBackwardOutlined,
} from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  ShuntingYardError,
  evalRPN,
  formatNumber,
  toRPN,
  type EvalStep,
  type RpnStep,
} from './utils/shuntingYard';
import { DEFAULT_EXPRESSION, OPERATOR_TABLE, PHASE_OPTIONS, SAMPLE_EXPRESSIONS, type PhaseKey } from './constants';
import styles from './index.module.css';

interface ParseState {
  rpnSteps: RpnStep[];
  evalSteps: EvalStep[];
  rpnText: string;
  result: number | null;
  error: string | null;
  errorPos: number | null;
}

/** 栈渲染：数组末尾为栈顶，视觉上自底向上展示。 */
const StackView: React.FC<{ title: string; items: string[]; accent?: 'blue' | 'green' }> = ({
  title,
  items,
  accent = 'blue',
}) => (
  <div className={styles.stackBlock}>
    <div className={styles.stackTitle}>{title}</div>
    <div className={styles.stackBody}>
      {items.length === 0 ? (
        <span className={styles.stackEmpty}>（空）</span>
      ) : (
        [...items].reverse().map((item, idx) => (
          <span
            key={`${item}-${idx}`}
            className={`${styles.stackChip} ${accent === 'blue' ? styles.chipBlue : styles.chipGreen} ${
              idx === 0 ? styles.stackTop : ''
            }`}
          >
            {item}
          </span>
        ))
      )}
    </div>
  </div>
);

const ShuntingYardVisualizer: React.FC<ToolComponentProps> = () => {
  const [expression, setExpression] = React.useState(DEFAULT_EXPRESSION);
  const [phase, setPhase] = React.useState<PhaseKey>('rpn');
  const [stepIndex, setStepIndex] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);

  const parsed: ParseState = React.useMemo(() => {
    if (expression.trim() === '') {
      return { rpnSteps: [], evalSteps: [], rpnText: '', result: null, error: '请输入中缀表达式', errorPos: null };
    }
    try {
      const rpnResult = toRPN(expression);
      const evalResult = evalRPN(rpnResult);
      return {
        rpnSteps: rpnResult.steps,
        evalSteps: evalResult.steps,
        rpnText: rpnResult.rpn.join(' '),
        result: evalResult.result,
        error: null,
        errorPos: null,
      };
    } catch (e) {
      if (e instanceof ShuntingYardError) {
        const rpnPartial = e.partialSteps.filter((s): s is RpnStep => 'operatorStack' in s);
        return {
          rpnSteps: rpnPartial,
          evalSteps: [],
          rpnText: '',
          result: null,
          error: `${e.message}（位置 ${e.pos}）`,
          errorPos: e.pos,
        };
      }
      return {
        rpnSteps: [],
        evalSteps: [],
        rpnText: '',
        result: null,
        error: e instanceof Error ? e.message : '解析失败',
        errorPos: null,
      };
    }
  }, [expression]);

  const activeSteps = phase === 'rpn' ? parsed.rpnSteps : parsed.evalSteps;
  const totalSteps = activeSteps.length;
  const safeIndex = Math.min(stepIndex, totalSteps);
  const current = safeIndex > 0 ? activeSteps[safeIndex - 1] : null;

  // 表达式或阶段切换时重置回放位置与播放状态
  React.useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
  }, [expression, phase]);

  // 自动播放：每 900ms 推进一步，走到末尾自动停止
  React.useEffect(() => {
    if (!playing || parsed.error) return;
    if (safeIndex >= totalSteps) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setStepIndex((v) => Math.min(v + 1, totalSteps)), 900);
    return () => window.clearTimeout(timer);
  }, [playing, safeIndex, totalSteps, parsed.error]);

  const rpnColumns = [
    { title: '#', dataIndex: 'index', key: 'index', width: 56 },
    { title: '当前 Token', dataIndex: 'token', key: 'token', width: 110, render: (v: string) => <span className={styles.mono}>{v}</span> },
    { title: '决策原因', dataIndex: 'action', key: 'action' },
    {
      title: '运算符栈（左→右，末位栈顶）',
      dataIndex: 'operatorStack',
      key: 'operatorStack',
      render: (v: string[]) => <span className={styles.mono}>{v.length ? v.join(' ') : '∅'}</span>,
    },
    {
      title: '输出队列（RPN）',
      dataIndex: 'output',
      key: 'output',
      render: (v: string[]) => <span className={styles.mono}>{v.length ? v.join(' ') : '∅'}</span>,
    },
  ];

  const evalColumns = [
    { title: '#', dataIndex: 'index', key: 'index', width: 56 },
    { title: '当前 Token', dataIndex: 'token', key: 'token', width: 110, render: (v: string) => <span className={styles.mono}>{v}</span> },
    { title: '求值动作', dataIndex: 'action', key: 'action' },
    {
      title: '值栈（左→右，末位栈顶）',
      dataIndex: 'valueStack',
      key: 'valueStack',
      render: (v: number[]) => <span className={styles.mono}>{v.length ? v.map(formatNumber).join(' ') : '∅'}</span>,
    },
  ];

  return (
    <div className={styles.container}>
      <Card size="small" title="表达式输入">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Input
            size="large"
            value={expression}
            placeholder="例如 3 + 4 * 2 / ( 1 - 5 ) ^ 2"
            onChange={(e) => setExpression(e.target.value)}
            className={styles.mono}
            status={parsed.error ? 'error' : ''}
          />
          <Space wrap size={[8, 8]}>
            {SAMPLE_EXPRESSIONS.map((s) => (
              <Button key={s.label} size="small" onClick={() => setExpression(s.expression)}>
                {s.label}
              </Button>
            ))}
          </Space>
          {parsed.error && <Alert type="error" showIcon message={parsed.error} />}
        </Space>
      </Card>

      {!parsed.error && (
        <>
          <Card size="small" title="转换与求值结果">
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div>
                <span className={styles.resultLabel}>后缀表达式 RPN：</span>
                <Tag color="blue" className={styles.rpnTag}>{parsed.rpnText}</Tag>
                <Button
                  size="small"
                  onClick={() => {
                    void navigator.clipboard?.writeText(parsed.rpnText);
                    message.success('已复制 RPN');
                  }}
                >
                  复制 RPN
                </Button>
              </div>
              <div>
                <span className={styles.resultLabel}>最终结果：</span>
                <span className={styles.finalValue}>{parsed.result === null ? '—' : formatNumber(parsed.result)}</span>
              </div>
            </Space>
          </Card>

          <Card
            size="small"
            title="算法过程回放"
            extra={
              <Segmented
                options={PHASE_OPTIONS}
                value={phase}
                onChange={(v) => setPhase(v as PhaseKey)}
              />
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Space wrap>
                <Button size="small" icon={<StepBackwardOutlined />} disabled={safeIndex === 0} onClick={() => setStepIndex(0)}>
                  重置
                </Button>
                <Button size="small" icon={<LeftOutlined />} disabled={safeIndex === 0} onClick={() => setStepIndex((v) => Math.max(0, v - 1))}>
                  上一步
                </Button>
                <Button
                  size="small"
                  type="primary"
                  icon={playing ? <PauseOutlined /> : <CaretRightOutlined />}
                  disabled={safeIndex >= totalSteps}
                  onClick={() => (playing ? setPlaying(false) : setPlaying(true))}
                >
                  {playing ? '暂停' : '自动播放'}
                </Button>
                <Button
                  size="small"
                  icon={<RightOutlined />}
                  disabled={safeIndex >= totalSteps}
                  onClick={() => setStepIndex((v) => Math.min(totalSteps, v + 1))}
                >
                  下一步
                </Button>
                <Tag>
                  步骤 {safeIndex} / {totalSteps}
                </Tag>
              </Space>

              {current && phase === 'rpn' && 'operatorStack' in current && (
                <div className={styles.snapshotGrid}>
                  <StackView title="运算符栈（栈顶在上）" items={current.operatorStack} accent="blue" />
                  <StackView title="输出队列（栈顶在上）" items={current.output} accent="green" />
                </div>
              )}
              {current && phase === 'eval' && 'valueStack' in current && (
                <div className={styles.snapshotGrid}>
                  <StackView title="值栈（栈顶在上）" items={current.valueStack.map(formatNumber)} accent="green" />
                </div>
              )}
              {current && <Alert type="info" showIcon message={`第 ${current.index} 步：${current.action}`} />}

              {phase === 'rpn' ? (
                <Table<RpnStep>
                  rowKey="index"
                  size="small"
                  pagination={false}
                  scroll={{ y: 320 }}
                  columns={rpnColumns}
                  dataSource={parsed.rpnSteps}
                  rowClassName={(record) => (record.index === safeIndex ? styles.activeRow ?? 'active-row' : 'inactive')}
                  onRow={(record) => ({ onClick: () => setStepIndex(record.index) })}
                />
              ) : (
                <Table<EvalStep>
                  rowKey="index"
                  size="small"
                  pagination={false}
                  scroll={{ y: 320 }}
                  columns={evalColumns}
                  dataSource={parsed.evalSteps}
                  rowClassName={(record) => (record.index === safeIndex ? styles.activeRow ?? 'active-row' : 'inactive')}
                  onRow={(record) => ({ onClick: () => setStepIndex(record.index) })}
                />
              )}
            </Space>
          </Card>
        </>
      )}

      <Card size="small" title="运算符优先级与结合性">
        <Table
          rowKey="symbol"
          size="small"
          pagination={false}
          dataSource={OPERATOR_TABLE}
          columns={[
            { title: '运算符', dataIndex: 'symbol', key: 'symbol', render: (v: string) => <span className={styles.mono}>{v}</span> },
            { title: '优先级', dataIndex: 'precedence', key: 'precedence', width: 90 },
            { title: '结合性', dataIndex: 'associativity', key: 'associativity', width: 110 },
            { title: '说明', dataIndex: 'note', key: 'note' },
          ]}
        />
      </Card>
    </div>
  );
};

export default ShuntingYardVisualizer;
