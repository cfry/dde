export function install_getting_started(){
    doc_pane_content_id.innerHTML += content
    content = null //so it will be garbage collected
}
var content =
`<details><summary class="doc_top_level_summary">Getting Started</summary>
 <div style='font-size:16px;'>
<!-- Does not have download instructions. -->
Dexter Development Environment is a tool for
creating JavaScript programs.
In addition, it has special support for controlling the Dexter robot.

<h4>The User Interface</h4>
DDE has 4 panes.
<ul><li>The <i>Editor pane</i> is in the upper left. Here's where you enter JavaScript
        to control Dexter. You can type or paste in code. You can also use the
        <button>Learn JS&#9660;</button>, <button>Insert&#9660;</button>, <button>Series&#9660;</button> and <button>Jobs&#9660;</button>
        menus in the menu bar to insert vanilla JavaScript or
        DDE-specific code.</li>
    <li>The <i>Output pane</i> is in the lower left. DDE displays useful information here.</li>
    <li>The <i>Documentation pane</i> is in the upper right.</li>
    <li>The <i>Misc pane</i> is in the lower right. It can contain a variety of content
    including a dialog for making instructions and a simulation of Dexter where
    you can test out Jobs without having a real Dexter.</li>
</ul>

<h4>Evaluation</h4>
To run JavaScript source code, you feed it to a function called <code>eval</code>.
DDE makes this easy with its <button>Eval</button> button.
If there is a text selection when you click the button, that text will
be evaled. If there's not, the whole content of the <i>Editor pane</i> will be evaled.<br/>
By evaling early and often, you can test small snippets of JavaScript and
make debugging your program easier.
<p></p>
Try this:
<ol>
    <li> Select the following JavaScript source code:<br/>
        <code>  2 + 3 * 4  </code></li>
    <li>Click the <button>Eval</button> button in the header for the <i>Output pane</i>.</li>
    <li>You should see <code>14</code> in the <i>Output pane</i>.</li>
    <li>Select the code again but this time copy it with Ctrl-C (on Mac, cmd-C).</li>
    <li>Paste it by clicking in the <i>Editor pane</i> and hitting Ctrl-V (on Mac, cmd-V)</li>
    <li>Click the <button>Eval</button> button</li>
    <li>You should see <code>14</code> printed again in the <i>Output pane</i>.</li>
    <li>Select just <code> 3 * 4 </code> in the <i>Editor pane</i>.</li>
    <li>Click the <button>Eval</button> button</li>
    <li>You should see <code>12</code> in the <i>Output pane</i>.</li>
</ol>
If you don't know JavaScript, insert items from the
<button>Learn JS&#9660;</button> menu and play.

<h4>Jobs</h4>
Dexter is controlled by writing a small app which we call a "Job".
This wraps up a sequence of instructions to be run, one after another,
along with some other information, for controlling a robot.
<p></p>
You can insert example Jobs from the <button>Jobs&#9660;</button> menu.<br/>
<ol><li>Clear your editor by selecting the text and hitting the DELETE
        or BACKSPACE key.</li>
     <li>Choose Jobs Menu/Insert Example/Dexter-moving</li>
     <li>Most of this text is comments explaining this Job.</li>
     <li>Click the <button>Eval</button> button</li>
     <li>Observe a new gray button in the <i>Output pane</i> header with the name of the
            Job that you just defined.</li>
     <li>Click this button to start the Job</li>
     <li>Observe an animation of Dexter in the <i>Simulation pane</i>.</li>
     <li> The button changes colors to indicate the Job's status.
         It turns green when its Job is running and purple when its done.
         A tooltip on the button appears when you hover the mouse over it.</li>
     <li>Clicking a Job's button will start it if its stopped, and
         stop it if its running.</li>
</ol>

<h4>Connecting to Dexter</h4>
is documented in the User Guide under
<a href="#" onclick="DocCode.open_doc('configure_dexter_id')">Configure Dexter</a>.

<h4>Getting Help</h4>
There's a LOT more documentation.
We encourage you to read the <b>User Guide</b>.
At the bare minimun, please click the
<span style="font-weight:700;font-size:20px;color:blue;">?</span>
in the upper right of the <i>Doc pane</i> for a list of tutorials,
one of which, "Help System", explains DDE's numerous help facilities.
</div>
</details>
`