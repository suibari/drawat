<script lang="ts">
  import { PUBLIC_OAUTH_CLIENT_BROWSER_KEY_NAME } from '$env/static/public';
  import { login } from '../lib/oauth/handleOAuth';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  let handle = '';
  let did: string | null = null;
  const loginError = writable<string | null>(null);

  onMount(() => {
    did = localStorage.getItem(PUBLIC_OAUTH_CLIENT_BROWSER_KEY_NAME);
  });
</script>

<input type="text" bind:value={handle} placeholder="Bluesky ハンドル名" />
<button on:click={() => login(handle)}>Blueskyでログイン</button>

{#if did}
  <p>ログイン成功: {did}</p>
{:else if $loginError}
  <p style="color: red;">ログインエラー: {$loginError}</p>
{/if}
