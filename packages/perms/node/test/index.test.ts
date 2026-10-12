import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  encode,
  decode,
  has,
  add,
  remove,
  canManageRole,
  resolve,
  explain,
  inviteUrl,
  type Member,
  type Channel,
  type Guild,
  type Role,
  type InviteOptions,
} from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const vectors = JSON.parse(
  readFileSync(join(__dirname, '../../../../shared/test-vectors/perms.json'), 'utf-8')
);

describe('encode', () => {
  for (const vector of vectors.encode) {
    it(`encodes ${vector.input.join(', ')}`, () => {
      expect(encode(vector.input).toString()).toBe(vector.output);
    });
  }

  it('throws on unknown permission', () => {
    expect(() => encode(['FAKE_PERMISSION'])).toThrow('unknown permission: FAKE_PERMISSION');
  });
});

describe('decode', () => {
  for (const vector of vectors.decode) {
    it(`decodes ${vector.input}`, () => {
      const result = decode(BigInt(vector.input));
      expect(result.sort()).toEqual(vector.output.sort());
    });
  }
});

describe('has', () => {
  for (const vector of vectors.has) {
    it(`${vector.permissions} has ${vector.permission}: ${vector.output}`, () => {
      expect(has(BigInt(vector.permissions), vector.permission)).toBe(vector.output);
    });
  }

  it('throws on unknown permission', () => {
    expect(() => has(0n, 'FAKE_PERMISSION')).toThrow('unknown permission: FAKE_PERMISSION');
  });
});

describe('add', () => {
  for (const vector of vectors.add) {
    it(`adds ${vector.toAdd.join(', ')} to ${vector.permissions}`, () => {
      expect(add(BigInt(vector.permissions), ...vector.toAdd).toString()).toBe(vector.output);
    });
  }

  it('throws on unknown permission', () => {
    expect(() => add(0n, 'FAKE_PERMISSION')).toThrow('unknown permission: FAKE_PERMISSION');
  });
});

describe('remove', () => {
  for (const vector of vectors.remove) {
    it(`removes ${vector.toRemove.join(', ')} from ${vector.permissions}`, () => {
      expect(remove(BigInt(vector.permissions), ...vector.toRemove).toString()).toBe(vector.output);
    });
  }

  it('throws on unknown permission', () => {
    expect(() => remove(0n, 'FAKE_PERMISSION')).toThrow('unknown permission: FAKE_PERMISSION');
  });
});

describe('canManageRole', () => {
  for (let i = 0; i < vectors.canManageRole.length; i++) {
    const vector = vectors.canManageRole[i];
    it(`case ${i + 1}: ${vector.output ? 'can' : 'cannot'} manage role`, () => {
      expect(canManageRole(
        vector.actor as Member,
        vector.target as Role,
        vector.guild as Guild
      )).toBe(vector.output);
    });
  }
});

describe('resolve', () => {
  for (let i = 0; i < vectors.resolve.length; i++) {
    const vector = vectors.resolve[i];
    it(`case ${i + 1}: resolves to ${vector.output}`, () => {
      expect(resolve(
        vector.member as Member,
        vector.channel as Channel,
        vector.guild as Guild
      ).toString()).toBe(vector.output);
    });
  }
});

describe('explain', () => {
  for (let i = 0; i < vectors.explain.length; i++) {
    const vector = vectors.explain[i];
    it(`case ${i + 1}: ${vector.output.reason}`, () => {
      const result = explain(
        vector.member as Member,
        vector.channel as Channel,
        vector.guild as Guild,
        vector.permission
      );
      expect(result).toEqual(vector.output);
    });
  }
});

describe('inviteUrl', () => {
  for (let i = 0; i < vectors.inviteUrl.length; i++) {
    const vector = vectors.inviteUrl[i];
    it(`case ${i + 1}: generates correct URL`, () => {
      expect(inviteUrl(vector.clientId, vector.options as InviteOptions)).toBe(vector.output);
    });
  }
});
