<script lang="ts">
  import { Modal } from "flowbite-svelte";
  import Spinner from "./Spinner.svelte";
  import { login } from "$lib/oauth";

  let { loginModal = $bindable() } = $props()

  let handle = $state("");
  let isRedirecting = $state(false);

  const handleLogin = async () => {
    isRedirecting = true;
    await login(handle);
  }
</script>

<Modal title="Log in" bind:open={loginModal} autoclose outsideclose class="z-10">
  <form onsubmit={handleLogin} class="space-y-4">
    <div class="mb-4">
      <input
        id="handle"
        type="text"
        bind:value={handle}
        placeholder="your-handle.bsky.social"
        class="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-secondory mb-4"
        required
      />
      <p class="font-medium mb-1">ログインすることで、DrawAtにお絵描きできます!</p>
    </div>
    <div class="flex justify-end">
      <button onclick={handleLogin} type="submit" class="bg-sky-400 text-white px-4 py-2 rounded-lg">
        Log In
      </button>
    </div>
  </form>
</Modal>

{#if isRedirecting}
  <Spinner text="Redirecting..." />  
{/if}