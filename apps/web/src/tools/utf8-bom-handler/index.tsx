'use client';

import React from 'react';
import { Alert, Button, Card, Descriptions, Input, Radio, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { DEFAULT_INPUT, INPUT_PLACEHOLDER, MODE_OPTIONS } from './constants';
import { BOM_BYTE_LENGTH, analyzeBom, processBom, type BomMode } from './utils/bom';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * UTF-8 BOM 处理器：检测文本开头与内部的 U+FEFF，支持添加、剥离开头 BOM
 * 与剥离全部 U+FEFF，并给出 UTF-8 字节统计。全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns BOM 处理交互界面
 */
const Utf8BomHandler: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_INPUT);
  const [mode, setMode] = React.useState<BomMode>('detect');

  const analysis = React.useMemo(() => analyzeBom(input), [input]);

  const output = React.useMemo(
    () => (input.length > 0 ? processBom(input, mode) : ''),
    [input, mode],
  );

  const outputAnalysis = React.useMemo(() => analyzeBom(output), [output]);

  /**
   * 复制处理结果
   */
  const handleCopy = async () => {
    if (!output) {
      return;
    }
    await copyToClipboard(output);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="UTF-8 BOM 检测与处理（U+FEFF / EF BB BF）">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={INPUT_PLACEHOLDER}
            autoSize={{ minRows: 6, maxRows: 16 }}
            spellCheck={false}
            className={styles.monoOutput}
          />

          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="开头 BOM">
              {analysis.hasLeadingBom ? (
                <Tag color="orange">检测到 EF BB BF</Tag>
              ) : (
                <Tag color="green">无</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="全文 U+FEFF 总数">
              {analysis.totalBomCount} 个
            </Descriptions.Item>
            <Descriptions.Item label="内部 U+FEFF（不含开头）">
              {analysis.innerBomCount > 0 ? (
                <Tag color="warning">{analysis.innerBomCount} 个（零宽字符）</Tag>
              ) : (
                <span>0 个</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="UTF-8 字节大小">
              {analysis.byteLength} 字节（去除全部 BOM 后 {analysis.byteLengthWithoutBom} 字节）
            </Descriptions.Item>
          </Descriptions>

          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            onChange={(event) => setMode(event.target.value as BomMode)}
            options={MODE_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
          />
          <div className={styles.hint}>
            {MODE_OPTIONS.find((option) => option.value === mode)?.description}
          </div>

          {output ? (
            <>
              <Alert
                type={mode === 'detect' ? 'info' : 'success'}
                showIcon
                message={
                  <Space size="large" wrap>
                    <span>
                      处理后开头 BOM：
                      {outputAnalysis.hasLeadingBom ? (
                        <strong>仍存在</strong>
                      ) : (
                        <strong>无</strong>
                      )}
                    </span>
                    <span>
                      字节：{analysis.byteLength} → {outputAnalysis.byteLength}（
                      {outputAnalysis.byteLength - analysis.byteLength >= 0 ? '+' : ''}
                      {outputAnalysis.byteLength - analysis.byteLength} 字节，每个 BOM ={' '}
                      {BOM_BYTE_LENGTH} 字节）
                    </span>
                  </Space>
                }
              />
              <Input.TextArea
                value={output}
                readOnly
                autoSize={{ minRows: 6, maxRows: 16 }}
                spellCheck={false}
                className={styles.monoOutput}
              />
              <Button icon={<CopyOutlined />} onClick={handleCopy}>
                复制处理结果
              </Button>
            </>
          ) : (
            <Alert type="info" showIcon message="输入文本后将显示检测结果与处理输出" />
          )}

          <div className={styles.hint}>
            U+FEFF 在 UTF-8 中编码为 EF BB BF（3 字节），在 UTF-16 中才承担字节序标记作用；
            UTF-8 文本通常不需要 BOM，且出现在文本内部的 U+FEFF 是不可见的零宽字符，可能导致解析异常。
            所有处理均在浏览器本地完成，不上传任何内容。
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default Utf8BomHandler;
