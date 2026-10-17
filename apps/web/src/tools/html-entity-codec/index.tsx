'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Button, Card, Input, Radio, Space, Switch, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { decodeHtml, encodeHtml } from './utils/entities';
import {
  DEFAULT_DECODE_SAMPLE,
  DEFAULT_ENCODE_SAMPLE,
  EntityDirectionEnum,
} from './constants';
import styles from './index.module.css';
import { copyToClipboard } from '@/lib/utils';

/**
 * 取指定转换方向的示例输入
 *
 * @param direction - 转换方向
 * @returns 对应方向的示例文本
 */
function sampleOf(direction: EntityDirectionEnum): string {
  return direction === EntityDirectionEnum.ENCODE
    ? DEFAULT_ENCODE_SAMPLE
    : DEFAULT_DECODE_SAMPLE;
}

/**
 * HTML 实体编解码工具，支持编码 / 解码双向转换与「编码非 ASCII 字符」开关，
 * 全部运算在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns HTML 实体编解码交互界面
 */
const HtmlEntityCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<EntityDirectionEnum>(
    EntityDirectionEnum.ENCODE,
  );
  const [encodeNonAscii, setEncodeNonAscii] = React.useState<boolean>(false);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_ENCODE_SAMPLE);

  const isEncode = direction === EntityDirectionEnum.ENCODE;

  const output = React.useMemo(
    () => (isEncode ? encodeHtml(input, { encodeNonAscii }) : decodeHtml(input)),
    [input, isEncode, encodeNonAscii],
  );

  /**
   * 切换转换方向并按新方向的示例重置输入
   *
   * @param nextDirection - 目标转换方向
   */
  const handleDirectionChange = (nextDirection: EntityDirectionEnum) => {
    setDirection(nextDirection);
    setInput(sampleOf(nextDirection));
  };

  /**
   * 重新载入当前方向的示例输入
   */
  const handleLoadSample = () => {
    setInput(sampleOf(direction));
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
    await copyToClipboard(output);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space wrap>
          <Radio.Group
            value={direction}
            onChange={(event) => handleDirectionChange(event.target.value as EntityDirectionEnum)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value={EntityDirectionEnum.ENCODE}>编码</Radio.Button>
            <Radio.Button value={EntityDirectionEnum.DECODE}>解码</Radio.Button>
          </Radio.Group>
          {isEncode && (
            <Space size={4}>
              <span>编码非 ASCII 字符</span>
              <Switch checked={encodeNonAscii} onChange={setEncodeNonAscii} />
            </Space>
          )}
        </Space>
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
        <Card title={isEncode ? '输入文本' : '输入含实体的文本'} className={styles.card}>
          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={isEncode ? '输入需要编码的文本...' : '输入需要解码的 HTML 实体文本...'}
            rows={14}
            autoSize={{ minRows: 10, maxRows: 24 }}
          />
        </Card>

        <Card
          title={isEncode ? '输出实体文本' : '输出还原文本'}
          className={styles.card}
          extra={
            <Button type="text" icon={<CopyOutlined />} onClick={handleCopy}>
              复制结果
            </Button>
          }
        >
          <Input.TextArea
            value={output}
            readOnly
            rows={14}
            autoSize={{ minRows: 10, maxRows: 24 }}
          />
        </Card>
      </div>
    </div>
  );
};

export default HtmlEntityCodec;
