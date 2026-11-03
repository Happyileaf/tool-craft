'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Input,
  Progress,
  Radio,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CopyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  SMS_MODE_OPTIONS,
  SMS_SAMPLE_EXTENSION,
  SMS_SAMPLE_GSM,
  SMS_SAMPLE_UCS2,
  type SmsModeOption,
} from './constants';
import styles from './index.module.css';
import { analyzeSms, type SmsSegment } from './utils/sms';

const { Text } = Typography;

interface SegmentRow extends SmsSegment {
  key: string;
  charCount: number;
}

const SmsSegmentCalculator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = useState(defaultInput ?? SMS_SAMPLE_GSM);
  const [mode, setMode] = useState<SmsModeOption>('auto');

  const analysis = useMemo(() => analyzeSms(input, mode), [input, mode]);
  const isGsm = analysis.encoding === 'gsm7';
  const isMultipart = analysis.segmentCount > 1;
  const capacity = isMultipart ? analysis.concatCapacity : analysis.singleCapacity;
  const fillPercent = analysis.segmentCount === 0
    ? 0
    : Math.min(100, Math.round((analysis.usedInLastSegment / capacity) * 100));

  const segmentRows: SegmentRow[] = analysis.segments.map((segment) => ({
    ...segment,
    key: String(segment.ordinal),
    charCount: Array.from(segment.text).length,
  }));

  const nonGsmTotal = analysis.nonGsmChars.reduce((sum, mark) => sum + mark.count, 0);
  const nonGsmPreview = analysis.nonGsmChars.slice(0, 24);
  const capacityHint = isGsm
    ? '单条上限 160 septet，长短信每段 153 septet'
    : '单条上限 70 个编码单元（140 字节），长短信每段 67 个（134 字节净荷）';
  const encodingModeHint = mode === 'auto' ? '自动判定' : mode === 'gsm7' ? '强制 GSM-7' : '强制 UCS-2';
  const unitsLabel = isGsm ? 'Septet 单位' : 'UCS-2 编码单元';
  const statSubText = `字符数 ${analysis.charCount} · PDU 共 ${analysis.totalBytes} 字节`;
  const segmentHint = isMultipart ? '长短信 concat（每段含 6 字节 UDH）' : '单条发送';
  const progressStatus = fillPercent >= 100 ? 'exception' : 'active';

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败，请手动选择文本复制');
    }
  };

  const segmentColumns: ColumnsType<SegmentRow> = [
    {
      title: '段',
      dataIndex: 'ordinal',
      key: 'ordinal',
      width: 60,
      render: (n: number) => `#${n}`,
    },
    {
      title: '内容预览',
      dataIndex: 'text',
      key: 'text',
      render: (text: string) => (
        <Text copyable={{ text, tooltips: false }} className={styles.segmentText}>
          {text.length > 80 ? `${text.slice(0, 80)}…` : text || '（空）'}
        </Text>
      ),
    },
    { title: '字符数', dataIndex: 'charCount', key: 'charCount', width: 90 },
    { title: '单位占用', dataIndex: 'units', key: 'units', width: 100 },
    { title: 'PDU 字节', dataIndex: 'bytes', key: 'bytes', width: 100 },
  ];

  return (
    <div className={styles.container}>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
              <Text strong>短信内容</Text>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                size="small"
                value={mode}
                onChange={(event) => setMode(event.target.value as SmsModeOption)}
                options={SMS_MODE_OPTIONS}
              />
            </Space>
            <Input.TextArea
              className={styles.editor}
              rows={5}
              showCount
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="输入短信文本；包含中文或 emoji 时自动切换 UCS-2 编码"
              style={{ marginTop: 8 }}
            />
          </div>

          <Space wrap>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => setInput(SMS_SAMPLE_GSM)}>
              GSM-7 示例
            </Button>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => setInput(SMS_SAMPLE_UCS2)}>
              中文（UCS-2）示例
            </Button>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => setInput(SMS_SAMPLE_EXTENSION)}>
              扩展字符示例
            </Button>
            <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(input)} disabled={!input}>
              复制原文
            </Button>
          </Space>

          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>编码方式</div>
              <div className={styles.statValue}>
                <Tag color={isGsm ? 'green' : 'orange'} style={{ fontSize: 14, padding: '2px 10px' }}>
                  {isGsm ? 'GSM 7-bit' : 'UCS-2'}
                </Tag>
              </div>
              <div className={styles.statSub}>{encodingModeHint}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>计费分片条数</div>
              <div className={styles.statValue}>{analysis.segmentCount}</div>
              <div className={styles.statSub}>{segmentHint}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>{unitsLabel}</div>
              <div className={styles.statValue}>{analysis.totalUnits}</div>
              <div className={styles.statSub}>{statSubText}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>末段剩余可输入</div>
              <div className={styles.statValue}>{analysis.remainingInLastSegment}</div>
              <Progress
                percent={fillPercent}
                size="small"
                status={progressStatus}
                style={{ marginTop: 6, marginBottom: 0 }}
              />
            </div>
          </div>

          {analysis.warnings.length > 0 && (
            <div className={styles.warnings}>
              {analysis.warnings.map((warning) => (
                <Alert
                  key={warning}
                  type={warning.includes('无法编码') ? 'error' : 'warning'}
                  showIcon
                  message={warning}
                />
              ))}
            </div>
          )}

          {isGsm && analysis.extensionChars.length > 0 && (
            <div>
              <Text strong>GSM 扩展字符（每个占 2 个 7-bit 单位）：</Text>
              <div className={styles.charTags} style={{ marginTop: 8 }}>
                {analysis.extensionChars.map((mark) => (
                  <Tag key={mark.char} color="purple">
                    {mark.char === '\\' ? '反斜杠 \\' : mark.char} ×{mark.count}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {!isGsm && analysis.nonGsmChars.length > 0 && (
            <div>
              <Text strong>{`非 GSM 字符（共 ${nonGsmTotal} 个，导致 UCS-2 编码）：`}</Text>
              <div className={styles.charTags} style={{ marginTop: 8 }}>
                {nonGsmPreview.map((mark) => (
                  <Tag key={mark.char} color="orange">
                    {mark.char} ×{mark.count}
                  </Tag>
                ))}
                {analysis.nonGsmChars.length > 24 && (
                  <Tag>等 {analysis.nonGsmChars.length} 种</Tag>
                )}
              </div>
            </div>
          )}

          {segmentRows.length > 0 && (
            <Table<SegmentRow>
              columns={segmentColumns}
              dataSource={segmentRows}
              pagination={false}
              size="small"
              bordered
              title={() => (
                <Space wrap>
                  <Text strong>分片明细</Text>
                  <Text type="secondary">{capacityHint}</Text>
                </Space>
              )}
            />
          )}
        </Space>
      </Card>
    </div>
  );
};

export default SmsSegmentCalculator;
