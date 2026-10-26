import { DISCORD_EPOCH, SNOWFLAKE_PRESETS } from './utils/snowflake';

export const DEFAULT_SNOWFLAKE_ID = '175928847299117063';

export const DEFAULT_EPOCH_KEY = 'discord';

export const EPOCH_OPTIONS = [
  ...SNOWFLAKE_PRESETS.map((preset) => ({
    label: preset.label,
    value: preset.key,
  })),
  { label: '自定义纪元', value: 'custom' },
];

export { DISCORD_EPOCH };
