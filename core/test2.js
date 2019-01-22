
function test2fn(call_test1=false){
    console.log("in test2fn with: " + call_test1)
    console.log("in test2fn with testclass1.stat_prop: " + testclass1.stat_prop)
    testclass1.stat_prop = 345
    console.log("in test2fn after setting testclass1.stat_prop: " + testclass1.stat_prop)
    if(call_test1) { test1fn(false) }
}

module.exports.test2fn = test2fn

const {test1fn, testclass1} = require("./test1.js")