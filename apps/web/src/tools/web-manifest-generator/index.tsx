'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Tabs,
  message,
} from 'antd';
import { CopyOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  buildHeadSnippet,
  buildManifest,
  validateManifest,
  type ManifestForm,
  type ManifestIcon,
  type ManifestShortcut,
} from './utils/manifest';
import {
  DEFAULT_FORM,
  DIR_OPTIONS,
  DISPLAY_OPTIONS,
  ICON_SIZE_PRESETS,
  ORIENTATION_OPTIONS,
  PURPOSE_OPTIONS,
  createEmptyIcon,
  createEmptyShortcut,
} from './constants';
import styles from './index.module.css';

/**
 * Web App Manifest 生成器：填写基础字段、图标列表与快捷方式，
 * 实时生成 2 空格缩进的 manifest.json 与 head 引入片段，带必填与格式校验。
 *
 * @returns manifest 生成器交互界面
 */
const WebManifestGenerator: React.FC<ToolComponentProps> = () => {
  const [form, setForm] = React.useState<ManifestForm>(DEFAULT_FORM);

  const json = React.useMemo(() => buildManifest(form), [form]);
  const head = React.useMemo(() => buildHeadSnippet(form), [form]);
  const validation = React.useMemo(() => validateManifest(form), [form]);

  const updateField = <K extends keyof ManifestForm>(key: K, value: ManifestForm[K]): void => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const updateIcon = (index: number, key: keyof ManifestIcon, value: unknown): void => {
    setForm((previous) => ({
      ...previous,
      icons: previous.icons.map((icon, iconIndex) =>
        iconIndex === index ? { ...icon, [key]: value } : icon,
      ),
    }));
  };

  const updateShortcut = (
    index: number,
    key: keyof ManifestShortcut,
    value: string,
  ): void => {
    setForm((previous) => ({
      ...previous,
      shortcuts: previous.shortcuts.map((shortcut, shortcutIndex) =>
        shortcutIndex === index ? { ...shortcut, [key]: value } : shortcut,
      ),
    }));
  };

  const resetSample = (): void => setForm(DEFAULT_FORM);
  const clearAll = (): void =>
    setForm({ ...DEFAULT_FORM, name: '', startUrl: '', icons: [], shortcuts: [] });

  const copy = async (text: string, label: string): Promise<void> => {
    await copyToClipboard(text);
    message.success(`${label}已复制`);
  };

  return (
    <div className={styles.container}>
      <Card
        title="基础信息"
        extra={
          <Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={resetSample}>
              载入示例
            </Button>
            <Button size="small" onClick={clearAll}>
              清空
            </Button>
          </Space>
        }
      >
        <div className={styles.grid}>
          <div>
            <span className={styles.fieldLabel}>name（必填）</span>
            <Input
              value={form.name}
              status={form.name.trim() === '' ? 'error' : undefined}
              onChange={(event) => updateField('name', event.target.value)}
            />
          </div>
          <div>
            <span className={styles.fieldLabel}>short_name</span>
            <Input
              value={form.shortName}
              onChange={(event) => updateField('shortName', event.target.value)}
            />
          </div>
          <div>
            <span className={styles.fieldLabel}>start_url（必填）</span>
            <Input
              value={form.startUrl}
              status={form.startUrl.trim() === '' ? 'error' : undefined}
              placeholder="/"
              onChange={(event) => updateField('startUrl', event.target.value)}
            />
          </div>
          <div>
            <span className={styles.fieldLabel}>scope</span>
            <Input
              value={form.scope}
              placeholder="/"
              onChange={(event) => updateField('scope', event.target.value)}
            />
          </div>
          <div>
            <span className={styles.fieldLabel}>display</span>
            <Select
              value={form.display}
              options={DISPLAY_OPTIONS}
              style={{ width: '100%' }}
              onChange={(value) => updateField('display', value)}
            />
          </div>
          <div>
            <span className={styles.fieldLabel}>orientation</span>
            <Select
              value={form.orientation}
              options={ORIENTATION_OPTIONS}
              style={{ width: '100%' }}
              onChange={(value) => updateField('orientation', value)}
            />
          </div>
          <div>
            <span className={styles.fieldLabel}>theme_color</span>
            <Input
              value={form.themeColor}
              placeholder="#0f172a"
              onChange={(event) => updateField('themeColor', event.target.value)}
            />
          </div>
          <div>
            <span className={styles.fieldLabel}>background_color</span>
            <Input
              value={form.backgroundColor}
              placeholder="#ffffff"
              onChange={(event) => updateField('backgroundColor', event.target.value)}
            />
          </div>
          <div>
            <span className={styles.fieldLabel}>lang</span>
            <Input
              value={form.lang}
              placeholder="zh-CN"
              onChange={(event) => updateField('lang', event.target.value)}
            />
          </div>
          <div>
            <span className={styles.fieldLabel}>dir</span>
            <Select
              value={form.dir}
              options={DIR_OPTIONS}
              style={{ width: '100%' }}
              onChange={(value) => updateField('dir', value)}
            />
          </div>
          <div>
            <span className={styles.fieldLabel}>id</span>
            <Input
              value={form.id}
              placeholder="/"
              onChange={(event) => updateField('id', event.target.value)}
            />
          </div>
          <div>
            <span className={styles.fieldLabel}>categories（逗号 / 换行分隔）</span>
            <Input
              value={form.categories}
              placeholder="productivity,utilities"
              onChange={(event) => updateField('categories', event.target.value)}
            />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <span className={styles.fieldLabel}>description</span>
          <Input.TextArea
            value={form.description}
            autoSize={{ minRows: 1, maxRows: 4 }}
            onChange={(event) => updateField('description', event.target.value)}
          />
        </div>
      </Card>

      <Card
        title={`图标 icons（${form.icons.length}）`}
        extra={
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => updateField('icons', [...form.icons, createEmptyIcon()])}
          >
            添加图标
          </Button>
        }
      >
        {form.icons.length === 0 ? (
          <Empty description="尚无图标" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          form.icons.map((icon, index) => (
            <div className={styles.iconRow} key={index}>
              <Input
                value={icon.src}
                placeholder="/icons/icon-192.png"
                onChange={(event) => updateIcon(index, 'src', event.target.value)}
              />
              <Input
                value={icon.sizes}
                placeholder="192x192"
                onChange={(event) => updateIcon(index, 'sizes', event.target.value)}
              />
              <Select
                value={icon.type || undefined}
                allowClear
                placeholder="MIME"
                options={[
                  { value: 'image/png', label: 'image/png' },
                  { value: 'image/svg+xml', label: 'image/svg+xml' },
                  { value: 'image/webp', label: 'image/webp' },
                ]}
                onChange={(value) => updateIcon(index, 'type', value ?? '')}
              />
              <Checkbox.Group
                options={PURPOSE_OPTIONS}
                value={icon.purposes}
                onChange={(values) => updateIcon(index, 'purposes', values as string[])}
              />
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  updateField(
                    'icons',
                    form.icons.filter((_, iconIndex) => iconIndex !== index),
                  )
                }
              />
            </div>
          ))
        )}
        <Space style={{ marginTop: 8 }}>
          {ICON_SIZE_PRESETS.map((preset) => (
            <Button
              key={preset}
              size="small"
              onClick={() =>
                updateField(
                  'icons',
                  [...form.icons, { ...createEmptyIcon(), sizes: preset }],
                )
              }
            >
              新增 {preset}
            </Button>
          ))}
        </Space>
      </Card>

      <Card
        title={`快捷方式 shortcuts（${form.shortcuts.length}）`}
        extra={
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => updateField('shortcuts', [...form.shortcuts, createEmptyShortcut()])}
          >
            添加快捷方式
          </Button>
        }
      >
        {form.shortcuts.length === 0 ? (
          <Empty description="尚无快捷方式" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          form.shortcuts.map((shortcut, index) => (
            <div className={styles.shortcutRow} key={index}>
              <Input
                value={shortcut.name}
                placeholder="name"
                onChange={(event) => updateShortcut(index, 'name', event.target.value)}
              />
              <Input
                value={shortcut.shortName}
                placeholder="short_name"
                onChange={(event) => updateShortcut(index, 'shortName', event.target.value)}
              />
              <Input
                value={shortcut.url}
                placeholder="/compose"
                onChange={(event) => updateShortcut(index, 'url', event.target.value)}
              />
              <Input
                value={shortcut.iconSrc}
                placeholder="图标 src（可空）"
                onChange={(event) => updateShortcut(index, 'iconSrc', event.target.value)}
              />
              <Input
                value={shortcut.iconSizes}
                placeholder="96x96"
                onChange={(event) => updateShortcut(index, 'iconSizes', event.target.value)}
              />
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  updateField(
                    'shortcuts',
                    form.shortcuts.filter((_, shortcutIndex) => shortcutIndex !== index),
                  )
                }
              />
            </div>
          ))
        )}
      </Card>

      {validation.errors.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          message="存在校验问题（修正前请不要直接部署）"
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          }
        />
      ) : null}

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card
            title="manifest.json"
            extra={
              <Button
                size="small"
                type="primary"
                icon={<CopyOutlined />}
                onClick={() => copy(json, 'manifest.json ')}
              >
                复制
              </Button>
            }
          >
            <pre className={styles.output}>{json}</pre>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="HTML head 片段"
            extra={
              <Button
                size="small"
                type="primary"
                icon={<CopyOutlined />}
                onClick={() => copy(head, 'head 片段')}
              >
                复制
              </Button>
            }
          >
            <pre className={styles.output}>{head}</pre>
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          items={[
            {
              key: 'deploy',
              label: '部署说明',
              children: (
                <div className={styles.hint}>
                  将 JSON 保存为 manifest.json 放置于站点根目录（或任意路径，scope 不能超出其所在目录），并把
                  head 片段加入 HTML 的 <code>&lt;head&gt;</code>
                  中。PWA 安装通常还需要配合 Service Worker；图标建议至少提供 192×192 与 512×512
                  两种尺寸，并额外准备一张带安全区的 maskable 图标。全部内容仅在浏览器本地拼装，不发起任何网络请求。
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default WebManifestGenerator;
