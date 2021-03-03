import sys
import traceback
import json

def main():
    print("Python eval process started.\n", flush=True)
    while True:
        #src = sys.stdin.readlines()  #hangs until gets some stdin with a newline
        src = sys.stdin.readline()
        src = src.replace("{nL}", "\n")
        index_of_space = src.index(" ")
        callback_id = int(src[0:index_of_space])
        src = src[index_of_space + 1:len(src) - 1] #the -1 takes off the newline on the end of src
        #src = src.replace('"', '\\"')
        #print("grabbed input: ", src, flush=True)
        is_error = False
        result = None
        is_py_evalable = None
        try:
            compile(src, "main_eval compile", "eval") #works only for single expressions that return one value
        except: #compile for eval errored, so maybe src is not an expression. 
            is_py_evalable = False
        else: 
            is_py_evalable = True
        if is_py_evalable:
            try:
                result = eval(src)
                if str(type(result)) == "<class 'numpy.ndarray'>":
                    result = result.tolist()
            except Exception as err :
                is_error = True
                result = traceback.format_exc()
                #result = result.replace(", line ", ", <br/>line ")
            else: #the normal, working, return a  value, eval case
                is_error = False
        else:
            try:
                exec(src)
            except Exception as err:
                is_error = True
                result = traceback.format_exc()
                #result = result.replace(", line ", ", <br/>line ")
            else:
                is_error = False
                result = None
        json_obj = {"from": "Py.eval", "is_error": is_error, "source": src, "callback_id": callback_id, "result": result}
        json_str = None
        try:
            json_str = json.dumps(json_obj)
        except Exception as err:
            json_obj = {"from": "Py.eval", "is_error": True, "source": src, "callback_id": callback_id, "result": "Could not make JSON string of the result."}
            json_str = json.dumps(json_obj)
        print(json_str, sep="", flush=True)

print("Python: main_eval.py file loaded.", "\n", flush=True)
main()

#if __name__ == "__main__":
#    print("just under if", flush=True)
# 2 + 3
# 5 / 0


