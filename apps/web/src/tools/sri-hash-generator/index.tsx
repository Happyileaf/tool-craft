'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  Radio,
  Space,
  Spin,
  Tag,
  message,
} from 'antd';
import {
  CheckCircleFilled,
  ClearOutlined,
  CopyOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import {
  ALGORITHM_OPTIONS,
  DEFAULT_TEXT,
  InputTypeEnum,
  MODE_OPTIONS,
  SriModeEnum,
} from './constants';
import {
  generateSri,
  verifySri,
  type SriAlgorithm,
  type SriVerifyResult,
} from './utils/sri';
import styles from './index.module.css';

/**
 * SRI 子资源完整性哈希生成器：对文本或本地文件计算 SHA-256/384/512 摘要，
 * 产出可直接粘贴到 script/link 标签 integrity 属性的哈希串，
 * 并支持给定 integrity 串校验内容，全部在浏览器本地完成，文件不上传
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns SRI 生成与校验交互界面
 */
const SriHashGenerator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<SriModeEnum>(SriModeEnum.GENERATE);
  const [inputType, setInputType] = React.useState<InputTypeEnum>(
    InputTypeEnum.TEXT,
  );
  const [text, setText] = React.useState<string>(defaultInput || DEFAULT_TEXT);
  const [file, setFile] = React.useState<File | null>(null);
  const [fileBytes, setFileBytes] = React.useState<Uint8Array<ArrayBuffer> | null>(
    null,
  );
  const [algorithms, setAlgorithms] = React.useState<SriAlgorithm[]>([
    'sha256',
  ]);
  const [integrityInput, setIntegrityInput] = React.useState<string>('');
  const [generated, setGenerated] = React.useState<
    { algorithm: SriAlgorithm; value: string }[]
  >([]);
  const [verifyResult, setVerifyResult] = React.useState<SriVerifyResult | null>(
    null,
  );
  const [computing, setComputing] = React.useState<boolean>(false);
  const [fileError, setFileError] = React.useState<string | null>(null);

  /**
   * 读取当前载体的字节内容：文本按 UTF-8 编码，文件使用已读取字节
   */
  const currentBytes = React.useMemo<Uint8Array<ArrayBuffer> | null>(() => {
    if (inputType === InputTypeEnum.FILE) {
      return fileBytes;
    }
    return new TextEncoder().encode(text);
  }, [inputType, text, fileBytes]);

  /**
   * 读取所选文件为字节，超大文件给出提示（本地一次读入内存）
   *
   * @param selected - 文件选择器返回的文件
   */
  const handleFileChange = (selected: File | null) => {
    setFile(selected);
    setFileError(null);
    setFileBytes(null);
    if (!selected) {
      return;
    }
    if (selected.size > 100 * 1024 * 1024) {
      setFileError('文件超过 100MB，请使用较小的资源文件进行计算');
      return;
    }
    selected
      .arrayBuffer()
      .then((buffer) => setFileBytes(new Uint8Array(buffer)))
      .catch(() => setFileError('文件读取失败，请重试'));
  };

  /**
   * 切换算法勾选，至少保留一个
   *
   * @param checkedValues - 当前勾选的算法
   */
  const handleAlgorithmsChange = (checkedValues: Array<string | number>) => {
    const next = checkedValues as SriAlgorithm[];
    if (next.length > 0) {
      setAlgorithms(next);
    }
  };

  React.useEffect(() => {
    let cancelled = false;

    /**
     * 内容或算法变化时重新计算；校验模式下额外对照 integrity 串
     */
    async function recompute() {
      if (!currentBytes) {
        setGenerated([]);
        setVerifyResult(null);
        return;
      }
      setComputing(true);
      try {
        if (mode === SriModeEnum.GENERATE) {
          const results = await generateSri(currentBytes, algorithms);
          if (!cancelled) {
            setGenerated(results);
            setVerifyResult(null);
          }
        } else if (integrityInput.trim()) {
          const result = await verifySri(currentBytes, integrityInput);
          if (!cancelled) {
            setVerifyResult(result);
            setGenerated([]);
          }
        } else if (!cancelled) {
          setVerifyResult(null);
          setGenerated([]);
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
  }, [mode, currentBytes, algorithms, integrityInput]);

  /**
   * 复制单条或组合后的 integrity 串
   *
   * @param value - 待复制内容
   */
  const handleCopy = async (value: string) => {
    await copyToClipboard(value);
    message.success('复制成功');
  };

  const integrityString = generated.map((item) => item.value).join(' ');

  return (
    <div className={styles.container}>
      <Card title="SRI 子资源完整性哈希生成器">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => setMode(event.target.value as SriModeEnum)}
            options={MODE_OPTIONS}
          />
          <Radio.Group
            value={inputType}
            onChange={(event) => {
              setInputType(event.target.value as InputTypeEnum);
              setFileError(null);
            }}
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: '文本（UTF-8）', value: InputTypeEnum.TEXT },
              { label: '本地文件', value: InputTypeEnum.FILE },
            ]}
          />
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>摘要算法：</span>
          <Checkbox.Group
            options={ALGORITHM_OPTIONS}
            value={algorithms}
            onChange={handleAlgorithmsChange}
          />
        </div>

        {inputType === InputTypeEnum.TEXT ? (
          <>
            <div className={styles.toolbar} style={{ marginTop: 16 }}>
              <span className={styles.label}>内容：</span>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => setText(DEFAULT_TEXT)}
                >
                  载入示例
                </Button>
                <Button icon={<ClearOutlined />} onClick={() => setText('')}>
                  清空
                </Button>
              </Space>
            </div>
            <Input.TextArea
              style={{ marginTop: 8 }}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="输入要计算 SRI 哈希的文本内容（按 UTF-8 处理）"
              autoSize={{ minRows: 4, maxRows: 12 }}
            />
          </>
        ) : (
          <div style={{ marginTop: 16 }}>
            <input
              type="file"
              id="sri-file-input"
              className={styles.fileInput}
              onChange={(event) =>
                handleFileChange(event.target.files?.[0] ?? null)
              }
            />
            <label htmlFor="sri-file-input" className={styles.fileLabel}>
              <UploadOutlined /> 选择本地文件（仅在浏览器内读取，不上传）
            </label>
            {file ? (
              <div className={styles.hint}>
                已选择：{file.name}（{file.size.toLocaleString()} 字节）
                {!fileBytes && !fileError ? '，读取中…' : ''}
              </div>
            ) : null}
            {fileError ? (
              <Alert
                style={{ marginTop: 8 }}
                type="error"
                showIcon
                message={fileError}
              />
            ) : null}
          </div>
        )}
      </Card>

      {mode === SriModeEnum.GENERATE ? (
        <Card
          title="integrity 属性值"
          extra={
            <Button
              type="text"
              icon={<CopyOutlined />}
              disabled={generated.length === 0}
              onClick={() => handleCopy(integrityString)}
            >
              复制 integrity 串
            </Button>
          }
        >
          {computing ? (
            <Spin size="small" />
          ) : generated.length > 0 ? (
            <div className={styles.resultList}>
              {generated.map((item) => (
                <div key={item.algorithm} className={styles.resultRow}>
                  <Tag color="blue">{item.algorithm}</Tag>
                  <code className={styles.resultCode}>{item.value}</code>
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(item.value)}
                  />
                </div>
              ))}
              <div className={styles.hint}>
                多算法哈希以空格连接，粘贴到 <code>integrity</code> 属性即可；
                配合 <code>crossorigin="anonymous"</code> 使用。
              </div>
            </div>
          ) : (
            <div className={styles.hint}>输入内容后即时生成哈希。</div>
          )}
        </Card>
      ) : (
        <Card title="integrity 校验">
          <Input.TextArea
            value={integrityInput}
            onChange={(event) => setIntegrityInput(event.target.value)}
            placeholder="粘贴待校验的 integrity 串，如 sha256-xxxx==（支持多算法空格分隔）"
            autoSize={{ minRows: 2, maxRows: 6 }}
          />
          <div style={{ marginTop: 12 }}>
            {computing ? (
              <Spin size="small" />
            ) : verifyResult ? (
              verifyResult.error ? (
                <Alert
                  type="error"
                  showIcon
                  message="integrity 串解析失败"
                  description={verifyResult.error}
                />
              ) : (
                <Alert
                  type={verifyResult.valid ? 'success' : 'error'}
                  showIcon
                  icon={
                    verifyResult.valid ? <CheckCircleFilled /> : undefined
                  }
                  message={
                    verifyResult.valid
                      ? '校验通过：内容与至少一条强摘要匹配'
                      : '校验失败：内容与所有摘要均不匹配，资源可能已被篡改'
                  }
                  description={
                    <div className={styles.verifyEntries}>
                      {verifyResult.entries.map((entry, index) => (
                        <div key={`${entry.algorithm}-${index}`}>
                          <Tag color={entry.matched ? 'green' : 'red'}>
                            {entry.algorithm}
                          </Tag>
                          {entry.matched ? '匹配' : '不匹配'}
                        </div>
                      ))}
                    </div>
                  }
                />
              )
            ) : (
              <div className={styles.hint}>
                选择内容并粘贴 integrity 串后即时校验。
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SriHashGenerator;
