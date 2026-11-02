'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Input,
  InputNumber,
  Radio,
  Segmented,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { DIRECTIVE_LABELS_ZH } from './constants';
import { parseCacheControl, type Directive } from './utils/directives';
import {
  calculateFreshness,
  parseAgeHeader,
  parseHttpDate,
  type CacheSide,
  type FreshnessStatus,
} from './utils/freshness';
import {
  createDefaultStrategy,
  generateCacheHeaders,
  TTL_PRESETS,
  type CacheStrategyInput,
} from './utils/generator';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type Mode = 'parse' | 'generate';

const DEFAULT_CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=600';
const DATE_PLACEHOLDER = 'Tue, 03 Nov 2026 12:00:00 GMT';

const STATUS_META: Record<FreshnessStatus, { color: string; text: string }> = {
  FORBIDDEN: { color: 'red', text: '禁止缓存' },
  REVALIDATE: { color: 'orange', text: '必须重新验证' },
  FRESH: { color: 'green', text: '新鲜' },
  STALE_GRACE: { color: 'gold', text: '过期 · 宽限中' },
  STALE_ALLOWED: { color: 'gold', text: '过期 · 请求允许陈旧' },
  STALE: { color: 'red', text: '已过期' },
  HEURISTIC: { color: 'blue', text: '启发式估算' },
};

/**
 * HTTP Cache-Control 指令解析与缓存新鲜度计算器（RFC 9111）
 *
 * 解析模式：逐 token 展开 Cache-Control，结合 Date/Age/Expires/Last-Modified
 * 与请求端指令计算 corrected current age、新鲜度寿命与当前状态；
 * 生成模式：按目标 TTL 与场景输出推荐响应头组合。全部纯本地计算。
 *
 * @param props - 工具组件属性
 * @returns Cache-Control 解析计算器界面
 */
const HttpCacheControlParser: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<Mode>('parse');

  return (
    <div className={styles.container}>
      <Segmented
        value={mode}
        onChange={(value) => setMode(value as Mode)}
        options={[
          { label: '解析与新鲜度计算', value: 'parse' },
          { label: '响应头生成器', value: 'generate' },
        ]}
      />
      {mode === 'parse' ? <ParsePanel /> : <GeneratePanel />}
    </div>
  );
};

