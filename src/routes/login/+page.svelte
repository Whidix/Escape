<script lang="ts">
	import { enhance } from '$app/forms';
	import { t } from '$lib/i18n';
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';

	let email = $state('');
	let password = $state('');
	let name = $state('');

	let { form, data }: { form: ActionData; data: PageData } = $props();
	const noUsersExist = $derived(data?.noUsersExist ?? false);
</script>

<div class="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
	<div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
		{#if noUsersExist}
			<h1 class="text-3xl font-bold text-gray-900 mb-2 text-center">
				Créer le premier utilisateur
			</h1>
			<p class="text-gray-600 mb-8 text-center">
				Aucun utilisateur n'existe. Créez le premier compte administrateur.
			</p>

			<form method="POST" action="?/createFirstUser" use:enhance class="space-y-6">
				<div>
					<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
						Nom
					</label>
					<input
						id="name"
						type="text"
						name="name"
						bind:value={name}
						placeholder="John Doe"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
					/>
				</div>

				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
						Email
					</label>
					<input
						id="email"
						type="email"
						name="email"
						bind:value={email}
						placeholder="admin@example.com"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
						required
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
						Mot de passe
					</label>
					<input
						id="password"
						type="password"
						name="password"
						bind:value={password}
						placeholder="••••••••"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
						required
					/>
				</div>

				{#if form?.message}
					<div class="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
						{form.message}
					</div>
				{/if}

				<button
					type="submit"
					class="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					Créer le compte
				</button>
			</form>
		{:else}
			<h1 class="text-3xl font-bold text-gray-900 mb-2 text-center">
				{$t.login?.login || 'Login'}
			</h1>
			<p class="text-gray-600 mb-8 text-center">
				{$t.login?.accessAdmin || 'Access the admin dashboard'}
			</p>

			<form method="POST" action="?/signIn" use:enhance class="space-y-6">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
						Email
					</label>
					<input
						id="email"
						type="email"
						name="email"
						bind:value={email}
						placeholder="admin@example.com"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
						required
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
						Password
					</label>
					<input
						id="password"
						type="password"
						name="password"
						bind:value={password}
						placeholder="••••••••"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
						required
					/>
				</div>

				{#if form?.message}
					<div class="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
						{form.message}
					</div>
				{/if}

				<button
					type="submit"
					class="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{$t.login?.login || 'Login'}
				</button>
			</form>
		{/if}

		<div class="mt-6 pt-6 border-t border-gray-200 text-center">
			<a href={resolve('/')} class="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
				← {$t.home?.title || 'Back Home'}
			</a>
		</div>
	</div>
</div>
