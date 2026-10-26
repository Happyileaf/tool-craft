'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Descriptions, Input, Radio, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { analyzeLineEndings, convertLineEndings } from './utils/lineEndings';
import { DEFAULT_INPUT, LINE_ENDING_META, TARGET_OPTIONS, type TargetLineEnding } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 换行符检测与批量转换器：检测文本中 LF / CRLF / CR 的构成与混排、BOM、末尾换行及字节大小，
 * 一键将全部行结束符归一化为目标类型。全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns 换行符检测与转换交互界面
 */
const LineEndingConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_INPUT);
  const [target, setTarget] = React.useState<TargetLineEnding>('LF');
  const [stripBomChecked, setStripBomChecked] = React.useState<boolean>(true);

  const analysis = React.useMemo(() => analyzeLineEndings(input), [input]);

  const conversion = React.useMemo(
    () => (input.length > 0 ? convertLineEndings(input, target, stripBomChecked) : null),
    [input, target, stripBomChecked],
  );

  /**
   * 复制转换后的文本
   */
  const handleCopy = async () => {
    if (!conversion) {
      return;
    }
    await copyToClipboard(conversion.output);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="换行符检测与归一化转换">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴或输入需要检测 / 转换换行符的文本"
            autoSize={{ minRows: 6, maxRows: 16 }}
            spellCheck={false}
            className={styles.monoOutput}
          />

          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="LF（\n，Unix / macOS）">
              {analysis.counts.lf} 处
            </Descriptions.Item>
            <Descriptions.Item label="CRLF（\r\n，Windows）">
              {analysis.counts.crlf} 处
            </Descriptions.Item>
            <Descriptions.Item label="CR（\r，经典 Mac）">
              {analysis.counts.cr} 处
            </Descriptions.Item>
            <Descriptions.Item label="检测结论">
              {analysis.totalEndings === 0 ? (
                <span className={styles.mutedText}>无换行符</span>
              ) : (
                <Space size={4} wrap>
                  {analysis.types.map((type) => (
                    <Tag key={type} color="blue">
                      {LINE_ENDING_META[type]?.label ?? type}
                    </Tag>
                  ))}
                  {analysis.isMixed && <Tag color="warning">混排（mixed）</Tag>}
                  {!analysis.isMixed && <Tag color="success">单一换行符</Tag>}
                </Space>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="总行数">{analysis.lineCount} 行</Descriptions.Item>
            <Descriptions.Item label="UTF-8 字节大小">
              {analysis.byteLength} 字节
            </Descriptions.Item>
            <Descriptions.Item label="末尾换行">
              {analysis.hasFinalNewline ? (
                <Tag color="green">有（以换行符结尾）</Tag>
              ) : (
                <Tag>无（最后一行未换行）</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="UTF-8 BOM（EF BB BF）">
              {analysis.hasBom ? (
                <Tag color="orange">检测到开头 BOM</Tag>
              ) : (
                <span className={styles.mutedText}>无</span>
              )}
            </Descriptions.Item>
          </Descriptions>

          <Space size="middle" wrap>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={target}
              onChange={(event) => setTarget(event.target.value as TargetLineEnding)}
              options={TARGET_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
            />
            <Checkbox
              checked={stripBomChecked}
              onChange={(event) => setStripBomChecked(event.target.checked)}
            >
              剥离开头 BOM
            </Checkbox>
          </Space>

          {conversion ? (
            <>
              <Alert
                type={conversion.byteDelta === 0 ? 'info' : 'success'}
                showIcon
                message={
                  <Space size="large" wrap>
                    <span>
                      已归一化为 <strong>{LINE_ENDING_META[target]?.label ?? target}</strong>
                    </span>
                    <span>
                      字节：{conversion.bytesBefore} → {conversion.bytesAfter}（
                      {conversion.byteDelta >= 0 ? '+' : ''}
                      {conversion.byteDelta} 字节）
                    </span>
                    {conversion.bomStripped && <Tag color="orange">已剥离 BOM</Tag>}
                  </Space>
                }
              />
              <Input.TextArea
                value={conversion.output}
                readOnly
                autoSize={{ minRows: 6, maxRows: 16 }}
                spellCheck={false}
                className={styles.monoOutput}
              />
              <Button icon={<CopyOutlined />} onClick={handleCopy}>
                复制转换结果
              </Button>
            </>
          ) : (
            <Alert type="info" showIcon message="输入文本后将显示检测结果与归一化输出" />
          )}

          <div className={styles.hint}>
            换行符按「先匹配 CRLF，再匹配 LF / CR」的顺序扫描统计，因此混排计数不会重复；
            转换会把全部行结束符（含混排）统一替换为目标格式，BOM 仅在勾选时从开头剥离，其余内容字节保持不变。
            所有处理均在浏览器本地完成，不上传任何内容。
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default LineEndingConverter;
