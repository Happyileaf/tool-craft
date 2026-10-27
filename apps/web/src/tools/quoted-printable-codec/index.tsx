'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { decodeQuotedPrintable, encodeQuotedPrintable } from './utils/quoted-printable';
import {
  CodecModeEnum,
  DEFAULT_QP,
  DEFAULT_TEXT,
  LINE_BREAK_OPTIONS,
  LineBreakEnum,
  MODE_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * Quoted-Printable（RFC 2045）编解码工具，在 UTF-8 文本与
 * =XX 转义字符串之间双向转换；编码遵循 76 列软换行与行尾空白转义规则，
 * 解码严格校验非法转义并给出带行列位置的错误提示，全部运算在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns Quoted-Printable 编解码交互界面
 */
const QuotedPrintableCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<CodecModeEnum>(CodecModeEnum.ENCODE);
  const [lineBreak, setLineBreak] = React.useState<LineBreakEnum>(LineBreakEnum.CRLF);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_TEXT);

  const result = React.useMemo<{ output: string; error: string | null }>(() => {
    if (mode === CodecModeEnum.ENCODE) {
      return { output: encodeQuotedPrintable(input, lineBreak), error: null };
    }
    const decoded = decodeQuotedPrintable(input);
    return { output: decoded.text ?? '', error: decoded.error };
  }, [mode, input, lineBreak]);

  /**
   * 切换编解码方向并载入对应示例
   *
   * @param next - 目标方向
   */
  const handleModeChange = (next: CodecModeEnum) => {
    setMode(next);
    setInput(next === CodecModeEnum.ENCODE ? DEFAULT_TEXT : DEFAULT_QP);
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
      <Card title="Quoted-Printable（RFC 2045）编解码">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as CodecModeEnum)}
            options={MODE_OPTIONS}
          />
          {isEncode && (
            <Radio.Group
              value={lineBreak}
              onChange={(event) => setLineBreak(event.target.value as LineBreakEnum)}
              options={LINE_BREAK_OPTIONS}
              optionType="button"
              buttonStyle="solid"
            />
          )}
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setInput(isEncode ? DEFAULT_TEXT : DEFAULT_QP)}
            >
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
              清空
            </Button>
          </Space>
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>{isEncode ? '原始文本：' : 'Quoted-Printable 字符串：'}</span>
        </div>
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            isEncode ? '输入要编码的文本（按 UTF-8 处理）' : '输入要解码的 Quoted-Printable 字符串'
          }
          autoSize={{ minRows: 4, maxRows: 12 }}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      <Card
        title={isEncode ? 'Quoted-Printable 结果' : '解码文本'}
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
            style={{ fontFamily: 'monospace' }}
          />
        )}
        <div className={styles.hint}>
          {isEncode
            ? 'Quoted-Printable 把不可打印字节、等号与非 ASCII 文本（按 UTF-8）编码为 =XX，每行不超过 76 字符并以 = 加换行作软换行，行尾空格转义为 =20，是 MIME 邮件（RFC 2045）的标准内容传输编码。'
            : '解码时软换行（=CRLF / =LF）会被移除拼接，=XX 还原为 UTF-8 字节；不完整或非十六进制转义都会报告具体行列位置。'}
        </div>
      </Card>
    </div>
  );
};

export default QuotedPrintableCodec;
