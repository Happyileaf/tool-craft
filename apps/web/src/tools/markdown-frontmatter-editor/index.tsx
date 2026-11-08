'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  parseFrontmatter,
  writeFrontmatter,
  valueToInput,
  inputToValue,
  type FieldType,
  type FieldInput,
} from './utils/frontmatter';
import { DEFAULT_MARKDOWN, FIELD_TYPE_OPTIONS, FORMAT_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface UiField {
  key: string;
  keyName: string;
  type: FieldType;
  /** 表单中的字符串表示；boolean 用 'true'/'false' */
  input: string;
}

let seq = 0;
const nextKey = () => `f-${Date.now()}-${seq++}`;

const MarkdownFrontmatterEditor: React.FC<ToolComponentProps> = ({
  defaultInput,
}) => {
  const [markdown, setMarkdown] = React.useState(defaultInput || DEFAULT_MARKDOWN);
  const [outputFormat, setOutputFormat] = React.useState<'yaml' | 'toml'>('yaml');
  /** 字段编辑态是否与解析结果同步；用户手动改字段后置脏 */
  const [dirtyFields, setDirtyFields] = React.useState<UiField[] | null>(null);

  const parsed = React.useMemo(() => parseFrontmatter(markdown), [markdown]);

  const fields: UiField[] = React.useMemo(() => {
    if (dirtyFields) return dirtyFields;
    return parsed.fields.map((f) => ({
      key: nextKey(),
      keyName: f.key,
      type: f.type,
      input: valueToInput(f.value),
    }));
  }, [dirtyFields, parsed.fields]);

  const toFieldInputs = React.useCallback((list: UiField[]): FieldInput[] => {
    const seen = new Set<string>();
    const out: FieldInput[] = [];
    for (const f of list) {
      const name = f.keyName.trim();
      if (name === '' || seen.has(name)) continue;
      seen.add(name);
      out.push({ key: name, value: inputToValue(f.input, f.type) });
    }
    return out;
  }, []);

  const output = React.useMemo(() => {
    if (parsed.format === null && fields.length === 0) {
      return { text: markdown, note: '当前文档没有 frontmatter 块' };
    }
    const text = writeFrontmatter(markdown, toFieldInputs(fields), outputFormat);
    return { text, note: '' };
  }, [markdown, fields, outputFormat, parsed.format, toFieldInputs]);

  const updateField = (key: string, patch: Partial<Omit<UiField, 'key'>>) => {
    setDirtyFields((prev) => {
      const base = prev ?? fields;
      return base.map((f) => (f.key === key ? { ...f, ...patch } : f));
    });
  };

  const addField = () => {
    setDirtyFields((prev) => [
      ...(prev ?? fields),
      { key: nextKey(), keyName: 'newKey', type: 'string', input: '' },
    ]);
  };

  const removeField = (key: string) => {
    setDirtyFields((prev) => (prev ?? fields).filter((f) => f.key !== key));
  };

  const resync = () => {
    setDirtyFields(null);
    message.success('已按原文重新解析');
  };

  const copyOutput = async () => {
    await copyToClipboard(output.text);
    message.success('已复制完整 Markdown');
  };

  return (
    <div className={styles.container}>
      {parsed.errors.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message="frontmatter 存在无法解析的行（已跳过，不影响正文）"
          description={parsed.errors.map((e, i) => (
            <div key={i} className={styles.errorLine}>
              第 {e.line + 1} 行：{e.message}
            </div>
          ))}
        />
      )}

      <div className={styles.panels}>
        <Card
          className={styles.card}
          title="原始 Markdown（正文始终原样保留）"
          extra={
            <Space>
              <Button size="small" icon={<ReloadOutlined />} onClick={resync}>
                重新解析
              </Button>
            </Space>
          }
        >
          <Input.TextArea
            className={styles.editor}
            value={markdown}
            onChange={(e) => {
              setMarkdown(e.target.value);
              setDirtyFields(null);
            }}
            autoSize={{ minRows: 16, maxRows: 28 }}
            spellCheck={false}
          />
          <div style={{ marginTop: 8 }}>
            <Tag color={parsed.format === 'yaml' ? 'blue' : parsed.format === 'toml' ? 'orange' : 'default'}>
              {parsed.format === null
                ? '无 frontmatter'
                : parsed.format === 'yaml'
                  ? 'YAML 块'
                  : 'TOML 块'}
            </Tag>
            <span className={styles.fieldRowHead}>
              识别到 {parsed.fields.length} 个字段
            </span>
          </div>
        </Card>

        <Card
          className={styles.card}
          title="字段编辑（浅层键值，支持点路径嵌套键与数组）"
          extra={
            <Button size="small" type="primary" ghost icon={<PlusOutlined />} onClick={addField}>
              添加字段
            </Button>
          }
        >
          <div className={styles.fieldRow + ' ' + styles.fieldRowHead}>
            <span>键名</span>
            <span>类型</span>
            <span>值</span>
            <span />
          </div>
          {fields.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="尚无字段，可手动添加或在左侧粘贴含 frontmatter 的 Markdown"
              style={{ margin: '24px 0' }}
            />
          ) : (
            fields.map((f) => (
              <div className={styles.fieldRow} key={f.key}>
                <Input
                  className={styles.keyInput}
                  size="small"
                  value={f.keyName}
                  placeholder="key 或 section.key"
                  onChange={(e) => updateField(f.key, { keyName: e.target.value })}
                />
                <Select
                  size="small"
                  value={f.type}
                  options={FIELD_TYPE_OPTIONS}
                  onChange={(type: FieldType) =>
                    updateField(f.key, {
                      type,
                      input:
                        type === 'boolean'
                          ? 'false'
                          : type === 'null'
                            ? ''
                            : f.input,
                    })
                  }
                />
                {f.type === 'boolean' ? (
                  <Switch
                    checked={f.input === 'true'}
                    checkedChildren="true"
                    unCheckedChildren="false"
                    onChange={(checked) =>
                      updateField(f.key, { input: checked ? 'true' : 'false' })
                    }
                  />
                ) : f.type === 'null' ? (
                  <Input size="small" disabled value="null" />
                ) : (
                  <Input
                    size="small"
                    value={f.input}
                    placeholder={f.type === 'array' ? 'a, b, c' : '值'}
                    onChange={(e) => updateField(f.key, { input: e.target.value })}
                  />
                )}
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeField(f.key)}
                />
              </div>
            ))
          )}
        </Card>
      </div>

      <Card
        className={styles.card}
        title="回写结果"
        extra={
          <Space wrap>
            <Select
              size="small"
              style={{ width: 180 }}
              value={outputFormat}
              options={FORMAT_OPTIONS}
              onChange={(v: 'yaml' | 'toml') => setOutputFormat(v)}
            />
            <Button size="small" icon={<CopyOutlined />} onClick={copyOutput}>
              复制完整 Markdown
            </Button>
          </Space>
        }
      >
        {output.note && (
          <Alert type="info" showIcon message={output.note} style={{ marginBottom: 12 }} />
        )}
        <div className={styles.output}>{output.text}</div>
        {parsed.format !== null && (
          <>
            <div className={styles.fieldRowHead} style={{ margin: '12px 0 6px' }}>
              正文预览（不参与编辑，回写时原样拼接）
            </div>
            <div className={styles.bodyPreview}>{parsed.body || '（空）'}</div>
          </>
        )}
      </Card>

      <Card className={styles.card} title="字段结构核对">
        <Table
          size="small"
          pagination={false}
          rowKey="keyName"
          dataSource={fields}
          columns={[
            { title: '键', dataIndex: 'keyName' },
            { title: '类型', dataIndex: 'type', width: 100 },
            {
              title: '回写值预览',
              dataIndex: 'input',
              render: (v: string, row) =>
                row.type === 'array' ? `[${v}]` : row.type === 'null' ? 'null' : v,
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default MarkdownFrontmatterEditor;
