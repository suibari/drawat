import { PUBLIC_WORKERS_URL, PUBLIC_OAUTH_CLIENT_BROWSER_KEY_NAME } from '$env/static/public';
import { PUBLIC_URL } from '$env/static/public';
import { browser } from '$app/environment';
import { BrowserOAuthClient, OAuthSession } from '@atproto/oauth-client-browser';
import { openDB } from 'idb';

const url = PUBLIC_URL || `http://127.0.0.1:5173`;
const enc = encodeURIComponent;

let client: BrowserOAuthClient | null = null;

// ------------------
// init
// ------------------
export async function initOAuthClient(): Promise<void> {
  if (!browser || client !== null) return; // 既に初期化済みなら何もしない

  client = new BrowserOAuthClient({
    handleResolver: 'https://bsky.social',
    clientMetadata: {
      client_id: PUBLIC_URL
        ? `${url}/client-metadata.json`
        : `http://localhost?redirect_uri=${enc(`${url}/api/callback`)}&scope=${enc('atproto')}`,
      redirect_uris: [`${url}/api/callback`],
      scope: "atproto",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      dpop_bound_access_tokens: true,
    },
  });

  try {
    const result = await client.init();
    if (result) {
      console.log(`[INFO] OAuth session initialized: ${result.session.sub}`);
    }
  } catch (error) {
    console.error("OAuth client initialization failed:", error);
  }
}

/**
 * OAuthログイン
 * @param handle 
 * @returns 
 */
export async function login(handle: string): Promise<void> {
  if (!browser || client === null) return;

  localStorage.setItem('handle', handle);

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
  if (!browser) return;

  const did = await getDIDFromIndexedDB();

  if (did) {
    localStorage.setItem('didLoggedIn', did);

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
}

async function getDIDFromIndexedDB(): Promise<string | null> {
  try {
    // OAuthクライアントが保存するDBにアクセス
    const db = await openDB('@atproto-oauth-client', 1);
    const store = db.transaction('handleCache', 'readonly').objectStore('handleCache');
    
    // DIDを取得
    const handle = localStorage.getItem('handle');
    if (handle) {
      const record = await store.get(handle);
      return record?.value || null;
    }
    return null;
  } catch (error) {
    console.error('Failed to retrieve DID from IndexedDB:', error);
    return null;
  }
}
