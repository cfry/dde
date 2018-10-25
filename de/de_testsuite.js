new TestSuite("DE comparison",
    ['DE.de_to_js("4 less than with 67.")', '"(4 < 67)"'],
    ['DE.de_to_js("4 more than with 67.")', '"(4 > 67)"'],
    ['DE.de_to_js("44 equals with 67.")', '"(44 == 67)"'],
    ['DE.de_to_js("44 not equals with 67.")', '"(44 != 67)"'],
    ['DE.de_to_js("44 less than or equals with 67.")', "(44 <= 67)"],
    ['DE.de_to_js("47 more than or equals with 68.")', '"(47 >= 68)"'],
    ['DE.de_to_js("45 same as with 46.")', '"(45 === 46)"'],
    ['DE.de_to_js("45 not same as with 46.")', '"(45 !== 46)"']
)

new TestSuite("DE arithmetic",
    ['DE.de_to_js("45 plus with 46.")', '"(45 + 46)"'],
    ['DE.de_to_js("45 minus with 46, 47, 48.")', '"(45 + 46 + 47 + 48)"'],
    ['DE.de_to_js("45 times with 46 and 47.")', '"(45 * 46 * 47)"'],
	['DE.de_to_js("45 divide with 9.")', '"(45 / 9)"'],
    ['DE.de_to_js("45 remainder with 10.")', '"(45 % 10)"'],
    ['DE.de_to_js("2 to the power of with 3.")', '"(2 ** 3)"']
)

   new TestSuite("DE logic",
    ['DE.de_to_js("all of with true, false.")', '"(true && true && false)"']
)





parser.parse("4 less than with 67, 78.")
parser.parse("make Array with 4 and 5.")
parser.parse("make Array with 4.")
parser.parse("make array with.")
parser.parse("joe launch with 123, foo bar with., 456.")
parser.parse("joe launch with 123, 456.")
parser.parse("rocket/x15 launch with 123.")
parser.parse("joe launch with nothing.")
parser.parse("joe launch with.")
parser.parse("you launch with 123 and 456.")
parser.parse("you launch with 123, 456.")

parser.parse("joe launch with size of 123 and weight of 56.")
parser.parse("You launch with 123.")

parser.parse("launch with 123.")
parser.parse("launch with nothing.")
parser.parse("launch with.")

parser.parse("1234(some comment)")
parser.parse("1234  (some comment)")
parser.parse("(some comment)1234")
parser.parse("(some comment)   1234")



parser.parse("aa/bb/cc")
parser.parse("nothing")
parser.parse("xy23")
parser.parse("xy")
parser.parse("x")
parser.parse("234")
parser.parse("-234")
parser.parse("+234")
parser.parse("234.56") //bug
parser.parse("-234.56")

or   "one of with true, false."
and  "all of with true, 17"
+    "2 plus with 4, 5"  or maybe: 2 + with 3.  shorter and pretty each 
-    "2 minus with 1"              2 - with 3, 4.
*    "3 times with 4"              2 * with 3, 4.
/    "3 divide with 5"             2 / with 3.
2 less than with 3.  // note that "2 < 3 < 4" doesen't error and returns true, but
                     // 2 < 1 < 4 also returns true. Yuck! The comparators only take 2 args
                     //practically. Thnkk of it like 2 < 3 returns a boolean,
                     //then we've have true < 4  which doesn't make much sense.
                 
                    

new Job({name: "j2",
        do_list: [Dexter.move_all_joints([0, 0, 0, 0, 0]), //angles
                  Dexter.move_to([0, 0.5, 0.075],     //xyz
                                 [0, 0, -1],          //J5_direction
                                 Dexter.RIGHT_UP_OUT) //config
                 ]})



make a Job with name of "j2" and 
                do_list of make an array with Dexter move_all_joints 
                                                 with make an array with 0, 0, 0, 0, 0.., (angles)
                                              Dexter move_to
                                                 with make an array with 0, 0,5, 0,075., (xyz)
                                                      make an array with 0, 0, -1.,      (J5_direction)
                                                      Dexter/RIGHT_UP_OUT (config)
                                                 .
                                         .
           .
 