import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { gameSession, player } from '$lib/server/db/schema';
import { and, eq, gt } from 'drizzle-orm';

type Game = {
	id: number;
	title: string;
	description?: string;
	stepCount?: number;
	sessionCount?: number;
	createdAt: string;
};

type Session = {
	id: number;
	code: string;
	gameName: string;
	isActive: boolean;
	startedAt?: string;
	completedAt?: string;
	playerCount?: number;
	expiresAt: string;
	progression?: {
		currentStep: number;
		completedSteps: number;
		totalSteps: number;
	};
};

type ResolutionMetric = {
	gameId: number;
	gameTitle: string;
	meanResolutionMinutes: number;
	completedSessions: number;
};

export const load: PageServerLoad = async () => {
	const gamesRaw = await db.query.escapeGame.findMany({
		orderBy: (escapeGame, { desc }) => [desc(escapeGame.createdAt)],
		with: {
			steps: true,
			sessions: true
		}
	});

	const games: Game[] = gamesRaw.map((game) => ({
		id: game.id,
		title: game.title,
		description: game.description ?? undefined,
		stepCount: game.steps.length,
		sessionCount: game.sessions.length,
		createdAt: game.createdAt.toISOString()
	}));

	const resolutionMetrics: ResolutionMetric[] = gamesRaw
		.map((game) => {
			const completedDurations = game.sessions
				.filter((session) => session.startedAt && session.completedAt)
				.map((session) => {
					const startedAt = new Date(session.startedAt as Date).getTime();
					const completedAt = new Date(session.completedAt as Date).getTime();
					return Math.max(0, completedAt - startedAt);
				});

			if (completedDurations.length === 0) {
				return null;
			}

			const totalMs = completedDurations.reduce((sum, duration) => sum + duration, 0);
			const meanResolutionMinutes = totalMs / completedDurations.length / 60000;

			return {
				gameId: game.id,
				gameTitle: game.title,
				meanResolutionMinutes,
				completedSessions: completedDurations.length
			};
		})
		.filter((metric): metric is ResolutionMetric => metric !== null)
		.sort((a, b) => b.meanResolutionMinutes - a.meanResolutionMinutes);

	const maxMeanResolutionMinutes =
		resolutionMetrics.length > 0
			? Math.max(...resolutionMetrics.map((metric) => metric.meanResolutionMinutes))
			: 0;

	const totalGames = games.length;
	const activeSessions = await db.$count(gameSession, eq(gameSession.isActive, 1));
	const totalPlayers = await db.$count(player);

	const recentSessionsRaw = await db.query.gameSession.findMany({
		orderBy: (session, { desc }) => [desc(session.createdAt)],
		limit: 10,
		with: {
			escapeGame: true,
			players: true
		}
	});

	const currentAndIncomingRaw = await db.query.gameSession.findMany({
		where: and(eq(gameSession.isActive, 1), gt(gameSession.expiresAt, new Date())),
		with: {
			escapeGame: {
				with: {
					steps: true
				}
			},
			players: true,
			progress: true
		}
	});

	const currentAndIncomingSessions: Session[] = currentAndIncomingRaw
		.map((session) => {
			const totalSteps = session.escapeGame.steps.length;
			const completedSteps = session.progress.filter((p) => p.completedAt !== null).length;
			const currentStep = completedSteps + 1;

			return {
				id: session.id,
				code: session.code,
				gameName: session.escapeGame.title,
				isActive: session.isActive === 1,
				startedAt: session.startedAt ? new Date(session.startedAt).toISOString() : undefined,
				completedAt: session.completedAt ? new Date(session.completedAt).toISOString() : undefined,
				playerCount: session.players.length,
				expiresAt: session.expiresAt.toISOString(),
				progression: totalSteps > 0 ? {
					currentStep,
					completedSteps,
					totalSteps
				} : undefined
			};
		})
		.sort((a, b) => {
			const aIsCurrent = Boolean(a.startedAt) && !a.completedAt;
			const bIsCurrent = Boolean(b.startedAt) && !b.completedAt;

			if (aIsCurrent !== bIsCurrent) {
				return aIsCurrent ? -1 : 1;
			}

			return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
		})
		.slice(0, 10);

	const recentSessions: Session[] = recentSessionsRaw.map((session) => ({
		id: session.id,
		code: session.code,
		gameName: session.escapeGame.title,
		isActive: session.isActive === 1,
		startedAt: session.startedAt ? new Date(session.startedAt).toISOString() : undefined,
		completedAt: session.completedAt ? new Date(session.completedAt).toISOString() : undefined,
		playerCount: session.players.length,
		expiresAt: session.expiresAt.toISOString()
	}));

	return {
		stats: {
			totalGames,
			activeSessions,
			totalPlayers
		},
		resolutionMetrics,
		maxMeanResolutionMinutes,
		games,
		currentAndIncomingSessions,
		recentSessions
	};
};

export const actions: Actions = {
	logout: async (event) => {
		await auth.api.signOut({
			headers: event.request.headers
		});
		redirect(302, '/admin/login');
	}
};
