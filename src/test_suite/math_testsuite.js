import "./test_suite.js" //must be here as TestSuite must be defined before loading the below

//these TestSuites from the files in the "math" folder

//from Coor.js
//note that Coor.Table is the normal way to refer to table
new TestSuite("Coordinate Object System",
    ['desk = Coor.create_child(Vector.make_pose(), "desk")', "Coor.desk"],
    ['J0 = desk.create_child(Vector.make_pose(), "J0")', "Coor.desk.J0"],
    ['J1 = J0.create_child(Vector.make_pose([10, 0, 0]), "J1")', "Coor.desk.J0.J1"],
    ['J2 = J1.create_child(Vector.make_pose([0, 0, 20]), "J2")', "Coor.desk.J0.J1.J2"],
    ['J3 = J2.create_child(Vector.make_pose([0, 0, 20]), "J3")', "Coor.desk.J0.J1.J2.J3"],
    ['cube = desk.create_child(Vector.make_pose([15, 10, 5], [0, 0, 0]), "cube")', "Coor.desk.cube"],
    ["J3.get_pose()", "[[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 20], [0, 0, 0, 1]]"],
    ["J3.get_pose(desk)", "[[1, 0, 0, 10], [0, 1, 0, 0], [0, 0, 1, 40], [0, 0, 0, 1]]"],
    ["cube.get_pose()", "[[1, 0, 0, 15], [0, 1, 0, 10], [0, 0, 1, 5], [0, 0, 0, 1]]"],
    ["J3.get_pose(cube)", "[[1, 0, 0, -5], [0, 1, 0, -10], [0, 0, 1, 35], [0, 0, 0, 1]]"],
    ["cube.get_pose(J3)", "[[1, 0, 0, 5], [0, 1, 0, 10], [0, 0, 1, -35], [0, 0, 0, 1]]"],

    ['cube = desk.create_child(Vector.make_pose([15, 10, 5], [0, 0, 45]), "cube")', "Coor.desk.cube"],

    ["J3.get_position()", "[0, 0, 20]"],
    ["J3.get_orientation()", "[[1, 0, 0], [0, 1, 0], [0, 0, 1]]"],
    ["J3.get_orientation(cube)", "[ [1, 0, 0], [0, 0.7071067811865476, 0.7071067811865475], [0, -0.7071067811865475, 0.7071067811865476]]"],

    ["J3.set_pose([[1, 0, 0, 10], [0, 1, 0, 10],[0, 0, 1, 10],[0, 0, 0, 1]])", "[[1, 0, 0, 10], [0, 1, 0, 10], [0, 0, 1, 10], [0, 0, 0, 1]]"],
    ["J3.set_pose([[1, 0, 0, 10], [0, 1, 0, 10],[0, 0, 1, 10],[0, 0, 0, 1]], desk)   ", "[[1, 0, 0, 0], [0, 1, 0, 10], [0, 0, 1, -10], [0, 0, 0, 1]]"],
    ["J3.set_position([10, 10, 10])", "[[1, 0, 0, 10], [0, 1, 0, 10], [0, 0, 1, 10], [0, 0, 0, 1]]"],
    ["J3.set_position([10, 10, 10], desk)", "[[1, 0, 0, 0], [0, 1, 0, 10], [0, 0, 1, -10], [0, 0, 0, 1]]"],
    ["J3.set_orientation([[-1, 0, 0], [0, 0, 1], [0, 0, 1]])", "[[-1, 0, 0, 0], [0, 0, 1, 10], [0, 0, 1, -10], [0, 0, 0, 1]]"],
    ["J3.set_orientation([[-1, 0, 0], [0, 0, 1], [0, 0, 1]], cube)", "[ [-1, 0, 0, 0], [0, 0, 1.1102230246251565e-16, 10], [0, 0,  1.414213562373095, -10], [0, 0, 0, 1]]"]
)

