<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import { t } from '$lib/i18n';

	let { data }: { data: PageData } = $props();

	function formatDuration(minutes: number): string {
		if (minutes < 60) {
			return `${Math.round(minutes)} min`;
		}

		const hours = Math.floor(minutes / 60);
		const remainingMinutes = Math.round(minutes % 60);
		return `${hours}h ${remainingMinutes}m`;
	}

</script>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-7xl mx-auto px-4 py-8">
		<div class="flex items-center justify-between mb-8">
			<h1 class="text-3xl font-bold text-gray-900">{$t.admin.adminDashboard}</h1>
			<a
				href={resolve('/admin/sessions/new')}
				class="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
			>
				{$t.admin.createSession}
			</a>
		</div>
		<!-- Stats Overview -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
			<div class="bg-white rounded-xl shadow-md p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">{$t.admin.totalGames}</p>
						<p class="text-3xl font-bold text-gray-900 mt-2">{data.stats?.totalGames || 0}</p>
					</div>
					<div class="bg-indigo-100 rounded-full p-3">
						<svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-xl shadow-md p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">{$t.admin.activeSessions}</p>
						<p class="text-3xl font-bold text-gray-900 mt-2">{data.stats?.activeSessions || 0}</p>
					</div>
					<div class="bg-green-100 rounded-full p-3">
						<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-xl shadow-md p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">{$t.admin.totalPlayers}</p>
						<p class="text-3xl font-bold text-gray-900 mt-2">{data.stats?.totalPlayers || 0}</p>
					</div>
					<div class="bg-blue-100 rounded-full p-3">
						<svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
					</div>
				</div>
			</div>
		</div>

		<!-- Current & Incoming Sessions -->
		<div class="mb-8 bg-white rounded-xl shadow-md overflow-hidden">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-xl font-bold text-gray-900">{$t.admin.currentAndIncomingSessions}</h2>
			</div>

			{#if data.currentAndIncomingSessions && data.currentAndIncomingSessions.length > 0}
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									{$t.admin.code}
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									{$t.admin.game}
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									{$t.admin.status}
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									{$t.admin.players}
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									{$t.admin.expires}
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each data.currentAndIncomingSessions as session (session.id)}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="font-mono text-sm font-medium text-gray-900">{session.code}</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{session.gameName}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class={`px-2 py-1 text-xs font-semibold rounded-full ${
											session.startedAt && !session.completedAt
												? 'bg-green-100 text-green-800'
												: 'bg-blue-100 text-blue-800'
										}`}>
											{session.startedAt && !session.completedAt ? $t.admin.current : $t.admin.incoming}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{session.playerCount || 0}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{new Date(session.expiresAt).toLocaleString()}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="px-6 py-12 text-center text-gray-500">
					{$t.admin.noCurrentOrIncomingSessions}
				</div>
			{/if}
		</div>

		<!-- Mean Resolution Time Graph -->
		<div class="bg-white rounded-xl shadow-md overflow-hidden">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-xl font-bold text-gray-900">{$t.admin.meanResolutionTime}</h2>
			</div>

			{#if data.resolutionMetrics && data.resolutionMetrics.length > 0}
				<div class="p-6 space-y-4">
					{#each data.resolutionMetrics as metric (metric.gameId)}
						<div class="space-y-2">
							<div class="flex items-center justify-between gap-3">
								<div class="text-sm font-medium text-gray-900 truncate">{metric.gameTitle}</div>
								<div class="text-sm text-gray-600 whitespace-nowrap">
									{formatDuration(metric.meanResolutionMinutes)}
									<span class="text-gray-400">({metric.completedSessions})</span>
								</div>
							</div>
							<div class="h-3 w-full rounded-full bg-gray-100">
								<div
									class="h-3 rounded-full bg-indigo-500"
									style={`width: ${Math.max(
										6,
										(metric.meanResolutionMinutes / (data.maxMeanResolutionMinutes || 1)) * 100
									)}%`}
								></div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="px-6 py-12 text-center">
					<p class="text-gray-500">{$t.admin.noResolutionData}</p>
				</div>
			{/if}
		</div>
	</div>
</div>
