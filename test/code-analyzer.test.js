import assert from 'assert';
import Analyzer from '../src/js/analyzer';
import CFG from '../src/js/cfg';

describe('The CFG 1', () => {
    it('is check global variables correctly', () => {
        let analyzer = new Analyzer('let w = 1;', []);
        analyzer.build();
        let cfg = new CFG('result', analyzer.nodes);
        cfg.build();

        // Check the nodes + edges
        assert.equal(JSON.stringify(cfg.elements), '[{"data":{"id":"n1","label":"w = 1","stepIndex":1},"classes":"parent green"}]');
        assert.equal(JSON.stringify(cfg.edges), '[]');
    });
    it('is check if correctly', () => {
        let analyzer = new Analyzer('function foo(x, y, z) {let a = x + 1;let b = a + y;let c = 0;if (b < z) {c = c + 5;}return x + y + z + c;}', []);
        analyzer.build();
        let cfg = new CFG('result', analyzer.nodes);
        cfg.build();

        // Check the nodes + edges
        assert.equal(JSON.stringify(cfg.elements), '[{"data":{"id":"n1","label":"a = x + 1\\nb = a + y\\nc = 0","stepIndex":1},"classes":"parent green"},{"data":{"id":"n8","label":"b < z","stepIndex":2},"classes":"diamond green"},{"data":{"id":"n9","label":"c = c + 5","stepIndex":3},"classes":""},{"data":{"id":"n10","label":""},"classes":"ellipse green"},{"data":{"id":"n11","label":"return x + y + z + c","stepIndex":4},"classes":" green"}]');
        assert.equal(JSON.stringify(cfg.edges), '[{"data":{"source":"n1","target":"n8","label":""}},{"data":{"source":"n8","target":"n10","label":"T"}},{"data":{"source":"n8","target":"n9","label":"F"}},{"data":{"source":"n9","target":"n10","label":""}},{"data":{"source":"n10","target":"n11","label":""}}]');
    });
    it('is check if - else correctly', () => {
        let analyzer = new Analyzer('function foo(x, y, z){let a = x + 1;let b = a + y;let c = 0;if (b < z) {c = c + 5;return x + y + z + c;} else {c = c + z + 5;return x + y + z + c;}}', []);
        analyzer.build();
        let cfg = new CFG('result', analyzer.nodes);
        cfg.build();

        // Check the nodes + edges
        assert.equal(JSON.stringify(cfg.elements), '[{"data":{"id":"n1","label":"a = x + 1\\nb = a + y\\nc = 0","stepIndex":1},"classes":"parent green"},{"data":{"id":"n8","label":"b < z","stepIndex":2},"classes":"diamond green"},{"data":{"id":"n2","label":"c = c + 5","stepIndex":3},"classes":"parent"},{"data":{"id":"n10","label":"return x + y + z + c","stepIndex":4},"classes":""},{"data":{"id":"n3","label":"c = c + z + 5","stepIndex":5},"classes":"parent green"},{"data":{"id":"n13","label":"return x + y + z + c","stepIndex":6},"classes":" green"},{"data":{"id":"n14","label":""},"classes":"ellipse green"}]');
        assert.equal(JSON.stringify(cfg.edges), '[{"data":{"source":"n1","target":"n8","label":""}},{"data":{"source":"n8","target":"n3","label":"T"}},{"data":{"source":"n8","target":"n2","label":"F"}},{"data":{"source":"n2","target":"n10","label":""}},{"data":{"source":"n3","target":"n13","label":""}}]');
    });
});
//
describe('The CFG 2', () => {
    it('is check if - else if - else correctly', () => {
        let analyzer = new Analyzer('function foo(x, y, z){let a = x + 1;let b = a + y;let c = 0;if (b < z) {c = c + 5;return x + y + z + c;} else if (b < z * 2) {c = c + x + 5;return x + y + z + c;} else {c = c + z + 5;return x + y + z + c;}}', []);
        analyzer.build();
        let cfg = new CFG('result', analyzer.nodes);
        cfg.build();

        // Check the nodes + edges
        assert.equal(JSON.stringify(cfg.elements), '[{"data":{"id":"n1","label":"a = x + 1\\nb = a + y\\nc = 0","stepIndex":1},"classes":"parent green"},{"data":{"id":"n8","label":"b < z","stepIndex":2},"classes":"diamond green"},{"data":{"id":"n2","label":"c = c + 5","stepIndex":3},"classes":"parent"},{"data":{"id":"n10","label":"return x + y + z + c","stepIndex":4},"classes":""},{"data":{"id":"n11","label":"b < z * 2","stepIndex":5},"classes":"diamond green"},{"data":{"id":"n3","label":"c = c + x + 5","stepIndex":6},"classes":"parent"},{"data":{"id":"n13","label":"return x + y + z + c","stepIndex":7},"classes":""},{"data":{"id":"n4","label":"c = c + z + 5","stepIndex":8},"classes":"parent green"},{"data":{"id":"n16","label":"return x + y + z + c","stepIndex":9},"classes":" green"},{"data":{"id":"n17","label":""},"classes":"ellipse green"}]');
        assert.equal(JSON.stringify(cfg.edges), '[{"data":{"source":"n1","target":"n8","label":""}},{"data":{"source":"n8","target":"n11","label":"T"}},{"data":{"source":"n8","target":"n2","label":"F"}},{"data":{"source":"n2","target":"n10","label":""}},{"data":{"source":"n11","target":"n4","label":"T"}},{"data":{"source":"n11","target":"n3","label":"F"}},{"data":{"source":"n3","target":"n13","label":""}},{"data":{"source":"n4","target":"n16","label":""}}]');
    });
    it('is check while correctly', () => {
        let analyzer = new Analyzer('function foo(x, y, z){let a = x + 1;let b = a + y;let c = 0;while (a < z) {c = a + b;z = c * 2;}return z;}', []);
        analyzer.build();
        let cfg = new CFG('result', analyzer.nodes);
        cfg.build();

        // Check the nodes + edges
        assert.equal(JSON.stringify(cfg.elements), '[{"data":{"id":"n1","label":"a = x + 1\\nb = a + y\\nc = 0","stepIndex":1},"classes":"parent green"},{"data":{"id":"n8","label":"NULL","stepIndex":2},"classes":" green"},{"data":{"id":"n9","label":"a < z","stepIndex":3},"classes":"diamond green"},{"data":{"id":"n2","label":"c = a + b\\nz = c * 2","stepIndex":4},"classes":"parent"},{"data":{"id":"n12","label":"return z","stepIndex":5},"classes":" green"}]');
        assert.equal(JSON.stringify(cfg.edges), '[{"data":{"source":"n1","target":"n8","label":""}},{"data":{"source":"n8","target":"n9","label":""}},{"data":{"source":"n9","target":"n12","label":"T"}},{"data":{"source":"n9","target":"n2","label":"F"}},{"data":{"source":"n2","target":"n8","label":""}}]');
    });
});
//
describe('The evaluation 1', () => {
    it('is evaluate if (FALSE)', () => {
        let analyzer = new Analyzer('function foo(x, y, z){let a = x + 1;let b = a + y;let c = 0;if (b < z) {c = c + 5;return x + y + z + c;}}', [1, 2, 3]);
        analyzer.build();
        let cfg = new CFG('result', analyzer.nodes);
        cfg.build();

        // Check the nodes + edges
        assert.equal(JSON.stringify(cfg.elements), '[{"data":{"id":"n1","label":"a = x + 1\\nb = a + y\\nc = 0","stepIndex":1},"classes":"parent green"},{"data":{"id":"n8","label":"b < z","stepIndex":2},"classes":"diamond green"},{"data":{"id":"n2","label":"c = c + 5","stepIndex":3},"classes":"parent"},{"data":{"id":"n10","label":"return x + y + z + c","stepIndex":4},"classes":""},{"data":{"id":"n11","label":""},"classes":"ellipse green"}]');
        assert.equal(JSON.stringify(cfg.edges), '[{"data":{"source":"n1","target":"n8","label":""}},{"data":{"source":"n8","target":"n11","label":"T"}},{"data":{"source":"n8","target":"n2","label":"F"}},{"data":{"source":"n2","target":"n10","label":""}}]');
    });
    it('is evaluate if (TRUE)', () => {
        let analyzer = new Analyzer('function foo(x, y, z){let a = x + 1;let b = a + y;let c = 0;if (b < z) {c = c + 5;return x + y + z + c;}}', [1, 1, 4]);
        analyzer.build();
        let cfg = new CFG('result', analyzer.nodes);
        cfg.build();

        // Check the nodes + edges
        assert.equal(JSON.stringify(cfg.elements), '[{"data":{"id":"n1","label":"a = x + 1\\nb = a + y\\nc = 0","stepIndex":1},"classes":"parent green"},{"data":{"id":"n8","label":"b < z","stepIndex":2},"classes":"diamond green"},{"data":{"id":"n2","label":"c = c + 5","stepIndex":3},"classes":"parent green"},{"data":{"id":"n10","label":"return x + y + z + c","stepIndex":4},"classes":" green"},{"data":{"id":"n11","label":""},"classes":"ellipse green"}]');
        assert.equal(JSON.stringify(cfg.edges), '[{"data":{"source":"n1","target":"n8","label":""}},{"data":{"source":"n8","target":"n11","label":"F"}},{"data":{"source":"n8","target":"n2","label":"T"}},{"data":{"source":"n2","target":"n10","label":""}}]');
    });
});
//
describe('The evaluation 2', () => {
    it('is check if - else (FALSE)', () => {
        let analyzer = new Analyzer('function foo(x, y, z){let a = x + 1;let b = a + y;let c = 0;if (b < z) {c = c + 5;return x + y + z + c;} else {c = c + z + 5;return x + y + z + c;}}', [1, 2, 3]);
        analyzer.build();
        let cfg = new CFG('result', analyzer.nodes);
        cfg.build();

        // Check the nodes + edges
        assert.equal(JSON.stringify(cfg.elements), '[{"data":{"id":"n1","label":"a = x + 1\\nb = a + y\\nc = 0","stepIndex":1},"classes":"parent green"},{"data":{"id":"n8","label":"b < z","stepIndex":2},"classes":"diamond green"},{"data":{"id":"n2","label":"c = c + 5","stepIndex":3},"classes":"parent"},{"data":{"id":"n10","label":"return x + y + z + c","stepIndex":4},"classes":""},{"data":{"id":"n3","label":"c = c + z + 5","stepIndex":5},"classes":"parent green"},{"data":{"id":"n13","label":"return x + y + z + c","stepIndex":6},"classes":" green"},{"data":{"id":"n14","label":""},"classes":"ellipse green"}]');
        assert.equal(JSON.stringify(cfg.edges), '[{"data":{"source":"n1","target":"n8","label":""}},{"data":{"source":"n8","target":"n3","label":"T"}},{"data":{"source":"n8","target":"n2","label":"F"}},{"data":{"source":"n2","target":"n10","label":""}},{"data":{"source":"n3","target":"n13","label":""}}]');
    });
    it('is check if - else (TRUE)', () => {
        let analyzer = new Analyzer('function foo(x, y, z){let a = x + 1;let b = a + y;let c = 0;if (b < z) {c = c + 5;return x + y + z + c;} else {c = c + z + 5;return x + y + z + c;}}', [1, 2, 5]);
        analyzer.build();
        let cfg = new CFG('result', analyzer.nodes);
        cfg.build();

        // Check the nodes + edges
        assert.equal(JSON.stringify(cfg.elements), '[{"data":{"id":"n1","label":"a = x + 1\\nb = a + y\\nc = 0","stepIndex":1},"classes":"parent green"},{"data":{"id":"n8","label":"b < z","stepIndex":2},"classes":"diamond green"},{"data":{"id":"n2","label":"c = c + 5","stepIndex":3},"classes":"parent green"},{"data":{"id":"n10","label":"return x + y + z + c","stepIndex":4},"classes":" green"},{"data":{"id":"n3","label":"c = c + z + 5","stepIndex":5},"classes":"parent"},{"data":{"id":"n13","label":"return x + y + z + c","stepIndex":6},"classes":""},{"data":{"id":"n14","label":""},"classes":"ellipse green"}]');
        assert.equal(JSON.stringify(cfg.edges), '[{"data":{"source":"n1","target":"n8","label":""}},{"data":{"source":"n8","target":"n3","label":"F"}},{"data":{"source":"n8","target":"n2","label":"T"}},{"data":{"source":"n2","target":"n10","label":""}},{"data":{"source":"n3","target":"n13","label":""}}]');
    });
});
//
describe('The evaluation 3', () => {
    it('is check if - else if - else (FALSE)', () => {
        let analyzer = new Analyzer('function foo(x, y, z){let a = x + 1;let b = a + y;let c = 0;if (b < z) {c = c + 5;return x + y + z + c;} else if (b < z * 2) {c = c + x + 5;return x + y + z + c;} else {c = c + z + 5;return x + y + z + c;}}', [0, 5, 1]);
        analyzer.build();
        let cfg = new CFG('result', analyzer.nodes);
        cfg.build();

        // Check the nodes + edges
        assert.equal(JSON.stringify(cfg.elements), '[{"data":{"id":"n1","label":"a = x + 1\\nb = a + y\\nc = 0","stepIndex":1},"classes":"parent green"},{"data":{"id":"n8","label":"b < z","stepIndex":2},"classes":"diamond green"},{"data":{"id":"n2","label":"c = c + 5","stepIndex":3},"classes":"parent"},{"data":{"id":"n10","label":"return x + y + z + c","stepIndex":4},"classes":""},{"data":{"id":"n11","label":"b < z * 2","stepIndex":5},"classes":"diamond green"},{"data":{"id":"n3","label":"c = c + x + 5","stepIndex":6},"classes":"parent"},{"data":{"id":"n13","label":"return x + y + z + c","stepIndex":7},"classes":""},{"data":{"id":"n4","label":"c = c + z + 5","stepIndex":8},"classes":"parent green"},{"data":{"id":"n16","label":"return x + y + z + c","stepIndex":9},"classes":" green"},{"data":{"id":"n17","label":""},"classes":"ellipse green"}]');
        assert.equal(JSON.stringify(cfg.edges), '[{"data":{"source":"n1","target":"n8","label":""}},{"data":{"source":"n8","target":"n11","label":"T"}},{"data":{"source":"n8","target":"n2","label":"F"}},{"data":{"source":"n2","target":"n10","label":""}},{"data":{"source":"n11","target":"n4","label":"T"}},{"data":{"source":"n11","target":"n3","label":"F"}},{"data":{"source":"n3","target":"n13","label":""}},{"data":{"source":"n4","target":"n16","label":""}}]');
    });
    it('is check if - else if - else (TRUE)', () => {
        let analyzer = new Analyzer('function foo(x, y, z){let a = x + 1;let b = a + y;let c = 0;if (b < z) {c = c + 5;return x + y + z + c;} else if (b < z * 2) {c = c + x + 5;return x + y + z + c;} else {c = c + z + 5;return x + y + z + c;}}', [0, 1, 2]);
        analyzer.build();
        let cfg = new CFG('result', analyzer.nodes);
        cfg.build();

        // Check the nodes + edges
        assert.equal(JSON.stringify(cfg.elements), '[{"data":{"id":"n1","label":"a = x + 1\\nb = a + y\\nc = 0","stepIndex":1},"classes":"parent green"},{"data":{"id":"n8","label":"b < z","stepIndex":2},"classes":"diamond green"},{"data":{"id":"n2","label":"c = c + 5","stepIndex":3},"classes":"parent"},{"data":{"id":"n10","label":"return x + y + z + c","stepIndex":4},"classes":""},{"data":{"id":"n11","label":"b < z * 2","stepIndex":5},"classes":"diamond green"},{"data":{"id":"n3","label":"c = c + x + 5","stepIndex":6},"classes":"parent green"},{"data":{"id":"n13","label":"return x + y + z + c","stepIndex":7},"classes":" green"},{"data":{"id":"n4","label":"c = c + z + 5","stepIndex":8},"classes":"parent"},{"data":{"id":"n16","label":"return x + y + z + c","stepIndex":9},"classes":""},{"data":{"id":"n17","label":""},"classes":"ellipse green"}]');
        assert.equal(JSON.stringify(cfg.edges), '[{"data":{"source":"n1","target":"n8","label":""}},{"data":{"source":"n8","target":"n11","label":"T"}},{"data":{"source":"n8","target":"n2","label":"F"}},{"data":{"source":"n2","target":"n10","label":""}},{"data":{"source":"n11","target":"n4","label":"F"}},{"data":{"source":"n11","target":"n3","label":"T"}},{"data":{"source":"n3","target":"n13","label":""}},{"data":{"source":"n4","target":"n16","label":""}}]');
    });
    it('is check while (TRUE)', () => {
        let analyzer = new Analyzer('function foo(x, y, z){let a = x + 1;let b = a + y;let c = 0;while (a < z) {c = a + b;z = c * 2;}return z;}', [0, 1, 2]);
        analyzer.build();
        let cfg = new CFG('result', analyzer.nodes);
        cfg.build();

        // Check the nodes + edges
        assert.equal(JSON.stringify(cfg.elements), '[{"data":{"id":"n1","label":"a = x + 1\\nb = a + y\\nc = 0","stepIndex":1},"classes":"parent green"},{"data":{"id":"n8","label":"NULL","stepIndex":2},"classes":" green"},{"data":{"id":"n9","label":"a < z","stepIndex":3},"classes":"diamond green"},{"data":{"id":"n2","label":"c = a + b\\nz = c * 2","stepIndex":4},"classes":"parent green"},{"data":{"id":"n12","label":"return z","stepIndex":5},"classes":" green"}]');
        assert.equal(JSON.stringify(cfg.edges), '[{"data":{"source":"n1","target":"n8","label":""}},{"data":{"source":"n8","target":"n9","label":""}},{"data":{"source":"n9","target":"n12","label":"F"}},{"data":{"source":"n9","target":"n2","label":"T"}},{"data":{"source":"n2","target":"n8","label":""}}]');
    });
});