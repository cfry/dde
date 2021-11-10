import "../general/lesson.js"

export function define_learn_js_tour() {
    return Lesson.make_tour({name: "Learn JavaScript", steps: [
            [`There are many ways to control Dexter.
    The most flexible way is to use JavaScript and
    DDE's JS libraries.
    <br/><br/>
    This tutorial teaches you the basics of how
    to code, run and debug JavaScript.
    If you've never programmed before,
    or are new to JavaScript, you're in the right place.`],
            [`Most of your JS code will be in the Editor pane.<br/>
    To prepare for this lesson, if the Editor pane has text in it,
    <ol><li>click on its <b>File</b> menu</li>
        <li>select <b>New</b></li>
    </ol>to give us an empty editor.`,
                '#editor_pane_id'],
            [`Now click the mouse in the Editor pane and type in<br/>
    <code>&nbsp;2 + 3&nbsp;</code>`,
                '#editor_pane_id'],
            [`To run the code in the Editor, click the <b>Eval</b> button.`,
                '#eval_id'],
            [`The result of evaluating the code in the editor is printed in the
    Output pane.`,
                '#output_div_id'],
            [`If there is no selection in the Editor, all its code is run when
    you click the <b>Eval</b> button. If there is a selection,
    only that selected code is run.<br/>
    Select a portion of your code, say just a number like <code>&nbsp;3&nbsp;</code>`,
                '#editor_pane_id'],
            [`Click the <b>Eval</b> button to run the selected code.`,
                '#eval_id'
            ],
            [`Observe the result in the Output pane.`,
                '#output_div_id'],
            [`Erase the code in the Editor pane by selecting it and
    hitting the <b>delete</b> key, or choosing <b>Cut</b> from the
    right click menu.`,
                '#editor_pane_id'],
            [`Several menus in the Editor pane header have items that insert
    useful examples of JavaScript code into the editor.<br/>
    Take a minute to scan the <b>Learn JS</b> menu and its sub-menus. 
    Most items have helpful tooltips on them if you pause over them.
    The most common, generally useful JavaScript constructs are on
    this menu.`,
                '#editor_pane_id'],
            [`On the <b>Learn JS</b> menu,<br/>
    choose: <b>JavaScript Example</b>.<br/>
    This inserts some code demonstrating:
    <ul><li>Defining a function</li>
        <li>Print statements</li>
        <li>Looping</li>
        <li>If</li>
        <li>Comparison</li>
        <li>Returning a value</li>
        <li>Calling the function</li>
    </ul>
    Take a minute to read the comments (after each <code>&nbsp;//&nbsp;</code> )`,
                '#editor_pane_id'],
            [`Click the Eval button to define the function, and then call it.`,
                '#eval_id'],
            [`In the Output pane, observe the text printed by calling <code>&nbsp;out&nbsp;</code>.
    We also see what the function returns (the result of evaling
    <code>&nbsp;b.length</code>).
    All this is quite useful in testing & debugging code.`,
                '#output_div_id'],
            [`In your code, type an <code>&nbsp;x&nbsp;</code> after the word
     <code>&nbsp;function&nbsp;</code> .
     <br/><br/>
     Notice that a red dot appears in the left hand margin.
     Its tooltip explains what is <i>possibly</i> wrong. 
     But sometimes the red dot appears when everything is ok.
     Consider the red dot to be a <i>suggestion</i> to check the syntax of that
     line of code.
     <p/>
     Delete the <code>&nbsp;x&nbsp;</code> to get rid of the red dot.`,
                '#editor_pane_id'],
            [`The red dot syntax warnings and print statements help, but to
      really understand your code, use the Chrome stepper.<br/>
      First, select<br/><code>foo("hello", [7, 10, 20, -3.2])</code>.`,
                '#editor_pane_id'],
            [`<i>Please read this whole instruction before acting.</i><br/>
       When you click the <b>Step</b> button, an
      additional window (Developer Tools) will appear on the screen.
      <ul>
      <li>Use its stepper buttons <img src="/src/doc/coor_images/stepper_buttons.png" width="100"/>
      to evaluate its highlighted code.</li>
      <li>See the tooltips on each button for how much
      code is evaled by each button.</li>
      <li>Hover the mouse over variables to see their values.</li>
      </ul>
      While you are stepping, you won't be able to use the DDE window, including
      this tutorial. Control will return to DDE when you close the Dev Tools window.<br/>
      <i>NOW</i> click the <b>step</b> button.`,
                '#step_button_id'
            ],
            [`While using the stepper, often you will overstep some code relevant to a bug.
       Just start over stepping the code.<br/><br/>
       A useful technique to speed this up is to click the left margin of the Dev Tools
       code pane to <b>set a breakpoint</b>. Now clicking the blue stepper button
       will fast-forward stepping to that breakpoint.<br/>
       Back up in this tutorial and try it.<br/>
       The secret to understanding code is <b>step it</b>.`
            ],
            [`A prose description of much of this tutorial is now in the Doc pane.<br/>
       At the bottom of the <b>Learning JavaScript</b> section you'll find
       references to other tutorials. But many learn best by trying out
       little code fragments and <b>Eval</b>ing them. Start with the
       <b>Learn JS</b> menu.`,
                '#doc_pane_id'],
            [`There's a lot to JavaScript. But by understanding how to eval and
         debug code, you're well on your way!`
            ]
        ]})
}


