<script lang="ts">
  import Canvas from '$lib/components/Canvas.svelte';
  import type { OAuthSession } from '@atproto/oauth-client-browser';
  import { login } from '../lib/oauth';
  import { getRecordsVector, putRecordVector } from '$lib/drawat';
  import { getContext, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import DidsList from '$lib/components/DidsList.svelte';

  let handle = '';
  let session: OAuthSession | null = null;
  let did: string | null = null;
  const drawingData = getContext("drawingData") as ReturnType<typeof writable<App.Path[]>>;
  const dids = getContext("dids") as ReturnType<typeof writable<string[]>>;

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
      const result = await getRecordsVector();
      if (result) {
        drawingData.set(result.paths);
      }
    }
  };
</script>

{#if did}
  <p class="font-semibold mb-1">ログイン成功: {did}</p>
{:else}
  <input type="text" bind:value={handle} placeholder="Bluesky ハンドル名" />
  <button on:click={() => login(handle)}>Blueskyでログイン</button>
{/if}

<div class="flex flex-col md:flex-row items-start">
  <div class="flex flex-col gap-2 mb-2">
    <Canvas drawingData={$drawingData} readonly={did ? false : true} />
    <button
      on:click={saveDrawingData}
      class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
    >
      post & reload
    </button>
  </div>
  <DidsList dids={$dids} />
</div>
