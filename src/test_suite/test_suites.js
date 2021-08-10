new TestSuite("test_suite_reporting",
    ["2 + 3", "5", "1st elt (source) evals to same as 2nd elt (expected) and the test passes."],
    ['similar(2.05, 2, 0.1)', "true", "tolerance of 0.1 permits 2.05 and 2 to be similar"],
    ["var foo = 4 + 1"],
    ["foo", "5", "The side effect of the above 'set up' test, sets foo. Foo's value is tested here."],
    ["foo = undefined", "undefined"],
    ['"hi" + " dexter"', '"hi dex"', "known failures are declared with this description string starting with 'known'."],
    ['foo961', '123', "This is an 'unknown failure' for demo purposes"],
    ['foo723', 'TestSuite.error', 'Tests with expected of TestSuite.error pass if the source errors.'],
    ['out(TestSuite.run("similarX"))', 'TestSuite.dont_care', "Run another test suite. This one errors because its not defined."]
)

new TestSuite("similar",
	["undefined", "undefined"],
    ["null", "null"],
    ["NaN",  "NaN"],
    ["similar(undefined, null)", "false"],
    ["true", "true"],
    ["false", "false"],
    ["similar(true, false)", "false"],
    ["similar(null, false)", "false"],
    ['"as" + "df"', '"asdf"'],
    ["0", "0"],
    ["3", "3"],
    ["2 + 3", "5"],
    ['similar("aa", "aab")', 'false'],
    ['similar(Math.max, Math.max)', "true"],
    ["similar(NaN, NaN)", "true"],
    ["similar(2, 3)", "false"],
    ["similar(2.0, 2)", "true"],
    ["similar(2.1, 2)", "false"],
    ["similar(2.1, 2, 0.1)", "true", "3rd arg tolerance is >= the difference between orig and expected value."],
    ["similar(2.1, 2, 2)", "true"],
    ["similar(2.1, 2, 0.09)", "false", "tolerance too small to accommodate the difference"],
    ["similar(10, 9, 2)", "true"],
    ["similar(10, 9, 2, true)", "false", "4th arg is 'tolerance_is_percent' so its 2% tolerance, which is less than the 10% difference, so 2 args are NOT similar."],
    ["similar(10, 9, 20, true)", "true"],
    ["[3, 4]", "[3, 4]"],
    ["similar([3, 4], [3, 88])", "false"],
    ["similar([3, 4], [3, 4, 4])", "false"],
    ["[3, [4, 5]]", "[3, [4, 5]]"],
    ['similar({a:["aa"]}, {a:["aa"]})', "true"],
    ["var foo = []", "undefined"],
    ["foo.push(foo)"],
    ["foo.length", "1"],
    ["foo", "foo", "These circular arrays are similar"],
    ["var bar = []", "undefined"],
    ["bar.push(bar)"],
    ["bar.length", "1"],
    ["foo", "bar", "These circular arrays are similar"]
)

new TestSuite("number_similarity",
    ["number_similarity(3, 3)", "1"],
    ["number_similarity(0, 0)", "1"],
    ["number_similarity(0, 1)", "0"],
    ["number_similarity(1, 0)", "0"],
    ["number_similarity(1, 10)", "0.09999999999999998"],
    ["number_similarity(10, 1)", "0.09999999999999998"],
    ["number_similarity(10, 0)", "0"],
    ["number_similarity(4, 5)", "0.8"],
    ["number_similarity(4, 5, 0, 10)", "0.9"],
    ["number_similarity(4, 5, 4, 5)", "0"],
    ["number_similarity(4, 5, 4, 10)", "0.8333333333333334"],
    ["number_similarity(0.5, 0.7, 0, 1)", "0.8"],
    ["number_similarity(-1, -2)", "0.5"],
    ["number_similarity(-5, -5)", "1"],
    ["number_similarity(-5, 0, -5, 0)", "0"],
    ["number_similarity(5, 1)",   "0.19999999999999996"],
    ["number_similarity(-5, -1)", "0.19999999999999996"],
    ["number_similarity(-5, 1)", "0"]

)

