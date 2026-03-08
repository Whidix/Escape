import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { gameSession } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const requestedGameId = Number.parseInt(url.searchParams.get('gameId') ?? '', 10);
	const selectedGameId = Number.isInteger(requestedGameId) && requestedGameId > 0 ? requestedGameId : null;

	const gamesRaw = await db.query.escapeGame.findMany({
		orderBy: (game, { asc }) => [asc(game.title)]
	});

	const sessionsRaw = await db.query.gameSession.findMany({
		where: selectedGameId ? eq(gameSession.escapeGameId, selectedGameId) : undefined,
		orderBy: (session, { desc }) => [desc(session.createdAt)],
		with: {
			escapeGame: true,
			players: true
		}
	});

	return {
		selectedGameId,
		games: gamesRaw.map((game) => ({
			id: game.id,
			title: game.title
		})),
		sessions: sessionsRaw.map((session) => ({
			id: session.id,
			code: session.code,
			gameId: session.escapeGameId,
			gameTitle: session.escapeGame.title,
			isActive: session.isActive === 1,
			players: session.players.length,
			createdAt: session.createdAt.toISOString(),
			expiresAt: session.expiresAt.toISOString(),
			startedAt: session.startedAt ? new Date(session.startedAt).toISOString() : null,
			completedAt: session.completedAt ? new Date(session.completedAt).toISOString() : null
		}))
	};
};

export const actions: Actions = {
	toggleStatus: async ({ request, url }) => {
		const formData = await request.formData();
		const sessionId = Number.parseInt(formData.get('sessionId')?.toString() ?? '', 10);
		const currentStatus = Number.parseInt(formData.get('currentStatus')?.toString() ?? '', 10);

		if (!Number.isInteger(sessionId) || sessionId <= 0) {
			return fail(400, { error: 'Invalid session ID' });
		}

		if (![0, 1].includes(currentStatus)) {
			return fail(400, { error: 'Invalid status value' });
		}

		await db
			.update(gameSession)
			.set({ isActive: currentStatus === 1 ? 0 : 1 })
			.where(eq(gameSession.id, sessionId));

		redirect(303, `${url.pathname}${url.search}`);
	},
	deleteSession: async ({ request, url }) => {
		const formData = await request.formData();
		const sessionId = Number.parseInt(formData.get('sessionId')?.toString() ?? '', 10);

		if (!Number.isInteger(sessionId) || sessionId <= 0) {
			return fail(400, { error: 'Invalid session ID' });
		}

		await db.delete(gameSession).where(eq(gameSession.id, sessionId));

		return {
			success: true,
			redirectTo: `${url.pathname}${url.search}`
		};
	}
};
