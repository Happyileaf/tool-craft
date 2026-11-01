'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Space, Switch, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { evaluateProgram, formatNumber } from './utils/evaluator';
import { DEFAULT_SAMPLE, SAMPLE_OPTIONS } from './constants';
import styles from './index.module.css';

/**
 * 数学表达式求值器：支持运算符优先级、括号、常用数学函数、
 * pi / e 常量与变量赋值，展示最终结果、变量表与逐步计算过程。
 * 全部运算在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认表达式输入
 * @returns 表达式求值交互界面
 */
const MathExpressionEvaluator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_SAMPLE);
  const [degrees, setDegrees] = React.useState<boolean>(false);

  const { value, steps, variables, error } = React.useMemo(() => {
    try {
      const result = evaluateProgram(input, { degrees });
      return { ...result, error: null as string | null };
    } catch (caught) {
      return {
        value: undefined as number | undefined,
        steps: [] as ReturnType<typeof evaluateProgram>['steps'],
        variables: {} as Record<string, number>,
        error: caught instanceof Error ? caught.message : '表达式求值失败',
      };
    }
  }, [input, degrees]);

  /**
   * 清空输入
   */
  const handleClear = () => {
    setInput('');
  };

  /**
   * 复制最终结果
   */
  const handleCopy = async () => {
    if (error || value === undefined) {
      message.error('暂无可复制的结果');
      return;
    }
    await copyToClipboard(formatNumber(value));
    message.success('复制成功');
  };

  const variableNames = Object.keys(variables);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap className={styles.options}>
          <Space size={4}>
            <span>角度模式</span>
            <Switch checked={degrees} onChange={setDegrees} />
            <span className={styles.meta}>{degrees ? 'sin/cos 等以度为单位' : '默认弧度'}</span>
          </Space>
          <span className={styles.meta}>
            {SAMPLE_OPTIONS.map((sample) => (
              <Button
                key={sample.label}
                size="small"
                type="link"
                style={{ padding: '0 4px' }}
                onClick={() => setInput(sample.value)}
              >
                {sample.label}
              </Button>
            ))}
          </span>
        </Space>
        <Space>
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            清空
          </Button>
        </Space>
      </div>

      <div className={styles.panels}>
        <Card title="输入表达式（每行一条语句）" className={styles.card}>
          <Input.TextArea
            className={styles.code}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={'例如：\nr = 5\npi * r^2'}
            autoSize={{ minRows: 16, maxRows: 28 }}
          />
        </Card>

        <Card
          title="求值结果"
          className={styles.card}
          extra={
            !error && value !== undefined ? (
              <Button type="text" icon={<CopyOutlined />} onClick={handleCopy}>
                复制结果
              </Button>
            ) : null
          }
        >
          {error ? (
            <Alert type="error" showIcon message="无法求值" description={error} />
          ) : (
            <>
              <div className={styles.result}>{value === undefined ? '' : formatNumber(value)}</div>
              {variableNames.length > 0 ? (
                <Space size={[4, 8]} wrap className={styles.variables}>
                  {variableNames.map((name) => (
                    <Tag key={name}>
                      {name} = {formatNumber(variables[name]!)}
                    </Tag>
                  ))}
                </Space>
              ) : null}
              <div className={styles.steps}>
                {steps.map((step, index) =>
                  step.heading ? (
                    <div key={index} className={styles.stepHeading}>
                      {step.text}
                    </div>
                  ) : (
                    <div key={index} className={styles.step}>
                      {step.text}
                    </div>
                  ),
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MathExpressionEvaluator;
