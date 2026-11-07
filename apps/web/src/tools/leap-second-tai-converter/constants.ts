export type ConvertDirection = "fromUnix" | "fromTai";

export interface DirectionOption {
  value: ConvertDirection;
  label: string;
  hint: string;
}

export const DIRECTION_OPTIONS: DirectionOption[] = [
  {
    value: "fromUnix",
    label: "Unix → TAI",
    hint: "输入 Unix（UTC）秒级时间戳，换算 TAI 与 TAI−UTC 偏移",
  },
  {
    value: "fromTai",
    label: "TAI → Unix",
    hint: "输入 TAI 秒级时间戳，反算 Unix（UTC）与 UTC 时间",
  },
];

export const DEFAULT_INPUT = "1483228800";
