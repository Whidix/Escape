import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { auth } from '$lib/server/auth';
import { user } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = async (event) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	
	if (session?.user) {
		redirect(303, '/admin');
	}

	// Check if any users exist
	const users = await db.select().from(user).limit(1);
	const noUsersExist = users.length === 0;

	return {
		noUsersExist
	};
};

export const actions: Actions = {
	signIn: async (event) => {
		const formData = await event.request.formData();
		const identifier = formData.get('identifier')?.toString().trim() ?? formData.get('email')?.toString().trim() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		if (!identifier) {
			return fail(400, { message: 'Email ou nom d\'utilisateur requis' });
		}

		let email = identifier;
		if (!identifier.includes('@')) {
			const [foundUser] = await db
				.select({ email: user.email })
				.from(user)
				.where(sql`lower(${user.email}) = ${identifier.toLowerCase()}`)
				.limit(1);

			if (!foundUser) {
				return fail(400, { message: 'Identifiants invalides' });
			}

			email = foundUser.email;
		}

		try {
			await auth.api.signInEmail({
				body: {
					email,
					password,
					callbackURL: '/auth/verification-success'
				}
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Signin failed' });
			}
			return fail(500, { message: 'Unexpected error' });
		}

		return redirect(302, '/');
	},

	createFirstUser: async (event) => {
		// Check if any users already exist
		const users = await db.select().from(user).limit(1);
		if (users.length > 0) {
			return fail(400, { message: 'Un utilisateur existe déjà' });
		}

		const formData = await event.request.formData();
		const email = formData.get('email')?.toString().trim() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const name = formData.get('name')?.toString().trim() ?? email;

		if (!email || !password) {
			return fail(400, { message: 'Email et mot de passe requis' });
		}

		if (password.length < 6) {
			return fail(400, { message: 'Le mot de passe doit contenir au moins 6 caractères' });
		}

		try {
			await auth.api.signUpEmail({
				body: {
					email,
					password,
					name,
					callbackURL: '/admin'
				}
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Creation failed' });
			}
			return fail(500, { message: 'Unexpected error' });
		}

		return redirect(302, '/admin');
	}
};
