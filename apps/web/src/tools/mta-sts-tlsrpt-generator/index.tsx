'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Select, Space, Table, Tabs, Tag, message } from 'antd';
import {
  DEFAULT_MAX_AGE,
  EXAMPLE_DOMAIN,
  EXAMPLE_MX,
  EXAMPLE_REPORT_EMAIL,
} from './constants';
import {
  generateMtaSts,
  generateTlsRpt,
  parseMtaStsPolicy,
  parseMtaStsRecord,
  parseTlsRptRecord,
} from './utils/mtaSts';
import styles from './index.module.css';

const { TextArea } = Input;

/** 可复制的 DNS / 策略文件结果块 */
function RecordBlock({ title, value, mono = true }: { title: string; value: string; mono?: boolean }) {
  return (
    <div className={styles.recordBlock}>
      <div className={styles.recordName}>{title}</div>
      <div className={mono ? styles.recordValue : undefined}>{value}</div>
      <div className={styles.copyRow}>
        <Button
          size="small"
          onClick={() => {
            navigator.clipboard
              .writeText(value)
              .then(() => message.success('已复制到剪贴板'))
              .catch(() => message.error('复制失败，请手动选择复制'));
          }}
        >
          复制
        </Button>
      </div>
    </div>
  );
}

/**
 * MTA-STS / TLS-RPT 记录生成与解析工具（RFC 8461 / RFC 8460）。
 * 生成模式产出 DNS TXT 记录与 mta-sts.txt 策略文件；解析模式校验既有记录。
 *
 * @returns 生成 / 解析双标签页界面
 */
