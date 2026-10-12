from typing import Literal, TypedDict

Permission = str
Permissions = int


class Role(TypedDict):
    id: str
    name: str
    permissions: str
    position: int


class User(TypedDict):
    id: str


class Member(TypedDict):
    user: User
    roles: list[str]


class PermissionOverwrite(TypedDict):
    id: str
    type: Literal[0, 1]
    allow: str
    deny: str


class Channel(TypedDict):
    id: str
    guild_id: str
    permission_overwrites: list[PermissionOverwrite] | None


class Guild(TypedDict):
    id: str
    owner_id: str
    roles: list[Role]


class ExplainResult(TypedDict):
    allowed: bool
    reason: str


class InviteOptions(TypedDict, total=False):
    permissions: list[Permission]
    scopes: list[str]
    guild_id: str
    disable_guild_select: bool


PERMISSIONS: dict[str, int] = {
    "CREATE_INSTANT_INVITE": 1 << 0,
    "KICK_MEMBERS": 1 << 1,
    "BAN_MEMBERS": 1 << 2,
    "ADMINISTRATOR": 1 << 3,
    "MANAGE_CHANNELS": 1 << 4,
    "MANAGE_GUILD": 1 << 5,
    "ADD_REACTIONS": 1 << 6,
    "VIEW_AUDIT_LOG": 1 << 7,
    "PRIORITY_SPEAKER": 1 << 8,
    "STREAM": 1 << 9,
    "VIEW_CHANNEL": 1 << 10,
    "SEND_MESSAGES": 1 << 11,
    "SEND_TTS_MESSAGES": 1 << 12,
    "MANAGE_MESSAGES": 1 << 13,
    "EMBED_LINKS": 1 << 14,
    "ATTACH_FILES": 1 << 15,
    "READ_MESSAGE_HISTORY": 1 << 16,
    "MENTION_EVERYONE": 1 << 17,
    "USE_EXTERNAL_EMOJIS": 1 << 18,
    "VIEW_GUILD_INSIGHTS": 1 << 19,
    "CONNECT": 1 << 20,
    "SPEAK": 1 << 21,
    "MUTE_MEMBERS": 1 << 22,
    "DEAFEN_MEMBERS": 1 << 23,
    "MOVE_MEMBERS": 1 << 24,
    "USE_VAD": 1 << 25,
    "CHANGE_NICKNAME": 1 << 26,
    "MANAGE_NICKNAMES": 1 << 27,
    "MANAGE_ROLES": 1 << 28,
    "MANAGE_WEBHOOKS": 1 << 29,
    "MANAGE_GUILD_EXPRESSIONS": 1 << 30,
    "USE_APPLICATION_COMMANDS": 1 << 31,
    "REQUEST_TO_SPEAK": 1 << 32,
    "MANAGE_EVENTS": 1 << 33,
    "MANAGE_THREADS": 1 << 34,
    "CREATE_PUBLIC_THREADS": 1 << 35,
    "CREATE_PRIVATE_THREADS": 1 << 36,
    "USE_EXTERNAL_STICKERS": 1 << 37,
    "SEND_MESSAGES_IN_THREADS": 1 << 38,
    "USE_EMBEDDED_ACTIVITIES": 1 << 39,
    "MODERATE_MEMBERS": 1 << 40,
    "VIEW_CREATOR_MONETIZATION_ANALYTICS": 1 << 41,
    "USE_SOUNDBOARD": 1 << 42,
    "CREATE_GUILD_EXPRESSIONS": 1 << 43,
    "CREATE_EVENTS": 1 << 44,
    "USE_EXTERNAL_SOUNDS": 1 << 45,
    "SEND_VOICE_MESSAGES": 1 << 46,
    "SEND_POLLS": 1 << 49,
    "USE_EXTERNAL_APPS": 1 << 50,
}


