import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';

import en from './en.json';
import fr from './fr.json';

type Messages = typeof en;

const translations: Record<string, Messages> = { en, fr };

// Get initial language
function getInitialLanguage(): string {
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('language');
		if (stored && stored in translations) {
			return stored;
		}
		const browserLang = navigator.language.split('-')[0];
		if (browserLang in translations) {
			return browserLang;
		}
	}
	return 'en';
}

// Create writable store for the current language
export const language: Writable<string> = writable(getInitialLanguage());

// Create derived store for the current messages
export const t: Readable<Messages> = derived(language, ($language) => {
	return translations[$language] || translations['en'];
});

export function setLanguage(lang: string) {
	if (lang in translations) {
		if (typeof window !== 'undefined') {
			localStorage.setItem('language', lang);
		}
		language.set(lang);
	}
}

export function getLanguage(): string {
	let currentLang = 'en';
	language.subscribe((lang) => {
		currentLang = lang;
	})();
	return currentLang;
}

export const availableLanguages = Object.keys(translations);
