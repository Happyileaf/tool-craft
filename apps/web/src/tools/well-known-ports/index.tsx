'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Card,
  Collapse,
  Divider,
  Empty,
  Input,
  Radio,
  Tag,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import {
  PORT_ENTRIES,
  getPortRange,
  lookupPort,
  searchPorts,
  tokenizeInput,
  validatePort,
  type PortEntry,
  type PortProtocol,
  type PortRangeKey,
} from './utils/ports';
import {
  DATA_SOURCE_HINT,
  PROTOCOL_OPTIONS,
  PROTOCOL_TAG_COLOR,
  RANGE_ORDER,
  RANGE_TAG_COLOR,
  RANGE_TITLE,
  SEARCH_PLACEHOLDER,
} from './constants';
import styles from './index.module.css';

type ProtocolFilter = PortProtocol | 'all';

/**
 * 展开条目详情（协议、官方性、端口区间、用途关键词）。
 *
 * @param entry - 端口记录
 * @returns 详情区域
 */
function renderDetail(entry: PortEntry) {
  const range = getPortRange(entry.port);
  return (
    <div className={styles.detailBlock}>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>传输协议</span>
        <span className={styles.detailText}>
          {entry.protocols.map((protocol) => (
            <Tag key={protocol} color={PROTOCOL_TAG_COLOR[protocol]} className={styles.protoTag}>
              {protocol.toUpperCase()}
            </Tag>
          ))}
        </span>
      </div>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>服务名</span>
        <span className={styles.detailText}>
          {entry.name}
          {entry.official ? (
            <Tag color="geekblue" style={{ marginInlineStart: 8 }}>
              IANA 正式分配
            </Tag>
          ) : (
            <Tag color="default" style={{ marginInlineStart: 8 }}>
              生态事实默认端口
            </Tag>
          )}
        </span>
      </div>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>端口区间</span>
        <span className={styles.detailText}>
          <Tag color={RANGE_TAG_COLOR[range.key]}>
            {range.label}（{range.range}）
          </Tag>
        </span>
      </div>
      <div className={styles.detailRow}>
        <span className={styles.detailLabel}>关键词</span>
        <span className={styles.detailText}>{entry.keywords.join('、')}</span>
      </div>
    </div>
  );
}

/**
 * 把端口记录按区间分组（已按端口号升序）。
 *
 * @param entries - 端口记录
 * @returns 区间分组
 */
function groupByRange(entries: PortEntry[]): Record<PortRangeKey, PortEntry[]> {
  const groups: Record<PortRangeKey, PortEntry[]> = {
    'well-known': [],
    registered: [],
    dynamic: [],
  };
  entries.forEach((entry) => {
    groups[getPortRange(entry.port).key].push(entry);
  });
  return groups;
}

/**
 * 知名 TCP/UDP 端口号速查：按端口号精确查询、按服务名 / 中文用途模糊搜索，
 * 支持多端口粘贴批量解析与端口区间判定。全部数据内置、纯本地检索。
 *
 * @returns 知名端口速查交互界面
 */
