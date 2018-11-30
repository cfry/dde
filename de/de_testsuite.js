
new TestSuite("DE comparison",
    ['DE.de_to_js("4 lessasdfsadf with 67.")', '"(4 < 67)"'],
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
    ['DE.de_to_js("2 power with 3.")', '"(2 ** 3)"']
)

new TestSuite("DE logic",
    ['DE.de_to_js("true also with true, false.")', '"(true && true && false)"'],
    ['DE.de_to_js("true or   with true and false.")', '"(true || true || false)"']
)

new TestSuite("DE make",
	    ['DE.de_to_js("make Array with 4 and 5.")', '"[4, 5]"'],
        ['DE.de_to_js("make Array with 4.")', '"[4]"'],
        ['DE.de_to_js("make array with.")', '"make.array()"'],
        ['DE.de_to_js("make Date with.")', '"make.Date()"'],
        [`DE.de_to_js("make Object with color of 'red' and size of 12.")`, `"{color: 'red', size: 12}"`]
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
    	['DE.de_to_js("launch with.")', '"launch()"'],
        ['DE.de_to_js("launch with .")', '"launch()"'],
        ['DE.de_to_js("launch with . ")', '"launch()"']
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
    ['DE.de_to_js("foo_bar")', '"foo_bar"'],
    ['DE.de_to_js("RIGHT")', '"RIGHT"'],
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

new TestSuite("DE assignment",
    ['DE.de_to_js("foo means 2.")', '"foo = 2"'],
    ['DE.de_to_js("foo means 2 plus with 3..")', '"foo = (2 + 3)"'],
    ['DE.de_to_js("foo means Math min with 4, 5..")', '"foo = Math.min(4, 5)"'],
    ['DE.de_to_js("variable bar means 6.")', '"var bar = 6"'],
    ['DE.de_to_js("local bar means 6.")', '"let bar = 6"']
)
new TestSuite("multiple expressions",
    ['DE.de_to_js("foo means 2. bar with 123.")', '"foo = 2\\nbar(123)"']
)

new Testsuite("fn def",
    ['DE.de_to_js("to double with num. do num plus with num.!")', 
     '"function double(num){(num + num)}"'],
    ['DE.de_to_js("double with 3.")', '"double(3)"'],
    ['DE.de_to_js("to double with num default 2. do num plus with num.!")', 
     '"function double(num=2){(num + num)}"'],
    ['DE.de_to_js("to double with num of 2. do num plus with num.!")', 
     '"function double({num=2}={}){(num + num)}"']
     )
     
new TestSuite("keyword_exprs_block",
    ['DE.de_to_js("try do 3 plus with 4.!")', '"try{(3 + 4)}"'],
    ['DE.de_to_js("otherwise do 3 plus with 4.!")', '"else{(3 + 4)}"'],
    ['DE.de_to_js("finally do 3 plus with 4.!")', '"finally{(3 + 4)}"'],
    ['DE.de_to_js("if error err do out with 234. 22 plus with 44.!")', '"catch(err){out(234)\\n(22 + 44)}"']
)

new TestSuite("if_but_if",
    ['DE.de_to_js("if 3 less than with 4. do out with 123.!")', 
     '"if(3 < 4){out(123)}"'],
    ['DE.de_to_js("if true do out with 123.!")', '"if(true){out(123)}"'],
    ['DE.de_to_js("but if false do out with 456.!")', '"else if(false){out(456)}"'],
    ['DE.de_to_js("otherwise do out with 789.!")', '"else{out(789)}"'],
    ['DE.de_to_js("if false do out with 123.! but if false do out with 456.! otherwise do out with 987.!")', 
      '"if(false){out(123)}\\nelse if(false){out(456)}\\nelse{out(987)}"'],
     ['DE.de_to_js("if true do !")', '"if(true){}"'],
     ['DE.de_to_js("if true do!")', '"if(true){}"']
)

DE.eval("loop 5 do loop_result push with loop_value.!")
DE.de_to_js("loop 5 do out with loop_value.!")

loop make object with color of blue. do adfsdafds !
loop_index
loop_value
loop_total
loop_key
on_first
on_last

loop(times_to_loop, fn_def)
function foo(){
for(let i ...){
  return 23
  }




                    

new Job({name: "j2",
        do_list: [Dexter.move_all_joints([0, 0, 0, 0, 0]), //angles
                  Dexter.move_to([0, 0.5, 0.075],     //xyz
                                 [0, 0, -1],          //J5_direction
                                 Dexter.RIGHT_UP_OUT) //config
                 ]})


var de_job_test =
`make Job with  name of "j2" and 
                do_list of make Array with Dexter move_all_joints 
                                                 with make Array with 0, 0, 0, 0, 0.
                                                 ., (angles)
                                           Dexter move_to
                                                 with make Array with 0, 0,5, 0,075., (xyz)
                                                      make Array with 0, 0, -1.,      (J5_direction)
                                                      Dexter/RIGHT_UP_OUT (config)
                                                 .
                                      .
          .`
 
 DE.de_to_js(de_job_test)
 
 new Job({name: "j2", do_list: [Dexter.move_all_joints([0, 0, 0, 0, 0]), /*angles*/
                                Dexter.move_to([0, 0, 5, 0, 075], /*xyz*/
                                               [0, 0, -1], /*J5_direction*
                                               /Dexter.RIGHT_UP_OUT/*config*/)]})

 
 new Job({name: j2, do_list: new Array(Dexter.move_all_joints(new Array(0, 0, 0, 0, 0)))})
 
to double with num of 2. do return with num plus with num..!
double with 3.

function foo(num){ 
      let closed_num = num
      let fn = function(){ closed_num = num + 1 }
      fn()
      return closed_num}
foo(3)

(function(){return 333})()