"use server";

import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getNotesByLessonId(lessonId: number) {
  try {
    const lessonNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.lessonId, lessonId))
      .orderBy(desc(notes.updatedAt));
    
    return lessonNotes;
  } catch (error) {
    console.error("Error fetching notes:", error);
    throw new Error("Failed to fetch notes");
  }
}

export async function createNote(data: {
  title: string;
  content: string;
  tags?: string[];
  lessonId: number;
}) {
  try {
    const { title, content, tags, lessonId } = data;

    if (!title || !content || !lessonId) {
      throw new Error("Missing required fields");
    }

    const [newNote] = await db
      .insert(notes)
      .values({
        title,
        content,
        tags: tags ? JSON.stringify(tags) : null,
        lessonId,
      })
      .returning();

    return { success: true, note: newNote };
  } catch (error) {
    console.error("Error creating note:", error);
    return { success: false, error: "Failed to create note" };
  }
}

export async function updateNote(noteId: number, data: {
  title?: string;
  content?: string;
  tags?: string[];
}) {
  try {
    const { title, content, tags } = data;
    
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);

    const [updatedNote] = await db
      .update(notes)
      .set(updateData)
      .where(eq(notes.id, noteId))
      .returning();

    return { success: true, note: updatedNote };
  } catch (error) {
    console.error("Error updating note:", error);
    return { success: false, error: "Failed to update note" };
  }
}

export async function deleteNote(noteId: number) {
  try {
    await db
      .delete(notes)
      .where(eq(notes.id, noteId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting note:", error);
    return { success: false, error: "Failed to delete note" };
  }
}

export async function getNoteById(noteId: number) {
  try {
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId));
    
    return note;
  } catch (error) {
    console.error("Error fetching note:", error);
    throw new Error("Failed to fetch note");
  }
}