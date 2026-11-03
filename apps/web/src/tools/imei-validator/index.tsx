'use client';

import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Descriptions, Input, Space, Tag, Typography, message } from 'antd';
import { CopyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { IMEI_SAMPLE_INPUT, IMEI_SAMPLE_LIST } from './constants';
import styles from './index.module.css';
import { analyzeImei, luhnCheckDigit } from './utils/imei';

const { Text } = Typography;

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  } catch {
    message.error('复制失败，请手动选择文本复制');
  }
};

const ImeiValidator: React.FC<ToolComponentProps> = () => {
  const [input, setInput] = useState(IMEI_SAMPLE_INPUT);
  const analysis = useMemo(() => analyzeImei(input), [input]);
  const normalized = analysis.normalized;
  const payload14 = /^\d{15,16}$/.test(normalized) ? normalized.slice(0, 14) : '';

  return (
    <div className={styles.container}>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>IMEI / IMEISV</Text>
            <Input
              className={styles.editor}
              size="large"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="输入 15 位 IMEI 或 16 位 IMEISV，支持空格/连字符分组"
              style={{ marginTop: 8, fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.08em' }}
            />
          </div>
          <Space wrap>
            {IMEI_SAMPLE_LIST.map((sample) => (
              <Button
                key={sample.label}
                size="small"
                icon={<ThunderboltOutlined />}
                onClick={() => setInput(sample.value)}
              >
                {sample.label}
              </Button>
            ))}
            <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(normalized)} disabled={!normalized}>
              复制归一化结果
            </Button>
          </Space>

          {analysis.kind === 'unknown' && analysis.errors.length === 0 && (
            <Alert type="info" showIcon message="等待输入：IMEI 为 15 位，IMEISV 为 16 位" />
          )}

          {analysis.errors.length > 0 && (
            <Alert
              type={analysis.formatValid === false && analysis.kind === 'unknown' ? 'error' : 'warning'}
              showIcon
              message={
                <Space direction="vertical" size={4}>
                  {analysis.errors.map((error) => (
                    <span key={error}>{error}</span>
                  ))}
                </Space>
              }
            />
          )}

          {analysis.formatValid && analysis.kind === 'imei' && analysis.luhnValid && (
            <Alert
              type="success"
              showIcon
              message="IMEI 格式与 Luhn 校验位均有效"
              description="校验通过仅代表号码结构自洽，不代表设备真实存在，本工具不做 TAC 在线库查询。"
            />
          )}

          {analysis.formatValid && analysis.kind === 'imeisv' && (
            <Alert
              type="success"
              showIcon
              message="IMEISV 格式有效（16 位，无 Luhn 校验位）"
              description="末 2 位为软件版本号 SVN；00 为 3GPP 保留值。"
            />
          )}

          {analysis.kind !== 'unknown' && (
            <Descriptions bordered size="small" column={1} className={styles.desc}>
              <Descriptions.Item label="类型">
                {analysis.kind === 'imei' ? 'IMEI（15 位）' : 'IMEISV（16 位）'}
              </Descriptions.Item>
              <Descriptions.Item label="归一化号码">
                <Text copyable={{ text: normalized, tooltips: false }} style={{ letterSpacing: '0.08em' }}>
                  {normalized}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="TAC（型号分配码，前 8 位）">
                <Tag color="blue">{analysis.tac}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="SNR（序列号，第 9–14 位）">
                <Tag>{analysis.snr}</Tag>
              </Descriptions.Item>
              <Descriptions.Item
                label={analysis.kind === 'imei' ? '校验位（第 15 位）' : 'SVN（软件版本号，末 2 位）'}
              >
                <Tag color={analysis.kind === 'imei' ? (analysis.luhnValid ? 'green' : 'red') : 'orange'}>
                  {analysis.trailing}
                </Tag>
              </Descriptions.Item>
              {analysis.kind === 'imei' && (
                <Descriptions.Item label="Luhn 校验">
                  {analysis.luhnValid ? (
                    <Tag color="green">通过</Tag>
                  ) : (
                    <Space>
                      <Tag color="red">失败</Tag>
                      <Text type="secondary">
                        正确校验位应为 {analysis.expectedCheckDigit}
                      </Text>
                    </Space>
                  )}
                </Descriptions.Item>
              )}
            </Descriptions>
          )}

          {payload14 && (
            <Alert
              type="info"
              showIcon
              message={
                <Space wrap>
                  <span>对前 14 位 {payload14} 计算校验位：</span>
                  <Tag color="blue">{luhnCheckDigit(payload14)}</Tag>
                  <span className={styles.hint}>（IMEISV 可借此生成对应的 15 位 IMEI 形式）</span>
                </Space>
              }
            />
          )}
        </Space>
      </Card>
    </div>
  );
};

export default ImeiValidator;
