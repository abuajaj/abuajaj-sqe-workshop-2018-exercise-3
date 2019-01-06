/* eslint-disable complexity */
import $ from 'jquery';
import Analyzer from './analyzer';
import CFG from './cfg';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre);

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let codeInput   = $('#codeInput').val();

        let analyzer = new Analyzer(codeToParse, codeInput ? codeInput.split(',') : []);
        analyzer.build();
        let cfg = new CFG('result', analyzer.nodes);
        cfg.build();
        render(cfg);
    });
});

function render(cfg) {
    let cy = cytoscape({container          : document.getElementById(cfg.id), boxSelectionEnabled: false, autounselectify    : true, layout             : {name: 'dagre'}, elements           : {nodes: cfg.elements, edges: cfg.edges}, style              : cfg.style,});
    cy.style(cfg.style);
    cy.ready(function () {
        let cy      = this;
        const nodes = cy.nodes();
        for (let i = 0; i < nodes.size(); i++) {
            let parentNode = nodes[i];
            let stepIndex  = parentNode.data().stepIndex ? parentNode.data().stepIndex : null;
            if (stepIndex !== null) {
                parentNode.lock();
                let height = parentNode.height();
                let px     = parentNode.position('x') + 150 - 5;
                let py     = parentNode.position('y') - (height / 2) + 5;
                let newId  = (parentNode.cy().nodes().size() + 1).toString();
                this.add({group   : 'nodes', data    : {id: newId, label: stepIndex}, position: {x: px, y: py}, classes : 'number'});
            }
        }
    });
}
