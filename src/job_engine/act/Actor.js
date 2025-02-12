globalThis.Actor = class Actor { //aka Parallel actor, the normal, cheap kind
    constructor(name, actor_processor, script_source, state = {}){
        this.name = name
        this.actor_processor = actor_processor
        this.script_source = script_source
        this.script_ast    = ActEval.string_to_ast(script_source)
        this.state         = state
    }
    send(message, cont){
        let event = new ActEvent(this, message, cont)
        this.actor_processor.add_to_queue(event)
        ActEval.eval({
                      ast:  this.script_ast,
                      lex_env: this.state, //???
                      cont: cont,
                      source: this.script_source})
    }

    delegate(other_actor, message, cont){
        other_actor.send(message, cont)  //not sure this is all delegate does.
    }
}

/*its state in each Actor-serializer is (mostly) a queue of messages that have been sent to an instance of a
Serializer. The serializer just does one at a time,
the continuation for a send to a serializer will get the next item
off of its queue.

When we call some_actor.send, it creates an event and sticks it on the queue of
the actor's ActorProcessor.
When we pop that event off that queue, if it has a Serializer actor,
it goes on the Serializer's queue also.

 */
globalThis.Serializer = class Serializer extends Actor {
    constructor(name, script, state = {}){
        super(name);
        this.script = script //just a js fn.
        this.script_ast    = ActEval.string_to_ast(script_source)
        this.state         = state
        this.state.queue = []
        blobalThis[name] = this
    }

}


//instances don't have an ActorProcessor instance.
globalThis.ActorProcessor = class ActorProcessor extends Serializer {
    constructor(name, neighbor_actor_processors=[] ){
        super(name);

        this.script = script //just a js fn.
        this.script_ast    = ActEval.string_to_ast(script_source)
        this.state         = state //a list or name-value pairs  of the actors that are managed by this actor_processor
        this.state.queue = []
        this.neighbor_actor_processors = neighbor_actor_processors
        globalThis[name] = this
    }

    add_to_queue(event){
        //todo: before pusing an event onto the queue we shojld check to see if its actor is
        //in the list of actors managed by this actor_processor.
        //if not,. we ask the neighbor_actor_processors if THEY manage this actor and if not,
        //we recursinvly ask their neighbor_actor_processors if they manaage that actor.
        //if none. error.  Now "load balancing" and locality of reference is automatically
        //handled by the actor system. It mihgt move actors between actor_procssing.
        //*soome* particular actors or actor_processors might be on special hardware,
        //say a dexter, in which case we can't migrate those actors to another actor_processor.
        //we could have "hints" in an event/actor as to which acotor_processor manages a given actor
        //to making finding it quicker.
        this.actor_processor.state.queue.push(event)
    }

    run_next_event(){
        if(this.actor_processor.state.queue.lenght === 0) {} //nothing to do
        else {
            let next_event = this.state.queue.shift()
            let the_script = next_event.actor.script // just a js function
            let args = next_event.message.message_to_args() //todo
            let lex_env = the_script_and_args_to_lex_env(the_script, args) //todo
            call_script(the_script, lex_env, next_event.cont)   //todo   doesn't have a return
        }
    }

}

globalThis.ActEvent = class ActEvent{
    constructor(actor, message, cont){
        this.actor
        this.message
        this.cont
    }
}

//new ActorProcessor("first_actor_processor") //todo  now errors

