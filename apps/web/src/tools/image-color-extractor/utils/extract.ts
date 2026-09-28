/**
 * RGB 三通道颜色
 */
export interface RgbColor {
  /** 红色通道，取值 0 至 255 */
  r: number;
  /** 绿色通道，取值 0 至 255 */
  g: number;
  /** 蓝色通道，取值 0 至 255 */
  b: number;
}

/**
 * 提取结果中的单个颜色条目
 */
export interface ExtractedColor {
  /** 大写 HEX 颜色值 */
  hex: string;
  /** RGB 通道值 */
  rgb: RgbColor;
  /** 该颜色在图片中的像素占比，取值 0 至 1 */
  ratio: number;
}

/**
 * 将 RGB 通道转换为大写 HEX 颜色串
 *
 * @param rgb - RGB 通道值
 * @returns 形如 "#2563EB" 的颜色串
 */
export function formatRgbToHex(rgb: RgbColor) {
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    return Math.min(255, Math.max(0, Math.round(channel)))
      .toString(16)
      .padStart(2, '0');
  });
  return `#${channels.join('')}`.toUpperCase();
}

/**
 * 中位切分量化盒子，记录盒内全部像素以及各通道的最小值与最大值
 */
interface ColorBox {
  /** 盒内像素集合 */
  pixels: RgbColor[];
  /** 各通道最小值与最大值组成的跨度 */
  ranges: [number, number, number];
}

/**
 * 计算像素集合在 RGB 三通道上的跨度
 *
 * @param pixels - 像素集合
 * @returns RGB 通道的最大值减最小值
 */
function getRanges(pixels: RgbColor[]): [number, number, number] {
  const min = [255, 255, 255];
  const max = [0, 0, 0];
  for (const pixel of pixels) {
    const channels = [pixel.r, pixel.g, pixel.b];
    channels.forEach((value, index) => {
      if (value < (min[index] ?? 255)) {
        min[index] = value;
      }
      if (value > (max[index] ?? 0)) {
        max[index] = value;
      }
    });
  }
  return [
    (max[0] ?? 0) - (min[0] ?? 0),
    (max[1] ?? 0) - (min[1] ?? 0),
    (max[2] ?? 0) - (min[2] ?? 0),
  ];
}

/**
 * 依据跨度最大的通道，将一个颜色盒子切分为两个
 *
 * @param box - 待切分的颜色盒子
 * @returns 切分后的两个颜色盒子；像素过少无法切分时返回 null
 */
function splitBox(box: ColorBox): [ColorBox, ColorBox] | null {
  if (box.pixels.length < 2) {
    return null;
  }
  const channelIndex = box.ranges.reduce((widest, range, index) => {
    return range > (box.ranges[widest] ?? 0) ? index : widest;
  }, 0);
  const sorted = [...box.pixels].sort((first, second) => {
    const firstValue = [first.r, first.g, first.b][channelIndex] ?? 0;
    const secondValue = [second.r, second.g, second.b][channelIndex] ?? 0;
    return firstValue - secondValue;
  });
  const middle = Math.floor(sorted.length / 2);
  const leftPixels = sorted.slice(0, middle);
  const rightPixels = sorted.slice(middle);
  if (leftPixels.length === 0 || rightPixels.length === 0) {
    return null;
  }
  return [
    { pixels: leftPixels, ranges: getRanges(leftPixels) },
    { pixels: rightPixels, ranges: getRanges(rightPixels) },
  ];
}

/**
 * 使用中位切分算法对图片像素进行量化，提取指定数量的代表色
 *
 * @param pixels - 抽样像素集合
 * @param colorCount - 期望提取的颜色数量
 * @returns 按像素占比降序排列的颜色集合
 */
export function extractPalette(pixels: RgbColor[], colorCount: number) {
  if (pixels.length === 0) {
    return [] as ExtractedColor[];
  }
  let boxes: ColorBox[] = [{ pixels, ranges: getRanges(pixels) }];
  while (boxes.length < colorCount) {
    const targetIndex = boxes.reduce((candidate, box, index) => {
      const candidateVolume =
        (boxes[candidate]?.ranges[0] ?? 0) *
        (boxes[candidate]?.ranges[1] ?? 0) *
        (boxes[candidate]?.ranges[2] ?? 0);
      const currentVolume = box.ranges[0] * box.ranges[1] * box.ranges[2];
      return currentVolume > candidateVolume ? index : candidate;
    }, 0);
    const target = boxes[targetIndex];
    if (!target) {
      break;
    }
    const splitResult = splitBox(target);
    if (!splitResult) {
      break;
    }
    boxes = boxes
      .slice(0, targetIndex)
      .concat(splitResult, boxes.slice(targetIndex + 1));
  }

  const total = pixels.length;
  return boxes
    .map((box) => {
      const totalChannels = box.pixels.reduce<[number, number, number]>(
        (sum, pixel) => [sum[0] + pixel.r, sum[1] + pixel.g, sum[2] + pixel.b],
        [0, 0, 0],
      );
      const rgb: RgbColor = {
        r: (totalChannels[0] ?? 0) / box.pixels.length,
        g: (totalChannels[1] ?? 0) / box.pixels.length,
        b: (totalChannels[2] ?? 0) / box.pixels.length,
      };
      return {
        hex: formatRgbToHex(rgb),
        rgb: {
          r: Math.round(rgb.r),
          g: Math.round(rgb.g),
          b: Math.round(rgb.b),
        },
        ratio: box.pixels.length / total,
      };
    })
    .sort((first, second) => second.ratio - first.ratio);
}

/**
 * 从 Canvas 中抽样读取像素，图片较大时按固定步长跳读以控制运算量
 *
 * @param canvas - 已绘制目标图片的画布
 * @returns 抽样得到的不透明像素集合
 */
export function samplePixelsFromCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) {
    return [] as RgbColor[];
  }
  const { width, height } = canvas;
  const imageData = context.getImageData(0, 0, width, height).data;
  const maxSamples = 20000;
  const step = Math.max(1, Math.ceil((width * height) / maxSamples));
  const pixels: RgbColor[] = [];
  let index = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (index % step === 0) {
        const offset = (y * width + x) * 4;
        const alpha = imageData[offset + 3];
        if (alpha !== undefined && alpha > 125) {
          pixels.push({
            r: imageData[offset] ?? 0,
            g: imageData[offset + 1] ?? 0,
            b: imageData[offset + 2] ?? 0,
          });
        }
      }
      index += 1;
    }
  }
  return pixels;
}
