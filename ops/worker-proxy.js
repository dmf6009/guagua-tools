const UPSTREAM = "https://guagua-tools.pages.dev";
const GAMES_HOST = "games.guagua-alvin.top";
const BUILD_REVISION = "20260810-adsense-content-quality-v2";

export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    if (incoming.hostname === "www.guagua-alvin.top") {
      incoming.hostname = "guagua-alvin.top";
      return Response.redirect(incoming.toString(), 301);
    }
    if (incoming.hostname === "guagua-alvin.top" && (incoming.pathname === "/games" || incoming.pathname.startsWith("/games/"))) {
      const rest = incoming.pathname.slice("/games".length) || "/";
      return Response.redirect("https://" + GAMES_HOST + rest + incoming.search, 301);
    }
    // games.guagua-alvin.top/<path> is served from the /games/ directory of the same Pages project.
    const isGames = incoming.hostname === GAMES_HOST;
    const path = isGames ? "/games" + incoming.pathname : incoming.pathname;
    const upstream = new URL(path + incoming.search, UPSTREAM);
    upstream.searchParams.set("__build", BUILD_REVISION);
    const headers = new Headers(request.headers);
    headers.delete("host");
    const response = await fetch(new Request(upstream, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      redirect: "manual"
    }));
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("x-guagua-tools-origin", "cloudflare-pages");
    const location = responseHeaders.get("location");
    if (location) {
      let target = location.startsWith(UPSTREAM) ? location.slice(UPSTREAM.length) : location;
      if (target.startsWith("/")) {
        if (isGames && target.startsWith("/games")) target = target.slice("/games".length) || "/";
        responseHeaders.set("location", incoming.origin + target);
      }
    }
    return new Response(response.body, {status: response.status, statusText: response.statusText, headers: responseHeaders});
  }
};
