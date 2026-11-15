'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Space, Switch, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import { DEFAULT_PATH, PATH_SAMPLES } from './constants';
import {
  type Direction,
  type PosixStyle,
  convertPathBatch,
  pathKindLabel,
} from './utils/pathConvert';
import styles from './index.module.css';

/**
 * Windows ↔ POSIX 路径转换器：WSL 盘符映射、UNC 双向映射、
 * 分隔符归一与可选的 . / .. 段折叠。
 */
const WindowsPosixPathConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<Direction>('win2posix');
  const [style, setStyle] = React.useState<PosixStyle>('wsl');
  const [normalize, setNormalize] = React.useState(true);
  const [input, setInput] = React.useState<string>(defaultInput ?? DEFAULT_PATH);

  const { results, ignoredEmptyLines } = React.useMemo(
    () => convertPathBatch(input, direction, style, normalize),
    [input, direction, style, normalize],
  );

  const handleCopy = async (text: string) => {
    if (!text) {
      message.warning('暂无可复制的内容');
      return;
    }
    await copyToClipboard(text);
    message.success('已复制到剪贴板');
  };

  const switchDirection = (next: Direction) => {
    setDirection(next);
    setInput(next === 'win2posix' ? DEFAULT_PATH : '/mnt/c/Users/me/project');
  };

  const copyAll = () => {
    const lines = results.filter((result) => result.ok).map((result) => result.output);
    if (lines.length === 0) {
      message.warning('暂无可复制的内容');
      return;
    }
    handleCopy(lines.join('\n'));
  };

  return (
    <div className={styles.container}>
      <Card title="输入">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div className={styles.field}>
            <label>转换方向</label>
            <Radio.Group
              value={direction}
              onChange={(event) => switchDirection(event.target.value as Direction)}
            >
              <Radio.Button value="win2posix">Windows → POSIX</Radio.Button>
              <Radio.Button value="posix2win">POSIX → Windows</Radio.Button>
            </Radio.Group>
          </div>

          <div className={styles.inlineFields}>
            <div className={styles.field}>
              <label>POSIX 风格</label>
              <Radio.Group
                value={style}
                onChange={(event) => setStyle(event.target.value as PosixStyle)}
              >
                <Radio.Button value="wsl">WSL /mnt/c</Radio.Button>
                <Radio.Button value="wsl2">WSL2 /c</Radio.Button>
              </Radio.Group>
            </div>
            <div className={styles.field}>
              <label>段归一（折叠 . 与 ..）</label>
              <Switch checked={normalize} onChange={setNormalize} />
            </div>
          </div>

          <div className={styles.field}>
            <label>路径（支持多行批量转换，空行将忽略）</label>
            <Input.TextArea
              className={styles.mono}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              autoSize={{ minRows: 4, maxRows: 10 }}
              placeholder="例如 C:\Users\me\project 或 /mnt/c/Users/me/project"
            />
            <div className={styles.samples}>
              {PATH_SAMPLES.map((sample) => (
                <Tag key={sample} className={styles.mono} onClick={() => setInput(sample)}>
                  {sample}
                </Tag>
              ))}
            </div>
          </div>
        </Space>
      </Card>

      <Card
        title={`转换结果（${results.length} 条）`}
        extra={
          results.length > 1 ? (
            <Button size="small" icon={<CopyOutlined />} onClick={copyAll}>
              复制全部
            </Button>
          ) : undefined
        }
      >
        {results.length === 0 ? (
          <Alert type="info" showIcon message="请输入至少一条路径" />
        ) : (
          <div className={styles.results}>
            {results.map((result, index) => (
              <div key={`${result.input}-${index}`} className={styles.resultRow}>
                <div className={styles.resultInput}>
                  <span className={styles.label}>输入 · {pathKindLabel(result.kind)}</span>
                  <span className={`${styles.mono} ${styles.inputText}`}>{result.input}</span>
                </div>
                {result.ok ? (
                  <div className={styles.resultOutput}>
                    <span className={styles.label}>输出</span>
                    <div className={styles.outputRow}>
                      <span className={`${styles.mono} ${styles.outputText}`}>{result.output}</span>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopy(result.output)}
                      />
                    </div>
                  </div>
                ) : (
                  <Alert type="error" showIcon message={result.error} />
                )}
                {result.warnings.map((warning) => (
                  <Alert key={warning} type="warning" showIcon message={warning} />
                ))}
              </div>
            ))}
          </div>
        )}
        {ignoredEmptyLines > 0 ? (
          <div className={styles.hint}>已忽略 {ignoredEmptyLines} 个空行。</div>
        ) : null}
      </Card>

      <Alert
        type="info"
        showIcon
        message="转换规则"
        description={
          <div className={styles.hint}>
            <p>
              盘符路径 <span className={styles.mono}>C:\Users\me</span> 在 WSL 风格下映射为
              <span className={styles.mono}> /mnt/c/Users/me</span>，WSL2 风格下为
              <span className={styles.mono}> /c/Users/me</span>；盘符统一转为小写。
              UNC 路径 <span className={styles.mono}>\\server\share</span> 与
              <span className={styles.mono}> //server/share</span> 双向对应。
            </p>
            <p>
              开启段归一后会折叠 <span className={styles.mono}>.</span> 与
              <span className={styles.mono}> ..</span>，并去除重复与尾随分隔符；超出根目录的
              <span className={styles.mono}> ..</span> 会被忽略并给出告警。相对路径、URL 与无法映射的
              POSIX 根路径会原样保留并提示，不会报错。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default WindowsPosixPathConverter;
