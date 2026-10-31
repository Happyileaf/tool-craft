'use client';

import React from 'react';
import { Alert, Button, Card, Checkbox, Input, Space, Statistic, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClearOutlined, EyeOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  CONTROL_PICTURES,
  MAX_TABLE_ROWS,
  SAMPLE_COMBINING,
  SAMPLE_EMOJI,
  SAMPLE_INVISIBLE,
} from './constants';
import {
  inspectText,
  normalizeCompare,
  summarizeEncoding,
  type CharInfo,
} from './utils/unicode-inspect';
import styles from './index.module.css';

/** 归一化卡片展示的一项 */
interface NormalFormItem {
  form: string;
  text: string;
  codePointCount: number;
  utf8Bytes: number;
  differs: boolean;
}

/**
 * Unicode 字符检查器：按码点逐字符检视文本，展示码点、手写 UTF-8 / UTF-16 编码、
 * General_Category、字符名，并高亮零宽字符、bidi 控制符、BOM、控制符等不可见 / 特殊字符；
 * 同时提供 NFC / NFD / NFKC / NFKD 归一化对比。所有计算均在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns Unicode 字符检视界面
 */
const UnicodeCharacterInspector: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [text, setText] = React.useState<string>(defaultInput || SAMPLE_INVISIBLE);
  const [onlyFlagged, setOnlyFlagged] = React.useState<boolean>(false);

  const records = React.useMemo(() => inspectText(text), [text]);
  const summary = React.useMemo(() => summarizeEncoding(text), [text]);
  const flaggedCount = React.useMemo(() => records.filter((r) => r.flagged).length, [records]);
  const comparison = React.useMemo(() => normalizeCompare(text), [text]);

  const normalForms: NormalFormItem[] = React.useMemo(() => {
    const forms: Array<{ form: string; value: string }> = [
      { form: 'NFC', value: comparison.nfc },
      { form: 'NFD', value: comparison.nfd },
      { form: 'NFKC', value: comparison.nfkc },
      { form: 'NFKD', value: comparison.nfkd },
    ];
    return forms.map(({ form, value }) => ({
      form,
      text: value,
      ...summarizeEncoding(value),
      differs: comparison.differs.includes(form),
    }));
  }, [comparison]);

  const visibleRecords = React.useMemo(
    () => (onlyFlagged ? records.filter((r) => r.flagged) : records),
    [records, onlyFlagged],
  );
  const truncated = visibleRecords.length > MAX_TABLE_ROWS;
  const tableRecords = truncated ? visibleRecords.slice(0, MAX_TABLE_ROWS) : visibleRecords;

  /**
   * 渲染字符列：C0/DEL 控制符显示控制图形符占位，其余不可见字符显示标签占位。
   *
   * @param record - 字符检视记录
   * @returns 占位后的字符展示
   */
  const renderCharCell = (record: CharInfo): React.ReactNode => {
    const picture = CONTROL_PICTURES[record.codePoint];
    if (picture) {
      return (
        <Tooltip title={record.flagReason}>
          <span className={styles.charPlaceholder}>{picture}</span>
        </Tooltip>
      );
    }
    if (record.flagged) {
      return (
        <Space size={4}>
          <span className={styles.charInvisible}>{record.char}</span>
          <Tag color="red" className={styles.invisibleTag}>
            隐形
          </Tag>
        </Space>
      );
    }
    return <span className={styles.charNormal}>{record.char}</span>;
  };

  const columns: ColumnsType<CharInfo> = [
    {
      title: '字符',
      key: 'char',
      width: 110,
      render: (_, record) => renderCharCell(record),
    },
    {
      title: '码点',
      dataIndex: 'hex',
      key: 'hex',
      width: 110,
      render: (value: string) => (
        <Typography.Text code copyable={{ text: value }} className={styles.mono}>
          {value}
        </Typography.Text>
      ),
    },
    {
      title: 'UTF-8',
      dataIndex: 'utf8Hex',
      key: 'utf8',
      width: 150,
      render: (value: string) => <span className={styles.mono}>{value}</span>,
    },
    {
      title: 'UTF-16',
      dataIndex: 'utf16Hex',
      key: 'utf16',
      width: 150,
      render: (value: string) => <span className={styles.mono}>{value}</span>,
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 90,
      render: (value: string, record) => (
        <Tag color={record.flagged ? 'volcano' : 'default'} className={styles.mono}>
          {value}
        </Tag>
      ),
    },
    {
      title: '字符名 / 说明',
      key: 'name',
      render: (_, record) =>
        record.flagged ? (
          <span className={styles.flagReason}>{record.flagReason}</span>
        ) : (
          <span>{record.name}</span>
        ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card title="输入文本">
        <Input.TextArea
          value={text}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setText(event.target.value)}
          placeholder="粘贴需要逐字符检视的文本，自动检测零宽字符、bidi 控制符、BOM 等不可见字符..."
          rows={10}
          autoSize={{ minRows: 6, maxRows: 18 }}
          spellCheck={false}
          className={styles.monoArea}
        />
        <div className={styles.toolbar}>
          <Space wrap>
            <Button size="small" onClick={() => setText(SAMPLE_INVISIBLE)}>
              零宽字符示例
            </Button>
            <Button size="small" onClick={() => setText(SAMPLE_EMOJI)}>
              emoji 代理对示例
            </Button>
            <Button size="small" onClick={() => setText(SAMPLE_COMBINING)}>
              组合音标示例
            </Button>
            <Button size="small" icon={<ClearOutlined />} onClick={() => setText('')}>
              清空
            </Button>
          </Space>
        </div>
        <Alert
          className={styles.alert}
          type={flaggedCount > 0 ? 'warning' : 'success'}
          showIcon
          message={
            flaggedCount > 0
              ? `检测到 ${flaggedCount} 个不可见/特殊字符，请查看下方红色高亮行`
              : '未检测到不可见/特殊字符'
          }
        />
        <div className={styles.metrics}>
          <Statistic title="总码点数" value={summary.codePointCount} />
          <Statistic title="UTF-8 字节" value={summary.utf8Bytes} />
          <Statistic title="UTF-16 码元" value={text.length} />
          <Statistic title="可疑字符" value={flaggedCount} valueStyle={{ color: flaggedCount > 0 ? '#cf1322' : undefined }} />
        </div>
      </Card>

      <Card
        title="逐字符检视"
        extra={
          <Checkbox checked={onlyFlagged} onChange={(event) => setOnlyFlagged(event.target.checked)}>
            仅显示可疑字符
          </Checkbox>
        }
      >
        {visibleRecords.length === 0 ? (
          <div className={styles.emptyHint}>
            {text ? '没有可显示的可疑字符' : '输入文本后自动逐字符检视'}
          </div>
        ) : (
          <>
            {truncated && (
              <Alert
                className={styles.alert}
                type="info"
                showIcon
                message={`结果共 ${visibleRecords.length} 个码点，为避免卡顿仅展示前 ${MAX_TABLE_ROWS} 行（统计数字不受影响）`}
              />
            )}
            <Table<CharInfo>
              rowKey={(record) => `${record.index}-${record.hex}`}
              columns={columns}
              dataSource={tableRecords}
              size="small"
              scroll={{ x: 820 }}
              rowClassName={(record) => (record.flagged ? (styles.flaggedRow ?? '') : '')}
              pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }}
              expandable={{
                expandedRowRender: (record) => (
                  <div className={styles.expandDetail}>
                    <div>
                      <EyeOutlined /> 原始字符的 JSON 转义：
                      <code className={styles.jsonCode}>{JSON.stringify(record.char)}</code>
                    </div>
                    <pre className={styles.jsonPre}>{JSON.stringify(record, null, 2)}</pre>
                  </div>
                ),
              }}
            />
          </>
        )}
        <div className={styles.hint}>
          按码点（for...of）迭代，emoji 等增补平面字符不会被拆成孤立代理；UTF-8 为手写编码函数计算，
          不依赖 TextEncoder；类别用 Unicode 属性转义推断。C0/C1 控制符以 ␀␉␊ 等控制图形符占位显示。
        </div>
      </Card>

      <Card title="归一化对比（NFC / NFD / NFKC / NFKD）">
        <div className={styles.normalizeGrid}>
          {normalForms.map((item) => (
            <div key={item.form} className={styles.normalizeItem}>
              <div className={styles.normalizeHead}>
                <Tag color={item.differs ? 'orange' : 'green'}>{item.form}</Tag>
                {item.differs ? (
                  <span className={styles.differsText}>与原文不同</span>
                ) : (
                  <span className={styles.sameText}>与原文一致</span>
                )}
              </div>
              <div className={styles.normalizeText}>{item.text || <span className={styles.emptyHint}>（空）</span>}</div>
              <div className={styles.normalizeMeta}>
                码点 {item.codePointCount} · UTF-8 {item.utf8Bytes} 字节
              </div>
            </div>
          ))}
        </div>
        <div className={styles.hint}>
          NFC/NFD 为规范合成 / 分解（如组合重音 é 与 e + U+0301）；NFKC/NFKD 额外做兼容折叠
          （如全角 Ａ → A）。差异仅按码元序列比较。
        </div>
      </Card>
    </div>
  );
};

export default UnicodeCharacterInspector;
