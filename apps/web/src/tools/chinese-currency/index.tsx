'use client';

import React from 'react';
import { Alert, Button, Card, Input, Space, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { convertToRmb } from './utils/rmb';
import { AMOUNT_EXAMPLES, DEFAULT_AMOUNT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 数字转中文大写金额工具：把阿拉伯数字金额实时转换为人民币中文大写，
 * 用于发票、收据与合同填写。全部运算在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入金额
 * @returns 中文大写金额转换界面
 */
const ChineseCurrency: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [amount, setAmount] = React.useState<string>(defaultInput || DEFAULT_AMOUNT);

  const result = React.useMemo(() => convertToRmb(amount), [amount]);

  const handleCopy = async () => {
    if (!result.text) {
      return;
    }
    try {
      await copyToClipboard(result.text);
      message.success('已复制中文大写金额');
    } catch {
      message.error('复制失败，请手动选择文本复制');
    }
  };

  return (
    <div className={styles.container}>
      <Card
        title="数字转中文大写金额"
        extra={<Tag color="blue">人民币 RMB</Tag>}
      >
        <div className={styles.field}>
          <span className={styles.label}>输入金额（阿拉伯数字，支持千分位逗号）</span>
          <Input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="例如 12345.67"
            size="large"
            suffix="元"
          />
          <div className={styles.examples}>
            {AMOUNT_EXAMPLES.map((example) => (
              <Button key={example} size="small" onClick={() => setAmount(example)}>
                {example}
              </Button>
            ))}
          </div>
        </div>

        {result.error ? (
          <Alert
            style={{ marginTop: 16 }}
            type="error"
            showIcon
            message={result.error}
            description="仅支持非负金额；整数最多 16 位，小数最多 2 位（更多位自动四舍五入到分）。"
          />
        ) : result.text ? (
          <div className={styles.result} style={{ marginTop: 16 }}>
            <span className={styles.resultValue}>{result.text}</span>
            <Space>
              <Button
                icon={<CopyOutlined />}
                onClick={handleCopy}
                disabled={!result.text}
              >
                复制
              </Button>
              <Button icon={<ClearOutlined />} onClick={() => setAmount('')}>
                清空
              </Button>
            </Space>
          </div>
        ) : (
          <div className={styles.result} style={{ marginTop: 16 }}>
            <span className={styles.resultEmpty}>输入金额后将实时显示中文大写</span>
          </div>
        )}

        <p className={styles.hint} style={{ marginTop: 12 }}>
          规则依据《支付结算凭证填写规范》：整数金额末尾写「整」；有角无分角后可省略「整」；有分则分后不写「整」。
        </p>
      </Card>
    </div>
  );
};

export default ChineseCurrency;
