class CompilerOptimizer {
  constructor(tree) {
    this.tree = JSON.parse(JSON.stringify(tree)); // Deep clone the tree to optimize in place
    this.optimizationLog = [];
  }

  optimize() {
    if (!this.tree || this.tree.type !== 'Program') {
      return { tree: this.tree, log: this.optimizationLog };
    }

    // Traverse the AST and optimize statements and expressions
    this.tree.children = this.tree.children.map(child => this.optimizeNode(child)).filter(Boolean);

    return {
      tree: this.tree,
      log: this.optimizationLog
    };
  }

  optimizeNode(node) {
    if (!node) return null;

    // First optimize all children recursively
    if (node.children && node.children.length > 0) {
      node.children = node.children.map(child => this.optimizeNode(child)).filter(Boolean);
    }

    // Optimize specific node types
    if (node.type === 'Expression') {
      return this.foldConstantExpression(node);
    }

    if (node.type === 'IfStatement') {
      return this.eliminateDeadCodeIf(node);
    }

    return node;
  }

  foldConstantExpression(node) {
    const left = node.children[0];
    const opNode = node.children[1];
    const right = node.children[2];

    if (left && right && opNode) {
      if (left.type === 'Number' && right.type === 'Number') {
        const valL = parseFloat(left.value);
        const valR = parseFloat(right.value);
        const op = opNode.value;
        let result = 0;
        let valid = true;

        switch (op) {
          case '+': result = valL + valR; break;
          case '-': result = valL - valR; break;
          case '*': result = valL * valR; break;
          case '/': 
            if (valR !== 0) {
              result = valL / valR; 
            } else {
              valid = false;
            }
            break;
          default:
            valid = false;
        }

        if (valid) {
          // If both were integers, keep result as integer
          const isInt = !left.value.includes('.') && !right.value.includes('.') && (result % 1 === 0);
          const resultStr = isInt ? Math.round(result).toString() : result.toFixed(4).replace(/\.?0+$/, "");
          
          const logMsg = `Optimized expression: Folded '${left.value} ${op} ${right.value}' to '${resultStr}'`;
          this.optimizationLog.push(logMsg);

          return {
            type: 'Number',
            value: resultStr,
            line: node.line || left.line,
            col: node.col || left.col
          };
        }
      }
    }

    return node;
  }

  eliminateDeadCodeIf(node) {
    // [0] = 'IF', [1] = condition, [2] = 'THEN', [3] = statements
    // [4] = 'ELSE' and [5] = statements (optional), then 'ENDIF'
    const condNode = node.children[1];
    if (condNode && condNode.type === 'Condition') {
      const left = condNode.children[0];
      const opNode = condNode.children[1];
      const right = condNode.children[2];

      if (left && right && opNode && left.type === 'Number' && right.type === 'Number') {
        const valL = parseFloat(left.value);
        const valR = parseFloat(right.value);
        const op = opNode.value;
        let condResult = false;

        switch (op) {
          case '==': condResult = (valL === valR); break;
          case '!=': condResult = (valL !== valR); break;
          case '>': condResult = (valL > valR); break;
          case '<': condResult = (valL < valR); break;
          case '>=': condResult = (valL >= valR); break;
          case '<=': condResult = (valL <= valR); break;
        }

        const logMsgPrefix = `Dead code elimination: Condition '${valL} ${op} ${valR}' is always ${condResult.toString().toUpperCase()}.`;

        if (condResult) {
          this.optimizationLog.push(`${logMsgPrefix} Keeping only 'THEN' branch statements.`);
          // If condition is constantly true, keep the statements in the THEN block [3]
          const thenStmtsNode = node.children[3];
          return thenStmtsNode; // Replace IF statement with its THEN block children
        } else {
          // If condition is constantly false
          if (node.children.length > 5 && node.children[4].value === 'ELSE') {
            this.optimizationLog.push(`${logMsgPrefix} Keeping only 'ELSE' branch statements.`);
            const elseStmtsNode = node.children[5];
            return elseStmtsNode;
          } else {
            this.optimizationLog.push(`${logMsgPrefix} Removing entire IF block.`);
            return null; // Eliminate the IF block completely
          }
        }
      }
    }

    return node;
  }
}

module.exports = CompilerOptimizer;
