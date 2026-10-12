export type Permission = string;
export type Permissions = bigint;

export interface Role {
  id: string;
  name: string;
  permissions: string;
  position: number;
}

export interface Member {
  user: { id: string };
  roles: string[];
}

export interface PermissionOverwrite {
  id: string;
  type: 0 | 1;
  allow: string;
  deny: string;
}

export interface Channel {
  id: string;
  guild_id: string;
  permission_overwrites?: PermissionOverwrite[];
}

export interface Guild {
  id: string;
  owner_id: string;
  roles: Role[];
}

export interface ExplainResult {
  allowed: boolean;
  reason: string;
}

export interface InviteOptions {
  permissions?: Permission[];
  scopes?: string[];
  guildId?: string;
  disableGuildSelect?: boolean;
}

const PERMISSIONS: Record<string, bigint> = {
  CREATE_INSTANT_INVITE: 1n << 0n,
  KICK_MEMBERS: 1n << 1n,
  BAN_MEMBERS: 1n << 2n,
  ADMINISTRATOR: 1n << 3n,
  MANAGE_CHANNELS: 1n << 4n,
  MANAGE_GUILD: 1n << 5n,
  ADD_REACTIONS: 1n << 6n,
  VIEW_AUDIT_LOG: 1n << 7n,
  PRIORITY_SPEAKER: 1n << 8n,
  STREAM: 1n << 9n,
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  SEND_TTS_MESSAGES: 1n << 12n,
  MANAGE_MESSAGES: 1n << 13n,
  EMBED_LINKS: 1n << 14n,
  ATTACH_FILES: 1n << 15n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  MENTION_EVERYONE: 1n << 17n,
  USE_EXTERNAL_EMOJIS: 1n << 18n,
  VIEW_GUILD_INSIGHTS: 1n << 19n,
  CONNECT: 1n << 20n,
  SPEAK: 1n << 21n,
  MUTE_MEMBERS: 1n << 22n,
  DEAFEN_MEMBERS: 1n << 23n,
  MOVE_MEMBERS: 1n << 24n,
  USE_VAD: 1n << 25n,
  CHANGE_NICKNAME: 1n << 26n,
  MANAGE_NICKNAMES: 1n << 27n,
  MANAGE_ROLES: 1n << 28n,
  MANAGE_WEBHOOKS: 1n << 29n,
  MANAGE_GUILD_EXPRESSIONS: 1n << 30n,
  USE_APPLICATION_COMMANDS: 1n << 31n,
  REQUEST_TO_SPEAK: 1n << 32n,
  MANAGE_EVENTS: 1n << 33n,
  MANAGE_THREADS: 1n << 34n,
  CREATE_PUBLIC_THREADS: 1n << 35n,
  CREATE_PRIVATE_THREADS: 1n << 36n,
  USE_EXTERNAL_STICKERS: 1n << 37n,
  SEND_MESSAGES_IN_THREADS: 1n << 38n,
  USE_EMBEDDED_ACTIVITIES: 1n << 39n,
  MODERATE_MEMBERS: 1n << 40n,
  VIEW_CREATOR_MONETIZATION_ANALYTICS: 1n << 41n,
  USE_SOUNDBOARD: 1n << 42n,
  CREATE_GUILD_EXPRESSIONS: 1n << 43n,
  CREATE_EVENTS: 1n << 44n,
  USE_EXTERNAL_SOUNDS: 1n << 45n,
  SEND_VOICE_MESSAGES: 1n << 46n,
  SEND_POLLS: 1n << 49n,
  USE_EXTERNAL_APPS: 1n << 50n,
};

export function decode(permissions: Permissions): Permission[] {
  const result: Permission[] = [];
  for (const [name, value] of Object.entries(PERMISSIONS)) {
    if ((permissions & value) === value) {
      result.push(name);
    }
  }
  return result;
}

export function encode(permissions: Permission[]): Permissions {
  let result = 0n;
  for (const perm of permissions) {
    const value = PERMISSIONS[perm];
    if (value === undefined) {
      throw new Error(`unknown permission: ${perm}`);
    }
    result |= value;
  }
  return result;
}

export function has(permissions: Permissions, permission: Permission): boolean {
  const value = PERMISSIONS[permission];
  if (value === undefined) {
    throw new Error(`unknown permission: ${permission}`);
  }
  return (permissions & value) === value;
}

export function add(permissions: Permissions, ...toAdd: Permission[]): Permissions {
  let result = permissions;
  for (const perm of toAdd) {
    const value = PERMISSIONS[perm];
    if (value === undefined) {
      throw new Error(`unknown permission: ${perm}`);
    }
    result |= value;
  }
  return result;
}

export function remove(permissions: Permissions, ...toRemove: Permission[]): Permissions {
  let result = permissions;
  for (const perm of toRemove) {
    const value = PERMISSIONS[perm];
    if (value === undefined) {
      throw new Error(`unknown permission: ${perm}`);
    }
    result &= ~value;
  }
  return result;
}

export function canManageRole(
  actor: Member,
  target: Role,
  guild: Guild,
  botMember?: Member
): boolean {
  if (actor.user.id === guild.owner_id) {
    return true;
  }

  const actorRoles = guild.roles.filter(r => actor.roles.includes(r.id));
  const actorTopRole = actorRoles.reduce((top, r) =>
    r.position > top.position ? r : top
  , { position: 0 } as Role);

  if (actorTopRole.position <= target.position) {
    return false;
  }

  if (botMember) {
    const botRoles = guild.roles.filter(r => botMember.roles.includes(r.id));
    const botTopRole = botRoles.reduce((top, r) =>
      r.position > top.position ? r : top
    , { position: 0 } as Role);

    if (botTopRole.position <= target.position) {
      return false;
    }
  }

  return true;
}