const WellKnownPorts: React.FC<ToolComponentProps> = () => {
  const [keyword, setKeyword] = React.useState('');
  const [protocol, setProtocol] = React.useState<ProtocolFilter>('all');

  const tokens = tokenizeInput(keyword);

  const filteredEntries = React.useMemo(() => {
    const matched = tokens.length === 1 ? searchPorts(tokens[0]) : PORT_ENTRIES;
    return protocol === 'all'
      ? matched
      : matched.filter((entry) => entry.protocols.includes(protocol));
  }, [tokens, protocol]);

  const groups = React.useMemo(
    () => groupByRange(filteredEntries),
    [filteredEntries],
  );

  /**
   * 渲染单个折叠面板（搜索结果 / 浏览列表共用）。
   *
   * @param entry - 端口记录
   * @returns 折叠面板配置
   */
  const buildCollapseItem = (entry: PortEntry) => ({
    key: entry.port,
    label: (
      <span className={styles.groupTitle}>
        <span className={styles.portNumber}>{entry.port}</span>
        {entry.protocols.map((item) => (
          <Tag key={item} color={PROTOCOL_TAG_COLOR[item]}>
            {item.toUpperCase()}
          </Tag>
        ))}
        <span className={styles.portNameZh}>{entry.nameZh}</span>
        <span className={styles.portName}>{entry.name}</span>
      </span>
    ),
    children: renderDetail(entry),
  });

  /**
   * 批量解析模式：逐词条展示校验结果、收录服务与区间。
   */
  const renderBatch = () => (
    <Card className={styles.card} title={`批量解析（${tokens.length} 个）`}>
      {tokens.map((token) => {
        const result = validatePort(token);
        if (!result.ok) {
          return (
            <div key={token} className={styles.batchItem}>
              <span className={styles.batchToken}>{token}</span>
              <span className={`${styles.batchText} ${styles.batchError}`}>
                {result.error}
              </span>
            </div>
          );
        }
        const entry = lookupPort(result.value);
        const range = getPortRange(result.value);
        return (
          <div key={token} className={styles.batchItem}>
            <span className={styles.batchToken}>{result.value}</span>
            <Tag color={RANGE_TAG_COLOR[range.key]}>
              {range.label}（{range.range}）
            </Tag>
            <span className={styles.batchText}>
              {entry
                ? `${entry.name}（${entry.protocols
                    .map((item) => item.toUpperCase())
                    .join(' / ')}）— ${entry.nameZh}`
                : '未收录的服务，可自行配置使用'}
            </span>
          </div>
        );
      })}
    </Card>
  );

  /**
   * 单词条数字输入：精确条目 + 区间判定（未收录也展示区间）。
   */
  const renderSingleNumber = (token: string) => {
    const result = validatePort(token);
    if (!result.ok) {
      return (
        <Card className={styles.card}>
          <Alert type="error" showIcon message={result.error} />
        </Card>
      );
    }
    const entry = lookupPort(result.value);
    const range = getPortRange(result.value);
    return (
      <Card className={styles.card}>
        <div className={styles.groupTitle} style={{ marginBottom: 12 }}>
          <span className={styles.portNumber}>{result.value}</span>
          <Tag color={RANGE_TAG_COLOR[range.key]}>
            {range.label}（{range.range}）
          </Tag>
        </div>
        {entry ? (
          <Collapse items={[buildCollapseItem(entry)]} defaultActiveKey={[entry.port]} />
        ) : (
          <Empty description="内置数据未收录该端口的服务名，但端口区间判定如上" />
        )}
      </Card>
    );
  };

  return (
    <div className={styles.container}>
      <Card title={`知名 TCP/UDP 端口速查（内置 ${PORT_ENTRIES.length} 条 IANA 稳定条目）`}>
        <div className={styles.toolbar}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={protocol}
            onChange={(event) => setProtocol(event.target.value as ProtocolFilter)}
            options={PROTOCOL_OPTIONS}
          />
          <Input
            className={styles.searchInput}
            allowClear
            prefix={<SearchOutlined />}
            placeholder={SEARCH_PLACEHOLDER}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <p className={styles.hint}>
          {DATA_SOURCE_HINT}
          ；单个数字按端口号查询（未收录也会判定区间），多个词条（空格 / 逗号 / 换行分隔）进入批量解析。
        </p>
      </Card>

      {tokens.length > 1 ? (
        renderBatch()
      ) : tokens.length === 1 && /^\d+$/.test(tokens[0].trim()) ? (
        renderSingleNumber(tokens[0])
      ) : filteredEntries.length === 0 ? (
        <Card className={styles.card}>
          <Empty description="没有匹配的端口或服务，换个关键词试试" />
        </Card>
      ) : (
        RANGE_ORDER.filter((key) => groups[key].length > 0).map((key) => (
          <Card key={key} className={styles.card}>
            <Divider titlePlacement="left" style={{ marginTop: 0, marginBottom: 12 }}>
              <span className={styles.groupTitle}>
                {RANGE_TITLE[key]}
                <span className={styles.groupCount}>（{groups[key].length}）</span>
              </span>
            </Divider>
            <Collapse items={groups[key].map(buildCollapseItem)} />
          </Card>
        ))
      )}
    </div>
  );
};

export default WellKnownPorts;
