'use client';

import React from 'react';
import { Alert, Button, Card, Input, Space, Table, Tabs, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  appendCheckDigit,
  buildItf14,
  buildSSCC,
  gs1CheckDigit,
  toGtin14,
  verifyCheckDigit,
  verifyLines,
} from './utils/gs1';
import {
  DEFAULT_GTIN_INPUT,
  DEFAULT_ITF_BODY,
  DEFAULT_ITF_LEVEL,
  DEFAULT_SSCC_BODY,
  DEFAULT_SSCC_EXTENSION,
  DEFAULT_VERIFY_INPUT,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const mono = (text: string) => <span className={styles.editor}>{text}</span>;

const Gs1CheckDigitCalculator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  // Tab 1：校验位计算 / 批量验证
  const [single, setSingle] = React.useState('629104150021');
  const [batch, setBatch] = React.useState(defaultInput || DEFAULT_VERIFY_INPUT);

  const singleCalc = React.useMemo(() => gs1CheckDigit(single), [single]);
  const appended = React.useMemo(() => appendCheckDigit(single), [single]);
  const batchRows = React.useMemo(() => verifyLines(batch), [batch]);

  // Tab 2：SSCC
  const [ssccExt, setSsccExt] = React.useState(DEFAULT_SSCC_EXTENSION);
  const [ssccBody, setSsccBody] = React.useState(DEFAULT_SSCC_BODY);
  const sscc = React.useMemo(() => buildSSCC(ssccExt, ssccBody), [ssccExt, ssccBody]);

  // Tab 3：ITF-14
  const [itfLevel, setItfLevel] = React.useState(DEFAULT_ITF_LEVEL);
  const [itfBody, setItfBody] = React.useState(DEFAULT_ITF_BODY);
  const itf14 = React.useMemo(() => buildItf14(itfLevel, itfBody), [itfLevel, itfBody]);

  // Tab 4：GTIN 补零
  const [gtin, setGtin] = React.useState(DEFAULT_GTIN_INPUT);
  const gtin14 = React.useMemo(() => toGtin14(gtin), [gtin]);
  const gtinVerify = React.useMemo(() => verifyCheckDigit(gtin), [gtin]);

  const copy = (text: string, label: string) => {
    if (text === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(text);
    message.success(`已复制${label}`);
  };

  return (
    <div className={styles.container}>
      <Tabs
        items={[
          {
            key: 'check',
            label: '校验位计算 / 批量验证',
            children: (
              <div className={styles.panels}>
                <Card className={styles.card} title="单条 payload（不含校验位）">
                  <Input
                    value={single}
                    onChange={(e) => setSingle(e.target.value)}
                    className={styles.editor}
                    placeholder="输入纯数字 payload，如 629104150021"
                  />
                  {'error' in singleCalc ? (
                    <Alert
                      style={{ marginTop: 12 }}
                      type="error"
                      showIcon
                      message={singleCalc.error}
                    />
                  ) : (
                    <div className={styles.resultBox}>
                      <span className={styles.hint}>
                        加权和 {singleCalc.weightedSum} → mod 10 = {singleCalc.weightedSum % 10}{' '}
                        → 校验位
                      </span>
                      <span className={styles.resultCode}>{singleCalc.checkDigit}</span>
                      <div className={styles.steps}>
                        {singleCalc.steps.map((step, i) => (
                          <span key={i} className={styles.stepChip}>
                            {step.digit}×{step.weight}={step.product}
                          </span>
                        ))}
                      </div>
                      <Space>
                        <Button
                          size="small"
                          type="primary"
                          icon={<CopyOutlined />}
                          onClick={() => copy(appended.output, '完整编码')}
                          disabled={appended.error !== null}
                        >
                          复制完整编码 {appended.error === null ? mono(appended.output) : ''}
                        </Button>
                      </Space>
                    </div>
                  )}
                  <Input.TextArea
                    style={{ marginTop: 12 }}
                    value={batch}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setBatch(e.target.value)
                    }
                    spellCheck={false}
                    className={styles.editor}
                    autoSize={{ minRows: 6, maxRows: 14 }}
                    placeholder="批量验证：每行一个完整编码（含末位校验位）"
                  />
                </Card>

                <Card
                  className={styles.card}
                  title={`批量验证结果（${batchRows.length} 行）`}
                  extra={
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() =>
                        copy(batchRows.map((r) => `${r.input}\t${r.valid ? 'OK' : 'FAIL'}`).join('\n'), '批量结果')
                      }
                    >
                      复制
                    </Button>
                  }
                >
                  <Table
                    size="small"
                    pagination={false}
                    rowKey={(row) => String(row.index)}
                    dataSource={batchRows}
                    columns={[
                      { title: '行', dataIndex: 'index', width: 56 },
                      {
                        title: '输入',
                        dataIndex: 'input',
                        render: (value: string) => mono(value),
                      },
                      {
                        title: '结论',
                        dataIndex: 'valid',
                        width: 90,
                        render: (valid: boolean) => (
                          <Tag color={valid ? 'green' : 'red'}>{valid ? '通过' : '失败'}</Tag>
                        ),
                      },
                      { title: '说明', dataIndex: 'detail' },
                    ]}
                  />
                </Card>
              </div>
            ),
          },
          {
            key: 'sscc',
            label: 'SSCC 生成（18 位）',
            children: (
              <Card className={styles.card} title="系列货运包装箱代码 SSCC">
                <div className={styles.formRow}>
                  <span className={styles.fieldLabel}>扩展位（1 位）</span>
                  <Input
                    value={ssccExt}
                    onChange={(e) => setSsccExt(e.target.value)}
                    className={styles.editor}
                    style={{ width: 100 }}
                    maxLength={1}
                  />
                  <span className={styles.fieldLabel}>厂商代码 + 序列号（≤16 位）</span>
                  <Input
                    value={ssccBody}
                    onChange={(e) => setSsccBody(e.target.value)}
                    className={styles.editor}
                    style={{ width: 280 }}
                  />
                </div>
                {sscc.error !== null ? (
                  <Alert type="error" showIcon message={sscc.error} />
                ) : (
                  <div className={styles.resultBox}>
                    <span className={styles.hint}>
                      17 位 payload：{mono(sscc.payload)} → 校验位 {sscc.checkDigit}
                    </span>
                    <span className={styles.resultCode}>{sscc.output}</span>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copy(sscc.output, 'SSCC')}
                      style={{ width: 140 }}
                    >
                      复制 SSCC
                    </Button>
                  </div>
                )}
              </Card>
            ),
          },
          {
            key: 'itf14',
            label: 'ITF-14 / GTIN-14 生成',
            children: (
              <Card className={styles.card} title="ITF-14（14 位外箱编码）">
                <div className={styles.formRow}>
                  <span className={styles.fieldLabel}>包装指示符（0-9）</span>
                  <Input
                    value={itfLevel}
                    onChange={(e) => setItfLevel(e.target.value)}
                    className={styles.editor}
                    style={{ width: 100 }}
                    maxLength={1}
                  />
                  <span className={styles.fieldLabel}>内容码（不含校验位，≤12 位）</span>
                  <Input
                    value={itfBody}
                    onChange={(e) => setItfBody(e.target.value)}
                    className={styles.editor}
                    style={{ width: 280 }}
                  />
                </div>
                {itf14.error !== null ? (
                  <Alert type="error" showIcon message={itf14.error} />
                ) : (
                  <div className={styles.resultBox}>
                    <span className={styles.hint}>
                      13 位 payload：{mono(itf14.payload)} → 校验位 {itf14.checkDigit}
                    </span>
                    <span className={styles.resultCode}>{itf14.output}</span>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copy(itf14.output, 'ITF-14')}
                      style={{ width: 140 }}
                    >
                      复制 ITF-14
                    </Button>
                  </div>
                )}
              </Card>
            ),
          },
          {
            key: 'gtin14',
            label: 'GTIN 补零转 GTIN-14',
            children: (
              <Card className={styles.card} title="GTIN-8 / 12 / 13 → GTIN-14">
                <Input
                  value={gtin}
                  onChange={(e) => setGtin(e.target.value)}
                  className={styles.editor}
                  placeholder="输入含校验位的 GTIN-8/12/13/14 数字串"
                />
                <div style={{ marginTop: 12 }}>
                  {gtinVerify.error === null ? (
                    <Alert
                      type={gtinVerify.valid ? 'success' : 'warning'}
                      showIcon
                      message={
                        gtinVerify.valid
                          ? `原码校验通过（末位 ${gtinVerify.actual}）`
                          : `原码校验位不合法：末位 ${gtinVerify.actual}，应为 ${gtinVerify.expected}`
                      }
                    />
                  ) : (
                    <Alert type="error" showIcon message={gtinVerify.error} />
                  )}
                </div>
                {gtin14.error !== null ? (
                  <Alert style={{ marginTop: 12 }} type="error" showIcon message={gtin14.error} />
                ) : (
                  <div className={styles.resultBox}>
                    <span className={styles.hint}>左侧补零不改变模 10 加权结果，校验位保持不变</span>
                    <span className={styles.resultCode}>{gtin14.output}</span>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copy(gtin14.output, 'GTIN-14')}
                      style={{ width: 150 }}
                    >
                      复制 GTIN-14
                    </Button>
                  </div>
                )}
              </Card>
            ),
          },
        ]}
      />
      <Alert
        type="info"
        showIcon
        message="算法对齐 GS1 General Specifications：自右向左权重 3、1 交替，校验位 = (10 − 加权和 mod 10) mod 10；全部计算在浏览器本地完成，不渲染条码图形。"
      />
    </div>
  );
};

export default Gs1CheckDigitCalculator;
