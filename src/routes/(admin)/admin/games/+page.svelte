<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { t } from '$lib/i18n';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let gameToDelete = $state<{ id: number; title: string } | null>(null);

	function openDeleteModal(game: { id: number; title: string }) {
		gameToDelete = game;
	}

	function closeDeleteModal() {
		gameToDelete = null;
	}

	$effect(() => {
		if (form?.success === true) {
			closeDeleteModal();
		}
	});
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-7xl px-4 py-8">
		<div class="mb-8 flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">{$t.admin.escapeGames}</h1>
				<p class="mt-1 text-sm text-gray-500">{$t.admin.manage}</p>
			</div>
			<a
				href={resolve('/admin/games/new')}
				class="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-indigo-700"
			>
				{$t.admin.createNewGame}
			</a>
		</div>

		<div class="overflow-hidden rounded-xl bg-white shadow-md">
			{#if form?.error}
				<div class="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
					{form.error}
				</div>
			{/if}

			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
								{$t.admin.gameTitle}
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
								{$t.admin.steps}
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
								{$t.admin.sessions}
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
								{$t.admin.created}
							</th>
							<th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
								{$t.admin.actions}
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white">
						{#if data.games && data.games.length > 0}
							{#each data.games as game (game.id)}
								<tr class="hover:bg-gray-50">
									<td class="whitespace-nowrap px-6 py-4">
										<div class="text-sm font-medium text-gray-900">{game.title}</div>
										{#if game.description}
											<div class="text-sm text-gray-500">{game.description}</div>
										{/if}
									</td>
									<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{game.stepCount}</td>
									<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{game.sessionCount}</td>
									<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
										{new Date(game.createdAt).toLocaleDateString()}
									</td>
									<td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
										<div class="inline-flex items-center gap-2">
											<a
												href={resolve(`/admin/games/${game.id}`)}
												class="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-3 py-1.5 text-indigo-700 hover:bg-indigo-100"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
												</svg>
												{$t.admin.edit}
											</a>
											<button
												type="button"
												onclick={() => openDeleteModal({ id: game.id, title: game.title })}
												class="inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-1.5 text-red-700 hover:bg-red-100"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8" />
												</svg>
												{$t.admin.delete}
											</button>
										</div>
									</td>
								</tr>
							{/each}
						{:else}
							<tr>
								<td class="px-6 py-10 text-center text-sm text-gray-500" colspan="5">
									{$t.admin.noGamesYet}
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>

{#if gameToDelete}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
		<div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
			<h2 class="text-lg font-semibold text-gray-900">{$t.admin.confirmDeleteTitle}</h2>
			<p class="mt-2 text-sm text-gray-600">
				{$t.admin.confirmDeleteGame} <span class="font-semibold text-gray-900">{gameToDelete.title}</span>?
			</p>

			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					onclick={closeDeleteModal}
					class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
				>
					{$t.admin.cancel}
				</button>
				<form method="POST" action="?/deleteGame" use:enhance>
					<input type="hidden" name="gameId" value={gameToDelete.id} />
					<button
						type="submit"
						class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
					>
						{$t.admin.confirmDelete}
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
