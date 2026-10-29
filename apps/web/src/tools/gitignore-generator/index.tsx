'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Empty, Input, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, FileZipOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { generateGitignore } from './utils/gitignore';
import { DEFAULT_CUSTOM_RULES, DEFAULT_SELECTED_KEYS, TEMPLATE_GROUPS } from './constants';
import styles from './index.module.css';

/**
 * .gitignore 生成器：勾选语言 / 框架 / 编辑器 / 操作系统模板并追加自定义规则，
 * 实时拼装带分组注释头的 .gitignore 文本，跨组去重，全部在浏览器本地完成。
 *
 * @returns .gitignore 生成器交互界面
 */
const GitignoreGenerator: React.FC<ToolComponentProps> = () => {
  const [selectedKeys, setSelectedKeys] = React.useState<string[]>(DEFAULT_SELECTED_KEYS);
  const [customRules, setCustomRules] = React.useState<string>(DEFAULT_CUSTOM_RULES);

  const output = React.useMemo(
    () => generateGitignore(selectedKeys, customRules),
    [selectedKeys, customRules],
  );

  const toggleKey = (key: string, checked: boolean): void => {
    setSelectedKeys((previous) =>
      checked ? [...previous, key] : previous.filter((item) => item !== key),
    );
  };

  const selectAll = (): void => {
    setSelectedKeys(TEMPLATE_GROUPS.map((group) => group.key));
  };

  const clearAll = (): void => {
    setSelectedKeys([]);
  };

  const resetSample = (): void => {
    setSelectedKeys(DEFAULT_SELECTED_KEYS);
    setCustomRules(DEFAULT_CUSTOM_RULES);
  };

  const copyOutput = async (): Promise<void> => {
    if (output === '') {
      message.warning('暂无规则，请先勾选模板或填写自定义规则');
      return;
    }
    await copyToClipboard(output);
    message.success('.gitignore 内容已复制');
  };

  return (
    <div className={styles.container}>
      <Card title="选择模板（语言 / 框架、编辑器、操作系统）">
        <div className={styles.grid}>
          {TEMPLATE_GROUPS.map((group) => (
            <Checkbox
              key={group.key}
              className={styles.checkboxLine}
              checked={selectedKeys.includes(group.key)}
              onChange={(event) => toggleKey(group.key, event.target.checked)}
            >
              {group.label}
            </Checkbox>
          ))}
        </div>
        <Space style={{ marginTop: 12 }}>
          <Button size="small" onClick={selectAll}>
            全选
          </Button>
          <Button size="small" onClick={clearAll}>
            全不选
          </Button>
          <Button size="small" icon={<ReloadOutlined />} onClick={resetSample}>
            载入示例
          </Button>
        </Space>
      </Card>

      <Card title="自定义规则（每行一条，追加到末尾并自动去重）">
        <Input.TextArea
          value={customRules}
          onChange={(event) => setCustomRules(event.target.value)}
          placeholder={'如：\nmy-secret/\n*.local'}
          autoSize={{ minRows: 4, maxRows: 10 }}
        />
      </Card>

      <Card
        title=".gitignore 预览"
        extra={
          <Space>
            <Button icon={<ClearOutlined />} onClick={() => setCustomRules('')}>
              清空自定义
            </Button>
            <Button type="primary" icon={<CopyOutlined />} onClick={copyOutput}>
              复制
            </Button>
          </Space>
        }
      >
        {output === '' ? (
          <Empty description="尚未选择任何模板，也没有自定义规则" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <pre className={styles.output}>{output}</pre>
        )}
        <div className={styles.hint}>
          <FileZipOutlined /> 规则仅在你的浏览器中拼装，不会发起任何网络请求；同名规则跨模板只保留首次出现的位置。
        </div>
      </Card>
    </div>
  );
};

export default GitignoreGenerator;
