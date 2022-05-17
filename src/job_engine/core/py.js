//see https://pyodide.org/en/stable/usage/api-reference.html
globalThis.Py = class Py {
    static eval(src){
        let proxy_maybe = pyodide.runPython(src)
        if(pyodide.isPyProxy(proxy_maybe)) {
            let value = proxy_maybe.toJs()
            proxy_maybe.destroy() //get rid of the memory
            return value
        }
        else { return proxy_maybe }
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