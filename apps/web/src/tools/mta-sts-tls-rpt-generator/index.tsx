'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, Form, Input, InputNumber, Radio, Select, Space, Tag, message } from 'antd';
import { CopyOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  generate,
  generatePolicyId,
  MAX_AGE_PRESETS,
  DEFAULT_INPUT,
  type MtaStsMode,
} from './utils/mtaSts';
import { MODE_OPTIONS, REPORT_SCHEME_OPTIONS } from './constants';
import styles from './index.module.css';

/**
 * MTA-STS 策略与 TLS-RPT 记录生成器：按 RFC 8461 / RFC 8460
 * 生成 mta-sts.txt 策略文件与两条 DNS TXT 记录，全部本地拼装与校验。
 *
 * @param _props - 工具组件属性（本工具使用内置样例）
 * @returns 工具交互界面
 */
const MtaStsTlsRptGenerator: React.FC<ToolComponentProps> = (_props) => {
  const [domain, setDomain] = React.useState(DEFAULT_INPUT.domain);
  const [mode, setMode] = React.useState<MtaStsMode>(DEFAULT_INPUT.mode);
  const [mxHosts, setMxHosts] = React.useState<string[]>([...DEFAULT_INPUT.mxHosts]);
  const [maxAge, setMaxAge] = React.useState<number | null>(DEFAULT_INPUT.maxAge);
  const [reportScheme, setReportScheme] = React.useState<'mailto' | 'https'>(DEFAULT_INPUT.reportScheme);
  const [reportTarget, setReportTarget] = React.useState(DEFAULT_INPUT.reportTarget);
  const [policyId, setPolicyId] = React.useState(() => generatePolicyId());

  const result = React.useMemo(
    () =>
      generate({
        domain,
        mode,
        mxHosts,
        maxAge: maxAge ?? 0,
        reportScheme,
        reportTarget,
        policyId,
      }),
    [domain, mode, mxHosts, maxAge, reportScheme, reportTarget, policyId],
  );

  const handleCopy = async (value: string) => {
    await copyToClipboard(value);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Tag color="blue">纯浏览器本地生成与校验，依据 RFC 8461（MTA-STS）/ RFC 8460（TLS-RPT），配置不会上传</Tag>

          <Form layout="vertical">
            <Space size="large" wrap style={{ display: 'flex' }}>
              <Form.Item label="邮件域名" style={{ minWidth: 280, marginBottom: 8 }}>
                <Input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="example.com" spellCheck={false} />
              </Form.Item>
              <Form.Item label="策略版本 id（更新策略时需更换）" style={{ minWidth: 240, marginBottom: 8 }}>
                <Space.Compact style={{ width: '100%' }}>
                  <Input value={policyId} onChange={(event) => setPolicyId(event.target.value)} className={styles.mono} />
                  <Button onClick={() => setPolicyId(generatePolicyId())}>刷新</Button>
                </Space.Compact>
              </Form.Item>
            </Space>

            <Form.Item label="策略模式 mode" style={{ marginBottom: 8 }}>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                value={mode}
                onChange={(event) => setMode(event.target.value)}
                options={MODE_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
              />
            </Form.Item>

            <Form.Item label="MX 主机名（支持通配符，如 *.example.com）" style={{ marginBottom: 8 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {mxHosts.map((host, index) => (
                  <Space.Compact key={index} style={{ width: '100%', maxWidth: 480 }}>
                    <Input
                      value={host}
                      onChange={(event) => {
                        const next = [...mxHosts];
                        next[index] = event.target.value;
                        setMxHosts(next);
                      }}
                      placeholder="mail.example.com"
                      spellCheck={false}
                      className={styles.mono}
                    />
                    <Button
                      icon={<MinusCircleOutlined />}
                      onClick={() => setMxHosts(mxHosts.filter((_, i) => i !== index))}
                    >
                      删除
                    </Button>
                  </Space.Compact>
                ))}
                <Button icon={<PlusOutlined />} onClick={() => setMxHosts([...mxHosts, ''])}>
                  添加 MX
                </Button>
              </Space>
            </Form.Item>

            <Space size="large" wrap style={{ display: 'flex' }}>
              <Form.Item label="max_age（秒）" style={{ minWidth: 220, marginBottom: 8 }}>
                <InputNumber value={maxAge} onChange={(value) => setMaxAge(value)} min={0} max={31557600} precision={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="max_age 快捷预设" style={{ minWidth: 280, marginBottom: 8 }}>
                <Select
                  placeholder="选择预设"
                  allowClear
                  onChange={(value) => setMaxAge(value ?? null)}
                  options={MAX_AGE_PRESETS.map((preset) => ({ label: `${preset.label}（${preset.value} 秒）`, value: preset.value }))}
                />
              </Form.Item>
            </Space>

            <Form.Item label="TLS-RPT 报告接收方式 rua" style={{ marginBottom: 8 }}>
              <Radio.Group
                optionType="button"
                value={reportScheme}
                onChange={(event) => setReportScheme(event.target.value)}
                options={REPORT_SCHEME_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
              />
            </Form.Item>
            <Form.Item label={reportScheme === 'mailto' ? '报告邮箱' : 'https 报告 URI'} style={{ maxWidth: 480, marginBottom: 8 }}>
              <Input
                value={reportTarget}
                onChange={(event) => setReportTarget(event.target.value)}
                placeholder={reportScheme === 'mailto' ? 'tls-reports@example.com' : 'https://reports.example.com/tls'}
                spellCheck={false}
                className={styles.mono}
              />
            </Form.Item>
          </Form>

          {result.errors.map((error) => (
            <Alert key={error} type="error" showIcon message={error} />
          ))}
          {result.warnings.map((warning) => (
            <Alert key={warning} type="warning" showIcon message={warning} />
          ))}

          {result.errors.length === 0 && (
            <>
              <Card type="inner" title="1. 策略文件 mta-sts.txt（发布到 HTTPS 路径）" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Descriptions size="small" column={1}>
                    <Descriptions.Item label="发布 URL">
                      <span className={styles.mono}>{result.policyUrl}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Content-Type">text/plain; charset=utf-8</Descriptions.Item>
                  </Descriptions>
                  <pre className={styles.codeBlock}>{result.policyFile}</pre>
                  <Button icon={<CopyOutlined />} onClick={() => handleCopy(result.policyFile)}>
                    复制策略文件
                  </Button>
                </Space>
              </Card>

              <Card type="inner" title="2. MTA-STS DNS TXT 记录（RFC 8461）" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Descriptions size="small" column={1}>
                    <Descriptions.Item label="记录名">
                      <span className={styles.mono}>{result.stsDns?.name}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="记录值">
                      <span className={styles.mono}>{result.stsDns?.value}</span>
                    </Descriptions.Item>
                  </Descriptions>
                  <Button icon={<CopyOutlined />} onClick={() => handleCopy(result.stsDns?.value ?? '')}>
                    复制记录值
                  </Button>
                </Space>
              </Card>

              <Card type="inner" title="3. TLS-RPT DNS TXT 记录（RFC 8460）" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Descriptions size="small" column={1}>
                    <Descriptions.Item label="记录名">
                      <span className={styles.mono}>{result.tlsRptDns?.name}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="记录值">
                      <span className={styles.mono}>{result.tlsRptDns?.value}</span>
                    </Descriptions.Item>
                  </Descriptions>
                  <Button icon={<CopyOutlined />} onClick={() => handleCopy(result.tlsRptDns?.value ?? '')}>
                    复制记录值
                  </Button>
                  <p className={styles.hint}>
                    上线建议：先以 testing 模式与较短 max_age 灰度，观察 TLS-RPT 报告确认无误后，再切换 enforce 并逐步调大 max_age；
                    每次修改策略文件都应更换 id，收件方据此刷新缓存。
                  </p>
                </Space>
              </Card>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default MtaStsTlsRptGenerator;
