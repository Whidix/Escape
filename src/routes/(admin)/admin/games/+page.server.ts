import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { escapeGame } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const gamesRaw = await db.query.escapeGame.findMany({
		orderBy: (game, { desc }) => [desc(game.createdAt)],
		where: (game, { eq }) => eq(game.isDeleted, false),
		with: {
			steps: true,
			sessions: true
		}
	});

	const games = gamesRaw.map((game) => ({
		id: game.id,
		title: game.title,
		description: game.description ?? undefined,
		stepCount: game.steps.length,
		sessionCount: game.sessions.length,
		createdAt: game.createdAt.toISOString()
	}));

	if (!Array.isArray(games)) {
		error(500, 'Failed to load games');
	}

	return {
		games
	};
};

export const actions: Actions = {
	deleteGame: async ({ request }) => {
		const formData = await request.formData();
		const rawGameId = formData.get('gameId')?.toString() ?? '';
		const gameId = Number.parseInt(rawGameId, 10);

		if (!Number.isInteger(gameId) || gameId <= 0) {
			return fail(400, {
				error: 'Invalid game ID'
			});
		}

		const existingGame = await db.query.escapeGame.findFirst({
			where: eq(escapeGame.id, gameId),
			columns: { id: true }
		});

		if (!existingGame) {
			return fail(404, {
				error: 'Game not found'
			});
		}

		await db.update(escapeGame).set({ isDeleted: true }).where(eq(escapeGame.id, gameId));

		return { success: true };
	}
};
