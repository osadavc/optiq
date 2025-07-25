"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Bot, Mic, MicOff, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getResourcesByLessonId } from "@/lib/actions/resources";

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
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const searchParams = useSearchParams();
  const selectedLessonId = searchParams.get('lesson');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      
      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();
      
      setIsRecording(true);
      
      // Start audio level monitoring
      monitorAudioLevel();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setIsRecording(false);
    setAudioLevel(0);
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateLevel = () => {
      if (!analyserRef.current || !isRecording) return;
      
      analyserRef.current.getByteTimeDomainData(dataArray);
      
      // Calculate RMS (Root Mean Square) for more accurate volume detection
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const sample = (dataArray[i] - 128) / 128; // Convert to -1 to 1 range
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / bufferLength);
      
      // Apply some smoothing and amplification
      const smoothedLevel = Math.min(rms * 10, 1); // Amplify and cap at 1
      
      setAudioLevel(smoothedLevel);
      
      if (isRecording) {
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, []);

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
        return (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-medium text-gray-600 tracking-wide">Optiq Agent</h3>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col p-6 space-y-6">
              {/* Description */}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ask questions about your study resources and clarify doubts, or anything you feel like.
                </p>
              </div>
              
              {/* Voice Button Section */}
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                {/* Voice Button with Animation - Fixed Container */}
                <div className="relative flex items-center justify-center w-32 h-32">
                  {/* Outer pulsing circles - react to voice */}
                  <div 
                    className={cn(
                      "absolute inset-0 rounded-full bg-primary/15 transition-all duration-100",
                      isRecording ? "opacity-100" : "opacity-0"
                    )}
                    style={{
                      transform: isRecording ? `scale(${1.2 + audioLevel * 1.5})` : 'scale(1)',
                    }}
                  />
                  <div 
                    className={cn(
                      "absolute inset-0 rounded-full bg-primary/8 transition-all duration-150",
                      isRecording ? "opacity-100" : "opacity-0"
                    )}
                    style={{
                      transform: isRecording ? `scale(${1.5 + audioLevel * 1.2})` : 'scale(1)',
                    }}
                  />
                  
                  {/* Main voice button */}
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="icon"
                    onClick={handleVoiceToggle}
                    className="h-20 w-20 rounded-full relative z-10 transition-all duration-200 hover:scale-105"
                  >
                    {isRecording ? (
                      <MicOff className="h-7 w-7" />
                    ) : (
                      <Mic className="h-7 w-7" />
                    )}
                  </Button>
                </div>
                
                {/* Status - Fixed Height Container */}
                <div className="text-center h-12 flex flex-col justify-center">
                  <p className="text-sm font-medium text-foreground">
                    {isRecording ? "Listening..." : "Ready to help"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRecording 
                      ? "Speak clearly and I'll assist you" 
                      : "Click to start voice conversation"
                    }
                  </p>
                </div>
                
                {/* Audio Level Indicator - Fixed Height Container */}
                <div className="h-6 flex items-center justify-center">
                  {isRecording && (
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => {
                        const barHeight = audioLevel > i * 0.2 ? Math.min(24, Math.floor(audioLevel * 20) + 8) : 8;
                        return (
                          <div
                            key={i}
                            className="w-1 bg-primary rounded-full transition-all duration-100"
                            style={{ height: `${barHeight}px` }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
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