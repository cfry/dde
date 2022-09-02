
//needed in DDE4,when running litegraph, choosing HCA_UI define_object,
///we get an error in lightgraph LGraphCanvas.prototype.adjustMouseEvent
//errors with "deltaX is  a read only property
//BUT defineProperty just doesn't work
/*
Object.defineProperty(WheelEvent, 'deltaX', {
    writable: true
    //set(newValue) { deltaX = newValue;}
})

Object.defineProperty(WheelEvent, 'deltaY', {
    writable: true
    //set(newValue) {deltaY = newValue;}
})
So... */
LGraphCanvas.prototype.adjustMouseEvent = function(e) {
    if (this.canvas) {
        var b = this.canvas.getBoundingClientRect();
        e.localX = e.clientX - b.left;
        e.localY = e.clientY - b.top;
    } else {
        e.localX = e.clientX;
        e.localY = e.clientY;
    }

    //e.deltaX = e.localX - this.last_mouse_position[0]; //errors as read only
    //e.deltaY = e.localY - this.last_mouse_position[1]; //errors as read only

    this.last_mouse_position[0] = e.localX;
    this.last_mouse_position[1] = e.localY;

    e.canvasX = e.localX / this.ds.scale - this.ds.offset[0];
    e.canvasY = e.localY / this.ds.scale - this.ds.offset[1];
};