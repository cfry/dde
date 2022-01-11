//This file content must live in Documents/dde_apps/dde_init.js
//This file is loaded when you launch DDE.
//Add whatever JavaScript you like to the end.

//To change DDE colors,
// 1. Uncomment the below line(s).
// 2. Select the first arg.
// 3. Choose the "Insert" menu, "Color" item.
// 4. After inserting the new color, eval the "set_" call.
// 5. To get the default color, just comment out the line and relaunch DDE.
// set_window_frame_background_color("#b8bbff")
// set_pane_header_background_color("#bae5fe")
// set_menu_background_color("#93dfff")
// set_button_background_color("#93dfff")

persistent_set("ROS_URL", "localhost:9090") //required property, but you can edit the value.
persistent_set("default_dexter_ip_address", "192.168.1.142") //required property but you can edit the value.
persistent_set("default_dexter_port", "50000") //required property, but you can edit the value.
new Dexter({name: "dexter0"}) //dexter0 must be defined.

/*load_files(__dirname + "/blocksde/init.js")
load_files(__dirname + "/hca/hca.js")
blocks_init()*/
load_files("dde_init_fry_adds.js")
