'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, InputNumber, Space, Table, Tabs, Tag, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { EXAMPLE_PROBLEM, PARSE_PLACEHOLDER } from './constants';
import { generateProblem, parseProblem } from './utils/problemDetails';
import styles from './index.module.css';

const { TextArea } = Input;

/** 扩展成员行 */
interface ExtensionRow {
  key: string;
  value: string;
}

/**
 * RFC 7807 Problem Details 生成与解析器：
 * 生成页产出 application/problem+json 正文（标准五成员 + 自定义扩展），
 * 解析页拆分标准字段与扩展成员并给出合规告警。全部本地运行。
 *
 * @returns 生成 / 解析双标签页界面
 */
const ProblemDetailsGenerator: React.FC<ToolComponentProps> = () => {
  const [type, setType] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [status, setStatus] = React.useState<number | null>(EXAMPLE_PROBLEM.status);
  const [detail, setDetail] = React.useState('');
  const [instance, setInstance] = React.useState('');
  const [extensions, setExtensions] = React.useState<ExtensionRow[]>([]);

  const [parseInput, setParseInput] = React.useState('');

  const generated = React.useMemo(() => {
    try {
      return generateProblem({
        type,
        title,
        status,
        detail,
        instance,
        extensions: extensions.filter((row) => row.key.trim() !== '' || row.value.trim() !== ''),
      });
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [type, title, status, detail, instance, extensions]);

  const parsed = React.useMemo(() => {
    if (parseInput.trim() === '') {
      return null;
    }
    try {
      return parseProblem(parseInput);
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [parseInput]);

  const updateExtension = (index: number, patch: Partial<ExtensionRow>) => {
    setExtensions((previous) => previous.map((row, current) => (current === index ? { ...row, ...patch } : row)));
  };

  const copy = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => message.success('已复制到剪贴板'))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  const fillExample = () => {
    setType(EXAMPLE_PROBLEM.type);
    setTitle(EXAMPLE_PROBLEM.title);
    setStatus(EXAMPLE_PROBLEM.status);
    setDetail(EXAMPLE_PROBLEM.detail);
    setInstance(EXAMPLE_PROBLEM.instance);
    setExtensions([
      { key: 'balance', value: '30' },
      { key: 'accounts', value: '["/account/1234", "/account/67890"]' },
    ]);
  };

  const generatorTab = (
    <div>
      <p className={styles.hint}>
        填写 RFC 7807 标准成员（type 留空默认 about:blank；title 留空且有 status 时自动取 HTTP 短语），
        扩展成员的值按 JSON 解析，解析失败则保留为字符串。
      </p>
      <div className={styles.stack}>
        <div>
          <div className={styles.fieldLabel}>type（问题类型 URI 引用，可留空）</div>
          <Input value={type} onChange={(event) => setType(event.target.value)} placeholder="about:blank" />
        </div>
        <Space wrap size={16}>
          <div>
            <div className={styles.fieldLabel}>status（HTTP 状态码）</div>
            <InputNumber
              min={100}
              max={599}
              precision={0}
              value={status}
              onChange={(value) => setStatus(value)}
              style={{ width: 180 }}
              placeholder="如 403"
            />
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className={styles.fieldLabel}>title（人类可读摘要，可留空）</div>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="You do not have enough credit." />
          </div>
        </Space>
        <div>
          <div className={styles.fieldLabel}>detail（本次错误的具体解释）</div>
          <TextArea rows={2} value={detail} onChange={(event) => setDetail(event.target.value)} />
        </div>
        <div>
          <div className={styles.fieldLabel}>instance（出错资源的 URI 引用，可留空）</div>
          <Input value={instance} onChange={(event) => setInstance(event.target.value)} placeholder="/account/1234/msgs/abc" />
        </div>
        <div>
          <div className={styles.fieldLabel}>扩展成员（键名不可与标准字段冲突，值按 JSON 解析）</div>
          <div className={styles.stack}>
            {extensions.map((row, index) => (
              <div className={styles.extRow} key={index}>
                <Input
                  value={row.key}
                  onChange={(event) => updateExtension(index, { key: event.target.value })}
                  placeholder="键名，如 balance"
                />
                <Input
                  value={row.value}
                  onChange={(event) => updateExtension(index, { value: event.target.value })}
                  placeholder='值，如 30 或 ["a","b"]'
                />
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => setExtensions((previous) => previous.filter((_, current) => current !== index))}
                />
              </div>
            ))}
            <Button
              block
              icon={<PlusOutlined />}
              onClick={() => setExtensions((previous) => [...previous, { key: '', value: '' }])}
            >
              添加扩展成员
            </Button>
          </div>
        </div>
      </div>

      <Space wrap style={{ marginTop: 16 }}>
        <Button size="small" onClick={fillExample}>
          填入 RFC 附录示例
        </Button>
        <Button size="small" onClick={() => setExtensions([])}>
          清空扩展
        </Button>
      </Space>

      {'error' in generated && generated.error ? (
        <Alert style={{ marginTop: 16 }} type="error" showIcon message="输入不合法" description={generated.error} />
      ) : null}

      {'prettyJson' in generated && generated.prettyJson ? (
        <Card
          size="small"
          style={{ marginTop: 16 }}
          title={
            <Space>
              <Tag color="geekblue">Content-Type: application/problem+json</Tag>
            </Space>
          }
          extra={<Button size="small" onClick={() => copy(generated.prettyJson)}>复制 JSON</Button>}
        >
          <pre className={styles.jsonOutput}>{generated.prettyJson}</pre>
        </Card>
      ) : null}
    </div>
  );

  const parserTab = (
    <div>
      <p className={styles.hint}>
        粘贴 application/problem+json 正文，工具拆分标准五成员与扩展成员，并对缺字段、about:blank 标题不一致等问题给出告警。
      </p>
      <TextArea
        rows={10}
        value={parseInput}
        onChange={(event) => setParseInput(event.target.value)}
        placeholder={PARSE_PLACEHOLDER}
      />
      <Space style={{ marginTop: 12 }}>
        <Button size="small" onClick={() => setParseInput(PARSE_PLACEHOLDER)}>
          填入示例
        </Button>
        <Button size="small" onClick={() => setParseInput('')}>
          清空
        </Button>
      </Space>

      {parsed && 'error' in parsed ? (
        <Alert style={{ marginTop: 16 }} type="error" showIcon message="解析失败" description={parsed.error} />
      ) : null}

      {parsed && !('error' in parsed) ? (
        <div style={{ marginTop: 16 }} className={styles.stack}>
          {parsed.warnings.length > 0 ? (
            <Alert
              type="warning"
              showIcon
              message={`${parsed.warnings.length} 条合规告警`}
              description={
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {parsed.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              }
            />
          ) : (
            <Alert type="success" showIcon message="符合 RFC 7807 字段规范" />
          )}
          <Table
            size="small"
            pagination={false}
            rowKey="field"
            dataSource={Object.entries(parsed.standard)
              .filter(([, value]) => value !== undefined)
              .map(([field, value]) => ({ field, value: String(value) }))}
            columns={[
              { title: '标准字段', dataIndex: 'field', key: 'field', width: 140 },
              { title: '值', dataIndex: 'value', key: 'value' },
            ]}
          />
          {parsed.extensions.length > 0 ? (
            <Table
              size="small"
              pagination={false}
              rowKey="key"
              dataSource={parsed.extensions.map((item) => ({
                key: item.key,
                value: typeof item.value === 'string' ? item.value : JSON.stringify(item.value),
              }))}
              columns={[
                { title: '扩展成员', dataIndex: 'key', key: 'key', width: 180 },
                { title: '值', dataIndex: 'value', key: 'value' },
              ]}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={styles.container}>
      <Card title="RFC 7807 Problem Details 错误响应生成与解析器（application/problem+json）">
        <Tabs
          items={[
            { key: 'generate', label: '生成错误对象', children: generatorTab },
            { key: 'parse', label: '解析校验', children: parserTab },
          ]}
        />
      </Card>
    </div>
  );
};

export default ProblemDetailsGenerator;
