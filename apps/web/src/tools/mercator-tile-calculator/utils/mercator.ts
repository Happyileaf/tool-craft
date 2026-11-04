/**
 * Web Mercator（EPSG:3857）Slippy Map 切片计算（零依赖纯函数）
 *
 * 标准 XYZ（OSM/Google）切片方案：
 *   n = 2^z
 *   浮点瓦片坐标：X = (lng + 180) / 360 · n
 *                 Y = (1 − asinh(tan φ)/π) / 2 · n   （φ 为纬度弧度）
 *   tileX/tileY = floor(X)/floor(Y)，瓦片内像素 = floor((frac) · 256)
 *
 * TMS 的 y 自下而上：tmsY = n − 1 − tileY。
 */

export const TILE_SIZE = 256;
export const MIN_ZOOM = 0;
export const MAX_ZOOM = 22;
/** Web Mercator 有效纬度极限（约 85.05112878°） */
export const MAX_LAT = 85.0511287798066;

export interface LngLat {
  lng: number;
  lat: number;
}

export interface TileCoord {
  z: number;
  x: number;
  y: number;
}

export interface PointTileResult {
  z: number;
  /** 全局像素（256 × 2^z 画布） */
  pixelX: number;
  pixelY: number;
  tileX: number;
  tileY: number;
  /** 瓦片内像素 0–255 */
  innerPixelX: number;
  innerPixelY: number;
  /** 浮点瓦片坐标（保留精度供展示） */
  fractionX: number;
  fractionY: number;
  tmsY: number;
}

function assertZoom(z: number): void {
  if (!Number.isInteger(z) || z < MIN_ZOOM || z > MAX_ZOOM) {
    throw new Error(`缩放层级 z 必须是 ${MIN_ZOOM}–${MAX_ZOOM} 的整数`);
  }
}

function assertLngLat(lng: number, lat: number): void {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) throw new Error('经纬度不是有效数字');
  if (lat <= -90 || lat >= 90) throw new Error('纬度必须在 (-90, 90) 之间');
  if (lng < -180 || lng > 180) throw new Error('经度必须在 [-180, 180] 之间');
  if (Math.abs(lat) > MAX_LAT) {
    throw new Error(`Web Mercator 纬度极限为 ±${MAX_LAT.toFixed(6)}°（极地无法投影）`);
  }
}

/** 经纬度 + zoom -> 瓦片 / 像素坐标 */
export function lngLatToTile(lng: number, lat: number, z: number): PointTileResult {
  assertZoom(z);
  assertLngLat(lng, lat);
  const n = 2 ** z;
  const fractionX = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const fractionY = ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n;

  const tileX = Math.floor(fractionX);
  const tileY = Math.floor(fractionY);
  return {
    z,
    fractionX,
    fractionY,
    tileX,
    tileY,
    pixelX: Math.floor(fractionX * TILE_SIZE),
    pixelY: Math.floor(fractionY * TILE_SIZE),
    innerPixelX: Math.floor((fractionX - tileX) * TILE_SIZE),
    innerPixelY: Math.floor((fractionY - tileY) * TILE_SIZE),
    tmsY: n - 1 - tileY,
  };
}

export interface TileBounds {
  north: number;
  south: number;
  west: number;
  east: number;
  center: LngLat;
}

/** 验证瓦片下标是否在该 zoom 合法 */
export function assertTileCoord(coord: TileCoord): void {
  assertZoom(coord.z);
  const n = 2 ** coord.z;
  if (!Number.isInteger(coord.x) || !Number.isInteger(coord.y)) {
    throw new Error('瓦片 x / y 必须为整数');
  }
  if (coord.x < 0 || coord.x >= n || coord.y < 0 || coord.y >= n) {
    throw new Error(`z=${coord.z} 时瓦片下标必须在 0–${n - 1} 之间`);
  }
}

function tileFractionToLat(yFraction: number, n: number): number {
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * yFraction) / n)));
  return (latRad * 180) / Math.PI;
}

