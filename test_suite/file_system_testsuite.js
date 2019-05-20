
new TestSuite("file_system",
    [`new Job({name: "file_sys_test",
         do_list: [Dexter.write_file("file_sys_test.txt", "file_sys_test content1"),
                   Dexter.read_file("file_sys_test.txt", "ud_var_file_test")
                  ]
         }
        )`],
    ['Job.file_sys_test.user_data.ud_var_file_test', '"file_sys_test content1"'],
    [`new Job({name: "file_sys_test",
         do_list: [Dexter.write_file("file_sys_test.txt", "file_sys_test obsolete content")  
                  ]
         }
        )`]
    )
    