/* eslint-disable complexity */
import {parseCode} from './code-analyzer';

let Parser = require('expr-eval').Parser;

/**
 * Node of statement code
 */
export class Node {
    constructor(id, line, type, title, condition = '', value = '', kind = '', variableKind = '') {
        this.id           = id;
        this.line         = line;
        this.type         = type;
        this.title        = title;
        this.condition    = condition;
        this.value        = value;
        this.kind         = kind;
        this.variableKind = variableKind;
        this.childreen    = [];
    }

    add(node) {
        this.childreen.push(node);
    }
}

// Code Parser
export default class Analyzer {

    constructor(code, input) {
        this.code        = code;
        this.input       = input;
        this.nodes       = [];
        this.currentLine = 1;
        this.map         = [];
        this.arguments   = [];
        this.parsedCode  = null;
        this.idCounter   = 1;
    }

    // Build the Parser
    build() {
        this.parsedCode = parseCode(this.code);
        for (let i = 0; i < this.parsedCode.body.length; i++) this.buildRecursive(this.parsedCode.body[i], null);
        this.buildSubstitution();
        this.evaluateFunction();
    }

    // Build structure of parser in recursive way..
    buildRecursive(data, node) {
        if ('BlockStatement' !== data.type) {
            let newNode = this.buildNode(data, node);
            if (!node) node = newNode;
        }

        if (!data.body || 'WhileStatement' === data.type) return;

        if (Array.isArray(data.body)) for (let i = 0; i < data.body.length; i++) this.buildRecursive(data.body[i], node);
        else this.buildRecursive(data.body, node);
    }

    // Build the relevant node & append to nodes list
    buildNode(data, parentNode) {
        if ('FunctionDeclaration' === data.type) return this.functionDeclarationNode(data);
        if ('VariableDeclaration' === data.type) return this.variableDeclarationNode(data, parentNode);
        if ('ExpressionStatement' === data.type) return this.expressionStatementNode(data, parentNode);
        if ('WhileStatement' === data.type) return this.whileStatementNode(data, parentNode);
        if ('IfStatement' === data.type || 'ElseIfStatement' === data.type) return this.ifStatementNode(data, parentNode);
        if ('ReturnStatement' === data.type) return this.returnStatementNode(data, parentNode);
    }