/** 瓦片 z/x/y -> 四至包围盒与中心 */
export function tileToBounds(coord: TileCoord): TileBounds {
  assertTileCoord(coord);
  const { z, x, y } = coord;
  const n = 2 ** z;
  const north = tileFractionToLat(y, n);
  const south = tileFractionToLat(y + 1, n);
  const west = (x / n) * 360 - 180;
  const east = ((x + 1) / n) * 360 - 180;
  return {
    north,
    south,
    west,
    east,
    center: { lng: (west + east) / 2, lat: (north + south) / 2 },
  };
}

/** 父瓦片（z-1）；z=0 时返回 null */
export function parentTile(coord: TileCoord): TileCoord | null {
  assertTileCoord(coord);
  if (coord.z === MIN_ZOOM) return null;
  return { z: coord.z - 1, x: Math.floor(coord.x / 2), y: Math.floor(coord.y / 2) };
}

/** 四个子瓦片（z+1）；超过 MAX_ZOOM 抛错 */
export function childTiles(coord: TileCoord): TileCoord[] {
  assertTileCoord(coord);
  if (coord.z === MAX_ZOOM) throw new Error(`已达到最大缩放层级 ${MAX_ZOOM}，无法继续下钻`);
  return [
    { z: coord.z + 1, x: coord.x * 2, y: coord.y * 2 },
    { z: coord.z + 1, x: coord.x * 2 + 1, y: coord.y * 2 },
    { z: coord.z + 1, x: coord.x * 2, y: coord.y * 2 + 1 },
    { z: coord.z + 1, x: coord.x * 2 + 1, y: coord.y * 2 + 1 },
  ];
}

/** XYZ y 坐标 -> TMS y 坐标（同 zoom） */
export function xyzToTms(coord: TileCoord): number {
  assertTileCoord(coord);
  return 2 ** coord.z - 1 - coord.y;
}

/** TMS y 坐标 -> XYZ 瓦片坐标 */
export function tmsToXyz(z: number, x: number, tmsY: number): TileCoord {
  assertZoom(z);
  const y = 2 ** z - 1 - tmsY;
  const coord = { z, x, y };
  assertTileCoord(coord);
  return coord;
}

/** 转 Bing Maps QuadKey（基数 4，位交错 y/x） */
export function tileToQuadKey(coord: TileCoord): string {
  assertTileCoord(coord);
  let key = '';
  for (let i = coord.z; i > 0; i -= 1) {
    let digit = 0;
    const mask = 1 << (i - 1);
    if (coord.x & mask) digit += 1;
    if (coord.y & mask) digit += 2;
    key += digit.toString();
  }
  return key;
}

/** QuadKey -> 瓦片坐标 */
export function quadKeyToTile(quadKey: string): TileCoord {
  if (!/^[0-3]*$/.test(quadKey)) throw new Error('QuadKey 只能包含 0–3 字符');
  if (quadKey.length > MAX_ZOOM) throw new Error(`QuadKey 长度不能超过 ${MAX_ZOOM}`);
  let x = 0;
  let y = 0;
  const z = quadKey.length;
  for (let i = z; i > 0; i -= 1) {
    const digit = Number(quadKey[z - i]);
    const mask = 1 << (i - 1);
    if (digit & 1) x |= mask;
    if (digit & 2) y |= mask;
  }
  const coord = { z, x, y };
  assertTileCoord(coord);
  return coord;
}

/** OSM 标准切片 URL（{a-c} 子域由使用方轮询） */
export function osmTileUrl(coord: TileCoord): string {
  assertTileCoord(coord);
  return `https://tile.openstreetmap.org/${coord.z}/${coord.x}/${coord.y}.png`;
}

/** 序列化为 z/x/y 路径 */
export function formatTilePath(coord: TileCoord): string {
  return `${coord.z}/${coord.x}/${coord.y}`;
}
