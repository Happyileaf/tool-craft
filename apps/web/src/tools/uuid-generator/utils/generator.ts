// UUID v4 generator based on crypto.getRandomValues
export function generateUuid(): string {
  // Use modern crypto API to generate random values
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  
  // Set version (4) and variant (RFC4122)
  array[6] = (array[6] & 0x0f) | 0x40;
  array[8] = (array[8] & 0x3f) | 0x80;
  
  // Convert to hex string
  const hex = Array.from(array, byte => 
    byte.toString(16).padStart(2, '0')
  ).join('');
  
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
