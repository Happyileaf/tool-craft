'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Collapse,
  Empty,
  Input,
  Radio,
  Segmented,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  COOP_VALUES,
  CSP_DIRECTIVES,
  CSP_SOURCE_PRESETS,
  EMPTY_OUTPUT_TEXT,
  HSTS_AGE_PRESETS,
  HSTS_PRELOAD_MIN_AGE,
  PERMISSION_ALLOW_VALUES,
  PERMISSION_FEATURES,
  REFERRER_POLICY_VALUES,
  X_FRAME_OPTIONS_VALUES,
} from './constants';
import {
  buildSecurityHeaders,
  renderApache,
  renderNginx,
  type CspDirectiveConfig,
  type PermissionAllow,
  type SecurityHeadersConfig,
} from './utils/headers';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/** 输出格式 */
type OutputFormat = 'raw' | 'nginx' | 'apache';

/** 推荐基线：站点全站 HTTPS、同源资源为主 */
function createDefaultConfig(): SecurityHeadersConfig {
  return {
    hstsMaxAge: HSTS_PRELOAD_MIN_AGE,
    hstsIncludeSubDomains: true,
    hstsPreload: false,
    xFrameOptions: 'SAMEORIGIN',
    contentTypeNosniff: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    coop: 'same-origin',
    permissions: { camera: 'none', microphone: 'none', geolocation: 'none' },
    cspDirectives: [
      { name: 'default-src', sources: ["'self'"] },
      { name: 'object-src', sources: ["'none'"] },
      { name: 'base-uri', sources: ["'self'"] },
      { name: 'frame-ancestors', sources: ["'self'"] },
    ],
    cspReportOnly: false,
  };
}

/**
 * HTTP 安全响应头生成器：表单化配置 HSTS / XFO / nosniff / Referrer-Policy /
 * COOP / Permissions-Policy / CSP，实时生成头字段及 Nginx、Apache 配置，
 * 并对 preload、unsafe-inline 等危险组合给出告警。全部本地运算。
 *
 * @param props - 工具组件属性
 * @returns 安全响应头生成器界面
 */
