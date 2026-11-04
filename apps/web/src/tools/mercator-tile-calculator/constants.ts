export interface GeoPreset {
  name: string;
  lng: number;
  lat: number;
  z: number;
}

export const GEO_PRESETS: GeoPreset[] = [
  { name: '天安门 116.397, 39.908 @12', lng: 116.397, lat: 39.908, z: 12 },
  { name: 'OSM 文档示例 131.036, -24.999 @6', lng: 131.036, lat: -24.999, z: 6 },
  { name: '本初子午线与赤道 0, 0 @3', lng: 0, lat: 0, z: 3 },
  { name: '纽约 -74.006, 40.713 @10', lng: -74.006, lat: 40.713, z: 10 },
];
