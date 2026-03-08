<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import type { ActionData, PageData } from './$types';
	import { t } from '$lib/i18n';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type Step = {
		id: number;
		title: string;
		description?: string;
		content?: string;
		type: string;
		hint?: string;
		latitude?: number | null;
		longitude?: number | null;
		proximityRadius?: number | null;
	};

	let currentStep = $derived((data.displayedStep as Step | null) ?? null);
	let isCurrentActiveStep = $derived(
		currentStep !== null && data.activeStepId !== null && currentStep.id === data.activeStepId
	);
	let answer = $derived(
		typeof (form as { answer?: string } | null)?.answer === 'string'
			? ((form as { answer?: string }).answer ?? '')
			: ''
	);
	let isLoading = $state(false);

	// Location tracking state
	let userLat = $state<number | null>(null);
	let userLon = $state<number | null>(null);
	let heading = $state<number | null>(null);
	let watchId = $state<number | null>(null);
	let locationError = $state<string | null>(null);
	let locationPermission = $state<'prompt' | 'granted' | 'denied' | 'checking'>('prompt');
	let distance = $state<number | null>(null);
	let arrowRotation = $state<number>(0);
	type DebugLogEntry = {
		ts: string;
		event: string;
		details?: Record<string, unknown>;
	};
	let debugLogs = $state<DebugLogEntry[]>([]);
	let lastOrientationEvent = $state<string | null>(null);

	function addDebug(event: string, details?: Record<string, unknown>) {
		const entry: DebugLogEntry = {
			ts: new Date().toISOString(),
			event,
			details
		};
		debugLogs = [entry, ...debugLogs].slice(0, 80);
		console.log('[location-debug]', event, details ?? {});
	}

	// Calculate distance between two coordinates in meters (Haversine formula)
	function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
		const R = 6371e3; // Earth radius in meters
		const φ1 = (lat1 * Math.PI) / 180;
		const φ2 = (lat2 * Math.PI) / 180;
		const Δφ = ((lat2 - lat1) * Math.PI) / 180;
		const Δλ = ((lon2 - lon1) * Math.PI) / 180;

		const a =
			Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
			Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		return R * c;
	}

	// Calculate bearing (direction) from user to target in degrees
	function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
		const φ1 = (lat1 * Math.PI) / 180;
		const φ2 = (lat2 * Math.PI) / 180;
		const Δλ = ((lon2 - lon1) * Math.PI) / 180;

		const y = Math.sin(Δλ) * Math.cos(φ2);
		const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
		const θ = Math.atan2(y, x);

		return ((θ * 180) / Math.PI + 360) % 360;
	}

	// Update arrow rotation based on user heading and target bearing
	$effect(() => {
		if (
			currentStep?.type === 'location' &&
			isCurrentActiveStep &&
			userLat !== null &&
			userLon !== null &&
			currentStep.latitude != null &&
			currentStep.longitude != null
		) {
			const dist = calculateDistance(
				userLat,
				userLon,
				currentStep.latitude,
				currentStep.longitude
			);
			distance = Math.round(dist);

			const bearing = calculateBearing(
				userLat,
				userLon,
				currentStep.latitude,
				currentStep.longitude
			);

			// If we have device heading, rotate relative to it; otherwise just use absolute bearing
			arrowRotation = heading !== null ? bearing - heading : bearing;
			addDebug('computed_distance_bearing', {
				distance,
				bearing,
				heading,
				arrowRotation
			});
		} else {
			distance = null;
			arrowRotation = 0;
			addDebug('reset_distance_rotation', {
				stepType: currentStep?.type ?? null,
				isCurrentActiveStep,
				hasUserCoords: userLat !== null && userLon !== null,
				hasStepCoords: currentStep?.latitude != null && currentStep?.longitude != null
			});
		}
	});

	// Check and request location permission
	async function checkLocationPermission() {
		addDebug('check_location_permission_start');
		if (!('geolocation' in navigator)) {
			locationError = 'Geolocation is not supported by your device';
			locationPermission = 'denied';
			addDebug('check_location_permission_no_geolocation');
			return false;
		}

		// Check permission API if available
		if ('permissions' in navigator) {
			try {
				const result = await navigator.permissions.query({ name: 'geolocation' });
				locationPermission = result.state as 'granted' | 'denied' | 'prompt';
				addDebug('check_location_permission_result', {
					permission: result.state
				});
				
				// Listen for permission changes
				result.addEventListener('change', () => {
					locationPermission = result.state as 'granted' | 'denied' | 'prompt';
					addDebug('check_location_permission_changed', {
						permission: result.state
					});
				});
				
				return result.state === 'granted';
			} catch (e) {
				// Some browsers don't support permissions API for geolocation
				console.log('Permissions API not fully supported', e);
				addDebug('check_location_permission_api_error', {
					error: e instanceof Error ? e.message : String(e)
				});
			}
		}
		
		addDebug('check_location_permission_fallback_prompt');
		return false;
	}

	// Request device orientation permission (iOS 13+)
	async function requestOrientationPermission() {
		addDebug('request_orientation_permission_start');
		if (typeof DeviceOrientationEvent === 'undefined') {
			addDebug('request_orientation_permission_no_api');
			return false;
		}

		// Check if permission request is needed (iOS 13+)
		const DeviceOrientationEventTyped = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
			requestPermission?: () => Promise<'granted' | 'denied'>;
		};

		if (typeof DeviceOrientationEventTyped.requestPermission === 'function') {
			try {
				const permission = await DeviceOrientationEventTyped.requestPermission();
				addDebug('request_orientation_permission_result', { permission });
				return permission === 'granted';
			} catch (error) {
				console.error('Error requesting orientation permission:', error);
				addDebug('request_orientation_permission_error', {
					error: error instanceof Error ? error.message : String(error)
				});
				return false;
			}
		} else {
			// Permission not required on this device
			addDebug('request_orientation_permission_not_required');
			return true;
		}
	}

	function startLocationTracking() {
		addDebug('start_location_tracking_called');
		if (!('geolocation' in navigator)) {
			addDebug('start_location_tracking_no_geolocation');
			return;
		}

		locationPermission = 'checking';
		locationError = null;

		watchId = navigator.geolocation.watchPosition(
			(position) => {
				userLat = position.coords.latitude;
				userLon = position.coords.longitude;
				locationError = null;
				locationPermission = 'granted';
				addDebug('watch_position_success', {
					lat: userLat,
					lon: userLon,
					accuracy: position.coords.accuracy,
					speed: position.coords.speed,
					headFromGps: position.coords.heading
				});

				// Try to get device heading if available from GPS
				if (position.coords.heading !== null && position.coords.heading >= 0) {
					heading = position.coords.heading;
				}
			},
			(error) => {
				console.error('Geolocation error:', error);
				addDebug('watch_position_error', {
					code: error.code,
					message: error.message
				});
				
				if (error.code === error.PERMISSION_DENIED) {
					locationError = 'Location access was denied. Please enable location in your browser settings.';
					locationPermission = 'denied';
				} else if (error.code === error.POSITION_UNAVAILABLE) {
					locationError = 'Location information is unavailable.';
					locationPermission = 'prompt';
				} else if (error.code === error.TIMEOUT) {
					locationError = 'Location request timed out. Please try again.';
					locationPermission = 'prompt';
				} else {
					locationError = error.message;
					locationPermission = 'prompt';
				}
			},
			{
				enableHighAccuracy: true,
				maximumAge: 5000,
				timeout: 10000
			}
		);

		addDebug('watch_position_started', {
			watchId
		});
	}

	async function startOrientationTracking() {
		addDebug('start_orientation_tracking_called');
		// Request permission first
		const hasPermission = await requestOrientationPermission();
		if (!hasPermission) {
			console.log('Orientation permission denied or not available');
			addDebug('start_orientation_tracking_permission_denied');
			return;
		}

		// Start listening to orientation events
		if (typeof DeviceOrientationEvent !== 'undefined') {
			const hasAbsoluteOrientation = 'ondeviceorientationabsolute' in window;
			const hasOrientation = 'ondeviceorientation' in window;
			addDebug('start_orientation_tracking_capabilities', {
				hasAbsoluteOrientation,
				hasOrientation
			});
			
			if (hasAbsoluteOrientation) {
				window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener);
				lastOrientationEvent = 'deviceorientationabsolute';
				addDebug('start_orientation_tracking_listener_added', {
					event: 'deviceorientationabsolute'
				});
			} else if (hasOrientation) {
				window.addEventListener('deviceorientation', handleOrientation as EventListener);
				lastOrientationEvent = 'deviceorientation';
				addDebug('start_orientation_tracking_listener_added', {
					event: 'deviceorientation'
				});
			}
		}
	}

	function startAllTracking() {
		addDebug('start_all_tracking_called');
		startLocationTracking();
		void startOrientationTracking();
	}

	function stopLocationTracking() {
		addDebug('stop_tracking_called', { watchId });
		if (watchId !== null) {
			navigator.geolocation.clearWatch(watchId);
			watchId = null;
			addDebug('watch_position_stopped');
		}
		window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener);
		window.removeEventListener('deviceorientation', handleOrientation as EventListener);
		addDebug('orientation_listeners_removed');
	}

	// Initialize location tracking
	onMount(() => {
		addDebug('component_mounted', {
			stepType: currentStep?.type ?? null,
			isCurrentActiveStep
		});
		if (currentStep?.type === 'location' && isCurrentActiveStep) {
			checkLocationPermission().then(() => {
				startAllTracking();
			});
		}

		return () => {
			stopLocationTracking();
		};
	});

	// If step data arrives after mount, start/stop tracking reactively.
	$effect(() => {
		if (currentStep?.type === 'location' && isCurrentActiveStep) {
			if (watchId === null) {
				addDebug('reactive_start_tracking', {
					stepId: currentStep?.id ?? null
				});
				startAllTracking();
			}
		} else if (watchId !== null) {
			addDebug('reactive_stop_tracking', {
				stepType: currentStep?.type ?? null,
				isCurrentActiveStep
			});
			stopLocationTracking();
		}
	});

	function handleOrientation(event: Event) {
		const e = event as DeviceOrientationEvent;
		lastOrientationEvent = event.type;
		if (e.absolute && e.alpha !== null) {
			heading = 360 - e.alpha; // Convert to compass heading
			addDebug('orientation_update_absolute', {
				eventType: event.type,
				alpha: e.alpha,
				heading
			});
		} else if (e.alpha !== null) {
			// Fallback for iOS with webkitCompassHeading
			const webkit = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
			if (webkit.webkitCompassHeading !== undefined) {
				heading = webkit.webkitCompassHeading;
				addDebug('orientation_update_webkit', {
					eventType: event.type,
					webkitCompassHeading: webkit.webkitCompassHeading,
					heading
				});
			} else {
				addDebug('orientation_update_no_heading', {
					eventType: event.type,
					alpha: e.alpha
				});
			}
		} else {
			addDebug('orientation_event_without_alpha', {
				eventType: event.type
			});
		}
	}

	// Auto-submit when within proximity
	let proximityForm = $state<HTMLFormElement | null>(null);
	$effect(() => {
		if (
			currentStep?.type === 'location' &&
			isCurrentActiveStep &&
			distance !== null &&
			currentStep.proximityRadius != null &&
			distance <= currentStep.proximityRadius &&
			!isLoading &&
			proximityForm
		) {
			// Auto-submit the form
			isLoading = true;
			proximityForm.requestSubmit();
		}
	});
