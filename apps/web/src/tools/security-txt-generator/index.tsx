'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, Radio, Space, Table, Tag, message } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  generateSecurityTxt,
  parseSecurityTxt,
  splitEntries,
} from './utils/securityTxt';
import {
  DEFAULT_SAMPLE_INPUT,
  DEPLOY_PATH,
  HINT,
  SAMPLE_FORM,
  createEmptyForm,
  type SecurityTxtForm,
} from './constants';
import styles from './index.module.css';

type Mode = 'generate' | 'parse';

interface FieldEditorProps {
  label: string;
  help?: string;
  value: string;
  placeholder?: string;
  single?: boolean;
  onChange: (value: string) => void;
}

/** 单值用 Input、多值用自适应高度 TextArea（每行一条）的表单字段 */
const FieldEditor: React.FC<FieldEditorProps> = ({
  label,
  help,
  value,
  placeholder,
  single = false,
  onChange,
}) => (
  <div className={styles.field}>
    <span className={styles.fieldLabel}>{label}</span>
    {help ? <div className={styles.fieldHelp}>{help}</div> : null}
    {single ? (
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    ) : (
      <TextArea
        className={styles.editor}
        value={value}
        placeholder={placeholder}
        autoSize={{ minRows: 1, maxRows: 5 }}
        onChange={(event) => onChange(event.target.value)}
      />
    )}
  </div>
);

/**
 * security.txt 生成器：按 RFC 9116 表单生成 /.well-known/security.txt，
 * 或粘贴现有文件实时解析校验必填字段、过期时间与 PGP 签名状态。
 *
 * @returns security.txt 生成 / 解析交互界面
 */
