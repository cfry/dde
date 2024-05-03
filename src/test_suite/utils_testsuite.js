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

new TestSuite("Utils.is_array_of_numbers",
    ["Utils.is_array_of_numbers([4, 5])", "true"],
    ["Utils.is_array_of_numbers([4, 5, Number.NaN])", "false"],
    ['Utils.is_array_of_numbers([4, 5, "x"])', "false"],
    ["Utils.is_array_of_numbers([4, 5], 2)", "true"],
    ["Utils.is_array_of_numbers([4, 5], 3)", "false"],
    ["Utils.is_array_of_numbers([4, 5], 0)", "false"],
    ["Utils.is_array_of_numbers([], 0)", "true"],
    ["Utils.is_array_of_numbers([10, 20], null, 0, 30)", "true"],
    ["Utils.is_array_of_numbers([10, 20], null, 0, 5)", "false"],
    ["Utils.is_array_of_numbers([10, 20], null, 15, 30)", "false"]
)

new TestSuite("Utils.starts_with_one_of",
    ['Utils.starts_with_one_of("green", ["blue", "gre"])', '"gre"'],
    ['Utils.starts_with_one_of("purple", ["black"])', "false"],
)

new TestSuite("Utils.starts_with_one_of_and_tail",
    ['Utils.starts_with_one_of_and_tail("abcde", ["abc", "def"])', '["abc", "de"]'],
    ['Utils.starts_with_one_of_and_tail("abc", ["abc", "def"])', '["abc", ""]'],
    ['Utils.starts_with_one_of_and_tail("abcdefgh", ["abc", "abcdef"])', '["abcdef", "gh"]'],
    ['Utils.starts_with_one_of_and_tail(" abcdefgh", ["abc", "abcdef"], false)', "[false, false]"],
    ['Utils.starts_with_one_of_and_tail(" abcdefgh", ["abc", "abcdef"])', "[false, false]"],
    ['Utils.starts_with_one_of_and_tail(" abcdefgh", ["abc", "abcdef"], true)', '["abcdef", "gh"]'],
    ['Utils.starts_with_one_of_and_tail(" this is a bust.", ["this", "this is"])', "[false, false]"],
    ['Utils.starts_with_one_of_and_tail(" this is a bust.", ["this", "this is"], true)', '["this is", "a bust."]']
)

new TestSuite("Utils.separate_head_and_tail",
    ['Utils.separate_head_and_tail("")', "null"],
    ['Utils.separate_head_and_tail("abc")', "null"],
    ['Utils.separate_head_and_tail("first second")', '["first", "second", " "]'],
    ['Utils.separate_head_and_tail("first  second")', '["first", " second", " "]'],
    ['Utils.separate_head_and_tail("first  second", undefined, true)', '["first", "second", " "]'],
    ['Utils.separate_head_and_tail("first ,second", [",", " "])', '["first", ",second", " "]'],
    [`Utils.separate_head_and_tail("dark green, is not pretty", [",", " "], true, true)`, '["dark green", "is not pretty", ","]']
    // errors but shouldnt ['Utils.separate_head_and_tail("first\nsecond", ["\n"])', '["first", "second", "\n"]']
    // errors but shouldnt [`Utils.separate_head_and_tail("dark green ,is not pretty", [",", " "], true, true)` , `["dark green", "is not pretty", ","]`],

)




