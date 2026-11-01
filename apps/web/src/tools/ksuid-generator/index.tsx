'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, InputNumber, Radio, Space, Table, Tag, message } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import TextArea from 'antd/es/input/TextArea';
import { KSUID_EPOCH, generateKsuid, parseKsuid, type KSUID_PARTS } from './utils/ksuid';
import {
  DEFAULT_COUNT,
  DEFAULT_SAMPLE_KSUID,
  GENERATE_HINT,
  MAX_COUNT,
  MIN_COUNT,
  PARSE_HINT,
  TABLE_PAGE_SIZE,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type Mode = 'generate' | 'parse';

/** 生成结果表格行 */
interface KsuidRow extends KSUID_PARTS {
  /** 行键 */
  key: number;
}

/**
 * 基于 Web Crypto 的随机 payload 提供器，返回 16 字节密码学安全随机数据
 *
 * @returns 16 字节随机 Uint8Array
 */
function securePayload(): Uint8Array {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Segment KSUID 生成器与解析器：按 Segment KSUID 规范生成 27 字符 Base62 标识符
 * （4 字节大端秒级调整时间戳 + 16 字节随机 payload），支持批量生成、逐条查看
 * UTC 时间与 payload，并可把任意 KSUID 实时反解。全部运算在浏览器本地完成，不发起网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入，用于解析区初始值
 * @returns KSUID 生成与解析交互界面
 */
const KsuidGenerator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<Mode>('generate');
  const [count, setCount] = React.useState<number>(DEFAULT_COUNT);
  const [ids, setIds] = React.useState<string[]>([]);
  const [generateError, setGenerateError] = React.useState<string | null>(null);
  const [parseInput, setParseInput] = React.useState<string>(defaultInput || DEFAULT_SAMPLE_KSUID);

  /**
   * 按当前数量批量生成 KSUID，每次点击都重新抽取随机字节
   */
  const regenerate = React.useCallback(() => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const next: string[] = [];
    for (let index = 0; index < count; index += 1) {
      const result = generateKsuid(nowSeconds, securePayload);
      if (typeof result !== 'string') {
        setIds([]);
        setGenerateError(result.error);
        return;
      }
      next.push(result);
    }
    setIds(next);
    setGenerateError(null);
  }, [count]);

  React.useEffect(() => {
    regenerate();
  }, [regenerate]);

  /** 每条 KSUID 反解出的 UTC 时间与 payload，供表格展示 */
  const rows = React.useMemo<KsuidRow[]>(
    () =>
      ids.flatMap((id, index) => {
        const parsed = parseKsuid(id);
        return 'error' in parsed ? [] : [{ ...parsed, key: index }];
      }),
    [ids],
  );

  /** 解析区实时结果 */
  const parsed = React.useMemo(() => {
    if (!parseInput.trim()) {
      return null;
    }
    return parseKsuid(parseInput);
  }, [parseInput]);

  /**
   * 复制全部生成结果
   */
  const handleCopyAll = async () => {
    if (ids.length === 0) {
      return;
    }
    await copyToClipboard(ids.join('\n'));
    message.success('复制成功');
  };

  const columns = [
    {
      title: '#',
      dataIndex: 'key',
      key: 'index',
      width: 60,
      render: (value: number) => value + 1,
    },
    { title: 'KSUID', dataIndex: 'ksuid', key: 'ksuid' },
    { title: 'UTC 时间', dataIndex: 'date', key: 'date', width: 220 },
    { title: 'payload hex（16 字节）', dataIndex: 'payloadHex', key: 'payloadHex' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={mode}
          options={[
            { value: 'generate', label: '生成' },
            { value: 'parse', label: '解析' },
          ]}
          onChange={(event) => setMode(event.target.value as Mode)}
        />
        <Tag color="blue">Segment KSUID</Tag>
      </div>

      {mode === 'generate' ? (
        <Card className={styles.card} title="KSUID 批量生成（Base62，按时间字典序可排序）">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div className={styles.field}>
              <span className={styles.label}>数量：</span>
              <InputNumber
                className={styles.countInput}
                min={MIN_COUNT}
                max={MAX_COUNT}
                precision={0}
                value={count}
                onChange={(value) => setCount(value ?? DEFAULT_COUNT)}
              />
              <Button type="primary" icon={<ReloadOutlined />} onClick={regenerate}>
                生成
              </Button>
              <Button icon={<CopyOutlined />} onClick={handleCopyAll} disabled={ids.length === 0}>
                复制全部
              </Button>
            </div>
            {generateError ? (
              <Alert type="error" showIcon message="生成失败" description={generateError} />
            ) : null}
            <TextArea
              value={ids.join('\n')}
              readOnly
              autoSize={{ minRows: 6, maxRows: 16 }}
              spellCheck={false}
              className={styles.monoOutput}
            />
            <Table
              size="small"
              columns={columns}
              dataSource={rows}
              pagination={rows.length > TABLE_PAGE_SIZE ? { pageSize: TABLE_PAGE_SIZE } : false}
            />
            <div className={styles.hint}>{GENERATE_HINT}</div>
          </Space>
        </Card>
      ) : (
        <Card className={styles.card} title="KSUID 解析（反解 UTC 时间、调整时间戳与随机 payload）">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <TextArea
              value={parseInput}
              onChange={(event) => setParseInput(event.target.value)}
              placeholder="输入 27 字符 KSUID"
              autoSize={{ minRows: 1, maxRows: 4 }}
              spellCheck={false}
              className={styles.monoOutput}
            />
            {parsed && 'error' in parsed ? (
              <Alert type="error" showIcon message="解析失败" description={parsed.error} />
            ) : parsed ? (
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="KSUID">
                  <span className={styles.monoText}>{parsed.ksuid}</span>
                </Descriptions.Item>
                <Descriptions.Item label="UTC 时间">{parsed.date}</Descriptions.Item>
                <Descriptions.Item label="Unix 时间戳（秒）">
                  {parsed.timestampSeconds}
                </Descriptions.Item>
                <Descriptions.Item label={`调整时间戳（秒，Unix 秒 − ${KSUID_EPOCH}）`}>
                  {parsed.timestampSeconds - KSUID_EPOCH}
                </Descriptions.Item>
                <Descriptions.Item label="payload hex（16 字节）">
                  <span className={styles.monoText}>{parsed.payloadHex}</span>
                </Descriptions.Item>
              </Descriptions>
            ) : null}
            <div className={styles.hint}>{PARSE_HINT}</div>
          </Space>
        </Card>
      )}
    </div>
  );
};

export default KsuidGenerator;