const MtaStsTlsrptGenerator: React.FC<ToolComponentProps> = () => {
  const [domain, setDomain] = React.useState(EXAMPLE_DOMAIN);
  const [mode, setMode] = React.useState<'enforce' | 'testing' | 'none'>('testing');
  const [maxAge, setMaxAge] = React.useState(String(DEFAULT_MAX_AGE));
  const [mxText, setMxText] = React.useState(EXAMPLE_MX.join('\n'));
  const [reportEmail, setReportEmail] = React.useState(EXAMPLE_REPORT_EMAIL);
  const [httpsEndpoint, setHttpsEndpoint] = React.useState('');

  const [parseType, setParseType] = React.useState<'mta-record' | 'mta-policy' | 'tls-record'>('mta-record');
  const [parseInput, setParseInput] = React.useState('');

  const generated = React.useMemo(() => {
    try {
      const maxAgeNumber = Number(maxAge);
      const mxList = mxText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const mta = generateMtaSts(domain, { mode, maxAge: maxAgeNumber, allowedMx: mxList });
      const endpoints = [
        reportEmail.trim() ? { kind: 'mailto' as const, address: reportEmail.trim() } : null,
        httpsEndpoint.trim() ? { kind: 'https' as const, url: httpsEndpoint.trim() } : null,
      ].filter((item): item is NonNullable<typeof item> => item !== null);
      const tls = generateTlsRpt(domain, { endpoints });
      return { mta, tls };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [domain, mode, maxAge, mxText, reportEmail, httpsEndpoint]);

  const parsed = React.useMemo(() => {
    if (parseInput.trim() === '') {
      return null;
    }
    try {
      if (parseType === 'mta-record') {
        return parseMtaStsRecord(parseInput);
      }
      if (parseType === 'tls-record') {
        return parseTlsRptRecord(parseInput);
      }
      return parseMtaStsPolicy(parseInput);
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [parseType, parseInput]);

  const generatorTab = (
    <div>
      <p className={styles.hint}>
        填写邮件域名、策略模式与 MX 白名单，工具同时产出 MTA-STS 的 DNS TXT 记录、HTTPS 策略文件正文，以及
        TLS-RPT 报告 TXT 记录。策略文件需发布到 <strong>mta-sts.&lt;域&gt;/.well-known/mta-sts.txt</strong>。
      </p>
      <div className={styles.stack}>
        <div>
          <div className={styles.fieldLabel}>邮件域名</div>
          <Input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="example.com" />
        </div>
        <div>
          <div className={styles.fieldLabel}>策略模式（RFC 8461）</div>
          <Radio.Group
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            options={[
              { label: 'testing（先观察不拦截，推荐起步）', value: 'testing' },
              { label: 'enforce（强制要求有效 TLS）', value: 'enforce' },
              { label: 'none（撤回策略）', value: 'none' },
            ]}
          />
        </div>
        <div>
          <div className={styles.fieldLabel}>max_age（秒，策略缓存时长）</div>
          <Input
            value={maxAge}
            onChange={(event) => setMaxAge(event.target.value.replace(/[^\d]/g, ''))}
            placeholder="86400"
            style={{ maxWidth: 240 }}
          />
        </div>
        <div>
          <div className={styles.fieldLabel}>允许的 MX 主机名后缀（每行一条，支持 *.example.com 通配）</div>
          <TextArea rows={3} value={mxText} onChange={(event) => setMxText(event.target.value)} />
        </div>
        <div>
          <div className={styles.fieldLabel}>TLS-RPT 报告接收（可只填一个，留空邮箱可仅用 HTTPS）</div>
          <Space wrap>
            <Input
              addonBefore="mailto"
              value={reportEmail}
              onChange={(event) => setReportEmail(event.target.value)}
              placeholder="tls-reports@example.com"
              style={{ width: 320 }}
            />
            <Input
              addonBefore="https"
              value={httpsEndpoint}
              onChange={(event) => setHttpsEndpoint(event.target.value)}
              placeholder="report.example.com/tls"
              style={{ width: 320 }}
            />
          </Space>
        </div>
      </div>

      {'error' in generated && generated.error ? (
        <Alert style={{ marginTop: 16 }} type="error" showIcon message="输入不合法" description={generated.error} />
      ) : null}

      {'mta' in generated && generated.mta ? (
        <div className={styles.stack} style={{ marginTop: 16 }}>
          <Tag color="blue">策略 ID：{generated.mta.policyId}（每次调整策略都应更换 ID）</Tag>
          <RecordBlock title={`DNS TXT 记录 · ${generated.mta.dnsRecord.host}`} value={generated.mta.dnsRecord.value} />
          <RecordBlock
            title={`策略文件发布地址 · ${generated.mta.policyUrl}`}
            value={generated.mta.policyText}
          />
          <RecordBlock title={`DNS TXT 记录 · ${generated.tls.dnsRecord.host}`} value={generated.tls.recordValue} />
        </div>
      ) : null}
    </div>
  );

  const parserTab = (
    <div>
      <p className={styles.hint}>粘贴既有的 TXT 记录或 mta-sts.txt 正文，工具按 RFC 字段逐项校验并结构化展示。</p>
      <Select
        value={parseType}
        onChange={(value) => setParseType(value)}
        style={{ minWidth: 320, marginBottom: 12 }}
        options={[
          { label: 'MTA-STS TXT 记录（_mta-sts）', value: 'mta-record' },
          { label: 'MTA-STS 策略文件（mta-sts.txt）', value: 'mta-policy' },
          { label: 'TLS-RPT TXT 记录（_smtp._tls）', value: 'tls-record' },
        ]}
      />
      <TextArea
        rows={5}
        value={parseInput}
        onChange={(event) => setParseInput(event.target.value)}
        placeholder={
          parseType === 'mta-policy'
            ? 'version: STSv1\nmode: enforce\nmax_age: 86400\nmx: mx1.example.com'
            : 'v=STSv1; id=20261118100403'
        }
      />
      {parsed && 'error' in parsed ? (
        <Alert style={{ marginTop: 16 }} type="error" showIcon message="记录不合法" description={parsed.error} />
      ) : null}
      {parsed && !('error' in parsed) ? (
        <Table
          style={{ marginTop: 16 }}
          size="small"
          pagination={false}
          rowKey="field"
          dataSource={Object.entries(parsed).map(([field, value]) => ({
            field,
            value: Array.isArray(value) ? value.join(', ') || '（空）' : String(value),
          }))}
          columns={[
            { title: '字段', dataIndex: 'field', key: 'field', width: 160 },
            { title: '解析值', dataIndex: 'value', key: 'value' },
          ]}
        />
      ) : null}
    </div>
  );

  return (
    <div className={styles.container}>
      <Card title="MTA-STS / TLS-RPT 记录生成器（RFC 8461 / RFC 8460）">
        <Tabs
          items={[
            { key: 'generate', label: '生成记录', children: generatorTab },
            { key: 'parse', label: '解析校验', children: parserTab },
          ]}
        />
      </Card>
    </div>
  );
};

export default MtaStsTlsrptGenerator;
