'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Button,
  Card,
  Checkbox,
  Empty,
  Input,
  Radio,
  Space,
  Statistic,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { countNodes, generateTree, getVisibleNodes } from './utils/tree';
import {
  DEFAULT_ROOT_NAME,
  DEPTH_OPTIONS,
  SAMPLE_INPUT,
  SORT_OPTIONS,
} from './constants';
import type { TreeOptions, TreeSortMode } from './utils/tree';
import styles from './index.module.css';

/**
 * ASCII 文件树生成器：把换行分隔的路径列表渲染为 tree 命令风格的
 * ├── / └── / │ 连接文本，支持排序、深度限制、仅目录与隐藏条目过滤、根名设置。
 * 全部解析与渲染在浏览器本地完成。
 *
 * @returns ASCII 树生成交互界面
 */
const AsciiTreeGenerator: React.FC<ToolComponentProps> = () => {
  const [input, setInput] = React.useState(SAMPLE_INPUT);
  const [sort, setSort] = React.useState<TreeSortMode>('alpha');
  const [directoriesOnly, setDirectoriesOnly] = React.useState(false);
  const [excludeHidden, setExcludeHidden] = React.useState(false);
  const [depthChoice, setDepthChoice] = React.useState<number>(0);
  const [rootNameEnabled, setRootNameEnabled] = React.useState(true);
  const [rootName, setRootName] = React.useState(DEFAULT_ROOT_NAME);

  const options: TreeOptions = React.useMemo(
    () => ({
      sort,
      directoriesOnly,
      excludeHidden,
      maxDepth: depthChoice === 0 ? Infinity : depthChoice,
      rootName: rootNameEnabled ? rootName : undefined,
    }),
    [sort, directoriesOnly, excludeHidden, depthChoice, rootNameEnabled, rootName],
  );

  const output = React.useMemo(() => generateTree(input, options), [input, options]);

  const stats = React.useMemo(
    () => countNodes(getVisibleNodes(input, options)),
    [input, options],
  );

  /**
   * 复制结果到剪贴板（剪贴板不可用时提示）。
   */
  const handleCopy = async () => {
    if (!output) {
      message.warning('暂无可复制的树内容');
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      message.success('已复制 ASCII 树到剪贴板');
    } catch {
      message.error('复制失败，当前环境不允许访问剪贴板');
    }
  };

  return (
    <div className={styles.container}>
      <Card title="ASCII 文件树生成器">
        <div className={styles.toolbar}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={sort}
            onChange={(event) => setSort(event.target.value as TreeSortMode)}
            options={SORT_OPTIONS as unknown as { label: string; value: TreeSortMode }[]}
          />
          <Checkbox
            checked={directoriesOnly}
            onChange={(event) => setDirectoriesOnly(event.target.checked)}
          >
            仅目录
          </Checkbox>
          <Checkbox
            checked={excludeHidden}
            onChange={(event) => setExcludeHidden(event.target.checked)}
          >
            隐藏 . 开头条目
          </Checkbox>
          <span className={styles.toolGroup}>
            最大深度
            <Radio.Group
              optionType="button"
              size="small"
              value={depthChoice}
              onChange={(event) => setDepthChoice(event.target.value as number)}
              options={DEPTH_OPTIONS as unknown as { label: string; value: number }[]}
            />
          </span>
          <span className={styles.toolGroup}>
            <Checkbox
              checked={rootNameEnabled}
              onChange={(event) => setRootNameEnabled(event.target.checked)}
            >
              根名
            </Checkbox>
            <Input
              size="small"
              style={{ width: 120 }}
              disabled={!rootNameEnabled}
              value={rootName}
              onChange={(event) => setRootName(event.target.value)}
            />
          </span>
        </div>
      </Card>

      <div className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>路径列表（每行一个，支持 / 与 \\）</div>
          <Input.TextArea
            className={styles.textarea}
            rows={16}
            spellCheck={false}
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <Button size="small" type="text" onClick={() => setInput(SAMPLE_INPUT)}>
            恢复样例
          </Button>
        </div>
        <div className={styles.panel}>
          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <span className={styles.panelTitle}>生成结果（tree 风格）</span>
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          </Space>
          {output ? (
            <pre className={styles.preWrap}>{output}</pre>
          ) : (
            <div className={styles.preWrap}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span className={styles.empty}>输入至少一个路径后生成树</span>}
              />
            </div>
          )}
          <Space size="large">
            <Statistic title="目录数" value={stats.directories} />
            <Statistic title="文件数" value={stats.files} />
          </Space>
        </div>
      </div>
    </div>
  );
};

export default AsciiTreeGenerator;
