//see https://pyodide.org/en/stable/usage/api-reference.html
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
            await import("https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js")
            Py.status = "loading"
            globalThis.pyodide = await loadPyodide()
            Py.status = "loaded"
            out("Python initialized.")
            globalThis.pyodide
        }
        else { shouldnt("Py.init() has invalid status: " + Py.status)}
    }

    static eval(python_source_code) {
        if (this.status === "loaded") {
            let proxy_maybe = pyodide.runPython(python_source_code)
            if (pyodide.isPyProxy(proxy_maybe)) {
                let value = proxy_maybe.toJs()
                proxy_maybe.destroy() //get rid of the memory
                return value
            } else {
                return proxy_maybe
            }
        }
        else {
            dde_error("Py.eval can't work unless Python is loaded. It is: " + Py.status)
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