'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Empty, Input, Radio, Select, Space, Tag, message } from 'antd';
import {
  ClearOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  generateGitattributes,
  validateRules,
  VALUE_ATTRIBUTE_PREFIXES,
  type GitAttributeRule,
  type GlobalLinePolicy,
} from './utils/gitattributes';
import {
  ATTRIBUTE_GROUPS,
  BINARY_PRESETS,
  GLOBAL_POLICY_OPTIONS,
  PROJECT_TEMPLATES,
  createDefaultRules,
  createEmptyRule,
  type BinaryPreset,
  type ProjectTemplate,
} from './constants';
import styles from './index.module.css';

const nextRuleId = (rules: GitAttributeRule[]): number =>
  rules.reduce((max, rule) => Math.max(max, rule.id), 0) + 1;

/**
 * .gitattributes 生成器：选择全局换行策略，按规则行编辑 pattern 与分组属性，
 * 内置二进制预设与 Node / Python / Unity / 通用 Web 项目模板，
 * 实时生成带分组注释的 .gitattributes 文本并校验，全部运算在浏览器本地完成。
 *
 * @returns .gitattributes 生成器交互界面
 */
const GitattributesGenerator: React.FC<ToolComponentProps> = () => {
  const [globalPolicy, setGlobalPolicy] = React.useState<GlobalLinePolicy>('auto-lf');
  const [rules, setRules] = React.useState<GitAttributeRule[]>(createDefaultRules);

  const output = React.useMemo(
    () => generateGitattributes(globalPolicy, rules),
    [globalPolicy, rules],
  );
  const validation = React.useMemo(() => validateRules(rules), [rules]);

  const attributeOptions = ATTRIBUTE_GROUPS.map((group) => ({
    label: group.label,
    options: group.options.map((option) => ({
      value: option.value,
      label: option.label,
      title: option.description ?? option.label,
    })),
  }));

  const updateRule = (id: number, patch: Partial<GitAttributeRule>): void => {
    setRules((previous) =>
      previous.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    );
  };

  const addRule = (): void => {
    setRules((previous) => [...previous, createEmptyRule(nextRuleId(previous))]);
  };

  const removeRule = (id: number): void => {
    setRules((previous) => previous.filter((rule) => rule.id !== id));
  };

  const handleAttributesChange = (id: number, values: string[]): void => {
    updateRule(id, { attributes: values });
  };

  const handleValueChange = (rule: GitAttributeRule, prefix: string, value: string): void => {
    const attributes = rule.attributes.map((attribute) =>
      attribute.startsWith(prefix) ? `${prefix}${value.trim()}` : attribute,
    );
    updateRule(rule.id, { attributes });
  };

  const appendPreset = (preset: BinaryPreset): void => {
    setRules((previous) => {
      const baseId = nextRuleId(previous);
      const additions: GitAttributeRule[] = preset.rules.map((item, index) => ({
        id: baseId + index,
        pattern: item.pattern,
        attributes: [...item.attributes],
        enabled: true,
        group: preset.label,
      }));
      return [...previous, ...additions];
    });
    message.success(`已追加 ${preset.label} 预设`);
  };

  const applyTemplate = (template: ProjectTemplate): void => {
    setRules(
      template.rules.map((item, index) => ({
        id: index + 1,
        pattern: item.pattern,
        attributes: [...item.attributes],
        enabled: item.enabled,
        group: item.group,
      })),
    );
    message.success(`已填充 ${template.label} 模板`);
  };

  const resetSample = (): void => {
    setGlobalPolicy('auto-lf');
    setRules(createDefaultRules());
  };

  const clearAll = (): void => {
    setRules([createEmptyRule(1)]);
  };

  const copyOutput = async (): Promise<void> => {
    if (output === '') {
      message.warning('暂无有效规则');
      return;
    }
    await copyToClipboard(output);
    message.success('.gitattributes 内容已复制');
  };

  return (
    <div className={styles.container}>
      <Card title="全局换行符策略">
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={globalPolicy}
          onChange={(event) => setGlobalPolicy(event.target.value as GlobalLinePolicy)}
          options={GLOBAL_POLICY_OPTIONS}
        />
      </Card>

      <Card title="项目模板（填充一组规则，替换当前规则列表）">
        <Space wrap>
          {PROJECT_TEMPLATES.map((template) => (
            <Button key={template.key} size="small" onClick={() => applyTemplate(template)}>
              {template.label}
            </Button>
          ))}
          <Button size="small" icon={<ReloadOutlined />} onClick={resetSample}>
            载入示例
          </Button>
          <Button size="small" icon={<ClearOutlined />} onClick={clearAll}>
            清空
          </Button>
        </Space>
        <div className={styles.hint}>
          {PROJECT_TEMPLATES.map((template) => (
            <div key={template.key}>
              <Tag color="blue">{template.label}</Tag>
              {template.description}
            </div>
          ))}
        </div>
      </Card>

      <Card title="常用二进制预设（一键追加为可编辑规则行）">
        <Space wrap>
          {BINARY_PRESETS.map((preset) => (
            <Button key={preset.key} size="small" onClick={() => appendPreset(preset)}>
              {preset.label}（{preset.rules.length} 条）
            </Button>
          ))}
        </Space>
        <Alert
          className={styles.binaryNote}
          type="info"
          showIcon
          message="binary 等价于 -diff -merge -text：不生成文本 diff、不参与文本合并、不做换行转换，适合图片、字体、压缩包等二进制文件。"
        />
      </Card>

      {rules.map((rule, index) => {
        const valueEntries = rule.attributes.filter((attribute) =>
          VALUE_ATTRIBUTE_PREFIXES.some((prefix) => attribute.startsWith(prefix)),
        );
        return (
          <Card
            key={rule.id}
            size="small"
            className={`${styles.ruleCard} ${rule.enabled ? '' : styles.disabledCard}`}
            title={
              <div className={styles.ruleHeader}>
                <Checkbox
                  checked={rule.enabled}
                  onChange={(event) => updateRule(rule.id, { enabled: event.target.checked })}
                >
                  规则 {index + 1}
                </Checkbox>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeRule(rule.id)}
                >
                  删除
                </Button>
              </div>
            }
          >
            <div className={styles.fieldRow}>
              <Input
                value={rule.pattern}
                onChange={(event) => updateRule(rule.id, { pattern: event.target.value })}
                placeholder="pattern，如 *.sh、docs/ 或 /LICENSE"
                className={styles.patternInput}
              />
              <Input
                value={rule.group ?? ''}
                onChange={(event) => updateRule(rule.id, { group: event.target.value })}
                placeholder="分组注释名（可选）"
                className={styles.groupInput}
              />
            </div>
            <Select
              mode="multiple"
              className={styles.attributeSelect}
              value={rule.attributes}
              onChange={(values: string[]) => handleAttributesChange(rule.id, values)}
              options={attributeOptions}
              placeholder="选择一个或多个属性"
            />
            {valueEntries.length > 0 ? (
              <div className={styles.valueRow}>
                {valueEntries.map((attribute) => {
                  const prefix = VALUE_ATTRIBUTE_PREFIXES.find((item) =>
                    attribute.startsWith(item),
                  )!;
                  return (
                    <Input
                      key={prefix}
                      addonBefore={prefix}
                      value={attribute.slice(prefix.length)}
                      onChange={(event) => handleValueChange(rule, prefix, event.target.value)}
                      placeholder={prefix === 'linguist-language=' ? '语言名，如 TypeScript' : '驱动名，如 ours'}
                      className={styles.valueInput}
                    />
                  );
                })}
              </div>
            ) : null}
          </Card>
        );
      })}

      <Button block icon={<PlusOutlined />} onClick={addRule}>
        添加规则
      </Button>

      {validation.errors.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          message="存在校验问题（非法规则不会输出）"
          description={
            <ul className={styles.errorList}>
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          }
        />
      ) : null}

      <Card
        title=".gitattributes 预览"
        extra={
          <Button type="primary" icon={<CopyOutlined />} onClick={copyOutput}>
            复制
          </Button>
        }
      >
        {output === '' ? (
          <Empty description="尚无有效规则" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <pre className={styles.output}>{output}</pre>
        )}
        <div className={styles.hint}>
          全部内容仅在浏览器本地拼装，不发起任何网络请求；停用或校验不通过的规则不会输出。
        </div>
      </Card>
    </div>
  );
};

export default GitattributesGenerator;
