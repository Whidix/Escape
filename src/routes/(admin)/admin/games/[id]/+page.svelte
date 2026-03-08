<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let game = $derived.by(() => data.game);
	let steps = $state<typeof data.game.steps>([]);
	let draggedStepId = $state<number | null>(null);
	let reorderPayload = $state('');
	let reorderForm = $state<HTMLFormElement | undefined>(undefined);
	let stepToDelete = $state<{ id: number; title: string; order: number } | null>(null);

	// Update steps when game data changes
	$effect(() => {
		steps = [...(game.steps ?? [])];
	});

	function openDeleteModal(step: { id: number; title: string; order: number }) {
		stepToDelete = step;
	}

	function closeDeleteModal() {
		stepToDelete = null;
	}

	function moveStep(list: typeof steps, fromIndex: number, toIndex: number) {
		const clone = [...list];
		const [moved] = clone.splice(fromIndex, 1);
		if (!moved) {
			return list;
		}
		clone.splice(toIndex, 0, moved);
		return clone.map((item, index) => ({ ...item, order: index + 1 }));
	}

	function onDragStart(stepId: number) {
		draggedStepId = stepId;
	}

	function onDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function onDrop(targetStepId: number) {
		if (draggedStepId === null || draggedStepId === targetStepId) {
			draggedStepId = null;
			return;
		}

		const fromIndex = steps.findIndex((item) => item.id === draggedStepId);
		const toIndex = steps.findIndex((item) => item.id === targetStepId);

		if (fromIndex === -1 || toIndex === -1) {
			draggedStepId = null;
			return;
		}

		steps = moveStep(steps, fromIndex, toIndex);
		reorderPayload = JSON.stringify(steps.map((item) => item.id));
		reorderForm?.requestSubmit();
		draggedStepId = null;
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-4xl mx-auto px-4 py-8">
		<!-- Game Header -->
		<div class="mb-8">
			<a
				href={resolve('/admin')}
				class="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-4 inline-block"
			>
				← Back to Dashboard
			</a>
			<div class="bg-white rounded-xl shadow-md p-8">
				<h1 class="text-3xl font-bold text-gray-900 mb-2">{game.title}</h1>
				{#if game.description}
					<p class="text-gray-600 mb-4">{game.description}</p>
				{/if}
				<div class="flex gap-4 text-sm text-gray-500">
					<span>Created: {new Date(game.createdAt).toLocaleDateString()}</span>
					<span>Steps: {game.steps?.length || 0}</span>
				</div>
			</div>
		</div>

		<!-- Active Sessions Warning -->
		{#if data.activeSessionCount > 0}
			<div class="mb-8">
				<div class="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-6">
					<div class="flex items-start gap-3">
						<svg class="h-6 w-6 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
						<div class="flex-1">
							<h3 class="text-lg font-semibold text-amber-900 mb-1">⚠️ Editing disabled</h3>
							<p class="text-sm text-amber-800 mb-2">
								This game has <strong>{data.activeSessionCount}</strong> active session{data.activeSessionCount > 1 ? 's' : ''} in progress. 
								You cannot add, edit, reorder, or delete steps while sessions are active.
							</p>
							<p class="text-xs text-amber-700">
								Modifying steps would break the progression for active players. Wait for all sessions to complete or mark them as inactive.
							</p>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Steps Section -->
		<div class="bg-white rounded-xl shadow-md overflow-hidden">
			<div class="px-8 py-6 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-bold text-gray-900">Game Steps</h2>
					{#if data.activeSessionCount === 0}
						<p class="text-sm text-gray-500">Glissez-deposez pour reordonner</p>
					{/if}
					{#if data.activeSessionCount > 0}
						<button
							type="button"
							disabled
							class="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg font-semibold cursor-not-allowed"
							title="Cannot add steps while sessions are active"
						>
							+ Add Step
						</button>
					{:else}
						<a
							href={resolve(`/admin/games/${game.id}/steps/new`)}
							class="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
						>
							+ Add Step
						</a>
					{/if}
				</div>
			</div>

		<form 
			method="POST" 
			action="?/reorderSteps" 
			use:enhance={() => {
				return async ({ update }) => {
					await update({ reset: false });
				};
			}}
			bind:this={reorderForm}
		>
			<input type="hidden" name="order" bind:value={reorderPayload} />

			{#if steps.length > 0}
				<div class="divide-y divide-gray-200">
					{#each steps as step (step.id)}
						<div
							class="px-8 py-6 transition-colors {data.activeSessionCount === 0 ? 'hover:bg-gray-50 cursor-move' : 'cursor-default'}"
							draggable={data.activeSessionCount === 0}
							role="button"
							tabindex="0"
							aria-label={`Deplacer l'etape ${step.order}`}
							ondragstart={() => data.activeSessionCount === 0 && onDragStart(step.id)}
							ondragover={onDragOver}
							ondrop={() => data.activeSessionCount === 0 && onDrop(step.id)}
						>
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="flex items-center gap-3 mb-2">
										<span class="text-gray-400 text-sm">::</span>
										<span class="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">
											Step {step.order}
										</span>
										<span class="text-gray-500 text-sm">{step.type}</span>
									</div>
									<h3 class="text-lg font-semibold text-gray-900 mb-1">{step.title}</h3>
									{#if step.description}
										<p class="text-gray-600 text-sm">{step.description}</p>
									{/if}
								</div>
								<div class="inline-flex items-center gap-2">
								{#if data.activeSessionCount > 0}
									<button
										type="button"
										disabled
										class="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-gray-400 cursor-not-allowed"
										title="Cannot edit while sessions are active"
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
										</svg>
										Edit
									</button>
									<button
										type="button"
										disabled
										class="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-gray-400 cursor-not-allowed"
										title="Cannot delete while sessions are active"
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8" />
										</svg>
										Delete
									</button>
								{:else}
									<a
										href={resolve(`/admin/games/${game.id}/steps/${step.id}`)}
										class="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-3 py-1.5 text-indigo-700 hover:bg-indigo-100"
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
										</svg>
										Edit
									</a>
									<button
										type="button"
										onclick={() => openDeleteModal({ id: step.id, title: step.title, order: step.order })}
										class="inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-1.5 text-red-700 hover:bg-red-100"
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8" />
										</svg>
										Delete
									</button>
								{/if}
							</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="px-8 py-12 text-center">
					<svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 6v6m0 0v6m0-6h6m0 0h6"
						/>
					</svg>
					<p class="text-gray-500 mb-4">No steps yet. Add your first step to get started.</p>
					<a
						href={resolve(`/admin/games/${game.id}/steps/new`)}
						class="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
					>
						Add First Step
					</a>
				</div>
			{/if}
	</form>		</div>
	</div>
</div>
{#if stepToDelete}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
		<div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
			<h2 class="text-lg font-semibold text-gray-900">Confirm Deletion</h2>
			<p class="mt-2 text-sm text-gray-600">
				Are you sure you want to delete <span class="font-semibold text-gray-900">Step {stepToDelete.order}: {stepToDelete.title}</span>?
				This action cannot be undone.
			</p>

			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					onclick={closeDeleteModal}
					class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
				>
					Cancel
				</button>
				<form method="POST" action="?/deleteStep" use:enhance>
					<input type="hidden" name="stepId" value={stepToDelete.id} />
					<button
						type="submit"
						class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
					>
						Delete Step
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}

{#if stepToDelete}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
		<div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
			<h2 class="text-lg font-semibold text-gray-900">Confirm Deletion</h2>
			<p class="mt-2 text-sm text-gray-600">
				Are you sure you want to delete <span class="font-semibold text-gray-900">Step {stepToDelete.order}: {stepToDelete.title}</span>?
				This action cannot be undone.
			</p>

			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					onclick={closeDeleteModal}
					class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
				>
					Cancel
				</button>
				<form method="POST" action="?/deleteStep">
					<input type="hidden" name="stepId" value={stepToDelete.id} />
					<button
						type="submit"
						class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
					>
						Delete Step
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
