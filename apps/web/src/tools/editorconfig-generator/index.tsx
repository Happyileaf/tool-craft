'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Collapse,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Tag,
  message,
} from 'antd';
import { CopyOutlined, ImportOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  generateEditorConfig,
  parseEditorConfig,
  type BaseSettings,
  type CharsetOption,
  type EditorConfigModel,
  type EolOption,
  type ParseResult,
} from './utils/editorconfig';
import {
  BOOLEAN_OPTIONS,
  CHARSET_OPTIONS,
  DEFAULT_MODEL,
  EOL_OPTIONS,
  EXTRA_PRESETS,
  GENERIC_PRESET,
  INDENT_STYLE_OPTIONS,
} from './constants';
import styles from './index.module.css';

/**
 * .editorconfig 生成器：左侧表单配置 root、通用 [*] 段并勾选常用文件类型预设，
 * 右侧实时预览规范文本；折叠区支持把已有 .editorconfig 文本反向解析为模型概览。
 * 全部运算在浏览器本地完成。
 *
 * @returns .editorconfig 生成器交互界面
 */
const EditorconfigGenerator: React.FC<ToolComponentProps> = () => {
  const [root, setRoot] = React.useState<boolean>(DEFAULT_MODEL.root);
  const [generic, setGeneric] = React.useState<BaseSettings>({
    ...DEFAULT_MODEL.sections[0]!.settings,
  });
  const [extraGlobs, setExtraGlobs] = React.useState<string[]>([]);
  const [parseText, setParseText] = React.useState<string>('');
  const [parseResult, setParseResult] = React.useState<ParseResult | null>(null);

  const model = React.useMemo<EditorConfigModel>(
    () => ({
      root,
      sections: [
        { glob: GENERIC_PRESET.glob, settings: generic },
        ...EXTRA_PRESETS.filter((preset) => extraGlobs.includes(preset.glob)).map((preset) => ({
          glob: preset.glob,
          settings: { ...preset.settings },
        })),
      ],
    }),
    [root, generic, extraGlobs],
  );

  const result = React.useMemo(() => generateEditorConfig(model), [model]);

  const togglePreset = (glob: string, checked: boolean): void => {
    setExtraGlobs((previous) =>
      checked ? [...previous, glob] : previous.filter((item) => item !== glob),
    );
  };

  const maxLineOff = generic.maxLineLength === 'off' || generic.maxLineLength === undefined;

  const handleCopy = async (): Promise<void> => {
    if (!result.valid || result.output === '') {
      message.warning('暂无可复制的内容，请先修正表单错误');
      return;
    }
    await copyToClipboard(result.output);
    message.success('.editorconfig 内容已复制');
  };

  const handleParse = (): void => {
    if (parseText.trim() === '') {
      message.warning('请先粘贴 .editorconfig 文本');
      return;
    }
    const parsed = parseEditorConfig(parseText);
    setParseResult(parsed);
    if (parsed.warnings.length > 0) {
      message.warning(`解析完成，共 ${parsed.model.sections.length} 段，${parsed.warnings.length} 条告警`);
    } else {
      message.success(`解析完成，共 ${parsed.model.sections.length} 个 section`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card className={styles.card} title=".editorconfig 设置">
          <div className={styles.switchRow}>
            <Switch checked={root} onChange={setRoot} />
            <span>
              root = true<Tag color="blue">标记为最顶层配置</Tag>
            </span>
          </div>

          <div className={styles.sectionTitle}>通用段 [*]</div>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>charset（字符集）</label>
              <Select<CharsetOption>
                value={generic.charset}
                options={CHARSET_OPTIONS}
                onChange={(value) => setGeneric((prev) => ({ ...prev, charset: value }))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>end_of_line（换行符）</label>
              <Select<EolOption>
                value={generic.endOfLine}
                options={EOL_OPTIONS}
                onChange={(value) => setGeneric((prev) => ({ ...prev, endOfLine: value }))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>indent_style（缩进风格）</label>
              <Select<'space' | 'tab'>
                value={generic.indentStyle}
                options={INDENT_STYLE_OPTIONS}
                onChange={(value) => setGeneric((prev) => ({ ...prev, indentStyle: value }))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>indent_size（缩进宽度，1–24）</label>
              <InputNumber
                min={1}
                max={24}
                precision={0}
                style={{ width: '100%' }}
                value={typeof generic.indentSize === 'number' ? generic.indentSize : null}
                onChange={(value) =>
                  setGeneric((prev) => ({ ...prev, indentSize: value ?? undefined }))
                }
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>tab_width（Tab 宽度，1–24，可留空）</label>
              <InputNumber
                min={1}
                max={24}
                precision={0}
                placeholder="留空则不输出"
                style={{ width: '100%' }}
                value={generic.tabWidth ?? null}
                onChange={(value) =>
                  setGeneric((prev) => ({ ...prev, tabWidth: value ?? undefined }))
                }
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>max_line_length（每行最大长度）</label>
              <div className={styles.inlineRow}>
                <Switch
                  size="small"
                  checked={maxLineOff}
                  onChange={(checked) =>
                    setGeneric((prev) => ({
                      ...prev,
                      maxLineLength: checked ? 'off' : 100,
                    }))
                  }
                />
                <span className={styles.switchText}>{maxLineOff ? 'off' : '限长'}</span>
                {!maxLineOff ? (
                  <InputNumber
                    min={1}
                    precision={0}
                    style={{ width: '100%' }}
                    value={generic.maxLineLength as number}
                    onChange={(value) =>
                      setGeneric((prev) => ({ ...prev, maxLineLength: value ?? 1 }))
                    }
                  />
                ) : null}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>insert_final_newline（结尾插入换行）</label>
              <Select<'true' | 'false'>
                value={
                  generic.insertFinalNewline === undefined
                    ? undefined
                    : generic.insertFinalNewline
                      ? 'true'
                      : 'false'
                }
                options={BOOLEAN_OPTIONS}
                allowClear
                placeholder="留空则不输出"
                onChange={(value) =>
                  setGeneric((prev) => ({
                    ...prev,
                    insertFinalNewline: value === undefined ? undefined : value === 'true',
                  }))
                }
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>trim_trailing_whitespace（去除尾随空白）</label>
              <Select<'true' | 'false'>
                value={
                  generic.trimTrailingWhitespace === undefined
                    ? undefined
                    : generic.trimTrailingWhitespace
                      ? 'true'
                      : 'false'
                }
                options={BOOLEAN_OPTIONS}
                allowClear
                placeholder="留空则不输出"
                onChange={(value) =>
                  setGeneric((prev) => ({
                    ...prev,
                    trimTrailingWhitespace: value === undefined ? undefined : value === 'true',
                  }))
                }
              />
            </div>
          </div>

          <div className={styles.sectionTitle}>附加段（按文件类型勾选预设）</div>
          <div className={styles.presets}>
            {EXTRA_PRESETS.map((preset) => (
              <Checkbox
                key={preset.glob}
                className={styles.presetItem}
                checked={extraGlobs.includes(preset.glob)}
                onChange={(event) => togglePreset(preset.glob, event.target.checked)}
              >
                <span className={styles.presetLabel}>{preset.label}</span>
                <Tag>{preset.glob}</Tag>
              </Checkbox>
            ))}
          </div>
        </Card>

        <Card
          className={styles.card}
          title=".editorconfig 预览"
          extra={
            <Button size="small" type="primary" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          <Input.TextArea
            value={result.valid ? result.output : ''}
            readOnly
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
          />
          {result.error ? (
            <Alert
              type="error"
              showIcon
              className={styles.warningItem}
              style={{ marginTop: 12 }}
              message={result.error}
            />
          ) : null}
          {result.warnings.length > 0 ? (
            <div className={styles.warnings}>
              {result.warnings.map((warning, index) => (
                <Alert
                  key={`${index}-${warning}`}
                  type="warning"
                  showIcon
                  className={styles.warningItem}
                  message={warning}
                />
              ))}
            </div>
          ) : null}
        </Card>
      </div>

      <Collapse
        items={[
          {
            key: 'parse',
            label: '反向解析：粘贴已有 .editorconfig 文本，解析出 root 与各 section 概览',
            children: (
              <div className={styles.parseBox}>
                <Space style={{ marginBottom: 12 }}>
                  <Button type="primary" onClick={handleParse}>
                    开始解析
                  </Button>
                  <Button
                    icon={<ImportOutlined />}
                    onClick={() => setParseText(result.output)}
                  >
                    载入右侧生成结果
                  </Button>
                </Space>
                <Input.TextArea
                  value={parseText}
                  onChange={(event) => setParseText(event.target.value)}
                  spellCheck={false}
                  className={styles.editor}
                  autoSize={{ minRows: 8, maxRows: 18 }}
                  placeholder={'root = true\n\n[*]\nindent_style = space\nindent_size = 2\nend_of_line = lf\ncharset = utf-8\n\n[*.md]\ntrim_trailing_whitespace = false'}
                />
                {parseResult ? (
                  <>
                    <Alert
                      type="success"
                      showIcon
                      style={{ marginTop: 12 }}
                      message={`root = ${parseResult.model.root ? 'true' : 'false'}；共 ${parseResult.model.sections.length} 个 section`}
                      description={
                        parseResult.model.sections.length > 0 ? (
                          <Space size={[8, 8]} wrap>
                            {parseResult.model.sections.map((section) => (
                              <Tag key={section.glob} color="blue">
                                [{section.glob}] · {Object.keys(section.settings).length} 项
                              </Tag>
                            ))}
                          </Space>
                        ) : null
                      }
                    />
                    {parseResult.warnings.length > 0 ? (
                      <div className={styles.warnings}>
                        {parseResult.warnings.map((warning, index) => (
                          <Alert
                            key={`${index}-${warning}`}
                            type="warning"
                            showIcon
                            className={styles.warningItem}
                            message={warning}
                          />
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            ),
          },
        ]}
      />

      <div className={styles.toolbar}>
        <Tag color="blue">EditorConfig</Tag>
        <Space>
          <span className={styles.hint}>
            属性与取值遵循 editorconfig.org 官方规范；更靠后、glob 更精确的 section
            会覆盖通用 [*] 段；纯浏览器本地生成与解析，不发起网络请求。
          </span>
        </Space>
      </div>
    </div>
  );
};

export default EditorconfigGenerator;
