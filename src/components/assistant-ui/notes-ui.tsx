"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StickyNoteIcon, TagIcon, CalendarIcon, FileTextIcon } from "lucide-react";

// Types for notes
type NoteData = {
  id: number;
  title: string;
  content: string;
  tags: string[];
  topic: string;
  lessonId: number;
  createdAt: string;
};

type NotesToolResult = {
  noteData: NoteData | null;
  success: boolean;
  error?: string;
};

// Note Display Component
const NoteComponent = ({ note }: { note: NoteData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <StickyNoteIcon className="h-5 w-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {note.title}
          </h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <CalendarIcon className="h-3 w-3" />
          <span>{formatDate(note.createdAt)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {isExpanded ? note.content : truncateContent(note.content)}
        </div>
        
        {note.content.length > 200 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 h-7 px-2 text-xs text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </Button>
        )}
      </div>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1 mb-2">
            <TagIcon className="h-3 w-3 text-gray-500" />
            <span className="text-xs text-gray-500 font-medium">Tags:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {note.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full border border-blue-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-yellow-200">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <FileTextIcon className="h-3 w-3" />
          <span>{note.content.length} characters</span>
        </div>
        <div className="text-xs text-gray-500">
          Topic: <span className="font-medium">{note.topic}</span>
        </div>
      </div>
    </div>
  );
};

// Main Notes UI Component
const NotesUIComponent = ({ result }: { result: NotesToolResult | undefined }) => {
  if (!result) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (result.error || !result.noteData) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <StickyNoteIcon className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">Failed to Create Note</h3>
          </div>
          <p className="text-sm text-red-700">
            {result.error || "Unable to create note at this time."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <StickyNoteIcon className="h-6 w-6 text-yellow-600" />
          <h2 className="text-xl font-bold text-gray-900">Note Created Successfully</h2>
        </div>
        <p className="text-sm text-gray-600">
          Your note has been saved and is now available in the Notes tab of the sidebar.
        </p>
      </div>

      <NoteComponent note={result.noteData} />

      {/* Success Actions */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-green-800">Note saved successfully!</span>
        </div>
        <p className="text-xs text-green-700">
          You can view and manage all your notes in the sidebar. Ask me to create more notes or generate other study materials.
        </p>
      </div>
    </div>
  );
};

export const NotesUI = makeAssistantToolUI<NotesToolResult>({
  toolName: "createNote",
  render: NotesUIComponent,
});