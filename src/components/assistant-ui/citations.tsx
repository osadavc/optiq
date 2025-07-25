"use client";

import { FC } from "react";
import { FileText, BookOpen, User } from "lucide-react";

export interface Citation {
  id: string;
  fileName: string;
  fileType: string;
  title?: string;
  author?: string;
  score: number;
  sourceNumber: number;
}

interface CitationsProps {
  citations: Citation[];
}

export const Citations: FC<CitationsProps> = ({ citations }) => {
  if (!citations || citations.length === 0) {
    return null;
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
        <BookOpen className="w-3 h-3" />
        Sources referenced:
      </div>
      <div className="space-y-2">
        {citations.map((citation) => (
          <div 
            key={citation.id} 
            className="flex items-start gap-3 p-2 rounded-md bg-muted/30 border border-muted"
          >
            <div className="flex-shrink-0 mt-0.5">
              {getFileIcon(citation.fileType)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  [{citation.sourceNumber}]
                </span>
                <span className="text-sm font-medium truncate">
                  {citation.title || citation.fileName}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {citation.fileName}
                {citation.author && (
                  <span className="flex items-center gap-1 mt-1">
                    <User className="w-3 h-3" />
                    {citation.author}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Relevance: {Math.round(citation.score * 100)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};