'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Segmented,
  Space,
  Statistic,
  Tabs,
  message,
} from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_BBCODE,
  DEFAULT_HTML,
  DIRECTION_OPTIONS,
  type ConvertDirection,
} from './constants';
import { convertBbcodeHtml } from './utils/bbcode';
import styles from './index.module.css';

/**
 * BBCode ↔ HTML 双向转换器：论坛标记与富文本互转，纯浏览器本地计算
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 预留默认输入（本工具内置样例，未使用）
 * @returns BBCode / HTML 转换界面
 */
const BbcodeHtmlConverter: React.FC<ToolComponentProps> = () => {
  const [direction, setDirection] = React.useState<ConvertDirection>('bbcode2html');
  const [bbcode, setBbcode] = React.useState<string>(DEFAULT_BBCODE);
  const [html, setHtml] = React.useState<string>(DEFAULT_HTML);

  const input = direction === 'bbcode2html' ? bbcode : html;
  const result = React.useMemo(
    () => convertBbcodeHtml(input, direction),
    [input, direction],
  );

  const switchDirection = (next: ConvertDirection) => {
    setDirection(next);
  };

  const copyOutput = () => {
    if (!result.output) {
      return;
    }
    void copyToClipboard(result.output);
    message.success('已复制转换结果');
  };

  const loadSample = () => {
    setBbcode(DEFAULT_BBCODE);
    setHtml(DEFAULT_HTML);
  };

  const inputLabel = direction === 'bbcode2html' ? 'BBCode 输入' : 'HTML 输入';
  const outputLabel = direction === 'bbcode2html' ? 'HTML 输出' : 'BBCode 输出';

  return (
    <div className={styles.container}>
      <Alert
        type="info"
        showIcon
        message="论坛 BBCode 与 HTML 双向互转，全程本地计算"
        description="支持 b/i/u/s、url、img、quote、list、code、color、size 等常见标签与嵌套；文本自动做实体转义，javascript: 等危险 URL 会被拦截或降级。内容不会上传服务器。"
      />

      <Card title="转换方向">
        <Segmented
          block
          value={direction}
          onChange={(value) => switchDirection(value as ConvertDirection)}
          options={DIRECTION_OPTIONS.map((option) => ({
            label: option.name,
            value: option.id,
          }))}
        />
      </Card>

      <div className={styles.editorGrid}>
        <Card title={inputLabel}>
          <div className={styles.editorColumn}>
            <Input.TextArea
              className={styles.mono}
              value={input}
              onChange={(event) =>
                direction === 'bbcode2html'
                  ? setBbcode(event.target.value)
                  : setHtml(event.target.value)
              }
              autoSize={{ minRows: 12, maxRows: 24 }}
              spellCheck={false}
            />
            <Space wrap>
              <Button size="small" icon={<ReloadOutlined />} onClick={loadSample}>
                载入样例
              </Button>
              <Button
                size="small"
                icon={<ClearOutlined />}
                onClick={() =>
                  direction === 'bbcode2html' ? setBbcode('') : setHtml('')
                }
              >
                清空
              </Button>
            </Space>
          </div>
        </Card>

        <Card
          title={outputLabel}
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={copyOutput}>
              复制结果
            </Button>
          }
        >
          <Tabs
            items={[
              {
                key: 'code',
                label: '源码',
                children: result.output ? (
                  <Input.TextArea
                    className={styles.mono}
                    value={result.output}
                    readOnly
                    autoSize={{ minRows: 12, maxRows: 24 }}
                    spellCheck={false}
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无输出，请在左侧输入内容"
                  />
                ),
              },
              {
                key: 'preview',
                label: 'HTML 预览',
                children:
                  direction === 'bbcode2html' && result.output ? (
                    <div
                      className={styles.preview}
                      // 输出已对文本节点做实体转义、对 URL 做协议白名单校验
                      dangerouslySetInnerHTML={{ __html: result.output }}
                    />
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="仅 BBCode → HTML 方向提供渲染预览"
                    />
                  ),
              },
            ]}
          />
        </Card>
      </div>

      <Card title="处理统计">
        <div className={styles.statRow}>
          <Statistic title="已处理标签数" value={result.tagsHandled} />
          <Statistic title="降级 / 丢弃标签数" value={result.tagsDropped} />
          <Statistic title="输入字符数" value={input.length} />
          <Statistic title="输出字符数" value={result.output.length} />
        </div>
      </Card>
    </div>
  );
};

export default BbcodeHtmlConverter;
