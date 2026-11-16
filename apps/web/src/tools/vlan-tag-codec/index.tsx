'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_INNER_FIELDS,
  DEFAULT_OUTER_FIELDS,
  DEFAULT_SINGLE_FIELDS,
  DEI_OPTIONS,
  LAYER_OPTIONS,
  MODE_OPTIONS,
  PARSE_MODE_OPTIONS,
  PCP_PRIORITY_NAMES,
  SAMPLE_FRAME_HEX,
  SAMPLE_QINQ_HEX,
  SAMPLE_TAG_HEX,
  TPID_OPTIONS,
} from './constants';
import styles from './index.module.css';
import {
  TPID_CTAG,
  VlanError,
  buildQinQ,
  buildTag,
  bytesToHex,
  hexToBytes,
  locateTagInFrame,
  parseQinQBytes,
  parseTagBytes,
  qinQToBytes,
  tagToBytes,
  tpidName,
  vidWarning,
  type FrameTagLocation,
  type TciFields,
  type VlanTag,
} from './utils/vlan';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

type Mode = 'build' | 'parse';
type Layer = 'single' | 'qinq';
type ParseMode = 'tag' | 'frame';

interface FieldEditorProps {
  title: string;
  value: TciFields;
  onChange: (next: TciFields) => void;
  tpid?: number;
  onTpidChange?: (tpid: number) => void;
}

function FieldEditor({ title, value, onChange, tpid, onTpidChange }: FieldEditorProps) {
  const warning = vidWarning(value.vid);
  return (
    <Card type="inner" size="small" title={title}>
      <Space wrap size="middle">
        <div>
          <span className={styles.label}>PCP（0–7）</span>
          <InputNumber
            min={0}
            max={7}
            value={value.pcp}
            onChange={(pcp) => onChange({ ...value, pcp: Number(pcp ?? 0) })}
            style={{ width: 110 }}
          />
        </div>
        <div>
          <span className={styles.label}>DEI（0/1）</span>
          <Select
            size="middle"
            value={value.dei}
            onChange={(dei) => onChange({ ...value, dei })}
            options={DEI_OPTIONS}
            style={{ width: 200 }}
          />
        </div>
        <div>
          <span className={styles.label}>VID（0–4095）</span>
          <InputNumber
            min={0}
            max={4095}
            value={value.vid}
            onChange={(vid) => onChange({ ...value, vid: Number(vid ?? 0) })}
            style={{ width: 130 }}
          />
        </div>
        {tpid !== undefined && onTpidChange ? (
          <div>
            <span className={styles.label}>TPID</span>
            <Select
              value={tpid}
              onChange={onTpidChange}
              options={TPID_OPTIONS}
              style={{ width: 240 }}
            />
          </div>
        ) : null}
      </Space>
      <div className={styles.pcpName}>
        PCP {value.pcp}：{PCP_PRIORITY_NAMES[value.pcp]?.acronym} ——{' '}
        {PCP_PRIORITY_NAMES[value.pcp]?.name}
      </div>
      {warning ? <Alert type="warning" showIcon message={warning} className={styles.inlineAlert} /> : null}
    </Card>
  );
}

function TagDescriptions({ tag, layerLabel }: { tag: VlanTag; layerLabel: string }) {
  const pcpInfo = PCP_PRIORITY_NAMES[tag.pcp];
  return (
    <Descriptions size="small" column={2} bordered title={layerLabel}>
      <Descriptions.Item label="TPID">
        <Tag>0x{tag.tpidHex}</Tag>
        {tpidName(tag.tpid)}
      </Descriptions.Item>
      <Descriptions.Item label="TCI（16 bit）">
        <Text code>0x{tag.tciHex}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="PCP（3 bit）">
        {tag.pcp}
        <span className={styles.pcpName}>
          （{pcpInfo?.acronym} —— {pcpInfo?.name}）
        </span>
      </Descriptions.Item>
      <Descriptions.Item label="DEI（1 bit）">{tag.dei}</Descriptions.Item>
      <Descriptions.Item label="VID（12 bit）">
        {tag.vid}
        {vidWarning(tag.vid) ? <Tag color="warning" className={styles.inlineTag}>保留值</Tag> : null}
      </Descriptions.Item>
      <Descriptions.Item label="标签 hex（4 字节）">
        <Text code>{bytesToHex(tagToBytes(tag), true)}</Text>
      </Descriptions.Item>
    </Descriptions>
  );
}

