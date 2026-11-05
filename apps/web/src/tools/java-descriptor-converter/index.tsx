'use client';

import React from 'react';
import { Alert, Button, Card, Descriptions, Input, Radio, Space, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  sourceNameToInternal,
  internalToSourceName,
  parseFieldDescriptor,
  buildFieldDescriptor,
  parseMethodDescriptor,
  buildMethodDescriptor,
  type JvmType,
} from './utils/jvmDescriptor';
import {
  DEFAULT_FIELD_DESCRIPTOR,
  DEFAULT_FIELD_SOURCE,
  DEFAULT_METHOD_DESCRIPTOR,
  DEFAULT_METHOD_PARAMS,
  DEFAULT_METHOD_RETURN,
  DEFAULT_NAME_INTERNAL,
  DEFAULT_NAME_SOURCE,
  MODE_OPTIONS,
  PRIMITIVE_TABLE,
  type ConvertDirection,
  type JvmToolMode,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface SafeResult<T> {
  value?: T;
  error?: string;
}

function safeRun<T>(fn: () => T, empty: boolean): SafeResult<T> | null {
  if (empty) return null;
  try {
    return { value: fn() };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function TypeTags({ type }: { type: JvmType }) {
  return (
    <Space size={[4, 4]} wrap>
      <Tag color={type.isReference ? 'geekblue' : 'green'}>
        {type.isReference ? '引用类型' : '原始类型'}
      </Tag>
      {type.arrayDimensions > 0 && <Tag color="purple">数组 × {type.arrayDimensions}</Tag>}
      <Tag className={styles.monoTag}>{type.descriptor}</Tag>
    </Space>
  );
}

const JavaDescriptorConverter: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<JvmToolMode>('name');

  // 模式一：类名互转
  const [sourceName, setSourceName] = React.useState(DEFAULT_NAME_SOURCE);
  const [internalName, setInternalName] = React.useState(DEFAULT_NAME_INTERNAL);

  // 模式二：字段描述符
  const [fieldDirection, setFieldDirection] = React.useState<ConvertDirection>('toDescriptor');
  const [fieldSourceInput, setFieldSourceInput] = React.useState(DEFAULT_FIELD_SOURCE);
  const [fieldDescriptorInput, setFieldDescriptorInput] = React.useState(DEFAULT_FIELD_DESCRIPTOR);

  // 模式三：方法描述符
  const [methodDirection, setMethodDirection] =
    React.useState<ConvertDirection>('toDescriptor');
  const [paramInput, setParamInput] = React.useState(DEFAULT_METHOD_PARAMS);
  const [returnInput, setReturnInput] = React.useState(DEFAULT_METHOD_RETURN);
  const [methodDescriptorInput, setMethodDescriptorInput] =
    React.useState(DEFAULT_METHOD_DESCRIPTOR);

  const activeOption = MODE_OPTIONS.find((option) => option.value === mode);

  // ---------- 类名互转结果 ----------
  const toInternal = React.useMemo(
    () => safeRun(() => sourceNameToInternal(sourceName), sourceName.trim() === ''),
    [sourceName],
  );
  const toSource = React.useMemo(
    () => safeRun(() => internalToSourceName(internalName), internalName.trim() === ''),
    [internalName],
  );

  // ---------- 字段描述符结果 ----------
  const fieldResult = React.useMemo<SafeResult<JvmType> | null>(() => {
    if (mode !== 'field') return null;
    if (fieldDirection === 'toDescriptor') {
      return safeRun(
        () => buildFieldDescriptor({ sourceName: fieldSourceInput }),
        fieldSourceInput.trim() === '',
      );
    }
    return safeRun(
      () => parseFieldDescriptor(fieldDescriptorInput),
      fieldDescriptorInput.trim() === '',
    );
  }, [mode, fieldDirection, fieldSourceInput, fieldDescriptorInput]);

  // ---------- 方法描述符结果 ----------
  const methodResult = React.useMemo(() => {
    if (mode !== 'method') return null;
    if (methodDirection === 'toDescriptor') {
      return safeRun(() => {
        const params = paramInput
          .split(',')
          .map((part) => part.trim())
          .filter((part) => part !== '');
        return buildMethodDescriptor({ parameterTypes: params, returnType: returnInput.trim() });
      }, returnInput.trim() === '');
    }
    return safeRun(
      () => parseMethodDescriptor(methodDescriptorInput),
      methodDescriptorInput.trim() === '',
    );
  }, [mode, methodDirection, paramInput, returnInput, methodDescriptorInput]);

  const handleCopy = (text: string | null | undefined) => {
    if (!text) {
      message.warning('暂无可复制的结果');
      return;
    }
    copyToClipboard(text);
    message.success('已复制到剪贴板');
  };

  const methodColumns = [
    { title: '#', dataIndex: 'index', key: 'index', width: 48 },
    {
      title: '源码类型',
      dataIndex: 'sourceName',
      key: 'sourceName',
      render: (text: string) => <span className={styles.mono}>{text}</span>,
    },
    {
      title: '描述符片段',
      dataIndex: 'descriptor',
      key: 'descriptor',
      render: (text: string) => <Tag className={styles.monoTag}>{text}</Tag>,
    },
    {
      title: '属性',
      dataIndex: 'tags',
      key: 'tags',
      render: (_: unknown, record: JvmType & { index: number }) => <TypeTags type={record} />,
    },
  ];

  return (
    <div className={styles.container}>
      <Card size="small" title="转换模式">
        <div className={styles.controls}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(e) => setMode(e.target.value as JvmToolMode)}
          />
          <span className={styles.hint}>{activeOption?.hint}</span>
        </div>
      </Card>

      {mode === 'name' && (
        <div className={styles.panels}>
          <Card
            className={styles.card}
            title="源码类名 → 内部名"
            extra={
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(toInternal?.value)}
              >
                复制
              </Button>
            }
          >
            <Input
              value={sourceName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSourceName(e.target.value)}
              spellCheck={false}
              className={styles.editor}
              placeholder="例如 java.util.Map.Entry"
            />
            <div className={styles.resultBox}>
              {toInternal === null ? (
                <Alert type="info" showIcon message="请输入源码类名" />
              ) : toInternal.error ? (
                <Alert type="error" showIcon message={toInternal.error} />
              ) : (
                <div className={styles.resultRow}>
                  <span className={styles.code}>{toInternal.value}</span>
                  <Tag color="blue">/ 分隔包，$ 分隔内部类</Tag>
                </div>
              )}
            </div>
          </Card>

          <Card
            className={styles.card}
            title="内部名 → 源码类名"
            extra={
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(toSource?.value)}
              >
                复制
              </Button>
            }
          >
            <Input
              value={internalName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInternalName(e.target.value)
              }
              spellCheck={false}
              className={styles.editor}
              placeholder="例如 java/util/Map$Entry"
            />
            <div className={styles.resultBox}>
              {toSource === null ? (
                <Alert type="info" showIcon message="请输入内部名" />
              ) : toSource.error ? (
                <Alert type="error" showIcon message={toSource.error} />
              ) : (
                <div className={styles.resultRow}>
                  <span className={styles.code}>{toSource.value}</span>
                  <Tag color="blue">. 分隔包与类</Tag>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {mode === 'field' && (
        <div className={styles.panels}>
          <Card className={styles.card} title="输入">
            <Radio.Group
              optionType="button"
              value={fieldDirection}
              options={[
                { value: 'toDescriptor', label: '源码类型 → 描述符' },
                { value: 'fromDescriptor', label: '描述符 → 源码类型' },
              ]}
              onChange={(e) => setFieldDirection(e.target.value as ConvertDirection)}
            />
            <div className={styles.fieldBlock}>
              {fieldDirection === 'toDescriptor' ? (
                <>
                  <div className={styles.fieldLabel}>源码类型名（数组以 [] 结尾）</div>
                  <Input
                    value={fieldSourceInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFieldSourceInput(e.target.value)
                    }
                    spellCheck={false}
                    className={styles.editor}
                    placeholder="例如 int、java.lang.String[][]"
                  />
                </>
              ) : (
                <>
                  <div className={styles.fieldLabel}>字段描述符</div>
                  <Input
                    value={fieldDescriptorInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFieldDescriptorInput(e.target.value)
                    }
                    spellCheck={false}
                    className={styles.editor}
                    placeholder="例如 [[Ljava/lang/String;"
                  />
                </>
              )}
            </div>
            <Descriptions size="small" column={1} bordered title="原始类型描述符速查">
              {PRIMITIVE_TABLE.map((row) => (
                <Descriptions.Item key={row.descriptor} label={row.source}>
                  <Space size={8}>
                    <Tag className={styles.monoTag}>{row.descriptor}</Tag>
                    <span className={styles.hint}>{row.meaning}</span>
                  </Space>
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>

          <Card
            className={styles.card}
            title="转换结果"
            extra={
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(fieldResult?.value?.descriptor ?? fieldResult?.value?.sourceName)}
              >
                复制
              </Button>
            }
          >
            {fieldResult === null ? (
              <Alert type="info" showIcon message="请输入类型" />
            ) : fieldResult.error ? (
              <Alert type="error" showIcon message={fieldResult.error} />
            ) : fieldResult.value ? (
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="源码类型">
                  <span className={styles.mono}>{fieldResult.value.sourceName}</span>
                </Descriptions.Item>
                <Descriptions.Item label="描述符">
                  <span className={styles.mono}>{fieldResult.value.descriptor}</span>
                </Descriptions.Item>
                <Descriptions.Item label="基础类型（去数组）">
                  <span className={styles.mono}>{fieldResult.value.baseType}</span>
                </Descriptions.Item>
                <Descriptions.Item label="数组维度">
                  {fieldResult.value.arrayDimensions}
                </Descriptions.Item>
                <Descriptions.Item label="分类">
                  <TypeTags type={fieldResult.value} />
                </Descriptions.Item>
              </Descriptions>
            ) : null}
          </Card>
        </div>
      )}

      {mode === 'method' && (
        <div className={styles.panels}>
          <Card className={styles.card} title="输入">
            <Radio.Group
              optionType="button"
              value={methodDirection}
              options={[
                { value: 'toDescriptor', label: '签名 → 方法描述符' },
                { value: 'fromDescriptor', label: '方法描述符 → 签名' },
              ]}
              onChange={(e) => setMethodDirection(e.target.value as ConvertDirection)}
            />
            <div className={styles.fieldBlock}>
              {methodDirection === 'toDescriptor' ? (
                <Space direction="vertical" className={styles.fullWidth} size="middle">
                  <div>
                    <div className={styles.fieldLabel}>参数类型（逗号分隔，无参留空）</div>
                    <Input
                      value={paramInput}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setParamInput(e.target.value)
                      }
                      spellCheck={false}
                      className={styles.editor}
                      placeholder="例如 java.lang.String, int"
                    />
                  </div>
                  <div>
                    <div className={styles.fieldLabel}>返回类型（void 方法填 void）</div>
                    <Input
                      value={returnInput}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setReturnInput(e.target.value)
                      }
                      spellCheck={false}
                      className={styles.editor}
                      placeholder="例如 void"
                    />
                  </div>
                </Space>
              ) : (
                <>
                  <div className={styles.fieldLabel}>方法描述符</div>
                  <Input
                    value={methodDescriptorInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMethodDescriptorInput(e.target.value)
                    }
                    spellCheck={false}
                    className={styles.editor}
                    placeholder="例如 (Ljava/lang/String;I)V"
                  />
                </>
              )}
            </div>
          </Card>

          <Card
            className={styles.card}
            title="转换结果"
            extra={
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(methodResult?.value?.descriptor)}
              >
                复制描述符
              </Button>
            }
          >
            {methodResult === null ? (
              <Alert type="info" showIcon message="请输入方法信息" />
            ) : methodResult.error ? (
              <Alert type="error" showIcon message={methodResult.error} />
            ) : methodResult.value ? (
              <div className={styles.resultList}>
                <div className={styles.resultRow}>
                  <span className={styles.code}>{methodResult.value.descriptor}</span>
                  <Tag color="blue">方法描述符</Tag>
                </div>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="index"
                  columns={methodColumns}
                  dataSource={methodResult.value.parameters.map((type, index) => ({
                    ...type,
                    index: index + 1,
                  }))}
                />
                <Descriptions size="small" column={1} bordered title="返回类型">
                  <Descriptions.Item label="源码类型">
                    <span className={styles.mono}>
                      {methodResult.value.returnType.sourceName}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="描述符">
                    <TypeTags type={methodResult.value.returnType} />
                  </Descriptions.Item>
                </Descriptions>
              </div>
            ) : null}
          </Card>
        </div>
      )}
    </div>
  );
};

export default JavaDescriptorConverter;
