<script lang="ts">
  import { login, user } from '../lib/oauth/handleOAuth';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  let handle = '';
  const loginError = writable<string | null>(null);
</script>

<input type="text" bind:value={handle} placeholder="Bluesky ハンドル名" />
<button on:click={() => login(handle)}>Blueskyでログイン</button>

{#if $user}
  <p>ログイン成功: {$user.sub}</p>
{:else if $loginError}
  <p style="color: red;">ログインエラー: {$loginError}</p>
{/if}
