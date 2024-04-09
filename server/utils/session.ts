import { type H3Event } from "h3";

interface SessionData {
  redirect: string;
  forwardAuthRedirect: string;
  forwardAuthGroups: string[];
}

export const useTypedSession = (event: H3Event) =>
  useSession<SessionData>(event, {
    password: userConfig.sessionPassword,
    maxAge: 60 * 60 * 24,
  });
