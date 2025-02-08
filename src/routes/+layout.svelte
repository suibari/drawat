<script lang="ts">
	import '../app.css';
	import { onMount, setContext } from "svelte";
  import { initOAuthClient } from "$lib/oauth";
  import { getRecordsVector } from '$lib/drawat';
  import { writable } from 'svelte/store';

  const drawingData = writable<App.Path[]>([]);
  const dids = writable<string[]>([]);

  setContext("drawingData", drawingData);
  setContext("dids", dids);

  let { children } = $props();

  onMount(async () => {
    await initOAuthClient();

    const result = await getRecordsVector();
    if (result) {
      drawingData.set(result.paths);
      dids.set(result.dids);
    }
  });
</script>

{@render children()}
