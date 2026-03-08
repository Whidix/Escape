<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { t } from '$lib/i18n';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let sessionToDelete = $state<{ id: number; code: string } | null>(null);

	function openDeleteModal(session: { id: number; code: string }) {
		sessionToDelete = session;
	}

	function closeDeleteModal() {
		sessionToDelete = null;
	}

	$effect(() => {
		if (form?.success === true) {
			closeDeleteModal();
		}
	});
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-7xl px-4 py-8">
		<div class="mb-6 flex flex-wrap items-end justify-between gap-3">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">{$t.admin.sessions}</h1>
				<p class="mt-1 text-sm text-gray-500">{$t.admin.recentSessions}</p>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<a
					href={resolve('/admin/sessions/new')}
					class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
				>
					{$t.admin.createSession}
				</a>
				<form method="GET" action={resolve('/admin/sessions')} class="flex items-center gap-2">
					<label for="gameId" class="text-sm font-medium text-gray-700">{$t.admin.game}</label>
					<select
						id="gameId"
						name="gameId"
						class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
					>
						<option value="">All games</option>
						{#each data.games as game (game.id)}
							<option value={game.id} selected={data.selectedGameId === game.id}>{game.title}</option>
						{/each}
					</select>
					<button
						type="submit"
						class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
					>
						Filter
					</button>
				</form>
			</div>
		</div>

		{#if form?.error}
			<div class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{form.error}</div>
		{/if}

		<div class="overflow-hidden rounded-xl bg-white shadow-md">
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{$t.admin.code}</th>
							<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{$t.admin.game}</th>
							<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{$t.admin.status}</th>
							<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{$t.admin.players}</th>
							<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{$t.admin.created}</th>
							<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{$t.admin.expires}</th>
							<th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{$t.admin.actions}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white">
						{#if data.sessions.length > 0}
							{#each data.sessions as session (session.id)}
								<tr class="hover:bg-gray-50">
									<td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{session.code}</td>
									<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{session.gameTitle}</td>
									<td class="whitespace-nowrap px-6 py-4">
										<span class={`rounded-full px-2 py-1 text-xs font-semibold ${session.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
											{session.isActive ? $t.admin.active : $t.admin.inactive}
										</span>
									</td>
									<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{session.players}</td>
									<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{new Date(session.createdAt).toLocaleString()}</td>
									<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{new Date(session.expiresAt).toLocaleString()}</td>
									<td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
										<div class="inline-flex items-center gap-2">
											<a
												href={resolve('/(admin)/admin/sessions/[id]', { id: session.id.toString() })}
												class="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-3 py-1.5 text-indigo-700 hover:bg-indigo-100"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
												</svg>
												{$t.admin.edit}
											</a>
											<button
												type="button"
												onclick={() => openDeleteModal({ id: session.id, code: session.code })}
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
								<td class="px-6 py-10 text-center text-sm text-gray-500" colspan="7">{$t.admin.noSessions}</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>

{#if sessionToDelete}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
		<div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
			<h2 class="text-lg font-semibold text-gray-900">{$t.admin.confirmDeleteSessionTitle}</h2>
			<p class="mt-2 text-sm text-gray-600">
				{$t.admin.confirmDeleteSession}
				<span class="font-semibold text-gray-900">{sessionToDelete.code}</span>?
			</p>

			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					onclick={closeDeleteModal}
					class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
				>
					{$t.admin.cancel}
				</button>
				<form method="POST" action="?/deleteSession" use:enhance>
					<input type="hidden" name="sessionId" value={sessionToDelete.id} />
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
