'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  Space,
  Table,
  Tag,
  Upload,
  message,
} from 'antd';
import {
  ClearOutlined,
  CopyOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import { bytesToHex, hexToBytes, parsePcap, type PcapPacket } from './utils/pcap';
import { DEFAULT_PCAP_HEX, PCAP_PLACEHOLDER } from './constants';
import styles from './index.module.css';

const columns = [
  { title: '#', dataIndex: 'index', width: 56 },
  {
    title: '时间戳',
    dataIndex: 'timestamp',
    render: (value: string) => <span className={styles.monoText}>{value}</span>,
  },
  {
    title: '捕获 / 原始长度',
    key: 'length',
    width: 150,
    render: (_: unknown, record: PcapPacket) => (
      <span>
        {record.capturedLength} / {record.originalLength} 字节
        {record.truncated && (
          <Tag color="orange" style={{ marginLeft: 6 }}>
            截断
          </Tag>
        )}
      </span>
    ),
  },
];

/**
 * 经典 PCAP 抓包文件解析器，读取全局头与分组记录并展示原始字节，全部在浏览器本地完成
 */
const PcapParser: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [hexInput, setHexInput] = React.useState<string>(defaultInput || DEFAULT_PCAP_HEX);
  const [fileName, setFileName] = React.useState<string>('');
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  const parsed = React.useMemo(() => {
    try {
      return { file: parsePcap(hexToBytes(hexInput)), error: null as string | null };
    } catch (caught) {
      return { file: null, error: caught instanceof Error ? caught.message : '解析失败' };
    }
  }, [hexInput]);

  const selected = React.useMemo(() => {
    if (!parsed.file) {
      return null;
    }
    return parsed.file.packets.find((packet) => packet.index === selectedIndex) ?? null;
  }, [parsed.file, selectedIndex]);

  const copy = async (text: string): Promise<void> => {
    await copyToClipboard(text);
    message.success('已复制');
  };

  const loadDefault = (): void => {
    setHexInput(DEFAULT_PCAP_HEX);
    setFileName('');
    setSelectedIndex(null);
  };

  const handleFile = async (file: File): Promise<void> => {
    try {
      const buffer = await file.arrayBuffer();
      const bytes = Array.from(new Uint8Array(buffer));
      setHexInput(bytesToHex(bytes, 16));
      setFileName(file.name);
      setSelectedIndex(null);
      message.success(`已读取 ${file.name}（${bytes.length} 字节）`);
    } catch {
      message.error('读取文件失败');
    }
  };

  const pcapFile = parsed.file;

  return (
    <div className={styles.container}>
      <Card title="经典 PCAP 文件解析">
        <span className={styles.label}>PCAP 十六进制内容</span>
        <Input.TextArea
          value={hexInput}
          onChange={(event) => setHexInput(event.target.value)}
          rows={6}
          className={styles.inputArea}
          placeholder={PCAP_PLACEHOLDER}
        />
        <Space wrap style={{ margin: '10px 0' }}>
          <Upload
            accept=".pcap,.cap"
            showUploadList={false}
            beforeUpload={(file) => {
              void handleFile(file);
              return Upload.LIST_IGNORE;
            }}
          >
            <Button icon={<UploadOutlined />}>选择 .pcap 文件</Button>
          </Upload>
          <Button icon={<ReloadOutlined />} onClick={loadDefault}>
            载入示例
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              setHexInput('');
              setFileName('');
              setSelectedIndex(null);
            }}
          >
            清空
          </Button>
          {fileName && <span className={styles.hint}>当前文件：{fileName}</span>}
        </Space>

        {parsed.error ? (
          <Alert type="error" showIcon message="解析失败" description={parsed.error} />
        ) : (
          pcapFile && (
            <div className={styles.resultCard}>
              <Descriptions size="small" column={2} bordered>
                <Descriptions.Item label="Magic">{pcapFile.magic}</Descriptions.Item>
                <Descriptions.Item label="字节序">
                  {pcapFile.endianness === 'little' ? '小端（Little Endian）' : '大端（Big Endian）'}
                </Descriptions.Item>
                <Descriptions.Item label="版本">
                  {pcapFile.versionMajor}.{pcapFile.versionMinor}
                </Descriptions.Item>
                <Descriptions.Item label="时间戳精度">
                  {pcapFile.timestampResolution === 'nanosecond' ? '纳秒' : '微秒'}
                </Descriptions.Item>
                <Descriptions.Item label="时区修正 thiszone">
                  {pcapFile.thiszone}
                </Descriptions.Item>
                <Descriptions.Item label="sigfigs">{pcapFile.sigfigs}</Descriptions.Item>
                <Descriptions.Item label="Snaplen">{pcapFile.snapLength} 字节</Descriptions.Item>
                <Descriptions.Item label="链路类型">
                  {pcapFile.linkTypeName}（{pcapFile.linkType}）
                </Descriptions.Item>
                <Descriptions.Item label="文件长度">{pcapFile.fileLength} 字节</Descriptions.Item>
                <Descriptions.Item label="分组数量">
                  {pcapFile.totalPackets} 个
                  {pcapFile.omittedPackets > 0 && `（仅展示前 ${pcapFile.packets.length} 个）`}
                </Descriptions.Item>
              </Descriptions>

              {pcapFile.warnings.length > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  message={`解析告警（${pcapFile.warnings.length} 条）`}
                  description={
                    <ul className={styles.warningList}>
                      {pcapFile.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  }
                />
              )}

              <div>
                <span className={styles.label}>分组列表（点击行查看原始字节）</span>
                <Table
                  size="small"
                  className={styles.packetTable}
                  rowKey="index"
                  columns={columns}
                  dataSource={pcapFile.packets}
                  pagination={{ pageSize: 10, showSizeChanger: false }}
                  onRow={(record) => ({
                    onClick: () => setSelectedIndex(record.index),
                  })}
                  rowClassName={(record) =>
                    record.index === selectedIndex ? styles.selectedRow ?? '' : ''
                  }
                />
              </div>

              {selected ? (
                <div className={styles.hexBlock}>
                  <div className={styles.hexHeader}>
                    <span>
                      第 {selected.index} 个分组 · 时间 {selected.timestamp} · 捕获{' '}
                      {selected.capturedLength} 字节 / 原始 {selected.originalLength} 字节
                    </span>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copy(selected.dataHex)}
                    >
                      复制
                    </Button>
                  </div>
                  <code className={styles.hexText}>{selected.dataHex}</code>
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="选择一个分组以查看其原始字节"
                />
              )}
            </div>
          )
        )}
      </Card>

      <Alert
        type="info"
        showIcon
        message="PCAP 格式说明"
        description={
          <div className={styles.hint}>
            <p>
              经典 libpcap 文件由 24 字节全局头（magic、2 字节主/次版本、thiszone、sigfigs、
              snaplen、链路类型）与若干分组记录组成，每条记录前置 16 字节分组头：时间戳秒、
              时间戳小数部分（微秒或纳秒）、捕获长度与实际原始长度。
            </p>
            <p>
              Magic 0xA1B2C3D4 表示微秒精度，0xA1B23C4D 表示纳秒精度；字节序由 magic
              在文件中的排列决定。当原始长度大于捕获长度时，说明抓包过程被 snaplen 截断。
              本工具仅支持经典 PCAP，不解析 pcapng，所有运算均在本地浏览器完成。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default PcapParser;
