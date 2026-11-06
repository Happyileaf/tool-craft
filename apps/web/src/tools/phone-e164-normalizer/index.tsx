'use client';

import { useMemo, useState } from 'react';
import { Alert, Button, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  COUNTRY_RULES,
  DEFAULT_COUNTRY_ISO,
  normalizePhoneBatch,
  type PhoneResult,
} from './utils/phone';
import { PHONE_TOOL_I18N as T } from './constants';
import styles from './index.module.css';

const { Text, Title, Paragraph } = Typography;

const SAMPLE = '138 0000 0000\n001-415-555-2671\n+852 9123 4567\n1380000000a';

export default function PhoneE164Normalizer() {
  const [defaultIso, setDefaultIso] = useState<string>(DEFAULT_COUNTRY_ISO);
  const [input, setInput] = useState<string>('');
  const [results, setResults] = useState<PhoneResult[] | null>(null);

  const columns: ColumnsType<PhoneResult> = useMemo(
    () => [
      {
        title: T.rawHeader,
        dataIndex: 'raw',
        key: 'raw',
        width: 180,
        render: (raw: string) => <Text className={styles.mono}>{raw}</Text>,
      },
      {
        title: T.statusHeader,
        dataIndex: 'ok',
        key: 'ok',
        width: 90,
        render: (ok: boolean) =>
          ok ? <Tag color="success">{T.success}</Tag> : <Tag color="error">{T.failed}</Tag>,
      },
      {
        title: T.e164Header,
        dataIndex: 'e164',
        key: 'e164',
        width: 170,
        render: (e164: string | null, record) =>
          e164 ? (
            <Text strong copyable className={styles.mono}>
              {e164}
            </Text>
          ) : (
            <span className={styles.errorCell}>{record.error}</span>
          ),
      },
      {
        title: T.countryHeader,
        dataIndex: 'countryName',
        key: 'countryName',
        width: 130,
        render: (name: string | null) => name ?? '—',
      },
      {
        title: T.nationalHeader,
        dataIndex: 'nationalNumber',
        key: 'nationalNumber',
        width: 150,
        render: (n: string | null) => n ?? '—',
      },
      {
        title: T.displayHeader,
        dataIndex: 'internationalDisplay',
        key: 'internationalDisplay',
        render: (d: string | null) =>
          d ? <Text className={styles.mono}>{d}</Text> : '—',
      },
    ],
    [],
  );

  const handleNormalize = () => {
    if (!input.trim()) {
      message.warning('请先输入电话号码');
      return;
    }
    setResults(normalizePhoneBatch(input, defaultIso));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={3} className={styles.title}>
          {T.title}
        </Title>
        <Paragraph className={styles.subtitle}>{T.subtitle}</Paragraph>
      </div>

      <Alert type="warning" showIcon message={T.disclaimer} />

      <div className={styles.panel}>
        <div>
          <div className={styles.fieldLabel}>{T.defaultCountryLabel}</div>
          <Select
            style={{ minWidth: 220, marginTop: 8 }}
            value={defaultIso}
            onChange={setDefaultIso}
            options={COUNTRY_RULES.map((rule) => ({
              value: rule.iso,
              label: `${rule.name} (+${rule.countryCode})`,
            }))}
          />
        </div>

        <div>
          <div className={styles.fieldLabel}>{T.inputLabel}</div>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={T.inputPlaceholder}
            rows={7}
            style={{
              width: '100%',
              marginTop: 8,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--color-border, #e5e6eb)',
              fontFamily: 'SFMono-Regular, Consolas, Menlo, monospace',
              fontSize: 13,
              resize: 'vertical',
            }}
          />
        </div>

        <Space className={styles.actions}>
          <Button type="primary" onClick={handleNormalize}>
            {T.normalize}
          </Button>
          <Button
            onClick={() => {
              setInput(SAMPLE);
              setResults(null);
            }}
          >
            {T.sample}
          </Button>
          <Button
            danger
            onClick={() => {
              setInput('');
              setResults(null);
            }}
          >
            {T.clear}
          </Button>
        </Space>
      </div>

      <div className={styles.resultWrap}>
        <div className={styles.resultTitle}>{T.resultTitle}</div>
        {results === null ? (
          <div className={styles.empty}>{T.emptyHint}</div>
        ) : (
          <Table<PhoneResult>
            rowKey={(record, index) => `${record.raw}-${index}`}
            columns={columns}
            dataSource={results}
            pagination={false}
            size="middle"
            scroll={{ x: 860 }}
          />
        )}
      </div>
    </div>
  );
}
