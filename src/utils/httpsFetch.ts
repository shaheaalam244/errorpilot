import * as https from 'https';
import { URL } from 'url';

/**
 * A highly resilient mock for the W3C Headers class to ensure complete compatibility
 * with standard fetch-based clients like `@google/genai` in Node.js environments.
 */
class MockHeaders {
    private map = new Map<string, string>();

    constructor(init?: any) {
        if (init) {
            for (const [key, value] of Object.entries(init)) {
                this.set(key, String(value));
            }
        }
    }

    append(name: string, value: string) {
        const key = name.toLowerCase();
        const existing = this.map.get(key);
        this.map.set(key, existing ? `${existing}, ${value}` : value);
    }

    set(name: string, value: string) {
        this.map.set(name.toLowerCase(), value);
    }

    get(name: string): string | null {
        return this.map.get(name.toLowerCase()) || null;
    }

    has(name: string): boolean {
        return this.map.has(name.toLowerCase());
    }

    forEach(callbackfn: (value: string, key: string, parent: any) => void) {
        this.map.forEach((v, k) => callbackfn(v, k, this));
    }

    entries() {
        return this.map.entries();
    }

    keys() {
        return this.map.keys();
    }

    values() {
        return this.map.values();
    }

    [Symbol.iterator]() {
        return this.map.entries();
    }
}

/**
 * A highly resilient and stable fetch polyfill using Node's native 'https' module.
 * Bypasses undici (Node's default fetch) bugs such as DNS resolution and IPv6 failures.
 */
export function httpsFetch(urlStr: string, init?: any): Promise<any> {
    return new Promise((resolve, reject) => {
        try {
            const url = new URL(urlStr);
            const headers: Record<string, string> = {};

            // Parse and map request headers
            if (init?.headers) {
                if (typeof init.headers.forEach === 'function') {
                    init.headers.forEach((value: string, key: string) => {
                        headers[key.toLowerCase()] = value;
                    });
                } else if (typeof init.headers[Symbol.iterator] === 'function') {
                    for (const [key, value] of init.headers) {
                        headers[key.toLowerCase()] = String(value);
                    }
                } else {
                    for (const [key, value] of Object.entries(init.headers)) {
                        headers[key.toLowerCase()] = String(value);
                    }
                }
            }

            const options: https.RequestOptions = {
                method: init?.method || 'GET',
                headers: headers,
            };

            // Handle abort signal
            if (init?.signal) {
                if (init.signal.aborted) {
                    const abortError = new Error('The operation was aborted.');
                    abortError.name = 'AbortError';
                    return reject(abortError);
                }
                init.signal.addEventListener('abort', () => {
                    const abortError = new Error('The operation was aborted.');
                    abortError.name = 'AbortError';
                    reject(abortError);
                });
            }

            const req = https.request(url, options, (res) => {
                const chunks: Buffer[] = [];
                
                res.on('data', (chunk) => chunks.push(chunk));
                
                res.on('end', () => {
                    const bodyBuffer = Buffer.concat(chunks);
                    
                    // Construct fully W3C compliant Headers object
                    let responseHeaders: any;
                    if (typeof globalThis.Headers === 'function') {
                        responseHeaders = new globalThis.Headers();
                        for (const [key, value] of Object.entries(res.headers)) {
                            if (value !== undefined) {
                                if (Array.isArray(value)) {
                                    value.forEach(v => responseHeaders.append(key, v));
                                } else {
                                    responseHeaders.append(key, value);
                                }
                            }
                        }
                    } else {
                        responseHeaders = new MockHeaders();
                        for (const [key, value] of Object.entries(res.headers)) {
                            if (value !== undefined) {
                                if (Array.isArray(value)) {
                                    value.forEach(v => responseHeaders.append(key, v));
                                } else {
                                    responseHeaders.append(key, value);
                                }
                            }
                        }
                    }

                    const responseObj = {
                        ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300,
                        status: res.statusCode || 200,
                        statusText: res.statusMessage || '',
                        headers: responseHeaders,
                        text: async () => bodyBuffer.toString('utf8'),
                        json: async () => JSON.parse(bodyBuffer.toString('utf8')),
                    };

                    resolve(responseObj);
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            if (init?.body) {
                req.write(init.body);
            }
            
            req.end();
        } catch (e) {
            reject(e);
        }
    });
}

// Fetch proxy module initialized successfully

// Fetch proxy module initialized successfully

// Fetch proxy module initialized successfully

// Fetch proxy module initialized successfully
