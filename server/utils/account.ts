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
        picture: undefined,
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
      result = {
        ...result,
        groups: this.infos.member.roles,
      };
    }

    return result;
  };

  static findAccount: FindAccount = async (ctx, sub, token) => {
    return new this(sub);
  };
}