new TestSuite("flatten",
	["flatten(2)", "[2]"],
	["flatten([3, 2, 1])", "[3, 2, 1]"],
	["flatten([3, [2, 22, 222], 1])", "[3, 2, 22, 222, 1]"],
	["flatten([3, [2, 22, 222], [[[1, 10]]]])", "[3, 2, 22, 222, 1, 10]"],
	["flatten([3, [2, [1], 0], -1])", "[3, 2, 1, 0, -1]"]
)

new TestSuite("obj_sys_is_new_object",
	['out("obj_sys_is_new_object")'],
	["Object.isNewObject(undefined)", "false"],
	["Object.isNewObject(null)", "false"],
	["Object.isNewObject(123)", "false"],
	['Object.isNewObject("abc")', "false"],
	["Object.isNewObject([])", "false"],
	["Object.isNewObject({a:1})", "false"],
	["Object.isNewObject(Date)", "false"],
	["Object.isNewObject(new Date())", "false"],
	["Root", "Root"],
	["Root.objectPath()", '"Root"'],
	["Object.isNewObject(Root)", "true"],
	["Root.name", '"Root"']
)

new TestSuite("obj_sys_paths",
	['out("obj_sys_paths")'],
	['newObject({name:"testpart", color: "white", weight:1, finished:true})'],
	["Object.isNewObject(Root.testpart)", "true"],
	["Root.testpart.name", '"testpart"'],
	["Root.testpart.color", '"white"'],
	['newObject({prototype:Root.testpart, name:"bolt", color:"gray", diameter:4})'],
	["Root.testpart.bolt.diameter", "4"],
	["Root.testpart.diameter", "undefined"],
	["Root.testpart.bolt.color", '"gray"', "directly from bolt"],
	["Root.testpart.bolt.weight", "1", "inherited from testpart"],
	["Root.testpart.bolt.weight = 2", "2", "shadow the property from testpart"],
	["Root.testpart.bolt.weight", "2", "now directly from bolt"],
	["Root.testpart.weight", "1", "not modified"],
	['newObject({prototype:Root.testpart.bolt, name:"smallbolt", diameter:2, color:undefined})'],
	["Root.testpart.bolt.smallbolt.diameter", "2", "shadows diameter"],
	["Root.testpart.bolt.smallbolt.weight", "2", "inherit from 1 levels up"],
	["Root.testpart.bolt.smallbolt.color", "undefined", "undefined blocks inheritance"],
	["Root.testpart.bolt.smallbolt.objectPath()", '"Root.testpart.bolt.smallbolt"']
)

new TestSuite("obj_sys_subObjects",
	['out("obj_sys_subObjects")'],
	['newObject({name:"testpart", color: "white", weight:1, finished:true})'],
	['newObject({prototype:Root.testpart, name:"bolt", color:"gray", diameter:4})'],
	['newObject({prototype:Root.testpart.bolt, name:"smallbolt", diameter:2, color:undefined})'],
	["Root.testpart.isSubObject()", "true"],
	["Root.isSubObject()", "false"],
	["Root.testpart.bolt.smallbolt.isSubObject(Root.testpart.bolt)", "true"],
	["Root.testpart.bolt.smallbolt.isSubObject(Root.testpart)", "false", "subobject only goes exactly 1 level up"],
	["Root.testpart.isSubObject(Root.testpart.bolt.smallbolt)", "false"],
	["Root.testpart.isSubObject(Root)", "true"],
	['newObject({prototype:Root.testpart, name:"screw", diameter:2, color:"gold"})'],
	["Root.testpart.subObjects().length", "2"],
	["same_elts(Root.testpart.subObjects(), [Root.testpart.bolt, Root.testpart.screw])", "true"],
	["same_elts(Root.testpart.screw.subObjects(), [])", "true"],
	["Root.isA(Root)", "true"],
	["Root.testpart.isA(Root)", "true"],
	["Root.testpart.isA(Root.testpart)", "true"],
	["Root.testpart.bolt.smallbolt.isA(Root.testpart)", "true"],
	["Root.testpart.bolt.smallbolt.isA(Root.testpart.bolt)", "true"],
	["Root.testpart.bolt.smallbolt.isA(Root)", "true"]
)

