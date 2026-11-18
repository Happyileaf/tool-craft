'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  buildInstallCommands,
  createEmptyForm,
  generateServiceUnit,
  validateSystemdForm,
  type SystemdForm,
} from './utils/systemd';
import { DEFAULT_PRESET_KEY, RESTART_OPTIONS, SERVICE_PRESETS, SERVICE_TYPE_OPTIONS } from './constants';
import styles from './index.module.css';

/**
 * systemd .service 单元文件生成器：按 [Unit]/[Service]/[Install] 分组填写表单，
 * 实时生成确定性 INI 风格单元文本与配套 systemctl 安装命令，纯浏览器本地运算。
 *
 * @param _props - 工具组件属性
 * @returns 工具交互界面
 */
const SystemdServiceGenerator: React.FC<ToolComponentProps> = (_props) => {
  const [form, setForm] = React.useState<SystemdForm>(
    () => SERVICE_PRESETS.find((preset) => preset.key === DEFAULT_PRESET_KEY)?.form ?? createEmptyForm(),
  );

  const validation = React.useMemo(() => validateSystemdForm(form), [form]);

  const output = React.useMemo(() => {
    if (!validation.valid) {
      return '';
    }
    try {
      return generateServiceUnit(form);
    } catch {
      return '';
    }
  }, [form, validation.valid]);

  const installCommands = React.useMemo(
    () => (form.unitName.trim() ? buildInstallCommands(form.unitName) : ''),
    [form.unitName],
  );

  const update = <K extends keyof SystemdForm>(key: K, value: SystemdForm[K]): void => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const applyPreset = (key: string): void => {
    const preset = SERVICE_PRESETS.find((item) => item.key === key);
    if (preset) {
      setForm({ ...preset.form });
    }
  };

  const handleCopy = async (text: string, label: string): Promise<void> => {
    if (!text) {
      message.warning('暂无可复制内容');
      return;
    }
    await copyToClipboard(text);
    message.success(`${label}已复制`);
  };

  return (
    <div className={styles.container}>
      <Card
        title="单元配置表单"
        extra={
          <Space wrap>
            {SERVICE_PRESETS.map((preset) => (
              <Button key={preset.key} size="small" onClick={() => applyPreset(preset.key)}>
                {preset.label}
              </Button>
            ))}
            <Button size="small" onClick={() => setForm(createEmptyForm())}>
              清空
            </Button>
          </Space>
        }
      >
        <Form layout="vertical">
          <Form.Item
            label="单元名（不含 .service 后缀）"
            validateStatus={validation.errors.unitName ? 'error' : undefined}
            help={validation.errors.unitName}
          >
            <Input
              value={form.unitName}
              placeholder="如 my-webapp"
              onChange={(event) => update('unitName', event.target.value)}
            />
          </Form.Item>

          <Divider titlePlacement="left">[Unit]</Divider>
          <Form.Item label="Description 描述">
            <Input
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
            />
          </Form.Item>
          <Space wrap size="middle" style={{ display: 'flex' }}>
            <Form.Item label="After（空格分隔多个 target）" style={{ flex: 1, minWidth: 240 }}>
              <Input value={form.after} onChange={(event) => update('after', event.target.value)} />
            </Form.Item>
            <Form.Item label="Wants（弱依赖）" style={{ flex: 1, minWidth: 240 }}>
              <Input value={form.wants} onChange={(event) => update('wants', event.target.value)} />
            </Form.Item>
            <Form.Item label="Requires（强依赖）" style={{ flex: 1, minWidth: 240 }}>
              <Input
                value={form.requires}
                onChange={(event) => update('requires', event.target.value)}
              />
            </Form.Item>
          </Space>

          <Divider titlePlacement="left">[Service]</Divider>
          <Space wrap size="middle" style={{ display: 'flex' }}>
            <Form.Item label="Type" style={{ minWidth: 260 }}>
              <Select
                value={form.type}
                options={SERVICE_TYPE_OPTIONS}
                onChange={(value) => update('type', value)}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="User" style={{ minWidth: 160 }}>
              <Input value={form.user} onChange={(event) => update('user', event.target.value)} />
            </Form.Item>
            <Form.Item label="Group" style={{ minWidth: 160 }}>
              <Input value={form.group} onChange={(event) => update('group', event.target.value)} />
            </Form.Item>
          </Space>
          <Form.Item
            label="ExecStart（必填）"
            validateStatus={validation.errors.execStart ? 'error' : undefined}
            help={validation.errors.execStart}
          >
            <Input
              value={form.execStart}
              placeholder="/usr/bin/node /opt/app/server.js"
              onChange={(event) => update('execStart', event.target.value)}
            />
          </Form.Item>
          <Space wrap size="middle" style={{ display: 'flex' }}>
            <Form.Item label="ExecStop" style={{ flex: 1, minWidth: 240 }}>
              <Input
                value={form.execStop}
                onChange={(event) => update('execStop', event.target.value)}
              />
            </Form.Item>
            <Form.Item label="ExecReload" style={{ flex: 1, minWidth: 240 }}>
              <Input
                value={form.execReload}
                onChange={(event) => update('execReload', event.target.value)}
              />
            </Form.Item>
            <Form.Item label="WorkingDirectory" style={{ flex: 1, minWidth: 240 }}>
              <Input
                value={form.workingDirectory}
                onChange={(event) => update('workingDirectory', event.target.value)}
              />
            </Form.Item>
          </Space>
          <Form.Item
            label="Environment（每行一条 KEY=VALUE）"
            validateStatus={validation.errors.environmentText ? 'error' : undefined}
            help={validation.errors.environmentText}
          >
            <Input.TextArea
              value={form.environmentText}
              autoSize={{ minRows: 2, maxRows: 6 }}
              spellCheck={false}
              className={styles.mono}
              onChange={(event) => update('environmentText', event.target.value)}
            />
          </Form.Item>
          <Space wrap size="middle" style={{ display: 'flex' }}>
            <Form.Item label="Restart" style={{ minWidth: 260 }}>
              <Select
                value={form.restart}
                options={RESTART_OPTIONS}
                onChange={(value) => update('restart', value)}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              label="RestartSec（秒，留空省略）"
              validateStatus={validation.errors.restartSec ? 'error' : undefined}
              help={validation.errors.restartSec}
              style={{ minWidth: 200 }}
            >
              <InputNumber
                value={form.restartSec}
                min={0}
                style={{ width: '100%' }}
                placeholder="如 5"
                onChange={(value) => update('restartSec', value)}
              />
            </Form.Item>
            <Form.Item label="StandardOutput" style={{ minWidth: 160 }}>
              <Input
                value={form.standardOutput}
                placeholder="journal"
                onChange={(event) => update('standardOutput', event.target.value)}
              />
            </Form.Item>
            <Form.Item label="StandardError" style={{ minWidth: 160 }}>
              <Input
                value={form.standardError}
                placeholder="journal"
                onChange={(event) => update('standardError', event.target.value)}
              />
            </Form.Item>
          </Space>

          <Divider titlePlacement="left">[Install]</Divider>
          <Space wrap size="middle" style={{ display: 'flex' }}>
            <Form.Item label="WantedBy" style={{ flex: 1, minWidth: 220 }}>
              <Input
                value={form.wantedBy}
                placeholder="multi-user.target"
                onChange={(event) => update('wantedBy', event.target.value)}
              />
            </Form.Item>
            <Form.Item label="RequiredBy" style={{ flex: 1, minWidth: 220 }}>
              <Input
                value={form.requiredBy}
                onChange={(event) => update('requiredBy', event.target.value)}
              />
            </Form.Item>
            <Form.Item label="Also" style={{ flex: 1, minWidth: 220 }}>
              <Input value={form.also} onChange={(event) => update('also', event.target.value)} />
            </Form.Item>
          </Space>
        </Form>
      </Card>

      <Card
        title={
          <Space>
            <Tag color="blue">{form.unitName.trim() ? `${form.unitName.trim()}.service` : '未命名单元'}</Tag>
            实时输出
          </Space>
        }
        extra={
          <Button
            icon={<CopyOutlined />}
            disabled={!output}
            onClick={() => handleCopy(output, '单元文件 ')}
          >
            复制单元文件
          </Button>
        }
      >
        {!validation.valid && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="表单存在校验错误，修正后才会生成单元文件"
            description={Object.entries(validation.errors)
              .map(([field, reason]) => `${field}: ${reason}`)
              .join('；')}
          />
        )}
        <Input.TextArea value={output} readOnly autoSize={{ minRows: 14, maxRows: 24 }} className={styles.output} />
        {installCommands && (
          <>
            <Divider titlePlacement="left">安装启用命令</Divider>
            <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
              <Input.TextArea
                value={installCommands}
                readOnly
                autoSize={{ minRows: 4, maxRows: 6 }}
                className={styles.output}
              />
              <Button icon={<CopyOutlined />} onClick={() => handleCopy(installCommands, '安装命令 ')}>
                复制命令
              </Button>
            </Space>
          </>
        )}
      </Card>
    </div>
  );
};

export default SystemdServiceGenerator;
