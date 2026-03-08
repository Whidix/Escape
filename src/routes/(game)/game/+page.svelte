<script lang="ts">
	import { t } from '$lib/i18n';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData } from './$types';

	let sessionCode = $state('');
	let cguAccepted = $state(false);

	let { form }: { form: ActionData } = $props();
</script>

<div class="flex min-h-dvh items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-3 sm:p-4">
	<div class="w-full max-w-md rounded-xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-8">
		<h1 class="mb-2 text-center text-2xl font-bold text-gray-900 sm:text-3xl">{$t.home.title}</h1>
		<p class="mb-6 text-center text-sm text-gray-600 sm:mb-8 sm:text-base">{$t.home.subtitle}</p>

		<form method="POST" action="?/joinSession" use:enhance class="space-y-5 sm:space-y-6">
			<div>
				<label for="code" class="block text-sm font-medium text-gray-700 mb-2">
					{$t.game.sessionCode}
				</label>
				<input
					id="code"
					type="text"
					name="code"
					bind:value={sessionCode}
					placeholder={$t.game.enterSessionCode}
					class="w-full rounded-lg border border-gray-300 px-4 py-3.5 text-base uppercase focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
					required
				/>
			</div>

			<div class="flex items-start">
				<input
					id="cgu"
					type="checkbox"
					name="cguAccepted"
					bind:checked={cguAccepted}
					class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
					required
				/>
				<label for="cgu" class="ml-2 block text-sm leading-6 text-gray-700">
					{$t.game.acceptTerms} <a href={resolve('/terms')} class="text-indigo-600 hover:text-indigo-700 underline" data-sveltekit-preload-data="hover">{$t.game.termsAndConditions}</a>
				</label>
			</div>

			{#if form?.error}
				<div class="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
					{form.error}
				</div>
			{/if}

			<button
				type="submit"
				class="w-full rounded-lg bg-indigo-600 px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{$t.game.joinGame}
			</button>
		</form>
	</div>
</div>
