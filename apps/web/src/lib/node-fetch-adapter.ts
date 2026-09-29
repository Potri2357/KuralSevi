/**
 * Custom fetch that uses Node.js built-in https module to avoid the
 * ECONNRESET issue with Node.js v26 native fetch + HTTP/2 on Cloudflare.
 * Used only on the server side (middleware, API routes, SSR).
 */
import * as https from 'https';
import * as http from 'http';

type FetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
};

export function createNodeFetch() {
  return function nodeFetch(
    input: string | URL | Request,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any = {}
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;

    let headersObj: Record<string, string> = {};
    if (options.headers) {
      if (typeof options.headers.entries === 'function') {
        headersObj = Object.fromEntries(options.headers.entries());
      } else if (Array.isArray(options.headers)) {
        headersObj = Object.fromEntries(options.headers);
      } else {
        headersObj = { ...options.headers };
      }
    }

    return new Promise((resolve, reject) => {
      const reqOptions: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || (input instanceof Request ? input.method : 'GET'),
        headers: headersObj,
      };

      const req = lib.request(reqOptions, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const text = buffer.toString('utf8');

          const responseHeaders = new Headers();
          for (const [key, value] of Object.entries(res.headers)) {
            if (Array.isArray(value)) {
              value.forEach((v) => responseHeaders.append(key, v));
            } else if (value !== undefined) {
              responseHeaders.set(key, value);
            }
          }

          const response = new Response(text, {
            status: res.statusCode || 200,
            statusText: res.statusMessage || 'OK',
            headers: responseHeaders,
          });
          resolve(response);
        });
        res.on('error', reject);
      });

      req.on('error', reject);

      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          req.destroy();
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }

      if (options.body) {
        if (typeof options.body === 'string') {
          req.write(options.body);
        } else if (Buffer.isBuffer(options.body)) {
          req.write(options.body);
        } else {
          req.write(String(options.body));
        }
      }

      req.end();
    });
  };
}
