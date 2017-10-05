var TestSuite = class TestSuite{
    constructor(name, ...tests){
        this.name  = name
        this.tests = tests
        this.verify_tests_syntax() //causes tests defined in DDE source to be verified upon every start up.
                                   //if this gets to be too slow, move this call to top of run.
                                   //put this BEFORE the next line, so if it fails,
                                   //we won't have a bad testsuite defined.
        TestSuite[name] = this
        TestSuite.add_suite(this)
    }

    static statistics(){
        let test_count = 0
        for(let suite of TestSuite.suites){
            test_count += suite.tests.length
        }
        out("There are " + TestSuite.suites.length + " test suites containing a total of " + test_count + " tests.")
    }

    verify_tests_syntax(){
        var name = this.name
        if (typeof(name) !== "string")       { throw new Error("TestSuite." + name + " doesn't have a string as a name.") }
        else if (name.length == 0)           { throw new Error("TestSuite has an empty string as its name.") }
        else if (!Array.isArray(this.tests)) { throw new Error("TestSuite." + name + " has a non-array for its tests.") }
        for(let test_number = 0; test_number < this.tests.length; test_number++){
            var test     = this.tests[test_number]
            if(!Array.isArray(test))         { throw new Error("TestSuite." + name + " has it's test " + test_number + " as not an array,<br/>but rather: " + test + ".<br/>Check for a missing comma at end of a test.")}
            else if (test.length == 0)       { throw new Error("TestSuite." + name + " has it's test " + test_number + " as an array of length 0 but should be 1, 2, or 3. " + test)}
            else if (test.length > 3)        { throw new Error("TestSuite." + name + " has it's test " + test_number + " as an array of length " + test.length + " but should be 1, 2, or 3. " + test)}
            var src      = test[0]
            if(typeof(src) != "string")      { throw new Error("TestSuite." + name + " has it's test " + test_number + " with its first element (test source) as: " + src + " but it should be a string. " + test)}
            if(test.length == 1) { continue; } //don't even look for a test, just let this pass and assume its an "init" statement
            var expected = test[1]
            if(typeof(expected) != "string") { throw new Error("TestSuite." + name + " has it's test " + test_number + " with its 2nd element (expected result) as: " + expected + " but it should be a string. " + test)}
            if(test.length == 2) { continue; }
            var desc = test[2]
            if(typeof(desc) != "string")     { throw new Error("TestSuite." + name + " has it's test " + test_number + " with its 3rd element (description) as: " + desc + " but it should be a string. " + test)}
        }
    }
    static is_string_test_suite(sel_text){
        return sel_text.startsWith("new TestSuite(")
    }
    static add_suite(a_suite){
        for (let index in TestSuite.suites){
            if (TestSuite.suites[index].name == a_suite.name){
             TestSuite.suites.splice(index, 1) //delete 1 elt
             break; //should be at most 1 in the array
            }
        }
        TestSuite.suites.push(a_suite)
    }
    static make_suite_menu_items(suite_name){
        console.log("top of make_suite_menu_items")
        var fn = function(){
                   TestSuite.run(suite_name)
                }
        var the_id = "run_test_suite_" + suite_name + "_id"
        $( "#test_suites_id" ).append("<li id='" + the_id + "'>run " + suite_name + "</li>" );
        setTimeout(function(){ window[the_id].onclick = fn}, 300)
    }
    static make_suites_menu_items(){
         for (let suite of TestSuite.suites){
             console.log("calling make_suite_menu_items")
             TestSuite.make_suite_menu_items(suite.name)
         }
    }
    static all_suites_source_code(){
        let result = ""
        for(let i = 0; i < TestSuite.suites.length; i++){
            result += TestSuite.suites[i].to_source_code() + "\n\n"
        }
        return result
    }
    //used by the ts series for its dynamic array
    static get_ts_source_array(){
        let result = []
        for(let i = 0; i < TestSuite.suites.length; i++){
            result.push(TestSuite.suites[i].to_source_code())
        }
        return result
    }
    
    to_source_code(){
        var result = ""
        for(let test_number = 0; test_number < this.tests.length; test_number++){
            var test = this.tests[test_number]
            var sep = ((test_number == (this.tests.length - 1))? "\n" : ",\n")
            result += "    " + TestSuite.test_to_source(test) + sep
        }
        result = 'new TestSuite("' + this.name + '",\n' + result + ")"
        return result
    }

    to_html(){
        let result = this.to_source_code().replace(/\n/g, "<br/>\n")
        result = result.replace(/    /g, "&nbsp;&nbsp;&nbsp;&nbsp;") //indent tests
        return result
    }
    
    static test_to_source(a_test){
        let result = "["
        let sep    = ", "
        for (let i = 0; i < a_test.length; i++){
            if (i == a_test.length - 1) { sep = "" }
            result += string_to_literal(a_test[i]) + sep
        }
        return result + "]"
    }
    static test_source_to_array(src){ //assumed syntactialy correct test. src starts bounded by [ and ]
                                      //will have 1 to 3 literal strings
        var result = []
        src = src.trim()
        src = src.substring(1, src.length - 1)
        src.trim()
        var start_quote = 0
        var end_quote = Editor.find_forwards_matching_quote(src, 0)
        result.push(src.substring(start_quote + 1, end_quote )) //cut off the quotes

        start_quote = Editor.find_forwards_any_kind_of_quote(src, end_quote + 1)
        if (start_quote == null) { return result }
        end_quote = Editor.find_forwards_matching_quote(src, start_quote)
        result.push(src.substring(start_quote + 1, end_quote)) //cut off the quotes

        start_quote = Editor.find_forwards_any_kind_of_quote(src, end_quote + 1)
        if (start_quote == null) { return result }
        end_quote = Editor.find_forwards_matching_quote(src, start_quote)
        result.push(src.substring(start_quote + 1, end_quote)) //cut off the quotes
        return result
    }

    static show(name){
        const this_suite = TestSuite[name]
        out(this_suite.to_html())
    }

    static show_all(){
        var reports = ""
        for (let suite of TestSuite.suites){
            TestSuite.show(suite.name)
        }
    }

    static insert_all(){
        Editor.insert(TestSuite.all_suites_source_code())
    }
    //means in the "body" of it, not in "new TestSuite" part of the call.
    //run in the ui
    static in_test_suite_def(){
        let full_src = Editor.get_javascript()
        let sel_start = Editor.selection_start()
        let new_ts_start = Editor.find_backwards(full_src, sel_start, "new TestSuite")
        if (new_ts_start == null) { return false }
        else {
            let open_paren_index = full_src.indexOf("(", new_ts_start)
            if (open_paren_index == -1) {return false}
            else{
                let close_paren_index = Editor.find_matching_close(full_src, open_paren_index)
                if (close_paren_index == null)  { close_paren_index = full_src.length } //allow this case but beware if use for other than test suite stepping
                if((sel_start > open_paren_index) && (sel_start < close_paren_index)){
                    return true
                }
                else { return false }
            }
        }
    }

    static are_multiple_test_suites_selected(sel_text){
        sel_text = sel_text.trim()
        if(!sel_text.startsWith("new TestSuite")) {return false}
        let open_paren_index = sel_text.indexOf("(")
        if (open_paren_index == -1) {return false}
        let close_paren_index = Editor.find_matching_close(sel_text, open_paren_index)
        if (close_paren_index == null)  {return false}
        //we have a valid first test suite, just see if any non-whitespace after it
        else if (close_paren_index == (sel_text.length - 1)){ return false } //only 1 test suite
        else { return true } //since we know the last char isn't whitespace due the the above trim,
                             //and we know there's more chars after
    }

    static is_one_test_suite_selected(sel_text){
        sel_text = sel_text.trim()
        if(!sel_text.startsWith("new TestSuite")) {return false}
        let open_paren_index = sel_text.indexOf("(")
        if (open_paren_index == -1) {return false}
        let close_paren_index = Editor.find_matching_close(sel_text, open_paren_index)
        if (close_paren_index == -1)  {return false}
        else if (close_paren_index == (sel_text.length - 1)){ return true }
        else { return false }
    }
    //does an item and returns true OR return false to be processed further by another series.
    static handle_by_test_suite(arrow_key_orientation="horizontal", //hors means left or right, "vertical" means up or down
                                arrow_key_direction = 1, //1 means down or right ie next, -1 means up or left (ie prev)
                                run_item=true) {//if false, only move selection, don't eval or run.
        let sel_start = Editor.selection_start()
        let sel_end   = Editor.selection_end()
        if (sel_start === sel_end) { return false } //no selection
        let full_src  = Editor.get_javascript()
        let sel_text  = Editor.get_javascript(true)

        if (TestSuite.are_multiple_test_suites_selected(sel_text)){
            console.log("got multiple test suites")
            TestSuite.eval_and_run_selected_test_suites(sel_text, arrow_key_orientation, arrow_key_direction, run_item)
            return true
        }
        else if (TestSuite.is_one_test_suite_selected(sel_text)){
            console.log("got one test suite")
            TestSuite.eval_and_run_selected_test_suite(sel_text, arrow_key_orientation, arrow_key_direction, run_item)
            return true
        }
        else if (TestSuite.in_test_suite_def()){
            if (is_string_a_literal_array(sel_text)){ //we have a test
                console.log("got lit array")
                TestSuite.eval_and_run_selected_test(sel_text, arrow_key_orientation, arrow_key_direction, run_item)
                return true
            }
            else if (is_string_a_literal_string(sel_text)){ //we have a test src or expected val
                console.log("got lit string")
                TestSuite.eval_and_run_selected_string(sel_text, arrow_key_orientation, arrow_key_direction, run_item)
                return true
            }
            return false
        }
        else { return false }
    }

    static run_all(){
        load_files(__dirname + "/music/note_testsuite.js")
        load_files(__dirname + "/music/phrase_testsuite.js")
        if (!TestSuite["user_guide_id"])       { TestSuite.make_test_suites_from_doc(user_guide_id) }
        if (!TestSuite["reference_manual_id"]) { TestSuite.make_test_suites_from_doc(reference_manual_id) }
        var reports = "<b style='font-size:20px;'>All Test Suites Report</b><br/>"
        let start_time = Date.now()
        for (let suite of TestSuite.suites){
            var report = TestSuite.run(suite.name)
            reports = reports + report + "<br/>"
        }
        let end_time = Date.now()
        out(reports + " All test suites duration: " + (end_time - start_time) + " ms")

    }

    //can't just return the value and have it seen, has to output to out.
    /*static run_one_test_source(test_src) { //src is a string that starts with [ and ends with ]
        test_src = test_src.substring(1, test_src.length - 1) //strip off [ and ]
        test_src = test_src.trim() //usually does nothing but just in case
        let src_start_quote = 0
        let src_end_quote   = Editor.find_forwards_matching_quote(test_src, src_start_quote)
        if (src_end_quote == -1) { return false; }
        let src = test_src.substring(src_start_quote + 1, src_end_quote) //get src and strip off surrounding quotes
        let src_result = window.eval("(function(){try{ return " + src      + "} catch(err) {return err.name + ' ' + err.message}})()")
        //there might or might not be an expected string. If none, don't try to eval it!
        let close_square = test_src.indexOf("]", src_end_quote)
        if (close_square == -1) {return false;}
        let expected_start_quote = Editor.find_forwards_any_kind_of_quote(test_src, src_end_quote + 1)
        if (expected_start_quote == -1) {return false;}
        if(expected_start_quote < close_square) { //we've got an expected
            let expected_end_quote   = Editor.find_forwards_matching_quote(test_src, expected_end_quote)
            if (expected_end_quote == -1) {return false;}
            let expected = test_src.substring(expected_start_quote + 1, expected_end_quote) //strip off quotes
            let expected_result = window.eval("(function(){try{ return " + expected + "} catch(err) {return err.name + ' ' + err.message}})()")
            if(similar(src_result, expected_result)) {
                 out("Test passed with source result of: <span style='color:blue;'>" + src_result + "</span>")
             }
             else {
                 out("Test failed with source result of: <span style='color:red;'>" + src_result +
                        "</span><br/> and expected result of: " + expected_result)
             }
        }
        else {
            out("Source evaled for side effect.<br/>" +
                "result: <span style='color:blue;'>" + src_result + "</span>")
        }
    }*/
    
    //selection gaurenteed to be a valid test, or if not we just error ungracefully

    static eval_and_run_selected_test_suites(sel_text, arrow_key_orientation="horizontal",
                                             arrow_key_direction=1, run_item=true){
        if(arrow_key_orientation == "horizontal"){
            if (arrow_key_direction == 1){
                if (run_item){
                    let ts_array = sel_text.split("new TestSuite")
                    for(let ts_string of ts_array){
                        ts_string = ts_string.trim()
                        if (ts_string == "") { continue; } //junk from split
                        ts_string = "new TestSuite" + ts_string //make it complete again
                        //cut off any junk at end
                        let open_paren = ts_string.indexOf("(")
                        if (open_paren == -1) {out("Found syntactically bad test suite with no opening paren: " + ts_string.split("\n")[0]); return false}
                        let close_paren = Editor.find_matching_delimiter(ts_string, open_paren)
                        if (close_paren == null) {out("Found syntactically bad test suite with no closing paren: " + ts_string.split("\n")[0]); return false}
                        ts_string = ts_string.substring(0, close_paren + 1) //now have a good ts source string
                        let ts  = window.eval(ts_string)
                        if (ts instanceof TestSuite) {out(ts.run_this());}
                        else {
                            out("The source code for test suite: " + ts_string.split("\n")[0] + " isn't proper.")
                            return false
                        }
                    }
                }
            }
        }
        return TestSuite.select_next("test_suites", arrow_key_orientation, arrow_key_direction)
    }
    static eval_and_run_selected_test_suite(sel_text, arrow_key_orientation="horizontal", arrow_key_direction=1, run_item=true){
        if((arrow_key_orientation == "horizontal") &&
            (arrow_key_direction == 1) &&
            run_item){
            if (run_item){
                let ts  = window.eval(sel_text)
                if (ts instanceof TestSuite) {out(ts.run_this());}
                else {
                    out("The source code for test suite: " + ts_string.split("\n")[0] + " isn't proper.")
                    return false
                }
            }
        }
        TestSuite.select_next("test_suite", arrow_key_orientation, arrow_key_direction)
    }

    static eval_and_run_selected_test(sel_text, arrow_key_orientation="horizontal", arrow_key_direction=1, run_item=true){
        if(arrow_key_orientation == "horizontal"){
            if (arrow_key_direction == 1){
                if (run_item){
                    let test_array = TestSuite.test_source_to_array(sel_text)
                    let [status, error_message] = TestSuite.run_test_array(test_array)
                    if (error_message == ""){
                        error_message = "<span style='color:blue;'>" + test_array[0] + "</span> passed."
                    }
                    out(error_message)
                }
            }
        }
        return TestSuite.select_next("test", arrow_key_orientation, arrow_key_direction)
    }

    //run a test suite
    run_this(){ //the instance version of run
        return TestSuite.run(this.name)
    }

    //run a test suite
    static run(name){
        var this_suite = TestSuite[name]
        if (!this_suite) {throw new Error("Attempted to run test suite: " + name + " but it isn't defined.")}
        var report = ""
        var unknown_failure_count = 0
        var known_failure_count   = 0
        var start_time = Date.now()
        for(let test_number = 0; test_number < this_suite.tests.length; test_number++){
            var test     = this_suite.tests[test_number]
            //onsole.log("About to run test: " + test_number + " " + test)
            let [status, error_message] = TestSuite.run_test_array(test, test_number)
            if (status) {
                report += error_message + "\n"
                if      (status == "known")   { known_failure_count += 1 }
                else if (status == "unknown") { unknown_failure_count += 1 }
            }
        }
        var stop_time = Date.now()
        var dur = stop_time - start_time
        var unknown_html = ((unknown_failure_count == 0)? "0" :
            "<span style='color:red;'>" + unknown_failure_count + "</span>")
        report = "<b>Test Suite: " + this_suite.name + " Report</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style='font-size:14px;'>duration: " + dur + " ms</span><br/>" +
            "failures: unknown=" + unknown_html + ", known=" + known_failure_count +
            " out of " + this_suite.tests.length +
            " tests. <i>(test numbering starts at 0)</i><br/>" +
            report
        return report
    }

    static run_test_array(test, test_number = null){
        var status = false
        var error_message = ""
         //first elt: false means everything ok,  or "known"  or "unknown" for a bug
        var src      = test[0]
        var test_number_html = (test_number ? "Test " + test_number + ". ": "")
        //permit 'let' but warn
        if (src.startsWith("let ") || src.includes(" let ") || src.startsWith("\nlet ")) {
            out("<span style='color:#cc04ef;'>Test " + test_number +
                ". Warning: variable bindings made with 'let' will not be available in subsequent tests.<br/>Use 'var' if you want them to be.<br/>" +
                src + "</span>")
            }
        else if (src.startsWith("{")) { //assume there is only 1 literal object in src, should end with "}"
            src = "let ts_temp = " + src + "\nts_temp" //if I don't do this the try wrapped around my inner eval will cause just a literal object to syntactically error. Looks like a chrome eval bug, but do this as its harmless
        }
        else if (src.startsWith("function(")) { //assume there is only 1 fn def in src, should end with "}"
            src = "let ts_temp = " + src + "\nts_temp" //if I don't do this the try wrapped around my inner eval will cause just a fn to syntactically error. Looks like a chrome eval bug, but do this as its harmless
        }
        TestSuite.last_src_error_message = false //needs to be a global to get the val out of the catch clause.
        //unlike every other use of curly braces in JS, try returns the value of its last try expr if no error, and otherwise returns the value of the last expr in catch
        var wrapped_src = "try{ " + src + "} catch(err) {TestSuite.last_src_error_message = err.name + ' ' + err.message; TestSuite.error}"
        var src_result
        try{ src_result = window.eval(wrapped_src) }
        catch(err) {
           status = "unknown"
           error_message = test_number_html + src + " errored with: " + err
           return [status, error_message]
         }
        if(test.length == 1) {
            if(TestSuite.last_src_error_message){
                status = "unknown" //no utility in init code that errors so never a "known" one with a 1 elt test array
                error_message = test_number_html + src + " => " + TestSuite.last_src_error_message + "<br/>"
            }
            else {
                error_message = test_number_html + "<code style='color:blue;'>" + src + "</code> initialization succeeded."
            }
        }
        else {
            var expected = test[1]
            TestSuite.last_expected_error_message = false
            var expected_result = window.eval("try{" + expected + "} catch(err) {TestSuite.last_expected_error_message = err.name + ' ' + err.message; TestSuite.error}")
            if ((expected_result == TestSuite.dont_care) && !TestSuite.last_src_error_message) {} //allows any value from src to pass (unless it errors)
            else if(!similar(src_result, expected_result)) { //note if both are TestSuite.error, they will be similar
                var desc     = ((test.length > 2) ? test[2] : "")
                if (desc.startsWith("known")){ status = "known" }
                else                         { status = "unknown" }
                var desc_html = ((desc == "")? "" : " <i> (" + desc + ")</i>")
                if(TestSuite.last_src_error_message){
                    error_message = test_number_html + src +
                        " => <span style='color:red;'>" + TestSuite.last_src_error_message +
                        "</span> " + desc_html + "<br/>"
                }
                else if (TestSuite.last_expected_error_message){
                    error_message = test_number_html + expected +
                        " => <span style='color:red;'>" + TestSuite.last_expected_error_message +
                        "</span> " + desc_html + "<br/>"
                }
                else { //unexpected error
                    let src_result_str = stringify_value(src_result)
                    let src_result_html = "<span style='color:red;'>" + src_result_str + "</span>"
                    error_message = test_number_html +
                        "&nbsp;<code>" + src +
                        "</code> => "                    + ((src_result_str.length > 20) ? "<br/>" : "") + "<code>" + src_result_html  +
                        "</code>, <i>but expected</i>: " + ((src_result_str.length > 20) ? "<br/>" : "") + "<code>" + stringify_value(expected_result) +
                        "</code> " + desc_html + "<br/>"
                }
            }
        }
        return [status, error_message]
    }

    static eval_and_run_selected_string(sel_text, arrow_key_orientation="horizontal", arrow_key_direction=1, run_item=true){
        if((arrow_key_orientation == "horizontal") &&
            (arrow_key_direction == 1) &&
            run_item){
            let sel_text_to_eval = sel_text.substring(1, sel_text.length - 1) //cut off the quotes
            let result
            let got_error = false
            try{ result = window.eval(sel_text_to_eval) } catch(err) {
                 got_error = true
                 result = err.message
                 }
             let color_for_result = (got_error ? "red" : "blue")
            out(sel_text_to_eval + " => <code style='color:" + color_for_result + "'>" + result + "</code>")
        }
        TestSuite.select_next("string", arrow_key_orientation, arrow_key_direction)
    }

    //level says what kind of thing is currently selected in the editor buffer
    static select_next(level="test_suite", arrow_key_orientation="horizontal", arrow_key_direction=1){
        let sel_start = Editor.selection_start()
        let sel_end   = Editor.selection_end()
        let full_src  = Editor.get_javascript()
        let sel_text  = Editor.get_javascript(true)
        switch (level){
            case "test_suites":
                if (arrow_key_orientation == "vertical"){
                    if(arrow_key_direction == 1){ //select DOWN
                        let ts_start = sel_text.indexOf("new TestSuite")
                        if (ts_start == -1) {out("No test suites found."); return false}
                        let open_paren = sel_text.indexOf("(", ts_start)
                        if (open_paren == -1) { out("Syntactically incorrect test suite, no open paren: " + sel_text.subsring(ts_start, ts_start + 30)); return false}
                        let close_paren = Editor.find_matching_delimiter(sel_text, open_paren)
                        if (close_paren == null) { out("Syntactically incorrect test suite, no close paren: " + sel_text.subsring(ts_start, ts_start + 30)); return false}
                        Editor.select_javascript(sel_start + ts_start, sel_start + close_paren + 1)
                        myCodeMirror.scrollTo(0)
                        return true
                    }
                }
                return false; //going vert up, or sideways makes no sense with test suites.
                break;
            case "test_suite":
                //first initialize ts_start of suite to select
                if(arrow_key_orientation == "horizontal"){
                    let ts_start
                    if(arrow_key_direction == -1) { //select prev
                        if(sel_start == 0) { ts_start = -1 } //can't go backwards from 0
                        else { ts_start = full_src.lastIndexOf("new TestSuite", sel_start - 1) }//need the -1 to not select the same test suit again.
                    }
                    else { //select next
                        ts_start = full_src.indexOf("new TestSuite", sel_end)
                    }
                    if(ts_start == -1) { return false } //nothing to select
                    else {
                        let open_paren = full_src.indexOf("(", ts_start)
                        if (open_paren !== - 1) {
                            let close_paren = Editor.find_matching_delimiter(full_src, open_paren)
                            if (close_paren !== null) {
                                Editor.select_javascript(ts_start, close_paren + 1)
                                myCodeMirror.scrollTo(0)
                                return true
                            }
                            else { out("Could not find closing paren for next test suite: "); return false; }
                        }
                        else {out("Could not find open paren for next test suite.")} return false;
                    }
                }
                else { //orientation vert
                    let ts_first_start
                    let ts_last_start
                    let ts_end
                    if(arrow_key_direction == -1) { //select UP
                        ts_first_start = full_src.indexOf("new TestSuite") //start at file begin to find first new TestSuite in file
                        ts_last_start  = full_src.lastIndexOf("new TestSuite")
                        if(ts_first_start == ts_last_start) {  //and presumably also == sel_start, ie only 1 test suite in file
                            return false
                        }
                        let open_paren = full_src.indexOf("(", ts_last_start)
                        let ts_last_end = Editor.find_matching_delimiter(full_src, open_paren)
                        if (ts_last_end == null) {
                            out("The last new TestSuite in the editor buffer doesn't have a matching close paren.")
                            return false
                        }
                        else {
                            Editor.select_javascript(ts_first_start, ts_last_end + 1)
                            myCodeMirror.scrollTo(0)
                        }
                    }
                    else { //select DOWN
                        let t_start = full_src.indexOf("[", sel_start)
                        if (t_start == -1) {out("No tests found."); return false}
                        let t_end = Editor.find_matching_delimiter(full_src, t_start)
                        if(t_end == null) {out("No valid tests found. Look for proper ] at end of first test in suite."); return false}
                        Editor.select_javascript(t_start, t_end + 1)
                        myCodeMirror.scrollTo(0)
                    }
                }
                break; //end of case test_suite
            case "test":
                if(arrow_key_orientation == "horizontal"){
                    let t_start
                    let t_end
                    if(arrow_key_direction == -1) { //select prev
                        if(sel_start == 0) { t_start = -1 } //can't go backwards from 0
                        else {
                            t_end = full_src.lastIndexOf("]", sel_start - 1)
                            if (t_end == -1) { return false }
                            else {
                                t_start = Editor.find_matching_delimiter(full_src, t_end)
                                if (t_start == null) {return false}
                            }
                        }
                    }
                    else { //select next
                        t_start = full_src.indexOf("[", sel_end)
                        if (t_start == -1) { return false; }
                        else {
                            t_end = Editor.find_matching_delimiter(full_src, t_start)
                            if (t_end == null) {return false}
                        }
                    }
                    Editor.select_javascript(t_start, t_end + 1)
                    myCodeMirror.scrollTo(0)
                    return true
                }
                else { //orientation vert
                    let ts_start
                    let ts_end
                    if(arrow_key_direction == -1) { //select UP
                        ts_start = full_src.lastIndexOf("new TestSuite", sel_start) //start at file begin to find first new TestSuite in file
                        if (ts_start == -1) { return false }
                        let open_paren = full_src.indexOf("(", ts_start)
                        if (open_paren == -1) { out("test suite does not have an open paren."); return false }
                        ts_end  = Editor.find_matching_delimiter(full_src, open_paren)
                        if (ts_end == null) { out("test suite does not have a close paren."); return false;}
                        Editor.select_javascript(ts_start, ts_end + 1)
                        myCodeMirror.scrollTo(0)
                    }
                    else { //select DOWN
                        let src_start = Editor.find_forwards_any_kind_of_quote(full_src, sel_start)
                        if (src_start == null) {out("No test source found."); return false}
                        let src_end   = Editor.find_forwards_matching_quote(full_src, src_start)
                        if(src_end == null) {out("No ending quote for test source found."); return false}
                        Editor.select_javascript(src_start, src_end + 1)
                        myCodeMirror.scrollTo(0)
                    }
                }
                break; //end case: test
            case "string":
                let start_pos, end_pos
                if(arrow_key_orientation == "horizontal"){
                    if(arrow_key_direction == -1) { //prev
                        if(sel_start == 0) { return false; }
                        end_pos = Editor.find_backwards_any_kind_of_quote(full_src, sel_start - 1)
                        if (end_pos == null) {return false;}
                        start_pos = Editor.find_backwards_matching_quote(full_src, end_pos)
                        if (start_pos == null) {return false;}
                    }
                    else{ //next
                        start_pos = Editor.find_forwards_any_kind_of_quote(full_src, sel_end)
                        if (start_pos == null) {return false;}
                        end_pos = Editor.find_forwards_matching_quote(full_src, start_pos)
                        if (end_pos == null) {return false;}
                    }
                    Editor.select_javascript(start_pos, end_pos + 1)
                }
                else{ //vertical
                    if(arrow_key_direction == -1) { //UP, select the test we're in
                        start_pos = full_src.lastIndexOf("[", sel_start)
                        if (start_pos == -1) {return false;}
                        end_pos = Editor.find_matching_delimiter(full_src, start_pos)
                        if (start_pos == null) {return false;}
                        Editor.select_javascript(start_pos, end_pos + 1)
                        myCodeMirror.scrollTo(0)
                    }
                    else { return false;} //DOWN but can't go down from a string
                }

                break;
        } //end switch
    }

    //menu item operation:
    static selection_to_test(sel_text, full_src, cursor_pos){
            sel_text = sel_text.trim()
            let result
            if (sel_text == "") { result = `["", ""]` }
            else {
                let sel_str = string_to_literal(sel_text)
                let full_str = "try{" + sel_text + "} catch(err){ TestSuite.error }"
                let expected_result = window.eval(full_str)
                let expected_str
                if (expected_result === undefined)             { expected_str = '"undefined"' }
                else if (expected_result == TestSuite.error) { expected_str = '"TestSuite.error"'}
                else {
                    expected_str = stringify_value_sans_html(expected_result)
                    expected_str = string_to_literal(expected_str)
                }
                result = "[" + sel_str + ", " + expected_str + "]"
            }
            TestSuite.selection_to_test_insert(result)
    }
    
    //only executed in the UI
    //new_text is trimmed ie "[....]"
    static selection_to_test_insert(new_text){
        if(TestSuite.in_test_suite_def()){
            let insert_pos = Editor.selection_start()
            let insert_pos_col = Editor.selection_column_number()
            let full_src = Editor.get_javascript()
            let prev_comma = full_src.lastIndexOf(",", insert_pos)
            let prev_close_square = full_src.lastIndexOf("]", insert_pos)
            let indent_spaces = ""
            if (insert_pos_col < 4) { indent_spaces = spaces(4 - insert_pos_col) }
            let indented_new_text = indent_spaces + new_text
            let suffix = ""
            let next_open_square = full_src.indexOf("[", insert_pos)
            let next_close_paren = full_src.indexOf(")", insert_pos) //ie end of the new TestSuite call
            if ((next_open_square != -1) &&
                (next_close_paren != -1) &&
                (next_open_square < next_close_paren)) {
                suffix = ","
            }
            Editor.replace_selection(indented_new_text, true)
            let end   = Editor.selection_end()
            let start = end - new_text.length //we have a variable number of indented spaces to account for.

            Editor.insert(suffix, Editor.selection_end()) //replaces the selection with the new_text, exactly what I want
            if (prev_close_square != -1){
                if(prev_comma != -1){
                    if(prev_comma < prev_close_square){
                        Editor.insert(",", prev_close_square + 1)
                        start += 1
                        end   += 1
                    }
                }
            }
            Editor.select_javascript(start, end)
        }
        else{
            new_text = 'new TestSuite("rename_me",\n    ' + new_text + '\n)\n'
            Editor.replace_selection(new_text, true)
        }
    }
    static find_test_suites(string_to_search_for){
        let result_tses = []
        for(let ts of TestSuite.suites){
            if (ts.name.includes(string_to_search_for)) { result_tses.push(ts) }
            else {
                for (let a_test of ts.tests){
                    for (let a_test_part of a_test){
                        if (a_test_part.includes(string_to_search_for)){
                            result_tses.push(ts)
                            break;
                        }
                    }
                    if (last(result_tses) == ts) { break; }
                }
            }
        }
        //let result_html = ""
        // for(let ts of result_tses){
        //    result_html += ts.to_html() + "<br/>"
        //}
        //out(result_html)
        return result_tses
    }

    static find_test_suites_and_print(string_to_search_for){
        let result_tses = TestSuite.find_test_suites(string_to_search_for)
        if (result_tses.length == 1) {
            let the_html = string_to_search_for + " is in:<br/>" + result_tses[0].to_html()
            the_html = replace_substrings(the_html, string_to_search_for,
                "<span style='background-color:yellow;'>" + string_to_search_for + "</span>")
            out(the_html)
        }
        else {
            let the_html = string_to_search_for + " is in the TestSuites: "
            for(let ts of result_tses){
                the_html += "<details><summary>" + ts.name + "</summary>" + ts.to_html() + "</details>"
            }
            the_html = replace_substrings(the_html, string_to_search_for,
                "<span style='background-color:yellow;'>" + string_to_search_for + "</span>")
            out(the_html)
        }
    }

    static make_test_suites_from_doc(html_elt=reference_manual_id){
        var doc_test_suites = []
        for(var dom_elt of [html_elt]){ //user_guide_id
            var code_elts = dom_elt.querySelectorAll('code')
            var a_test_suite_tests = []
            for (let code_elt of code_elts){
                var src = code_elt.innerText
                if (!code_elt.title){  //(src[0] != " ")
                    var a_test = [src]
                    var next_elt = code_elt.nextElementSibling
                    if (next_elt && (next_elt.tagName == "SAMP")){
                        a_test.push(next_elt.innerText)
                    }
                    a_test_suite_tests.push(a_test)
                }
            }
            doc_test_suites.push(new TestSuite(dom_elt.id, ...a_test_suite_tests))
        }
        return doc_test_suites
    }

} //end class TestSuite
// make_test_suites_in_doc()

TestSuite.error = {name:"used for an expected value of an error."}
TestSuite.dont_care = {name:"used for an expected value when anything the source returns is ok, except if it errors."}
TestSuite.suites = []

new TestSuite("test_suite_reporting",
    ["2 + 3", "5", "1st elt (source) evals to same as 2nd elt (expected) and the test passes."],
    ['similar(2.05, 2, 0.1)', "true", "tolerance of 0.1 permits 2.05 and 2 to be similar"],
    ["var foo = 4 + 1"],
    ["foo", "5", "The side effect of the above 'set up' test, sets foo. Foo's value is tested here."],
    ['"hi" + " dexter"', '"hi dex"', "known failures are declared with this description string starting with 'known'."],
    ['foo961', '123', "This is an 'unknown failure' for demo purposes"],
    ['foo723', 'TestSuite.error', 'Tests with expected of TestSuite.error pass if the source errors.'],
    ['out(TestSuite.run("similarX"))', 'TestSuite.dont_care', "Run another test suite. This one errors because its not defined."]
)
//TestSuite.run("test_system")
//TestSuite.show("test_system")
//TestSuite.run_all()