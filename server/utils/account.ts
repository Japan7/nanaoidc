import {
  type RESTGetAPICurrentUserResult,
  type RESTGetCurrentUserGuildMemberResult,
  type Snowflake,
} from "discord-api-types/v10";
import {
  type AccountClaims,
  type FindAccount,
  type Account as OidcAccount,
} from "oidc-provider";

export interface UserInfos {
  user: RESTGetAPICurrentUserResult;
  member: RESTGetCurrentUserGuildMemberResult;
}

export const userStore = new Map<Snowflake, UserInfos>();

export class Account implements OidcAccount {
  [key: string]: unknown;

  constructor(public accountId: string) {}

  get infos(): UserInfos {
    return userStore.get(this.accountId);
  }

  claims: OidcAccount["claims"] = async (use, scope, claims, rejected) => {
    const scopeSet = new Set(scope.split(" "));
    // TODO: manage claims and rejected

    let result: AccountClaims = {
      sub: this.infos.user.email,
    };

    if (scopeSet.has("profile")) {
      let picture: string;
      if (this.infos.member.avatar) {
        picture = `https://cdn.discordapp.com/guilds/${userConfig.discord.guildId}/users/${this.infos.user.id}/avatars/${this.infos.member.avatar}.webp`;
      } else if (this.infos.user.avatar) {
        picture = `https://cdn.discordapp.com/avatars/${this.infos.user.id}/${this.infos.user.avatar}.webp`;
      }
      result = {
        ...result,
        birthdate: undefined,
        family_name: undefined,
        gender: undefined,
        given_name: undefined,
        locale: this.infos.user.locale,
        middle_name: undefined,
        name: this.infos.user.global_name,
        nickname: this.infos.member.nick,
        picture,
        preferred_username: this.infos.user.username,
        profile: undefined,
        updated_at: undefined,
        website: undefined,
        zoneinfo: undefined,
      };
    }

    if (scopeSet.has("email")) {
      result = {
        ...result,
        email: this.infos.user.email,
        email_verified: this.infos.user.verified,
      };
    }

    if (scopeSet.has("groups")) {
      const groups = [userConfig.baseGroup];
      for (const role of this.infos.member.roles) {
        const mapped = userConfig.discord.roles[role];
        if (mapped) {
          groups.push(mapped);
        }
      }
      result = { ...result, groups };
    }

    return result;
  };

  static findAccount: FindAccount = async (ctx, sub, token) => {
    return new this(sub);
  };
}
