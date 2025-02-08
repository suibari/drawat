<script lang="ts">
	import '../app.css';
	import { onMount, setContext } from "svelte";
  import { initOAuthClient } from "$lib/oauth";
  import { getRecordsVector } from '$lib/drawat';
  import { writable } from 'svelte/store';

  const drawingData = writable<App.Path[]>([]);
  setContext("drawingData", drawingData);

  let { children } = $props();

  onMount(async () => {
    await initOAuthClient();

    const storedSession = localStorage.getItem('oauth_session');
    if (storedSession) {
      const paths = await getRecordsVector();
      if (paths) {
        drawingData.set(paths);
      }
    }
  });
</script>

{@render children()}
