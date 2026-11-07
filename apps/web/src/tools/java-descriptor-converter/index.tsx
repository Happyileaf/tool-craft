'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Table, Tabs, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  buildMethodDescriptor,
  fieldDescriptorToSource,
  internalNameToSource,
  methodDescriptorToSignature,
  parseMethodDescriptor,
  sourceToFieldDescriptor,
  sourceToInternalName,
  typeToSource,
} from './utils/java-descriptor';
import {
  DEFAULT_FIELD_DESCRIPTOR,
  DEFAULT_INTERNAL_NAME,
  DEFAULT_METHOD_DESCRIPTOR,
  MODE_OPTIONS,
  PRIMITIVE_TABLE,
  type JavaToolMode,
} from './constants';
import styles from './index.module.css';

interface ConvertResult {
  output: string | null;
  error: string | null;
}

/** 统一包裹一次转换，捕获纯函数抛出的错误 */
function safeConvert(fn: () => string): ConvertResult {
  try {
    return { output: fn(), error: null };
  } catch (caught) {
    return { output: null, error: caught instanceof Error ? caught.message : '转换失败' };
  }
}

/** 字段描述符双向转换面板 */
const FieldPanel: React.FC = () => {
  const [descriptor, setDescriptor] = React.useState(DEFAULT_FIELD_DESCRIPTOR);
  const [sourceType, setSourceType] = React.useState('java.lang.String[][]');

  const descriptorResult = React.useMemo(
    () => safeConvert(() => fieldDescriptorToSource(descriptor)),
    [descriptor],
  );
  const sourceResult = React.useMemo(
    () => safeConvert(() => sourceToFieldDescriptor(sourceType)),
    [sourceType],
  );

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card type="inner" title="字段描述符 → Java 源码类型">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Input
            value={descriptor}
            onChange={(event) => setDescriptor(event.target.value)}
            placeholder="如 [[Ljava/lang/String; 、 I 、 [Z"
            spellCheck={false}
            className={styles.mono}
          />
          {descriptorResult.error ? (
            <Alert type="error" showIcon message="解析失败" description={descriptorResult.error} />
          ) : (
            <ResultRow value={descriptorResult.output ?? ''} />
          )}
        </Space>
      </Card>

      <Card type="inner" title="Java 源码类型 → 字段描述符">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Input
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value)}
            placeholder="如 java.lang.String[][] 、 int[] 、 boolean"
            spellCheck={false}
            className={styles.mono}
          />
          {sourceResult.error ? (
            <Alert type="error" showIcon message="解析失败" description={sourceResult.error} />
          ) : (
            <ResultRow value={sourceResult.output ?? ''} />
          )}
        </Space>
      </Card>

      <Card type="inner" title="原始类型描述符速查（JVMS §4.3.2）">
        <Table
          size="small"
          pagination={false}
          rowKey="descriptor"
          dataSource={PRIMITIVE_TABLE}
          columns={[
            { title: '描述符', dataIndex: 'descriptor', key: 'descriptor', width: 120 },
            { title: 'Java 类型', dataIndex: 'source', key: 'source' },
          ]}
        />
      </Card>
    </Space>
  );
};

/** 方法描述符面板 */
const MethodPanel: React.FC = () => {
  const [descriptor, setDescriptor] = React.useState(DEFAULT_METHOD_DESCRIPTOR);
  const [params, setParams] = React.useState('java.lang.String, int');
  const [returnType, setReturnType] = React.useState('void');

  const parseResult = React.useMemo(
    () =>
      safeConvert(() => {
        const parsed = parseMethodDescriptor(descriptor);
        const parameterText = parsed.parameters.map(typeToSource).join(', ');
        return `${methodDescriptorToSignature(descriptor)}\n参数：${parameterText || '（无）'}\n返回：${typeToSource(parsed.returnType)}`;
      }),
    [descriptor],
  );

  const buildResult = React.useMemo(
    () =>
      safeConvert(() => {
        const parameterList = params
          .split(',')
          .map((each) => each.trim())
          .filter(Boolean);
        return buildMethodDescriptor(parameterList, returnType);
      }),
    [params, returnType],
  );

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card type="inner" title="方法描述符 → 签名拆解">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Input
            value={descriptor}
            onChange={(event) => setDescriptor(event.target.value)}
            placeholder="如 (Ljava/lang/String;I)V"
            spellCheck={false}
            className={styles.mono}
          />
          {parseResult.error ? (
            <Alert type="error" showIcon message="解析失败" description={parseResult.error} />
          ) : (
            <ResultRow value={parseResult.output ?? ''} multiline />
          )}
        </Space>
      </Card>

      <Card type="inner" title="参数 / 返回类型 → 方法描述符">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Input
            addonBefore="参数（逗号分隔）"
            value={params}
            onChange={(event) => setParams(event.target.value)}
            placeholder="java.lang.String, int[]"
            spellCheck={false}
            className={styles.mono}
          />
          <Input
            addonBefore="返回类型"
            value={returnType}
            onChange={(event) => setReturnType(event.target.value)}
            placeholder="void / int / java.lang.String"
            spellCheck={false}
            className={styles.mono}
          />
          {buildResult.error ? (
            <Alert type="error" showIcon message="生成失败" description={buildResult.error} />
          ) : (
            <ResultRow value={buildResult.output ?? ''} />
          )}
        </Space>
      </Card>
    </Space>
  );
};

