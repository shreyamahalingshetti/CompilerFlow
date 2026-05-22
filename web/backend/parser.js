class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
    this.errors = [];
    this.tree = null;
    this.variables = new Set();
    this.symbolTable = new Map();
    this.parseSteps = []; // Holds transition step objects for step-by-step animation
  }

  logStep(rule, matchedToken = null) {
    const token = matchedToken || this.peek();
    
    // Construct parser stack representation from rule
    const stack = ['Program', 'Statements'];
    if (rule.startsWith('Statement ->')) {
      stack.push('Statement');
    } else if (rule.startsWith('factor ->') || rule.startsWith('expr ->') || rule.startsWith('term ->')) {
      stack.push('Statement', 'Expression');
    }

    this.parseSteps.push({
      token: token.lexeme || token.token || 'EOF',
      rule,
      line: token.line,
      col: token.col,
      stack
    });
  }

  parse() {
    this.parseSteps = [];
    this.tree = this.program();
    
    // Check if we consumed all tokens (except EOF)
    if (this.current < this.tokens.length && this.peek().token !== 'EOF') {
      this.error('Unexpected trailing tokens');
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      tree: this.tree,
      variables: Array.from(this.variables),
      symbolTable: Object.fromEntries(this.symbolTable),
      parseSteps: this.parseSteps
    };
  }

  peek() {
    if (this.current >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1]; // EOF
    }
    return this.tokens[this.current];
  }

  previous() {
    return this.tokens[this.current - 1];
  }

  advance() {
    if (this.peek().token !== 'EOF') {
      this.current++;
    }
    return this.previous();
  }

  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  check(type) {
    return this.peek().token === type;
  }

  consume(type, message) {
    if (this.check(type)) return this.advance();
    this.error(message);
    throw new Error(message);
  }

  error(message) {
    const token = this.peek();
    this.errors.push({
      message: `${message} at line ${token.line}, col ${token.col} (got ${token.lexeme || token.token})`,
      line: token.line,
      col: token.col
    });
  }

  // --- Grammar Rules ---

  // program → START declarations statements STOP
  program() {
    const node = { type: 'Program', children: [], line: 1, col: 1 };
    try {
      this.logStep('Program -> START Declarations Statements STOP');
      const startToken = this.consume('START', 'Expected START at beginning of program');
      node.line = startToken.line;
      node.col = startToken.col;
      node.children.push({ type: 'Terminal', value: 'START', line: startToken.line, col: startToken.col });

      node.children.push(this.declarations());

      node.children.push(this.statements());

      const stopToken = this.consume('STOP', 'Expected STOP at end of program');
      node.children.push({ type: 'Terminal', value: 'STOP', line: stopToken.line, col: stopToken.col });
    } catch (e) {
      // Error already recorded
    }
    return node;
  }

  // declarations → declaration*
  declarations() {
    const node = { type: 'Declarations', children: [], line: this.peek().line, col: this.peek().col };
    while (this.check('INT_TYPE') || this.check('FLOAT_TYPE') || this.check('CHAR_TYPE') || 
           this.check('STRING_TYPE') || this.check('DOUBLE_TYPE') || this.check('LONG_TYPE') || 
           this.check('ARRAY')) {
      try {
        this.logStep('Declarations -> Declaration Declarations');
        node.children.push(this.declaration());
      } catch (e) {
        this.advance();
      }
    }
    return node;
  }

  // declaration → DataType ID | ARRAY ID '[' NUMBER ']'
  declaration() {
    const peekToken = this.peek();
    if (this.match('ARRAY')) {
      this.logStep('Declaration -> ARRAY ID [ NUMBER ]', peekToken);
      const node = { type: 'ArrayDeclaration', children: [{ type: 'Terminal', value: 'ARRAY', line: peekToken.line, col: peekToken.col }], line: peekToken.line, col: peekToken.col };
      const idToken = this.consume('ID', "Expected array name after ARRAY");
      this.variables.add(idToken.lexeme);
      node.children.push({ type: 'Identifier', value: idToken.lexeme, line: idToken.line, col: idToken.col });
      
      const openToken = this.consume('[', "Expected '[' after array name");
      const sizeToken = this.consume('NUMBER', "Expected array size");
      node.children.push({ type: 'Number', value: sizeToken.lexeme, line: sizeToken.line, col: sizeToken.col });
      const closeToken = this.consume(']', "Expected ']' after array size");
      
      this.symbolTable.set(idToken.lexeme, `array:${sizeToken.lexeme}`);
      return node;
    } else {
      this.logStep('Declaration -> DataType ID', peekToken);
      const node = { type: 'Declaration', children: [], line: peekToken.line, col: peekToken.col };
      const typeToken = this.advance(); // INT_TYPE, FLOAT_TYPE, etc.
      node.children.push({ type: 'DataType', value: typeToken.lexeme, line: typeToken.line, col: typeToken.col });
      
      const idToken = this.consume('ID', "Expected variable name after datatype");
      this.variables.add(idToken.lexeme);
      node.children.push({ type: 'Identifier', value: idToken.lexeme, line: idToken.line, col: idToken.col });
      
      let typeStr = 'int';
      if (typeToken.token === 'FLOAT_TYPE') typeStr = 'float';
      else if (typeToken.token === 'CHAR_TYPE') typeStr = 'char';
      else if (typeToken.token === 'STRING_TYPE') typeStr = 'string';
      else if (typeToken.token === 'DOUBLE_TYPE') typeStr = 'double';
      else if (typeToken.token === 'LONG_TYPE') typeStr = 'long';
      
      this.symbolTable.set(idToken.lexeme, typeStr);
      return node;
    }
  }

  // statements → statement*
  statements() {
    const node = { type: 'Statements', children: [], line: this.peek().line, col: this.peek().col };
    while (!this.check('STOP') && !this.check('EOF') && 
           !this.check('ENDIF') && !this.check('ELSE') && 
           !this.check('ENDFOR') && !this.check('ENDWHILE') &&
           !this.check('CASE') && !this.check('DEFAULT') && 
           !this.check('ENDSWITCH') && !this.check('BREAK') &&
           !this.check('UNTIL') && !this.check('ENDFUNCTION')) {
      try {
        const stmt = this.statement();
        if (stmt) {
          node.children.push(stmt);
        } else {
          this.advance();
        }
      } catch (e) {
        this.advance();
      }
    }
    return node;
  }

  // statement → READ idList | PRINT idExpr | ID = expr | IF... | FOR... | WHILE... | SWITCH... | REPEAT... | FUNCTION... | RETURN...
  statement() {
    const token = this.peek();
    
    if (this.check('READ')) {
      this.logStep('Statement -> READ idList');
      this.advance();
      return this.readStatement(token);
    }
    if (this.check('PRINT')) {
      this.logStep('Statement -> PRINT expr');
      this.advance();
      return this.printStatement(token);
    }
    if (this.check('IF')) {
      this.logStep('Statement -> IF condition THEN Statements [ELSE Statements] ENDIF');
      this.advance();
      return this.ifStatement(token);
    }
    if (this.check('FOR')) {
      this.logStep('Statement -> FOR ID = expr TO expr Statements ENDFOR');
      this.advance();
      return this.forStatement(token);
    }
    if (this.check('WHILE')) {
      this.logStep('Statement -> WHILE condition DO Statements ENDWHILE');
      this.advance();
      return this.whileStatement(token);
    }
    if (this.check('SWITCH')) {
      this.logStep('Statement -> SWITCH (expr) Cases ENDSWITCH');
      this.advance();
      return this.switchStatement(token);
    }
    if (this.check('REPEAT')) {
      this.logStep('Statement -> REPEAT Statements UNTIL condition');
      this.advance();
      return this.repeatStatement(token);
    }
    if (this.check('FUNCTION')) {
      this.logStep('Statement -> FUNCTION ID ( params ) Statements ENDFUNCTION');
      this.advance();
      return this.functionStatement(token);
    }
    if (this.check('RETURN')) {
      this.logStep('Statement -> RETURN expr');
      this.advance();
      return this.returnStatement(token);
    }
    if (this.check('ID')) {
      this.logStep('Statement -> ID = expr');
      return this.assignmentStatement();
    }
    
    this.error('Expected a valid statement (READ, PRINT, IF, FOR, WHILE, SWITCH, REPEAT, FUNCTION, RETURN, or assignment)');
    throw new Error('Invalid statement');
  }

  readStatement(readToken) {
    const node = { type: 'ReadStatement', children: [{ type: 'Terminal', value: 'READ', line: readToken.line, col: readToken.col }], line: readToken.line, col: readToken.col };
    
    do {
      const idToken = this.consume('ID', 'Expected variable name after READ');
      this.variables.add(idToken.lexeme);
      node.children.push({ type: 'Identifier', value: idToken.lexeme, line: idToken.line, col: idToken.col });
    } while (this.match(','));

    return node;
  }

  printStatement(printToken) {
    const node = { type: 'PrintStatement', children: [{ type: 'Terminal', value: 'PRINT', line: printToken.line, col: printToken.col }], line: printToken.line, col: printToken.col };
    const e = this.expression();
    node.children.push(e);
    return node;
  }

  assignmentStatement() {
    const idToken = this.consume('ID', 'Expected variable name in assignment');
    this.variables.add(idToken.lexeme);
    
    const node = { type: 'Assignment', children: [], line: idToken.line, col: idToken.col };
    
    if (this.match('[')) {
      const indexExpr = this.expression();
      this.consume(']', "Expected ']' after array index");
      node.children.push({ type: 'ArrayIndex', children: [{ type: 'Identifier', value: idToken.lexeme, line: idToken.line, col: idToken.col }, indexExpr], line: idToken.line, col: idToken.col });
    } else {
      node.children.push({ type: 'Identifier', value: idToken.lexeme, line: idToken.line, col: idToken.col });
    }
    
    const eqToken = this.consume('=', "Expected '=' in assignment");
    node.children.push({ type: 'Terminal', value: '=', line: eqToken.line, col: eqToken.col });
    
    node.children.push(this.expression());
    
    return node;
  }

  switchStatement(switchToken) {
    const node = { type: 'SwitchStatement', children: [{ type: 'Terminal', value: 'SWITCH', line: switchToken.line, col: switchToken.col }], line: switchToken.line, col: switchToken.col };
    
    const hasParen = this.match('(');
    node.children.push(this.expression());
    if (hasParen) {
      this.consume(')', "Expected ')' after switch expression");
    }
    
    node.children.push(this.cases());
    
    const endToken = this.consume('ENDSWITCH', "Expected ENDSWITCH at end of switch");
    node.children.push({ type: 'Terminal', value: 'ENDSWITCH', line: endToken.line, col: endToken.col });
    
    return node;
  }

  cases() {
    const node = { type: 'Cases', children: [], line: this.peek().line, col: this.peek().col };
    while (this.check('CASE') || this.check('DEFAULT')) {
      if (this.check('CASE')) {
        node.children.push(this.caseItem());
      } else {
        node.children.push(this.defaultCaseItem());
      }
    }
    return node;
  }

  caseItem() {
    const peekToken = this.peek();
    this.logStep('Case -> CASE expr : Statements', peekToken);
    const node = { type: 'Case', children: [{ type: 'Terminal', value: 'CASE', line: peekToken.line, col: peekToken.col }], line: peekToken.line, col: peekToken.col };
    this.consume('CASE', 'Expected CASE');
    
    node.children.push(this.expression());
    this.consume(':', "Expected ':' after case expression");
    
    node.children.push(this.statements());
    
    if (this.match('BREAK')) {
      const breakToken = this.previous();
      node.children.push({ type: 'Terminal', value: 'BREAK', line: breakToken.line, col: breakToken.col });
    }
    
    return node;
  }

  defaultCaseItem() {
    const peekToken = this.peek();
    this.logStep('DefaultCase -> DEFAULT : Statements', peekToken);
    const node = { type: 'DefaultCase', children: [{ type: 'Terminal', value: 'DEFAULT', line: peekToken.line, col: peekToken.col }], line: peekToken.line, col: peekToken.col };
    this.consume('DEFAULT', 'Expected DEFAULT');
    
    this.consume(':', "Expected ':' after default");
    node.children.push(this.statements());
    
    return node;
  }

  repeatStatement(repeatToken) {
    const node = { type: 'RepeatStatement', children: [{ type: 'Terminal', value: 'REPEAT', line: repeatToken.line, col: repeatToken.col }], line: repeatToken.line, col: repeatToken.col };
    node.children.push(this.statements());
    
    const untilToken = this.consume('UNTIL', "Expected UNTIL in REPEAT loop");
    node.children.push({ type: 'Terminal', value: 'UNTIL', line: untilToken.line, col: untilToken.col });
    
    node.children.push(this.condition());
    return node;
  }

  functionStatement(funcToken) {
    const node = { type: 'FunctionDeclaration', children: [{ type: 'Terminal', value: 'FUNCTION', line: funcToken.line, col: funcToken.col }], line: funcToken.line, col: funcToken.col };
    const idToken = this.consume('ID', "Expected function name");
    this.variables.add(idToken.lexeme);
    node.children.push({ type: 'Identifier', value: idToken.lexeme, line: idToken.line, col: idToken.col });
    
    this.consume('(', "Expected '(' after function name");
    
    const params = { type: 'Parameters', children: [], line: this.peek().line, col: this.peek().col };
    if (!this.check(')')) {
      do {
        const paramToken = this.consume('ID', "Expected parameter name");
        this.variables.add(paramToken.lexeme);
        params.children.push({ type: 'Identifier', value: paramToken.lexeme, line: paramToken.line, col: paramToken.col });
      } while (this.match(','));
    }
    this.consume(')', "Expected ')' after parameters");
    node.children.push(params);
    
    node.children.push(this.statements());
    
    const endToken = this.consume('ENDFUNCTION', "Expected ENDFUNCTION");
    node.children.push({ type: 'Terminal', value: 'ENDFUNCTION', line: endToken.line, col: endToken.col });
    
    return node;
  }

  returnStatement(returnToken) {
    const node = { type: 'ReturnStatement', children: [{ type: 'Terminal', value: 'RETURN', line: returnToken.line, col: returnToken.col }], line: returnToken.line, col: returnToken.col };
    node.children.push(this.expression());
    return node;
  }

  ifStatement(ifToken) {
    const node = { type: 'IfStatement', children: [{ type: 'Terminal', value: 'IF', line: ifToken.line, col: ifToken.col }], line: ifToken.line, col: ifToken.col };
    
    node.children.push(this.condition());
    
    const thenToken = this.consume('THEN', "Expected THEN after condition");
    node.children.push({ type: 'Terminal', value: 'THEN', line: thenToken.line, col: thenToken.col });
    
    node.children.push(this.statements());
    
    if (this.match('ELSE')) {
      const elseToken = this.previous();
      node.children.push({ type: 'Terminal', value: 'ELSE', line: elseToken.line, col: elseToken.col });
      node.children.push(this.statements());
    }
    
    const endToken = this.consume('ENDIF', "Expected ENDIF");
    node.children.push({ type: 'Terminal', value: 'ENDIF', line: endToken.line, col: endToken.col });
    
    return node;
  }

  forStatement(forToken) {
    const node = { type: 'ForStatement', children: [{ type: 'Terminal', value: 'FOR', line: forToken.line, col: forToken.col }], line: forToken.line, col: forToken.col };
    
    const idToken = this.consume('ID', "Expected loop variable in FOR");
    this.variables.add(idToken.lexeme);
    node.children.push({ type: 'Identifier', value: idToken.lexeme, line: idToken.line, col: idToken.col });
    
    const eqToken = this.consume('=', "Expected '=' in FOR statement");
    node.children.push({ type: 'Terminal', value: '=', line: eqToken.line, col: eqToken.col });
    
    node.children.push(this.expression());
    
    const toToken = this.consume('TO', "Expected TO in FOR statement");
    node.children.push({ type: 'Terminal', value: 'TO', line: toToken.line, col: toToken.col });
    
    node.children.push(this.expression());
    
    node.children.push(this.statements());
    
    const endToken = this.consume('ENDFOR', "Expected ENDFOR");
    node.children.push({ type: 'Terminal', value: 'ENDFOR', line: endToken.line, col: endToken.col });
    
    return node;
  }

  whileStatement(whileToken) {
    const node = { type: 'WhileStatement', children: [{ type: 'Terminal', value: 'WHILE', line: whileToken.line, col: whileToken.col }], line: whileToken.line, col: whileToken.col };
    
    node.children.push(this.condition());
    
    const doToken = this.consume('DO', "Expected DO in WHILE statement");
    node.children.push({ type: 'Terminal', value: 'DO', line: doToken.line, col: doToken.col });
    
    node.children.push(this.statements());
    
    const endToken = this.consume('ENDWHILE', "Expected ENDWHILE");
    node.children.push({ type: 'Terminal', value: 'ENDWHILE', line: endToken.line, col: endToken.col });
    
    return node;
  }

  condition() {
    this.logStep('condition -> expr relop expr');
    const node = { type: 'Condition', children: [], line: this.peek().line, col: this.peek().col };
    
    node.children.push(this.expression());
    
    if (this.match('==', '!=', '>', '<', '>=', '<=')) {
      const opToken = this.previous();
      node.children.push({ type: 'Operator', value: opToken.lexeme, line: opToken.line, col: opToken.col });
      node.children.push(this.expression());
    } else {
      this.error("Expected relational operator in condition");
      throw new Error("Missing relational operator");
    }
    
    return node;
  }

  expression() {
    return this.term();
  }

  term() {
    this.logStep('expr -> term ((+|-) term)*');
    let expr = this.factor();

    while (this.match('+', '-')) {
      const operator = this.previous();
      const right = this.factor();
      const node = { type: 'Expression', children: [expr, { type: 'Operator', value: operator.lexeme, line: operator.line, col: operator.col }, right], line: operator.line, col: operator.col };
      expr = node;
    }

    return expr;
  }

  factor() {
    this.logStep('term -> factor ((*|/) factor)*');
    let expr = this.primary();

    while (this.match('*', '/')) {
      const operator = this.previous();
      const right = this.primary();
      const node = { type: 'Expression', children: [expr, { type: 'Operator', value: operator.lexeme, line: operator.line, col: operator.col }, right], line: operator.line, col: operator.col };
      expr = node;
    }

    return expr;
  }

  primary() {
    const token = this.peek();
    
    if (this.match('STRING')) {
      const prev = this.previous();
      this.logStep('factor -> STRING', prev);
      return { type: 'String', value: prev.lexeme, line: prev.line, col: prev.col };
    }
    if (this.match('NUMBER')) {
      const prev = this.previous();
      this.logStep('factor -> NUMBER', prev);
      return { type: 'Number', value: prev.lexeme, line: prev.line, col: prev.col };
    }
    if (this.match('ID')) {
      const idToken = this.previous();
      
      if (this.match('(')) {
        this.logStep('factor -> FunctionCall', idToken);
        const args = { type: 'Arguments', children: [], line: idToken.line, col: idToken.col };
        if (!this.check(')')) {
          do {
            args.children.push(this.expression());
          } while (this.match(','));
        }
        this.consume(')', "Expected ')' after arguments");
        return { type: 'FunctionCall', children: [{ type: 'Identifier', value: idToken.lexeme, line: idToken.line, col: idToken.col }, args], line: idToken.line, col: idToken.col };
      }
      
      if (this.match('[')) {
        this.logStep('factor -> ArrayIndex', idToken);
        const indexExpr = this.expression();
        this.consume(']', "Expected ']' after array index");
        return { type: 'ArrayIndex', children: [{ type: 'Identifier', value: idToken.lexeme, line: idToken.line, col: idToken.col }, indexExpr], line: idToken.line, col: idToken.col };
      }
      
      this.logStep('factor -> ID', idToken);
      return { type: 'Identifier', value: idToken.lexeme, line: idToken.line, col: idToken.col };
    }
    if (this.match('(')) {
      this.logStep('factor -> ( expr )', token);
      const expr = this.expression();
      this.consume(')', "Expected ')' after expression");
      return { type: 'Group', children: [expr], line: token.line, col: token.col };
    }
    
    this.error("Expected expression (number, identifier, or '(')");
    throw new Error("Invalid expression");
  }
}

module.exports = Parser;
