'use client';

import React from 'react';
import { Alert, Button, Card, Input, Space, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_COUNTRY_CODE_PLACEHOLDER,
  DEFAULT_INPUT,
  INPUT_PLACEHOLDER,
} from './constants';
import { normalizeBatch } from './utils/e164';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface PhoneRow {
  key: number;
  line: number;
  raw: string;
  ok: boolean;
  e164: string | null;
  countryCode: string | null;
  nationalNumber: string | null;
  telUri: string | null;
  formatted: string | null;
  extension: string | null;
  errors: string[];
}

/**
 * E.164 电话号码规范化与校验工具：把多种书写形式的号码清洗、校验并规范化为
 * E.164（+ 国家码 + 国内号码，最长 15 位数字），输出 RFC 3966 tel URI 与
 * 可视分组，支持批量逐行处理。全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns E.164 规范化交互界面
 */
const PhoneNumberNormalizer: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_INPUT);
  const [countryCode, setCountryCode] = React.useState<string>('86');

  const rows = React.useMemo<PhoneRow[]>(
    () =>
      normalizeBatch(input, countryCode.trim() || undefined).map((item) => ({
        key: item.line,
        line: item.line,
        raw: item.raw,
        ok: item.ok,
        e164: item.e164,
        countryCode: item.countryCode,
        nationalNumber: item.nationalNumber,
        telUri: item.telUri,
        formatted: item.formatted,
        extension: item.extension,
        errors: item.errors,
      })),
    [input, countryCode],
  );

  const successCount = rows.filter((row) => row.ok).length;

  /**
   * 复制成功行的 E.164 结果（每行一个）
   */
  const handleCopy = async () => {
    const text = rows.filter((row) => row.ok && row.e164).map((row) => row.e164).join('\n');
    if (!text) {
      message.warning('没有可复制的成功结果');
      return;
    }
    await copyToClipboard(text);
    message.success('已复制全部成功号码');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="E.164 电话号码规范化与校验（ITU-T E.164）">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className={styles.toolbar}>
            <span>默认国家码：</span>
            <Input
              value={countryCode}
              onChange={(event) => setCountryCode(event.target.value.replace(/\D/g, ''))}
              placeholder={DEFAULT_COUNTRY_CODE_PLACEHOLDER}
              style={{ width: 240 }}
              maxLength={3}
              allowClear
            />
            <Button icon={<CopyOutlined />} onClick={handleCopy}>
              复制成功结果（E.164）
            </Button>
            <Tag color="blue">
              成功 {successCount} / {rows.length}
            </Tag>
          </div>

          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={INPUT_PLACEHOLDER}
            autoSize={{ minRows: 5, maxRows: 14 }}
            spellCheck={false}
            className={styles.mono}
          />

          {rows.length > 0 ? (
            <Table<PhoneRow>
              dataSource={rows}
              pagination={false}
              size="small"
              scroll={{ x: 720 }}
              columns={[
                { title: '行', dataIndex: 'line', width: 56 },
                {
                  title: '原始输入',
                  dataIndex: 'raw',
                  className: styles.mono,
                  render: (value: string) => value.trim(),
                },
                {
                  title: '结果',
                  dataIndex: 'ok',
                  width: 100,
                  render: (ok: boolean) =>
                    ok ? <Tag color="green">合法</Tag> : <Tag color="red">非法</Tag>,
                },
                {
                  title: 'E.164 / 错误原因',
                  render: (_, record) =>
                    record.ok ? (
                      <Space direction="vertical" size={2}>
                        <strong className={styles.mono}>{record.e164}</strong>
                        <span className={styles.hint}>
                          国家码 +{record.countryCode} ｜ 国内 {record.nationalNumber}
                          {record.extension ? ` ｜ 分机 ${record.extension}` : ''}
                        </span>
                        <span className={styles.hint}>
                          {record.formatted} ｜ {record.telUri}
                        </span>
                      </Space>
                    ) : (
                      <Alert
                        type="error"
                        showIcon
                        message={record.errors.join('；')}
                        style={{ padding: '4px 10px' }}
                      />
                    ),
                },
              ]}
            />
          ) : (
            <Alert type="info" showIcon message="输入号码后将逐行显示规范化结果" />
          )}

          <div className={styles.hint}>
            规则依据 ITU-T E.164：规范形式为「+」+ 国家码（1–3 位）+ 国内号码，数字总长 3–15
            位；支持 00 国际前缀、括号/连字符/空格分隔、电话键盘 vanity 字母与 ;ext= / x / 转
            分机写法。本工具只做结构与长度校验，不做号段归属地真实性核验（无需外部数据库）；
            所有处理均在浏览器本地完成。
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default PhoneNumberNormalizer;
