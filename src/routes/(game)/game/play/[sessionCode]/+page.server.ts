import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { gameSession, sessionProgress, step } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const actions: Actions = {
	continueStep: async ({ params, request }) => {
		const sessionCode = params.sessionCode.toUpperCase().trim();
		if (!sessionCode) {
			return fail(400, { error: 'Invalid session code' });
		}

		const formData = await request.formData();
		const stepId = Number.parseInt(formData.get('stepId')?.toString() ?? '', 10);

		if (!Number.isInteger(stepId) || stepId <= 0) {
			return fail(400, { error: 'Invalid step ID' });
		}

		const session = await db.query.gameSession.findFirst({
			where: eq(gameSession.code, sessionCode)
		});
		if (!session) {
			return fail(404, { error: 'Session not found' });
		}

		const stepRecord = await db.query.step.findFirst({
			where: and(eq(step.id, stepId), eq(step.escapeGameId, session.escapeGameId))
		});

		if (!stepRecord) {
			return fail(404, { error: 'Step not found' });
		}

		if (stepRecord.type !== 'text') {
			return fail(400, { error: 'Only text steps can be continued without an answer' });
		}

		const existingProgress = await db.query.sessionProgress.findFirst({
			where: and(eq(sessionProgress.gameSessionId, session.id), eq(sessionProgress.stepId, stepId))
		});

		if (existingProgress) {
			await db
				.update(sessionProgress)
				.set({
					completedAt: existingProgress.completedAt ?? new Date()
				})
				.where(eq(sessionProgress.id, existingProgress.id));
		} else {
			await db.insert(sessionProgress).values({
				gameSessionId: session.id,
				stepId,
				attempts: 0,
				completedAt: new Date()
			});
		}

		redirect(303, `/game/play/${session.code}`);
	},

	submitAnswer: async ({ params, request }) => {
		const sessionCode = params.sessionCode.toUpperCase().trim();
		if (!sessionCode) {
			return fail(400, { error: 'Invalid session code' });
		}

		const formData = await request.formData();
		const stepId = Number.parseInt(formData.get('stepId')?.toString() ?? '', 10);
		const answer = formData.get('answer')?.toString().trim() ?? '';

		if (!Number.isInteger(stepId) || stepId <= 0) {
			return fail(400, { error: 'Invalid step ID' });
		}

		if (!answer) {
			return fail(400, { error: 'Please enter your answer', answer });
		}

		const session = await db.query.gameSession.findFirst({
			where: eq(gameSession.code, sessionCode)
		});
		if (!session) {
			return fail(404, { error: 'Session not found', answer });
		}

		const stepRecord = await db.query.step.findFirst({
			where: and(eq(step.id, stepId), eq(step.escapeGameId, session.escapeGameId))
		});
		if (!stepRecord) {
			return fail(404, { error: 'Step not found', answer });
		}

		const expectedAnswer = (stepRecord.answer ?? '').trim().toLowerCase();
		const submittedAnswer = answer.trim().toLowerCase();
		const isCorrect = expectedAnswer.length > 0 && expectedAnswer === submittedAnswer;

		const existingProgress = await db.query.sessionProgress.findFirst({
			where: and(eq(sessionProgress.gameSessionId, session.id), eq(sessionProgress.stepId, stepId))
		});

		if (existingProgress) {
			await db
				.update(sessionProgress)
				.set({
					attempts: existingProgress.attempts + 1,
					lastAttemptAt: new Date(),
					completedAt: isCorrect ? new Date() : existingProgress.completedAt
				})
				.where(eq(sessionProgress.id, existingProgress.id));
		} else {
			await db.insert(sessionProgress).values({
				gameSessionId: session.id,
				stepId,
				attempts: 1,
				lastAttemptAt: new Date(),
				completedAt: isCorrect ? new Date() : null
			});
		}

		if (!isCorrect) {
			return fail(400, { error: 'Incorrect answer', answer });
		}

		redirect(303, `/game/play/${session.code}`);
	},

	validateLocation: async ({ params, request }) => {
		const sessionCode = params.sessionCode.toUpperCase().trim();
		if (!sessionCode) {
			return fail(400, { error: 'Invalid session code' });
		}

		const formData = await request.formData();
		const stepId = Number.parseInt(formData.get('stepId')?.toString() ?? '', 10);
		const userLat = parseFloat(formData.get('userLat')?.toString() ?? '');
		const userLon = parseFloat(formData.get('userLon')?.toString() ?? '');

		if (!Number.isInteger(stepId) || stepId <= 0) {
			return fail(400, { error: 'Invalid step ID' });
		}

		if (isNaN(userLat) || isNaN(userLon)) {
			return fail(400, { error: 'Unable to get your location' });
		}

		const session = await db.query.gameSession.findFirst({
			where: eq(gameSession.code, sessionCode)
		});
		if (!session) {
			return fail(404, { error: 'Session not found' });
		}

		const stepRecord = await db.query.step.findFirst({
			where: and(eq(step.id, stepId), eq(step.escapeGameId, session.escapeGameId))
		});
		if (!stepRecord) {
			return fail(404, { error: 'Step not found' });
		}

		if (stepRecord.type !== 'location') {
			return fail(400, { error: 'This step is not a location step' });
		}

		if (stepRecord.latitude === null || stepRecord.longitude === null) {
			return fail(400, { error: 'Location coordinates not set for this step' });
		}

		// Calculate distance using Haversine formula
		const R = 6371e3; // Earth radius in meters
		const φ1 = (userLat * Math.PI) / 180;
		const φ2 = (stepRecord.latitude * Math.PI) / 180;
		const Δφ = ((stepRecord.latitude - userLat) * Math.PI) / 180;
		const Δλ = ((stepRecord.longitude - userLon) * Math.PI) / 180;

		const a =
			Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
			Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const distance = R * c;

		const proximityRadius = stepRecord.proximityRadius ?? 50;

		if (distance > proximityRadius) {
			return fail(400, {
				error: `You are ${Math.round(distance)}m away. Get within ${proximityRadius}m to validate.`
			});
		}

		// User is within proximity - mark step as completed
		const existingProgress = await db.query.sessionProgress.findFirst({
			where: and(eq(sessionProgress.gameSessionId, session.id), eq(sessionProgress.stepId, stepId))
		});

		if (existingProgress) {
			await db
				.update(sessionProgress)
				.set({
					completedAt: existingProgress.completedAt ?? new Date()
				})
				.where(eq(sessionProgress.id, existingProgress.id));
		} else {
			await db.insert(sessionProgress).values({
				gameSessionId: session.id,
				stepId,
				attempts: 0,
				completedAt: new Date()
			});
		}

		redirect(303, `/game/play/${session.code}`);
	},

	completePuzzle: async ({ params, request }) => {
		const sessionCode = params.sessionCode.toUpperCase().trim();
		if (!sessionCode) {
			return fail(400, { error: 'Invalid session code' });
		}

		const formData = await request.formData();
		const stepId = Number.parseInt(formData.get('stepId')?.toString() ?? '', 10);

		if (!Number.isInteger(stepId) || stepId <= 0) {
			return fail(400, { error: 'Invalid step ID' });
		}

		const session = await db.query.gameSession.findFirst({
			where: eq(gameSession.code, sessionCode)
		});
		if (!session) {
			return fail(404, { error: 'Session not found' });
		}

		const stepRecord = await db.query.step.findFirst({
			where: and(eq(step.id, stepId), eq(step.escapeGameId, session.escapeGameId))
		});

		if (!stepRecord) {
			return fail(404, { error: 'Step not found' });
		}

		if (stepRecord.type !== 'puzzle') {
			return fail(400, { error: 'This step is not a puzzle step' });
		}

		const existingProgress = await db.query.sessionProgress.findFirst({
			where: and(eq(sessionProgress.gameSessionId, session.id), eq(sessionProgress.stepId, stepId))
		});

		if (existingProgress) {
			await db
				.update(sessionProgress)
				.set({
					attempts: existingProgress.attempts + 1,
					completedAt: existingProgress.completedAt ?? new Date()
				})
				.where(eq(sessionProgress.id, existingProgress.id));
		} else {
			await db.insert(sessionProgress).values({
				gameSessionId: session.id,
				stepId,
				attempts: 1,
				completedAt: new Date()
			});
		}

		redirect(303, `/game/play/${session.code}`);
	}
};
