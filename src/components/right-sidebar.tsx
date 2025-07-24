"use client";

import React, { useState, useRef, useCallback } from "react";
import { FileText, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RightSidebarProps {
  className?: string;
}

type TabType = "resources" | "ai-assistant";

const MIN_WIDTH = 250;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 350;
const COLLAPSED_WIDTH = 48;

export const RightSidebar = ({ className }: RightSidebarProps) => {
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const isOpen = activeTab !== null;

  const handleTabClick = (tab: TabType) => {
    if (activeTab === tab) {
      setActiveTab(null);
    } else {
      setActiveTab(tab);
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;

      const rect = sidebarRef.current.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;

      if (newWidth < MIN_WIDTH) {
        setActiveTab(null);
      } else if (newWidth <= MAX_WIDTH) {
        setWidth(Math.max(MIN_WIDTH, newWidth));
      }
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

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
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-600 tracking-wide mb-4">AI Assistant</h3>
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
        <div
          ref={sidebarRef}
          className="absolute right-12 top-0 h-full bg-background border-l border-r border-border shadow-sm flex"
          style={{ width: `${width}px` }}
        >
          {/* Resize Handle */}
          <div
            className="w-0.5 bg-transparent hover:bg-border/30 cursor-col-resize transition-colors duration-200"
            onMouseDown={handleMouseDown}
          />
          
          {/* Content */}
          <div className="flex-1 overflow-auto">
            {renderTabContent()}
          </div>
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