<script lang="ts">
	import '../app.css';
	import { onMount, setContext } from "svelte";
  import { logout } from "$lib/oauth";
  import { getRecordsVector } from '$lib/drawat';
  import { writable } from 'svelte/store';
  import { Navbar, NavBrand, NavLi, NavUl, NavHamburger } from 'flowbite-svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import About from '$lib/components/About.svelte';
  import { OAuthSession } from '@atproto/oauth-client-browser';
  import Login from '$lib/components/Login.svelte';

  const myDrawingData = writable<string|undefined>();
  const pastDrawingData = writable<string[]>([]);
  const dids = writable<string[]>([]);
  const did = writable<string>();
  const isLoading = writable<boolean>(true);

  let session: OAuthSession | null = $state(null);
  let isLoggingOut = $state(false);
  let aboutModal = $state(false);
  let loginModal = $state(false);

  setContext("myDrawingData", myDrawingData);
  setContext("pastDrawingData", pastDrawingData);
  setContext("dids", dids);
  setContext("did", did);
  setContext("isLoading", isLoading)

  let { children } = $props();

  onMount(async () => {
    isLoading.set(true);

    // ログイン情報保存
    const storedSession = localStorage.getItem('oauth_session');
    if (storedSession) {
      try {
        session = JSON.parse(storedSession) as OAuthSession;
        did.set(session.sub);
      } catch (error) {
        console.error("Failed to parse OAuth session:", error);
      }
    }

    // Canvas描画
    const result = await getRecordsVector($did);
    if (result) {
      myDrawingData.set(result.myDrawingData)
      pastDrawingData.set(result.pastDrawingData);
      dids.set(result.dids);
    }

    isLoading.set(false);
  });

  const handleLogout = async () => {
    isLoggingOut = true;

    await logout($did);

    // UIを未ログイン状態に
    did.set("");

    // 画像削除されたことをユーザに見せる
    const result = await getRecordsVector($did);
    if (result) {
      myDrawingData.set(undefined)
      pastDrawingData.set(result.pastDrawingData);
      dids.set(result.dids);
    }

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
      <NavLi class="cursor-pointer" on:click={() => handleLogout()}>Log-out</NavLi>
    {:else}
      <NavLi class="cursor-pointer" on:click={() => loginModal = true}>Log-in</NavLi>
    {/if}
    <NavLi class="cursor-pointer" on:click={() => aboutModal = true}>About</NavLi>
  </NavUl>
</Navbar>

<div class="p-2">
  {@render children()}
</div>

{#if $isLoading}
  <Spinner text="Getting Records..."/>
{:else if isLoggingOut}
  <Spinner text="Logging-out..."/>
{/if}

<About bind:aboutModal />
<Login bind:loginModal />

<Footer />
