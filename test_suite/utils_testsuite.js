
new TestSuite("['is_whitespace",
    ['is_whitespace("")', "true"],
    ['is_whitespace(" ")', "true"],
    ['is_whitespace("\t")', "true"],
    ['is_whitespace("  \t  ")', "true"],
    ['is_whitespace("z")', "false"],
    ['is_whitespace(" q ")', "false"]
)

new TestSuite("['is_comment",
    ['is_comment("")', "true"],
    ['is_comment("  \t ")', "true"],
    ['is_comment("//abc")', "true"],
    ['is_comment("  //zyx ")', "true"],
    ['is_comment(" /*comm1*/")', "true"],
    ['is_comment("  /*com1*/ ff")', "false"]
)

new TestSuite("string_to_seconds",
    ["string_to_seconds(12)", "12"],
    ["string_to_seconds('12.3')", "12.3"],
    ["string_to_seconds('1:23')", "83"],
    ["string_to_seconds('1:23.5')", "83.5"],
    ["string_to_seconds('1:2:34')", "3694"]
)