new TestSuite("obj_sys_siblings",
	['out("obj_sys_siblings")'],
	["same_elts(Root.siblings(), [])", "true"],
	["same_elts(Root.siblings(false), [])", "true"],
	["same_elts(Root.siblings(true), [Root])", "true"],
	['newObject({name:"testpart", color: "white", weight:1, finished:true})'],
	['newObject({prototype:Root.testpart, name:"bolt", color:"gray", diameter:4})'],
	['newObject({prototype:Root.testpart.bolt, name:"smallbolt", diameter:2, color:undefined})'],
	['newObject({prototype:Root.testpart, name:"screw", diameter:2, color:"gold"})'],
	["same_elts(Root.testpart.bolt.siblings(), [Root.testpart.screw])", "true"],
	["same_elts(Root.testpart.bolt.siblings(true), [Root.testpart.bolt, Root.testpart.screw])", "true"],
	["Object.areSiblings()", "true"],
	["Object.areSiblings(Root)", "true"],
	["Object.areSiblings(Root.testpart.bolt, Root.testpart.screw)", "true"],
	["Object.areSiblings(Root.testpart.bolt, Root.testpart.screw, Root.testpart)", "false"]
)

new TestSuite("inheriting_methods",
	['out("inheriting_methods")'],
	[`newObject({name: "testpart",
                 color: "white", 
                 weight: 3,
                 doubleweight: function(){ return this.weight * 2}
                 })`],
	['newObject({prototype:Root.testpart, name:"bolt", color:"gray", diameter:4})'],
	['newObject({prototype:Root.testpart.bolt, name:"smallbolt", color:"gray", weight:0.4})'],
	["Root.testpart.doubleweight()", "6"],
	["Root.testpart.bolt.doubleweight()", "6", "get both the method and weight value from testpart"],
	["Root.testpart.bolt.smallbolt.doubleweight()", "0.8", "smallbolt shadows testpart's weight with a weight of its own, that is used instead by the doubleweight fn"]
)

new TestSuite("obj_sys_normal_keys",
	[`newObject({name: "vehicle",  color: "white", weight: "medium",
		constructor: function() {
	this.weight = "very " + this.weight
	out("In constructor vehicle: " +
		" with: " + this.color +
		" and "   + this.weight)} })`],
	["Root.normal_keys()", "[]"],
	["Root.vehicle.normal_keys()", '["color", "weight"]'],
	["Root.vehicle.normal_keys(true)", '["color", "weight"]'],
	["Root.vehicle.normal_keys(true, true)", '["color", "weight", "constructor"]'],
	["Root.vehicle.normal_keys(true, true, true)", '["color", "weight", "constructor"]'],
	["Root.vehicle.normal_keys(true, true, true, true)", '["name", "color", "weight", "constructor", "prototype"]']
)

new TestSuite("obj_sys_sourceCode",
    ["Root.sourceCode()", '"Root"'],
    ['newObject({name:"testpart", color: "white", weight:1, finished:true})'],
    ['newObject({prototype:Root.testpart, name:"bolt", color:"gray", diameter:4})'],
    ['newObject({prototype:Root.testpart.bolt, name:"smallbolt", diameter:2, color:undefined})'],
    ['eval(Root.testpart.bolt.smallbolt.sourceCode())', "Root.testpart.bolt.smallbolt"],
    ["Root.testpart.bolt.smallbolt.sourceCode()",
        '`newObject({\n  prototype: Root.testpart.bolt,\n  name: "smallbolt",\n  diameter: 2,\n  color: undefined\n})\n`'
    ]
)

