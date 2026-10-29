'use client';

import React from 'react';
import { Alert, Button, Card, Checkbox, Input, Select, Space, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  COMMIT_TYPES,
  HEADER_MAX_LENGTH,
  generateCommit,
  type CommitInput,
  type CommitType,
} from './utils/commit';
import { COMMIT_TEMPLATES, DEFAULT_COMMIT_INPUT } from './constants';
import styles from './index.module.css';

const EMPTY_INPUT: CommitInput = {
  type: 'feat',
  scope: '',
  subject: '',
  body: '',
  breaking: false,
  breakingNote: '',
  issues: '',
  footers: '',
};

/**
 * Conventional Commits 1.0.0 提交信息生成器：通过表单选择类型、作用域、主题、
 * 正文与 footer，实时预览规范化提交信息并校验常见格式问题，全部在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入（作为主题）
 * @returns 提交信息生成交互界面
 */
const ConventionalCommitGenerator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<CommitInput>({
    ...DEFAULT_COMMIT_INPUT,
    subject: defaultInput || DEFAULT_COMMIT_INPUT.subject,
  });

  const updateField = <K extends keyof CommitInput>(key: K, value: CommitInput[K]): void => {
    setInput((previous) => ({ ...previous, [key]: value }));
  };

  const result = React.useMemo(() => generateCommit(input), [input]);
  const errors = result.issues.filter((item) => item.level === 'error');
  const warnings = result.issues.filter((item) => item.level === 'warning');

  const copyMessage = async (): Promise<void> => {
    if (!result.message) {
      message.warning('请先填写主题');
      return;
    }
    if (errors.length > 0) {
      message.warning('存在校验错误，请修正后再复制');
      return;
    }
    await copyToClipboard(result.message);
    message.success('提交信息已复制');
  };

  return (
    <div className={styles.container}>
      <Card title="Conventional Commits 提交信息生成器">
        <div className={styles.formRow}>
          <span className={styles.label}>类型 type：</span>
          <Select<CommitType>
            className={styles.typeSelect}
            value={input.type}
            onChange={(value) => updateField('type', value)}
            options={COMMIT_TYPES.map((item) => ({
              value: item.value,
              label: `${item.label} — ${item.description}`,
            }))}
          />
        </div>
        <div className={styles.formRow}>
          <span className={styles.label}>作用域 scope：</span>
          <Input
            value={input.scope}
            onChange={(event) => updateField('scope', event.target.value)}
            placeholder="可留空，如 web / api / parser"
          />
        </div>
        <div className={styles.formColumn}>
          <span className={styles.label}>主题 subject：</span>
          <Input
            value={input.subject}
            onChange={(event) => updateField('subject', event.target.value)}
            placeholder="祈使语气简述本次变更，如 add dark mode toggle"
          />
        </div>
        <div className={styles.formColumn}>
          <span className={styles.label}>正文 body：</span>
          <Input.TextArea
            value={input.body}
            onChange={(event) => updateField('body', event.target.value)}
            placeholder="可留空。说明「做了什么、为什么」，每行建议不超过 100 字符"
            autoSize={{ minRows: 3, maxRows: 10 }}
          />
        </div>
        <div className={styles.formColumn}>
          <Checkbox
            checked={input.breaking}
            onChange={(event) => updateField('breaking', event.target.checked)}
          >
            包含破坏性变更（header 追加 !，footer 写入 BREAKING CHANGE）
          </Checkbox>
          {input.breaking ? (
            <Input
              value={input.breakingNote}
              onChange={(event) => updateField('breakingNote', event.target.value)}
              placeholder="破坏性变更说明（强烈建议填写）"
            />
          ) : null}
        </div>
        <div className={styles.formColumn}>
          <span className={styles.label}>Issue / PR：</span>
          <Input.TextArea
            value={input.issues}
            onChange={(event) => updateField('issues', event.target.value)}
            placeholder="每行一个，如 Closes #128 或 Refs #42"
            autoSize={{ minRows: 1, maxRows: 4 }}
          />
        </div>
        <div className={styles.formColumn}>
          <span className={styles.label}>其他 footer：</span>
          <Input.TextArea
            value={input.footers}
            onChange={(event) => updateField('footers', event.target.value)}
            placeholder="每行一个，如 Reviewed-by: Alice 或 Co-authored-by: Bob <bob@x.com>"
            autoSize={{ minRows: 1, maxRows: 4 }}
          />
        </div>

        <Space wrap style={{ marginBottom: 12 }}>
          {COMMIT_TEMPLATES.map((template) => (
            <Button key={template.name} size="small" onClick={() => setInput(template.data)}>
              {template.name}
            </Button>
          ))}
        </Space>
        <div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setInput(DEFAULT_COMMIT_INPUT)}
            >
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setInput(EMPTY_INPUT)}>
              清空
            </Button>
          </Space>
        </div>

        {errors.map((item) => (
          <Alert
            key={item.message}
            type="error"
            showIcon
            message={item.message}
            style={{ marginTop: 8 }}
          />
        ))}
        {warnings.map((item) => (
          <Alert
            key={item.message}
            type="warning"
            showIcon
            message={item.message}
            style={{ marginTop: 8 }}
          />
        ))}
      </Card>

      <Card
        title={
          <Space>
            生成的提交信息
            {result.header ? (
              <Tag color={result.header.length > HEADER_MAX_LENGTH ? 'orange' : 'green'}>
                header {result.header.length} 字符
              </Tag>
            ) : null}
          </Space>
        }
      >
        <Input.TextArea
          value={result.message}
          readOnly
          autoSize={{ minRows: 4, maxRows: 16 }}
          className={styles.output}
        />
        <Space style={{ marginTop: 12 }}>
          <Button type="primary" icon={<CopyOutlined />} onClick={copyMessage}>
            复制提交信息
          </Button>
        </Space>
        <div className={styles.hint}>
          输出结构为 type(scope)!: subject，空行后接 body，再空行后接 footer；类型取自 Conventional
          Commits 1.0.0 的常用集合，BREAKING CHANGE 与 issue 引用会被 changelog 工具识别。所有内容仅在浏览器本地拼接，不会上传。
        </div>
      </Card>
    </div>
  );
};

export default ConventionalCommitGenerator;
