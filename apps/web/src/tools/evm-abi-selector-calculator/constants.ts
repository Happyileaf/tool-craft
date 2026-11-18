/** EVM ABI 选择器计算器的固定文案与默认值 */

export const DEFAULT_SIGNATURE = 'transfer(address,uint256)';

export const DEFAULT_EVENT_SIGNATURE = 'Transfer(address,address,uint256)';

export const DEFAULT_ABI_JSON = `[
  {
    "type": "event",
    "name": "Transfer",
    "inputs": [
      { "name": "from", "type": "address", "indexed": true },
      { "name": "to", "type": "address", "indexed": true },
      { "name": "value", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "function",
    "name": "transfer",
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "value", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{ "name": "owner", "type": "address" }],
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "constructor",
    "inputs": [{ "name": "initialSupply", "type": "uint256" }]
  }
]`;

/** selector 为 keccak-256 摘要前 4 字节 */
export const SELECTOR_BYTE_LENGTH = 4;

/** Topic0 为完整 32 字节摘要 */
export const TOPIC0_BYTE_LENGTH = 32;

export type SignatureKind = 'function' | 'event' | 'error';

export const SIGNATURE_KIND_OPTIONS: { value: SignatureKind; label: string; hint: string }[] = [
  { value: 'function', label: 'function', hint: '取前 4 字节 selector' },
  { value: 'event', label: 'event', hint: '取完整 32 字节 Topic0' },
  { value: 'error', label: 'error', hint: '自定义 error，同函数规则取前 4 字节' },
];
