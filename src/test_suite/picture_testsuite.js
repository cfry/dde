import "./test_suite.js" //must be here as TestSuite must be defined before loading the below

new TestSuite("make_mat rgba",
    ["Picture.init()", "undefined"],
    ["var tsmat1 = Picture.make_mat()", "undefined"],
    
    ["Picture.is_mat(tsmat1)", "true"],
    ['Picture.is_mat(tsmat1, "rgba")', "true"],
    ['Picture.is_mat(tsmat1, "gray")', "false"],
    //['Picture.is_mat(tsmat1, "grey")', "TestSuite.error"],
    ['Picture.is_mat(tsmat1, "xxx")', "false"],
    
    ["tsmat1.channels()", "4"],
    ["Picture.mat_width(tsmat1)", "320"],
    ["Picture.mat_height(tsmat1)", "240"],
    
    ["Picture.set_mat_red(tsmat1, 2, 3, 254)", "undefined"], 
    ["Picture.mat_red(tsmat1, 2, 3)", "254"],
    
    ["var tspixel1 = Picture.mat_pixel(tsmat1, 2, 3)", "undefined"],
    //not a regular array, its a Uint8Array so can use array similarity
    ["tspixel1.length", "4"],
    ["tspixel1[1]", "0"],
    
    ["Picture.set_mat_green(tsmat1, 2, 3, 253)", "undefined"],
    ["Picture.mat_green(tsmat1, 2, 3)", "253"],
    ["Picture.set_mat_blue(tsmat1, 2, 3, 252)", "undefined"],
    ["Picture.mat_blue(tsmat1, 2, 3)", "252"],
    ["Picture.set_mat_alpha(tsmat1, 2, 3, 251)", "undefined"],
    ["Picture.mat_alpha(tsmat1, 2, 3)", "251"],
    
    ["Picture.set_mat_reds(tsmat1, 250)", "undefined"],
    ["Picture.mat_red(tsmat1, 12, 34)", "250"],
    ["Picture.set_mat_greens(tsmat1, 249)", "undefined"],
    ["Picture.mat_green(tsmat1, 12, 34)", "249"],
    ["Picture.set_mat_blues(tsmat1, 248)", "undefined"],
    ["Picture.mat_blue(tsmat1, 12, 34)", "248"]
    
)

new TestSuite("make_mat gray",
    ["Picture.init()", "undefined"],
    ['var tsmat1 = Picture.make_mat({type: "gray"})', "undefined"],
    ["Picture.is_mat(tsmat1)", "true"],
    ['Picture.is_mat(tsmat1, "gray")', "true"],
    ['Picture.is_mat(tsmat1, "rgba")', "false"],
    ["Picture.mat_gray(tsmat1, 0, 0)", "0"],
    ["Picture.set_mat_gray(tsmat1, 2, 3, 17)", "undefined"],
    ["Picture.mat_gray(tsmat1, 2, 3)", "17"],
    ["Picture.set_mat_grays(tsmat1, 66)", "undefined"],
    ["Picture.mat_gray(tsmat1, 17, 23)", "66"]
)

new TestSuite("RotatingCalipers",
    ["(new RotatingCalipers([[133,148],[202,147],[196,82],[249,185]])).convexHull()",
    "[[249,185],[196,82],[133,148]]"],

    ["(new RotatingCalipers([[133,148],[202,147],[196,82],[249,185]])).minAreaEnclosingRectangle().vertices",
    "[[172.33723356685047,224.44783127142642],[119.33723356685051,121.44783127142642],[196.00000000000003,82],[248.99999999999997,185]]"]
)
