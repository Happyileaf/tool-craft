'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Space, Statistic, Tag } from 'antd';
import { ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import { DEFAULT_INPUT, EMPTY_TEXT, INPUT_HINT } from './constants';
import { analyzeSms } from './utils/sms';
import styles from './index.module.css';

/**
 * SMS 短信长度与分段计算器：按 3GPP TS 23.038 自动判定 GSM 7-bit / UCS-2，
 * 实时显示 septet / 码元用量、分条数量与每条剩余容量，全部本地运算。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认短信正文
 * @returns SMS 分段计算交互界面
 */
const SmsSegmentCalculator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [text, setText] = React.useState<string>(defaultInput || DEFAULT_INPUT);
  const analysis = React.useMemo(() => analyzeSms(text), [text]);

  const reset = () => setText(DEFAULT_INPUT);
  const empty = text.length === 0;

  // 最后一条的占用（非拼接时即整条占用）
  const usedInLastSegment = analysis.isConcatenated
    ? analysis.totalUnits - (analysis.segments - 1) * analysis.perSegmentMax
    : analysis.totalUnits;
  const remainingInLastSegment = analysis.segments > 0 ? analysis.perSegmentMax - usedInLastSegment : 0;

  return (
    <div className={styles.container}>
      <Card
        title="SMS 短信长度与分段计算器"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={reset}>
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setText('')}>
              清空
            </Button>
          </Space>
        }
      >
        {empty && <Alert type="info" showIcon message={EMPTY_TEXT} style={{ marginBottom: 12 }} />}
        <Input.TextArea
          className={styles.textarea}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="输入短信正文…"
          autoSize={{ minRows: 5, maxRows: 16 }}
        />
        <div className={styles.hint}>{INPUT_HINT}</div>
      </Card>

      {!empty && analysis.encoding && (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            <span>编码方式：</span>
            {analysis.encoding === 'gsm7' ? (
              <Tag color="blue">GSM 7-bit（每字符 1 septet，扩展字符 2 septet）</Tag>
            ) : (
              <Tag color="purple">UCS-2（每 UTF-16 码元 2 字节）</Tag>
            )}
            {analysis.isConcatenated && <Tag color="orange">拼接长短信（含 UDH 开销）</Tag>}
          </Space>

          <div className={styles.statsRow}>
            <Card className={styles.statCard} size="small">
              <Statistic
                title="分条数量"
                value={analysis.segments}
                suffix="条"
                valueStyle={{ color: analysis.isConcatenated ? '#d46b08' : '#3f8600' }}
              />
            </Card>
            <Card className={styles.statCard} size="small">
              <Statistic
                title={analysis.encoding === 'gsm7' ? 'Septet 用量' : 'UTF-16 码元用量'}
                value={analysis.totalUnits}
              />
            </Card>
            <Card className={styles.statCard} size="small">
              <Statistic title="字符数（码元）" value={analysis.charCount} />
            </Card>
            <Card className={styles.statCard} size="small">
              <Statistic
                title="末条剩余容量"
                value={remainingInLastSegment}
                suffix={`/ ${analysis.perSegmentMax}`}
              />
            </Card>
          </div>

          {analysis.encoding === 'ucs2' && analysis.nonGsmChars.length > 0 && (
            <Alert
              style={{ marginTop: 16 }}
              type="warning"
              showIcon
              message="以下字符不在 GSM 7-bit 字母表，整信已按 UCS-2 计费（仅展示前 20 个触发字符）"
              description={
                <span className={styles.nonGsmList}>
                  {analysis.nonGsmChars
                    .map((item) => `${item.char}(@${item.index})`)
                    .join('、')}
                </span>
              }
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default SmsSegmentCalculator;
