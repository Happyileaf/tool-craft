import { useMemo, useState } from 'react';
import { Alert, Button, Input, Radio, Space, Table, Tabs, Tag, Typography } from 'antd';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import {
  DEFAULT_ABI_JSON,
  DEFAULT_EVENT_SIGNATURE,
  DEFAULT_SIGNATURE,
  SIGNATURE_KIND_OPTIONS,
  type SignatureKind,
} from './constants';
import {
  computeSignature,
  matchSelector,
  parseAbiJson,
  type AbiRow,
  type SignatureResult,
} from './utils/abi';
import styles from './index.module.css';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

function SignaturePanel({ initialSignature, initialKind }: { initialSignature: string; initialKind: SignatureKind }) {
  const [signature, setSignature] = useState(initialSignature);
  const [kind, setKind] = useState<SignatureKind>(initialKind);

  const result = useMemo<{ data: SignatureResult | null; error: string | null }>(() => {
    try {
      return { data: computeSignature(signature, kind), error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  }, [signature, kind]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h3 className={styles.title}>签名类型</h3>
        <Radio.Group
          value={kind}
          onChange={(event) => setKind(event.target.value as SignatureKind)}
          optionType="button"
          buttonStyle="solid"
          options={SIGNATURE_KIND_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
        />
        <p className={styles.hint}>
          {SIGNATURE_KIND_OPTIONS.find((item) => item.value === kind)?.hint}
        </p>
      </div>

      <div className={styles.card}>
        <h3 className={styles.title}>输入签名（允许含参数名、空格、memory/calldata、tuple）</h3>
        <TextArea
          value={signature}
          onChange={(event) => setSignature(event.target.value)}
          autoSize={{ minRows: 2, maxRows: 6 }}
          spellCheck={false}
          className={styles.mono}
        />
      </div>

      {result.error ? (
        <Alert className={styles.errorBox} type="error" showIcon message="签名解析失败" description={result.error} />
      ) : result.data ? (
        <div className={styles.card}>
          <h3 className={styles.title}>计算结果</h3>
          <div className={styles.hashLine}>
            <div>
              <Text type="secondary">规范化签名（Canonical Signature）</Text>
              <div className={styles.canonical}>{result.data.canonicalSignature}</div>
            </div>
            <div>
              <Text type="secondary">keccak-256 摘要（32 字节）</Text>
              <div className={styles.copyRow}>
                <Text className={styles.hashText}>{result.data.hash32}</Text>
                <Button size="small" onClick={() => void copyToClipboard(result.data!.hash32)}>
                  复制
                </Button>
              </div>
            </div>
            {result.data.selector && (
              <div>
                <Text type="secondary">函数选择器（前 4 字节）</Text>
                <div className={styles.copyRow}>
                  <Text className={styles.hashText}>{result.data.selector}</Text>
                  <Button size="small" onClick={() => void copyToClipboard(result.data!.selector!)}>
                    复制
                  </Button>
                </div>
              </div>
            )}
            {result.data.topic0 && (
              <div>
                <Text type="secondary">事件 Topic0（完整 32 字节）</Text>
                <div className={styles.copyRow}>
                  <Text className={styles.hashText}>{result.data.topic0}</Text>
                  <Button size="small" onClick={() => void copyToClipboard(result.data!.topic0!)}>
                    复制
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AbiPanel() {
  const [abiJson, setAbiJson] = useState(DEFAULT_ABI_JSON);
  const [selectorQuery, setSelectorQuery] = useState('0xa9059cbb');

  const parsed = useMemo<{ rows: AbiRow[]; error: string | null }>(() => {
    try {
      return { rows: parseAbiJson(abiJson), error: null };
    } catch (error) {
      return { rows: [], error: (error as Error).message };
    }
  }, [abiJson]);

  const match = useMemo(
    () => (parsed.error ? null : matchSelector(parsed.rows, selectorQuery)),
    [parsed, selectorQuery],
  );

  const getRowKey = (row: AbiRow): string =>
    [row.abiType, row.canonicalSignature, row.note ?? ''].join('-');

  const columns = [
    {
      title: '类型',
      dataIndex: 'abiType',
      width: 90,
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: '规范化签名',
      dataIndex: 'canonicalSignature',
      render: (value: string, row: AbiRow) =>
        row.note ? <Text type="secondary">{row.note}</Text> : <Text className={styles.mono}>{value}</Text>,
    },
    {
      title: 'Selector / Topic0',
      render: (_: unknown, row: AbiRow) =>
        row.selector ? (
          <Text className={styles.mono} strong>
            {row.selector}
          </Text>
        ) : row.topic0 ? (
          <Text className={styles.mono} strong>
            {row.topic0}
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h3 className={styles.title}>粘贴合约 ABI（JSON 数组）</h3>
        <TextArea
          value={abiJson}
          onChange={(event) => setAbiJson(event.target.value)}
          autoSize={{ minRows: 8, maxRows: 20 }}
          spellCheck={false}
          className={styles.mono}
        />
      </div>

      {parsed.error ? (
        <Alert type="error" showIcon message="ABI 解析失败" description={parsed.error} />
      ) : (
        <>
          <div className={styles.card}>
            <h3 className={styles.title}>批量计算结果（{parsed.rows.length} 条）</h3>
            <div className={styles.tableWrap}>
              <Table rowKey={getRowKey} columns={columns} dataSource={parsed.rows} pagination={false} size="small" />
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.title}>Selector 反查</h3>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={selectorQuery}
                onChange={(event) => setSelectorQuery(event.target.value)}
                placeholder="输入 4 字节 selector，如 0xa9059cbb"
                className={styles.mono}
                spellCheck={false}
              />
            </Space.Compact>
            <div style={{ marginTop: 12 }}>
              {selectorQuery.trim() === '' ? (
                <Text type="secondary">输入 selector 后自动反查所属函数</Text>
              ) : match ? (
                <Alert
                  type="success"
                  showIcon
                  message={`命中：${match.canonicalSignature}`}
                  description={`${match.abiType} · selector ${match.selector ?? '—'}`}
                />
              ) : (
                <Alert type="warning" showIcon message="当前 ABI 中未找到匹配的函数" />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function EvmAbiSelectorCalculator(_props: ToolComponentProps) {
  return (
    <div className={styles.container}>
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        依据 Solidity ABI 规范：函数 / 自定义 error 的 selector 为规范化签名 keccak-256 摘要的前 4 字节；事件的 Topic0
        为完整 32 字节摘要。全部哈希在浏览器本地完成，无网络请求。
      </Paragraph>
      <Tabs
        defaultActiveKey="function"
        items={[
          { key: 'function', label: '函数 / Error 签名', children: <SignaturePanel initialSignature={DEFAULT_SIGNATURE} initialKind="function" /> },
          { key: 'event', label: '事件签名', children: <SignaturePanel initialSignature={DEFAULT_EVENT_SIGNATURE} initialKind="event" /> },
          { key: 'abi', label: 'ABI 批量解析', children: <AbiPanel /> },
        ]}
      />
    </div>
  );
}
