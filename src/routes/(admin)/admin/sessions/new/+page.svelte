<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';
	import { t } from '$lib/i18n';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-2xl px-4 py-8">
		<div class="mb-8">
			<h1 class="mb-2 text-3xl font-bold text-gray-900">{$t.admin.createSession}</h1>
			<p class="text-gray-600">{$t.admin.createSessionDescription}</p>
		</div>

		<div class="overflow-hidden rounded-xl bg-white shadow-md">
			<form method="POST" use:enhance class="space-y-6 p-8">
				<div>
					<label for="gameId" class="mb-2 block text-sm font-medium text-gray-700">
						{$t.admin.game} <span class="text-red-500">*</span>
					</label>
					<select
						id="gameId"
						name="gameId"
						class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
						required
					>
						<option value="">{$t.admin.selectGame}</option>
						{#each data.games as game (game.id)}
							<option
								value={game.id}
								selected={Number(form?.gameId ?? data.selectedGameId ?? 0) === game.id}
							>
								{game.title}
							</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="expiresAt" class="mb-2 block text-sm font-medium text-gray-700">
						{$t.admin.expiresAtDateTime} <span class="text-red-500">*</span>
					</label>
					<input
						id="expiresAt"
						type="datetime-local"
						name="expiresAt"
						value={form?.expiresAt ?? ''}
						class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
						required
					/>
					<p class="mt-1 text-sm text-gray-500">{$t.admin.expiresAtDateTimeHelp}</p>
				</div>

				{#if form?.error}
					<div class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
						{form.error}
					</div>
				{/if}

				<div class="flex gap-4 pt-2">
					<button
						type="submit"
						class="flex-1 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
						disabled={data.games.length === 0}
					>
						{$t.admin.createSession}
					</button>
					<a
						href={resolve('/admin/sessions')}
						class="flex-1 rounded-lg bg-gray-200 px-6 py-3 text-center font-semibold text-gray-800 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
					>
						{$t.admin.cancel}
					</a>
				</div>
			</form>
		</div>

		{#if data.games.length === 0}
			<p class="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
				{$t.admin.createGameBeforeSession}
				<a href={resolve('/admin/games/new')} class="font-semibold underline">{$t.admin.createNewGame}</a>
			</p>
		{/if}
	</div>
</div>