new TestSuite("obj_sys_js_fns_on_new_objects",
	['out("obj_sys_js_fns_on_new_objects")'],
	['newObject({name:"testpart", color: "white", weight:1, finished:true})'],
	['newObject({prototype:Root.testpart, name:"bolt", color:"gray", diameter:4})'],
	['newObject({prototype:Root.testpart.bolt, name:"smallbolt", color:undefined, diameter:2})'],
	["Root.testpart.bolt instanceof bolt", "TestSuite.error", "js instanceof compares to a CLASS not a prototype."],
	["Object.keys(Root.testpart.bolt).length", "5"],
	["Object.keys(Root.testpart.bolt)", '["name", "color", "diameter", "prototype", "smallbolt"]'],
	["Object.getOwnPropertyNames(Root.testpart.bolt)", '["name", "color", "diameter", "prototype", "smallbolt"]', "same as keys"],
	["Object.getPrototypeOf(Root.testpart.bolt)", "Root.testpart"],
	["Root.testpart.isPrototypeOf(Root.testpart)", "false"],
	["Root.testpart.isPrototypeOf(Root.testpart.bolt)", "true", "different from isA which is true when passed the same value for the 2 args"],
	["Root.testpart.isPrototypeOf(Root.testpart.bolt.smallbolt)", "true", "isA with args reversed"],
	['Root.testpart.bolt.hasOwnProperty("color")', "true"],
	['Root.testpart.bolt.hasOwnProperty("weight")', "false"],
	["Root.testpart.bolt.trash23", "undefined"],
	["Root.testpart.bolt.smallbolt.color", "undefined", "So a prop with an undefined value blocks inheritance. Fine but good to know."]
)

new TestSuite("obj_sys_js_fns_on_new_objects2",
	['out("obj_sys_js_fns_on_new_objects2")'],
	['newObject({ name: "test_thing",  color: "blue", weight: 85})'],
	["Object.values(Root.test_thing)", '["test_thing", "blue", 85, Root]'],
	["Object.entries(Root.test_thing)", '[["name", "test_thing"], ["color", "blue"], ["weight", 85], ["prototype", Root]]'],
	["Object.is(Root.test_thing, Root.test_thing)", "true"],
	["Object.is(Root.test_thing, Root)", "false"],
	["Root.test_thing.valueOf()", "Root.test_thing"],
	["Object.keys(Object.getPrototypeOf(Root))", "Object.keys({})"],
	["Root.test_thing.toString()", "'[object Object]'"]
)

new TestSuite("obj_sys_js_leaf",
    ['newObject({name: "animal"})'],
    ["Root.isLeafObject()", "false"],
    ["Root.animal.isLeafObject()", "true"],
    ['Root.leafObjectNamed("junk747")', "null"],
    ['Root.leafObjectNamed("animal")', "Root.animal"]
)

new TestSuite("version_functions",
    ['version_equal("0.1.2")', "false"],
    ['version_equal("2.1.2", "2.1.2")', "true"],
    ['version_equal("2.1.2", "2.1.3")', "false"],
    ['version_less_than("0.1.2")', "true"],
    ['version_less_than("100.1.2")', "false"],
    ['version_less_than("0.1.2", "0.1.2")', "false"],
    ['version_more_than("0.1.2")', "false"],
    ['version_more_than("100.1.2")', "true"],
    ['version_more_than("0.1.2", "0.1.2")', "false"],
    ['dde_version_between("0.1.0", "100.1.1", "boolean")', "true"],
    ['dde_version_between("0.1.0", "0.3.1", "boolean")', "false"],
    ['dde_version_between("1.1.0", null, "boolean")', "true"],
    ['dde_version_between(null, "100.0.0", "boolean")', "true"])

new TestSuite("arcsec",
    ["[3600, 7200].arcsec()", "[1, 2]"],
    ['make_ins("a", 3600, 7200).arcsec()', '[undefined, undefined, undefined, undefined, "a", 1, 2]'],
    ['make_ins("a", 3600, 7200, 10800, 14400, 18000).arcsec()',
        '[undefined, undefined, undefined, undefined, "a", 1, 2, 3, 4, 5]'],
    ['make_ins("P", 3600, 7200, 10800, 14400, 18000).arcsec()',
        '[undefined, undefined, undefined, undefined, "P", 1, 2, 3, 4, 5]']
)

