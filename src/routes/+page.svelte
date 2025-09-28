<script lang="ts">
  import Canvas from '$lib/components/Canvas.svelte';
  import { deleteRecordVector, getRecordsVector, putRecordVector } from '$lib/drawat';
  import { getContext, onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import DidsList from '$lib/components/DidsList.svelte';
  import Spinner from '$lib/components/Spinner.svelte';

  const myDrawingData = getContext("myDrawingData") as ReturnType<typeof writable<string | undefined>>;
  const pastDrawingData = getContext("pastDrawingData") as ReturnType<typeof writable<string[]>>;
  const dids = getContext("dids") as ReturnType<typeof writable<string[]>>;
  const did = getContext("did") as ReturnType<typeof writable<string>>;
  const isLoading = getContext("isLoading") as ReturnType<typeof writable<boolean>>;

  let isPostAndLoading = $state(false);
  let isDeleteing = $state(false);

  let canvasComponent = $state<ReturnType<typeof Canvas>>();

  let intervalId: ReturnType<typeof setInterval>;

  onMount(() => {
    // 1分ごとにgetRecordsVectorを呼び出す
    intervalId = setInterval(async () => {
      if ($did) {
        console.log("[INFO] Fetching records in background...");
        const result = await getRecordsVector($did);
        if (result) {
          pastDrawingData.set(result.pastDrawingData);
          dids.set(result.dids);
        }
      }
    }, 60 * 1000); // 1分 = 60000ミリ秒
  });

  onDestroy(() => {
    clearInterval(intervalId);
  });

  const saveDrawingData = async () => {
    if ($did && $myDrawingData) {
      // オブジェクトが空の場合は保存しない
      if ($myDrawingData === '{"objects":[]}') {
        console.log("[INFO] No drawing data to save.");
        return;
      }

      isPostAndLoading = true;

      await putRecordVector({did: $did, paths: $myDrawingData});
      const result = await getRecordsVector($did);
      if (result) {
        myDrawingData.set(result.myDrawingData)
        pastDrawingData.set(result.pastDrawingData);
        dids.set(result.dids);
      }
      isPostAndLoading = false;
    }
  };

  const deleteDrawingData = async () => {
    if ($did) {
      isDeleteing = true;

      await deleteRecordVector($did);
      const result = await getRecordsVector($did);
      if (result) {
        myDrawingData.set(undefined);
        pastDrawingData.set(result.pastDrawingData);

        dids.set(result.dids);
      }
      isDeleteing = false;
    }
  };

  $effect(() => {
    if ($myDrawingData === undefined) {
      canvasComponent?.deleteMyDrawing();
    }
  });
</script>

<div class="flex justify-center mb-2">
  {#if $did}
    <p class="font-semibold">Logged-in "{$did}"</p>
  {/if}
</div>

<div class="flex flex-col md:flex-row items-center justify-center">
  <div class="flex flex-col gap-2 mb-2">
    {#if !$isLoading}
      <Canvas
        pastDrawingData={$pastDrawingData}
        bind:myDrawingData={$myDrawingData}
        readOnly={$did ? false : true}
        bind:this={canvasComponent}
      />
      {#if $did}
        <button
          onclick={saveDrawingData}
          class="button-sky"
        >
          post & load!
        </button>
        <button
          onclick={deleteDrawingData}
          class="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
        >
          delete my drawing
        </button>
      {/if}
    {/if}
  </div>
  <div class="flex sm:self-start">
    <DidsList dids={$dids} />
  </div>
</div>

{#if isPostAndLoading}
  <Spinner text="Posting and Loading..." /> 
{:else if isDeleteing}
  <Spinner text="Deleting your drawing..." /> 
{/if}
