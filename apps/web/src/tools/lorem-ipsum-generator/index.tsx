'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Button, Card, Input, InputNumber, Select, Space, Switch, message } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { LOREM_MAX_COUNT, generateLorem, type LoremUnit } from './utils/lorem';
import {
  DEFAULT_LOREM_COUNT,
  DEFAULT_LOREM_UNIT,
  DEFAULT_START_WITH_CLASSIC,
  LOREM_UNIT_OPTIONS,
} from './constants';
import styles from './index.module.css';
import { copyToClipboard } from '@/lib/utils';

/**
 * Lorem Ipsum 占位文本生成工具，支持按段落 / 句子 / 单词生成并控制经典开头，
 * 全部运算在浏览器本地完成
 *
 * @returns 占位文本生成交互界面
 */
const LoremIpsumGenerator: React.FC<ToolComponentProps> = () => {
  const [unit, setUnit] = React.useState<LoremUnit>(DEFAULT_LOREM_UNIT);
  const [count, setCount] = React.useState<number>(DEFAULT_LOREM_COUNT);
  const [startWithClassic, setStartWithClassic] = React.useState<boolean>(
    DEFAULT_START_WITH_CLASSIC,
  );
  const [text, setText] = React.useState<string>('');

  const generate = React.useCallback(() => {
    setText(generateLorem({ unit, count, startWithClassic }));
  }, [unit, count, startWithClassic]);

  React.useEffect(() => {
    generate();
  }, [generate]);

  /**
   * 切换生成单位，并把数量收敛到新单位的上限内
   *
   * @param nextUnit - 目标生成单位
   */
  const handleUnitChange = (nextUnit: LoremUnit) => {
    setUnit(nextUnit);
    setCount((previous) => Math.min(previous, LOREM_MAX_COUNT[nextUnit]));
  };

  /**
   * 复制生成结果
   */
  const handleCopy = async () => {
    if (text === '') {
      message.warning('当前没有可复制的内容');
      return;
    }
    await copyToClipboard(text);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap>
          <span>生成单位：</span>
          <Select
            value={unit}
            onChange={handleUnitChange}
            options={LOREM_UNIT_OPTIONS}
            style={{ width: 110 }}
          />
          <span>数量：</span>
          <InputNumber
            value={count}
            onChange={(value) => setCount(typeof value === 'number' ? value : 0)}
            min={0}
            max={LOREM_MAX_COUNT[unit]}
          />
          <Space size={4}>
            <span>以经典 Lorem ipsum 开头</span>
            <Switch checked={startWithClassic} onChange={setStartWithClassic} />
          </Space>
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={generate}>
            重新生成
          </Button>
          <Button type="primary" icon={<CopyOutlined />} onClick={handleCopy}>
            复制结果
          </Button>
        </Space>
      </div>

      <Card title="生成结果" className={styles.card}>
        <Input.TextArea
          className={styles.output}
          value={text}
          readOnly
          rows={14}
          autoSize={{ minRows: 12, maxRows: 30 }}
          placeholder="点击「重新生成」获取占位文本..."
        />
      </Card>
    </div>
  );
};

export default LoremIpsumGenerator;
