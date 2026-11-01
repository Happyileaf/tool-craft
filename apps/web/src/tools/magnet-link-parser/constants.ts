/**
 * Magnet 磁力链接解析与生成器内常量
 */

/** 顶部提示文案 */
export const HINT =
  '解析或拼装 magnet:? 链接（BEP 9 / BEP 12）：识别 urn:btih: 40 位 v1 info hash、显示名 dn、可重复的 tracker tr、文件大小 xl、Web 种子 ws、关键词 kt 与来源 as；百分号编码自动解码 / 编码，全部在浏览器本地完成。';

/** 解析方向默认示例（Ubuntu 示例资源） */
export const DEFAULT_MAGNET =
  'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10' +
  '&dn=Ubuntu%2024.04%20LTS%20Desktop%20AMD64' +
  '&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce' +
  '&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A6969%2Fannounce' +
  '&xl=5845458944' +
  '&ws=https%3A%2F%2Freleases.ubuntu.com%2F24.04%2Fubuntu-24.04-desktop-amd64.iso' +
  '&kt=ubuntu+linux+iso';

/** 拼装方向默认 xt 示例 */
export const DEFAULT_BUILD_XT = 'urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10';

/** 拼装方向默认显示名 */
export const DEFAULT_BUILD_DN = 'Ubuntu 24.04 LTS Desktop AMD64';

/** 拼装方向默认 tracker（每行一个） */
export const DEFAULT_BUILD_TRACKERS =
  'udp://tracker.opentrackr.org:1337/announce\nudp://tracker.openbittorrent.com:6969/announce';
