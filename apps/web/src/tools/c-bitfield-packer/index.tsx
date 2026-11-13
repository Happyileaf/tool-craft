'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Radio,
  type RadioChangeEvent,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  message,
} from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  BIT_ORDER_OPTIONS,
  DEFAULT_FIELD_DEFINITIONS,
  DEFAULT_FIELD_VALUES,
  FIELD_LIMIT,
  STORAGE_OPTIONS,
} from './constants';
import {
  buildLayouts,
  packValues,
  parseFieldDefinitions,
  unpackValue,
  type BitOrder,
  type FieldLayout,
  type StorageType,
  type UnpackedField,
} from './utils/bitfield';
import styles from './index.module.css';

/** 打包页位移表的行数据：布局信息叠加当前赋值文本中解析出的值 */
interface PackTableRow extends FieldLayout {
  /** 当前赋值（十进制字符串），缺失时为 null */
  currentValue: string | null;
}

/**
 * C 结构体位域打包 / 解包器：
 * 声明式定义位域字段（字段名:位宽），在选定存储单元与位序下完成本地 pack / unpack，
 * 输出整体 hex / binary / decimal、字段位移表与逐字段解包结果；全部运算在浏览器本地完成。
 *
 * @returns 位域打包 / 解包界面
 */
const CBitfieldPacker: React.FC<ToolComponentProps> = () => {
  const [storage, setStorage] = React.useState<StorageType>('uint16');
  const [orderOverride, setOrderOverride] = React.useState<BitOrder>('lsb-first');
  const [definitionText, setDefinitionText] = React.useState<string>(DEFAULT_FIELD_DEFINITIONS);
  const [valuesText, setValuesText] = React.useState<string>(DEFAULT_FIELD_VALUES);
  const [rawText, setRawText] = React.useState<string>('0x123B');

  const parsed = React.useMemo(() => parseFieldDefinitions(definitionText), [definitionText]);
  const effectiveOrder: BitOrder = parsed.order ?? orderOverride;

  const layoutResult = React.useMemo(
    () => buildLayouts(parsed.fields, effectiveOrder, storage),
    [parsed.fields, effectiveOrder, storage],
  );

  const definitionErrors = React.useMemo(
    () => [...parsed.errors, ...layoutResult.errors],
    [parsed.errors, layoutResult.errors],
  );

  const packOutcome = React.useMemo(
    () =>
      packValues(
        parsed.fields,
        layoutResult.layouts,
        valuesText,
        effectiveOrder,
        storage,
      ),
    [parsed.fields, layoutResult.layouts, valuesText, effectiveOrder, storage],
  );

  const unpackOutcome = React.useMemo(
    () =>
      unpackValue(parsed.fields, layoutResult.layouts, rawText, storage),
    [parsed.fields, layoutResult.layouts, rawText, storage],
  );

  const packRows = React.useMemo<PackTableRow[]>(() => {
    const assigned = new Map<string, string>();
    valuesText.split(/\r?\n/).forEach((rawLine) => {
      const line = rawLine.trim();
      const separatorIndex = line.indexOf('=');
      if (line === '' || line.startsWith('#') || separatorIndex < 0) {
        return;
      }
      assigned.set(line.slice(0, separatorIndex).trim(), line.slice(separatorIndex + 1).trim());
    });
    return layoutResult.layouts.map((layout) => ({
      ...layout,
      currentValue: assigned.get(layout.name) ?? null,
    }));
  }, [layoutResult.layouts, valuesText]);

  const handleCopy = async (label: string, text: string): Promise<void> => {
    if (text === '') {
      message.warning(`暂无可复制的${label}`);
      return;
    }
    await copyToClipboard(text);
    message.success(`${label}已复制`);
  };

  const handleReset = (): void => {
    setStorage('uint16');
    setOrderOverride('lsb-first');
    setDefinitionText(DEFAULT_FIELD_DEFINITIONS);
    setValuesText(DEFAULT_FIELD_VALUES);
    setRawText('0x123B');
    message.success('已恢复默认示例');
  };

  const packColumns = [
    { title: '字段名', dataIndex: 'name', width: 140 },
    { title: '位宽', dataIndex: 'width', width: 80 },
    { title: '偏移 (bit)', dataIndex: 'offset', width: 110 },
    {
      title: '掩码',
      dataIndex: 'mask',
      render: (value: string) => <span className={styles.mono}>{value}</span>,
    },
    {
      title: '当前值',
      dataIndex: 'currentValue',
      render: (value: string | null) =>
        value === null ? '—' : <span className={styles.mono}>{value}</span>,
    },
  ];

  const unpackColumns = [
    { title: '字段名', dataIndex: 'name', width: 140 },
    { title: '位宽', dataIndex: 'width', width: 80 },
    { title: '偏移 (bit)', dataIndex: 'offset', width: 110 },
    {
      title: '十进制值',
      dataIndex: 'value',
      render: (value: string) => <span className={styles.mono}>{value}</span>,
    },
    {
      title: 'Hex',
      dataIndex: 'hex',
      render: (value: string) => <span className={styles.mono}>{value}</span>,
    },
  ];

  const sharedControls = (
    <div className={styles.controls}>
      <div className={styles.controlItem}>
        <span className={styles.controlLabel}>存储类型</span>
        <Select<StorageType>
          value={storage}
          onChange={(value) => setStorage(value)}
          options={STORAGE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          style={{ width: 200 }}
        />
      </div>
      <div className={styles.controlItem}>
        <span className={styles.controlLabel}>位序</span>
        <Radio.Group
          value={effectiveOrder}
          onChange={(event: RadioChangeEvent) =>
            setOrderOverride(event.target.value as BitOrder)
          }
          optionType="button"
          buttonStyle="solid"
          options={BIT_ORDER_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
      </div>
      <Button size="small" icon={<ReloadOutlined />} onClick={handleReset}>
        恢复默认示例
      </Button>
    </div>
  );

  const definitionCard = (
    <Card size="small" title="字段定义（两个页签共享）">
      <Input.TextArea
        value={definitionText}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
          setDefinitionText(event.target.value)
        }
        spellCheck={false}
        className={styles.editor}
        autoSize={{ minRows: 6, maxRows: 14 }}
        placeholder="每行一个字段：字段名:位宽；# 开头为注释；首行可用 # @order lsb-first|msb-first 声明位序"
      />
      <p className={styles.hint}>
        字段名需匹配 /^[A-Za-z_]\w*$/，位宽为 1-64 的正整数，字段数上限 {FIELD_LIMIT}
        个；定义中的 # @order 指令优先于上方位序单选。
      </p>
    </Card>
  );

  const renderErrors = (errors: string[]): React.ReactNode =>
    errors.length === 0 ? null : (
      <Alert
        type="error"
        showIcon
        message={`错误列表（${errors.length} 条）`}
        description={
          <ul className={styles.alertList}>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        }
      />
    );

  const packTab = (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {sharedControls}
      {definitionCard}
      <Card size="small" title="字段赋值">
        <Input.TextArea
          value={valuesText}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
            setValuesText(event.target.value)
          }
          spellCheck={false}
          className={styles.editor}
          autoSize={{ minRows: 5, maxRows: 12 }}
          placeholder="每行一条 字段名=值，值支持十进制或 0x 前缀十六进制"
        />
        <p className={styles.hint}>
          缺失字段、未知字段、重复赋值或超出字段位宽可表示范围都会在下方列出错误，不产出打包结果。
        </p>
      </Card>

      {renderErrors([...definitionErrors, ...packOutcome.errors])}

      {packOutcome.result === undefined ? (
        <Empty description="修正输入后在此显示打包结果" />
      ) : (
        <>
          <div className={styles.statsGrid}>
            <Card>
              <Statistic
                title="Hex"
                value={packOutcome.result.hex}
                valueStyle={{ fontSize: 18, wordBreak: 'break-all' }}
              />
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy('Hex', packOutcome.result?.hex ?? '')}
              >
                复制
              </Button>
            </Card>
            <Card>
              <Statistic
                title="Binary"
                value={packOutcome.result.binary}
                valueStyle={{ fontSize: 16, wordBreak: 'break-all' }}
              />
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy('二进制字符串', packOutcome.result?.binary ?? '')}
              >
                复制
              </Button>
            </Card>
            <Card>
              <Statistic
                title="Decimal"
                value={packOutcome.result.decimal}
                valueStyle={{ fontSize: 18, wordBreak: 'break-all' }}
              />
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy('十进制值', packOutcome.result?.decimal ?? '')}
              >
                复制
              </Button>
            </Card>
          </div>

          <Card size="small" title="字段位移表">
            <Table<PackTableRow>
              size="small"
              rowKey="name"
              dataSource={packRows}
              columns={packColumns}
              pagination={false}
              scroll={{ x: 640 }}
            />
          </Card>
        </>
      )}
    </Space>
  );

  const unpackTab = (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {sharedControls}
      {definitionCard}
      <Card size="small" title="待解包整数（Hex / 十进制）">
        <Input.TextArea
          value={rawText}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
            setRawText(event.target.value)
          }
          spellCheck={false}
          className={styles.editor}
          autoSize={{ minRows: 3, maxRows: 8 }}
          placeholder="输入一个整数，如 0x123B 或 4667"
        />
        <p className={styles.hint}>
          支持 0x / 0X 前缀十六进制与纯十进制；超过所选存储类型可表示范围时会报错。
        </p>
      </Card>

      {renderErrors([...definitionErrors, ...unpackOutcome.errors])}

      {unpackOutcome.result === undefined ? (
        <Empty description="修正输入后在此显示解包结果" />
      ) : (
        <Card size="small" title="解包字段表">
          <Table<UnpackedField>
            size="small"
            rowKey="name"
            dataSource={unpackOutcome.result}
            columns={unpackColumns}
            pagination={false}
            scroll={{ x: 640 }}
          />
        </Card>
      )}
    </Space>
  );

  return (
    <div className={styles.container}>
      <Tabs
        items={[
          { key: 'pack', label: '打包 Pack', children: packTab },
          { key: 'unpack', label: '解包 Unpack', children: unpackTab },
        ]}
      />
    </div>
  );
};

export default CBitfieldPacker;
