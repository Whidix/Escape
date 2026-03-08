import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { escapeGame, step } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { countActiveIncompleteSessions } from '$lib/server/gameValidation';

export const load: PageServerLoad = async ({ params }) => {
	const gameId = parseInt(params.id, 10);

	if (isNaN(gameId)) {
		error(400, 'Invalid game ID');
	}

	const game = await db.query.escapeGame.findFirst({
		where: eq(escapeGame.id, gameId),
		with: {
			steps: {
				orderBy: (steps, { asc }) => [asc(steps.order), asc(steps.id)]
			}
		}
	});

	if (!game) {
		error(404, 'Game not found');
	}

	const activeSessionCount = await countActiveIncompleteSessions(gameId);

	return {
		game,
		activeSessionCount
	};
};

export const actions: Actions = {
	reorderSteps: async ({ params, request }) => {
		const gameId = Number.parseInt(params.id, 10);
		if (Number.isNaN(gameId)) {
			return fail(400, { error: 'Invalid game ID' });
		}

		const hasActiveSessions = await countActiveIncompleteSessions(gameId);
		if (hasActiveSessions > 0) {
			return fail(400, { 
				error: `Cannot reorder steps: ${hasActiveSessions} active session(s) in progress. Wait until they are completed or mark them as inactive.` 
			});
		}

		const formData = await request.formData();
		const orderRaw = formData.get('order')?.toString() ?? '';

		if (!orderRaw) {
			return fail(400, { error: 'Missing order payload' });
		}

		let orderedIds: number[] = [];
		try {
			const parsed = JSON.parse(orderRaw);
			if (!Array.isArray(parsed)) {
				return fail(400, { error: 'Invalid order payload' });
			}
			orderedIds = parsed
				.map((value) => Number.parseInt(String(value), 10))
				.filter((value) => Number.isInteger(value) && value > 0);
		} catch {
			return fail(400, { error: 'Invalid JSON payload' });
		}

		if (orderedIds.length === 0) {
			return fail(400, { error: 'No steps to reorder' });
		}

		const uniqueIds = new Set(orderedIds);
		if (uniqueIds.size !== orderedIds.length) {
			return fail(400, { error: 'Duplicate step IDs in payload' });
		}

		const gameSteps = await db
			.select({ id: step.id })
			.from(step)
			.where(eq(step.escapeGameId, gameId));

		if (gameSteps.length !== orderedIds.length) {
			return fail(400, { error: 'Order payload does not match game steps' });
		}

		const gameStepIds = new Set(gameSteps.map((gameStep) => gameStep.id));
		for (const id of orderedIds) {
			if (!gameStepIds.has(id)) {
				return fail(400, { error: 'Order payload contains invalid step IDs' });
			}
		}

		await db.transaction(async (tx) => {
			for (let index = 0; index < orderedIds.length; index += 1) {
				const stepId = orderedIds[index];
				await tx
					.update(step)
					.set({ order: index + 1 })
					.where(and(eq(step.id, stepId), eq(step.escapeGameId, gameId)));
			}
		});

		return { success: true };
	},

	deleteStep: async ({ params, request }) => {
		const gameId = Number.parseInt(params.id, 10);
		if (Number.isNaN(gameId)) {
			return fail(400, { error: 'Invalid game ID' });
		}

		const hasActiveSessions = await countActiveIncompleteSessions(gameId);
		if (hasActiveSessions > 0) {
			return fail(400, { 
				error: `Cannot delete step: ${hasActiveSessions} active session(s) in progress. Wait until they are completed or mark them as inactive.` 
			});
		}

		const formData = await request.formData();
		const stepId = Number.parseInt(formData.get('stepId')?.toString() ?? '', 10);

		if (Number.isNaN(stepId)) {
			return fail(400, { error: 'Invalid step ID' });
		}

		// Verify the step exists and belongs to this game
		const existingStep = await db.query.step.findFirst({
			where: and(eq(step.id, stepId), eq(step.escapeGameId, gameId))
		});

		if (!existingStep) {
			return fail(404, { error: 'Step not found' });
		}

		try {
			await db.delete(step).where(and(eq(step.id, stepId), eq(step.escapeGameId, gameId)));
			return { success: true };
		} catch (err) {
			console.error('Delete step error:', err);
			return fail(500, { error: 'Failed to delete step' });
		}
	}
};
