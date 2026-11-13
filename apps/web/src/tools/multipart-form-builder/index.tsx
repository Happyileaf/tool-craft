'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ClearOutlined,
  CopyOutlined,
  DeleteOutlined,
  ImportOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  buildCurlExample,
  buildMultipart,
  generateBoundary,
  parseMultipart,
  type BuildResult,
  type FormField,
  type FormFieldKind,
  type ParsedPart,
} from './utils/multipart';
import { DEFAULT_FIELDS, DEFAULT_URL, MAX_FIELDS } from './constants';
import styles from './index.module.css';

/** 构造结果或失败原因的联合包装，保证 UI 不抛异常 */
interface BuildState {
  /** 构造是否成功 */
  ok: boolean;
  /** 成功时的构造结果 */
  result: BuildResult | null;
  /** 失败时的错误信息 */
  errors: string[];
}

/** 反向解析结果表格列定义 */
const PART_COLUMNS: ColumnsType<ParsedPart> = [
  { title: '#', width: 56, render: (_, __, index) => index + 1 },
  {
    title: 'name',
    dataIndex: 'name',
    width: 160,
    render: (name: string) => <code className={styles.mono}>{name}</code>,
  },
  {
    title: 'filename',
    dataIndex: 'filename',
    width: 180,
    render: (filename?: string) =>
      filename === undefined ? <Tag>普通字段</Tag> : <code>{filename}</code>,
  },
  {
    title: 'Content-Type',
    dataIndex: 'contentType',
    width: 180,
    render: (contentType?: string) =>
      contentType === undefined ? '—' : <Tag color="blue">{contentType}</Tag>,
  },
  {
    title: 'value',
    dataIndex: 'value',
    render: (value: string) => <pre className={styles.cellPre}>{value}</pre>,
  },
];

/**
 * 创建一个空白字段
 *
 * @param id - 字段唯一标识
 * @param kind - 字段类型
 * @returns 空白字段对象
 */
function createEmptyField(id: string, kind: FormFieldKind = 'text'): FormField {
  if (kind === 'file') {
    return { id, kind, name: '', value: '', filename: '', contentType: '' };
  }
  return { id, kind, name: '', value: '' };
}

/**
 * multipart/form-data 请求体构造器。
 *
 * 依据 RFC 7578 / RFC 2046 手工拼装 multipart 报文（不使用 FormData/File API），
 * 提供字段行编辑器、boundary 管理、Content-Type / 请求体 / curl 示例输出，
 * 以及原始报文的反向解析；全部运算在浏览器本地完成，不发起任何网络请求。
 *
 * @returns multipart 构造与解析交互界面
 */
