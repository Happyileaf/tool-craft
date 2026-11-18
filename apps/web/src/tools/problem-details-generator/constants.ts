/** 一键填充的 RFC 7807 附录示例（余额不足） */
export const EXAMPLE_PROBLEM = {
  type: 'https://example.com/probs/out-of-credit',
  title: 'You do not have enough credit.',
  status: 403,
  detail: 'Your current balance is 30, but that costs 50.',
  instance: '/account/1234/msgs/abc',
};

/** 解析页占位示例 */
export const PARSE_PLACEHOLDER = `{
  "type": "https://example.com/probs/out-of-credit",
  "title": "You do not have enough credit.",
  "status": 403,
  "detail": "Your current balance is 30, but that costs 50.",
  "instance": "/account/1234/msgs/abc",
  "balance": 30,
  "accounts": ["/account/1234", "/account/67890"]
}`;
