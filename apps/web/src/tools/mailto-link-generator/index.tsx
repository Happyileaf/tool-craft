'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Space, message } from 'antd';
import { ClearOutlined, CopyOutlined, MailOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  buildMailto,
  parseMailto,
  validateMailto,
  type MailtoData,
} from './utils/mailto';
import { DEFAULT_BCC, DEFAULT_BODY, DEFAULT_CC, DEFAULT_SUBJECT, DEFAULT_TO } from './constants';
import styles from './index.module.css';

/**
 * RFC 6068 mailto 链接生成与解析器：通过收件人 / 抄送 / 密送 / 主题 / 正文表单
 * 生成百分号编码的 mailto 链接，也支持粘贴已有链接反向回填，全部在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入（作为收件人）
 * @returns mailto 链接生成交互界面
 */
const MailtoLinkGenerator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [data, setData] = React.useState<MailtoData>({
    to: defaultInput || DEFAULT_TO,
    cc: DEFAULT_CC,
    bcc: DEFAULT_BCC,
    subject: DEFAULT_SUBJECT,
    body: DEFAULT_BODY,
  });
  const [parseInput, setParseInput] = React.useState<string>('');
  const [parseError, setParseError] = React.useState<string | null>(null);

  const updateField = (key: keyof MailtoData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    setData((previous) => ({ ...previous, [key]: event.target.value }));
  };

  const link = React.useMemo(() => buildMailto(data), [data]);
  const validationError = validateMailto(data);

  const copyLink = async (): Promise<void> => {
    await copyToClipboard(link);
    message.success('mailto 链接已复制');
  };

  const applyParse = (): void => {
    const result = parseMailto(parseInput);
    if (result.error) {
      setParseError(result.error);
      return;
    }
    setParseError(null);
    setData(result.data);
    message.success('已解析并回填表单');
  };

  const resetSample = (): void => {
    setData({ to: DEFAULT_TO, cc: DEFAULT_CC, bcc: DEFAULT_BCC, subject: DEFAULT_SUBJECT, body: DEFAULT_BODY });
    setParseInput('');
    setParseError(null);
  };

  return (
    <div className={styles.container}>
      <Card title="mailto 邮件链接生成器（RFC 6068）">
        <div className={styles.formRow}>
          <span className={styles.label}>收件人 to：</span>
          <Input
            value={data.to}
            onChange={updateField('to')}
            placeholder="多个地址用逗号分隔，如 a@x.com, b@x.com"
          />
        </div>
        <div className={styles.formRow}>
          <span className={styles.label}>抄送 cc：</span>
          <Input value={data.cc} onChange={updateField('cc')} placeholder="多个地址用逗号分隔（可留空）" />
        </div>
        <div className={styles.formRow}>
          <span className={styles.label}>密送 bcc：</span>
          <Input value={data.bcc} onChange={updateField('bcc')} placeholder="多个地址用逗号分隔（可留空）" />
        </div>
        <div className={styles.formRow}>
          <span className={styles.label}>主题 subject：</span>
          <Input value={data.subject} onChange={updateField('subject')} placeholder="邮件主题（可留空）" />
        </div>
        <div className={styles.formColumn}>
          <span className={styles.label}>正文 body：</span>
          <Input.TextArea
            value={data.body}
            onChange={updateField('body')}
            placeholder="邮件正文，换行将编码为 %0D%0A（可留空）"
            autoSize={{ minRows: 4, maxRows: 12 }}
          />
        </div>

        {validationError ? (
          <Alert type="warning" showIcon message={validationError} style={{ marginTop: 12 }} />
        ) : null}

        <Space style={{ marginTop: 12 }}>
          <Button icon={<ReloadOutlined />} onClick={resetSample}>
            载入示例
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={() => setData({ to: '', cc: '', bcc: '', subject: '', body: '' })}
          >
            清空
          </Button>
        </Space>
      </Card>

      <Card title="生成的 mailto 链接">
        <Input.TextArea
          value={link}
          readOnly
          autoSize={{ minRows: 2, maxRows: 8 }}
          className={styles.linkOutput}
        />
        <Space style={{ marginTop: 12 }}>
          <Button type="primary" icon={<CopyOutlined />} onClick={copyLink}>
            复制链接
          </Button>
          <Button icon={<MailOutlined />} href={link}>
            打开邮件客户端
          </Button>
        </Space>
        <div className={styles.hint}>
          主题与正文按 RFC 3986 百分号编码：空格为 %20、换行编码为 %0D%0A；cc / bcc / subject /
          body 头字段中的 @ 编码为 %40，收件人列表中的 @ 按 RFC 6068 保留，多收件人用逗号连接。
        </div>
      </Card>

      <Card title="反向解析：粘贴已有 mailto 链接回填表单">
        <Input.TextArea
          value={parseInput}
          onChange={(event) => setParseInput(event.target.value)}
          placeholder="如 mailto:a@x.com?cc=b%40x.com&subject=Hello%20World&body=..."
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
        {parseError ? (
          <Alert type="error" showIcon message={parseError} style={{ marginTop: 12 }} />
        ) : null}
        <Button type="primary" ghost style={{ marginTop: 12 }} onClick={applyParse}>
          解析并回填
        </Button>
      </Card>
    </div>
  );
};

export default MailtoLinkGenerator;
