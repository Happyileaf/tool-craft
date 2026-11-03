'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Segmented,
  Select,
  Space,
  Statistic,
  Tag,
  Tooltip,
  message,
} from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  COMMON_INCLUDE_PRESETS,
  DEFAULT_QUALIFIER,
  SAMPLE_MECHANISMS,
  SPF_MAX_DNS_LOOKUPS,
  SPF_MECHANISMS,
  SPF_QUALIFIERS,
  SPF_VERSION,
} from './constants';
import { analyzeSpfRecord, buildSpfRecord, type SpfMechanismInput } from './utils/spf';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type Mode = 'generate' | 'validate';

interface MechanismRow extends SpfMechanismInput {
  id: number;
}

let idSeq = 0;
function nextId(): number {
  idSeq += 1;
  return idSeq;
}

function createInitialRows(): MechanismRow[] {
  return SAMPLE_MECHANISMS.map((m) => ({ ...m, id: nextId() }));
}

/** 判断机制是否需要参数输入框 */
function needsValue(mechanism: string): boolean {
  return ['include', 'exists', 'redirect', 'ip4', 'ip6'].includes(mechanism);
}

const VALUE_PLACEHOLDER: Record<string, string> = {
  include: 'example.com',
  exists: 'example.com',
  redirect: 'example.com',
  ip4: '192.0.2.0/24',
  ip6: '2001:db8::/32',
};

/**
 * SPF 记录生成与校验器（RFC 7208）：可视化拼装机制并生成 v=spf1 TXT 记录，
 * 或粘贴现有记录做语法校验与 10 次 DNS 查询上限统计。全部在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @returns SPF 生成 / 校验交互界面
 */
