import { Base } from '../constants';

const digits = '0123456789ABCDEF';

export function convertBase(input: string, fromBase: Base, toBase: Base): { success: boolean; result: string; error?: string } {
  input = input.trim().toUpperCase();

  if (!input) {
    return { success: false, result: '', error: 'Please enter a number' };
  }

  // Validate input against base
  for (const char of input) {
    const index = digits.indexOf(char);
    if (index === -1 || index >= fromBase) {
      return {
        success: false,
        result: '',
        error: `Invalid character "${char}" for base ${fromBase}`,
      };
    }
  }

  try {
    // Convert to decimal first
    const decimal = parseInt(input, fromBase);
    if (isNaN(decimal)) {
      return { success: false, result: '', error: 'Invalid number' };
    }

    // Convert from decimal to target base
    if (decimal === 0) {
      return { success: true, result: '0' };
    }

    let n = Math.abs(decimal);
    let result = '';

    while (n > 0) {
      result = digits[n % toBase] + result;
      n = Math.floor(n / toBase);
    }

    // Handle negative numbers
    if (decimal < 0) {
      result = '-' + result;
    }

    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      result: '',
      error: error instanceof Error ? error.message : 'Conversion failed',
    };
  }
}
