import { describe, it, expect } from 'vitest';
import {
  lngLatToTile,
  tileToBounds,
  parentTile,
  childTiles,
  xyzToTms,
  tmsToXyz,
  tileToQuadKey,
  quadKeyToTile,
  osmTileUrl,
  formatTilePath,
  MAX_LAT,
} from './mercator';

describe('lngLatToTile', () => {
  it('z=0 always yields the single 0/0/0 tile', () => {
    const r = lngLatToTile(100, 30, 0);
    expect([r.tileX, r.tileY]).toEqual([0, 0]);
    expect(r.tmsY).toBe(0);
  });

  it('Seattle vector (-122.335167, 47.608013) at z=9 -> tile 82/178, global px (20995,45775)', () => {
    // OSM“Slippy Map tilenames”经典算例（Seattle）：n=512
    const r = lngLatToTile(-122.335167, 47.608013, 9);
    expect(r.tileX).toBe(82);
    expect(r.tileY).toBe(178);
    expect(r.pixelX).toBe(20995);
    expect(r.pixelY).toBe(45775);
    expect(r.innerPixelX).toBe(3);
    expect(r.innerPixelY).toBe(207);
  });

  it('integer tile vector at z=6 for (131.036, -24.999)', () => {
    const r = lngLatToTile(131.036, -24.999, 6);
    expect(r.tileX).toBe(55);
    expect(r.tileY).toBe(36);
  });

  it('origin (0,0) maps to XYZ tile (1,1) at z=1 (NW-hemisphere boundary)', () => {
    // X = (0+180)/360*2 = 1（恰为瓦片边界），floor = 1；Y = (1/2)*2 = 1，floor = 1
    const r = lngLatToTile(0, 0, 1);
    expect(r.tileX).toBe(1);
    expect(r.tileY).toBe(1);
  });

  it('rejects invalid zoom and polar latitude', () => {
    expect(() => lngLatToTile(0, 0, 1.5)).toThrow('整数');
    expect(() => lngLatToTile(0, 0, -1)).toThrow();
    expect(() => lngLatToTile(0, 0, 23)).toThrow();
    expect(() => lngLatToTile(0, 86, 5)).toThrowError(String(MAX_LAT.toFixed(6)));
    expect(() => lngLatToTile(181, 0, 5)).toThrow('经度');
  });
});

describe('tileToBounds', () => {
  it('z=0 tile spans the whole world', () => {
    const b = tileToBounds({ z: 0, x: 0, y: 0 });
    expect(b.west).toBeCloseTo(-180, 9);
    expect(b.east).toBeCloseTo(180, 9);
    expect(b.north).toBeCloseTo(MAX_LAT, 5);
    expect(b.south).toBeCloseTo(-MAX_LAT, 5);
    expect(b.center.lng).toBeCloseTo(0, 9);
  });

  it('round-trips the OSM wiki point through its z=6 tile bounds', () => {
    const b = tileToBounds({ z: 6, x: 55, y: 36 });
    expect(131.036).toBeGreaterThan(b.west);
    expect(131.036).toBeLessThan(b.east);
    expect(-24.999).toBeGreaterThan(b.south);
    expect(-24.999).toBeLessThan(b.north);
  });

  it('rejects out-of-range tile indices', () => {
    expect(() => tileToBounds({ z: 2, x: 4, y: 0 })).toThrow();
    expect(() => tileToBounds({ z: 2, x: 0, y: -1 })).toThrow();
  });
});

describe('parent / children', () => {
  it('parent halves the indices and z=0 has no parent', () => {
    expect(parentTile({ z: 0, x: 0, y: 0 })).toBeNull();
    expect(parentTile({ z: 3, x: 5, y: 3 })).toEqual({ z: 2, x: 2, y: 1 });
  });

  it('children quarter the parent and cover all four quadrants', () => {
    const kids = childTiles({ z: 2, x: 2, y: 1 });
    expect(kids).toEqual([
      { z: 3, x: 4, y: 2 },
      { z: 3, x: 5, y: 2 },
      { z: 3, x: 4, y: 3 },
      { z: 3, x: 5, y: 3 },
    ]);
  });

  it('cannot descend below z=22', () => {
    expect(() => childTiles({ z: 22, x: 0, y: 0 })).toThrow('22');
  });
});

describe('TMS flip and QuadKey', () => {
  it('XYZ <-> TMS y flip is an involution', () => {
    const coord = { z: 3, x: 5, y: 6 };
    const tms = xyzToTms(coord);
    expect(tms).toBe(1);
    expect(tmsToXyz(3, 5, tms)).toEqual(coord);
  });

  it('known QuadKey vectors', () => {
    expect(tileToQuadKey({ z: 0, x: 0, y: 0 })).toBe('');
    expect(tileToQuadKey({ z: 3, x: 4, y: 2 })).toBe('120');
    expect(tileToQuadKey({ z: 6, x: 53, y: 24 })).toBe('132101');
  });

  it('QuadKey round-trips and rejects bad digits', () => {
    const coord = { z: 6, x: 53, y: 24 };
    expect(quadKeyToTile(tileToQuadKey(coord))).toEqual(coord);
    expect(() => quadKeyToTile('124')).toThrow();
  });
});

describe('url and path', () => {
  it('formats OSM url and z/x/y path', () => {
    const coord = { z: 6, x: 53, y: 24 };
    expect(osmTileUrl(coord)).toBe('https://tile.openstreetmap.org/6/53/24.png');
    expect(formatTilePath(coord)).toBe('6/53/24');
  });
});
