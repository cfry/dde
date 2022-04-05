Plotly = require('plotly.js-dist')

var Plot = class Plot{
   //static default_plot_div_id = "plot_id"
   static init(){     
   }

   static number_of_jobs_in_array(data){
       if(!Array.isArray(data)) { return 0 }
       else {
          let job_count = 0
          for(let job_maybe of data){
              if(job_maybe instanceof Job){
                  job_count++
              }
          }
          return job_count
       }
   }
   //returns the title to be used in the show_window.
   //if show_window_options has a title, just return that.
   //else if there is a tile in layout, extract it trom there and return that.
   //else make up a title from the data and return that.
   //Thus if you want a window that uses the layout title IN THE PLOT
   //and not in the show_window title, then include a title in layout,
   //and one in show_window_options
   static make_show_window_title(data, show_window_options){
      let title
      if(show_window_options && show_window_options.title) { title = show_window_options.title }
      else {
          if(data instanceof Job){
              title = "Path of Job." + data.name
          }
          else if (data === Job){
              title = "Paths of all defined Jobs"
          }
          else if (this.number_of_jobs_in_array(data) > 0){
              title = ""
              for(let job_maybe of data){
                  if(job_maybe instanceof Job){
                      title += ((title === "") ? "Plot of " : ", ")
                      title += "Job." + job_maybe.name
                  }
              }
          }
          else if (this.is_1d_array(data)){
            title = "1D array of " + data.length + " points"
          }
          else if (this.is_2d_array(data)){
            title = "2D array of " + data[0].length + " points"
          }
          else if (this.is_3d_array(data)){
            title = "3D array of " + data[0].length + " points"
          }
          else if(Array.isArray(data) && Array.isArray(data[0].z)){
            title = "3D array of " + data[0].z.length + " points"
          }
          else if(Array.isArray(data) && Array.isArray(data[0].y)){
            title = "(" + data.length + ")" + " 2D traces."
          }
          else {
            title = "Plot of data"
          }
          if((title.length > 32) && !title.includes("<")) { //if it has hhtm in the title, it could well be longer than 32 chars bu still display shorter. Just allow titles with > to be any length
             title = title.substring(0, 32) + "..."
          }
      }
       return title
   }
   static is_1d_array(data) {
     return Array.isArray(data) && 
           (typeof(data[0]) === "number")
   }
   static is_2d_array(data) { //not any 2D array, just the special kind for a scatter plot
     return Array.isArray(data)    &&
            data.length === 2      &&
            Array.isArray(data[0]) &&
            Array.isArray(data[1]) &&
            (typeof(data[0][0]) === "number")

   }
   static is_3d_array(data) {
     return Array.isArray(data) && 
            data.length === 3   &&
            is_array_of_numbers(data[0]) &&
            is_array_of_numbers(data[1]) &&
            is_array_of_numbers(data[2])
   }
   
   //called by inspect to know if it can plot an arry
   static is_data_array_ok(data){
     return this.is_1d_array(data) ||
            this.is_2d_array(data) ||
            this.is_3d_array(data) ||
            this.is_heat_map_suitable_data(data)
   }

   static is_heat_map_suitable_data(data){
       return is_2D_array_of_numbers(data)
   }

   //if there is a title in layout. we should keep it rther than move it to show_window_header. sp return true
   //otherwisde return false. Used by fix_margin to give title space at top of plot
   static has_plotly_title(layout){
       if(!layout) { return false } //no plotly title to keep
       else if (!layout.title) { return false } //no plotly title to keep
       else if ((typeof(layout.title) === "string") ||
                layout.title.text) { //got a plotly title
          return true //make space for the plotly title as we're keeping it.
       }
       else { return false }
   }
   
   //margin: see https://plotly.com/javascript/reference/layout/#layout-margin
   //default ploty margin is 80px all around, but that's way to wasteful of space
   /* no longer used static fix_margin(layout){
       let make_space_for_plotly_title = this.has_plotly_title(layout)
       let title_margin = (make_space_for_plotly_title ? 45 : 0)
       if((layout === null) || (layout === undefined)) {
           layout = {margin: {l:30, r:0, t: 15 + title_margin, b:30}}
       }
       else if(layout && (layout.margin === undefined)){
          if(layout.xaxis || layout.yaxis) { //due to what looks like a plotly bug,
           //if the layout has explicit xyis and/or yaxis text,
           //that text doesnt show up with DDE normal default margins of: {l:30, r:0, t:15, b:30}
              layout.margin = {l:0, r:0, t: 0 + title_margin, b:0}
          }
          else {
              layout.margin = {l:30, r:0, t: 15 + title_margin, b:30}
          }
       }
       return layout
   }*/

   static make_default_div_id(graphDiv){
       if(!value_of_path(graphDiv)){ //if  graphDiv doesn't exist, we're going to make a new graph
           return graphDiv
       }
       else { //graphdiv exists, so make a new window so we don't cover it up.
           for(let i = 1; i < 100; i++){
               let str = graphDiv + i
               if(!value_of_path(str)) {
                   return str
               }
           }
           dde_error("Too many plot windows open. Please close some.")
       }
   }
   static show(graphDiv="plot_id", data, layout=null, config, show_window_options={}){
       if(graphDiv === null) {graphDiv = "plot_id"}  //so that user can enter null instead of undefined to get
         //the default behavior as undefined is kinda long.
       graphDiv = this.make_default_div_id(graphDiv)
       if(typeof(data) === "string") { //useful when this is called from an html elt onclick property
           data = value_of_path(data)
       }
       //layout       = this.fix_margin(layout)
       show_window_options.title = this.make_show_window_title(data, show_window_options) //if show_window_options as passed in already had a title,
                                         //then this just sets that title back to itself so no change.
       if(!show_window_options.content) { show_window_options.content = "<div id='" + graphDiv + "'/>" }
       if(show_window_options.x === undefined) { show_window_options.x       = 50 }
       if(show_window_options.y === undefined) { show_window_options.y       = 50 }
       if(!show_window_options.width)          { show_window_options.width   = 700 }
       if(!show_window_options.height)         { show_window_options.height  = 500 }
       if(!show_window_options.callback)       { show_window_options.callback = function(vals) {} } //so that we don't inspect the show_window values when user closes the window. as the default callback does
       show_window(show_window_options)

       if (data === Job){
           data = Job.all_jobs() //array of job instances
       }
       if(data instanceof Job) {
           data = this.job_to_3_traces(data) //data.three_d_points_for_plotting()
       }
       else if (Array.isArray(data)) {
          data = this.replace_jobs_with_traces(data) //comment in when working
       }

       if(!Array.isArray(data)) {
       	  dde_error("Plot.show called with data that isn't an array: " + data)
       }
       else if(this.is_1d_array(data)) { //data is a 1D array
           this.show_1d_array(graphDiv, data, layout, config)
       }
       else if(this.is_2d_array(data)) { //not ANY 2D array, just the special kind for making a scatter plot.
           this.show_2d_array(graphDiv, data, layout, config)
       }
       else if(this.is_3d_array(data)){
           this.show_3d_array(graphDiv, data, layout, config)
       }
       else if(this.is_heat_map_suitable_data(data)){ //put this last. It can opperate on any 2D array, even ones with non-uniform lengthed inner arrays
           this.show_heat_map_array(graphDiv, data, layout, config)
       }
       else {
          Plotly.newPlot(graphDiv, data, layout, config)
       }
   }

   //arr is an array of job instances or traces
   static replace_jobs_with_traces(arr){
       let result = []
       for(let trace_index = 0; trace_index < arr.length; trace_index++){
           let job_maybe = arr[trace_index]
           if(job_maybe instanceof Job){
              let traces = this.job_to_3_traces(job_maybe, trace_index)
              result.push(traces[0])
              result.push(traces[1])
              result.push(traces[2])
           }
           else {
               result.push(job_maybe)
           }
       }
       return result
   }

   static job_to_3_traces(job_instance, trace_index){
      let three_d_arrays = job_instance.three_d_points_for_plotting() //an array of 3 arrays, an x, y z.
      return this.three_d_arrays_to_2_traces(three_d_arrays, trace_index, job_instance)
   }

   static get_trace_color(index) {
       let colors = ['#000000',
                     '#00A0FF',
                     '#00FFFF',
                     '#FF00FF',
                     '#FFFF00',
                     '#FFAA00',
                     '#AA00AA',
                     ]
       index = index % 7
       return colors[index]
   }

   static three_d_arrays_to_2_traces(data, trace_index=0, job_instance=null){
      let color = this.get_trace_color(trace_index)
      return  [ {  type: 'scatter3d',
                   x: data[0],
                   y: data[1],
                   z: data[2],
                   name: (job_instance ? job_instance.name + " path" : undefined),
                   line: {
                      size: 2,
                      color: color
                   },
                   marker: {
                        size: 5,
                        color: color
                   }
                },
               { //the green dot showing the first point
                   type: 'scatter3d',
                   mode: 'markers',
                   name: (job_instance ? job_instance.name + " first": "first point"),
                   x: [data[0][0]],
                   y: [data[1][0]],
                   z: [data[2][0]],
                   marker: {
                       size: 5,
                       color: '#00FF00'
                   }
               },
              { //the red dot showing the last point
                  type: 'scatter3d',
                  mode: 'markers',
                  name: (job_instance ? job_instance.name + " last": "last point"),
                  x: [data[0][data[0].length - 1]],
                  y: [data[1][data[1].length - 1]],
                  z: [data[2][data[2].length - 1]],
                  marker: {
                      size: 5,
                      color: '#FF0000'
                  }
              }
       ]
   }
   
   //data is expected to be just a 1 D array of numbers (y values)
   static show_1d_array(graphDiv="plot_id", data, layout, config){
       Plotly.newPlot( graphDiv, 
            [{ //no need to add x, plotly does it automatically 0 thru N.
              y: data }],
            layout,
            config //responsive to window size
        )
   }
   static show_2d_array(graphDiv="plot_id", data, layout, config){
       Plotly.newPlot( graphDiv, [{
        x: data[0], y: data[1] }],
        layout,
        config
        )
   }
   static show_3d_array(graphDiv="plot_id", data, layout, config){
       Plotly.newPlot( graphDiv,
            this.three_d_arrays_to_2_traces(data),
            layout,
            config
        )
   }

   static show_heat_map_array(graphDiv, array_2d, layout, config){
       let data = [{z: array_2d,
                    type: 'heatmap',
                    colorscale: "Bluered" // 'Electric' 'Greys' 'Picnic' 'Portland' "Hot" [[0, "yellow"], [1, "red"]]
           }]
       Plotly.newPlot(graphDiv, data, layout, config)
   }
}
/*
Plot.show(undefined, [2, 4, 6, 8])
Plot.show(undefined, [[0, 1, 2, 3],     [2, 3.456, 3, 2]], {title: "my cool plot"})
Plot.show(undefined, [[10, 20, 30, 40], [2, 4, 6, 8]], ) //ok
Plot.show(undefined, [[10, 20, 30, 40], [2, 4, 6, 8]], {}) //ok
Plot.show(undefined, [[1, 2, 3, 4, 5], [2, 4, 6, 8, 10], [2.5, 4.5, 6.6, 8.5, 10.5]])
Plot.show(undefined,
         [[10, 20, 33, 40], [2, 4.33, 6, 8]],
         {title:  "Not so great title",
          xaxis:  {title: {text: 'x Axis'}},
          yaxis:  {title: {text: 'y Axis'}}
          //margin: {l:0, r:0, t:0, b:0}
         }
)
         
 
         
         
         {title: "a mediocre title",
          xaxis: {
            title: {
              text: "x Axis",
              font: {
                family: 'Courier New, monospace',
                size: 18,
                color: '#7f7f7f'
              }
            },
          },
          yaxis: {title: {text: "money"}}
         }
         )

*/