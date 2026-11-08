import { describe, expect, it } from 'vitest';
import {
  ShuntingYardError,
  evalRPN,
  evaluateExpression,
  formatNumber,
  toRPN,
  tokenize,
} from './shuntingYard';

describe('tokenize', () => {
  it('识别数字、运算符、括号与一元负号', () => {
    const tokens = tokenize('-2 + -3');
    expect(tokens.map((t) => t.value)).toEqual(['u-', '2', '+', 'u-', '3']);
    expect(tokens.map((t) => t.type)).toEqual([
      'operator',
      'number',
      'operator',
      'operator',
      'number',
    ]);
  });

  it('记录 0 基字符偏移并忽略空白', () => {
    const tokens = tokenize(' 1 + 2');
    expect(tokens[0]?.pos).toBe(1);
    expect(tokens[1]?.pos).toBe(3);
  });

  it('识别函数与常量（常量内联为数字）', () => {
    const tokens = tokenize('sin(pi) + e');
    expect(tokens.map((t) => [t.type, t.value])).toEqual([
      ['function', 'sin'],
      ['lparen', '('],
      ['number', 'pi'],
      ['rparen', ')'],
      ['operator', '+'],
      ['number', 'e'],
    ]);
    const piToken = tokens.find((t) => t.value === 'pi');
    expect(piToken?.numericValue).toBeCloseTo(Math.PI, 10);
  });

  it('非法字符与未知标识符报错并带定位', () => {
    expect(() => tokenize('1 @ 2')).toThrow(ShuntingYardError);
    try {
      tokenize('foo(2)');
      throw new Error('应当抛错');
    } catch (e) {
      expect(e).toBeInstanceOf(ShuntingYardError);
      expect((e as ShuntingYardError).pos).toBe(0);
    }
    expect(() => tokenize('1.2.3')).toThrow('非法数字');
  });
});

describe('toRPN 固定向量', () => {
  it('3 + 4 * 2 / ( 1 - 5 ) ^ 2 → 3 4 2 * 1 5 - 2 ^ / +', () => {
    const r = toRPN('3 + 4 * 2 / ( 1 - 5 ) ^ 2');
    expect(r.rpn).toEqual(['3', '4', '2', '*', '1', '5', '-', '2', '^', '/', '+']);
    expect(r.rpn.join(' ')).toBe('3 4 2 * 1 5 - 2 ^ / +');
  });

  it('每一步都产出运算符栈与输出队列快照', () => {
    const r = toRPN('1 + 2');
    expect(r.steps).toHaveLength(4); // 1、+、2、收尾弹出 +（共 4 个快照）
    expect(r.steps[0]?.operatorStack).toEqual([]);
    expect(r.steps[0]?.output).toEqual(['1']);
    const last = r.steps[r.steps.length - 1];
    expect(last?.output).toEqual(['1', '2', '+']);
    expect(last?.operatorStack).toEqual([]);
    // 快照是确定性的深拷贝，后续步骤不污染历史快照
    expect(r.steps[0]?.output).toEqual(['1']);
  });

  it('右结合幂运算 2 ^ 3 ^ 2 的 RPN 顺序为 2 3 2 ^ ^', () => {
    const r = toRPN('2 ^ 3 ^ 2');
    expect(r.rpn).toEqual(['2', '3', '2', '^', '^']);
  });

  it('一元负号场景的 RPN 正确', () => {
    expect(toRPN('-2 + 3').rpn).toEqual(['2', 'u-', '3', '+']);
    expect(toRPN('2 + -3').rpn).toEqual(['2', '3', 'u-', '+']);
    expect(toRPN('-(2+1)').rpn).toEqual(['2', '1', '+', 'u-']);
  });

  it('函数与逗号：max(1,3,2) 输出函数 token 且回填参数个数', () => {
    const r = toRPN('max(1,3,2)');
    expect(r.rpn).toEqual(['1', '3', '2', 'max']);
    const fnToken = r.outputTokens.find((t) => t.value === 'max');
    expect(fnToken?.argCount).toBe(3);
  });
});

