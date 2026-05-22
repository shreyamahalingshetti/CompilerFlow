const express = require('express');
const router = express.Router();
const Lexer = require('../lexer');
const Parser = require('../parser');
const CodeGenerator = require('../codegen');
const SemanticAnalyzer = require('../semantic');
const CompilerOptimizer = require('../optimizer');
const TacGenerator = require('../tac');
const MultiLanguageGenerator = require('../multigen');

router.post('/', (req, res) => {
  try {
    const { code, generateC } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    // 1. Lexical Analysis
    const lexer = new Lexer();
    const lexResult = lexer.tokenize(code);

    if (lexResult.errors.length > 0) {
      return res.status(400).json({ valid: false, errors: lexResult.errors });
    }

    // 2. Syntax Analysis
    const parser = new Parser(lexResult.tokens);
    const parseResult = parser.parse();

    let semanticErrors = [];
    let optimizedTree = parseResult.tree;
    let optimizationLog = [];
    let tacCode = '';
    let pythonCode = '';
    let javaCode = '';
    let assemblyCode = '';
    let cCode = '';

    if (parseResult.valid) {
      // 3. Semantic Analysis
      const semanticAnalyzer = new SemanticAnalyzer(parseResult.tree);
      semanticErrors = semanticAnalyzer.analyze();

      // 4. Optimization Phase
      const optimizer = new CompilerOptimizer(parseResult.tree);
      const optResult = optimizer.optimize();
      optimizedTree = optResult.tree;
      optimizationLog = optResult.log;

      // 5. Three Address Code (TAC) Generation
      const tacGenerator = new TacGenerator(parseResult.tree);
      tacCode = tacGenerator.generate();

      // 6. Multi-language Code Generation
      const multiGen = new MultiLanguageGenerator(parseResult.tree, parseResult.variables, parseResult.symbolTable);
      pythonCode = multiGen.generatePython();
      javaCode = multiGen.generateJava();
      assemblyCode = multiGen.generateAssembly();

      // Standard C Code Generator
      const codegen = new CodeGenerator(parseResult.tree, parseResult.variables, parseResult.symbolTable);
      const cResult = codegen.generate();
      cCode = cResult.code;
    }

    // Combine all syntax and semantic errors
    const allErrors = [...parseResult.errors, ...semanticErrors];
    const overallValid = parseResult.valid && semanticErrors.length === 0;

    res.json({
      valid: overallValid,
      errors: allErrors,
      tree: parseResult.tree,
      optimizedTree: optimizedTree,
      variables: parseResult.variables,
      symbolTable: parseResult.symbolTable,
      parseSteps: parseResult.parseSteps,
      cCode: cCode,
      pythonCode: pythonCode,
      javaCode: javaCode,
      assemblyCode: assemblyCode,
      tac: tacCode,
      optimizationLog: optimizationLog
    });

  } catch (error) {
    console.error("Compile endpoint error:", error);
    res.status(500).json({ 
      valid: false, 
      errors: [{ message: `Internal Compiler Error: ${error.message}`, line: 0, col: 0 }] 
    });
  }
});

module.exports = router;
