import { describe, it, expect } from 'vitest';
import { convertBase } from './converter';
import { Base } from '../constants';

describe('convertBase', () => {
  it('should convert decimal 42 to binary', () => {
    const result = convertBase('42', Base.DECIMAL, Base.BINARY);
    expect(result.success).toBe(true);
    expect(result.result).toBe('101010');
  });

  it('should convert binary 101010 to decimal', () => {
    const result = convertBase('101010', Base.BINARY, Base.DECIMAL);
    expect(result.success).toBe(true);
    expect(result.result).toBe('42');
  });

  it('should convert decimal 255 to hex', () => {
    const result = convertBase('255', Base.DECIMAL, Base.HEXADECIMAL);
    expect(result.success).toBe(true);
    expect(result.result).toBe('FF');
  });

  it('should convert hex FF to decimal', () => {
    const result = convertBase('FF', Base.HEXADECIMAL, Base.DECIMAL);
    expect(result.success).toBe(true);
    expect(result.result).toBe('255');
  });

  it('should handle negative numbers', () => {
    const result = convertBase('-42', Base.DECIMAL, Base.BINARY);
    expect(result.success).toBe(true);
    expect(result.result).toBe('-101010');
  });

  it('should return error for invalid character', () => {
    const result = convertBase('102', Base.BINARY, Base.DECIMAL);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should convert 0 correctly', () => {
    const result = convertBase('0', Base.DECIMAL, Base.BINARY);
    expect(result.success).toBe(true);
    expect(result.result).toBe('0');
  });
});
