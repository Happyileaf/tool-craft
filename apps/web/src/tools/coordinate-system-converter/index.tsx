'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { message } from 'antd';
import type { ToolComponentProps } from '../loaders';
import {
  CoordinateSystemEnum,
  DEFAULT_SAMPLE,
  SYSTEM_OPTIONS,
} from './constants';
import { convertBatch, type BatchRow } from './utils/coordinate';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface TableRow extends BatchRow {
  key: number;
  output: string;
}

/**
 * 坐标点保留 6 位小数的格式化
 *
 * @param value - 坐标分量
 * @returns 格式化文本
 */
function formatCoord(value: number | undefined): string {
  if (value === undefined) {
    return '';
  }
  return value.toFixed(6);
}

/**
 * WGS-84 / GCJ-02 / BD-09 坐标系互转器：支持批量「经度,纬度」行输入，
 * 中国境外坐标按通行实现不施加偏移。全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认批量输入
 * @returns 坐标系互转交互界面
 */
const CoordinateSystemConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [from, setFrom] = React.useState<CoordinateSystemEnum>(CoordinateSystemEnum.WGS84);
  const [to, setTo] = React.useState<CoordinateSystemEnum>(CoordinateSystemEnum.GCJ02);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_SAMPLE);

  const rows = React.useMemo<TableRow[]>(
    () =>
      convertBatch(input, from, to).map((row, index) => ({
        ...row,
        key: index,
        output: row.ok
          ? `${(row.lng ?? 0).toFixed(6)},${(row.lat ?? 0).toFixed(6)}`
          : '',
      })),
    [input, from, to],
  );

  const outputText = React.useMemo(
    () =>
      rows
        .map((row) =>
          row.ok
            ? `${(row.lng ?? 0).toFixed(6)},${(row.lat ?? 0).toFixed(6)}`
            : `# ${row.source} —— ${row.error ?? '转换失败'}`,
        )
        .join('\n'),
    [rows],
  );

  const successCount = rows.filter((row) => row.ok).length;

  /** 恢复默认示例 */
  const handleLoadSample = () => {
    setInput(DEFAULT_SAMPLE);
  };

  /** 清空输入 */
  const handleClear = () => {
    setInput('');
  };

  /** 复制批量结果 */
  const handleCopy = async () => {
    if (!outputText) {
      return;
    }
    try {
      await copyToClipboard(outputText);
      message.success('已复制转换结果');
    } catch {
      message.error('复制失败，请手动选择文本复制');
    }
  };

  const columns: ColumnsType<TableRow> = [
    { title: '原始输入（经度,纬度）', dataIndex: 'source', key: 'source' },
    {
      title: '转换后经度',
      dataIndex: 'lng',
      key: 'lng',
      render: (value: number | undefined, record) =>
        record.ok ? formatCoord(value) : <Tag color="red">错误</Tag>,
    },
    {
      title: '转换后纬度',
      dataIndex: 'lat',
      key: 'lat',
      render: (value: number | undefined, record) =>
        record.ok ? formatCoord(value) : record.error,
    },
    {
      title: '备注',
      dataIndex: 'outOfChina',
      key: 'outOfChina',
      render: (value: boolean | undefined, record) =>
        record.ok && value ? <Tag color="orange">境外未偏移</Tag> : null,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space size="large" wrap>
          <Space>
            <span>源坐标系</span>
            <Radio.Group
              value={from}
              onChange={(event) => setFrom(event.target.value as CoordinateSystemEnum)}
              optionType="button"
              buttonStyle="solid"
              options={SYSTEM_OPTIONS}
            />
          </Space>
          <Space>
            <span>目标坐标系</span>
            <Radio.Group
              value={to}
              onChange={(event) => setTo(event.target.value as CoordinateSystemEnum)}
              optionType="button"
              buttonStyle="solid"
              options={SYSTEM_OPTIONS}
            />
          </Space>
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleLoadSample}>
            载入示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            清空
          </Button>
          <Button
            type="primary"
            icon={<CopyOutlined />}
            onClick={handleCopy}
            disabled={!outputText}
          >
            复制结果
          </Button>
        </Space>
      </div>

      {from === to ? (
        <Alert
          type="info"
          showIcon
          message="源坐标系与目标坐标系相同，输出与输入一致"
        />
      ) : null}

      <div className={styles.panels}>
        <Card title="批量输入（每行「经度,纬度」）" className={styles.card}>
          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={'116.404,39.915\n121.4737,31.2304'}
            autoSize={{ minRows: 10, maxRows: 20 }}
            spellCheck={false}
            className={styles.editor}
          />
        </Card>

        <Card title="转换结果（可复制）" className={styles.card}>
          <Input.TextArea
            value={outputText}
            readOnly
            placeholder="转换结果将实时显示在这里"
            autoSize={{ minRows: 10, maxRows: 20 }}
            spellCheck={false}
            className={styles.editor}
          />
        </Card>
      </div>

      {rows.length > 0 ? (
        <Card title={`明细（成功 ${successCount} / ${rows.length} 行）`} className={styles.card}>
          <Table<TableRow>
            columns={columns}
            dataSource={rows}
            pagination={false}
            size="small"
            scroll={{ x: true }}
          />
        </Card>
      ) : null}

      <Alert
        className={styles.hint}
        type="warning"
        showIcon
        message="精度与使用说明"
        description={
          <ul className={styles.hintList}>
            <li>输入顺序为「经度,纬度」（与 GeoJSON、高德一致）；仅支持十进制经纬度。</li>
            <li>WGS-84 是 GPS / 国际标准，GCJ-02（火星坐标）用于高德、腾讯等国内地图，BD-09 用于百度地图。</li>
            <li>GCJ-02 没有官方逆算法，GCJ→WGS 采用通行减法近似，偏差通常在 1–2 米量级；WGS↔BD 经 GCJ-02 中转。</li>
            <li>矩形范围（经度 72.004–137.8347、纬度 0.8293–55.8271）外的坐标按通行实现原样返回。</li>
            <li>所有计算均在浏览器本地完成，坐标数据不会上传。</li>
          </ul>
        }
      />
    </div>
  );
};

export default CoordinateSystemConverter;
