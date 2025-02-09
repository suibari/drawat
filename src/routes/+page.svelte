<script lang="ts">
  import Canvas from '$lib/components/Canvas.svelte';
  import { deleteRecordVector, getRecordsVector, putRecordVector } from '$lib/drawat';
  import { getContext, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import DidsList from '$lib/components/DidsList.svelte';
  import Spinner from '$lib/components/Spinner.svelte';

  const drawingData = getContext("drawingData") as ReturnType<typeof writable<App.Path[]>>;
  const dids = getContext("dids") as ReturnType<typeof writable<string[]>>;
  const did = getContext("did") as ReturnType<typeof writable<string>>;

  let isPostAndLoading = $state(false);
  let isDeleteing = $state(false);

  const saveDrawingData = async () => {
    if ($did) {
      isPostAndLoading = true;

      await putRecordVector({did: $did, paths: $drawingData.filter(path => path.author === $did)});
      const result = await getRecordsVector();
      if (result) {
        drawingData.set(result.paths);
      }
      isPostAndLoading = false;
    }
  };

  const deleteDrawingData = async () => {
    if (did) {
      isDeleteing = true;

      await deleteRecordVector($did);
      const result = await getRecordsVector();
      if (result) {
        drawingData.set(result.paths);
      }
      isDeleteing = false;
    }
  };
</script>

<div class="flex justify-center mb-2">
  {#if $did}
    <p class="font-semibold">Logged-in "{$did}"</p>
  {/if}
</div>

<div class="flex flex-col md:flex-row items-center justify-center">
  <div class="flex flex-col gap-2 mb-2">
    <Canvas drawingData={$drawingData} readonly={$did ? false : true} userDid={$did} />
    {#if $did}
      <button
        onclick={saveDrawingData}
        class="px-4 py-2 bg-sky-400 text-white rounded-lg hover:bg-sky-500 transition"
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
