import { describe, expect, it } from 'vitest';
import { type TreeNodeValueParam, createTreeNodeValue } from '../../src/core/treeNodeValue';

describe('treeNodeValue parsing', () => {
  it('parses dynamic routes [id]', () => {
    const nodeValue = createTreeNodeValue('[id]');
    expect(nodeValue.isParam()).toBe(true);
    const param = nodeValue as TreeNodeValueParam;
    expect(param.pathParams[0].paramName).toBe('id');
    expect(param.pathParams[0].isSplat).toBe(false);
    expect(param.pathSegment).toBe(':id');
  });

  it('parses catch-all routes [...path]', () => {
    const nodeValue = createTreeNodeValue('[...path]');
    expect(nodeValue.isParam()).toBe(true);
    const param = nodeValue as TreeNodeValueParam;
    expect(param.pathParams[0].paramName).toBe('path');
    expect(param.pathParams[0].isSplat).toBe(true);
    expect(param.pathSegment).toBe(':path(.*)');
  });

  it('parses optional routes [[id]]', () => {
    const nodeValue = createTreeNodeValue('[[id]]');
    expect(nodeValue.isParam()).toBe(true);
    const param = nodeValue as TreeNodeValueParam;
    expect(param.pathParams[0].paramName).toBe('id');
    expect(param.pathParams[0].optional).toBe(true);
    expect(param.pathSegment).toBe(':id?');
  });

  it('keeps custom regex for raw path params', () => {
    const nodeValue = createTreeNodeValue(':id(\\d+)', undefined, { format: 'path' });
    expect(nodeValue.isParam()).toBe(true);
    const param = nodeValue as TreeNodeValueParam;
    expect(param.pathParams[0].paramName).toBe('id');
    expect(param.pathParams[0].regexp).toBe('\\d+');
    expect(param.re).toBe('(\\d+)');
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

  it('caches overrides between accesses', () => {
    const node = createTreeNodeValue('test');
    node.setOverride('file1', { path: '/override1' });
    const first = node.overrides;
    const second = node.overrides;
    expect(first).toBe(second);
    expect(first.path).toBe('/override1');
  });

  it('invalidates overrides cache on setOverride', () => {
    const node = createTreeNodeValue('test');
    node.setOverride('file1', { path: '/first' });
    expect(node.overrides.path).toBe('/first');
    node.setOverride('file2', { path: '/second' });
    expect(node.overrides.path).toBe('/second');
  });

  it('invalidates overrides cache on mergeOverride', () => {
    const node = createTreeNodeValue('test');
    node.setOverride('file1', { path: '/first' });
    node.mergeOverride('file1', { meta: { key: 'value' } });
    expect(node.overrides.meta).toEqual({ key: 'value' });
  });

  it('invalidates overrides cache on removeOverride', () => {
    const node = createTreeNodeValue('test');
    node.setOverride('file1', { path: '/first', name: 'testName' } as any);
    expect(node.overrides.name).toBe('testName');
    node.removeOverride('name');
    expect(node.overrides.name).toBeUndefined();
  });

  it('invalidates overrides cache on deleteOverride', () => {
    const node = createTreeNodeValue('test');
    node.setOverride('file1', { path: '/first', name: 'firstName' } as any);
    node.setOverride('file2', { path: '/second', name: 'secondName' } as any);
    expect(node.overrides.name).toBe('secondName');
    node.deleteOverride('file2');
    expect(node.overrides.name).toBe('firstName');
  });

  it('caches re and score for param nodes', () => {
    const node = createTreeNodeValue(':id', undefined, { format: 'path' });
    expect(node.isParam()).toBe(true);
    const param = node as TreeNodeValueParam;
    expect(param.re).toBe('([^/]+?)');
    // Verify cache returns same value
    expect(param.re).toBe('([^/]+?)');
    const s1 = param.score;
    const s2 = param.score;
    expect(s1).toEqual(s2);
  });
});