    //
    functionDeclarationNode(data) {
        let node = new Node('n' + this.idCounter++, this.currentLine, data.type, 'function ' + data.id.name + '(');
        this.nodes.push(node);
        // Add variables declaration
        for (let i = 0; i < data.params.length; i++) {
            let result = this.expressionStatementRecursive(data.params[i]);
            let name   = data.params[i].name, value = '';
            if (result.leftName && result.rightName) {
                name  = result.leftName;
                value = result.rightName;
            }
            node.add(new Node('n' + this.idCounter++, this.currentLine, 'VariableDeclaration', name, '', value, 'argument'));
            node.title += (i + 1) < data.params.length ? name + ', ' : name;
            this.arguments[name] = this.input && this.input.length ? this.input[i].toString().replace(/'/g, '').replace(/"/g, '') : name;
        }
        node.title += ')';
        this.currentLine++;

        return node;
    }

    //
    variableDeclarationNode(data, parentNode) {
        let value = null;
        // Add variables declaration
        for (let i = 0; i < data.declarations.length; i++) {
            if (!data.declarations[i].init) value = 'null (or nothing)';
            else if ('Literal' === data.declarations[i].init.type) value = data.declarations[i].init.raw;
            else if ('ArrayExpression' === data.declarations[i].init.type) value = 'Array(' + data.declarations[i].init.elements.length + ')';
            else if ('VariableDeclarator' === data.declarations[i].type) value = this.expressionStatementRecursive(data.declarations[i].init);

            if (parentNode) parentNode.add(new Node('n' + this.idCounter++, this.currentLine, 'VariableDeclaration', data.declarations[i].id.name, '', value, 'FunctionDeclaration' === parentNode.type ? 'local' : '', data.kind));
            else {
                parentNode = new Node('n' + this.idCounter++, this.currentLine, 'VariableDeclaration', data.declarations[i].id.name, '', value, 'global', data.kind);
                this.nodes.push(parentNode);
                this.arguments[data.declarations[i].id.name] = value;
            }
        }
        this.currentLine++;
        return parentNode;
    }

    //
    expressionStatementNode(data, parentNode) {
        let result     = this.expressionStatementRecursive(data);
        let expression = null;
        if ('ExpressionStatement' === data.type) expression = data.expression; else expression = data;

        parentNode.add(new Node('n' + this.idCounter++, this.currentLine++, expression.type, result.leftName, '', result.rightName));
    }

    //
    expressionStatementRecursive(data) {
        if ('Identifier' === data.type) return data.name;
        if ('Literal' === data.type) return data.raw;
        if ('MemberExpression' === data.type) {
            if (data.computed) return this.expressionStatementRecursive(data.object) + '[' + this.expressionStatementRecursive(data.property) + ']';
            else return this.expressionStatementRecursive(data.object) + '.' + this.expressionStatementRecursive(data.property);
        }
        if ('UnaryExpression' === data.type) {
            if (data.operator) return data.operator + data.argument.raw;
        }
        if ('UpdateExpression' === data.type) return {'leftName' : data.argument.name, 'rightName': data.argument.name + ' ' + data.operator};
        if ('BinaryExpression' === data.type) return this.expressionStatementRecursive(data.left) + ' ' + data.operator + ' ' + this.expressionStatementRecursive(data.right);
        let expression = null;
        if ('ExpressionStatement' === data.type) expression = data.expression; else expression = data;
        if (!expression.left && !expression.right) return this.expressionStatementRecursive(expression);
        return {'leftName' : this.expressionStatementRecursive(expression.left), 'rightName': this.expressionStatementRecursive(expression.right), 'operator' : 'LogicalExpression' === data.type ? data.operator : ''};
    }

    //
    whileStatementNode(data, parentNode) {
        let conditions = this.expressionStatementRecursive(data.test);
        parentNode.add(new Node('n' + this.idCounter++, this.currentLine++, 'LoopPoint', 'NULL'));
        let newNode = new Node('n' + this.idCounter++, this.currentLine++, data.type, 'while', this.conditionRecursive(conditions));
        parentNode.add(newNode);
        if (data.body) this.buildRecursive(data.body, newNode);
    }

    //
    conditionRecursive(data) {
        if (!data.leftName && !data.rightName) return data;
        return this.conditionRecursive(data.leftName) + ' ' + data.operator + ' ' + this.conditionRecursive(data.rightName);
    }

    //
    ifStatementNode(data, parentNode) {
        let test    = this.expressionStatementRecursive(data.test);
        let newNode = new Node('n' + this.idCounter++, this.currentLine++, data.type, 'ElseIfStatement' === data.type ? 'else if' : 'if', test);
        parentNode.add(newNode);
        if (data.consequent) this.buildRecursive(data.consequent, newNode);
        if (data.alternate) {
            if ('IfStatement' === data.alternate.type) {
                data.alternate.type = 'Else' + data.alternate.type;
                this.buildRecursive(data.alternate, parentNode);
            }
            else {
                let newNode = new Node('n' + this.idCounter++, this.currentLine++, 'Else', 'else');
                parentNode.add(newNode);
                this.buildRecursive(data.alternate, newNode);
                parentNode.add(new Node('n' + this.idCounter++, this.currentLine++, 'MergePoint', ''));
            }
        } else {
            parentNode.add(new Node('n' + this.idCounter++, this.currentLine++, 'MergePoint', ''));
        }
    }

    //
    returnStatementNode(data, parentNode) {
        let result = this.expressionStatementRecursive(data.argument);
        parentNode.add(new Node('n' + this.idCounter++, this.currentLine++, data.type, 'return', '', result));
    }

    //
    buildSubstitution() {
        this.buildMap();
        for (let i = 0; i < this.nodes.length; i++) {
            if ('FunctionDeclaration' === this.nodes[i].type) for (let node of this.nodes[i].childreen) {
                if ('VariableDeclaration' === node.type) continue;
                this.buildMap();
                // Do Substitution
                this.buildSubstitutionRecursive(node);
            }
        }
    }

    //
    buildSubstitutionRecursive(node) {
        if ('AssignmentExpression' === node.type) {
            this.map[node.title].value = node.substitution = this.substitution(node.value);
            return;
        }

        if (node && node.condition) node.substitution = this.substitution(node.condition);
        else if (node && node.value) node.substitution = this.substitution(node.value);

        if (node.childreen) for (let childNode of node.childreen) {
            this.buildSubstitutionRecursive(childNode);
        }
    }

    //
    substitution(statement) {
        statement = statement.toString();
        // Check if there are local variables in given statement
        for (let key in this.map) {
            if ('local' === this.map[key].kind) {
                let indexOfFirst = statement.indexOf(key);
                let value        = '(' + this.map[key].value + ')';

                if (indexOfFirst !== -1) {
                    let expr = Parser.parse(value);
                    if (!expr.variables().length) value = expr.evaluate().toString();
                    statement = this.substitution(statement.replace(key, value));
                }
            }
        }

        return statement;
    }

    //
    buildMap() {
        this.map = [];
        for (let i = 0; i < this.nodes.length; i++) {
            if ('VariableDeclaration' === this.nodes[i].type)
                this.map[this.nodes[i].title] = {
                    'kind' : this.nodes[i].kind,
                    'value': this.nodes[i].value ? this.nodes[i].value : this.nodes[i].title
                };

            if ('FunctionDeclaration' === this.nodes[i].type)
                for (let node of this.nodes[i].childreen) {
                    if (node && 'VariableDeclaration' === node.type) this.map[node.title] = {
                        'kind' : node.kind,
                        'value': node.value ? node.value : node.title
                    };
                }
        }
    }

    //
    evaluateFunction() {
        for (let i = 0; i < this.nodes.length; i++) {
            if ('FunctionDeclaration' !== this.nodes[i].type) continue;

            let thereIsTrue = false;
            for (let node of this.nodes[i].childreen) {
                if ('IfStatement' === node.type || 'ElseIfStatement' === node.type || 'WhileStatement' === node.type) {
                    if (this.evaluateIt(node.substitution) && !thereIsTrue) {
                        node.color    = 'green';
                        thereIsTrue   = true;
                        node.childree = this.evaluateRecursive(node.childreen);
                    } else node.color = 'red';
                }
            }

            if (!thereIsTrue) for (let node of this.nodes[i].childreen) if ('Else' === node.type) node.color = 'green';
        }
    }

    //
    evaluateRecursive(nodes) {
        let thereIsTrue = false;
        for (let node of nodes) {
            if ('IfStatement' === node.type || 'ElseIfStatement' === node.type || 'WhileStatement' === node.type) {
                if (this.evaluateIt(node.substitution) && !thereIsTrue) {
                    node.color  = 'green';
                    thereIsTrue = true;
                    node.childree = this.evaluateRecursive(node.childreen);
                } else node.color = 'red';
            }
        }
        if (!thereIsTrue) for (let node of nodes) if ('Else' === node.type) node.color = 'green';
        return nodes;
    }

    //
    evaluateIt(statement) {
        let expression = Parser.parse(statement);
        return expression.evaluate(this.arguments);
    }
}