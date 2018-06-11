/**
 * Created by Fry on 3/20/16.
 */
var Series = class Series {
    /*constructor(keyword_args={}){
        var defaults = {id:"required", array:null, in_series_fn:null, replace_sel_fn:null,
                        menu_insertion_string:"required", menu_sel_start:true, menu_sel_end:null,
                        sample:"required"}
        copy_missing_fields(defaults, keyword_args)
        copy_missing_fields(keyword_args, this)
    }*/

    constructor({id="required", array=null, in_series_fn=null, replace_sel_fn=null,
                 menu_insertion_string="required", menu_sel_start=true, menu_sel_end=null,
                 sample="required"}={}){
        copy_missing_fields(arguments[0], this)
    }

    static init_series(){
        make_color_rgb_map()
        series_help_id.onclick      = function(){ open_doc(series_doc_id) }
                                        
        series_next_item_id.onclick = Series.replace_series_right
        series_prev_item_id.onclick = Series.replace_series_left
        series_next_id.onclick      = Series.replace_series_down
        series_prev_id.onclick      = Series.replace_series_up
        //TestSuite Navigation menu items
        ts_run_sel_next_item_id.onclick = Series.ts_sel_right
        ts_sel_next_item_id.onclick     = Series.ts_sel_shift_right
        ts_sel_prev_id.onclick          = Series.ts_sel_left
        ts_sel_down_id.onclick          = Series.ts_sel_down
        ts_sel_up_id.onclick            = Series.ts_sel_up

        //robots_help_id.onclick = function() {
        //    robots_doc_id.open = true;
        //    $("#robots_doc_id").animate({scrollTop: robots_doc_id.offsetTop}, 800);
        //}
        robots_help_id.onclick = function(){ open_doc(robots_doc_id) }

        Series.init_series_instances()
        init_units()
        //install the onclick methods for the Series menu items.
        for (var ser of Series.instances){
            let the_ser = ser; //must do this let so that each fn generated will use the ser of the for loop.
            var fn = function(){
                if(Editor.view == "text"){
                    Editor.replace_selection(the_ser.get_menu_insertion_string(),
                                             the_ser.menu_sel_start,
                                             the_ser.menu_sel_end)
                    var sel_text = Editor.get_javascript(true)
                    var info = Js_info.get_info_string(sel_text, the_ser)
                    out(info, null, false)
                    if (the_ser.id.endsWith("_units_id")){
                        let [unity_abbrev, unity_full_name] = series_name_to_unity_unit(the_ser.id)
                        let result = ""
                        for (let item of the_ser.array){
                            let unit_full_name = unit_abbrev_to_full_name(the_ser.id, item)
                            let val = window[item]
                            let tooltip = item + " = " + unit_full_name + " = " + unity_full_name + " * " + val +
                                          "\nClick to insert: " + "*" + item
                            result += make_html("a",
                                                {href: "#",
                                                 title: tooltip,
                                                 "text-decoration": "none",
                                                 onclick: "Editor.insert('*" + item + "')"
                                                 },
                                                 item) + "&nbsp;&nbsp;"
                        }
                        out(result, null, false)
                    }
                }
                else { //"blocks" view
                    Workspace.inst.install_blocks_from_series(the_ser)
                }
            }
            document.getElementById(the_ser.id).onclick = fn
        }
        Series.last = Series.id_to_series("series_3_letter_month_id")
    }
    get_sample(){
        if (typeof(this.sample) == "string") {return this.sample}
        else { return this.sample.call(this) }
    }
    get_menu_insertion_string(){
        if (typeof(this.menu_insertion_string) == "string") {
            return this.menu_insertion_string
        }
        else {
            return this.menu_insertion_string.call(this)
        }
    }
    get_array(){
        if (Array.isArray(this.array)) { return this.array }
        else if (typeof(this.array) == "function") { return this.array.call(this) }
        else { return null } //happens for intger, float, date
    }
    get_name(){
        return this.id.slice(7, -3)
    }
    //returns an integer. If it returns -1, that means its not in the series
    //might rerun true if there isn't a position in the series but its stilll in the series, ie for floats, ints
    item_in_series(sel_text){
        if (this.in_series_fn){
            if ((this.id == "series_date_id") && (is_string_a_number(sel_text))){
                return false //tricky. I have the in_series_fn for series_date_id as is_valid_new_date_arg
                             //and a number is a valid new Date() arg, (represents ms)
                             //but if series_date_id happens to be the Series.last, then this would mean selecting
                             //a number treats it as a date, which is rarely wanted. So I stop that here.
                            //not a great solution. Maybe series_date_id in_series_fn itself should do this.
            }
            else { return this.in_series_fn.call(this, sel_text) }
        }
        else {
            var arr = this.get_array()
            if (arr) { return arr.indexOf(sel_text) != -1 }
            else {shouldnt("Series.item_in_series has no way to determine result for series: " + this.id)}
        }
    }

    static id_to_series(id){
        return Series.instances.find(function(ser){return ser.id == id})
    }
    series_index(){
        return Series.instances.findIndex(function(ser){return this == ser})
    }
    
    //return false if it doesn't handle it
    static ts_sel_left(){
        return TestSuite.handle_by_test_suite("horizontal", -1, true)
    }

    //return false if it doesn't handle it
    static ts_sel_right(){
        return TestSuite.handle_by_test_suite("horizontal", 1, true)
    }
    static ts_sel_shift_right(){
        return TestSuite.handle_by_test_suite("horizontal", 1, false) //don't run sel test item, but do move to next test item
    }

    static ts_sel_up(){
        return TestSuite.handle_by_test_suite("vertical", -1, false)
    }
    static ts_sel_down(){
        return TestSuite.handle_by_test_suite("vertical", 1, false)
    }
    
    static ts_or_replace_sel_left(){
        if(!Editor.is_selection()){ return CodeMirror.Pass }
        else if (Series.ts_sel_left()){} //left or right arrow. If index+inc == 1, its right arrow pressed
        else { return Series.replace_series_left() }
    }

    static ts_or_replace_sel_right(){
        if(!Editor.is_selection()){ return CodeMirror.Pass }
        else if (Series.ts_sel_right()){} //left or right arrow. If index+inc == 1, its right arrow pressed
        else { return Series.replace_series_right() }
    }

    static ts_or_replace_sel_down(){
        if(!Editor.is_selection()){ return CodeMirror.Pass }
        else if (Series.ts_sel_down()){} //left or right arrow. If index+inc == 1, its right arrow pressed
        else { return Series.replace_series_down() }
    }

    static ts_or_replace_sel_up(){
        if(!Editor.is_selection()){ return CodeMirror.Pass }
        else if (Series.ts_sel_up()){} //left or right arrow. If index+inc == 1, its right arrow pressed
        else { return Series.replace_series_up() }
    }
    
    static replace_series_left()       { return Series.replace_sel(-1)}
    static replace_series_right()      { return Series.replace_sel(1) }
    
    //arg is 1 or -1
    static replace_sel(index_increment=1, run_item=true){
        if(!Editor.is_selection()){ return CodeMirror.Pass }
        //else if (TestSuite.handle_by_test_suite("horizontal", index_increment, run_item)){} //left or right arrow. If index+inc == 1, its right arrow pressed
        else {
            var sel_text = Editor.get_javascript(true)
            var ser = this.find_series(sel_text)
            if (!ser) { return CodeMirror.Pass }
            else      { return ser.replace_sel_given_series(sel_text, index_increment) }
        }
    }

    static replace_series_up()  { return Series.replace_series(-1)}
    static replace_series_down(){ return Series.replace_series(1) }
    static replace_series(index_increment){ //index_increment=1 for next and -1 for prev
        if(!Editor.is_selection()){ return CodeMirror.Pass }
        //else if (TestSuite.handle_by_test_suite("vertical", index_increment, false)){}
        else {
            var old_sel_text = Editor.get_javascript(true)
            var old_index = this.find_series_index(old_sel_text)
            var old_series = Series.instances[old_index]
            if (old_index == -1) { return CodeMirror.Pass }
            else {
                var new_index = old_index + index_increment
                if (new_index < 0) { new_index = Series.instances.length - 1 } //wrap
                else if(new_index == Series.instances.length) { new_index = 0 }
                var new_series = Series.instances[new_index]
                var new_text = new_series.get_sample(old_series, old_sel_text)
                Editor.replace_selection(new_text, true)
                new_series.output_info(new_text)
            }
        }
    }

    //returns the series that sel_text is in or undefined
    static find_series(sel_text){
        if (Series.last.item_in_series(sel_text)) { return Series.last } //prefer last series
        else {
            return Series.instances.find(function(ser){return ser.item_in_series(sel_text)})
        }
    }
    //returns non-neg int if series containing sel_text found, otherwise returns -1
    static find_series_index(sel_text){
        var series_of_sel_text = Series.find_series(sel_text)
        if(series_of_sel_text){
            return Series.instances.findIndex(function(ser){return ser == series_of_sel_text })
        }
        else {return -1}
    }

    replace_sel_given_series(sel_text, index_increment){
        if (this.replace_sel_fn) {
            var new_text = this.replace_sel_fn.call(this, sel_text, index_increment)
            Editor.replace_selection(new_text, true)
            Series.last = this
            this.sample = new_text
            this.output_info(new_text)
            return true
        }
        else {
            var arr = this.get_array()
            var index = arr.indexOf(sel_text)
            if (index == -1){ shouldnt("replace_sel_given_series couldn't find: " + sel_text + " in series: " + series) }
            else {
                var new_index = index + index_increment
                if (new_index == -1)                 { new_index = arr.length - 1 } //wrap around for left
                else if (new_index == arr.length) { new_index = 0 }                 //wrap around for right
                var new_text = arr[new_index]
                Editor.replace_selection(new_text, true)
                Series.last = this
                this.sample = new_text
                this.output_info(new_text)
                return true
            }
        }
    }
    static replacement_series_integer(sel_text, index_increment=1){
        var int = parseInt(sel_text)
        int += index_increment
        var new_text
        if (int < 0) { new_text = "" + int } //no leading zero for neg numbers.
        else if ((sel_text[0]    == "0") &&
            (sel_text.length == 2 ) &&
            (int < 10)) //preserve leading 0, important for times ie 02:45 when the "02" is selected.
            new_text = "0" + int
        else { new_text = "" + int }
        Editor.replace_selection(new_text, true)
        return new_text
    }
    //floats, inc/dec by least significant digit.
    //sel_text is garenteed to be  a string  that represents a float.
    //this is complex because float aruth often gives 9.999999999 when you wnted 10.0
    static replacement_series_float(sel_text, index_increment=1){
        var sel_text_is_neg = false
        if (sel_text.startsWith("-")){
            sel_text_is_neg = true
            sel_text = sel_text.slice(1)
            index_increment = index_increment * -1
        }
        var new_text
        if (parseFloat(sel_text) == 0){ //special case
            if (index_increment == 1){
                new_text = sel_text.slice(0, sel_text.length - 1) + "1"
                sel_text_is_neg = false

            }
            else { new_text = sel_text.slice(0, sel_text.length - 1) + "1"
                sel_text_is_neg = true
            }
        }
        //pretend sel_text is positive
        else {
            var index_of_decimal  = sel_text.indexOf(".")
            var places_of_decimal = sel_text.length - index_of_decimal - 1
            var int_str = sel_text.slice(0, index_of_decimal) + sel_text.slice(index_of_decimal + 1) //ie remove the decimal
            var digits_in_int_str = int_str.length
            var int = parseInt(int_str)
            int += index_increment
            var str = "" + int
            for (; str.length < digits_in_int_str;) { //we've decrimented and lost a leading zero
                str = "0" + str
            }
            var new_text = str.slice(0, str.length - places_of_decimal) + "." + str.slice(str.length - places_of_decimal)
            if (new_text.startsWith(".")) { new_text = "0" + new_text }
        }
        if (parseFloat(new_text) == 0) {} //don't stick on neg sign if we're incremnting up to 0
        else if (sel_text_is_neg) { new_text = "-" + new_text }
        Editor.replace_selection(new_text, true)
        return new_text
    }

// replace "" with '' or ``
//string gaurenteed to start with single, double our backtick
//and end with the same char as first char
    static replacement_series_literal_string(sel_text, index_increment){
        var order = ['"', "'", "`"]
        var index = order.indexOf(sel_text[0])
        index += index_increment
        if (index < 0) { index = order.length - 1 }
        if (index == order.length) { index = 0 }
        var new_char = order[index]
        var new_text = new_char + sel_text.slice(1, sel_text.length - 1) + new_char
        Editor.replace_selection(new_text, true)
        return new_text
    }

    static replacement_series_hour_colon_minute_colon_second(sel_text, index_increment){
        var [hour_string, minute_string, second_string] = sel_text.split(":")
        if (index_increment == -1){
            if (second_string == "00"){
                second_string = "59"
                if (minute_string == "00") {
                    minute_string = "59"
                    if (hour_string == "00") {hour_string = "23" } //wrap
                    else {
                        var hour_int = parseInt(hour_string) + index_increment //decriment hour
                        hour_string = ((hour_int < 10)? "0" : "") + hour_int
                    }
                }
                else{ //normal case, hour doesn't change
                    var minute_int = parseInt(minute_string) + index_increment //decriment minute
                    minute_string = ((minute_int < 10)? "0" : "") + minute_int
                }
            }
            else { //minute and hour don't change
                var second_int = parseInt(second_string) + index_increment
                second_string = ((second_int < 10)? "0" : "") + second_int
            }
        }
        else { //index_increment == 1
            if (second_string == "59") {
                second_string = "00"
                if (minute_string == "59"){
                    minute_string = "00"
                    if (hour_string == "23") {hour_string = "00"} //wrap
                    else {
                        var hour_int = parseInt(hour_string)
                        hour_int = hour_int + index_increment //decriment hour
                        hour_string = ((hour_int < 10)? "0" : "") + hour_int
                    }
                }
                else { //normal case, hour doesn't change
                    var minute_int = parseInt(minute_string) + index_increment //incriment minute
                    minute_string = ((minute_int < 10)? "0" : "") + minute_int
                }
            }
            else{
                var second_int = parseInt(second_string) + index_increment //incriment minute
                second_string = ((second_int < 10)? "0" : "") + second_int
            }
        }
        var new_text = hour_string + ":" + minute_string + ":" + second_string
        Editor.replace_selection(new_text, true)
        return new_text
    }
    static replacement_series_hour_colon_minute(sel_text, index_increment=1){
        var [hour_string, minute_string] = sel_text.split(":")
        if (index_increment == -1){
            if (minute_string == "00") {
                minute_string = "59"
                if (hour_string == "00") {hour_string = "23" } //wrap
                else {
                    var hour_int = parseInt(hour_string) + index_increment //decriment hour
                    hour_string = ((hour_int < 10)? "0" : "") + hour_int
                }
            }
            else{ //normal case, hour doesn't change
                var minute_int = parseInt(minute_string) + index_increment //decriment minute
                minute_string = ((minute_int < 10)? "0" : "") + minute_int
            }
        }
        else { //index_increment == 1
            if (minute_string == "59"){
                minute_string = "00"
                if (hour_string == "23") {hour_string = "00"} //wrap
                else {
                    var hour_int = parseInt(hour_string)
                    hour_int = hour_int + index_increment //decriment hour
                    hour_string = ((hour_int < 10)? "0" : "") + hour_int
                }
            }
            else { //normal case, hour doesn't change
                var minute_int = parseInt(minute_string) + index_increment //incriment minute
                minute_string = ((minute_int < 10)? "0" : "") + minute_int
            }
        }
        var new_text = hour_string + ":" + minute_string
        Editor.replace_selection(new_text, true)
        return new_text
    }
    //Handles input formats of at least:
//Sat Mar 12 2016 17:36:19 GMT-0500 (EST) with or without the day of week, with or without the time
// the smallest format is "Mar 12 2016"
//and the "new_text" tries to have a similar format to the input format.
//inc and dec by 24 hours only.
    static replacement_series_date(sel_text, index_increment) {
        try{
            var old_date  = new Date(sel_text)
            var ms = old_date.valueOf()
            if (Number.isNaN(ms)) { shouldnt("Series.replacement_series_date passed: " + sel_text + " which is not a valid date.") }
            else {
                var new_ms = ms + (Series.milliseconds_in_a_day * index_increment)
                var new_date = new Date(new_ms)
                if (new_date.getDate() == old_date.getDate()){ //probably daylight savings time comming out to 11PM of the same day.
                                    //this happens when old_date is Nov 06 2016 and we try to increment it.
                    new_ms = new_ms + (1000 * 60 * 60 * 2 * index_increment) //add (or subtract) 2 hours and try again.
                    new_date = new Date(new_ms)
                }
                var new_text = new_date.toString()
                var colon_index = sel_text.indexOf(":")
                if (colon_index == -1){
                    colon_index = new_text.indexOf(":")
                    if (colon_index != -1){
                        new_text = new_text.slice(0, colon_index - 3)
                    }
                }
                if (Series.days_of_week_3_letters.indexOf(sel_text.slice(0, 3)) == -1){
                    new_text = new_text.slice(4)
                }
                Editor.replace_selection(new_text, true)
                return new_text
            }
        }
        catch (e){
            return false
        }
    }
    static replacement_series_color_rgb(sel_text, index_increment=1){
        let ints_string = sel_text.substring(4, (sel_text.length - 1))
        let ints = ints_string.split(",")
        ints[0] = Number.parseInt(ints[0])
        ints[1] = Number.parseInt(ints[1])
        ints[2] = Number.parseInt(ints[2])
        if (index_increment == 1) {
            ints[0] = (ints[0] + 1) % 256
            ints[1] = (ints[1] + 1) % 256
            ints[2] = (ints[2] + 1) % 256
        }
        else {
            ints[0] = ((ints[0] == 0) ? 255 : ints[0] - 1)
            ints[1] = ((ints[1] == 0) ? 255 : ints[1] - 1)
            ints[2] = ((ints[2] == 0) ? 255 : ints[2] - 1)
        }
        let result = "rgb(" + ints[0] + ", " + ints[1] + ", " + ints[2] + ")"
        return result
    }
    static the_new_job_string(){ return 'new Job({name: "my_job"})'}
    static job_dot_last_job_name(){
        if (Job.last_job){ return "Job." + Job.last_job.name }
        else { return Series.the_new_job_string() }
    }
    static is_string_a_job_name(str){
        if (str === Series.the_new_job_string()) { return true }
        else if (!str.startsWith("Job.")) { return false }
        else {
            let [j, job_name] = str.split(".")
            if (job_name && Job.is_job_name(job_name)) {return true}
            else { return false }
        }
    }
    static the_new_robot_string(){ return 'new Dexter({name: "my_dex"})'}
    static robot_dot_last_robot_name(){
        if (Robot.all_names.length > 0){
            let name = Robot.all_names[Robot.all_names.length -1]
            return "Robot." + name
        }
        return Series.the_new_robot_string()
    }
    static is_string_a_robot_name(str){
        if (str === Series.the_new_robot_string()) { return true }
        else if (!str.startsWith("Robot.")) { return false }
        else {
            let [j, name] = str.split(".")
            if (name && Robot.is_robot_name(name)) {return true}
            else { return false }
        }
    }
    static get_robot_name_array(){
        let result = [] //["new Dexter", "new Brain", "new Human", "new Serial"]
        for (let a_name of Robot.all_names){
            result.push("Robot." + a_name)
        }
        return result
    }

    //return hex string a la "#f0f8ff" or undefined
    static color_name_to_hex(color_name){
        return color_name_to_hex_map[color_name.toLowerCase()]
    }

    //"#04BBCC" => "rgb(4, 34, 56)"
    static hex_to_color_rgb(hex){
        let result = "rgb("
        let hex2 = hex.substring(1, 3)
        let int_str = parseInt(hex2, 16)
        result += int_str + ","
        hex2 = hex.substring(3, 5)
        int_str = parseInt(hex2, 16)
        result += int_str  + ","
        hex2 = hex.substring(5, 7)
        int_str = parseInt(hex2, 16)
        result += int_str
        result += ")"
        return result
    }

    //"rgb(0, 100, 255) => #00AAFF
    static color_rgb_to_hex(color_rgb){
        let ints_string = color_rgb.substring(4, (color_rgb.length - 1))
        let ints = ints_string.split(",")

        let int0 = (Number.parseInt(ints[0])).toString(16)
        if (int0.length === 1) { int0 = "0" + int0 }

        let int1 = (Number.parseInt(ints[1])).toString(16)
        if (int1.length === 1) { int1 = "0" + int1 }

        let int2 = (Number.parseInt(ints[2])).toString(16)
        if (int2.length === 1) { int2 = "0" + int2 }

        let result = "#" + int0 + int1 + int2
        return result
    }
    
    output_info(new_text){
        var info_string = Js_info.get_info_string(new_text)
        out(info_string, null, true)
    }
}
//used multiple places
Series.month_names_3_letters = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
Series.month_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September','October', 'November', 'December']
Series.days_of_week_3_letters = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] //I didn't make this a series because not so useful, but needed for shortening Date string