</script>

<div class="min-h-dvh bg-gray-50">
	<header class="sticky top-0 z-10 bg-white/95 shadow-sm backdrop-blur">
		<div class="mx-auto max-w-4xl px-3 py-3 sm:px-4 sm:py-4">
			<h1 class="text-xl font-bold text-gray-900 sm:text-2xl">{$t.home.title}</h1>
			<p class="text-sm text-gray-600">{$t.gameplay.progress}: {data.sessionCode || 'Loading...'}</p>
		</div>
	</header>

	<main class="mx-auto max-w-4xl px-3 py-5 sm:px-4 sm:py-8">
		<div class="mb-5 sm:mb-8">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm font-medium text-gray-700">{$t.gameplay.progress}</span>
				<span class="text-xs text-gray-500 sm:text-sm">{$t.gameplay.step} {data.currentStepOrder || 0} {$t.gameplay.of} {data.totalSteps || 0}</span>
			</div>
			<div class="w-full bg-gray-200 rounded-full h-2.5">
				<div
					class="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
					style="width: {((data.currentStepOrder || 0) / (data.totalSteps || 1)) * 100}%"
				></div>
			</div>
		</div>

		<div class="mb-5 rounded-xl bg-white p-4 shadow-md sm:mb-6 sm:p-6">
			{#if currentStep}
				<h2 class="mb-3 text-xl font-bold text-gray-900 sm:mb-4 sm:text-2xl">{currentStep.title}</h2>

				{#if currentStep.description}
					<p class="text-gray-700 mb-4">{currentStep.description}</p>
				{/if}

				{#if currentStep.content}
					<div class="bg-gray-50 rounded-lg p-4 mb-6">
						<p class="text-gray-800">{currentStep.content}</p>
					</div>
				{/if}

				{#if (currentStep.type === 'question' || currentStep.type === 'puzzle') && isCurrentActiveStep}
					<form
						method="POST"
						action="?/submitAnswer"
						use:enhance={() => {
							isLoading = true;
							return async ({ update }) => {
								await update();
								isLoading = false;
							};
						}}
						class="space-y-4"
					>
						<input type="hidden" name="stepId" value={currentStep.id} />
						<div>
							<label for="answer" class="block text-sm font-medium text-gray-700 mb-2">
								{$t.gameplay.yourAnswer}
							</label>
							<input
								id="answer"
								type="text"
								name="answer"
								bind:value={answer}
								placeholder={$t.gameplay.enterYourAnswer}
								class="w-full rounded-lg border border-gray-300 px-4 py-3.5 text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
								required
							/>
						</div>

						{#if form?.error}
							<div class="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
								{form.error}
							</div>
						{/if}

						<button
							type="submit"
							disabled={isLoading}
							class="w-full rounded-lg bg-indigo-600 px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
						>
							{isLoading ? $t.gameplay.checking : $t.gameplay.submitAnswer}
						</button>
					</form>

					{#if currentStep.hint}
						<details class="mt-4">
							<summary class="cursor-pointer text-indigo-600 hover:text-indigo-700 font-medium">
								{$t.gameplay.needAHint}
							</summary>
							<p class="mt-2 text-gray-700 bg-yellow-50 p-4 rounded-lg">{currentStep.hint}</p>
						</details>
					{/if}
				{:else if currentStep.type === 'text' && isCurrentActiveStep}
					<form
						method="POST"
						action="?/continueStep"
						use:enhance={() => {
							isLoading = true;
							return async ({ update }) => {
								await update();
								isLoading = false;
							};
						}}
					>
						<input type="hidden" name="stepId" value={currentStep.id} />
						<button
							type="submit"
							disabled={isLoading}
							class="w-full rounded-lg bg-indigo-600 px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
						>
							{isLoading ? $t.gameplay.loadingStep : $t.gameplay.continue}
						</button>
					</form>
				{:else if currentStep.type === 'location' && isCurrentActiveStep}
					<form
						bind:this={proximityForm}
						method="POST"
						action="?/validateLocation"
						use:enhance={() => {
							return async ({ update }) => {
								await update();
								isLoading = false;
							};
						}}
					>
						<input type="hidden" name="stepId" value={currentStep.id} />
						<input type="hidden" name="userLat" value={userLat ?? ''} />
						<input type="hidden" name="userLon" value={userLon ?? ''} />

						<div class="space-y-4">
							{#if locationPermission === 'denied'}
								<div class="bg-red-50 border border-red-200 text-red-800 px-4 py-4 rounded-lg text-sm space-y-3">
									<div class="flex items-start gap-2">
										<svg class="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
										</svg>
										<div>
											<p class="font-semibold mb-1">{$t.gameplay.locationDenied}</p>
											<p>{locationError || $t.gameplay.locationDeniedMessage}</p>
										</div>
									</div>
									<button
										type="button"
										onclick={() => startAllTracking()}
										class="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
									>
										{$t.gameplay.tryAgain}
									</button>
								</div>
							{:else if locationPermission === 'prompt'}
								<div class="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-4 rounded-lg text-sm space-y-3">
									<div class="flex items-start gap-2">
										<svg class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
										<div>
											<p class="font-semibold mb-1">{$t.gameplay.locationRequired}</p>
											<p>{$t.gameplay.locationRequiredMessage}</p>
										</div>
									</div>
									<button
										type="button"
										onclick={() => startAllTracking()}
										class="w-full rounded-lg bg-indigo-600 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-700"
									>
										{$t.gameplay.enableLocation}
									</button>
								</div>
							{:else if locationError && locationPermission === 'checking'}
								<div class="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
									{$t.gameplay.locationError}: {locationError}
								</div>
							{:else if userLat === null || userLon === null}
								<div class="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
									<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									<span>{$t.gameplay.locatingYou}</span>
								</div>
							{:else}
								<!-- Arrow indicator -->
								<div class="relative bg-linear-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 flex flex-col items-center justify-center" style="min-height: 300px;">
									<div class="absolute top-4 left-4 right-4 flex justify-between items-start">
										<div class="bg-white/90 backdrop-blur rounded-lg px-3 py-2 shadow-md">
											<p class="text-xs text-gray-600 font-medium uppercase tracking-wide">{$t.gameplay.distance}</p>
											<p class="text-2xl font-bold text-indigo-600">
												{#if distance !== null}
													{distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}
												{:else}
													--
												{/if}
											</p>
										</div>
									</div>

									<!-- Compass arrow -->
									<div class="relative">
										<div 
											class="w-32 h-32 flex items-center justify-center transition-transform duration-500 ease-out"
											style="transform: rotate({arrowRotation}deg);"
										>
											<svg class="w-full h-full drop-shadow-lg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
												<defs>
													<linearGradient id="arrowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
														<stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
														<stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
													</linearGradient>
												</defs>
												<!-- Arrow shape -->
												<path d="M 50 10 L 70 80 L 50 70 L 30 80 Z" fill="url(#arrowGradient)" stroke="white" stroke-width="2"/>
												<!-- Center dot -->
												<circle cx="50" cy="50" r="6" fill="white" stroke="#4F46E5" stroke-width="2"/>
											</svg>
										</div>
										<!-- Outer ring -->
										<div class="absolute inset-0 rounded-full border-4 border-indigo-200 opacity-30" style="width: 180px; height: 180px; left: -24px; top: -24px;"></div>
									</div>

									{#if distance !== null && currentStep.proximityRadius != null}
										{#if distance <= currentStep.proximityRadius}
											<p class="mt-6 text-lg font-semibold text-green-600 animate-pulse">
												🎯 {$t.gameplay.arrived}
											</p>
										{:else}
											<p class="mt-6 text-sm text-gray-600">
												{$t.gameplay.getWithin} {currentStep.proximityRadius}m {$t.gameplay.toValidate}
											</p>
										{/if}
									{/if}
								</div>

								<!-- Manual validation button (as fallback) -->
								<button
									type="submit"
									disabled={isLoading || distance === null}
									class="w-full rounded-lg bg-indigo-600 px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
								>
									{isLoading ? $t.gameplay.checking : $t.gameplay.validateLocation}
								</button>

								{#if form?.error}
									<div class="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
										{form.error}
									</div>
								{/if}
							{/if}
						</div>

						<details class="rounded-lg border border-gray-300 bg-gray-50 p-3 text-xs text-gray-800">
							<summary class="cursor-pointer font-semibold">Client Debug Info</summary>
							<div class="mt-3 space-y-2 font-mono leading-relaxed">
								<div>step.id: {currentStep.id}</div>
								<div>step.type: {currentStep.type}</div>
								<div>isCurrentActiveStep: {String(isCurrentActiveStep)}</div>
								<div>locationPermission: {locationPermission}</div>
								<div>locationError: {locationError ?? 'null'}</div>
								<div>watchId: {watchId ?? 'null'}</div>
								<div>userLat: {userLat ?? 'null'}</div>
								<div>userLon: {userLon ?? 'null'}</div>
								<div>stepLat: {currentStep.latitude ?? 'null'}</div>
								<div>stepLon: {currentStep.longitude ?? 'null'}</div>
								<div>proximityRadius: {currentStep.proximityRadius ?? 'null'}</div>
								<div>distance: {distance ?? 'null'}</div>
								<div>heading: {heading ?? 'null'}</div>
								<div>arrowRotation: {arrowRotation}</div>
								<div>lastOrientationEvent: {lastOrientationEvent ?? 'null'}</div>
								<div class="pt-1 font-semibold">Recent logs ({debugLogs.length})</div>
								<div class="max-h-64 overflow-auto rounded border border-gray-200 bg-white p-2">
									{#if debugLogs.length === 0}
										<div>No logs yet</div>
									{:else}
										{#each debugLogs as log (log.ts + log.event)}
											<div class="mb-2 border-b border-gray-100 pb-2 last:mb-0 last:border-b-0 last:pb-0">
												<div>[{log.ts}] {log.event}</div>
												{#if log.details}
													<pre class="mt-1 whitespace-pre-wrap break-all text-[11px]">{JSON.stringify(log.details, null, 2)}</pre>
												{/if}
											</div>
										{/each}
									{/if}
								</div>
							</div>
						</details>
					</form>

					{#if currentStep.hint}
						<details class="mt-4">
							<summary class="cursor-pointer text-indigo-600 hover:text-indigo-700 font-medium">
								{$t.gameplay.needAHint}
							</summary>
							<p class="mt-2 text-gray-700 bg-yellow-50 p-4 rounded-lg">{currentStep.hint}</p>
						</details>
					{/if}
				{:else if !isCurrentActiveStep}
					<p class="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
						{$t.gameplay.viewingUnlockedStep}
					</p>
				{:else}
					<p class="text-gray-600">{$t.gameplay.loadingStep}</p>
				{/if}
			{:else}
				<div class="py-10 text-center sm:py-12">
					<p class="text-gray-500">{$t.gameplay.loadingStep}</p>
				</div>
			{/if}
		</div>
	</main>

</div>
