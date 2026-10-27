/**
 * Quoted-Printable（RFC 2045）编解码工具内常量
 */

/** 编解码方向 */
export enum CodecModeEnum {
  /** 文本编码为 Quoted-Printable */
  ENCODE = 'encode',
  /** Quoted-Printable 解码为文本 */
  DECODE = 'decode',
}

/** 换行形式 */
export enum LineBreakEnum {
  /** RFC 2045 标准 CRLF */
  CRLF = 'crlf',
  /** 类 Unix LF */
  LF = 'lf',
}

/** 编解码方向选择项数据源 */
export const MODE_OPTIONS: { label: string; value: CodecModeEnum }[] = [
  { label: '编码（文本 → Quoted-Printable）', value: CodecModeEnum.ENCODE },
  { label: '解码（Quoted-Printable → 文本）', value: CodecModeEnum.DECODE },
];

/** 换行形式选择项数据源 */
export const LINE_BREAK_OPTIONS: { label: string; value: LineBreakEnum }[] = [
  { label: 'CRLF（RFC 2045 标准）', value: LineBreakEnum.CRLF },
  { label: 'LF（类 Unix）', value: LineBreakEnum.LF },
];

/** 编码方向的默认示例文本（含中文、等号与特殊符号，演示 =XX 转义与软换行） */
export const DEFAULT_TEXT = 'Quoted-Printable 编码示例：café = 42€。';

/** 解码方向的默认示例 Quoted-Printable 字符串 */
export const DEFAULT_QP = 'Quoted-Printable =E7=BC=96=E7=A0=81=E7=A4=BA=E4=BE=8B=EF=BC=9Acaf=C3=A9 =3D 42=E2=82=AC=E3=80=82';
