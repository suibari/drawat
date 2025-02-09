<script lang="ts">
  import Spinner from '$lib/components/Spinner.svelte';
  import { handleCallback } from '$lib/oauth';
  import { onMount } from 'svelte';

  onMount(async () => {
    await handleCallback();
    window.location.href = '/'; // 認証後にTOPへリダイレクト
  });
</script>

<Spinner text="Login processing..." />