//From Kin.js
new TestSuite("Inverse to Forward Kinematics and Back",
    [`Vector.is_equal(Kin.J_angles_to_xyz(Kin.xyz_to_J_angles([.1, .2, .3])), 
                      [[0.09999999999999998, 0.20000000000000004, 0.29999999999999993],
                       [-1.6811372268703155e-16, -3.362274453740631e-16, -1],
                       [1, 1, 1]], 
                      5)`,
        "true"],
    [`Vector.is_equal(Kin.J_angles_to_xyz(Kin.xyz_to_J_angles([.1, .2, .3], [0, .1, -1])),
                      [[0.10000000000000013, 0.19999999999999996, 0.30000000000000016],
                       [5.043411680610948e-16, 0.09950371902099911, -0.995037190209989],
                       [1, 1, 1]],
                      5)`,
        "true"],
    [`Vector.is_equal(Kin.J_angles_to_xyz(Kin.xyz_to_J_angles([.1, .2, .3], [0, 0, -1], [1, 0, 1])),
                     [[0.09999999999999994, 0.20000000000000004, 0.29999999999999993],
                      [-1.6811372268703155e-16, -3.362274453740631e-16, -1],
                      [1, 0, 0]],
                      5)`,
        "true"],
    [`Vector.is_equal(Kin.J_angles_to_xyz(Kin.xyz_to_J_angles([.1, .2, .3], [0, 0, -1], [1, 0, 0])),
                      [[0.09999999999999994, 0.2, 0.29999999999999993],
                       [0, 0, -1],
                       [1, 0, 0]],
                      5)`,
        "true"],
    [`Vector.is_equal(Kin.xyz_to_J_angles(Kin.J_angles_to_xyz([0, 45, 45, 30, 0])),
                     [0, 44.99999999999997, 45.00000000000003, 29.999999999999996, 0],
                     5)`,
        "true"]
)

new TestSuite("Checking xyz",
    ["Kin.check_J_ranges([0, 0, 0, 0, 0])", "true"],
    ["Kin.check_J_ranges([0, 0, 0, 181, 0])", "false"]
)

//from Vector.js
new TestSuite("Vector Library",
    ["Vector.add([1, 2, 3], [4, 5, 6])", "[5, 7, 9]"],
    ["Vector.add([1, 2, 3], [4, 5, 6], 10, 50)", "[65, 67, 69]"],
    ["Vector.subtract([4, 5, 6], [1, 2, 3])", "[3, 3, 3]"],
    ["Vector.subtract([4, 5, 6], 1, [1, 2, 3])", "[2, 2, 2]"],
    ["Vector.multiply([1, 2, 3], [4, 5, 6])", "[4, 10, 18]"],
    ["Vector.multiply([1, 2, 3], [4, 5, 6], 10, 50)", "[2000, 5000, 9000]"],
    ["Vector.size([1, 2, 3])", "3"],
    ["Vector.size([10])", "1"],
    ["Vector.size(10)", "1"],
    ["Vector.normalize([1, 1, 0])", "[0.7071067811865475, 0.7071067811865475, 0]"],
    ["Vector.dot([1, 2, 3], [4, 5, 6])", "32"],
    ["Vector.cross([1, 2, 3], [4, 5, 6])", "[-3, 6, -3]"],
    ["Vector.transpose(Vector.transpose([1, 2, 3, 4, 5]))", "[1, 2, 3, 4, 5]"]
)
new TestSuite("Vector.is_equal",
    ["Vector.is_equal([1, 2, 3], [1, 2, 3.01])", "false"],
    ['Vector.is_equal([1, 2, 3], [1, 2, 3.01], 1, "decimal_places")', "true"],
    ['Vector.is_equal([1, 2, 3], [1, 2, 3.01], .005, "absolute")', "false"],
    ['Vector.is_equal([1, 2, 3], [1, 2, 3.01], .1, "absolute")', "true"],
    ['Vector.is_equal([1, 2, 3], [1, 2, 3], .1, "percent_difference")', "true"],
    ['Vector.is_equal([1, 2, 3], [1, 2, 3.01], .1, "percent_difference")', "true"],
    ['Vector.is_equal([1, 2, 3], [1, 2, 3.01], .001, "percent_difference")', "false"],
    ['Vector.is_equal([1, 1, 1], [2, 2, 2], 1, "absolute")', "true"],
    ['Vector.is_equal([1, 1, 1], [2, 2, 2], 1, "magnitude")', "false"],
    ['Vector.is_equal(null, null)', "true"],
    ['Vector.is_equal(null, 123)',  "false"],
    ['Vector.is_equal(undefined, null)', "true"]
    //['Vector.is_equal([null], [null])',  "true"]
)