const SpfRecordGenerator: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<Mode>('generate');
  const [rows, setRows] = React.useState<MechanismRow[]>(createInitialRows);
  const [validateInput, setValidateInput] = React.useState(
    'v=spf1 ip4:192.0.2.0/24 include:_spf.google.com include:sendgrid.net ~all',
  );

  const generated = React.useMemo(() => buildSpfRecord(rows), [rows]);
  const generatedAnalysis = React.useMemo(() => analyzeSpfRecord(generated), [generated]);
  const validateAnalysis = React.useMemo(() => analyzeSpfRecord(validateInput), [validateInput]);
  const analysis = mode === 'generate' ? generatedAnalysis : validateAnalysis;
  const recordText = mode === 'generate' ? generated : analysis.normalized;

  const errorCount = analysis.issues.filter((i) => i.level === 'error').length;
  const warningCount = analysis.issues.filter((i) => i.level === 'warning').length;

  const copyRecord = async (): Promise<void> => {
    await copyToClipboard(recordText);
    message.success('SPF 记录已复制');
  };

  const patchRow = (id: number, patch: Partial<SpfMechanismInput>): void => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const next = { ...row, ...patch };
        // 切换机制时清空不再适用的参数
        if (patch.mechanism && !needsValue(patch.mechanism)) next.value = '';
        if (patch.mechanism === 'redirect') next.qualifier = DEFAULT_QUALIFIER;
        return next;
      }),
    );
  };

  const addRow = (mechanism: string): void => {
    setRows((prev) => [...prev, { id: nextId(), mechanism, qualifier: DEFAULT_QUALIFIER, value: '' }]);
  };

  const addPreset = (domain: string): void => {
    setRows((prev) => {
      if (prev.some((r) => r.mechanism === 'include' && r.value === domain)) return prev;
      const item: MechanismRow = { id: nextId(), mechanism: 'include', qualifier: '+', value: domain };
      const allIndex = prev.findIndex((r) => r.mechanism === 'all');
      if (allIndex === -1) return [...prev, item];
      const next = [...prev];
      next.splice(allIndex, 0, item);
      return next;
    });
  };

  const removeRow = (id: number): void => setRows((prev) => prev.filter((r) => r.id !== id));

  const moveRow = (index: number, direction: -1 | 1): void => {
    setRows((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const current = next[index];
      const displaced = next[target];
      if (!current || !displaced) return prev;
      next[index] = displaced;
      next[target] = current;
      return next;
    });
  };

  const lookupStatus =
    analysis.dnsLookupCount > SPF_MAX_DNS_LOOKUPS ? 'error'
    : analysis.dnsLookupCount === SPF_MAX_DNS_LOOKUPS ? 'warning'
    : 'success';
  const lookupColor = lookupStatus === 'error' ? '#cf1322' : lookupStatus === 'warning' ? '#d48806' : '#3f8600';

  return (
    <div className={styles.container}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Segmented
          value={mode}
          onChange={(value) => setMode(value as Mode)}
          options={[
            { label: '生成记录', value: 'generate' },
            { label: '校验现有记录', value: 'validate' },
          ]}
        />

        {mode === 'generate' ? (
          <Card
            className={styles.card}
            title="机制列表（自上而下排列，all 建议放最后）"
            extra={
              <Button danger size="small" onClick={() => setRows([])}>
                清空
              </Button>
            }
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space wrap size={[6, 6]}>
                <span className={styles.hint}>常见服务商 include：</span>
                {COMMON_INCLUDE_PRESETS.map((preset) => (
                  <Tag
                    key={preset.domain}
                    color="blue"
                    style={{ cursor: 'pointer' }}
                    onClick={() => addPreset(preset.domain)}
                  >
                    <PlusOutlined /> {preset.label}
                  </Tag>
                ))}
              </Space>

              <Space wrap>
                {SPF_MECHANISMS.map((m) => (
                  <Button key={m.value} size="small" icon={<PlusOutlined />} onClick={() => addRow(m.value)}>
                    {m.label}
                  </Button>
                ))}
              </Space>

              {rows.length === 0 ? (
                <Empty description="尚未添加机制，点击上方按钮拼装" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                rows.map((row, index) => (
                  <Space key={row.id} wrap align="center" size={8}>
                    <Tag>#{index + 1}</Tag>
                    <Select
                      size="small"
                      style={{ width: 120 }}
                      value={row.mechanism}
                      onChange={(value) => patchRow(row.id, { mechanism: value })}
                      options={SPF_MECHANISMS.map((m) => ({ value: m.value, label: m.label }))}
                    />
                    {row.mechanism !== 'redirect' && (
                      <Select
                        size="small"
                        style={{ width: 130 }}
                        value={row.qualifier}
                        onChange={(value) => patchRow(row.id, { qualifier: value })}
                        options={SPF_QUALIFIERS.map((q) => ({ value: q.value, label: q.label }))}
                      />
                    )}
                    {needsValue(row.mechanism) ? (
                      <Input
                        size="small"
                        className={styles.mono}
                        style={{ width: 260 }}
                        value={row.value}
                        placeholder={VALUE_PLACEHOLDER[row.mechanism]}
                        onChange={(event) => patchRow(row.id, { value: event.target.value.trim() })}
                      />
                    ) : (
                      <Tooltip
                        title={
                          row.mechanism === 'all'
                            ? '匹配其余所有来源'
                            : '未填域名时作用于当前域（SPF 记录所在域）'
                        }
                      >
                        <span className={styles.hint}>（无需参数）</span>
                      </Tooltip>
                    )}
                    <Space size={2}>
                      <Button size="small" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => moveRow(index, -1)} />
                      <Button
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={index === rows.length - 1}
                        onClick={() => moveRow(index, 1)}
                      />
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeRow(row.id)} />
                    </Space>
                  </Space>
                ))
              )}

              <Button icon={<ReloadOutlined />} onClick={() => setRows(createInitialRows())}>
                载入示例
              </Button>
            </Space>
          </Card>
        ) : (
          <Card className={styles.card} title="粘贴现有 SPF 记录（TXT 记录内容）">
            <Input.TextArea
              className={styles.mono}
              rows={4}
              value={validateInput}
              placeholder={`${SPF_VERSION} ip4:192.0.2.0/24 -all`}
              onChange={(event) => setValidateInput(event.target.value)}
            />
          </Card>
        )}

        <Card className={styles.card} title={mode === 'generate' ? '生成的 SPF 记录' : '校验结果'}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div className={styles.recordBox}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <span className={styles.mono}>{recordText}</span>
                <Button size="small" icon={<CopyOutlined />} onClick={copyRecord}>
                  复制记录
                </Button>
              </Space>
            </div>

            <Space wrap size="large">
              <Statistic
                title="DNS 查询计数（上限 10）"
                value={`${analysis.dnsLookupCount}/${SPF_MAX_DNS_LOOKUPS}`}
                valueStyle={{ color: lookupColor }}
              />
              <Statistic title="机制数量" value={analysis.terms.length} />
              <Statistic title="字符数（单串上限 255）" value={recordText.length} />
            </Space>

            {analysis.terms.length > 0 && (
              <Space wrap size={[6, 6]}>
                {analysis.terms.map((term, i) => (
                  <Tag key={`${term.raw}-${i}`} className={styles.mono}>
                    {term.raw}
                  </Tag>
                ))}
              </Space>
            )}

            {analysis.issues.length === 0 ? (
              <Alert type="success" showIcon message="未发现语法或查询计数问题。" />
            ) : (
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                {analysis.issues.map((issue, i) => (
                  <Alert
                    key={i}
                    type={issue.level === 'error' ? 'error' : 'warning'}
                    showIcon
                    message={issue.level === 'error' ? `错误：${issue.message}` : `警告：${issue.message}`}
                  />
                ))}
              </Space>
            )}

            <Alert
              type="info"
              showIcon
              message="发布方式与统计口径"
              description={
                <div className={styles.hint}>
                  在域名 DNS 中新增一条 TXT 记录，主机记录留空（或 @），记录值填上方完整字符串。
                  查询计数按 RFC 7208 §4.6.4 统计本记录中的 include / a / mx / ptr / exists / redirect 条数（不含 ip4 / ip6 / all）；
                  include 嵌套引入的间接查询无法在此静态统计。错误 {errorCount} 条、警告 {warningCount} 条。
                  本工具不发起任何真实 DNS 查询。
                </div>
              }
            />
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default SpfRecordGenerator;
