import dayjs from "dayjs"; //just testing importing a random npm module from node_modules folder
import {EvalTest} from "./evaltest.js"
import {readyje, testjefn} from "../job_engine/mainje.js"

function test_action(){
    console.log("this is the test npm action")
    let result = dayjs()
    console.log("dayjs() => " + result)
    output_pane_id.innerHTML = "days() returned: " + result
}

//https://developer.mozilla.org/en-US/docs/Web/API/Window/getSelection
export function get_selection(){
    let src = window.getSelection().toString()
    if(src.length === 0) { src = editor_id.value }
    return src
}


export function ready(){
  console.log("top of ready")
  testjefn()
  test_npm_id.onclick = test_action

  prompt_id.onclick = function(){
      let str = prompt("Type in some text", "default text")
      output_pane_id.innerHTML = "Prompt returned: " + str
  }
  eval_id.onclick = function(){
      let src = get_selection()
      let result = EvalTest.do_eval(src)
      output_pane_id.innerHTML = src + " => " + result
  }

    /* doesn't work
  function open_dev_tools(){
      let ev = document.createEvent("MouseEvents")
      ev.initMouseEvent("click", true, false, window,0,0,0,0,0,false,false,false,false,2,null);
      body_id.dispatchEvent(ev);
  }
  */
  step_id.onclick = function(){
      //open_dev_tools()
      let src = get_selection()
      let result = EvalTest.do_eval(src, true)
      output_pane_id.innerHTML = src + " => " + result
  }
}
readyje()
ready()