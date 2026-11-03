/**
 * 摩尔质量计算器常量：IUPAC 2021 常规原子量（Conventional Atomic Weights）。
 * 无常规原子量的放射性元素取最稳定同位素质量数（按 IUPAC 惯例加方括号，bracketed=true）。
 * 数值版本固定，保证验收用例不随时间漂移：
 * https://ciaaw.org/atomic-weights.htm / CIAAW-IUPAC 2021
 */

export interface ElementInfo {
  /** 原子序数 */
  atomicNumber: number;
  /** 元素符号 */
  symbol: string;
  /** 元素名称（104-118 号超重元素中文名位于 CJK 扩展 B 区，为避免渲染问题使用英文名） */
  name: string;
  /** 原子量（g/mol）；bracketed 时为最稳定同位素质量数近似值 */
  atomicWeight: number;
  /** 是否为方括号近似值（无标准原子量的放射性元素） */
  bracketed: boolean;
}

/** 1-118 号元素静态原子量表 */
export const ELEMENTS: ElementInfo[] = [
  { atomicNumber: 1, symbol: 'H', name: '氢', atomicWeight: 1.008, bracketed: false },
  { atomicNumber: 2, symbol: 'He', name: '氦', atomicWeight: 4.002602, bracketed: false },
  { atomicNumber: 3, symbol: 'Li', name: '锂', atomicWeight: 6.94, bracketed: false },
  { atomicNumber: 4, symbol: 'Be', name: '铍', atomicWeight: 9.0121831, bracketed: false },
  { atomicNumber: 5, symbol: 'B', name: '硼', atomicWeight: 10.81, bracketed: false },
  { atomicNumber: 6, symbol: 'C', name: '碳', atomicWeight: 12.011, bracketed: false },
  { atomicNumber: 7, symbol: 'N', name: '氮', atomicWeight: 14.007, bracketed: false },
  { atomicNumber: 8, symbol: 'O', name: '氧', atomicWeight: 15.999, bracketed: false },
  { atomicNumber: 9, symbol: 'F', name: '氟', atomicWeight: 18.998403163, bracketed: false },
  { atomicNumber: 10, symbol: 'Ne', name: '氖', atomicWeight: 20.1797, bracketed: false },
  { atomicNumber: 11, symbol: 'Na', name: '钠', atomicWeight: 22.98976928, bracketed: false },
  { atomicNumber: 12, symbol: 'Mg', name: '镁', atomicWeight: 24.305, bracketed: false },
  { atomicNumber: 13, symbol: 'Al', name: '铝', atomicWeight: 26.9815385, bracketed: false },
  { atomicNumber: 14, symbol: 'Si', name: '硅', atomicWeight: 28.085, bracketed: false },
  { atomicNumber: 15, symbol: 'P', name: '磷', atomicWeight: 30.973761998, bracketed: false },
  { atomicNumber: 16, symbol: 'S', name: '硫', atomicWeight: 32.06, bracketed: false },
  { atomicNumber: 17, symbol: 'Cl', name: '氯', atomicWeight: 35.45, bracketed: false },
  { atomicNumber: 18, symbol: 'Ar', name: '氩', atomicWeight: 39.948, bracketed: false },
  { atomicNumber: 19, symbol: 'K', name: '钾', atomicWeight: 39.0983, bracketed: false },
  { atomicNumber: 20, symbol: 'Ca', name: '钙', atomicWeight: 40.078, bracketed: false },
  { atomicNumber: 21, symbol: 'Sc', name: '钪', atomicWeight: 44.955908, bracketed: false },
  { atomicNumber: 22, symbol: 'Ti', name: '钛', atomicWeight: 47.867, bracketed: false },
  { atomicNumber: 23, symbol: 'V', name: '钒', atomicWeight: 50.9415, bracketed: false },
  { atomicNumber: 24, symbol: 'Cr', name: '铬', atomicWeight: 51.9961, bracketed: false },
  { atomicNumber: 25, symbol: 'Mn', name: '锰', atomicWeight: 54.938044, bracketed: false },
  { atomicNumber: 26, symbol: 'Fe', name: '铁', atomicWeight: 55.845, bracketed: false },
  { atomicNumber: 27, symbol: 'Co', name: '钴', atomicWeight: 58.933194, bracketed: false },
  { atomicNumber: 28, symbol: 'Ni', name: '镍', atomicWeight: 58.6934, bracketed: false },
  { atomicNumber: 29, symbol: 'Cu', name: '铜', atomicWeight: 63.546, bracketed: false },
  { atomicNumber: 30, symbol: 'Zn', name: '锌', atomicWeight: 65.38, bracketed: false },
  { atomicNumber: 31, symbol: 'Ga', name: '镓', atomicWeight: 69.723, bracketed: false },
  { atomicNumber: 32, symbol: 'Ge', name: '锗', atomicWeight: 72.63, bracketed: false },
  { atomicNumber: 33, symbol: 'As', name: '砷', atomicWeight: 74.921595, bracketed: false },
  { atomicNumber: 34, symbol: 'Se', name: '硒', atomicWeight: 78.971, bracketed: false },
  { atomicNumber: 35, symbol: 'Br', name: '溴', atomicWeight: 79.904, bracketed: false },
  { atomicNumber: 36, symbol: 'Kr', name: '氪', atomicWeight: 83.798, bracketed: false },
  { atomicNumber: 37, symbol: 'Rb', name: '铷', atomicWeight: 85.4678, bracketed: false },
  { atomicNumber: 38, symbol: 'Sr', name: '锶', atomicWeight: 87.62, bracketed: false },
  { atomicNumber: 39, symbol: 'Y', name: '钇', atomicWeight: 88.90584, bracketed: false },
  { atomicNumber: 40, symbol: 'Zr', name: '锆', atomicWeight: 91.224, bracketed: false },
  { atomicNumber: 41, symbol: 'Nb', name: '铌', atomicWeight: 92.90637, bracketed: false },
  { atomicNumber: 42, symbol: 'Mo', name: '钼', atomicWeight: 95.95, bracketed: false },
  { atomicNumber: 43, symbol: 'Tc', name: '锝', atomicWeight: 98, bracketed: true },
  { atomicNumber: 44, symbol: 'Ru', name: '钌', atomicWeight: 101.07, bracketed: false },
  { atomicNumber: 45, symbol: 'Rh', name: '铑', atomicWeight: 102.9055, bracketed: false },
  { atomicNumber: 46, symbol: 'Pd', name: '钯', atomicWeight: 106.42, bracketed: false },
  { atomicNumber: 47, symbol: 'Ag', name: '银', atomicWeight: 107.8682, bracketed: false },
  { atomicNumber: 48, symbol: 'Cd', name: '镉', atomicWeight: 112.414, bracketed: false },
  { atomicNumber: 49, symbol: 'In', name: '铟', atomicWeight: 114.818, bracketed: false },
  { atomicNumber: 50, symbol: 'Sn', name: '锡', atomicWeight: 118.71, bracketed: false },
  { atomicNumber: 51, symbol: 'Sb', name: '锑', atomicWeight: 121.76, bracketed: false },
  { atomicNumber: 52, symbol: 'Te', name: '碲', atomicWeight: 127.6, bracketed: false },
  { atomicNumber: 53, symbol: 'I', name: '碘', atomicWeight: 126.90447, bracketed: false },
  { atomicNumber: 54, symbol: 'Xe', name: '氙', atomicWeight: 131.293, bracketed: false },
  { atomicNumber: 55, symbol: 'Cs', name: '铯', atomicWeight: 132.90545196, bracketed: false },
  { atomicNumber: 56, symbol: 'Ba', name: '钡', atomicWeight: 137.327, bracketed: false },
  { atomicNumber: 57, symbol: 'La', name: '镧', atomicWeight: 138.90547, bracketed: false },
  { atomicNumber: 58, symbol: 'Ce', name: '铈', atomicWeight: 140.116, bracketed: false },
  { atomicNumber: 59, symbol: 'Pr', name: '镨', atomicWeight: 140.90766, bracketed: false },
  { atomicNumber: 60, symbol: 'Nd', name: '钕', atomicWeight: 144.242, bracketed: false },
  { atomicNumber: 61, symbol: 'Pm', name: '钷', atomicWeight: 145, bracketed: true },
  { atomicNumber: 62, symbol: 'Sm', name: '钐', atomicWeight: 150.36, bracketed: false },
  { atomicNumber: 63, symbol: 'Eu', name: '铕', atomicWeight: 151.964, bracketed: false },
  { atomicNumber: 64, symbol: 'Gd', name: '钆', atomicWeight: 157.25, bracketed: false },
  { atomicNumber: 65, symbol: 'Tb', name: '铽', atomicWeight: 158.92535, bracketed: false },
  { atomicNumber: 66, symbol: 'Dy', name: '镝', atomicWeight: 162.5, bracketed: false },
  { atomicNumber: 67, symbol: 'Ho', name: '钬', atomicWeight: 164.93033, bracketed: false },
  { atomicNumber: 68, symbol: 'Er', name: '铒', atomicWeight: 167.259, bracketed: false },
  { atomicNumber: 69, symbol: 'Tm', name: '铥', atomicWeight: 168.93422, bracketed: false },
  { atomicNumber: 70, symbol: 'Yb', name: '镱', atomicWeight: 173.045, bracketed: false },
  { atomicNumber: 71, symbol: 'Lu', name: '镥', atomicWeight: 174.9668, bracketed: false },
  { atomicNumber: 72, symbol: 'Hf', name: '铪', atomicWeight: 178.49, bracketed: false },
  { atomicNumber: 73, symbol: 'Ta', name: '钽', atomicWeight: 180.94788, bracketed: false },
  { atomicNumber: 74, symbol: 'W', name: '钨', atomicWeight: 183.84, bracketed: false },
  { atomicNumber: 75, symbol: 'Re', name: '铼', atomicWeight: 186.207, bracketed: false },
  { atomicNumber: 76, symbol: 'Os', name: '锇', atomicWeight: 190.23, bracketed: false },
  { atomicNumber: 77, symbol: 'Ir', name: '铱', atomicWeight: 192.217, bracketed: false },
  { atomicNumber: 78, symbol: 'Pt', name: '铂', atomicWeight: 195.084, bracketed: false },
  { atomicNumber: 79, symbol: 'Au', name: '金', atomicWeight: 196.96657, bracketed: false },
  { atomicNumber: 80, symbol: 'Hg', name: '汞', atomicWeight: 200.592, bracketed: false },
  { atomicNumber: 81, symbol: 'Tl', name: '铊', atomicWeight: 204.38, bracketed: false },
  { atomicNumber: 82, symbol: 'Pb', name: '铅', atomicWeight: 207.2, bracketed: false },
  { atomicNumber: 83, symbol: 'Bi', name: '铋', atomicWeight: 208.9804, bracketed: false },
  { atomicNumber: 84, symbol: 'Po', name: '钋', atomicWeight: 209, bracketed: true },
  { atomicNumber: 85, symbol: 'At', name: '砹', atomicWeight: 210, bracketed: true },
  { atomicNumber: 86, symbol: 'Rn', name: '氡', atomicWeight: 222, bracketed: true },
  { atomicNumber: 87, symbol: 'Fr', name: '钫', atomicWeight: 223, bracketed: true },
  { atomicNumber: 88, symbol: 'Ra', name: '镭', atomicWeight: 226, bracketed: true },
  { atomicNumber: 89, symbol: 'Ac', name: '锕', atomicWeight: 227, bracketed: true },
  { atomicNumber: 90, symbol: 'Th', name: '钍', atomicWeight: 232.0377, bracketed: false },
  { atomicNumber: 91, symbol: 'Pa', name: '镤', atomicWeight: 231.03588, bracketed: false },
  { atomicNumber: 92, symbol: 'U', name: '铀', atomicWeight: 238.02891, bracketed: false },
  { atomicNumber: 93, symbol: 'Np', name: '镎', atomicWeight: 237, bracketed: true },
  { atomicNumber: 94, symbol: 'Pu', name: '钚', atomicWeight: 244, bracketed: true },
  { atomicNumber: 95, symbol: 'Am', name: '镅', atomicWeight: 243, bracketed: true },
  { atomicNumber: 96, symbol: 'Cm', name: '锔', atomicWeight: 247, bracketed: true },
  { atomicNumber: 97, symbol: 'Bk', name: '锫', atomicWeight: 247, bracketed: true },
  { atomicNumber: 98, symbol: 'Cf', name: '锎', atomicWeight: 251, bracketed: true },
  { atomicNumber: 99, symbol: 'Es', name: '锿', atomicWeight: 252, bracketed: true },
  { atomicNumber: 100, symbol: 'Fm', name: '镄', atomicWeight: 257, bracketed: true },
  { atomicNumber: 101, symbol: 'Md', name: '钔', atomicWeight: 258, bracketed: true },
  { atomicNumber: 102, symbol: 'No', name: '锘', atomicWeight: 259, bracketed: true },
  { atomicNumber: 103, symbol: 'Lr', name: '铹', atomicWeight: 266, bracketed: true },
  { atomicNumber: 104, symbol: 'Rf', name: 'Rutherfordium', atomicWeight: 267, bracketed: true },
  { atomicNumber: 105, symbol: 'Db', name: 'Dubnium', atomicWeight: 268, bracketed: true },
  { atomicNumber: 106, symbol: 'Sg', name: 'Seaborgium', atomicWeight: 269, bracketed: true },
  { atomicNumber: 107, symbol: 'Bh', name: 'Bohrium', atomicWeight: 270, bracketed: true },
  { atomicNumber: 108, symbol: 'Hs', name: 'Hassium', atomicWeight: 269, bracketed: true },
  { atomicNumber: 109, symbol: 'Mt', name: 'Meitnerium', atomicWeight: 278, bracketed: true },
  { atomicNumber: 110, symbol: 'Ds', name: 'Darmstadtium', atomicWeight: 281, bracketed: true },
  { atomicNumber: 111, symbol: 'Rg', name: 'Roentgenium', atomicWeight: 282, bracketed: true },
  { atomicNumber: 112, symbol: 'Cn', name: 'Copernicium', atomicWeight: 285, bracketed: true },
  { atomicNumber: 113, symbol: 'Nh', name: 'Nihonium', atomicWeight: 286, bracketed: true },
  { atomicNumber: 114, symbol: 'Fl', name: 'Flerovium', atomicWeight: 289, bracketed: true },
  { atomicNumber: 115, symbol: 'Mc', name: 'Moscovium', atomicWeight: 290, bracketed: true },
  { atomicNumber: 116, symbol: 'Lv', name: 'Livermorium', atomicWeight: 293, bracketed: true },
  { atomicNumber: 117, symbol: 'Ts', name: 'Tennessine', atomicWeight: 294, bracketed: true },
  { atomicNumber: 118, symbol: 'Og', name: 'Oganesson', atomicWeight: 294, bracketed: true },
];

/** 元素符号 → 元素信息查找表 */
export const ELEMENT_MAP: Map<string, ElementInfo> = new Map(
  ELEMENTS.map((el) => [el.symbol, el]),
);

/** 可一键填入的示例化学式 */
export const EXAMPLE_FORMULAS: string[] = [
  'H2O',
  'NaCl',
  'H2SO4',
  'Ca(OH)2',
  'C2H5OH',
  'C6H12O6',
  'Fe2(SO4)3',
  'CuSO4·5H2O',
];

/** 批量输入时的化学式分隔符（换行 / 逗号 / 分号，含中文标点） */
export const FORMULA_SPLIT_PATTERN = /[\n,，;；]+/;

/** 结晶水/加合物分隔符（中点、粗中点，以及键入时常用的星号） */
export const HYDRATE_SPLIT_PATTERN = /[·•*]/;
