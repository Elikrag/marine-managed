import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { verifyApiKey } from "@/lib/api-keys";
import { createMcpServer } from "@/lib/mcp";

export const dynamic = "force-dynamic";

/**
 * MCP endpoint. Auth is a bearer API key, either:
 *   Authorization: Bearer mm_...        (preferred)
 *   /mcp/mm_...                          (for clients that cannot set headers)
 */
async function handle(req: Request, ctx: RouteContext<"/mcp/[[...key]]">) {
  const { key: segs } = await ctx.params;
  const header = req.headers.get("authorization");
  const raw = header?.replace(/^Bearer\s+/i, "") || segs?.[0] || null;
  const key = await verifyApiKey(raw);
  if (!key) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json", "www-authenticate": 'Bearer realm="marine-managed"' },
    });
  }
  const server = createMcpServer(key);
  // Stateless, JSON responses: each request is fully answered before the handler returns,
  // so the per-request server can be torn down safely afterwards.
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try {
    return await transport.handleRequest(req);
  } finally {
    void server.close().catch(() => {});
  }
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
