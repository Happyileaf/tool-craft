'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Divider, Input, Radio, Select, Space, Switch, message } from 'antd';
import {
  ClearOutlined,
  CopyOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  CSP_PRESET_DIRECTIVES,
  COEP_SELECT_OPTIONS,
  COOP_SELECT_OPTIONS,
  CORP_SELECT_OPTIONS,
  FORMAT_OPTIONS,
  FRAME_OPTIONS,
  PERMISSION_FEATURE_OPTIONS,
  REFERRER_OPTIONS,
  createEmptyConfig,
  createSampleConfig,
  emptyDirective,
  emptyPermission,
} from './constants';
import { formatHeaders, validateConfig, type HeaderFormat, type SecurityHeadersConfig } from './utils/headers';
import styles from './index.module.css';

/**
 * HTTP 安全响应头生成器：勾选并配置 CSP、HSTS、X-Frame-Options、
 * X-Content-Type-Options、Referrer-Policy、Permissions-Policy 与
 * 跨源隔离三件套，实时输出原始响应头 / Nginx / Apache / HTML meta
 * 四种形式，并对危险配置（unsafe-inline/eval、preload 条件等）
 * 给出校验提示。全部在浏览器本地计算。
 *
 * @returns 安全响应头生成器交互界面
 */
const SecurityHeadersGenerator: React.FC<ToolComponentProps> = () => {
  const [config, setConfig] = React.useState<SecurityHeadersConfig>(createSampleConfig);
  const [format, setFormat] = React.useState<HeaderFormat>('nginx');

  const output = React.useMemo(() => formatHeaders(config, format), [config, format]);
  const issues = React.useMemo(() => validateConfig(config), [config]);
  const errors = issues.filter((issue) => issue.level === 'error');
  const warnings = issues.filter((issue) => issue.level === 'warning');

  /**
   * 浅量更新顶层字段
   *
   * @param patch - 需要合并的字段
   */
  const patch = (patch: Partial<SecurityHeadersConfig>): void => {
    setConfig((previous) => ({ ...previous, ...patch }));
  };

  /**
   * 更新数组型配置的某一行
   *
   * @param key - 字段名
   * @param index - 行索引
   * @param rowPatch - 行内字段更新
   */
  const updateRow = <K extends 'cspDirectives' | 'permissionsPolicy'>(
    key: K,
    index: number,
    rowPatch: Partial<SecurityHeadersConfig[K][number]>,
  ): void => {
    setConfig((previous) => {
      const rows = previous[key].map((row, current) =>
        current === index ? { ...row, ...rowPatch } : row,
      );
      return { ...previous, [key]: rows };
    });
  };

  /**
   * 复制输出
   */
  const handleCopy = async (): Promise<void> => {
    if (output.trim() === '') {
      message.warning('暂无可复制内容');
      return;
    }
    await copyToClipboard(output);
    message.success('配置已复制');
  };

  return (
    <div className={styles.container}>
      <Card
        title="安全响应头配置"
        extra={
          <Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={() => setConfig(createSampleConfig())}>
              载入示例
            </Button>
            <Button size="small" icon={<ClearOutlined />} onClick={() => setConfig(createEmptyConfig())}>
              清空
            </Button>
          </Space>
        }
      >
        {/* CSP */}
        <div className={styles.headerRow}>
          <div>
            <div className={styles.headerTitle}>Content-Security-Policy（CSP）</div>
            <div className={styles.headerHint}>
              限制脚本 / 样式 / 图片等资源来源，是防 XSS 与数据注入最核心的响应头
            </div>
          </div>
          <Space>
            <Checkbox
              checked={config.cspReportOnly}
              disabled={!config.cspEnabled}
              onChange={(event) => patch({ cspReportOnly: event.target.checked })}
            >
              仅报告模式（Report-Only）
            </Checkbox>
            <Switch checked={config.cspEnabled} onChange={(checked) => patch({ cspEnabled: checked })} />
          </Space>
        </div>
        {config.cspEnabled ? (
          <div className={styles.directiveList}>
            {config.cspDirectives.map((directive, index) => (
              <div className={styles.directiveRow} key={index}>
                <Input
                  className={styles.directiveName}
                  value={directive.name}
                  placeholder="指令名，如 default-src"
                  onChange={(event) => updateRow('cspDirectives', index, { name: event.target.value })}
                />
                <Input
                  className={styles.directiveValue}
                  value={directive.value}
                  placeholder="source 列表，如 'self' https://cdn.example.com（无值指令留空）"
                  onChange={(event) => updateRow('cspDirectives', index, { value: event.target.value })}
                />
                <Button
                  type="text"
                  danger
                  icon={<MinusCircleOutlined />}
                  onClick={() =>
                    patch({ cspDirectives: config.cspDirectives.filter((_, current) => current !== index) })
                  }
                />
              </div>
            ))}
            <Space wrap>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => patch({ cspDirectives: [...config.cspDirectives, emptyDirective()] })}
              >
                添加指令
              </Button>
              {CSP_PRESET_DIRECTIVES.filter(
                (preset) =>
                  !config.cspDirectives.some(
                    (directive) => directive.name.trim().toLowerCase() === preset.name,
                  ),
              ).map((preset) => (
                <Button
                  key={preset.name}
                  size="small"
                  onClick={() =>
                    patch({
                      cspDirectives: [
                        ...config.cspDirectives,
                        {
                          name: preset.name,
                          value: preset.hint.startsWith('（') ? '' : preset.hint,
                        },
                      ],
                    })
                  }
                >
                  + {preset.name}
                </Button>
              ))}
            </Space>
          </div>
        ) : null}

        <Divider />

        {/* HSTS */}
        <div className={styles.headerRow}>
          <div>
            <div className={styles.headerTitle}>Strict-Transport-Security（HSTS）</div>
            <div className={styles.headerHint}>强制浏览器在指定时间内只通过 HTTPS 访问本站</div>
          </div>
          <Switch
            checked={config.hsts.enabled}
            onChange={(checked) =>
              patch({ hsts: { ...config.hsts, enabled: checked } })
            }
          />
        </div>
        {config.hsts.enabled ? (
          <div className={styles.inlineFields}>
            <span>max-age（秒）</span>
            <Input
              className={styles.numberInput}
              value={config.hsts.maxAge}
              onChange={(event) =>
                patch({ hsts: { ...config.hsts, maxAge: event.target.value } })
              }
            />
            <Checkbox
              checked={config.hsts.includeSubDomains}
              onChange={(event) =>
                patch({ hsts: { ...config.hsts, includeSubDomains: event.target.checked } })
              }
            >
              includeSubDomains
            </Checkbox>
            <Checkbox
              checked={config.hsts.preload}
              onChange={(event) => patch({ hsts: { ...config.hsts, preload: event.target.checked } })}
            >
              preload（需 max-age ≥ 31536000 且包含子域）
            </Checkbox>
          </div>
        ) : null}

        <Divider />

        {/* 其余头 */}
        <div className={styles.headerTitle}>其他常用响应头</div>
        <div className={styles.standardGrid}>
          <div className={styles.standardField}>
            <div className={styles.fieldLabel}>X-Frame-Options（防点击劫持）</div>
            <Select
              className={styles.fullWidth}
              allowClear
              placeholder="不输出"
              value={config.frameOptions || undefined}
              onChange={(value) => patch({ frameOptions: (value ?? '') as SecurityHeadersConfig['frameOptions'] })}
              options={[...FRAME_OPTIONS]}
            />
          </div>
          <div className={styles.standardField}>
            <div className={styles.fieldLabel}>X-Content-Type-Options</div>
            <Checkbox
              checked={config.contentTypeNosniff}
              onChange={(event) => patch({ contentTypeNosniff: event.target.checked })}
            >
              nosniff（禁止 MIME 嗅探，建议始终开启）
            </Checkbox>
          </div>
          <div className={styles.standardField}>
            <div className={styles.fieldLabel}>Referrer-Policy</div>
            <Select
              className={styles.fullWidth}
              allowClear
              showSearch
              placeholder="不输出"
              value={config.referrerPolicy || undefined}
              onChange={(value) => patch({ referrerPolicy: value ?? '' })}
              options={REFERRER_OPTIONS}
            />
          </div>
          <div className={styles.standardField}>
            <div className={styles.fieldLabel}>Cross-Origin-Opener-Policy（COOP）</div>
            <Select
              className={styles.fullWidth}
              allowClear
              placeholder="不输出"
              value={config.coop || undefined}
              onChange={(value) => patch({ coop: value ?? '' })}
              options={COOP_SELECT_OPTIONS}
            />
          </div>
          <div className={styles.standardField}>
            <div className={styles.fieldLabel}>Cross-Origin-Embedder-Policy（COEP）</div>
            <Select
              className={styles.fullWidth}
              allowClear
              placeholder="不输出（require-corp 会影响跨源资源加载）"
              value={config.coep || undefined}
              onChange={(value) => patch({ coep: value ?? '' })}
              options={COEP_SELECT_OPTIONS}
            />
          </div>
          <div className={styles.standardField}>
            <div className={styles.fieldLabel}>Cross-Origin-Resource-Policy（CORP）</div>
            <Select
              className={styles.fullWidth}
              allowClear
              placeholder="不输出"
              value={config.corp || undefined}
              onChange={(value) => patch({ corp: value ?? '' })}
              options={CORP_SELECT_OPTIONS}
            />
          </div>
        </div>

        <Divider />

        {/* Permissions-Policy */}
        <div className={styles.headerTitle}>Permissions-Policy（浏览器特性授权）</div>
        <div className={styles.headerHint}>allowlist 用空格分隔：留空 = 全部拒绝；self = 允许本站；* = 允许任意源；或填写 https://example.com</div>
        <div className={styles.directiveList}>
          {config.permissionsPolicy.map((rule, index) => (
            <div className={styles.directiveRow} key={index}>
              <Select
                className={styles.directiveName}
                showSearch
                value={rule.feature || undefined}
                placeholder="特性，如 camera"
                onChange={(value) => updateRow('permissionsPolicy', index, { feature: value ?? '' })}
                options={PERMISSION_FEATURE_OPTIONS}
              />
              <Input
                className={styles.directiveValue}
                value={rule.allowlist}
                placeholder="self https://example.com；留空表示 camera=() 全部禁用"
                onChange={(event) => updateRow('permissionsPolicy', index, { allowlist: event.target.value })}
              />
              <Button
                type="text"
                danger
                icon={<MinusCircleOutlined />}
                onClick={() =>
                  patch({
                    permissionsPolicy: config.permissionsPolicy.filter((_, current) => current !== index),
                  })
                }
              />
            </div>
          ))}
          <Button
            type="dashed"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => patch({ permissionsPolicy: [...config.permissionsPolicy, emptyPermission()] })}
          >
            添加特性规则
          </Button>
        </div>
      </Card>

      {errors.length > 0 ? (
        <Alert
          type="error"
          showIcon
          message="配置存在错误"
          description={
            <ul className={styles.issueList}>
              {errors.map((issue) => (
                <li key={issue.message}>{issue.message}</li>
              ))}
            </ul>
          }
        />
      ) : null}
      {warnings.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          message="安全建议"
          description={
            <ul className={styles.issueList}>
              {warnings.map((issue) => (
                <li key={issue.message}>{issue.message}</li>
              ))}
            </ul>
          }
        />
      ) : null}

      <Card
        title="生成的配置"
        extra={
          <Button type="primary" icon={<CopyOutlined />} onClick={handleCopy}>
            复制
          </Button>
        }
      >
        <Radio.Group
          value={format}
          onChange={(event) => setFormat(event.target.value as HeaderFormat)}
          optionType="button"
          buttonStyle="solid"
          options={FORMAT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
        />
        <div className={styles.formatHint}>
          {FORMAT_OPTIONS.find((option) => option.value === format)?.hint}
        </div>
        <pre className={styles.output}>{output || '（未启用任何响应头）'}</pre>
        <div className={styles.hint}>
          所有配置仅在浏览器本地拼装，不发起网络请求。上线前建议先用 CSP Report-Only 观察上报，确认无误业务后再切换强制模式。
        </div>
      </Card>
    </div>
  );
};

export default SecurityHeadersGenerator;
