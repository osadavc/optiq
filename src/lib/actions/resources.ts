"use server";

import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getResourcesByLessonId(lessonId: number) {
  try {
    const lessonResources = await db
      .select()
      .from(resources)
      .where(eq(resources.lessonId, lessonId))
      .orderBy(resources.createdAt);
    
    return lessonResources;
  } catch (error) {
    console.error("Error fetching resources:", error);
    throw new Error("Failed to fetch resources");
  }
}

export async function createResource(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const fileType = formData.get("fileType") as string;
    const lessonId = parseInt(formData.get("lessonId") as string);

    if (!name || !fileType || !lessonId) {
      throw new Error("Missing required fields");
    }

    const [newResource] = await db
      .insert(resources)
      .values({
        name,
        fileType,
        lessonId,
      })
      .returning();

    return { success: true, resource: newResource };
  } catch (error) {
    console.error("Error creating resource:", error);
    return { success: false, error: "Failed to create resource" };
  }
}