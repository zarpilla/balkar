/**
 * Rejects request bodies compressed with Brotli (Content-Encoding: br).
 *
 * Node 18 bundles a Brotli decoder with CVE-2026-111497 (remote code execution)
 * and gets no fix. The body parser would decompress such bodies, so we refuse
 * them before it runs. Browsers never send Brotli request bodies.
 */
export default () => {
  return async (ctx, next) => {
    const encoding = String(ctx.get('content-encoding') || '').toLowerCase();
    if (encoding.split(',').some((e) => e.trim() === 'br')) {
      ctx.status = 415;
      ctx.body = { error: 'Unsupported Content-Encoding' };
      return;
    }
    await next();
  };
};
