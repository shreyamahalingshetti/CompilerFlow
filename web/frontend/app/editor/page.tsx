"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import Editor from "@monaco-editor/react";

const EXAMPLES = {
  "Sum of Numbers": `START
INT a
INT b
INT sum
READ a,b
sum = a + b
PRINT sum
STOP
`,
  "Factorial Checker": `START
INT n
INT fact
INT i
READ n
fact = 1
FOR i = 1 TO n
  fact = fact * i
ENDFOR
PRINT fact
STOP
`,
  "Prime Checker": `START
INT n
INT isPrime
INT i
READ n
isPrime = 1
IF n <= 1 THEN
  isPrime = 0
ELSE
  FOR i = 2 TO 5
    IF n / i * i == n THEN
      isPrime = 0
    ENDIF
  ENDFOR
ENDIF
PRINT isPrime
STOP
`,
  "Array Operations": `START
ARRAY numbers[10]
INT index
INT temp
index = 0
numbers[index] = 42
temp = numbers[index]
PRINT temp
STOP
`,
  "Recursive Fibonacci": `START
FUNCTION fib(n)
  IF n <= 1 THEN
    RETURN n
  ENDIF
  RETURN fib(n - 1) + fib(n - 2)
ENDFUNCTION
PRINT fib(5)
STOP
`
};

