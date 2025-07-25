"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StickyNoteIcon, TagIcon, CalendarIcon, FileTextIcon, ExternalLinkIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

// Note Modal Component for expanded view
const NoteModal = ({ note, isOpen, onClose }: { note: NoteData; isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <StickyNoteIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">{note.title}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>{formatDate(note.createdAt)}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="prose prose-base max-w-none text-foreground [&>*]:mb-4 [&>*:last-child]:mb-0 [&>p]:leading-relaxed [&>h1]:mb-6 [&>h2]:mb-5 [&>h3]:mb-4 [&>ul]:my-4 [&>ol]:my-4 [&>blockquote]:my-6 [&>pre]:my-6">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-4 leading-relaxed text-foreground">{children}</p>,
                h1: ({ children }) => <h1 className="text-2xl font-bold mb-6 text-foreground">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-semibold mb-5 text-foreground">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-semibold mb-4 text-foreground">{children}</h3>,
                h4: ({ children }) => <h4 className="text-base font-semibold mb-3 text-foreground">{children}</h4>,
                ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-muted-foreground/20 pl-4 py-2 my-6 italic bg-muted/20 rounded-r">{children}</blockquote>,
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                  ) : (
                    <code className={className}>{children}</code>
                  );
                },
                pre: ({ children }) => <pre className="bg-muted p-4 rounded-lg my-6 overflow-x-auto">{children}</pre>,
              }}
            >
              {note.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {note.tags && note.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Topic: {note.topic}</span>
              <span>{note.content.length} characters</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Note Display Component
const NoteComponent = ({ note }: { note: NoteData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm cursor-pointer hover:bg-accent/50 transition-colors"
           onClick={() => setIsModalOpen(true)}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <StickyNoteIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-card-foreground line-clamp-1">
              {note.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarIcon className="h-3 w-3" />
              <span>{formatDate(note.createdAt)}</span>
            </div>
            <ExternalLinkIcon className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        {/* Content Preview */}
        <div className="mb-3">
          <div className="text-sm text-muted-foreground">
            {truncateContent(note.content)}
          </div>
        </div>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {note.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md"
                >
                  {tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                  +{note.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileTextIcon className="h-3 w-3" />
            <span>{note.content.length} characters</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Topic: <span className="font-medium">{note.topic}</span>
          </div>
        </div>
      </div>

      <NoteModal 
        note={note} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

// Main Notes UI Component
const NotesUIComponent = (props: any) => {
  const result = props.result as NotesToolResult | undefined;
  // Refresh sidebar notes when a note is created successfully
  useEffect(() => {
    if (result?.success && result?.noteData && typeof window !== 'undefined') {
      // Call the global refresh function with a small delay to ensure the note is saved
      setTimeout(() => {
        const globalWindow = window as any;
        if (globalWindow.refreshNotes) {
          globalWindow.refreshNotes();
        }
      }, 500);
    }
  }, [result]);

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
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <StickyNoteIcon className="h-5 w-5 text-destructive" />
            <h3 className="text-lg font-semibold text-destructive">Failed to Create Note</h3>
          </div>
          <p className="text-sm text-destructive/80">
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
          <StickyNoteIcon className="h-6 w-6 text-muted-foreground" />
          <h2 className="text-xl font-bold text-foreground">Note Created Successfully</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Your note has been saved and is now available in the Notes tab of the sidebar.
        </p>
      </div>

      <NoteComponent note={result.noteData} />

      {/* Success Actions */}
      <div className="mt-6 p-4 bg-muted/50 border border-border rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-foreground">Note saved successfully!</span>
        </div>
        <p className="text-xs text-muted-foreground">
          You can view and manage all your notes in the sidebar. Ask me to create more notes or generate other study materials.
        </p>
      </div>
    </div>
  );
};

export const NotesUI = makeAssistantToolUI({
  toolName: "createNote",
  render: NotesUIComponent,
}) as any;