def decode(permissions: Permissions) -> list[Permission]:
    result: list[Permission] = []
    for name, value in PERMISSIONS.items():
        if (permissions & value) == value:
            result.append(name)
    return result


def encode(permissions: list[Permission]) -> Permissions:
    result = 0
    for perm in permissions:
        value = PERMISSIONS.get(perm)
        if value is None:
            raise ValueError(f"unknown permission: {perm}")
        result |= value
    return result


def has(permissions: Permissions, permission: Permission) -> bool:
    value = PERMISSIONS.get(permission)
    if value is None:
        raise ValueError(f"unknown permission: {permission}")
    return (permissions & value) == value


def add(permissions: Permissions, *to_add: Permission) -> Permissions:
    result = permissions
    for perm in to_add:
        value = PERMISSIONS.get(perm)
        if value is None:
            raise ValueError(f"unknown permission: {perm}")
        result |= value
    return result


def remove(permissions: Permissions, *to_remove: Permission) -> Permissions:
    result = permissions
    for perm in to_remove:
        value = PERMISSIONS.get(perm)
        if value is None:
            raise ValueError(f"unknown permission: {perm}")
        result &= ~value
    return result


def can_manage_role(
    actor: Member, target: Role, guild: Guild, bot_member: Member | None = None
) -> bool:
    if actor["user"]["id"] == guild["owner_id"]:
        return True

    actor_roles = [r for r in guild["roles"] if r["id"] in actor["roles"]]
    actor_top_role = max(actor_roles, key=lambda r: r["position"], default={"position": 0})

    if actor_top_role["position"] <= target["position"]:
        return False

    if bot_member:
        bot_roles = [r for r in guild["roles"] if r["id"] in bot_member["roles"]]
        bot_top_role = max(bot_roles, key=lambda r: r["position"], default={"position": 0})

        if bot_top_role["position"] <= target["position"]:
            return False

    return True


def resolve(member: Member, channel: Channel, guild: Guild) -> Permissions:
    if member["user"]["id"] == guild["owner_id"]:
        return sum(PERMISSIONS.values())

    member_roles = [r for r in guild["roles"] if r["id"] in member["roles"]]
    base = 0

    for role in member_roles:
        base |= int(role["permissions"])

    if has(base, "ADMINISTRATOR"):
        return base

    overwrites = channel.get("permission_overwrites")
    if not overwrites:
        return base

    everyone_overwrite = next(
        (o for o in overwrites if o["id"] == guild["id"] and o["type"] == 0), None
    )
    if everyone_overwrite:
        base &= ~int(everyone_overwrite["deny"])
        base |= int(everyone_overwrite["allow"])

    role_allow = 0
    role_deny = 0
    for overwrite in overwrites:
        if overwrite["type"] == 0 and overwrite["id"] in member["roles"]:
            role_allow |= int(overwrite["allow"])
            role_deny |= int(overwrite["deny"])

    base &= ~role_deny
    base |= role_allow

    member_overwrite = next(
        (o for o in overwrites if o["id"] == member["user"]["id"] and o["type"] == 1), None
    )
    if member_overwrite:
        base &= ~int(member_overwrite["deny"])
        base |= int(member_overwrite["allow"])

    if base != 0 and not has(base, "VIEW_CHANNEL"):
        return 0

    return base


