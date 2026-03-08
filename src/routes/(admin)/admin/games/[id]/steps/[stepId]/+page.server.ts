import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { escapeGame, step } from '$lib/server/db/schema';
import { and, eq, max, not } from 'drizzle-orm';
import { ensureUploadDir, generateUniqueFilename, getUploadPath } from '$lib/server/uploads';
import { writeFile } from 'fs/promises';
import { countActiveIncompleteSessions } from '$lib/server/gameValidation';
const stepTypes = ['question', 'text', 'puzzle', 'location'] as const;
type StepType = (typeof stepTypes)[number];

const isStepType = (value: string): value is StepType =>
	stepTypes.includes(value as StepType);

export const load: PageServerLoad = async ({ params }) => {
	const gameId = Number.parseInt(params.id, 10);
	const stepId = Number.parseInt(params.stepId, 10);

	if (Number.isNaN(gameId) || Number.isNaN(stepId)) {
		error(400, 'Invalid ID');
	}

	const game = await db.query.escapeGame.findFirst({
		where: eq(escapeGame.id, gameId)
	});

	if (!game) {
		error(404, 'Game not found');
	}

	const gameStep = await db.query.step.findFirst({
		where: and(eq(step.id, stepId), eq(step.escapeGameId, gameId))
	});

	if (!gameStep) {
		error(404, 'Step not found');
	}

	// Get the total number of steps
	const lastStep = await db
		.select({ order: max(step.order) })
		.from(step)
		.where(eq(step.escapeGameId, gameId))
		.then((result) => result[0]?.order ?? 0);

	const activeSessionCount = await countActiveIncompleteSessions(gameId);

	return {
		game,
		step: gameStep,
		totalSteps: lastStep,
		activeSessionCount
	};
};

