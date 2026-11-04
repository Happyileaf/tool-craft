/**
 * 单位换算器支持的物理量分类
 */
export enum UnitCategoryEnum {
  /** 长度 */
  Length = 'length',
  /** 质量 */
  Mass = 'mass',
  /** 温度 */
  Temperature = 'temperature',
  /** 面积 */
  Area = 'area',
  /** 体积 */
  Volume = 'volume',
  /** 速度 */
  Speed = 'speed',
  /** 数据存储 */
  DataStorage = 'data-storage',
  /** 时间 */
  Time = 'time',
  /** 压强 */
  Pressure = 'pressure',
  /** 角度 */
  Angle = 'angle',
  /** 能量 */
  Energy = 'energy',
}

/**
 * 单个单位的定义
 *
 * 采用统一的线性换算模型：基准值 = 输入值 * factor + offset
 * 反向：输入值 = (基准值 - offset) / factor
 * 绝大多数单位 offset 为 0；温度类单位借助 offset 表达温标平移
 */
export interface UnitDefinition {
  /** 单位唯一标识 */
  id: string;
  /** 中文名称 */
  label: string;
  /** 英文名称 */
  labelEn: string;
  /** 单位符号，如 m、kg、°C */
  symbol: string;
  /** 换算到该分类基准单位的比例系数 */
  factor: number;
  /** 换算到基准单位时的平移量，默认为 0 */
  offset?: number;
}

/**
 * 每个分类的元数据与其单位集合，单位顺序即界面展示顺序，
 * 第一个单位作为该分类的默认源单位
 */
export interface UnitCategoryDefinition {
  /** 分类标识 */
  id: UnitCategoryEnum;
  /** 中文分类名 */
  label: string;
  /** 英文分类名 */
  labelEn: string;
  /** 该分类下的单位列表 */
  units: UnitDefinition[];
}

/**
 * 温度换算常量
 */
const CELSIUS_TO_KELVIN = 273.15;
const FAHRENHEIT_TO_CELSIUS_FACTOR = 5 / 9;
const FAHRENHEIT_OFFSET = -32 * FAHRENHEIT_TO_CELSIUS_FACTOR;

/**
 * 全部分类与单位定义，基准单位统一取 SI 基准（米、千克、摄氏度、平方米、
 * 立方米、米每秒、字节、秒、帕斯卡、弧度、焦耳）
 */
