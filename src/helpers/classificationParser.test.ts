import { describe, expect, it } from '@jest/globals';
import {
  applyClassificationRules,
  ClassificationDefinition,
  ClassificationParts,
  getMaxClassification,
  getParts,
  isAccessible,
  normalizedClassification
} from 'helpers/classificationParser';

// if you make changes to this definition, please ensure they are reflected in the assemblyline-base tests as well.
const c12nDef: ClassificationDefinition = {
  RESTRICTED: 'LEVEL 2',
  UNRESTRICTED: 'LEVEL 0',
  access_req_aliases: { ACC: ['AC'], LEGAL: ['LE'] },
  access_req_map_lts: {
    ACCOUNTING: 'AC',
    'LEGAL DEPARTMENT': 'LE',
    'NO CONTRACTORS': 'NOCON',
    'ORIGINATOR CONTROLLED': 'ORCON'
  },
  access_req_map_stl: {
    AC: 'ACCOUNTING',
    LE: 'LEGAL DEPARTMENT',
    NOCON: 'NO CONTRACTORS',
    ORCON: 'ORIGINATOR CONTROLLED'
  },
  description: {
    A: 'N/A',
    AC: 'N/A',
    ACCOUNTING: 'N/A',
    B: 'N/A',
    'GROUP A': 'N/A',
    'GROUP B': 'N/A',
    'GROUP X': 'N/A',
    L0: 'N/A',
    L1: 'N/A',
    L2: 'N/A',
    LE: 'N/A',
    'LEGAL DEPARTMENT': 'N/A',
    'LEVEL 0': 'N/A',
    'LEVEL 1': 'N/A',
    'LEVEL 2': 'N/A',
    'NO CONTRACTORS': 'N/A',
    NOCON: 'N/A',
    ORCON: 'N/A',
    'ORIGINATOR CONTROLLED': 'N/A',
    R1: 'N/A',
    R2: 'N/A',
    R3: 'N/A',
    'RESERVE ONE': 'N/A',
    'RESERVE THREE': 'N/A',
    'RESERVE TWO': 'N/A',
    X: 'N/A'
  },
  dynamic_groups: false,
  dynamic_groups_type: 'email',
  enforce: true,
  groups_aliases: { XX: ['X'] },
  groups_auto_select: [],
  groups_auto_select_short: [],
  groups_map_lts: { 'GROUP A': 'A', 'GROUP B': 'B', 'GROUP X': 'X' },
  groups_map_stl: { A: 'GROUP A', B: 'GROUP B', X: 'GROUP X' },
  invalid_mode: false,
  levels_aliases: { OPEN: 'L0' },
  levels_map: { '1': 'L0', '15': 'L2', '5': 'L1', L0: '1', L1: '5', L2: '15' },
  levels_map_lts: { 'LEVEL 0': 'L0', 'LEVEL 1': 'L1', 'LEVEL 2': 'L2' },
  levels_map_stl: { L0: 'LEVEL 0', L1: 'LEVEL 1', L2: 'LEVEL 2' },
  levels_styles_map: {
    L0: { color: 'default' },
    L1: { color: 'default' },
    L2: { color: 'default' },
    'LEVEL 0': { color: 'default' },
    'LEVEL 1': { color: 'default' },
    'LEVEL 2': { color: 'default' }
  },
  original_definition: {
    dynamic_groups: false,
    dynamic_groups_type: 'email',
    enforce: true,
    groups: [
      { name: 'Group A', short_name: 'A', aliases: [], description: 'N/A' },
      { name: 'Group B', short_name: 'B', aliases: [], description: 'N/A' },
      { name: 'Group X', short_name: 'X', aliases: [], description: 'N/A', solitary_display_name: 'XX' }
    ],
    levels: [
      { lvl: 1, name: 'Level 0', short_name: 'L0', aliases: ['Open'], description: 'N/A', css: { color: 'default' } },
      { lvl: 5, name: 'Level 1', short_name: 'L1', aliases: [], description: 'N/A', css: { color: 'default' } },
      { lvl: 15, name: 'Level 2', short_name: 'L2', aliases: [], description: 'N/A', css: { color: 'default' } }
    ],
    required: [
      { is_required_group: false, name: 'Legal Department', short_name: 'LE', aliases: ['Legal'], description: 'N/A' },
      { is_required_group: false, name: 'Accounting', short_name: 'AC', aliases: ['Acc'], description: 'N/A' },
      { is_required_group: true, name: 'Originator Controlled', short_name: 'orcon', aliases: [], description: 'N/A' },
      { is_required_group: true, name: 'No Contractors', short_name: 'nocon', aliases: [], description: 'N/A' }
    ],
    restricted: 'L2',
    subgroups: [
      { name: 'Reserve One', short_name: 'R1', aliases: ['R0'], description: 'N/A' },
      { name: 'Reserve Two', short_name: 'R2', aliases: [], description: 'N/A', require_group: 'X' },
      { name: 'Reserve Three', short_name: 'R3', aliases: [], description: 'N/A', limited_to_group: 'X' }
    ],
    unrestricted: 'L0'
  },
  params_map: {
    A: {},
    AC: { is_required_group: false },
    ACCOUNTING: { is_required_group: false },
    B: {},
    'GROUP A': {},
    'GROUP B': {},
    'GROUP X': { solitary_display_name: 'XX' },
    L0: {},
    L1: {},
    L2: {},
    LE: { is_required_group: false },
    'LEGAL DEPARTMENT': { is_required_group: false },
    'LEVEL 0': {},
    'LEVEL 1': {},
    'LEVEL 2': {},
    'NO CONTRACTORS': { is_required_group: true },
    NOCON: { is_required_group: true },
    ORCON: { is_required_group: true },
    'ORIGINATOR CONTROLLED': { is_required_group: true },
    R1: {},
    R2: { require_group: 'X' },
    R3: { limited_to_group: 'X' },
    'RESERVE ONE': {},
    'RESERVE THREE': { limited_to_group: 'X' },
    'RESERVE TWO': { require_group: 'X' },
    X: { solitary_display_name: 'XX' }
  },
  subgroups_aliases: { R0: ['R1'] },
  subgroups_auto_select: [],
  subgroups_auto_select_short: [],
  subgroups_map_lts: { 'RESERVE ONE': 'R1', 'RESERVE THREE': 'R3', 'RESERVE TWO': 'R2' },
  subgroups_map_stl: { R1: 'RESERVE ONE', R2: 'RESERVE TWO', R3: 'RESERVE THREE' }
};

