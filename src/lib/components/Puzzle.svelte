<script lang="ts">
	import { onMount } from 'svelte';

	type Props = {
		imageUrl: string;
		puzzlePieces: number;
		onComplete: () => void;
	};

	let { imageUrl, puzzlePieces, onComplete }: Props = $props();

	type PuzzlePiece = {
		id: number;
		currentIndex: number;
		correctIndex: number;
	};

	let pieces = $state<PuzzlePiece[]>([]);
	let gridSize = $state(0);
	let draggedIndex = $state<number | null>(null);
	let imageLoaded = $state(false);
	let isComplete = $state(false);

	// Calculate grid size (e.g., 9 pieces = 3x3)
	$effect(() => {
		gridSize = Math.sqrt(puzzlePieces);
		if (gridSize * gridSize !== puzzlePieces) {
			console.error('Puzzle pieces must be a perfect square (4, 9, 16, 25, etc.)');
			gridSize = Math.ceil(gridSize);
		}
	});

	// Initialize and shuffle pieces
	onMount(() => {
		initializePuzzle();
	});

	function initializePuzzle() {
		// Create pieces in correct order
		const initialPieces: PuzzlePiece[] = Array.from({ length: puzzlePieces }, (_, i) => ({
			id: i,
			currentIndex: i,
			correctIndex: i
		}));

		// Shuffle using Fisher-Yates algorithm
		const shuffled = [...initialPieces];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}

		// Update currentIndex based on shuffled position
		shuffled.forEach((piece, index) => {
			piece.currentIndex = index;
		});

		pieces = shuffled;
	}

	function handleDragStart(index: number) {
		draggedIndex = index;
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function handleDrop(targetIndex: number) {
		if (draggedIndex === null || draggedIndex === targetIndex) {
			draggedIndex = null;
			return;
		}

		// Swap pieces
		const newPieces = [...pieces];
		const draggedPiece = newPieces[draggedIndex];
		const targetPiece = newPieces[targetIndex];

		// Swap positions
		[newPieces[draggedIndex], newPieces[targetIndex]] = [targetPiece, draggedPiece];

		// Update currentIndex
		newPieces[draggedIndex].currentIndex = draggedIndex;
		newPieces[targetIndex].currentIndex = targetIndex;

		pieces = newPieces;
		draggedIndex = null;

		// Check if puzzle is complete
		checkCompletion();
	}

	function handleTouchStart(index: number, event: TouchEvent) {
		draggedIndex = index;
		const target = event.currentTarget as HTMLElement;
		target.style.opacity = '0.5';
	}

	function handleTouchMove(event: TouchEvent) {
		event.preventDefault();
		const touch = event.touches[0];
		const element = document.elementFromPoint(touch.clientX, touch.clientY);
		
		// Add visual feedback for potential drop target
		document.querySelectorAll('.puzzle-piece').forEach(el => {
			el.classList.remove('drop-target');
		});
		
		if (element?.classList.contains('puzzle-piece')) {
			element.classList.add('drop-target');
		}
	}

	function handleTouchEnd(event: TouchEvent) {
		const touch = event.changedTouches[0];
		const element = document.elementFromPoint(touch.clientX, touch.clientY);
		
		// Reset opacity
		const target = event.currentTarget as HTMLElement;
		target.style.opacity = '1';
		
		// Remove drop target highlighting
		document.querySelectorAll('.puzzle-piece').forEach(el => {
			el.classList.remove('drop-target');
		});

		if (element?.classList.contains('puzzle-piece') && draggedIndex !== null) {
			const targetIndex = parseInt(element.getAttribute('data-index') || '-1');
			if (targetIndex >= 0) {
				handleDrop(targetIndex);
				return;
			}
		}
		
		draggedIndex = null;
	}

	function checkCompletion() {
		const solved = pieces.every((piece) => piece.currentIndex === piece.correctIndex);
		if (solved && !isComplete) {
			isComplete = true;
			setTimeout(() => {
				onComplete();
			}, 500);
		}
	}
</script>

<div class="puzzle-container">
	{#if !imageLoaded}
		<div class="loading">
			<p>Loading puzzle...</p>
		</div>
	{/if}

	<div 
		class="puzzle-grid" 
		class:complete={isComplete}
		style="grid-template-columns: repeat({gridSize}, 1fr); grid-template-rows: repeat({gridSize}, 1fr);"
	>
		{#each pieces as piece, index (piece.id)}
			<div
				class="puzzle-piece"
				class:correct={piece.currentIndex === piece.correctIndex}
				data-index={index}
				draggable="true"
				ondragstart={() => handleDragStart(index)}
				ondragover={handleDragOver}
				ondrop={() => handleDrop(index)}
				ontouchstart={(e) => handleTouchStart(index, e)}
				ontouchmove={handleTouchMove}
				ontouchend={handleTouchEnd}
				role="button"
				tabindex="0"
				style="
					background-image: url('{imageUrl}');
					background-size: {gridSize * 100}% {gridSize * 100}%;
					background-position: {(piece.correctIndex % gridSize) * (100 / (gridSize - 1))}% {Math.floor(piece.correctIndex / gridSize) * (100 / (gridSize - 1))}%;
				"
			>
			</div>
		{/each}
	</div>

	<img 
		src={imageUrl} 
		alt="Puzzle" 
		style="display: none;" 
		onload={() => imageLoaded = true}
		onerror={() => console.error('Failed to load puzzle image')}
	/>

	{#if isComplete}
		<div class="completion-message">
			<div class="completion-content">
				<p>🎉 Puzzle complete!</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.puzzle-container {
		position: relative;
		width: 100%;
		max-width: 600px;
		margin: 0 auto;
	}

	.loading {
		text-align: center;
		padding: 2rem;
		color: #6b7280;
	}

	.puzzle-grid {
		display: grid;
		gap: 2px;
		background-color: #e5e7eb;
		padding: 2px;
		border-radius: 8px;
		aspect-ratio: 1 / 1;
		width: 100%;
		touch-action: none;
	}

	.puzzle-grid.complete {
		animation: celebrate 0.5s ease-in-out;
	}

	@keyframes celebrate {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.02); }
	}

	.puzzle-piece {
		background-color: #f9fafb;
		background-repeat: no-repeat;
		cursor: grab;
		border-radius: 4px;
		transition: all 0.2s ease;
		user-select: none;
		-webkit-user-select: none;
		touch-action: none;
	}

	.puzzle-piece:active {
		cursor: grabbing;
	}

	.puzzle-piece:global(.drop-target) {
		outline: 2px solid #4f46e5;
		outline-offset: -2px;
	}

	.puzzle-piece.correct {
		box-shadow: inset 0 0 0 2px rgba(34, 197, 94, 0.3);
	}

	.completion-message {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(255, 255, 255, 0.95);
		border-radius: 8px;
		animation: fadeIn 0.3s ease-in-out;
		pointer-events: none;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.completion-content {
		text-align: center;
	}

	.completion-content p {
		font-size: 2rem;
		font-weight: bold;
		color: #4f46e5;
		margin: 0;
	}

	@media (max-width: 640px) {
		.puzzle-container {
			max-width: 100%;
		}

		.completion-content p {
			font-size: 1.5rem;
		}
	}
</style>
