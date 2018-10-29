new TestSuite("DE comparison",
    ['DE.de_to_js("4 less than with 67.")', '"(4 < 67)"'],
    ['DE.de_to_js("4 more than with 67.")', '"(4 > 67)"'],
    ['DE.de_to_js("44 equals with 67.")', '"(44 == 67)"'],
    ['DE.de_to_js("44 not equals with 67.")', '"(44 != 67)"'],
    ['DE.de_to_js("44 less than or equals with 67.")', '"(44 <= 67)"'],
    ['DE.de_to_js("47 more than or equals with 68.")', '"(47 >= 68)"'],
    ['DE.de_to_js("45 same as with 46.")', '"(45 === 46)"'],
    ['DE.de_to_js("45 not same as with 46.")', '"(45 !== 46)"']
)

new TestSuite("DE arithmetic",
    ['DE.de_to_js("45 plus with 46.")', '"(45 + 46)"'],
    ['DE.de_to_js("45 minus with 46, 47, 48.")', '"(45 - 46 - 47 - 48)"'],
    ['DE.de_to_js("45 times with 46 and 47.")', '"(45 * 46 * 47)"'],
	['DE.de_to_js("45 divide with 9.")', '"(45 / 9)"'],
    ['DE.de_to_js("45 remainder with 10.")', '"(45 % 10)"'],
    ['DE.de_to_js("2 to the power of with 3.")', '"(2 ** 3)"']
)

new TestSuite("DE logic",
    ['DE.de_to_js("true as well as with true, false.")', '"(true && true && false)"'],
    ['DE.de_to_js("true or with true, false.")', '"(true || true || false)"']
)

new TestSuite("DE make",
	    ['DE.de_to_js("make Array with 4 and 5.")', '"new Array(4, 5)"'],
        ['DE.de_to_js("make Array with 4.")', '"new Array(4)"'],
        ['DE.de_to_js("make array with.")', '"make.array()"']
)

new TestSuite("DE call",              
        ['DE.de_to_js("joe launch with 123, foo bar with., 456.")', 
        	'"joe.launch(123, foo.bar(), 456)"'],
        ['DE.de_to_js("joe launch with 123, 456.")', 
        	'"joe.launch(123, 456)"'],
        ['DE.de_to_js("rocket/x15 launch with 123.")', 
        	'"rocket.x15.launch(123)"'],
        ['DE.de_to_js("joe launch with nothing.")', '"joe.launch()"'],
        ['DE.de_to_js("joe launch with.")', '"joe.launch()"'],
        ['DE.de_to_js("you launch with 123 and 456.")', '"launch(123, 456)"'],
		['DE.de_to_js("you launch with 123, 456.")', '"launch(123, 456)"'],
    	['DE.de_to_js("joe launch with size of 123 and weight of 56.")', 
       		'"joe.launch({size: 123, weight: 56})"'],
       	['DE.de_to_js("You launch with 123.")', '"launch(123)"'],
   		['DE.de_to_js("launch with 123.")', '"launch(123)"'],
    	['DE.de_to_js("launch with nothing.")', '"launch()"'],
        ['DE.de_to_js("launch with  .")', '"launch()"'],
    	['DE.de_to_js("launch with.")', '"launch()"']
)

new TestSuite("DE comment",
        ['DE.de_to_js("1234(some comment)")', '"1234/*some comment*/"'],
        ['DE.de_to_js("1234  (some comment)")', '"1234/*some comment*/"'],
        ['DE.de_to_js("(some comment)1234")', '"/*some comment*/1234"'],
        ['DE.de_to_js("(some comment)   1234")', '"/*some comment*/1234"']
)

new TestSuite("DE token",
    ['DE.de_to_js("aa/bb/cc")', '"aa.bb.cc"'],
    ['DE.de_to_js("nothing")', '"undefined"'],
    ['DE.de_to_js("xy23")', '"xy23"'],
    ['DE.de_to_js("xy")', '"xy"'],
    ['DE.de_to_js("x")', '"x"'],
    ['DE.de_to_js("234")', '"234"'],
    ['DE.de_to_js("-234")', '"-234"'],
    ['DE.de_to_js("+234")', '"+234"'],
    ['DE.de_to_js("234.56")', '"234.56"'],
    ['DE.de_to_js("-234.56")', '"-234.56"']
)

new TestSuite("DE string",
    [`DE.de_to_js('"abc"')`, `'"abc"'`],
    [`DE.de_to_js('""')`, `'""'`],
    [`DE.de_to_js("'def'")`, `"'def'"`],
    [`DE.de_to_js("''")`, `"''"`]  
)

                    

new Job({name: "j2",
        do_list: [Dexter.move_all_joints([0, 0, 0, 0, 0]), //angles
                  Dexter.move_to([0, 0.5, 0.075],     //xyz
                                 [0, 0, -1],          //J5_direction
                                 Dexter.RIGHT_UP_OUT) //config
                 ]})


var de_job_test =
`make Job with  "j2".` and 
                do_list of make Array with Dexter move_all_joints 
                                                 with make Array with 0, 0, 0, 0, 0.., (angles)
                                           Dexter move_to
                                                 with make Array with 0, 0,5, 0,075., (xyz)
                                                      make Array with 0, 0, -1.,      (J5_direction)
                                                      Dexter/RIGHT_UP_OUT (config)
                                                 .
                                         .
           .`
 
 DE.de_to_js(de_job_test)