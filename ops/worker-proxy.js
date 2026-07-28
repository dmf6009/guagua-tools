const UPSTREAM = "https://guagua-tools.pages.dev";

export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    if (incoming.hostname === "www.guagua-alvin.top") {
      incoming.hostname = "guagua-alvin.top";
      return Response.redirect(incoming.toString(), 301);
    }
    const upstream = new URL(incoming.pathname + incoming.search, UPSTREAM);
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
    if (location?.startsWith(UPSTREAM)) responseHeaders.set("location", location.replace(UPSTREAM, incoming.origin));
    return new Response(response.body, {status: response.status, statusText: response.statusText, headers: responseHeaders});
  }
};
