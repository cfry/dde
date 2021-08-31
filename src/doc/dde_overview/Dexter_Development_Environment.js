export function install_overview(){
        articles_id.insertAdjacentHTML("beforeend", content)
content = null //so it will be garbage collected
}
var content =
`<style> .overview_heading {
   font-weight:600;
   font-size:16px;
}
</style>
<details class="doc_details"><summary class="doc_articles_level_summary">A Development Environment For Robotic Software</summary>
<h3>A Development Environment For Robotic Software</h3>
<div style='font-size:12.0pt;'><i>Fry, </i>
<a href="mailto:cfry@media.mit.edu"> cfry@media.mit.edu</a>
, February 18, 2017
</div>
<br/>
<div style='font-size:12.0pt'>As consumers demand "mass
customization", the hardware of our robots is meeting the challenge by becoming
more capable. They have more degrees of freedom, higher accuracy, greater
speed, and additional sensors. In
order to take advantage of this hardware, we need more sophisticated
software.&nbsp;This is as it should be.
It is easier to change a line of code than to change a transmission line of
electricity or light.
<p></p>
<div class="overview_heading">Software</div>
Unfortunately the cost of
software development can be quite high, especially if that cost is not
amortized over the manufacture of many copies of the same thing. The operators
of these robots may be factory workers, mechanical engineers or even home users
for personal manufacturing. With the luxury of professional programmers not
available, we must make "end user programming environments" that facilitate
part customization, fixing build-environment specific bugs and ultimately,
design of whole new parts.
<p></p>
3D printers are perhaps the
most common "manufacturing robot" in homes, but they typically use just
one-material and one-process for manufacturing. Complex products will need
multiple materials and multiple processes (CNC, laser cutting, sintering, pick
and place, assembly, etc.).
<p></p>
As the complexity of the
build processes grows, so too must the job description. A conventional "app"
with a few buttons, can't accommodate the breadth of customization necessary. A
user will need to interact at multiple levels that will permit an
ever-increasing control over complex procedures. Ultimately we need the full
power of a general purpose programming language. Our build process description
looks less like a list of numbers and more like a full-fledged program.
<p></p>
<div class="overview_heading">Robots</div>
The Dexter Development
Environment was designed to program the rather adept "Dexter" robot. It is a
5-axis arm designed for table or ceiling mounting. Dexter contains a
general-purpose processer that runs Linux as well as an FPGA supercomputer for
high-speed parallel operations.
<p></p>
As flexible as Dexter is,
complex multi-robot builds may involve not just multiple robots, but robots of
different <i>kinds</i>. DDE"s architecture
accommodates multiple kinds of robots that can perform in concert. The simplest
robot kind that DDE supports is called "Brain". It can't perform physical
operations on its own, but it can direct other robots to do so, just as an
orchestra conductor doesn"t play an instrument, but directs others that do.
<p></p>
The "Serial" robot is a
non-specific robot controller that drives processes through a serial port, such
as the USB port in a laptop. It has
been used to control an Arduino. We might think of a Serial robot as a sort of
general purpose percussionist, who can play a variety of instruments dependent
upon the piece to be played (or rather built.)
<p></p>
The "Human" robot is perhaps
the most controversial yet conceptually interesting. Complex jobs may not be
able to be fully automated. The Human robot has an instruction set that includes
operations only a person can perform. These are either a textual description of
a task, or some choice that the human operator needs to make. The important
idea is that an instruction for a human can be stuck on a do-list and treated
just like any other kind of instruction. We can thus synchronize human tasks
and automated tasks in one coherent environment.
<p></p>
The Human robot is the singer
in our orchestra. It does not need an instrument to perform its part. We can
even use DDE jobs to coordinate multiple humans, a chorus if you will!
<p></p>
Unlike a typical musical
performance, we don't require the person to memorize their part. Text, menus, other
graphical widgets and even speech can be used to make life easy for the singer
of the band. Our conductor tells the singer when to start singing, though the
singer must tell the conductor when she is done. This allows the person to take
as much time as the task requires, giving her maximum flexibility to perform
her best.
<p></p>
<!-- <img border=0 width=254 height=133 src="doc/dde_overview/image002.png"/> -->
<img src="doc/dde_overview/image002.png"
     onerror="this.onerror=null;this.src='https://rawgit.com/cfry/dde/master/doc/dde_overview/image002.png';"
/>
<p></p>
An example of "lyrics" that DDE presents to the "singer".
<p></p>
<div class="overview_heading">Self Teaching</div>
If this complex software
environment is to be effectively used, it must be understood by its users.
DDE utilizes a variety of media for
explaining itself to users. Thus
DDE performs the role of "music teacher", though not so much for training
performers as training composers, who write the score (do-list) for each
instrument (robot). Because a do-list is a carefully ordered sequence of
instructions that must be synchronized with other instruments, our instructions
bear more than a passing resemblance to notes in an actual score.
<p></p>
    <img src="doc/dde_overview/image004.png"
         onerror="this.onerror=null;this.src='https://rawgit.com/cfry/dde/master/doc/dde_overview/image004.png';"
    />
<p></p>
Above we see the 4 panes of
DDE. The upper left pane is the code editor. It can contain any JavaScript. The
content in this screen shot was inserted from an example on the Jobs menu
(shown expanded). A job feeds the instructions on its do-list to a robot. This insertion
comes not just with the code, but with comments explaining the code's
functionality (in brown text). This
particular example contains two jobs that coordinate by "synchronizing" at each
of their "sync_point" instructions.
<p></p>
Every character in the editor
has help available by clicking on it. Here we clicked on "sync_point".
Concise help appears in the Output pane
in the lower left. The blue text in this help is a link to extended
documentation from the reference manual, shown in the Documentation pane in the
upper right. The lower right is the Simulation pane, which shows a graphical
simulation of the robot under control, or mimics a real robot.
<p></p>
Orchestras usually have
scores with every note written out ahead of the performance. However, our real-world
builds need to be more flexible than that. Robot sensors can detect anomalies
that may need to be addressed during the build, just as professional musicians
can cover up for each other's mistakes.
<p></p>
Since the do-list can contain arbitrary
JavaScript, it can actually generate new instructions on the fly, much as a
jazz improviser composes on the spot. One of DDE's instruction types is
literally a JavaScript "generator". It can produce a stream of instructions
who's length needn't even be set before the generator starts producing
instructions, perhaps like some stage-hogging lead guitarist.
<p></p>
<div class="overview_heading">A Natural Language Application</div>
We can take advantage of
DDE's window system programming, speech generation &amp; recognition, natural
language parsing capability and AI reasoning to make easy-to-program, as well
as easy-to-use, interfaces, to sophisticated applications. In this example, we
use Google's speech I/O and the MIT InfoLab Group's English parser (named
START) to build an application that lets a user create a knowledge base and ask
questions about it, with a speech interface. <i>Note that this application does not
control the Dexter robot, but it does show some of the generality that DDE employs
to describe complex tasks.</i><p></p>
The high level interface is:<br/>
    <img src="doc/dde_overview/image006.png"
         onerror="this.onerror=null;this.src='https://rawgit.com/cfry/dde/master/doc/dde_overview/image006.png';"
    />
<p></p>
If a user
presses <b>Click to talk</b> before saying
each of the above example sentences, they will create a knowledge base and get
speech feedback after each sentence, ending with "Robot is useful because robot
have hand."
<p></p>
<div class="overview_heading">Levels of Programming</div>
Our base
level of programming for this application is JavaScript. We layer on DDE
utilities, making access to I/O and
parsing easier in the next level up. Finally we use a knowledge base and
reasoning for our natural language interface. If a user needs functionality not
available at a high level, they can drop down a level,
<i>remaining in the same development environment</i>,
to gain increased breadth at the expense of using a lower level language.
<p></p>
It is important to understand that the above English sentences are, literally,
<i>code</i>. They create a program with a definitive
behavior that we can access via asking questions.
<p></p>
<div class="overview_heading">Debugging</div>
The majority
of a programmer's time is not spent typing in code, it is in debugging that
code. Analogously, the majority of our natural language coder's time will not
be spent speaking the code, it will be in debugging.
<p></p>
A winning strategy for developing working code quickly is to get feedback from our
development environment incrementally as we build our application.
As we construct our "Robot Knowledge
Base Application", the development
environment gives us feedback after each sentence. For the two sentences that
add knowledge to the knowledge base,
<i>"A robot has a hand."</i> and
<i>"If a robot has a hand, a robot is useful."</i>,
our development environment responds with "OK" and "Got it.&quot;
(Identical acknowledgement in English is boring an unnatural!) This informs our
natural language coder that their utterances are syntactically correct.
<p></p>
If we consider that the goal of our app is to answer the final question, the
intermediate questions are probing the semantic validity of the knowledge base
being built. They take the place of
"print statements" in traditional programming. However, as you can see, they
are much higher level than print statements. They don't need to be embedded
inside some complex algorithm, and they produce output in a very understandable
way. For instance "Does a robot have a hand?" is responded to with "Yes, a robot
has a hand".
<p></p>
<div class="overview_heading">Knowledge Base Debugging</div>
Applications that rely on knowledge bases have a special kind of bug: bugs in the knowledge
base itself. We therefore need to be especially careful to inform the natural
language coder what's in that (potentially huge) knowledge base, but only with what's
relevant at the moment.
<p></p>
Here's a dialog our app supports:
<div style='border:solid 1.0pt; padding:1.0pt 4.0pt 1.0pt 4.0pt; background:#FFCC99; font-family:courier;'><br/>
Human: A robot has a hand.<br/>
DevEnv: OK.
<p></p>
Human: A robot has a hand.<br/>
DevEnv: I already know that.<br/>
</div>
Our application responds to the first sentence with "OK" but the 2<sup>nd</sup>
sentence with "I already know that." This informs our natural language coder about
redundancy, much as a fellow human would in a conversation. Furthermore, our
app does not stick into the knowledge base the same knowledge twice.
<p></p>
Here's another example of a dialog:
<div style='border:solid 1.0pt; padding:1.0pt 4.0pt 1.0pt 4.0pt; background:#FFCC99;
            font-family:courier;'><br/>
Human: Why is a robot useful?<br/>
DevEnv: I think its never the case that robot is useful.
<p></p>
Human: If a robot has a hand, a robot is useful.<br/>
DevEnv: OK
<p></p>
Human: Why is a robot useful?<br/>
DevEnv: Sorry, robot is useful, is only true under certain conditions.
<p></p>
Human: A robot has a hand.<br/>
DevEnv: Got it.
<p></p>
Human: Why is a robot useful?<br/>
DevEnv: Robot is useful because robot have hand.
</div>
Notice that
there are three different responses to the Human's question of "Why is a robot
useful?". Each informs the user about what is in the knowledge base at time
time of the ask, giving clues about one of the most common bugs: missing
knowledge.
<p></p>
<div class="overview_heading">Conclusion</div>
Dexter Development
Environment lets a user "print" a part from a design contained in a Job's do-list.
But this rather passive interaction is analogous to an audience member
at a concert. Via end-user programming techniques, we enable the user to
orchestrate the process, ultimately giving them control of even the low-level
instructions in the process. With the "Human" robot, we can synchronize what
machines do best with what people can do best by providing appropriately timed
instructions, similar to real-time lyric presentation in a
Karaoke bar.
The complexity of composing build-scripts can be mitigated by DDE's
self-teaching techniques and the AI of natural language processing plus
knowledge base management, that we've only just begun (apologies to
the Carpenters).
</div>
</details>
`