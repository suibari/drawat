import { PUBLIC_WORKERS_URL, PUBLIC_OAUTH_CLIENT_BROWSER_KEY_NAME } from '$env/static/public';
import { PUBLIC_URL } from '$env/static/public';
import { browser } from '$app/environment';
import { BrowserOAuthClient, OAuthSession } from '@atproto/oauth-client-browser';

const url = PUBLIC_URL || `http://127.0.0.1:5173`;
const enc = encodeURIComponent;

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
        `http://localhost?redirect_uri=${enc(`${url}/api/callback`)}&scope=${enc('atproto transition:generic')}`,
      redirect_uris: [`${url}/api/callback`],
      scope: "atproto transition:generic",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      dpop_bound_access_tokens: true,
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
 * OAuthコールバック、supabase登録
 * @returns 
 */
export async function handleCallback(): Promise<void> {
  if (!browser || client === null) return;

  const did = localStorage.getItem(PUBLIC_OAUTH_CLIENT_BROWSER_KEY_NAME);

  // 必要ならSupabaseにユーザー情報を保存
  const response = await fetch(PUBLIC_WORKERS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      did
    }),
  });

  if (!response.ok) {
    console.error('Failed to save user data to Supabase:', await response.json());
  }
}
