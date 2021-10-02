import "shepherd.js/dist/css/shepherd.css"
import Shepherd from "/shepherd.js"

set_css_properties(".shepherd_step {background-color:#ffcdb0; width:300px;}")
set_css_properties(".shepherd-modal-overlay-container.shepherd-modal-is-visible{opacity:0.4}")

var Lesson = class Lesson{
    /*always returns the constructed HTML, and, if there's a location, sticks it somewhere
    name=null, //but can be any string
    steps=[], //array of html strings, most commonly constructed by calls to make_button_html
    location = null, //null, "doc_pane_top_level", dom elt, string-that-evals-to_don_elt, doc_pane_details_summary_string, "show_window" to make a new show_window
    position = "beforeend", //one of "beforebegin", "afterbegin", "beforeend", "afterend"
    html_wrapper="details", //typically "details", "fieldset", "div" or null for  none.
    open = false,
    add_spinner=true,
    default_method="DDEVideo.show_in_misc_pane"}){ //for text & html "steps".
   */
    static make_button_column({name=null,
                               steps=[],
                               location = null,
                               position = "beforeend",
                               html_wrapper="details",
                               open = false,
                               add_spinner=true,
                               default_method="DDEVideo.show_in_misc_pane"}){
        let html = ""
        let html_suffix = ""
        let spinner_html = ""
        if(add_spinner) {
            spinner_html = `&nbsp;<input type="number", onclick="Lesson.spinner_onclick(event, '` + default_method + `')" value="0", min="1", max="` +
                            steps.length +
                            '" style="width:30px; height:20px; font-size:14px;"/>' +
                           " of " + steps.length
        }
        if(typeof(name) == "string"){
            if(html_wrapper == "details") {
                let open_html = (open? "open" : "")
                let details_class_html = ((location == "doc_pane_top_level") ? "" : " class='doc_details' ")
                let summary_class_html = ((location == "doc_pane_top_level") ? " class='doc_top_level_summary' " : "")
                html += "<details class='steps_container' " + details_class_html + open_html +
                        "><summary " + summary_class_html +
                        "><b>" + name +
                        spinner_html + "</b></summary>\n"
                html_suffix = "\n</details>"
            }
            else if(html_wrapper == "fieldset") {
                html += "<fieldset  class='steps_container' " + "><legend><b>" + name + "</b></legend>\n"
                html_suffix = "\n</fieldset>"
            }
            else if(html_wrapper){ //like "div"
                html += "<" + html_wrapper + " class='steps_container'><b>" + name + "</b><br/>\n"
                html_suffix = "\n</" + html_wrapper + ">"
            }
            //else no wrapper
        }
        html += "<table style='border-width:0px;'>"
        for(let i = 0; i < steps.length; i++){
            let step = steps[i]
            let action =    ((step.startsWith("<button ")) ? "" : ` onclick="Lesson.outer_step_onclick(event, '` + default_method + `')" `)
            let td_style_extra =  ((step.startsWith("<button ")) ? "" : "max-height:20px; display:block; overflow:hidden; border-style:solid; border-width:1px;")
            step = '<tr class="step_wrapper" ' + action + 'margin-top:10px;margin-left:20px;' +
                       '"><td style="border:none;">&nbsp;&nbsp;&nbsp</td>' +  //checkmark container
                         '<td style="border:none;">' + (i + 1) + '. </td>' +  //step number container
                         '<td style="border:none;'   + td_style_extra + '">' + step + '</td>' +
                   '</tr>' //inner_step container
            //if(i < (steps.length - 1)) {step += "<br/>"}
            html += step
        }
        html += "</table>" + html_suffix
        let location_dom_elt = ((location instanceof HTMLElement) ? location : value_of_path(location))
        if(location == "doc_pane_top_level") {
            location_dom_elt = doc_pane_content_id
        }
        if(location === "show_window"){
            show_window({title: name,
                        content: html
                       })
        }
        else if(location_dom_elt instanceof HTMLElement) {
            let valid_positions = ["beforebegin", "afterbegin", "beforeend", "afterend"]
            if(!valid_positions.includes(position)){
                dde_error('make_button_column passed position of: <code>"' + position +
                    '"</code><br/> that is not one of "' + valid_positions.join('", "') + '"')
            }
            else {
                location_dom_elt.insertAdjacentHTML(position, html)
            }
        }
        else if(typeof(location) === "string"){ //we've got a details-summary string.
            insert_html_into_doc_pane(html, location, position)
        }
        //else we're not installing this html anywhere, just return it.
        return html
    }

    //icon can also be: "info", "pencil" OR any html esp entity references like "&lt;"
    static make_button_html({icon="right_triangle",
                             label="",
                             tooltip="",
                             method="DDEVideo.show_in_misc_pane",
                             args=[],
                             start,
                             end,
                             autoplay=true}){
        if     (icon == "bicycle")        { icon = "&#128690;"} //for tours
        else if(icon == "right_triangle") { icon = "&#9654;"}   //for video play button
        else if(icon == "info")           { icon = "&#9432;"}   //circled "i"
        else if(icon == "pencil")         { icon = "&#9998;"}
        let full_label = ""
        full_label += icon
        if(start !== undefined) { //I want to capture if its 0
            start = string_to_seconds(start)
            if(end) {
                end = string_to_seconds(end)
                full_label += " " + start + " - " + end
            }
            else { full_label += " " + start }
        }
        else if (end !== undefined) {
            end = string_to_seconds(end)
            full_label += " - " + end
        }
        full_label += " " + label

        let arg0 = ((args.length > 0) ? args[0] : null)
        let is_arg0_youtube_url = ((arg0 === null) ? false : arg0.includes("www.youtube.com"))
        if(is_arg0_youtube_url){
            if(!arg0.includes("?")) { //the usual
                arg0 += "?"
                if(autoplay)  { arg0 += "autoplay=1&" }
                if(start !== undefined) { start = string_to_seconds(start) //we want to capture 0
                            arg0 += "start=" + start + "&"
                }
                if(end !== undefined)   { end   = string_to_seconds(end)
                            arg0 += "end=" + end
                }
            }
            args[0] = arg0
        }
        let click_args = ""
        if(method){
            let args_src_arr = []
            for(let arg of args){
                let src = to_source_code({value: arg}) //wraps double quotes around strings.
                src = replace_substrings(src, '"', "'") //use double quotes for inner action, but could use single quotes instead
                args_src_arr.push(src)
            }
            click_args = args_src_arr.join(", ")
        }
        //action = "out('789')"
        let html_result = "<button " + "title='" + tooltip + "' " +
                          `onclick="Lesson.outer_step_onclick(event, '` + method + "', " + click_args + `)" ` + // works: 'onclick="out(456)
                          ">" +
                          full_label + "</button>"  //note: lots of trouble stepping thru this code,
                          //and displaying it in the output pane. But works if put into its own show_window.
        return html_result
    }

    static check_inner_html(event){
        let the_elt = event.target //usually a button element
        if(the_elt.innerText.charCodeAt(0) !== 10003) { //only put at most 1 checkmark.
            the_elt.innerHTML = "<b>&check;</b>" + the_elt.innerHTML //"&#10003;"
        }
    }
    static do_check_inner_step_elt(inner_step_elt){
        let tr_elt = inner_step_elt.closest("TR")
        let checkmark_td_elt = tr_elt.firstElementChild
        checkmark_td_elt.innerHTML = "<b>&check;</b>" //just always check it, even if already checked. Its simpler
        //if(outer_dom_elt.innerText.charCodeAt(0) !== 10003) { //only put at most 1 checkmark.
        //    the_elt.innerHTML = "<b>&check;</b>" + the_elt.innerHTML //"&#10003;"
        //}
    }

    static button_step_onclick(event, method, ...args){
        let inner_step_elt = event.target //a button dom elt.
        this.do_inner_step_elt_action(inner_step_elt, method, ...args)
    }

    //the action for user clicking on an html step not a button step. event.target is the outer (div) html elt.
    static outer_step_onclick(event, default_method, ...args) {
        let inner_step_elt = event.target //even though the onclick is on the outer div, when you click on the text
                                          //the event target is the inner div.
        if(inner_step_elt.className === "step_wrapper"){ //whoops, user really clicked on the OUTER step div
            inner_step_elt = inner_step_elt.children[2]
        }
        //let kids = outer_step_elt.children
        //let inner_step_elt = kids[2]
        this.do_inner_step_elt_action(inner_step_elt, default_method, args)
    }

    static spinner_onclick(event, default_method, ...args){
       let spinner_dom_elt = event.target
       let steps_container =  spinner_dom_elt.closest(".steps_container")
       let table_dom_elt   =  steps_container.querySelector("table")
       let tr_elts         = table_dom_elt.children[0].children
       //let buttons_elts = the_steps_container.children
       //let button_elts_len = buttons_elts.length
       //let first_step_index = ((["DETAILS", "FIELDSET"].includes(the_steps_container.tagName)) ? 1 : 0)
       let ui_index = parseInt(spinner_dom_elt.value) //this is intended to be 1 based. so 1 means the first step
       if(ui_index < 1) { //happens at very beginning when 0 is shown and user clicks down arrow,
                            //this causes big problems if shown
           warning("Clicking down arrow isn't valid when index shown is 0.<br/>" +
                    "Please click the up arrow to perform the first step.")
           return

       }
       let tr_elt_index =  ui_index - 1 //make it 0 based.
       let tr_elt = tr_elts[tr_elt_index]
       let td_elt = tr_elt.children[2]
       let inner_step_elt = td_elt.firstElementChild
       this.do_inner_step_elt_action(inner_step_elt, default_method, args)
    }

    //called indirectly from onclick for spinner, button, and outer-html onclicks.
    static do_inner_step_elt_action(inner_step_elt, method, args){
        let meth = value_of_path(method) //usually "DDEVideo.show_in_misc_pane"
        if(!Array.isArray(args)) { args = [] }
        if(inner_step_elt.tagName === "BUTTON"){
            if(args.length === 0) { //happens the first time around when we don't have the args.
                inner_step_elt.click()
            }
            else { //happens the second time around when we have args, ie play a video
                meth.apply(null, args)
            }
        }
        else { //inner_step_elt is not a button
            args.unshift(inner_step_elt)
            meth.apply(null, args)
        }
        this.do_check_inner_step_elt(inner_step_elt)
    }

   //_________ TOUR ____________
    static tours = []
    static get_tour(tourName){
        for(let tour of this.tours){
            if(tour.options.tourName == tourName) { return tour }
        }
        return null
    }

    static add_tour(new_tour){
        for(let i = 0; i < this.tours.length; i++){
            let a_tour = this.tours[i]
            if(a_tour.options.tourName == new_tour.options.tourName) {
                this.tours[i] = new_tour //Replace old same_named tour
                return
            }
        }
        this.tours.push(new_tour) //brand new tour
    }

    static start_tour(tourName){
        let tour = this.get_tour(tourName)
        if(tour) {
            tour.start()
        }
        else {
            dde_error("No tour with name: " + tourName + " is known.")
        }
    }

    static make_tour({name="my_tour",
                      steps=[[]],
                      useModalOverlay=true,
                      defaultStepOptions=null}={}
                    ){
        let the_tour = new Shepherd.Tour({tourName: name,
                                          useModalOverlay: useModalOverlay})
        let step_objs = []
        if(steps.length == 0) {
            warning("Lesson.make_tour called with no steps for tour: " + tourName)
        }
        for(let i = 0; i < steps.length; i++){
            let step_arr = steps[i]
            let obj = this.make_tour_step(step_arr, the_tour, i, steps.length)
            step_objs.push(obj)
        }
        let options = Lesson.make_step_default_options(the_tour)
        for(let key in defaultStepOptions) {
            options.key = defaultStepOptions[key] //overrides a default option or makes a new one.
        }
        the_tour.options.defaultStepOptions = options
        the_tour.addSteps(step_objs)
        this.add_tour(the_tour)
        return the_tour
    }

    static make_step_default_options(the_tour){
        let default_options = {
            classes: 'shepherd_step',
            scrollTo: true,
            cancelIcon: {enabled: true, label: "Exit tutorial"},
            arrow: false,
            when: { //from https://shepherdjs.dev/docs/tutorial-04-cookbook.html
                show() {
                    const currentStepElement = the_tour.currentStep.el;
                    const header = currentStepElement.querySelector('.shepherd-header');
                    const progress = document.createElement('span');
                    progress.style['margin-right'] = '15px';
                    progress.innerHTML = "<span style='margin-right:20px;'>" + the_tour.options.tourName +
                        "</span> <span style='font-size:13px;'>step " +
                        (the_tour.steps.indexOf(the_tour.currentStep) + 1) +
                        " of " + the_tour.steps.length +
                        "</span>"
                    header.insertBefore(progress, currentStepElement.querySelector('.shepherd-cancel-icon'));
                }
            },
            buttons: [{text: 'Back', action: the_tour.back},
                      {text: 'Next', action: the_tour.next}]
        }
        return default_options
    }


    static valid_tour_step_locations = ["top", "top-start", "top-end",
                                        "bottom", "bottom-start", "bottom-end",
                                        "left", "left-start", "left-end",
                                        "right", "right-start", "right-end"]

    static make_tour_step(step_array, the_tour, step_number, steps_length){
        let text     = (step_array[0] ? step_array[0] : "html goes here")
        let selector = (step_array[1] ? step_array[1] : null)
        let location = (step_array[2] ? step_array[2] : "right")
        let distance = (step_array[3] ? step_array[3] : 0)
        let options  = (step_array[4] ? step_array[4] : {})
        let tourName = the_tour.options.tourName

        if(!this.valid_tour_step_locations.includes(location)){
            dde_error("In make_tour: " + tourName + " step of: " + step_array +
                       "<br/>got invalid location (2nd elt) of: " + location +
                       "<br/>It must be one of: <br/>" +
                       to_source_code({value: Lesson.valid_tour_step_locations}))
        }

        if(selector) {
            if(typeof(selector) == "string"){
                options.attachTo = {element:  selector, on: location}
            }
            //else {
            //    dde_error("In make_tour: " + tourName + " step of: " + step_array +
            //              "<br/>got invalid selector (1st elt) of: " + selector +
            //              "<br/>It must be a string.")
            //}
        }
        if (typeof(distance) == "number"){
            if(distance == 0) {}
            else {
                let popper_options = options.popperOptions
                if(popper_options) {}
                else {
                    options.popperOptions = {modifiers: [{ name: 'offset', options: { offset: [0, distance] } }]}
                }
            }
        }
        else {
            dde_error("In make_tour: " + tourName + " step of: " + step_array +
                      "<br/>got invalid distance (3rd elt) of: " + distance +
                      "<br/>It must be a number.")
        }
        if(typeof(text) == "string") {
            options.text = text
        }
        else {
            dde_error("In make_tour: " + tourName + " step of: " + step_array +
                "<br/>got invalid text (4th elt) of: " + text +
                "<br/>It must be a string (plain text or HTML).")
        }
        if(!options.buttons){
            if(steps_length == 1) {
                options.buttons = [{text: 'Exit', action: the_tour.complete}]
            }
            else if(step_number == 0) { //on the first step of a multi-step tour
                options.buttons = [{text: 'Next', action: the_tour.next}]
            }
            else if(step_number == (steps_length - 1)){//on the last step of a multi_step tour
                options.buttons = [{text: 'Back', action: the_tour.back},
                                   {text: 'Exit', action: the_tour.complete}]
            }
        }
        return options
    }
}
/*
Lesson.make_button_html({label: "Introduction", start: 15, end: "1:30", args: "https://www.youtube.com/embed/Al2NUrO4HAU"})

    <button style="margin-top:5px;margin-left:20px;"
onclick='check_inner_html(event); DDEVideo.show_in_misc_pane("https://www.youtube.com/embed/Al2NUrO4HAU?autoplay=1&start=0&end=11")'>
    &#9654; 0:00 - 0:11 Introduction</button><br/>


Lesson.make_tour(tourName="", useModalOverlay=true, defaultStepOptions=null, steps)

To change the overlay mid tour
have a step's "options" contain:
{when: {show: function(){ out("now showing the stepper step")
                                this.tour.options.useModalOverlay = false
                                }}}

a step is:
[selector=null, location="right", distance=0, html, options={}]

{attachTo: {element: '.dui_dialog', on: 'right'},
   text: `Make a few more instructions by <br/>
          clicking on the <b>instruction</b> button
          (bottom-right)
          and adjusting each new instruction's joint angle arguments.`,
   popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 0] } }]}
  }

*/