const MultipartFormBuilder: React.FC<ToolComponentProps> = () => {
  const [fields, setFields] = React.useState<FormField[]>(DEFAULT_FIELDS);
  const [boundaryInput, setBoundaryInput] = React.useState<string>('');
  const [url, setUrl] = React.useState<string>(DEFAULT_URL);
  const [idSeed, setIdSeed] = React.useState<number>(DEFAULT_FIELDS.length + 1);
  const [parseContentType, setParseContentType] = React.useState<string>('');
  const [parseBody, setParseBody] = React.useState<string>('');

  const buildState = React.useMemo<BuildState>(() => {
    try {
      const result = buildMultipart(
        fields,
        boundaryInput.trim() === '' ? undefined : boundaryInput,
      );
      return { ok: true, result, errors: [] };
    } catch (error) {
      return {
        ok: false,
        result: null,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }, [fields, boundaryInput]);

  const parseResult = React.useMemo(
    () =>
      parseMultipart(
        parseBody,
        parseContentType.trim() === '' ? undefined : parseContentType,
      ),
    [parseBody, parseContentType],
  );

  /**
   * 更新指定字段的某个属性，kind 切换为 file 时补齐文件专属输入
   *
   * @param id - 字段标识
   * @param patch - 需要合并的属性
   */
  const updateField = (id: string, patch: Partial<FormField>): void => {
    setFields((previous) =>
      previous.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    );
  };

  /** 追加一个空白文本字段 */
  const addField = (): void => {
    setFields((previous) => {
      if (previous.length >= MAX_FIELDS) {
        message.warning(`字段数量不能超过 ${MAX_FIELDS} 个`);
        return previous;
      }
      return [...previous, createEmptyField(`field-${idSeed}`)];
    });
    setIdSeed((previous) => previous + 1);
  };

  /**
   * 删除指定字段
   *
   * @param id - 字段标识
   */
  const removeField = (id: string): void => {
    setFields((previous) => previous.filter((field) => field.id !== id));
  };

  /** 恢复默认示例字段 */
  const resetFields = (): void => {
    setFields(DEFAULT_FIELDS.map((field) => ({ ...field })));
    setBoundaryInput('');
  };

  /** 清空为单个空白字段 */
  const clearFields = (): void => {
    setFields([createEmptyField('field-1')]);
    setIdSeed(2);
  };

  /** 重新生成随机 boundary（清空输入框即恢复自动生成，这里显式填入新随机值） */
  const regenerateBoundary = (): void => {
    setBoundaryInput(generateBoundary());
    message.success('已重新生成 boundary');
  };

  /**
   * 复制文本并给出提示
   *
   * @param text - 待复制内容
   * @param label - 成功提示名称
   */
  const handleCopy = async (text: string, label: string): Promise<void> => {
    if (text === '') {
      message.warning('暂无可复制的内容');
      return;
    }
    await copyToClipboard(text);
    message.success(`${label}已复制`);
  };

  /** 将当前构造结果载入反向解析页签进行自测 */
  const loadBuiltResult = (): void => {
    if (!buildState.ok || buildState.result === null) {
      message.warning('当前构造结果存在校验错误，无法载入');
      return;
    }
    setParseContentType(buildState.result.contentType);
    setParseBody(buildState.result.body);
    message.success('已载入当前构造结果，可切换到解析结果区域查看');
  };

  const buildTab = (
    <div className={styles.container}>
      <Space wrap>
        <Button type="primary" icon={<PlusOutlined />} onClick={addField}>
          添加字段
        </Button>
        <Button icon={<ReloadOutlined />} onClick={resetFields}>
          示例填充
        </Button>
        <Button icon={<ClearOutlined />} onClick={clearFields}>
          清空
        </Button>
      </Space>

      {fields.map((field, index) => (
        <Card
          key={field.id}
          size="small"
          className={styles.fieldCard}
          title={
            <div className={styles.fieldHeader}>
              <span>字段 {index + 1}</span>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={fields.length === 1}
                onClick={() => removeField(field.id)}
              >
                删除
              </Button>
            </div>
          }
        >
          <div className={styles.row}>
            <div className={styles.rowField}>
              <span className={styles.label}>字段类型</span>
              <Select<FormFieldKind>
                value={field.kind}
                onChange={(kind) =>
                  updateField(
                    field.id,
                    kind === 'file'
                      ? {
                          kind,
                          filename: field.filename ?? '',
                          contentType: field.contentType ?? '',
                        }
                      : { kind },
                  )
                }
                options={[
                  { label: '文本字段 (text)', value: 'text' },
                  { label: '文件字段 (file)', value: 'file' },
                ]}
              />
            </div>
            <div className={styles.rowField}>
              <span className={styles.label}>name（不能为空，禁止 CR/LF）</span>
              <Input
                value={field.name}
                onChange={(event) => updateField(field.id, { name: event.target.value })}
                placeholder="如 title"
              />
            </div>
          </div>

          {field.kind === 'file' ? (
            <div className={styles.row}>
              <div className={styles.rowField}>
                <span className={styles.label}>filename</span>
                <Input
                  value={field.filename ?? ''}
                  onChange={(event) =>
                    updateField(field.id, { filename: event.target.value })
                  }
                  placeholder="如 report.txt"
                />
              </div>
              <div className={styles.rowField}>
                <span className={styles.label}>Content-Type（可留空）</span>
                <Input
                  value={field.contentType ?? ''}
                  onChange={(event) =>
                    updateField(field.id, { contentType: event.target.value })
                  }
                  placeholder="如 text/plain"
                />
              </div>
            </div>
          ) : null}

          <div className={styles.field}>
            <span className={styles.label}>
              {field.kind === 'file' ? '文件文本内容' : '字段值'}
            </span>
            <Input.TextArea
              value={field.value}
              onChange={(event) => updateField(field.id, { value: event.target.value })}
              spellCheck={false}
              className={styles.editor}
              autoSize={{ minRows: 2, maxRows: 8 }}
              placeholder="段体原始文本，换行按字面字符保留"
            />
          </div>
        </Card>
      ))}

      <Card size="small" title="请求设置">
        <div className={styles.row}>
          <div className={styles.rowField}>
            <span className={styles.label}>boundary（留空则自动生成）</span>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={boundaryInput}
                onChange={(event) => setBoundaryInput(event.target.value)}
                placeholder={buildState.result?.boundary ?? '自动生成'}
                className={styles.mono}
              />
              <Button icon={<ReloadOutlined />} onClick={regenerateBoundary}>
                重新生成
              </Button>
            </Space.Compact>
          </div>
          <div className={styles.rowField}>
            <span className={styles.label}>目标 URL（仅用于 curl 示例）</span>
            <Input value={url} onChange={(event) => setUrl(event.target.value)} />
          </div>
        </div>
        <p className={styles.hint}>
          boundary 仅允许 RFC 2046 bchars 字符；留空时每次渲染使用随机 boundary，显式填入后按输入透传。
        </p>
      </Card>

      {!buildState.ok ? (
        <Alert
          type="error"
          showIcon
          message="校验失败，未生成请求体"
          description={
            <ul className={styles.alertList}>
              {buildState.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          }
        />
      ) : null}

      {buildState.ok && buildState.result !== null ? (
        <div className={styles.statsGrid}>
          <Card>
            <Statistic title="字段数" value={fields.length} />
          </Card>
          <Card>
            <Statistic title="分段数" value={fields.length} />
          </Card>
          <Card>
            <Statistic title="body 字符数" value={buildState.result.body.length} />
          </Card>
          <Card>
            <Statistic title="UTF-8 字节数" value={buildState.result.byteLength} />
          </Card>
        </div>
      ) : null}

      <Card
        size="small"
        title="Content-Type 请求头"
        extra={
          <Button
            size="small"
            icon={<CopyOutlined />}
            disabled={!buildState.ok}
            onClick={() =>
              handleCopy(buildState.result?.contentType ?? '', 'Content-Type 头')
            }
          >
            复制
          </Button>
        }
      >
        <pre className={styles.output}>{buildState.result?.contentType ?? ''}</pre>
      </Card>

      <Card
        title="完整请求体（CRLF 以换行可视呈现）"
        extra={
          <Button
            size="small"
            type="primary"
            icon={<CopyOutlined />}
            disabled={!buildState.ok}
            onClick={() => handleCopy(buildState.result?.body ?? '', '请求体')}
          >
            复制
          </Button>
        }
      >
        {buildState.ok && buildState.result !== null ? (
          <pre className={styles.output}>{buildState.result.body}</pre>
        ) : (
          <Empty description="校验通过后在此显示请求体" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      <Card
        size="small"
        title="curl 示例（--data-binary 保留原始字节）"
        extra={
          <Button
            size="small"
            icon={<CopyOutlined />}
            disabled={!buildState.ok}
            onClick={() =>
              handleCopy(
                buildState.result === null
                  ? ''
                  : buildCurlExample(url, buildState.result),
                'curl 命令',
              )
            }
          >
            复制
          </Button>
        }
      >
        <pre className={styles.output}>
          {buildState.result === null ? '' : buildCurlExample(url, buildState.result)}
        </pre>
      </Card>
    </div>
  );

  const parseTab = (
    <div className={styles.container}>
      <Card size="small" title="Content-Type 请求头（可选，含 boundary 参数）">
        <Input.TextArea
          value={parseContentType}
          onChange={(event) => setParseContentType(event.target.value)}
          spellCheck={false}
          className={styles.editor}
          autoSize={{ minRows: 1, maxRows: 3 }}
          placeholder="multipart/form-data; boundary=----WebKitFormBoundary...（留空则自动探测）"
        />
      </Card>

      <Card
        title="原始 multipart 请求体"
        extra={
          <Space>
            <Button icon={<ImportOutlined />} onClick={loadBuiltResult}>
              载入构造结果
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={() => {
                setParseBody('');
                setParseContentType('');
              }}
            >
              清空
            </Button>
          </Space>
        }
      >
        <Input.TextArea
          value={parseBody}
          onChange={(event) => setParseBody(event.target.value)}
          spellCheck={false}
          className={styles.editor}
          autoSize={{ minRows: 8, maxRows: 20 }}
          placeholder={'粘贴原始报文，例如：\n--boundary\r\nContent-Disposition: form-data; name="a"\r\n\r\nvalue\r\n--boundary--\r\n'}
        />
        <p className={styles.hint}>
          解析严格按 CRLF 行结束处理，容忍结束段缺少尾随 CRLF；结构损坏不会抛异常，而在下方汇总错误。
        </p>
      </Card>

      {parseResult.errors.length > 0 ? (
        <Alert
          type="error"
          showIcon
          message={`解析错误（${parseResult.errors.length} 条）`}
          description={
            <ul className={styles.alertList}>
              {parseResult.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          }
        />
      ) : null}

      <Card title={`解析结果（${parseResult.parts.length} 个分段）`}>
        {parseResult.parts.length === 0 ? (
          <Empty
            description="粘贴请求体后在此显示解析结果"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table<ParsedPart>
            rowKey={(_, index) => String(index)}
            columns={PART_COLUMNS}
            dataSource={parseResult.parts}
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>
    </div>
  );

  return (
    <Tabs
      defaultActiveKey="build"
      items={[
        { key: 'build', label: '构造请求', children: buildTab },
        { key: 'parse', label: '反向解析', children: parseTab },
      ]}
    />
  );
};

export default MultipartFormBuilder;