new TestSuite("Vector.round",
    ["Vector.round(7)", "7"],
    ["Vector.round(5.4)", "5.4"],
    ["Vector.round(6.66)", "6.7"],
    ["Vector.round(8.44)", "8.4"],
    ["Vector.round([2.22, 7.77])", "[2.2, 7.8]"],
    ["Vector.round(6.666, 2)", "6.67"],
    ["Vector.round(NaN)", "NaN"],
    ["Vector.round([NaN])", "[NaN]"],
    //["Vector.round([NaN, null, undefined, 82])", "[null, null, null, 82]"],
    ["Vector.round([-143.99, -132.44])", "[-144, -132.4]"]
)

new TestSuite("Vector.matrix_dimensions",
    ["Vector.matrix_dimensions(3)", "[1, 0]"],
    ["Vector.matrix_dimensions([3])", "[1, 1]"],
    ["Vector.matrix_dimensions(null)", "[1, 0]"],
    ["Vector.matrix_dimensions([4])", "[1, 1]"],
    ["Vector.matrix_dimensions([null])", "[1, 1]"],
    ["Vector.matrix_dimensions([null, null])", "[1, 2]"],
    ["Vector.matrix_dimensions([5, 6])", "[1, 2]"],
    ["Vector.matrix_dimensions([[null, null]])", "[1, 2]"]
)

