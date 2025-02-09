import { PUBLIC_WORKERS_URL, PUBLIC_OAUTH_CLIENT_BROWSER_KEY_NAME } from '$env/static/public';
import { PUBLIC_URL } from '$env/static/public';
import { browser } from '$app/environment';
import { BrowserOAuthClient, OAuthSession } from '@atproto/oauth-client-browser';
import { openDB } from 'idb';
import { Agent } from '@atproto/api';
import { deleteRecordVector } from './drawat';

const url = PUBLIC_URL || `http://127.0.0.1:5173`;
const enc = encodeURIComponent;

let client: BrowserOAuthClient | null = null;
export let agent: Agent | null = null;
export let session: OAuthSession | null = null;

// ------------------
// init
// ------------------
export async function initOAuthClient(): Promise<BrowserOAuthClient | null> {
  if (!browser || client !== null) return null;

  client = new BrowserOAuthClient({
    handleResolver: 'https://bsky.social',
    clientMetadata: {
      client_id: PUBLIC_URL
        ? `${url}/client-metadata.json`
        : `http://localhost?redirect_uri=${enc(`${url}/api/callback`)}&scope=${enc('atproto transition:generic')}`,
      redirect_uris: [`${url}/api/callback`],
      scope: "atproto transition:generic",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      dpop_bound_access_tokens: true,
    },
  });

  try {
    const result = await client.init();
    if (result) {
      session = result?.session;
      agent = new Agent(session);
    }
    console.log(`[INFO] OAuth client initialized`);
    return client;
  } catch (error) {
    console.error("OAuth client initialization failed:", error);
    return null;
  }
}

/**
 * OAuthログイン
 * @param handle 
 * @returns 
 */
export async function login(handle: string): Promise<void> {
  if (!browser || client === null) return;

  sessionStorage.setItem('handle', handle);

  const authUrl: string = await client.signIn(handle, {
    prompt: 'consent',
    ui_locales: 'ja-JP',
  });
  window.location.href = authUrl;
}

/**
 * OAuthログアウト
 * @param did
 * @returns 
 */
export async function logout(did: string): Promise<void> {
  if (!browser || client === null) return;

  // tokenを破棄
  await client.revoke(did);

  // session情報を破棄
  localStorage.removeItem('oauth_session');

  // お絵描き情報を削除
  await deleteRecordVector(did);

  // supabase削除
  const response = await fetch(PUBLIC_WORKERS_URL, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      did
    }),
  });
}

/**
 * OAuthコールバック、supabase登録
 * @returns 
 */
export async function handleCallback(): Promise<void> {
  if (!browser) return; // リダイレクトによりclientは消失しているはず

  client = await initOAuthClient();

  const did = await getDIDFromIndexedDB();
  if (did && client) {
    session = await client.restore(did);
    localStorage.setItem('oauth_session', JSON.stringify(session));

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
    const handle = sessionStorage.getItem('handle');
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
