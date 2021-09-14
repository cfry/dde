export function install_browser_vs_dde(){
  articles_id.insertAdjacentHTML("beforeend", content)
  content = null //so it will be garbage collected
}
var content =
`<details class="doc_details"><summary class="doc_articles_level_summary">Browser vs. DDE</summary>
 <div style='font-size:16px;'>
<h3>Browser vs. DDE</h3>
<i>Fry July 7, 2017</i>
<p></p>
A good way to understand Dexter Development Environment at a high level
is to compare it to a web browser.
A browser is an application that displays content from the web or files on your computer.
The content can be dynamically generated based on user actions and underlying code that
computes the content to be displayed. The browser provides the runtime engine for running that code.
 Major browsers also have tools for helping you debug that code,
 though these are hidden from most users.
<p></p>
<b>The Browser Mindset</b><br/>
In the browser mindset, most users are “content viewers”.
They are distinct from “content creators”. The idea is that most people want to read, but not write.
In the broad world, this is roughly true, though most people do at least a little writing
from time to time. None-the-less, while most Internet users know how to view content on the web,
 they do not know how to author content. And most people that can author content,
 only know how to write static text, not more complex, definitive data formats or programs
  that can compute and generate content.
<p></p>
Because of the separation of readers from writers, different tools serve these
different classes of users. This makes sense. The readers don’t want their world
cluttered with tools they don’t need to use. But if a reader wants to become a writer,
the separation of tools makes it harder to transition from reader to writer.
You have to learn a new toolset.
<p></p>
There is literally a plethora (in the worst sense of the word) of tools to choose from
and learn how to use, to author web content. Typically they interact poorly with each
other as they were designed and implemented by separate teams that were only attempting
to solve part of the problems that writers face.
<p></p>
<b>The DDE Mindset</b><br/>
DDE maintains the opposite mindset. There is no difference between readers and writers.
Every content viewer should (and will need to at some point) become a content creator.
DDE strives to make that transition as smooth as possible.
<p></p>
You can think of
DDE more like Microsoft Word than a browser. Yes you can read documents in it.
Yes you can even print documents using it. But the bulk of its functionality is to help
users author those documents.
<p></p>
Microsoft Word is for viewing, writing and printing text & graphic documents.
DDE is for viewing, writing and “printing” 3D objects. Rather than control a
desktop inkjet 2D printer as MS Word does, DDE controls Dexter, a 5 axis robot arm
that is far more versatile than an inkjet printer because it can use many different
processes for making things.
<p></p>
<b>Multi-Process Making</b><br/>
Conventional 3D printers use just one process, Fused Deposition Modeling (FDM)
for printing files in a ridged file format called “STL” that describes
3D dimensional surfaces using a set of many triangles. STL is transformed into layers
by an application called a “slicer”, and the printer prints each layer, one on top of another.
<p></p>
Dexter is fundamentally a motion platform that can, under program control,
pick up different tools (called “end effectors” in robotics) that perform different functions
at the location that the motion platform moves them to.
These end effectors can perform FDM, cutting with a laser, move parts
(pick and place) and a wide variety of other tasks. In fact, Dexter is designed to
accommodate end effectors we haven’t even thought of yet.
<p></p>
Who will? Dexter’s users. Through open source sharing, we promote the development
of end effectors. To control these end effectors that will do a myriad of tasks,
new processes need to be developed. Larger processes will be composed of different
kinds of smaller, narrower processes. Viewing, authoring, and operating these
processes is what DDE is for.
<p></p>
<b>Browser Comparison Revisited</b><br/>
Despite all these differences with browsers, DDE does share a lot with them.
First, it manipulates the same information formats, HTML, CSS and JavaScript
that comprise web pages. Second it uses the underlying Chrome browser rendering,
and JavaScript runtime engines. You can even take advantage of Chrome’s debugging tools within DDE.
<p></p>
But DDE extends the browser by allowing programmatic access to the file system of your
local computer (a security restriction of browsers). It has access to other underlying
capabilities of a computer’s operating system (WindowsOS, MacOS and Linux) also
restricted due to security concerns in browsers. Additionally, DDE provides high level extensions
to JavaScript to help users author and run processes on Dexter.
(These are called <i>Jobs</i>). DDE includes programmatic low level access to Dexter itself.
Finally, DDE contains an extensive help system to make it easy for users to become,
not just content viewers, but content creators.
</div>
</details>
`