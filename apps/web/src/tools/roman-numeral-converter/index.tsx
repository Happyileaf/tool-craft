'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { integerToRoman, romanToInteger } from './utils/roman';
import type { BatchLineResult } from './utils/roman';
import {
  DEFAULT_BATCH_INPUT,
  DEFAULT_INPUT,
  DIRECTION_OPTIONS,
  type RomanDirection,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 按选定方向执行单行转换
 *
 * @param raw - 原始输入
 * @param direction - 转换方向
 * @returns 转换结果
 */
function convertWithDirection(raw: string, direction: RomanDirection): string {
  if (direction === 'toRoman') {
    return integerToRoman(Number(raw.trim()));
  }
  if (direction === 'toInteger') {
    return String(romanToInteger(raw));
  }
  const trimmed = raw.trim();
  if (/^\d+$/.test(trimmed)) {
    return integerToRoman(Number(trimmed));
  }
  return String(romanToInteger(trimmed));
}

/**
 * 罗马数字转换器：在 1–3999 范围内完成整数与标准减法记法罗马数字的双向精确转换，
 * 严格校验非法写法（IIII、VX、IC、MMMM 等），并支持逐行批量转换。全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入，作为单行转换初值
 * @returns 罗马数字转换交互界面
 */
const RomanNumeralConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<RomanDirection>('auto');
  const [singleInput, setSingleInput] = React.useState<string>(defaultInput || DEFAULT_INPUT);
  const [batchInput, setBatchInput] = React.useState<string>(DEFAULT_BATCH_INPUT);

  const singleResult = React.useMemo(() => {
    if (!singleInput.trim()) {
      return null;
    }
    try {
      return { output: convertWithDirection(singleInput, direction), error: null as string | null };
    } catch (caught) {
      return { output: null, error: caught instanceof Error ? caught.message : '转换失败' };
    }
  }, [singleInput, direction]);

  const batchResults = React.useMemo<BatchLineResult[]>(() => {
    if (!batchInput.trim()) {
      return [];
    }
    return batchInput
      .split('\n')
      .map((raw, index) => ({ raw, line: index + 1 }))
      .filter(({ raw }) => raw.trim().length > 0)
      .map(({ raw, line }) => {
        try {
          return { line, input: raw.trim(), output: convertWithDirection(raw, direction), error: null };
        } catch (caught) {
          return {
            line,
            input: raw.trim(),
            output: null,
            error: caught instanceof Error ? caught.message : '转换失败',
          };
        }
      });
  }, [batchInput, direction]);

  const batchOutputText = React.useMemo(
    () =>
      batchResults
        .map((item) => (item.error ? `第 ${item.line} 行错误：${item.error}` : item.output))
        .join('\n'),
    [batchResults],
  );

  /**
   * 复制单行结果或批量输出
   */
  const handleCopy = async (text: string) => {
    if (!text) {
      return;
    }
    await copyToClipboard(text);
    message.success('复制成功');
  };

  const columns = [
    { title: '行', dataIndex: 'line', key: 'line', width: 56 },
    {
      title: '输入',
      dataIndex: 'input',
      key: 'input',
      render: (text: string) => <span className={styles.monoText}>{text}</span>,
    },
    {
      title: '结果',
      key: 'result',
      render: (_: unknown, record: BatchLineResult) =>
        record.error ? (
          <Tag color="error">{record.error}</Tag>
        ) : (
          <span className={styles.resultValue}>{record.output}</span>
        ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="单行转换（标准减法记法，范围 1–3999）">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={direction}
            onChange={(event) => setDirection(event.target.value as RomanDirection)}
            options={DIRECTION_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
          />
          <Input
            value={singleInput}
            onChange={(event) => setSingleInput(event.target.value)}
            placeholder="输入整数（1–3999）或罗马数字（如 MCMXCIV）"
            spellCheck={false}
            className={styles.monoOutput}
          />
          {singleResult?.error ? (
            <Alert type="error" showIcon message="转换失败" description={singleResult.error} />
          ) : singleResult?.output ? (
            <Space size={12} wrap>
              <span className={styles.resultValue}>{singleResult.output}</span>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(singleResult.output ?? '')}
              >
                复制结果
              </Button>
            </Space>
          ) : null}
          <div className={styles.hint}>
            标准罗马数字使用减法记法：IV=4、IX=9、XL=40、XC=90、CD=400、CM=900；
            罗马输入容忍大小写与首尾空白，IIII、VX、IC、MMMM 等非标准写法会被拒绝。
          </div>
        </Space>
      </Card>

      <Card className={styles.card} title="批量逐行转换">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.TextArea
            value={batchInput}
            onChange={(event) => setBatchInput(event.target.value)}
            placeholder="每行一个整数或罗马数字"
            autoSize={{ minRows: 5, maxRows: 14 }}
            spellCheck={false}
            className={styles.monoOutput}
          />
          <Button icon={<CopyOutlined />} onClick={() => handleCopy(batchOutputText)}>
            复制全部结果
          </Button>
          <Table
            columns={columns}
            dataSource={batchResults}
            rowKey="line"
            size="small"
            pagination={false}
          />
        </Space>
      </Card>
    </div>
  );
};

export default RomanNumeralConverter;
