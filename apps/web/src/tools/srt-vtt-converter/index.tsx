'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, InputNumber, Radio, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { convertSubtitle } from './utils/subtitle';
import type { SubtitleMode } from './utils/subtitle';
import { MODE_OPTIONS, DEFAULT_INPUT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const SrtVttConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<SubtitleMode>('srt2vtt');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);
  const [shiftMs, setShiftMs] = React.useState<number>(0);

  const result = React.useMemo(
    () => convertSubtitle(input, mode, { shiftMs }),
    [input, mode, shiftMs],
  );

  const handleCopy = () => {
    if (result.output === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.output);
    message.success('已复制转换结果');
  };

  const activeMode = MODE_OPTIONS.find((option) => option.value === mode);

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card
          className={styles.card}
          title={mode === 'srt2vtt' ? '输入（SRT 字幕）' : '输入（WebVTT 字幕）'}
          extra={
            <Radio.Group
              size="small"
              optionType="button"
              buttonStyle="solid"
              value={mode}
              options={MODE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(e) => setMode(e.target.value as SubtitleMode)}
            />
          }
        >
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder={
              mode === 'srt2vtt'
                ? '粘贴 SRT 字幕：序号行 + HH:MM:SS,mmm --> HH:MM:SS,mmm + 正文…'
                : '粘贴 WebVTT 字幕：首行 WEBVTT，支持 NOTE/REGION/STYLE 块与定位设置…'
            }
          />
        </Card>

        <Card
          className={styles.card}
          title={mode === 'srt2vtt' ? '输出（WebVTT 字幕）' : '输出（SRT 字幕）'}
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          <Input.TextArea
            value={result.output}
            readOnly
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
          />
          {result.valid ? (
            <div className={styles.meta}>
              <span className={styles.metaItem}>
                <span className={styles.metaLabel}>字幕条目</span>
                <span className={styles.metaValue}>{result.cueCount} 条</span>
              </span>
            </div>
          ) : null}
          {result.error ? (
            <div className={styles.warnings}>
              <Alert type="error" showIcon className={styles.warningItem} message={result.error} />
            </div>
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

      <div className={styles.toolbar}>
        <Tag color="blue">{activeMode?.label}</Tag>
        <Space size={8} wrap>
          <span className={styles.toolLabel}>时间偏移</span>
          <InputNumber
            size="small"
            value={shiftMs}
            step={100}
            onChange={(value) => setShiftMs(value ?? 0)}
            addonAfter="ms"
            style={{ width: 140 }}
          />
        </Space>
        <span className={styles.hint}>{activeMode?.hint}；偏移可正可负，纯浏览器本地运算</span>
      </div>
    </div>
  );
};

export default SrtVttConverter;
