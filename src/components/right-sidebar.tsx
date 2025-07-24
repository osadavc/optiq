"use client";

import React, { useState, useRef, useCallback } from "react";
import { FileText, Bot, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RightSidebarProps {
  className?: string;
}

type TabType = "resources" | "ai-assistant";

export const RightSidebar = ({ className }: RightSidebarProps) => {
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const isOpen = activeTab !== null;

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
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-600 tracking-wide mb-4">Resources</h3>
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
    <div className={cn("fixed right-0 top-0 h-full z-50", className)}>
      {/* Sidebar Panel */}
      {isOpen && (
        <div className="absolute right-12 top-0 h-full bg-background border-l border-r border-border shadow-sm w-80 overflow-auto">
          {renderTabContent()}
        </div>
      )}

      {/* Tab Icons - Always Visible on Right Edge */}
      <div className="absolute right-0 top-0 h-full bg-background border-l border-border w-12 flex flex-col items-center py-4 space-y-2">
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