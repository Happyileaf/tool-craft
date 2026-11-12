'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import {
  ClearOutlined,
  CopyOutlined,
  ReloadOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import {
  decodeOid,
  encodeOid,
  lookupOidName,
  wrapDerTlv,
} from './utils/oid';
import styles from './index.module.css';

/** 编码页示例 OID：SHA-256 With RSA */
const ENCODE_SAMPLE = '1.2.840.113549.1.1.11';
/** 解码页示例十六进制 */
const DECODE_SAMPLE = '2A 86 48 86 F7 0D 01 01 0B';

/**
 * OID 编解码工具：点分十进制弧序列与 BER/DER 内容字节双向转换，
 * 逐弧展示 base-128 压缩过程，内置常见 OID 名称标注，全部本地运算。
 *
 * @returns OID 编解码交互界面
 */
const OidCodec: React.FC<ToolComponentProps> = () => {
  const [oidInput, setOidInput] = React.useState<string>('');
  const [hexInput, setHexInput] = React.useState<string>('');
  const [batchText, setBatchText] = React.useState<string>('');

  const encoded = React.useMemo(() => (oidInput.trim() === '' ? null : encodeOid(oidInput)), [oidInput]);
  const decoded = React.useMemo(() => (hexInput.trim() === '' ? null : decodeOid(hexInput)), [hexInput]);

  /** 批量条目解析结果 */
  const batchRows = React.useMemo(() => {
    if (batchText.trim() === '') {
      return [];
    }
    return batchText
      .split(/\r?\n/)
      .map((rawLine, lineIndex) => {
        const line = rawLine.trim();
        if (line === '') {
          return null;
        }
        const looksHex = /^[0-9a-fA-F\s:.-]+$/.test(line) && line.replace(/[\s:.-]/g, '').length % 2 === 0
          && !/^\d+(\.\d+)+$/.test(line);
        if (looksHex) {
          const result = decodeOid(line);
          return {
            key: lineIndex,
            direction: 'HEX → OID' as const,
            input: line,
            ok: result.ok,
            output: result.ok ? result.oid ?? '' : result.error ?? '解码失败',
            name: result.ok ? lookupOidName(result.oid ?? '') : null,
          };
        }
        const result = encodeOid(line);
        return {
          key: lineIndex,
          direction: 'OID → HEX' as const,
          input: line,
          ok: result.ok,
          output: result.ok ? result.hex ?? '' : result.error ?? '编码失败',
          name: lookupOidName(line),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  }, [batchText]);

  /** 复制文本并提示 */
  const copy = async (text: string, label: string): Promise<void> => {
    if (text === '') {
      message.warning('暂无可复制的内容');
      return;
    }
    await copyToClipboard(text);
    message.success(`${label}已复制`);
  };

  const encodeTab = (
    <div className={styles.container}>
      <Space wrap>
        <Button icon={<ReloadOutlined />} onClick={() => setOidInput(ENCODE_SAMPLE)}>
          载入示例
        </Button>
        <Button icon={<ClearOutlined />} onClick={() => setOidInput('')}>
          清空
        </Button>
      </Space>

      <Card title="点分十进制 OID">
        <Input
          value={oidInput}
          onChange={(event) => setOidInput(event.target.value)}
          placeholder="如 1.2.840.113549.1.1.11"
          className={styles.mono}
          size="large"
        />
        {oidInput.trim() !== '' && lookupOidName(oidInput.trim()) ? (
          <Tag color="blue" className={styles.nameTag} style={{ marginTop: 8 }}>
            {lookupOidName(oidInput.trim())}
          </Tag>
        ) : null}
      </Card>

      {encoded && !encoded.ok ? (
        <Alert type="error" showIcon message="编码失败" description={encoded.error} />
      ) : null}

      {encoded && encoded.ok ? (
        <>
          <Card
            title="BER/DER 内容字节（十六进制）"
            extra={
              <Space>
                <Button
                  size="small"
                  icon={<SwapOutlined />}
                  onClick={() => setHexInput(encoded.hex ?? '')}
                >
                  送到解码页
                </Button>
                <Button
                  type="primary"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copy(encoded.hex ?? '', '十六进制')}
                >
                  复制
                </Button>
              </Space>
            }
          >
            <pre className={styles.hexBox}>{encoded.hex}</pre>
          </Card>

          <Card title="完整 DER TLV（Tag 06 + Length + Value）">
            <pre className={styles.hexBox}>
              {wrapDerTlv(encoded.bytes ?? [])}
            </pre>
          </Card>

          <Card title="逐弧编码过程（base-128 压缩）">
            <Table
              className={styles.stepTable}
              size="small"
              pagination={false}
              dataSource={encoded.steps ?? []}
              rowKey={(record) => String(record.index)}
              columns={[
                { title: '弧序号', dataIndex: 'index', width: 80 },
                {
                  title: '弧值（首行为 40·X+Y 合并值）',
                  dataIndex: 'value',
                  render: (value: bigint) => value.toString(),
                },
                {
                  title: '7 位组',
                  dataIndex: 'groups',
                  render: (groups: number[]) =>
                    groups.map((group) => group.toString(16).toUpperCase().padStart(2, '0')).join(' '),
                },
                {
                  title: '输出字节',
                  dataIndex: 'bytes',
                  render: (bytes: number[]) =>
                    bytes.map((byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(' '),
                },
              ]}
            />
          </Card>
        </>
      ) : null}
    </div>
  );

  const decodeTab = (
    <div className={styles.container}>
      <Space wrap>
        <Button icon={<ReloadOutlined />} onClick={() => setHexInput(DECODE_SAMPLE)}>
          载入示例
        </Button>
        <Button icon={<ClearOutlined />} onClick={() => setHexInput('')}>
          清空
        </Button>
      </Space>

      <Card title="BER/DER 内容字节（十六进制，可含空格/冒号/0x 前缀）">
        <Input
          value={hexInput}
          onChange={(event) => setHexInput(event.target.value)}
          placeholder="如 2A 86 48 86 F7 0D 01 01 0B"
          className={styles.mono}
          size="large"
        />
      </Card>

      {decoded && !decoded.ok ? (
        <Alert type="error" showIcon message="解码失败" description={decoded.error} />
      ) : null}

      {decoded && decoded.ok ? (
        <Card
          title="点分十进制 OID"
          extra={
            <Space>
              <Button size="small" icon={<SwapOutlined />} onClick={() => setOidInput(decoded.oid ?? '')}>
                送到编码页
              </Button>
              <Button
                type="primary"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copy(decoded.oid ?? '', 'OID')}
              >
                复制
              </Button>
            </Space>
          }
        >
          <pre className={styles.hexBox}>{decoded.oid}</pre>
          {lookupOidName(decoded.oid ?? '') ? (
            <Tag color="blue" className={styles.nameTag}>
              {lookupOidName(decoded.oid ?? '')}
            </Tag>
          ) : (
            <span className={styles.hint}>未命中内置常见名称表（仅收录少量密码学/X.500 OID）</span>
          )}
        </Card>
      ) : null}
    </div>
  );

  const batchTab = (
    <div className={styles.container}>
      <Card title="批量转换（每行一条；自动识别点分 OID 或十六进制）">
        <Input.TextArea
          value={batchText}
          onChange={(event) => setBatchText(event.target.value)}
          placeholder={'1.2.840.113549.1.1.11\n2A864886F70D01010B\n2.5.4.3'}
          autoSize={{ minRows: 6, maxRows: 16 }}
          className={styles.mono}
        />
      </Card>
      {batchRows.length > 0 ? (
        <Table
          className={styles.batchRow}
          size="small"
          pagination={false}
          scroll={{ x: true }}
          dataSource={batchRows}
          columns={[
            { title: '方向', dataIndex: 'direction', width: 110 },
            { title: '输入', dataIndex: 'input' },
            {
              title: '输出',
              dataIndex: 'output',
              render: (text: string, record) => (
                <span style={{ color: record.ok ? undefined : '#cf1322' }}>{text}</span>
              ),
            },
            {
              title: '名称',
              dataIndex: 'name',
              render: (name: string | null) => name ?? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="" />,
            },
          ]}
        />
      ) : (
        <Empty description="输入内容后在此展示批量结果" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
      <div className={styles.hint}>
        本工具只处理 OID 的内容字节（Value 部分）；若输入包含完整 TLV，请先去掉首字节 06 与长度字节。
        全部转换在浏览器本地完成，数据不上传。
      </div>
    </div>
  );

  return (
    <Tabs
      defaultActiveKey="encode"
      items={[
        { key: 'encode', label: 'OID → HEX 编码', children: encodeTab },
        { key: 'decode', label: 'HEX → OID 解码', children: decodeTab },
        { key: 'batch', label: '批量转换', children: batchTab },
      ]}
    />
  );
};

export default OidCodec;
