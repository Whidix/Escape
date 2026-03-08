import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { auth } from '$lib/server/auth';

export const load: LayoutServerLoad = async (event) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	
	if (!session?.user) {
		redirect(303, '/login');
	}

	return {
		user: session.user
	};
};