export function resolve(
  member: Member,
  channel: Channel,
  guild: Guild
): Permissions {
  if (member.user.id === guild.owner_id) {
    return Object.values(PERMISSIONS).reduce((acc, v) => acc | v, 0n);
  }

  const memberRoles = guild.roles.filter(r => member.roles.includes(r.id));
  let base = 0n;

  for (const role of memberRoles) {
    base |= BigInt(role.permissions);
  }

  if (has(base, 'ADMINISTRATOR')) {
    return base;
  }

  if (!channel.permission_overwrites) {
    return base;
  }

  const everyoneOverwrite = channel.permission_overwrites.find(
    o => o.id === guild.id && o.type === 0
  );
  if (everyoneOverwrite) {
    base &= ~BigInt(everyoneOverwrite.deny);
    base |= BigInt(everyoneOverwrite.allow);
  }

  let roleAllow = 0n;
  let roleDeny = 0n;
  for (const overwrite of channel.permission_overwrites) {
    if (overwrite.type === 0 && member.roles.includes(overwrite.id)) {
      roleAllow |= BigInt(overwrite.allow);
      roleDeny |= BigInt(overwrite.deny);
    }
  }
  base &= ~roleDeny;
  base |= roleAllow;

  const memberOverwrite = channel.permission_overwrites.find(
    o => o.id === member.user.id && o.type === 1
  );
  if (memberOverwrite) {
    base &= ~BigInt(memberOverwrite.deny);
    base |= BigInt(memberOverwrite.allow);
  }

  if (base !== 0n && !has(base, 'VIEW_CHANNEL')) {
    return 0n;
  }

  return base;
}

export function explain(
  member: Member,
  channel: Channel,
  guild: Guild,
  permission: Permission
): ExplainResult {
  if (!PERMISSIONS[permission]) {
    return {
      allowed: false,
      reason: `unknown permission: ${permission}`
    };
  }

  if (member.user.id === guild.owner_id) {
    return {
      allowed: true,
      reason: 'guild owner'
    };
  }

  const memberRoles = guild.roles.filter(r => member.roles.includes(r.id));
  let base = 0n;

  for (const role of memberRoles) {
    base |= BigInt(role.permissions);
  }

  if (has(base, 'ADMINISTRATOR')) {
    return {
      allowed: true,
      reason: 'administrator permission'
    };
  }

  const permValue = PERMISSIONS[permission];

  if (!channel.permission_overwrites) {
    return {
      allowed: (base & permValue) === permValue,
      reason: (base & permValue) === permValue ? 'role permissions' : 'missing role permission'
    };
  }

  const everyoneOverwrite = channel.permission_overwrites.find(
    o => o.id === guild.id && o.type === 0
  );
  if (everyoneOverwrite) {
    const deny = BigInt(everyoneOverwrite.deny);
    const allow = BigInt(everyoneOverwrite.allow);

    if ((deny & permValue) === permValue) {
      base &= ~permValue;
    }
    if ((allow & permValue) === permValue) {
      base |= permValue;
    }
  }

  let roleAllow = 0n;
  let roleDeny = 0n;
  let denyingRole: Role | undefined;
  let allowingRole: Role | undefined;

  for (const overwrite of channel.permission_overwrites) {
    if (overwrite.type === 0 && member.roles.includes(overwrite.id)) {
      const deny = BigInt(overwrite.deny);
      const allow = BigInt(overwrite.allow);

      if ((deny & permValue) === permValue) {
        roleDeny |= permValue;
        denyingRole = guild.roles.find(r => r.id === overwrite.id);
      }
      if ((allow & permValue) === permValue) {
        roleAllow |= permValue;
        allowingRole = guild.roles.find(r => r.id === overwrite.id);
      }
    }
  }

  base &= ~roleDeny;
  base |= roleAllow;

  const memberOverwrite = channel.permission_overwrites.find(
    o => o.id === member.user.id && o.type === 1
  );
  if (memberOverwrite) {
    const deny = BigInt(memberOverwrite.deny);
    const allow = BigInt(memberOverwrite.allow);

    if ((deny & permValue) === permValue) {
      return {
        allowed: false,
        reason: 'denied by member overwrite'
      };
    }
    if ((allow & permValue) === permValue) {
      base |= permValue;
    }
  }

  const viewChannelValue = PERMISSIONS.VIEW_CHANNEL;
  const hasViewChannel = (base & viewChannelValue) === viewChannelValue;

  if (!hasViewChannel && permission !== 'VIEW_CHANNEL') {
    return {
      allowed: false,
      reason: 'missing VIEW_CHANNEL'
    };
  }

  const allowed = (base & permValue) === permValue;

  if (!allowed && denyingRole) {
    return {
      allowed: false,
      reason: `denied by channel overwrite on role ${denyingRole.name}`
    };
  }

  if (allowed && allowingRole) {
    return {
      allowed: true,
      reason: `allowed by channel overwrite on role ${allowingRole.name}`
    };
  }

  return {
    allowed,
    reason: allowed ? 'role permissions' : 'missing role permission'
  };
}

export function inviteUrl(clientId: string, options: InviteOptions = {}): string {
  const params = new URLSearchParams();
  params.set('client_id', clientId);

  if (options.permissions) {
    const perms = encode(options.permissions);
    params.set('permissions', perms.toString());
  }

  const scopes = options.scopes || ['bot', 'applications.commands'];
  params.set('scope', scopes.join(' '));

  if (options.guildId) {
    params.set('guild_id', options.guildId);
  }

  if (options.disableGuildSelect) {
    params.set('disable_guild_select', 'true');
  }

  return `https://discord.com/api/oauth2/authorize?${params}`;
}
