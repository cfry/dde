import "./test_suite.js" //must be here as TestSuite must be defined before loading the below

new TestSuite("['Utils.is_whitespace",
    ['Utils.is_whitespace("")', "true"],
    ['Utils.is_whitespace(" ")', "true"],
    ['Utils.is_whitespace("\t")', "true"],
    ['Utils.is_whitespace("  \t  ")', "true"],
    ['Utils.is_whitespace("z")', "false"],
    ['Utils.is_whitespace(" q ")', "false"]
)

new TestSuite("['Utils.is_comment",
    ['Utils.is_comment("")', "true"],
    ['Utils.is_comment("  \t ")', "true"],
    ['Utils.is_comment("//abc")', "true"],
    ['Utils.is_comment("  //zyx ")', "true"],
    ['Utils.is_comment(" /*comm1*/")', "true"],
    ['Utils.is_comment("  /*com1*/ ff")', "false"]
)

new TestSuite("Utils.string_to_seconds",
    ["Utils.string_to_seconds(12)", "12"],
    ["Utils.string_to_seconds('12.3')", "12.3"],
    ["Utils.string_to_seconds('1:23')", "83"],
    ["Utils.string_to_seconds('1:23.5')", "83.5"],
    ["Utils.string_to_seconds('1:2:34')", "3694"]
)

new TestSuite("Utils.is_string_base64",
    ['Utils.is_string_base64("abc=")',   "true"],
    ['Utils.is_string_base64("abc")',    "false"],
    ['Utils.is_string_base64(null)',     "false"],
    ['Utils.is_string_base64(37)',       "false"]
    //['Utils.is_string_base64("abc=\n")', "false"], //causes error in ts, probably due to nested literla string with newline
    // ['Utils.is_string_base64("abc=\n", true)', "true"]
)




