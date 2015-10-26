package main

import (
    "github.com/gopherjs/gopherjs/js"

    "github.com/spamguy/godip/state"
    //"github.com/spamguy/godip/variants"
)

func main() {
    js.Global.Set("state", map[string]interface { } {
        "NextFromJS": state.NextFromJS,
    })

    // js.Global.Set("variant", map[string]interface { } {
    //     "New": variants.New,
    // })
}
