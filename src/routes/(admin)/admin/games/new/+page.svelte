<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let title = $state('');
	let description = $state('');

	let { form }: { form: ActionData } = $props();
</script>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-2xl mx-auto px-4 py-8">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Create New Game</h1>
			<p class="text-gray-600">Create a new escape game and add steps to it.</p>
		</div>

		<div class="bg-white rounded-xl shadow-md overflow-hidden">
			<form method="POST" use:enhance class="p-8 space-y-6">
				<div>
					<label for="title" class="block text-sm font-medium text-gray-700 mb-2">
						Game Title <span class="text-red-500">*</span>
					</label>
					<input
						id="title"
						type="text"
						name="title"
						bind:value={title}
						placeholder="Enter game title"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors"
						required
					/>
					<p class="mt-1 text-sm text-gray-500">Minimum 3 characters</p>
				</div>

				<div>
					<label for="description" class="block text-sm font-medium text-gray-700 mb-2">
						Description
					</label>
					<textarea
						id="description"
						name="description"
						bind:value={description}
						placeholder="Describe your escape game"
						rows="6"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-colors resize-none"
					></textarea>
						<p class="mt-1 text-sm text-gray-500">Optional</p>
				</div>

				{#if form?.error}
					<div class="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
						{form.error}
					</div>
				{/if}

				<div class="flex gap-4 pt-4">
					<button
						type="submit"
						class="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
					>
						Create Game
					</button>
					<a
						href="/admin"
						class="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-center"
					>
						Cancel
					</a>
				</div>
			</form>
		</div>
	</div>
</div>
