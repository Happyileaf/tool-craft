import { describe, expect, it } from 'vitest';
import {
  convertJsonKeys,
  convertKey,
  splitWords,
  type ConvertSuccess,
  type JsonValue,
} from './key-case';

function ok(result: ConvertSuccess | { error: string }): ConvertSuccess {
  expect('error' in result).toBe(false);
  return result as ConvertSuccess;
}

describe('splitWords 词元拆分', () => {
  it('拆分常见风格', () => {
    expect(splitWords('user_id')).toEqual(['user', 'id']);
    expect(splitWords('userId')).toEqual(['user', 'id']);
    expect(splitWords('UserId')).toEqual(['user', 'id']);
    expect(splitWords('user-id')).toEqual(['user', 'id']);
    expect(splitWords('USER_ID')).toEqual(['user', 'id']);
    expect(splitWords('UserID')).toEqual(['user', 'id']);
  });

  it('连续大写缩写与后续小写', () => {
    expect(splitWords('HTMLElement')).toEqual(['html', 'element']);
    expect(splitWords('parseURLParser')).toEqual(['parse', 'url', 'parser']);
  });

  it('数字相邻分词', () => {
    expect(splitWords('user2Name')).toEqual(['user', '2', 'name']);
    expect(splitWords('field_1_value')).toEqual(['field', '1', 'value']);
  });

  it('空串与空键', () => {
    expect(splitWords('')).toEqual([]);
    expect(splitWords('___')).toEqual([]);
  });
});

describe('convertKey 五风格拼合', () => {
  it('各目标风格', () => {
    expect(convertKey('user_id', 'camel')).toBe('userId');
    expect(convertKey('user_id', 'pascal')).toBe('UserId');
    expect(convertKey('userId', 'snake')).toBe('user_id');
    expect(convertKey('userId', 'screamingSnake')).toBe('USER_ID');
    expect(convertKey('userId', 'kebab')).toBe('user-id');
    expect(convertKey('HTMLElement', 'snake')).toBe('html_element');
    expect(convertKey('field2Value', 'kebab')).toBe('field-2-value');
  });

  it('空键保持原样', () => {
    expect(convertKey('', 'snake')).toBe('');
  });

  it('五风格循环互转一致', () => {
    const original = 'userProfileV2URL';
    const snake = convertKey(original, 'snake');
    expect(convertKey(snake, 'camel')).toBe('userProfileV2Url');
    expect(convertKey(snake, 'pascal')).toBe('UserProfileV2Url');
    expect(convertKey(snake, 'screamingSnake')).toBe('USER_PROFILE_V_2_URL');
    expect(convertKey(snake, 'kebab')).toBe('user-profile-v-2-url');
  });
});

describe('convertJsonKeys 递归转换', () => {
  it('snake_case → camelCase 嵌套对象与数组', () => {
    const doc: JsonValue = {
      user_id: 1,
      user_info: {
        first_name: 'Ada',
        last_name: 'Lovelace',
        contact_list: [{ phone_number: '123' }],
      },
      is_active: true,
    };
    const { result } = ok(convertJsonKeys(doc, 'camel'));
    expect(result).toEqual({
      userId: 1,
      userInfo: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        contactList: [{ phoneNumber: '123' }],
      },
      isActive: true,
    });
  });

  it('camelCase → SCREAMING_SNAKE_CASE', () => {
    const doc: JsonValue = { apiUrl: 'x', maxRetryCount: 3 };
    const { result } = ok(convertJsonKeys(doc, 'screamingSnake'));
    expect(result).toEqual({ API_URL: 'x', MAX_RETRY_COUNT: 3 });
  });

  it('kebab-case → PascalCase', () => {
    const doc: JsonValue = { 'content-type': 'json', 'x-total-count': 10 };
    const { result } = ok(convertJsonKeys(doc, 'pascal'));
    expect(result).toEqual({ ContentType: 'json', XTotalCount: 10 });
  });

  it('顶层为数组时递归处理元素', () => {
    const doc: JsonValue = [{ item_id: 1 }, { item_id: 2 }];
    const { result } = ok(convertJsonKeys(doc, 'camel'));
    expect(result).toEqual([{ itemId: 1 }, { itemId: 2 }]);
  });

  it('标量与 null 原样保留', () => {
    const doc: JsonValue = {
      str: 'hello_world',
      num: 42,
      bool: false,
      nil: null,
      arr: [1, 'two', null],
    };
    const { result } = ok(convertJsonKeys(doc, 'snake'));
    expect(result).toEqual(doc);
  });

  it('值中的字符串不被修改', () => {
    const doc: JsonValue = {
      query_text: 'SELECT user_id FROM t WHERE camelCase = 1',
    };
    const { result } = ok(convertJsonKeys(doc, 'snake'));
    expect(result).toEqual({
      query_text: 'SELECT user_id FROM t WHERE camelCase = 1',
    });
  });

  it('统计发生变化的键数量', () => {
    const doc: JsonValue = {
      already_snake: 1,
      camelKey: 2,
      nested: { pascalKey: 3, keep_me: 4 },
    };
    const out = ok(convertJsonKeys(doc, 'snake'));
    expect(out.changedKeys).toBe(2);
  });

  it('不修改原始文档（深拷贝隔离）', () => {
    const doc: JsonValue = { outer_key: { inner_key: [1, { deep_key: 2 }] } };
    const snapshot = JSON.parse(JSON.stringify(doc));
    ok(convertJsonKeys(doc, 'camel'));
    expect(doc).toEqual(snapshot);
  });

  it('保持键的插入顺序', () => {
    const doc: JsonValue = { z_key: 1, a_key: 2, m_key: 3 };
    const { result } = ok(convertJsonKeys(doc, 'camel'));
    expect(Object.keys(result as { [key: string]: unknown })).toEqual([
      'zKey',
      'aKey',
      'mKey',
    ]);
  });

  it('空对象与空数组', () => {
    expect(ok(convertJsonKeys({}, 'camel')).result).toEqual({});
    expect(ok(convertJsonKeys([], 'camel')).result).toEqual([]);
  });
});

describe('撞键检测', () => {
  it('同层异名键转换后撞键报错', () => {
    const doc: JsonValue = { user_id: 1, userId: 2 };
    const result = convertJsonKeys(doc, 'camel');
    expect('error' in result).toBe(true);
    expect((result as { error: string }).error).toContain('user_id');
    expect((result as { error: string }).error).toContain('userId');
    expect((result as { error: string }).error).toContain('userId"');
  });

  it('snake 风格下缩写键撞键', () => {
    const doc: JsonValue = { UserID: 1, user_id: 2 };
    const result = convertJsonKeys(doc, 'snake');
    expect('error' in result).toBe(true);
    expect((result as { error: string }).error).toContain('user_id');
  });

  it('错误信息包含冲突路径', () => {
    const doc: JsonValue = {
      outer: { inner_a: 1, innerA: 2 },
    };
    const result = convertJsonKeys(doc, 'camel');
    expect((result as { error: string }).error).toContain('/outer');
  });

  it('数组元素的撞键路径带索引', () => {
    const doc: JsonValue = { list: [{ item_id: 1, itemId: 2 }] };
    const result = convertJsonKeys(doc, 'camel');
    expect((result as { error: string }).error).toContain('/list[0]');
  });

  it('转换后不撞键的同义风格正常通过', () => {
    const doc: JsonValue = { user_id: 1, order_id: 2 };
    const out = ok(convertJsonKeys(doc, 'snake'));
    expect(out.result).toEqual({ user_id: 1, order_id: 2 });
    expect(out.changedKeys).toBe(0);
  });
});