/** 内部名与源码类名互转面板 */
const NamePanel: React.FC = () => {
  const [internalName, setInternalName] = React.useState(DEFAULT_INTERNAL_NAME);
  const [sourceName, setSourceName] = React.useState('java.util.Map.Entry');

  const toSource = React.useMemo(() => safeConvert(() => internalNameToSource(internalName)), [internalName]);
  const toInternal = React.useMemo(() => safeConvert(() => sourceToInternalName(sourceName)), [sourceName]);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card type="inner" title="内部名（binary name）→ 源码类名">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Input
            value={internalName}
            onChange={(event) => setInternalName(event.target.value)}
            placeholder="如 java/util/Map$Entry"
            spellCheck={false}
            className={styles.mono}
          />
          {toSource.error ? (
            <Alert type="error" showIcon message="解析失败" description={toSource.error} />
          ) : (
            <ResultRow value={toSource.output ?? ''} />
          )}
        </Space>
      </Card>

      <Card type="inner" title="源码类名 → 内部名">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Input
            value={sourceName}
            onChange={(event) => setSourceName(event.target.value)}
            placeholder="如 java.util.Map.Entry（嵌套类可用 $ 显式标记）"
            spellCheck={false}
            className={styles.mono}
          />
          {toInternal.error ? (
            <Alert type="error" showIcon message="解析失败" description={toInternal.error} />
          ) : (
            <ResultRow value={toInternal.output ?? ''} />
          )}
          <div className={styles.hint}>
            源码全限定名中的点号同时承担包分隔与嵌套类分隔，转换时统一映射为 JVM 斜杠；
            若需保留嵌套类标记，请按 JVMS 二进制名显式书写「外部类$内部类」。
          </div>
        </Space>
      </Card>
    </Space>
  );
};

/** 带复制按钮的结果展示行 */
const ResultRow: React.FC<{ value: string; multiline?: boolean }> = ({ value, multiline }) => {
  const handleCopy = async () => {
    await copyToClipboard(value);
    message.success('复制成功');
  };
  return (
    <Space size={12} wrap align="start">
      {multiline ? (
        <Input.TextArea value={value} readOnly autoSize={{ minRows: 2, maxRows: 8 }} className={styles.mono} />
      ) : (
        <span className={styles.resultValue}>{value}</span>
      )}
      <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
        复制
      </Button>
    </Space>
  );
};

/**
 * Java 内部类名与描述符转换器：依据 JVMS §4.2 / §4.3 / §4.3.3
 * 在浏览器本地完成内部名↔源码类名、字段描述符、方法描述符的双向转换与语法校验。
 *
 * @param _props - 工具组件属性（本工具使用内置样例，不依赖 defaultInput）
 * @returns 工具交互界面
 */
const JavaDescriptorConverter: React.FC<ToolComponentProps> = (_props) => {
  const [mode, setMode] = React.useState<JavaToolMode>('field');

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            onChange={(event) => setMode(event.target.value as JavaToolMode)}
            options={MODE_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
          />
          <Tag color="blue" className={styles.row}>
            纯浏览器本地计算，类名与描述符不会上传
          </Tag>
          <Tabs
            activeKey={mode}
            onChange={(key) => setMode(key as JavaToolMode)}
            items={[
              { key: 'field', label: '字段描述符', children: <FieldPanel /> },
              { key: 'method', label: '方法描述符', children: <MethodPanel /> },
              { key: 'name', label: '内部名 / 类名', children: <NamePanel /> },
            ]}
          />
        </Space>
      </Card>
    </div>
  );
};

export default JavaDescriptorConverter;
