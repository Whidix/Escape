import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { escapeGame } from '$lib/server/db/schema';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const title = formData.get('title')?.toString().trim() ?? '';
		const description = formData.get('description')?.toString().trim() ?? '';
		let createdGameId: number | null = null;

		if (!title) {
			return fail(400, {
				title,
				description,
				error: 'Le titre est requis'
			});
		}

		if (title.length < 3) {
			return fail(400, {
				title,
				description,
				error: 'Le titre doit contenir au moins 3 caractères'
			});
		}

		try {
			const result = await db
				.insert(escapeGame)
				.values({
					title,
					description: description || null
				})
				.returning({ id: escapeGame.id });

			if (!result[0]) {
				return fail(500, {
					title,
					description,
					error: 'Erreur lors de la création du jeu'
				});
			}

			createdGameId = result[0].id;
		} catch (error) {
			console.error('Create game error:', error);
			return fail(500, {
				title,
				description,
				error: 'Une erreur est survenue'
			});
		}

		if (createdGameId === null) {
			return fail(500, {
				title,
				description,
				error: 'Erreur lors de la création du jeu'
			});
		}

		redirect(302, `/admin/games/${createdGameId}`);
	}
};
