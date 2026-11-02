'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Select, Space, Spin, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import {
  CUSTOM_NAMESPACE_KEY,
  DEFAULT_NAME,
  DEFAULT_NAMESPACE_KEY,
  NAMESPACE_OPTIONS,
  VERSION_OPTIONS,
} from './constants';
import {
  nameBasedUuid,
  parseUuid,
  type NameUuidResult,
  type UuidVersion,
} from './utils/uuid-name';
import styles from './index.module.css';

/**
 * 名称型 UUID（v3 / v5）生成器：对「命名空间 UUID + 名称」确定性派生
 * RFC 9562 UUID，相同输入永远得到相同结果；v5 经 Web Crypto 计算 SHA-1，
 * v3 使用内置 MD5 实现，全部在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认名称
 * @returns 名称型 UUID 生成交互界面
 */
const UuidNameGenerator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [version, setVersion] = React.useState<UuidVersion>(5);
  const [namespaceKey, setNamespaceKey] = React.useState<string>(DEFAULT_NAMESPACE_KEY);
  const [customNamespace, setCustomNamespace] = React.useState<string>('');
  const [name, setName] = React.useState<string>(defaultInput || DEFAULT_NAME);
  const [result, setResult] = React.useState<NameUuidResult | null>(null);
  const [computing, setComputing] = React.useState<boolean>(false);

  const selectedNamespace =
    NAMESPACE_OPTIONS.find((item) => item.value === namespaceKey) ?? null;
  const namespaceUuid =
    namespaceKey === CUSTOM_NAMESPACE_KEY
      ? customNamespace.trim()
      : selectedNamespace?.uuid ?? '';

  React.useEffect(() => {
    let cancelled = false;

    /**
     * 版本、命名空间或名称变化时重新派生；输入不完整时清空结果
     */
    async function recompute() {
      if (!namespaceUuid || !name) {
        setResult(null);
        return;
      }
      setComputing(true);
      try {
        const next = await nameBasedUuid(version, namespaceUuid, name);
        if (!cancelled) {
          setResult(next);
        }
      } finally {
        if (!cancelled) {
          setComputing(false);
        }
      }
    }

    recompute();
    return () => {
      cancelled = true;
    };
  }, [version, namespaceUuid, name]);

  /**
   * 复制生成的 UUID
   */
  const handleCopy = async () => {
    if (!result?.uuid) {
      return;
    }
    await copyToClipboard(result.uuid);
    message.success('UUID 已复制');
  };

  const namespaceFormatValid =
    namespaceKey !== CUSTOM_NAMESPACE_KEY || parseUuid(customNamespace.trim()) !== null;
  const versionHint =
    VERSION_OPTIONS.find((item) => item.value === version)?.hint ?? '';

  return (
    <div className={styles.container}>
      <Card title="UUID v3 / v5 名称型生成器（RFC 9562）">
        <div className={styles.field}>
          <span className={styles.fieldLabel}>版本</span>
          <Radio.Group
            value={version}
            onChange={(event) => setVersion(event.target.value as UuidVersion)}
            options={VERSION_OPTIONS}
            optionType="button"
            buttonStyle="solid"
          />
          <div className={styles.hint} style={{ marginTop: 8 }}>
            {versionHint}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>命名空间</span>
          <Space wrap>
            <Select
              style={{ width: 280 }}
              value={namespaceKey}
              onChange={setNamespaceKey}
              options={NAMESPACE_OPTIONS.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
            />
            <code className={styles.hint}>
              {namespaceKey === CUSTOM_NAMESPACE_KEY
                ? '请在下方粘贴自定义命名空间 UUID'
                : namespaceUuid}
            </code>
          </Space>
          {namespaceKey === CUSTOM_NAMESPACE_KEY ? (
            <Input
              style={{ marginTop: 8, width: 360 }}
              value={customNamespace}
              onChange={(event) => setCustomNamespace(event.target.value)}
              placeholder="8-4-4-4-12 形式 UUID，如 6ba7b810-9dad-11d1-80b4-00c04fd430c8"
              status={customNamespace && !namespaceFormatValid ? 'error' : ''}
            />
          ) : null}
          {namespaceKey === CUSTOM_NAMESPACE_KEY &&
          customNamespace.trim() !== '' &&
          !namespaceFormatValid ? (
            <div className={styles.hint} style={{ marginTop: 8, color: '#ff4d4f' }}>
              命名空间不是合法的 8-4-4-4-12 形式 UUID
            </div>
          ) : null}
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>名称（按 UTF-8 编码参与哈希）</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="如 python.org、example.com 或任意确定性键名"
          />
        </div>
      </Card>

      <Card
        title="生成结果"
        extra={
          <Button
            type="text"
            icon={<CopyOutlined />}
            disabled={!result?.uuid}
            onClick={handleCopy}
          >
            复制 UUID
          </Button>
        }
      >
        {computing ? (
          <Spin size="small" />
        ) : result?.uuid ? (
          <div className={styles.resultBox}>
            <div className={styles.resultRow}>
              <code className={styles.resultCode}>{result.uuid}</code>
            </div>
            <div className={styles.metaRow}>
              <Tag color="blue">version {result.version}</Tag>
              <Tag color="geekblue">variant 10（RFC 9562）</Tag>
              <span className={styles.hint}>
                第 13 位十六进制字符为版本号 {result.version}；第 17 位为 8/9/a/b 表示变体位 10
              </span>
            </div>
            <div className={styles.hint}>
              名称型 UUID 是确定性的：相同命名空间与名称在任何系统、任何时间都会得到相同结果，
              可安全作为跨系统稳定标识。
            </div>
          </div>
        ) : result?.error ? (
          <Alert type="error" showIcon message={result.error} />
        ) : (
          <div className={styles.hint}>选择命名空间并输入名称后即时生成。</div>
        )}
      </Card>
    </div>
  );
};

export default UuidNameGenerator;
