'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, Input, Space, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { addressHash, toChecksumAddress, verifyChecksum } from './utils/eip55';
import { DEFAULT_SAMPLE_ADDRESS } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

interface ComputedResult {
  checksum: string;
  hash: string;
  validation: ReturnType<typeof verifyChecksum>;
}

/**
 * EIP-55 以太坊地址校验和工具：对任意大小写的 0x 地址重新计算混合大小写校验和，
 * 并判定输入本身是否符合 EIP-55、定位首个被篡改的字符。Keccak-256 为内置零依赖
 * 纯 TS 实现，全部计算在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认地址输入
 * @returns EIP-55 编码与校验界面
 */
const Eip55AddressChecksum: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_SAMPLE_ADDRESS);

  const computed = React.useMemo<{ result: ComputedResult | null; error: string | null }>(() => {
    if (!input.trim()) {
      return { result: null, error: null };
    }
    try {
      const checksum = toChecksumAddress(input);
      const hash = addressHash(input);
      const validation = verifyChecksum(input);
      return { result: { checksum, hash, validation }, error: null };
    } catch (caught) {
      return { result: null, error: caught instanceof Error ? caught.message : '计算失败' };
    }
  }, [input]);

  /**
   * 复制校验和地址到剪贴板
   */
  const handleCopy = async () => {
    if (!computed.result) {
      return;
    }
    await copyToClipboard(computed.result.checksum);
    message.success('已复制校验和地址');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="以太坊地址 EIP-55 校验和编码与校验">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="输入 0x 开头的 40 位十六进制地址"
            spellCheck={false}
            className={styles.mono}
            allowClear
          />
          {computed.error && <Alert type="error" showIcon message="输入非法" description={computed.error} />}
          {computed.result && (
            <>
              <Alert
                type={computed.result.validation.valid ? 'success' : 'warning'}
                showIcon
                message={
                  computed.result.validation.valid
                    ? computed.result.validation.hasLetters
                      ? '校验和合法：地址大小写符合 EIP-55'
                      : '地址合法：纯数字地址无字母，校验和天然通过'
                    : `校验和非法：第 ${computed.result.validation.firstMismatchIndex + 1} 位字符大小写与 EIP-55 不符`
                }
              />
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="EIP-55 校验和地址">
                  <Space>
                    <span className={styles.addressOutput}>{computed.result.checksum}</span>
                    <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
                      复制
                    </Button>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="校验结论">
                  {computed.result.validation.valid ? (
                    <Tag color="success">valid</Tag>
                  ) : (
                    <Tag color="error">invalid</Tag>
                  )}
                  {!computed.result.validation.hasLetters && (
                    <Tag color="default">无字母地址</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Keccak-256（小写地址）">
                  <span className={styles.hashBlock}>{computed.result.hash}</span>
                </Descriptions.Item>
              </Descriptions>
            </>
          )}
          <div className={styles.hint}>
            EIP-55 对去掉 0x 的小写 hex 地址求 Keccak-256（Ethereum 采用原始 Keccak，域分隔符 0x01，
            与 NIST SHA3-256 的 0x06 不同），哈希对应位 ≥ 8 时把该位字母大写，从而在不增加长度的前提下
            让地址可检测单字符大小写篡改。全程本地计算，不上传任何数据。
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default Eip55AddressChecksum;
