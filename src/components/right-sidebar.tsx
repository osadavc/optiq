"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Bot, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getResourcesByLessonId } from "@/lib/actions/resources";
import { PipecatVoiceAgent } from "@/components/pipecat-voice-agent";

interface RightSidebarProps {
  className?: string;
}

type TabType = "resources" | "ai-assistant";

interface Resource {
  id: number;
  name: string;
  fileType: string;
  processingStatus: string;
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
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const searchParams = useSearchParams();
  const selectedLessonId = searchParams.get('lesson');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOpen = activeTab !== null;

  // Fetch resources when lesson changes
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

    fetchResources();
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