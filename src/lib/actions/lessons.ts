"use server";

import { db } from "@/lib/db";
import { lessons } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createLesson(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name?.trim()) {
    throw new Error("Lesson name is required");
  }

  try {
    await db.insert(lessons).values({
      name: name.trim(),
      description: description?.trim() || "",
    });

    revalidatePath("/");
  } catch (error) {
    console.error("Failed to create lesson:", error);
    throw new Error("Failed to create lesson");
  }
}

export async function getLessons() {
  try {
    return await db.select().from(lessons).orderBy(lessons.createdAt);
  } catch (error) {
    console.error("Failed to fetch lessons:", error);
    return [];
  }
}
