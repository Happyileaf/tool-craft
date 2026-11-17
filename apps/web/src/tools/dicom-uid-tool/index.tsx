'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  generateDicomUidSet,
  validateDicomUid,
  validateDicomUidBatch,
  type UidMode,
} from './utils/dicom-uid';
import { DEFAULT_ROOT, DEFAULT_VALIDATE_TEXT, MAX_SOP_COUNT } from './constants';
import styles from './index.module.css';

/** 生成器面板：组织根 + 模式 + 数量，输出 Study / Series / SOP Instance UID */
const GeneratorPanel: React.FC = () => {
  const [root, setRoot] = React.useState(DEFAULT_ROOT);
  const [mode, setMode] = React.useState<UidMode>('random');
  const [sopCount, setSopCount] = React.useState(3);
  const [generated, setGenerated] = React.useState(() =>
    generateDicomUidSet({ root: DEFAULT_ROOT, mode: 'random', sopCount: 3 }),
  );

  const rootCheck = React.useMemo(() => validateDicomUid(root), [root]);

  const handleGenerate = () => {
    setGenerated(generateDicomUidSet({ root, mode, sopCount }));
  };

  const handleCopy = async (text: string, label: string) => {
    await copyToClipboard(text);
    message.success(`${label}已复制`);
  };

  const sopRows = generated.sopInstanceUids.map((uid, index) => ({ key: index, index: index + 1, uid }));

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="随机模式使用 Web Crypto（crypto.getRandomValues）生成后缀；计数器模式使用时间戳+递增序号。所有 UID 生成后均按 PS3.5 规则自检。"
      />
      <Space size="middle" wrap style={{ display: 'flex' }}>
        <div>
          <div className={styles.hint}>组织根 UID（Organization Root）</div>
          <Input
            value={root}
            onChange={(event) => setRoot(event.target.value)}
            placeholder="如 1.3.6.1.4.1.99999"
            spellCheck={false}
            className={styles.mono}
            style={{ width: 320 }}
            status={rootCheck.valid ? undefined : 'error'}
          />
        </div>
        <div>
          <div className={styles.hint}>后缀生成模式</div>
          <Select<UidMode>
            value={mode}
            onChange={setMode}
            style={{ width: 220 }}
            options={[
              { label: '密码学安全随机数', value: 'random' },
              { label: '时间戳 + 计数器', value: 'counter' },
            ]}
          />
        </div>
        <div>
          <div className={styles.hint}>SOP Instance 数量（1-{MAX_SOP_COUNT}）</div>
          <InputNumber min={1} max={MAX_SOP_COUNT} value={sopCount} onChange={(value) => setSopCount(Number(value) || 1)} />
        </div>
        <Button type="primary" icon={<ReloadOutlined />} onClick={handleGenerate} style={{ marginTop: 18 }}>
          生成 UID
        </Button>
      </Space>

      {!rootCheck.valid && (
        <Alert type="error" showIcon message={`组织根不合法：${rootCheck.issues[0]?.message}`} />
      )}
      {rootCheck.wellKnown && (
        <Alert
          type="warning"
          showIcon
          message={`当前组织根命中 DICOM 保留的 Well-known UID 段（${rootCheck.wellKnown.name}），私有生成建议改用机构自己申请的组织根`}
        />
      )}
      {generated.error && <Alert type="error" showIcon message={generated.error} />}

      {!generated.error && (
        <Card size="small" title="生成结果（总长 ≤ 64 字符，已通过语法自检）">
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Study Instance UID">
              <Space>
                <span className={styles.uidOutput}>{generated.studyInstanceUid}</span>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(generated.studyInstanceUid, 'Study Instance UID')}
                >
                  复制
                </Button>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Series Instance UID">
              <Space>
                <span className={styles.uidOutput}>{generated.seriesInstanceUid}</span>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(generated.seriesInstanceUid, 'Series Instance UID')}
                >
                  复制
                </Button>
              </Space>
            </Descriptions.Item>
          </Descriptions>
          <div style={{ height: 12 }} />
          <Space style={{ marginBottom: 8 }}>
            <span className={styles.hint}>SOP Instance UID（{sopRows.length} 个）</span>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(generated.sopInstanceUids.join('\n'), '全部 SOP Instance UID')}
            >
              复制全部
            </Button>
          </Space>
          <Table
            size="small"
            rowKey="key"
            pagination={false}
            dataSource={sopRows}
            columns={[
              { title: '#', dataIndex: 'index', width: 60 },
              {
                title: 'SOP Instance UID',
                dataIndex: 'uid',
                render: (uid: string) => <span className={styles.mono}>{uid}</span>,
              },
              {
                title: '操作',
                width: 90,
                render: (_: unknown, row: { uid: string }) => (
                  <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(row.uid, 'SOP Instance UID')}>
                    复制
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      )}
    </Space>
  );
};

