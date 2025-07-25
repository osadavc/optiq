"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GitBranchIcon, ZoomInIcon, ZoomOutIcon, MoveIcon } from "lucide-react";

// Types for mind map
type MindMapNode = {
  id: string;
  title: string;
  description: string;
  x: number;
  y: number;
  level: number;
  parentId?: string;
  color: string;
  expanded: boolean;
  connections?: string[];
};

type MindMapConnection = {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  type: "hierarchical" | "associative" | "causal";
};

type MindMapData = {
  topic: string;
  centerNode: MindMapNode;
  nodes: MindMapNode[];
  connections: MindMapConnection[];
  selectedNode: string | null;
  zoom: number;
  panX: number;
  panY: number;
};

// Mind Map Node Component
const MindMapNodeComponent = ({
  node,
  isSelected,
  isCenter,
  onClick,
  onDoubleClick,
  zoom,
}: {
  node: MindMapNode;
  isSelected: boolean;
  isCenter: boolean;
  onClick: (nodeId: string) => void;
  onDoubleClick: (nodeId: string) => void;
  zoom: number;
}) => {
  const nodeSize = isCenter ? 120 : Math.max(80 - node.level * 10, 40);
  const fontSize = isCenter ? "14px" : `${Math.max(12 - node.level, 10)}px`;

  return (
    <div
      className={cn(
        "absolute cursor-pointer transition-all duration-200 rounded-lg border-2 flex items-center justify-center text-white font-medium shadow-lg select-none",
        isSelected && "ring-4 ring-yellow-400 ring-opacity-50",
        isCenter && "border-white shadow-xl z-10"
      )}
      style={{
        left: node.x - nodeSize / 2,
        top: node.y - nodeSize / 2,
        width: nodeSize,
        height: nodeSize,
        backgroundColor: node.color,
        borderColor: isSelected ? "#FCD34D" : node.color,
        transform: `scale(${zoom})`,
        transformOrigin: "center",
        fontSize: fontSize,
      }}
      onClick={() => onClick(node.id)}
      onDoubleClick={() => onDoubleClick(node.id)}
      title={node.description}
    >
      <div className="text-center p-2 overflow-hidden">
        <div className="font-semibold leading-tight">
          {node.title.length > 15 ? `${node.title.slice(0, 15)}...` : node.title}
        </div>
      </div>
      {!node.expanded && node.connections && node.connections.length > 0 && (
        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white">
          +
        </div>
      )}
    </div>
  );
};

