'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Space, Switch, Tag, message } from 'antd';
import { CopyOutlined, SwapOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import { SHELL_SAMPLES } from './constants';
import {
  SHELL_LABELS,
  type Shell,
  buildCommandSnippet,
  quoteArg,
  splitArgs,
  unquoteArg,
} from './utils/shellQuote';
import styles from './index.module.css';

type Direction = 'quote' | 'unquote';

const DEFAULT_INPUT = "it's";

/**
 * Shell 参数引用与转义器：POSIX sh / CMD / PowerShell 三目标双向转换，
 * 支持单参数与逐行批量，纯本地字符串处理，不执行任何命令。
 */
const ShellArgumentQuoter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [shell, setShell] = React.useState<Shell>('posix');
  const [direction, setDirection] = React.useState<Direction>('quote');
  const [batch, setBatch] = React.useState(false);
  const [input, setInput] = React.useState<string>(defaultInput ?? DEFAULT_INPUT);

  const args = React.useMemo(() => (batch ? splitArgs(input) : [input]), [batch, input]);

  const results = React.useMemo(
    () =>
      args.map((arg) =>
        direction === 'quote' ? quoteArg(arg, shell) : unquoteArg(arg, shell),
      ),
    [args, direction, shell],
  );

  const handleCopy = async (text: string) => {
    if (!text) {
      message.warning('暂无可复制的内容');
      return;
    }
    await copyToClipboard(text);
    message.success('已复制到剪贴板');
  };

  const copyAll = () => {
    const outputs = results.filter((result) => result.ok).map((result) => result.output);
    if (outputs.length === 0) {
      message.warning('暂无可复制的内容');
      return;
    }
    handleCopy(outputs.join('\n'));
  };

  const swap = () => {
    const outputs = results.filter((result) => result.ok).map((result) => result.output);
    if (outputs.length === 0) {
      message.warning('当前没有可互换的结果');
      return;
    }
    setDirection(direction === 'quote' ? 'unquote' : 'quote');
    setInput(outputs.join('\n'));
  };

  const switchShell = (next: Shell) => {
    setShell(next);
    setDirection('quote');
    setInput(SHELL_SAMPLES[next]?.[0] ?? '');
  };

  const sampleLabel = (sample: string) => sample.replace(/\n/g, '\\n').replace(/\t/g, '\\t') || '（空串）';

  return (
    <div className={styles.container}>
      <Card title="输入">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div className={styles.field}>
            <label>目标 Shell</label>
            <Radio.Group value={shell} onChange={(event) => switchShell(event.target.value as Shell)}>
              {(Object.keys(SHELL_LABELS) as Shell[]).map((key) => (
                <Radio.Button key={key} value={key}>
                  {SHELL_LABELS[key]}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>

          <div className={styles.inlineFields}>
            <div className={styles.field}>
              <label>转换方向</label>
              <Radio.Group
                value={direction}
                onChange={(event) => setDirection(event.target.value as Direction)}
              >
                <Radio.Button value="quote">原文 → 引用参数</Radio.Button>
                <Radio.Button value="unquote">引用参数 → 原文</Radio.Button>
              </Radio.Group>
            </div>
            <div className={styles.field}>
              <label>批量（每行一个参数）</label>
              <Switch checked={batch} onChange={setBatch} />
            </div>
          </div>

          <div className={styles.field}>
            <label>
              {direction === 'quote'
                ? batch
                  ? '原始参数（每行一个）'
                  : '原始字符串（可含换行）'
                : batch
                  ? '已引用参数（每行一个）'
                  : '已引用参数字面量'}
            </label>
            <Input.TextArea
              className={styles.mono}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              autoSize={{ minRows: 3, maxRows: 10 }}
              placeholder={
                direction === 'quote'
                  ? "例如 it's 或 a & b"
                  : shell === 'posix'
                    ? "例如 'Hello World' 或 'it'\\''s'"
                    : shell === 'cmd'
                      ? '例如 "a & b"'
                      : "例如 'it''s'"
              }
            />
            <div className={styles.samples}>
              {(SHELL_SAMPLES[shell] ?? []).map((sample) => (
                <Tag key={sample} className={styles.mono} onClick={() => setInput(sample)}>
                  {sampleLabel(sample)}
                </Tag>
              ))}
            </div>
          </div>

          <Space wrap>
            <Button icon={<SwapOutlined />} onClick={swap}>
              结果作为输入并切换方向
            </Button>
            {args.length > 1 ? (
              <Button icon={<CopyOutlined />} onClick={copyAll}>
                复制全部结果
              </Button>
            ) : null}
          </Space>
        </Space>
      </Card>

      <Card title={`结果（${results.length} 个参数）`}>
        {input === '' && !batch ? (
          <Alert type="info" showIcon message="输入为空，将按空字符串参数处理" style={{ marginBottom: 12 }} />
        ) : null}
        <div className={styles.results}>
          {results.map((result, index) => (
            <div key={`${index}-${result.output}`} className={styles.resultRow}>
              <div className={styles.resultHeader}>
                <span className={styles.label}>
                  {batch ? `参数 #${index + 1}` : '参数'} · {result.ok ? '可复制输出' : '转换失败'}
                </span>
                {result.ok ? (
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(result.output)}
                  >
                    复制
                  </Button>
                ) : null}
              </div>
              {result.ok ? (
                <>
                  <span className={`${styles.mono} ${styles.outputText}`}>{result.output}</span>
                  {direction === 'quote' && !batch ? (
                    <span className={styles.snippet}>
                      命令片段：<span className={styles.mono}>{buildCommandSnippet(result.output)}</span>
                    </span>
                  ) : null}
                </>
              ) : (
                <Alert type="error" showIcon message={result.error} />
              )}
              {result.warnings.map((warning) => (
                <Alert key={warning} type="warning" showIcon message={warning} />
              ))}
            </div>
          ))}
        </div>
      </Card>

      <Alert
        type="info"
        showIcon
        message="规则与限制"
        description={
          <div className={styles.hint}>
            <p>
              POSIX 使用单引号包裹，内部单引号写成
              <span className={styles.mono}> '\'' </span>，含换行或制表符时改用
              <span className={styles.mono}> $'...' </span>；CMD 用双引号包裹，并提示
              <span className={styles.mono}> %VAR% </span> 与
              <span className={styles.mono}> !VAR! </span> 的展开风险；PowerShell 用单引号包裹，内部单引号双写。
            </p>
            <p>
              本工具只处理单个参数，不解析管道、重定向或整条命令行，也不会执行任何命令。含 NUL
              字节的输入会被拒绝；CMD 双引号内无法原生转义双引号，相关输出需在实际目标程序上验证。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default ShellArgumentQuoter;
