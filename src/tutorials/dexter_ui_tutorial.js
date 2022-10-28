/* dde4 now in SplashScreen.start_dui_tutorial
//doc: https://shepherdjs.dev/docs/tutorial-02-usage.html  orig tan color: #ffcdb0
set_css_properties(".shepherd_step {background-color:#ffdfc0; width:300px;}")
set_css_properties(".shepherd-modal-overlay-container.shepherd-modal-is-visible{opacity:0.4}")
set_css_properties(".shepherd_step_dui_wide {width:400px}")
*/
// npm install shepherd.js --save  
// shepherd.js@8.0.2
//var Shepherd = require("shepherd.js") //in dde4, Shephard is global

//import Shepherd from "shepherd.js" //fails "shepherd" //fails "shepherd.js/dist/js/shepherd.esm.js"    //failed "shepherd.js"
import Shepherd from "shepherd.js"
//globalThis.Shepherd = Shepherd
export var dui_tour = new Shepherd.Tour({
  tourName: "Dexter UI",
  useModalOverlay: true
})
  
dui_tour.options.defaultStepOptions = {
    classes: 'shepherd_step',
    scrollTo: true,
    cancelIcon: {enabled: true, label: "Exit tutorial"},
    arrow: false,
    when: { //from https://shepherdjs.dev/docs/tutorial-04-cookbook.html
      show() {
        SW.close_window("Welcome to DDE")
        const currentStepElement = dui_tour.currentStep.el;
        const header = currentStepElement.querySelector('.shepherd-header');
        const progress = document.createElement('span');
        progress.style['margin-right'] = '15px';
        progress.innerHTML = "<span style='margin-right:20px;'>" + dui_tour.options.tourName + 
                             "</span> <span style='font-size:13px;'>step " + 
                             (dui_tour.steps.indexOf(dui_tour.currentStep) + 1) + 
                             " of " + dui_tour.steps.length +
                             "</span>"
        header.insertBefore(progress, currentStepElement.querySelector('.shepherd-cancel-icon'));        
      }
    },
    buttons: [{text: 'Back', action: dui_tour.back},
              {text: 'Next', action: dui_tour.next}]
}

