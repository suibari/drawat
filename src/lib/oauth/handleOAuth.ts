import { PUBLIC_URL } from '$env/static/public';
import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { BrowserOAuthClient, OAuthSession, type TokenInfo } from '@atproto/oauth-client-browser';

const url = PUBLIC_URL || `http://127.0.0.1:5173`;
const enc = encodeURIComponent;

export const user = writable<TokenInfo | null>(null);
let client: BrowserOAuthClient | null = null;

// ------------------
// init
// ------------------
if (browser) {
  client = new BrowserOAuthClient({
    handleResolver: 'https://bsky.social',
    clientMetadata: {
      client_id: PUBLIC_URL ?
        `${url}/client-metadata.json` :
        `http://localhost?redirect_uri=${enc(`${url}/api/callback`)}&scope=${enc('atproto')}`,
      redirect_uris: [`${url}/api/callback`],
      scope: "atproto",
      token_endpoint_auth_method: "none",
    },
  });

  const result: undefined | { session: OAuthSession; state?: string | null } = await client.init();
  
  if (result) {
    const { session, state } = result;
    if (state != null) {
      console.log(`[INFO] ${session.sub} was successfully authenticated (state: ${state})`);
    } else {
      console.log(`[INFO] ${session.sub} was restored`);
    }
  }
}

/**
 * OAuthログイン
 * @param handle 
 * @returns 
 */
export async function login(handle: string): Promise<void> {
  if (!browser || client === null) return;

  const authUrl: string = await client.signIn(handle, {
    prompt: 'consent',
    ui_locales: 'ja-JP',
  });
  window.location.href = authUrl;
}

/**
 * OAuthコールバック
 * @returns 
 */
export async function handleCallback(): Promise<void> {
  if (!browser || client === null) return;

  const params = new URLSearchParams(window.location.search);
  const code: string | null = params.get('code');
  if (!code) return;

  const { session } = await client.callback(params);
  const token: TokenInfo = await session.getTokenInfo();
  user.set(token);
  
  // 必要ならSupabaseにユーザー情報を保存
}