def explain(
    member: Member, channel: Channel, guild: Guild, permission: Permission
) -> ExplainResult:
    if permission not in PERMISSIONS:
        return {"allowed": False, "reason": f"unknown permission: {permission}"}

    if member["user"]["id"] == guild["owner_id"]:
        return {"allowed": True, "reason": "guild owner"}

    member_roles = [r for r in guild["roles"] if r["id"] in member["roles"]]
    base = 0

    for role in member_roles:
        base |= int(role["permissions"])

    if has(base, "ADMINISTRATOR"):
        return {"allowed": True, "reason": "administrator permission"}

    perm_value = PERMISSIONS[permission]

    overwrites = channel.get("permission_overwrites")
    if not overwrites:
        allowed = (base & perm_value) == perm_value
        reason = "role permissions" if allowed else "missing role permission"
        return {"allowed": allowed, "reason": reason}

    everyone_overwrite = next(
        (o for o in overwrites if o["id"] == guild["id"] and o["type"] == 0), None
    )
    if everyone_overwrite:
        deny = int(everyone_overwrite["deny"])
        allow = int(everyone_overwrite["allow"])

        if (deny & perm_value) == perm_value:
            base &= ~perm_value
        if (allow & perm_value) == perm_value:
            base |= perm_value

    role_allow = 0
    role_deny = 0
    denying_role: Role | None = None
    allowing_role: Role | None = None

    for overwrite in overwrites:
        if overwrite["type"] == 0 and overwrite["id"] in member["roles"]:
            deny = int(overwrite["deny"])
            allow = int(overwrite["allow"])

            if (deny & perm_value) == perm_value:
                role_deny |= perm_value
                role_id = overwrite["id"]
                denying_role = next((r for r in guild["roles"] if r["id"] == role_id), None)
            if (allow & perm_value) == perm_value:
                role_allow |= perm_value
                role_id = overwrite["id"]
                allowing_role = next((r for r in guild["roles"] if r["id"] == role_id), None)

    base &= ~role_deny
    base |= role_allow

    member_overwrite = next(
        (o for o in overwrites if o["id"] == member["user"]["id"] and o["type"] == 1), None
    )
    if member_overwrite:
        deny = int(member_overwrite["deny"])
        allow = int(member_overwrite["allow"])

        if (deny & perm_value) == perm_value:
            return {"allowed": False, "reason": "denied by member overwrite"}
        if (allow & perm_value) == perm_value:
            base |= perm_value

    view_channel_value = PERMISSIONS["VIEW_CHANNEL"]
    has_view_channel = (base & view_channel_value) == view_channel_value

    if not has_view_channel and permission != "VIEW_CHANNEL":
        return {"allowed": False, "reason": "missing VIEW_CHANNEL"}

    allowed = (base & perm_value) == perm_value

    if not allowed and denying_role:
        role_name = denying_role["name"]
        return {"allowed": False, "reason": f"denied by channel overwrite on role {role_name}"}

    if allowed and allowing_role:
        role_name = allowing_role["name"]
        return {"allowed": True, "reason": f"allowed by channel overwrite on role {role_name}"}

    reason = "role permissions" if allowed else "missing role permission"
    return {"allowed": allowed, "reason": reason}


def invite_url(client_id: str, options: InviteOptions | None = None) -> str:
    from typing import Any, cast
    from urllib.parse import urlencode

    if options is None:
        options = {}

    opts_any: dict[str, Any] = cast(dict[str, Any], options)
    params: dict[str, str] = {"client_id": client_id}

    if "permissions" in opts_any and opts_any["permissions"]:
        perms = encode(opts_any["permissions"])
        params["permissions"] = str(perms)

    scopes = opts_any.get("scopes", ["bot", "applications.commands"])
    params["scope"] = " ".join(scopes)

    guild_id = opts_any.get("guild_id") or opts_any.get("guildId")
    if guild_id:
        params["guild_id"] = str(guild_id)

    disable_select = opts_any.get("disable_guild_select") or opts_any.get("disableGuildSelect")
    if disable_select:
        params["disable_guild_select"] = "true"

    return f"https://discord.com/api/oauth2/authorize?{urlencode(params)}"


__all__ = [
    "Permission",
    "Permissions",
    "Role",
    "User",
    "Member",
    "PermissionOverwrite",
    "Channel",
    "Guild",
    "ExplainResult",
    "InviteOptions",
    "decode",
    "encode",
    "has",
    "add",
    "remove",
    "can_manage_role",
    "resolve",
    "explain",
    "invite_url",
]
