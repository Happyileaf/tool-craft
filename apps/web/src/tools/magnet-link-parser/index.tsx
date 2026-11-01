'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, Input, Space, Tag, message } from 'antd';
import {
  ClearOutlined,
  CopyOutlined,
  ExportOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { buildMagnet, isMagnetParsed, parseMagnet } from './utils/magnet';
import {
  DEFAULT_BUILD_DN,
  DEFAULT_BUILD_TRACKERS,
  DEFAULT_BUILD_XT,
  DEFAULT_MAGNET,
  HINT,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 把字节数格式化为带单位的可读文本
 *
 * @param bytes - 字节数
 * @returns 如 5.45 GiB
 */
function formatBytes(bytes: number): string {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${unitIndex === 0 ? value : value.toFixed(2)} ${units[unitIndex]}（${bytes} 字节）`;
}

/**
 * Magnet 磁力链接解析与生成器：
 * 左侧实时解析 magnet URI 并结构化展示，右侧从表单字段反向拼装并复制，
 * 全部运算在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns magnet 解析 / 拼装界面
 */
const MagnetLinkParser: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [magnetText, setMagnetText] = React.useState<string>(defaultInput || DEFAULT_MAGNET);

  const [xtText, setXtText] = React.useState<string>(DEFAULT_BUILD_XT);
  const [dn, setDn] = React.useState<string>(DEFAULT_BUILD_DN);
  const [trText, setTrText] = React.useState<string>(DEFAULT_BUILD_TRACKERS);
  const [xlText, setXlText] = React.useState<string>('');
  const [wsText, setWsText] = React.useState<string>('');
  const [ktText, setKtText] = React.useState<string>('');
  const [asText, setAsText] = React.useState<string>('');

  /** 左侧实时解析结果 */
  const parsed = React.useMemo(() => parseMagnet(magnetText), [magnetText]);

  /** 右侧拼装结果 */
  const built = React.useMemo(() => {
    let fileLength: number | null = null;
    if (xlText.trim() !== '') {
      if (!/^\d+$/.test(xlText.trim())) {
        return { uri: null as string | null, error: '文件大小必须是非负整数（字节）' };
      }
      fileLength = Number(xlText.trim());
    }
    return buildMagnet({
      exactTopics: xtText.split('\n'),
      displayName: dn,
      trackers: trText.split('\n'),
      fileLength,
      webSeeds: wsText.split('\n'),
      keywords: ktText.split(/[\s,，+]+/).filter(Boolean),
      acceptableSource: asText,
    });
  }, [xtText, dn, trText, xlText, wsText, ktText, asText]);

  /**
   * 把解析出的字段填入右侧拼装表单
   */
  const handleExportFields = () => {
    if (!isMagnetParsed(parsed)) {
      return;
    }
    setXtText(parsed.exactTopics.join('\n'));
    setDn(parsed.displayName ?? '');
    setTrText(parsed.trackers.join('\n'));
    setXlText(parsed.fileLength === null ? '' : String(parsed.fileLength));
    setWsText(parsed.webSeeds.join('\n'));
    setKtText(parsed.keywords.join(' '));
    setAsText(parsed.acceptableSource ?? '');
    message.success('解析字段已填入拼装表单');
  };

  /**
   * 复制拼装得到的 magnet URI
   */
  const handleCopy = async () => {
    if (!built.uri || built.error) {
      return;
    }
    await copyToClipboard(built.uri);
    message.success('magnet 链接已复制');
  };

  const parseOk = isMagnetParsed(parsed);
  const extraEntries = parseOk ? Object.entries(parsed.extra) : [];

  return (
    <div className={styles.container}>
      <Card
        title="Magnet 磁力链接解析与生成器"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => setMagnetText(DEFAULT_MAGNET)}>
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setMagnetText('')}>
              清空
            </Button>
          </Space>
        }
      >
        <div className={styles.toolbar}>
          <Tag color="blue">BEP 9 / BEP 12</Tag>
          <span className={styles.hint}>{HINT}</span>
        </div>
      </Card>

      <div className={styles.panels}>
        <Card
          className={styles.card}
          title="解析 magnet 链接"
          extra={
            <Button
              type="text"
              size="small"
              icon={<ExportOutlined />}
              onClick={handleExportFields}
              disabled={!parseOk}
            >
              填入拼装表单
            </Button>
          }
        >
          <span className={styles.label}>粘贴 magnet:? 链接：</span>
          <Input.TextArea
            value={magnetText}
            onChange={(event) => setMagnetText(event.target.value)}
            placeholder="magnet:?xt=urn:btih:…"
            autoSize={{ minRows: 4, maxRows: 10 }}
            className={styles.mono}
          />
          {!parseOk ? (
            <Alert style={{ marginTop: 12 }} type="error" showIcon message={parsed.error} />
          ) : (
            <Descriptions style={{ marginTop: 12 }} size="small" column={1} bordered>
              <Descriptions.Item label="v1 info hash（BTIH）">
                {parsed.btihV1 ? (
                  <Tag color="green" className={styles.mono}>
                    {parsed.btihV1}
                  </Tag>
                ) : (
                  <Tag>未包含 40 位 v1 hash</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="显示名 dn">
                {parsed.displayName ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label={`精确主题 xt（${parsed.exactTopics.length}）`}>
                <ol className={styles.list}>
                  {parsed.exactTopics.map((topic) => (
                    <li key={topic} className={styles.mono}>
                      {topic}
                    </li>
                  ))}
                </ol>
              </Descriptions.Item>
              <Descriptions.Item label={`Tracker tr（${parsed.trackers.length}）`}>
                {parsed.trackers.length > 0 ? (
                  <ol className={styles.list}>
                    {parsed.trackers.map((tracker) => (
                      <li key={tracker} className={styles.mono}>
                        {tracker}
                      </li>
                    ))}
                  </ol>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="文件大小 xl">
                {parsed.fileLength === null ? '—' : formatBytes(parsed.fileLength)}
              </Descriptions.Item>
              <Descriptions.Item label={`Web 种子 ws（${parsed.webSeeds.length}）`}>
                {parsed.webSeeds.length > 0 ? (
                  <ol className={styles.list}>
                    {parsed.webSeeds.map((seed) => (
                      <li key={seed} className={styles.mono}>
                        {seed}
                      </li>
                    ))}
                  </ol>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="关键词 kt">
                {parsed.keywords.length > 0 ? (
                  <Space size={[4, 4]} wrap>
                    {parsed.keywords.map((word) => (
                      <Tag key={word}>{word}</Tag>
                    ))}
                  </Space>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="来源 / 镜像 as">
                {parsed.acceptableSource ?? '—'}
              </Descriptions.Item>
              {extraEntries.map(([key, value]) => (
                <Descriptions.Item key={key} label={`其他参数 ${key}`}>
                  {Array.isArray(value) ? value.join('、') : value}
                </Descriptions.Item>
              ))}
            </Descriptions>
          )}
        </Card>

        <Card
          className={styles.card}
          title="拼装 magnet 链接"
          extra={
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              disabled={Boolean(built.error) || !built.uri}
            >
              复制结果
            </Button>
          }
        >
          <div className={styles.field}>
            <span className={styles.label}>精确主题 xt（每行一个，至少一个）：</span>
            <Input.TextArea
              value={xtText}
              onChange={(event) => setXtText(event.target.value)}
              placeholder={'urn:btih:<40 位 info hash>'}
              autoSize={{ minRows: 2, maxRows: 5 }}
              className={styles.mono}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>显示名 dn：</span>
            <Input value={dn} onChange={(event) => setDn(event.target.value)} placeholder="资源显示名" />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Tracker tr（每行一个，可多个）：</span>
            <Input.TextArea
              value={trText}
              onChange={(event) => setTrText(event.target.value)}
              placeholder={'udp://tracker.example:1337/announce'}
              autoSize={{ minRows: 2, maxRows: 6 }}
              className={styles.mono}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>文件大小 xl（字节，非负整数，可留空）：</span>
            <Input
              value={xlText}
              onChange={(event) => setXlText(event.target.value)}
              placeholder="如 5845458944"
              className={styles.mono}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Web 种子 ws（每行一个，可多个）：</span>
            <Input.TextArea
              value={wsText}
              onChange={(event) => setWsText(event.target.value)}
              placeholder="https://example.com/seed"
              autoSize={{ minRows: 1, maxRows: 4 }}
              className={styles.mono}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>关键词 kt（空格 / 逗号分隔）：</span>
            <Input
              value={ktText}
              onChange={(event) => setKtText(event.target.value)}
              placeholder="ubuntu linux iso"
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>来源 / 镜像 as：</span>
            <Input
              value={asText}
              onChange={(event) => setAsText(event.target.value)}
              placeholder="https://example.com/mirror"
              className={styles.mono}
            />
          </div>
          {built.error ? (
            <Alert type="error" showIcon message={built.error} />
          ) : (
            <Input.TextArea
              value={built.uri ?? ''}
              readOnly
              autoSize={{ minRows: 4, maxRows: 10 }}
              className={styles.mono}
            />
          )}
          <div className={styles.hint}>值将按 RFC 3986 百分号编码；tr / ws / xt 按行拆分，空行自动忽略。</div>
        </Card>
      </div>
    </div>
  );
};

export default MagnetLinkParser;
