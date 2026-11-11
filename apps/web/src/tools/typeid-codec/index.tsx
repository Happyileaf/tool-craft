'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, Input, Radio, Space, Tabs, message } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  decodeTypeid,
  encodeTypeid,
  generateTypeid,
} from './utils/typeid';
import {
  COUNT_OPTIONS,
  DEFAULT_COUNT,
  DEFAULT_PREFIX,
  DEFAULT_TYPEID_SAMPLE,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 把毫秒时间戳格式化为本地可读时间
 *
 * @param ms - Unix 毫秒时间戳
 * @returns 本地时间字符串
 */
function formatLocalTime(ms: number): string {
  const date = new Date(ms);
  const pad = (value: number, length = 2) => String(value).padStart(length, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(
      date.getMilliseconds(),
      3,
    )}`
  );
}

/**
 * TypeID 编解码与生成工具：按 jetify TypeID 规范处理「类型前缀 + 26 字符
 * Crockford Base32 后缀」，支持批量生成 UUIDv7 型 TypeID、反解内嵌 UUID 与
 * v7 时间戳，以及由标准 UUID 组装 TypeID。全部运算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认 TypeID 文本
 * @returns TypeID 生成与编解码界面
 */
const TypeidCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [prefix, setPrefix] = React.useState<string>(DEFAULT_PREFIX);
  const [count, setCount] = React.useState<number>(DEFAULT_COUNT);
  const [ids, setIds] = React.useState<string[]>([]);
  const [generateError, setGenerateError] = React.useState<string | null>(null);

  const [decodeInput, setDecodeInput] = React.useState<string>(
    defaultInput || DEFAULT_TYPEID_SAMPLE,
  );
  const [encodePrefix, setEncodePrefix] = React.useState<string>(DEFAULT_PREFIX);
  const [uuidInput, setUuidInput] = React.useState<string>(
    '01890a5d-ac96-774b-bcce-b302099a8057',
  );

  /**
   * 按当前前缀与数量批量生成 TypeID
   */
  const regenerate = React.useCallback(() => {
    try {
      const next = Array.from({ length: count }, () => generateTypeid(prefix.trim()));
      setIds(next);
      setGenerateError(null);
    } catch (caught) {
      setIds([]);
      setGenerateError(caught instanceof Error ? caught.message : '生成失败，请检查前缀');
    }
  }, [count, prefix]);

  React.useEffect(() => {
    regenerate();
  }, [regenerate]);

  const decodeView = React.useMemo(() => {
    if (!decodeInput.trim()) {
      return null;
    }
    try {
      return { result: decodeTypeid(decodeInput), error: null as string | null };
    } catch (caught) {
      return { result: null, error: caught instanceof Error ? caught.message : '解析失败' };
    }
  }, [decodeInput]);

  const encodeView = React.useMemo(() => {
    if (!uuidInput.trim()) {
      return null;
    }
    try {
      return { result: encodeTypeid(encodePrefix.trim(), uuidInput), error: null as string | null };
    } catch (caught) {
      return { result: null, error: caught instanceof Error ? caught.message : '编码失败' };
    }
  }, [encodePrefix, uuidInput]);

  /**
   * 复制批量生成结果
   */
  const handleCopyIds = async () => {
    if (ids.length === 0) {
      return;
    }
    await copyToClipboard(ids.join('\n'));
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="TypeID 批量生成（内嵌 UUIDv7，可按时间排序）">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className={styles.field}>
            <span className={styles.label}>类型前缀：</span>
            <Input
              className={styles.prefixInput}
              placeholder="如 user、order_item，留空生成裸后缀"
              value={prefix}
              onChange={(event) => setPrefix(event.target.value)}
              spellCheck={false}
            />
            <span className={styles.label}>数量：</span>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              options={COUNT_OPTIONS}
            />
          </div>
          <Space>
            <Button type="primary" icon={<ReloadOutlined />} onClick={regenerate}>
              重新生成
            </Button>
            <Button icon={<CopyOutlined />} onClick={handleCopyIds} disabled={ids.length === 0}>
              复制全部
            </Button>
          </Space>
          {generateError && (
            <Alert type="error" showIcon message="参数有误" description={generateError} />
          )}
          <Input.TextArea
            value={ids.join('\n')}
            readOnly
            autoSize={{ minRows: 5, maxRows: 16 }}
            className={styles.monoOutput}
          />
          <div className={styles.hint}>
            TypeID 后缀为 26 字符 Crockford Base32（字母表不含 I/L/O/U），编码 128 位
            UUIDv7：前 48 位是毫秒时间戳，因此生成结果天然按时间字典序排列；随机字节来自
            Web Crypto getRandomValues，全程本地运算不发网络请求。
          </div>
        </Space>
      </Card>

      <Card className={styles.card} title="TypeID 解析 / UUID 编码">
        <Tabs
          items={[
            {
              key: 'decode',
              label: '解析 TypeID',
              children: (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Input.TextArea
                    value={decodeInput}
                    onChange={(event) => setDecodeInput(event.target.value)}
                    placeholder="输入带前缀或裸后缀的 TypeID，如 user_01h455vb4pex5vsknk084sn02q"
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    spellCheck={false}
                    className={styles.monoOutput}
                  />
                  {decodeView?.error && (
                    <Alert type="error" showIcon message="解析失败" description={decodeView.error} />
                  )}
                  {decodeView?.result && (
                    <Descriptions bordered column={1} size="small">
                      <Descriptions.Item label="类型前缀">
                        <span className={styles.mono}>
                          {decodeView.result.prefix || '（空，裸后缀）'}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="内嵌 UUID">
                        <span className={styles.mono}>{decodeView.result.uuid}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="UUID 版本">
                        v{decodeView.result.version}
                      </Descriptions.Item>
                      <Descriptions.Item label="Variant">
                        RFC 4122（{decodeView.result.variant.toString(2)}）
                      </Descriptions.Item>
                      <Descriptions.Item label="毫秒时间戳">
                        {decodeView.result.timestampMs ?? '非 v7，无时间戳'}
                      </Descriptions.Item>
                      {decodeView.result.timestampMs !== null && (
                        <Descriptions.Item label="本地时间">
                          {formatLocalTime(decodeView.result.timestampMs)}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  )}
                </Space>
              ),
            },
            {
              key: 'encode',
              label: 'UUID 编码为 TypeID',
              children: (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div className={styles.field}>
                    <span className={styles.label}>类型前缀：</span>
                    <Input
                      className={styles.prefixInput}
                      placeholder="留空生成裸后缀"
                      value={encodePrefix}
                      onChange={(event) => setEncodePrefix(event.target.value)}
                      spellCheck={false}
                    />
                  </div>
                  <Input.TextArea
                    value={uuidInput}
                    onChange={(event) => setUuidInput(event.target.value)}
                    placeholder="标准 8-4-4-4-12 UUID"
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    spellCheck={false}
                    className={styles.monoOutput}
                  />
                  {encodeView?.error && (
                    <Alert type="error" showIcon message="编码失败" description={encodeView.error} />
                  )}
                  {encodeView?.result && (
                    <Descriptions bordered column={1} size="small">
                      <Descriptions.Item label="TypeID">
                        <Space>
                          <span className={styles.mono}>{encodeView.result}</span>
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={async () => {
                              await copyToClipboard(encodeView.result!);
                              message.success('复制成功');
                            }}
                          >
                            复制
                          </Button>
                        </Space>
                      </Descriptions.Item>
                    </Descriptions>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default TypeidCodec;
