export default eventHandler(async (event) => {
  const headers = event.headers;
  const proto = headers.get("x-forwarded-proto");
  const host = headers.get("x-forwarded-host");
  const uri = headers.get("x-forwarded-uri");

  const session = await useTypedSession(event);
  const groups = session.data.forwardAuthGroups;

  if (groups !== undefined) {
    const required = userConfig.forwardAuth.hosts[host];
    if (!required || required.some((req) => groups.includes(req))) {
      return;
    } else {
      await session.clear();
      throw createError({ status: 401, message: "Missing required group" });
    }
  } else {
    const forwardAuthRedirect = `${proto}://${host}${uri}`;
    const params = new URLSearchParams({ forwardAuthRedirect });
    return sendRedirect(event, `http://${host}/_oauth?${params}`);
  }
});
