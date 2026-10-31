'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { AMOUNT_STEP, CENTS_PER_YUAN, DEFAULT_MEMBERS } from './constants';
import {
  settle,
  type Expense,
  type MemberBalance,
  type Transfer,
} from './utils/settlement';
import styles from './index.module.css';

let idSeed = 1;

/** 生成费用行唯一 id */
function nextId(): string {
  idSeed += 1;
  return `exp-${Date.now()}-${idSeed}`;
}

/** 元转分（四舍五入到整数分） */
function yuanToCents(yuan: number | null): number {
  if (yuan === null || yuan === undefined || Number.isNaN(yuan)) return 0;
  return Math.round(yuan * CENTS_PER_YUAN);
}

/** 分转元展示字符串 */
export function centsToYuan(cents: number): string {
  return (cents / CENTS_PER_YUAN).toFixed(2);
}

/** 默认成员（顺序固定，供初始示例费用引用） */
const [MEMBER_A, MEMBER_B, MEMBER_C] = DEFAULT_MEMBERS;

/** 构造一笔默认费用（首位成员垫付、全体成员等分） */
function createExpense(members: string[]): Expense {
  return {
    id: nextId(),
    title: `费用 ${idSeed}`,
    payer: members[0] ?? '',
    amountCents: 0,
    participants: [...members],
  };
}

/**
 * AA 分账计算器：录入成员与多人共同消费，自动计算净余额并给出最小转账方案
 *
 * @returns 分账计算器交互界面
 */
