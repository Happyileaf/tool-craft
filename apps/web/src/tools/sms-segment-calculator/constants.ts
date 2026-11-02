/**
 * SMS 短信分段计算工具的常量定义
 *
 * 容量规则来自 3GPP TS 23.038（字符表）与 TS 23.040（UDH 拼接）：
 * - GSM 7-bit 单条 160 septet；拼接时每条扣除 6 字节 UDH（占 7 septet），可用 153 septet
 * - UCS-2 单条 70 个 UTF-16 码元；拼接时扣除 6 字节 UDH，每条 67 个码元
 */

/** GSM 7-bit 单条最大 septet 数 */
export const GSM_SINGLE_MAX = 160;

/** GSM 7-bit 长短信每条可用 septet 数（160 - 7 septet UDH） */
export const GSM_CONCAT_SEGMENT_MAX = 153;

/** UCS-2 单条最大码元数 */
export const UCS2_SINGLE_MAX = 70;

/** UCS-2 长短信每条可用码元数（70 - 3 个 UTF-16 码元的 UDH） */
export const UCS2_CONCAT_SEGMENT_MAX = 67;

/** 拼接短信 UDH 长度（字节）：信息元标识 1 字节 + 长度 1 字节 + 引用 1 字节 + 总条数 1 字节 + 当前序号 1 字节 + 头长度本身 1 字节 */
export const UDH_BYTE_LENGTH = 6;

/** 输入框默认示例 */
export const DEFAULT_INPUT = '您有一条验证码：123456，5 分钟内有效。';

/** GSM 7-bit 默认字母表（不含转义扩展字符），按 GSM 03.38 排序（仅用于查表，顺序不影响计算） */
export const GSM_BASE_CHARS =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';

/** GSM 7-bit 转义扩展表字符（每个字符占用 2 个 septet） */
export const GSM_EXTENSION_CHARS = '^{}\\[~]|€';

/** 空输入提示 */
export const EMPTY_TEXT = '请输入短信正文，实时显示字符数、编码方式与分条数量';

/** 输入提示 */
export const INPUT_HINT =
  '编码方式按 3GPP TS 23.038 自动判定：全部字符落在 GSM 7-bit 字母表时使用 7-bit（每字符 1 septet，扩展表字符 2 septet），出现任意非 GSM 字符（含中文、emoji 等）则整信切换为 UCS-2（按 UTF-16 码元计，BMP 外字符占 2 码元）。';
