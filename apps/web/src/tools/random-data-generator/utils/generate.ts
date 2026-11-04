import {
  DEFAULT_INT_MAX,
  DEFAULT_INT_MIN,
  MAX_COUNT,
  RandomTypeEnum,
} from '../constants';
import {
  randomBoolean,
  randomDateTime,
  randomEmail,
  randomFloatInRange,
  randomHexColor,
  randomIntegerInRange,
  randomName,
  randomParagraph,
  randomPhone,
  randomRgbColor,
  randomUuid,
  randomWord,
} from './random';

/**
 * 随机数据生成的输入参数
 */
export interface RandomGenerateOptions {
  /** 数据类型 */
  type: RandomTypeEnum;
  /** 生成条数 */
  count: number;
  /** 整数下限（integer 类型使用） */
  intMin?: number;
  /** 整数上限（integer 类型使用） */
  intMax?: number;
  /** 浮点下限（float 类型使用） */
  floatMin?: number;
  /** 浮点上限（float 类型使用） */
  floatMax?: number;
  /** 浮点小数位（float 类型使用） */
  decimals?: number;
  /** 日期范围下限（datetime 类型使用） */
  dateStart?: Date;
  /** 日期范围上限（datetime 类型使用） */
  dateEnd?: Date;
}

/**
 * 根据数据类型生成单条随机值
 *
 * @param options - 生成参数
 * @returns 单条随机值的字符串形式
 */
function generateOne(options: RandomGenerateOptions): string {
  switch (options.type) {
    case RandomTypeEnum.Integer:
      return String(
        randomIntegerInRange(
          options.intMin ?? DEFAULT_INT_MIN,
          options.intMax ?? DEFAULT_INT_MAX,
        ),
      );
    case RandomTypeEnum.Float:
      return String(
        randomFloatInRange(
          options.floatMin ?? 0,
          options.floatMax ?? 100,
          options.decimals ?? 2,
        ),
      );
    case RandomTypeEnum.Boolean:
      return String(randomBoolean());
    case RandomTypeEnum.HexColor:
      return randomHexColor();
    case RandomTypeEnum.RgbColor:
      return randomRgbColor();
    case RandomTypeEnum.Uuid:
      return randomUuid();
    case RandomTypeEnum.Name:
      return randomName();
    case RandomTypeEnum.Email:
      return randomEmail();
    case RandomTypeEnum.Phone:
      return randomPhone();
    case RandomTypeEnum.Word:
      return randomWord();
    case RandomTypeEnum.Paragraph:
      return randomParagraph(3);
    case RandomTypeEnum.DateTime:
      return randomDateTime(
        options.dateStart ?? new Date('2000-01-01T00:00:00.000Z'),
        options.dateEnd ?? new Date('2030-12-31T23:59:59.999Z'),
      );
    default: {
      const exhaustive: never = options.type;
      throw new Error(`不支持的随机数据类型：${String(exhaustive)}`);
    }
  }
}

/**
 * 按参数批量生成随机数据，条数被钳制在 [1, MAX_COUNT]
 *
 * @param options - 生成参数
 * @returns 随机值字符串数组
 */
export function generateRandomData(options: RandomGenerateOptions): string[] {
  const count = Math.min(MAX_COUNT, Math.max(1, Math.floor(options.count)));
  const results: string[] = [];
  for (let i = 0; i < count; i += 1) {
    results.push(generateOne(options));
  }
  return results;
}
