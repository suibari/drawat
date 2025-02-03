<script lang="ts">
  import { onMount } from 'svelte';
  import { handleCallback } from '$lib/oauth/handleOAuth';

  onMount(async () => {
    await handleCallback();
    window.location.href = '/'; // 認証後にTOPへリダイレクト
  });
</script>

<p>ログイン処理中...</p>