export default function VlanTagCodecTool(_props: ToolComponentProps) {
  const [mode, setMode] = useState<Mode>('build');
  const [layer, setLayer] = useState<Layer>('single');
  const [singleFields, setSingleFields] = useState<TciFields>(DEFAULT_SINGLE_FIELDS);
  const [singleTpid, setSingleTpid] = useState<number>(TPID_CTAG);
  const [outerFields, setOuterFields] = useState<TciFields>(DEFAULT_OUTER_FIELDS);
  const [innerFields, setInnerFields] = useState<TciFields>(DEFAULT_INNER_FIELDS);
  const [parseMode, setParseMode] = useState<ParseMode>('tag');
  const [parseInput, setParseInput] = useState(SAMPLE_TAG_HEX);

  const built = useMemo(() => {
    try {
      if (layer === 'single') {
        const tag = buildTag(singleFields, singleTpid);
        return { hex: bytesToHex(tagToBytes(tag), true), error: null as string | null };
      }
      const pair = buildQinQ(outerFields, innerFields);
      return { hex: bytesToHex(qinQToBytes(pair), true), error: null as string | null };
    } catch (error) {
      return { hex: null, error: error instanceof VlanError ? error.message : '构造失败' };
    }
  }, [layer, singleFields, singleTpid, outerFields, innerFields]);

  const parsed = useMemo<{
    tags: VlanTag[];
    location: FrameTagLocation | null;
    error: string | null;
  }>(() => {
    if (!parseInput.trim()) {
      return { tags: [], location: null, error: null };
    }
    try {
      const bytes = hexToBytes(parseInput);
      if (parseMode === 'frame') {
        const location = locateTagInFrame(bytes);
        return { tags: location.tags, location, error: null };
      }
      if (layer === 'qinq') {
        const pair = parseQinQBytes(bytes);
        return { tags: [pair.outer, pair.inner], location: null, error: null };
      }
      return { tags: [parseTagBytes(bytes)], location: null, error: null };
    } catch (error) {
      return { tags: [], location: null, error: error instanceof VlanError ? error.message : '解析失败' };
    }
  }, [parseInput, parseMode, layer]);

  const handleCopy = async (text: string, label: string) => {
    try {
      await copyToClipboard(text);
      message.success(`${label}已复制`);
    } catch {
      message.error('复制失败，请手动选择文本复制');
    }
  };

  const fillParseExample = () => {
    if (parseMode === 'frame') {
      setParseInput(SAMPLE_FRAME_HEX);
      return;
    }
    setParseInput(layer === 'qinq' ? SAMPLE_QINQ_HEX : SAMPLE_TAG_HEX);
  };

  const bitLayoutColumns = [
    { title: '字段', dataIndex: 'field', key: 'field' },
    { title: '位宽', dataIndex: 'bits', key: 'bits' },
    { title: '取值范围', dataIndex: 'range', key: 'range' },
    {
      title: '当前值',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => <Text code>{value}</Text>,
    },
  ];

  const layoutFields = layer === 'single' ? singleFields : outerFields;

  return (
    <div className={styles.container}>
      <Radio.Group
        value={mode}
        onChange={(event) => setMode(event.target.value as Mode)}
        optionType="button"
        buttonStyle="solid"
        options={MODE_OPTIONS}
      />
      <Radio.Group
        value={layer}
        onChange={(event) => setLayer(event.target.value as Layer)}
        optionType="button"
        options={LAYER_OPTIONS}
      />

      {mode === 'build' ? (
        <>
          {layer === 'single' ? (
            <FieldEditor
              title="单层 802.1Q 标签字段"
              value={singleFields}
              onChange={setSingleFields}
              tpid={singleTpid}
              onTpidChange={setSingleTpid}
            />
          ) : (
            <Space direction="vertical" className="w-full" size={12}>
              <FieldEditor title="外层 S-TAG（TPID 固定 0x88A8）" value={outerFields} onChange={setOuterFields} />
              <FieldEditor title="内层 C-TAG（TPID 固定 0x8100）" value={innerFields} onChange={setInnerFields} />
            </Space>
          )}

          {built.error ? (
            <Alert type="error" showIcon message="构造失败" description={built.error} />
          ) : built.hex ? (
            <Card size="small" title="构造输出">
              <Space direction="vertical" className="w-full" size={10}>
                <div className={styles.hexBlock}>
                  <div className={styles.hexHeader}>
                    <span>
                      {layer === 'single' ? '4 字节标签 hex（大端）' : '8 字节 QinQ 标签 hex（外→内）'}
                    </span>
                    <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(built.hex ?? '', '标签 hex')}>
                      复制
                    </Button>
                  </div>
                  <div className={styles.hexText}>{built.hex}</div>
                </div>
                <Table
                  size="small"
                  pagination={false}
                  columns={bitLayoutColumns}
                  dataSource={[
                    { key: 'pcp', field: 'PCP（802.1p 优先级）', bits: '3 bit', range: '0–7', value: layoutFields.pcp },
                    { key: 'dei', field: 'DEI（丢弃资格）', bits: '1 bit', range: '0/1', value: layoutFields.dei },
                    { key: 'vid', field: 'VID（VLAN 标识符）', bits: '12 bit', range: '0–4095', value: layoutFields.vid },
                  ]}
                />
              </Space>
            </Card>
          ) : null}
        </>
      ) : (
        <Card size="small" title="粘贴待解析的标签或以太网帧">
          <Space direction="vertical" className="w-full" size={10}>
            <Radio.Group
              value={parseMode}
              onChange={(event) => setParseMode(event.target.value as ParseMode)}
              optionType="button"
              size="small"
              options={PARSE_MODE_OPTIONS}
            />
            <TextArea
              value={parseInput}
              onChange={(event) => setParseInput(event.target.value)}
              rows={5}
              className={styles.inputArea}
              placeholder={
                parseMode === 'frame'
                  ? '粘贴完整以太网帧 hex，工具在源 MAC 之后（字节偏移 12）定位 TPID'
                  : layer === 'qinq'
                    ? '粘贴 8 字节 QinQ 标签 hex（外层 0x88A8 + 内层 0x8100）'
                    : '粘贴 4 字节单层标签 hex（如 81 00 B0 64）'
              }
            />
            <Space wrap>
              <Button size="small" onClick={fillParseExample}>
                填充示例
              </Button>
              <Button size="small" onClick={() => setParseInput('')}>
                清空
              </Button>
            </Space>

            {parsed.error ? (
              <Alert type="error" showIcon message="解析失败" description={parsed.error} />
            ) : null}

            {parsed.location ? (
              <Descriptions size="small" column={2} bordered>
                <Descriptions.Item label="标签起始字节偏移">{parsed.location.tagOffset}</Descriptions.Item>
                <Descriptions.Item label="标签层数">
                  <Tag color="blue">{parsed.location.layers} 层（{parsed.location.layers === 2 ? 'QinQ' : '单层'}）</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="标签后 EtherType">
                  <Text code>0x{parsed.location.followingEtherTypeHex}</Text>
                </Descriptions.Item>
              </Descriptions>
            ) : null}

            {parsed.tags.map((tag, index) => (
              <TagDescriptions
                key={`${tag.tpidHex}-${index}`}
                tag={tag}
                layerLabel={
                  parsed.tags.length > 1
                    ? index === 0
                      ? '外层 S-TAG'
                      : '内层 C-TAG'
                    : '802.1Q 标签'
                }
              />
            ))}
          </Space>
        </Card>
      )}

      <Card size="small" title="PCP 802.1p 服务等级名称表">
        <Table
          size="small"
          pagination={false}
          rowKey="value"
          dataSource={PCP_PRIORITY_NAMES as unknown as { value: number; name: string; acronym: string }[]}
          columns={[
            { title: 'PCP', dataIndex: 'value', key: 'value' },
            { title: '英文名称', dataIndex: 'acronym', key: 'acronym' },
            { title: '中文含义', dataIndex: 'name', key: 'name' },
          ]}
        />
      </Card>

      <Title level={5} className="!mb-0">工作原理</Title>
      <Paragraph type="secondary" className={styles.hint}>
        802.1Q 在源 MAC 与 EtherType 之间插入 4 字节标签：2 字节 TPID（固定 0x8100）加 2 字节 TCI。
        TCI 高 3 位为 PCP 优先级、第 4 位为 DEI 丢弃资格、低 12 位为 VID（0 与 4095 保留）。
        QinQ（802.1ad）再叠加一层 S-TAG（TPID 0x88A8，旧设备可能用 0x9100），共 8 字节，解析顺序外→内。
        全部为定长位域运算，均在浏览器本地完成。
      </Paragraph>
    </div>
  );
}
