'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Statistic, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  diffCodePoints,
  measureText,
  normalizeText,
  toCodePoints,
} from './utils/normalize';
import type { DiffToken } from './utils/normalize';
import {
  DEFAULT_FORM,
  DEFAULT_SAMPLE,
  FORM_OPTIONS,
  NormalizationFormEnum,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const TOKEN_COLOR: Record<DiffToken['type'], string> = {
  equal: 'default',
  removed: 'red',
  added: 'blue',
};

const TOKEN_LABEL: Record<DiffToken['type'], string> = {
  equal: '不变',
  removed: '删除',
  added: '新增',
};

/**
 * Unicode 规范化转换器，对文本应用 NFC / NFD / NFKC / NFKD 四种标准规范化形式，
 * 展示长度指标与逐码点差异，全部使用浏览器原生 String API 本地计算。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns Unicode 规范化交互界面
 */
const UnicodeNormalization: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [form, setForm] = React.useState<NormalizationFormEnum>(DEFAULT_FORM);
  const [input, setInput] = React.useState<string>(
    defaultInput && defaultInput.length > 0 ? defaultInput : DEFAULT_SAMPLE,
  );

  const output = React.useMemo(() => normalizeText(input, form), [input, form]);
  const beforeMeasure = React.useMemo(() => measureText(input), [input]);
  const afterMeasure = React.useMemo(() => measureText(output), [output]);
  const tokens = React.useMemo(
    () => diffCodePoints(toCodePoints(input), toCodePoints(output)),
    [input, output],
  );
  const isIdentical = input === output;

  /**
   * 载入默认示例
   */
  const handleLoadSample = () => {
    setInput(DEFAULT_SAMPLE);
  };

  /**
   * 清空输入
   */
  const handleClear = () => {
    setInput('');
  };

  /**
   * 复制规范化结果
   */
  const handleCopy = async () => {
    if (!output) {
      return;
    }
    await copyToClipboard(output);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.field}>
          <span className={styles.label}>规范化形式：</span>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={form}
            onChange={(event) => setForm(event.target.value as NormalizationFormEnum)}
            options={FORM_OPTIONS}
          />
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleLoadSample}>
            载入示例
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            清空
          </Button>
        </Space>
      </div>

      <div className={styles.panels}>
        <Card title="原始文本" className={styles.card}>
          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴需要规范化的 Unicode 文本"
            rows={10}
            autoSize={{ minRows: 8, maxRows: 18 }}
            className={styles.monoArea}
          />
          <div className={styles.metrics}>
            <Statistic title="码点数" value={beforeMeasure.codePointCount} />
            <Statistic title="UTF-16 码元" value={beforeMeasure.utf16Length} />
            <Statistic title="UTF-8 字节" value={beforeMeasure.utf8Bytes} />
          </div>
        </Card>

        <Card
          title={`${form} 规范化结果`}
          className={styles.card}
          extra={
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              disabled={!output}
            >
              复制
            </Button>
          }
        >
          <Input.TextArea
            value={output}
            readOnly
            rows={10}
            autoSize={{ minRows: 8, maxRows: 18 }}
            className={styles.monoArea}
          />
          <div className={styles.metrics}>
            <Statistic title="码点数" value={afterMeasure.codePointCount} />
            <Statistic title="UTF-16 码元" value={afterMeasure.utf16Length} />
            <Statistic title="UTF-8 字节" value={afterMeasure.utf8Bytes} />
          </div>
        </Card>
      </div>

      <Alert
        type={isIdentical ? 'success' : 'info'}
        showIcon
        message={
          isIdentical
            ? '规范化结果与原文本完全一致（码元级别无变化）'
            : '规范化后文本与原文不同：下方逐码点差异中，灰色为不变、红色为删除、蓝色为新增'
        }
      />

      <Card title="逐码点差异（Code Point）" size="small">
        {tokens.length === 0 ? (
          <div className={styles.emptyHint}>输入为空</div>
        ) : (
          <div className={styles.tokenWrap}>
            {tokens.map((token, index) => (
              <Tag
                key={`${index}-${token.hex}-${token.type}`}
                color={TOKEN_COLOR[token.type]}
                className={styles.codePointTag}
              >
                <span className={styles.tokenChar}>{token.char === '\n' ? '⏎' : token.char}</span>
                <span className={styles.tokenHex}>{token.hex}</span>
                <span className={styles.tokenType}>{TOKEN_LABEL[token.type]}</span>
              </Tag>
            ))}
          </div>
        )}
        <div className={styles.hint}>
          码点按 Unicode scalar value 迭代，emoji 等增补平面字符不会被拆成孤立代理；换行符显示为
          ⏎。规范化只重组码点序列，不维护字符名称表。
        </div>
      </Card>

      <Alert
        type="info"
        showIcon
        message="NFC/NFD 处理规范（canonical）等价字符的合成与分解；NFKC/NFKD 额外做兼容性（compatibility）分解，会把全角字母、序号、连字、半角片假名等折叠为等价的普通字符，可能改变语义外观。所有转换均在浏览器本地通过 String.prototype.normalize 完成，不上传任何文本。"
      />
    </div>
  );
};

export default UnicodeNormalization;
