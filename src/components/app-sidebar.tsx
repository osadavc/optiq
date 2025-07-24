"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus } from "lucide-react";
import { createLesson } from "@/lib/actions/lessons";
import { useActionState } from "react";

type Lesson = {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

type AppSidebarProps = {
  lessons: Lesson[];
};

export const AppSidebar = ({ lessons }: AppSidebarProps) => {
  const [isNewLessonOpen, setIsNewLessonOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createLesson, null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFormSubmit = () => {
    setIsNewLessonOpen(false);
  };

  const handleLessonClick = (lessonId: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('lesson', lessonId.toString());
    router.push(`/?${params.toString()}`);
  };

  const selectedLessonId = searchParams.get('lesson');

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <h1 className="text-2xl font-black text-black font-inter">Optiq</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between px-2">
            <SidebarGroupLabel className="text-sm font-medium text-gray-600 tracking-wide">
              Lessons
            </SidebarGroupLabel>
            <Dialog open={isNewLessonOpen} onOpenChange={setIsNewLessonOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <form
                  action={formAction}
                  onSubmit={handleFormSubmit}
                  className="space-y-2"
                >
                  <DialogHeader>
                    <DialogTitle>Add New Lesson</DialogTitle>
                    <DialogDescription>
                      Create a new lesson to organize your study materials.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="lesson-name"
                        className="text-sm font-medium leading-none"
                      >
                        Lesson Title
                      </label>
                      <Input
                        id="lesson-name"
                        name="name"
                        placeholder="Enter lesson title..."
                        className="w-full"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="lesson-description"
                        className="text-sm font-medium leading-none"
                      >
                        Description (Optional)
                      </label>
                      <Input
                        id="lesson-description"
                        name="description"
                        placeholder="Brief description of the lesson..."
                        className="w-full"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsNewLessonOpen(false)}
                      className="mr-2"
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "Creating..." : "Create Lesson"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {lessons.map((lesson) => {
                const isSelected = selectedLessonId === lesson.id.toString();
                return (
                  <SidebarMenuItem key={lesson.id}>
                    <SidebarMenuButton
                      className={`w-full justify-start transition-colors ${
                        isSelected 
                          ? 'bg-blue-100 text-blue-900 hover:bg-blue-200' 
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => handleLessonClick(lesson.id)}
                    >
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>{lesson.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
