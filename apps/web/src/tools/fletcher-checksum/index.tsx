'use client';

import React from 'react';
import { Alert, Button, Card, Input, Radio, Space, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  computeAll,
  computeFletcher,
  parseHexBytes,
  textToBytes,
  verifyAppended,
  type FletcherVariant,
  type InputMode,
} from './utils/fletcher';
import {
  DEFAULT_HEX_INPUT,
  DEFAULT_TEXT_INPUT,
  HEX_PLACEHOLDER,
  INPUT_MODE_OPTIONS,
  VARIANT_OPTIONS,
} from './constants';
import styles from './index.module.css';

/**
 * Fletcher 校验和计算器：对 UTF-8 文本或十六进制字节流计算
 * Fletcher-16 / 32 / 64，并支持 appended checksum 自校验，
 * 全部计算在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入（作为文本内容）
 * @returns Fletcher 校验和交互界面
 */
const FletcherChecksum: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<InputMode>('text');
  const [text, setText] = React.useState<string>(defaultInput || DEFAULT_TEXT_INPUT);
  const [hexInput, setHexInput] = React.useState<string>(DEFAULT_HEX_INPUT);
  const [verifyMode, setVerifyMode] = React.useState<boolean>(false);
  const [variant, setVariant] = React.useState<FletcherVariant>('fletcher16');

  const { bytes, error } = React.useMemo(() => {
    if (mode === 'text') {
      return { bytes: textToBytes(text), error: null as string | null };
    }
    try {
      return { bytes: parseHexBytes(hexInput), error: null as string | null };
    } catch (caught) {
      return {
        bytes: [] as number[],
        error: caught instanceof Error ? caught.message : '十六进制解析失败',
      };
    }
  }, [mode, text, hexInput]);

  const results = React.useMemo(() => (error ? [] : computeAll(bytes)), [bytes, error]);

  const verifyResult = React.useMemo(() => {
    if (!verifyMode || error) {
      return null;
    }
    return verifyAppended(bytes, variant);
  }, [verifyMode, error, bytes, variant]);

  const copyHex = async (hex: string, name: string): Promise<void> => {
    await copyToClipboard(hex);
    message.success(`${name} 结果已复制`);
  };

  const resetAll = (): void => {
    setMode('text');
    setText(DEFAULT_TEXT_INPUT);
    setHexInput(DEFAULT_HEX_INPUT);
    setVerifyMode(false);
    setVariant('fletcher16');
  };

  return (
    <div className={styles.container}>
      <Card title="Fletcher 校验和计算器（Fletcher-16 / 32 / 64）">
        <Radio.Group
          value={mode}
          onChange={(event) => setMode(event.target.value as InputMode)}
          optionType="button"
          buttonStyle="solid"
          style={{ marginBottom: 12 }}
          options={INPUT_MODE_OPTIONS}
        />

        {mode === 'text' ? (
          <div className={styles.formColumn}>
            <span className={styles.label}>输入文本（按 UTF-8 编码为字节）</span>
            <Input.TextArea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={4}
              className={styles.inputArea}
            />
          </div>
        ) : (
          <div className={styles.formColumn}>
            <span className={styles.label}>十六进制字节流（空格 / 逗号 / 0x 分隔均可）</span>
            <Input.TextArea
              value={hexInput}
              onChange={(event) => setHexInput(event.target.value)}
              rows={4}
              placeholder={HEX_PLACEHOLDER}
              className={styles.inputArea}
            />
          </div>
        )}

        <Space wrap style={{ marginBottom: 12 }}>
          <Button icon={<ReloadOutlined />} onClick={resetAll}>
            重置示例
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              setText('');
              setHexInput('');
            }}
          >
            清空
          </Button>
          <Tag>共 {bytes.length} 字节</Tag>
        </Space>

        {error ? (
          <Alert type="error" showIcon message="输入解析失败" description={error} />
        ) : (
          <>
            <div className={styles.formColumn}>
              <span className={styles.label}>校验模式</span>
              <Radio.Group
                value={verifyMode ? 'verify' : 'compute'}
                onChange={(event) => setVerifyMode(event.target.value === 'verify')}
                optionType="button"
                options={[
                  { label: '计算校验和', value: 'compute' },
                  { label: 'Appended 校验（数据已追加校验字节）', value: 'verify' },
                ]}
              />
            </div>

            {verifyMode && (
              <div className={styles.formColumn}>
                <span className={styles.label}>选择变体</span>
                <Radio.Group
                  value={variant}
                  onChange={(event) => setVariant(event.target.value as FletcherVariant)}
                  options={VARIANT_OPTIONS.map((item) => ({
                    label: `${item.label}（${item.modulus}）`,
                    value: item.value,
                  }))}
                />
                {verifyResult && (
                  <Alert
                    style={{ marginTop: 8 }}
                    type={verifyResult.valid ? 'success' : 'error'}
                    showIcon
                    message={
                      <Space>
                        <span
                          className={`${styles.validBadge} ${
                            verifyResult.valid ? styles.validPass : styles.validFail
                          }`}
                        >
                          {verifyResult.valid ? '校验通过' : '校验失败'}
                        </span>
                        <span className={styles.sums}>
                          <span>S1 = {verifyResult.sum1}</span>
                          <span>S2 = {verifyResult.sum2}</span>
                        </span>
                      </Space>
                    }
                    description="Appended 模式要求整体数据的两个累加和同时归零；任一非零即说明数据或校验字节被改动。"
                  />
                )}
              </div>
            )}

            <div className={styles.resultCard}>
              {results.map((item) => (
                <div className={styles.resultRow} key={item.key}>
                  <span className={styles.resultName}>{item.name}</span>
                  <span className={styles.resultHex}>0x{item.hex}</span>
                  <span className={styles.resultDec}>{item.value.toString()}</span>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copyHex(item.hex, item.name)}
                  >
                    复制
                  </Button>
                </div>
              ))}
              <div className={styles.sums} style={{ marginTop: 8 }}>
                {results.map((item) => (
                  <span key={item.key}>
                    {item.name}：S1={item.sum1}，S2={item.sum2}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </Card>

      <Alert
        type="info"
        showIcon
        message="算法说明"
        description={
          <div className={styles.hint}>
            <p>
              Fletcher 校验和在每个数据字上维护两个累加和：S1 累加数据字、S2 累加各步的
              S1，最终结果为 (S2 左移字宽) | S1。变体区别在于字宽与模数：Fletcher-16
              按字节模 255，Fletcher-32 按 16 位字模 65535，Fletcher-64 按 32 位字模
              2³²−1；输入不足整字时末字补零。
            </p>
            <p>
              与 CRC 相比，Fletcher 实现更简单、速度更快，但错误检测能力略弱，常用于
              TCP/IP 头部之外的存储与通信完整性校验场景。所有计算均在本机浏览器完成，无网络请求。
            </p>
          </div>
        }
      />
    </div>
  );
};

export default FletcherChecksum;
