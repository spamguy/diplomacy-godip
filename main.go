package main

import (
    "github.com/gopherjs/gopherjs/js"

    "github.com/spamguy/godip/graph"
    "github.com/spamguy/godip/state"
    "github.com/spamguy/godip/variant"
)

func main() {
    js.Global.Set("state", map[string]interface { } {
        "New": state.New,
    })

    js.Global.Set("graph", map[string]interface { } {
        "New": graph.New,
    })

    js.Global.Set("variant", map[string]interface { } {
        "New": variant.New,
    })
}
