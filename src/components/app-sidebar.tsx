"use client";

import { useState } from "react";
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

const lessons = [
  {
    title: "Database",
  },
  {
    title: "Programming",
  },
];

export const AppSidebar = () => {
  const [isNewLessonOpen, setIsNewLessonOpen] = useState(false);

  return (
    <Sidebar>
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
                <DialogHeader>
                  <DialogTitle>Add New Lesson</DialogTitle>
                  <DialogDescription>
                    Create a new lesson to organize your study materials.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="lesson-title" className="text-sm font-medium leading-none">
                      Lesson Title
                    </label>
                    <Input
                      id="lesson-title"
                      placeholder="Enter lesson title..."
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lesson-description" className="text-sm font-medium leading-none">
                      Description (Optional)
                    </label>
                    <Input
                      id="lesson-description"
                      placeholder="Brief description of the lesson..."
                      className="w-full"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsNewLessonOpen(false)}
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => setIsNewLessonOpen(false)}>
                    Create Lesson
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {lessons.map((lesson) => (
                <SidebarMenuItem key={lesson.title}>
                  <SidebarMenuButton
                    className="w-full justify-start hover:bg-gray-100 transition-colors"
                    onClick={() => console.log(`Clicked ${lesson.title}`)}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>{lesson.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
