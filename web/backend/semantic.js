class SemanticAnalyzer {
  constructor(tree) {
    this.tree = tree;
    this.errors = [];
    this.symbolTable = new Map(); // name -> { type, scope, line, col }
    this.functions = new Map();   // name -> { params: [], line, col }
    this.currentFunction = null;
  }

  analyze() {
    if (!this.tree || this.tree.type !== 'Program') {
      return this.errors;
    }

    // Step 1: Collect declarations (global variables and arrays)
    const declsNode = this.tree.children.find(c => c.type === 'Declarations');
    if (declsNode) {
      this.visitDeclarations(declsNode);
    }

    // Step 2: Pre-scan functions to populate function signatures
    const stmtsNode = this.tree.children.find(c => c.type === 'Statements');
    if (stmtsNode) {
      this.collectFunctions(stmtsNode);
    }

    // Step 3: Analyze statements
    if (stmtsNode) {
      this.visitStatements(stmtsNode);
    }

    return this.errors;
  }

  error(message, node = null) {
    this.errors.push({
      message,
      line: node && node.line ? node.line : 0,
      col: node && node.col ? node.col : 0
    });
  }

  visitDeclarations(node) {
    for (const decl of node.children) {
      if (decl.type === 'Declaration') {
        const typeNode = decl.children[0];
        const idNode = decl.children[1];
        const name = idNode.value;
        const type = typeNode.value.toLowerCase();

        if (this.symbolTable.has(name)) {
          this.error(`Semantic Error: Duplicate declaration of variable '${name}'`, idNode);
        } else {
          this.symbolTable.set(name, {
            type,
            scope: 'global',
            line: idNode.line,
            col: idNode.col
          });
        }
      } else if (decl.type === 'ArrayDeclaration') {
        const idNode = decl.children[1];
        const sizeNode = decl.children[2];
        const name = idNode.value;

        if (this.symbolTable.has(name)) {
          this.error(`Semantic Error: Duplicate declaration of array '${name}'`, idNode);
        } else {
          this.symbolTable.set(name, {
            type: `array:${sizeNode.value}`,
            scope: 'global',
            line: idNode.line,
            col: idNode.col
          });
        }
      }
    }
  }

  collectFunctions(node) {
    for (const stmt of node.children) {
      if (stmt.type === 'FunctionDeclaration') {
        const idNode = stmt.children[1];
        const paramsNode = stmt.children[2];
        const funcName = idNode.value;

        if (this.functions.has(funcName) || this.symbolTable.has(funcName)) {
          this.error(`Semantic Error: Duplicate definition of function '${funcName}'`, idNode);
        } else {
          const paramsList = paramsNode.children.map(p => p.value);
          this.functions.set(funcName, {
            params: paramsList,
            line: idNode.line,
            col: idNode.col
          });
        }
      }
    }
  }

  visitStatements(node) {
    for (const stmt of node.children) {
      this.visitStatement(stmt);
    }
  }

  visitStatement(node) {
    if (!node) return;

    switch (node.type) {
      case 'ReadStatement':
        // children[0] is terminal 'READ'
        for (let i = 1; i < node.children.length; i++) {
          const idNode = node.children[i];
          this.checkVariableDeclared(idNode);
        }
        break;

      case 'PrintStatement':
        const exprNode = node.children[1];
        this.checkExpression(exprNode);
        break;

      case 'Assignment':
        const lhsNode = node.children[0];
        const rhsNode = node.children[2];
        
        let lhsName = '';
        if (lhsNode.type === 'ArrayIndex') {
          const arrayIdNode = lhsNode.children[0];
          lhsName = arrayIdNode.value;
          this.checkVariableDeclared(arrayIdNode);
          
          // Verify array index is an integer expression
          const indexExpr = lhsNode.children[1];
          const indexType = this.checkExpression(indexExpr);
          if (indexType && indexType !== 'int') {
            this.error(`Semantic Error: Array index must be an integer, got '${indexType}'`, indexExpr);
          }
        } else {
          lhsName = lhsNode.value;
          this.checkVariableDeclared(lhsNode);
        }

        const rhsType = this.checkExpression(rhsNode);
        const lhsInfo = this.getVariableInfo(lhsName);

        if (lhsInfo && rhsType) {
          let lhsType = lhsInfo.type;
          if (lhsType.startsWith('array:')) {
            lhsType = 'int'; // Indexing array yields int
          }
          
          // Check for string to numeric assignment mismatch
          if (lhsType === 'string' && rhsType !== 'string') {
            this.error(`Semantic Error: Type mismatch: Cannot assign '${rhsType}' to string variable '${lhsName}'`, lhsNode);
          } else if (lhsType !== 'string' && rhsType === 'string') {
            this.error(`Semantic Error: Type mismatch: Cannot assign string literal to variable '${lhsName}' of type '${lhsType}'`, lhsNode);
          }
        }
        break;

      case 'IfStatement':
        const condNode = node.children[1];
        this.checkCondition(condNode);
        
        const thenStmts = node.children[3];
        this.visitStatements(thenStmts);
        
        if (node.children.length > 5 && node.children[4].value === 'ELSE') {
          const elseStmts = node.children[5];
          this.visitStatements(elseStmts);
        }
        break;

      case 'WhileStatement':
        const whileCond = node.children[1];
        this.checkCondition(whileCond);
        
        const whileStmts = node.children[3];
        this.visitStatements(whileStmts);
        break;

      case 'ForStatement':
        const loopVarNode = node.children[1];
        const startNode = node.children[3];
        const endNode = node.children[5];
        const forStmts = node.children[6];

        this.checkVariableDeclared(loopVarNode);
        
        const loopVarInfo = this.getVariableInfo(loopVarNode.value);
        if (loopVarInfo && loopVarInfo.type !== 'int') {
          this.error(`Semantic Error: Loop variable '${loopVarNode.value}' must be of type 'int', got '${loopVarInfo.type}'`, loopVarNode);
        }

        const startType = this.checkExpression(startNode);
        if (startType && startType !== 'int') {
          this.error(`Semantic Error: Loop start range expression must be an integer, got '${startType}'`, startNode);
        }

        const endType = this.checkExpression(endNode);
        if (endType && endType !== 'int') {
          this.error(`Semantic Error: Loop end range expression must be an integer, got '${endType}'`, endNode);
        }

        this.visitStatements(forStmts);
        break;

      case 'SwitchStatement':
        const switchExpr = node.children[1];
        const swType = this.checkExpression(switchExpr);
        if (swType && swType === 'string') {
          this.error(`Semantic Error: Switch expression cannot be of type 'string'`, switchExpr);
        }

        const casesNode = node.children[2];
        if (casesNode) {
          for (const cItem of casesNode.children) {
            if (cItem.type === 'Case') {
              const caseExpr = cItem.children[1];
              const caseType = this.checkExpression(caseExpr);
              if (swType && caseType && swType !== caseType) {
                this.error(`Semantic Error: Type mismatch: Case expression type '${caseType}' does not match switch expression type '${swType}'`, caseExpr);
              }
              this.visitStatements(cItem.children[2]);
            } else if (cItem.type === 'DefaultCase') {
              this.visitStatements(cItem.children[1]);
            }
          }
        }
        break;

      case 'RepeatStatement':
        const repStmts = node.children[1];
        this.visitStatements(repStmts);
        
        const repCond = node.children[3];
        this.checkCondition(repCond);
        break;

      case 'FunctionDeclaration':
        const idNode = node.children[1];
        const paramsNode = node.children[2];
        const funcStmts = node.children[3];
        
        this.currentFunction = idNode.value;
        this.visitStatements(funcStmts);
        this.currentFunction = null;
        break;

      case 'ReturnStatement':
        const retExpr = node.children[1];
        this.checkExpression(retExpr);
        if (this.currentFunction === null) {
          this.error(`Semantic Error: RETURN statement is only allowed inside function definitions`, node);
        }
        break;

      default:
        break;
    }
  }

  checkVariableDeclared(idNode) {
    const name = idNode.value;
    
    // 1. Check local function parameters first
    if (this.currentFunction) {
      const funcInfo = this.functions.get(this.currentFunction);
      if (funcInfo && funcInfo.params.includes(name)) {
        return true;
      }
    }

    // 2. Check global variables
    if (this.symbolTable.has(name)) {
      return true;
    }

    this.error(`Semantic Error: Variable '${name}' not declared`, idNode);
    return false;
  }

  getVariableInfo(name) {
    if (this.currentFunction) {
      const funcInfo = this.functions.get(this.currentFunction);
      if (funcInfo && funcInfo.params.includes(name)) {
        return { type: 'int', scope: this.currentFunction }; // parameters default to int
      }
    }
    return this.symbolTable.get(name) || null;
  }

  checkCondition(node) {
    if (!node) return;
    const left = node.children[0];
    const right = node.children[2];
    this.checkExpression(left);
    this.checkExpression(right);
  }

  checkExpression(node) {
    if (!node) return null;

    if (node.type === 'Number') {
      return node.value.includes('.') ? 'float' : 'int';
    }

    if (node.type === 'String') {
      return 'string';
    }

    if (node.type === 'Identifier') {
      this.checkVariableDeclared(node);
      const info = this.getVariableInfo(node.value);
      return info ? info.type : 'int';
    }

    if (node.type === 'ArrayIndex') {
      const arrayId = node.children[0];
      this.checkVariableDeclared(arrayId);
      
      const indexExpr = node.children[1];
      const indexType = this.checkExpression(indexExpr);
      if (indexType && indexType !== 'int') {
        this.error(`Semantic Error: Array index must be an integer, got '${indexType}'`, indexExpr);
      }
      return 'int';
    }

    if (node.type === 'FunctionCall') {
      const funcId = node.children[0];
      const argsNode = node.children[1];
      
      if (!this.functions.has(funcId.value)) {
        this.error(`Semantic Error: Function '${funcId.value}' is not defined`, funcId);
      } else {
        const funcInfo = this.functions.get(funcId.value);
        if (argsNode.children.length !== funcInfo.params.length) {
          this.error(`Semantic Error: Function '${funcId.value}' expects ${funcInfo.params.length} arguments, got ${argsNode.children.length}`, funcId);
        }
      }

      for (const arg of argsNode.children) {
        this.checkExpression(arg);
      }
      return 'int'; // Functions default to returning int
    }

    if (node.type === 'Group') {
      return this.checkExpression(node.children[0]);
    }

    if (node.type === 'Expression') {
      const left = node.children[0];
      const opNode = node.children[1];
      const right = node.children[2];

      const leftType = this.checkExpression(left);
      const rightType = this.checkExpression(right);

      if (opNode && opNode.value === '/') {
        // Compile-time Division by Zero check
        if (right && right.type === 'Number' && parseFloat(right.value) === 0) {
          this.error(`Semantic Error: Division by zero detected in expression`, right);
        }
      }

      if (leftType === 'string' || rightType === 'string') {
        this.error(`Semantic Error: Arithmetic operations are not supported on string variables/literals`, opNode || node);
        return 'string';
      }

      if (leftType === 'float' || rightType === 'float') {
        return 'float';
      }

      return 'int';
    }

    return null;
  }
}

module.exports = SemanticAnalyzer;
