
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

