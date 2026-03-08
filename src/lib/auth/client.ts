import { createAuthClient } from 'better-auth/svelte';
import { browser } from '$app/environment';

export const authClient = browser ? createAuthClient({
	baseURL: typeof window !== 'undefined' ? window.location.origin : ''
}) : null;

export function useAuth() {
	if (!authClient) return null;
	
	return {
		signUp: authClient.signUp,
		signIn: authClient.signIn,
		signOut: authClient.signOut,
		getSession: authClient.getSession
	};
}
