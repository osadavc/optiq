"use client";

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
import { BookOpen } from "lucide-react";

const lessons = [
  {
    title: "Database",
  },
  {
    title: "Programming",
  },
];

export const AppSidebar = () => {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h1 className="text-2xl font-black text-black font-inter">Optiq</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-medium text-gray-600 tracking-wide">
            Lessons
          </SidebarGroupLabel>
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
