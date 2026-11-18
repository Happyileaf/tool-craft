/**
 * 跨平台深链关联文件生成器的静态选项与部署清单
 */

/** 平台 Tab 定义 */
export const PLATFORM_TABS = [
  { key: 'ios', label: 'iOS · apple-app-site-association' },
  { key: 'android', label: 'Android · assetlinks.json' },
  { key: 'deploy', label: '部署检查清单' },
] as const;

export type PlatformTabKey = (typeof PLATFORM_TABS)[number]['key'];

/** 双文件部署与运维检查项 */
export const DEPLOY_CHECKLIST: ReadonlyArray<{ title: string; detail: string }> = [
  {
    title: 'iOS 发布路径',
    detail: 'https://<你的域名>/.well-known/apple-app-site-association（旧版也接受站点根目录，推荐 .well-known）',
  },
  {
    title: 'Android 发布路径',
    detail: 'https://<你的域名>/.well-known/assetlinks.json',
  },
  {
    title: 'Content-Type',
    detail: '两份文件均须以 application/json 返回（AASA 历史上也接受 application/pkcs7-mime，但现代规范统一为 JSON）',
  },
  {
    title: 'HTTPS 与重定向',
    detail: '必须通过有效证书的 HTTPS 访问，返回 200 且不得有任何重定向；CDN 需保证回源状态码与类型一致',
  },
  {
    title: '文件体积',
    detail: 'AASA 建议不超过 128KB；未签名 JSON 即可（iOS 9+ 不再要求对文件签名）',
  },
  {
    title: 'Android 指纹获取',
    detail: 'keytool -list -v -keystore <release.keystore> -alias <alias>，复制输出中的 SHA256 指纹（32 组冒号分隔）',
  },
  {
    title: '关联域名声明',
    detail: 'iOS 在 Xcode 的 Associated Domains 中添加 applinks:<域名>；Android 在 AndroidManifest.xml 的 intent-filter 中设置 autoVerify="true"',
  },
  {
    title: '在线验证',
    detail: 'iOS 可用 AASA Validator、Android 可用 Google 的 Digital Asset Links 验证工具确认抓取成功',
  },
];
