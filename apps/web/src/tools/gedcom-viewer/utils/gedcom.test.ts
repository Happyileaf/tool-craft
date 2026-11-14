import { describe, it, expect } from 'vitest';
import { parseGedcom, buildRelationships, renderTree } from './gedcom';

const SAMPLE = `0 HEAD
1 SOUR MyApp
1 CHAR UTF-8
1 GEDC
2 VERS 5.5.1
2 FORM LINEAGE-LINKED
0 @I1@ INDI
1 NAME John /Smith/
1 SEX M
1 BIRT
2 DATE 1 JAN 1980
2 PLAC London
1 DEAT
2 DATE 2 JAN 2060
2 PLAC Paris
1 FAMS @F1@
0 @I2@ INDI
1 NAME Jane /Doe/
1 SEX F
1 BIRT
2 DATE 3 MAR 1982
1 FAMS @F1@
0 @I3@ INDI
1 NAME Bob /Smith/
1 SEX M
1 FAMC @F1@
1 NOTE A long
2 CONC  name
2 CONT second line
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 CHIL @I3@
0 TRLR`;

describe('parseGedcom', () => {
  it('parses top-level records and counts', () => {
    const r = parseGedcom(SAMPLE);
    expect(r.issues).toEqual([]);
    expect(r.counts.individuals).toBe(3);
    expect(r.counts.families).toBe(1);
    expect(r.roots.map((x) => x.tag)).toContain('HEAD');
    expect(r.roots.map((x) => x.tag)).toContain('TRLR');
    expect(r.charEncoding).toBe('UTF-8');
  });

  it('extracts name, sex, birth and death', () => {
    const r = parseGedcom(SAMPLE);
    const view = buildRelationships(r);
    const john = view.individuals.find((i) => i.xref === '@I1@')!;
    expect(john.name).toBe('John Smith');
    expect(john.sex).toBe('M');
    expect(john.birth.date).toBe('1 JAN 1980');
    expect(john.birth.place).toBe('London');
    expect(john.death.date).toBe('2 JAN 2060');
    expect(john.death.place).toBe('Paris');
  });

  it('links FAM husband, wife and children by xref', () => {
    const r = parseGedcom(SAMPLE);
    const view = buildRelationships(r);
    const fam = view.families.find((f) => f.xref === '@F1@')!;
    expect(fam.husband).toBe('@I1@');
    expect(fam.wife).toBe('@I2@');
    expect(fam.children).toEqual(['@I3@']);

    const bob = view.individuals.find((i) => i.xref === '@I3@')!;
    expect(bob.familyAsChild).toEqual(['@F1@']);
    const john = view.individuals.find((i) => i.xref === '@I1@')!;
    expect(john.familyAsSpouse).toEqual(['@F1@']);
  });

  it('concatenates CONC without separator and CONT with a newline', () => {
    const r = parseGedcom(SAMPLE);
    const bob = r.individuals.find((i) => i.xref === '@I3@')!;
    const note = bob.children.find((c) => c.tag === 'NOTE')!;
    expect(note.value).toBe('A long name\nsecond line');
  });

  it('reports a level jump without aborting the rest', () => {
    const bad = `0 HEAD
1 GEDC
3 VERS 5.5.1
0 @I1@ INDI
1 NAME Solo`;
    const r = parseGedcom(bad);
    expect(r.issues.some((i) => i.level === 'error' && /层级跳号/.test(i.message))).toBe(true);
    // 后续记录仍被解析
    expect(r.individuals).toHaveLength(1);
    expect(r.individuals[0]!.xref).toBe('@I1@');
  });

  it('flags illegal leading lines', () => {
    const r = parseGedcom('not a gedcom line');
    expect(r.issues[0]!.message).toMatch(/行首格式非法/);
  });

  it('warns on dangling pointers', () => {
    const dangling = `0 @F1@ FAM
1 HUSB @I99@
1 CHIL @I3@
0 TRLR`;
    const r = parseGedcom(dangling);
    const view = buildRelationships(r);
    expect(view.dangling.some((d) => /@I99@/.test(d.message))).toBe(true);
    expect(view.dangling.some((d) => /@I3@/.test(d.message))).toBe(true);
  });

  it('tolerates unknown tags and handles CRLF', () => {
    const crlf = '0 HEAD\r\n1 MYCUSTOM hello\r\n0 TRLR\r\n';
    const r = parseGedcom(crlf);
    expect(r.issues).toEqual([]);
    const head = r.roots.find((x) => x.tag === 'HEAD')!;
    expect(head.children[0]!.tag).toBe('MYCUSTOM');
  });

  it('renders an indented hierarchical tree', () => {
    const r = parseGedcom(SAMPLE);
    const tree = renderTree(r.roots);
    expect(tree).toContain('0 @I1@ INDI');
    expect(tree).toContain('1 NAME John /Smith/');
    expect(tree).toContain('2 DATE 1 JAN 1980');
  });
});
