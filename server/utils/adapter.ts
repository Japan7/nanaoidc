// https://github.com/panva/node-oidc-provider/blob/87cd3c5c335cb30074612b405bd581c6bc76a98d/example/adapters/redis.js
import Redis from "iovalkey";
import { isEmpty } from "lodash-es";
import type { Adapter, AdapterPayload } from "oidc-provider";

const client = new Redis(userConfig.redisUrl, { keyPrefix: "oidc:" });

const grantable = new Set([
  "AccessToken",
  "AuthorizationCode",
  "RefreshToken",
  "DeviceCode",
  "BackchannelAuthenticationRequest",
]);

const consumable = new Set([
  "AuthorizationCode",
  "RefreshToken",
  "DeviceCode",
  "BackchannelAuthenticationRequest",
]);

function grantKeyFor(id: string) {
  return `grant:${id}`;
}

function userCodeKeyFor(userCode: string) {
  return `userCode:${userCode}`;
}

function uidKeyFor(uid: string) {
  return `uid:${uid}`;
}

export class RedisAdapter implements Adapter {
  constructor(public name: string) {}

  key(id: string) {
    return `${this.name}:${id}`;
  }

  async upsert(id: string, payload: AdapterPayload, expiresIn: number) {
    const key = this.key(id);
    const store = consumable.has(this.name)
      ? { payload: JSON.stringify(payload) }
      : JSON.stringify(payload);

    const multi = client.multi();
    multi[consumable.has(this.name) ? "hmset" : "set"](key, store as any);

    if (expiresIn) {
      multi.expire(key, expiresIn);
    }

    if (grantable.has(this.name) && payload.grantId) {
      const grantKey = grantKeyFor(payload.grantId);
      multi.rpush(grantKey, key);
      // if you're seeing grant key lists growing out of acceptable proportions consider using LTRIM
      // here to trim the list to an appropriate length
      const ttl = await client.ttl(grantKey);
      if (expiresIn > ttl) {
        multi.expire(grantKey, expiresIn);
      }
    }

    if (payload.userCode) {
      const userCodeKey = userCodeKeyFor(payload.userCode);
      multi.set(userCodeKey, id);
      multi.expire(userCodeKey, expiresIn);
    }

    if (payload.uid) {
      const uidKey = uidKeyFor(payload.uid);
      multi.set(uidKey, id);
      multi.expire(uidKey, expiresIn);
    }

    await multi.exec();
  }

  async find(id: string) {
    const data = consumable.has(this.name)
      ? await client.hgetall(this.key(id))
      : await client.get(this.key(id));

    if (isEmpty(data)) {
      return undefined;
    }

    if (typeof data === "string") {
      return JSON.parse(data);
    }
    const { payload, ...rest } = data;
    return {
      ...rest,
      ...JSON.parse(payload),
    };
  }

  async findByUserCode(userCode: string) {
    const id = await client.get(userCodeKeyFor(userCode));
    return this.find(id);
  }

  async findByUid(uid: string) {
    const id = await client.get(uidKeyFor(uid));
    return this.find(id);
  }

  async consume(id: string) {
    await client.hset(this.key(id), "consumed", Math.floor(Date.now() / 1000));
  }

  async destroy(id: string) {
    const key = this.key(id);
    await client.del(key);
  }

  async revokeByGrantId(grantId: string) {
    const multi = client.multi();
    const tokens = await client.lrange(grantKeyFor(grantId), 0, -1);
    tokens.forEach((token) => multi.del(token));
    multi.del(grantKeyFor(grantId));
    await multi.exec();
  }
}
