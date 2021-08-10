
export class EvalTest {

    static do_eval(src, step=false){
        let step_code = (step? " debugger; " : "")
        let result = new Function(step_code + "return (" + src + ")" )()
        //let result = eval(src)
        console.log(src + " evaled to: " + result)
        return result
    }
}