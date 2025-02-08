<script lang="ts">
	import '../app.css';
	import { onMount } from "svelte";
  import { initOAuthClient } from "$lib/oauth";

  let { children } = $props();

  onMount(async () => {
    await initOAuthClient();
  });
</script>

{@render children()}
