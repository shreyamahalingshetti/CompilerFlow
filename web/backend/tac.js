class TacGenerator {
  constructor(tree) {
    this.tree = tree;
    this.instructions = [];
    this.tempCounter = 1;
    this.labelCounter = 1;
  }

  generate() {
    this.instructions = [];
    this.tempCounter = 1;
    this.labelCounter = 1;

    if (!this.tree || this.tree.type !== 'Program') {
      return '';
    }

    // Traverse the statements inside AST
    const stmtsNode = this.tree.children.find(c => c.type === 'Statements');
    if (stmtsNode) {
      this.visitStatements(stmtsNode);
    }

    return this.instructions.join('\n');
  }

  nextTemp() {
    return `t${this.tempCounter++}`;
  }

  nextLabel() {
    return `L${this.labelCounter++}`;
  }

  emit(instr) {
    this.instructions.push(instr);
  }

  visitStatements(node) {
    if (!node || !node.children) return;
    for (const stmt of node.children) {
      this.visitStatement(stmt);
    }
  }

  visitStatement(node) {
    if (!node) return;

    switch (node.type) {
      case 'ReadStatement':
        // children[0] is 'READ'
        for (let i = 1; i < node.children.length; i++) {
          const v = node.children[i];
          this.emit(`read ${v.value}`);
        }
        break;

      case 'PrintStatement':
        const printVal = this.evaluateExpr(node.children[1]);
        this.emit(`print ${printVal}`);
        break;

      case 'Assignment':
        const lhsNode = node.children[0];
        const rhsVal = this.evaluateExpr(node.children[2]);
        
        if (lhsNode.type === 'ArrayIndex') {
          const arrName = lhsNode.children[0].value;
          const idx = this.evaluateExpr(lhsNode.children[1]);
          this.emit(`${arrName}[${idx}] = ${rhsVal}`);
        } else {
          this.emit(`${lhsNode.value} = ${rhsVal}`);
        }
        break;

      case 'IfStatement': {
        const condNode = node.children[1];
        const labelThen = this.nextLabel();
        const labelElse = this.nextLabel();
        const labelEnd = this.nextLabel();

        const condExpr = this.evaluateCondition(condNode);
        
        const hasElse = node.children.length > 5 && node.children[4].value === 'ELSE';
        
        this.emit(`if ${condExpr} goto ${labelThen}`);
        this.emit(`goto ${hasElse ? labelElse : labelEnd}`);
        
        this.emit(`LABEL ${labelThen}:`);
        this.visitStatements(node.children[3]); // then statements
        
        if (hasElse) {
          this.emit(`goto ${labelEnd}`);
          this.emit(`LABEL ${labelElse}:`);
          this.visitStatements(node.children[5]); // else statements
        }
        
        this.emit(`LABEL ${labelEnd}:`);
        break;
      }

      case 'WhileStatement': {
        const condNode = node.children[1];
        const labelStart = this.nextLabel();
        const labelBody = this.nextLabel();
        const labelEnd = this.nextLabel();

        this.emit(`LABEL ${labelStart}:`);
        const condExpr = this.evaluateCondition(condNode);
        this.emit(`if ${condExpr} goto ${labelBody}`);
        this.emit(`goto ${labelEnd}`);
        
        this.emit(`LABEL ${labelBody}:`);
        this.visitStatements(node.children[3]); // body statements
        this.emit(`goto ${labelStart}`);
        
        this.emit(`LABEL ${labelEnd}:`);
        break;
      }

      case 'ForStatement': {
        const loopVar = node.children[1].value;
        const startVal = this.evaluateExpr(node.children[3]);
        const endVal = this.evaluateExpr(node.children[5]);
        const forStmts = node.children[6];

        const labelStart = this.nextLabel();
        const labelBody = this.nextLabel();
        const labelEnd = this.nextLabel();

        this.emit(`${loopVar} = ${startVal}`);
        this.emit(`LABEL ${labelStart}:`);
        
        const temp = this.nextTemp();
        this.emit(`${temp} = ${loopVar} <= ${endVal}`);
        this.emit(`if ${temp} goto ${labelBody}`);
        this.emit(`goto ${labelEnd}`);
        
        this.emit(`LABEL ${labelBody}:`);
        this.visitStatements(forStmts);
        
        this.emit(`${loopVar} = ${loopVar} + 1`);
        this.emit(`goto ${labelStart}`);
        this.emit(`LABEL ${labelEnd}:`);
        break;
      }

      case 'SwitchStatement': {
        const swExpr = this.evaluateExpr(node.children[1]);
        const casesNode = node.children[2];
        const labelEnd = this.nextLabel();

        if (casesNode) {
          for (const cItem of casesNode.children) {
            const labelCase = this.nextLabel();
            const labelNext = this.nextLabel();

            if (cItem.type === 'Case') {
              const caseExpr = this.evaluateExpr(cItem.children[1]);
              const temp = this.nextTemp();
              this.emit(`${temp} = ${swExpr} == ${caseExpr}`);
              this.emit(`if ${temp} goto ${labelCase}`);
              this.emit(`goto ${labelNext}`);
              
              this.emit(`LABEL ${labelCase}:`);
              this.visitStatements(cItem.children[2]);
              
              // If there's a break statement in children
              if (cItem.children.some(c => c.value === 'BREAK')) {
                this.emit(`goto ${labelEnd}`);
              }
              
              this.emit(`LABEL ${labelNext}:`);
            } else if (cItem.type === 'DefaultCase') {
              this.emit(`LABEL ${labelCase}:`);
              this.visitStatements(cItem.children[1]);
            }
          }
        }
        
        this.emit(`LABEL ${labelEnd}:`);
        break;
      }

      case 'RepeatStatement': {
        const repStmts = node.children[1];
        const condNode = node.children[3];
        const labelStart = this.nextLabel();

        this.emit(`LABEL ${labelStart}:`);
        this.visitStatements(repStmts);
        
        // Repeat until condition is true, meaning we loop IF condition is FALSE
        const condExpr = this.evaluateCondition(condNode);
        const temp = this.nextTemp();
        this.emit(`${temp} = !(${condExpr})`);
        this.emit(`if ${temp} goto ${labelStart}`);
        break;
      }

      case 'FunctionDeclaration': {
        const funcName = node.children[1].value;
        const paramsNode = node.children[2];
        const funcStmts = node.children[3];

        this.emit(`LABEL func_${funcName}:`);
        for (const param of paramsNode.children) {
          this.emit(`param ${param.value}`);
        }
        this.visitStatements(funcStmts);
        this.emit(`endfunc`);
        break;
      }

      case 'ReturnStatement': {
        const retVal = this.evaluateExpr(node.children[1]);
        this.emit(`return ${retVal}`);
        break;
      }

      default:
        break;
    }
  }

  evaluateCondition(node) {
    if (!node || node.type !== 'Condition') return '1';
    const left = this.evaluateExpr(node.children[0]);
    const op = node.children[1].value;
    const right = this.evaluateExpr(node.children[2]);
    return `${left} ${op} ${right}`;
  }

  evaluateExpr(node) {
    if (!node) return '';

    if (node.type === 'Number' || node.type === 'Identifier' || node.type === 'String') {
      return node.value;
    }

    if (node.type === 'Group') {
      return this.evaluateExpr(node.children[0]);
    }

    if (node.type === 'ArrayIndex') {
      const arrId = node.children[0].value;
      const idx = this.evaluateExpr(node.children[1]);
      const temp = this.nextTemp();
      this.emit(`${temp} = ${arrId}[${idx}]`);
      return temp;
    }

    if (node.type === 'FunctionCall') {
      const funcId = node.children[0].value;
      const argsNode = node.children[1];
      const argTemps = argsNode.children.map(a => this.evaluateExpr(a));
      
      for (const arg of argTemps) {
        this.emit(`push ${arg}`);
      }
      
      const temp = this.nextTemp();
      this.emit(`${temp} = call ${funcId}, ${argTemps.length}`);
      return temp;
    }

    if (node.type === 'Expression') {
      const left = this.evaluateExpr(node.children[0]);
      const op = node.children[1].value;
      const right = this.evaluateExpr(node.children[2]);
      const temp = this.nextTemp();
      this.emit(`${temp} = ${left} ${op} ${right}`);
      return temp;
    }

    return '';
  }
}

module.exports = TacGenerator;
