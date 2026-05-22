"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RefreshCw,
  Cpu,
  BrainCircuit,
  Database
} from "lucide-react";

const CFG_RULES = [
  "Program → START Declarations Statements STOP",
  "Declarations → Declaration Declarations | ε",
  "Declaration → DataType ID | ARRAY ID [ NUMBER ]",
  "DataType → INT | FLOAT | CHAR | STRING | DOUBLE | LONG",
  "Statements → Statement Statements | ε",
  "Statement → READ idList",
  "Statement → PRINT expr",
  "Statement → ID = expr | ArrayIndex = expr",
  "Statement → IF condition THEN Statements [ELSE Statements] ENDIF",
  "Statement → FOR ID = expr TO expr Statements ENDFOR",
  "Statement → WHILE condition DO Statements ENDWHILE",
  "Statement → SWITCH (expr) Cases ENDSWITCH",
  "Statement → REPEAT Statements UNTIL condition",
  "Statement → FUNCTION ID ( params ) Statements ENDFUNCTION",
  "Statement → RETURN expr",
  "Cases → Case Cases | DefaultCase | ε",
  "Case → CASE expr : Statements [BREAK]",
  "DefaultCase → DEFAULT : Statements",
  "condition → expr (==|!=|>|<|>=|<=) expr",
  "expr → term ((+|-) term)*",
  "term → factor ((*|/) factor)*",
  "factor → ID | ArrayIndex | NUMBER | ( expr )",
  "ArrayIndex → ID [ expr ]",
];

