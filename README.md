# diplomacy-godip [![Build Status](https://travis-ci.org/spamguy/diplomacy-godip.svg?branch=master)](https://travis-ci.org/spamguy/diplomacy-godip)
=====

This is a NodeJS adjudication service for Diplomacy. It implements a fork of [zond/godip](https://www.github.com/spamguy/godip) modified to be JavaScript-friendly. This judge in turn fuels the dipl.io project at [spamguy/diplomacy](https://www.github.com/spamguy/diplomacy).
### General use

In JavaScript, acquire variant JSON, pass it into the judge, build a phase, and resolve it:

```
var judge = require('./godip'),
    variantData = { }, // See spamguy/diplomacy-variants repo
    variant = global.variant.New(variantData);

    var newState = variant.Start();
    // Set phase data here.

    var resolvedState = newState.Next();
```

Just as godip is DATC-compliant and verified against real games, this project aims to pass those same tests. Furthermore, these DATC tests are executed in Chai for easier analysis.

To run the DATC test cases against GopherJS output:

```
npm test
```
