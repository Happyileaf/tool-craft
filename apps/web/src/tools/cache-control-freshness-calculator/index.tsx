'use client';

import React from 'react';
import { Alert, Button, Card, Descriptions, Input, Space, Statistic, Tag } from 'antd';
import type { ToolComponentProps } from '../loaders';
import { DEFAULT_HEADERS, EXAMPLE_PRESETS } from './constants';
import { evaluateFreshness, STATUS_META } from './utils/cache-control';
import styles from './index.module.css';

/**
 * HTTP Cache-Control 指令解析与缓存新鲜度计算器：
 * 粘贴响应头文本，按 RFC 9111 计算新鲜度寿命、当前年龄、剩余新鲜时间
 * 与 fresh/stale/revalidate 结论，全部在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认响应头文本
 * @returns 缓存新鲜度评估界面
 */
const CacheControlFreshnessCalculator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [rawHeaders, setRawHeaders] = React.useState<string>(defaultInput || DEFAULT_HEADERS);
  const [now, setNow] = React.useState<number>(() => Date.now());

  const result = React.useMemo(
    () => evaluateFreshness(rawHeaders, now),
    [rawHeaders, now],
  );
  const statusMeta = STATUS_META[result.status];

  return (
    <div className={styles.container}>
      <Card title="HTTP Cache-Control 新鲜度计算器（RFC 9111）">
        <div className={styles.formColumn}>
          <span className={styles.label}>响应头（每行一个 Key: Value，可包含起始行）</span>
          <Input.TextArea
            value={rawHeaders}
            onChange={(event) => setRawHeaders(event.target.value)}
            rows={9}
            className={styles.textArea}
            spellCheck={false}
          />
        </div>

        <Space wrap style={{ marginBottom: 12 }}>
          {EXAMPLE_PRESETS.map((preset) => (
            <Button key={preset.label} size="small" onClick={() => setRawHeaders(preset.headers)}>
              {preset.label}
            </Button>
          ))}
          <Button size="small" onClick={() => setNow(Date.now())}>
            以当前时间重新评估
          </Button>
        </Space>

        <Alert
          type={statusMeta.tone === 'default' ? 'info' : statusMeta.tone}
          showIcon
          message={`结论：${statusMeta.label}`}
        />

        <div className={styles.statGrid}>
          <Statistic
            title="新鲜度寿命"
            value={result.freshnessLifetimeSec === null ? '未知' : result.freshnessLifetimeSec}
            suffix={result.freshnessLifetimeSec === null ? '' : ' 秒'}
          />
          <Statistic title="当前年龄（corrected age）" value={result.currentAgeSec} suffix=" 秒" />
          <Statistic
            title="剩余新鲜时间"
            value={result.remainingFreshSec === null ? '未知' : result.remainingFreshSec}
            suffix={result.remainingFreshSec === null ? '' : ' 秒'}
            valueStyle={{
              color:
                result.remainingFreshSec === null
                  ? undefined
                  : result.remainingFreshSec > 0
                    ? '#16a34a'
                    : '#dc2626',
            }}
          />
          <Statistic title="缓存语境" value={result.sharedCache ? '共享缓存（s-maxage）' : '私有/浏览器缓存'} />
        </div>

        <Descriptions title="解析出的指令" column={1} size="small" bordered>
          <Descriptions.Item label="Cache-Control">
            {result.directives.length === 0 ? (
              <span className={styles.mono}>（无）</span>
            ) : (
              result.directives.map((directive) => (
                <Tag
                  key={`${directive.name}-${directive.value ?? 'flag'}`}
                  className={styles.directiveTag}
                  color={directive.known ? 'blue' : 'default'}
                >
                  <span className={styles.mono}>
                    {directive.name}
                    {directive.value === null ? '' : `=${directive.value}`}
                    {directive.known ? '' : '（未知）'}
                  </span>
                </Tag>
              ))
            )}
          </Descriptions.Item>
        </Descriptions>

        {result.notices.length > 0 && (
          <Alert
            style={{ marginTop: 12 }}
            type="warning"
            showIcon
            message="提示与冲突"
            description={
              <ul className={styles.noticeList}>
                {result.notices.map((notice) => (
                  <li key={notice}>{notice}</li>
                ))}
              </ul>
            }
          />
        )}
      </Card>

      <Alert
        type="info"
        showIcon
        message="RFC 9111 计算口径"
        description={
          <div className={styles.hint}>
            <p>
              新鲜度寿命优先级为 s-maxage（共享缓存）→ max-age → Expires 减 Date
              → 启发式（本工具不臆测数值）。当前年龄取 Age 头与表观年龄（now − Date）的较大值，并与驻留时间再取大，即 corrected current age。
            </p>
            <p>
              no-store 直接禁止存储；no-cache 表示可以存但每次使用前必须协商验证；过期后若存在
              ETag / Last-Modified，可携带 If-None-Match / If-Modified-Since 发起条件请求。所有解析均在本机浏览器完成，响应头不会被上传。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default CacheControlFreshnessCalculator;
