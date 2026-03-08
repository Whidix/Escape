import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { gameSession, player } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const actions: Actions = {
	joinSession: async (event) => {
		const formData = await event.request.formData();
		const code = (formData.get('code') as string)?.toUpperCase();
		const cguAccepted = formData.get('cguAccepted') === 'on';
		let sessionCode: string | null = null;

		if (!code?.trim()) {
			return fail(400, {
				error: 'Please enter a session code'
			});
		}

		if (!cguAccepted) {
			return fail(400, {
				error: 'You must accept the terms and conditions'
			});
		}

		try {
			// Find the session by code
			const sessions = await db
				.select()
				.from(gameSession)
				.where(eq(gameSession.code, code));

			if (!sessions || sessions.length === 0) {
				return fail(404, {
					error: 'Session not found. Please check the code.'
				});
			}

			const session = sessions[0];

			// Check if session is active
			if (!session.isActive) {
				return fail(400, {
					error: 'This session is no longer active.'
				});
			}

			// Check if session has expired
			if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
				return fail(400, {
					error: 'This session has expired.'
				});
			}

			// Create player
			await db.insert(player).values({
				gameSessionId: session.id,
				cguAccepted
			});

			// Start timer when the first player joins the session
			if (!session.startedAt) {
				await db
					.update(gameSession)
					.set({ startedAt: new Date() })
					.where(eq(gameSession.id, session.id));
			}

			sessionCode = session.code;

		} catch (err) {
			console.error('Join session error:', err);
			return fail(500, {
				error: 'An error occurred. Please try again.'
			});
		}

		if (sessionCode === null) {
			return fail(500, {
				error: 'An error occurred. Please try again.'
			});
		}

		redirect(302, `/game/play/${sessionCode}`);
	}
};
