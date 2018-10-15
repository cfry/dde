new TestSuite("move_all_joints",
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints(0,0,30,0,0,0,0)]})'],
    ['Job.j1.robot.angles', '[0,0,30,0,0,0,0]'],
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints()]})'],
    ['Job.j1.robot.angles', '[0,0,30,0,0,0,0]'],
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints(NaN, 23)]})'],
    ['Job.j1.robot.angles', '[0,23,30,0,0,0,0]']
)
new TestSuite("move_all_joints_with_arrays",
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints([0,0,30,0,0,0,0])]})'],
    ['Job.j1.robot.angles', '[0,0,30,0,0,0,0]'],
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints([])]})'],
    ['Job.j1.robot.angles', '[0,0,30,0,0,0,0]'],
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints([NaN, 23])]})'],
    ['Job.j1.robot.angles', '[0,23,30,0,0,0,0]']
)
new TestSuite("move_all_joints_with_rel",
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints(0,0,30,0,5,0,0)]})'],
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints([15],[16],[17],[18],[19])]})'],
    ['Job.j1.robot.angles', '[15,16,47,18,24,0,0]']
)

new TestSuite("move_all_joints6",
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints(0,0,30,0,0,66,0)]})'],
    ['Job.j1.robot.angles', '[0,0,30,0,0,66,0]'],
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints()]})'],
    ['Job.j1.robot.angles', '[0,0,30,0,0,66,0]', "don't include j6 because it didn't change"],
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints(NaN, 23)]})'],
    ['Job.j1.robot.angles', '[0,23,30,0,0,66,0]']
)

new TestSuite("move_all_joints6_array",
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints([0,0,30,0,0,66,0])]})'],
    ['Job.j1.robot.angles', '[0,0,30,0,0,66,0]'],
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints([])]})'],
    ['Job.j1.robot.angles', '[0,0,30,0,0,66,0]', "don't include j6 because it didn't change"],
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints([NaN, 23])]})'],
    ['Job.j1.robot.angles', '[0,23,30,0,0,66,0]']
)

new TestSuite("move_all_joints7",
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints(0,0,30,0,0,66,77)]})'],
    ['Job.j1.robot.angles', '[0,0,30,0,0,66,77]'],
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints()]})'],
    ['Job.j1.robot.angles', '[0,0,30,0,0,66,77]'],
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints(NaN, 23)]})'],
    ['Job.j1.robot.angles', '[0,23,30,0,0,66,77]']
)

new TestSuite("move_all_joints7_array",
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints([0,0,30,0,0,66,77])]})'],
    ['Job.j1.robot.angles', '[0,0,30,0,0,66,77]'],
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints([])]})'],
    ['Job.j1.robot.angles', '[0,0,30,0,0,66,77]'],
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints([NaN, 23])]})'],
    ['Job.j1.robot.angles', '[0,23,30,0,0,66,77]']
)

new TestSuite("pid_move_all_joints",
    ['new Job({name: "j1", do_list: [Dexter.pid_move_all_joints(0,0,30,0,0,0,0)]})'],
    ['Job.j1.robot.pid_angles', '[0,0,30,0,0,0,0]'],
    ['new Job({name: "j1", do_list: [Dexter.pid_move_all_joints()]})'],
    ['Job.j1.robot.pid_angles', '[0,0,30,0,0]'],
    ['new Job({name: "j1", do_list: [Dexter.pid_move_all_joints(NaN, 23)]})'],
    ['Job.j1.robot.pid_angles', '[0,23,30,0,0,0,0]'],
    ['new Job({name: "j1", do_list: [Dexter.pid_move_all_joints([NaN, NaN, 33, 44, 55, 66, 77])]})'],
    ['Job.j1.robot.pid_angles', '[0,23,33,44,55,66,77]']
)

new TestSuite("move_all_joints_relative",
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints(0,0,30,0,0,0,0)]})'],
    ['Job.j1.robot.angles', '[0,0,30,0,0,0,0]'],
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints_relative()]})'],
    ['Job.j1.robot.angles', '[0,0,30,0,0,0,0]'],
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints_relative(NaN, 23, 11)]})'],
    ['Job.j1.robot.angles', '[0,23,41,0,0,0,0]'],
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints_relative([NaN, NaN, NaN, NaN, NaN, 12, 14])]})'],
    ['Job.j1.robot.angles', '[0,23,41,0,0, 12, 14]'],
    ['new Job({name: "j1", do_list: [Dexter.move_all_joints_relative([NaN, NaN, NaN, NaN, NaN, 1,   2])]})'],
    ['Job.j1.robot.angles', '[0,23,41,0,0, 13, 16]'],
)

