Let's consider case 6.A.5:

```
# move to same sector is illegal, even with convoy
CASE 6.A.5 (Move to own sector with convoy)
PRESTATE_SETPHASE Spring 1901, Movement
PRESTATE
    England: A lvp
    England: A yor
    England: F nth
    Germany: F lon
    Germany: A wal
ORDERS
    England: F nth convoys A yor - yor
    England: A yor-yor
    England: A lvp supports A yor-yor
    Germany: F lon-yor
    Germnay: A wal SUPPORTS F lon-yor
POSTSTATE
    England: A lvp
    England: F nth
    Germany: F yor
    Germany: A wal
POSTSTATE_DISLODGED
    England: A yor
END
```

Translated into JSON, The input phase looks like:

```
{
    year: 1901,
    season: 1,
    moves: [{
            r: 'NTH',
            unit: {
                power: 'E',
                type: 2,
                order: {
                    action: 'convoy',
                    y1: 'YOR',
                    y2: 'YOR'
                }
            }
        }, {
            r: 'YOR',
            unit: {
                power: 'E',
                type: 1,
                order: {
                    action: 'move',
                    y1: 'YOR'
                }
            }
        }, {
            r: 'LVP',
            unit: {
                power: 'E',
                type: 1,
                order: {
                    action: 'support',
                    y1: 'YOR',
                    y2: 'YOR'
                }
            }]
        }, {
            r: 'LON',
            unit: {
                power: 'G',
                type: 2,
                order: {
                    action: 'move',
                    y1: 'YOR'
                }
            }
        }, {
            r: 'WAL',
            unit: {
                power: 'G',
                type: 1,
                order: {
                    action: 'support',
                    y1: 'LON',
                    y2: 'YOR'
                }
            }
        }
    ]
}
```

The result of `resolve()` should be the same, but with all the variant's regions thrown in. Regions with orders will have additional properties to indicate failure or success:

```
{
    year: 1901,
    season: 1,
    moves: [{
            r: 'NTH',
            unit: {
                power: 'E',
                type: 2,
                order: {
                    action: 'convoy',
                    y1: 'YOR',
                    y2: 'YOR',
                    result: 'fail',
                    details: 'ErrIllegalConvoyMove'
                }
            }]
        }, {
            r: 'YOR',
            unit: {
                power: 'E',
                type: 1,
                dislodged: true,
                order: {
                    action: 'move',
                    y1: 'YOR',
                    result: 'fail',
                    details: 'ErrInvalidDestination'
                }
            }
        }, {
            r: 'LVP',
            unit: {
                power: 'E',
                type: 1,
                order: {
                    action: 'support',
                    y1: 'YOR',
                    y2: 'YOR',
                    result: 'fail',
                    details: 'ErrIllegalSupportDestinationNation'
                }
            }
        }, {
            r: 'LON',
            unit: {
                power: 'G',
                type: 2,
                order: {
                    action: 'move',
                    y1: 'YOR',
                    result: 'success'
                }
            }
        }, {
            r: 'WAL',
            unit: {
                power: 'G',
                type: 1,
                order: {
                    action: 'support',
                    y1: 'LON',
                    y2: 'YOR',
                    result: 'success'
                }
            }
        }
    ]
}
```

After being fed into a new season, the final result is this (minus regions with no units):

```
{
    {
        year: 1901,
        season: 2,
        moves: [{
                r: 'NTH',
                unit: {
                    power: 'E',
                    type: 2
                }
            }, {
                r: 'YOR',
                unit: {
                    power: 'G',
                    type: 1
                },
                dislodged: {
                    power: 'E',
                    type: 1
                }
            }, {
                r: 'LVP',
                unit: {
                    power: 'E',
                    type: 1
                }
            }, {
                r: 'WAL',
                unit: {
                    power: 'G',
                    type: 1
                }
            }
        ]
    }
}
```