export const actions: Actions = {
	default: async ({ params, request }) => {
		const gameId = Number.parseInt(params.id, 10);
		const stepId = Number.parseInt(params.stepId, 10);

		if (Number.isNaN(gameId) || Number.isNaN(stepId)) {
			return fail(400, { error: 'Invalid ID' });
		}

		const hasActiveSessions = await countActiveIncompleteSessions(gameId);
		if (hasActiveSessions > 0) {
			return fail(400, { 
				error: `Cannot modify step: ${hasActiveSessions} active session(s) in progress. Wait until they are completed or mark them as inactive.` 
			});
		}

		const formData = await request.formData();
		const title = formData.get('title')?.toString().trim() ?? '';
		const description = formData.get('description')?.toString().trim() ?? '';
		const type = formData.get('type')?.toString() ?? '';
		const content = formData.get('content')?.toString().trim() ?? '';
		const answer = formData.get('answer')?.toString().trim() ?? '';
		const hint = formData.get('hint')?.toString().trim() ?? '';
		const order = Number.parseInt(formData.get('order')?.toString() ?? '1', 10);
		const latitude = formData.get('latitude')?.toString() ? parseFloat(formData.get('latitude')!.toString()) : null;
		const longitude = formData.get('longitude')?.toString() ? parseFloat(formData.get('longitude')!.toString()) : null;
		const proximityRadius = formData.get('proximityRadius')?.toString() ? parseInt(formData.get('proximityRadius')!.toString(), 10) : 50;
		const puzzleImage = formData.get('puzzleImage') as File | null;
		const existingImageUrl = formData.get('existingImageUrl')?.toString() || null;
		const puzzlePieces = formData.get('puzzlePieces')?.toString() ? parseInt(formData.get('puzzlePieces')!.toString(), 10) : null;

		let imageUrl: string | null = existingImageUrl;

		// Handle puzzle image upload
		if (puzzleImage && puzzleImage.size > 0) {
			const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
			const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

			if (puzzleImage.size > MAX_FILE_SIZE) {
				return fail(400, {
					title,
					description,
					type,
					content,
					answer,
					hint,
					order,
					error: 'Image size exceeds 10MB limit'
				});
			}

			if (!ALLOWED_TYPES.includes(puzzleImage.type)) {
				return fail(400, {
					title,
					description,
					type,
					content,
					answer,
					hint,
					order,
					error: 'Invalid image format. Only JPG, PNG, GIF, and WebP are allowed'
				});
			}

			try {
				await ensureUploadDir();
				const uniqueFilename = generateUniqueFilename(puzzleImage.name);
				const uploadPath = getUploadPath(uniqueFilename);
				const arrayBuffer = await puzzleImage.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);
				await writeFile(uploadPath, buffer);
				imageUrl = `/uploads/${uniqueFilename}`;
			} catch (uploadError) {
				console.error('Image upload error:', uploadError);
				return fail(500, {
					title,
					description,
					type,
					content,
					answer,
					hint,
					order,
					error: 'Failed to upload image'
				});
			}
		}

		if (!title) {
			return fail(400, {
				title,
				description,
				type,
				content,
				answer,
				hint,
				order,
				error: 'Le titre est requis'
			});
		}

		if (!type) {
			return fail(400, {
				title,
				description,
				type,
				content,
				answer,
				hint,
				order,
				error: 'Le type est requis'
			});
		}

		if (!isStepType(type)) {
			return fail(400, {
				title,
				description,
				type,
				content,
				answer,
				hint,
				order,
				error: 'Type invalide'
			});
		}

		// Validate location-specific fields
		if (type === 'location') {
			if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
				return fail(400, {
					title,
					description,
					type,
					content,
					answer,
					hint,
					order,
					latitude: latitude?.toString() ?? '',
					longitude: longitude?.toString() ?? '',
					proximityRadius,
					error: 'Latitude and longitude are required for location steps'
				});
			}
			if (latitude < -90 || latitude > 90) {
				return fail(400, {
					title,
					description,
					type,
					content,
					answer,
					hint,
					order,
					latitude: latitude.toString(),
					longitude: longitude?.toString() ?? '',
					proximityRadius,
					error: 'Latitude must be between -90 and 90'
				});
			}
			if (longitude < -180 || longitude > 180) {
				return fail(400, {
					title,
					description,
					type,
					content,
					answer,
					hint,
					order,
					latitude: latitude?.toString() ?? '',
					longitude: longitude.toString(),
					proximityRadius,
					error: 'Longitude must be between -180 and 180'
				});
			}
		}

		// Get the current total steps to validate order
		const lastStep = await db
			.select({ order: max(step.order) })
			.from(step)
			.where(eq(step.escapeGameId, gameId))
			.then((result) => result[0]?.order ?? 0);

		if (!Number.isInteger(order) || order < 1 || order > lastStep) {
			return fail(400, {
				title,
				description,
				type,
				content,
				answer,
				hint,
				order,
				error: `L'ordre doit etre entre 1 et ${lastStep}`
			});
		}

		// Get the current step to check if order changed
		const currentStep = await db.query.step.findFirst({
			where: and(eq(step.id, stepId), eq(step.escapeGameId, gameId))
		});

		if (!currentStep) {
			return fail(404, {
				title,
				description,
				type,
				content,
				answer,
				hint,
				order,
				error: 'Etape introuvable'
			});
		}

		// Check if order changed and if there's a conflict
		if (currentStep.order !== order) {
			const conflictingStep = await db.query.step.findFirst({
				where: and(
					eq(step.escapeGameId, gameId),
					eq(step.order, order),
					not(eq(step.id, stepId))
				)
			});

			if (conflictingStep) {
				return fail(400, {
					title,
					description,
					type,
					content,
					answer,
					hint,
					order,
					error: `Une autre etape utilise deja l'ordre ${order}. Veuillez reordonner les etapes via drag-and-drop.`
				});
			}
		}

		try {
			const updated = await db
				.update(step)
				.set({
					title,
					description: description || null,
					type,
					order,
					content: content || null,
					answer: answer || null,
					hint: hint || null,
					latitude,
					longitude,
					proximityRadius,
					imageUrl,
					puzzlePieces
				})
				.where(and(eq(step.id, stepId), eq(step.escapeGameId, gameId)))
				.returning({ id: step.id });

			if (!updated[0]) {
				return fail(404, {
					title,
					description,
					type,
					content,
					answer,
					hint,
					order,
					error: 'Etape introuvable'
				});
			}
		} catch (err) {
			console.error('Update step error:', err);
			return fail(500, {
				title,
				description,
				type,
				content,
				answer,
				hint,
				order,
				error: 'Une erreur est survenue'
			});
		}

		redirect(302, `/admin/games/${gameId}`);
	}
};
