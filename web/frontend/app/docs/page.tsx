"use client";

import { 
  Book, 
  CheckCircle2, 
  Code2, 
  Settings, 
  Cpu, 
  BookOpen, 
  Zap, 
  Info, 
  ShieldCheck,
  Binary
} from "lucide-react";
import { motion as motionFramer } from "framer-motion";

export default function DocsPage() {
  const phases = [
    {
      title: "1. Lexical Analysis (Lexer)",
      desc: "Converts raw characters of pseudo-code into a flat stream of tokens based on pre-defined regex rules. Keywords (START, STOP, IF), datatypes (INT, FLOAT), identifiers, and operators are segmented and marked with line and column references."
    },
    {
      title: "2. Syntax Analysis (Parser)",
      desc: "Constructs a concrete parse tree by validating the tokens against a set of context-free-grammar (CFG) rules using a recursive-descent parser. Emits an Abstract Syntax Tree (AST)."
    },
    {
      title: "3. Semantic Analysis",
      desc: "Validates AST node definitions against compiler semantics: audits undeclared identifiers, duplicate declarations within the same scope, type compatibility on assignment, and compile-time division by zero assertions."
    },
    {
      title: "4. Intermediate Code Generation (TAC)",
      desc: "Linearizes complex nested binary expressions and control flows into standardized Three Address Code (TAC). Enables target-independent compilation steps."
    },
    {
      title: "5. Code Optimization",
      desc: "Applies compile-time performance tweaks on the AST representation. Includes recursive 'Constant Folding' (reducing 5+3 into 8) and 'Dead Code Elimination' (removing blocks hidden behind constantly false conditions)."
    },
    {
      title: "6. Code Generation & Execution",
      desc: "Emits target code. Translates the AST structure into standard C, Python 3, Java Class, or low-level Intel x86 Assembly, then runs the generated code inside a sandboxed Linux kernel container."
    }
  ];

  return (
    <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-4 md:p-8 pb-24">
      {/* Title */}
      <motionFramer.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-extrabold gradient-text mb-4">CompilerFlow Academy</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Learn how compilers work under the hood – from lexical analysis to machine code execution.
        </p>
      </motionFramer.div>

      <div className="space-y-10">
        
        {/* Compiler Lifecycle Tutorial */}
        <motionFramer.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-6 md:p-8 border border-zinc-300 dark:border-zinc-800"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Cpu className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">1. The Compiler Lifecycle</h2>
          </div>
          
          <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6">
            A compiler translates a high-level language into machine code in several sequential, highly structured phases. In CompilerFlow, these stages are fully animated and visualized step-by-step.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {phases.map((ph, idx) => (
              <div key={idx} className="bg-zinc-100 dark:bg-zinc-900/50 p-5 rounded-xl border border-zinc-300 dark:border-zinc-800">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm mb-2">{ph.title}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">{ph.desc}</p>
              </div>
            ))}
          </div>
        </motionFramer.section>

        {/* Semantic Checks and Optimizations */}
        <motionFramer.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-6 md:p-8 border border-zinc-300 dark:border-zinc-800"
        >
          <div className="flex items-center space-x-3 mb-6">
            <ShieldCheck className="w-6 h-6 text-green-500" />
            <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">2. Semantic Checks & Optimizations</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-md font-bold text-zinc-800 dark:text-zinc-200 flex items-center">
                <Info className="w-4 h-4 mr-2 text-indigo-500" />
                Semantic Audit Rules
              </h3>
              <ul className="space-y-2 text-xs font-semibold text-zinc-500 leading-normal list-disc pl-4">
                <li><strong className="text-zinc-700 dark:text-zinc-300">Undeclared Variables:</strong> Using a variable (e.g. `PRINT x`) without declaring it at the start triggers a compile error.</li>
                <li><strong className="text-zinc-700 dark:text-zinc-300">Duplicate declarations:</strong> Declaring a variable twice inside the global or local scope is rejected.</li>
                <li><strong className="text-zinc-700 dark:text-zinc-300">Type Mismatches:</strong> Assigning a String literal to a declared Integer datatype triggers a mismatch error.</li>
                <li><strong className="text-zinc-700 dark:text-zinc-300">Division by Zero:</strong> Compile-time literal divisions by zero are immediately intercepted to prevent processor crashes.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-bold text-zinc-800 dark:text-zinc-200 flex items-center">
                <Zap className="w-4 h-4 mr-2 text-orange-500" />
                AST Optimization Rules
              </h3>
              
              <div className="space-y-3 font-mono text-[11px]">
                <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-300 dark:border-zinc-800">
                  <span className="text-orange-500 font-bold block mb-1"># Constant Folding</span>
                  <span className="text-zinc-400 block mb-1">Before: x = 5 + 3 * 2</span>
                  <span className="text-zinc-200 block">After: x = 11</span>
                </div>

                <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-300 dark:border-zinc-800">
                  <span className="text-purple-500 font-bold block mb-1"># Dead Code Elimination</span>
                  <span className="text-zinc-400 block mb-1">Before: IF 5 == 6 THEN PRINT a ENDIF</span>
                  <span className="text-zinc-200 block">After: (Block completely removed)</span>
                </div>
              </div>
            </div>
          </div>
        </motionFramer.section>

        {/* CFG Rules */}
        <motionFramer.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-6 md:p-8 border border-zinc-300 dark:border-zinc-800"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Code2 className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">3. Context-Free Grammar (CFG)</h2>
          </div>
          
          <div className="bg-zinc-50 dark:bg-[#09090b] p-6 rounded-xl border border-zinc-300 dark:border-zinc-800 font-mono text-xs overflow-x-auto">
            <pre className="text-zinc-700 dark:text-zinc-300 leading-loose">
<span className="text-purple-600 dark:text-purple-400">Program</span>       → START Declarations Statements STOP
<span className="text-purple-600 dark:text-purple-400">Declarations</span>  → Declaration Declarations | ε
<span className="text-purple-600 dark:text-purple-400">Declaration</span>   → DataType ID | ARRAY ID [ NUMBER ]
<span className="text-purple-600 dark:text-purple-400">DataType</span>      → INT | FLOAT | CHAR | STRING | DOUBLE | LONG
<span className="text-purple-600 dark:text-purple-400">Statements</span>    → Statement Statements | ε
<span className="text-purple-600 dark:text-purple-400">Statement</span>     → READ idList | PRINT expr | ID = expr | ArrayIndex = expr
              | IF condition THEN Statements [ELSE Statements] ENDIF
              | FOR ID = expr TO expr Statements ENDFOR
              | WHILE condition DO Statements ENDWHILE
              | SWITCH (expr) Cases ENDSWITCH
              | REPEAT Statements UNTIL condition
              | FUNCTION ID ( params ) Statements ENDFUNCTION
              | RETURN expr
<span className="text-purple-600 dark:text-purple-400">condition</span>     → expr (==|!=|&gt;|&lt;|&gt;=|&lt;=) expr
<span className="text-purple-600 dark:text-purple-400">expr</span>          → term ((+ | -) term)*
<span className="text-purple-600 dark:text-purple-400">term</span>          → factor ((* | /) factor)*
<span className="text-purple-600 dark:text-purple-400">factor</span>        → ID | ArrayIndex | NUMBER | STRING | FunctionCall | ( expr )
            </pre>
          </div>
        </motionFramer.section>
        
        {/* Technologies Used */}
        <motionFramer.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-6 md:p-8 border border-zinc-300 dark:border-zinc-800"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Settings className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">4. Technologies & Frameworks</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-100 dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-300 dark:border-zinc-800">
              <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm mb-3">Frontend Architecture</h3>
              <ul className="space-y-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 leading-normal">
                <li><strong className="text-zinc-700 dark:text-zinc-300">Framework:</strong> Next.js 16 (App Router), React</li>
                <li><strong className="text-zinc-700 dark:text-zinc-300">Design System:</strong> Tailwind CSS & CSS Variables</li>
                <li><strong className="text-zinc-700 dark:text-zinc-300">Source Editor:</strong> Monaco Editor (Tokenizers, Themes)</li>
                <li><strong className="text-zinc-700 dark:text-zinc-300">AST Diagramming:</strong> ReactFlow canvas with Vector jsPDF</li>
              </ul>
            </div>
            
            <div className="bg-zinc-100 dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-300 dark:border-zinc-800">
              <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm mb-3">Backend Architecture</h3>
              <ul className="space-y-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 leading-normal">
                <li><strong className="text-zinc-700 dark:text-zinc-300">Web Server:</strong> Node.js, Express</li>
                <li><strong className="text-zinc-700 dark:text-zinc-300">Compilation pipeline:</strong> Custom Lexer & Recursive-descent parser</li>
                <li><strong className="text-zinc-700 dark:text-zinc-300">Intermediate:</strong> Semantic checks, Folding, TAC linear Quadruples</li>
                <li><strong className="text-zinc-700 dark:text-zinc-300">Exec environment:</strong> Sandboxed Linux shell utilizing Piston engine</li>
              </ul>
            </div>
          </div>
        </motionFramer.section>
      </div>
    </div>
  );
}
