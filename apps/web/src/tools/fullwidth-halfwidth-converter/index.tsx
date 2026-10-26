'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, Input, Radio, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { convertWidth, type ConvertDirection, type ConvertScope } from './utils/widthConverter';
import {
  DEFAULT_INPUT,
  DIRECTION_OPTIONS,
  SCOPE_DESCRIPTIONS,
  SCOPE_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 全角 / 半角字符批量转换器：基于固定 Unicode 码位映射
 * （U+FF01–U+FF5E ↔ U+0021–U+007E、U+3000 ↔ U+0020）双向批量转换，
 * 可按全部 / 仅字母数字 / 仅标点与空格三种范围处理，并统计各类替换数量。
 * 全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns 全角 / 半角转换交互界面
 */
const FullwidthHalfwidthConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_INPUT);
  const [direction, setDirection] = React.useState<ConvertDirection>('toHalfwidth');
  const [scope, setScope] = React.useState<ConvertScope>('all');

  const result = React.useMemo(
    () => convertWidth(input, direction, scope),
    [input, direction, scope],
  );

  /**
   * 复制转换结果
   */
  const handleCopy = async () => {
    await copyToClipboard(result.output);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="全角 / 半角字符批量转换器">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space size="large" wrap>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={direction}
              onChange={(event) => setDirection(event.target.value as ConvertDirection)}
              options={DIRECTION_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
            />
            <Radio.Group
              optionType="button"
              value={scope}
              onChange={(event) => setScope(event.target.value as ConvertScope)}
              options={SCOPE_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
            />
          </Space>

          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴混入全角字符的文本，如 Ｈｅｌｌｏ，Ｗｏｒｌｄ！"
            autoSize={{ minRows: 5, maxRows: 14 }}
            spellCheck={false}
            className={styles.monoArea}
          />

          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="转换字符总数">
              {result.changedCount === 0 ? (
                <Tag>0</Tag>
              ) : (
                <Tag color="green">{result.changedCount}</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="字母数字">
              {result.alnumChanged} 个
            </Descriptions.Item>
            <Descriptions.Item label="标点符号">{result.punctuationChanged} 个</Descriptions.Item>
            <Descriptions.Item label="空格（U+3000 / U+0020）">
              {result.spaceChanged} 个
            </Descriptions.Item>
          </Descriptions>

          <Alert type="info" showIcon message={SCOPE_DESCRIPTIONS[scope]} />

          <Input.TextArea
            value={result.output}
            readOnly
            autoSize={{ minRows: 5, maxRows: 14 }}
            spellCheck={false}
            className={styles.monoArea}
          />
          <Button icon={<CopyOutlined />} onClick={handleCopy} disabled={result.changedCount === 0}>
            复制转换结果
          </Button>

          <div className={styles.hint}>
            全角字符与 ASCII 的映射是固定的 Unicode 码位偏移：全角 ！（U+FF01）～ ～（U+FF5E）对应半角 U+0021～U+007E，
            全角空格 U+3000 对应普通空格 U+0020。中文汉字、中文弯引号（“”）、日式括号等不在该区间，会原样保留；
            中文全角逗号「，」（U+FF0C）与感叹号「！」（U+FF01）属于映射范围。所有处理均在浏览器本地完成。
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default FullwidthHalfwidthConverter;
