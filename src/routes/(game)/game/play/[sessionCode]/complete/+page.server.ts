import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { gameSession } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const toSafeDate = (value: Date | string | null | undefined): Date | null => {
	if (!value) return null;
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

export const load: PageServerLoad = async ({ params }) => {
	const sessionCode = params.sessionCode.toUpperCase().trim();

	if (!sessionCode) {
		error(400, 'Invalid session code');
	}

	const session = await db.query.gameSession.findFirst({
		where: eq(gameSession.code, sessionCode),
		with: {
			escapeGame: true
		}
	});

	if (!session) {
		error(404, 'Session not found');
	}

	const startedAt = toSafeDate(session.startedAt) ?? toSafeDate(session.createdAt) ?? new Date();
	const completedAt = toSafeDate(session.completedAt) ?? new Date();
	const elapsedMs = Math.max(0, completedAt.getTime() - startedAt.getTime());
	const totalSeconds = Math.floor(elapsedMs / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return {
		sessionCode: session.code,
		gameTitle: session.escapeGame.title,
		startedAt,
		completedAt,
		totalSeconds,
		formattedDuration: `${minutes}m ${seconds.toString().padStart(2, '0')}s`
	};
};