describe('`getParts` correctly extracts all components', () => {
  it('Should extract the level', () => {
    expect(getParts('L0', c12nDef, 'short', false)).toEqual({
      lvlIdx: '1',
      lvl: 'L0',
      req: [],
      groups: [],
      subgroups: []
    });
    expect(getParts('L0', c12nDef, 'long', false)).toEqual({
      lvlIdx: '1',
      lvl: 'LEVEL 0',
      req: [],
      groups: [],
      subgroups: []
    });

    expect(getParts('LEVEL 0', c12nDef, 'short', false)).toEqual({
      lvlIdx: '1',
      lvl: 'L0',
      req: [],
      groups: [],
      subgroups: []
    });
    expect(getParts('LEVEL 0', c12nDef, 'long', false)).toEqual({
      lvlIdx: '1',
      lvl: 'LEVEL 0',
      req: [],
      groups: [],
      subgroups: []
    });

    expect(getParts('L1', c12nDef, 'short', false)).toEqual({
      lvlIdx: '5',
      lvl: 'L1',
      req: [],
      groups: [],
      subgroups: []
    });
    expect(getParts('L1', c12nDef, 'long', false)).toEqual({
      lvlIdx: '5',
      lvl: 'LEVEL 1',
      req: [],
      groups: [],
      subgroups: []
    });

    expect(getParts('LEVEL 1', c12nDef, 'short', false)).toEqual({
      lvlIdx: '5',
      lvl: 'L1',
      req: [],
      groups: [],
      subgroups: []
    });
    expect(getParts('LEVEL 1', c12nDef, 'long', false)).toEqual({
      lvlIdx: '5',
      lvl: 'LEVEL 1',
      req: [],
      groups: [],
      subgroups: []
    });
  });

  it('Should extract the group', () => {
    expect(getParts('L0//REL A', c12nDef, 'short', false)).toEqual({
      lvlIdx: '1',
      lvl: 'L0',
      req: [],
      groups: ['A'],
      subgroups: []
    });
    expect(getParts('L0//REL A', c12nDef, 'long', false)).toEqual({
      lvlIdx: '1',
      lvl: 'LEVEL 0',
      req: [],
      groups: ['GROUP A'],
      subgroups: []
    });

    expect(getParts('LEVEL 0//REL TO GROUP A', c12nDef, 'short', false)).toEqual({
      lvlIdx: '1',
      lvl: 'L0',
      req: [],
      groups: ['A'],
      subgroups: []
    });
    expect(getParts('LEVEL 0//REL TO GROUP A', c12nDef, 'long', false)).toEqual({
      lvlIdx: '1',
      lvl: 'LEVEL 0',
      req: [],
      groups: ['GROUP A'],
      subgroups: []
    });
  });

  it('Should extract multiple groups', () => {
    expect(getParts('L0//REL A, B', c12nDef, 'short', false)).toEqual({
      lvlIdx: '1',
      lvl: 'L0',
      req: [],
      groups: ['A', 'B'],
      subgroups: []
    });
    expect(getParts('L0//REL B, A', c12nDef, 'long', false)).toEqual({
      lvlIdx: '1',
      lvl: 'LEVEL 0',
      req: [],
      groups: ['GROUP A', 'GROUP B'],
      subgroups: []
    });
    expect(getParts('L0//REL TO GROUP A, GROUP B', c12nDef, 'short', false)).toEqual({
      lvlIdx: '1',
      lvl: 'L0',
      req: [],
      groups: ['A', 'B'],
      subgroups: []
    });
    expect(getParts('L0//REL TO GROUP B, GROUP A', c12nDef, 'long', false)).toEqual({
      lvlIdx: '1',
      lvl: 'LEVEL 0',
      req: [],
      groups: ['GROUP A', 'GROUP B'],
      subgroups: []
    });
  });

  it('Should extract groups and subgroups', () => {
    // getParts is not responsible for adding parent groups to subgroups
    expect(getParts('LEVEL 0//R3', c12nDef, 'short', false)).toEqual({
      lvlIdx: '1',
      lvl: 'L0',
      req: [],
      groups: [],
      subgroups: ['R3']
    });
    expect(getParts('LEVEL 0//R3', c12nDef, 'long', false)).toEqual({
      lvlIdx: '1',
      lvl: 'LEVEL 0',
      req: [],
      groups: [],
      subgroups: ['RESERVE THREE']
    });

    expect(getParts('LEVEL 0//R3/REL X', c12nDef, 'short', false)).toEqual({
      lvlIdx: '1',
      lvl: 'L0',
      req: [],
      groups: ['X'],
      subgroups: ['R3']
    });
    expect(getParts('LEVEL 0//R3/REL X', c12nDef, 'long', false)).toEqual({
      lvlIdx: '1',
      lvl: 'LEVEL 0',
      req: [],
      groups: ['GROUP X'],
      subgroups: ['RESERVE THREE']
    });

    expect(getParts('LEVEL 0//AC//REL A,XX/R3', c12nDef, 'short', false)).toEqual({
      lvlIdx: '1',
      lvl: 'L0',
      req: ['AC'],
      groups: ['A', 'X'],
      subgroups: ['R3']
    });
    expect(getParts('LEVEL 0//AC//REL A,XX/R3', c12nDef, 'long', false)).toEqual({
      lvlIdx: '1',
      lvl: 'LEVEL 0',
      req: ['ACCOUNTING'],
      groups: ['GROUP A', 'GROUP X'],
      subgroups: ['RESERVE THREE']
    });
  });
});

