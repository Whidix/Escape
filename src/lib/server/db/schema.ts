import { pgTable, serial, integer, text, timestamp, varchar, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for step types
export const stepTypeEnum = pgEnum('step_type', ['question', 'text', 'puzzle', 'challenge', 'photo', 'location']);

// Escape Game table
export const escapeGame = pgTable('escape_game', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Step table
export const step = pgTable('step', {
	id: serial('id').primaryKey(),
	escapeGameId: integer('escape_game_id')
		.notNull()
		.references(() => escapeGame.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description'),
	type: stepTypeEnum('type').notNull(),
	order: integer('order').notNull(), // Order of the step in the game
	content: text('content'), // Question text, puzzle instructions, etc.
	answer: text('answer'), // Expected answer for question/puzzle types
	hint: text('hint'), // Optional hint for the step
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Game Session table (different from auth session)
export const gameSession = pgTable('game_session', {
	id: serial('id').primaryKey(),
	escapeGameId: integer('escape_game_id')
		.notNull()
		.references(() => escapeGame.id, { onDelete: 'cascade' }),
	code: varchar('code', { length: 10 }).notNull().unique(), // Access code
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	startedAt: timestamp('started_at'), // When the first player joined
	completedAt: timestamp('completed_at'), // When the game was completed
	isActive: integer('is_active').default(1).notNull(), // 1 = active, 0 = inactive
});

// Player table
export const player = pgTable('player', {
	id: serial('id').primaryKey(),
	gameSessionId: integer('game_session_id')
		.notNull()
		.references(() => gameSession.id, { onDelete: 'cascade' }),
	cguAccepted: boolean('cgu_accepted').notNull().default(false),
	joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// Session Progress table (tracks which steps are completed)
export const sessionProgress = pgTable('session_progress', {
	id: serial('id').primaryKey(),
	gameSessionId: integer('game_session_id')
		.notNull()
		.references(() => gameSession.id, { onDelete: 'cascade' }),
	stepId: integer('step_id')
		.notNull()
		.references(() => step.id, { onDelete: 'cascade' }),
	completedAt: timestamp('completed_at'),
	attempts: integer('attempts').default(0).notNull(), // Number of attempts for this step
	lastAttemptAt: timestamp('last_attempt_at'),
});

// Item table (items that can be won in the game)
export const item = pgTable('item', {
	id: serial('id').primaryKey(),
	escapeGameId: integer('escape_game_id')
		.notNull()
		.references(() => escapeGame.id, { onDelete: 'cascade' }),
	stepId: integer('step_id')
		.references(() => step.id, { onDelete: 'cascade' }), // Optional: the step that rewards this item
	name: text('name').notNull(),
	description: text('description'),
	imageUrl: text('image_url'), // Optional image for the item
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Session Item table (tracks items collected by a session)
export const sessionItem = pgTable('session_item', {
	id: serial('id').primaryKey(),
	gameSessionId: integer('game_session_id')
		.notNull()
		.references(() => gameSession.id, { onDelete: 'cascade' }),
	itemId: integer('item_id')
		.notNull()
		.references(() => item.id, { onDelete: 'cascade' }),
	collectedAt: timestamp('collected_at').defaultNow().notNull(),
});

// Relations
export const escapeGameRelations = relations(escapeGame, ({ many }) => ({
	steps: many(step),
	sessions: many(gameSession),
	items: many(item),
}));

export const stepRelations = relations(step, ({ one, many }) => ({
	escapeGame: one(escapeGame, {
		fields: [step.escapeGameId],
		references: [escapeGame.id],
	}),
	progress: many(sessionProgress),
	items: many(item),
}));

export const gameSessionRelations = relations(gameSession, ({ one, many }) => ({
	escapeGame: one(escapeGame, {
		fields: [gameSession.escapeGameId],
		references: [escapeGame.id],
	}),
	players: many(player),
	progress: many(sessionProgress),
	collectedItems: many(sessionItem),
}));

export const playerRelations = relations(player, ({ one }) => ({
	gameSession: one(gameSession, {
		fields: [player.gameSessionId],
		references: [gameSession.id],
	}),
}));

export const sessionProgressRelations = relations(sessionProgress, ({ one }) => ({
	gameSession: one(gameSession, {
		fields: [sessionProgress.gameSessionId],
		references: [gameSession.id],
	}),
	step: one(step, {
		fields: [sessionProgress.stepId],
		references: [step.id],
	}),
}));

export const itemRelations = relations(item, ({ one, many }) => ({
	escapeGame: one(escapeGame, {
		fields: [item.escapeGameId],
		references: [escapeGame.id],
	}),
	step: one(step, {
		fields: [item.stepId],
		references: [step.id],
	}),
	sessionItems: many(sessionItem),
}));

export const sessionItemRelations = relations(sessionItem, ({ one }) => ({
	gameSession: one(gameSession, {
		fields: [sessionItem.gameSessionId],
		references: [gameSession.id],
	}),
	item: one(item, {
		fields: [sessionItem.itemId],
		references: [item.id],
	}),
}));

export * from './auth.schema';
