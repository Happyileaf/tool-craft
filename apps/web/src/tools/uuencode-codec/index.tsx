'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { uudecode, uuencode } from './utils/uuencode';
import type { UuMode } from './utils/uuencode';
import { DEFAULT_FILENAME, DEFAULT_INPUT, DEFAULT_MODE, MODE_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 经典 Unix uuencode / uudecode 编解码工具：
 * 左栏输入文本或 uuencode 包裹文本，右栏只读展示结果；
 * 编码模式可自定义 begin 行的文件名与权限，全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns uuencode 编解码交互界面
 */
const UuencodeCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<UuMode>('encode');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_INPUT);
  const [filename, setFilename] = React.useState(DEFAULT_FILENAME);
  const [permMode, setPermMode] = React.useState(DEFAULT_MODE);

  const isEncode = mode === 'encode';

  const result = React.useMemo(() => {
    if (isEncode) {
      return uuencode(input, filename, permMode);
    }
    return uudecode(input);
  }, [input, isEncode, filename, permMode]);

  const activeMode = MODE_OPTIONS.find((option) => option.value === mode);

  const handleCopy = () => {
    if (!result.valid || result.output === '') {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(result.output);
    message.success('已复制转换结果');
  };

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card
          className={styles.card}
          title={isEncode ? '输入（UTF-8 文本）' : '输入（uuencode 包裹文本）'}
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
              onChange={(e) => setMode(e.target.value as UuMode)}
            />
          }
        >
          {isEncode ? (
            <div className={styles.toolbar}>
              <span className={styles.toolLabel}>文件名</span>
              <Input
                size="small"
                className={styles.filenameInput}
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="file"
              />
              <span className={styles.toolLabel}>权限</span>
              <Input
                size="small"
                className={styles.modeInput}
                value={permMode}
                addonBefore="mode"
                onChange={(e) => setPermMode(e.target.value)}
                placeholder="644"
              />
            </div>
          ) : null}
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 12, maxRows: 22 }}
            placeholder={
              isEncode ? '输入要编码的文本…' : '粘贴 begin 644 file … end 形式的 uuencode 文本…'
            }
          />
        </Card>

        <Card
          className={styles.card}
          title={isEncode ? '输出（uuencode）' : '输出（解码文本）'}
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          {result.error ? (
            <Alert type="error" showIcon message="转换失败" description={result.error} />
          ) : (
            <Input.TextArea
              value={result.output}
              readOnly
              spellCheck={false}
              className={styles.editor}
              autoSize={{ minRows: 12, maxRows: 22 }}
            />
          )}
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
          {result.valid ? (
            <div className={styles.meta}>
              <span className={styles.metaItem}>
                <span className={styles.metaLabel}>字节数</span>
                <span className={styles.metaValue}>{result.byteCount}</span>
              </span>
              {!isEncode ? (
                <>
                  <span className={styles.metaItem}>
                    <span className={styles.metaLabel}>文件名</span>
                    <span className={styles.metaValue}>{result.filename ?? '—'}</span>
                  </span>
                  <span className={styles.metaItem}>
                    <span className={styles.metaLabel}>权限</span>
                    <span className={styles.metaValue}>{result.mode ?? '—'}</span>
                  </span>
                </>
              ) : null}
            </div>
          ) : null}
        </Card>
      </div>

      <div className={styles.toolbar}>
        <Tag color="blue">{activeMode?.label}</Tag>
        <Space>
          <span className={styles.hint}>
            {activeMode?.hint}；经典 BSD uuencode，与 Python binascii.b2a_uu / a2b_uu
            兼容，每行 45 字节（60 个编码字符），纯浏览器本地运算
          </span>
        </Space>
      </div>
    </div>
  );
};

export default UuencodeCodec;
