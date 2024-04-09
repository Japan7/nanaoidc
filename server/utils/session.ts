import { type H3Event } from "h3";

interface SessionData {
  code: string;
  redirect: string;
}

export const useTypedSession = (event: H3Event) =>
  useSession<SessionData>(event, { password: process.env.SESSION_PASSWORD });
