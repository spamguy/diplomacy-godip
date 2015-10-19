diplomacy-godip
=====

This is a pseudo-fork of [zond/godip](https://www.github.com/zond/godip) meant to adapt its Golang adjudication logic to the JavaScript-based dipl.io project at [spamguy/diplomacy](https://www.github.com/spamguy/diplomacy). The important logic is left untouched, modified only as needed to be interpreted as JavaScript using [GopherJS](http://www.gopherjs.org).

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

To run the DATC test cases and real game analysis:

```
npm test
```

### Variant support

In order to be useful to dipl.io, variant support should be arbitrary and not directly tied to Standard/Classical. To that end, variants are not hard-coded, but rather pulled in from JSON files.

These are the truths that should be valid for such a variant to be godip compatible in a simple manner:

* There is a Map with Provinces.
 * Each Province can contain at most one Unit.
 * Each Province can contain at most one SupplyCenter.
* Each Province has one or more SubProvinces.
 * Each SubProvince has attributes, such as Sea, Land or Coast.
 * Each SubProvince has connections to other SubProvinces.
* There are Units with UnitType and Nation.
 * Each unit is in one SubProvince.
* There are SupplyCenters with Nation.
 * Each SupplyCenter is in one Province.
* There are Phases with Year, Season and PhaseType.
* Orders can vary greatly:
 * They can be valid only for certain Years, PhaseTypes or Seasons.
 * They can be valid only for certain UnitTypes.
 * They can be valid only for certain Map environments.
 * They can be valid only when certain other Orders are valid.
 * They can be valid only when certain Units are present.

### Algorithm

Heavily inspired by [The Math of Adjudication](http://www.diplom.org/Zine/S2009M/Kruijswijk/DipMath_Chp1.htm) by Lucas Kruijswijk.

Res(x) is https://github.com/spamguy/godip/blob/master/state/resolver.go.

Adj(x) is defined in each order type.

Example runs:

#### 6.C.3. TEST CASE, A DISRUPTED THREE ARMY CIRCULAR MOVEMENT
```
Running 6.C.3
Res(bul) (deps [])
  Adj(bul)
    'bul Move con' vs 'ank Move con': 1
    H2HDisl(con)
    Not dislodged
    'ank Move con' vs 'bul Move con': 1
  bul: Failure: ErrBounce:ank
  No guessing, resolving bul
bul: Failure: ErrBounce:ank (deps [])
Res(ank) (deps [])
  Adj(ank)
    'ank Move con' vs 'bul Move con': 1
    H2HDisl(con)
    Not dislodged
    'bul Move con' vs 'ank Move con': 1
  ank: Failure: ErrBounce:bul
  No guessing, resolving ank
ank: Failure: ErrBounce:bul (deps [])
Res(con) (deps [])
  Adj(con)
    'con Move smy' vs 'smy Move ank': 1
    Esc(smy)
      Res(smy) (deps [])
        Adj(smy)
          'smy Move ank' vs 'ank Move con': 1
          Esc(ank)
            Res(ank) (deps [])
              Resolved
            ank: Failure: ErrBounce:bul (deps [])
          Failure: ErrBounce:bul
        smy: Failure: ErrBounce:ank
        No guessing, resolving smy
      smy: Failure: ErrBounce:ank (deps [])
    Failure: ErrBounce:ank
  con: Failure: ErrBounce:smy
  No guessing, resolving con
con: Failure: ErrBounce:smy (deps [])
Res(smy) (deps [])
  Resolved
smy: Failure: ErrBounce:ank (deps [])
```

#### 6.F.16. TEST CASE, PANDIN'S PARADOX
```
Running 6.F.17 (Pandin's extended paradox)
Res(eng) (deps [])
  Adj(eng)
    Res(bel) (deps [])
      Adj(bel)
        Res(nth) (deps [])
          Adj(nth)
          nth: Success
          No guessing, resolving nth
        nth: Success (deps [])
        'bel Move eng' vs 'wal Move eng': 2
        Res(lon) (deps [])
          Adj(lon)
            Res(eng) (deps [])
              Already resolving eng, making negative guess
            eng: Failure: Negative guess (deps [eng])
            Res(eng) (deps [eng])
              Guessed
            eng: Failure: Negative guess (deps [eng])
            Res(eng) (deps [eng])
              Guessed
            eng: Failure: Negative guess (deps [eng])
            Res(eng) (deps [eng])
              Guessed
            eng: Failure: Negative guess (deps [eng])
            Res(bre) (deps [eng])
              Adj(bre)
                Res(eng) (deps [eng])
                  Guessed
                eng: Failure: Negative guess (deps [eng])
                Res(eng) (deps [eng])
                  Guessed
                eng: Failure: Negative guess (deps [eng])
              bre: Failure: ErrMissignConvoyPath
            bre: Failure: ErrMissignConvoyPath (deps [eng])
          lon: Success
          Made new guess, adding lon to deps
        lon: Success (deps [eng lon])
        H2HDisl(eng)
        Not dislodged
        'wal Move eng' vs 'bel Move eng': 2
      bel: Failure: ErrBounce:wal
      Made new guess, adding bel to deps
    bel: Failure: ErrBounce:wal (deps [eng lon bel])
    Res(wal) (deps [eng lon bel])
      Adj(wal)
        Res(lon) (deps [eng lon bel])
          Adj(lon)
            Res(eng) (deps [eng lon bel])
              Guessed
            eng: Failure: Negative guess (deps [eng lon bel])
            Res(eng) (deps [eng lon bel])
              Guessed
            eng: Failure: Negative guess (deps [eng lon bel])
            Res(eng) (deps [eng lon bel])
              Guessed
            eng: Failure: Negative guess (deps [eng lon bel])
            Res(eng) (deps [eng lon bel])
              Guessed
            eng: Failure: Negative guess (deps [eng lon bel])
            Res(bre) (deps [eng lon bel])
              Adj(bre)
                Res(eng) (deps [eng lon bel])
                  Guessed
                eng: Failure: Negative guess (deps [eng lon bel])
                Res(eng) (deps [eng lon bel])
                  Guessed
                eng: Failure: Negative guess (deps [eng lon bel])
              bre: Failure: ErrMissignConvoyPath
            bre: Failure: ErrMissignConvoyPath (deps [eng lon bel])
          lon: Success
        lon: Success (deps [eng lon bel])
        'wal Move eng' vs 'bel Move eng': 2
        Res(nth) (deps [eng lon bel])
          Resolved
        nth: Success (deps [eng lon bel])
        H2HDisl(eng)
        Not dislodged
        'bel Move eng' vs 'wal Move eng': 2
      wal: Failure: ErrBounce:bel
    wal: Failure: ErrBounce:bel (deps [eng lon bel])
  eng: Success
  Guess made for eng, changing guess to positive
  Adj(eng)
    Res(bel) (deps [eng lon bel])
      Adj(bel)
        Res(nth) (deps [eng lon bel])
          Resolved
        nth: Success (deps [eng lon bel])
        'bel Move eng' vs 'wal Move eng': 2
        Res(lon) (deps [eng lon bel])
          Adj(lon)
            Res(eng) (deps [eng lon bel])
              Guessed
            eng: Success (deps [eng lon bel])
            Res(eng) (deps [eng lon bel])
              Guessed
            eng: Success (deps [eng lon bel])
            lon Support [wal eng]: broken by: [bre]
          lon: Failure: ErrSupportBroken:bre
        lon: Failure: ErrSupportBroken:bre (deps [eng lon bel])
        'wal Move eng' vs 'bel Move eng': 1
        Res(nth) (deps [eng lon bel])
          Resolved
        nth: Success (deps [eng lon bel])
        'bel Move eng' vs 'eng Convoy [bre lon]': 2
        'eng Convoy [bre lon]': 1
        Res(nth) (deps [eng lon bel])
          Resolved
        nth: Success (deps [eng lon bel])
        'bel Move eng' vs 'wal Move eng': 2
        Res(lon) (deps [eng lon bel])
          Adj(lon)
            Res(eng) (deps [eng lon bel])
              Guessed
            eng: Success (deps [eng lon bel])
            Res(eng) (deps [eng lon bel])
              Guessed
            eng: Success (deps [eng lon bel])
            lon Support [wal eng]: broken by: [bre]
          lon: Failure: ErrSupportBroken:bre
        lon: Failure: ErrSupportBroken:bre (deps [eng lon bel])
        'wal Move eng' vs 'bel Move eng': 1
      bel: Success
    bel: Success (deps [eng lon bel])
    Res(wal) (deps [eng lon bel])
      Adj(wal)
        Res(lon) (deps [eng lon bel])
          Adj(lon)
            Res(eng) (deps [eng lon bel])
              Guessed
            eng: Success (deps [eng lon bel])
            Res(eng) (deps [eng lon bel])
              Guessed
            eng: Success (deps [eng lon bel])
            lon Support [wal eng]: broken by: [bre]
          lon: Failure: ErrSupportBroken:bre
        lon: Failure: ErrSupportBroken:bre (deps [eng lon bel])
        'wal Move eng' vs 'bel Move eng': 1
        Res(nth) (deps [eng lon bel])
          Resolved
        nth: Success (deps [eng lon bel])
        H2HDisl(eng)
        Not dislodged
        'bel Move eng' vs 'wal Move eng': 2
      wal: Failure: ErrBounce:bel
    wal: Failure: ErrBounce:bel (deps [eng lon bel])
  eng: Failure: ErrConvoyDislodged:bel
  Calling backup rule with [eng lon bel]
  Calling backup rule for [eng lon bel]
  Res(eng) (deps [])
    Resolved
  eng: Failure: ErrConvoyParadox (deps [])
  No guessing, resolving eng
eng: Failure: ErrConvoyParadox (deps [])
Res(nth) (deps [])
  Resolved
nth: Success (deps [])
Res(bre) (deps [])
  Adj(bre)
    Res(eng) (deps [])
      Resolved
    eng: Failure: ErrConvoyParadox (deps [])
    Res(eng) (deps [])
      Resolved
    eng: Failure: ErrConvoyParadox (deps [])
  bre: Failure: ErrMissignConvoyPath
  No guessing, resolving bre
bre: Failure: ErrMissignConvoyPath (deps [])
Res(wal) (deps [])
  Adj(wal)
    Res(lon) (deps [])
      Adj(lon)
        Res(eng) (deps [])
          Resolved
        eng: Failure: ErrConvoyParadox (deps [])
        Res(eng) (deps [])
          Resolved
        eng: Failure: ErrConvoyParadox (deps [])
        Res(eng) (deps [])
          Resolved
        eng: Failure: ErrConvoyParadox (deps [])
        Res(eng) (deps [])
          Resolved
        eng: Failure: ErrConvoyParadox (deps [])
        Res(bre) (deps [])
          Resolved
        bre: Failure: ErrMissignConvoyPath (deps [])
      lon: Success
      No guessing, resolving lon
    lon: Success (deps [])
    'wal Move eng' vs 'bel Move eng': 2
    Res(nth) (deps [])
      Resolved
    nth: Success (deps [])
    H2HDisl(eng)
    Not dislodged
    'bel Move eng' vs 'wal Move eng': 2
  wal: Failure: ErrBounce:bel
  No guessing, resolving wal
wal: Failure: ErrBounce:bel (deps [])
Res(lon) (deps [])
  Resolved
lon: Success (deps [])
Res(yor) (deps [])
  Adj(yor)
  yor: Success
  No guessing, resolving yor
yor: Success (deps [])
Res(bel) (deps [])
  Adj(bel)
    Res(nth) (deps [])
      Resolved
    nth: Success (deps [])
    'bel Move eng' vs 'wal Move eng': 2
    Res(lon) (deps [])
      Resolved
    lon: Success (deps [])
    H2HDisl(eng)
    Not dislodged
    'wal Move eng' vs 'bel Move eng': 2
  bel: Failure: ErrBounce:wal
  No guessing, resolving bel
bel: Failure: ErrBounce:wal (deps [])
```
