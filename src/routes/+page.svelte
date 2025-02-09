<script lang="ts">
  import Canvas from '$lib/components/Canvas.svelte';
  import type { OAuthSession } from '@atproto/oauth-client-browser';
  import { login } from '../lib/oauth';
  import { deleteRecordVector, getRecordsVector, putRecordVector } from '$lib/drawat';
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
      await putRecordVector({did, paths: $drawingData.filter(path => path.author === did)});
      const result = await getRecordsVector();
      if (result) {
        drawingData.set(result.paths);
      }
    }
  };

  const deleteDrawingData = async () => {
    if (did) {
      await deleteRecordVector(did);
      const result = await getRecordsVector();
      if (result) {
        drawingData.set(result.paths);
      }
    }
  };
</script>

<div class="flex justify-center mb-2">
  {#if did}
    <p class="font-semibold">Logged-in "{did}"</p>
  {:else}
    <div class="flex gap-2">
      <input
        type="text"
        bind:value={handle}
        placeholder="your-handle.bsky.social"
        class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        on:click={() => login(handle)}
        class="px-4 py-2 bg-sky-400 text-white rounded-lg hover:bg-sky-500 transition"
      >
        Log-in
      </button>
    </div>
  {/if}
</div>

<div class="flex flex-col md:flex-row items-center justify-center">
  <div class="flex flex-col gap-2 mb-2">
    <Canvas drawingData={$drawingData} readonly={did ? false : true} userDid={did} />
    {#if did}
      <button
        on:click={saveDrawingData}
        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
      >
        post & load drawing!
      </button>
      <button
        on:click={deleteDrawingData}
        class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
      >
        delete my drawing
      </button>
    {/if}
  </div>
  <div class="flex sm:self-start">
    <DidsList dids={$dids} />
  </div>
</div>
