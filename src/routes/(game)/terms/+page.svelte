<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n';
</script>

<div class="min-h-dvh bg-gray-50 px-3 py-6 sm:px-4 sm:py-10">
	<div class="mx-auto max-w-3xl rounded-xl bg-white p-5 shadow-md sm:p-8">
		<a href={resolve('/(game)/game')} class="mb-5 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700 sm:mb-6">
			← Back
		</a>

		<h1 class="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">{$t.game.termsAndConditions}</h1>
		<p class="mb-4 text-sm leading-6 text-gray-700 sm:text-base">
			By joining a session, you agree to follow the game instructions, respect other players,
			and use the platform appropriately.
		</p>
		<p class="mb-4 text-sm leading-6 text-gray-700 sm:text-base">
			The organizer may collect minimal session data needed to operate the game
			(code, progress, and participation timestamps).
		</p>
		<p class="text-sm leading-6 text-gray-700 sm:text-base">
			If you do not agree with these terms, please do not join the game session.
		</p>
	</div>
</div>
