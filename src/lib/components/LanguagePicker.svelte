<script lang="ts">
	import { language, setLanguage, availableLanguages } from '$lib/i18n';

	const flags: Record<string, { flag: string; name: string }> = {
		en: { flag: '🇬🇧', name: 'English' },
		fr: { flag: '🇫🇷', name: 'Français' }
	};

	function handleLanguageChange(lang: string) {
		setLanguage(lang);
	}
</script>

<div class="flex gap-6 justify-center">
	{#each availableLanguages as lang (lang)}
		<button
			onclick={() => handleLanguageChange(lang)}
			class="w-20 flex flex-col items-center gap-2 transition-transform hover:scale-110 {$language ===
			lang
				? 'opacity-100'
				: 'opacity-60 hover:opacity-80'}"
		>
			<div class="text-3xl">{flags[lang].flag}</div>
			<span class="text-xs font-medium text-gray-700 text-center">{flags[lang].name}</span>
		</button>
	{/each}
</div>
