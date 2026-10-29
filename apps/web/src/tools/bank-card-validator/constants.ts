/** 银行卡号校验与卡种识别工具的常量 */

export const DEFAULT_CARD_NUMBER = '4111 1111 1111 1111';

/** 页面底部展示的常见测试卡号（公开测试号，非真实账户） */
export const SAMPLE_CARDS: Array<{ brand: string; number: string }> = [
  { brand: 'Visa', number: '4111 1111 1111 1111' },
  { brand: 'Mastercard', number: '5500 0055 5555 5559' },
  { brand: 'American Express', number: '3400 0000 0000 009' },
  { brand: 'UnionPay', number: '6200 0000 0000 0005' },
  { brand: 'JCB', number: '3530 1113 3330 0000' },
  { brand: 'Discover', number: '6011 1111 1111 1117' },
  { brand: 'Diners Club', number: '3056 9309 0259 04' },
];
