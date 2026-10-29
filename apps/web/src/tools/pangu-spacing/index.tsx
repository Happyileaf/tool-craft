'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { addSpacing, removeSpacing } from './utils/pangu';
import { DEFAULT_INPUT, MODE_DESCRIPTIONS, MODE_OPTIONS, type PanguMode } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 中英文混排自动留白（盘古之白）格式化器：在 CJK 与英文 / 数字边界自动插入空格，
 * 或反向移除；围栏代码块、行内代码与 URL 内部不做处理。全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns 盘古之白格式化交互界面
 */
const PanguSpacing: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_INPUT);
  const [mode, setMode] = React.useState<PanguMode>('add');

  const result = React.useMemo(
    () => (mode === 'add' ? addSpacing(input) : removeSpacing(input)),
    [input, mode],
  );

  /**
   * 复制处理结果
   */
  const handleCopy = async (): Promise<void> => {
    await copyToClipboard(result.output);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="中英文混排自动留白（盘古之白）格式化器">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            onChange={(event) => setMode(event.target.value as PanguMode)}
            options={MODE_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
          />

          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴中英文混排文本，如 使用React构建界面，覆盖率80%以上"
            autoSize={{ minRows: 6, maxRows: 16 }}
            spellCheck={false}
            className={styles.monoArea}
          />

          <Alert type="info" showIcon message={MODE_DESCRIPTIONS[mode]} />

          <Space size="large">
            <span>
              {mode === 'add' ? '插入空格' : '移除空格'}：
              {result.changed === 0 ? <Tag>0</Tag> : <Tag color="green">{result.changed}</Tag>}
            </span>
            <Button icon={<CopyOutlined />} onClick={handleCopy} disabled={result.changed === 0}>
              复制处理结果
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => setInput(DEFAULT_INPUT)}>
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
              清空
            </Button>
          </Space>

          <Input.TextArea
            value={result.output}
            readOnly
            autoSize={{ minRows: 6, maxRows: 16 }}
            spellCheck={false}
            className={styles.monoArea}
          />

          <div className={styles.hint}>
            「盘古之白」指中文与英文 / 数字之间保留一个半角空格的排版惯例。工具识别汉字（含扩展 A
            区）、日文假名与全角标点（如全角逗号 U+FF0C）与半角字母数字的交界，仅在边界处补一个空格；
            围栏代码块（```）、行内代码（`code`）及 URL 内部原样保留，中文句读标点（如句号 U+3002）前不补空格。
            所有处理均在浏览器本地完成。
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default PanguSpacing;
