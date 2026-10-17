import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('records', {
 id: text('id').primaryKey(), owner: text('owner').notNull(), appId: text('app_id').notNull(), payload: text('payload').notNull(), version: integer('version').notNull().default(1), mutation: text('mutation').notNull(), created: text('created').notNull(), updated: text('updated').notNull()
}, t => [uniqueIndex('owner_app_unique').on(t.owner,t.appId)]);
export const history = sqliteTable('history', { id:text('id').primaryKey(), recordId:text('record_id').notNull(), owner:text('owner').notNull(), action:text('action').notNull(), payload:text('payload').notNull(), at:text('at').notNull() });
