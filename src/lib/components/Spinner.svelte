<script lang="ts">
  import { Spinner } from "flowbite-svelte";

  export let text: string = "";
</script>

<div class="fixed inset-0 flex items-center justify-center z-50">
  <div class="flex flex-col items-center space-y-2">
    <Spinner color="pink" size="14" />
    <span>{text}</span>
  </div>
</div>
