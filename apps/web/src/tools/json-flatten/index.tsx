'use client';

import React from 'react';
import { Button, Card, Checkbox, Input, Radio, Result, Select, Space } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { message } from 'antd';
import type { ToolComponentProps } from '../loaders';
import { flattenJsonText, unflattenJsonText } from './utils/flatten';
import {
  DEFAULT_FLAT_SAMPLE,
  DEFAULT_NESTED_SAMPLE,
  DEFAULT_SEPARATOR,
  MODE_FLATTEN,
  MODE_UNFLATTEN,
  SEPARATOR_OPTIONS,
  type ConvertMode,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * JSON 扁平化 / 还原工具：在嵌套 JSON 与点路径单层键值 JSON 之间双向转换，
 * 支持自定义分隔符与数组展开开关。全部运算在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns JSON 扁平化交互界面
 */
const JsonFlatten: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<ConvertMode>(MODE_FLATTEN);
  const [separator, setSeparator] = React.useState<string>(DEFAULT_SEPARATOR);
  const [expandArrays, setExpandArrays] = React.useState<boolean>(true);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_NESTED_SAMPLE);

  const conversion = React.useMemo(() => {
    if (mode === MODE_FLATTEN) {
      return flattenJsonText(input, { separator, expandArrays });
    }
    return unflattenJsonText(input, separator);
  }, [input, mode, separator, expandArrays]);

  const output = React.useMemo(() => {
    if (conversion.error || conversion.data === null) {
      return '';
    }
    return JSON.stringify(conversion.data, null, 2);
  }, [conversion]);

  /**
   * 切换转换方向时载入对应示例
   *
   * @param next - 目标方向
   */
  const handleModeChange = (next: ConvertMode) => {
    setMode(next);
    setInput(next === MODE_FLATTEN ? DEFAULT_NESTED_SAMPLE : DEFAULT_FLAT_SAMPLE);
  };

  /** 载入当前方向的示例 */
  const handleLoadSample = () => {
    setInput(mode === MODE_FLATTEN ? DEFAULT_NESTED_SAMPLE : DEFAULT_FLAT_SAMPLE);
  };

  /** 清空输入 */
  const handleClear = () => {
    setInput('');
  };

  /** 复制转换结果 */
  const handleCopy = async () => {
    if (!output) {
      return;
    }
    try {
      await copyToClipboard(output);
      message.success('已复制转换结果');
    } catch {
      message.error('复制失败，请手动选择文本复制');
    }
  };

  const inputTitle = mode === MODE_FLATTEN ? '输入嵌套 JSON' : '输入扁平 JSON';
  const outputTitle = mode === MODE_FLATTEN ? '输出扁平 JSON' : '输出嵌套 JSON';

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as ConvertMode)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value={MODE_FLATTEN}>扁平化 Flatten</Radio.Button>
            <Radio.Button value={MODE_UNFLATTEN}>还原 Unflatten</Radio.Button>
          </Radio.Group>
          <Space>
            <span>分隔符</span>
            <Select
              value={separator}
              onChange={setSeparator}
              style={{ width: 120 }}
              options={SEPARATOR_OPTIONS}
            />
          </Space>
          {mode === MODE_FLATTEN && (
            <Checkbox
              checked={expandArrays}
              onChange={(event) => setExpandArrays(event.target.checked)}
            >
              展开数组（[0]、[1]…）
            </Checkbox>
          )}
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
        <Card title={inputTitle} className={styles.card}>
          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="在这里输入或粘贴 JSON..."
            autoSize={{ minRows: 12, maxRows: 26 }}
            spellCheck={false}
          />
        </Card>

        <Card
          title={outputTitle}
          className={styles.card}
          extra={
            !conversion.error && output ? (
              <Button type="text" icon={<CopyOutlined />} onClick={handleCopy}>
                复制结果
              </Button>
            ) : null
          }
        >
          {conversion.error ? (
            <Result status="error" title="转换失败" subTitle={conversion.error} />
          ) : (
            <Input.TextArea
              value={output}
              readOnly
              placeholder="转换结果将实时显示在这里"
              autoSize={{ minRows: 12, maxRows: 26 }}
              spellCheck={false}
            />
          )}
        </Card>
      </div>

      <p className={styles.hint}>
        扁平化把嵌套结构展开为单层键值，数组项以 <code>[索引]</code> 标记（如 <code>users[0].name</code>）；
        空对象与空数组作为叶子保留。反向还原时若同一节点同时存在叶子值与下级路径（如 <code>a</code> 与 <code>a.b</code>），将报告路径冲突。
        所有解析与转换均在你的浏览器本地完成，输入内容不会上传。
      </p>
    </div>
  );
};

export default JsonFlatten;