new TestSuite("micron",
    ['[1000000, 2000000, "junk"].micron()', "[1, 2, 'junk']"],
    ["[].micron()", "[]"]
)

new TestSuite("csv",
    ['var spreadsheet_data = [["head one", "head two"], [10, 20], [100, 200]]'],
    ["array_to_csv(spreadsheet_data)", '`head one,head two\n10,20\n100,200`'],
    ['csv_to_array(`head one,head two\n10,20\n100,200`)',
        '[["head one", "head two"], [10, 20], [100, 200]]'],
    ['csv_to_array(array_to_csv(spreadsheet_data))', 'spreadsheet_data']
)

new TestSuite("format_number",
    ["format_number(123.45678)", '"    123.457"'],
    ["format_number(12345.45678)", '"  12345.457"'],
    ["format_number(1234567.45678)", '"1234567.457"'],
    ["format_number(-123.45678)", '"   -123.457"'],
    ["format_number(123.45678, 4, 2)", '"  123.46"'],
    ["format_number(123.45678, 4, 2, false)", '" 123.46"', "with no space for neg, we just add 1 space to make 4 before decimal."],
    ["format_number(123.456, 4, 0)", '"  123"'],
    ["format_number(123.987, 3, 2, false)", '"123.99"', "rounded on purpose"],
    ["format_number(123.987, 3, 0, false)", '"124"', "rounded on purpose."],
    ["format_number(123.987, 2, 0, false)", '"124"', "goes over the limit of 2 before decimal point by design. 2 is a min char count, not a max."]
)

new TestSuite("is_integer",
    ["is_integer(23)",   "true"],
    ["is_integer(-5)",   "true"],
    ["is_integer(1.5)",  "false"],
    ['is_integer("45")', "false"],
    ["is_integer([])",   "false"]
)

new TestSuite("Robot.is_oplet",
    ["Robot.is_oplet()", "false"],
    ["Robot.is_oplet(123)", "false"],
    ['Robot.is_oplet("a")', "true"],
    ['Robot.is_oplet("Y")', "true"],
    ['Robot.is_oplet("Y", true)', "false"],
    ['Robot.is_oplet("Y", false)', "true"]
)

new TestSuite("make_ins_arrays",
    ['make_ins_arrays("a", [[1, 2, 3, 4, 5]])', 
     '[[undefined, undefined, undefined, undefined, "a", 1, 2, 3, 4, 5]]'],
    ['make_ins_arrays("Y", [[1, 2, 3, 4, 5]])', 
     '[[undefined, undefined, undefined, undefined, "Y", 1, 2, 3, 4, 5]]'],
    ['make_ins_arrays("a", [[1, 2, 3, 4, 5], [6, 2, 3, 4, 5]])', 
     `[[undefined, undefined, undefined, undefined, "a", 1, 2, 3, 4, 5 ],
       [undefined, undefined, undefined, undefined, "a", 6, 2, 3, 4, 5]]`],
    ['make_ins_arrays("a", [["b", 1, 2, 3, 4, 5], [6, 2, 3, 4, 5]])', 
     `[[undefined, undefined, undefined, undefined, "b", 1, 2, 3, 4, 5],
       [undefined, undefined, undefined, undefined, "a", 6, 2, 3, 4, 5]]`
    ],
    ['make_ins_arrays(undefined, [["b", 1, 2, 3, 4, 5], [6, 2, 3, 4, 5]])', 
     "TestSuite.error"],
    ['make_ins_arrays(undefined, [["b", 1, 2, 3, 4, 5], ["a", 6, 2, 3, 4, 5]])', 
     `[[undefined, undefined, undefined, undefined, "b", 1, 2, 3, 4, 5],
       [undefined, undefined, undefined, undefined, "a", 6, 2, 3, 4, 5]]`]
)

