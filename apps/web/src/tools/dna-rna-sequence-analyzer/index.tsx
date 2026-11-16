'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Col, Descriptions, Input, Row, Space, Statistic, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  AMINO_ACID_NAMES,
  DEFAULT_SAMPLE,
  IUPAC_AMBIGUOUS,
  MAX_SEQUENCE_LENGTH,
} from './constants';
import { analyzeSequence, type FrameTranslation } from './utils/sequence';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * DNA / RNA 序列分析器
 *
 * 粘贴核酸序列（支持 FASTA 头、空白、行号、空位），本地完成类型识别、
 * 碱基统计、互补 / 反向互补 / 转录与六框翻译，序列不上传。
 */
const DnaRnaSequenceAnalyzer: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [raw, setRaw] = React.useState(defaultInput || DEFAULT_SAMPLE);
  const result = React.useMemo(() => analyzeSequence(raw), [raw]);

  const handleCopy = (label: string, text: string) => {
    if (!text) {
      message.error('暂无可复制的内容');
      return;
    }
    copyToClipboard(text);
    message.success(`已复制${label}`);
  };

  const frameColumns: ColumnsType<FrameTranslation> = [
    { title: '读框', dataIndex: 'frame', key: 'frame', width: 90, render: (v) => <Tag color="blue">{v}</Tag> },
    {
      title: '氨基酸序列（* 终止 / X 模糊）',
      dataIndex: 'peptides',
      key: 'peptides',
      render: (peptides: string, row) => (
        <Space direction="vertical" size={2}>
          <code className={styles.mono}>{peptides || '—'}</code>
          <span className={styles.hint}>
            {row.stopPositions.length > 0 ? `终止密码子位置（肽链 0-based）：${row.stopPositions.join(', ')}` : '无终止密码子'}
            {row.trailingBases > 0 ? `；末尾 ${row.trailingBases} 个碱基不足一个密码子，未翻译` : ''}
          </span>
        </Space>
      ),
    },
  ];

  const baseEntries = result.error
    ? []
    : Object.entries(result.stats.counts).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className={styles.container}>
      <Card
        title="序列输入（支持 FASTA 头、空格、换行、数字行号与 - 空位）"
        extra={
          <Space>
            <Button size="small" onClick={() => setRaw(DEFAULT_SAMPLE)}>
              示例序列
            </Button>
            <Button size="small" type="primary" ghost onClick={() => setRaw('')}>
              清空
            </Button>
          </Space>
        }
      >
        <Input.TextArea
          value={raw}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRaw(e.target.value)}
          spellCheck={false}
          className={styles.editor}
          autoSize={{ minRows: 6, maxRows: 16 }}
          placeholder="粘贴 DNA / RNA / IUPAC 序列，例如 ATGCGTACGTAG…"
        />
        <div className={styles.inputMeta}>
          <span>长度上限 {MAX_SEQUENCE_LENGTH.toLocaleString()} nt</span>
          {!result.error ? <span>清洗后长度：{result.stats.length} nt</span> : null}
        </div>
      </Card>

      {result.error ? (
        <Alert type="error" showIcon message="无法分析" description={result.error} />
      ) : (
        <>
          <Card title="类型与统计">
            <Row gutter={[16, 16]}>
              <Col xs={12} md={6}>
                <Statistic
                  title="核酸类型"
                  value={result.type}
                  suffix={result.typeInferred ? '（推断）' : ''}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic title="长度 (nt)" value={result.stats.length} />
              </Col>
              <Col xs={12} md={6}>
                <Statistic title="GC 含量" value={(result.stats.gcContent * 100).toFixed(2)} suffix="%" />
              </Col>
              <Col xs={12} md={6}>
                <Statistic title="AT/AU 含量" value={(result.stats.atContent * 100).toFixed(2)} suffix="%" />
              </Col>
            </Row>
            <Descriptions className={styles.baseCounts} size="small" column={{ xs: 3, md: 6 }} bordered>
              {baseEntries.map(([base, count]) => (
                <Descriptions.Item
                  key={base}
                  label={
                    <span>
                      {base}
                      {IUPAC_AMBIGUOUS.has(base) ? <Tag className={styles.ambiguousTag}>模糊</Tag> : null}
                    </span>
                  }
                >
                  {count}
                </Descriptions.Item>
              ))}
            </Descriptions>
            <Space wrap className={styles.noticeRow}>
              {result.stats.ambiguousCount > 0 ? (
                <Tag color="orange">含 {result.stats.ambiguousCount} 个 IUPAC 模糊碱基</Tag>
              ) : null}
              {result.clean.removedGaps > 0 ? <Tag>移除 {result.clean.removedGaps} 个空位 -</Tag> : null}
              {result.clean.fastaHeaders > 0 ? <Tag>识别 {result.clean.fastaHeaders} 条 FASTA 头</Tag> : null}
              {result.typeInferred ? <Tag color="purple">序列不含 T/U，按 DNA 推断处理</Tag> : null}
            </Space>
          </Card>

          <Card title="序列变换">
            <div className={styles.transformList}>
              {[
                { label: '互补链', text: result.complement },
                { label: '反向互补链', text: result.reverseComplement },
                { label: '转录 mRNA', text: result.mrna },
              ].map((item) => (
                <div key={item.label} className={styles.transformRow}>
                  <div className={styles.transformLabel}>{item.label}</div>
                  <code className={styles.sequenceBox}>{item.text}</code>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(item.label, item.text)}
                  >
                    复制
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card title="六框翻译（正向 +1/+2/+3，反向 −1/−2/−3）">
            <Table<FrameTranslation>
              rowKey="frame"
              columns={frameColumns}
              dataSource={result.frames}
              pagination={false}
              size="small"
            />
            <Alert
              className={styles.noticeRow}
              type="info"
              showIcon
              message="翻译使用标准遗传密码表：* 表示终止密码子（保留以便识别完整 ORF），X 表示密码子含模糊碱基无法确定氨基酸。"
            />
          </Card>

          <Card title="氨基酸图例" size="small">
            <div className={styles.aminoLegend}>
              {Object.entries(AMINO_ACID_NAMES).map(([code, name]) => (
                <Tag key={code}>
                  <strong>{code}</strong>：{name}
                </Tag>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default DnaRnaSequenceAnalyzer;
