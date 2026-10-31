/**
 * 多人 AA 分账与最小转账结算纯函数
 *
 * 金额一律以「分」为单位的整数参与运算，避免浮点误差导致的账目不平。
 * 一笔费用由某位成员垫付，在若干参与分摊成员之间按权重（缺省等分）分摊；
 * 每人净余额 = 已付 − 应付：正数表示垫付多了（应收），负数表示还需补钱（应付）。
 */

/** 一笔共同消费记录 */
export interface Expense {
  /** 唯一标识 */
  id: string;
  /** 费用说明 */
  title: string;
  /** 垫付成员 */
  payer: string;
  /** 金额，单位为分（非负整数） */
  amountCents: number;
  /** 参与分摊的成员（至少 1 人，通常包含付款人） */
  participants: string[];
  /**
   * 可选的分摊权重，键为成员名；
   * 缺省或权重和为 0 时参与人等权分摊
   */
  weights?: Record<string, number>;
}

/** 单个成员的对账结果 */
export interface MemberBalance {
  /** 成员名 */
  member: string;
  /** 累计垫付金额（分） */
  paidCents: number;
  /** 累计应摊金额（分） */
  owedCents: number;
  /** 净余额 = 已付 − 应付（分）；正为应收，负为应付 */
  netCents: number;
}

/** 一笔建议转账 */
export interface Transfer {
  /** 付款成员（净余额为负者） */
  from: string;
  /** 收款成员（净余额为正者） */
  to: string;
  /** 转账金额（分，正整数） */
  amountCents: number;
}

/** 分账汇总结果 */
export interface Settlement {
  /** 各成员对账明细，按成员名字典序排列 */
  balances: MemberBalance[];
  /** 最小化后的建议转账列表 */
  transfers: Transfer[];
  /** 全部费用总额（分） */
  totalCents: number;
}

/**
 * 按权重把一笔整数金额拆成若干份，保证各份之和恰等于原金额
 *
 * 先按权重向下取整分配，再把因取整产生的余（量纲为分）逐分补到余数最大的份额上。
 *
 * @param amountCents - 待拆分金额（分）
 * @param members - 参与分摊成员（顺序即返回顺序）
 * @param weights - 可选权重表；无效权重按 0 处理
 * @returns 与 members 对齐的分摊金额（分），总和恒等于 amountCents
 */
export function splitAmount(
  amountCents: number,
  members: string[],
  weights?: Record<string, number>,
): number[] {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new Error('金额必须为非负整数（分）');
  }
  if (members.length === 0) {
    throw new Error('参与分摊成员不能为空');
  }

  const rawWeights = members.map((member) => {
    const weight = weights?.[member];
    return typeof weight === 'number' && Number.isFinite(weight) && weight > 0 ? weight : 0;
  });
  const weightSum = rawWeights.reduce((sum, weight) => sum + weight, 0);
  // 权重全部缺失或无效时等权分摊
  const effective = weightSum > 0 ? rawWeights : members.map(() => 1);
  const totalWeight = effective.reduce((sum, weight) => sum + weight, 0);

  const shares = effective.map((weight) =>
    Math.floor((amountCents * weight) / totalWeight),
  );
  // 理论精确份额（浮点）用于决定余数补给谁
  const exact = effective.map((weight) => (amountCents * weight) / totalWeight);

  let remainder = amountCents - shares.reduce((sum, share) => sum + share, 0);
  if (remainder > 0) {
    // 取整缺口（exact - floor）最大者优先补 1 分；平手按成员顺序
    const order = members
      .map((_, index) => ({ index, gap: (exact[index] ?? 0) - (shares[index] ?? 0) }))
      .sort((a, b) => b.gap - a.gap || a.index - b.index);
    let cursor = 0;
    while (remainder > 0) {
      const target = order[cursor % order.length];
      if (target) shares[target.index] = (shares[target.index] ?? 0) + 1;
      remainder -= 1;
      cursor += 1;
    }
  }

  return shares;
}

/**
 * 汇总费用列表，计算每人净余额并生成最小化转账方案
 *
 * 结算采用贪心对冲：把净余额为正者（债权人）与负者（债务人）分别排序，
 * 每一步让最小债权与最小债务全额抵消，循环至全部归零。
 *
 * @param members - 全部成员名
 * @param expenses - 费用记录
 * @returns 分账汇总（余额、转账、总额）
 * @throws 当费用引用了成员清单之外的人时抛出错误
 */
export function settle(members: string[], expenses: Expense[]): Settlement {
  const memberSet = new Set(members);
  const paid = new Map<string, number>();
  const owed = new Map<string, number>();
  for (const member of members) {
    paid.set(member, 0);
    owed.set(member, 0);
  }

  let totalCents = 0;

  for (const expense of expenses) {
    if (!memberSet.has(expense.payer)) {
      throw new Error(`费用「${expense.title}」的付款人 ${expense.payer} 不在成员清单中`);
    }
    const participants = expense.participants.filter(
      (participant, index, array) => array.indexOf(participant) === index,
    );
    if (participants.length === 0) {
      throw new Error(`费用「${expense.title}」至少需要 1 位参与分摊成员`);
    }
    for (const participant of participants) {
      if (!memberSet.has(participant)) {
        throw new Error(`费用「${expense.title}」的参与人 ${participant} 不在成员清单中`);
      }
    }
    if (!Number.isInteger(expense.amountCents) || expense.amountCents < 0) {
      throw new Error(`费用「${expense.title}」金额必须为非负整数（分）`);
    }

    totalCents += expense.amountCents;
    paid.set(expense.payer, (paid.get(expense.payer) ?? 0) + expense.amountCents);

    const shares = splitAmount(expense.amountCents, participants, expense.weights);
    participants.forEach((participant, index) => {
      owed.set(participant, (owed.get(participant) ?? 0) + (shares[index] ?? 0));
    });
  }

  const balances: MemberBalance[] = members
    .map((member) => {
      const paidCents = paid.get(member) ?? 0;
      const owedCents = owed.get(member) ?? 0;
      return { member, paidCents, owedCents, netCents: paidCents - owedCents };
    })
    .sort((a, b) => a.member.localeCompare(b.member));

  const transfers = buildTransfers(balances);

  return { balances, transfers, totalCents };
}

/**
 * 根据净余额贪心构造最小转账列表
 *
 * @param balances - 成员余额
 * @returns 每笔金额为正整数的转账列表；账目已平时返回空数组
 */
export function buildTransfers(balances: MemberBalance[]): Transfer[] {
  const creditors = balances
    .filter((entry) => entry.netCents > 0)
    .map((entry) => ({ member: entry.member, amount: entry.netCents }));
  const debtors = balances
    .filter((entry) => entry.netCents < 0)
    .map((entry) => ({ member: entry.member, amount: -entry.netCents }));

  const transfers: Transfer[] = [];
  let creditIndex = 0;
  let debitIndex = 0;

  while (creditIndex < creditors.length && debitIndex < debtors.length) {
    const creditor = creditors[creditIndex]!;
    const debtor = debtors[debitIndex]!;
    const amount = Math.min(creditor.amount, debtor.amount);
    if (amount > 0) {
      transfers.push({ from: debtor.member, to: creditor.member, amountCents: amount });
    }
    creditor.amount -= amount;
    debtor.amount -= amount;
    if (creditor.amount === 0) creditIndex += 1;
    if (debtor.amount === 0) debitIndex += 1;
  }

  return transfers;
}
