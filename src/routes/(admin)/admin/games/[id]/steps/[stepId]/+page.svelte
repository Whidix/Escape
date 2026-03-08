<script lang="ts">
	import StepForm from '$lib/components/StepForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let formMap = $derived.by<Record<string, unknown>>(() => (form ?? {}) as Record<string, unknown>);

	let initialValues = $derived.by(() => ({
		title: typeof formMap.title === 'string' ? formMap.title : data.step.title,
		type: typeof formMap.type === 'string' ? formMap.type : data.step.type,
		order:
			typeof formMap.order === 'number' || typeof formMap.order === 'string'
				? formMap.order
				: data.step.order,
		description:
			typeof formMap.description === 'string'
				? formMap.description
				: (data.step.description ?? ''),
		content: typeof formMap.content === 'string' ? formMap.content : (data.step.content ?? ''),
		answer: typeof formMap.answer === 'string' ? formMap.answer : (data.step.answer ?? ''),
		hint: typeof formMap.hint === 'string' ? formMap.hint : (data.step.hint ?? ''),
		latitude: typeof formMap.latitude === 'string' || typeof formMap.latitude === 'number' 
			? formMap.latitude 
			: data.step.latitude,
		longitude: typeof formMap.longitude === 'string' || typeof formMap.longitude === 'number'
			? formMap.longitude
			: data.step.longitude,
		proximityRadius: typeof formMap.proximityRadius === 'string' || typeof formMap.proximityRadius === 'number'
			? formMap.proximityRadius
			: (data.step.proximityRadius ?? 50),
		imageUrl: typeof formMap.imageUrl === 'string' ? formMap.imageUrl : (data.step.imageUrl ?? null),
		puzzlePieces: typeof formMap.puzzlePieces === 'string' || typeof formMap.puzzlePieces === 'number'
			? formMap.puzzlePieces
			: (data.step.puzzlePieces ?? 9)
	}));
</script>

{#if data.activeSessionCount > 0}
	<div class="max-w-4xl mx-auto px-4 pt-8">
		<div class="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6">
			<div class="flex items-start gap-3">
				<svg class="h-6 w-6 text-red-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<div class="flex-1">
					<h3 class="text-lg font-semibold text-red-900 mb-1">🚫 Cannot edit step</h3>
					<p class="text-sm text-red-800 mb-2">
						This game has <strong>{data.activeSessionCount}</strong> active session{data.activeSessionCount > 1 ? 's' : ''} in progress. 
						Editing steps would break the progression for active players.
					</p>
					<p class="text-xs text-red-700">
						Wait for all sessions to complete or mark them as inactive before modifying this step.
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}

<StepForm
	gameId={data.game.id}
	gameTitle={data.game.title}
	heading="Edit Step"
	subheading="Modify this step for your escape game."
	submitLabel="Save Changes"
	errorMessage={form?.error}
	{initialValues}
	maxOrder={data.totalSteps}
	disabled={data.activeSessionCount > 0}
/>
