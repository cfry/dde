export function install_mental_model_of_memory(){
    articles_id.insertAdjacentHTML("beforeend", content)
    content = null //so it will be garbage collected
}
var content =
`<details class="doc_details"><summary class="doc_articles_level_summary">A Mental Model of Memory</summary>
 <div style='font-size:16px;'>
<h3>A Mental Model of Memory</h3>
<i>Fry Sep 15, 2017</i>
<p></p>
In a web browser, when you load a web page, it knows nothing about the previous web pages you've
loaded into the browser. It can't find out about them if it wanted to.
<p></p>
This is by design.
Its a security feature and maintains modularity.
In MS Word, when you edit a different document, same thing. The previous and current
document can't interact, just like different pages in a browser.
On a phone or a computer, separate apps (at least for the most part) can't
interoperate.
<p></p>
This separation is maintained by the Operating System.
You might think of a browser as an sub-operating system that maintains just web pages,
or Word as a sub-operating system that maintains just Word documents.
<p></p>
<b>Jobs</b><br/>
In DDE, we can think of a Job (a process for building something) as like
a page, a Word document or an app. It is separate from the other Jobs and, to extend
the analogy, DDE is a sub-operating system for Jobs.
<p></p>
But this analogy is less accurate between Jobs and the other "programs" as it is
between those other programs. That is because Jobs <i>can</i> know about each other.
A Job can find out what other Jobs exist,
and their status, i.e. which instruction are they currently running, if any.
Jobs can even modify each other, not
just accidentally, but on purpose. A "manager" Job can tell a
"worker" job what to do by adding an instruction to its do_list via
the instruction <code>Control.send_to_job</code>.
<p></p>
<b>Dangerous and Productive</b><br/>
Isn't this dangerous? Yep, just like a phone that can call any number,
or an airplane that can fly anywhere, or a person in a free society.
Dangerous (think marketing phone calls, or 9/11 or criminals)
but also exceedingly powerful. Despite the downsides, most people benefit from,
and want, phones, planes and freedom.
<p></p>
Jobs can take great advantage of each other.
DDE supports synchronizing jobs and other forms of cooperatation to build
complex things, just like the workers in a factory or civilization itself, that simply
can't be done without deep interoperability. Interoperability is synergistic.
<p></p>
<b>The Good Parts</b><br/>
What are the big "actors" in this society of Jobs? In this one large memory space?
First there's the foundation of JavaScript. Next there are third party libraries that
are built-in to DDE (Electron, jquery, opencv.js, webmidi, etc.). All open source projects
that us DDE developers didn't have to write. Then there's the
extensions to JS that DDE adds for Jobs, Robots, window system and other utilities.
Also there is software that other
DDE users write (mostly Jobs) that you can include in your DDE environment.
Finally there's the Jobs and other code that you yourself write. A lot? Sure.
We need a lot to develop the capability to make anything.
<p></p>
<b>Trust</b><br/>
How do you keep out bad actors? You trust only the good actors. You trust JavaScript
like you trust English. Actually JavaScript is far more trustworthy than English
because the definitions of its terms are nailed down without ambiguity or
multiple-meanings.
<p></p>
You trust the DDE developers to only include good 3rd party
packages. (Because DDE is open-source you can see everything we've included,
look it up on the web, read its source code.) Think of this like trusting your
local supermarket to not stock food from bad manufacturers.
<p></p>
The code from other
DDE developers is much less trustworthy. You don't have to load any of it if
you don't want to. Maybe you only load code from develeopers you personally know.
Haddington will vet some of this code; another way it can gain your trust.
<p></p>
Finally, do you even trust your own code? Probably initially not. But you can
test it by running it (a lot). You can write a test suite for it and run that
suite repeatedly. (DDE makes authoring and running test suites easy.) When
its not right, DDE provides tools for debugging.
<p></p>
<b>Namespaces</b><br/>
OK, suppose you trust everybody you've included code from to not do malicious things.
Still, the code might "inadvertently" step on other code. How do we prevent <i>that</i>?
<p></p>
A namespace is a set of names. We mean the formal Math definition of "set" here.
In a given namespace, there is just one "foo". And that "foo" has just one meaning.
<p></p>
Suppose you go into a room and someone asks you "what's the width?"
They could mean "width of the room" or "width of the bed" or any number of different
"widths". That's because the context (or namespace) of the word "width" is ambiguous.
But if they ask "what's the width of the bed?", they have declared the namespace to
be the one bed in the room you're in,
and they mean the overall width of that particular bed.
<p></p>
<b>Common Sense Reasoning</b><br/>
Humans have lots of clever ways to figure out what is the current context or namespace
that is "in focus". These "ways" are an important part of Common Sense Reasoning.
Computers, generally speaking, don't have common sense, though we're working on it!
In the mean time, need definitive ways of describing the context in focus.
This is what namespaces are for.
<p></p>
<b>JavaScript</b><br/>
For example, JavaScript has a namespace of <code>Math</code>. In that namespace is the a method
named <code title="inEVALable">floor</code>. You use it like so <code>Math.floor(4.6)</code> => <samp>4</samp>.
By using the namespace designator of <code>Math</code> as a prefix, we distinguish between
a global variable named "floor", or perhaps <code title="unEVALable">my_workshop.floor</code>.
<p></p>
Yes you can define your own namespaces.
<code>my_workshop = {}</code> is all it takes. You have to be careful to not "redefine" some other
global variable of that name, maybe by calling it my_workshop314159, but its easy
to come up with a unique name. Just eval it first to see if its <code>undefined</code>.
Now you can eval <code>my_workshop.floor = 'level"</code> and its completely separate
from the global variable <code title="unEVALable">floor</code> or
<code>Math.floor</code>
<p></p>
<b>Coding Jobs</b><br/>
The class <code>Job</code> defines a namespace of methods and variables for instances of Jobs.
It also defines a namespace for names of Job instances themselves.
When you eval<br/><code>new Job({name: "my_job"})</code>,<br/>you have created a new name ( "my_job" )
in the <code>Job</code> namespace. Now
<code>Job.my_job</code> is bound to our new instance of Job.
<p></p>
If you now re-eval<br/><code>new Job({name: "my_job"})</code>,<br/> you overwrite
the previous value of
<code>Job.my_job</code> with a new instance. Your old instance is inaccessible.
The JavaScript garbage collector eventually reclaims the memory it took up.
<p></p>
Suppose you really wanted to keep your old instance of Job? The best way would
be to give each instance a unique name, say "my_job1", "my_job2", etc.
But you <i>could</i> eval <code>prev_job = Job.my_job</code> just before
re-evaling  <code>new Job({name: "my_job"})</code>. Then the JS garbage collector
would not collect your original Job instance because there exists
an accessible  pointer to that old job.
You could even eval <code>my_jobs = []</code>, then, for each version of "my_job"
<code>my_jobs.push(Job.my_job)</code>. Now we've saved <i>all</i> our old versions of
<code>Job.my_job</code>.
<p></p>
Though this is valid JS, we highly recommend you don't
do this for Jobs because DDE makes the assumption that there is only one <code>Job.my_job</code>
existing at a time within a running DDE.  For data structures you create that don't
have sophisticated dependencies on their names, this "history maintaining" technique is
just fine.
<p></p>
<b>The Big Picture</b><br/>
You might even think of DDE itself as one giant meta-namespace that keeps all of its
parts separate from the non-DDE universe. But this isn't perfectly true. DDE
contains URLs, (Universal Resource Locators). URLs are a way to keep <i>really</i> global
names from colliding. Also, its a good thing that DDE's JavaScript methods are named
the same thing as everybody else's JavaScript methods. For one thing, JavaScript
documentation remains valid across all uses of JavaScript.
<p></p>
Knowing how
namespaces interact is a crucial part of programming, knowledge, and building
an accurate Mental Model of Memory.
</div>
</details>
`