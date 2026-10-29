'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Input, Space, Statistic, Table, Tag } from 'antd';
import { BankOutlined, ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import { luhnSteps } from './utils/luhn';
import { formatCardNumber, validateCardNumber } from './utils/card';
import { DEFAULT_CARD_NUMBER, SAMPLE_CARDS } from './constants';
import styles from './index.module.css';

/**
 * 银行卡号校验与卡种识别：对输入卡号执行 Luhn（模 10）校验，
 * 依据 IIN 前缀与长度识别卡组织，并展示逐位计算过程，全部在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns 卡号校验交互界面
 */
const BankCardValidator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [raw, setRaw] = React.useState<string>(defaultInput || DEFAULT_CARD_NUMBER);

  const result = React.useMemo(() => validateCardNumber(raw), [raw]);

  const steps = React.useMemo(() => {
    if (result.illegalChars || result.empty || !result.lengthValid) {
      return [];
    }
    return luhnSteps(result.digits);
  }, [result]);

  const statusAlert = (): React.ReactNode => {
    if (result.empty) {
      return <Alert type="info" showIcon message="请输入银行卡号 / 信用卡号" />;
    }
    if (result.illegalChars) {
      return (
        <Alert
          type="error"
          showIcon
          message="含非法字符"
          description="卡号只能包含数字、空格与连字符（-），请检查输入。"
        />
      );
    }
    if (!result.lengthValid) {
      return (
        <Alert
          type="error"
          showIcon
          message={`长度不合法：当前 ${result.length} 位`}
          description="银行卡号长度应在 12–19 位之间（空格与连字符不计）。"
        />
      );
    }
    if (result.luhnValid) {
      return (
        <Alert
          type="success"
          showIcon
          message="Luhn 校验通过"
          description={`卡号格式合法，识别为 ${result.brand.label}。`}
        />
      );
    }
    return (
      <Alert
        type="error"
        showIcon
        message="Luhn 校验失败"
        description={
          result.brand.key === 'unknown'
            ? '卡号未通过模 10 校验，且未匹配已知卡组织，请确认是否输入有误。'
            : `疑似 ${result.brand.label}，但未通过模 10 校验，请确认卡号是否输入有误。`
        }
      />
    );
  };

  return (
    <div className={styles.container}>
      <Card title="银行卡号校验与卡种识别">
        <Input
          size="large"
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          placeholder="输入卡号，可含空格或连字符，如 4111 1111 1111 1111"
          prefix={<BankOutlined />}
          className={styles.cardInput}
        />
        <Space style={{ marginTop: 12 }}>
          <a onClick={() => setRaw(DEFAULT_CARD_NUMBER)}>
            <ReloadOutlined /> 载入示例
          </a>
          <a onClick={() => setRaw('')}>
            <ClearOutlined /> 清空
          </a>
        </Space>
        <div style={{ marginTop: 16 }}>{statusAlert()}</div>
      </Card>

      <Card title="校验结果">
        <Space size="large" wrap>
          <Statistic title="长度" value={result.length} suffix="位" />
          <Statistic
            title="分组展示"
            value={result.digits ? formatCardNumber(result.digits) : '—'}
            valueStyle={{ fontFamily: 'ui-monospace, monospace', fontSize: 18 }}
          />
          <Statistic
            title="Luhn 总和"
            value={result.luhnTotal === null ? '—' : result.luhnTotal}
          />
          <div>
            <div className={styles.statLabel}>卡组织</div>
            <Tag color={result.brand.key === 'unknown' ? 'default' : 'blue'} style={{ marginTop: 6 }}>
              {result.brand.label}
            </Tag>
          </div>
          <div>
            <div className={styles.statLabel}>结论</div>
            <Tag color={result.valid ? 'success' : 'error'} style={{ marginTop: 6 }}>
              {result.valid ? '有效' : '无效'}
            </Tag>
          </div>
        </Space>
      </Card>

      <Card title="Luhn（模 10）计算过程" className={styles.stepsCard}>
        {steps.length === 0 ? (
          <span className={styles.muted}>输入合法数字卡号后展示逐位计算明细。</span>
        ) : (
          <>
            <div className={styles.stepsWrap}>
              {steps.map((step, index) => (
                <div key={index} className={styles.stepCell}>
                  <div className={styles.stepDigit}>{step.digit}</div>
                  <div className={styles.stepMeta}>{step.doubled ? `×2→${step.contribution}` : '×1'}</div>
                </div>
              ))}
            </div>
            <div className={styles.muted} style={{ marginTop: 12 }}>
              从右往左偶数位先乘 2，结果大于 9 则减 9；总和 {result.luhnTotal}，能被 10 整除即通过。
            </div>
          </>
        )}
      </Card>

      <Card title="常见公开测试卡号">
        <Table
          size="small"
          rowKey="number"
          pagination={false}
          dataSource={SAMPLE_CARDS}
          columns={[
            { title: '卡组织', dataIndex: 'brand', key: 'brand' },
            {
              title: '测试卡号',
              dataIndex: 'number',
              key: 'number',
              render: (value: string) => (
                <a onClick={() => setRaw(value)}>
                  <code>{value}</code>
                </a>
              ),
            },
          ]}
        />
        <div className={styles.muted} style={{ marginTop: 12 }}>
          以上均为各支付渠道公开的测试号，不对应真实账户；卡号仅在浏览器本地校验，不会上传。
        </div>
      </Card>
    </div>
  );
};

export default BankCardValidator;
