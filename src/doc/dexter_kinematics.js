export function install_dexter_kinematics(){
articles_id.insertAdjacentHTML("beforeend", content)
content = null //so it will be garbage collected
}
var content =
`<details class="doc_details"><summary class="doc_articles_level_summary">Dexter Kinementics</summary>
<div style='font-size:16px;'>
<h3>Dexter Kinematics</h3>
Dexter is a 5 axis robot. Robot kinematics is the science
of how robots move by rotating their joints. For
robots with 5 axes, this is quite complex. This paper
provides an overview of how to think about Dexter's
motion.
<h3>Cartesian Coordinates</h3>
Most people are far more familar with Cartesian Coordinates
than robots with joints. Most plotters and 3D printers have
Cartersian Coordinates with 3 axes, X, Y, and Z.
The end-effector (pen or extruder) is moved within
a box shape having a width, depth, and height.
We usually refer to a position along the width as X,
a position along the depth as Y, and a position along
the height as Z. Each of these 3 dimensions are at 90 degrees
from each other and said to be "independent" of one another.
For instance, you can change the height (Z) ,
without affecting the X and Y position. Similarly for width and depth.
<h3>Orientation</h3>
Most plotters and 3D printers do not have the ability to
change the orientation of the end effector. It is always pointing
straight down. But sometimes its useful to tilt a pen or an extruder.
These dimensions are sometimes referred to as pitch and yaw.
Airplanes use this terminology too. If your end effector was
a screw driver, its useful to screw in screws that are oriented
straight down, but sometimes you have horizontal screws or
screws at a different angle. For this you need pitch and yaw control.
<p></p>
For actually rotating the screw, you need another dimension, twist (or roll).
Often you want to be able to twist many more than 360 degrees
(as in the case of screwing and drilling). Thus orientation,
like position, can be described in 3 dimensions.
However, position is described in lengths, wheereas orientation
is described in degrees. So far we've described 6 dimensions,
X, Y, and Z for position in lengths, and pitch, yaw, roll for
orientation in degrees. These 6 dimenstions area all independent
of each other.
<h3>More Dimensions</h3>
It helps thinking about making complex objects to consider
additional dimensions.
<h4>Time</h4>
Useful in describing start and stop time of processes.
These start and stop times can be relative to a wall clock,
or to a beginning of a larger process like Dexter Development
Environment's (DDE) jobs. Each job has a start an stop time
relative to a wall clock. Each instruction has a start and stop
time relative to the start of the Job. Both have durations
of their stop time minus their start time.
Times are generally measured in seconds, though manu other units are
useful for smaller and larger values.
<h4>Material</h4>
Jobs make things containing potentially different material.
At each position within the object being made there is a material.
If this is a complex material, say a screw, it will have an orientation.
During the build process, the object being made will have different
"parts" so there is a time dimension to a part, which varies as
it is being built.
<p></p>
Materials themselves can be said to have many different dimensions.
Atomic make-up, color, weight (force), mass (inertia),
size, strength, cost as well as
electrical, thermal, optical, magnetic and acoustic conductivity
are all quite relevant for the behavior what what we are building.
Using the dimensions of position, orientation, time and materials
we can accurately and definitively describe much of the static universe.

<h3>Dexter</h3>
Dexter's 5 axes can be used to [siiton its end effector
as well as orient it in pitch and yaw. End effectors held
by Dexter can provide roll. End effectors can extrude different
materials. DDE controls the build process, (what gets done when)
thus operating in the dimension of time. The flexibility to
operate in all these dimensions, and the complexity management
of DDE make Dexter exceedingly versatile.
<h3>Kinematics</h3>
To take maximum advantage of Dexter's versatility, its useful
to understand its behavior in much more detail. That's what the
remainder of this article describes.
<p></p>
Each of Dexter's 5 joints is operated by a high resolution stepper motor.
The motors are in Dexter's base to keep the weight low and the mass that
Dexter has to move down, making it more efficient than Robot's with
motors at their joints. Dexter uses lightweight belts to transmit
the power from the base to the joints.
<p></p>
Each joint has a minimum and maximum angle that it can rotate.
Rotating joints below a given joint will change the position of a joint.
The position of the joint also depends on the length of the link connecting
the joints below it.
<h4>Joint 1</h4>
J1 is the lowest joint. Its position is on the table that
Dexter sits. The axis is vertical. It twists the rest of Dexter,
but more particularly J2.
J1 gives us the ability to move the end of a link connected to it
in a circle, but not the ability to move the end of that link
closer or further from the center of that circle.
You can think of J1 as your torso that allows your upper body to twist
about the vertical axis.
<h4>Joint 2</h4>
J2 sits on top of J1 with a short link between them. Its axis is
horizontal. In combination with J1, J2 can move the end effector
over the surface of a hemisphere who's flat side is the table.
If Dexter was sittlign on top of a pedistal, J1 and J2 could move
the end effector over a greater percentage of a sphere.
You can think of J2 as Dexter's shoulder.
<h4>Joint 3</h4>
The axis of J3 is also horizontal. It is parallel to the
axis of J2. In combination with J1 and J2, J3 can move the
end effector within the hemisphere of Dexter's motion.
J3 can be thought of as Dexter's elbow.
You can think of J1, J2 and J3 as positioning the end effector
whereas J4 and 5 provide orientation. Its not quite that simple,
but that's good approximation.
<h4>Joint 4</h4>
J4 also has a horizontal axis that is parallel to J2 and J3.
Think of J4 as providing an axis of orientation like pitch.
J4 and J5 can be thought of as Dexter's wrist.
<h4>Joint 5</h4>
J5 is orthogonal (90 degrees) from J4. it provide the other
axis of orientatiom say yaw and makes up the 2nd degree of
freedom in Dexter's wrist.
<h4>End Effectors</h4>
Dexter is built with an automatic tool changers so that
it can pick up different end-effectors. You can think
of the automatic tool changer (ATC) as a hand that can
grasp many different tools. Because Dexter provides
electrical power and signals through its ATC,
an end effector can have motors that provide additional
axes such as twist and/or the opening and closing of a gripper.
The ATC can operate additional electronic components including
sensors that feed data back to Dexter's brain.
<br/>
<table>
    <tr><th>Joint Name</th><th>Min Angle</th><th>Max Angle</th></tr>
    <tr><td>J1</td><td></td><td></td></tr>
    <tr><td>J2</td><td></td><td></td></tr>
    <tr><td>J3</td><td></td><td></td></tr>
    <tr><td>J4</td><td></td><td></td></tr>
    <tr><td>J5</td><td></td><td></td></tr>
</table>
<br/>
<table>
    <tr><th>Link Name</th><th>Length in meters</th></tr>
    <tr><td>Link1</td><td></td></tr>
    <tr><td>Link2</td><td></td></tr>
    <tr><td>Link3</td><td></td></tr>
    <tr><td>Link4</td><td></td></tr>
    <tr><td>Link5</td><td></td></tr>
</table>
<h3>Motion Instructions</h3>
    <b>move_all_joints</b><br/>
    <b>move_all_joints_relative</b><br/>
    <b>move_to</b><br/>
    <b>move_to_relative</b><br/>
    <b>move_to_straight</b><br/>

<h3>Build Envelope</h3>
<h3>Accuracy</h3>
<h3>Repeatability</h3>
<h3>Paths</h3>
<h4>straight line</h4>
<h3>Payload</h3>
<h3>Speed</h3>
    <h4>Joint speed</h4>
    <h4>End-effector Speed</h4>
    <h4>Constant Velocity</h4>
</div>
</details>
`