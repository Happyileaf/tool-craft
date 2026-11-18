'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Space,
  Tabs,
  Tag,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  createEmptyForm,
  generateEpcPayload,
  parseEpcPayload,
  validateEpcForm,
  type EpcForm,
} from './utils/epc';
import { EPC_LIMITS, SAMPLE_FORM, SAMPLE_PAYLOAD } from './constants';
import styles from './index.module.css';

/** 生成面板：表单 → EPC 负载文本 */
const GeneratePanel: React.FC = () => {
  const [form, setForm] = React.useState<EpcForm>({ ...createEmptyForm(), ...SAMPLE_FORM });
  const [payload, setPayload] = React.useState('');

  const validation = React.useMemo(() => validateEpcForm(form), [form]);

  const update = <K extends keyof EpcForm>(key: K, value: EpcForm[K]): void => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleGenerate = (): void => {
    try {
      setPayload(generateEpcPayload(form));
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(payload);
    message.success('EPC 负载已复制，可粘贴到任意二维码生成器');
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Form layout="vertical">
        <Form.Item
          label="BIC 服务商标识（版本 2 起可选，8 或 11 位）"
          validateStatus={validation.errors.bic ? 'error' : undefined}
          help={validation.errors.bic}
        >
          <Input
            value={form.bic}
            maxLength={EPC_LIMITS.bic}
            placeholder="如 BPOTBEB1"
            onChange={(event) => update('bic', event.target.value)}
          />
        </Form.Item>
        <Form.Item
          label="收款人名称（必填）"
          validateStatus={validation.errors.name ? 'error' : undefined}
          help={validation.errors.name}
        >
          <Input
            value={form.name}
            maxLength={EPC_LIMITS.name}
            showCount
            onChange={(event) => update('name', event.target.value)}
          />
        </Form.Item>
        <Form.Item
          label="收款人 IBAN（必填，含 mod97 校验）"
          validateStatus={validation.errors.iban ? 'error' : undefined}
          help={validation.errors.iban}
        >
          <Input
            value={form.iban}
            maxLength={EPC_LIMITS.iban}
            placeholder="如 BE72000000001616"
            onChange={(event) => update('iban', event.target.value)}
          />
        </Form.Item>
        <Form.Item
          label="金额（欧元，留空或 0 表示金额行留空，由付款人填写）"
          validateStatus={validation.errors.amount ? 'error' : undefined}
          help={validation.errors.amount}
        >
          <InputNumber
            value={form.amount}
            min={0}
            precision={2}
            step={1}
            style={{ width: 240 }}
            placeholder="如 12.34"
            onChange={(value) => update('amount', value)}
          />
        </Form.Item>
        <Form.Item
          label="用途代码（4 位，可选，如 CHAR 慈善捐赠）"
          validateStatus={validation.errors.purposeCode ? 'error' : undefined}
          help={validation.errors.purposeCode}
        >
          <Input
            value={form.purposeCode}
            maxLength={EPC_LIMITS.purposeCode}
            onChange={(event) => update('purposeCode', event.target.value)}
          />
        </Form.Item>
        <Form.Item
          label="结构化债权人引用（RF 引用，与普通汇款说明二选一）"
          validateStatus={validation.errors.creditorReference ? 'error' : undefined}
          help={validation.errors.creditorReference}
        >
          <Input
            value={form.creditorReference}
            maxLength={EPC_LIMITS.remittance}
            showCount
            onChange={(event) => update('creditorReference', event.target.value)}
          />
        </Form.Item>
        <Form.Item
          label="普通汇款说明（与结构化引用二选一）"
          validateStatus={validation.errors.remittance ? 'error' : undefined}
          help={validation.errors.remittance}
        >
          <Input
            value={form.remittance}
            maxLength={EPC_LIMITS.remittance}
            showCount
            onChange={(event) => update('remittance', event.target.value)}
          />
        </Form.Item>
        <Form.Item
          label="备注（可选）"
          validateStatus={validation.errors.note ? 'error' : undefined}
          help={validation.errors.note}
        >
          <Input
            value={form.note}
            maxLength={EPC_LIMITS.note}
            showCount
            onChange={(event) => update('note', event.target.value)}
          />
        </Form.Item>
      </Form>
      <Space>
        <Button type="primary" onClick={handleGenerate} disabled={!validation.valid}>
          生成 EPC 负载
        </Button>
        <Button onClick={() => setForm(createEmptyForm())}>重置</Button>
        {payload && (
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            复制负载
          </Button>
        )}
      </Space>
      {payload && (
        <>
          <Alert type="success" showIcon message="已生成符合 EPC069-12 的 12 行 CRLF 负载，可直接编码为二维码" />
          <Input.TextArea value={payload} readOnly autoSize={{ minRows: 12, maxRows: 16 }} className={styles.payload} />
        </>
      )}
    </Space>
  );
};

/** 解析面板：EPC 负载文本 → 结构化字段 */
const ParsePanel: React.FC = () => {
  const [raw, setRaw] = React.useState(SAMPLE_PAYLOAD);

  const output = React.useMemo(() => {
    if (!raw.trim()) {
      return { payload: null, error: '' };
    }
    try {
      return { payload: parseEpcPayload(raw), error: '' };
    } catch (error) {
      return { payload: null, error: (error as Error).message };
    }
  }, [raw]);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Input.TextArea
        value={raw}
        onChange={(event) => setRaw(event.target.value)}
        autoSize={{ minRows: 10, maxRows: 16 }}
        spellCheck={false}
        className={styles.payload}
        placeholder="粘贴 EPC QR 负载（BCD 开头，12 行，CRLF/LF 均可）"
      />
      {output.error ? (
        <Alert type="error" showIcon message={output.error} />
      ) : (
        output.payload && (
          <>
            <Alert type="success" showIcon message="负载头合法，字段解析如下" />
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="BIC">{output.payload.bic || '—（未提供）'}</Descriptions.Item>
              <Descriptions.Item label="收款人名称">{output.payload.name}</Descriptions.Item>
              <Descriptions.Item label="IBAN">{output.payload.iban}</Descriptions.Item>
              <Descriptions.Item label="金额行">
                {output.payload.amountText || '—（付款人填写）'}
              </Descriptions.Item>
              <Descriptions.Item label="用途代码">{output.payload.purposeCode || '—'}</Descriptions.Item>
              <Descriptions.Item label="债权人引用">
                {output.payload.creditorReference || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="汇款说明">{output.payload.remittance || '—'}</Descriptions.Item>
              <Descriptions.Item label="备注">{output.payload.note || '—'}</Descriptions.Item>
            </Descriptions>
          </>
        )
      )}
    </Space>
  );
};

/**
 * EPC QR Code（SEPA Credit Transfer）编解码器：
 * 按 EPC069-12 规范生成与解析 12 行 SCT 负载，IBAN 走 mod97 校验，纯浏览器本地运算。
 *
 * @param _props - 工具组件属性
 * @returns 工具交互界面
 */
const EpcQrSepaCodec: React.FC<ToolComponentProps> = (_props) => {
  React.useEffect(() => {
    message.info('EPC 负载仅在本地生成与解析，不发起任何网络请求');
  }, []);

  return (
    <div className={styles.container}>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Tag color="blue">
            EPC069-12 v3.0：BCD / 001 / 1 / SCT 固定头 + 8 个业务行，共 12 行，CRLF 分隔
          </Tag>
          <Tabs
            items={[
              { key: 'generate', label: '表单 → 负载', children: <GeneratePanel /> },
              { key: 'parse', label: '负载 → 字段', children: <ParsePanel /> },
            ]}
          />
        </Space>
      </Card>
    </div>
  );
};

export default EpcQrSepaCodec;
