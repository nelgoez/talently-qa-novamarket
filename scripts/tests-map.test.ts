import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';

import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';

import {
  computeGaps,
  groupByLabel,
  loadTrelloTree,
  parseCard,
  parseCheckItems,
  parseHeaderField,
  sectionOf,
} from './tests-map.ts';

// ============================================================================
// FIXTURE BUILDERS — synthetic card.md in the exact shape formatCardMarkdown
// (sync-trello.ts) writes. Deliberately NOT the live board cache, which changes
// on every sync.
// ============================================================================

function cardMd(over: {
  title?: string
  number?: number
  slug?: string
  labels?: string
  list?: string
  checklist?: boolean
  complete?: string[]
} = {}): string {
  const lines = [
    `# ${over.title ?? 'Definir alcance UX/UI'}`,
    '',
    `**Trello Card:** ${over.number ?? 9}`,
    `**Slug:** ${over.slug ?? 'QA-9'}`,
    '**Short URL:** https://trello.com/c/abc123',
    `**List:** ${over.list ?? 'En curso'}`,
    `**Labels:** ${over.labels ?? 'Qa'}`,
    '',
    '---',
    '',
    '## Description',
    '',
    'desc here',
    '',
    '## Checklists',
    '',
  ];
  if (over.checklist === false) {
    lines.push('_No checklists — acceptance criteria not yet defined._');
  }
  else {
    lines.push('### AC', '');
    lines.push(`- [${over.complete?.includes('item1') ? 'x' : ' '}] (item1) First AC`);
    lines.push(`- [${over.complete?.includes('item2') ? 'x' : ' '}] (item2) Second AC`);
  }
  lines.push('', '## Attachments', '', '_None._');
  return lines.join('\n');
}

describe('parseHeaderField', () => {
  test('extracts a bold-label header line', () => {
    expect(parseHeaderField('**Labels:** Qa\n', 'Labels')).toBe('Qa');
  });

  test('returns null when the label is absent', () => {
    expect(parseHeaderField('# Title\n\nbody', 'Labels')).toBeNull();
  });

  test('does not match the label mid-line', () => {
    expect(parseHeaderField('see **Labels:** ok', 'Labels')).toBeNull();
  });
});

describe('sectionOf', () => {
  test('returns the body of a h2 section', () => {
    const content = '## Description\n\nhello\n\n## Checklists\n\nitems';
    expect(sectionOf(content, 'Description')).toBe('hello');
  });

  test('does not leak into a following h3 subsection', () => {
    const content = '## Checklists\n\n### AC\n\n- [ ] (x) y';
    expect(sectionOf(content, 'Checklists')).toContain('### AC');
  });

  test('returns empty string when the section is absent', () => {
    expect(sectionOf('## Description\n\nbody', 'Comments')).toBe('');
  });
});

describe('parseCard', () => {
  test('parses the generated card header', () => {
    const parsed = parseCard(cardMd({ number: 9, slug: 'QA-9', labels: 'Qa, Front' }), '9-card.md');
    expect(parsed.key).toBe('QA-9');
    expect(parsed.number).toBe(9);
    expect(parsed.title).toBe('Definir alcance UX/UI');
    expect(parsed.labels).toEqual(['Qa', 'Front']);
    expect(parsed.url).toContain('https://trello.com/c/');
  });

  test('"None" labels normalize to an empty list', () => {
    expect(parseCard(cardMd({ labels: 'None' }), '9-card.md').labels).toEqual([]);
  });

  test('falls back to the filename number on a degenerate card', () => {
    const parsed = parseCard('just prose, no headers', '42-mystery.md');
    expect(parsed.number).toBe(42);
    expect(parsed.key).toBe('42');
    expect(parsed.title).toBe('42-mystery');
    expect(parsed.labels).toEqual([]);
  });
});

describe('parseCheckItems', () => {
  test('parses item id, name, and complete state', () => {
    const items = parseCheckItems(cardMd({ complete: ['item1'] }));
    expect(items).toEqual([
      { id: 'item1', name: 'First AC', complete: true },
      { id: 'item2', name: 'Second AC', complete: false },
    ]);
  });

  test('returns an empty list when there is no checklist', () => {
    expect(parseCheckItems(cardMd({ checklist: false }))).toEqual([]);
  });

  test('ignores checkbox-like lines outside the Checklists section', () => {
    const content = '## Description\n\n- [x] (nope) not an AC\n\n## Checklists\n\n- [ ] (real) an AC';
    expect(parseCheckItems(content)).toEqual([{ id: 'real', name: 'an AC', complete: false }]);
  });
});

