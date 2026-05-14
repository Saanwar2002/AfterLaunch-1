import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  plan: text('plan').notNull().default('free'), // 'free', 'pro', 'promax', 'unlimited'
  emailAlerts: integer('email_alerts', { mode: 'boolean' }).notNull().default(true),
  smsAlerts: integer('sms_alerts', { mode: 'boolean' }).notNull().default(false),
  pushAlerts: integer('push_alerts', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const apps = sqliteTable('apps', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  url: text('url').notNull(),
  checkInterval: integer('check_interval').notNull().default(300), // Default 5 minutes
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const healthChecks = sqliteTable('health_checks', {
  id: text('id').primaryKey(),
  appId: text('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
  statusCode: integer('status_code').notNull(),
  responseTimeMs: integer('response_time_ms').notNull(),
  isUp: integer('is_up', { mode: 'boolean' }).notNull(),
  sslExpiryDays: integer('ssl_expiry_days'),
  errorMessage: text('error_message'),
  checkedAt: integer('checked_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const incidents = sqliteTable('incidents', {
  id: text('id').primaryKey(),
  appId: text('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  durationSeconds: integer('duration_seconds'),
  cause: text('cause'), // e.g., 'timeout', '5xx', 'dns'
});

export const alerts = sqliteTable('alerts', {
  id: text('id').primaryKey(),
  incidentId: text('incident_id').notNull().references(() => incidents.id),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // 'email', 'sms'
  sentAt: integer('sent_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  delivered: integer('delivered', { mode: 'boolean' }).notNull().default(false),
});
