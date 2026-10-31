import { describe, it, expect } from 'vitest';
import {
  splitAmount,
  settle,
  buildTransfers,
  type Expense,
  type MemberBalance,
} from './settlement';

describe('splitAmount 整数分摊', () => {
  it('等分：100 元 / 3 人，各份之和守恒且每份不超 1 分误差', () => {
    const shares = splitAmount(10000, ['甲', '乙', '丙']);
    expect(shares.reduce((sum, share) => sum + share, 0)).toBe(10000);
    expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(1);
    // 缺口最大的份额（理论值 3333.33…）拿到补余
    expect(shares).toEqual([3334, 3333, 3333]);
  });

  it('整除时每份相等', () => {
    expect(splitAmount(900, ['甲', '乙', '丙'])).toEqual([300, 300, 300]);
  });

  it('金额小于人数时，补余不超过金额，其余份额为 0', () => {
    const shares = splitAmount(2, ['甲', '乙', '丙']);
    expect(shares.reduce((sum, share) => sum + share, 0)).toBe(2);
    expect(shares.filter((share) => share === 1)).toHaveLength(2);
  });

  it('加权分摊按权重比例并守恒', () => {
    const shares = splitAmount(1000, ['甲', '乙'], { 甲: 1, 乙: 3 });
    expect(shares.reduce((sum, share) => sum + share, 0)).toBe(1000);
    expect(shares[0]).toBe(250);
    expect(shares[1]).toBe(750);
  });

  it('加权取整补余：100 分按 1:1:1 权重的结果与等分一致', () => {
    const shares = splitAmount(100, ['甲', '乙', '丙'], { 甲: 1, 乙: 1, 丙: 1 });
    expect(shares).toEqual([34, 33, 33]);
  });

  it('权重全部无效时回退为等分', () => {
    const shares = splitAmount(1000, ['甲', '乙'], { 甲: 0, 乙: -2 });
    expect(shares).toEqual([500, 500]);
  });

  it('非法金额或空成员抛错', () => {
    expect(() => splitAmount(-1, ['甲'])).toThrow(/非负整数/);
    expect(() => splitAmount(1.5, ['甲'])).toThrow(/非负整数/);
    expect(() => splitAmount(100, [])).toThrow(/不能为空/);
  });
});

describe('settle 对账汇总', () => {
  it('三人两笔示例：净余额符号正确，且全局净余额之和为 0', () => {
    const members = ['小明', '小红', '小刚'];
    const expenses: Expense[] = [
      {
        id: 'e1',
        title: '聚餐',
        payer: '小明',
        amountCents: 30000,
        participants: ['小明', '小红', '小刚'],
      },
      {
        id: 'e2',
        title: '打车',
        payer: '小红',
        amountCents: 6000,
        participants: ['小明', '小红'],
      },
    ];
    const result = settle(members, expenses);
    // 聚餐各 10000；打车各 3000
    const byName = new Map(result.balances.map((entry) => [entry.member, entry]));
    expect(byName.get('小明')?.paidCents).toBe(30000);
    expect(byName.get('小明')?.owedCents).toBe(13000);
    expect(byName.get('小明')?.netCents).toBe(17000);
    expect(byName.get('小红')?.paidCents).toBe(6000);
    expect(byName.get('小红')?.owedCents).toBe(13000);
    expect(byName.get('小红')?.netCents).toBe(-7000);
    expect(byName.get('小刚')?.owedCents).toBe(10000);
    expect(byName.get('小刚')?.netCents).toBe(-10000);
    const netSum = result.balances.reduce((sum, entry) => sum + entry.netCents, 0);
    expect(netSum).toBe(0);
    expect(result.totalCents).toBe(36000);
  });

  it('余额按成员名字典序排列', () => {
    const result = settle(['Charlie', 'Alice', 'Bob'], []);
    expect(result.balances.map((entry) => entry.member)).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('付款人或参与人不在成员清单中时抛错', () => {
    const badPayer: Expense[] = [
      { id: 'e1', title: 'x', payer: '外人', amountCents: 100, participants: ['甲'] },
    ];
    expect(() => settle(['甲'], badPayer)).toThrow(/付款人/);

    const badParticipant: Expense[] = [
      { id: 'e2', title: 'y', payer: '甲', amountCents: 100, participants: ['甲', '外人'] },
    ];
    expect(() => settle(['甲'], badParticipant)).toThrow(/参与人/);
  });

  it('参与人为空、金额非法时抛错', () => {
    const expenses: Expense[] = [
      { id: 'e1', title: 'z', payer: '甲', amountCents: 100, participants: [] },
    ];
    expect(() => settle(['甲'], expenses)).toThrow(/至少需要 1 位/);
    const badAmount: Expense[] = [
      { id: 'e2', title: 'w', payer: '甲', amountCents: -5, participants: ['甲'] },
    ];
    expect(() => settle(['甲'], badAmount)).toThrow(/非负整数/);
  });

  it('成员未参与任何费用时余额为 0 且不产生转账', () => {
    const result = settle(['甲', '乙'], []);
    expect(result.transfers).toEqual([]);
    expect(result.totalCents).toBe(0);
  });
});

describe('buildTransfers 最小转账', () => {
  const balance = (member: string, netCents: number): MemberBalance => ({
    member,
    paidCents: Math.max(netCents, 0),
    owedCents: Math.max(-netCents, 0),
    netCents,
  });

  it('按转账执行后所有成员净余额归零', () => {
    const balances = [balance('小明', 17000), balance('小红', -7000), balance('小刚', -10000)];
    const transfers = buildTransfers(balances);
    const net = new Map(balances.map((entry) => [entry.member, entry.netCents]));
    for (const transfer of transfers) {
      net.set(transfer.from, (net.get(transfer.from) ?? 0) + transfer.amountCents);
      net.set(transfer.to, (net.get(transfer.to) ?? 0) - transfer.amountCents);
    }
    for (const value of net.values()) {
      expect(value).toBe(0);
    }
  });

  it('单笔债权可被多笔债务对冲时转账笔数等于债务人数', () => {
    const transfers = buildTransfers([
      balance('债权人', 10000),
      balance('甲', -3000),
      balance('乙', -7000),
    ]);
    expect(transfers).toHaveLength(2);
    expect(transfers.every((transfer) => transfer.to === '债权人')).toBe(true);
  });

  it('账目已平时无转账', () => {
    expect(buildTransfers([balance('甲', 0), balance('乙', 0)])).toEqual([]);
  });

  it('转账金额恒为正整数且不超出让步方余额', () => {
    const transfers = buildTransfers([
      balance('甲', 333),
      balance('乙', -334),
      balance('丙', 1),
    ]);
    for (const transfer of transfers) {
      expect(Number.isInteger(transfer.amountCents)).toBe(true);
      expect(transfer.amountCents).toBeGreaterThan(0);
    }
  });
});