// Connection Line Component
const ConnectionLineComponent = ({
  connection,
  sourceNode,
  targetNode,
  zoom,
}: {
  connection: MindMapConnection;
  sourceNode: MindMapNode;
  targetNode: MindMapNode;
  zoom: number;
}) => {
  const getConnectionColor = (type: string) => {
    switch (type) {
      case "hierarchical":
        return "#6B7280";
      case "associative":
        return "#10B981";
      case "causal":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  const strokeWidth = Math.max(2 * zoom, 1);
  const color = getConnectionColor(connection.type);

  return (
    <line
      x1={sourceNode.x}
      y1={sourceNode.y}
      x2={targetNode.x}
      y2={targetNode.y}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={connection.type === "associative" ? "5,5" : "none"}
      opacity={0.7}
    />
  );
};

// Node Details Panel Component
const NodeDetailsPanel = ({
  node,
  onClose,
}: {
  node: MindMapNode;
  onClose: () => void;
}) => {
  return (
    <div className="absolute top-4 right-4 w-80 bg-white border rounded-lg shadow-lg p-4 z-20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{node.title}</h3>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>
      
      <div className="space-y-3">
        <div>
          <span className="text-sm font-medium text-gray-700">Description:</span>
          <p className="text-sm text-gray-600 mt-1">{node.description}</p>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: node.color }}
            />
            <span>Level {node.level}</span>
          </div>
          {node.connections && (
            <span>{node.connections.length} connections</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Mind Map Tool UI
export const MindMapToolUI = makeAssistantToolUI<
  { topic: string; depth?: number },
  {
    mindMapData: MindMapData;
    completed: boolean;
  }
>({
  toolName: "generateMindMap",
  render: ({ args, result, status, addResult }) => {
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const [showDetails, setShowDetails] = useState(false);
    const [expandedNodes] = useState<Set<string>>(new Set());

    const handleNodeClick = useCallback((nodeId: string) => {
      setSelectedNode(nodeId === selectedNode ? null : nodeId);
    }, [selectedNode]);

    const handleNodeDoubleClick = useCallback((nodeId: string) => {
      setSelectedNode(nodeId);
      setShowDetails(true);
    }, []);

    if (status.type === "running") {
      return (
        <div className="flex items-center gap-3 p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <div>
            <h3 className="font-medium">Creating your mind map...</h3>
            <p className="text-sm text-muted-foreground">
              Mapping concepts about {args.topic}
            </p>
          </div>
        </div>
      );
    }

    if (!result?.mindMapData) {
      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-red-800">
            Failed to generate mind map. Please try again.
          </p>
        </div>
      );
    }

    const { mindMapData } = result;
    const allNodes = [mindMapData.centerNode, ...mindMapData.nodes];
    const selectedNodeData = selectedNode
      ? allNodes.find(n => n.id === selectedNode)
      : null;

    // Debug logging
    console.log('Mind map data:', mindMapData);
    console.log('All nodes:', allNodes);
    console.log('Connections:', mindMapData.connections);

    const handleZoomIn = () => {
      setZoom(prev => Math.min(prev * 1.2, 3));
    };

    const handleZoomOut = () => {
      setZoom(prev => Math.max(prev / 1.2, 0.5));
    };

    const handleResetView = () => {
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setSelectedNode(null);
    };


    const completeMindMap = () => {
      addResult({
        mindMapData: {
          ...mindMapData,
          selectedNode,
          zoom,
          panX,
          panY,
        },
        completed: true,
      });
    };

    // For now, show all nodes to debug connection issues
    const visibleNodes = allNodes;

    // Show all connections to debug
    const visibleConnections = mindMapData.connections;

    return (
      <div className="max-w-6xl p-6 bg-white border rounded-lg shadow-sm ml-0">
        {/* Mind Map Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <GitBranchIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Mind Map: {mindMapData.topic}</h2>
                <p className="text-sm text-muted-foreground">
                  {allNodes.length} concepts • {mindMapData.connections.length} connections
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleZoomOut}
                variant="outline"
                size="sm"
                title="Zoom Out"
              >
                <ZoomOutIcon className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleZoomIn}
                variant="outline"
                size="sm"
                title="Zoom In"
              >
                <ZoomInIcon className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleResetView}
                variant="outline"
                size="sm"
                title="Reset View"
              >
                <MoveIcon className="h-4 w-4" />
              </Button>
              <Button
                onClick={completeMindMap}
                variant="default"
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                Complete
              </Button>
            </div>
          </div>
        </div>

        {/* Mind Map Canvas */}
        <div className="relative">
          <div
            className="relative bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-gray-200 rounded-lg overflow-hidden"
            style={{ height: "600px", width: "100%" }}
          >
            {/* SVG for connections */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: "100%", height: "100%" }}
            >
              {visibleConnections.map((connection) => {
                const sourceNode = allNodes.find(n => n.id === connection.sourceId);
                const targetNode = allNodes.find(n => n.id === connection.targetId);
                
                // Debug log for missing nodes
                if (!sourceNode) {
                  console.log('Missing source node:', connection.sourceId, 'Available nodes:', allNodes.map(n => n.id));
                }
                if (!targetNode) {
                  console.log('Missing target node:', connection.targetId, 'Available nodes:', allNodes.map(n => n.id));
                }
                
                if (!sourceNode || !targetNode) return null;

                return (
                  <ConnectionLineComponent
                    key={connection.id}
                    connection={connection}
                    sourceNode={sourceNode}
                    targetNode={targetNode}
                    zoom={zoom}
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            <div
              className="relative h-full"
              style={{
                transform: `translate(${panX}px, ${panY}px)`,
              }}
            >
              {visibleNodes.map((node) => (
                <MindMapNodeComponent
                  key={node.id}
                  node={node}
                  isSelected={selectedNode === node.id}
                  isCenter={node.id === mindMapData.centerNode.id}
                  onClick={handleNodeClick}
                  onDoubleClick={handleNodeDoubleClick}
                  zoom={zoom}
                />
              ))}
            </div>

            {/* Instructions Overlay */}
            <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 text-xs text-gray-600">
              <div className="space-y-1">
                <div>• Click nodes to select them</div>
                <div>• Double-click for details</div>
                <div>• Use zoom controls to navigate</div>
              </div>
            </div>

            {/* Legend */}
            <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 text-xs">
              <div className="font-medium mb-2">Connections:</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-px bg-gray-500"></div>
                  <span>Hierarchical</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-px bg-green-500" style={{ borderStyle: "dashed" }}></div>
                  <span>Associative</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-px bg-yellow-500"></div>
                  <span>Causal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Node Details Panel */}
          {showDetails && selectedNodeData && (
            <NodeDetailsPanel
              node={selectedNodeData}
              onClose={() => setShowDetails(false)}
            />
          )}
        </div>

        {/* Node List */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Concept Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allNodes.map((node) => (
              <div
                key={node.id}
                className={cn(
                  "p-3 border rounded-lg cursor-pointer transition-all duration-200",
                  selectedNode === node.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => handleNodeClick(node.id)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: node.color }}
                  />
                  <span className="font-medium text-sm">{node.title}</span>
                  <span className="text-xs text-gray-500">L{node.level}</span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {node.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {allNodes.length}
              </div>
              <div className="text-sm text-gray-600">Total Concepts</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {mindMapData.connections.length}
              </div>
              <div className="text-sm text-gray-600">Connections</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {Math.max(...allNodes.map(n => n.level)) + 1}
              </div>
              <div className="text-sm text-gray-600">Depth Levels</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {selectedNode ? "1" : "0"}
              </div>
              <div className="text-sm text-gray-600">Selected</div>
            </div>
          </div>
        </div>
      </div>
    );
  },
});