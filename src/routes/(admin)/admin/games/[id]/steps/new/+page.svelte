<script lang="ts">
	import StepForm from '$lib/components/StepForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let formMap = $derived.by<Record<string, unknown>>(() => (form ?? {}) as Record<string, unknown>);

	let initialValues = $derived.by(() => ({
		title: typeof formMap.title === 'string' ? formMap.title : '',
		type: typeof formMap.type === 'string' ? formMap.type : 'question',
		order:
			typeof formMap.order === 'number' || typeof formMap.order === 'string'
				? formMap.order
				: data.nextStepOrder,
		description: typeof formMap.description === 'string' ? formMap.description : '',
		content: typeof formMap.content === 'string' ? formMap.content : '',
		answer: typeof formMap.answer === 'string' ? formMap.answer : '',
		hint: typeof formMap.hint === 'string' ? formMap.hint : '',
		latitude: typeof formMap.latitude === 'string' || typeof formMap.latitude === 'number'
			? formMap.latitude
			: '',
		longitude: typeof formMap.longitude === 'string' || typeof formMap.longitude === 'number'
			? formMap.longitude
			: '',
		proximityRadius: typeof formMap.proximityRadius === 'string' || typeof formMap.proximityRadius === 'number'
			? formMap.proximityRadius
			: 50
	}));
</script>

<StepForm
	gameId={data.game.id}
	gameTitle={data.game.title}
	heading="Add New Step"
	subheading="Create a new step for your escape game."
	submitLabel="Create Step"
	errorMessage={form?.error}
	{initialValues}
	maxOrder={data.nextStepOrder}
/>