dui_tour.addSteps([
    {classes: "shepherd_step_dui_wide",
        text: `This tutorial teaches you how to:
          <ol><li><b>Move</b> Dexter's joints interactively.</li>
              <li>Move to an <b>X, Y, Z</b> location.</li>
              <li>The relationship between joint angles and an x,y,z location (<b>kinematics</b>).</li>
              <li>Create a <b>Job</b> (A formal process description for a task in DDE) 
                  and its "move" instructions.</li>
              <li><b>Run</b> individual instructions in a Job.</li>
              <li>Run an entire Job.</li>
          </ol>`,
        buttons: [{text: 'Next', action: dui_tour.next}],
    },

    {attachTo: {element: '#simulate_radio_button_group', on: 'top'},
        text: `If you have not yet configured Dexter,
          don't have a working Dexter connected,
          or aren't sure,
          please select <b>simulate</b> (if it isn't already).<p></p>
          If you have connected a working Dexter to this computer,
          and want to move it in this tutuorial,<br/>
          select <b>real</b> to move a real robot.`,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 20] } }]},
    },
    {classes: "shepherd_step_dui_wide",
        text: `Using this tutorial with <b>real</b> selected will move Dexter.
               Please clear its surrounding area and move Dexter slowly.`,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 20] } }]},
    },

    {text: `If you <b>didn't</b> see the <i>Dexter User Interface</i> dialog box just pop up,
            please try:
            <ul>
            <li>Check the lower left Output pane in DDE for warnings.
            One common problem: With <b>real</b> checked, your
            Dexter may not be connected.</li>
            <li>Click the <b>X</b> in this window.
            You can start the tutorial over and choose <b>simulate</b> or<br/>
            choose the <b>Configure Dexter</b> tutorial.
            </li>
            </ul>
            Otherwise, just click <b>Next</b>.`,
        when: {
            show() {
                const currentStepElement = dui_tour.currentStep.el;
                const header = currentStepElement.querySelector('.shepherd-header');
                const progress = document.createElement('span');
                progress.style['margin-right'] = '15px';
                progress.innerHTML = "<span style='margin-right:20px;'>" + dui_tour.options.tourName +
                    "</span> <span style='font-size:13px;'>step " +
                    (dui_tour.steps.indexOf(dui_tour.currentStep) + 1) +
                    " of " + dui_tour.steps.length +
                    "</span>"
                header.insertBefore(progress, currentStepElement.querySelector('.shepherd-cancel-icon'));
                //out("after sim")
                //Job.define_and_start_job(__dirname + '/user_tools/dexter_user_interface2.js')
                dui2.make_job()
            }
        },
    },
    {attachTo: {element: '.dui_dialog [name=direction_checkbox]', on: 'top'},

        text: `Often you want Dexter's end effector pointed down to work on the table surface.
               But for this tutorial, its easiest to not use that constraint.<br/>
               Please uncheck this checkbox.`,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 15] } }]}
    },
    {attachTo: {element: '.dui_dialog [name=j2_range]', on: 'left'},

        text: `Observe that under the big red square, the "J2" slider is highlighted.<br/>
          ("J2" stands for Dexter's joint 2.)<br/>
          Drag the <b>joint 2</b> slider <i>very</i> slowly for just a short distance.
          (Dexter has a maximum speed that's slower than you can drag.)<br/>
          Observe that the simulated Dexter's <b>joint 2</b> changes.<br/>
          Notice that other controls' values change in concert.`,
        //see https://popper.js.org/docs/v2/modifiers/offset/
        //where in the array, the first int is "skidding" and the 2nd is "distance"
        //from the elt. Pos distance means further away from the element.
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 30] } }]}
    },
    {attachTo: {element: '.dui_dialog [name=j3_range]', on: 'left'},
        text: `Drag the joint 3 slider very slowly.<br/>
          Observe that Dexter's <b>joint 3</b> changes.<br/>
          Notice that other controls change too.`,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 30] } }]}
    },
    {classes: "shepherd_step_dui_wide",
        text: `There are two basic ways to move Dexter. 
               <ol>
               <li>Move the joints. This is low level and gives you explicit control
                   of the angle of each joint, independent of the other joints.</li>
               <li>Move Dexter's end effector to a particular x, y, z coodinate.
                   This is higher level and often more useful for practical positioning.</li>
               </ol>
               The Dexter UI dialog box helps you understand the relationship between these
               two coordinate systems, an important concept called <i>Kinematics</i>.`,
        buttons: [{text: 'Next', action: dui_tour.next}],
    },

    {attachTo: {element: '.dui_dialog [name=z_slider]', on: 'right'},
        text: `Drag the Z slider's dot slowly
          to move Dexter's end effector vertically.
          This causes several joints to move
          in order to keep Dexter's end effector moving in a straight, vertical line.`,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 10] } }]}
    },
    {attachTo: {element: '.dui_dialog svg', on: 'left'},
        text: `Drag the green dot very slowly.<br/>
          This moves Dexter's end effector in the X-Y (horizontal) plane.<br/>
          Observe that the joint sliders move to maintain consistency
          between the new X-Y location, and the joint angles.<br/>
          The white circle represents the possible
            positions that Dexter's end effector
            can go to in the current x-y plane
            (i.e. the current z height).
            The inner pink circle represents Dexter.
            Dexter cannot move into itself.`,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 20] } }]}
    },

    {attachTo: {element: '.dui_dialog [name=j5_angle_num]', on: 'top'},
        text: `You can specify Dexter's movements more accurately by
          using the numerical controls.
          Change joint 5 by using the highlighted control.
          Use its up and down arrows to increment or decriment
          joint 5's degrees without typing.
          Dexter will barely move in response.`,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 5] } }]}
    },
    {attachTo: {element: '#editor_pane_id', on: 'top-start'},
        text: `A Job contains the sequence of instructions that reproduce
          a complex process. Let's create a Job.<br/><br/>
          DDE has 4 panes. The upper left one (now highlighted)
          is the <b>Editor</b> pane.<br/>
          If it has text in it, click on its <b>File</b> menu
          and select <b>New</b> to give us an empty editor.`,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, -50] } }]}
    },
    {attachTo: { element: '.dui_dialog [name=insert_job]', on: 'top'},
        text: `Click the highlighed <b>Job</b> button.
          This will insert the JavaScript source code for a Job having 
          no instructions, into the editor.`,
    },
    {attachTo: { element: '.dui_dialog [name=insert_instruction]', on: 'top'},
        text: `Click the highlighted <b>instruction</b> button.
          This will insert the JavaScript for an instruction
          that tells Dexter to move to where it currently is.`,
    },
    {attachTo: { element: '.dui_dialog', on: 'left'},
        text: `Drag the title bar of the dialog box <i>right</i>,
               so that you can see at least the first argument
               of the inserted instruction.`
    },
    {attachTo: {element: '.dui_dialog [name=j1_range]' , on: 'top'},
        text: `Modify the new instruction <br/>
          by dragging the joint 1 slider.
          This changes not just the robot and other controls,
          but joint 1's argument in the editor too.`,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 5] } }]}
    },
    {attachTo: {element: '.dui_dialog', on: 'right'},
        text: `Make a few more instructions by <br/>
          moving Dexter to a desired location, then
          clicking on the <b>instruction</b> button
          (bottom-right).`,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 0] } }]}
    },
    {attachTo: {element: '.dui_dialog [name=step_arrow_buttons]', on: 'bottom'},
        text: `Run individual instructions,<br/>or many at once,<br/>
          using the green arrow buttons.<br/>
          The small green arrows allow you to step through each instruction,
          forwards or back. Very useful in debugging.
          <br/><br/>
          Start with the small, left pointing arrow,
          to run the previous instruction.<br/>
          Notice that the previoius instruction becomes selected in the editor.<br/>
          Each arrow has a tooltip explaining its functionality. Experiment!`,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 0] } }]}
    },

    //can't use #js_textarea_id as that causes an error in shepperd
    {attachTo: {element: '#editor_pane_id', on: 'bottom'},
        text: `To run an instruction out of sequence,<br/>
          first click the mouse in front of its line in the editor pane.<br/>.` ,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 0] } }]}
    },
    {classes: "shepherd_step_dui_wide",
        attachTo: {element: '.dui_dialog [name=step_arrow_buttons]', on: 'bottom'},
        text: `Now click the small, right-pointing, green arrow. This
          <ol><li>selects the source code of the instruction in the row of the 
                  editor's cursor</li>
              <li>populates the Dexter UI dialog with the selection's values</li> 
              <li>runs the selected instruction, moving Dexter.</li>
          </ol>`,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 0] } }]}
    },
    {attachTo: {element: '#eval_id', on: 'right'},
        text: `The <b>Eval</b> button runs the selected JavaScript code
          in the editor.<br/>
          Click it now to evaluate the selection.<br/>
          In the <b>Output</b> pane you'll see, in the inspector, the internal data structure
          that represents the instruction, but this does not cause
          Dexter to move until it is run as part of a Job.`,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 10] } }]}
    },
    {attachTo: {element: '#editor_pane_id', on: 'bottom-start'},
        text: `If there is no selection, the <b>Eval</b> button
          evaluates all the code in the editor.<br/>
          Click anywhere in the editor to remove the selection
          <i>and</i> get help on the underlying source code in the output pane.
          `,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 10] } }]}
    },
    {attachTo: {element: '#eval_id', on: 'right'},
        text: `We want to evaluate the JavaScript for the whole Job
          to define it.<br/>
          Click the <b>Eval</b> button.<br/>
          Observe the data structure representing the Job in the inspector.`,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 10] } }]}
    },
    {attachTo: {element: '#jobs_button_bar_id', on: 'bottom'},
        text: `Defining the Job created a button for it.<br/>
          Run the Job by clicking the new <b>my_job</b> button.<br/>
          Observe the robot moving as it runs each instruction
          in the Job.`,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 0] } }]}
    },
    {attachTo: {element: '#jobs_button_bar_id', on: 'top'},
        text: `The color of a Job's button indicates its state:
               <ul style="margin: 0;"><li><span style="background-color:rgb(204, 204, 204);">Gray</span> means never run.</li>
                   <li><span style="background-color:rgb(136, 255, 136);">Green</span> means running.</li>
                   <li><span style="background-color:rgb(255, 255, 102);">Yellow</span> means paused.</li>
                   <li><span style="background-color:rgb(230, 179, 255);">Purple</span> means successfully completed.</li>
                   <li><span style="background-color:rgb(255, 123, 0);"  >Orange</span> means user clicked running Job button to stop it.</li>
                   <li><span style="background-color:rgb(255, 68, 68);"  >Red</span> means error during running.</li>
                </ul>
                Place the mouse over a Job button to see text of it's state.`,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 0] } }]}
    },
    {attachTo: {element: '#jobs_button_bar_id', on: 'bottom'},
        text: `Click <b>my_job</b>'s button to run it again.<br/>
               You can run a Job as many times as you like.`,
        popperOptions: {modifiers: [{ name: 'offset', options: { offset: [0, 0] } }]}
    },
    {attachTo: { element: '.dui_dialog', on: 'right'},
        text: `We're almost done so<br/>
          close the Dexter UI dialog by<br/>
          clicking the X in its upper right corner`
    },
    {attachTo: { element: '#editor_pane_id', on: 'left'},
        text: `Get the Dexter UI dialog back by clicking
          on the <b>Dexter</b> menu's <b>Dexter UI</b> item.`
    },
    {attachTo: { element: '#doc_pane_id', on: 'left'},
        text: `Clicking the <b>Dexter</b> menu, <b>Dexter UI</b> item, automatically scrolls
          the <i>Doc Pane</i> to the section of the <i>User Guide</i>
          that describes the Dexter UI dialog.<br/>
          There's more to it than this tutorial covers.`
    },
    {attachTo: { element: '#help_system_id', on: 'left'},
        text: `Clicking the <b>Help</b> button will bring back the
               "Welcome to DDE" dialog box containing the tutorials menu.`
    },
    {classes: "shepherd_step_dui_wide",
        text: `Congrats. You're a <i>Dexter Process Author!</i><br/>
           When you click <b>Exit</b>, you'll have
           unrestricted access to the:
           <ul>
               <li>Dexter User Interface dialog box</li>
               <li>Simulator</li>
               <li>Editor</li>
               <li>Eval button</li>
               <li>Job buttons</li>
               <li>Rest of DDE</li>
           </ul>`,
        buttons: [{text: 'Back', action: dui_tour.back},
            {text: 'Exit', action: dui_tour.complete}]
    }
])
//dui_tour.start()