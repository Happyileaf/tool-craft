/**
 * 单位分类定义
 */
export type UnitCategory = 'length' | 'area' | 'volume' | 'weight' | 'temperature' | 'time' | 'speed';

/**
 * 单个单位定义
 */
export interface Unit {
  key: string;
  label: string;
  labelEn: string;
  /** 转换到基准单位的系数 */
  factor: number;
}

/**
 * 单位分类定义
 */
export interface UnitCategoryDef {
  key: UnitCategory;
  label: string;
  labelEn: string;
  units: Unit[];
}

/**
 * 所有单位分类和单位定义
 */
export const UNIT_CATEGORIES: UnitCategoryDef[] = [
  {
    key: 'length',
    label: '长度',
    labelEn: 'Length',
    units: [
      { key: 'km', label: '千米 (km)', labelEn: 'Kilometer (km)', factor: 1000 },
      { key: 'm', label: '米 (m)', labelEn: 'Meter (m)', factor: 1 },
      { key: 'cm', label: '厘米 (cm)', labelEn: 'Centimeter (cm)', factor: 0.01 },
      { key: 'mm', label: '毫米 (mm)', labelEn: 'Millimeter (mm)', factor: 0.001 },
      { key: 'mi', label: '英里 (mi)', labelEn: 'Mile (mi)', factor: 1609.34 },
      { key: 'yd', label: '码 (yd)', labelEn: 'Yard (yd)', factor: 0.9144 },
      { key: 'ft', label: '英尺 (ft)', labelEn: 'Foot (ft)', factor: 0.3048 },
      { key: 'in', label: '英寸 (in)', labelEn: 'Inch (in)', factor: 0.0254 },
      { key: 'nmi', label: '海里 (nmi)', labelEn: 'Nautical Mile (nmi)', factor: 1852 },
    ],
  },
  {
    key: 'area',
    label: '面积',
    labelEn: 'Area',
    units: [
      { key: 'km2', label: '平方千米 (km²)', labelEn: 'Square Kilometer (km²)', factor: 1000000 },
      { key: 'm2', label: '平方米 (m²)', labelEn: 'Square Meter (m²)', factor: 1 },
      { key: 'cm2', label: '平方厘米 (cm²)', labelEn: 'Square Centimeter (cm²)', factor: 0.0001 },
      { key: 'ha', label: '公顷 (ha)', labelEn: 'Hectare (ha)', factor: 10000 },
      { key: 'acre', label: '英亩 (acre)', labelEn: 'Acre (acre)', factor: 4046.86 },
      { key: 'mi2', label: '平方英里 (mi²)', labelEn: 'Square Mile (mi²)', factor: 2589988.11 },
      { key: 'yd2', label: '平方码 (yd²)', labelEn: 'Square Yard (yd²)', factor: 0.836127 },
      { key: 'ft2', label: '平方英尺 (ft²)', labelEn: 'Square Foot (ft²)', factor: 0.092903 },
      { key: 'in2', label: '平方英寸 (in²)', labelEn: 'Square Inch (in²)', factor: 0.00064516 },
    ],
  },
  {
    key: 'volume',
    label: '体积',
    labelEn: 'Volume',
    units: [
      { key: 'm3', label: '立方米 (m³)', labelEn: 'Cubic Meter (m³)', factor: 1 },
      { key: 'l', label: '升 (L)', labelEn: 'Liter (L)', factor: 0.001 },
      { key: 'ml', label: '毫升 (mL)', labelEn: 'Milliliter (mL)', factor: 0.000001 },
      { key: 'gal-us', label: '美制加仑 (gal)', labelEn: 'US Gallon (gal)', factor: 0.00378541 },
      { key: 'gal-uk', label: '英制加仑 (gal)', labelEn: 'UK Gallon (gal)', factor: 0.00454609 },
      { key: 'qt-us', label: '美制夸脱 (qt)', labelEn: 'US Quart (qt)', factor: 0.000946353 },
      { key: 'pt-us', label: '美制品脱 (pt)', labelEn: 'US Pint (pt)', factor: 0.000473176 },
      { key: 'cup', label: '杯 (cup)', labelEn: 'Cup', factor: 0.000236588 },
      { key: 'floz-us', label: '美制液量盎司 (fl oz)', labelEn: 'US Fluid Ounce (fl oz)', factor: 0.0000295735 },
      { key: 'floz-uk', label: '英制液量盎司 (fl oz)', labelEn: 'UK Fluid Ounce (fl oz)', factor: 0.0000284131 },
      { key: 'ft3', label: '立方英尺 (ft³)', labelEn: 'Cubic Foot (ft³)', factor: 0.0283168 },
      { key: 'in3', label: '立方英寸 (in³)', labelEn: 'Cubic Inch (in³)', factor: 0.0000163871 },
    ],
  },
  {
    key: 'weight',
    label: '重量',
    labelEn: 'Weight',
    units: [
      { key: 't', label: '吨 (t)', labelEn: 'Metric Ton (t)', factor: 1000 },
      { key: 'kg', label: '千克 (kg)', labelEn: 'Kilogram (kg)', factor: 1 },
      { key: 'g', label: '克 (g)', labelEn: 'Gram (g)', factor: 0.001 },
      { key: 'mg', label: '毫克 (mg)', labelEn: 'Milligram (mg)', factor: 0.000001 },
      { key: 'lb', label: '磅 (lb)', labelEn: 'Pound (lb)', factor: 0.453592 },
      { key: 'oz', label: '盎司 (oz)', labelEn: 'Ounce (oz)', factor: 0.0283495 },
      { key: 'st', label: '英石 (st)', labelEn: 'Stone (st)', factor: 6.35029 },
    ],
  },
  {
    key: 'temperature',
    label: '温度',
    labelEn: 'Temperature',
    units: [
      { key: 'c', label: '摄氏度 (°C)', labelEn: 'Celsius (°C)', factor: 1 },
      { key: 'f', label: '华氏度 (°F)', labelEn: 'Fahrenheit (°F)', factor: 1 },
      { key: 'k', label: '开尔文 (K)', labelEn: 'Kelvin (K)', factor: 1 },
    ],
  },
  {
    key: 'time',
    label: '时间',
    labelEn: 'Time',
    units: [
      { key: 'year', label: '年', labelEn: 'Year', factor: 31536000 },
      { key: 'month', label: '月 (平均)', labelEn: 'Month (avg)', factor: 2628000 },
      { key: 'week', label: '周', labelEn: 'Week', factor: 604800 },
      { key: 'day', label: '天', labelEn: 'Day', factor: 86400 },
      { key: 'hour', label: '小时', labelEn: 'Hour', factor: 3600 },
      { key: 'minute', label: '分钟', labelEn: 'Minute', factor: 60 },
      { key: 'second', label: '秒', labelEn: 'Second', factor: 1 },
      { key: 'ms', label: '毫秒', labelEn: 'Millisecond', factor: 0.001 },
    ],
  },
  {
    key: 'speed',
    label: '速度',
    labelEn: 'Speed',
    units: [
      { key: 'mps', label: '米/秒 (m/s)', labelEn: 'Meters per Second (m/s)', factor: 1 },
      { key: 'kph', label: '千米/小时 (km/h)', labelEn: 'Kilometers per Hour (km/h)', factor: 0.277778 },
      { key: 'fps', label: '英尺/秒 (ft/s)', labelEn: 'Feet per Second (ft/s)', factor: 0.3048 },
      { key: 'mph', label: '英里/小时 (mph)', labelEn: 'Miles per Hour (mph)', factor: 0.44704 },
      { key: 'knot', label: '节 (kn)', labelEn: 'Knot (kn)', factor: 0.514444 },
    ],
  },
];

export const DEFAULT_INPUT_VALUE = 1;
export const DEFAULT_CATEGORY: UnitCategory = 'length';
