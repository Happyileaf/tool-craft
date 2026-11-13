/** 默认文字颜色（近黑） */
export const DEFAULT_TEXT_COLOR = '#1F2329';

/** 默认背景颜色（近白） */
export const DEFAULT_BACKGROUND_COLOR = '#FFFFFF';

/** 一组常见文字 / 背景配对，便于快速对比 */
export const PRESET_PAIRS: { label: string; text: string; background: string }[] = [
  { label: '黑字白底', text: '#000000', background: '#FFFFFF' },
  { label: '白字黑底', text: '#FFFFFF', background: '#000000' },
  { label: 'Ant Design 主色白字', text: '#FFFFFF', background: '#1677FF' },
  { label: '次要灰字浅灰底', text: '#595959', background: '#F5F5F5' },
  { label: '成功绿白字', text: '#FFFFFF', background: '#52C41A' },
];

/** 分级参考表，用于在页面底部展示完整阈值 */
export const LEVEL_REFERENCE: { grade: string; range: string; usage: string }[] = [
  { grade: 'Lc 90+', range: '|Lc| ≥ 90', usage: '最优正文可读性，大段小字正文' },
  { grade: 'Lc 75+', range: '75 ≤ |Lc| < 90', usage: '合格正文级，常规字号正文' },
  { grade: 'Lc 60+', range: '60 ≤ |Lc| < 75', usage: '中号文字、表单内容' },
  { grade: 'Lc 45+', range: '45 ≤ |Lc| < 60', usage: '大号文字、标题、粗体' },
  { grade: 'Lc 30+', range: '30 ≤ |Lc| < 45', usage: '超大标题或装饰性文字' },
  { grade: 'Lc 15+', range: '15 ≤ |Lc| < 30', usage: '仅限非文字图形元素' },
  { grade: 'Lc < 15', range: '|Lc| < 15', usage: '对比不足，不适合文字内容' },
];
