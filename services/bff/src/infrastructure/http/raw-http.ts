/** Structural subsets of Node's http.IncomingMessage/ServerResponse -- avoids depending on @types/express just for raw passthrough responses (SSE proxy, binary file proxy). */
export interface RawHttpRequest {
  on(event: 'close', listener: () => void): void;
}

export interface RawHttpResponse {
  writeHead(status: number, headers: Record<string, string>): void;
  write(chunk: Uint8Array | string): boolean;
  end(): void;
}
