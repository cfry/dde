function test_click_help(path){
  let full_src = read_file(path)
  for(let pos = 0; pos <= full_src.length; pos++){
     let context = pos + " before: " + full_src.substring(pos, pos + 10)
     console.log(context)
     Editor.show_identifier_info(full_src, pos)   
  }
}
/*
test_click_help("/Users/Fry/Downloads/synchronous_instructions_without_Jobs.dde")

*/