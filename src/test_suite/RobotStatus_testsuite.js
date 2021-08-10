new TestSuite("robot_status_g0",
    [`new Job({
         name: "rs_test_job_g0",
         do_list: [Dexter.empty_instruction_queue(),
                   Dexter.move_all_joints(5, 6, 7),
                   Control.wait_until(5), //needs 5 secs to reach commanded angles before requesting robot status for measnured angles
                   IO.out("after wait"),
                   Dexter.get_robot_status(),
                   Dexter.empty_instruction_queue()
             ]})`],
    ["Job.rs_test_job_g0.robot.rs.status_mode()", "0"],
    ["RobotStatus.is_other_status_mode(1297)", "true"],
    ["Job.rs_test_job_g0.robot.rs.supports_measured_angles()", "true"],
    ["Job.rs_test_job_g0.robot.rs.measured_angles().length", "7"],
    ["out('In robot_status_g0, with measured_angle(1) of: ' + Job.rs_test_job_g0.robot.rs.measured_angle(1))"],
    ["similar(Job.rs_test_job_g0.robot.rs.measured_angle(1), 5, 1)", "true"],
    ["Job.rs_test_job_g0.robot.rs.sents()", "[5, 6, 7, 0, 0]"],
    ["Job.rs_test_job_g0.robot.rs.angles()", "[5, 6, 7, 0, 0]"],
    ["Job.rs_test_job_g0.robot.rs.a2d_sins()", "[0, 0, 0, 0, 0]"],
    ["Job.rs_test_job_g0.robot.rs.a2d_coses()", "[0, 0, 0, 0, 0]"],
    ["Job.rs_test_job_g0.robot.rs.raw_encoder_angles()", "TestSuite.error"],
    ["Job.rs_test_job_g0.robot.rs.eye_numbers()", "TestSuite.error"]   
)

new TestSuite("junkts",
   ["out(123)"]
)


new TestSuite("robot_status_g2",
    [`new Job({
         name: "rs_test_job_g2",
         do_list: [Dexter.empty_instruction_queue(),
                   Dexter.move_all_joints(5, 6, 7),
                   Control.wait_until(5), //needs 5 secs to reach commanded angles before requesting robot status for measnured angles
                   Dexter.get_robot_status(2),
                   Dexter.empty_instruction_queue()
             ]})`],
    ["Job.rs_test_job_g2.robot.rs.status_mode()", "2"],
    ["RobotStatus.is_other_status_mode(1297)", "true"],
    ["Job.rs_test_job_g2.robot.rs.supports_measured_angles()", "true"],
    ["Job.rs_test_job_g2.robot.rs.measured_angles().length", "7"],
    ["similar(Job.rs_test_job_g2.robot.rs.measured_angle(1), 5, 1)", "true"],
    ["Job.rs_test_job_g2.robot.rs.sents()", "[0, 0, 0, 0, 0]"],
    ["Job.rs_test_job_g2.robot.rs.raw_encoder_angles()", "[0, 0, 0, 0, 0]"],
    ["Job.rs_test_job_g2.robot.rs.eye_numbers()", "[0, 0, 0, 0, 0]"],
    ["Job.rs_test_job_g2.robot.rs.angles()", "TestSuite.error"],
    ["Job.rs_test_job_g2.robot.rs.a2d_sins()", "[0, 0, 0, 0, 0]"],
    ["Job.rs_test_job_g2.robot.rs.a2d_coses()", "[0, 0, 0, 0, 0]"]
)