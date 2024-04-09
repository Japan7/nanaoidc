import { type H3Event } from "h3";

interface SessionData {
  redirect: string;
  forwardAuthRedirect: string;
  forwardAuthGroups: string[];
  forwardAuthExpires: number;
}

export const useTypedSession = (event: H3Event) =>
  useSession<SessionData>(event, { password: userConfig.sessionPassword });