describe('`normalizedClassification` correctly formats', () => {
  it('Should convert input to upper case', () => {
    let parts = getParts('l0//accOUNTINg//rel to GROUP a', c12nDef, 'long', false);
    expect(normalizedClassification(parts, c12nDef, 'long', false)).toBe('LEVEL 0//ACCOUNTING//REL TO GROUP A');
    // normalize mutates parts in place.
    parts = getParts('l0//accOUNTINg//rel to GROUP a', c12nDef, 'long', false);
    expect(normalizedClassification(parts, c12nDef, 'short', false)).toBe('L0//AC//REL A');
  });

  it('Should normalise level', () => {
    let parts = getParts('LEVEL 0', c12nDef, 'short', false);
    expect(normalizedClassification(parts, c12nDef, 'short', false)).toBe('L0');
    parts = getParts('LEVEL 0', c12nDef, 'long', false);
    expect(normalizedClassification(parts, c12nDef, 'short', false)).toBe('L0');

    parts = getParts('LEVEL 1', c12nDef, 'short', false);
    expect(normalizedClassification(parts, c12nDef, 'long', false)).toBe('LEVEL 1');
    parts = getParts('LEVEL 1', c12nDef, 'long', false);
    expect(normalizedClassification(parts, c12nDef, 'long', false)).toBe('LEVEL 1');
  });

  it('Should always use short format when `isMobile` is used', () => {
    const parts = getParts('L0', c12nDef, 'long', true);
    expect(normalizedClassification(parts, c12nDef, 'short', true)).toBe('L0');
    expect(normalizedClassification(parts, c12nDef, 'long', true)).toBe('L0');
  });

  it('Should normalise groups', () => {
    let parts = getParts('L0//REL A, B', c12nDef, 'short', false);
    expect(normalizedClassification(parts, c12nDef, 'long', false)).toBe('LEVEL 0//REL TO GROUP A, GROUP B');
    parts = getParts('L0//REL A, B', c12nDef, 'short', false);
    expect(normalizedClassification(parts, c12nDef, 'short', false)).toBe('L0//REL A, B');

    parts = getParts('L2//REL B, A', c12nDef, 'short', false);
    expect(normalizedClassification(parts, c12nDef, 'long', false)).toBe('LEVEL 2//REL TO GROUP A, GROUP B');
    parts = getParts('L2//REL B, A', c12nDef, 'short', false);
    expect(normalizedClassification(parts, c12nDef, 'short', false)).toBe('L2//REL A, B');

    parts = getParts('L0//REL A', c12nDef, 'short', false);
    expect(normalizedClassification(parts, c12nDef, 'long', false)).toBe('LEVEL 0//REL TO GROUP A');
    parts = getParts('L0//REL A', c12nDef, 'short', false);
    expect(normalizedClassification(parts, c12nDef, 'short', false)).toBe('L0//REL A');
  });

  it('Should normalise required', () => {
    let parts = getParts('L0//AC', c12nDef, 'short', false);
    expect(normalizedClassification(parts, c12nDef, 'long', false)).toBe('LEVEL 0//ACCOUNTING');
    parts = getParts('L0//AC', c12nDef, 'short', false);
    expect(normalizedClassification(parts, c12nDef, 'short', false)).toBe('L0//AC');

    parts = getParts('L2//AC/LE', c12nDef, 'short', false);
    expect(normalizedClassification(parts, c12nDef, 'long', false)).toBe('LEVEL 2//ACCOUNTING/LEGAL DEPARTMENT');
    parts = getParts('L2//AC/LE', c12nDef, 'short', false);
    expect(normalizedClassification(parts, c12nDef, 'short', false)).toBe('L2//AC/LE');

    parts = getParts('L2//LE/AC', c12nDef, 'short', false);
    expect(normalizedClassification(parts, c12nDef, 'long', false)).toBe('LEVEL 2//ACCOUNTING/LEGAL DEPARTMENT');
    parts = getParts('L2//LE/AC', c12nDef, 'short', false);
    expect(normalizedClassification(parts, c12nDef, 'short', false)).toBe('L2//AC/LE');
  });

  it('Should convert aliases to real name', () => {
    let parts = getParts('OPEN', c12nDef, 'long', false);
    expect(normalizedClassification(parts, c12nDef, 'long', false)).toBe('LEVEL 0');
    parts = getParts('OPEN', c12nDef, 'long', false);
    expect(normalizedClassification(parts, c12nDef, 'short', false)).toBe('L0');

    parts = getParts('L0//LEGAL', c12nDef, 'long', false);
    expect(normalizedClassification(parts, c12nDef, 'long', false)).toBe('LEVEL 0//LEGAL DEPARTMENT');
    parts = getParts('L0//LEGAL', c12nDef, 'long', false);
    expect(normalizedClassification(parts, c12nDef, 'short', false)).toBe('L0//LE');
  });

  it('Should add primary group when only subgroup is specified', () => {
    let parts: ClassificationParts = { lvlIdx: 1, lvl: 'LEVEL 0', req: [], groups: [], subgroups: ['R2'] };
    expect(normalizedClassification(parts, c12nDef, 'long', false)).toBe('LEVEL 0//XX/RESERVE TWO');
    parts = { lvlIdx: 1, lvl: 'LEVEL 0', req: [], groups: [], subgroups: ['R2'] };
    expect(normalizedClassification(parts, c12nDef, 'short', false)).toBe('L0//XX/R2');
  });

  it('Should correctly parse groups that specify REL, REL TO', () => {
    let parts = getParts('L0//REL TO GROUP A', c12nDef, 'long', false);
    expect(normalizedClassification(parts, c12nDef, 'short', false)).toBe('L0//REL A');

    parts = getParts('L0//REL GROUP A', c12nDef, 'long', false);
    expect(normalizedClassification(parts, c12nDef, 'short', false)).toBe('L0//REL A');
  });
});