describe('evalRPN 求值', () => {
  it('固定向量求值结果为 3.5', () => {
    const r = evalRPN(toRPN('3 + 4 * 2 / ( 1 - 5 ) ^ 2'));
    expect(r.result).toBeCloseTo(3.5, 10);
    expect(r.steps.length).toBeGreaterThan(0);
    // 最后一步值栈只剩结果
    expect(r.steps[r.steps.length - 1]?.valueStack).toEqual([3.5]);
  });

  it('一元负号：-2 + 3 = 1、2 + -3 = -1、-(2+1) = -3', () => {
    // 注：数学上 2 + -3 = -1；池验收文案写“均得 1”系笔误，以数学正确性为准
    expect(evalRPN(toRPN('-2 + 3')).result).toBeCloseTo(1, 10);
    expect(evalRPN(toRPN('2 + -3')).result).toBeCloseTo(-1, 10);
    expect(evalRPN(toRPN('-(2+1)')).result).toBeCloseTo(-3, 10);
  });

  it('右结合幂：2 ^ 3 ^ 2 = 512', () => {
    expect(evalRPN(toRPN('2 ^ 3 ^ 2')).result).toBeCloseTo(512, 10);
  });

  it('函数调用：sin(0)=0、sqrt(16)=4、max(1,3,2)=3、abs(-5)=5', () => {
    expect(evalRPN(toRPN('sin(0)')).result).toBeCloseTo(0, 10);
    expect(evalRPN(toRPN('sqrt(16)')).result).toBeCloseTo(4, 10);
    expect(evalRPN(toRPN('max(1,3,2)')).result).toBeCloseTo(3, 10);
    expect(evalRPN(toRPN('abs(-5)')).result).toBeCloseTo(5, 10);
  });

  it('常量与混合表达式可求值', () => {
    expect(evalRPN(toRPN('2 * pi')).result).toBeCloseTo(2 * Math.PI, 10);
  });

  it('formatNumber 消除浮点尾巴', () => {
    expect(formatNumber(0.1 + 0.2)).toBe('0.3');
    expect(formatNumber(3.5)).toBe('3.5');
  });
});

describe('错误向量在对应步骤报错而非崩溃', () => {
  it('括号不匹配 (1+2：残留左括号报错', () => {
    expect(() => toRPN('(1+2')).toThrow('左括号');
  });

  it('右括号多余：1+2) 报错', () => {
    expect(() => toRPN('1+2)')).toThrow('右括号');
  });

  it('未知标识符 foo(2) 在词法期报错并带定位', () => {
    try {
      toRPN('foo(2)');
      throw new Error('应当抛错');
    } catch (e) {
      expect(e).toBeInstanceOf(ShuntingYardError);
      expect((e as ShuntingYardError).message).toContain('未知标识符');
      expect((e as ShuntingYardError).pos).toBe(0);
    }
  });

  it('除零 1/0 抛出明确错误', () => {
    expect(() => evalRPN(toRPN('1/0'))).toThrow('除零');
  });

  it('函数参数个数错误 sqrt(1,2) 报错', () => {
    expect(() => evalRPN(toRPN('sqrt(1,2)'))).toThrow('参数个数');
  });

  it('逗号出现在函数外报错', () => {
    expect(() => toRPN('1,2')).toThrow('逗号');
  });

  it('空表达式报错', () => {
    expect(() => toRPN('   ')).toThrow('为空');
  });

  it('尾随运算符 1 + 报“操作数缺失”错误', () => {
    expect(() => toRPN('1 +')).toThrow('操作数');
  });

  it('错误对象携带已产生的 partialSteps 供 UI 回放', () => {
    try {
      toRPN('(1+2');
      throw new Error('应当抛错');
    } catch (e) {
      const err = e as ShuntingYardError;
      expect(err).toBeInstanceOf(ShuntingYardError);
      expect(err.partialSteps.length).toBeGreaterThan(0);
    }
  });
});

describe('evaluateExpression 便捷入口', () => {
  it('一次返回 RPN 文本、步骤与结果', () => {
    const r = evaluateExpression('3 + 4 * 2 / ( 1 - 5 ) ^ 2');
    expect(r.rpnText).toBe('3 4 2 * 1 5 - 2 ^ / +');
    expect(r.result).toBeCloseTo(3.5, 10);
    expect(r.rpnSteps.length).toBeGreaterThan(r.rpn.length - 2);
    expect(r.evalSteps[r.evalSteps.length - 1]?.valueStack).toEqual([3.5]);
  });
});
