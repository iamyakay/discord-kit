# discord-utils

A family of small, well-typed utility packages for Discord bot developers. Every package is library-agnostic, has zero runtime dependencies, and works identically in Node and Python.

## Packages

| Package | Description |
|---------|-------------|
| [perms](packages/perms) | Permission bitwise operations, role hierarchy, channel overwrite resolution, and explanations |

More packages coming soon: retry, log, env, guard.

## Install

Node:
```bash
npm install @iamyakay/perms
```

Python:
```bash
pip install iamyakay-perms
```

## Why these exist

Discord bot libraries handle the protocol, but they don't solve common problems like permission math, rate limit backoff, secret redaction, or config validation. These packages do one thing each and do it without pulling in dependencies.

Built for discord.js, discord.py, py-cord, nextcord, Eris, or raw API calls. If you have the JSON from Discord's API, these work.

## Development

```bash
pnpm install
cd packages/perms/node && pnpm test
cd packages/perms/python && python -m pytest
```

## License

MIT