new TestSuite("Instruction.is_do_list_item",
    ["Instruction.is_do_list_item(4)", "false"],
    ['Instruction.is_do_list_item("abc")', "true"],
    ["Instruction.is_do_list_item(true)", "false"],
    ["Instruction.is_do_list_item({a: 1})", "false"],
    ["Instruction.is_do_list_item([5, 6])", "true"],
    ["Instruction.is_do_list_item(null)", "true"],
    ["Instruction.is_do_list_item(undefined)", "true"],
    ["Instruction.is_do_list_item(Control.loop())", "true"],
    ['Instruction.is_do_list_item(make_ins("g"))', "true"],
    ["var my_genxx = function*(){ yield 5 }"],
    ["Instruction.is_do_list_item(my_genxx())", "true"],
    ["Instruction.is_do_list_item(function() { return 2 })", "true"],
    ['Instruction.is_do_list_item(new Job({name: "job_4235"}))', "true"],
    ["Instruction.is_do_list_item([])", "true"],
    ["Instruction.is_do_list_item([null, null])", "true"],
    ["Instruction.is_do_list_item([null, [null, []]])", "true"],
    ["Instruction.is_do_list_item(['a', 10, 20, 30])", "true"],
    ["Instruction.is_do_list_item(['@', 90, 20, 30])", "true"]
)

new TestSuite("Instruction.is_empty_nested_array",
    ["Instruction.is_empty_nested_array(123)", "false"],
    ['Instruction.is_empty_nested_array("junk")', "false"],
    ["Instruction.is_empty_nested_array([])", "true"],
    ["Instruction.is_empty_nested_array([123])", "false"],
    ["Instruction.is_empty_nested_array([[], []])", "true"],
    ["Instruction.is_empty_nested_array([[], [[[], []]]])", "true"],
    ["Instruction.is_empty_nested_array([[], [[[], [321]]]])", "false"]
)

new TestSuite("Instruction.is_no_op_instruction",
    ["Instruction.is_no_op_instruction(undefined)", "true"],
    ["Instruction.is_no_op_instruction(null)", "true"],
    ["Instruction.is_no_op_instruction([])", "true"],
    ["Instruction.is_no_op_instruction([[], [[]]])", "true"],
    ["Instruction.is_no_op_instruction(123)", "false"],
    ["Instruction.is_no_op_instruction([[], [[true]]])", "false"],
)

new TestSuite("PatchDDE.patch_until",
    ['PatchDDE.patch_until("1 + 2", "0.0.0", "4 + 5")', "9"],
    ['PatchDDE.patch_until("1 + 2", dde_version, "4 + 5")', "9"],
    ['PatchDDE.patch_until("1 + 2", "1000.0.0", "4 + 5")', "3"],
    ['PatchDDE.patch_until("1 + 2", "1000", "4 + 5")', "TestSuite.error"],
    ['PatchDDE.patch_until("1 + 2", 1000, "4 + 5")', "TestSuite.error"]
)

new TestSuite("trim_comments_from_front",
    ['trim_comments_from_front("abc")', '"abc"'],
    ['trim_comments_from_front("  def")', '"def"'],
    ['trim_comments_from_front("  //comment\\ndef")', '"def"'],
    ['trim_comments_from_front("  //comment\\n  ghi ")', '"ghi "'],
    ['trim_comments_from_front("  //comment\\n  //2nd com\\njkl")', '"jkl"'],
    ['trim_comments_from_front("/*com1*/mno")', '"mno"'],
    ['trim_comments_from_front("/*com1*/  //com2\\n /*com3*/pqr")', '"pqr"']
)

new TestSuite("Kin.predict_move_dur",
    ["Kin.predict_move_dur([0,0,0,0,0], [20,30,40,0,0])", "1.3333333333333333"],
    ["Kin.predict_move_dur([-10,0,0,0,0], [-60,30,40,0,0])", "1.6666666666666667"]
)