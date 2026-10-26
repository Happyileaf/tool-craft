'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Select, Space, message } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  DEFAULT_ALPHABET,
  DEFAULT_SIZE,
  MAX_SIZE,
  generateNanoIdBatch,
} from './utils/nanoid';
import { ALPHABET_PRESETS, COUNT_OPTIONS, SIZE_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * Nano ID 随机标识符生成器：支持自定义长度、字母表预设/自定义与批量生成，
 * 使用 Web Crypto 密码学安全随机源并以拒绝采样消除取模偏置，全部在浏览器本地完成
 *
 * @returns Nano ID 生成交互界面
 */
const NanoIdGenerator: React.FC<ToolComponentProps> = () => {
  const [size, setSize] = React.useState<number>(DEFAULT_SIZE);
  const [count, setCount] = React.useState<number>(5);
  const [alphabet, setAlphabet] = React.useState<string>(DEFAULT_ALPHABET);
  const [presetValue, setPresetValue] = React.useState<string>(DEFAULT_ALPHABET);
  const [ids, setIds] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  /**
   * 按当前参数批量生成 ID，参数非法时展示错误
   */
  const regenerate = React.useCallback(() => {
    try {
      setIds(generateNanoIdBatch(count, size, alphabet));
      setError(null);
    } catch (caught) {
      setIds([]);
      setError(caught instanceof Error ? caught.message : '生成失败，请检查参数');
    }
  }, [count, size, alphabet]);

  React.useEffect(() => {
    regenerate();
  }, [regenerate]);

  /**
   * 切换字母表预设；切到自定义时保留当前字母表供编辑
   *
   * @param value - 预设值
   */
  const handlePresetChange = (value: string) => {
    setPresetValue(value);
    if (value !== '__custom__') {
      setAlphabet(value);
    }
  };

  const handleCopy = async () => {
    if (ids.length === 0) {
      message.warning('没有可复制的 ID');
      return;
    }
    await copyToClipboard(ids.join('\n'));
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.controlsCard} title="Nano ID 生成器">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className={styles.field}>
            <span className={styles.label}>长度：</span>
            <Select
              value={size}
              style={{ width: 160 }}
              onChange={setSize}
              options={SIZE_OPTIONS}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>数量：</span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              options={COUNT_OPTIONS}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>字母表：</span>
            <Select
              value={presetValue}
              style={{ width: 280 }}
              onChange={handlePresetChange}
              options={ALPHABET_PRESETS}
            />
          </div>
          {presetValue === '__custom__' && (
            <Input.TextArea
              value={alphabet}
              onChange={(event) => setAlphabet(event.target.value)}
              autoSize={{ minRows: 1, maxRows: 4 }}
              placeholder="输入自定义字母表，字符不可重复（1–256 个字符）"
            />
          )}
          <Space>
            <Button type="primary" icon={<ReloadOutlined />} onClick={regenerate}>
              重新生成
            </Button>
            <Button icon={<CopyOutlined />} onClick={handleCopy}>
              复制全部
            </Button>
          </Space>
          {error && <Alert type="error" showIcon message="参数有误" description={error} />}
        </Space>
      </Card>

      <Card title="生成结果" className={styles.resultCard}>
        <Input.TextArea
          value={ids.join('\n')}
          readOnly
          autoSize={{ minRows: 6, maxRows: 24 }}
        />
        <div className={styles.hint}>
          基于 Web Crypto getRandomValues 生成密码学安全随机字节，拒绝采样保证每个字符等概率；
          长度上限 {MAX_SIZE}，全部运算在浏览器本地完成，不发起网络请求。
        </div>
      </Card>
    </div>
  );
};

export default NanoIdGenerator;