export const UNIT_CATEGORIES: UnitCategoryDefinition[] = [
  {
    id: UnitCategoryEnum.Length,
    label: '长度',
    labelEn: 'Length',
    units: [
      { id: 'mm', label: '毫米', labelEn: 'Millimeter', symbol: 'mm', factor: 0.001 },
      { id: 'cm', label: '厘米', labelEn: 'Centimeter', symbol: 'cm', factor: 0.01 },
      { id: 'm', label: '米', labelEn: 'Meter', symbol: 'm', factor: 1 },
      { id: 'km', label: '千米', labelEn: 'Kilometer', symbol: 'km', factor: 1000 },
      { id: 'in', label: '英寸', labelEn: 'Inch', symbol: 'in', factor: 0.0254 },
      { id: 'ft', label: '英尺', labelEn: 'Foot', symbol: 'ft', factor: 0.3048 },
      { id: 'yd', label: '码', labelEn: 'Yard', symbol: 'yd', factor: 0.9144 },
      { id: 'mi', label: '英里', labelEn: 'Mile', symbol: 'mi', factor: 1609.344 },
      { id: 'nmi', label: '海里', labelEn: 'Nautical mile', symbol: 'nmi', factor: 1852 },
    ],
  },
  {
    id: UnitCategoryEnum.Mass,
    label: '质量',
    labelEn: 'Mass',
    units: [
      { id: 'mg', label: '毫克', labelEn: 'Milligram', symbol: 'mg', factor: 0.000001 },
      { id: 'g', label: '克', labelEn: 'Gram', symbol: 'g', factor: 0.001 },
      { id: 'kg', label: '千克', labelEn: 'Kilogram', symbol: 'kg', factor: 1 },
      { id: 't', label: '吨', labelEn: 'Tonne', symbol: 't', factor: 1000 },
      { id: 'oz', label: '盎司', labelEn: 'Ounce', symbol: 'oz', factor: 0.028349523125 },
      { id: 'lb', label: '磅', labelEn: 'Pound', symbol: 'lb', factor: 0.45359237 },
      { id: 'st', label: '英石', labelEn: 'Stone', symbol: 'st', factor: 6.35029318 },
    ],
  },
  {
    id: UnitCategoryEnum.Temperature,
    label: '温度',
    labelEn: 'Temperature',
    units: [
      { id: 'c', label: '摄氏度', labelEn: 'Celsius', symbol: '°C', factor: 1, offset: 0 },
      {
        id: 'f',
        label: '华氏度',
        labelEn: 'Fahrenheit',
        symbol: '°F',
        factor: FAHRENHEIT_TO_CELSIUS_FACTOR,
        offset: FAHRENHEIT_OFFSET,
      },
      {
        id: 'k',
        label: '开尔文',
        labelEn: 'Kelvin',
        symbol: 'K',
        factor: 1,
        offset: -CELSIUS_TO_KELVIN,
      },
    ],
  },
  {
    id: UnitCategoryEnum.Area,
    label: '面积',
    labelEn: 'Area',
    units: [
      { id: 'mm2', label: '平方毫米', labelEn: 'Square millimeter', symbol: 'mm²', factor: 0.000001 },
      { id: 'cm2', label: '平方厘米', labelEn: 'Square centimeter', symbol: 'cm²', factor: 0.0001 },
      { id: 'm2', label: '平方米', labelEn: 'Square meter', symbol: 'm²', factor: 1 },
      { id: 'ha', label: '公顷', labelEn: 'Hectare', symbol: 'ha', factor: 10000 },
      { id: 'km2', label: '平方千米', labelEn: 'Square kilometer', symbol: 'km²', factor: 1000000 },
      { id: 'in2', label: '平方英寸', labelEn: 'Square inch', symbol: 'in²', factor: 0.00064516 },
      { id: 'ft2', label: '平方英尺', labelEn: 'Square foot', symbol: 'ft²', factor: 0.09290304 },
      { id: 'ac', label: '英亩', labelEn: 'Acre', symbol: 'ac', factor: 4046.8564224 },
    ],
  },
  {
    id: UnitCategoryEnum.Volume,
    label: '体积',
    labelEn: 'Volume',
    units: [
      { id: 'ml', label: '毫升', labelEn: 'Milliliter', symbol: 'mL', factor: 0.000001 },
      { id: 'l', label: '升', labelEn: 'Liter', symbol: 'L', factor: 0.001 },
      { id: 'm3', label: '立方米', labelEn: 'Cubic meter', symbol: 'm³', factor: 1 },
      { id: 'tsp', label: '茶匙（美制）', labelEn: 'Teaspoon (US)', symbol: 'tsp', factor: 0.00000492892159375 },
      { id: 'tbsp', label: '汤匙（美制）', labelEn: 'Tablespoon (US)', symbol: 'tbsp', factor: 0.00001478676478125 },
      { id: 'floz', label: '液量盎司（美制）', labelEn: 'Fluid ounce (US)', symbol: 'fl oz', factor: 0.0000295735295625 },
      { id: 'cup', label: '杯（美制）', labelEn: 'Cup (US)', symbol: 'cup', factor: 0.0002365882365 },
      { id: 'pt', label: '品脱（美制）', labelEn: 'Pint (US)', symbol: 'pt', factor: 0.000473176473 },
      { id: 'gal', label: '加仑（美制）', labelEn: 'Gallon (US)', symbol: 'gal', factor: 0.003785411784 },
    ],
  },
  {
    id: UnitCategoryEnum.Speed,
    label: '速度',
    labelEn: 'Speed',
    units: [
      { id: 'mps', label: '米每秒', labelEn: 'Meter per second', symbol: 'm/s', factor: 1 },
      { id: 'kmh', label: '千米每小时', labelEn: 'Kilometer per hour', symbol: 'km/h', factor: 1 / 3.6 },
      { id: 'mph', label: '英里每小时', labelEn: 'Mile per hour', symbol: 'mph', factor: 0.44704 },
      { id: 'kn', label: '节', labelEn: 'Knot', symbol: 'kn', factor: 0.5144444444444444 },
      { id: 'fps', label: '英尺每秒', labelEn: 'Foot per second', symbol: 'ft/s', factor: 0.3048 },
    ],
  },
  {
    id: UnitCategoryEnum.DataStorage,
    label: '数据存储',
    labelEn: 'Data Storage',
    units: [
      { id: 'bit', label: '比特', labelEn: 'Bit', symbol: 'bit', factor: 0.125 },
      { id: 'B', label: '字节', labelEn: 'Byte', symbol: 'B', factor: 1 },
      { id: 'KB', label: '千字节', labelEn: 'Kilobyte', symbol: 'KB', factor: 1000 },
      { id: 'MB', label: '兆字节', labelEn: 'Megabyte', symbol: 'MB', factor: 1000 ** 2 },
      { id: 'GB', label: '吉字节', labelEn: 'Gigabyte', symbol: 'GB', factor: 1000 ** 3 },
      { id: 'TB', label: '太字节', labelEn: 'Terabyte', symbol: 'TB', factor: 1000 ** 4 },
      { id: 'KiB', label: '二进制千字节', labelEn: 'Kibibyte', symbol: 'KiB', factor: 1024 },
      { id: 'MiB', label: '二进制兆字节', labelEn: 'Mebibyte', symbol: 'MiB', factor: 1024 ** 2 },
      { id: 'GiB', label: '二进制吉字节', labelEn: 'Gibibyte', symbol: 'GiB', factor: 1024 ** 3 },
      { id: 'TiB', label: '二进制太字节', labelEn: 'Tebibyte', symbol: 'TiB', factor: 1024 ** 4 },
    ],
  },
  {
    id: UnitCategoryEnum.Time,
    label: '时间',
    labelEn: 'Time',
    units: [
      { id: 'ms', label: '毫秒', labelEn: 'Millisecond', symbol: 'ms', factor: 0.001 },
      { id: 's', label: '秒', labelEn: 'Second', symbol: 's', factor: 1 },
      { id: 'min', label: '分钟', labelEn: 'Minute', symbol: 'min', factor: 60 },
      { id: 'h', label: '小时', labelEn: 'Hour', symbol: 'h', factor: 3600 },
      { id: 'd', label: '天', labelEn: 'Day', symbol: 'd', factor: 86400 },
      { id: 'wk', label: '周', labelEn: 'Week', symbol: 'wk', factor: 604800 },
      { id: 'mo', label: '月（30 天）', labelEn: 'Month (30 days)', symbol: 'mo', factor: 2592000 },
      { id: 'yr', label: '年（365 天）', labelEn: 'Year (365 days)', symbol: 'yr', factor: 31536000 },
    ],
  },
  {
    id: UnitCategoryEnum.Pressure,
    label: '压强',
    labelEn: 'Pressure',
    units: [
      { id: 'pa', label: '帕斯卡', labelEn: 'Pascal', symbol: 'Pa', factor: 1 },
      { id: 'kpa', label: '千帕', labelEn: 'Kilopascal', symbol: 'kPa', factor: 1000 },
      { id: 'mpa', label: '兆帕', labelEn: 'Megapascal', symbol: 'MPa', factor: 1000000 },
      { id: 'bar', label: '巴', labelEn: 'Bar', symbol: 'bar', factor: 100000 },
      { id: 'atm', label: '标准大气压', labelEn: 'Atmosphere', symbol: 'atm', factor: 101325 },
      { id: 'psi', label: '磅力每平方英寸', labelEn: 'PSI', symbol: 'psi', factor: 6894.757293168 },
      { id: 'mmhg', label: '毫米汞柱', labelEn: 'Millimeter of mercury', symbol: 'mmHg', factor: 133.322387415 },
    ],
  },
  {
    id: UnitCategoryEnum.Angle,
    label: '角度',
    labelEn: 'Angle',
    units: [
      { id: 'deg', label: '度', labelEn: 'Degree', symbol: '°', factor: Math.PI / 180 },
      { id: 'rad', label: '弧度', labelEn: 'Radian', symbol: 'rad', factor: 1 },
      { id: 'grad', label: '梯度', labelEn: 'Gradian', symbol: 'grad', factor: Math.PI / 200 },
      { id: 'turn', label: '圈', labelEn: 'Turn', symbol: 'turn', factor: 2 * Math.PI },
    ],
  },
  {
    id: UnitCategoryEnum.Energy,
    label: '能量',
    labelEn: 'Energy',
    units: [
      { id: 'j', label: '焦耳', labelEn: 'Joule', symbol: 'J', factor: 1 },
      { id: 'kj', label: '千焦', labelEn: 'Kilojoule', symbol: 'kJ', factor: 1000 },
      { id: 'cal', label: '卡路里', labelEn: 'Calorie', symbol: 'cal', factor: 4.184 },
      { id: 'kcal', label: '千卡', labelEn: 'Kilocalorie', symbol: 'kcal', factor: 4184 },
      { id: 'wh', label: '瓦时', labelEn: 'Watt-hour', symbol: 'Wh', factor: 3600 },
      { id: 'kwh', label: '千瓦时', labelEn: 'Kilowatt-hour', symbol: 'kWh', factor: 3600000 },
      { id: 'btu', label: '英热单位', labelEn: 'British thermal unit', symbol: 'BTU', factor: 1055.05585262 },
    ],
  },
];

/**
 * 结果数值的默认最大有效位数，用于去除浮点尾差
 */
export const DEFAULT_PRECISION = 10;

/**
 * 输入框允许的数值上下限，防止极端输入导致 Infinity
 */
export const MAX_ABS_INPUT = 1e15;
