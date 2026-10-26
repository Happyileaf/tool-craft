'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, InputNumber, Radio, Select, Space, message } from 'antd';
import {
  ClearOutlined,
  CopyOutlined,
  ReloadOutlined,
  SoundOutlined,
  PauseOutlined,
} from '@ant-design/icons';
import {
  buildMorseTiming,
  decodeMorse,
  encodeMorse,
  MAX_GAP_UNITS,
  MIN_GAP_UNITS,
} from './utils/morse';
import {
  CodecModeEnum,
  DEFAULT_DOT_MS,
  DEFAULT_MORSE,
  DEFAULT_TEXT,
  DEFAULT_TONE_HZ,
  MODE_OPTIONS,
  SPEED_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 摩尔斯电码双向转换工具：文本与点划电码互相转换，
 * 支持可调字符 / 单词间隔与基于 Web Audio 的本地音频播放。
 * 全部运算与发声均在浏览器本地完成，不发起任何网络请求。
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns 摩尔斯编解码交互界面
 */
const MorseCodec: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [mode, setMode] = React.useState<CodecModeEnum>(CodecModeEnum.ENCODE);
  const [input, setInput] = React.useState<string>(defaultInput || DEFAULT_TEXT);
  const [charGap, setCharGap] = React.useState<number>(3);
  const [wordGap, setWordGap] = React.useState<number>(7);
  const [dotMs, setDotMs] = React.useState<number>(DEFAULT_DOT_MS);
  const [playing, setPlaying] = React.useState<boolean>(false);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const stopRequestedRef = React.useRef<boolean>(false);

  const isEncode = mode === CodecModeEnum.ENCODE;

  const result = React.useMemo<{ output: string; error: string | null }>(() => {
    if (!input.trim()) {
      return { output: '', error: null };
    }
    if (isEncode) {
      const encoded = encodeMorse(input, {
        charGapUnits: charGap,
        wordGapUnits: wordGap,
      });
      return { output: encoded.output ?? '', error: encoded.error };
    }
    const decoded = decodeMorse(input);
    return { output: decoded.output ?? '', error: decoded.error };
  }, [input, isEncode, charGap, wordGap]);

  React.useEffect(() => {
    return () => {
      stopRequestedRef.current = true;
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  /**
   * 切换转换方向并载入对应示例
   *
   * @param next - 目标方向
   */
  const handleModeChange = (next: CodecModeEnum) => {
    setMode(next);
    setInput(next === CodecModeEnum.ENCODE ? DEFAULT_TEXT : DEFAULT_MORSE);
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

  /**
   * 停止当前播放并关闭音频上下文
   */
  const stopPlayback = () => {
    stopRequestedRef.current = true;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setPlaying(false);
  };

  /**
   * 按播放时序调度振荡器，把当前电码朗读出来
   */
  const handlePlay = () => {
    if (playing) {
      stopPlayback();
      return;
    }
    if (result.error || !result.output) {
      return;
    }
    const timing = buildMorseTiming(result.output, charGap, wordGap);
    if (timing.length === 0) {
      return;
    }
    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      message.error('当前浏览器不支持 Web Audio，无法播放声音');
      return;
    }
    stopRequestedRef.current = false;
    const ctx = new AudioContextCtor();
    audioContextRef.current = ctx;
    setPlaying(true);

    const startAt = ctx.currentTime + 0.05;
    let cursor = 0;
    let totalMs = 0;
    timing.forEach((segment) => {
      const durationMs = segment.units * dotMs;
      totalMs += durationMs;
      if (segment.on) {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = DEFAULT_TONE_HZ;
        const begin = startAt + cursor / 1000;
        const end = begin + durationMs / 1000;
        gain.gain.setValueAtTime(0.0001, begin);
        gain.gain.exponentialRampToValueAtTime(0.25, begin + 0.008);
        gain.gain.setValueAtTime(0.25, Math.max(begin + 0.008, end - 0.008));
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(begin);
        oscillator.stop(end + 0.02);
      }
      cursor += durationMs;
    });

    window.setTimeout(() => {
      if (stopRequestedRef.current) {
        return;
      }
      void ctx.close();
      if (audioContextRef.current === ctx) {
        audioContextRef.current = null;
        setPlaying(false);
      }
    }, totalMs + 120);
  };

  const gapInvalid = isEncode && wordGap <= charGap;

  return (
    <div className={styles.container}>
      <Card title="摩尔斯电码编解码器（文本 ⇄ 点划，支持音频播放）">
        <div className={styles.toolbar}>
          <Radio.Group
            value={mode}
            onChange={(event) => handleModeChange(event.target.value as CodecModeEnum)}
            options={MODE_OPTIONS}
          />
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setInput(isEncode ? DEFAULT_TEXT : DEFAULT_MORSE)}
            >
              载入示例
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setInput('')}>
              清空
            </Button>
          </Space>
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>字符间隔（点长）：</span>
          <InputNumber
            className={styles.gapInput}
            min={MIN_GAP_UNITS}
            max={MAX_GAP_UNITS}
            precision={0}
            value={charGap}
            disabled={!isEncode}
            onChange={(value) => setCharGap(value ?? 3)}
          />
          <span className={styles.label}>单词间隔（点长）：</span>
          <InputNumber
            className={styles.gapInput}
            min={MIN_GAP_UNITS}
            max={MAX_GAP_UNITS}
            precision={0}
            value={wordGap}
            disabled={!isEncode}
            onChange={(value) => setWordGap(value ?? 7)}
          />
          <span className={styles.label}>播放速度：</span>
          <Select
            className={styles.speedSelect}
            value={dotMs}
            options={SPEED_OPTIONS}
            onChange={(value) => setDotMs(value)}
          />
          <Button
            type={playing ? 'default' : 'primary'}
            danger={playing}
            icon={playing ? <PauseOutlined /> : <SoundOutlined />}
            onClick={handlePlay}
            disabled={Boolean(result.error) || !result.output}
          >
            {playing ? '停止' : '播放电码'}
          </Button>
        </div>

        <div className={styles.toolbar} style={{ marginTop: 16 }}>
          <span className={styles.label}>{isEncode ? '文本输入：' : '摩尔斯输入：'}</span>
        </div>
        <Input.TextArea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            isEncode
              ? '输入字母、数字与常用标点，自动编码为点（.）划（-）'
              : '输入点划电码，字符间以空格分隔，单词间以斜杠（/）或更长空白分隔'
          }
          autoSize={{ minRows: 5, maxRows: 14 }}
          spellCheck={false}
          className={isEncode ? undefined : styles.morseOutput}
        />
      </Card>

      <Card
        title={isEncode ? '摩尔斯电码' : '解码文本'}
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
          <Alert
            type="error"
            showIcon
            message={isEncode ? '编码失败' : '解码失败'}
            description={result.error}
          />
        ) : (
          <Input.TextArea
            value={result.output}
            readOnly
            autoSize={{ minRows: 5, maxRows: 14 }}
            className={isEncode ? styles.morseOutput : undefined}
          />
        )}
        <div className={styles.hint}>
          {isEncode
            ? '标准 ITU 间隔为字符间 3 个点长、单词间 7 个点长；单词间隔必须大于字符间隔。编码结果可用「播放电码」按当前速度朗读。'
            : '解码规则：1–4 个空格视为字符间隔（手写容错），斜杠（/）或 5 个及以上空格视为单词间隔；播放按 3/7 标准间隔调度。'}
          {gapInvalid ? ' 当前单词间隔不大于字符间隔，编码将返回错误。' : ''}
        </div>
      </Card>
    </div>
  );
};

export default MorseCodec;
