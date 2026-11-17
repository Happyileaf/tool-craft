'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import { CopyOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  createDefaultInput,
  generateCaaRecords,
  validateCaaRecords,
  type CaaFormEntry,
  type CaaGenerateInput,
} from './utils/caa';
import { DEFAULT_VALIDATE_TEXT, TAG_OPTIONS, VALIDATION_METHOD_OPTIONS } from './constants';
import styles from './index.module.css';

/** 记录生成面板：表单 → 实时生成 CAA 区域文件行 */
const GeneratorPanel: React.FC = () => {
  const [domain, setDomain] = React.useState(createDefaultInput().domain);
  const [ttl, setTtl] = React.useState<number | null>(createDefaultInput().ttl);
  const [entries, setEntries] = React.useState<CaaFormEntry[]>(createDefaultInput().entries);

  const input = React.useMemo<CaaGenerateInput>(() => ({ domain, ttl, entries }), [domain, ttl, entries]);
  const result = React.useMemo(() => generateCaaRecords(input), [input]);

  const updateEntry = (index: number, patch: Partial<CaaFormEntry>) => {
    setEntries((previous) => previous.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };

  const addEntry = () => {
    setEntries((previous) => [
      ...previous,
      {
        critical: false,
        tag: 'issue',
        caDomain: '',
        accountUri: '',
        validationMethods: '',
        iodefUrl: '',
        disable: false,
      },
    ]);
  };

  const removeEntry = (index: number) => {
    setEntries((previous) => previous.filter((_, i) => i !== index));
  };

  const handleCopy = async (value: string) => {
    await copyToClipboard(value);
    message.success('复制成功');
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space size="large" wrap style={{ display: 'flex' }}>
        <Form.Item label="域名（domain）" style={{ minWidth: 280, marginBottom: 0 }}>
          <Input
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            placeholder="example.com"
            spellCheck={false}
            className={styles.mono}
          />
        </Form.Item>
        <Form.Item label="TTL（秒，留空不输出）" style={{ minWidth: 200, marginBottom: 0 }}>
          <InputNumber
            value={ttl}
            onChange={(value) => setTtl(value ?? null)}
            min={1}
            max={2147483647}
            precision={0}
            placeholder="3600"
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Space>

      {entries.map((entry, index) => (
        <Card
          key={index}
          size="small"
          title={`记录 ${index + 1}`}
          extra={
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeEntry(index)}>
              删除
            </Button>
          }
          className={styles.entryCard}
        >
          <Space size="large" wrap style={{ display: 'flex' }}>
            <Form.Item label="标签 tag" style={{ minWidth: 300, marginBottom: 8 }}>
              <Select
                value={entry.tag}
                onChange={(value) => updateEntry(index, { tag: value })}
                options={TAG_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
              />
            </Form.Item>
            <Form.Item label="critical 标志（flag 128）" style={{ marginBottom: 8 }}>
              <Checkbox
                checked={entry.critical}
                onChange={(event) => updateEntry(index, { critical: event.target.checked })}
              >
                不识别该标签的 CA 必须拒签
              </Checkbox>
            </Form.Item>
          </Space>

          {entry.tag === 'iodef' ? (
            <Form.Item label="iodef 上报地址（mailto: 或 http(s) URL）" style={{ marginBottom: 0 }}>
              <Input
                value={entry.iodefUrl}
                onChange={(event) => updateEntry(index, { iodefUrl: event.target.value })}
                placeholder="mailto:security@example.com"
                spellCheck={false}
                className={styles.mono}
              />
            </Form.Item>
          ) : (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space size="large" wrap style={{ display: 'flex' }}>
                <Form.Item label="CA 域名" style={{ minWidth: 260, marginBottom: 0 }}>
                  <Input
                    value={entry.caDomain}
                    onChange={(event) => updateEntry(index, { caDomain: event.target.value })}
                    placeholder="letsencrypt.org"
                    spellCheck={false}
                    className={styles.mono}
                    disabled={entry.disable}
                  />
                </Form.Item>
                <Form.Item label="禁用该类签发（空 value）" style={{ marginBottom: 0 }}>
                  <Checkbox
                    checked={entry.disable}
                    onChange={(event) => updateEntry(index, { disable: event.target.checked })}
                  >
                    输出 {entry.tag} ";"
                  </Checkbox>
                </Form.Item>
              </Space>
              <Form.Item label="RFC 8658 accounturi（可选，http(s) URL）" style={{ marginBottom: 0 }}>
                <Input
                  value={entry.accountUri}
                  onChange={(event) => updateEntry(index, { accountUri: event.target.value })}
                  placeholder="https://acme.example.org/acct/1"
                  spellCheck={false}
                  className={styles.mono}
                />
              </Form.Item>
              <Form.Item label="RFC 8658 validationmethods（可选，分号分隔）" style={{ marginBottom: 0 }}>
                <Select
                  mode="multiple"
                  value={entry.validationMethods ? entry.validationMethods.split(';').filter(Boolean) : []}
                  onChange={(values) => updateEntry(index, { validationMethods: values.join(';') })}
                  options={VALIDATION_METHOD_OPTIONS.map((option) => ({
                    label: option.label,
                    value: option.value,
                  }))}
                  placeholder="选择 ACME 校验方法"
                />
              </Form.Item>
            </Space>
          )}
        </Card>
      ))}

      <Button type="dashed" icon={<PlusOutlined />} onClick={addEntry} block>
        添加一条 CAA 记录
      </Button>

      {result.errors.map((error) => (
        <Alert key={error} type="error" showIcon message={error} />
      ))}
      {result.warnings.map((warning) => (
        <Alert key={warning} type="warning" showIcon message={warning} />
      ))}

      {result.zoneText && (
        <Card type="inner" title="生成的 CAA 区域文件记录">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Input.TextArea
              readOnly
              value={result.zoneText}
              autoSize={{ minRows: 2, maxRows: 10 }}
              className={styles.recordValue}
            />
            <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(result.zoneText)}>
              复制全部记录
            </Button>
          </Space>
        </Card>
      )}
    </Space>
  );
};

