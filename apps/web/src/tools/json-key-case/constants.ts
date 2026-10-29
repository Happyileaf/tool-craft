import type { CaseStyle } from './utils/key-case';

/** 目标命名风格选项 */
export const STYLE_OPTIONS: { label: string; value: CaseStyle }[] = [
  { label: 'camelCase（userName）', value: 'camel' },
  { label: 'PascalCase（UserName）', value: 'pascal' },
  { label: 'snake_case（user_name）', value: 'snake' },
  { label: 'SCREAMING_SNAKE_CASE（USER_NAME）', value: 'screamingSnake' },
  { label: 'kebab-case（user-name）', value: 'kebab' },
];

/** 默认示例（典型后端 snake_case 文档） */
export const DEFAULT_DOCUMENT = `{
  "user_id": 1024,
  "user_name": "ada_lovelace",
  "is_active": true,
  "profile_info": {
    "first_name": "Ada",
    "last_name": "Lovelace",
    "contact_list": [
      { "phone_number": "+44-000-0000" }
    ]
  },
  "created_at": "2026-10-29T18:00:00Z"
}`;
