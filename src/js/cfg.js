/* eslint-disable complexity */
import {Node} from './analyzer';

// CFG Class
export default class CFG {

    constructor(id, nodes) {
        this.id        = id;
        this.nodes     = nodes;
        this.elements  = [];
        this.edges     = [];
        this.style     = null;
        this.idCounter = nodes.length;
        this.stepIndex = 1;
        this.cy        = null;
    }

    //
    build() {
        // Pre processing of data: merge same nodes
        this.nodes = this.mergeNodes(this.nodes);

        this.buildStyle();
        this.buildElements();
    }

    // Merge consistent VariableDeclaration, UpdateExpression and AssignmentExpression nodes..
    mergeNodes(nodes) {
        let group = [], newNodes = [];
        for (let node of nodes) {
            if (('VariableDeclaration' === node.type && 'argument' !== node.kind) || 'AssignmentExpression' === node.type || 'UpdateExpression' === node.type) group.push(node);
            else if (group && group.length > 0) { // we got a group!
                let parentNode       = new Node('n' + this.idCounter++, group[0].line, 'ParentNode', '');parentNode.childreen = group;newNodes.push(parentNode);group = [];
            }
            if ('IfStatement' === node.type || 'ElseIfStatement' === node.type || 'Else' === node.type || 'WhileStatement' === node.type) {
                newNodes.push(node);if (node.childreen && node.childreen.length > 1) node.childreen = this.mergeNodes(node.childreen);
            }
            if ('FunctionDeclaration' === node.type) {
                newNodes.push(node);if (node.childreen && node.childreen.length > 1) node.childreen = this.mergeNodes(node.childreen);
            }
            if ('LoopPoint' === node.type || 'MergePoint' === node.type || 'ReturnStatement' === node.type) newNodes.push(node);
        }
        if (group && group.length > 0) { // we got a group!
            let parentNode       = new Node('n' + this.idCounter++, group[0].line, 'ParentNode', '');parentNode.childreen = group;newNodes.push(parentNode);
        }
        return newNodes;
    }

    //
    buildStyle() {
        this.style = [
            {selector: 'node', style   : {'shape'           : 'rectangle', 'width'           : 300, 'height'          : 40, 'content'         : 'data(label)', 'text-valign'     : 'center', 'text-halign'     : 'center', 'text-wrap'       : 'wrap', 'background-color': '#fff', 'border-width'    : 3, 'border-color'    : '#000', 'color'           : '#000', 'font-size'       : '28px', 'padding'         : '10px'}},
            {selector: 'node.parent', style   : {'height': '100%',}},
            {selector: 'node.rectangle', style   : {'content': 'data(label)', 'shape'  : 'rectangle', 'width'  : '150', 'height' : '150',}},
            {selector: 'node.diamond', style   : {'content': 'data(label)', 'shape'  : 'diamond', 'width'  : '250', 'height' : '80',}},
            {selector: 'node.ellipse', style   : {'content': 'data(label)', 'shape'  : 'ellipse', 'width'  : '50', 'height' : '50',}},
            {selector: 'node.green', style   : {'background-color': '#9DCC83',}},
            {selector: 'node.number', style   : {'background-color': '#689ad0', 'border-width'    : 1, 'color'           : '#fff', 'content'         : 'data(label)', 'text-valign'     : 'center', 'text-halign'     : 'center', 'text-wrap'       : 'wrap', 'width'           : '20', 'height'          : '20', 'font-size'       : '20px', 'padding'         : '5px'}},
            {selector: 'edge', style   : {'width'                  : 4,'content'         : 'data(label)', 'text-valign'     : 'top', 'text-margin-y':'-20', 'target-arrow-shape'     : 'triangle', 'line-color'             : '#000', 'target-arrow-color'     : '#000', 'curve-style'            : 'bezier', 'control-point-distances': '-0% 30%', 'control-point-weights'  : '0 3'}},
        ];
    }

    //
    getPrevLoopPoint(index, childreen) {
        for (let i = index; i > 0; i--) if ('LoopPoint' === childreen[i].type) return childreen[i];
        return null;
    }

    //
    getNextMergePoint(index, childreen) {
        for (let i = index; i < childreen.length; i++) if ('MergePoint' === childreen[i].type) return childreen[i];
        return null;
    }

    //
    buildMergeEdges(index, childreen) {
        let node = childreen[index];
        if (index + 1 < childreen.length) { // Next node
            if ('FunctionDeclaration' === childreen[index + 1].type)
                this.edges.push({data: {source: node.id, target: childreen[index + 1].childreen[0].id, label: ''}});
            else
                this.edges.push({data: {source: node.id, target: childreen[index + 1].id, label: ''}});
        } else {
            //merge point
            return node;
        }
    }

    //
    buildAssignmentEdges(index, childreen) {
        let node = childreen[index];
        if (index + 1 < childreen.length) { // Next node
            this.edges.push({data: {source: node.id, target: childreen[index + 1].id, label: ''}});
        } else {
            //merge point
            return node;
        }
    }