const SecurityTxtGenerator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<Mode>('generate');
  const [form, setForm] = React.useState<SecurityTxtForm>(SAMPLE_FORM);
  const [parseText, setParseText] = React.useState(defaultInput || DEFAULT_SAMPLE_INPUT);

  const result = React.useMemo(
    () =>
      generateSecurityTxt({
        contacts: splitEntries(form.contacts),
        expires: form.expires,
        encryption: splitEntries(form.encryption),
        acknowledgments: splitEntries(form.acknowledgments),
        preferredLanguages: form.preferredLanguages,
        canonical: splitEntries(form.canonical),
        policy: splitEntries(form.policy),
        csaf: splitEntries(form.csaf),
      }),
    [form],
  );

  const parsed = React.useMemo(() => parseSecurityTxt(parseText), [parseText]);

  const updateField = (key: keyof SecurityTxtForm, value: string): void => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const copyOutput = async (): Promise<void> => {
    if (result.error || result.output === '') {
      message.warning('暂无有效内容，请先修正表单');
      return;
    }
    await copyToClipboard(result.output);
    message.success('security.txt 内容已复制（CRLF 行尾）');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={mode}
          options={[
            { value: 'generate', label: '生成' },
            { value: 'parse', label: '解析校验' },
          ]}
          onChange={(event) => setMode(event.target.value as Mode)}
        />
        <Tag color="blue">RFC 9116</Tag>
        <span className={styles.hint}>{HINT}</span>
      </div>

      {mode === 'generate' ? (
        <>
          <Card
            title="字段编辑"
            extra={
              <Space>
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setForm(SAMPLE_FORM);
                    message.success('已填充示例');
                  }}
                >
                  填充示例
                </Button>
                <Button size="small" onClick={() => setForm(createEmptyForm())}>
                  清空
                </Button>
              </Space>
            }
          >
            <FieldEditor
              label="Contact（必填，每行一条 URI）"
              help="安全联系人，如 mailto:security@example.com、https://example.com/security、tel:+1-000-000"
              value={form.contacts}
              placeholder="mailto:security@example.com"
              onChange={(value) => updateField('contacts', value)}
            />
            <FieldEditor
              label="Expires（必填，单条）"
              help="策略过期时间，RFC 3339 / ISO 8601 日期时间，建议使用 UTC（Z 结尾）"
              value={form.expires}
              placeholder="2027-12-31T23:59:59.000Z"
              single
              onChange={(value) => updateField('expires', value)}
            />
            <FieldEditor
              label="Preferred-Languages（可选，单条）"
              help="安全团队可使用的语言标签，逗号分隔"
              value={form.preferredLanguages}
              placeholder="en, zh-CN"
              single
              onChange={(value) => updateField('preferredLanguages', value)}
            />
            <FieldEditor
              label="Encryption（可选，每行一条）"
              help="加密公钥获取地址"
              value={form.encryption}
              placeholder="https://example.com/pgp-key.txt"
              onChange={(value) => updateField('encryption', value)}
            />
            <FieldEditor
              label="Policy（可选，每行一条）"
              help="漏洞披露策略页面地址"
              value={form.policy}
              placeholder="https://example.com/reporting-policy"
              onChange={(value) => updateField('policy', value)}
            />
            <FieldEditor
              label="Acknowledgments（可选，每行一条）"
              help="致谢页面地址"
              value={form.acknowledgments}
              placeholder="https://example.com/hall-of-fame"
              onChange={(value) => updateField('acknowledgments', value)}
            />
            <FieldEditor
              label="Canonical（可选，每行一条）"
              help="本 security.txt 文件的规范 URL"
              value={form.canonical}
              placeholder="https://example.com/.well-known/security.txt"
              onChange={(value) => updateField('canonical', value)}
            />
            <FieldEditor
              label="CSAF（可选，每行一条）"
              help="CSAF 提供者元数据文件地址"
              value={form.csaf}
              placeholder="https://example.com/.well-known/csaf/provider-metadata.json"
              onChange={(value) => updateField('csaf', value)}
            />
          </Card>

          <Alert
            type="info"
            showIcon
            message="部署路径"
            description={
              <span>
                将内容保存为 <code className={styles.editor}>{DEPLOY_PATH}</code>
                （HTTPS 站点根目录下），并确保 Content-Type 为 text/plain、行尾为 CRLF。
              </span>
            }
          />

          {result.warnings.map((warning) => (
            <Alert key={warning} type="warning" showIcon message={warning} />
          ))}

          {result.error ? (
            <Alert
              type="error"
              showIcon
              message="无法生成 security.txt"
              description={result.error}
            />
          ) : (
            <Card
              title="security.txt 预览"
              extra={
                <Button type="primary" icon={<CopyOutlined />} onClick={copyOutput}>
                  复制
                </Button>
              }
            >
              <TextArea
                className={styles.editor}
                value={result.output}
                readOnly
                autoSize={{ minRows: 10, maxRows: 24 }}
                spellCheck={false}
              />
            </Card>
          )}
        </>
      ) : (
        <>
          <Card title="粘贴 security.txt 内容（实时解析，兼容 CRLF / LF）">
            <TextArea
              className={styles.editor}
              value={parseText}
              onChange={(event) => setParseText(event.target.value)}
              autoSize={{ minRows: 10, maxRows: 22 }}
              spellCheck={false}
            />
          </Card>

          {parseText.trim() === '' ? (
            <Alert type="info" showIcon message="粘贴 security.txt 后将在此实时展示解析与校验结果" />
          ) : (
            <Card
              title="解析结果"
              extra={
                parsed.hasSignature ? (
                  <Tag color="green">含 PGP clearsign 签名</Tag>
                ) : (
                  <Tag>无 PGP 签名</Tag>
                )
              }
            >
              {parsed.errors.map((error) => (
                <Alert
                  key={error}
                  className={styles.field}
                  type="error"
                  showIcon
                  message={error}
                />
              ))}
              {parsed.warnings.map((warning) => (
                <Alert
                  key={warning}
                  className={styles.field}
                  type="warning"
                  showIcon
                  message={warning}
                />
              ))}
              {parsed.fields.length === 0 ? (
                <Empty description="未解析出任何字段" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Table
                  size="small"
                  pagination={parsed.fields.length > 10 ? { pageSize: 10 } : false}
                  rowKey={(record) => String(record.line)}
                  dataSource={parsed.fields}
                  columns={[
                    { title: '字段', dataIndex: 'name', key: 'name', width: '28%' },
                    { title: '值', dataIndex: 'value', key: 'value' },
                  ]}
                />
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default SecurityTxtGenerator;
