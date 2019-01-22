console.log("top of test1.js")

class testclass1{}

testclass1.stat_prop = 34

function test1fn(call_test2=false){
    console.log("in test1fn with call_test2: " + call_test2)
    console.log("in test1fn with old testclass1.stat_prop: " + testclass1.stat_prop)
    testclass1.stat_prop = 123
    console.log("in test1fn with new testclass1.stat_prop: " + testclass1.stat_prop)
    if(call_test2) { test2fn(true) }
}

module.exports.test1fn    = test1fn
module.exports.testclass1 = testclass1

const {test2fn} = require("./test2.js")

test1fn(true)