"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  Node, 
  Edge,
  useNodesState,
  useEdgesState,
  Panel
} from "reactflow";
import "reactflow/dist/style.css";
import { useStore } from "@/store/useStore";
import { ArrowRight, ArrowLeft, Download, Play, RefreshCw, FileText } from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

// Helper to convert our custom AST tree to React Flow nodes/edges
const generateFlowElements = (tree: any) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Calculate required width for each subtree to prevent overlapping
  const calculateWidths = (node: any) => {
    if (!node) return 0;
    if (!node.children || node.children.length === 0) {
      node.width = 160; // base width of a node
      return node.width;
    }
    let totalWidth = 0;
    node.children.forEach((c: any) => {
      totalWidth += calculateWidths(c);
    });
    node.width = Math.max(160, totalWidth + (node.children.length - 1) * 40);
    return node.width;
  };

  calculateWidths(tree);
  
  const traverse = (node: any, x: number, y: number, parentId: string | null = null) => {
    if (!node) return;
    
    const id = `node-${nodes.length}`;
    
    // Vivid, opaque node colors that are clearly visible on dark canvas
    let bgColor = "#1e1b4b";         // deep indigo (default/statement nodes)
    let borderColor = "#6366f1";     // indigo border
    let textColor = "#c7d2fe";       // indigo-200
    let shadowColor = "rgba(99,102,241,0.35)";
    
    if (node.type === 'Program' || node.type === 'Statements') {
      bgColor = "#2e1065";           // deep purple
      borderColor = "#a855f7";       // purple-500
      textColor = "#e9d5ff";         // purple-200
      shadowColor = "rgba(168,85,247,0.45)";
    } else if (node.type === 'Terminal' || node.type === 'Identifier' || node.type === 'Number' || node.type === 'Operator' || node.type === 'String' || node.type === 'DataType') {
      bgColor = "#0c1a3a";           // deep blue
      borderColor = "#3b82f6";       // blue-500
      textColor = "#93c5fd";         // blue-300
      shadowColor = "rgba(59,130,246,0.4)";
    } else {
      bgColor = "#1c0f00";           // deep orange/amber
      borderColor = "#f97316";       // orange-500
      textColor = "#fdba74";         // orange-300
      shadowColor = "rgba(249,115,22,0.4)";
    }

    nodes.push({
      id,
      position: { x, y },
      data: { label: node.value || node.type },
      style: {
        background: bgColor,
        border: `2px solid ${borderColor}`,
        color: textColor,
        borderRadius: "10px",
        padding: "10px 16px",
        minWidth: "120px",
        textAlign: "center",
        fontWeight: "700",
        fontSize: "12px",
        fontFamily: "Consolas, 'Fira Code', monospace",
        boxShadow: `0 0 18px ${shadowColor}, 0 4px 12px rgba(0,0,0,0.5)`,
        letterSpacing: "0.02em",
      }
    });

    if (parentId !== null) {
      edges.push({
        id: `edge-${parentId}-${id}`,
        source: parentId,
        target: id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: "#6366f1", strokeWidth: 2, opacity: 0.8 }
      });
    }

    if (node.children && node.children.length > 0) {
      let startX = x - (node.width / 2);
      node.children.forEach((child: any) => {
        let childWidth = child.width || 160;
        let childCenterX = startX + (childWidth / 2);
        traverse(child, childCenterX, y + 110, id);
        startX += childWidth + 40;
      });
    }
  };

  traverse(tree, 0, 0);
  
  // Center root node x-coordinate
  if (nodes.length > 0) {
     const minX = Math.min(...nodes.map(n => n.position.x));
     const maxX = Math.max(...nodes.map(n => n.position.x));
     const offset = (maxX + minX) / 2;
     nodes.forEach(n => { n.position.x -= offset; });
  }

  return { allNodes: nodes, allEdges: edges };
};

