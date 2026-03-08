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
			: (data.step.proximityRadius ?? 50)
	}));
</script>

<StepForm
	gameId={data.game.id}
	gameTitle={data.game.title}
	heading="Edit Step"
	subheading="Modify this step for your escape game."
	submitLabel="Save Changes"
	errorMessage={form?.error}
	{initialValues}
	maxOrder={data.totalSteps}
/>
