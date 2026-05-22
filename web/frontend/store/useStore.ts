import { create } from 'zustand';

interface StoreState {
  code: string;
  setCode: (code: string) => void;
  tokens: any[];
  setTokens: (tokens: any[]) => void;
  lexErrors: any[];
  setLexErrors: (errors: any[]) => void;
  parseTree: any;
  setParseTree: (tree: any) => void;
  optimizedTree: any;
  setOptimizedTree: (tree: any) => void;
  parseErrors: any[];
  setParseErrors: (errors: any[]) => void;
  variables: string[];
  setVariables: (vars: string[]) => void;
  symbolTable: Record<string, string>;
  setSymbolTable: (table: Record<string, string>) => void;
  
  // New compiler phase variables
  cCode: string;
  setCCode: (code: string) => void;
  pythonCode: string;
  setPythonCode: (code: string) => void;
  javaCode: string;
  setJavaCode: (code: string) => void;
  assemblyCode: string;
  setAssemblyCode: (code: string) => void;
  tac: string;
  setTac: (tac: string) => void;
  optimizationLog: string[];
  setOptimizationLog: (log: string[]) => void;
  parseSteps: any[];
  setParseSteps: (steps: any[]) => void;
  
  // App settings
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  targetLanguage: 'c' | 'python' | 'java' | 'assembly';
  setTargetLanguage: (lang: 'c' | 'python' | 'java' | 'assembly') => void;
}

export const useStore = create<StoreState>((set) => ({
  code: 'START\nINT x\nINT y\nINT sum\n\nREAD x,y\nsum = x + y\nPRINT sum\nSTOP\n',
  setCode: (code) => set({ code }),
  tokens: [],
  setTokens: (tokens) => set({ tokens }),
  lexErrors: [],
  setLexErrors: (lexErrors) => set({ lexErrors }),
  parseTree: null,
  setParseTree: (parseTree) => set({ parseTree }),
  optimizedTree: null,
  setOptimizedTree: (optimizedTree) => set({ optimizedTree }),
  parseErrors: [],
  setParseErrors: (parseErrors) => set({ parseErrors }),
  variables: [],
  setVariables: (variables) => set({ variables }),
  symbolTable: {},
  setSymbolTable: (symbolTable) => set({ symbolTable }),
  
  cCode: '',
  setCCode: (cCode) => set({ cCode }),
  pythonCode: '',
  setPythonCode: (pythonCode) => set({ pythonCode }),
  javaCode: '',
  setJavaCode: (javaCode) => set({ javaCode }),
  assemblyCode: '',
  setAssemblyCode: (assemblyCode) => set({ assemblyCode }),
  tac: '',
  setTac: (tac) => set({ tac }),
  optimizationLog: [],
  setOptimizationLog: (optimizationLog) => set({ optimizationLog }),
  parseSteps: [],
  setParseSteps: (parseSteps) => set({ parseSteps }),
  
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  targetLanguage: 'c',
  setTargetLanguage: (targetLanguage) => set({ targetLanguage }),
}));
