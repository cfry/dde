import "./test_suite.js" //must be here as TestSuite must be defined before loading the below

new TestSuite("file_system",
    [`new Job({name: "file_sys_test",
         do_list: [Dexter.write_file("file_sys_test.txt", "file_sys_test content1"),
                   Control.wait_until(1),
                   Dexter.read_file("file_sys_test.txt", "ud_var_file_test")
                  ]
         }
        )`],
    ['out("give some time for the above file_system test to take effect before running the below.")'],
    ['Job.file_sys_test.user_data.ud_var_file_test', '"file_sys_test content1"'],
    [`new Job({name: "file_sys_test",
         do_list: [Dexter.write_file("file_sys_test.txt", "file_sys_test obsolete content")  
                  ]
         }
        )`]
    )
    
new TestSuite("folder_name_version_extension",
    ['folder_name_version_extension("foo")',        '[dde_apps_folder, "foo", null, null]'],
    ['folder_name_version_extension("foo.txt")',    '[dde_apps_folder, "foo", null, "txt"]'],
    ['folder_name_version_extension("foo_7")',      '[dde_apps_folder, "foo", 7, null]'],
    ['folder_name_version_extension("foo_7.txt")',  '[dde_apps_folder, "foo", 7, "txt"]'],
    ['folder_name_version_extension(".foo_7.txt")', '[dde_apps_folder, ".foo", 7, "txt"]'],
    ['folder_name_version_extension(".foo")',       '[dde_apps_folder, ".foo", null, null]'],
    ['folder_name_version_extension(".foo.txt")',   '[dde_apps_folder, ".foo", null, "txt"]'],
    ['folder_name_version_extension(".foo_7")',     '[dde_apps_folder, ".foo", 7, null]']
)

/* for repeated runs, requires creating and deleting files. 
 new TestSuite("get_latest_path",
    ['get_latest_path("foo9")', "null"],
    [get_latest_path("foo9.txt"), "null"],
    [write_file(dde_apps_folder + "/foo9.txt", "junk")]
    [write_file(dde_apps_folder + "/foo9_2.txt", "junk")]
    ['make_unique_path("foo9")', 'dde_apps_folder + "/foo9_0"'],
    [make_unique_path("foo9.txt") ]
    ['write_file(dde_apps_folder + "/foo9_4")'],
    ['get_latest_path("foo9")', 'dde_apps_folder + "/foo9_4"']    
)
*/




    