Series.milliseconds_in_a_day = 1000 * 60 * 60 * 24

var color_name_to_hex_map = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
        "beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
        "cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
        "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
        "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
        "darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
        "firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
        "gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
        "honeydew":"#f0fff0","hotpink":"#ff69b4",
        "indianred ":"#cd5c5c","indigo":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
        "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
        "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de",
        "lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
        "magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
        "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
        "navajowhite":"#ffdead","navy":"#000080",
        "oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
        "palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
        "red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
        "saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
        "tan":"#d2b48c", //conflicts with Math.tan
        "teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
        "violet":"#ee82ee",
        "wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
        "yellow":"#ffff00","yellowgreen":"#9acd32"}

var color_name_to_rgb_map = {}
function make_color_rgb_map(){
    for(let color_name in color_name_to_hex_map){
        let hex = color_name_to_hex_map[color_name]
        let rgb_str = Series.hex_to_color_rgb(hex)
        color_name_to_rgb_map[color_name] = rgb_str
    }
}

Series.init_series_instances = function(){
//{id:"required", series:null, in_series_fn:null, replace_sel_fn:null,
// menu_insertion_string:"required", menu_sel_start:true, menu_sel_end:null}
Series.instances = [
    //Standard JS Series
    new Series({id:"series_punctuation_id", array: [",", ";", ":", ".", "(", ")", "[", "]", "{", "}", '"', "'", "`", "/*", "*/", "//"],
        menu_insertion_string: ",",         menu_sel_start:true, menu_sel_end:null, sample: "," }),
    new Series({id:"series_boolean_id",     array: ["&&", "||", "!",  "true", "false", "null", "undefined"],
        menu_insertion_string:"true",       menu_sel_start:true, menu_sel_end:null, sample:"true"}),
    new Series({id:"series_bitwise_id",     array: ["&", "|", "^", "~", "<<", ">>", ">>>"],
        menu_insertion_string:"true",       menu_sel_start:true, menu_sel_end:null, sample:"true"}),

    //NUMBERS
    new Series({id:"series_integer_id",     in_series_fn:is_string_a_integer, replace_sel_fn: Series.replacement_series_integer,
        menu_insertion_string:"12",         menu_sel_start:true, menu_sel_end:null, sample:"12",
        get_sample: function(old_series, old_sel_text){
            if (old_series.id == "series_float_id"){ this.sample = old_sel_text.split(".")[0]}
            return this.sample
        }}),
    new Series({id:"series_float_id",       in_series_fn:is_string_a_float,   replace_sel_fn: Series.replacement_series_float,
        menu_insertion_string:"-0.02",      menu_sel_start:true, menu_sel_end:null, sample:"-0.01",
        get_sample: function(old_series, old_sel_text){
                        if (old_series.id == "series_integer_id"){
                            let [this_sample_int_string, remainder] = this.sample.split(".")
                            this.sample = old_sel_text + "." + remainder
                        }
                        return this.sample
                    }
    }),
    new Series({id:"series_global_js_id", array: ["eval", "isFinite", "isNaN", "parseFloat", "parseInt",
                          "decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent"],
        menu_insertion_string:'eval("2 + 3")', menu_sel_start:0, menu_sel_end:4, sample:"eval"}),
    new Series({id:"series_arithmetic_id",  array: ["+", "-", "*", "/", "%"],
        menu_insertion_string:"2 + 3",      menu_sel_start:2, menu_sel_end:3, sample:"+"}),
    new Series({id:"series_comparison_id",  array: ["<", "<=", "==", "===", ">=", ">", "!=", "!==", "instanceof"],
        menu_insertion_string:"2 < 3",      menu_sel_start:2, menu_sel_end:3, sample:"<"}),
    new Series({id:"series_math_id",        array: ["Math.abs",  "Math.cbrt",  "Math.ceil",  "Math.clz32",
                                                    "Math.exp",  "Math.expm1", "Math.floor", "Math.fround", "Math.hypot",
                                                    "Math.imul", "Math.log",   "Math.log10", "Math.log1p",  "Math.log2",
                                                    "Math.max",  "Math.min",   "Math.pow",   "Math.random", "Math.round",
                                                    "Math.sign", "Math.sqrt",  "Math.trunc"],
        menu_insertion_string:"Math.abs(-3)", menu_sel_start:0, menu_sel_end:8, sample:"Math.abs"}),
    new Series({id:"series_trigonometry_id",  array: ["Math.acos", "Math.acosh", "Math.asin", "Math.asinh", "Math.atan", "Math.atan2", "Math.atanh",
                                                      "Math.cos", "Math.cosh", "Math.sin", "Math.sinh", "Math.tan", "Math.tanh"],
        menu_insertion_string:"Math.sin(1)",  menu_sel_start:5, menu_sel_end:8, sample:"Math.sin"}),
    new Series({id:"series_number_misc_id",   array: ["Number.isFinite", "Number.isInteger", "Number.isNaN",  "Number.isSafeInteger", "Number.parseFloat", "Number.parseInt"],
        menu_insertion_string:"Number.isInteger(23)",  menu_sel_start:0, menu_sel_end:-4, sample:"Number.isInteger"}),
    new Series({id:"series_number_constant_id", array: ["Math.E", "Math.LN10", "Math.LN2", "Math.LOG10E", "Math.LOG2E",
                                                        "Math.PI", "Math.SQRT1_2", "Math.SQRT2",
                                                        "Number.EPSILON", "Number.MAX_SAFE_INTEGER", "Number.MAX_VALUE", "Number.MIN_SAFE_INTEGER",
                                                        "Number.MIN_VALUE", "Number.NEGATIVE_INFINITY", "Number.NaN", "Infinity", "Number.POSITIVE_INFINITY"],
        menu_insertion_string:"Math.PI", menu_sel_start:true, sample:"Math.PI"}),
    //END Numbers
    new Series({id:"series_assignment_id",  array: ["=", "+=", "-=", "*=", "/=", "%="],
        menu_insertion_string:"foo = 2",    menu_sel_start:4, menu_sel_end:5, sample:"="}),
    //STRINGS
    new Series({id:"series_literal_string_id", in_series_fn:is_string_a_literal_string, replace_sel_fn: Series.replacement_series_literal_string,
        menu_insertion_string:'"hello world"', menu_sel_start:true, menu_sel_end:null, sample:'"hello world"'}),
    new Series({id:"series_string_id",         array: ["charAt", "concat", "endsWith", "lastIndexOf", "length", "match",
                                                       "repeat", "replace", "search", "slice", "split", "startsWith",
                                                       "toLowerCase", "toUpperCase", "trim"],
        menu_insertion_string:'" hey!  ".trim()', menu_sel_start:10, menu_sel_end:14, sample:"trim"}),

    new Series({id:"series_array_id",          array: ["[0]", "concat", "every", "fill", "find", "findIndex", "indexOf",
                                                       "join", "lastIndexOf", "length", "pop", "push", "reverse",
                                                       "shift", "slice", "some", "sort", "unshift"],
        menu_insertion_string:"[2, 5, 3].sort()", menu_sel_start:10, menu_sel_end:14, sample:"sort"}),
    new Series({id:"series_forEach_id",        array:["forEach", "map", "filter", "reduce", "reduceRight"],
        menu_insertion_string:"[3, 5, 7].forEach(function(elt) {out(elt)})", menu_sel_start:10, menu_sel_end:17, sample:"forEach"}),
    //DATE
    new Series({id:"series_time_id",        in_series_fn:is_hour_colon_minute,              replace_sel_fn: Series.replacement_series_hour_colon_minute,
        menu_insertion_string:'"18:45"',    menu_sel_start:1, menu_sel_end:6, sample:"18:45",
        get_sample: function(old_series, old_sel_text){
                        if (old_series.id == "series_hours_minutes_seconds_id"){ this.sample = old_sel_text.substring(0, 5)}
                        return this.sample
                    }
    }),
    new Series({id:"series_hours_minutes_seconds_id", in_series_fn:is_hour_colon_minute_colon_second, replace_sel_fn: Series.replacement_series_hour_colon_minute_colon_second,
        menu_insertion_string:'"13:30:05"', menu_sel_start:1, menu_sel_end:9, sample:"13:30:05",
        get_sample: function(old_series, old_sel_text){
                        if (old_series.id == "series_time_id"){ this.sample = old_sel_text + ":00"}
                        return this.sample
                    }
    }),
    new Series({id:"series_3_letter_month_id", array: Series.month_names_3_letters,
        menu_insertion_string:'new Date("Apr 1 2016")', menu_sel_start:10, menu_sel_end:13, sample:"Apr",
        get_sample: function(old_series, old_sel_text){
                        if (old_series.id == "series_full_month_id"){
                            this.sample = old_sel_text.substring(0, 3)
                        }
                        return this.sample
                    }
    }),
    new Series({id:"series_full_month_id",  array: Series.month_names,
        menu_insertion_string:'"January"',  menu_sel_start:1, menu_sel_end:-1, sample:"January",
        get_sample: function(old_series, old_sel_text){
                        if (old_series.id == "series_3_letter_month_id"){
                            let old_index = old_series.array.indexOf(old_sel_text)
                            this.sample = this.array[old_index]
                        }
                        return this.sample
                    }
    }),
    new Series({id:"series_date_id",        in_series_fn:is_valid_new_date_arg, replace_sel_fn: Series.replacement_series_date,
        menu_insertion_string:'new Date("Nov 06 2016")', menu_sel_start:10, menu_sel_end:21, sample:"Nov 06 2016"}),

    new Series({id:"series_if_id",          array: ["if", "else if", "else"],
        menu_insertion_string:"else if",    menu_sel_start:true, menu_sel_end:null, sample:"else if"}),
    new Series({id:"series_for_id",         array: ["for", "while"],
        menu_insertion_string:'for(let i = 0; i < 3; i++){out(i, "magenta")}',    menu_sel_start:0, menu_sel_end:3, sample:"for"}),
    new Series({id:"series_try_id",         array: ["try", "catch", "finally"],
        menu_insertion_string:"try",        menu_sel_start:true, menu_sel_end:null, sample:"try"}),
    new Series({id:"series_function_id",    array: ["function", "function*", "yield", "return", "class"],
        menu_insertion_string:"function foo(a, b){return a + b}", menu_sel_start:0, menu_sel_end:8, sample:"function"}),

    //DDE (non standard JS) Series
    new Series({id:"series_color_name_id",  array: Object.keys(color_name_to_hex_map),
    /*"aqua", "aquamarine", "beige", "black", "blue", "brown", "coral", "cyan",
    "darkgrey", "gold", "grey", "green", "hotpink", "indigo", "ivory",
    "lavender", "lightgrey", "lime", "maroon", "magenta", "navajowhite", "orange",
    "plum", "purple", "red", "salmon", "skyblue", "turquoise", "violet", "white", "yellow",
    "rgb(0, 100, 255)", //all of these are in the 140 html colors supported in all browsers.*/
        menu_insertion_string:'"black"',    menu_sel_start:1, menu_sel_end:-1, sample:"black",
        get_sample: function(old_series, old_sel_text){
                        if (old_series.id == "series_color_rgb_id"){
                            let old_int_array = rgb_string_to_integer_array(old_sel_text)
                            let best_color_name = null
                            let best_int_array  = null
                            let best_score      = null
                            for(let poss_color_name in color_name_to_rgb_map){
                                let poss_color_rgb = color_name_to_rgb_map[poss_color_name]
                                let pos_int_array  = rgb_string_to_integer_array(poss_color_rgb)
                                let poss_score = Math.abs(old_int_array[0] - pos_int_array[0])
                                poss_score    += Math.abs(old_int_array[1] - pos_int_array[1])
                                poss_score    += Math.abs(old_int_array[2] - pos_int_array[2])
                                if ((best_color_name == null) || (poss_score < best_score)){
                                    best_color_name = poss_color_name
                                    best_int_array  = pos_int_array
                                    best_score      =  poss_score
                                }
                            }
                            this.sample = best_color_name
                        }
                        return this.sample
                    }
    }),
    new Series({id:"series_color_rgb_id",   in_series_fn:is_string_a_color_rgb, replace_sel_fn: Series.replacement_series_color_rgb,
        menu_insertion_string:"rgb(0, 100, 255)",         menu_sel_start:true, menu_sel_end:null, sample:"rgb(0, 100, 255)",
        get_sample: function(old_series, old_sel_text){
                        if (old_series.id == "series_color_name_id"){
                            let hex_color = color_name_to_hex_map[old_sel_text]
                            this.sample = Series.hex_to_color_rgb(hex_color)
                        }
                        return this.sample
                     }
        }),
                                                   //note that choose_file_and_get_content and get_page are really INPUT functions. change name of series to io or make a new input series?
    new Series({id:"series_output_id",      array: ['beep', 'beeps', 'Editor.insert', 'get_page', 'get_page_async','make_url', 'out', 'show_page', 'speak', 'recognize_speech'],
        menu_insertion_string: "beep({dur: 1, frequency: 440, volume: 1})",
        menu_sel_start:0, menu_sel_end:4, sample: "beep"}),
    new Series({id:"series_window_id",      array: ['clear_output', 'close_window', 'make_dom_elt', 'make_html', 'show_window',
                                                    'append_in_ui', 'get_in_ui', 'remove_in_ui', 'replace_in_ui', 'set_in_ui',
                                                    'set_window_frame_background_color', 'set_pane_header_background_color',
                                                    'set_menu_background_color', 'set_button_background_color',
                                                    'svg_svg', 'svg_circle', 'svg_ellipse', 'svg_html', 'svg_line',
                                                    'svg_polygon', 'svg_polyline', 'svg_rect', 'svg_text'],
        menu_insertion_string: 'show_window({content: "hi"})',
        menu_sel_start:0, menu_sel_end:11, sample: "show_window"}),

    new Series({id:"series_file_id",       array:['dde_apps_dir', 'load_files', 'file_content', "file_exists", 'choose_file_and_get_content', 'Editor.edit_file', 'write_file',
                                                  //'folder_listing',
                                                  'operating_system', 'folder_separator',
                                                  'persistent_set', 'persistent_get', 'persistent_remove', 'persistent_clear'],
        menu_insertion_string: 'load_files(["foo.js"])', menu_sel_start:0, menu_sel_end:10, sample: "load_files"}),
    new Series({id:"series_object_system_id", array: ['Root', 'newObject', 'callPrototypeConstructor', 'Object.isNewObject',
                                                        'subObjects', 'isSubObject', 'isA',
                                                        "siblings", "Object.areSiblings", "inheritsPropertyFrom", "ancestors",
                                                        "Object.allCommonAncestors", "Object.lowestCommonAncestor",
                                                        "normal_keys","objectPath", "sourceCode",
                                                        "hasOwnProperty",  "Object.getOwnPropertyNames",
                                                        "Object.keys", "Object.values", "Object.entries",
                                                        "Object.is", "isPrototypeOf", "Object.getPrototypeOf", "toString"
                                                         ],
        menu_insertion_string:"newObject({})", menu_sel_start:0, menu_sel_end:-4, sample:"newObject"}),

    //JOB
    new Series({id:"series_job_name_id",    in_series_fn: Series.is_string_a_job_name,
                                            array: function(){let result = [Series.the_new_job_string()]
                                                                for (let a_name of Job.all_names){
                                                                    result.push("Job." + a_name)
                                                                }
                                                                return result},
        menu_insertion_string: Series.job_dot_last_job_name, menu_sel_start: true, menu_sel_end:null, sample:Series.job_dot_last_job_name}),

    new Series({id:"series_job_method_id",
        //in_series_fn: function(str){return str.endsWith("props")},
        array: ["Job.insert_instruction","j1.start"],
        menu_insertion_string: "Job.insert_instruction()", menu_sel_start:0, menu_sel_end:-2, sample:"Job.insert_instruction()"}),

    new Series({id:"series_robot_instruction_id", array: ["Dexter.capture_ad", "Dexter.capture_points", "Dexter.cause_error",
                                                          "Dexter.dma_read", "Dexter.dma_write", "Dexter.draw_dxf", "Dexter.exit",
                                                          "Dexter.empty_instruction_queue_immediately", "Dexter.empty_instruction_queue",
                                                          "Dexter.find_home", "Dexter.find_home_rep", "Dexter.find_index",
                                                          "Dexter.get_robot_status", "Dexter.get_robot_status_immediately",
                                                          "Dexter.load_tables",  "Dexter.move_all_joints", "Dexter.move_all_joints_relative",
                                                            "Dexter.move_home",
                                                          "Dexter.move_to", "Dexter.move_to_relative", "Dexter.move_to_straight",
                                                          "Dexter.pid_move_all_joints", "Dexter.pid_move_to",
                                                          "Dexter.read_from_robot", "Dexter.run_gcode", "Dexter.record_movement", "Dexter.replay_movement",
                                                          "Dexter.set_follow_me", "Dexter.set_force_protect", "Dexter.set_keep_position", "Dexter.set_open_loop",
                                                          "Dexter.set_parameter", "Dexter.sleep",  "Dexter.slow_move",
                                                          "Dexter.write", "Dexter.write_to_robot",
                                                          //"Dexter.prototype.joint_angle", "Dexter.prototype.joint_angles", "Dexter.prototype.joint_xyz", "Dexter.prototype.joint_xyzs",  //beware: these are NOT instructions but 'utility fns.' they are documented.
                                                           "make_ins",
                                                          "Human.enter_choice", "Human.enter_instruction", "Human.enter_number",
                                                          "Human.enter_text",   "Human.notify", "Human.show_window", "Human.task",
                                                          "Serial.string_instruction",
                                                          "Robot.break", "Robot.debugger","Robot.error",
                                                          "Robot.get_page", "Robot.go_to", "Robot.grab_robot_status",
                                                          "Robot.if_any_errors", "Robot.label", "Robot.out",
                                                          "Robot.send_to_job", "Robot.sent_from_job", "Robot.start_job", "Robot.stop_job", "Robot.suspend", "Robot.sync_point",
                                                          "Robot.unsuspend", "Robot.wait_until"],
        menu_insertion_string:"Dexter.move_to()", menu_sel_start:0, menu_sel_end:-2, sample:"Dexter.move_to"}),
    new Series({id:"series_robot_config_id",
        array: ["Dexter.LEFT",          "Dexter.LEFT_DOWN",     "Dexter.LEFT_UP",       "Dexter.LEFT_IN",
                "Dexter.LEFT_OUT",      "Dexter.LEFT_DOWN_IN",  "Dexter.LEFT_DOWN_OUT", "Dexter.LEFT_UP_IN",
                "Dexter.LEFT_UP_OUT",   "Dexter.RIGHT",         "Dexter.RIGHT_DOWN",    "Dexter.RIGHT_UP",
                "Dexter.RIGHT_IN",      "Dexter.RIGHT_OUT",     "Dexter.RIGHT_DOWN_IN", "Dexter.RIGHT_DOWN_OUT",
                "Dexter.RIGHT_UP_IN",   "Dexter.RIGHT_UP_OUT"],
        menu_insertion_string:"Dexter.RIGHT_UP_IN", menu_sel_start:true, menu_sel_end:null, sample:"Dexter.RIGHT_UP_IN"}),
    new Series({id:"series_oplet_id",
                array:["a","B", "b", "c", "d","E", "e","F","f","G","g","h","i","l",
                       "m","n","o","P", "p","R","S", "s","t","W", "w","x","z"],
        menu_insertion_string:"S", menu_sel_start:true, menu_sel_end:null, sample:"S"}),
    new Series({id:"series_dexter_utility_id",
        //in_series_fn: function(str){return str.endsWith("props")},
        array: ["Robot.dexter0.joint_angle","Robot.dexter0.joint_angles","Robot.dexter0.joint_xyz","Robot.dexter0.joint_xyzs", "Robot.dexter0.prop"],
        menu_insertion_string:"Robot.dexter0.prop()", menu_sel_start:0, menu_sel_end:-2, sample:"Robot.dexter0.prop()"}),
    new Series({id:"series_dexter_constant_id",    array: [ 'Dexter.ACCELERATION', 'Dexter.HOME_ANGLES', 'Dexter.NEUTRAL_ANGLES', 'Dexter.PARKED_ANGLES',
                                                            "Dexter.HOME_POSITION", "Dexter.NEUTRAL_POSITION",
                                                            "Dexter.J1_ANGLE_MIN", "Dexter.J1_ANGLE_MAX",
                                                            "Dexter.J2_ANGLE_MIN", "Dexter.J2_ANGLE_MAX",
                                                            "Dexter.J3_ANGLE_MIN", "Dexter.J3_ANGLE_MAX",
                                                            "Dexter.J4_ANGLE_MIN", "Dexter.J4_ANGLE_MAX",
                                                            "Dexter.J5_ANGLE_MIN", "Dexter.J5_ANGLE_MAX",
                          'Dexter.LINK1', 'Dexter.LINK2', 'Dexter.LINK3', 'Dexter.LINK4', 'Dexter.LINK5',
                          'Dexter.LINK1_AVERAGE_DIAMETER', 'Dexter.LINK2_AVERAGE_DIAMETER', 'Dexter.LINK3_AVERAGE_DIAMETER', 'Dexter.LINK4_AVERAGE_DIAMETER', 'Dexter.LINK5_AVERAGE_DIAMETER',
                          'Dexter.LEG_LENGTH', 'Dexter.MAX_SPEED', 'Dexter.START_SPEED'
                                                            ],
        menu_insertion_string:"Dexter.LINK1", menu_sel_start:true, menu_sel_end:null, sample:"Dexter.LINK1"}),

    new Series({id:"series_set_parameter_name_id",
          array: ["J1Force","J2Force","J3Force", "J4Force","J5Force",
                  "J1Friction","J2Friction","J3Friction","J4Friction","J5Friction",
                  "J1BoundryHigh","J1BoundryLow","J2BoundryHigh","J2BoundryLow","J3BoundryHigh","J3BoundryLow","J4BoundryHigh","J4BoundryLow","J5BoundryHigh","J5BoundryLow",
                  "Acceleration", "EERoll","EESpan","End", "GripperMotor", "MaxSpeed","StartSpeed"],
        menu_insertion_string:"J1Force", menu_sel_start:true, menu_sel_end:null, sample:"J1Force"
    }),
    new Series({id:"series_robot_status_label_id", array: function(){ return Dexter.robot_status_index_labels},
        menu_insertion_string: function(){return Series.job_dot_last_job_name() + '.robot.robot_status[Dexter.J1_ANGLE]'},
                                              menu_sel_start: -16,  menu_sel_end:-1, sample:"Dexter.J1_ANGLE"}),
    new Series({id:"series_robot_subclass_id", array:["Dexter", "Brain", "Human", "Serial"],
        menu_insertion_string:'new Dexter({name: "my_dex"})', menu_sel_start: 4,  menu_sel_end:10, sample:"new Dexter"}),

    new Series({id:"series_robot_name_id", array: Series.get_robot_name_array,
        menu_insertion_string: 'Robot.dexter0',
        menu_sel_start: 0, sample: Series.robot_dot_last_robot_name}),
    new Series({id:"series_serial_id", array: ['serial_devices', 'serial_path_to_info_map',
                                               'serial_connect_low_level', 'serial_send_low_level', 'serial_flush', 'serial_disconnect'],
        menu_insertion_string: 'serial_devices()',
        menu_sel_start: 0,  menu_sel_end: -2, sample: "serial_devices"}),

    new Series({id:"series_note_id", array: ["arpeggio", "copy", "concat", "filter", "increment_property",
                           "multiply_property", "merge", "repeat",
                            "set_property", "start", "time_interval",  "transpose"],
        menu_insertion_string:'new Note("C#4").transpose(2)', menu_sel_start:16, menu_sel_end:25, sample:"transpose"}),

    new Series({id:"series_phrase_id", array: ["arpeggio", "copy", "concat", "filter", "increment_property",
        "multiply_property", "merge", "repeat",
        "set_property", "start", "time_interval", "transpose", "Phrase.pattern" ],
        menu_insertion_string:'new Phrase("C D").transpose(2)', menu_sel_start:18, menu_sel_end:27, sample:"transpose"}),

    //the problem with test suites as a series is that the left and right
    //arrow keys are used for both executing test suites AND moving to
    //the next item in the series. Now choosing test suite from
    //the series menu inserts the first test suite, but
    //from then on the left and right arrows execute the test suite, not
    //get the next in the series, ie another test suite.
    //maybe shift_right_arrow to get next TS in series?
    new Series({id:"series_test_suite_id",
                in_series_fn: TestSuite.is_string_test_suite,
                array: TestSuite.get_ts_source_array,
                menu_insertion_string: function(){return TestSuite.suites[0].to_source_code()},
                menu_sel_start: true,
                menu_sel_end:null,
                sample:"Dexter"}),

    new Series({id:"series_html_tag_id",
                array:html_db.tags,
                menu_insertion_string:'make_html("div", {id: "greeting"}, "Hi")',
                menu_sel_start:11,
                menu_sel_end:-26,
                sample:'div'
        }),
    new Series({id:"series_html_property_id",
        array:html_db.html_properties,
        menu_insertion_string:'href',
        menu_sel_start:0,
        //menu_sel_end:,
        sample:'href'
    }),
    new Series({id:"series_css_property_id",
        array:html_db.css_properties,
        menu_insertion_string:'background-color',
        menu_sel_start:0,
        //menu_sel_end:,
        sample:'href'
    })
]
}

