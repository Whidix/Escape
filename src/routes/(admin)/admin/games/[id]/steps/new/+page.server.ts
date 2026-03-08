import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { escapeGame, step } from '$lib/server/db/schema';
import { and, eq, gte, max } from 'drizzle-orm';
import { ensureUploadDir, generateUniqueFilename, getUploadPath } from '$lib/server/uploads';
import { writeFile } from 'fs/promises';
import { countActiveIncompleteSessions } from '$lib/server/gameValidation';

const stepTypes = ['question', 'text', 'puzzle', 'location'] as const;
type StepType = (typeof stepTypes)[number];

const isStepType = (value: string): value is StepType =>
	stepTypes.includes(value as StepType);

export const load: PageServerLoad = async ({ params }) => {
	const gameId = parseInt(params.id, 10);

	if (isNaN(gameId)) {
		error(400, 'Invalid game ID');
	}

	const game = await db.query.escapeGame.findFirst({
		where: eq(escapeGame.id, gameId)
	});

	if (!game) {
		error(404, 'Game not found');
	}

	// Get the highest step order
	const lastStep = await db
		.select({ order: max(step.order) })
		.from(step)
		.where(eq(step.escapeGameId, gameId))
		.then((result) => result[0]?.order ?? 0);

	const nextStepOrder = lastStep + 1;

	const activeSessionCount = await countActiveIncompleteSessions(gameId);

	return {
		game,
		nextStepOrder,
		totalSteps: lastStep,
		activeSessionCount
	};
};

export const actions: Actions = {
	default: async ({ params, request }) => {
		const gameId = parseInt(params.id, 10);

		if (isNaN(gameId)) {
			return fail(400, { error: 'Invalid game ID' });
		}

		const hasActiveSessions = await countActiveIncompleteSessions(gameId);
		if (hasActiveSessions > 0) {
			return fail(400, { 
				error: `Cannot add step: ${hasActiveSessions} active session(s) in progress. Wait until they are completed or mark them as inactive.` 
			});
		}

		const formData = await request.formData();
		const title = formData.get('title')?.toString().trim() ?? '';
		const description = formData.get('description')?.toString().trim() ?? '';
		const type = formData.get('type')?.toString() ?? '';
		const content = formData.get('content')?.toString().trim() ?? '';
		const answer = formData.get('answer')?.toString().trim() ?? '';
		const hint = formData.get('hint')?.toString().trim() ?? '';
		const order = parseInt(formData.get('order')?.toString() ?? '1', 10);
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

		const maxOrder = lastStep + 1;

		if (!Number.isInteger(order) || order < 1 || order > maxOrder) {
			return fail(400, {
				title,
				description,
				type,
				content,
				answer,
				hint,
				order,
				error: `L'ordre doit etre entre 1 et ${maxOrder}`
			});
		}

		try {
			// If inserting in the middle, shift existing steps
			if (order <= lastStep) {
				const stepsToShift = await db
					.select({ id: step.id, order: step.order })
					.from(step)
					.where(and(eq(step.escapeGameId, gameId), gte(step.order, order)));

				// Shift all steps >= order by 1
				for (const s of stepsToShift) {
					await db
						.update(step)
						.set({ order: s.order + 1 })
						.where(eq(step.id, s.id));
				}
			}

			await db.insert(step).values({
				escapeGameId: gameId,
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
			});
		} catch (error) {
			console.error('Create step error:', error);
			return fail(500, {
				title,
				description,
				type,
				content,
				answer,
				hint,
				error: 'Une erreur est survenue'
			});
		}

		redirect(302, `/admin/games/${gameId}`);
	}
};
