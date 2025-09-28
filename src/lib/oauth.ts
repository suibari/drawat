import { PUBLIC_NODE_ENV } from '$env/static/public';
import { PUBLIC_URL } from '$env/static/public';
import { browser } from '$app/environment';
import { BrowserOAuthClient, OAuthSession } from '@atproto/oauth-client-browser';
import { openDB } from 'idb';
import { Agent } from '@atproto/api';
import { deleteRecordVector } from './drawat';
import { deleteRow, postRow } from './supabase';

const url = PUBLIC_URL || `http://127.0.0.1:5173`;
const enc = encodeURIComponent;

let client: BrowserOAuthClient | null = null;
export let agent: Agent | null = null;
export let session: OAuthSession | null = null;

/**
 * OAuthクライアント初期化
 * @param provider 
 * @returns 
 */
export async function initOAuthClient(provider: string): Promise<BrowserOAuthClient | null> {
  if (!browser || client !== null) return null;

  // LoopbackIPを使え、と出たら、clientMetadataをundefinedにして1度試行してから元に戻す。意味わからん…
  client = new BrowserOAuthClient({
    handleResolver: provider,
    clientMetadata: {
      client_id:
        PUBLIC_NODE_ENV === "production" ? `${url}/client-metadata.json` :
        PUBLIC_NODE_ENV === "preview" ? `${url}/client-metadata-preview.json` :
        `http://localhost?redirect_uri=${enc(`${url}/api/callback`)}&scope=${enc('atproto transition:generic')}`,
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
export async function login({provider, handle}: {provider: string, handle: string}): Promise<void> {
  if (!browser) return;

  try {
    client = await initOAuthClient(provider);
    if (client) {
      const authUrl: string = await client.signIn(handle, {
        prompt: 'login',
        ui_locales: 'ja-JP',
      });
      window.location.href = authUrl;
    }
  } catch (error) {
    console.error(`failed to log-in: ${error}`);
  }
}

/**
 * OAuthログアウト
 * @param did
 * @returns 
 */
export async function logout(did: string): Promise<void> {
  if (!browser) return;

  try {
    // tokenを破棄
    const provider = sessionStorage.getItem('provider')!;
    client = await initOAuthClient(provider);
    if (client) {
      await client.revoke(did);
    }

    // session情報を破棄
    localStorage.removeItem('oauth_session');

    // お絵描き情報を削除: ATprotoオミットに伴い廃止
    // await deleteRecordVector(did);

    // supabase削除
    await deleteRow(did);

    console.log(`[INFO] successful log-out`);
  } catch (error) {
    console.error(`failed to log-out: ${error}`)
  }
}

/**
 * OAuthコールバック、supabase登録
 * @returns 
 */
export async function handleCallback(): Promise<void> {
  if (!browser) return; // リダイレクトによりclientは消失しているはず

  const provider = sessionStorage.getItem('provider')!;
  client = await initOAuthClient(provider);

  const did = await getDIDFromIndexedDB();
  if (did && client) {
    session = await client.restore(did);
    localStorage.setItem('oauth_session', JSON.stringify(session));

    await postRow({
      did,
      vector: null,
      updated_at: new Date().toISOString(),
    });
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
