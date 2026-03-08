import { db } from '$lib/server/db';
import { gameSession } from '$lib/server/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

/**
 * Check if a game has any active sessions that are not yet completed
 * @param escapeGameId The ID of the escape game to check
 * @returns true if there are active incomplete sessions, false otherwise
 */
export async function hasActiveIncompleteSessions(escapeGameId: number): Promise<boolean> {
	const activeSessions = await db.query.gameSession.findFirst({
		where: and(
			eq(gameSession.escapeGameId, escapeGameId),
			eq(gameSession.isActive, 1),
			isNull(gameSession.completedAt)
		)
	});

	return activeSessions !== undefined;
}

/**
 * Get count of active incomplete sessions for a game
 * @param escapeGameId The ID of the escape game to check
 * @returns Number of active incomplete sessions
 */
export async function countActiveIncompleteSessions(escapeGameId: number): Promise<number> {
	const sessions = await db
		.select()
		.from(gameSession)
		.where(
			and(
				eq(gameSession.escapeGameId, escapeGameId),
				eq(gameSession.isActive, 1),
				isNull(gameSession.completedAt)
			)
		);

	return sessions.length;
}
