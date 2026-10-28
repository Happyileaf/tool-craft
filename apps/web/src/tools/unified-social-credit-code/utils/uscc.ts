/**
 * 法人和其他组织统一社会信用代码（GB 32100-2015）校验与解析。
 * 18 位 = 1 位登记管理部门 + 1 位机构类别 + 6 位行政区划码 + 9 位主体标识码 + 1 位校验码。
 * 字符集为 31 个字符（去掉易混淆的 I、O、Z、S、V），采用 31 进制加权、模 31 校验。
 * 纯本地确定性计算，零依赖。
 */

/** 代码长度固定 18 位 */
export const USCC_LENGTH = 18;
/** 主体标识码（组织机构代码）长度 9 位 */
export const SUBJECT_ID_LENGTH = 9;
/** 校验码所在的下标（0 基） */
export const CHECK_INDEX = 17;

/**
 * 31 个可用字符：0-9 + A-Z 去除 I、O、Z、S、V。
 * 字符在串中的下标即其 31 进制数值（0–30）。
 */
export const USCC_CHARSET = '0123456789ABCDEFGHJKLMNPQRTUWXY';

/** 前 17 位的加权因子（GB 32100-2015 附录） */
const WEIGHTS = [
  1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28,
];

/** 登记管理部门名称（第 1 位） */
const DEPARTMENT_NAMES: Record<string, string> = {
  '1': '机构编制',
  '2': '外交',
  '3': '司法行政',
  '4': '文化和旅游',
  '5': '民政',
  '6': '文化和旅游（旅游）',
  '7': '宗教',
  '8': '工会',
  '9': '市场监管（工商）',
  A: '中央军委改革和编制办公室',
  G: '公安',
  J: '住房城乡建设',
  N: '农业农村',
  Q: '侨联',
  Y: '其他（贸易促进 / 科技 / 财政 / 商务 / 港澳事务 / 体育等）',
};

/** 前两位（部门 + 机构类别）组合标识，依据 GB 32100-2015 及现行登记部门代码表 */
const CATEGORY_NAMES: Record<string, string> = {
  '11': '机关',
  '12': '事业单位',
  '13': '编办直接管理机构编制的群众团体',
  '19': '机构编制部门管理的其他机构',
  '21': '外国常驻新闻机构',
  '31': '律师执业机构',
  '36': '商事调解组织',
  '39': '司法行政部门管理的其他机构',
  '41': '外国在华文化中心',
  '51': '社会团体',
  '52': '民办非企业单位',
  '53': '基金会',
  '54': '村民委员会',
  '55': '居民委员会',
  '59': '民政部门管理的其他机构',
  '61': '外国政府旅游部门常驻代表机构',
  '62': '港澳台地区旅游部门常驻代表机构',
  '71': '宗教活动场所',
  '72': '宗教院校',
  '79': '宗教部门管理的其他机构',
  '81': '基层工会',
  '82': '非法人工会组织',
  '89': '工会管理的其他机构',
  '91': '企业',
  '92': '个体工商户',
  '93': '农民专业合作社',
  '99': '市场监管部门管理的其他机构',
  A1: '军队文职人员用人单位',
  G1: '境外非政府组织代表机构',
  J1: '业主大会',
  N1: '组级集体经济组织',
  N2: '村级集体经济组织',
  N3: '乡镇级集体经济组织',
  Q1: '区县级侨联组织',
  Q2: '乡镇级侨联组织',
  Q3: '村级侨联组织',
  Y1: '其他部门登记的机构（贸促 / 科技 / 财政 / 商务 / 港澳 / 体育等）',
};

/** 6 位行政区划码前两位（省级）名称，依据 GB/T 2260 */
const PROVINCE_NAMES: Record<string, string> = {
  '11': '北京市',
  '12': '天津市',
  '13': '河北省',
  '14': '山西省',
  '15': '内蒙古自治区',
  '21': '辽宁省',
  '22': '吉林省',
  '23': '黑龙江省',
  '31': '上海市',
  '32': '江苏省',
  '33': '浙江省',
  '34': '安徽省',
  '35': '福建省',
  '36': '江西省',
  '37': '山东省',
  '41': '河南省',
  '42': '湖北省',
  '43': '湖南省',
  '44': '广东省',
  '45': '广西壮族自治区',
  '46': '海南省',
  '50': '重庆市',
  '51': '四川省',
  '52': '贵州省',
  '53': '云南省',
  '54': '西藏自治区',
  '61': '陕西省',
  '62': '甘肃省',
  '63': '青海省',
  '64': '宁夏回族自治区',
  '65': '新疆维吾尔自治区',
  '71': '台湾省',
  '81': '香港特别行政区',
  '82': '澳门特别行政区',
};

