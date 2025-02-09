<script lang="ts">
  export let dids: string[] = [];
</script>

<div class="flex-col lg:ml-2">
  <p class="font-semibold">Drawers:</p>
  <ul class="flex flex-col gap-2 max-h-60 overflow-y-auto">
    {#each dids as did}
      <li>
        <a
          href={`https://bsky.app/profile/${did}`}
          target="_blank"
          rel="noopener noreferrer"
          class="block px-4 py-1 bg-gray-200 rounded-lg text-gray-800 hover:bg-gray-300 transition text-sm"
        >
          {did}
        </a>
      </li>
    {/each}
  </ul>
</div>
