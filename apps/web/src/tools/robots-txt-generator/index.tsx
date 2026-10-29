'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, Select, Space, message } from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import { generateRobotsTxt, validateRobots, type RobotsGroup } from './utils/robots';
import {
  COMMON_CRAWLERS,
  DEFAULT_SITEMAPS,
  PRESET_ALLOW_ALL,
  PRESET_BLOCK_AI,
  PRESET_DISALLOW_ALL,
  createDefaultGroups,
  createEmptyGroup,
} from './constants';
import styles from './index.module.css';

/**
 * robots.txt 生成器：多组 User-agent / Allow / Disallow / Crawl-delay
 * 规则与全局 Sitemap 的表单编辑，内置常见爬虫与常用预设，实时生成规范文本并校验。
 *
 * @returns robots.txt 生成器交互界面
 */
const RobotsTxtGenerator: React.FC<ToolComponentProps> = () => {
  const [groups, setGroups] = React.useState<RobotsGroup[]>(createDefaultGroups);
  const [sitemaps, setSitemaps] = React.useState<string>(DEFAULT_SITEMAPS);

  const output = React.useMemo(() => generateRobotsTxt(groups, sitemaps), [groups, sitemaps]);
  const validation = React.useMemo(() => validateRobots(groups, sitemaps), [groups, sitemaps]);

  const updateGroup = (id: number, key: keyof RobotsGroup, value: string): void => {
    setGroups((previous) =>
      previous.map((group) => (group.id === id ? { ...group, [key]: value } : group)),
    );
  };

  const addGroup = (): void => {
    setGroups((previous) => {
      const nextId = previous.reduce((max, group) => Math.max(max, group.id), 0) + 1;
      return [...previous, createEmptyGroup(nextId)];
    });
  };

  const removeGroup = (id: number): void => {
    setGroups((previous) => previous.filter((group) => group.id !== id));
  };

  const applyPreset = (preset: RobotsGroup[]): void => {
    setGroups(preset.map((group, index) => ({ ...group, id: index + 1 })));
    message.success('已填充预设');
  };

  const appendCrawler = (agent: string): void => {
    setGroups((previous) => {
      const nextId = previous.reduce((max, group) => Math.max(max, group.id), 0) + 1;
      return [...previous, { ...createEmptyGroup(nextId), agents: agent }];
    });
  };

  const resetSample = (): void => {
    setGroups(createDefaultGroups());
    setSitemaps(DEFAULT_SITEMAPS);
  };

  const clearAll = (): void => {
    setGroups([createEmptyGroup(1)]);
    setSitemaps('');
  };

  const copyOutput = async (): Promise<void> => {
    if (output === '') {
      message.warning('暂无有效规则');
      return;
    }
    await copyToClipboard(output);
    message.success('robots.txt 内容已复制');
  };

  return (
    <div className={styles.container}>
      <Card title="预设与常见爬虫">
        <Space wrap>
          <Button size="small" onClick={() => applyPreset(PRESET_ALLOW_ALL)}>
            全部允许
          </Button>
          <Button size="small" onClick={() => applyPreset(PRESET_DISALLOW_ALL)}>
            全部禁止
          </Button>
          <Button size="small" onClick={() => applyPreset(PRESET_BLOCK_AI)}>
            屏蔽 AI 爬虫示例
          </Button>
          <Button size="small" icon={<ReloadOutlined />} onClick={resetSample}>
            载入示例
          </Button>
          <Button size="small" onClick={clearAll}>
            清空
          </Button>
        </Space>
        <div style={{ marginTop: 12 }}>
          <Select
            style={{ minWidth: 260 }}
            placeholder="添加常见爬虫为新规则组"
            value={undefined}
            onChange={(agent: string) => appendCrawler(agent)}
            options={COMMON_CRAWLERS.map((crawler) => ({
              value: crawler.agent,
              label: `${crawler.label}（${crawler.agent}）`,
            }))}
          />
        </div>
      </Card>

      {groups.map((group, index) => (
        <Card
          key={group.id}
          size="small"
          className={styles.groupCard}
          title={
            <div className={styles.groupHeader}>
              <span>
                <RobotOutlined /> 规则组 {index + 1}
              </span>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeGroup(group.id)}
              >
                删除
              </Button>
            </div>
          }
        >
          <div className={styles.field}>
            <Input.TextArea
              value={group.agents}
              onChange={(event) => updateGroup(group.id, 'agents', event.target.value)}
              placeholder="User-agent，每行一个，如 * 或 Googlebot"
              autoSize={{ minRows: 1, maxRows: 4 }}
            />
          </div>
          <div className={styles.field}>
            <Input.TextArea
              value={group.allow}
              onChange={(event) => updateGroup(group.id, 'allow', event.target.value)}
              placeholder="Allow 路径，每行一条，须以 / 开头，如 /public/"
              autoSize={{ minRows: 1, maxRows: 6 }}
            />
          </div>
          <div className={styles.field}>
            <Input.TextArea
              value={group.disallow}
              onChange={(event) => updateGroup(group.id, 'disallow', event.target.value)}
              placeholder="Disallow 路径，每行一条，须以 / 开头，如 /admin"
              autoSize={{ minRows: 1, maxRows: 6 }}
            />
          </div>
          <Input
            value={group.crawlDelay}
            onChange={(event) => updateGroup(group.id, 'crawlDelay', event.target.value)}
            placeholder="Crawl-delay 抓取间隔（秒，可留空）"
            style={{ maxWidth: 320 }}
          />
        </Card>
      ))}

      <Button block icon={<PlusOutlined />} onClick={addGroup}>
        添加规则组
      </Button>

      <Card title="Sitemap（每行一条，输出在末尾）">
        <Input.TextArea
          value={sitemaps}
          onChange={(event) => setSitemaps(event.target.value)}
          placeholder="https://example.com/sitemap.xml"
          autoSize={{ minRows: 1, maxRows: 6 }}
        />
      </Card>

      {validation.errors.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          message="存在校验问题（非法内容不会输出）"
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          }
        />
      ) : null}

      <Card
        title="robots.txt 预览"
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
          全部内容仅在浏览器本地拼装，不发起任何网络请求；路径支持 * 与 $ 通配语法。
        </div>
      </Card>
    </div>
  );
};

export default RobotsTxtGenerator;
