<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import type { LayoutData } from './$types';
	import { t } from '$lib/i18n';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	let inventoryOpen = $state(false);
	let tutorialOpen = $state(false);
	let dragStartY = $state(0);
	let dragCurrentY = $state(0);

	const isCompletePage = $derived($page.url.pathname.endsWith('/complete'));
	const showMenu = $derived(!isCompletePage);

	const openInventory = () => {
		inventoryOpen = true;
	};

	const closeInventory = () => {
		inventoryOpen = false;
		dragStartY = 0;
		dragCurrentY = 0;
	};

	const toggleTutorial = () => {
		tutorialOpen = !tutorialOpen;
	};

	const closeTutorial = () => {
		tutorialOpen = false;
	};

	const handleTouchStart = (e: TouchEvent) => {
		dragStartY = e.touches[0].clientY;
		dragCurrentY = e.touches[0].clientY;
	};

	const handleTouchMove = (e: TouchEvent) => {
		dragCurrentY = e.touches[0].clientY;
	};

	const handleTouchEnd = () => {
		const dragDistance = dragCurrentY - dragStartY;
		if (dragDistance > 100) {
			closeInventory();
		}
		dragStartY = 0;
		dragCurrentY = 0;
	};

	$effect(() => {
		if (!showMenu || !inventoryOpen) {
			dragStartY = 0;
			dragCurrentY = 0;
		}

		if (!showMenu && inventoryOpen) {
			inventoryOpen = false;
		}
	});
</script>

<div class:pb-28={showMenu}>
	{@render children()}
</div>

{#if showMenu}
	<nav class="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 px-3 py-2 backdrop-blur sm:px-4">
		<div class="mx-auto grid max-w-4xl grid-cols-4 gap-2">
			<button
				type="button"
				onclick={openInventory}
				class="rounded-lg bg-indigo-600 px-3 py-2 text-center text-indigo-700 transition-colors hover:bg-indigo-700 flex items-center justify-center"
				aria-label="{$t.gameplay.inventory}"
			>
				<svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4l1-12z" />
				</svg>
			</button>

			<button
				type="button"
				onclick={toggleTutorial}
				class="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-center transition-colors hover:bg-indigo-100 flex items-center justify-center"
				aria-label="{$t.gameplay.tutorial}"
			>
				<svg class="h-5 w-5 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</button>

			{#if data.previousStepId}
				<form method="GET" action={resolve('/(game)/game/play/[sessionCode]', { sessionCode: data.sessionCode })}>
					<input type="hidden" name="step" value={data.previousStepId} />
					<button
						type="submit"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
					>
						{$t.gameplay.previous}
					</button>
				</form>
			{:else}
				<span class="rounded-lg border border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-400">
					{$t.gameplay.previous}
				</span>
			{/if}

			{#if data.nextStepId}
				<form method="GET" action={resolve('/(game)/game/play/[sessionCode]', { sessionCode: data.sessionCode })}>
					<input type="hidden" name="step" value={data.nextStepId} />
					<button
						type="submit"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
					>
						{$t.gameplay.next}
					</button>
				</form>
			{:else}
				<span class="rounded-lg border border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-400">
					{$t.gameplay.next}
				</span>
			{/if}
		</div>
	</nav>

	{#if inventoryOpen}
		<div
			class="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300"
			onclick={closeInventory}
			onkeydown={(e) => {
				if (e.key === 'Escape') closeInventory();
			}}
			role="button"
			tabindex={0}
		></div>
		<div
			class="fixed bottom-0 left-0 right-0 z-50 flex max-h-[80vh] flex-col overflow-y-auto rounded-t-2xl bg-white shadow-lg transition-transform duration-300"
			style="transform: translateY({Math.max(0, dragCurrentY - dragStartY)}px)"
			role="dialog"
			aria-label="Inventory"
			aria-modal="true"
			tabindex={-1}
			ontouchstart={handleTouchStart}
			ontouchmove={handleTouchMove}
			ontouchend={handleTouchEnd}
		>
			<div
				class="sticky top-0 select-none border-b border-gray-200 bg-white px-4 py-4"
				role="button"
				tabindex={0}
				ontouchstart={handleTouchStart}
				ontouchmove={handleTouchMove}
				ontouchend={handleTouchEnd}
				onkeydown={(e) => {
					if (e.key === ' ' || e.key === 'Enter') {
						closeInventory();
					}
				}}
				aria-label="Drag to close inventory"
			>
				<div class="mb-2 flex items-center justify-center">
					<div class="h-1 w-12 rounded-full bg-gray-300"></div>
				</div>
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-bold text-gray-900">{$t.gameplay.collectedItems}</h3>
					<button
						type="button"
						onclick={closeInventory}
						class="text-gray-400 hover:text-gray-600"
						aria-label="Close inventory"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			<div class="px-4 py-4">
				{#if data.collectedItems && data.collectedItems.length > 0}
					<div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
						{#each data.collectedItems as item (item.id)}
							<div class="rounded-lg border border-gray-200 p-3 text-center">
								{#if item.imageUrl}
									<img src={item.imageUrl} alt={item.name} class="mb-2 h-24 w-full rounded object-cover" />
								{/if}
								<p class="text-sm font-medium text-gray-900">{item.name}</p>
							</div>
						{/each}
					</div>
				{:else}
					<p class="py-8 text-center text-sm text-gray-500">{$t.gameplay.emptyInventory}</p>
				{/if}
			</div>
		</div>
	{/if}

	{#if tutorialOpen}
		<div
			class="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300"
			onclick={closeTutorial}
			onkeydown={(e) => {
				if (e.key === 'Escape') closeTutorial();
			}}
			role="button"
			tabindex={0}
		></div>
		<div
			class="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
			role="dialog"
			aria-label="Tutorial"
			aria-modal="true"
		>
			<div class="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-lg sm:p-7">
				<div class="flex items-start justify-between mb-5">
					<div>
						<h1 class="text-2xl font-bold text-gray-900">{$t.gameplay.tutorialTitle}</h1>
						<p class="mt-1 text-sm text-gray-700 sm:text-base">{$t.gameplay.tutorialIntro}</p>
					</div>
					<button
						type="button"
						onclick={closeTutorial}
						class="text-gray-400 hover:text-gray-600"
						aria-label="Close tutorial"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

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

				<button
					type="button"
					onclick={closeTutorial}
					class="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-700"
				>
					Close
				</button>
			</div>
		</div>
	{/if}
{/if}