describe('`normalizedClassification` identifies invalid input', () => {
  it('Should raise errors on invliad input?', () => {
    let parts: ClassificationParts = { lvlIdx: 12, lvl: 'LEVEL 12', req: [], groups: [], subgroups: [] };
    expect(normalizedClassification(parts, c12nDef, 'short', false)).toBe('?');
    parts = { lvlIdx: 1, lvl: 'LEVEL 0', req: ['GARBO'], groups: [], subgroups: [] };
    expect(normalizedClassification(parts, c12nDef, 'short', false)).toBe('?');
    parts = { lvlIdx: 1, lvl: 'LEVEL 0', req: ['LEGAL DEPARTMENT'], groups: ['GARBO'], subgroups: [] };
    expect(normalizedClassification(parts, c12nDef, 'short', false)).toBe('?');
  });
});

describe('`isAccessible` correctly applies access controls', () => {
  it('Should return `true` if not enforced', () => {
    expect(isAccessible('L0', 'L1', c12nDef, false)).toBe(true);
    expect(isAccessible('L3', 'L1', c12nDef, false)).toBe(true);
    expect(isAccessible('', 'L1', c12nDef, false)).toBe(true);
    expect(isAccessible(null, 'L1', c12nDef, false)).toBe(true);
    expect(isAccessible(undefined, 'L1', c12nDef, false)).toBe(true);
  });

  it('Should return `true` if level is falsey', () => {
    expect(isAccessible('L1', null, c12nDef, true)).toBe(true);
    expect(isAccessible('L2', undefined, c12nDef, true)).toBe(true);
    expect(isAccessible('L2', '', c12nDef, true)).toBe(true);
    expect(isAccessible(null, null, c12nDef, true)).toBe(true);
    expect(isAccessible(undefined, null, c12nDef, true)).toBe(true);
    expect(isAccessible('', null, c12nDef, true)).toBe(true);
  });

  it('Should return `true` if inputs are the same', () => {
    expect(isAccessible('L1', 'L1', c12nDef, true)).toBe(true);
    expect(isAccessible('L1//LE', 'L1//LE', c12nDef, true)).toBe(true);
    expect(isAccessible('L1//LE//REL A', 'L1//LE//REL A', c12nDef, true)).toBe(true);
  });

  it('Should return `false` if user level is lower than given level', () => {
    expect(isAccessible('L0', 'L1', c12nDef, true)).toBe(false);
    expect(isAccessible('L1//REL A', 'L2', c12nDef, true)).toBe(false);
    expect(isAccessible('L0//AC', 'L1', c12nDef, true)).toBe(false);
  });

  it('Should return `true` if user level is higher than given level', () => {
    expect(isAccessible('L1', 'L0', c12nDef, true)).toBe(true);
  });

  it('Should limit access based on control system markings', () => {
    expect(isAccessible('L2', 'L0//LE', c12nDef, true)).toBe(false);
    expect(isAccessible('L2//LE', 'L0//LE', c12nDef, true)).toBe(true);

    expect(isAccessible('L2', 'L2//LE/AC', c12nDef, true)).toBe(false);
    expect(isAccessible('L2//LE', 'L2//LE/AC', c12nDef, true)).toBe(false);
    expect(isAccessible('L2//AC', 'L2//AC/LE', c12nDef, true)).toBe(false);
    expect(isAccessible('L2//LE/AC', 'L2//AC/LE', c12nDef, true)).toBe(true);
  });

  it('Should limit access based on dissemination markings', () => {
    expect(isAccessible('L2', 'L2//ORCON/NOCON', c12nDef, true)).toBe(false);
    expect(isAccessible('L2//ORCON', 'L2//ORCON/NOCON', c12nDef, true)).toBe(false);
    expect(isAccessible('L2//NOCON', 'L2//ORCON/NOCON', c12nDef, true)).toBe(false);
    expect(isAccessible('L2//NOCON/ORCON', 'L2//ORCON/NOCON', c12nDef, true)).toBe(true);
  });

  it('Should limit access based on releasability', () => {
    expect(isAccessible('L2', 'L2//REL A', c12nDef, true)).toBe(false);
    expect(isAccessible('L2//REL B', 'L2//REL A', c12nDef, true)).toBe(false);
    expect(isAccessible('L2//REL B', 'L2//REL A, B', c12nDef, true)).toBe(true);
    expect(isAccessible('L2//REL B', 'L2//REL B', c12nDef, true)).toBe(true);
    expect(isAccessible('L2//REL B', 'L2', c12nDef, true)).toBe(true);
  });
});

