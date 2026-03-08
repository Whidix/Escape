<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import LanguagePicker from '$lib/components/LanguagePicker.svelte';
</script>

<div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
	<div class="flex flex-col items-center justify-center px-4">
		<h1 class="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 text-center">
			{$t.home.title}
		</h1>
		<p class="text-xl text-gray-700 mb-12 max-w-2xl text-center">
			{$t.home.subtitle}
		</p>

		<button
			onclick={() => goto('/game')}
			class="bg-indigo-600 text-white px-12 py-8 rounded-2xl font-semibold text-xl hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
		>
			<div class="flex flex-col items-center">
				<svg class="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span>{$t.home.playGame}</span>
				<span class="text-sm text-indigo-200 mt-2">{$t.home.joinWithCode}</span>
			</div>
		</button>
	</div>

	<div class="mt-16">
		<p class="text-gray-600 text-sm mb-6 font-medium">{$t.common?.selectLanguage || 'Select Language'}</p>
		<LanguagePicker />
	</div>
</div>
