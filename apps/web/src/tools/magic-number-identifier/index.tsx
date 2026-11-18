'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, Space, Table, Tabs, Tag, Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { ClearOutlined, InboxOutlined } from '@ant-design/icons';
import { identifyFile, identifyHexDump } from './utils/magic';
import type { IdentifyResult } from './utils/magic';
import { MAGIC_SIGNATURES, SAMPLE_HEX_DUMP } from './constants';
import styles from './index.module.css';

const READ_LIMIT = 64;

/** Hex 输入识别面板 */
const HexPanel: React.FC = () => {
  const [raw, setRaw] = React.useState(SAMPLE_HEX_DUMP);

  const result: IdentifyResult = React.useMemo(() => {
    try {
      return identifyHexDump(raw, MAGIC_SIGNATURES);
    } catch (error) {
      return { matches: [], reason: (error as Error).message, previewHex: '' };
    }
  }, [raw]);

  const columns = [
    { title: '文件类型', dataIndex: 'name', width: 220 },
    {
      title: '扩展名',
      dataIndex: 'extensions',
      render: (extensions: string[]) => (
        <Space wrap size={4}>
          {extensions.map((ext) => (
            <Tag key={ext}>.{ext}</Tag>
          ))}
        </Space>
      ),
    },
    { title: 'MIME', dataIndex: 'mimeType', render: (value: string) => value || '—' },
    {
      title: '命中偏移 / 签名',
      render: (_: unknown, row: (typeof result.matches)[number]) => (
        <span className={styles.mono}>
          {row.offset} · {row.signatureHex}
        </span>
      ),
    },
    { title: '说明', dataIndex: 'description' },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Input.TextArea
        value={raw}
        onChange={(event) => setRaw(event.target.value)}
        autoSize={{ minRows: 4, maxRows: 12 }}
        spellCheck={false}
        className={styles.mono}
        placeholder="粘贴 Hex dump，支持空格 / 冒号 / xxd 偏移前缀 / 0x 前缀"
      />
      <Space>
        <Button size="small" onClick={() => setRaw(SAMPLE_HEX_DUMP)}>
          填充 PNG 示例
        </Button>
        <Button size="small" icon={<ClearOutlined />} onClick={() => setRaw('')}>
          清空
        </Button>
      </Space>
      {result.previewHex && (
        <Alert type="info" showIcon message={`规范化前 16 字节：${result.previewHex}`} className={styles.mono} />
      )}
      {result.matches.length > 0 ? (
        <>
          <Alert type="success" showIcon message={`命中 ${result.matches.length} 个签名候选，特异性高者排在前面`} />
          <Table
            size="small"
            rowKey={(row) => `${row.name}-${row.signatureHex}`}
            columns={columns}
            dataSource={result.matches}
            pagination={false}
          />
        </>
      ) : (
        <Empty description={result.reason || '等待输入'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Space>
  );
};

/** 本地文件读取识别面板（FileReader 仅读取前 64 字节，不上传） */
const FilePanel: React.FC = () => {
  const [fileName, setFileName] = React.useState('');
  const [result, setResult] = React.useState<IdentifyResult | null>(null);

  const uploadProps: UploadProps = {
    accept: '*/*',
    multiple: false,
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const bytes = new Uint8Array(reader.result as ArrayBuffer).slice(0, READ_LIMIT);
        setFileName(file.name);
        setResult(identifyFile(bytes, MAGIC_SIGNATURES));
      };
      reader.readAsArrayBuffer(file.slice(0, READ_LIMIT));
      return false; // 阻止 antd 默认上传，纯本地读取
    },
  };

  const columns = [
    { title: '文件类型', dataIndex: 'name', width: 220 },
    {
      title: '扩展名',
      dataIndex: 'extensions',
      render: (extensions: string[]) => (
        <Space wrap size={4}>
          {extensions.map((ext) => (
            <Tag key={ext}>.{ext}</Tag>
          ))}
        </Space>
      ),
    },
    { title: 'MIME', dataIndex: 'mimeType', render: (value: string) => value || '—' },
    {
      title: '命中偏移 / 签名',
      render: (_: unknown, row: NonNullable<typeof result>['matches'][number]) => (
        <span className={styles.mono}>
          {row.offset} · {row.signatureHex}
        </span>
      ),
    },
    { title: '说明', dataIndex: 'description' },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Upload.Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此处（仅在浏览器本地读取前 {READ_LIMIT} 字节）</p>
        <p className="ant-upload-hint">文件内容不会上传到任何服务器</p>
      </Upload.Dragger>
      {fileName && <Tag color="blue">当前文件：{fileName}</Tag>}
      {result &&
        (result.matches.length > 0 ? (
          <>
            <Alert type="success" showIcon message={`命中 ${result.matches.length} 个签名候选`} />
            <Table
              size="small"
              rowKey={(row) => `${row.name}-${row.signatureHex}`}
              columns={columns}
              dataSource={result.matches}
              pagination={false}
            />
          </>
        ) : (
          <Empty description={result.reason} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ))}
      {result?.previewHex && (
        <Alert type="info" showIcon message={`读取到的前 16 字节：${result.previewHex}`} className={styles.mono} />
      )}
    </Space>
  );
};

/**
 * 文件魔数识别器：基于签名表识别文件真实类型，
 * 支持 Hex dump 粘贴与本地文件读取，全部运算在浏览器本地完成。
 *
 * @param _props - 工具组件属性
 * @returns 工具交互界面
 */
const MagicNumberIdentifier: React.FC<ToolComponentProps> = (_props) => {
  React.useEffect(() => {
    message.info('文件与 Hex 仅在本地解析，不会发起网络请求');
  }, []);

  return (
    <div className={styles.container}>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Tag color="blue">依据公开文件魔数签名表识别，覆盖图像 / 文档 / 压缩包 / 音视频 / 可执行文件等常见格式</Tag>
          <Tabs
            items={[
              { key: 'hex', label: 'Hex dump 输入', children: <HexPanel /> },
              { key: 'file', label: '本地文件识别', children: <FilePanel /> },
            ]}
          />
        </Space>
      </Card>
    </div>
  );
};

export default MagicNumberIdentifier;
