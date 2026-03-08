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
		imageUrl?: string | null;
		puzzlePieces?: number | string;
	};

	let {
		gameId,
		gameTitle,
		heading,
		subheading,
		submitLabel,
		errorMessage,
		initialValues,
		maxOrder,
		disabled = false
	}: {
		gameId: number;
		gameTitle: string;
		heading: string;
		subheading: string;
		submitLabel: string;
		errorMessage?: string;
		initialValues: StepFormValues;
		maxOrder: number;
		disabled?: boolean;
	} = $props();

	const stepTypes = ['question', 'text', 'puzzle', 'location'];
	let selectedType = $derived(initialValues.type || 'question');
	let currentImageUrl = $state<string | null>(null);
	let selectedFileName = $state<string | null>(null);

	// Initialize image URL from initialValues
	$effect(() => {
		if (initialValues.imageUrl && !currentImageUrl) {
			currentImageUrl = initialValues.imageUrl;
		}
	});

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (file) {
			selectedFileName = file.name;
			// Create a preview URL for the selected image
			const reader = new FileReader();
			reader.onload = (e) => {
				currentImageUrl = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		} else {
			selectedFileName = null;
			if (!initialValues.imageUrl) {
				currentImageUrl = null;
			}
		}
	}

	function clearImage() {
		currentImageUrl = initialValues.imageUrl || null;
		selectedFileName = null;
		const fileInput = document.getElementById('puzzleImage') as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
	}
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
			<form method="POST" use:enhance enctype="multipart/form-data" class="p-8 space-y-6">
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

					{#if selectedType === 'text'}
						<div class="col-span-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
							<h3 class="text-sm font-semibold text-gray-900 mb-4">Text Content</h3>
							<div class="space-y-4">
								<div>
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
								<div>
									<label for="content" class="block text-sm font-medium text-gray-700 mb-2">
										Text to display
									</label>
									<textarea
										id="content"
										name="content"
										placeholder="Text shown to players"
										rows="4"
										class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors resize-none"
									>{initialValues.content}</textarea>
								</div>
							</div>
						</div>
					{:else if selectedType === 'question'}
						<div class="col-span-2 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
							<h3 class="text-sm font-semibold text-indigo-900 mb-4">Question Configuration</h3>
							<div class="space-y-4">
								<div>
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
								<div>
									<label for="content" class="block text-sm font-medium text-gray-700 mb-2">
										Question
									</label>
									<textarea
										id="content"
										name="content"
										placeholder="Enter the question for players"
										rows="4"
										class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors resize-none"
									>{initialValues.content}</textarea>
								</div>
								<div>
									<label for="answer" class="block text-sm font-medium text-gray-700 mb-2">
										Expected answer <span class="text-red-500">*</span>
									</label>
									<input
										id="answer"
										type="text"
										name="answer"
										value={initialValues.answer}
										placeholder="Expected answer for this step"
										class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors"
										required
									/>
								</div>
								<div>
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
							</div>
						</div>
					{:else if selectedType === 'puzzle'}
						<div class="col-span-2 p-4 bg-purple-50 rounded-lg border border-purple-200">
							<h3 class="text-sm font-semibold text-purple-900 mb-4">Puzzle Configuration</h3>
							<div class="space-y-4">
								<div>
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
								<div>
									<label for="content" class="block text-sm font-medium text-gray-700 mb-2">
										Puzzle statement
									</label>
									<textarea
										id="content"
										name="content"
										placeholder="Describe the puzzle to solve"
										rows="4"
										class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors resize-none"
									>{initialValues.content}</textarea>
								</div>
								<div>
									<label for="puzzleImage" class="block text-sm font-medium text-gray-700 mb-2">
										Puzzle Image {#if !initialValues.imageUrl}<span class="text-red-500">*</span>{/if}
									</label>
									<input
										id="puzzleImage"
										type="file"
										name="puzzleImage"
										accept="image/jpeg,image/png,image/gif,image/webp"
										onchange={handleFileSelect}
										class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
									/>
									{#if selectedFileName}
										<p class="text-sm text-green-600 mt-2 flex items-center gap-1">
											<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
											</svg>
											Selected: {selectedFileName}
										</p>
									{/if}
									{#if currentImageUrl}
										<div class="mt-3 space-y-2">
											<p class="text-sm text-gray-600 font-medium">
												{selectedFileName ? 'Preview of new image:' : 'Current image:'}
											</p>
											<div class="relative inline-block">
												<img src={currentImageUrl} alt="Puzzle preview" class="max-w-sm max-h-64 rounded-lg border-2 border-purple-300 shadow-md" />
												{#if selectedFileName}
													<button
														type="button"
														onclick={clearImage}
														class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
														title="Remove selected image"
													>
														<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
														</svg>
													</button>
												{/if}
											</div>
										</div>
									{/if}
									{#if initialValues.imageUrl && !selectedFileName}
										<input type="hidden" name="existingImageUrl" value={initialValues.imageUrl} />
									{/if}
									<p class="text-xs text-gray-500 mt-2">
										Upload an image for the puzzle. Accepted formats: JPG, PNG, GIF, WebP (max 10MB)
									</p>
								</div>
								<div>
									<label for="puzzlePieces" class="block text-sm font-medium text-gray-700 mb-2">
										Number of Pieces
									</label>
									<input
										id="puzzlePieces"
										type="number"
										name="puzzlePieces"
										value={initialValues.puzzlePieces ?? 9}
										min="4"
										max="100"
										placeholder="9"
										class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors"
									/>
									<p class="text-xs text-gray-500 mt-1">Recommended: 4 (2×2), 9 (3×3), 16 (4×4), or 25 (5×5) pieces</p>
								</div>
								<div>
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
							</div>
						</div>
					{:else if selectedType === 'location'}
						<div class="col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
							<h3 class="text-sm font-semibold text-blue-900 mb-4">Location Configuration</h3>
							<div class="space-y-4">
								<div>
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
								<div>
									<label for="content" class="block text-sm font-medium text-gray-700 mb-2">
										Location instruction
									</label>
									<textarea
										id="content"
										name="content"
										placeholder="Describe where players need to go"
										rows="4"
										class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors resize-none"
									>{initialValues.content}</textarea>
								</div>
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
								<div>
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
						{disabled}
						class="flex-1 py-3 px-6 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
						class:bg-indigo-600={!disabled}
						class:text-white={!disabled}
						class:hover:bg-indigo-700={!disabled}
						class:focus:ring-indigo-500={!disabled}
						class:bg-gray-300={disabled}
						class:text-gray-500={disabled}
						class:cursor-not-allowed={disabled}
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