/** 记录校验面板：粘贴区域文件片段做结构 / 标签 / 参数校验 */
const ValidatorPanel: React.FC = () => {
  const [raw, setRaw] = React.useState(DEFAULT_VALIDATE_TEXT);
  const validation = React.useMemo(() => validateCaaRecords(raw), [raw]);

  const columns = [
    { title: '行号', dataIndex: 'line', width: 70 },
    { title: 'flags', dataIndex: 'flags', width: 80 },
    { title: 'tag', dataIndex: 'tag', width: 110 },
    {
      title: 'value',
      dataIndex: 'value',
      render: (value: string) => <span className={styles.mono}>{value}</span>,
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Input.TextArea
        value={raw}
        onChange={(event) => setRaw(event.target.value)}
        autoSize={{ minRows: 4, maxRows: 12 }}
        spellCheck={false}
        className={styles.mono}
        placeholder='粘贴 CAA 记录，如 example.com. CAA 0 issue "letsencrypt.org"'
      />
      {validation.errors.map((error) => (
        <Alert key={error} type="error" showIcon message={error} />
      ))}
      {validation.warnings.map((warning) => (
        <Alert key={warning} type="warning" showIcon message={warning} />
      ))}
      {validation.errors.length === 0 && (
        <Alert type="success" showIcon message={`结构校验通过，共解析 ${validation.records.length} 条记录`} />
      )}
      {validation.records.length > 0 && (
        <Table
          size="small"
          rowKey={(record) => `${record.line}-${record.tag}`}
          columns={columns}
          dataSource={validation.records}
          pagination={false}
        />
      )}
    </Space>
  );
};

/**
 * DNS CAA 记录生成与校验器：依据 RFC 8659 / RFC 8658 在浏览器本地拼装并核对
 * issue / issuewild / iodef 资源记录，含 critical 标志与 accounturi /
 * validationmethods 参数。
 *
 * @param _props - 工具组件属性（本工具使用内置样例）
 * @returns 工具交互界面
 */
const CaaRecordGenerator: React.FC<ToolComponentProps> = (_props) => (
  <div className={styles.container}>
    <Card className={styles.card}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Tag color="blue">纯浏览器本地计算，域名与记录不会上传，依据 RFC 8659 / RFC 8658</Tag>
        <Tabs
          items={[
            { key: 'generator', label: '记录生成器', children: <GeneratorPanel /> },
            { key: 'validator', label: '记录校验器', children: <ValidatorPanel /> },
          ]}
        />
      </Space>
    </Card>
  </div>
);

export default CaaRecordGenerator;
