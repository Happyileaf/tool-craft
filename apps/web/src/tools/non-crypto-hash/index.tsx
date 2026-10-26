'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, InputNumber, Space, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { computeAllHashes, DEFAULT_MURMUR_SEED, type HashResult } from './utils/hash';
import { DEFAULT_TEXT, SEED_OPTIONS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 非加密哈希批量计算工具：一次输入同时输出 FNV-1 / FNV-1a（32/64 位）、
 * MurmurHash3（x86 32 位，种子可调）、djb2、sdbm 与 Java String.hashCode()
 * 的十进制与无符号十六进制结果。全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns 非加密哈希交互界面
 */
const NonCryptoHash: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_TEXT);
  const [seed, setSeed] = React.useState<number>(DEFAULT_MURMUR_SEED);

  const results = React.useMemo<HashResult[]>(() => {
    if (!input) {
      return [];
    }
    return computeAllHashes(input, seed);
  }, [input, seed]);

  /**
   * 复制单行十六进制结果
   *
   * @param value - 待复制的十六进制值
   */
  const handleCopyRow = async (value: string) => {
    await copyToClipboard(value);
    message.success('复制成功');
  };

  /**
   * 复制全部算法结果（算法名 + 十六进制 + 十进制）
   */
  const handleCopyAll = async () => {
    if (results.length === 0) {
      message.warning('没有可复制的结果');
      return;
    }
    const text = results
      .map((item) => `${item.name}\t${item.hex}\t${item.decimal}`)
      .join('\n');
    await copyToClipboard(text);
    message.success('复制成功');
  };

  const columns: ColumnsType<HashResult> = [
    {
      title: '算法',
      dataIndex: 'name',
      key: 'name',
      width: 220,
    },
    {
      title: '十六进制',
      dataIndex: 'hex',
      key: 'hex',
      className: styles.monoCell,
    },
    {
      title: '十进制',
      dataIndex: 'decimal',
      key: 'decimal',
      className: styles.monoCell,
      width: 240,
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined />}
          onClick={() => handleCopyRow(record.hex)}
        >
          复制
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card title="非加密哈希批量计算（FNV / MurmurHash3 / djb2 / sdbm / Java）">
        <div className={styles.toolbar}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => setInput(DEFAULT_TEXT)}>
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
              清空
            </Button>
          </Space>
          <span className={styles.label}>MurmurHash3 种子：</span>
          <InputNumber
            className={styles.seedInput}
            min={0}
            max={0xffffffff}
            precision={0}
            value={seed}
            onChange={(value) => setSeed(value ?? DEFAULT_MURMUR_SEED)}
          />
          <Space wrap>
            {SEED_OPTIONS.map((option) => (
              <Button
                key={option.value}
                size="small"
                type={seed === option.value ? 'primary' : 'default'}
                onClick={() => setSeed(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </Space>
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>输入文本：</span>
        </div>
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="输入需要计算哈希的文本（空字符串同样合法，FNV 会输出 offset basis）"
          autoSize={{ minRows: 4, maxRows: 16 }}
          spellCheck={false}
        />
      </Card>

      <Card
        title="哈希结果"
        extra={
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={handleCopyAll}
            disabled={results.length === 0}
          >
            复制全部
          </Button>
        }
      >
        {results.length === 0 ? (
          <Alert type="info" showIcon message="请输入文本后自动计算全部 8 个哈希结果" />
        ) : (
          <Table<HashResult>
            rowKey="id"
            columns={columns}
            dataSource={results}
            pagination={false}
            size="middle"
          />
        )}
        <div className={styles.hint}>
          除 Java String.hashCode() 按 UTF-16 码元计算外，其余算法均按 UTF-8
          字节计算；32 位结果以无符号整数呈现，Java 列的十进制为与 Java
          一致的有符号值（可能为负）。这些算法用于哈希表分桶、数据分片与算法教学，
          非抗碰撞设计，请勿用于密码学或安全校验用途。
        </div>
      </Card>
    </div>
  );
};

export default NonCryptoHash;