/** 解析后的统一社会信用代码结构化信息 */
export interface UsccParts {
  /** 登记管理部门代码（第 1 位） */
  departmentCode: string;
  /** 登记管理部门名称 */
  departmentName: string;
  /** 机构类别代码（第 2 位） */
  categoryCode: string;
  /** 两位组合对应的机构类别名称 */
  categoryName: string;
  /** 6 位登记管理机关行政区划码（第 3–8 位） */
  regionCode: string;
  /** 行政区划前两位对应的省级名称；无法识别时为 null */
  provinceName: string | null;
  /** 9 位主体标识码（组织机构代码，第 9–17 位） */
  subjectId: string;
  /** 代码自带的校验码（第 18 位） */
  checkCode: string;
  /** 按算法计算出的正确校验码 */
  expectedCheckCode: string;
}

/** 校验与解析结果 */
export interface UsccResult {
  /** 是否为合法的统一社会信用代码（长度、字符集、校验码全部通过） */
  valid: boolean;
  /** 不合法时的面向用户的中文原因；合法时为 null */
  error: string | null;
  /** 解析结果，仅在校验码计算可完成（前 17 位均为合法字符）时存在 */
  parts?: UsccParts;
}

/**
 * 规范化输入：去除首尾空白并转为大写（信用代码使用大写字母）
 *
 * @param input - 原始输入
 * @returns 大写、去空白后的代码
 */
export function normalizeUscc(input: string): string {
  return input.trim().toUpperCase();
}

/**
 * 根据前 17 位计算第 18 位校验码。
 *
 * @param body - 长度 17 的代码主体
 * @returns 1 位校验码
 * @throws 主体长度不为 17 或含非法字符时抛出错误
 */
export function computeCheckCode(body: string): string {
  if (body.length !== CHECK_INDEX) {
    throw new Error('主体必须为 17 位');
  }
  let sum = 0;
  for (let i = 0; i < CHECK_INDEX; i += 1) {
    const value = USCC_CHARSET.indexOf(body[i]!);
    if (value === -1) {
      throw new Error(`第 ${i + 1} 位字符「${body[i]}」不属于信用代码字符集`);
    }
    sum += value * WEIGHTS[i]!;
  }
  let checkValue = 31 - (sum % 31);
  if (checkValue === 31) {
    checkValue = 0;
  }
  return USCC_CHARSET[checkValue]!;
}

/**
 * 校验并解析统一社会信用代码。
 *
 * @param input - 用户输入的 18 位代码
 * @returns 校验结论与结构化解析；空输入返回 valid=false 且 error=null
 */
export function validateUscc(input: string): UsccResult {
  const code = normalizeUscc(input);
  if (code.length === 0) {
    return { valid: false, error: null };
  }
  if (code.length !== USCC_LENGTH) {
    return {
      valid: false,
      error: `代码必须为 ${USCC_LENGTH} 位，当前为 ${code.length} 位`,
    };
  }
  for (let i = 0; i < USCC_LENGTH; i += 1) {
    if (!USCC_CHARSET.includes(code[i]!)) {
      return {
        valid: false,
        error: `第 ${i + 1} 位字符「${code[i]}」非法：仅允许使用 ${USCC_CHARSET}`,
      };
    }
  }

  const body = code.slice(0, CHECK_INDEX);
  const expected = computeCheckCode(body);
  const actual = code[CHECK_INDEX]!;

  const departmentCode = code[0]!;
  const categoryCode = code[1]!;
  const prefix = departmentCode + categoryCode;
  const regionCode = code.slice(2, 8);
  const subjectId = code.slice(8, CHECK_INDEX);

  const parts: UsccParts = {
    departmentCode,
    departmentName: DEPARTMENT_NAMES[departmentCode] ?? '未收录的登记管理部门',
    categoryCode,
    categoryName: CATEGORY_NAMES[prefix] ?? '未收录的机构类别',
    regionCode,
    provinceName: PROVINCE_NAMES[regionCode.slice(0, 2)] ?? null,
    subjectId,
    checkCode: actual,
    expectedCheckCode: expected,
  };

  if (actual !== expected) {
    return {
      valid: false,
      error: `校验码错误：代码末位为「${actual}」，按加权模 31 计算应为「${expected}」`,
      parts,
    };
  }

  return { valid: true, error: null, parts };
}
