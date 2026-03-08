<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<div class="bg-gray-50 px-3 py-5 sm:px-4 sm:py-8">
	<div class="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
		<h1 class="mb-2 text-2xl font-bold text-gray-900">{$t.gameplay.tutorialTitle}</h1>
		<p class="mb-5 text-sm text-gray-700 sm:text-base">{$t.gameplay.tutorialIntro}</p>

		<div class="space-y-3">
			<div class="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
				<span class="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-gray-700">1</span>
				<p class="text-sm text-gray-800 sm:text-base">{$t.gameplay.tutorialPrevious}</p>
			</div>
			<div class="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
				<span class="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-gray-700">2</span>
				<p class="text-sm text-gray-800 sm:text-base">{$t.gameplay.tutorialInventory}</p>
			</div>
			<div class="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
				<span class="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-gray-700">3</span>
				<p class="text-sm text-gray-800 sm:text-base">{$t.gameplay.tutorialNext}</p>
			</div>
		</div>

		<p class="mt-5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-800 sm:text-sm">
			{$t.gameplay.tutorial}: {$t.gameplay.inventory}, {$t.gameplay.previous}, {$t.gameplay.next}
		</p>
	</div>
</div>
