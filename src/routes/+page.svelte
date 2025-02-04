<script lang="ts">
  import { PUBLIC_OAUTH_CLIENT_BROWSER_KEY_NAME } from '$env/static/public';
  import Canvas from '$lib/components/Canvas.svelte';
  import { login } from '../lib/oauth/handleOAuth';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  let handle = '';
  let did: string | null = null;
  const drawingData = writable<{ x: number, y: number, color: string, size: number }[]>([]);

  onMount(() => {
    did = localStorage.getItem(PUBLIC_OAUTH_CLIENT_BROWSER_KEY_NAME);
  });

  const saveDrawingData = () => {
    console.log($drawingData); // ここで描画データを送信
  };
</script>

<input type="text" bind:value={handle} placeholder="Bluesky ハンドル名" />
<button on:click={() => login(handle)}>Blueskyでログイン</button>

{#if did}
  <p>ログイン成功: {did}</p>
  <div class="w-full h-full p-4">
    <Canvas drawingData={$drawingData} />
    <button on:click={saveDrawingData}>post&reload</button>
  </div>
{:else}
  <input type="text" bind:value={handle} placeholder="Bluesky ハンドル名" />
  <button on:click={() => login(handle)}>Blueskyでログイン</button>
{/if}