export default function ParseTreePage() {
  const router = useRouter();
  const { parseTree, theme } = useStore();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const flowRef = useRef<HTMLDivElement>(null);

  // Load fully constructed AST elements
  const loadFullTree = useCallback(() => {
    if (parseTree) {
      const { allNodes, allEdges } = generateFlowElements(parseTree);
      setNodes(allNodes);
      setEdges(allEdges);
    }
  }, [parseTree, setNodes, setEdges]);

  useEffect(() => {
    loadFullTree();
  }, [loadFullTree]);

  // Step-by-step recursive animation trigger
  const runDrawAnimation = () => {
    if (!parseTree || isAnimating) return;
    
    setIsAnimating(true);
    setNodes([]);
    setEdges([]);

    const { allNodes, allEdges } = generateFlowElements(parseTree);
    let currentNodeIndex = 0;

    const interval = setInterval(() => {
      if (currentNodeIndex >= allNodes.length) {
        clearInterval(interval);
        setIsAnimating(false);
        setAnimationProgress(100);
        return;
      }

      const activeNode = allNodes[currentNodeIndex];
      setNodes((prevNodes) => [...prevNodes, activeNode]);

      // Add connected edges for newly drawn node
      const matchingEdges = allEdges.filter(e => e.target === activeNode.id);
      if (matchingEdges.length > 0) {
        setEdges((prevEdges) => [...prevEdges, ...matchingEdges]);
      }

      currentNodeIndex++;
      setAnimationProgress(Math.round((currentNodeIndex / allNodes.length) * 100));
    }, 180);
  };

  const handleNext = () => {
    router.push("/codegen");
  };

  // Image Export PNG
  const handleDownloadImage = async () => {
    const el = document.querySelector('.react-flow') as HTMLElement;
    if (!el) return;
    
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: theme === 'dark' ? '#09090b' : '#f4f4f5',
        filter: (node) => {
          if (
            node?.classList?.contains('react-flow__minimap') ||
            node?.classList?.contains('react-flow__controls') ||
            node?.classList?.contains('react-flow__panel')
          ) {
            return false;
          }
          return true;
        },
      });
      
      const link = document.createElement('a');
      link.download = 'compilerflow-ast.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download image", err);
      alert("Failed to export image. Zoom out slightly and try again.");
    }
  };

  // Document Export PDF
  const handleDownloadPDF = async () => {
    const el = document.querySelector('.react-flow') as HTMLElement;
    if (!el) return;

    try {
      const dataUrl = await toPng(el, {
        backgroundColor: theme === 'dark' ? '#09090b' : '#f4f4f5',
        filter: (node) => {
          if (
            node?.classList?.contains('react-flow__minimap') ||
            node?.classList?.contains('react-flow__controls') ||
            node?.classList?.contains('react-flow__panel')
          ) {
            return false;
          }
          return true;
        },
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      // Header info on PDF
      pdf.setFont("Helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(59, 130, 246);
      pdf.text("CompilerFlow Abstract Syntax Tree (AST)", 15, 20);

      pdf.setFont("Helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(113, 113, 122);
      pdf.text(`Exported: ${new Date().toLocaleDateString()} | Theme Style: ${theme.toUpperCase()}`, 15, 26);

      // Draw horizontal line
      pdf.setDrawColor(228, 228, 231);
      pdf.line(15, 30, 282, 30);

      // Embed AST canvas PNG image
      pdf.addImage(dataUrl, 'PNG', 15, 35, 267, 150);
      pdf.save("compilerflow-ast-report.pdf");

    } catch (err) {
      console.error("Failed to export PDF", err);
      alert("Failed to export PDF report. Zoom out slightly and try again.");
    }
  };

  if (!parseTree) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-16 h-16 text-zinc-400 dark:text-zinc-600 mb-4 animate-spin" />
        <h2 className="text-2xl font-bold mb-2">No Parse Tree Available</h2>
        <p className="text-zinc-500 mb-6">Return to syntax analyzer to process pseudo-code inputs first.</p>
        <button 
          onClick={() => router.push("/parser")}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center space-x-2 text-white font-semibold shadow-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Parser</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 md:p-8 h-[calc(100vh-64px)] pb-12">
      {/* Header section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 md:gap-0"
      >
        <div>
          <h1 className="text-3xl font-extrabold gradient-text mb-2">Abstract Syntax Tree (AST)</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Interactive recursive node assembly visualization with drag, zoom, and animations.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto shrink-0">
          <button
            onClick={() => router.push("/parser")}
            className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold rounded-lg flex items-center justify-center space-x-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Parser</span>
          </button>

          <button
            onClick={runDrawAnimation}
            disabled={isAnimating}
            className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold rounded-lg flex items-center justify-center space-x-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-40 cursor-pointer"
          >
            <Play className="w-4 h-4 text-purple-500" />
            <span>{isAnimating ? `Drawing ${animationProgress}%` : "Play Draw Animation"}</span>
          </button>
          
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] w-full sm:w-auto cursor-pointer"
          >
            <span>View Generated Code</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* React Flow Board */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full flex-1 min-h-[480px] glass rounded-2xl border border-zinc-300 dark:border-zinc-800 overflow-hidden relative shadow-2xl flex flex-col"
        ref={flowRef}
      >
        <div className="absolute top-4 left-4 z-10 flex space-x-2">
          <span className="bg-zinc-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Nodes: {nodes.length}
          </span>
          {isAnimating && (
            <span className="bg-purple-500/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-purple-500/30 text-[10px] font-bold text-purple-400 animate-pulse uppercase tracking-widest">
              Drawing Tree...
            </span>
          )}
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.05}
          maxZoom={2}
          className="bg-zinc-950 h-full w-full flex-1"
          style={{ width: '100%', height: '100%', minHeight: '480px' }}
          onInit={(reactFlowInstance) => {
            setTimeout(() => {
              reactFlowInstance.fitView({ padding: 0.2 });
            }, 150);
          }}
        >
          <Background color="#27272a" gap={24} size={1.5} />
          <Controls className="bg-zinc-900 border-zinc-700 fill-zinc-300 rounded-lg shadow-md border" />
          <MiniMap 
            nodeColor={(n) => {
              if (n.style?.background) return n.style.background as string;
              return '#1e1b4b';
            }}
            maskColor="rgba(9, 9, 11, 0.85)"
            className="bg-zinc-900 border border-zinc-700 rounded-xl hidden sm:block"
          />
          
          <Panel position="top-right" className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-700 backdrop-blur-sm shadow-md flex space-x-1">
            <button 
              onClick={handleDownloadImage}
              className="flex items-center space-x-2 text-xs font-bold text-zinc-300 hover:text-blue-400 transition-colors px-3 py-2 rounded-lg hover:bg-zinc-800 cursor-pointer"
              title="Download image as PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PNG</span>
            </button>
            
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 text-xs font-bold text-zinc-300 hover:text-purple-400 transition-colors px-3 py-2 rounded-lg hover:bg-zinc-800 cursor-pointer"
              title="Download report as PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>

            {isAnimating && (
              <button 
                onClick={loadFullTree}
                className="flex items-center space-x-2 text-xs font-bold text-zinc-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-zinc-800 cursor-pointer"
                title="Skip Animation"
              >
                <span>Skip</span>
              </button>
            )}
          </Panel>
        </ReactFlow>
      </motion.div>
    </div>
  );
}
