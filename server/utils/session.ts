import { type H3Event } from "h3";
import { userConfig } from "./config";

interface SessionData {
  redirect: string;
  forwardAuthGroups: string[];
  forwardAuthExpires: number;
}

export const useTypedSession = (event: H3Event) =>
  useSession<SessionData>(event, { password: userConfig.sessionPassword });
