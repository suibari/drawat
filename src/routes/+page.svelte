<script lang="ts">
  import { login } from '../lib/oauth/handleOAuth';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  const OAUTH_CLIENT_BROWSER_KEY_NAME = '@@atproto/oauth-client-browser(sub)';

  let handle = '';
  let did: string | null = null;
  const loginError = writable<string | null>(null);

  onMount(() => {
    did = localStorage.getItem(OAUTH_CLIENT_BROWSER_KEY_NAME);
  });
</script>

<input type="text" bind:value={handle} placeholder="Bluesky ハンドル名" />
<button on:click={() => login(handle)}>Blueskyでログイン</button>

{#if did}
  <p>ログイン成功: {did}</p>
{:else if $loginError}
  <p style="color: red;">ログインエラー: {$loginError}</p>
{/if}
