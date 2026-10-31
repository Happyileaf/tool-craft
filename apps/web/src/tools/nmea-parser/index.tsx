'use client';

import { useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Input, Space, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { DEFAULT_INPUT, HINT } from './constants';
import { parseLines, typeLabel, type ParsedSentence } from './utils/nmea';
import styles from './index.module.css';

const { TextArea } = Input;

interface FieldRow {
  key: string;
  label: string;
  value: string;
}

function fieldRows(sentence: ParsedSentence): FieldRow[] {
  if (sentence.decoded.length > 0) {
    return sentence.decoded
      .filter((d) => d.value !== null)
      .map((d, i) => ({ key: `d-${i}`, label: d.label, value: d.value ?? '' }));
  }
  return sentence.fields.map((raw, i) => ({
    key: `f-${i}`,
    label: `字段 ${i + 1}`,
    value: raw === '' ? '（缺测）' : raw,
  }));
}

function NmeaParser({ defaultInput }: ToolComponentProps) {
  const [input, setInput] = useState(defaultInput ?? DEFAULT_INPUT);

  const batch = useMemo(() => parseLines(input), [input]);

  const handleCopyJson = () => {
    if (batch.total === 0) {
      message.error('暂无可复制的结果');
      return;
    }
    const simplified = batch.sentences.map((s) => ({
      raw: s.raw,
      valid: s.valid,
      talker: s.talker,
      type: s.type,
      checksumGiven: s.checksumGiven,
      checksumCalculated: s.checksumCalculated,
      decoded: Object.fromEntries(
        s.decoded.filter((d) => d.value !== null).map((d) => [d.label, d.value]),
      ),
      error: s.error,
    }));
    navigator.clipboard
      .writeText(JSON.stringify(simplified, null, 2))
      .then(() => message.success('解析结果 JSON 已复制'))
      .catch(() => message.error('复制失败，请检查浏览器剪贴板权限'));
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="NMEA 0183 语句输入">
        <Space direction="vertical" className={styles.fullWidth} size={12}>
          <div className={styles.toolbar}>
            <Tag color="blue">共 {batch.total} 条</Tag>
            <Tag color="success">有效 {batch.validCount}</Tag>
            <Tag color={batch.invalidCount > 0 ? 'red' : 'default'}>
              无效 {batch.invalidCount}
            </Tag>
            <Button size="small" onClick={handleCopyJson} icon={<CopyOutlined />}>
              复制解析结果（JSON）
            </Button>
          </div>
          <TextArea
            className={styles.editor}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoSize={{ minRows: 6, maxRows: 16 }}
            spellCheck={false}
          />
          <p className={styles.hint}>{HINT}</p>
        </Space>
      </Card>

      {batch.total === 0 ? (
        <Empty description="输入语句后在此显示解析结果" />
      ) : (
        batch.sentences.map((sentence, idx) => (
          <Card
            key={`${idx}-${sentence.raw}`}
            size="small"
            className={styles.card}
            title={
              <div className={styles.sentenceHeader}>
                <Tag color={sentence.valid ? 'success' : 'error'}>
                  {sentence.valid ? '有效' : '无效'}
                </Tag>
                {sentence.talker && <Tag>{sentence.talker}</Tag>}
                {sentence.type && (
                  <Tag color="blue">
                    {sentence.type} · {typeLabel(sentence.type)}
                  </Tag>
                )}
                {sentence.checksumGiven && (
                  <Tag>
                    校验和 {sentence.checksumGiven}
                    {sentence.valid ? ' ✓' : ` / 应为 ${sentence.checksumCalculated}`}
                  </Tag>
                )}
              </div>
            }
          >
            <Space direction="vertical" className={styles.fullWidth} size={8}>
              <div className={`${styles.mono} ${styles.rawLine}`}>{sentence.raw}</div>
              {sentence.error && (
                <Alert
                  type={sentence.valid ? 'info' : 'error'}
                  showIcon
                  message={sentence.error}
                />
              )}
              <Table<FieldRow>
                size="small"
                pagination={false}
                dataSource={fieldRows(sentence)}
                columns={[
                  { title: '字段', dataIndex: 'label', width: 220 },
                  {
                    title: '解码值',
                    dataIndex: 'value',
                    render: (v: string) => <span className={styles.mono}>{v}</span>,
                  },
                ]}
              />
            </Space>
          </Card>
        ))
      )}
    </div>
  );
}

export default NmeaParser;
