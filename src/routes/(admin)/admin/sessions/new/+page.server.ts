import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { escapeGame, gameSession } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const SESSION_CODE_LENGTH = 6;
const SESSION_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_SESSION_CODE_ATTEMPTS = 10;

function generateSessionCode(): string {
	return Array.from({ length: SESSION_CODE_LENGTH }, () => {
		const randomIndex = Math.floor(Math.random() * SESSION_CODE_ALPHABET.length);
		return SESSION_CODE_ALPHABET[randomIndex];
	}).join('');
}

async function createUniqueSessionCode(): Promise<string | null> {
	for (let attempt = 0; attempt < MAX_SESSION_CODE_ATTEMPTS; attempt += 1) {
		const code = generateSessionCode();
		const existing = await db.query.gameSession.findFirst({
			where: eq(gameSession.code, code),
			columns: { id: true }
		});

		if (!existing) {
			return code;
		}
	}

	return null;
}

export const load: PageServerLoad = async ({ url }) => {
	const requestedGameId = Number.parseInt(url.searchParams.get('gameId') ?? '', 10);
	const selectedGameId = Number.isInteger(requestedGameId) && requestedGameId > 0 ? requestedGameId : null;

	const gamesRaw = await db.query.escapeGame.findMany({
		orderBy: (game, { asc }) => [asc(game.title)],
		columns: {
			id: true,
			title: true
		}
	});

	return {
		selectedGameId,
		games: gamesRaw
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const rawGameId = formData.get('gameId')?.toString() ?? '';
		const rawExpiresAt = formData.get('expiresAt')?.toString() ?? '';

		const gameId = Number.parseInt(rawGameId, 10);
		const expiresAt = new Date(rawExpiresAt);

		if (!Number.isInteger(gameId) || gameId <= 0) {
			return fail(400, {
				error: 'Please select a valid game',
				gameId: rawGameId,
				expiresAt: rawExpiresAt
			});
		}

		if (!rawExpiresAt || Number.isNaN(expiresAt.getTime())) {
			return fail(400, {
				error: 'Please provide a valid expiration date and time',
				gameId: rawGameId,
				expiresAt: rawExpiresAt
			});
		}

		if (expiresAt.getTime() <= Date.now()) {
			return fail(400, {
				error: 'Expiration date must be in the future',
				gameId: rawGameId,
				expiresAt: rawExpiresAt
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
				expiresAt: rawExpiresAt
			});
		}

		const code = await createUniqueSessionCode();
		if (!code) {
			return fail(500, {
				error: 'Unable to generate session code. Please retry.',
				gameId: rawGameId,
				expiresAt: rawExpiresAt
			});
		}

		await db.insert(gameSession).values({
			escapeGameId: gameId,
			code,
			expiresAt,
			isActive: 1
		});

		redirect(303, `/admin/sessions?gameId=${gameId}`);
	}
};
