"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { 
  ArrowRight, 
  ArrowLeft, 
  Code2, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  ShieldCheck,
  Zap
} from "lucide-react";

type LanguageKey = 'c' | 'python' | 'java' | 'assembly';

export default function CodeGenPage() {
  const router = useRouter();
  const { 
    code, 
    cCode, 
    pythonCode, 
    javaCode, 
    assemblyCode, 
    tac, 
    optimizationLog 
  } = useStore();

  const [activeTab, setActiveTab] = useState<LanguageKey>('c');
  const [copied, setCopied] = useState(false);

  const getActiveCode = () => {
    switch (activeTab) {
      case 'python': return pythonCode || "# No Python code generated";
      case 'java': return javaCode || "// No Java code generated";
      case 'assembly': return assemblyCode || "; No x86 Assembly generated";
      default: return cCode || "// No C code generated";
    }
  };

  const getFilename = () => {
    switch (activeTab) {
      case 'python': return 'program.py';
      case 'java': return 'Main.java';
      case 'assembly': return 'program.asm';
      default: return 'main.c';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = getFilename();
    let mime = 'text/plain';
    if (activeTab === 'c') mime = 'text/x-csrc';
    else if (activeTab === 'python') mime = 'text/x-python';
    else if (activeTab === 'java') mime = 'text/x-java-source';
    else if (activeTab === 'assembly') mime = 'text/x-nasm';

    const blob = new Blob([getActiveCode()], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!cCode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Code2 className="w-16 h-16 text-zinc-400 dark:text-zinc-600 mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold mb-2">No Generated Code Found</h2>
        <p className="text-zinc-500 mb-6">Return to AST to generate the translation outputs first.</p>
        <button 
          onClick={() => router.push("/tree")}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center space-x-2 text-white font-semibold shadow-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Parse Tree</span>
        </button>
      </div>
    );
  }

  const tabs: { key: LanguageKey; label: string; ext: string }[] = [
    { key: 'c', label: 'C Program', ext: 'main.c' },
    { key: 'python', label: 'Python 3', ext: 'program.py' },
    { key: 'java', label: 'Java Class', ext: 'Main.java' },
    { key: 'assembly', label: 'x86 Assembly', ext: 'program.asm' }
  ];

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 md:p-8 h-[calc(100vh-64px)] pb-12">
      {/* Header section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 md:gap-0"
      >
        <div>
          <h1 className="text-3xl font-extrabold gradient-text mb-2">Multi-Language Code Generation</h1>
          <p className="text-zinc-600 dark:text-zinc-400">View parsed Three Address Code (TAC), optimization folding reports, and code translation targets.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto shrink-0">
          <button
            onClick={() => router.push("/tree")}
            className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold rounded-lg flex items-center justify-center space-x-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to AST</span>
          </button>
          
          <button
            onClick={() => router.push("/output")}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] w-full sm:w-auto cursor-pointer"
          >
            <span>Execute Program</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Compiler Panels */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0">
        
        {/* Left column: TAC and Optimization logs (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
          
          {/* TAC Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 flex flex-col border border-zinc-300 dark:border-zinc-800 rounded-xl overflow-hidden glass shadow-lg min-h-0"
          >
            <div className="h-12 bg-zinc-100 dark:bg-zinc-900/80 border-b border-zinc-300 dark:border-zinc-800 flex items-center justify-between px-4 shrink-0">
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono flex items-center">
                <Terminal className="w-4 h-4 mr-2" />
                Three Address Code (TAC)
              </span>
            </div>
            <div className="flex-1 min-h-[180px] p-4 bg-zinc-50 dark:bg-[#0c0c0e] overflow-y-auto">
              <pre className="font-mono text-sm text-indigo-600 dark:text-indigo-300 leading-relaxed">
                {tac || "; No TAC generated"}
              </pre>
            </div>
          </motion.div>

          {/* Optimization Log Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="h-[200px] flex flex-col border border-zinc-300 dark:border-zinc-800 rounded-xl overflow-hidden glass shadow-lg shrink-0"
          >
            <div className="h-12 bg-zinc-100 dark:bg-zinc-900/80 border-b border-zinc-300 dark:border-zinc-800 flex items-center justify-between px-4 shrink-0">
              <span className="text-sm font-bold text-green-600 dark:text-green-400 font-mono flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2" />
                AST Optimization Log
              </span>
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                Active
              </span>
            </div>
            <div className="flex-1 p-4 bg-zinc-50 dark:bg-[#0c0c0e] overflow-y-auto font-mono text-xs text-zinc-700 dark:text-zinc-300 leading-normal">
              {optimizationLog.length === 0 ? (
                <div className="text-zinc-500 italic font-semibold flex items-center justify-center h-full">
                  No constant folding or dead code optimization required.
                </div>
              ) : (
                <div className="space-y-2">
                  {optimizationLog.map((logMsg, i) => (
                    <div key={i} className="flex items-start space-x-2 border-b border-zinc-200 dark:border-zinc-900 pb-1.5 last:border-0 last:pb-0">
                      <Zap className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                      <span>{logMsg}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right column: Target Language Tabs (3 cols) */}
        <motion.div 
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 flex flex-col border border-zinc-300 dark:border-zinc-800 rounded-xl overflow-hidden glass shadow-2xl min-h-0"
        >
          {/* Tabs header */}
          <div className="h-14 bg-zinc-100 dark:bg-zinc-900/80 border-b border-zinc-300 dark:border-zinc-800 flex items-center justify-between px-4 shrink-0 overflow-x-auto">
            <div className="flex space-x-1 mr-4 shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === tab.key
                      ? "bg-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Actions panel */}
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs font-mono font-bold text-zinc-500 mr-2 hidden sm:inline">
                {getFilename()}
              </span>
              
              <button 
                onClick={handleCopy}
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                title="Copy to Clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
              
              <button 
                onClick={handleDownload}
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-purple-500 dark:hover:text-purple-400 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                title={`Download ${getFilename()}`}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Generated Code Code Screen */}
          <div className="flex-1 p-4 bg-zinc-50 dark:bg-[#0c0c0e] overflow-y-auto">
            <pre className="font-mono text-sm text-blue-600 dark:text-blue-400 leading-relaxed whitespace-pre">
              {getActiveCode()}
            </pre>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
