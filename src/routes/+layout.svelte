<script lang="ts">
	import '../app.css';
	import { onMount, setContext } from "svelte";
  import { initOAuthClient } from "$lib/oauth";
  import { getRecordsVector } from '$lib/drawat';
  import { writable } from 'svelte/store';
  import { Navbar, NavBrand, NavLi, NavUl, NavHamburger } from 'flowbite-svelte';
  import Footer from '$lib/components/Footer.svelte';
    import Spinner from '$lib/components/Spinner.svelte';

  const drawingData = writable<App.Path[]>([]);
  const dids = writable<string[]>([]);
  let isLoading = $state(false);

  setContext("drawingData", drawingData);
  setContext("dids", dids);

  let { children } = $props();

  onMount(async () => {
    isLoading = true;

    await initOAuthClient();

    const result = await getRecordsVector();
    if (result) {
      drawingData.set(result.paths);
      dids.set(result.dids);
    }

    isLoading = false;
  });
</script>

<Navbar class="bg-primary text-gray-900">
  <NavBrand>
    <span class="pacifico text-2xl ml-2">DrawAt</span>
  </NavBrand>
  <NavHamburger />
  <NavUl>
    <NavLi>About</NavLi>
  </NavUl>
</Navbar>

<div class="p-2">
  {@render children()}
</div>

{#if isLoading}
  <Spinner text="Getting Records..."/>
{/if}

<Footer />
