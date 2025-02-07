<script lang="ts">
	import '../app.css';
	let { children } = $props();

	import { onMount } from "svelte";
  import { initOAuthClient } from "$lib/oauth/handleOAuth";

  onMount(() => {
    initOAuthClient();
  });
</script>

{@render children()}