/** 解析与新鲜度计算面板 */
const ParsePanel: React.FC = () => {
  const now = React.useMemo(() => Date.now(), []);
  const [cacheControl, setCacheControl] = React.useState(DEFAULT_CACHE_CONTROL);
  const [requestCacheControl, setRequestCacheControl] = React.useState('');
  const [dateHeader, setDateHeader] = React.useState('');
  const [ageHeader, setAgeHeader] = React.useState('');
  const [expiresHeader, setExpiresHeader] = React.useState('');
  const [lastModifiedHeader, setLastModifiedHeader] = React.useState('');
  const [etag, setEtag] = React.useState('');
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const [cacheSide, setCacheSide] = React.useState<CacheSide>('browser');

  const parsed = React.useMemo(() => parseCacheControl(cacheControl, 'response'), [cacheControl]);
  const requestParsed = React.useMemo(
    () => parseCacheControl(requestCacheControl, 'request'),
    [requestCacheControl],
  );

  const dateValue = React.useMemo(() => parseHttpDate(dateHeader), [dateHeader]);
  const expiresValue = React.useMemo(() => parseHttpDate(expiresHeader), [expiresHeader]);
  const lastModifiedValue = React.useMemo(
    () => parseHttpDate(lastModifiedHeader),
    [lastModifiedHeader],
  );
  const ageSeconds = React.useMemo(() => parseAgeHeader(ageHeader), [ageHeader]);

  const result = React.useMemo(
    () =>
      calculateFreshness({
        responseDirectives: parsed.directives,
        requestDirectives: requestParsed.directives,
        dateValue: dateValue ?? now,
        expiresValue,
        lastModifiedValue,
        ageSeconds,
        nowMs: now + elapsedSec * 1000,
        cacheSide,
        hasEtag: etag.trim().length > 0,
      }),
    [
      parsed.directives,
      requestParsed.directives,
      dateValue,
      now,
      expiresValue,
      lastModifiedValue,
      ageSeconds,
      elapsedSec,
      cacheSide,
      etag,
    ],
  );

  const columns = [
    {
      title: '指令',
      dataIndex: 'name',
      width: 200,
      render: (name: string, row: Directive) => (
        <Space>
          <code>{name}</code>
          {!row.known && <Tag color="default">未知</Tag>}
        </Space>
      ),
    },
    {
      title: '值',
      dataIndex: 'value',
      width: 120,
      render: (value: string | null) => (value === null ? <Tag>布尔开关</Tag> : <code>{value}</code>),
    },
    {
      title: '含义',
      key: 'meaning',
      render: (_: unknown, row: Directive) =>
        DIRECTIVE_LABELS_ZH[row.name] ?? (row.known ? '' : '非标准扩展指令，缓存通常忽略'),
    },
  ];

  const statusMeta = STATUS_META[result.status];
  const allWarnings = [...parsed.warnings, ...requestParsed.warnings];

  return (
    <div className={styles.layout}>
      <Card title="响应头与请求条件" size="small">
        <div className={styles.headerInput}>
          <label>
            响应 Cache-Control
            <Input.TextArea
              value={cacheControl}
              onChange={(event) => setCacheControl(event.target.value)}
              autoSize={{ minRows: 1, maxRows: 4 }}
              placeholder="public, max-age=3600, immutable"
            />
          </label>
          <label>
            Date（留空取当前时刻，格式 {DATE_PLACEHOLDER}）
            <Input
              value={dateHeader}
              onChange={(event) => setDateHeader(event.target.value)}
              placeholder={DATE_PLACEHOLDER}
            />
          </label>
          <Space>
            <label>
              Age（秒）
              <Input
                value={ageHeader}
                onChange={(event) => setAgeHeader(event.target.value)}
                placeholder="0"
                style={{ width: 120 }}
              />
            </label>
            <label>
              Expires
              <Input
                value={expiresHeader}
                onChange={(event) => setExpiresHeader(event.target.value)}
                placeholder="HTTP 日期"
                style={{ width: 220 }}
              />
            </label>
          </Space>
          <Space>
            <label>
              Last-Modified
              <Input
                value={lastModifiedHeader}
                onChange={(event) => setLastModifiedHeader(event.target.value)}
                placeholder="HTTP 日期"
                style={{ width: 220 }}
              />
            </label>
            <label>
              ETag
              <Input
                value={etag}
                onChange={(event) => setEtag(event.target.value)}
                placeholder='W/"v1"'
                style={{ width: 160 }}
              />
            </label>
          </Space>
          <label>
            请求 Cache-Control（可选，模拟浏览器/CDN 请求）
            <Input
              value={requestCacheControl}
              onChange={(event) => setRequestCacheControl(event.target.value)}
              placeholder="no-cache / max-age=0 / max-stale=300 / min-fresh=60"
            />
          </label>
          <Space wrap>
            缓存侧：
            <Radio.Group
              value={cacheSide}
              onChange={(event) => setCacheSide(event.target.value as CacheSide)}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '浏览器', value: 'browser' },
                { label: 'CDN/共享缓存', value: 'shared' },
              ]}
            />
            <label>
              距响应到达经过：
              <InputNumber
                value={elapsedSec}
                onChange={(value) => setElapsedSec(value ?? 0)}
                min={0}
                addonAfter="秒"
                style={{ width: 160 }}
              />
            </label>
          </Space>
        </div>
      </Card>

      <div className={styles.outputCard}>
        <Card size="small">
          <div className={styles.statusBlock}>
            <Tag color={statusMeta.color} style={{ fontSize: 14, padding: '4px 12px' }}>
              {statusMeta.text}
            </Tag>
            <span style={{ color: 'rgba(0,0,0,0.45)' }}>寿命来源：{result.lifetimeSource}</span>
          </div>
          <div className={styles.statRow} style={{ marginTop: 12 }}>
            <Statistic
              title="新鲜度寿命"
              value={result.freshnessLifetimeSec ?? '—'}
              suffix={result.freshnessLifetimeSec === null ? '' : '秒'}
            />
            <Statistic title="当前年龄" value={result.currentAgeSec} suffix="秒" />
            <Statistic
              title="剩余新鲜"
              value={result.remainingFreshSec ?? '—'}
              suffix={result.remainingFreshSec === null ? '' : '秒'}
              valueStyle={{
                color:
                  result.remainingFreshSec === null
                    ? undefined
                    : result.remainingFreshSec >= 0
                      ? '#3f8600'
                      : '#cf1322',
              }}
            />
          </div>
          {result.graceRemainingSec !== null && (
            <Alert
              style={{ marginTop: 12 }}
              type="info"
              showIcon
              message={`stale-while-revalidate 宽限剩余 ${result.graceRemainingSec} 秒`}
            />
          )}
          <p style={{ marginTop: 12, color: 'rgba(0,0,0,0.65)' }}>{result.explanation}</p>
          {result.hasValidator && (
            <Tag color="cyan">存在协商缓存验证器（ETag / Last-Modified），重验命中时源站可返回 304</Tag>
          )}
        </Card>

        {allWarnings.length > 0 && (
          <Alert
            type="warning"
            showIcon
            message="指令告警"
            description={
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {allWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            }
          />
        )}

        <Card title="指令逐条展开" size="small">
          <Table
            dataSource={parsed.directives.map((directive, index) => ({ ...directive, key: index }))}
            columns={columns}
            pagination={false}
            size="small"
          />
        </Card>
      </div>
    </div>
  );
};

