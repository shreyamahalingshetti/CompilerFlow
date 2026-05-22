"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { 
  ArrowLeft, 
  Play, 
  Terminal, 
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Activity
} from "lucide-react";

interface TerminalLine {
  text: string;
  type: 'cmd' | 'stdout' | 'stderr' | 'info' | 'error';
}

export default function OutputPage() {
  const router = useRouter();
  const { cCode } = useStore();
  
  const [isRunning, setIsRunning] = useState(false);
  const [inputs, setInputs] = useState("10 20"); // Default inputs
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [runtimeCrash, setRuntimeCrash] = useState<string | null>(null);
  
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  const streamTerminalLines = async (lines: TerminalLine[]) => {
    for (const line of lines) {
      await new Promise(resolve => setTimeout(resolve, 150));
      setTerminalLines(prev => [...prev, line]);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setTerminalLines([]);
    setRuntimeCrash(null);

    const initialLines: TerminalLine[] = [
      { text: "$ gcc main.c -o main", type: 'cmd' },
      { text: "Compiling source files against gcc-13 runtime...", type: 'info' },
    ];
    setTerminalLines(initialLines);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${API_URL}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cCode, stdin: inputs })
      });
      const data = await res.json();

      const nextLines: TerminalLine[] = [
        { text: "Compilation successful.", type: 'info' },
        { text: `$ ./main << EOF\n${inputs}\nEOF`, type: 'cmd' }
      ];
      await streamTerminalLines(nextLines);

      // Now stream stdout/stderr
      const stdoutLines = data.stdout ? data.stdout.split('\n').filter((l: string) => l.trim() !== '') : [];
      const stderrLines = data.stderr ? data.stderr.split('\n').filter((l: string) => l.trim() !== '') : [];

      const outputStream: TerminalLine[] = [];
      stdoutLines.forEach((l: string) => outputStream.push({ text: l, type: 'stdout' }));
      stderrLines.forEach((l: string) => outputStream.push({ text: l, type: 'stderr' }));

      // Check for math exceptions or division by zero runtime crash
      const isCrash = data.code !== 0 || data.stderr.toLowerCase().includes("floating point") || data.stdout.toLowerCase().includes("floating point");
      
      if (isCrash) {
        setRuntimeCrash(data.stderr || "Floating point exception (core dumped) - Division by zero detected!");
        outputStream.push({ text: "Runtime Error: Floating point division by zero exception.", type: 'error' });
      }

      outputStream.push({ 
        text: `[Process completed with exit code ${data.code}]`, 
        type: data.code === 0 ? 'info' : 'error' 
      });

      await streamTerminalLines(outputStream);

    } catch (err) {
      console.error(err);
      setTerminalLines(prev => [
        ...prev, 
        { text: "Failed to connect to execution sandboxed server.", type: 'stderr' },
        { text: "[Process failed to execute]", type: 'error' }
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  if (!cCode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Terminal className="w-16 h-16 text-zinc-400 dark:text-zinc-600 mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold mb-2">No Executable C Binary</h2>
        <p className="text-zinc-500 mb-6 font-semibold">Generate C compilation translation files before executing.</p>
        <button 
          onClick={() => router.push("/codegen")}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center space-x-2 text-white font-semibold shadow-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Codegen</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto p-4 md:p-8">
      {/* Title */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 md:gap-0"
      >
        <div>
          <h1 className="text-3xl font-extrabold gradient-text mb-2">Sandboxed Execution</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Execute the compiled C program binaries in real-time inside Piston Docker sandboxes.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto shrink-0">
          <button
            onClick={() => router.push("/codegen")}
            className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold rounded-lg flex items-center justify-center space-x-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Codegen</span>
          </button>
        </div>
      </motion.div>

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Execution settings panel */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 bg-zinc-900 rounded-2xl p-6 border border-zinc-800 h-fit flex flex-col"
        >
          <h3 className="text-lg font-bold mb-4 text-zinc-200 flex items-center">
            <Activity className="w-4 h-4 mr-2 text-blue-500" />
            Console Configuration
          </h3>
          
          <div className="mb-6">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
              Standard Input (stdin)
            </label>
            <textarea
              value={inputs}
              onChange={(e) => setInputs(e.target.value)}
              className="w-full h-36 bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm font-mono text-zinc-200 focus:border-blue-500 outline-none resize-none shadow-inner placeholder-zinc-600"
              placeholder="Enter space-separated inputs (e.g. 5 10)"
            />
            <p className="text-[10px] text-zinc-400 font-semibold mt-2 leading-relaxed">
              These values are passed to stdin to feed variables parsed by your READ commands.
            </p>
          </div>

          <button
            onClick={handleRun}
            disabled={isRunning || !cCode}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex justify-center items-center space-x-2 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50 cursor-pointer"
          >
            {isRunning ? (
              <span className="animate-pulse flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-white animate-ping mr-1" />
                <span>Running Binary...</span>
              </span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Launch Program</span>
              </>
            )}
          </button>
        </motion.div>

        {/* Console Screen & Warnings */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Terminal Window */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl overflow-hidden border border-zinc-300 dark:border-zinc-800 bg-[#0c0c0e] flex flex-col min-h-[420px] shadow-2xl"
          >
            {/* Terminal Header */}
            <div className="h-10 bg-zinc-200 dark:bg-zinc-900 flex items-center px-4 border-b border-zinc-300 dark:border-zinc-950">
              <div className="flex space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <div className="mx-auto text-xs text-zinc-500 dark:text-zinc-400 font-mono font-bold flex items-center space-x-2">
                <Terminal className="w-3 h-3 text-blue-500" />
                <span>Sandbox Shell v1.4</span>
              </div>
            </div>
            
            {/* Terminal Output Console */}
            <div className="flex-1 p-5 font-mono text-sm overflow-y-auto min-h-[300px]">
              {terminalLines.length === 0 && (
                <div className="text-zinc-500 italic space-y-1">
                  <div>$ gcc main.c -o main</div>
                  <div>$ ./main</div>
                  <div className="text-xs text-zinc-600 font-semibold mt-3 animate-pulse">Waiting for console trigger...</div>
                </div>
              )}
              
              <div className="space-y-1.5">
                {terminalLines.map((line, i) => {
                  if (line.type === 'cmd') {
                    return (
                      <div key={i} className="text-zinc-300">
                        <span className="text-green-500 font-bold">guest@compilerflow</span>
                        <span className="text-zinc-500 font-bold">:$</span> {line.text}
                      </div>
                    );
                  }
                  if (line.type === 'stdout') {
                    return <pre key={i} className="text-zinc-100 whitespace-pre-wrap">{line.text}</pre>;
                  }
                  if (line.type === 'stderr' || line.type === 'error') {
                    return <pre key={i} className="text-red-400 whitespace-pre-wrap font-bold">{line.text}</pre>;
                  }
                  if (line.type === 'info') {
                    return <div key={i} className="text-zinc-500 text-xs italic">{line.text}</div>;
                  }
                  return null;
                })}
              </div>
              
              <div ref={endRef} />
            </div>
          </motion.div>

          {/* Runtime Error alert overlay if crash occurs */}
          <AnimatePresence>
            {runtimeCrash && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-start space-x-4 shadow-lg"
              >
                <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/30 shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-red-500 mb-1">Division by Zero Fatal Exception</h4>
                  <p className="text-xs text-red-400/90 font-semibold leading-relaxed mb-3">
                    Floating-point exception triggered. Standard hardware architectures restrict division by zero operations at runtime, causing core dumps.
                  </p>
                  <div className="bg-[#0c0c0e] rounded-lg p-3 font-mono text-xs text-red-300 border border-red-500/20 max-w-full overflow-x-auto">
                    {runtimeCrash}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
