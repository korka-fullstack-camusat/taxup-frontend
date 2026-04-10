import { NextRequest, NextResponse } from 'next/server';

// Read at runtime from container environment (not baked at build time)
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

type Context = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, ctx: Context): Promise<NextResponse> {
  const { path } = await ctx.params;
  const search = req.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/api/v1/${path.join('/')}${search}`;

  const reqHeaders = new Headers();
  const ct = req.headers.get('content-type');
  if (ct) reqHeaders.set('content-type', ct);
  const auth = req.headers.get('authorization');
  if (auth) reqHeaders.set('authorization', auth);

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers: reqHeaders,
    body: hasBody ? req.body : undefined,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore duplex required for body streaming in Node 18+
    duplex: hasBody ? 'half' : undefined,
    cache: 'no-store',
  });

  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete('transfer-encoding');

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export const GET     = proxy;
export const POST    = proxy;
export const PUT     = proxy;
export const PATCH   = proxy;
export const DELETE  = proxy;
export const HEAD    = proxy;
export const OPTIONS = proxy;
