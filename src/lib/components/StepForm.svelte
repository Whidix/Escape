<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	type StepFormValues = {
		title: string;
		type: string;
		order: number | string;
		description: string;
		content: string;
		answer: string;
		hint: string;
		latitude?: number | string | null;
		longitude?: number | string | null;
		proximityRadius?: number | string;
	};

	let {
		gameId,
		gameTitle,
		heading,
		subheading,
		submitLabel,
		errorMessage,
		initialValues,
		maxOrder
	}: {
		gameId: number;
		gameTitle: string;
		heading: string;
		subheading: string;
		submitLabel: string;
		errorMessage?: string;
		initialValues: StepFormValues;
		maxOrder: number;
	} = $props();

	const stepTypes = ['question', 'text', 'puzzle', 'location'];
	let selectedType = $derived(initialValues.type || 'question');

	let fieldConfig = $derived.by(() => {
		switch (selectedType) {
			case 'text':
				return {
					contentLabel: 'Text to display',
					contentPlaceholder: 'Text shown to players',
					showLocation: false,
					showAnswer: false,
					showHint: false
				};
			case 'location':
				return {
					contentLabel: 'Location instruction',
					contentPlaceholder: 'Describe where players need to go',
					showLocation: true,
					showAnswer: true,
					showHint: true
				};
			case 'puzzle':
				return {
					contentLabel: 'Puzzle statement',
					contentPlaceholder: 'Describe the puzzle to solve',
					showLocation: false,
					showAnswer: true,
					showHint: true
				};
			default:
				return {
					contentLabel: 'Question',
					contentPlaceholder: 'Enter the question for players',
					showLocation: false,
					showAnswer: true,
					showHint: true
				};
		}
	});
</script>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-2xl mx-auto px-4 py-8">
		<div class="mb-8">
			<a
				href={resolve(`/admin/games/${gameId}`)}
				class="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-4 inline-block"
			>
				← Back to {gameTitle}
			</a>
			<h1 class="text-3xl font-bold text-gray-900 mb-2">{heading}</h1>
			<p class="text-gray-600">{subheading}</p>
		</div>

		<div class="bg-white rounded-xl shadow-md overflow-hidden">
			<form method="POST" use:enhance class="p-8 space-y-6">
				<div class="grid grid-cols-2 gap-6">
					<div class="col-span-2">
						<label for="title" class="block text-sm font-medium text-gray-700 mb-2">
							Step Title <span class="text-red-500">*</span>
						</label>
						<input
							id="title"
							type="text"
							name="title"
							value={initialValues.title}
							placeholder="Enter step title"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors"
							required
						/>
					</div>

					<div>
						<label for="type" class="block text-sm font-medium text-gray-700 mb-2">
							Type <span class="text-red-500">*</span>
						</label>
						<select
							id="type"
							name="type"
							bind:value={selectedType}
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors"
							required
						>
							{#each stepTypes as stepType (stepType)}
								<option value={stepType}>
									{stepType.charAt(0).toUpperCase() + stepType.slice(1)}
								</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="order" class="block text-sm font-medium text-gray-700 mb-2">
							Step Order
						</label>
						<input
							id="order"
							type="number"
							name="order"
							value={initialValues.order}
							min="1"
							max={maxOrder}
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors"
						/>
					</div>

					<div class="col-span-2">
						<label for="description" class="block text-sm font-medium text-gray-700 mb-2">
							Description
						</label>
						<textarea
							id="description"
							name="description"
							placeholder="Describe this step"
							rows="3"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors resize-none"
						>{initialValues.description}</textarea>
					</div>

					<div class="col-span-2">
						<label for="content" class="block text-sm font-medium text-gray-700 mb-2">
							{fieldConfig.contentLabel}
						</label>
						<textarea
							id="content"
							name="content"
							placeholder={fieldConfig.contentPlaceholder}
							rows="4"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors resize-none"
						>{initialValues.content}</textarea>
					</div>

					{#if fieldConfig.showAnswer}
						<div class="col-span-2">
							<label for="answer" class="block text-sm font-medium text-gray-700 mb-2">
								Expected answer
							</label>
							<input
								id="answer"
								type="text"
								name="answer"
								value={initialValues.answer}
								placeholder="Expected answer for this step"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors"
							/>
						</div>
					{/if}

					{#if fieldConfig.showHint}
						<div class="col-span-2">
							<label for="hint" class="block text-sm font-medium text-gray-700 mb-2">
								Hint
							</label>
							<textarea
								id="hint"
								name="hint"
								placeholder="Optional hint for players"
								rows="2"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors resize-none"
							>{initialValues.hint}</textarea>
						</div>
					{/if}

					{#if fieldConfig.showLocation}
						<div class="col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
							<h3 class="text-sm font-semibold text-blue-900 mb-4">Location Coordinates</h3>
							<div class="grid grid-cols-2 gap-4">
								<div>
									<label for="latitude" class="block text-sm font-medium text-gray-700 mb-2">
										Latitude <span class="text-red-500">*</span>
									</label>
									<input
										id="latitude"
										type="number"
										step="any"
										name="latitude"
										value={initialValues.latitude ?? ''}
										placeholder="e.g., 48.8566"
										class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors"
										required
									/>
								</div>
								<div>
									<label for="longitude" class="block text-sm font-medium text-gray-700 mb-2">
										Longitude <span class="text-red-500">*</span>
									</label>
									<input
										id="longitude"
										type="number"
										step="any"
										name="longitude"
										value={initialValues.longitude ?? ''}
										placeholder="e.g., 2.3522"
										class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors"
										required
									/>
								</div>
								<div class="col-span-2">
									<label for="proximityRadius" class="block text-sm font-medium text-gray-700 mb-2">
										Proximity Radius (meters)
									</label>
									<input
										id="proximityRadius"
										type="number"
										name="proximityRadius"
										value={initialValues.proximityRadius ?? 50}
										min="5"
										max="500"
										placeholder="50"
										class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors"
									/>
									<p class="text-xs text-gray-500 mt-1">Distance in meters within which the step will be validated (default: 50m)</p>
								</div>
							</div>
						</div>
					{/if}
				</div>

				{#if errorMessage}
					<div class="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
						{errorMessage}
					</div>
				{/if}

				<div class="flex gap-4 pt-4">
					<button
						type="submit"
						class="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
					>
						{submitLabel}
					</button>
					<a
						href={resolve(`/admin/games/${gameId}`)}
						class="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-center"
					>
						Cancel
					</a>
				</div>
			</form>
		</div>
	</div>
</div>
