<script lang="ts">
  import Canvas from '$lib/components/Canvas.svelte';
  import type { OAuthSession } from '@atproto/oauth-client-browser';
  import { login } from '../lib/oauth';
  import { getRecordsVector, putRecordVector } from '$lib/drawat';
  import { getContext, onMount } from 'svelte';
  import { writable } from 'svelte/store';

  let handle = '';
  let session: OAuthSession | null = null;
  let did: string | null = null;
  const drawingData = getContext("drawingData") as ReturnType<typeof writable<App.Path[]>>;

  onMount(async () => {
    const storedSession = localStorage.getItem('oauth_session');
    if (storedSession) {
      try {
        session = JSON.parse(storedSession) as OAuthSession;
        did = session.sub;
      } catch (error) {
        console.error("Failed to parse OAuth session:", error);
      }
    }
  });

  const saveDrawingData = async () => {
    if (did) {
      await putRecordVector({did, paths: $drawingData});
      const paths = await getRecordsVector();
      if (paths) {
        drawingData.set(paths);
      }
    }
  };
</script>

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