const SecurityHeadersGenerator: React.FC<ToolComponentProps> = () => {
  const [config, setConfig] = React.useState<SecurityHeadersConfig>(createDefaultConfig);
  const [format, setFormat] = React.useState<OutputFormat>('raw');

  const result = React.useMemo(() => buildSecurityHeaders(config), [config]);

  const patch = React.useCallback(
    <K extends keyof SecurityHeadersConfig>(key: K, value: SecurityHeadersConfig[K]) => {
      setConfig((previous) => ({ ...previous, [key]: value }));
    },
    [],
  );

  const outputText = React.useMemo(() => {
    if (format === 'nginx') {
      return renderNginx(result.headers);
    }
    if (format === 'apache') {
      return renderApache(result.headers);
    }
    return result.headers.map((header) => `${header.name}: ${header.value}`).join('\n');
  }, [format, result.headers]);

  const handleCopy = async () => {
    if (!outputText) {
      return;
    }
    await copyToClipboard(outputText);
    message.success('安全响应头配置已复制');
  };

  // CSP 指令编辑：只保留启用的指令；默认指令固定展示
  const enabledDirectiveNames = React.useMemo(
    () => new Set(config.cspDirectives.map((directive) => directive.name)),
    [config.cspDirectives],
  );

  const updateDirectiveSources = (name: string, sources: string[]) => {
    setConfig((previous) => {
      const exists = previous.cspDirectives.some((directive) => directive.name === name);
      if (exists) {
        return {
          ...previous,
          cspDirectives: previous.cspDirectives.map((directive) =>
            directive.name === name ? { ...directive, sources } : directive,
          ),
        };
      }
      return {
        ...previous,
        cspDirectives: [...previous.cspDirectives, { name, sources }],
      };
    });
  };

  const toggleDirective = (name: string, enabled: boolean) => {
    setConfig((previous) => {
      if (enabled) {
        return previous.cspDirectives.some((directive) => directive.name === name)
          ? previous
          : { ...previous, cspDirectives: [...previous.cspDirectives, { name, sources: ["'self'"] }] };
      }
      return {
        ...previous,
        cspDirectives: previous.cspDirectives.filter((directive) => directive.name !== name),
      };
    });
  };

  return (
    <div className={styles.container}>
      <Card
        title="HTTP 安全响应头生成器"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => setConfig(createDefaultConfig())}>
            重置为推荐基线
          </Button>
        }
      >
        <Alert
          type="info"
          showIcon
          message="所有配置在浏览器本地完成，实时生成响应头；告警项表示配置仍可输出，但存在安全风险或不符合规范要求。"
        />
      </Card>

      <div className={styles.layout}>
        {/* 左侧：配置表单 */}
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card size="small" title="1. Strict-Transport-Security（HSTS）">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space wrap>
                <Switch
                  checked={config.hstsMaxAge !== null}
                  onChange={(checked) => patch('hstsMaxAge', checked ? HSTS_PRELOAD_MIN_AGE : null)}
                />
                <span>启用 HSTS</span>
              </Space>
              {config.hstsMaxAge !== null && (
                <>
                  <Select
                    className={styles.fullWidth}
                    value={config.hstsMaxAge}
                    options={HSTS_AGE_PRESETS.map((preset) => ({
                      label: preset.label,
                      value: preset.value,
                    }))}
                    onChange={(value) => patch('hstsMaxAge', value)}
                  />
                  <Checkbox
                    checked={config.hstsIncludeSubDomains}
                    onChange={(event) => patch('hstsIncludeSubDomains', event.target.checked)}
                  >
                    includeSubDomains（策略覆盖所有子域）
                  </Checkbox>
                  <Checkbox
                    checked={config.hstsPreload}
                    onChange={(event) => patch('hstsPreload', event.target.checked)}
                  >
                    preload（申请浏览器内置预加载列表）
                  </Checkbox>
                </>
              )}
            </Space>
          </Card>

          <Card size="small" title="2. X-Frame-Options / X-Content-Type-Options">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio.Group
                value={config.xFrameOptions ?? 'OFF'}
                onChange={(event) =>
                  patch('xFrameOptions', event.target.value === 'OFF' ? null : event.target.value)
                }
                options={[
                  ...X_FRAME_OPTIONS_VALUES.map((item) => ({ label: item.label, value: item.value })),
                  { label: '不启用（仅依赖 CSP frame-ancestors）', value: 'OFF' },
                ]}
              />
              <Checkbox
                checked={config.contentTypeNosniff}
                onChange={(event) => patch('contentTypeNosniff', event.target.checked)}
              >
                X-Content-Type-Options: nosniff（禁止 MIME 嗅探，强烈建议保持开启）
              </Checkbox>
            </Space>
          </Card>

          <Card size="small" title="3. Referrer-Policy / Cross-Origin-Opener-Policy">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <div className={styles.sectionHint}>Referrer-Policy</div>
                <Select
                  className={styles.fullWidth}
                  value={config.referrerPolicy ?? 'OFF'}
                  onChange={(value) => patch('referrerPolicy', value === 'OFF' ? null : value)}
                  options={[
                    ...REFERRER_POLICY_VALUES.map((value) => ({ label: value, value })),
                    { label: '不启用', value: 'OFF' },
                  ]}
                />
              </div>
              <div>
                <div className={styles.sectionHint}>Cross-Origin-Opener-Policy</div>
                <Select
                  className={styles.fullWidth}
                  value={config.coop ?? 'OFF'}
                  onChange={(value) => patch('coop', value === 'OFF' ? null : value)}
                  options={[
                    ...COOP_VALUES.map((item) => ({ label: item.label, value: item.value })),
                    { label: '不启用', value: 'OFF' },
                  ]}
                />
              </div>
            </Space>
          </Card>

          <Card size="small" title="4. Permissions-Policy（特性访问控制）">
            <Table
              size="small"
              pagination={false}
              rowKey="key"
              dataSource={PERMISSION_FEATURES.map((feature) => ({ ...feature }))}
              columns={[
                {
                  title: '浏览器特性',
                  dataIndex: 'label',
                  key: 'label',
                },
                {
                  title: '授权范围',
                  key: 'allow',
                  width: 200,
                  render: (_, record) => (
                    <Select
                      size="small"
                      style={{ width: '100%' }}
                      value={config.permissions[record.key] ?? 'none'}
                      onChange={(value: PermissionAllow) =>
                        patch('permissions', { ...config.permissions, [record.key]: value })
                      }
                      options={PERMISSION_ALLOW_VALUES.map((item) => ({
                        label: item.label,
                        value: item.value,
                      }))}
                    />
                  ),
                },
              ]}
            />
          </Card>

          <Card
            size="small"
            title="5. Content-Security-Policy"
            extra={
              <Switch
                checked={!config.cspReportOnly}
                checkedChildren="强制"
                unCheckedChildren="Report-Only"
                onChange={(checked) => patch('cspReportOnly', !checked)}
              />
            }
          >
            <Collapse
              size="small"
              items={CSP_DIRECTIVES.map((directive) => {
                const enabled = enabledDirectiveNames.has(directive.key);
                const current: CspDirectiveConfig | undefined = config.cspDirectives.find(
                  (item) => item.name === directive.key,
                );
                return {
                  key: directive.key,
                  label: (
                    <Space>
                      <Checkbox
                        checked={enabled}
                        onChange={(event) => toggleDirective(directive.key, event.target.checked)}
                        onClick={(event) => event.stopPropagation()}
                      />
                      <span>{directive.label}</span>
                      {enabled && <Tag color="blue">{current?.sources.join(' ')}</Tag>}
                    </Space>
                  ),
                  children: (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Select
                        mode="tags"
                        className={styles.fullWidth}
                        placeholder="选择常用源或输入具体域名（如 https://cdn.example.com）"
                        value={current?.sources ?? []}
                        onChange={(value) => updateDirectiveSources(directive.key, value)}
                        options={CSP_SOURCE_PRESETS.map((preset) => ({
                          label: preset.label,
                          value: preset.value,
                        }))}
                      />
                      <div className={styles.sectionHint}>
                        关键字（self / none / unsafe-inline 等）需带单引号；自定义源直接填写，如 https://cdn.example.com。
                      </div>
                    </Space>
                  ),
                };
              })}
            />
          </Card>
        </Space>

        {/* 右侧：输出 */}
        <Card
          size="small"
          title="生成结果"
          extra={
            <Button type="text" icon={<CopyOutlined />} onClick={handleCopy} disabled={result.headers.length === 0}>
              复制
            </Button>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <Segmented
              value={format}
              onChange={(value) => setFormat(value as OutputFormat)}
              options={[
                { label: 'HTTP 头', value: 'raw' },
                { label: 'Nginx', value: 'nginx' },
                { label: 'Apache', value: 'apache' },
              ]}
            />
            {result.headers.length === 0 ? (
              <Empty description={EMPTY_OUTPUT_TEXT} />
            ) : (
              <Input.TextArea
                className={styles.headerOutput}
                value={outputText}
                readOnly
                autoSize={{ minRows: 10, maxRows: 24 }}
              />
            )}
            {result.warnings.map((warning, index) => (
              <Alert
                key={index}
                type="warning"
                showIcon
                message={warning}
              />
            ))}
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default SecurityHeadersGenerator;
