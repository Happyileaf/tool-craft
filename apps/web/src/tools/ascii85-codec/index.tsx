'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Input, Radio, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { decodeAscii85, encodeAscii85 } from './utils/ascii85';
import { CodecModeEnum, DEFAULT_ASCII85, DEFAULT_TEXT, MODE_OPTIONS, VARIANT_OPTIONS, VariantEnum } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * Ascii85（Base85）编解码工具，支持标准 Ascii85（Adobe/PostScript）与 btoa v4.2 变体，
 * 可处理定界符、z/y 压缩简写并给出带位置的错误提示，全部运算在浏览器本地完成，不发起任何网络请求
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns Ascii85 编解码交互界面
 */
const Ascii85Codec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<CodecModeEnum>(CodecModeEnum.ENCODE);
  const [variant, setVariant] = React.useState<VariantEnum>(VariantEnum.STANDARD);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_TEXT);
  const [delimiters, setDelimiters] = React.useState(false);
  const [compress, setCompress] = React.useState(true);

  const result = React.useMemo<{ output: string; error: string | null }>(() => {
    if (mode === CodecModeEnum.ENCODE) {
      return {
        output: encodeAscii85(input, {
          variant,
          delimiters,
          compressZ: compress,
        }),
        error: null,
      };
    }
    const decoded = decodeAscii85(input, 'auto');
    return { output: decoded.text ?? '', error: decoded.error };
  }, [mode, input, variant, delimiters, compress]);

  /**
   * 切换编解码方向并载入对应示例
   *
   * @param next - 目标方向
   */
  const handleModeChange = (next: CodecModeEnum) => {
    setMode(next);
    setInput(next === CodecModeEnum.ENCODE ? DEFAULT_TEXT : DEFAULT_ASCII85);
  };

  /**
   * 载入当前方向的默认示例
   */
  const handleLoadSample = () => {
    setInput(mode === CodecModeEnum.ENCODE ? DEFAULT_TEXT : DEFAULT_ASCII85);
  };

  /**
   * 清空输入
   */
  const handleClear = () => {
    setInput('');
  };

  /**
   * 复制转换结果
   */
  const handleCopy = async () => {
    if (!result.output) {
      return;
    }
    await copyToClipboard(result.output);
    message.success('复制成功');
  };

  const isEncode = mode === CodecModeEnum.ENCODE;

  return (
    <div className={styles.container}>
      <Card title="Ascii85（Base85）编解码">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as CodecModeEnum)}
            options={MODE_OPTIONS}
          />
          <Radio.Group
            value={variant}
            onChange={(event) => setVariant(event.target.value as VariantEnum)}
            options={VARIANT_OPTIONS}
            optionType="button"
            buttonStyle="solid"
          />
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleLoadSample}>
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleClear}>
              清空
            </Button>
          </Space>
        </div>
        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          {isEncode && (
            <>
              <Checkbox checked={delimiters} onChange={(event) => setDelimiters(event.target.checked)}>
                输出定界符（{variant === VariantEnum.BTOA ? 'xbtoa Begin/End' : '<~ ~>'}）
              </Checkbox>
              <Checkbox checked={compress} onChange={(event) => setCompress(event.target.checked)}>
                压缩简写（z=4 零字节{variant === VariantEnum.BTOA ? '，y=4 空格' : ''}）
              </Checkbox>
            </>
          )}
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>{isEncode ? '原始文本：' : 'Ascii85 字符串：'}</span>
        </div>
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={isEncode ? '输入要编码的文本（按 UTF-8 处理）' : '输入要解码的 Ascii85 字符串'}
          autoSize={{ minRows: 4, maxRows: 12 }}
        />
      </Card>

      <Card
        title={isEncode ? 'Ascii85 结果' : '解码文本'}
        extra={
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={handleCopy}
            disabled={Boolean(result.error) || !result.output}
          >
            复制结果
          </Button>
        }
      >
        {result.error ? (
          <Alert type="error" showIcon message="解码失败" description={result.error} />
        ) : (
          <Input.TextArea
            value={result.output}
            readOnly
            autoSize={{ minRows: 4, maxRows: 12 }}
          />
        )}
        <div className={styles.hint}>
          {isEncode
            ? '按 Ascii85 字母表 !–u 编码，输入按 UTF-8 处理；标准变体使用 <~ ~> 定界与 z 压缩，btoa 变体额外支持 y=4 空格。'
            : '解码自动识别 <~ ~> 与 xbtoa Begin/End 定界、忽略空白，并兼容 z/y 压缩简写；错误信息会报告具体问题位置。'}
        </div>
      </Card>
    </div>
  );
};

export default Ascii85Codec;