new TestSuite("Vector Library - Matrix Math",
    ["Vector.matrix_divide([[1, 0, 0, 10], [0, 1, 0, 20], [0, 0, 1, 30], [0, 0, 0,  1]], [[1, 0, 0, 100], [0, 1, 0, 200], [0, 0, 1, 300], [0, 0, 0,  1]])", "[[1, 0, 0, -90], [0, 1, 0, -180], [0, 0, 1, -270], [0, 0, 0, 1]]"],
    ["Vector.matrix_divide([[1, 0, 0, 100], [0, 1, 0, 200], [0, 0, 1, 300], [0, 0, 0,  1]], [[1, 0, 0, 10], [0, 1, 0, 20], [0, 0, 1, 30], [0, 0, 0,  1]])", "[[1, 0, 0, 90], [0, 1, 0, 180], [0, 0, 1, 270], [0, 0, 0, 1]]"],
    ["Vector.make_matrix(10, 7)", "[[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]]"],
    ["Vector.make_matrix(3)", "[[0, 0, 0], [0, 0, 0], [0, 0, 0]]"],
    ["Vector.make_matrix(3, 2, 1)", "[[1, 1], [1, 1], [1, 1]]"],
    ["Vector.transpose(Vector.transpose([1, 2, 3]))", "[1, 2, 3]"],
    ["Vector.matrix_multiply([1, 2, 3], [[1], [2], [3]])", "[[14]]"],
    ["Vector.matrix_multiply([[1], [2], [3]], [1, 2, 3])", "[[1, 2, 3], [2, 4, 6], [3, 6, 9]]"],
    ["Vector.matrix_multiply([[1, 2, 3], [4, 5, 6]], [[7, 8], [9, 10], [11, 12]])", "[[58, 64], [139, 154]]"],
    ["Vector.matrix_multiply([[1, 0, 0, 10], [0, 1, 0, 20], [0, 0, 1, 30], [0, 0, 0,  1]], [[1], [2], [3], [1]])", "[[11], [22], [33], [1]]"],
    ["Vector.transpose([1, 2, 3])", "[[1], [2], [3]]"],
    ["Vector.transpose([[1, 2, 3], [4, 5, 6]])", "[[1, 4], [2, 5], [3, 6]]"],
    ["Vector.determinant([[1, 0, 0], [0, 1, 0], [0, 0, 1]])", "1"],
    ["Vector.determinant([[0, 0, 0], [0, 1, 0], [0, 0, 1]])", "0"],
    ["Vector.determinant([[Math.sqrt(2)/2, Math.sqrt(2)/2, 0], [-Math.sqrt(2)/2, Math.sqrt(2)/2, 0], [0, 0, 1]])", "1.0000000000000002"],
    ["Vector.inverse([[1, 0, 0], [0, 1, 0], [0, 0, 1]])", "[[1, 0, 0], [0, 1, 0], [0, 0, 1]]"],
    ["Vector.inverse([[3, 2, 1.7, 1.5], [4.5, 5, 4.1, 1.9], [1.1, 8.5, 9, 8], [3, 9, 9, 10]])", "[ [ 0.7319863743922018, -0.18592193878878188, 0.10453233481551132, -0.1580986556413699], [ -2.6473723899420833, 1.3118547988663025, -1.2270847960059614, 1.1295212835114843], [ 2.4406479964636474, -1.081727643862005, 1.5172790389266348, -1.374392178277074], [ -0.03354395818706807, -0.1513378578672326, -0.29253451907325856, 0.3678134019814442]]"],
    ["Vector.matrix_divide([[1, 0, 0, 10], [0, 1, 0, 20], [0, 0, 1, 30], [0, 0, 0,  1]], [[1, 0, 0, 100], [0, 1, 0, 200], [0, 0, 1, 300], [0, 0, 0,  1]])", "[[1, 0, 0, -90], [0, 1, 0, -180], [0, 0, 1, -270], [0, 0, 0, 1]]"],
    ["Vector.matrix_dimensions([10, 20, 30])", "[1, 3]"],
    ["Vector.matrix_dimensions([[10], [20], [30]])", "[3, 1]"],
    ["Vector.properly_define_point([10, 20, 30])", "[[10], [20], [30], [1]]"],
    ["Vector.properly_define_point([[10], [20], [30]])", "[[10], [20], [30], [1]]"],
    ["Vector.properly_define_point([[10, 20, 30], [10, 20, 30], [10, 20, 30]])", "[[10, 10, 10], [20, 20, 20], [30, 30, 30], [1, 1, 1]]"],
    ["Vector.make_pose()", "[[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]"],
    ["Vector.make_pose([10, 20, 30], [45, 0, 0])", "[ [0.7071067811865476, -0.7071067811865475, 0, 10], [0.7071067811865475, 0.7071067811865476, 0, 20], [0, 0, 1, 30], [0, 0, 0, 1]]"],
    ["Vector.identity_matrix(4)", "[[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]"],
    ["Vector.identity_matrix(2)", "[[1, 0], [0, 1]]"],
    ["Vector.rotate_DCM(Vector.identity_matrix(3), [1, 0, 0], 90)", "[[1, 0, 0], [0, 0, -1], [0, 1, 0]]"],
    ['Vector.rotate_pose(Vector.make_pose(), "Z", 90, [10, 0, 0])', "[ [0, -1, 0, 10], [1, 0, 0, -10], [0, 0, 1, 0], [0, 0, 0, 1]]"],
    ["Vector.is_pose(Vector.make_pose())", "true"],
    ["Vector.pull([[1, 2, 3], [4, 5, 6], [7, 8, 9]], [1, 2], [1, 2])", "[[5, 6], [8, 9]]"],
    ["Vector.concatinate(0, [1, 2, 3], [4, 5, 6])", "[[1, 2, 3], [4, 5, 6]]"],
    ["Vector.concatinate(1, [1, 2, 3], [4, 5, 6])", "[1, 2, 3, 4, 5, 6]"],
    ["Vector.concatinate(1, [[1, 1], [2, 2], [3, 2]], [[4], [5], [6]])", "[[1, 1, 4], [2, 2, 5], [3, 2, 6]]"]
)

new TestSuite("Vectorproject_point_onto_line",
    ["Vector.project_point_onto_line([1, 2, 3], [0, 0, 0], [10, 0, 0])", "[1, 0, 0]"],
    ["Vector.project_point_onto_line([1, 2, 3], [0, 0, 0], [0, 10, 0])", "[0, 2, 0]"],
    ["Vector.project_point_onto_line([1, 2, 3], [0, 0, 0], [0, 0, 10])", "[0, 0, 3]"],
    ["similar(Vector.project_point_onto_line([1, 2, 3], [0, 0, 0], [10, 10, 0]), [1.5, 1.5, 0], Number.EPSILON)", "true"]
)

new TestSuite("Kin.three_torques_to_force",
    ["Kin.three_torques_to_force([0, 0, 90, 0, 0], [0, 0, 0])", "[0, 0, 0]"],
    ["Kin.three_torques_to_force([0, 0, 90, 0, 0], [30*_N*_m, 0, 0])", "[81.74386920980926, 0, 0]"],
    ["Kin.three_torques_to_force([0, 0, 90, 0, 0], [0, 30*_N*_m, 30*_N*_m])", "[0, -2.842170943040401e-14, -81.74386920980926]"]
)