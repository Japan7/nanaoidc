import assert from "node:assert/strict";

export default eventHandler(async (event) => {
  const session = await useTypedSession(event);

  const query = getQuery(event);
  const { code } = query;
  assert(typeof code === "string");
  await session.update({ code });

  const redirect = session.data.redirect || "/";
  return sendRedirect(event, redirect);
});
