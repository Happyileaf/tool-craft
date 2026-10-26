'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Descriptions, Input, Space, Tag } from 'antd';
import {
  gcdMany,
  lcmMany,
  analyzeNumber,
  parseIntegerList,
} from './utils/number-theory';
import { CLASSIFICATION_META, DEFAULT_NUMBERS, DEFAULT_SINGLE_NUMBER } from './constants';
import styles from './index.module.css';

/**
 * 数论计算器：对 2–10 个整数计算最大公约数与最小公倍数（欧几里得算法，
 * LCM 先除后乘防溢出），并对单个整数做质因数分解、全部因数枚举与质数 / 合数判定。
 * 全部运算在浏览器本地完成，不发起网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入，用作单整数分析区初值
 * @returns 数论计算器交互界面
 */
const NumberTheoryCalculator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [numbersInput, setNumbersInput] = React.useState<string>(DEFAULT_NUMBERS);
  const [singleInput, setSingleInput] = React.useState<string>(
    defaultInput || DEFAULT_SINGLE_NUMBER,
  );

  const groupResult = React.useMemo<
    | { error: string }
    | { error: null; numbers: number[]; gcd: number; lcm: number }
    | null
  >(() => {
    if (!numbersInput.trim()) {
      return null;
    }
    try {
      const numbers = parseIntegerList(numbersInput);
      if (numbers.length < 2 || numbers.length > 10) {
        return { error: `请输入 2–10 个整数，当前为 ${numbers.length} 个` };
      }
      return {
        error: null,
        numbers,
        gcd: gcdMany(numbers),
        lcm: lcmMany(numbers),
      };
    } catch (caught) {
      return { error: caught instanceof Error ? caught.message : '输入有误' };
    }
  }, [numbersInput]);

  const singleResult = React.useMemo(() => {
    if (!singleInput.trim()) {
      return null;
    }
    try {
      return { result: analyzeNumber(singleInput), error: null as string | null };
    } catch (caught) {
      return { result: null, error: caught instanceof Error ? caught.message : '输入有误' };
    }
  }, [singleInput]);

  const classification = singleResult?.result
    ? CLASSIFICATION_META[singleResult.result.classification]
    : null;

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="最大公约数 GCD / 最小公倍数 LCM（2–10 个整数）">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.TextArea
            value={numbersInput}
            onChange={(event) => setNumbersInput(event.target.value)}
            placeholder="输入整数，用逗号、空格或换行分隔，如 12, 18, 24"
            autoSize={{ minRows: 2, maxRows: 6 }}
            spellCheck={false}
            className={styles.monoOutput}
          />
          {groupResult?.error ? (
            <Alert type="error" showIcon message="输入有误" description={groupResult.error} />
          ) : groupResult && groupResult.error === null ? (
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="输入整数">
                <span className={styles.monoText}>{groupResult.numbers.join(', ')}</span>
              </Descriptions.Item>
              <Descriptions.Item label="最大公约数 GCD">
                <span className={styles.resultValue}>{groupResult.gcd}</span>
              </Descriptions.Item>
              <Descriptions.Item label="最小公倍数 LCM">
                <span className={styles.resultValue}>
                  {groupResult.lcm}
                  {groupResult.lcm === 0 && (
                    <span className={styles.inlineHint}>（输入含 0 时 LCM 规定为 0）</span>
                  )}
                </span>
              </Descriptions.Item>
            </Descriptions>
          ) : null}
          <div className={styles.hint}>
            GCD 由欧几里得辗转相除归约；LCM(a,b) = |a × b| / GCD，实现时先除后乘以避免中间乘积溢出。
          </div>
        </Space>
      </Card>

      <Card className={styles.card} title="质因数分解 / 因数枚举 / 质数判定（单个整数）">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            value={singleInput}
            onChange={(event) => setSingleInput(event.target.value.trim())}
            placeholder="输入一个整数，如 360"
            spellCheck={false}
            className={styles.monoOutput}
          />
          {singleResult?.error ? (
            <Alert type="error" showIcon message="输入有误" description={singleResult.error} />
          ) : singleResult?.result ? (
            <>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="分类">
                  {classification && (
                    <Space size={8}>
                      <Tag color={classification.color}>{classification.label}</Tag>
                      <span className={styles.inlineHint}>{classification.hint}</span>
                    </Space>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="质因数分解">
                  <span className={styles.monoText}>{singleResult.result.factorExpression}</span>
                </Descriptions.Item>
                <Descriptions.Item label="正因数个数">
                  {singleResult.result.divisorCount}
                </Descriptions.Item>
                <Descriptions.Item label="全部正因数">
                  <span className={styles.monoText}>
                    {singleResult.result.divisors.length > 0
                      ? singleResult.result.divisors.join(', ')
                      : '0 没有有限的正因数集合'}
                  </span>
                </Descriptions.Item>
              </Descriptions>
              {singleResult.result.n < 0 && (
                <div className={styles.hint}>
                  已对负数取绝对值 |{singleResult.result.n}| = {singleResult.result.absolute} 进行分析。
                </div>
              )}
            </>
          ) : null}
          <div className={styles.hint}>
            质因数分解采用试除法（先试除 2，再枚举奇数至 √n）；因数成对枚举至 √n 后排序；
            输入限制在 Number.MAX_SAFE_INTEGER 以内以保证精确。
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default NumberTheoryCalculator;