export default function EditorPage() {
  const router = useRouter();
  const { 
    code, 
    setCode, 
    tokens, 
    setTokens, 
    lexErrors, 
    setLexErrors, 
    parseErrors, 
    setParseErrors,
    setParseTree,
    setOptimizedTree,
    setVariables,
    setSymbolTable,
    setCCode,
    setPythonCode,
    setJavaCode,
    setAssemblyCode,
    setTac,
    setOptimizationLog,
    setParseSteps,
    theme
  } = useStore();

  const [isCompiling, setIsCompiling] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [monacoInstance, setMonacoInstance] = useState<any>(null);
  const [decorations, setDecorations] = useState<string[]>([]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) setCode(value);
  };

  const loadExample = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value as keyof typeof EXAMPLES;
    if (EXAMPLES[key]) setCode(EXAMPLES[key]);
  };

  // beforeMount: register language + themes BEFORE the editor first renders
  // This ensures custom theme names are valid when Monaco initializes
  const handleEditorWillMount = (monaco: any) => {
    // Register pseudocode language
    monaco.languages.register({ id: 'pseudocode' });

    monaco.languages.setMonarchTokensProvider('pseudocode', {
      keywords: [
        'START', 'STOP', 'READ', 'PRINT', 'IF', 'THEN', 'ELSE', 'ENDIF',
        'WHILE', 'DO', 'ENDWHILE', 'FOR', 'TO', 'ENDFOR', 'SWITCH', 'CASE',
        'DEFAULT', 'ENDSWITCH', 'BREAK', 'REPEAT', 'UNTIL', 'FUNCTION',
        'ENDFUNCTION', 'RETURN', 'INT', 'FLOAT', 'CHAR', 'STRING', 'DOUBLE', 'LONG', 'ARRAY'
      ],
      operators: [
        '=', '==', '!=', '>', '<', '>=', '<=', '+', '-', '*', '/'
      ],
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier'
            }
          }],
          [/[{}()\[\]]/, 'brackets'],
          [/[=><|+\-*/^~]+/, {
            cases: {
              '@operators': 'operator',
              '@default': ''
            }
          }],
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
          [/\d+/, 'number'],
          [/"([^"\\]|\\.)*"/, 'string'],
        ]
      }
    });

    // Define themes before editor renders so the theme prop resolves correctly
    monaco.editor.defineTheme('compilerflow-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '60a5fa', fontStyle: 'bold' },
        { token: 'operator', foreground: 'f97316' },
        { token: 'identifier', foreground: 'fafafa' },
        { token: 'number', foreground: 'a78bfa' },
        { token: 'string', foreground: '34d399' }
      ],
      colors: {
        'editor.background': '#18181b',
        'editor.foreground': '#fafafa'
      }
    });

    monaco.editor.defineTheme('compilerflow-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '2563eb', fontStyle: 'bold' },
        { token: 'operator', foreground: 'ea580c' },
        { token: 'identifier', foreground: '09090b' },
        { token: 'number', foreground: '7c3aed' },
        { token: 'string', foreground: '059669' }
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#09090b'
      }
    });
  };

  // onMount: only save editor/monaco instances for decoration usage
  const handleEditorDidMount = (editor: any, monaco: any) => {
    setEditorInstance(editor);
    setMonacoInstance(monaco);
  };

  // Compile and Parse entire pipeline at once
  const handleCompile = async () => {
    setIsCompiling(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      // First fetch standard lexical tokens
      const lexRes = await fetch(`${API_URL}/api/tokenize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const lexData = await lexRes.json();
      setTokens(lexData.tokens);
      setLexErrors(lexData.errors);

      if (lexData.errors.length > 0) {
        setParseErrors([]);
        setIsCompiling(false);
        return;
      }

      // Next run parser route (which triggers AST, semantic analyzer, optimizer, TAC, multigen)
      const parseRes = await fetch(`${API_URL}/api/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const parseData = await parseRes.json();

      setParseErrors(parseData.errors || []);
      setParseTree(parseData.tree);
      setOptimizedTree(parseData.optimizedTree);
      setVariables(parseData.variables || []);
      setSymbolTable(parseData.symbolTable || {});
      setCCode(parseData.cCode || '');
      setPythonCode(parseData.pythonCode || '');
      setJavaCode(parseData.javaCode || '');
      setAssemblyCode(parseData.assemblyCode || '');
      setTac(parseData.tac || '');
      setOptimizationLog(parseData.optimizationLog || []);
      setParseSteps(parseData.parseSteps || []);

      // If valid, jump to Lexer to visualize the results!
      router.push("/lexer");
    } catch (err) {
      console.error("Compilation failed", err);
      alert("Failed to connect to backend compiler server.");
    } finally {
      setIsCompiling(false);
    }
  };

  // Dynamically draw red highlights on code error lines
  useEffect(() => {
    if (!editorInstance || !monacoInstance) return;

    const allErrors = [...lexErrors, ...parseErrors];
    const newDecorations = allErrors
      .filter(err => err.line && err.line > 0)
      .map(err => ({
        range: new monacoInstance.Range(err.line, 1, err.line, 100),
        options: {
          isWholeLine: true,
          className: 'bg-red-500/10 dark:bg-red-500/5 border-l-4 border-red-500',
          glyphMarginClassName: 'bg-red-500 rounded-full w-2 h-2 ml-1 mt-1.5'
        }
      }));

    const decorIds = editorInstance.deltaDecorations(decorations, newDecorations);
    setDecorations(decorIds);
  }, [lexErrors, parseErrors, editorInstance, monacoInstance]);

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 md:gap-0"
      >
        <div>
          <h1 className="text-3xl font-extrabold gradient-text mb-2">Pseudo-code Editor</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Write high-level pseudo-code, run semantic audits, fold constants, and translate languages.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto shrink-0">
          <select 
            onChange={loadExample}
            defaultValue=""
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-blue-500 appearance-none w-full sm:w-auto text-sm font-semibold cursor-pointer shadow-sm"
          >
            <option value="" disabled>Load Example Program...</option>
            {Object.keys(EXAMPLES).map(ex => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
          
          <button
            onClick={handleCompile}
            disabled={isCompiling || !code.trim()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium rounded-lg flex items-center justify-center space-x-2 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto cursor-pointer"
          >
            {isCompiling ? (
              <span className="animate-pulse flex items-center space-x-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Compiling Pipeline...</span>
              </span>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Compile & Run</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Editor Panel */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 border border-zinc-300 dark:border-zinc-800 rounded-xl glass shadow-2xl relative flex flex-col"
        style={{ minHeight: '640px' }}
      >
        <div className="h-12 bg-zinc-100/90 dark:bg-zinc-900/80 border-b border-zinc-300 dark:border-zinc-800 flex items-center px-4 justify-between rounded-t-xl">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="ml-4 text-xs font-semibold text-zinc-500 font-mono">algorithm.txt</span>
          </div>
          {(lexErrors.length > 0 || parseErrors.length > 0) && (
            <span className="text-xs font-semibold text-red-500 animate-pulse bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
              Compilation Error Detected
            </span>
          )}
        </div>
        
        <div className="flex-1 rounded-b-xl overflow-hidden" style={{ minHeight: '590px' }}>
          <Editor
            height="590px"
            defaultLanguage="pseudocode"
            value={code}
            onChange={handleEditorChange}
            beforeMount={handleEditorWillMount}
            onMount={handleEditorDidMount}
            theme={theme === 'dark' ? 'compilerflow-dark' : 'compilerflow-light'}
            options={{
              glyphMargin: true,
              fontSize: 15,
              fontFamily: 'Consolas, Fira Code, monospace',
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto'
              },
              tabSize: 2,
              wordWrap: 'on',
              automaticLayout: true
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
