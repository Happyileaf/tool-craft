'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Input, Radio, Space, Switch, Table, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  SEPARATOR_LABEL,
  type BatchLine,
  type FormatOptions,
  type SeparatorStyle,
  cleanPhone,
  formatBatch,
  formatE123,
  toE164,
} from './utils/e123';
import { DEFAULT_PHONE_INPUT, SAMPLE_PHONES, SEPARATOR_OPTIONS } from './constants';
import styles from './index.module.css';

/** 安全调用一次转换，返回结果或错误信息 */
function safeRun(fn: () => string): { output: string | null; error: string | null } {
  try {
    return { output: fn(), error: null };
  } catch (caught) {
    return { output: null, error: caught instanceof Error ? caught.message : '格式化失败' };
  }
}

/**
 * ITU-T E.123 电话号码格式化器：在浏览器本地剥离可视分隔符，
 * 在 E.164 无分隔表示与 E.123 人类可读分组形式之间双向转换。
 *
 * @param props - 工具组件属性，支持 defaultInput 预填号码
 * @returns 工具交互界面
 */
const E123PhoneFormatter: React.FC<ToolComponentProps> = (props) => {
  const [input, setInput] = React.useState(props.defaultInput ?? DEFAULT_PHONE_INPUT);
  const [separator, setSeparator] = React.useState<SeparatorStyle>('space');
  const [localParentheses, setLocalParentheses] = React.useState(false);
  const [batchText, setBatchText] = React.useState(SAMPLE_PHONES.join('\n'));

  const options: FormatOptions = React.useMemo(
    () => ({ separator, localParentheses }),
    [separator, localParentheses],
  );

  const e123Result = React.useMemo(() => safeRun(() => formatE123(input, options)), [input, options]);
  const e164Result = React.useMemo(() => safeRun(() => toE164(input)), [input]);
  const cleaned = React.useMemo(() => cleanPhone(input), [input]);
  const batchResult: BatchLine[] = React.useMemo(
    () => formatBatch(batchText, options),
    [batchText, options],
  );

  const handleCopy = async (value: string) => {
    await copyToClipboard(value);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="单个号码转换">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴任意电话号码，如 +86 138-0013-8000 或 (042) 123 4567"
            spellCheck={false}
            className={styles.mono}
            size="large"
          />

          <div className={styles.controls}>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={separator}
              onChange={(event) => setSeparator(event.target.value as SeparatorStyle)}
              options={SEPARATOR_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
            />
            <Space>
              <Switch checked={localParentheses} onChange={setLocalParentheses} />
              <span>本地号码括号长途区号（如 (042) 123 4567）</span>
            </Space>
          </div>

          {cleaned.invalidChars.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`检测到非法字符：${cleaned.invalidChars.join(' ')}（已在数字结果中忽略，但建议清理）`}
            />
          )}

          {e123Result.error ? (
            <Alert type="error" showIcon message="E.123 格式化失败" description={e123Result.error} />
          ) : (
            <ResultBlock label={`E.123 可读形式（${SEPARATOR_LABEL[separator]}）`} value={e123Result.output ?? ''} onCopy={handleCopy} />
          )}

          {e164Result.error ? (
            <Alert type="error" showIcon message="E.164 转换失败" description={e164Result.error} />
          ) : (
            <ResultBlock label="E.164 无分隔形式" value={e164Result.output ?? ''} onCopy={handleCopy} />
          )}

          <Tag color="blue">纯浏览器本地计算，号码不会上传；本工具聚焦可视分隔排版，不做号段真实性校验</Tag>
        </Space>
      </Card>

      <Card className={styles.card} title="批量格式化（每行一个号码，空行自动跳过）">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.TextArea
            value={batchText}
            onChange={(event) => setBatchText(event.target.value)}
            autoSize={{ minRows: 4, maxRows: 10 }}
            spellCheck={false}
            className={styles.mono}
          />
          <Table
            size="small"
            pagination={false}
            rowKey={(record) => `${record.line}`}
            dataSource={batchResult}
            columns={[
              { title: '行', dataIndex: 'line', key: 'line', width: 60 },
              { title: '输入', dataIndex: 'input', key: 'input' },
              {
                title: 'E.123 输出',
                dataIndex: 'output',
                key: 'output',
                render: (value: string | null, record) =>
                  value ? (
                    <Button type="link" size="small" className={styles.mono} onClick={() => handleCopy(value)}>
                      {value}
                    </Button>
                  ) : (
                    <span style={{ color: '#cf1322' }}>{record.error}</span>
                  ),
              },
            ]}
          />
        </Space>
      </Card>
    </div>
  );
};

/** 带复制按钮的结果块 */
const ResultBlock: React.FC<{
  label: string;
  value: string;
  onCopy: (value: string) => Promise<void>;
}> = ({ label, value, onCopy }) => (
  <Card type="inner" size="small">
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <span className={styles.hint}>{label}</span>
      <Space size={12} wrap align="center">
        <span className={styles.resultValue}>{value}</span>
        <Button size="small" icon={<CopyOutlined />} onClick={() => onCopy(value)}>
          复制
        </Button>
      </Space>
    </Space>
  </Card>
);

export default E123PhoneFormatter;