const ExpenseSplitter: React.FC<ToolComponentProps> = () => {
  const [members, setMembers] = React.useState<string[]>([...DEFAULT_MEMBERS]);
  const [newMember, setNewMember] = React.useState('');
  const [expenses, setExpenses] = React.useState<Expense[]>(() => [
    {
      id: 'exp-init-1',
      title: '聚餐',
      payer: MEMBER_A,
      amountCents: 30000,
      participants: [MEMBER_A, MEMBER_B, MEMBER_C],
    },
    {
      id: 'exp-init-2',
      title: '打车',
      payer: MEMBER_B,
      amountCents: 6000,
      participants: [MEMBER_A, MEMBER_B],
    },
  ]);

  const memberOptions = members.map((member) => ({ label: member, value: member }));

  const addMember = () => {
    const name = newMember.trim();
    if (!name) return;
    if (members.includes(name)) {
      message.warning('成员已存在');
      return;
    }
    setMembers((previous) => [...previous, name]);
    setNewMember('');
  };

  const removeMember = (name: string) => {
    if (expenses.some((expense) => expense.payer === name)) {
      message.warning(`${name} 仍有垫付费用，请先调整或删除对应费用`);
      return;
    }
    setMembers((previous) => previous.filter((member) => member !== name));
    setExpenses((previous) =>
      previous.map((expense) => ({
        ...expense,
        participants: expense.participants.filter((participant) => participant !== name),
      })),
    );
  };

  const addExpense = () => {
    if (members.length === 0) {
      message.warning('请先添加成员');
      return;
    }
    setExpenses((previous) => [...previous, createExpense(members)]);
  };

  const updateExpense = (id: string, patch: Partial<Expense>) => {
    setExpenses((previous) =>
      previous.map((expense) => (expense.id === id ? { ...expense, ...patch } : expense)),
    );
  };

  const removeExpense = (id: string) => {
    setExpenses((previous) => previous.filter((expense) => expense.id !== id));
  };

  const outcome = React.useMemo(() => {
    try {
      return { result: settle(members, expenses), error: undefined as string | undefined };
    } catch (error) {
      return { result: undefined, error: error instanceof Error ? error.message : String(error) };
    }
  }, [members, expenses]);

  const copySummary = (balances: MemberBalance[], transfers: Transfer[], totalCents: number) => {
    const lines: string[] = [];
    lines.push(`总支出：¥${centsToYuan(totalCents)}`);
    lines.push('');
    lines.push('【净余额】（正=应收，负=应付）');
    for (const balance of balances) {
      const sign = balance.netCents > 0 ? '+' : '';
      lines.push(`${balance.member}：${sign}¥${centsToYuan(balance.netCents)}（垫付 ¥${centsToYuan(balance.paidCents)}，应付 ¥${centsToYuan(balance.owedCents)}）`);
    }
    lines.push('');
    lines.push(transfers.length > 0 ? '【建议转账】' : '【建议转账】账目已平，无需转账');
    transfers.forEach((transfer, index) => {
      lines.push(`${index + 1}. ${transfer.from} → ${transfer.to}：¥${centsToYuan(transfer.amountCents)}`);
    });
    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => message.success('结算清单已复制'))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  return (
    <div className={styles.container}>
      <Card title="AA 分账计算器（多人费用分摊与最小转账结算）">
        <p className={styles.hint}>
          录入成员与每笔共同消费（付款人、金额、参与分摊成员），自动计算每人净余额（已付 −
          应付），并用贪心对冲生成笔数最少的转账方案。金额按整数分运算，账目不丢分。
        </p>

        <div className={styles.sectionTitle}>成员</div>
        <Space wrap style={{ marginBottom: 12 }}>
          {members.map((member) => (
            <Tag
              key={member}
              closable={members.length > 1}
              onClose={(event) => {
                event.preventDefault();
                removeMember(member);
              }}
              className={styles.memberTag}
            >
              {member}
            </Tag>
          ))}
        </Space>
        <Space.Compact style={{ width: '100%', maxWidth: 360 }}>
          <Input
            placeholder="输入新成员名后回车添加"
            value={newMember}
            onChange={(event) => setNewMember(event.target.value)}
            onPressEnter={addMember}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={addMember}>
            添加
          </Button>
        </Space.Compact>
      </Card>

      <Card
        title="共同消费"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={addExpense}>
            添加费用
          </Button>
        }
      >
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={expenses}
          locale={{ emptyText: <Empty description="暂无费用，点击右上角添加" /> }}
          columns={[
            {
              title: '费用说明',
              dataIndex: 'title',
              key: 'title',
              width: 150,
              render: (_: unknown, record: Expense) => (
                <Input
                  value={record.title}
                  onChange={(event) => updateExpense(record.id, { title: event.target.value })}
                />
              ),
            },
            {
              title: '付款人',
              dataIndex: 'payer',
              key: 'payer',
              width: 120,
              render: (_: unknown, record: Expense) => (
                <select
                  className={styles.nativeSelect}
                  value={record.payer}
                  onChange={(event) => updateExpense(record.id, { payer: event.target.value })}
                >
                  {memberOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ),
            },
            {
              title: '金额（元）',
              dataIndex: 'amountCents',
              key: 'amount',
              width: 130,
              render: (_: unknown, record: Expense) => (
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={AMOUNT_STEP}
                  precision={2}
                  value={record.amountCents / CENTS_PER_YUAN}
                  onChange={(value) => updateExpense(record.id, { amountCents: yuanToCents(value) })}
                />
              ),
            },
            {
              title: '参与分摊成员（等分）',
              dataIndex: 'participants',
              key: 'participants',
              render: (_: unknown, record: Expense) => (
                <Space size={[4, 4]} wrap>
                  {members.map((member) => {
                    const active = record.participants.includes(member);
                    return (
                      <Button
                        key={member}
                        size="small"
                        type={active ? 'primary' : 'default'}
                        onClick={() => {
                          const next = active
                            ? record.participants.filter((participant) => participant !== member)
                            : [...record.participants, member];
                          updateExpense(record.id, { participants: next });
                        }}
                      >
                        {member}
                      </Button>
                    );
                  })}
                </Space>
              ),
            },
            {
              title: '',
              key: 'action',
              width: 48,
              render: (_: unknown, record: Expense) => (
                <Popconfirm title="删除该费用？" onConfirm={() => removeExpense(record.id)}>
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              ),
            },
          ]}
        />
        {outcome.error ? (
          <Alert
            style={{ marginTop: 12 }}
            type="warning"
            showIcon
            message="无法结算"
            description={outcome.error}
          />
        ) : null}
      </Card>

      {outcome.result ? (
        <Card
          title="结算结果"
          extra={
            <Button
              onClick={() =>
                copySummary(
                  outcome.result.balances,
                  outcome.result.transfers,
                  outcome.result.totalCents,
                )
              }
            >
              复制结算清单
            </Button>
          }
        >
          <div className={styles.totalLine}>
            总支出：<span className={styles.mono}>¥{centsToYuan(outcome.result.totalCents)}</span>
          </div>

          <div className={styles.sectionTitle}>净余额（已付 − 应付）</div>
          <Table
            rowKey="member"
            size="small"
            pagination={false}
            style={{ marginBottom: 16 }}
            dataSource={outcome.result.balances}
            columns={[
              { title: '成员', dataIndex: 'member', key: 'member' },
              {
                title: '垫付（元）',
                dataIndex: 'paidCents',
                key: 'paid',
                render: (value: number) => <span className={styles.mono}>{centsToYuan(value)}</span>,
              },
              {
                title: '应付（元）',
                dataIndex: 'owedCents',
                key: 'owed',
                render: (value: number) => <span className={styles.mono}>{centsToYuan(value)}</span>,
              },
              {
                title: '净余额（元）',
                dataIndex: 'netCents',
                key: 'net',
                render: (value: number) => (
                  <span
                    className={styles.mono}
                    style={{ color: value > 0 ? '#52c41a' : value < 0 ? '#cf1322' : undefined }}
                  >
                    {value > 0 ? '+' : ''}
                    {centsToYuan(value)}
                  </span>
                ),
              },
            ]}
          />

          <div className={styles.sectionTitle}>建议转账（最少笔数）</div>
          {outcome.result.transfers.length === 0 ? (
            <Alert type="success" showIcon message="账目已平，无需转账" />
          ) : (
            <Table
              rowKey={(record) => `${record.from}-${record.to}`}
              size="small"
              pagination={false}
              dataSource={outcome.result.transfers}
              columns={[
                {
                  title: '付款人',
                  dataIndex: 'from',
                  key: 'from',
                  render: (value: string) => <Tag color="red">{value}</Tag>,
                },
                { title: '→', key: 'arrow', width: 40, render: () => '→' },
                {
                  title: '收款人',
                  dataIndex: 'to',
                  key: 'to',
                  render: (value: string) => <Tag color="green">{value}</Tag>,
                },
                {
                  title: '金额（元）',
                  dataIndex: 'amountCents',
                  key: 'amount',
                  render: (value: number) => (
                    <span className={styles.mono}>¥{centsToYuan(value)}</span>
                  ),
                },
              ]}
            />
          )}
        </Card>
      ) : null}
    </div>
  );
};

export default ExpenseSplitter;
