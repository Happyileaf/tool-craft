'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Input,
  InputNumber,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import {
  ClearOutlined,
  CopyOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  buildRtpPacket,
  parseRtpPacket,
  type RtpLayerOffset,
} from './utils/rtp';
import { DEFAULT_RTP_HEX, LAYER_META, RTP_PLACEHOLDER, STATIC_PAYLOAD_TYPES } from './constants';
import styles from './index.module.css';

const csrcColumns = [
  { title: '#', dataIndex: 'index', width: 60 },
  {
    title: 'CSRC（十进制）',
    dataIndex: 'value',
    render: (value: number) => (
      <span className={styles.monoValue}>
        {value}（0x{value.toString(16).padStart(8, '0').toUpperCase()}）
      </span>
    ),
  },
];

const RtpHeaderCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [hexInput, setHexInput] = React.useState<string>(defaultInput || DEFAULT_RTP_HEX);
  const [allowBadVersion, setAllowBadVersion] = React.useState(false);

  const parsed = React.useMemo(() => {
    try {
      return { packet: parseRtpPacket(hexInput, { allowBadVersion }), error: null as string | null };
    } catch (caught) {
      return { packet: null, error: caught instanceof Error ? caught.message : '解析失败' };
    }
  }, [hexInput, allowBadVersion]);

  const [version, setVersion] = React.useState(2);
  const [marker, setMarker] = React.useState(true);
  const [padding, setPadding] = React.useState(false);
  const [extension, setExtension] = React.useState(false);
  const [payloadType, setPayloadType] = React.useState(96);
  const [sequenceNumber, setSequenceNumber] = React.useState(1);
  const [timestamp, setTimestamp] = React.useState(13);
  const [ssrc, setSsrc] = React.useState(5);
  const [csrcList, setCsrcList] = React.useState<number[]>([]);
  const [extProfile, setExtProfile] = React.useState('BEDE');
  const [extDataHex, setExtDataHex] = React.useState('DE AD BE EF');
  const [paddingLength, setPaddingLength] = React.useState(1);
  const [buildPayloadHex, setBuildPayloadHex] = React.useState('AA BB');

  const built = React.useMemo(() => {
    try {
      const output = buildRtpPacket({
        version,
        marker,
        padding,
        extension,
        payloadType,
        sequenceNumber,
        timestamp,
        ssrc,
        csrc: csrcList,
        headerExtension: extension ? { profile: parseInt(extProfile, 16) || 0, dataHex: extDataHex } : undefined,
        paddingLength: padding ? paddingLength : undefined,
        payloadHex: buildPayloadHex,
      });
      return { output, error: null as string | null };
    } catch (caught) {
      return { output: null, error: caught instanceof Error ? caught.message : '构造失败' };
    }
  }, [
    version,
    marker,
    padding,
    extension,
    payloadType,
    sequenceNumber,
    timestamp,
    ssrc,
    csrcList,
    extProfile,
    extDataHex,
    paddingLength,
    buildPayloadHex,
  ]);

  const copy = async (text: string): Promise<void> => {
    await copyToClipboard(text);
    message.success('已复制');
  };

  const packet = parsed.packet;
  const layerColumns = [
    { title: '分层', dataIndex: 'layer', key: 'layer', width: 180,
      render: (layer: RtpLayerOffset['layer']) => {
        const meta = LAYER_META[layer] ?? { label: layer, color: 'default' };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    { title: '起始偏移', dataIndex: 'start', key: 'start', width: 100 },
    { title: '结束偏移（不含）', dataIndex: 'end', key: 'end', width: 130 },
    { title: '长度（字节）', dataIndex: 'length', key: 'length', width: 110 },
  ];

  return (
    <div className={styles.container}>
      <Card title="RTP 报文头解析（RFC 3550 §5.1）">
        <span className={styles.label}>RTP 报文十六进制</span>
        <Input.TextArea
          value={hexInput}
          onChange={(event) => setHexInput(event.target.value)}
          rows={5}
          className={styles.inputArea}
          placeholder={RTP_PLACEHOLDER}
        />
        <Space wrap style={{ margin: '10px 0' }}>
          <Checkbox
            checked={allowBadVersion}
            onChange={(event) => setAllowBadVersion(event.target.checked)}
          >
            允许非 V2 教学向量
          </Checkbox>
          <Button icon={<ReloadOutlined />} onClick={() => setHexInput(DEFAULT_RTP_HEX)}>
            载入标准示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setHexInput('')}>
            清空
          </Button>
        </Space>

        {parsed.error ? (
          <Alert type="error" showIcon message="解析失败" description={parsed.error} />
        ) : (
          packet && (
            <div className={styles.resultCard}>
              {packet.warnings.length > 0 && (
                <Alert type="warning" showIcon message="解析告警" description={packet.warnings.join('；')} />
              )}
              <Descriptions size="small" column={2} bordered>
                <Descriptions.Item label="版本 V">{packet.version}</Descriptions.Item>
                <Descriptions.Item label="填充 P">
                  <Tag color={packet.padding ? 'orange' : 'default'}>{packet.padding}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="扩展 X">
                  <Tag color={packet.extension ? 'cyan' : 'default'}>{packet.extension}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="CSRC 计数 CC">{packet.cc}</Descriptions.Item>
                <Descriptions.Item label="标记 M">
                  <Tag color={packet.marker ? 'red' : 'default'}>{packet.marker}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="载荷类型 PT">
                  <Space wrap>
                    <span>{packet.payloadType}</span>
                    <Tag color="blue">{packet.payloadTypeName}</Tag>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="序列号">
                  {packet.sequenceNumber}（0x
                  {packet.sequenceNumber.toString(16).padStart(4, '0').toUpperCase()}）
                </Descriptions.Item>
                <Descriptions.Item label="时间戳">
                  {packet.timestamp}（0x
                  {packet.timestamp.toString(16).padStart(8, '0').toUpperCase()}）
                </Descriptions.Item>
                <Descriptions.Item label="SSRC" span={2}>
                  <span className={styles.monoValue}>
                    {packet.ssrc}（0x{packet.ssrc.toString(16).padStart(8, '0').toUpperCase()}）
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="载荷起始偏移">{packet.payloadOffset} 字节</Descriptions.Item>
                <Descriptions.Item label="填充长度">{packet.paddingLength} 字节</Descriptions.Item>
              </Descriptions>

              {packet.csrc.length > 0 && (
                <div>
                  <span className={styles.label}>CSRC 贡献源列表（{packet.csrc.length} 项）</span>
                  <Table
                    size="small"
                    rowKey={(record) => `csrc-${record.index}`}
                    pagination={false}
                    columns={csrcColumns}
                    dataSource={packet.csrc.map((value, index) => ({ index, value }))}
                  />
                </div>
              )}

              {packet.headerExtension && (
                <div>
                  <span className={styles.label}>扩展头（起始字节偏移 {packet.headerExtension.byteOffset}）</span>
                  <Descriptions size="small" column={1} bordered>
                    <Descriptions.Item label="Profile-specific">
                      <span className={styles.monoValue}>
                        0x{packet.headerExtension.profile.toString(16).padStart(4, '0').toUpperCase()}
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Length（32 位字计数）">
                      {packet.headerExtension.lengthWords}（扩展数据 {packet.headerExtension.lengthWords * 4} 字节）
                    </Descriptions.Item>
                    <Descriptions.Item label="扩展数据">
                      <code className={styles.monoValue}>{packet.headerExtension.dataHex || '（空）'}</code>
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              )}

              <div className={styles.hexBlock}>
                <div className={styles.hexHeader}>
                  <span>载荷（payloadOffset = {packet.payloadOffset}，每 16 字节一组）</span>
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copy(packet.payloadHex)}>
                    复制
                  </Button>
                </div>
                <code className={styles.hexText}>{packet.payloadHex || '（无载荷）'}</code>
              </div>

              {packet.paddingLength > 0 && (
                <div className={styles.hexBlock}>
                  <div className={styles.hexHeader}>
                    <span>填充（{packet.paddingLength} 字节，末字节为填充长度）</span>
                    <Button size="small" icon={<CopyOutlined />} onClick={() => copy(packet.paddingHex)}>
                      复制
                    </Button>
                  </div>
                  <code className={styles.hexText}>{packet.paddingHex}</code>
                </div>
              )}

              <div>
                <span className={styles.label}>分层偏移</span>
                <Table
                  size="small"
                  rowKey={(record: RtpLayerOffset) => `${record.layer}-${record.start}`}
                  pagination={false}
                  columns={layerColumns}
                  dataSource={packet.layerOffsets}
                />
              </div>
            </div>
          )
        )}
      </Card>

      <Card title="RTP 报文构造器">
        <div className={styles.fieldRow}>
          <div>
            <span className={styles.label}>版本 V（0–3，标准为 2）</span>
            <InputNumber
              min={0}
              max={3}
              precision={0}
              value={version}
              onChange={(value) => setVersion(value ?? 2)}
              style={{ width: 100 }}
            />
          </div>
          <div>
            <span className={styles.label}>载荷类型 PT（0–127）</span>
            <InputNumber
              min={0}
              max={127}
              precision={0}
              value={payloadType}
              onChange={(value) => setPayloadType(value ?? 0)}
              style={{ width: 120 }}
            />
          </div>
          <div>
            <span className={styles.label}>序列号（十进制，0–65535）</span>
            <InputNumber
              min={0}
              max={65535}
              precision={0}
              value={sequenceNumber}
              onChange={(value) => setSequenceNumber(value ?? 0)}
              style={{ width: 140 }}
            />
          </div>
        </div>

        <div className={styles.fieldRow} style={{ marginTop: 12 }}>
          <div>
            <span className={styles.label}>时间戳（十进制，uint32）</span>
            <InputNumber
              min={0}
              max={4294967295}
              precision={0}
              value={timestamp}
              onChange={(value) => setTimestamp(value ?? 0)}
              style={{ width: 170 }}
            />
          </div>
          <div>
            <span className={styles.label}>SSRC（十进制，uint32）</span>
            <InputNumber
              min={0}
              max={4294967295}
              precision={0}
              value={ssrc}
              onChange={(value) => setSsrc(value ?? 0)}
              style={{ width: 170 }}
            />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <span className={styles.label}>标志位</span>
          <Space wrap>
            <Checkbox checked={marker} onChange={(event) => setMarker(event.target.checked)}>
              M 标记位
            </Checkbox>
            <Checkbox checked={padding} onChange={(event) => setPadding(event.target.checked)}>
              P 填充
            </Checkbox>
            <Checkbox checked={extension} onChange={(event) => setExtension(event.target.checked)}>
              X 扩展头
            </Checkbox>
            <Tag>CC = {csrcList.length}（由下方 CSRC 列表自动计算，上限 15）</Tag>
          </Space>
        </div>

        <div style={{ marginTop: 12 }}>
          <Space wrap style={{ marginBottom: 8 }}>
            <span className={styles.label} style={{ marginBottom: 0 }}>
              CSRC 列表（每项 uint32，十进制）
            </span>
            <Button
              size="small"
              icon={<PlusOutlined />}
              disabled={csrcList.length >= 15}
              onClick={() => setCsrcList((previous) => [...previous, 0])}
            >
              新增 CSRC
            </Button>
          </Space>
          <div className={styles.csrcList}>
            {csrcList.map((item, index) => (
              <Space key={index} className={styles.csrcItem}>
                <Tag>#{index}</Tag>
                <InputNumber
                  min={0}
                  max={4294967295}
                  precision={0}
                  value={item}
                  onChange={(value) =>
                    setCsrcList((previous) =>
                      previous.map((current, currentIndex) =>
                        currentIndex === index ? value ?? 0 : current,
                      ),
                    )
                  }
                  style={{ width: 180 }}
                />
                <Button
                  size="small"
                  danger
                  icon={<MinusCircleOutlined />}
                  onClick={() =>
                    setCsrcList((previous) => previous.filter((_, currentIndex) => currentIndex !== index))
                  }
                >
                  删除
                </Button>
              </Space>
            ))}
            {csrcList.length === 0 && <span className={styles.emptyHint}>（无 CSRC）</span>}
          </div>
        </div>

        {extension && (
          <div className={styles.fieldRow} style={{ marginTop: 12 }}>
            <div>
              <span className={styles.label}>扩展头 Profile（十六进制，16 位）</span>
              <Input
                value={extProfile}
                onChange={(event) => setExtProfile(event.target.value)}
                className={styles.monoInput}
                style={{ width: 140 }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <span className={styles.label}>扩展数据十六进制（字节数须为 4 的倍数）</span>
              <Input
                value={extDataHex}
                onChange={(event) => setExtDataHex(event.target.value)}
                className={styles.monoInput}
              />
            </div>
          </div>
        )}

        <div className={styles.fieldRow} style={{ marginTop: 12 }}>
          <div>
            <span className={styles.label}>填充长度（P=1 时生效，1–255）</span>
            <InputNumber
              min={1}
              max={255}
              precision={0}
              disabled={!padding}
              value={paddingLength}
              onChange={(value) => setPaddingLength(value ?? 1)}
              style={{ width: 140 }}
            />
          </div>
        </div>

        <span className={styles.label} style={{ marginTop: 12 }}>
          载荷十六进制（可留空）
        </span>
        <Input.TextArea
          value={buildPayloadHex}
          onChange={(event) => setBuildPayloadHex(event.target.value)}
          rows={3}
          className={styles.inputArea}
        />

        {built.error ? (
          <Alert style={{ marginTop: 12 }} type="error" showIcon message="构造失败" description={built.error} />
        ) : (
          built.output && (
            <div className={styles.hexBlock} style={{ marginTop: 12 }}>
              <div className={styles.hexHeader}>
                <span>
                  RTP 报文 {built.output.totalLength} 字节
                  {built.output.warnings.length > 0 && `（告警：${built.output.warnings.join('；')}）`}
                </span>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copy(built.output!.hex)}>
                  复制
                </Button>
              </div>
              <code className={styles.hexText}>{built.output.hex}</code>
            </div>
          )
        )}
      </Card>

      <Alert
        type="info"
        showIcon
        message="RFC 3550 RTP 固定头布局与字段语义"
        description={
          <div className={styles.hint}>
            <pre className={styles.diagram}>
{`字节 0:  V V P X C C C C      字节 1:  M P P P P P P P
字节 2-3:  Sequence Number (16, 大端)
字节 4-7:  Timestamp (32, 大端)
字节 8-11: SSRC (32, 大端)
字节 12..: CC×4 字节 CSRC 数组 → X=1 时扩展头 → 载荷 → P=1 时尾部填充`}
            </pre>
            <p>
              所有多字节字段均为大端序。X=1 时扩展头由 16 位 profile-specific、16 位
              length（扩展数据的 32 位字计数，不含扩展头自身 4 字节）与扩展数据组成；P=1
              时报文末尾若干字节为填充，最后一个字节记录填充总长度（含该字节本身），解析时从载荷中剥离。
            </p>
            <p>
              静态 PT 表示例：
              {Object.entries(STATIC_PAYLOAD_TYPES)
                .map(([pt, name]) => `${pt}=${name}`)
                .join('、')}
              ；PT 96–127 为动态载荷范围，由带外信令（如 SDP）协商；其余编号未分配或保留。
            </p>
            <p>本工具所有解析与构造均在浏览器本地完成，不上传任何报文数据。</p>
          </div>
        }
      />
    </div>
  );
};

export default RtpHeaderCodec;
