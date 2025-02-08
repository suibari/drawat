<script lang="ts">
  import { handleCallback } from '$lib/oauth';
  import { onMount } from 'svelte';

  onMount(async () => {
    await handleCallback();
    window.location.href = '/'; // 認証後にTOPへリダイレクト
  });
</script>

<p>ログイン処理中...</p>
