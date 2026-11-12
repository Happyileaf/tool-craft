export const DEFAULT_HEADERS = `HTTP/1.1 200 OK
Cache-Control: public, max-age=60, stale-while-revalidate=30
Date: Wed, 12 Nov 2026 00:00:00 GMT
Age: 10
ETag: "v1"
Expires: Wed, 12 Nov 2026 00:01:00 GMT`;

export const EXAMPLE_PRESETS: Array<{ label: string; headers: string }> = [
  {
    label: '带 max-age 的 CDN 响应',
    headers:
      'Cache-Control: public, max-age=60\nDate: Wed, 12 Nov 2026 00:00:00 GMT\nAge: 10',
  },
  {
    label: 's-maxage 共享缓存',
    headers:
      'Cache-Control: public, s-maxage=120, max-age=60\nDate: Wed, 12 Nov 2026 00:00:00 GMT',
  },
  {
    label: 'no-store 禁止缓存',
    headers:
      'Cache-Control: no-store, max-age=9999\nDate: Wed, 12 Nov 2026 00:00:00 GMT',
  },
  {
    label: '仅 Expires 的旧式响应',
    headers:
      'Date: Wed, 12 Nov 2026 00:00:00 GMT\nExpires: Wed, 12 Nov 2026 00:01:30 GMT',
  },
];
