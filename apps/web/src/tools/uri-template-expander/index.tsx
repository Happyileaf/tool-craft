'use client';

import React from 'react';
import { Alert, Button, Card, Empty, Input, Space, Table, Tag, message } from 'antd';
import { CopyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import { OPERATOR_REFERENCE } from './constants';
import {
  SAMPLE_TEMPLATE,
  SAMPLE_VARIABLES,
  expandUriTemplate,
  extractTemplateVariables,
  type TemplateVariables,
} from './utils/uri-template';
import styles from './index.module.css';

/**
 * RFC 6570 URI Template 展开器：
 * 输入模板与 JSON 变量集，按 Level 1–4 规则实时展开，并校验模板与变量 JSON。
 */
const UriTemplateExpander: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [template, setTemplate] = React.useState<string>(defaultInput ?? SAMPLE_TEMPLATE);
  const [variablesText, setVariablesText] = React.useState<string>(
    JSON.stringify(SAMPLE_VARIABLES, null, 2),
  );

  const parsedVariables = React.useMemo<{
    data?: TemplateVariables;
    error?: string;
  }>(() => {
    if (variablesText.trim() === '') {
      return { data: {} };
    }
    try {
      const parsed = JSON.parse(variablesText) as unknown;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { error: '变量必须是 JSON 对象（键值映射）' };
      }
      return { data: parsed as TemplateVariables };
    } catch (error) {
      return { error: `变量 JSON 解析失败：${(error as Error).message}` };
    }
  }, [variablesText]);

  const referencedNames = React.useMemo(
    () => extractTemplateVariables(template),
    [template],
  );

  const expansion = React.useMemo(() => {
    if (parsedVariables.error || parsedVariables.data === undefined) {
      return { uri: '', valid: false, errors: parsedVariables.error ? [parsedVariables.error] : [] };
    }
    return expandUriTemplate(template, parsedVariables.data);
  }, [template, parsedVariables]);

  const missingNames = React.useMemo(() => {
    if (!parsedVariables.data) {
      return [];
    }
    return referencedNames.filter((name) => parsedVariables.data?.[name] === undefined);
  }, [referencedNames, parsedVariables.data]);

  const handleCopy = async () => {
    if (!expansion.uri) {
      message.warning('暂无可复制的展开结果');
      return;
    }
    await copyToClipboard(expansion.uri);
    message.success('已复制展开后的 URI');
  };

  const referenceColumns = [
    { title: '表达式', dataIndex: 'operator', key: 'operator' },
    { title: '级别', dataIndex: 'level', key: 'level', width: 70 },
    { title: '含义', dataIndex: 'meaning', key: 'meaning' },
  ];

  return (
    <div className={styles.container}>
      <Card
        title="URI 模板"
        extra={
          <Button size="small" onClick={() => setTemplate(SAMPLE_TEMPLATE)}>
            示例模板
          </Button>
        }
      >
        <Input.TextArea
          className={styles.mono}
          value={template}
          onChange={(event) => setTemplate(event.target.value)}
          autoSize={{ minRows: 2, maxRows: 6 }}
          placeholder="例如 https://api.example.com/{version}/users/{userId}{?fields*}"
        />
        <Space size={[4, 8]} wrap style={{ marginTop: 12 }}>
          {referencedNames.length > 0 ? (
            referencedNames.map((name) => {
              const missing = missingNames.includes(name);
              return (
                <Tag
                  key={name}
                  className={styles.variableTag}
                  color={missing ? 'red' : 'blue'}
                >
                  {name}
                  {missing ? '（未提供）' : ''}
                </Tag>
              );
            })
          ) : (
            <span className={styles.hint}>模板中未检测到 {'{var}'} 表达式</span>
          )}
        </Space>
      </Card>

      <Card
        title="变量集（JSON 对象）"
        extra={
          <Button
            size="small"
            onClick={() => setVariablesText(JSON.stringify(SAMPLE_VARIABLES, null, 2))}
          >
            示例变量
          </Button>
        }
      >
        <Input.TextArea
          className={styles.mono}
          value={variablesText}
          onChange={(event) => setVariablesText(event.target.value)}
          autoSize={{ minRows: 6, maxRows: 16 }}
          spellCheck={false}
          placeholder='{"userId": "u-123", "fields": ["profile", "email"]}'
        />
        {parsedVariables.error && (
          <Alert
            style={{ marginTop: 12 }}
            type="error"
            showIcon
            message={parsedVariables.error}
          />
        )}
        <p className={styles.hint} style={{ marginTop: 12, marginBottom: 0 }}>
          值支持字符串、数字、布尔、null、数组与嵌套对象；数组/对象配合 <code>{'{var*}'}</code>
          做 explode 展开，未提供的变量按 RFC 6570 静默省略。
        </p>
      </Card>

      <Card
        title={
          <Space>
            <ThunderboltOutlined />
            展开结果
          </Space>
        }
        extra={
          <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
            复制 URI
          </Button>
        }
      >
        {expansion.valid && expansion.uri ? (
          <Alert type="success" showIcon message={<span className={styles.result}>{expansion.uri}</span>} />
        ) : expansion.errors.length > 0 ? (
          <Alert
            type="error"
            showIcon
            message="模板或变量存在错误"
            description={
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {expansion.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            }
          />
        ) : (
          <Empty description="输入模板后查看展开结果" />
        )}
        {missingNames.length > 0 && (
          <Alert
            style={{ marginTop: 12 }}
            type="warning"
            showIcon
            message={`以下变量未在变量集中提供，对应表达式将被省略：${missingNames.join(', ')}`}
          />
        )}
      </Card>

      <Card title="RFC 6570 操作符速查">
        <Table
          rowKey="operator"
          columns={referenceColumns}
          dataSource={OPERATOR_REFERENCE as unknown as Record<string, string>[]}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default UriTemplateExpander;