/** 校验器面板：每行一个 UID，逐段定位违规并识别 Well-known UID */
const ValidatorPanel: React.FC = () => {
  const [raw, setRaw] = React.useState(DEFAULT_VALIDATE_TEXT);
  const batch = React.useMemo(() => validateDicomUidBatch(raw), [raw]);

  const columns = [
    { title: '行号', dataIndex: 'line', width: 70 },
    {
      title: 'UID',
      dataIndex: 'normalized',
      render: (text: string) => <span className={styles.mono}>{text}</span>,
    },
    {
      title: '长度/段数',
      width: 100,
      render: (_: unknown, row: (typeof batch.rows)[number]) => (
        <span className={styles.mono}>
          {row.length}/{row.componentCount}
        </span>
      ),
    },
    {
      title: '结果',
      width: 110,
      render: (_: unknown, row: (typeof batch.rows)[number]) =>
        row.valid ? <Tag color="success">合法</Tag> : <Tag color="error">违规</Tag>,
    },
    {
      title: '说明',
      render: (_: unknown, row: (typeof batch.rows)[number]) => {
        if (!row.valid) {
          return <span className={styles.issueText}>{row.issues.map((issue) => issue.message).join('；')}</span>;
        }
        if (row.wellKnown) {
          return <Tag color="gold">Well-known：{row.wellKnown.name}</Tag>;
        }
        return <Tag color="blue">自定义 UID</Tag>;
      },
    },
  ];

  const handleCopyValid = async () => {
    const text = batch.rows.filter((row) => row.valid).map((row) => row.normalized).join('\n');
    await copyToClipboard(text);
    message.success(`已复制 ${batch.okCount} 条合法 UID`);
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="每行粘贴一个 UID：逐段检查字符集、64 字符上限与前导零，并区分 DICOM 保留的 Well-known UID 与自定义 UID"
      />
      <Input.TextArea
        value={raw}
        onChange={(event) => setRaw(event.target.value)}
        autoSize={{ minRows: 5, maxRows: 12 }}
        spellCheck={false}
        className={styles.mono}
      />
      <Space>
        <Tag color="blue">总计 {batch.total}</Tag>
        <Tag color="success">合法 {batch.okCount}</Tag>
        <Tag color="error">违规 {batch.failCount}</Tag>
        <Button size="small" icon={<CopyOutlined />} onClick={handleCopyValid} disabled={batch.okCount === 0}>
          复制全部合法 UID
        </Button>
      </Space>
      <Table size="small" rowKey={(row) => `${row.line}`} columns={columns} dataSource={batch.rows} pagination={false} />
    </Space>
  );
};

/**
 * DICOM UID 生成器与校验器：本地按 PS3.5 Chapter 9 / PS3.7 B.2 规则
 * 批量生成 Study / Series / SOP Instance UID，并对粘贴 UID 逐段校验定位。
 *
 * @param _props - 工具组件属性（本工具使用内置样例）
 * @returns 工具交互界面
 */
const DicomUidTool: React.FC<ToolComponentProps> = (_props) => (
  <div className={styles.container}>
    <Card className={styles.card}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Tag color="blue">纯浏览器本地运算，依据 DICOM PS3.5 Chapter 9，UID 数据不上传</Tag>
        <Tabs
          items={[
            { key: 'generator', label: 'UID 生成器', children: <GeneratorPanel /> },
            { key: 'validator', label: 'UID 校验器', children: <ValidatorPanel /> },
          ]}
        />
      </Space>
    </Card>
  </div>
);

export default DicomUidTool;
