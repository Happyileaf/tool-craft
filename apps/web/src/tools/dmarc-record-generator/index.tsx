'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tabs,
  Tag,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  createDefaultInput,
  generateDmarcRecord,
  validateDmarcRecord,
  type DmarcInput,
} from './utils/dmarc';
import {
  ALIGNMENT_OPTIONS,
  DEFAULT_VALIDATE_RECORD,
  FO_OPTIONS,
  POLICY_OPTIONS,
  RF_OPTIONS,
  SUBDOMAIN_POLICY_OPTIONS,
} from './constants';
import styles from './index.module.css';

/** 记录生成面板：表单 → 实时生成 _dmarc TXT 记录 */
const GeneratorPanel: React.FC = () => {
  const [form] = Form.useForm<DmarcInput>();
  const [input, setInput] = React.useState<DmarcInput>(createDefaultInput());

  const result = React.useMemo(() => generateDmarcRecord(input), [input]);

  const handleValuesChange = (_: unknown, all: DmarcInput) => {
    setInput(all);
  };

  const handleCopy = async (value: string) => {
    await copyToClipboard(value);
    message.success('复制成功');
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={input}
        onValuesChange={handleValuesChange}
      >
        <Form.Item
          label="发信域（domain）"
          name="domain"
          rules={[{ required: true, message: '请输入发信域' }]}
        >
          <Input placeholder="example.com" spellCheck={false} className={styles.mono} />
        </Form.Item>

        <Space size="large" wrap style={{ display: 'flex' }}>
          <Form.Item label="主域策略 p=" name="policy" style={{ minWidth: 240 }}>
            <Select options={POLICY_OPTIONS.map((option) => ({ label: option.label, value: option.value }))} />
          </Form.Item>
          <Form.Item label="子域策略 sp=" name="subdomainPolicy" style={{ minWidth: 240 }}>
            <Select
              options={SUBDOMAIN_POLICY_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
            />
          </Form.Item>
        </Space>

        <Form.Item label="聚合报告邮箱 rua=（多个用逗号分隔，需 mailto: 前缀）" name="rua">
          <Input placeholder="mailto:dmarc@example.com" spellCheck={false} className={styles.mono} />
        </Form.Item>
        <Form.Item label="取证报告邮箱 ruf=" name="ruf">
          <Input placeholder="mailto:forensics@example.com" spellCheck={false} className={styles.mono} />
        </Form.Item>

        <Space size="large" wrap style={{ display: 'flex' }}>
          <Form.Item label="DKIM 对齐 adkim=" name="adkim" style={{ minWidth: 180 }}>
            <Select
              options={ALIGNMENT_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
            />
          </Form.Item>
          <Form.Item label="SPF 对齐 aspf=" name="aspf" style={{ minWidth: 180 }}>
            <Select
              options={ALIGNMENT_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
            />
          </Form.Item>
          <Form.Item label="报告格式 rf=" name="rf" style={{ minWidth: 180 }}>
            <Select options={RF_OPTIONS.map((option) => ({ label: option.label, value: option.value }))} />
          </Form.Item>
        </Space>

        <Form.Item label="取证选项 fo=（可多选）" name="fo">
          <Checkbox.Group
            options={FO_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
          />
        </Form.Item>

        <Space size="large" wrap style={{ display: 'flex' }}>
          <Form.Item label="策略百分比 pct=（0–100，留空用默认 100）" name="pct" style={{ minWidth: 220 }}>
            <InputNumber min={0} max={100} precision={0} placeholder="100" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="聚合报告间隔 ri=（秒，留空不输出）" name="ri" style={{ minWidth: 220 }}>
            <InputNumber min={1} precision={0} placeholder="如 86400" style={{ width: '100%' }} />
          </Form.Item>
        </Space>
      </Form>

      {result.errors.map((error) => (
        <Alert key={error} type="error" showIcon message={error} />
      ))}
      {result.warnings.map((warning) => (
        <Alert key={warning} type="warning" showIcon message={warning} />
      ))}

      {result.recordValue && (
        <Card type="inner" title="生成的 DNS TXT 记录">
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space wrap>
              <span className={styles.hint}>主机记录（Host）：</span>
              <span className={styles.dnsName}>{result.dnsName}</span>
              <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(result.dnsName)}>
                复制
              </Button>
            </Space>
            <Space wrap align="start">
              <span className={styles.hint}>记录值（TXT）：</span>
              <span className={styles.recordValue}>{result.recordValue}</span>
              <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(result.recordValue)}>
                复制
              </Button>
            </Space>
            {result.chunks.length > 1 && (
              <>
                <div className={styles.hint}>超过 255 字符，BIND 风格分段（发布时保留引号与空格）：</div>
                <Input.TextArea
                  readOnly
                  value={result.chunks.join(' ')}
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  className={styles.mono}
                />
              </>
            )}
          </Space>
        </Card>
      )}
    </Space>
  );
};

/** 记录校验面板：粘贴现有记录做语法 / 未知标签 / 冲突检查 */
const ValidatorPanel: React.FC = () => {
  const [raw, setRaw] = React.useState(DEFAULT_VALIDATE_RECORD);
  const validation = React.useMemo(() => validateDmarcRecord(raw), [raw]);

  const handleCopy = async () => {
    if (validation.normalized) {
      await copyToClipboard(validation.normalized);
      message.success('已复制规范化记录');
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Input.TextArea
        value={raw}
        onChange={(event) => setRaw(event.target.value)}
        autoSize={{ minRows: 3, maxRows: 8 }}
        spellCheck={false}
        className={styles.mono}
        placeholder="粘贴现有 DMARC TXT 记录，如 v=DMARC1; p=none; rua=mailto:a@b.com"
      />
      {validation.errors.map((error) => (
        <Alert key={error} type="error" showIcon message={error} />
      ))}
      {validation.warnings.map((warning) => (
        <Alert key={warning} type="warning" showIcon message={warning} />
      ))}
      {validation.errors.length === 0 && (
        <Alert type="success" showIcon message="语法校验通过" />
      )}
      {validation.normalized && (
        <Card type="inner" title="规范化记录（去空白、标签小写）">
          <Space wrap align="start">
            <span className={styles.recordValue}>{validation.normalized}</span>
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          </Space>
        </Card>
      )}
    </Space>
  );
};

/**
 * DMARC 记录生成与校验器：依据 RFC 7489 在浏览器本地拼装并核对
 * `_dmarc` TXT 记录的策略、报告邮箱、对齐模式、百分比等标签。
 *
 * @param _props - 工具组件属性（本工具使用内置样例）
 * @returns 工具交互界面
 */
const DmarcRecordGenerator: React.FC<ToolComponentProps> = (_props) => (
  <div className={styles.container}>
    <Card className={styles.card}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Tag color="blue">纯浏览器本地计算，域名与报告邮箱不会上传，依据 RFC 7489</Tag>
        <Tabs
          items={[
            { key: 'generator', label: '记录生成器', children: <GeneratorPanel /> },
            { key: 'validator', label: '记录校验器', children: <ValidatorPanel /> },
          ]}
        />
      </Space>
    </Card>
  </div>
);

export default DmarcRecordGenerator;
