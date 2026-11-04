/**
 * 许可证生成器的静态配置：可选许可证清单、填充占位符与输入约束
 *
 * 模板全文按 SPDX 官方文本内置在 ./templates 中，填充时仅替换
 * 年份与著作权人两个占位符，不改动任何法律条款原文。
 */

/** 年份占位符，与 SPDX 模板写法保持一致 */
export const YEAR_PLACEHOLDER = '[year]';

/** 著作权人占位符，与 SPDX 模板写法保持一致 */
export const COPYRIGHT_HOLDER_PLACEHOLDER = '[fullname]';

/** 著作权人最大输入长度，防止超长文本破坏许可证排版 */
export const MAX_HOLDER_LENGTH = 120;

/** 年份下界，覆盖现代软件著作权声明的常见范围 */
export const MIN_YEAR = 1900;

/** 年份上界，留出一定缓冲避免明显非法输入 */
export const MAX_YEAR = 2100;

/**
 * 单个许可证的展示元数据
 */
export interface LicenseMeta {
  /** SPDX 标识符，同时作为模板映射键 */
  id: string;
  /** 中文全名 */
  name: string;
  /** 英文/SPDX 名称 */
  spdxName: string;
  /** 一句话中文简介 */
  summary: string;
  /** 是否要求衍生作品以相同许可证开源（copyleft 强度） */
  copyleft: '无' | '弱' | '强';
  /** 是否包含明确的专利授权条款 */
  patentGrant: boolean;
  /** 典型适用场景（中文） */
  useCase: string;
}

/**
 * 内置许可证清单，顺序即界面展示顺序
 */
export const LICENSES: LicenseMeta[] = [
  {
    id: 'MIT',
    name: 'MIT 许可证',
    spdxName: 'MIT License',
    summary: '条款最简短、限制最少的宽松许可证，仅要求保留版权与许可声明。',
    copyleft: '无',
    patentGrant: false,
    useCase: '追求最大复用自由度的库、工具与个人项目，是最主流的宽松许可证。',
  },
  {
    id: 'Apache-2.0',
    name: 'Apache 许可证 2.0',
    spdxName: 'Apache License 2.0',
    summary: '宽松许可证，含明确专利授权与专利诉讼终止条款，并要求标注文件变更。',
    copyleft: '无',
    patentGrant: true,
    useCase: '关注专利风险的企业级项目与大型基金会项目（如 Apache 基金会项目）。',
  },
  {
    id: 'BSD-2-Clause',
    name: 'BSD 2-Clause 许可证',
    spdxName: 'BSD 2-Clause "Simplified" License',
    summary: '与 MIT 接近的两条款宽松许可证，保留版权声明与免责声明即可自由使用。',
    copyleft: '无',
    patentGrant: false,
    useCase: '偏好 BSD 传统措辞的库与学术/研究类项目。',
  },
  {
    id: 'BSD-3-Clause',
    name: 'BSD 3-Clause 许可证',
    spdxName: 'BSD 3-Clause "New" or "Revised" License',
    summary: '在两条款基础上增加不得用版权方名义为衍生作品背书的限制。',
    copyleft: '无',
    patentGrant: false,
    useCase: '希望禁止商标/名义背书的开源项目与公司开源库。',
  },
  {
    id: 'ISC',
    name: 'ISC 许可证',
    spdxName: 'ISC License',
    summary: '与 MIT 功能等价但措辞更精简的宽松许可证，去除了冗余法律用语。',
    copyleft: '无',
    patentGrant: false,
    useCase: '追求极简条款的 npm 生态包与命令行工具（npm 官方推荐之一）。',
  },
  {
    id: 'GPL-3.0',
    name: 'GNU GPL v3.0',
    spdxName: 'GNU General Public License v3.0',
    summary: '强 copyleft 许可证，衍生作品分发时必须以相同许可证开源，并含专利授权与反 Tivoization 条款。',
    copyleft: '强',
    patentGrant: true,
    useCase: '希望强制衍生作品持续开源、防止专有闭源挪用的项目。',
  },
  {
    id: 'Unlicense',
    name: 'Unlicense',
    spdxName: 'The Unlicense',
    summary: '等效于公有领域贡献的弃权声明，放弃全部著作权，任何人可任意处置。',
    copyleft: '无',
    patentGrant: false,
    useCase: '希望彻底放弃权利、进入公有领域的代码片段与示例项目。',
  },
];
