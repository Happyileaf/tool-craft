import type { LuhnMode } from "./utils/luhn";

export interface ModeOption {
  value: LuhnMode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  {
    value: "generate",
    label: "生成校验位",
    hint: "为每行数字串追加一位 Luhn 校验位",
  },
  {
    value: "validate",
    label: "校验合法性",
    hint: "末位视为校验位，校验整串是否合法并纠错",
  },
];

export const DEFAULT_INPUT = "7992739871\n411111111111111\n35693803564380";
