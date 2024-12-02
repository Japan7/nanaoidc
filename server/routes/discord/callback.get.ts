import assert from "node:assert/strict";
import { useTypedSession } from "~/utils/session";

export default eventHandler(async (event) => {
  const query = getQuery(event);
  const { code } = query;
  assert(typeof code === "string");

  const session = await useTypedSession(event);
  const redirect = session.data.redirect || "/";

  const params = new URLSearchParams({ code });
  return sendRedirect(event, `${redirect}?${params}`);
});
