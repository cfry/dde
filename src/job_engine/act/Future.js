globalThis.Future = class Future{
    constructor(cont=out, is_running=true, value){
        this.cont       = cont
        this.is_running = is_running
        this.value      = value
    }
    static make(cont){
        let fut = new Future(cont, true, value)
        this.future_queue.push(fut)
    }
    static contains_future(...args){
        for(let arg of args) {
            if(arg instanceof Future){
                return true
            }
        }
        return false
    }
    /*static make_maybe(cont, ...args){
        for(let arg of args) {
            if(arg instanceof Future){
               return Future.make(cont)
            }
        }
    }*/
    static init(timeout=10){
        this.future_queue = []
        this.interval_id = setInterval(do_future_on_queue, timeout)
    }
    static stop(){
        clearInterval(this.interval_id)
    }
    static future_queue = []

    static add_future_to_queue(fut){
        this.future_queue.push(fut)
    }
    //if there is a not-running future on the que, grab the first one,
    //remove it from the queue, and run its continuation
    static do_future_on_queue(){
        for(let i=0; i < this.future_queue; i++){
            let fut = this.future_queue[i]
            if(!fut.is_running){
                this.future_queue.splice(i, 1)
                fut.cont.call(null, fut.value)
                return
            }
        }
    }
    set_value(value){
        this.value = value
        this.is_running = false
    }
}