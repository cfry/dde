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

new TestSuite("Utils.string_to_number_smart",
    ["Utils.string_to_number_smart(123)", "123"],
    ["Utils.string_to_number_smart(123.4)", "123.4"],
    ['Utils.string_to_number_smart("1239")', "1239"],
    ['Utils.string_to_number_smart("123.9")', "123.9"],
    ['Utils.string_to_number_smart("qaz")', "false"],
    ['Utils.string_to_number_smart("12qwe")', "false"],
    ['Utils.string_to_number_smart("aa43")', "false"],
    ['Utils.string_to_number_smart("43K")', "43000"],
    ['Utils.string_to_number_smart("43M")', "43000000"],
    ['Utils.string_to_number_smart("7B")', "7000000000"],
    ['Utils.string_to_number_smart("7.2B")', "7200000000"],
    ['Utils.string_to_number_smart("2T")', "2000000000000"],
    ['Utils.string_to_number_smart("433X")', "false"],
    ['Utils.string_to_number_smart("-432")', "-432"],
    ['Utils.string_to_number_smart("+433")', "433"],
    ['Utils.string_to_number_smart("$433")', "false"],
    ['Utils.string_to_number_smart("433k")', "false"],
    ['Utils.string_to_number_smart("433,127")', "433127"],
    ['Utils.string_to_number_smart("432.")', "432"],
    ['Utils.string_to_number_smart("  434 ")', "434"]
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
    ['Utils.separate_head_and_tail("")', '["", "", ""]'],
    ['Utils.separate_head_and_tail("abc")', '["abc", "", ""]'],
    ['Utils.separate_head_and_tail("first second")', '["first", "second", " "]'],
    ['Utils.separate_head_and_tail("first  second")', '["first", " second", " "]'],
    ['Utils.separate_head_and_tail("first  second", undefined, true)', '["first", "second", " "]'],
    ['Utils.separate_head_and_tail("first ,second", [",", " "])', '["first", ",second", " "]'],
    ['Utils.separate_head_and_tail(`first\nsecond`, [`\n`])', '["first", "second", `\n`]'],
    [`Utils.separate_head_and_tail("dark green ,is not pretty", [",", " "], true, true)` , `["dark green", "is not pretty", ","]`]
)
new TestSuite("Utils.has_first_word",
    ['Utils.has_first_word("xy", "abc")', "false"],
    ['Utils.has_first_word("abcdef", "abc")', "false"],
    ['Utils.has_first_word("abc def", "abc")', "true"],
    ['Utils.has_first_word(`abc\ndef`, "abc")', "true"],
    ['Utils.has_first_word(`abc\ndef`, ["junk", "abc"])', "true"],
    ['Utils.has_first_word("xy", "abc")', "false"]
)




