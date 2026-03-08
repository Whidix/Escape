<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { t } from '$lib/i18n';

	let { children } = $props();
</script>

<div class="flex h-screen bg-gray-50">
	<aside class="hidden w-72 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
		<div class="border-b border-gray-200 px-6 py-5">
			<h2 class="text-lg font-bold text-gray-900">{$t.admin?.adminDashboard || 'Admin'}</h2>
			<p class="mt-1 text-sm text-gray-500">{$t.admin?.adminDashboard || 'Dashboard menu'}</p>
		</div>

		<nav class="flex-1 space-y-2 px-4 py-4">
			<a
				href={resolve('/admin')}
				class={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
					$page.url.pathname === '/admin' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
				}`}
			>
				{$t.admin?.adminDashboard || 'Dashboard'}
			</a>
			<a
				href={resolve('/admin/games')}
				class={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
					$page.url.pathname.startsWith('/admin/games')
						? 'bg-indigo-50 text-indigo-700'
						: 'text-gray-700 hover:bg-gray-100'
				}`}
			>
				{$t.admin?.game || 'Games'}
			</a>
			<a
				href={resolve('/admin/sessions')}
				class={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
					$page.url.pathname.startsWith('/admin/sessions')
						? 'bg-indigo-50 text-indigo-700'
						: 'text-gray-700 hover:bg-gray-100'
				}`}
			>
				{$t.admin?.sessions || 'Sessions'}
			</a>
		</nav>

		<div class="border-t border-gray-200 p-4">
			<form method="POST" action="/admin?/logout">
				<button
					type="submit"
					class="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
				>
					{$t.admin?.logout || 'Logout'}
				</button>
			</form>
		</div>
	</aside>

	<main class="min-w-0 flex-1 overflow-auto">
		<div class="border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
			<p class="text-sm font-semibold text-gray-700">{$t.admin?.adminDashboard || 'Admin'}</p>
		</div>
		{@render children()}
	</main>
</div>
