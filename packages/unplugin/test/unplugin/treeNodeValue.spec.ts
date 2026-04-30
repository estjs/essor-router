import { describe, expect, it } from 'vitest';
import { createTreeNodeValue } from '../../src/core/treeNodeValue';

describe('treeNodeValue parsing', () => {
  it('parses dynamic routes [id]', () => {
    const nodeValue = createTreeNodeValue('[id]');
    expect(nodeValue.isParam()).toBe(true);
    if (nodeValue.isParam()) {
      expect(nodeValue.pathParams[0].paramName).toBe('id');
      expect(nodeValue.pathParams[0].isSplat).toBe(false);
      expect(nodeValue.pathSegment).toBe(':id');
    }
  });

  it('parses catch-all routes [...path]', () => {
    const nodeValue = createTreeNodeValue('[...path]');
    expect(nodeValue.isParam()).toBe(true);
    if (nodeValue.isParam()) {
      expect(nodeValue.pathParams[0].paramName).toBe('path');
      expect(nodeValue.pathParams[0].isSplat).toBe(true);
      expect(nodeValue.pathSegment).toBe(':path(.*)');
    }
  });

  it('parses optional routes [[id]]', () => {
    const nodeValue = createTreeNodeValue('[[id]]');
    expect(nodeValue.isParam()).toBe(true);
    if (nodeValue.isParam()) {
      expect(nodeValue.pathParams[0].paramName).toBe('id');
      expect(nodeValue.pathParams[0].optional).toBe(true);
      expect(nodeValue.pathSegment).toBe(':id?');
    }
  });

  it('keeps custom regex for raw path params', () => {
    const nodeValue = createTreeNodeValue(':id(\\d+)', undefined, { format: 'path' });
    expect(nodeValue.isParam()).toBe(true);
    if (nodeValue.isParam()) {
      expect(nodeValue.pathParams[0].paramName).toBe('id');
      expect(nodeValue.pathParams[0].regexp).toBe('\\d+');
      expect(nodeValue.re).toBe('(\\d+)');
    }
  });

  it('rejects invalid custom regex in raw path params', () => {
    expect(() => createTreeNodeValue(':id([a-', undefined, { format: 'path' })).toThrow(
      'Invalid segment',
    );
  });

  it('rejects repeatable raw path params mixed with static sub-segments', () => {
    expect(() => createTreeNodeValue(':ids+-tail', undefined, { format: 'path' })).toThrow(
      'must be alone in its segment',
    );
  });
});
