"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Bot, Upload, Loader2, CheckCircle, AlertCircle, StickyNote, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getResourcesByLessonId } from "@/lib/actions/resources";
import { getNotesByLessonId, deleteNote } from "@/lib/actions/notes";
import { PipecatVoiceAgent } from "@/components/pipecat-voice-agent";

interface RightSidebarProps {
  className?: string;
}

type TabType = "resources" | "notes" | "ai-assistant";

interface Resource {
  id: number;
  name: string;
  fileType: string;
  processingStatus: string;
  lessonId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Note {
  id: number;
  title: string;
  content: string;
  tags: string | null;
  lessonId: number;
  createdAt: Date;
  updatedAt: Date;
}


const getFileTypeIcon = (fileType: string) => {
  const lowerType = fileType.toLowerCase();
  if (lowerType.includes("pdf")) {
    return <FileText className="h-4 w-4 text-red-500" />;
  } else if (lowerType.includes("word") || lowerType.includes("docx")) {
    return <FileText className="h-4 w-4 text-blue-500" />;
  } else if (lowerType.includes("presentation") || lowerType.includes("pptx")) {
    return <FileText className="h-4 w-4 text-orange-500" />;
  } else if (lowerType.includes("txt")) {
    return <FileText className="h-4 w-4 text-gray-500" />;
  } else {
    return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

const getProcessingStatusIcon = (status: string) => {
  switch (status) {
    case 'processing':
      return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />;
    case 'completed':
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    case 'pending':
    default:
      return <div className="h-3 w-3 rounded-full bg-gray-300" />;
  }
};

export const RightSidebar = ({ className }: RightSidebarProps) => {
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const searchParams = useSearchParams();
  const selectedLessonId = searchParams.get('lesson');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOpen = activeTab !== null;

  // Fetch resources and notes when lesson changes
  useEffect(() => {
    const fetchResources = async () => {
      if (selectedLessonId) {
        setIsLoadingResources(true);
        try {
          const lessonResources = await getResourcesByLessonId(parseInt(selectedLessonId));
          setResources(lessonResources);
        } catch (error) {
          console.error("Failed to fetch resources:", error);
          setResources([]);
        } finally {
          setIsLoadingResources(false);
        }
      } else {
        setResources([]);
      }
    };

    const fetchNotes = async () => {
      if (selectedLessonId) {
        setIsLoadingNotes(true);
        try {
          const lessonNotes = await getNotesByLessonId(parseInt(selectedLessonId));
          setNotes(lessonNotes);
        } catch (error) {
          console.error("Failed to fetch notes:", error);
          setNotes([]);
        } finally {
          setIsLoadingNotes(false);
        }
      } else {
        setNotes([]);
      }
    };

    fetchResources();
    fetchNotes();
  }, [selectedLessonId]);

  // Helper function to format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
      }
      return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    } else if (diffInDays === 1) {
      return '1 day ago';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const diffInWeeks = Math.floor(diffInDays / 7);
      return diffInWeeks === 1 ? '1 week ago' : `${diffInWeeks} weeks ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedLessonId) return;

    // Validate file type (PDF, DOCX, PPTX allowed)
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/vnd.openxmlformats-officedocument.presentationml.presentation' // PPTX
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF, DOCX, and PPTX files are allowed');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('lessonId', selectedLessonId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh resources list
        const updatedResources = await getResourcesByLessonId(parseInt(selectedLessonId));
        setResources(updatedResources);
        
        // Show success message
        console.log(result.message);
      } else {
        console.error('Upload failed:', result.error);
        alert(`Failed to upload file: ${result.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    if (!selectedLessonId) {
      alert('Please select a lesson first');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleTabClick = (tab: TabType) => {
    if (activeTab === tab) {
      setActiveTab(null);
    } else {
      setActiveTab(tab);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const result = await deleteNote(noteId);
      if (result.success) {
        // Refresh notes list
        if (selectedLessonId) {
          const updatedNotes = await getNotesByLessonId(parseInt(selectedLessonId));
          setNotes(updatedNotes);
        }
      } else {
        alert('Failed to delete note');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete note');
    }
  };

  // Helper function to parse tags
  const parseTags = (tagsString: string | null): string[] => {
    if (!tagsString) return [];
    try {
      return JSON.parse(tagsString);
    } catch {
      return [];
    }
  };


  const renderTabContent = () => {
    switch (activeTab) {
      case "resources":
        return (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-600 tracking-wide">Resources</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0" 
                  onClick={handleUploadClick}
                  disabled={isUploading}
                >
                  <Upload className="h-3 w-3" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.pptx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
            
            {/* Resources List */}
            <div className="flex-1 overflow-auto">
              <div className="p-3 space-y-2">
                {isLoadingResources ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-muted-foreground">Loading resources...</p>
                  </div>
                ) : !selectedLessonId ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">Select a lesson to view resources</p>
                  </div>
                ) : resources.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No resources yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Upload files to get started</p>
                  </div>
                ) : (
                  resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="group flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <div className="flex-shrink-0">
                        {getFileTypeIcon(resource.fileType)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 min-w-0">
                            <p className="text-sm font-medium text-card-foreground truncate">
                              {resource.name}
                            </p>
                            <Tooltip>
                              <TooltipTrigger>
                                {getProcessingStatusIcon(resource.processingStatus)}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="capitalize">{resource.processingStatus}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground truncate max-w-[140px]" title={resource.fileType}>
                            {resource.fileType}
                          </p>
                          <p className="text-xs text-muted-foreground flex-shrink-0">
                            {formatDate(new Date(resource.createdAt))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Upload Prompt */}
              {selectedLessonId && (
                <div className="p-4 border-t border-border">
                  <div 
                    className="text-center space-y-2 cursor-pointer hover:bg-muted/50 rounded-lg p-4 transition-colors"
                    onClick={handleUploadClick}
                  >
                    <div className="w-10 h-10 mx-auto rounded-lg bg-muted flex items-center justify-center">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isUploading ? 'Uploading...' : 'Click to upload PDF, DOCX, or PPTX files'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case "notes":
        return (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-600 tracking-wide">Notes</h3>
                <p className="text-xs text-muted-foreground">{notes.length} notes</p>
              </div>
            </div>
            
            {/* Notes List */}
            <div className="flex-1 overflow-auto">
              <div className="p-3 space-y-3">
                {isLoadingNotes ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-muted-foreground">Loading notes...</p>
                  </div>
                ) : !selectedLessonId ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <StickyNote className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">Select a lesson to view notes</p>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <StickyNote className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No notes yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Ask me to create notes on a topic</p>
                  </div>
                ) : (
                  notes.map((note) => {
                    const tags = parseTags(note.tags);
                    return (
                      <div
                        key={note.id}
                        className="group p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-semibold text-card-foreground line-clamp-1">
                            {note.title}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                          {note.content}
                        </p>
                        
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {tags.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                                +{tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{formatDate(new Date(note.updatedAt))}</span>
                          <span>{note.content.length} chars</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Create Note Prompt */}
              {selectedLessonId && (
                <div className="p-4 border-t border-border">
                  <div className="text-center space-y-2 rounded-lg p-4 bg-muted/30">
                    <div className="w-10 h-10 mx-auto rounded-lg bg-muted flex items-center justify-center">
                      <StickyNote className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Type &quot;create a note about [topic]&quot; in the chat to generate notes
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case "ai-assistant":
        return <PipecatVoiceAgent />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("flex h-full", className)}>
      {/* Sidebar Panel */}
      {isOpen && (
        <div className="h-full bg-background border-l border-r border-border shadow-sm w-80 overflow-auto">
          {renderTabContent()}
        </div>
      )}

      {/* Tab Icons - Always Visible on Right Edge */}
      <div className="h-full bg-background border-l border-border w-12 flex flex-col items-center py-4 space-y-2 flex-shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleTabClick("resources")}
              className={cn(
                "h-8 w-8",
                activeTab === "resources" && "bg-accent text-accent-foreground"
              )}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Resources</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleTabClick("notes")}
              className={cn(
                "h-8 w-8",
                activeTab === "notes" && "bg-accent text-accent-foreground"
              )}
            >
              <StickyNote className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Notes</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleTabClick("ai-assistant")}
              className={cn(
                "h-8 w-8",
                activeTab === "ai-assistant" && "bg-accent text-accent-foreground"
              )}
            >
              <Bot className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>AI Assistant</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};