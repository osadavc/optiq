import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fileType: text("file_type", { length: 255 }).notNull(),
  processingStatus: text("processing_status").default("pending").notNull(), // pending, processing, completed, error
  lessonId: integer("lesson_id")
    .references(() => lessons.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags"), // JSON string array of tags
  lessonId: integer("lesson_id")
    .references(() => lessons.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lessonsRelations = relations(lessons, ({ many }) => ({
  resources: many(resources),
  notes: many(notes),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  lesson: one(lessons, {
    fields: [resources.lessonId],
    references: [lessons.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  lesson: one(lessons, {
    fields: [notes.lessonId],
    references: [lessons.id],
  }),
}));
