import { describe, expect, it } from 'vitest';
import {
  filterKeyReference,
  formatKeyCombo,
  getLocationName,
  KEY_LOCATION,
  KEY_REFERENCE,
  snapshotKeyEvent,
} from './keyboard';

describe('KEY_REFERENCE lookup table', () => {
  it('covers letters A-Z with keyCode 65-90', () => {
    const letters = KEY_REFERENCE.filter((row) => row.group === '字母');
    expect(letters).toHaveLength(26);
    expect(letters[0]).toMatchObject({ label: 'A', keyCode: 65, code: 'KeyA' });
    expect(letters[25]).toMatchObject({ label: 'Z', keyCode: 90, code: 'KeyZ' });
  });

  it('covers digits 0-9 with keyCode 48-57', () => {
    const digits = KEY_REFERENCE.filter((row) => row.group === '数字');
    expect(digits).toHaveLength(10);
    expect(digits[0]).toMatchObject({ label: '0', keyCode: 48, code: 'Digit0' });
    expect(digits[9]).toMatchObject({ label: '9', keyCode: 57, code: 'Digit9' });
  });

  it('covers F1-F12 with keyCode 112-123', () => {
    const functions = KEY_REFERENCE.filter((row) => row.group === '功能键');
    expect(functions).toHaveLength(12);
    expect(functions[0]).toMatchObject({ label: 'F1', keyCode: 112 });
    expect(functions[11]).toMatchObject({ label: 'F12', keyCode: 123 });
  });

  it('covers common control keys and arrows', () => {
    const byCode = new Map(KEY_REFERENCE.map((row) => [row.code, row]));
    expect(byCode.get('Enter')?.keyCode).toBe(13);
    expect(byCode.get('Escape')?.keyCode).toBe(27);
    expect(byCode.get('Space')?.keyCode).toBe(32);
    expect(byCode.get('Tab')?.keyCode).toBe(9);
    expect(byCode.get('Backspace')?.keyCode).toBe(8);
    expect(byCode.get('Delete')?.keyCode).toBe(46);
    const arrows = KEY_REFERENCE.filter((row) => row.group === '方向键');
    expect(arrows.map((row) => row.keyCode)).toEqual([37, 38, 39, 40]);
  });
});

describe('getLocationName', () => {
  it('maps standard location codes', () => {
    expect(getLocationName(KEY_LOCATION.STANDARD)).toBe('标准');
    expect(getLocationName(KEY_LOCATION.LEFT)).toBe('左侧');
    expect(getLocationName(KEY_LOCATION.RIGHT)).toBe('右侧');
    expect(getLocationName(KEY_LOCATION.NUMPAD)).toBe('数字小键盘');
    expect(getLocationName(99)).toBe('未知(99)');
  });
});

describe('formatKeyCombo', () => {
  it('orders modifiers as Ctrl, Alt, Shift, Meta then key', () => {
    expect(
      formatKeyCombo({ key: 'a', ctrlKey: true, shiftKey: true, metaKey: true, altKey: true }),
    ).toBe('Ctrl+Alt+Shift+Meta+a');
  });

  it('renders plain keys without modifiers', () => {
    expect(formatKeyCombo({ key: 'Enter' })).toBe('Enter');
  });

  it('renders space as Space and omits bare modifier presses', () => {
    expect(formatKeyCombo({ key: ' ' })).toBe('Space');
    expect(formatKeyCombo({ key: 'Control', ctrlKey: true })).toBe('Ctrl');
    expect(formatKeyCombo({ key: 'Shift' })).toBe('');
  });
});

describe('filterKeyReference', () => {
  it('returns all rows for empty query', () => {
    expect(filterKeyReference('')).toHaveLength(KEY_REFERENCE.length);
    expect(filterKeyReference('   ')).toHaveLength(KEY_REFERENCE.length);
  });

  it('matches label, code and keyCode case-insensitively', () => {
    expect(filterKeyReference('enter').map((row) => row.label)).toEqual(['Enter']);
    expect(filterKeyReference('keyq')).toHaveLength(1);
    expect(filterKeyReference('27').map((row) => row.code)).toEqual(['Escape']);
    expect(filterKeyReference('f5').map((row) => row.keyCode)).toEqual([116]);
  });
});

describe('snapshotKeyEvent', () => {
  it('extracts a serializable snapshot with combo', () => {
    const event = {
      key: 'A',
      code: 'KeyA',
      keyCode: 65,
      which: 65,
      location: KEY_LOCATION.RIGHT,
      ctrlKey: true,
      altKey: false,
      shiftKey: true,
      metaKey: false,
      repeat: false,
    };
    const snapshot = snapshotKeyEvent(event, 1234);
    expect(snapshot).toMatchObject({
      key: 'A',
      code: 'KeyA',
      keyCode: 65,
      which: 65,
      location: KEY_LOCATION.RIGHT,
      ctrlKey: true,
      shiftKey: true,
      altKey: false,
      metaKey: false,
      repeat: false,
      combo: 'Ctrl+Shift+A',
      time: 1234,
    });
  });
});
