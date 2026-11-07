'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  Space,
  Tag,
  message,
} from 'antd';
import { ClearOutlined, CopyOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  generateChangelog,
  isValidDate,
  type ChangelogOptions,
} from './utils/changelog';
import { DEFAULT_OPTIONS, DEFAULT_SAMPLE_INPUT, SAMPLE_COMMITS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * CHANGELOG.md 生成器：把一批 Conventional Commits 提交信息按
 * Keep a Changelog 1.1.0 分组渲染为可直接粘贴的变更日志片段，全部本地计算。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认提交批次
 * @returns 变更日志生成交互界面
 */
const ChangelogGenerator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [commitsInput, setCommitsInput] = React.useState<string>(
    defaultInput || SAMPLE_COMMITS,
  );
  const [options, setOptions] = React.useState<ChangelogOptions>({
    ...DEFAULT_OPTIONS,
    date: new Date().toISOString().slice(0, 10),
  });

  const updateOption = <K extends keyof ChangelogOptions>(
    key: K,
    value: ChangelogOptions[K],
  ): void => {
    setOptions((previous) => ({ ...previous, [key]: value }));
  };

  const result = React.useMemo(
    () => generateChangelog(commitsInput, options),
    [commitsInput, options],
  );

  const dateInvalid = options.date.trim().length > 0 && !isValidDate(options.date.trim());

  /**
   * 复制生成的 Markdown
   */
  const handleCopy = async (): Promise<void> => {
    if (!result.markdown.trim()) {
      message.warning('请先粘贴提交信息');
      return;
    }
    await copyToClipboard(result.markdown);
    message.success('CHANGELOG 片段已复制');
  };

  /**
   * 下载为 CHANGELOG.md
   */
  const handleDownload = (): void => {
    const blob = new Blob([result.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'CHANGELOG.md';
    anchor.click();
    URL.revokeObjectURL(url);
    message.success('CHANGELOG.md 已开始下载');
  };

  return (
    <div className={styles.container}>
      <Card
        title="提交信息输入"
        extra={
          <Space>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => setCommitsInput(SAMPLE_COMMITS)}
            >
              载入示例
            </Button>
            <Button size="small" icon={<ClearOutlined />} onClick={() => setCommitsInput('')}>
              清空
            </Button>
          </Space>
        }
      >
        <Input.TextArea
          value={commitsInput}
          onChange={(event) => setCommitsInput(event.target.value)}
          placeholder={'每行一条 Conventional Commits 提交，支持 git log --oneline 的短哈希前缀，例如：\nfeat(api): add rate limiting\nfix(web): repair login redirect'}
          autoSize={{ minRows: 8, maxRows: 18 }}
          className={styles.inputArea}
        />
        <div className={styles.hint}>
          识别 <code>type(scope)!: subject</code> 语法；Merge 合并提交自动跳过，无法识别的行会在下方列出且不进入文档。
        </div>
      </Card>

      <Card title="版本与输出选项">
        <div className={styles.formRow}>
          <div className={styles.field}>
            <span className={styles.label}>版本号：</span>
            <Input
              value={options.version}
              onChange={(event) => updateOption('version', event.target.value)}
              placeholder="留空输出 Unreleased，如 1.2.0"
              className={styles.textInput}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>发布日期：</span>
            <Input
              value={options.date}
              onChange={(event) => updateOption('date', event.target.value)}
              placeholder="YYYY-MM-DD"
              className={styles.textInput}
              status={dateInvalid ? 'error' : ''}
            />
          </div>
        </div>
        {dateInvalid ? (
          <Alert
            type="error"
            showIcon
            style={{ marginTop: 8 }}
            message="日期格式不合法，需为真实日历日期 YYYY-MM-DD"
          />
        ) : null}
        <div className={`${styles.optionRow}`} style={{ marginTop: 12 }}>
          <Checkbox
            checked={options.includeScope}
            onChange={(event) => updateOption('includeScope', event.target.checked)}
          >
            条目显示作用域（scope）
          </Checkbox>
          <Checkbox
            checked={options.includeInternal}
            onChange={(event) => updateOption('includeInternal', event.target.checked)}
          >
            收录内部类型（style / test / build / ci / chore 归入 Changed）
          </Checkbox>
          <Checkbox
            checked={options.includeHeader}
            onChange={(event) => updateOption('includeHeader', event.target.checked)}
          >
            输出 Keep a Changelog 文档头
          </Checkbox>
        </div>
      </Card>

      <Card
        title={
          <Space wrap>
            生成结果
            <Tag color="blue">解析 {result.stats.parsedCount}/{result.stats.totalLines}</Tag>
            <Tag color={result.stats.breakingCount > 0 ? 'red' : 'default'}>
              破坏性 {result.stats.breakingCount}
            </Tag>
            <Tag color={result.stats.unrecognizedCount > 0 ? 'orange' : 'green'}>
              未识别 {result.stats.unrecognizedCount}
            </Tag>
            {result.stats.skippedCount > 0 ? (
              <Tag>跳过合并 {result.stats.skippedCount}</Tag>
            ) : null}
          </Space>
        }
        extra={
          <Space>
            <Button type="primary" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownload}>
              下载 CHANGELOG.md
            </Button>
          </Space>
        }
      >
        <Input.TextArea
          value={result.markdown}
          readOnly
          autoSize={{ minRows: 10, maxRows: 24 }}
          className={styles.outputArea}
        />
        {result.unrecognizedLines.length > 0 ? (
          <Alert
            type="warning"
            showIcon
            style={{ marginTop: 12 }}
            message={`${result.unrecognizedLines.length} 行无法识别，未写入文档`}
            description={
              <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                {result.unrecognizedLines.slice(0, 8).map((line) => (
                  <li key={line} className={styles.outputArea}>
                    {line}
                  </li>
                ))}
                {result.unrecognizedLines.length > 8 ? (
                  <li>… 其余 {result.unrecognizedLines.length - 8} 行省略</li>
                ) : null}
              </ul>
            }
          />
        ) : null}
        <div className={styles.hint}>
          分组遵循 Keep a Changelog 1.1.0：Added / Changed / Deprecated / Removed / Fixed /
          Security，破坏性变更在版本下置顶输出；所有解析与拼接仅在浏览器本地完成，不会上传。
        </div>
      </Card>
    </div>
  );
};

export default ChangelogGenerator;
