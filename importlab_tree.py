import sys
import json
from importlab import environment
from importlab import graph


class Args:
    def __init__(self, dictionary):
        for key in dictionary:
            self.__setattr__(key, dictionary[key])


args = Args({"python_version": '3.8', "pythonpath": '', "tree": True, "trim": True, "unresolved": False})

args.inputs = [sys.argv[1]]
env = environment.create_from_args(args)

import_graph = graph.ImportGraph.create(env, args.inputs, args.trim)
deps_list = import_graph.deps_list()

final_deps = [i[0] for i in deps_list]

print(json.dumps(final_deps))

