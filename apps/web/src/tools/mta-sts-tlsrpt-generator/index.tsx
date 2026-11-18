'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  DEFAULT_DOMAIN,
  DEFAULT_MAX_AGE,
  DEFAULT_MODE,
  DEFAULT_MX_HOSTS,
  DEFAULT_POLICY_ID,
  DEFAULT_RUA,
  MAX_AGE_LIMIT,
  STS_MODE_OPTIONS,
} from './constants';
import {
  generateStsArtifacts,
  validatePolicyFile,
  validateTxtRecord,
  type StsInput,
} from './utils/mtaSts';
import styles from './index.module.css';

const { TextArea } = Input;
const { Text } = Typography;

/**
 * MTA-STS（RFC 8461）策略文件与 TLS-RPT（RFC 8460）TXT 记录生成器：
 * 本地拼装策略文件、策略 URL 与两条 DNS TXT 记录，并提供反向校验模式。
 *
 * @param _props - 工具组件属性（本工具使用内置样例）
 * @returns 工具交互界面
 */
const MtaStsTlsrptGenerator: React.FC<ToolComponentProps> = (_props) => {
  const [form, setForm] = React.useState<StsInput>({
    domain: DEFAULT_DOMAIN,
    mode: DEFAULT_MODE,
    mxHostsText: DEFAULT_MX_HOSTS,
    maxAge: DEFAULT_MAX_AGE,
    policyId: DEFAULT_POLICY_ID,
    ruaText: DEFAULT_RUA,
  });
  const [policyCheck, setPolicyCheck] = React.useState('');
  const [txtCheck, setTxtCheck] = React.useState('');

  const output = React.useMemo(() => generateStsArtifacts(form), [form]);
  const policyCheckResult = React.useMemo(
    () => (policyCheck.trim() ? validatePolicyFile(policyCheck) : null),
    [policyCheck],
  );
  const txtCheckResult = React.useMemo(
    () => (txtCheck.trim() ? validateTxtRecord(txtCheck, txtCheck.includes('TLSRPT') ? 'tlsrpt' : 'sts') : null),
    [txtCheck],
  );

  const patch = <K extends keyof StsInput>(key: K, value: StsInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCopy = async (text: string, label: string) => {
    await copyToClipboard(text);
    message.success(`${label}已复制`);
  };

  const outputCard = (title: string, content: string, badge: string) => (
    <Card
      size="small"
      title={
        <Space>
          <span>{title}</span>
          <Tag color="geekblue">{badge}</Tag>
        </Space>
      }
      extra={
        <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(content, title)}>
          复制
        </Button>
      }
    >
      <div className={styles.policyBlock}>{content}</div>
    </Card>
  );

  return (
    <div className={styles.container}>
      <Tabs
        defaultActiveKey="generate"
        items={[
          {
            key: 'generate',
            label: '生成模式',
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Tag color="blue">纯浏览器本地拼装，域名与 MX 不上传；依据 RFC 8461 / RFC 8460</Tag>

                <Card size="small" title="输入参数">
                  <Row gutter={[16, 12]}>
                    <Col xs={24} md={12}>
                      <Text strong>邮件域</Text>
                      <Input
                        value={form.domain}
                        onChange={(event) => patch('domain', event.target.value)}
                        placeholder="example.com"
                        className={styles.mono}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <Text strong>策略模式 mode</Text>
                      <Select
                        style={{ width: '100%' }}
                        value={form.mode}
                        onChange={(value) => patch('mode', value)}
                        options={STS_MODE_OPTIONS.map((option) => ({
                          value: option.value,
                          label: `${option.label} — ${option.hint}`,
                        }))}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <Text strong>max_age（秒，上限 {MAX_AGE_LIMIT}）</Text>
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        max={MAX_AGE_LIMIT}
                        value={form.maxAge}
                        onChange={(value) => patch('maxAge', value)}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <Text strong>TXT 记录 id（1–32 位字母数字）</Text>
                      <Input
                        value={form.policyId}
                        onChange={(event) => patch('policyId', event.target.value)}
                        className={styles.mono}
                      />
                    </Col>
                    <Col xs={24}>
                      <Text strong>允许的 MX 主机名（每行一个，支持 *. 通配符）</Text>
                      <TextArea
                        rows={2}
                        value={form.mxHostsText}
                        onChange={(event) => patch('mxHostsText', event.target.value)}
                        className={styles.mono}
                      />
                    </Col>
                    <Col xs={24}>
                      <Text strong>TLS-RPT rua 报告端点（每行一个，mailto: 或 https:）</Text>
                      <TextArea
                        rows={2}
                        value={form.ruaText}
                        onChange={(event) => patch('ruaText', event.target.value)}
                        className={styles.mono}
                      />
                    </Col>
                  </Row>
                </Card>

                {output.errors.map((error) => (
                  <Alert key={error} type="error" showIcon message={error} />
                ))}

                {outputCard(
                  '① 策略文件 mta-sts.txt',
                  output.policyFile,
                  `部署到 ${output.policyUrl}`,
                )}
                {outputCard('② MTA-STS 启用 TXT 记录（_mta-sts）', output.stsTxtRecord, 'RFC 8461 §3.1')}
                {outputCard('③ TLS-RPT TXT 记录（_smtp._tls）', output.tlsrptTxtRecord, 'RFC 8460 §3.2')}

                <Alert
                  type="info"
                  showIcon
                  message="部署顺序建议：先通过 HTTPS 发布 mta-sts.txt（证书须有效），再添加 _mta-sts TXT 记录；testing 模式验证 TLS-RPT 报告链路后再切换 enforce。"
                />
              </Space>
            ),
          },
          {
            key: 'validate',
            label: '反向校验',
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Card size="small" title="校验已有策略文件 mta-sts.txt">
                  <TextArea
                    rows={6}
                    value={policyCheck}
                    onChange={(event) => setPolicyCheck(event.target.value)}
                    placeholder={'version: STSv1\nmode: enforce\nmx: mail.example.com\nmax_age: 86400'}
                    className={styles.mono}
                  />
                  {policyCheckResult?.errors.map((error) => (
                    <Alert key={error} style={{ marginTop: 8 }} type="error" showIcon message={error} />
                  ))}
                  {policyCheckResult?.warnings.map((warning) => (
                    <Alert key={warning} style={{ marginTop: 8 }} type="warning" showIcon message={warning} />
                  ))}
                  {policyCheckResult && policyCheckResult.errors.length === 0 && (
                    <Alert style={{ marginTop: 8 }} type="success" showIcon message="策略文件字段校验通过" />
                  )}
                </Card>

                <Card size="small" title="校验已有 DNS TXT 记录值（STS 或 TLS-RPT 自动识别）">
                  <TextArea
                    rows={3}
                    value={txtCheck}
                    onChange={(event) => setTxtCheck(event.target.value)}
                    placeholder='_mta-sts.example.com TXT "v=STSv1; id=20260101"'
                    className={styles.mono}
                  />
                  {txtCheckResult?.errors.map((error) => (
                    <Alert key={error} style={{ marginTop: 8 }} type="error" showIcon message={error} />
                  ))}
                  {txtCheckResult && txtCheckResult.errors.length === 0 && (
                    <Alert style={{ marginTop: 8 }} type="success" showIcon message="TXT 记录字段校验通过" />
                  )}
                </Card>
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
};

export default MtaStsTlsrptGenerator;
