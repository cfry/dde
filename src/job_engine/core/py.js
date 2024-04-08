//see https://pyodide.org/en/stable/usage/api-reference.html
//import * as pyodide_load_obj from "pyodide";
//globalThis.pyodide_load_obj = pyodide_load_obj

globalThis.Py = class Py {
    static status = "not_loaded"

    static async init(){
        if(Py.status == "loading"){
            warning("Python is in the process of loading.")
        }
        else if(Py.status == "loaded"){ //if we attemt to loadPyodide twice, we get an error,
            //so this is more graceful.
            warning("Python is already initialized.<br/>To re-initialize the Python environment, you must relaunch DDE.")
        }
        else if (Py.status == "not_loaded"){
            Py.status = "loading"
            //await import("https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js")
            //await import("https://cdn.jsdelivr.net/pyodide/v0.23.2/full/pyodide.js")
            await import("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js")
            //let pyodide_load_obj = await import("pyodide") //this dynamic fails due to not finding files in teh build folder, now using statuic import at top of file

            globalThis.pyodide = await loadPyodide()
            //globalThis.pyodide = await pyodide_load_obj.loadPyodide() //error: GET http://localhost/dde/build/pyodide-lock.json 404 (Not Found)
            //await pyodide.loadPackage("numpy"); doesn't error but doesn't bind "numpy" either
            //await pyodide.loadPackage(["js"]) //errors as does loading "sys"
            Py.status = "loaded"
            //this.eval("import sys")
            pyodide.runPython("import sys")
            pyodide.runPython("import js")
            await pyodide.loadPackage("numpy") //needs to be loaded before its imported according to error messages.

            out("Python initialized to: " + pyodide._api.sys.version + "<br/>" +
                "with Pyodide version: " + pyodide.version)
            //out("Python initialized with Pyodide version: " + pyodide_load_obj.version)

        }
        else { shouldnt("Py.init() has invalid status: " + Py.status)}
    }

    //this fn is a workaround for piodide discontinuing pyodide.isPyProxy in piodide 0.25.0
    //without even documenting this incompatiable chnage from piodide 0.23
    static is_py_proxy(obj){
        //return ((typeof(obj) === "object") &&
        //        obj.toJs &&
        //        obj.destroy)
        return obj instanceof pyodide.ffi.PyProxy //officially sanctioned way to do it.
    }

    static eval(python_source_code) {
        if (this.status === "loaded") {
            let proxy_maybe = pyodide.runPython(python_source_code)
            if(proxy_maybe === undefined) {
                return undefined
            }
            else if (this.is_py_proxy(proxy_maybe)) { //(pyodide.isPyProxy(proxy_maybe)) {
                let value = proxy_maybe.toJs()
                console.log("Py.eval converted proxy to value: " + value)
                //proxy_maybe.destroy() //get rid of the memory
                return value
            }
            else if ((typeof(proxy_maybe) === "string") && proxy_maybe.startsWith("eval_in_js")){
                let js_src = proxy_maybe.substring(10)
                try {
                    let value = eval(js_src)
                    return value
                }
                catch(err){
                    dde_error("Attempt to eval:<br/> <code>" + proxy_maybe +
                        "</code><br/> from python errored with:<br/>" +
                        err.message)
                }
            }
            else {
                return proxy_maybe
            }
        }
        else {
            dde_error("Py.eval can't work unless Python is initialized.<br/>" +
            "It is: " +  Py.status + "<br/>" +
            "To initialize Python, eval: <code>Py.init()</code>")
        }
    }

    static eval_py_part2(command){
        let result
        let start_time = Date.now()
        try {
            let value = Py.eval(command)
            result = {
                command: command,
                value: value,
                value_string: Utils.stringify_value(value),
                duration: Date.now() - start_time
            }
        }
        catch(err) {
            result = {
                command: command,
                error_type: err.name,
                error_message: err.message,
                full_error_message: err.stack
            }
        }
        let src_label = "The result of evaling Python: "
        eval_js_part3(result, src_label)
    }
}