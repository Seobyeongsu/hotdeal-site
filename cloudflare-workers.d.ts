declare module 'cloudflare:workers' {
  export const env: Record<string, any> & {
    DEALS_KV?: {
      get(key: string): Promise<string | null>;
      put(key: string, value: string, opts?: any): Promise<void>;
      delete(key: string): Promise<void>;
      list(opts?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
    };
  };
}