// ============================================================================
// TREE LOADING + GAPS — synthetic cache in a tmpdir
// ============================================================================

function buildSyntheticTree(): string {
  const root = mkdtempSync(join(tmpdir(), 'tests-map-trello-'));
  mkdirSync(join(root, 'por-hacer'), { recursive: true });
  mkdirSync(join(root, 'en-curso'), { recursive: true });
  mkdirSync(join(root, 'finalizada'), { recursive: true }); // empty list

  writeFileSync(join(root, 'por-hacer', '2-card.md'), cardMd({ title: 'Relevar vistas', number: 2, slug: 'FRONT-2', labels: 'Front', list: 'Por hacer', complete: ['item1', 'item2'] }));
  writeFileSync(join(root, 'en-curso', '9-card.md'), cardMd({ title: 'Definir alcance UX', number: 9, slug: 'QA-9', labels: 'Qa', list: 'En curso', complete: ['item1'] }));
  writeFileSync(join(root, 'en-curso', '10-card.md'), cardMd({ title: 'Sin ACs', number: 10, slug: '10', labels: 'None', list: 'En curso', checklist: false }));

  // The empty list has no card.md, so its real name is recovered from board.md.
  writeFileSync(join(root, 'board.md'), [
    '# Trello Board Mirror',
    '',
    '## Lists',
    '',
    '- Por hacer (1 cards)',
    '- En curso (2 cards)',
    '- Finalizada (0 cards)',
    '',
  ].join('\n'));

  return root;
}

describe('loadTrelloTree + computeGaps', () => {
  const root = buildSyntheticTree();
  const model = loadTrelloTree(root);
  if (!model) { throw new Error('synthetic tree failed to load'); }
  const gaps = computeGaps(model);

  test('materializes the List -> Card hierarchy', () => {
    expect(model.lists.map(l => l.name)).toEqual(['En curso', 'Finalizada', 'Por hacer']);
    const enCurso = model.lists[0];
    expect(enCurso.cards.map(c => c.key)).toEqual(['10', 'QA-9']);
  });

  test('resolves the list name from the card header, not the slugified dir name', () => {
    const porHacer = model.lists.find(l => l.name === 'Por hacer');
    expect(porHacer?.cards.map(c => c.title)).toEqual(['Relevar vistas']);
  });

  test('parses checklist items per card', () => {
    const qa9 = model.lists[0].cards.find(c => c.key === 'QA-9');
    expect(qa9?.checkItems.map(i => i.id)).toEqual(['item1', 'item2']);
    expect(qa9?.checkItems.filter(i => i.complete)).toHaveLength(1);
  });

  test('records the repo-relative POSIX path of each card file', () => {
    const card = model.lists[0].cards.find(c => c.key === 'QA-9');
    expect(card?.relPath).toBe('en-curso/9-card.md');
  });

  test('flags the card with no checklist items (no ACs)', () => {
    expect(gaps.cardsWithoutAc.map(c => c.key)).toEqual(['10']);
  });

  test('flags the card with no label', () => {
    expect(gaps.cardsWithoutLabels.map(c => c.key)).toEqual(['10']);
  });

  test('flags the empty list', () => {
    expect(gaps.listsWithoutCards.map(l => l.name)).toEqual(['Finalizada']);
  });

  test('groupByLabel pins the unlabeled bucket first', () => {
    const groups = groupByLabel(model.lists.flatMap(l => l.cards));
    expect([...groups.keys()][0]).toBe('(no label)');
    expect(groups.get('Qa')?.map(c => c.key)).toEqual(['QA-9']);
  });

  rmSync(root, { recursive: true, force: true });
});

describe('loadTrelloTree on an empty or absent tree', () => {
  test('an absent root yields null, not a throw', () => {
    expect(loadTrelloTree(join(tmpdir(), 'tests-map-does-not-exist'))).toBeNull();
  });

  test('a hollow tree (only templates/) yields null', () => {
    const root = mkdtempSync(join(tmpdir(), 'tests-map-hollow-'));
    mkdirSync(join(root, 'templates'), { recursive: true });
    expect(loadTrelloTree(root)).toBeNull();
    rmSync(root, { recursive: true, force: true });
  });
});
