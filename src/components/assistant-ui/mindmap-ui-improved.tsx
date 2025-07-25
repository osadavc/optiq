"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { useState, useCallback, useMemo } from "react";
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

// Radial layout algorithm
const calculateRadialLayout = (centerNode: MindMapNode, nodes: MindMapNode[]): MindMapNode[] => {
  const centerX = 400;
  const centerY = 300;
  const baseRadius = 150;
  const levelSpacing = 120;

  // Group nodes by level
  const nodesByLevel = nodes.reduce((acc, node) => {
    if (!acc[node.level]) acc[node.level] = [];
    acc[node.level].push(node);
    return acc;
  }, {} as Record<number, MindMapNode[]>);

  const layoutNodes: MindMapNode[] = [];

  // Position center node
  const centerWithPosition = {
    ...centerNode,
    x: centerX,
    y: centerY,
  };

  Object.keys(nodesByLevel).forEach(levelStr => {
    const level = parseInt(levelStr);
    const levelNodes = nodesByLevel[level];
    const radius = baseRadius + (level - 1) * levelSpacing;
    const angleStep = (2 * Math.PI) / levelNodes.length;

    levelNodes.forEach((node, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      layoutNodes.push({
        ...node,
        x,
        y,
      });
    });
  });

  return [centerWithPosition, ...layoutNodes];
};

// Custom Mind Map Node Component
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
  const nodeSize = isCenter ? 100 : Math.max(70 - node.level * 5, 50);
  const fontSize = isCenter ? 12 : Math.max(10 - node.level, 8);

  return (
    <div
      className={cn(
        "absolute cursor-pointer transition-all duration-200 rounded-xl border-2 flex flex-col items-center justify-center text-white font-medium shadow-lg select-none p-2",
        isSelected && "ring-4 ring-yellow-400 ring-opacity-50 transform scale-110",
        isCenter && "border-white shadow-xl z-10 font-bold"
      )}
      style={{
        left: node.x - nodeSize / 2,
        top: node.y - nodeSize / 2,
        width: nodeSize,
        height: nodeSize,
        backgroundColor: node.color,
        borderColor: isSelected ? "#FCD34D" : "rgba(255,255,255,0.3)",
        fontSize: `${fontSize}px`,
        transform: `scale(${zoom}) ${isSelected ? 'scale(1.1)' : ''}`,
        transformOrigin: "center",
      }}
      onClick={() => onClick(node.id)}
      onDoubleClick={() => onDoubleClick(node.id)}
      title={node.description}
    >
      <div className="text-center overflow-hidden leading-tight">
        {node.title.length > 12 ? `${node.title.slice(0, 12)}...` : node.title}
      </div>
      {node.level > 0 && (
        <div className="text-xs opacity-75 mt-1">L{node.level}</div>
      )}
    </div>
  );
};

// Enhanced Connection Line Component
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
  const getConnectionStyle = (type: string) => {
    switch (type) {
      case "hierarchical":
        return { stroke: "#6B7280", strokeWidth: 2, strokeDasharray: "none" };
      case "associative":
        return { stroke: "#10B981", strokeWidth: 2, strokeDasharray: "5,5" };
      case "causal":
        return { stroke: "#F59E0B", strokeWidth: 3, strokeDasharray: "none" };
      default:
        return { stroke: "#6B7280", strokeWidth: 2, strokeDasharray: "none" };
    }
  };

  const style = getConnectionStyle(connection.type);
  
  // Calculate control points for curved lines
  const midX = (sourceNode.x + targetNode.x) / 2;
  const midY = (sourceNode.y + targetNode.y) / 2;
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const curve = distance * 0.2;
  
  // Perpendicular offset for curve
  const offsetX = -dy / distance * curve;
  const offsetY = dx / distance * curve;
  
  const controlX = midX + offsetX;
  const controlY = midY + offsetY;

  const pathD = `M ${sourceNode.x} ${sourceNode.y} Q ${controlX} ${controlY} ${targetNode.x} ${targetNode.y}`;

  return (
    <g>
      <path
        d={pathD}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.strokeWidth * zoom}
        strokeDasharray={style.strokeDasharray}
        opacity={0.7}
        markerEnd="url(#arrowhead)"
      />
      {connection.label && (
        <text
          x={controlX}
          y={controlY}
          textAnchor="middle"
          fontSize={`${10 * zoom}px`}
          fill="#4B5563"
          className="pointer-events-none"
        >
          {connection.label}
        </text>
      )}
    </g>
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
          <span>Position: ({Math.round(node.x)}, {Math.round(node.y)})</span>
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

    const handleNodeClick = useCallback((nodeId: string) => {
      setSelectedNode(nodeId === selectedNode ? null : nodeId);
    }, [selectedNode]);

    const handleNodeDoubleClick = useCallback((nodeId: string) => {
      setSelectedNode(nodeId);
      setShowDetails(true);
    }, []);

    // Calculate layout using radial algorithm
    const layoutNodes = useMemo(() => {
      if (!result?.mindMapData) return [];
      
      return calculateRadialLayout(
        result.mindMapData.centerNode,
        result.mindMapData.nodes
      );
    }, [result?.mindMapData]);

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
    const allNodes = layoutNodes;
    const selectedNodeData = selectedNode
      ? allNodes.find(n => n.id === selectedNode)
      : null;

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
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#6B7280"
                  />
                </marker>
              </defs>
              
              {mindMapData.connections.map((connection) => {
                const sourceNode = allNodes.find(n => n.id === connection.sourceId);
                const targetNode = allNodes.find(n => n.id === connection.targetId);
                
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
              {allNodes.map((node) => (
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
                  <div className="w-4 h-px bg-green-500 border-dashed"></div>
                  <span>Associative</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-px bg-yellow-500" style={{ height: "2px" }}></div>
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
                {Math.round(zoom * 100)}%
              </div>
              <div className="text-sm text-gray-600">Zoom Level</div>
            </div>
          </div>
        </div>
      </div>
    );
  },
});