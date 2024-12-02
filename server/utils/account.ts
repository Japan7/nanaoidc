import {
  type RESTGetAPICurrentUserResult,
  type RESTGetCurrentUserGuildMemberResult,
} from "discord-api-types/v10";
import Redis from "ioredis";
import assert from "node:assert/strict";
import {
  type AccountClaims,
  type FindAccount,
  type Account as OidcAccount,
} from "oidc-provider";

export interface UserInfos {
  user: RESTGetAPICurrentUserResult;
  member: RESTGetCurrentUserGuildMemberResult;
}

const client = new Redis(userConfig.redisUrl, { keyPrefix: "discord:" });

function userKeyFor(id: string) {
  return `user:${id}`;
}

export class Account implements OidcAccount {
  [key: string]: unknown;

  constructor(public accountId: string) {}

  async getInfos(): Promise<UserInfos> {
    const data = await client.get(userKeyFor(this.accountId));
    assert(data !== null);
    return JSON.parse(data);
  }

  claims: OidcAccount["claims"] = async (use, scope, claims, rejected) => {
    const { user, member } = await this.getInfos();

    const scopeSet = new Set(scope.split(" "));
    // TODO: manage claims and rejected

    let result: AccountClaims = {
      sub: user.email,
    };

    if (scopeSet.has("profile")) {
      let picture: string;
      if (member.avatar) {
        picture = `https://cdn.discordapp.com/guilds/${userConfig.discord.guildId}/users/${user.id}/avatars/${member.avatar}.webp`;
      } else if (user.avatar) {
        picture = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`;
      }
      result = {
        ...result,
        birthdate: undefined,
        family_name: undefined,
        gender: undefined,
        given_name: undefined,
        locale: user.locale,
        middle_name: undefined,
        name: user.global_name,
        nickname: member.nick,
        picture,
        preferred_username: user.username,
        profile: undefined,
        updated_at: undefined,
        website: undefined,
        zoneinfo: undefined,
        discord_id: user.id,
      };
    }

    if (scopeSet.has("email")) {
      result = {
        ...result,
        email: user.email,
        email_verified: user.verified,
      };
    }

    if (scopeSet.has("groups")) {
      const groups = [userConfig.baseGroup];
      for (const role of member.roles) {
        const mapped = userConfig.discord.roles[role];
        if (mapped) {
          groups.push(mapped);
        }
      }
      result = { ...result, groups };
    }

    return result;
  };

  static async save(infos: UserInfos) {
    assert(infos.user.id === infos.member.user.id);
    await client.set(userKeyFor(infos.user.id), JSON.stringify(infos));
  }

  static findAccount: FindAccount = async (ctx, sub, token) => {
    return new this(sub);
  };
}
