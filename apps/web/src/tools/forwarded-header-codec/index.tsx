'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Radio,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import { PROTO_OPTIONS, createEmptyElement } from './constants';
import {
  SAMPLE_FORWARDED_HEADER,
  generateForwardedHeader,
  parseForwardedHeader,
  type ForwardedElement,
} from './utils/forwarded';
import styles from './index.module.css';

type Mode = 'parse' | 'build';

/** 表单中的转发元素，允许空字符串字段 */
type FormElement = Record<keyof ForwardedElement, string>;

const DEFAULT_HOPS: FormElement[] = [
  { for: '203.0.113.10', by: '10.0.0.1', host: 'api.example.com', proto: 'https' },
];

/**
 * RFC 7239 Forwarded HTTP 头解析与生成器：
 * 解析模式把代理链头值结构化为逐跳表格，构造模式通过表单编辑各跳并生成合规头值。
 */
const ForwardedHeaderCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<Mode>('parse');
  const [headerInput, setHeaderInput] = React.useState<string>(
    defaultInput ?? SAMPLE_FORWARDED_HEADER,
  );
  const [hops, setHops] = React.useState<FormElement[]>(DEFAULT_HOPS);

  const parseResult = React.useMemo(
    () => parseForwardedHeader(headerInput),
    [headerInput],
  );

  const generatedHeader = React.useMemo(
    () =>
      generateForwardedHeader(
        hops
          .map((hop) =>
            Object.fromEntries(
              Object.entries(hop).filter(([, value]) => value.trim() !== ''),
            ) as ForwardedElement,
          )
          .filter((element) => Object.keys(element).length > 0),
      ),
    [hops],
  );

  const updateHop = (index: number, field: keyof FormElement, value: string) => {
    setHops((previous) =>
      previous.map((hop, currentIndex) =>
        currentIndex === index ? { ...hop, [field]: value } : hop,
      ),
    );
  };

  const removeHop = (index: number) => {
    setHops((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  const loadParsedIntoBuilder = () => {
    setHops(
      parseResult.elements.map((element) => ({
        for: element.for ?? '',
        by: element.by ?? '',
        host: element.host ?? '',
        proto: element.proto ?? '',
      })),
    );
    setMode('build');
    message.info('已载入解析结果到构造器');
  };

  const handleCopy = async (text: string) => {
    if (!text) {
      message.warning('暂无可复制的内容');
      return;
    }
    await copyToClipboard(text);
    message.success('已复制到剪贴板');
  };

  const parseColumns: ColumnsType<ForwardedElement> = [
    { title: '跳数', key: 'index', width: 70, render: (_, __, index) => <Tag>{index + 1}</Tag> },
    {
      title: 'for（发起节点）',
      dataIndex: 'for',
      key: 'for',
      render: (value?: string) => <span className={styles.mono}>{value ?? '—'}</span>,
    },
    {
      title: 'by（代理节点）',
      dataIndex: 'by',
      key: 'by',
      render: (value?: string) => <span className={styles.mono}>{value ?? '—'}</span>,
    },
    {
      title: 'host',
      dataIndex: 'host',
      key: 'host',
      render: (value?: string) => <span className={styles.mono}>{value ?? '—'}</span>,
    },
    {
      title: 'proto',
      dataIndex: 'proto',
      key: 'proto',
      render: (value?: string) =>
        value ? <Tag color={value === 'https' ? 'green' : 'orange'}>{value}</Tag> : '—',
    },
  ];

  return (
    <div className={styles.container}>
      <Radio.Group
        value={mode}
        onChange={(event) => setMode(event.target.value as Mode)}
        optionType="button"
        buttonStyle="solid"
        options={[
          { label: '解析 Forwarded 头', value: 'parse' },
          { label: '构造 Forwarded 头', value: 'build' },
        ]}
      />

      {mode === 'parse' ? (
        <Card
          title="RFC 7239 Forwarded 头解析"
          extra={
            <Space>
              <Button size="small" onClick={() => setHeaderInput(SAMPLE_FORWARDED_HEADER)}>
                示例
              </Button>
              <Button
                size="small"
                type="primary"
                icon={<ArrowRightOutlined />}
                disabled={!parseResult.valid || parseResult.elements.length === 0}
                onClick={loadParsedIntoBuilder}
              >
                载入构造器
              </Button>
            </Space>
          }
        >
          <Input.TextArea
            className={styles.mono}
            value={headerInput}
            onChange={(event) => setHeaderInput(event.target.value)}
            autoSize={{ minRows: 3, maxRows: 8 }}
            placeholder="粘贴 Forwarded 头字段值，例如 for=192.0.2.60;proto=http;by=203.0.113.43"
          />

          {parseResult.errors.length > 0 && (
            <Alert
              style={{ marginTop: 12 }}
              type="warning"
              showIcon
              message="解析告警"
              description={
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {parseResult.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              }
            />
          )}

          {parseResult.elements.length > 0 ? (
            <Table<ForwardedElement>
              style={{ marginTop: 12 }}
              rowKey={(_, index) => `hop-${index}`}
              columns={parseColumns}
              dataSource={parseResult.elements}
              pagination={false}
              size="small"
              scroll={{ x: 640 }}
            />
          ) : (
            <Empty style={{ marginTop: 16 }} description="无有效转发元素" />
          )}
        </Card>
      ) : (
        <Card
          title="RFC 7239 Forwarded 头构造"
          extra={
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setHops((previous) => [...previous, createEmptyElement()])}
            >
              新增一跳
            </Button>
          }
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {hops.map((hop, index) => (
              <div className={styles.hopCard} key={index}>
                <div className={styles.hopHeader}>
                  <Tag color="blue">第 {index + 1} 跳</Tag>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={hops.length <= 1}
                    onClick={() => removeHop(index)}
                  >
                    删除
                  </Button>
                </div>
                <div className={styles.field}>
                  <label>for（发起节点，IP / unknown / _obfuscated）</label>
                  <Input
                    className={styles.mono}
                    value={hop.for}
                    placeholder='192.0.2.60 或 "[2001:db8::17]:4711"'
                    onChange={(event) => updateHop(index, 'for', event.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label>by（代理节点）</label>
                  <Input
                    className={styles.mono}
                    value={hop.by}
                    placeholder="203.0.113.43"
                    onChange={(event) => updateHop(index, 'by', event.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label>host（原始 Host）</label>
                  <Input
                    className={styles.mono}
                    value={hop.host}
                    placeholder="example.com"
                    onChange={(event) => updateHop(index, 'host', event.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label>proto（原始协议）</label>
                  <Radio.Group
                    value={hop.proto || undefined}
                    onChange={(event) => updateHop(index, 'proto', event.target.value)}
                    optionType="button"
                    buttonStyle="solid"
                    options={PROTO_OPTIONS.map((value) => ({ label: value, value }))}
                  />
                </div>
              </div>
            ))}
          </Space>
        </Card>
      )}

      <Card
        title="生成结果"
        extra={
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(mode === 'parse' ? headerInput : generatedHeader)}
          >
            复制
          </Button>
        }
      >
        {mode === 'build' ? (
          generatedHeader ? (
            <Alert
              type="success"
              showIcon
              message={
                <span className={styles.mono} style={{ wordBreak: 'break-all' }}>
                  Forwarded: {generatedHeader}
                </span>
              }
            />
          ) : (
            <Empty description="至少填写一个参数后生成" />
          )
        ) : (
          <p className={styles.hint}>
            解析模式下复制的是原始输入；点击「载入构造器」可在解析结果基础上编辑后再生成。
          </p>
        )}
      </Card>

      <Alert
        type="info"
        showIcon
        message="RFC 7239 速记"
        description={
          <div className={styles.hint}>
            <p>
              Forwarded 头按代理经过顺序排列，每跳用逗号分隔、参数用分号分隔；标准参数仅
              for / by / host / proto，参数名大小写不敏感，生成时统一输出小写。
            </p>
            <p>
              含端口的 IPv6 节点必须用方括号与引号包裹（如
              <span className={styles.mono}>{'"[2001:db8::17]:4711"'}</span>
              ）；无法识别的节点用 <span className={styles.mono}>unknown</span>，隐藏身份可用
              <span className={styles.mono}>{' _obfuscated'}</span> 形式。与传统
              X-Forwarded-For 不同，Forwarded 是标准化头，且每跳可同时携带协议与 Host 信息。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default ForwardedHeaderCodec;
