import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { escapeGame, gameSession } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

function toDateTimeLocalInputValue(value: Date | string): string {
	const date = value instanceof Date ? value : new Date(value);
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, '0');
	const day = `${date.getDate()}`.padStart(2, '0');
	const hours = `${date.getHours()}`.padStart(2, '0');
	const minutes = `${date.getMinutes()}`.padStart(2, '0');
	return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export const load: PageServerLoad = async ({ params }) => {
	const sessionId = Number.parseInt(params.id, 10);
	if (!Number.isInteger(sessionId) || sessionId <= 0) {
		error(400, 'Invalid session ID');
	}

	const session = await db.query.gameSession.findFirst({
		where: eq(gameSession.id, sessionId),
		with: {
			escapeGame: true
		}
	});

	if (!session) {
		error(404, 'Session not found');
	}

	const gamesRaw = await db.query.escapeGame.findMany({
		orderBy: (game, { asc }) => [asc(game.title)],
		columns: {
			id: true,
			title: true
		}
	});

	return {
		session: {
			id: session.id,
			code: session.code,
			gameId: session.escapeGameId,
			expiresAt: toDateTimeLocalInputValue(session.expiresAt),
			isActive: session.isActive === 1
		},
		games: gamesRaw
	};
};

export const actions: Actions = {
	default: async ({ params, request }) => {
		const formData = await request.formData();
		const rawGameId = formData.get('gameId')?.toString() ?? '';
		const rawExpiresAt = formData.get('expiresAt')?.toString() ?? '';
		const isActive = formData.get('isActive') === 'on';

		const sessionId = Number.parseInt(params.id, 10);
		if (!Number.isInteger(sessionId) || sessionId <= 0) {
			return fail(400, {
				error: 'Invalid session ID',
				gameId: rawGameId,
				expiresAt: rawExpiresAt,
				isActive
			});
		}

		const gameId = Number.parseInt(rawGameId, 10);
		const expiresAt = new Date(rawExpiresAt);

		if (!Number.isInteger(gameId) || gameId <= 0) {
			return fail(400, {
				error: 'Please select a valid game',
				gameId: rawGameId,
				expiresAt: rawExpiresAt,
				isActive
			});
		}

		if (!rawExpiresAt || Number.isNaN(expiresAt.getTime())) {
			return fail(400, {
				error: 'Please provide a valid expiration date and time',
				gameId: rawGameId,
				expiresAt: rawExpiresAt,
				isActive
			});
		}

		const existingGame = await db.query.escapeGame.findFirst({
			where: eq(escapeGame.id, gameId),
			columns: { id: true }
		});

		if (!existingGame) {
			return fail(404, {
				error: 'Selected game does not exist',
				gameId: rawGameId,
				expiresAt: rawExpiresAt,
				isActive
			});
		}

		const existingSession = await db.query.gameSession.findFirst({
			where: eq(gameSession.id, sessionId),
			columns: { id: true }
		});

		if (!existingSession) {
			return fail(404, {
				error: 'Session not found',
				gameId: rawGameId,
				expiresAt: rawExpiresAt,
				isActive
			});
		}

		await db
			.update(gameSession)
			.set({
				escapeGameId: gameId,
				expiresAt,
				isActive: isActive ? 1 : 0
			})
			.where(eq(gameSession.id, sessionId));

		redirect(303, `/admin/sessions?gameId=${gameId}`);
	}
};
