const LiteGraph = require("litegraph.js").LiteGraph; //needs to be at top of file

/* making new node types
See examples https://www.javascripting.com/view/litegraph-js
node constructor class
*/
function MyAndNode() {
    this.addInput("A","number");
    this.addInput("B","number");
    this.addOutput("A&B","number");
    this.size = [80, 40] //width and height
    this.properties = { precision: 1 };
}
MyAndNode.title = "and"; //name to show
MyAndNode.prototype.onExecute = function() {
    var A = this.getInputData(0);
    if( A === undefined )
        A = 0;
    var B = this.getInputData(1);
    if( B === undefined )
        B = 0;
    this.setOutputData( 0, A & B );
}
LiteGraph.registerNodeType("basic/and", MyAndNode ); //register in the system
HCA.palette_objects.push(["basic/and"])



function MyOrNode() {
    this.addInput("A","number");
    this.addInput("B","number");
    this.addOutput("A|B","number");
    this.size = [80, 40] //width and height
    this.properties = { precision: 1 };
}
MyOrNode.title = "or"; //name to show
MyOrNode.prototype.onExecute = function() {
    var A = this.getInputData(0);
    if( A === undefined )
        A = 0;
    var B = this.getInputData(1);
    if( B === undefined )
        B = 0;
    this.setOutputData( 0, A | B );
}
LiteGraph.registerNodeType("basic/or", MyOrNode ); //register in the system
HCA.palette_objects.push(["basic/or"])


function MyInvertNode() {
    this.addInput("A","number");
    this.addOutput("!A","number");
    this.size = [80, 20] //width and height
    this.properties = { precision: 1 };
}
MyInvertNode.title = "invert"; //name to show
MyInvertNode.prototype.onExecute = function() {
    var A = this.getInputData(0);
    if( A === undefined )
        A = 0;
    let out = ((A === 1)  ? 0 : 1)
    this.setOutputData(0, out);
}
LiteGraph.registerNodeType("basic/invert", MyInvertNode); //register in the system
HCA.palette_objects.push(["basic/invert"])