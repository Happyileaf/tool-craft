'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Space, Tag, Typography, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  parseTransitions,
  simulate,
  buildTransitionTable,
  findUnreachable,
  toDot,
} from './utils/fsm';
import {
  DEFAULT_TRANSITIONS,
  DEFAULT_START,
  DEFAULT_ACCEPTING,
  DEFAULT_INPUT,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const FsmSimulator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [transitionText, setTransitionText] = React.useState(DEFAULT_TRANSITIONS);
  const [start, setStart] = React.useState(DEFAULT_START);
  const [accepting, setAccepting] = React.useState(DEFAULT_ACCEPTING);
  const [testInput, setTestInput] = React.useState(defaultInput || DEFAULT_INPUT);

  const parsed = React.useMemo(
    () => parseTransitions(transitionText, start, accepting),
    [transitionText, start, accepting],
  );

  const simulation = React.useMemo(() => {
    if (!parsed.fsm) return null;
    return simulate(parsed.fsm, testInput);
  }, [parsed.fsm, testInput]);

  const table = React.useMemo(
    () => (parsed.fsm ? buildTransitionTable(parsed.fsm) : null),
    [parsed.fsm],
  );

  const unreachable = React.useMemo(
    () => (parsed.fsm ? findUnreachable(parsed.fsm) : []),
    [parsed.fsm],
  );

  const dot = React.useMemo(() => (parsed.fsm ? toDot(parsed.fsm) : ''), [parsed.fsm]);

  const handleCopyDot = () => {
    if (dot === '') {
      message.error('暂无可复制的 DOT 文本');
      return;
    }
    copyToClipboard(dot);
    message.success('已复制 DOT 文本');
  };

  return (
    <div className={styles.container}>
      <div className={styles.configGrid}>
        <Card className={styles.card} size="small" title="转移函数（每行：当前状态,输入符号 -> 目标状态）">
          <Input.TextArea
            value={transitionText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTransitionText(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 8, maxRows: 16 }}
          />
        </Card>
        <Card className={styles.card} size="small" title="起始状态">
          <Input value={start} onChange={(e) => setStart(e.target.value)} spellCheck={false} />
        </Card>
        <Card className={styles.card} size="small" title="接受状态（逗号/空格分隔）">
          <Input value={accepting} onChange={(e) => setAccepting(e.target.value)} spellCheck={false} />
        </Card>
      </div>

      {parsed.errors.length > 0 ? (
        <Alert
          type="error"
          showIcon
          message="定义存在错误"
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {parsed.errors.map((issue, i) => (
                <li key={i}>
                  {issue.line > 0 ? `第 ${issue.line} 行：` : ''}
                  {issue.message}
                </li>
              ))}
            </ul>
          }
        />
      ) : null}

      {parsed.fsm && table ? (
        <>
          <Card size="small" title="测试序列模拟">
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <div className={styles.simRow}>
                <Input
                  className={styles.simInput}
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  spellCheck={false}
                  placeholder="输入测试串（留空表示空串 ε）"
                />
                {simulation && !simulation.error ? (
                  <Tag color={simulation.accepted ? 'success' : 'default'} style={{ fontSize: 14, padding: '4px 12px' }}>
                    {simulation.accepted ? '接受 (Accepted)' : '拒绝 (Rejected)'}
                  </Tag>
                ) : null}
              </div>
              {simulation?.error ? (
                <Alert type="warning" showIcon message={simulation.error} />
              ) : null}
              {simulation && simulation.steps.length > 0 ? (
                <div className={styles.steps}>
                  {simulation.steps.map((step) => (
                    <div key={step.index}>
                      <Typography.Text code>{step.index}</Typography.Text> 读入{' '}
                      <Typography.Text strong>{step.symbol}</Typography.Text>：{step.from} → {step.to}
                    </div>
                  ))}
                  <div>
                    终态：<Typography.Text strong>{simulation.endState}</Typography.Text>
                  </div>
                </div>
              ) : (
                <div className={styles.hint}>空串 ε：停在起始状态 {parsed.fsm.start}</div>
              )}
            </Space>
          </Card>

          <Card size="small" title={`状态转移表（缺失转移 ${table.missingCount} 处）`}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>状态</th>
                    {table.headers.map((symbol) => (
                      <th key={symbol}>{symbol}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row) => (
                    <tr key={row.state}>
                      <td>
                        <span className={row.state === parsed.fsm!.start ? styles.startState : ''}>
                          {row.state}
                          {row.state === parsed.fsm!.start ? ' →' : ''}
                        </span>
                        {parsed.fsm!.accepting.includes(row.state) ? (
                          <span className={styles.acceptState}> *</span>
                        ) : null}
                      </td>
                      {row.cells.map((cell, i) => (
                        <td key={i} className={'missing' in cell ? styles.missing : ''}>
                          {'missing' in cell ? '∅' : cell.to}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {table.missingCount > 0 ? (
              <Alert
                style={{ marginTop: 12 }}
                type="warning"
                showIcon
                message="存在缺失转移：完整 DFA 要求每个「状态 × 输入」都有定义"
              />
            ) : null}
            {unreachable.length > 0 ? (
              <Alert
                style={{ marginTop: 12 }}
                type="info"
                showIcon
                message={`不可达状态：${unreachable.join('、')}（从起始状态无法到达）`}
              />
            ) : null}
          </Card>

          <Card
            size="small"
            title="Graphviz DOT 输出"
            extra={
              <Button size="small" icon={<CopyOutlined />} onClick={handleCopyDot}>
                复制
              </Button>
            }
          >
            <div className={styles.dot}>{dot}</div>
          </Card>
        </>
      ) : null}

      <div>
        <Tag color="purple">DFA</Tag>
        <span className={styles.hint}>
          本期聚焦确定型有限自动机；纯本地零依赖，转移表与固定序列可确定性复现
        </span>
      </div>
    </div>
  );
};

export default FsmSimulator;
