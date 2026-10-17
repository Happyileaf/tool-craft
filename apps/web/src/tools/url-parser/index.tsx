'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Input, Space, Tag, message } from 'antd';
import { ClearOutlined, CopyOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { buildUrl, parseUrl, type QueryParam } from './utils/url';
import { COMPONENT_LABELS, DEFAULT_URL } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 将组件值格式化为展示文本，空串与缺失统一显示为占位符
 *
 * @param value - 组件值
 * @returns 展示文本
 */
function formatComponentValue(value: string | undefined): string {
  return value ? value : '—';
}

/**
 * URL 解析与查询参数编辑工具，将 URL 拆解为协议 / 主机 / 端口 / 路径 / 查询参数 / 哈希，
 * 支持增删改查询参数后实时重新拼接，全部运算在浏览器本地完成，不发起任何网络请求
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入 URL
 * @returns URL 解析与编辑交互界面
 */
const UrlParser: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_URL);
  const [params, setParams] = React.useState<QueryParam[]>([]);
  const [preserveRaw, setPreserveRaw] = React.useState(false);

  const parsed = React.useMemo(() => parseUrl(input), [input]);

  React.useEffect(() => {
    setParams(parsed.parts ? parsed.parts.params : []);
  }, [parsed]);

  const parts = parsed.parts;
  const assembled = parts ? buildUrl({ ...parts, params }, { preserveRaw }) : '';

  /**
   * 更新指定查询参数的字段
   *
   * @param index - 参数下标
   * @param patch - 待更新的字段
   */
  const updateParam = (index: number, patch: Partial<QueryParam>) => {
    setParams((prev) =>
      prev.map((param, current) => (current === index ? { ...param, ...patch } : param)),
    );
  };

  /**
   * 删除指定查询参数
   *
   * @param index - 参数下标
   */
  const removeParam = (index: number) => {
    setParams((prev) => prev.filter((_, current) => current !== index));
  };

  /**
   * 追加一个空查询参数
   */
  const addParam = () => {
    setParams((prev) => [
      ...prev,
      { key: '', value: '', rawKey: '', rawValue: '', enabled: true },
    ]);
  };

  /**
   * 载入默认示例 URL
   */
  const handleLoadSample = () => {
    setInput(DEFAULT_URL);
  };

  /**
   * 清空输入
   */
  const handleClear = () => {
    setInput('');
  };

  /**
   * 复制拼接后的 URL
   */
  const handleCopy = async () => {
    if (!assembled) {
      return;
    }
    await copyToClipboard(assembled);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card
        title="URL 输入"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleLoadSample}
            >
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleClear}>
              清空
            </Button>
          </Space>
        }
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="例如 https://example.com/path?q=1#top"
        />
        {parsed.error ? (
          <Alert style={{ marginTop: 12 }} type="warning" showIcon message={parsed.error} />
        ) : (
          <div className={styles.components}>
            {COMPONENT_LABELS.map((item) => (
              <div className={styles.componentItem} key={item.key}>
                <span className={styles.componentKey}>{item.label}：</span>
                <span className={styles.componentValue}>
                  {formatComponentValue(parts?.[item.key])}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="查询参数编辑"
        extra={
          <Space>
            <Checkbox
              checked={preserveRaw}
              onChange={(event) => setPreserveRaw(event.target.checked)}
            >
              保留原始编码
            </Checkbox>
            <Button icon={<PlusOutlined />} onClick={addParam} disabled={!parts}>
              新增参数
            </Button>
          </Space>
        }
      >
        {params.length === 0 ? (
          <Alert type="info" showIcon message="当前 URL 没有查询参数，可点击右上角新增" />
        ) : (
          params.map((param, index) => (
            <div className={styles.paramRow} key={index}>
              <Checkbox
                checked={param.enabled}
                onChange={(event) => updateParam(index, { enabled: event.target.checked })}
              />
              <Input
                className={styles.paramInput}
                value={param.key}
                onChange={(event) =>
                  updateParam(index, { key: event.target.value, rawKey: event.target.value })
                }
                placeholder="键"
              />
              <span className={styles.equals}>=</span>
              <Input
                className={styles.paramInput}
                value={param.value}
                onChange={(event) =>
                  updateParam(index, {
                    value: event.target.value,
                    rawValue: event.target.value,
                  })
                }
                placeholder="值"
              />
              <span className={styles.equals}>（原始：{param.rawKey}={param.rawValue}）</span>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeParam(index)}
              />
            </div>
          ))
        )}
      </Card>

      <Card
        title="实时拼接结果"
        extra={
          <Button type="text" icon={<CopyOutlined />} onClick={handleCopy} disabled={!assembled}>
            复制 URL
          </Button>
        }
      >
        {assembled ? (
          <>
            <div className={styles.assembled}>{assembled}</div>
            <div className={styles.row} style={{ marginTop: 12 }}>
              <Tag color="blue">参数 {params.filter((param) => param.enabled).length} 个已启用</Tag>
              <Tag color="default">共 {params.length} 个</Tag>
            </div>
          </>
        ) : (
          <Alert type="warning" showIcon message="请输入合法 URL 后展示拼接结果" />
        )}
      </Card>
    </div>
  );
};

export default UrlParser;