export default function ParserPage() {
  const router = useRouter();
  const { 
    parseTree, 
    parseErrors, 
    variables, 
    symbolTable, 
    parseSteps 
  } = useStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Playback timer for the step simulator
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= parseSteps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 900);
    }
    return () => clearInterval(interval);
  }, [isPlaying, parseSteps]);

  const handleNext = () => {
    router.push("/tree");
  };

  const stepForward = () => {
    if (currentStep < parseSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const stepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetSimulation = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const hasData = parseTree !== null || parseErrors.length > 0;

  if (!hasData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <FileText className="w-16 h-16 text-zinc-400 dark:text-zinc-600 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold mb-2">No AST or Parsing Data Found</h2>
        <p className="text-zinc-500 mb-6">Write pseudo-code inside the editor and compile first.</p>
        <button 
          onClick={() => router.push("/editor")}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center space-x-2 text-white font-semibold shadow-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Editor</span>
        </button>
      </div>
    );
  }

  const isValid = parseErrors.length === 0;

  // AI Smart Suggestion logic based on exact errors
  const getAISuggestion = (errMessage: string) => {
    const msg = errMessage.toLowerCase();
    if (msg.includes("expected then")) {
      return "Did you forget to add 'THEN' after your conditional statement? In CompilerFlow grammar, 'IF' expressions require 'THEN' to proceed.";
    }
    if (msg.includes("not declared")) {
      return "Variable is missing from the Declarations section. Declare it at the top of your program (e.g., 'INT variableName') before assigning values.";
    }
    if (msg.includes("duplicate declaration")) {
      return "You're declaring the same variable name twice. Keep a single unique definition per scope to avoid namespace collision.";
    }
    if (msg.includes("division by zero")) {
      return "Division by zero detected! The compiler analyzer flags literal divisions by zero at compile-time to prevent runtime hardware crashes.";
    }
    if (msg.includes("type mismatch")) {
      return "Type mismatch! Avoid assigning a string literal to an integer variable, or vice versa, to preserve strict data typing.";
    }
    return "Check your program grammar and braces. Every block (IF, WHILE, FOR, FUNCTION) must be fully closed with its matching terminal (ENDIF, ENDWHILE, ENDFOR, ENDFUNCTION).";
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 md:p-8">
      {/* Page Title */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 md:gap-0"
      >
        <div>
          <h1 className="text-3xl font-extrabold gradient-text mb-2">Syntax & Semantic Analysis</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Auditing grammar rules, compiling the symbol table, and simulating parser transitions.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto shrink-0">
          <button
            onClick={() => router.push("/editor")}
            className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold rounded-lg flex items-center justify-center space-x-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Editor</span>
          </button>
          
          <button
            onClick={handleNext}
            disabled={!isValid}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto cursor-pointer"
          >
            <span>View Parse Tree</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Grid of Status & Symbol Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Status Card & AI Suggestions */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-6 rounded-2xl border flex flex-col justify-between ${
            isValid 
              ? "glass border-green-500/30 bg-green-500/5 shadow-[0_0_30px_rgba(34,197,94,0.05)]" 
              : "glass border-red-500/30 bg-red-500/5 shadow-[0_0_30px_rgba(239,68,68,0.05)]"
          }`}
        >
          <div>
            <div className="flex items-center space-x-3 mb-4">
              {isValid ? (
                <>
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                  <div>
                    <h2 className="text-xl font-bold text-green-500">Syntax & Semantics Valid</h2>
                    <span className="text-xs text-green-500/70 font-semibold">0 Errors Found</span>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-10 h-10 text-red-500" />
                  <div>
                    <h2 className="text-xl font-bold text-red-500">Validation Failures</h2>
                    <span className="text-xs text-red-500/70 font-semibold">{parseErrors.length} Errors Found</span>
                  </div>
                </>
              )}
            </div>

            {!isValid && (
              <div className="space-y-3">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-600 dark:text-red-300 text-sm font-mono max-h-[140px] overflow-y-auto">
                  {parseErrors.map((err, i) => (
                    <div key={i} className="mb-1.5 last:mb-0">
                      • Line {err.line || "?"}: {err.message}
                    </div>
                  ))}
                </div>
                
                {/* AI Smart Suggestion */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start space-x-3">
                  <BrainCircuit className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-wider block mb-1">AI Compiler Suggestion</span>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-semibold">
                      {getAISuggestion(parseErrors[0]?.message || "")}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {isValid && (
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                The pseudo-code matches the Context-Free Grammar (CFG) specification perfectly. Type systems and identifiers checked out safely without conflict.
              </p>
            )}
          </div>

          {isValid && (
            <div className="mt-4 flex items-center space-x-2 text-xs font-semibold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20 w-max">
              <span>All compiler assertions checked successfully</span>
            </div>
          )}
        </motion.div>

        {/* Symbol Table Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 glass rounded-2xl p-6 border border-zinc-300 dark:border-zinc-800 flex flex-col"
        >
          <h3 className="text-lg font-bold mb-4 flex items-center text-zinc-800 dark:text-zinc-100">
            <Database className="w-5 h-5 text-blue-500 mr-2" />
            Symbol Table (Declared Identifiers & Scopes)
          </h3>
          
          <div className="flex-1 overflow-x-auto">
            {Object.keys(symbolTable).length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500 text-sm italic font-semibold">
                No variables or arrays declared.
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-300 dark:border-zinc-800 text-zinc-500 font-semibold">
                    <th className="py-2.5">Identifier</th>
                    <th className="py-2.5">Data Type</th>
                    <th className="py-2.5">Compiler Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50 font-mono text-zinc-700 dark:text-zinc-300">
                  {Object.entries(symbolTable).map(([name, type]) => {
                    let typeDisplay = type;
                    let scope = 'global';

                    if (type.startsWith('array:')) {
                      typeDisplay = `int array[${type.split(':')[1]}]`;
                    }
                    
                    return (
                      <tr key={name} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="py-2.5 font-bold text-blue-500 dark:text-blue-400">{name}</td>
                        <td className="py-2.5 text-purple-500 dark:text-purple-400">{typeDisplay}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-semibold rounded-md border border-zinc-300 dark:border-zinc-700/50">
                            {scope}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>

      {/* Parse Steps Trace Simulator */}
      {isValid && parseSteps.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl border border-zinc-300 dark:border-zinc-800 p-6 mb-8 flex flex-col"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-300 dark:border-zinc-800 pb-4 mb-6 gap-4 sm:gap-0">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Cpu className="w-5 h-5 text-blue-500 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">Step-by-Step Parse Simulator</h3>
                <p className="text-xs text-zinc-500 font-semibold">Animate compiler transitions matching tokens against grammar rules.</p>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <button 
                onClick={resetSimulation}
                className="p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors shadow-sm cursor-pointer"
                title="Reset Simulation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button 
                onClick={stepBackward}
                disabled={currentStep === 0}
                className="p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors shadow-sm disabled:opacity-40 cursor-pointer"
                title="Previous step"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-2 rounded-lg text-white font-semibold shadow-sm transition-all cursor-pointer ${
                  isPlaying ? 'bg-orange-500 hover:bg-orange-600 shadow-[0_0_12px_rgba(249,115,22,0.4)]' : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                }`}
                title={isPlaying ? "Pause animation" : "Play step-by-step"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button 
                onClick={stepForward}
                disabled={currentStep === parseSteps.length - 1}
                className="p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors shadow-sm disabled:opacity-40 cursor-pointer"
                title="Next step"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              
              <span className="text-sm font-bold font-mono text-zinc-500 ml-2">
                {currentStep + 1} / {parseSteps.length}
              </span>
            </div>
          </div>

          {/* Simulator Console Screen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-950 rounded-xl p-6 border border-zinc-800 font-mono text-sm">
            
            {/* Step 1: Active Token */}
            <div className="flex flex-col border-b md:border-b-0 md:border-r border-zinc-800 pb-4 md:pb-0 md:pr-6">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Parsed Lexeme</span>
              <div className="flex-1 flex items-center justify-center flex-col">
                <motion.div 
                  key={currentStep}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="px-6 py-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-center shadow-[0_0_15px_rgba(59,130,246,0.1)] w-full"
                >
                  <span className="text-xs text-blue-500 font-bold block mb-1">CURRENT TOKEN</span>
                  <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 block tracking-wide">
                    {parseSteps[currentStep]?.token}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-2 block">
                    Line {parseSteps[currentStep]?.line || "?"}, Col {parseSteps[currentStep]?.col || "?"}
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Step 2: Matched Rule */}
            <div className="flex flex-col border-b md:border-b-0 md:border-r border-zinc-800 py-4 md:py-0 md:px-6">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Reduction Rule</span>
              <div className="flex-1 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentStep}
                    initial={{ x: 10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -10, opacity: 0 }}
                    className="p-4 bg-zinc-900 border border-zinc-700 rounded-xl w-full text-center"
                  >
                    <span className="text-xs text-zinc-400 font-bold block mb-2">CFG REDUCTION</span>
                    <span className="text-sm font-semibold text-zinc-100 break-words leading-relaxed">
                      {parseSteps[currentStep]?.rule}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Step 3: Active Parser Stack */}
            <div className="flex flex-col pt-4 md:pt-0 md:pl-6">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Parser Stack</span>
              <div className="flex-1 flex flex-col justify-end space-y-1.5">
                {parseSteps[currentStep]?.stack?.map((item: string, i: number) => (
                  <motion.div 
                    key={`${i}-${item}`}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="px-3 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-semibold flex items-center justify-between"
                  >
                    <span>{item}</span>
                    <span className="text-[10px] text-indigo-500 font-bold">[{i}]</span>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      )}

      {/* CFG Reference rules */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/50 flex-1 flex flex-col"
      >
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900">
          <h3 className="font-bold text-zinc-200">Context Free Grammar (CFG) Specifications Reference</h3>
        </div>
        <div className="p-6 overflow-y-auto font-mono text-sm text-zinc-300 bg-zinc-950/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {CFG_RULES.map((rule, i) => {
              const parts = rule.split('→');
              return (
                <div key={i} className="flex hover:bg-zinc-800/40 px-2 py-1 rounded transition-colors border border-transparent hover:border-zinc-700">
                  <span className="text-purple-400 w-32 shrink-0">{parts[0].trim()}</span>
                  <span className="text-zinc-500 mx-2">→</span>
                  <span className="text-blue-300 truncate">{parts[1]?.trim()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