describe('`getMaxClassification` correctly identifies the maximum', () => {
  it('Should return the higher level when only level is given', () => {
    expect(getMaxClassification('L0', 'L0', c12nDef, 'short', false)).toBe('L0');
    expect(getMaxClassification('L0', 'L0', c12nDef, 'long', false)).toBe('LEVEL 0');
    expect(getMaxClassification('L0', 'L0', c12nDef, 'long', true)).toBe('L0');

    expect(getMaxClassification('LEVEL 0', 'L1', c12nDef, 'short', false)).toBe('L1');
    expect(getMaxClassification('LEVEL 0', 'L1', c12nDef, 'long', false)).toBe('LEVEL 1');
    expect(getMaxClassification('LEVEL 0', 'L1', c12nDef, 'long', true)).toBe('L1');

    expect(getMaxClassification('L0', 'LEVEL 2', c12nDef, 'short', false)).toBe('L2');
    expect(getMaxClassification('L0', 'LEVEL 2', c12nDef, 'long', false)).toBe('LEVEL 2');
    expect(getMaxClassification('L0', 'LEVEL 2', c12nDef, 'long', true)).toBe('L2');

    expect(getMaxClassification('L1', 'L0', c12nDef, 'short', false)).toBe('L1');
    expect(getMaxClassification('L1', 'L0', c12nDef, 'long', false)).toBe('LEVEL 1');
    expect(getMaxClassification('L1', 'L0', c12nDef, 'long', true)).toBe('L1');

    expect(getMaxClassification('L1', 'L1', c12nDef, 'short', false)).toBe('L1');
    expect(getMaxClassification('L1', 'L1', c12nDef, 'long', false)).toBe('LEVEL 1');
    expect(getMaxClassification('L1', 'L1', c12nDef, 'long', true)).toBe('L1');

    expect(getMaxClassification('L1', 'L2', c12nDef, 'short', false)).toBe('L2');
    expect(getMaxClassification('L1', 'L2', c12nDef, 'long', false)).toBe('LEVEL 2');
    expect(getMaxClassification('L1', 'L2', c12nDef, 'long', true)).toBe('L2');

    expect(getMaxClassification('L2', 'L0', c12nDef, 'short', false)).toBe('L2');
    expect(getMaxClassification('L2', 'L0', c12nDef, 'long', false)).toBe('LEVEL 2');
    expect(getMaxClassification('L2', 'L0', c12nDef, 'long', true)).toBe('L2');

    expect(getMaxClassification('L2', 'L1', c12nDef, 'short', false)).toBe('L2');
    expect(getMaxClassification('L2', 'L1', c12nDef, 'long', false)).toBe('LEVEL 2');
    expect(getMaxClassification('L2', 'L1', c12nDef, 'long', true)).toBe('L2');

    expect(getMaxClassification('L2', 'L2', c12nDef, 'short', false)).toBe('L2');
    expect(getMaxClassification('L2', 'L2', c12nDef, 'long', false)).toBe('LEVEL 2');
    expect(getMaxClassification('L2', 'L2', c12nDef, 'long', true)).toBe('L2');
  });

  it('Should return the higher level and merge all required when valid', () => {
    expect(getMaxClassification('L0//AC', 'L2', c12nDef, 'short', false)).toBe('L2//AC');
    expect(getMaxClassification('L0//AC', 'LEVEL 2', c12nDef, 'long', false)).toBe('LEVEL 2//ACCOUNTING');
    expect(getMaxClassification('LEVEL 0//AC', 'L2', c12nDef, 'long', true)).toBe('L2//AC');

    expect(getMaxClassification('L0', 'L2//AC', c12nDef, 'short', false)).toBe('L2//AC');
    expect(getMaxClassification('L0', 'LEVEL 2//AC', c12nDef, 'long', false)).toBe('LEVEL 2//ACCOUNTING');
    expect(getMaxClassification('LEVEL 0', 'L2//AC', c12nDef, 'long', true)).toBe('L2//AC');

    expect(getMaxClassification('L0//NOCON', 'L2//AC', c12nDef, 'short', false)).toBe('L2//AC//NOCON');
    expect(getMaxClassification('L0//NOCON', 'LEVEL 2//AC', c12nDef, 'long', false)).toBe(
      'LEVEL 2//ACCOUNTING//NO CONTRACTORS'
    );
    expect(getMaxClassification('LEVEL 0//NOCON', 'L2//AC', c12nDef, 'long', true)).toBe('L2//AC//NOCON');

    expect(getMaxClassification('L0//NOCON', 'L2//AC/ORCON', c12nDef, 'short', false)).toBe('L2//AC//NOCON/ORCON');
    expect(getMaxClassification('L0//NOCON', 'LEVEL 2//AC/ORCON', c12nDef, 'long', false)).toBe(
      'LEVEL 2//ACCOUNTING//NO CONTRACTORS/ORIGINATOR CONTROLLED'
    );
    expect(getMaxClassification('LEVEL 0//NOCON', 'L2//AC/ORCON', c12nDef, 'long', true)).toBe('L2//AC//NOCON/ORCON');
  });

  it('Should return the higher level and merge all groups when valid', () => {
    expect(getMaxClassification('L0//REL A, B', 'L0', c12nDef, 'short', false)).toBe('L0//REL A, B');
    expect(getMaxClassification('L0//REL A', 'L1', c12nDef, 'long', false)).toBe('LEVEL 1//REL TO GROUP A');
    expect(getMaxClassification('L0//REL A', 'L1', c12nDef, 'long', true)).toBe('L1//REL A');
    expect(getMaxClassification('L0', 'L2//REL A, B', c12nDef, 'short', false)).toBe('L2//REL A, B');
    expect(getMaxClassification('L0', 'L1//REL A', c12nDef, 'long', false)).toBe('LEVEL 1//REL TO GROUP A');
    expect(getMaxClassification('L0//REL A, B', 'L1//REL A, B', c12nDef, 'short', false)).toBe('L1//REL A, B');
    expect(getMaxClassification('L0//REL A, B', 'L0//REL A', c12nDef, 'long', false)).toBe('LEVEL 0//REL TO GROUP A');
    expect(getMaxClassification('L0//REL B', 'L0//REL B, A', c12nDef, 'long', false)).toBe('LEVEL 0//REL TO GROUP B');
  });

  it('Should return the higher level and merge all groups and subgroups when valid', () => {
    expect(getMaxClassification('L0//R1/R2', 'L0', c12nDef, 'short', false)).toBe('L0//XX/R1/R2');
    expect(getMaxClassification('L0//R1', 'L0', c12nDef, 'long', false)).toBe('LEVEL 0//RESERVE ONE');
    expect(getMaxClassification('L0//R1/R2', 'L1//R1/R2', c12nDef, 'short', false)).toBe('L1//XX/R1/R2');
    expect(getMaxClassification('L0//R1/R2', 'L0//R1', c12nDef, 'long', false)).toBe('LEVEL 0//XX/RESERVE ONE');
  });

  it('Should return the higher level and merge all required, groups and subgroups when valid', () => {
    expect(getMaxClassification('L0//R1/R2', 'L1//LE', c12nDef, 'short', false)).toBe('L1//LE//XX/R1/R2');
    expect(getMaxClassification('L0//R1/R2', 'L1//LE', c12nDef, 'long', false)).toBe(
      'LEVEL 1//LEGAL DEPARTMENT//XX/RESERVE ONE/RESERVE TWO'
    );
  });

  it('Should raise an error? on invalid group combinations', () => {
    expect(getMaxClassification('L0//REL B', 'L0//REL A', c12nDef, 'short', false)).toBe('?');
    expect(getMaxClassification('L0//REL B', 'L0//REL A', c12nDef, 'long', false)).toBe('?');
  });
});

describe('`applyClassificationRules` should correctly identify incorrect combinations', () => {
  it('Should return disabled when conflicting groups are found', () => {
    let parts = getParts('L0//REL GROUP A/R3', c12nDef, 'long', false);
    let result = applyClassificationRules(parts, c12nDef, 'short', false);
    expect(result.disabled).toEqual({ groups: ['R1'], levels: [] });
    expect(result.parts).toEqual({ lvl: 'L0', lvlIdx: '1', req: [], groups: ['A'], subgroups: [] });
  });
});
