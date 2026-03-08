<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import { t } from '$lib/i18n';

	let { data }: { data: PageData } = $props();
</script>

<div class="flex min-h-dvh items-center justify-center bg-linear-to-br from-emerald-50 to-cyan-100 p-4">
	<div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
		<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">{$t.gameplay.completedLabel}</p>
		<h1 class="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">{$t.gameplay.completedTitle}</h1>
		<p class="mb-6 text-sm text-gray-600 sm:text-base">{data.gameTitle} - {$t.gameplay.sessionCode}: {data.sessionCode}</p>

		<div class="mb-6 rounded-xl bg-emerald-50 p-4 text-center">
			<p class="mb-1 text-sm font-medium text-emerald-800">{$t.gameplay.completedIn}</p>
			<p class="text-3xl font-bold text-emerald-900 sm:text-4xl">{data.formattedDuration}</p>
		</div>

		<a
			href={resolve('/(game)/game')}
			class="block w-full rounded-lg bg-emerald-600 px-4 py-3 text-center text-base font-semibold text-white transition-colors hover:bg-emerald-700"
		>
			{$t.gameplay.playAgain}
		</a>
	</div>
</div>
