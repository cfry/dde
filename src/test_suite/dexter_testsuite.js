
new TestSuite("Dexter.joint_to_servo_number",
    ["Dexter.joint_to_servo_number(6)", "3"],
    ["Dexter.joint_to_servo_number(7)", "1"],
    ["Dexter.joint_to_servo_number(-99)", "undefined"]
)

new TestSuite("Dexter.servo_to_joint_number",
    ["Dexter.servo_to_joint_number(1)", "7"],
    ["Dexter.servo_to_joint_number(3)", "6"],
    ["Dexter.servo_to_joint_number(-99)", "undefined"]
)

new TestSuite("Dexter.reboot_joints",
["Dexter.reboot_joints()", 
`[
 [undefined,undefined,undefined,undefined,"S","RebootServo",3],
 [undefined,undefined,undefined,undefined,"z",1],
 [undefined,undefined,undefined,undefined,"S","RebootServo",1],
 [undefined,undefined,undefined,undefined,"z",1]
]`],
["Dexter.dexter0.reboot_joints()",
`[
 [undefined,undefined,undefined,undefined,"S","RebootServo",3, Dexter.dexter0],
 [undefined,undefined,undefined,undefined,"z",1, Dexter.dexter0],
 [undefined,undefined,undefined,undefined,"S","RebootServo",1, Dexter.dexter0],
 [undefined,undefined,undefined,undefined,"z",1, Dexter.dexter0]
]`]
)

