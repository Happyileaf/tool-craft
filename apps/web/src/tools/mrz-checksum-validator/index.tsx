'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Descriptions, Input, Space, Table, Tag, Typography } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { parseMrz } from './utils/mrz';
import type { CheckResult, ParsedMrz } from './utils/mrz';
import { DEFAULT_MRZ_SAMPLE } from './constants';
import styles from './index.module.css';

const { Text, Paragraph } = Typography;

/**
 * MRZ 机读旅行证件校验器：粘贴 TD1/TD2/TD3 机读码后，按 ICAO 9303 解析字段并
 * 逐项计算模 10 校验位（权重 7、3、1）。全部为本地字符串与整数运算，不发网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认 MRZ 文本
 * @returns MRZ 解析与校验界面
 */
const MrzChecksumValidator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_MRZ_SAMPLE);

  const computed = React.useMemo<{ result: ParsedMrz | null; error: string | null }>(() => {
    if (!input.trim()) {
      return { result: null, error: null };
    }
    try {
      return { result: parseMrz(input), error: null };
    } catch (caught) {
      return { result: null, error: caught instanceof Error ? caught.message : '解析失败' };
    }
  }, [input]);

  const checkColumns = [
    { title: '校验项', dataIndex: 'name', key: 'name' },
    {
      title: '参与校验字段',
      dataIndex: 'source',
      key: 'source',
      render: (value: string) => <Text className={styles.mono}>{value || '—'}</Text>,
    },
    {
      title: '实际校验位',
      dataIndex: 'actual',
      key: 'actual',
      render: (value: number | null) => (value === null ? '< 跳过' : value),
    },
    { title: '期望校验位', dataIndex: 'expected', key: 'expected' },
    {
      title: '结果',
      dataIndex: 'pass',
      key: 'pass',
      render: (pass: boolean) =>
        pass ? (
          <Tag icon={<CheckCircleFilled />} color="success">
            通过
          </Tag>
        ) : (
          <Tag icon={<CloseCircleFilled />} color="error">
            失败
          </Tag>
        ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="MRZ 机读旅行证件校验器（ICAO 9303）">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            autoSize={{ minRows: 3, maxRows: 6 }}
            spellCheck={false}
            className={styles.mrzInput}
            placeholder="粘贴护照/证件底部的机读码（TD1 三行、TD2/TD3 两行）"
          />

          {computed.error && <Alert type="error" showIcon message="MRZ 解析失败" description={computed.error} />}

          {computed.result && (
            <>
              <Alert
                type={computed.result.compositePass ? 'success' : 'error'}
                showIcon
                message={
                  computed.result.compositePass
                    ? `识别为 ${computed.result.format}，全部校验位自洽`
                    : `识别为 ${computed.result.format}，存在校验位失败，请核对原始证件`
                }
              />
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="格式">{computed.result.format}</Descriptions.Item>
                <Descriptions.Item label="证件类型">{computed.result.documentType}</Descriptions.Item>
                <Descriptions.Item label="姓名">{computed.result.fullName}</Descriptions.Item>
                <Descriptions.Item label="证件号码">
                  <Text className={styles.mono}>{computed.result.documentNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="签发国家/地区">{computed.result.issuingCountry}</Descriptions.Item>
                <Descriptions.Item label="国籍">{computed.result.nationality}</Descriptions.Item>
                <Descriptions.Item label="出生日期（YYMMDD）">
                  <Text className={styles.mono}>{computed.result.birthDate}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="性别">{computed.result.sex}</Descriptions.Item>
                <Descriptions.Item label="有效期（YYMMDD）">
                  <Text className={styles.mono}>{computed.result.expiryDate}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="个人号码">
                  <Text className={styles.mono}>{computed.result.personalNumber || '—'}</Text>
                </Descriptions.Item>
              </Descriptions>
              <Table<CheckResult>
                rowKey="name"
                size="small"
                pagination={false}
                columns={checkColumns}
                dataSource={computed.result.checks}
              />
            </>
          )}
          <Paragraph className={styles.hint}>
            ICAO 9303 模 10 校验：把字母 A–Z 映射为 10–35、数字保持 0–9、填充符
            {' '}<Text code>&lt;</Text> 视为 0，按权重 7、3、1 循环加权求和后对 10 取模。
            复合校验位拼接证件号、出生日期、有效期等字段后整体再算一次。全程本地运算，不上传证件信息。
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
};

export default MrzChecksumValidator;
