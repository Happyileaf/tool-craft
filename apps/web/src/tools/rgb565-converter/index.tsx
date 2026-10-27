'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Input,
  Radio,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { convertBatch, type BatchRow } from './utils/rgb565';
import {
  ConvertModeEnum,
  DEFAULT_DECODE_INPUT,
  DEFAULT_ENCODE_INPUT,
  ENDIAN_OPTIONS,
  EndianEnum,
  FORMAT_OPTIONS,
  MODE_OPTIONS,
  PixelFormatEnum,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface TableRow extends BatchRow {
  key: string;
}

const Swatch: React.FC<{ hex?: string }> = ({ hex }) => {
  if (!hex) {
    return <span className={styles.swatchEmpty}>—</span>;
  }
  return (
    <Space size={6}>
      <span className={styles.swatch} style={{ backgroundColor: hex }} />
      <span className={styles.mono}>{hex}</span>
    </Space>
  );
};

/**
 * RGB565 / RGB555 嵌入式像素格式转换工具，在 24 位 RGB888 与 16 位帧缓冲像素之间
 * 批量双向转换，支持大端 / 小端字节序与 C 字面量、高低字节拆分输出，全部本地计算
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns 像素格式转换交互界面
 */
const Rgb565Converter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<ConvertModeEnum>(ConvertModeEnum.ENCODE);
  const [format, setFormat] = React.useState<PixelFormatEnum>(PixelFormatEnum.RGB565);
  const [endian, setEndian] = React.useState<EndianEnum>(EndianEnum.BIG);
  const [input, setInput] = React.useState<string>(
    defaultInput && defaultInput.includes('\n')
      ? defaultInput
      : DEFAULT_ENCODE_INPUT,
  );

  const rows = React.useMemo<TableRow[]>(() => {
    return convertBatch(input, format, endian, mode).map((row, index) => ({
      ...row,
      key: `${index}-${row.source}`,
    }));
  }, [input, format, endian, mode]);

  const outputText = React.useMemo(() => {
    return rows
      .filter((row) => row.ok)
      .map((row) => (mode === ConvertModeEnum.ENCODE ? row.literal : row.hex))
      .filter((value): value is string => Boolean(value))
      .join('\n');
  }, [rows, mode]);

  const errorCount = rows.filter((row) => !row.ok).length;

  /**
   * 切换模式时载入对应示例
   */
  const handleModeChange = (next: ConvertModeEnum) => {
    setMode(next);
    setInput(next === ConvertModeEnum.ENCODE ? DEFAULT_ENCODE_INPUT : DEFAULT_DECODE_INPUT);
  };

  /**
   * 载入当前模式的默认示例
   */
  const handleLoadSample = () => {
    setInput(mode === ConvertModeEnum.ENCODE ? DEFAULT_ENCODE_INPUT : DEFAULT_DECODE_INPUT);
  };

  /**
   * 清空输入
   */
  const handleClear = () => {
    setInput('');
  };

  /**
   * 复制转换结果
   */
  const handleCopy = async () => {
    if (!outputText) {
      return;
    }
    await copyToClipboard(outputText);
    message.success('复制成功');
  };

  const encodeColumns: ColumnsType<TableRow> = [
    {
      title: '输入',
      dataIndex: 'source',
      key: 'source',
      render: (value: string) => <span className={styles.mono}>{value}</span>,
    },
    {
      title: '16 位字面量',
      dataIndex: 'literal',
      key: 'literal',
      render: (value?: string) => (value ? <span className={styles.mono}>{value}</span> : '—'),
    },
    {
      title: 'HIGH_BYTE',
      dataIndex: 'highByte',
      key: 'highByte',
      render: (value?: string) => (
        <Tag color="blue" className={styles.monoTag}>
          {value ?? '—'}
        </Tag>
      ),
    },
    {
      title: 'LOW_BYTE',
      dataIndex: 'lowByte',
      key: 'lowByte',
      render: (value?: string) => (
        <Tag color="geekblue" className={styles.monoTag}>
          {value ?? '—'}
        </Tag>
      ),
    },
    {
      title: endian === EndianEnum.BIG ? '字节序（大端）' : '字节序（小端）',
      dataIndex: 'bytesText',
      key: 'bytesText',
      render: (value?: string) => (value ? <span className={styles.mono}>{value}</span> : '—'),
    },
    {
      title: '还原色',
      dataIndex: 'hex',
      key: 'hex',
      render: (_: unknown, record: TableRow) => <Swatch hex={record.hex} />,
    },
    {
      title: '色差 Δ',
      dataIndex: 'distance',
      key: 'distance',
      width: 90,
      render: (value?: number) =>
        typeof value === 'number' ? value.toFixed(2) : '—',
    },
  ];

  const decodeColumns: ColumnsType<TableRow> = [
    {
      title: '输入',
      dataIndex: 'source',
      key: 'source',
      render: (value: string) => <span className={styles.mono}>{value}</span>,
    },
    {
      title: '16 位字面量',
      dataIndex: 'literal',
      key: 'literal',
      render: (value?: string) => (value ? <span className={styles.mono}>{value}</span> : '—'),
    },
    {
      title: 'HIGH_BYTE',
      dataIndex: 'highByte',
      key: 'highByte',
      render: (value?: string) => (
        <Tag color="blue" className={styles.monoTag}>
          {value ?? '—'}
        </Tag>
      ),
    },
    {
      title: 'LOW_BYTE',
      dataIndex: 'lowByte',
      key: 'lowByte',
      render: (value?: string) => (
        <Tag color="geekblue" className={styles.monoTag}>
          {value ?? '—'}
        </Tag>
      ),
    },
    {
      title: endian === EndianEnum.BIG ? '字节序（大端）' : '字节序（小端）',
      dataIndex: 'bytesText',
      key: 'bytesText',
      render: (value?: string) => (value ? <span className={styles.mono}>{value}</span> : '—'),
    },
    {
      title: 'RGB888',
      dataIndex: 'hex',
      key: 'hex',
      render: (_: unknown, record: TableRow) => <Swatch hex={record.hex} />,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.field}>
          <span className={styles.label}>模式：</span>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as ConvertModeEnum)}
            options={MODE_OPTIONS}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>像素格式：</span>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={format}
            onChange={(event) => setFormat(event.target.value as PixelFormatEnum)}
            options={FORMAT_OPTIONS}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>字节序：</span>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={endian}
            onChange={(event) => setEndian(event.target.value as EndianEnum)}
            options={ENDIAN_OPTIONS}
          />
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleLoadSample}>
            载入示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            清空
          </Button>
        </Space>
      </div>

      {errorCount > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`共 ${errorCount} 行输入无法解析，已在表中标注，不影响其他行`}
        />
      )}

      <div className={styles.panels}>
        <Card
          title={mode === ConvertModeEnum.ENCODE ? '输入颜色（每行一个 #RRGGBB）' : '输入像素值（每行一个，如 0xF800）'}
          className={styles.card}
        >
          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              mode === ConvertModeEnum.ENCODE
                ? '#FFFFFF\n#FF0000\n#00FF00'
                : '0xFFFF\n0xF800\n0x07E0'
            }
            rows={14}
            autoSize={{ minRows: 10, maxRows: 22 }}
            className={styles.monoArea}
          />
          <div className={styles.hint}>空行自动跳过；颜色可省略 #、像素值可省略 0x，大小写不敏感。</div>
        </Card>

        <Card
          title="转换结果"
          className={styles.card}
          extra={
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              disabled={!outputText}
            >
              复制结果
            </Button>
          }
        >
          <Input.TextArea
            value={outputText}
            readOnly
            rows={6}
            autoSize={{ minRows: 4, maxRows: 10 }}
            className={styles.monoArea}
          />
          <div className={styles.hint}>
            {mode === ConvertModeEnum.ENCODE
              ? '复制内容为每行一个 16 位 C 字面量；详细高低字节见下表。'
              : '复制内容为每行一个还原后的 #RRGGBB。'}
          </div>
        </Card>
      </div>

      <Card title="逐行明细" size="small">
        <Table<TableRow>
          columns={mode === ConvertModeEnum.ENCODE ? encodeColumns : decodeColumns}
          dataSource={rows}
          size="small"
          pagination={false}
          scroll={{ x: 720 }}
          rowClassName={(record) => (record.ok ? '' : styles.errorRow ?? '')}
          expandable={{
            expandedRowRender: (record) =>
              record.ok ? null : (
                <Alert type="error" showIcon message={record.error} />
              ),
            rowExpandable: (record) => !record.ok,
          }}
        />
        <div className={styles.hint}>
          提示：反向还原采用位域低位补 1 扩展（5 位 OR 0x07、6 位 OR 0x03），与常见 SDK
          一致；因 16 位位宽有限，正向结果与原色可能存在轻微色差。
        </div>
      </Card>

      <Alert
        type="info"
        showIcon
        message="RGB565 位布局：bit15–11 红 5 位、bit10–5 绿 6 位、bit4–0 蓝 5 位；RGB555 三个通道各 5 位、bit15 未用。所有转换均在浏览器本地完成，不上传任何数据。"
      />
    </div>
  );
};

export default Rgb565Converter;