    //
    buildIfEdges(index, childreen) {
        let node = childreen[index];
        if (index + 1 < childreen.length) { // Next node
            if ('green' === node.color) {
                if ('Else' === childreen[index + 1].type) this.edges.push({data: {source: node.id, target: childreen[index + 1].childreen[0].id, label: 'F'}});
                else this.edges.push({data: {source: node.id, target: childreen[index + 1].id, label: 'F'}});
            } else {
                if ('Else' === childreen[index + 1].type) this.edges.push({
                    data: {source: node.id, target: childreen[index + 1].childreen[0].id, label: 'T'}
                });
                else this.edges.push({data: {source: node.id, target: childreen[index + 1].id, label: 'T'}});
            }
        }
        if (node.childreen && node.childreen.length > 0) { //Next inside node
            if ('green' === node.color) this.edges.push({data: {source: node.id, target: node.childreen[0].id, label: 'T'}});
            else this.edges.push({data: {source: node.id, target: node.childreen[0].id, label: 'F'}});
        }
    }

    //
    buildEdges(index, childreen) {
        let node = childreen[index];
        if ('ParentNode' === node.type) return this.buildMergeEdges(index, childreen);
        if ('IfStatement' === node.type || 'ElseIfStatement' === node.type || 'WhileStatement' === node.type) this.buildIfEdges(index, childreen);
        if ('AssignmentExpression' === node.type || 'UpdateExpression' === node.type) return this.buildAssignmentEdges(index, childreen);
        if ('MergePoint' === node.type) return this.buildMergeEdges(index, childreen);
        if ('LoopPoint' === node.type) return this.buildMergeEdges(index, childreen);
        if (node.childreen && node.childreen.length > 0) for (let i in node.childreen) {
            let lastNode = this.buildEdges(parseInt(i), node.childreen);
            if (lastNode) {
                if ('WhileStatement' === childreen[index].type) {let prevLoopPoint = this.getPrevLoopPoint(index, childreen);prevLoopPoint ? this.edges.push({data: {source: lastNode.id, target: prevLoopPoint.id, label: ''}}) : '';
                } else {let nextMergePoint = this.getNextMergePoint(index, childreen);nextMergePoint ? this.edges.push({data: {source: lastNode.id, target: nextMergePoint.id, label: ''}}) : '';}
            }
        }
    }

    //
    buildParentElement(parentNode, greenPath) {
        if (parentNode && parentNode.childreen.length > 0) {
            let parentElement = {
                data   : {id: parentNode.id, label: '', stepIndex: this.stepIndex++},
                classes: 'parent' + ((greenPath || (parentNode.path && true === parentNode.path)) ? ' green' : '')
            };
            let label = [];
            for (let node of parentNode.childreen) {
                if ('VariableDeclaration' === node.type) label.push(node.title + ' = ' + node.value);
                else if ('AssignmentExpression' === node.type) label.push(node.title + ' = ' + node.value);
                else if ('UpdateExpression' === node.type) label.push(node.value);
            }
            parentElement.data.label = label.join('\n');
            this.elements.push(parentElement);
        }
    }

    //
    buildElementsRecursive(node, nodes, greenPath) {
        if ('ParentNode' === node.type) this.buildParentElement(node, greenPath);
        if ('VariableDeclaration' === node.type && 'local' === node.kind) nodes.push({data   : {id: node.id, label: node.title + ' = ' + node.value, stepIndex: this.stepIndex++}, classes: (greenPath || (node.path && true === node.path)) ? ' green' : ''});
        if ('AssignmentExpression' === node.type) nodes.push({data   : {id: node.id, label: node.title + ' = ' + node.value, stepIndex: this.stepIndex++}, classes: (greenPath || (node.path && true === node.path)) ? ' green' : ''});
        if ('UpdateExpression' === node.type) nodes.push({data   : {id: node.id, label: node.value, stepIndex: this.stepIndex++}, classes: (greenPath || (node.path && true === node.path)) ? ' green' : ''});
        if ('IfStatement' === node.type || 'ElseIfStatement' === node.type || 'WhileStatement' === node.type) nodes.push({data   : {id: node.id, label: node.condition, stepIndex: this.stepIndex++}, classes: 'diamond' + ((greenPath || (node.path && true === node.path)) ? ' green' : '')});
        if ('MergePoint' === node.type) nodes.push({data   : {id: node.id, label: ''}, classes: 'ellipse' + ((greenPath || (node.path && true === node.path)) ? ' green' : '')});
        if ('LoopPoint' === node.type) nodes.push({data   : {id: node.id, label: node.title, stepIndex: this.stepIndex++}, classes: (greenPath || (node.path && true === node.path)) ? ' green' : ''});
        if ('ReturnStatement' === node.type) nodes.push({data   : {id: node.id, label: node.title + ' ' + node.value, stepIndex: this.stepIndex++}, classes: (greenPath || (node.path && true === node.path)) ? ' green' : ''});
        if ('ParentNode' !== node.type && node.childreen) for (let childNode of node.childreen) {
            let greenPath = (node.color && 'green' === node.color);
            this.buildElementsRecursive(childNode, nodes, greenPath);
        }
        return nodes;
    }

    //
    buildElements() {
        if (this.nodes && this.nodes.length) for (let i = 0; i < this.nodes.length; i++) {
            if ('FunctionDeclaration' === this.nodes[i].type) {
                for (let index in this.nodes[i].childreen) {
                    let node = this.nodes[i].childreen[index];
                    node.path     = true;
                    this.elements = this.buildElementsRecursive(node, this.elements, false);
                    this.buildEdges(parseInt(index), this.nodes[i].childreen);
                }
            } else {
                this.nodes[i].path = true;
                this.elements      = this.buildElementsRecursive(this.nodes[i], this.elements);
                this.buildEdges(i, this.nodes);
            }
        }
    }
}