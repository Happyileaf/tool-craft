import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DARK_COLOR,
  DEFAULT_LIGHT_COLOR,
  DEFAULT_SIZE,
  QrErrorLevelEnum,
} from '../constants';
import { generateQrDataUrl, generateQrSvg, type QrGenerateOptions } from './qr';

const options: QrGenerateOptions = {
  errorLevel: QrErrorLevelEnum.M,
  size: DEFAULT_SIZE,
  darkColor: DEFAULT_DARK_COLOR,
  lightColor: DEFAULT_LIGHT_COLOR,
};

describe('generateQrDataUrl', () => {
  it('返回以 PNG Data URL 前缀开头的字符串', async () => {
    const dataUrl = await generateQrDataUrl('https://toolcraft.dev', options);
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('空文本或纯空白文本时抛出异常', async () => {
    await expect(generateQrDataUrl('', options)).rejects.toThrow(/不能为空/);
    await expect(generateQrDataUrl('   ', options)).rejects.toThrow(/不能为空/);
  });
});

describe('generateQrSvg', () => {
  it('输出包含 svg 根标记', async () => {
    const svg = await generateQrSvg('ToolCraft 工具箱', options);
    expect(svg).toContain('<svg');
  });

  it('空文本时抛出异常', async () => {
    await expect(generateQrSvg('', options)).rejects.toThrow(/不能为空/);
  });
});
