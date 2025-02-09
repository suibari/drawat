<script lang="ts">
	import '../app.css';
	import { onMount, setContext } from "svelte";
  import { initOAuthClient, logout } from "$lib/oauth";
  import { getRecordsVector } from '$lib/drawat';
  import { writable } from 'svelte/store';
  import { Navbar, NavBrand, NavLi, NavUl, NavHamburger } from 'flowbite-svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import About from '$lib/components/About.svelte';
  import { OAuthSession } from '@atproto/oauth-client-browser';
  import Login from '$lib/components/Login.svelte';

  const drawingData = writable<App.Path[]>([]);
  const dids = writable<string[]>([]);
  const did = writable<string>();

  let session: OAuthSession | null = $state(null);
  let isLoading = $state(false);
  let isLoggingOut = $state(false);
  let aboutModal = $state(false);
  let loginModal = $state(false);

  setContext("drawingData", drawingData);
  setContext("dids", dids);
  setContext("did", did);

  let { children } = $props();

  onMount(async () => {
    isLoading = true;

    await initOAuthClient();

    const result = await getRecordsVector();
    if (result) {
      drawingData.set(result.paths);
      dids.set(result.dids);
    }

    const storedSession = localStorage.getItem('oauth_session');
    if (storedSession) {
      try {
        session = JSON.parse(storedSession) as OAuthSession;
        did.set(session.sub);
      } catch (error) {
        console.error("Failed to parse OAuth session:", error);
      }
    }

    isLoading = false;
  });

  const handleLogout = async (did: string) => {
    isLoggingOut = true;
    await logout(did);
    isLoggingOut = false;
  }
</script>

<Navbar class="bg-primary text-gray-900">
  <NavBrand>
    <span class="pacifico text-gray-900 text-2xl ml-2">DrawAt</span>
  </NavBrand>
  <NavHamburger />
  <NavUl>
    {#if $did}
      <NavLi class="cursor-pointer" on:click={() => handleLogout($did)}>Log-out</NavLi>
    {:else}
      <NavLi class="cursor-pointer" on:click={() => loginModal = true}>Log-in</NavLi>
    {/if}
    <NavLi class="cursor-pointer" on:click={() => aboutModal = true}>About</NavLi>
  </NavUl>
</Navbar>

<div class="p-2">
  {@render children()}
</div>

{#if isLoading}
  <Spinner text="Getting Records..."/>
{/if}

<About bind:aboutModal />
<Login bind:loginModal />

<Footer />
