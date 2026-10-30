'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, Input, InputNumber, Space, message } from 'antd';
import { CaretRightOutlined, CopyOutlined } from '@ant-design/icons';
import { generateBatch, inspectUuidV7 } from './utils/uuidv7';
import { DEFAULT_COUNT, MAX_COUNT } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * UUID v7 生成器与解析器（RFC 9562）：批量生成带毫秒时间戳的时间有序 UUID，
 * 同毫秒内 74 位随机段自动加一保证字典序严格递增；右栏反解首个 UUID 的
 * 时间戳、版本、变体与随机段。全部运算在浏览器本地完成，不发起网络请求。
 */
const UuidV7Generator: React.FC<ToolComponentProps> = () => {
  const [count, setCount] = React.useState<number>(DEFAULT_COUNT);
  // 挂载时先按默认数量生成一批；切换数量不自动重生，点击按钮才重生（保证结果稳定）
  const [uuids, setUuids] = React.useState<string[]>(() => generateBatch(DEFAULT_COUNT));

  const detail = React.useMemo(
    () => (uuids.length > 0 ? inspectUuidV7(uuids[0]!) : null),
    [uuids],
  );

  const handleGenerate = () => {
    const next = generateBatch(count);
    if (next.length === 0) {
      message.error('生成数量必须是 1–500 之间的整数');
      return;
    }
    setUuids(next);
    message.success(`已生成 ${next.length} 个 UUID v7`);
  };

  const handleCopyAll = () => {
    if (uuids.length === 0) {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(uuids.join('\n'));
    message.success('已复制全部 UUID');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="UUID v7 批量生成（RFC 9562，时间有序）">
        <Space wrap>
          <span className={styles.label}>生成数量</span>
          <InputNumber
            min={1}
            max={MAX_COUNT}
            precision={0}
            value={count}
            onChange={(value) => setCount(value ?? 1)}
          />
          <Button type="primary" icon={<CaretRightOutlined />} onClick={handleGenerate}>
            生成
          </Button>
          <Button icon={<CopyOutlined />} onClick={handleCopyAll} disabled={uuids.length === 0}>
            复制全部
          </Button>
        </Space>
        <div className={styles.hint}>
          48 位 Unix 毫秒时间戳 + 版本位 7 + 12 位 rand_a + 变体位 10 + 62 位 rand_b；随机段来自 Web
          Crypto getRandomValues，同一毫秒内连续生成时随机段自动加一，结果严格按字典序升序。
        </div>
      </Card>

      <div className={styles.panels}>
        <Card className={styles.card} title={`UUID 列表（${uuids.length}）`}>
          <Input.TextArea
            value={uuids.join('\n')}
            readOnly
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 14, maxRows: 24 }}
          />
        </Card>

        <Card className={styles.card} title="首个 UUID 解析">
          {detail && detail.valid ? (
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="UUID">
                <span className={styles.mono}>{detail.uuid}</span>
              </Descriptions.Item>
              <Descriptions.Item label="时间戳（毫秒）">
                <span className={styles.mono}>{detail.timestampMs}</span>
              </Descriptions.Item>
              <Descriptions.Item label="UTC 时间（ISO）">
                <span className={styles.mono}>{detail.isoTime}</span>
              </Descriptions.Item>
              <Descriptions.Item label="版本（version）">
                <span className={styles.mono}>{detail.fields.version}</span>
              </Descriptions.Item>
              <Descriptions.Item label="变体（variant）">
                <span className={styles.mono}>{detail.fields.variant}（RFC 4122）</span>
              </Descriptions.Item>
              <Descriptions.Item label="rand_a（12 位 / 3 hex）">
                <span className={styles.mono}>{detail.fields.randA}</span>
              </Descriptions.Item>
              <Descriptions.Item label="rand_b（62 位 / 16 hex）">
                <span className={styles.mono}>{detail.fields.randB}</span>
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Alert type="info" showIcon message="暂无 UUID，请点击「生成」" />
          )}
        </Card>
      </div>
    </div>
  );
};

export default UuidV7Generator;
