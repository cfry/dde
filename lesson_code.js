set_css_properties(".shepherd_step {background-color:#ffcdb0; width:300px;}")
set_css_properties(".shepherd-modal-overlay-container.shepherd-modal-is-visible{opacity:0.4}")

var Lesson = class Lesson{
    static make_button_html({icon="right_triangle", //also "info", "pencil" OR any html esp entity references like "&lt;"
                             label="",
                             check_when_clicked=true,
                             method="show_in_misc_pane",
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
        if(start) {
            start = string_to_seconds(start)
            if(end) {
                end = string_to_seconds(end)
                full_label += " " + start + " - " + end
            }
            else { full_label += " " + start }
        }
        else if (end) {
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
                if(start) { start = string_to_seconds(start)
                            arg0 += "start=" + start + "&"
                }
                if(end)   { end   = string_to_seconds(end)
                            arg0 += "end=" + end + "&"
                }
            }
            args[0] = arg0
        }
        let action = ""
        if(check_when_clicked) { action += "check_inner_html(event); " }
        if(method){
            let args_src_arr = []
            for(let arg of args){
                let src = to_source_code({value: arg}) //wraps double quotes around strings.
                src = replace_substrings(src, '"', "'") //use single quotes for inner action
                args_src_arr.push(src)
            }
            action += method + "("  + args_src_arr.join(", ") + ");"
        }

        let result = '<button style="margin-top:5px;margin-left:20px;" ' +
                     '\n         onclick="' + action + '">' +
                      "\n " + full_label + "</button>"

        return result
    }

   //// TOUR
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
var Shepherd = require("shepherd.js")
/*
Lesson.make_button_html({label: Introduction, start: 15, end: "1:30", args: "https://www.youtube.com/embed/Al2NUrO4HAU"}

    <button style="margin-top:5px;margin-left:20px;"
onclick='check_inner_html(event); show_in_misc_pane("https://www.youtube.com/embed/Al2NUrO4HAU?autoplay=1&start=0&end=11")'>
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