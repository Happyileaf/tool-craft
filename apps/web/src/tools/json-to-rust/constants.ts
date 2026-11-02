/**
 * JSON → Rust struct 生成器常量
 */

export const DEFAULT_ROOT_NAME = 'Root';

export const SAMPLE_JSON = JSON.stringify(
  {
    user_id: 1024,
    user_name: 'ada_lovelace',
    is_active: true,
    score: 98.5,
    nickname: null,
    role: { id: 3, name: 'admin' },
    posts: [
      { id: 1, title: 'Hello Rust', tags: ['serde', 'json'] },
      { id: 2, title: 'Borrow Checker', tags: ['lifetime'] },
    ],
  },
  null,
  2,
);
