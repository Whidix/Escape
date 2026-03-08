import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { gameSession } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ params, url }) => {
	const sessionCode = params.sessionCode.toUpperCase().trim();

	if (!sessionCode) {
		error(400, 'Invalid session code');
	}

	const session = await db.query.gameSession.findFirst({
		where: eq(gameSession.code, sessionCode),
		with: {
			escapeGame: {
				with: {
					steps: {
						orderBy: (steps, { asc }) => [asc(steps.order)]
					}
				}
			},
			progress: {
				with: {
					step: true
				}
			},
			collectedItems: {
				with: {
					item: true
				}
			}
		}
	});

	if (!session) {
		error(404, 'Session not found');
	}

	if (session.isActive !== 1) {
		error(400, 'Session is inactive');
	}

	if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
		error(400, 'Session has expired');
	}

	const steps = session.escapeGame.steps;
	const totalSteps = steps.length;

	const completedStepIds = new Set(
		session.progress.filter((entry) => entry.completedAt !== null).map((entry) => entry.stepId)
	);

	const currentStep = steps.find((entry) => !completedStepIds.has(entry.id)) ?? null;
	const currentStepOrder = currentStep?.order ?? totalSteps;

	if (!currentStep && !url.pathname.endsWith('/complete')) {
		if (!session.completedAt) {
			await db
				.update(gameSession)
				.set({ completedAt: new Date() })
				.where(eq(gameSession.id, session.id));
		}

		redirect(303, `/game/play/${session.code}/complete`);
	}

	const unlockedSteps = currentStep
		? steps.filter((entry) => entry.order <= currentStep.order)
		: steps;

	const requestedStepId = Number.parseInt(url.searchParams.get('step') ?? '', 10);
	const isRequestedStepUnlocked = unlockedSteps.some((entry) => entry.id === requestedStepId);

	const displayedStepRecord = isRequestedStepUnlocked
		? (unlockedSteps.find((entry) => entry.id === requestedStepId) ?? null)
		: (currentStep ?? unlockedSteps.at(-1) ?? null);

	const displayedStepIndex = displayedStepRecord
		? unlockedSteps.findIndex((entry) => entry.id === displayedStepRecord.id)
		: -1;

	const previousStepId = displayedStepIndex > 0 ? unlockedSteps[displayedStepIndex - 1].id : null;
	const nextStepId =
		displayedStepIndex >= 0 && displayedStepIndex < unlockedSteps.length - 1
			? unlockedSteps[displayedStepIndex + 1].id
			: null;

	return {
		sessionCode: session.code,
		currentStepOrder,
		totalSteps,
		activeStepId: currentStep?.id ?? null,
		displayedStep: displayedStepRecord
			? {
					id: displayedStepRecord.id,
					title: displayedStepRecord.title,
					description: displayedStepRecord.description ?? undefined,
					content: displayedStepRecord.content ?? undefined,
					type: displayedStepRecord.type,
					hint: displayedStepRecord.hint ?? undefined,
					latitude: displayedStepRecord.latitude ?? null,
					longitude: displayedStepRecord.longitude ?? null,
					proximityRadius: displayedStepRecord.proximityRadius ?? 50
				}
			: null,
		unlockedSteps: unlockedSteps.map((entry) => ({
			id: entry.id,
			order: entry.order,
			title: entry.title,
			isCompleted: completedStepIds.has(entry.id)
		})),
		previousStepId,
		nextStepId,
		collectedItems: session.collectedItems.map((entry) => ({
			id: entry.item.id,
			name: entry.item.name,
			imageUrl: entry.item.imageUrl ?? undefined
		}))
	};
};