/** 响应头生成面板 */
const GeneratePanel: React.FC = () => {
  const [strategy, setStrategy] = React.useState<CacheStrategyInput>(createDefaultStrategy);

  const headers = React.useMemo(() => generateCacheHeaders(strategy), [strategy]);
  const outputText = headers.map((header) => `${header.name}: ${header.value}`).join('\n');

  const patch = <K extends keyof CacheStrategyInput>(key: K, value: CacheStrategyInput[K]) => {
    setStrategy((previous) => ({ ...previous, [key]: value }));
  };

  const handleCopy = async () => {
    await copyToClipboard(outputText);
    message.success('推荐响应头已复制');
  };

  return (
    <div className={styles.layout}>
      <Card title="缓存策略配置" size="small">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Switch
            checked={strategy.noStore}
            onChange={(checked) => patch('noStore', checked)}
            checkedChildren="no-store 完全不缓存"
            unCheckedChildren="正常缓存策略"
          />
          {!strategy.noStore && (
            <>
              <div>
                <div style={{ marginBottom: 6 }}>浏览器新鲜时长 max-age（秒）</div>
                <InputNumber
                  value={strategy.browserTtlSec}
                  onChange={(value) => patch('browserTtlSec', value ?? 0)}
                  min={0}
                  addonAfter="秒"
                  style={{ width: 200 }}
                />
                <Space wrap style={{ marginTop: 8 }}>
                  {TTL_PRESETS.map((preset) => (
                    <Button
                      key={preset.seconds}
                      size="small"
                      onClick={() => {
                        patch('browserTtlSec', preset.seconds);
                        patch('immutable', preset.seconds >= 31536000);
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </Space>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>CDN s-maxage（秒，留空不区分）</div>
                <InputNumber
                  value={strategy.sharedTtlSec ?? undefined}
                  onChange={(value) => patch('sharedTtlSec', value ?? null)}
                  min={0}
                  addonAfter="秒"
                  placeholder="同浏览器"
                  style={{ width: 200 }}
                />
              </div>
              <Space direction="vertical">
                <Switch
                  checked={strategy.allowSharedCache}
                  onChange={(checked) => patch('allowSharedCache', checked)}
                  checkedChildren="public（可上 CDN）"
                  unCheckedChildren="private（仅浏览器）"
                />
                <Switch
                  checked={strategy.mustRevalidate}
                  onChange={(checked) => patch('mustRevalidate', checked)}
                  checkedChildren="must-revalidate"
                  unCheckedChildren="允许源站故障时临时用旧响应"
                />
                <Switch
                  checked={strategy.immutable}
                  onChange={(checked) => patch('immutable', checked)}
                  checkedChildren="immutable"
                  unCheckedChildren="刷新时可重新验证"
                />
                <div>
                  <div style={{ marginBottom: 6 }}>stale-while-revalidate 宽限（秒，0 关闭）</div>
                  <InputNumber
                    value={strategy.staleWhileRevalidateSec}
                    onChange={(value) => patch('staleWhileRevalidateSec', value ?? 0)}
                    min={0}
                    addonAfter="秒"
                    style={{ width: 200 }}
                  />
                </div>
              </Space>
            </>
          )}
        </Space>
      </Card>

      <Card
        title="推荐响应头"
        size="small"
        extra={
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            复制
          </Button>
        }
      >
        {headers.map((header) => (
          <div key={header.name} style={{ marginBottom: 16 }}>
            <div className={styles.rawOutput}>{outputText}</div>
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8 }}>{header.note}</p>
          </div>
        ))}
      </Card>
    </div>
  );
};

export default HttpCacheControlParser;
