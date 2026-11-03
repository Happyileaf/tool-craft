'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Space, Statistic, Table, Tag, message } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, CopyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { SAMPLE_VIN, VIN_LENGTH } from './constants';
import { normalizeVin, validateVin, type VinPositionDetail } from './utils/vin';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * VIN 车辆识别代号校验位计算器：按 ISO 3779 / GB 16735（49 CFR 565.15 算法）
 * 对 17 位 VIN 做字符转码、加权求和、模 11 得校验位，并展示逐位计算明细。
 *
 * @param props - 工具组件属性
 * @returns VIN 校验界面
 */
const VinValidator: React.FC<ToolComponentProps> = () => {
  const [rawVin, setRawVin] = React.useState<string>(SAMPLE_VIN);

  const result = React.useMemo(() => validateVin(rawVin), [rawVin]);

  const handleCopy = async (): Promise<void> => {
    await copyToClipboard(result.normalized);
    message.success('VIN 已复制');
  };

  const columns: ColumnsType<VinPositionDetail> = [
    { title: '位置', dataIndex: 'position', key: 'position', width: 60 },
    {
      title: '字符',
      dataIndex: 'char',
      key: 'char',
      render: (char: string, row) => (
        <Tag color={row.isCheckDigit ? 'blue' : 'default'} className={styles.mono}>
          {char}
        </Tag>
      ),
    },
    { title: '转码值', dataIndex: 'value', key: 'value' },
    { title: '权重', dataIndex: 'weight', key: 'weight' },
    {
      title: '乘积',
      dataIndex: 'product',
      key: 'product',
      render: (v: number) => <span className={styles.mono}>{v}</span>,
    },
  ];

  return (
    <div className={styles.container}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Card title="输入 VIN（17 位）">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Input
              className={`${styles.mono} ${styles.vinInput}`}
              size="large"
              value={rawVin}
              maxLength={40}
              placeholder="例如 1HGCM82633A004352"
              onChange={(event) => setRawVin(event.target.value)}
              allowClear
            />
            <Space wrap>
              <Button onClick={() => setRawVin(SAMPLE_VIN)}>载入示例</Button>
              <Button icon={<CopyOutlined />} onClick={handleCopy} disabled={result.normalized.length === 0}>
                复制规范化结果
              </Button>
              <Tag className={styles.mono}>
                {result.normalized.length}/{VIN_LENGTH} 位
              </Tag>
            </Space>
            <p className={styles.hint}>
              支持小写、空格、连字符输入，自动转大写并去除分隔符。VIN 中字母 I、O、Q 禁止使用（易与 1、0 混淆）。
            </p>
          </Space>
        </Card>

        {result.errors.length > 0 && (
          <Alert
            type="error"
            showIcon
            message="输入不合法"
            description={
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {result.errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            }
          />
        )}

        {result.expectedCheckDigit !== null && result.errors.length === 0 && (
          <Card title="校验位结论">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Alert
                type={result.valid ? 'success' : 'error'}
                showIcon
                icon={result.valid ? <CheckCircleFilled /> : <CloseCircleFilled />}
                message={
                  result.valid
                    ? '校验位正确，VIN 结构合法。'
                    : `校验位不匹配：第 9 位应为 "${result.expectedCheckDigit}"，实际为 "${result.actualCheckDigit}"。`
                }
              />
              <Space wrap size="large">
                <Statistic
                  title="正确校验位（第 9 位）"
                  value={result.expectedCheckDigit}
                  valueStyle={{ color: '#1677ff' }}
                />
                <Statistic title="实际第 9 位" value={result.actualCheckDigit ?? '-'} />
                <Statistic title="加权求和" value={result.weightedSum ?? '-'} />
                <Statistic title="模 11 余数" value={result.remainder ?? '-'} />
                <Statistic
                  title="结论"
                  valueRender={() => (
                    <span className={styles.checkChar} style={{ color: result.valid ? '#3f8600' : '#cf1322' }}>
                      {result.valid ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                />
              </Space>
            </Space>
          </Card>
        )}

        {result.details.length > 0 && (
          <Card title="逐位计算明细（第 9 位为校验位，权重 0）">
            <Table<VinPositionDetail>
              columns={columns}
              dataSource={result.details}
              rowKey={(row) => String(row.position)}
              size="small"
              pagination={false}
              scroll={{ x: true }}
              rowClassName={(row) => (row.isCheckDigit ? (styles.checkCell ?? 'check-digit-row') : '')}
            />
            <Alert
              style={{ marginTop: 12 }}
              type="info"
              showIcon
              message="算法说明"
              description={
                <div className={styles.hint}>
                  每位字符按转码表（A=1…Z=9，I/O/Q 除外）取值，乘以对应权重
                  [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2]，求和后对 11 取模：余数 0-9 即校验数字，余数 10 记作 X。
                  该校验位规则适用于 1981 年后北美/中国等市场车辆；部分欧盟老车、澳洲车型不强制校验位，
                  校验失败不一定代表伪造，请结合 WMI 与实车铭牌综合判断。本工具不联网、不查询车辆数据库。
                </div>
              }
            />
          </Card>
        )}
      </Space>
    </div>
  );
};

export default VinValidator;
