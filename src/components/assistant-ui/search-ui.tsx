"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { SearchIcon, FileTextIcon, CheckCircleIcon } from "lucide-react";

type SearchResult = {
  source: string;
  content: string;
  score: number;
  metadata: {
    fileName: string;
    fileType: string;
    title?: string;
    author?: string;
    chunkIndex: number;
  };
};

type SearchResponse = {
  results: SearchResult[];
  totalResults: number;
  error?: string;
};

export const SearchMaterialsToolUI = makeAssistantToolUI<
  { query: string; topK?: number },
  SearchResponse
>({
  toolName: "search_materials",
  render: ({ args, result, status }) => {
    if (status.type === "running") {
      return (
        <div className="flex items-center gap-3 p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <div>
            <h3 className="font-medium">Searching materials...</h3>
            <p className="text-sm text-muted-foreground">
              Looking for content related to &quot;{args.query}&quot;
            </p>
          </div>
        </div>
      );
    }

    if (!result) {
      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-red-800">
            Failed to search materials. Please try again.
          </p>
        </div>
      );
    }

    if (result.error) {
      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-red-800">{result.error}</p>
        </div>
      );
    }

    if (result.totalResults === 0) {
      return (
        <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <SearchIcon className="h-5 w-5 text-gray-500" />
            <div>
              <h3 className="font-medium text-gray-700">No results found</h3>
              <p className="text-sm text-gray-600">
                No content found for &quot;{args.query}&quot; in your materials.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  },
});
