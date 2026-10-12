# perms

Discord permission math is annoying. This package handles the bitwise operations, role hierarchy checks, channel overwrite resolution, and permission explanations so you don't have to.

Works with any Discord library or raw API calls. Zero dependencies.

## Install

```bash
npm install @iamyakay/perms
```

```bash
pip install iamyakay-perms
```

## Usage

### Node

```typescript
import { encode, decode, resolve, explain, inviteUrl } from '@iamyakay/perms';

const perms = encode(['SEND_MESSAGES', 'VIEW_CHANNEL']);

const names = decode(3072n);

const channelPerms = resolve(member, channel, guild);

const result = explain(member, channel, guild, 'SEND_MESSAGES');

const url = inviteUrl('123456789', {
  permissions: ['SEND_MESSAGES', 'MANAGE_MESSAGES'],
  scopes: ['bot', 'applications.commands']
});
```

### Python

```python
from iamyakay_perms import encode, decode, resolve, explain, invite_url

perms = encode(['SEND_MESSAGES', 'VIEW_CHANNEL'])

names = decode(3072)

channel_perms = resolve(member, channel, guild)

result = explain(member, channel, guild, 'SEND_MESSAGES')

url = invite_url('123456789', {
  'permissions': ['SEND_MESSAGES', 'MANAGE_MESSAGES'],
  'scopes': ['bot', 'applications.commands']
})
```

## API

### decode(permissions)

Convert a permission integer to an array of permission names.

### encode(permissions)

Convert an array of permission names to an integer. Throws on unknown permission names.

### has(permissions, permission)

Check if a permission integer includes a specific permission.

### add(permissions, ...toAdd)

Add permissions to an integer.

### remove(permissions, ...toRemove)

Remove permissions from an integer.

### canManageRole(actor, target, guild, botMember?)

Check if a member can manage a role based on hierarchy. Handles guild owner bypass and optional bot hierarchy check.

### resolve(member, channel, guild)

Calculate a member's final permissions in a channel. Follows Discord's resolution order: base permissions, @everyone overwrite, role overwrites, member overwrite, with Administrator and owner bypass.

### explain(member, channel, guild, permission)

Returns why a permission is allowed or denied. Useful for debugging permission issues.

Returns `{ allowed: boolean, reason: string }` with reasons like "denied by channel overwrite on role Muted" or "administrator permission".

### inviteUrl(clientId, options?)

Build a bot invite URL with permissions and scopes.

Options: `permissions` (array of permission names), `scopes` (defaults to bot + applications.commands), `guildId`, `disableGuildSelect`.

## How it works

All functions accept plain objects shaped like Discord API payloads. No library coupling. Pass in the member, channel, and guild data you already have.

Permission values are strings in JSON since they exceed JavaScript's safe integer range. The library handles BigInt in Node and int in Python internally.

## Known issues

This doesn't validate that a permission is valid for a specific channel type. You can ask about CONNECT in a text channel and it'll tell you the member doesn't have it, which is technically true but not useful.
