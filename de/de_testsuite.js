-              
                    

new Job({name: "j2",
        do_list: [Dexter.move_all_joints([0, 0, 0, 0, 0]), //angles
                  Dexter.move_to([0, 0.5, 0.075],     //xyz
                                 [0, 0, -1],          //J5_direction
                                 Dexter.RIGHT_UP_OUT) //config
                 ]})



make a Job with name of "j2" and 
                do_list of make an array with Dexter move_all_joints 
                                                 with make an array with 0, 0, 0, 0, 0.., (angles)
                                              Dexter move_to
                                                 with make an array with 0, 0,5, 0,075., (xyz)
                                                      make an array with 0, 0, -1.,      (J5_direction)
                                                      Dexter/RIGHT_UP_OUT (config)
                                                 .
                                         .
           .
 