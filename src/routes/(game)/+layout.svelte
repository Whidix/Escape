<script lang="ts">
	let { children } = $props();
</script>

<div class="flex min-h-dvh flex-col">
	<main class="flex-1 overflow-auto">
		{@render children()}
	</main>
</div>
