// This spec file parses the Diplomacy Adjudication Test Cases file and spits out one Jasmine unit test per item.
var fs = require('fs'),
    path = require('path'),
    byline = require('byline'),
    stream = fs.createReadStream(path.join(__dirname, 'datc_v2.4_06.txt'), { encoding: 'utf8' }),
    stream = byline.createStream(stream),
    expect = require('chai').expect,
    _ = require('lodash'),
    winston = require('winston');

var Judge = require('../diplomacy-godip'),
    UnitType = require('../js/unittype'),
    OrderType = require('../js/ordertype');

var variant = null,
    judge = null;

/*
 * During a unit test parse, a line can be considered in one of several states.
 *
 * Line parsing will stay in that state's section until the next state change.
 */
var UnitTestSubstateType = {
    TEST: 0,
    PRESTATE_SUPPLYCENTER: 1,
    PRESTATE_RESULTS: 2,
    PRESTATE_DISLODGED: 3,
    PRESTATE: 4,
    ORDERS: 5,
    POSTSTATE: 6
},
    currentSubstate = UnitTestSubstateType.TEST;

var clearCommentReg = new RegExp(/^\s*#.*$/),
    variantReg = new RegExp(/^VARIANT_ALL\s+(\S*)\s*$/),
    caseReg = new RegExp(/^CASE\s+(.*)$/),
    prestateSetPhaseReg = new RegExp(/^PRESTATE_SETPHASE\s+(\S+)\s+(\d+),\s+(\S+)\s*$/),
    stateReg = new RegExp(/^([^:\s]+):?\s+(\S+)\s+(\S+)\s*$/),
    ordersReg = new RegExp(/([^:]+):\s+\w\s+([\w\/]{3,6})\s*(-|\w*)\s*(?:\w\s+)?([\w\/]{3,6})?\s*(?:via [Cc]onvoy|[-H]?\s*([\w\/]{3,6})?)$/),
    buildOrdersReg = new RegExp(/([^:]+):\s+(\w*)\s+(\w)?\s*([\w\/]{3,6})$/),
    preOrderReg = new RegExp(/^(SUCCESS|FAILURE):\s+([^:]+):\s+(.*)$/);

// substates within unit tests
var inPrestateSetPhaseMode = false;

var itQueue = [ ],              // queue up it()s to be run later
    itLabel = '',
    beforePhaseData,
    expectedPhaseData,
    expectedResolvedPhaseData,
    genericIt = function(l, before, after) {
        // Raw phase data + raw variant object = state godip object.
        var godipAfter = global.state.NextFromJS(variant, before);

        // Convert godipAfter to actualAfter, indexed by region.
        var indexedActualAfter = { };

        for (var u in godipAfter.Units()) {
            var region = u.split(/[\/\.]/),
                unit = godipAfter.Units()[u];
            indexedActualAfter[region[0]] = {
                r: region[0]
            };

            if (region[1]) {
                indexedActualAfter[region[0]].sr = indexedActualAfter.sr || [ ];
                indexedActualAfter[region[0]].sr.push({
                    r: region[1],
                    unit: {
                        power: unit.Nation[0],
                        type: unit.Type === 'Fleet' ? 2 : 1
                    }
                });
            }
            else {
                indexedActualAfter[region[0]].unit = {
                    power: unit.Nation[0],
                    type: unit.Type === 'Fleet' ? 2 : 1
                };
            }
        }

        for (var d in godipAfter.Dislodgeds()) {
            var unit = godipAfter.Dislodgeds()[d];
            indexedActualAfter[region[0]].dislodged = {
                power: unit.Nation[0],
                type: unit.Type === 'Fleet' ? 2 : 1
            };
        }

        // Run the unit test.
        it(l, function() {
            expect(indexedActualAfter).to.contain.all.keys(_.pluck(after.moves, 'r'));

            // Compare this 'after' to the 'after' predicted by POSTSTATE.
            for (var r = 0; r < after.moves.length; r++) {
                expect(indexedActualAfter[after.moves[r].r]).to.eql(after.moves[r]);
            }
        });
    };

// Wraps enqueued it() tests with correct params.
var itWrapper = function(fn, context, params) {
    return function() {
        fn.apply(context, params);
    };
};

stream.on('error', function(err) {
    winston.error(err);
});

stream.on('data', function(line) {
    // strip whitespace and comments
    line = line.split('#')[0].trim();

    try {
        var match;
        if (match = line.match(clearCommentReg) || line === '') {
            // Do nothing.
        }
        else if (match = line.match(variantReg)) {
            currentSubstate = UnitTestSubstateType.TEST;
            // Use match in the context of variant file names.
            match = _.camelCase(match[1]);

            var variantPath;
            if (process.env.TRAVIS)
                variantPath = path.resolve(path.join(process.env.TRAVIS_BUILD_DIR, 'variants/' + match + '/' + match + '.json'));
            else
                variantPath = path.resolve(path.join(__dirname, '../../../variants/' + match + '/' + match + '.json'));

            winston.info('Acquiring variant file at ' + variantPath);

            var variantData = JSON.parse(fs.readFileSync(variantPath), { encoding: 'utf8' });

            // Set up Golang/JS bridge.
            //variant = global.variant.New(variantData);
            variant = variantData;
        }
        else if (match = line.match(caseReg)) {
            currentSubstate = UnitTestSubstateType.TEST;
            itLabel = match[1];

            // Start new old/expected phases to build.
            beforePhaseData = { year: 1901, season: 1, moves: [ ] };
            expectedPhaseData = { year: 1901, season: 1, moves: [ ] };

            // pre-bump expectedPhaseData season
            expectedPhaseData.season++;
        }
        else if (match = line.match(prestateSetPhaseReg)) {
            currentSubstate = UnitTestSubstateType.TEST;
            var season = match[1],
                year = match[2],
                action = match[3];

            beforePhaseData.year = year;
            beforePhaseData.season = season;
            beforePhaseData.seasonType = action;
        }
        else if (line === 'PRESTATE') {
            // enter prestate processing mode
            currentSubstate = UnitTestSubstateType.PRESTATE;
        }
        else if (line === 'PRESTATE_SUPPLYCENTER_OWNERS') {
            currentSubstate = UnitTestSubstateType.PRESTATE_SUPPLYCENTER;
        }
        else if (line === 'PRESTATE_RESULTS') {
            currentSubstate = UnitTestSubstateType.PRESTATE_RESULTS;
        }
        else if (line === 'PRESTATE_DISLODGED') {
            currentSubstate = UnitTestSubstateType.PRESTATE_DISLODGED;
        }
        else if (line === 'ORDERS') {
            currentSubstate = UnitTestSubstateType.ORDERS;
        }
        else if (line === 'POSTSTATE') {
            currentSubstate = UnitTestSubstateType.POSTSTATE;
        }
        else if (line === 'POSTSTATE_SAME') {
            currentSubstate = UnitTestSubstateType.TEST;
            expectedPhaseData = _.cloneDeep(beforePhaseData);

            // Clear orders in expectations, because order data will be scrubbed by the judge.
            for (var m = 0; m < expectedPhaseData.moves.length; m++) {
                if (expectedPhaseData.moves[m].sr) {
                    for (var sr = 0; sr < expectedPhaseData.moves[m].sr.length; sr++) {
                        if (expectedPhaseData.moves[m].sr[sr].unit)
                            delete expectedPhaseData.moves[m].sr[sr].unit.order;
                    }
                }

                if (expectedPhaseData.moves[m].unit)
                    delete expectedPhaseData.moves[m].unit.order;
            }
        }
        else if (line === 'POSTSTATE_DISLODGED') {
            currentSubstate = UnitTestSubstateType.POSTSTATE_DISLODGED;
        }
        else if (line === 'END') {
            currentSubstate = UnitTestSubstateType.TEST;

            // Test has been built and can be run after the file has been processed.
            itQueue.push(itWrapper(genericIt, this, [itLabel, beforePhaseData, expectedPhaseData]));
        }
        else {
            // If none of the above apply, we must be in a substate of some sort.
            switch (currentSubstate) {
                case UnitTestSubstateType.PRESTATE_SUPPLYCENTER:
                    match = line.match(stateReg);
                    var power = match[1][0], // Only the first initial is relevant.
                        unitType = match[2],
                        region = match[3].toUpperCase(),
                        b;
                    unitType = UnitType.toUnitType(unitType);

                    for (b = 0; b < beforePhaseData.moves.length; b++) {
                        if (beforePhaseData.moves[b].r === region) {
                            beforePhaseData.moves[b].sc = power;
                            break;
                        }
                    }

                    // if no region found, push it
                    if (b === beforePhaseData.moves.length) {
                        beforePhaseData.moves.push({
                            r: region,
                            sc: power
                        });
                    }

                    break;
                case UnitTestSubstateType.PRESTATE:
                    match = line.match(stateReg);
                    var power = match[1][0], // only the first initial is relevant
                        unitType = match[2],
                        region = match[3].toUpperCase().split(/[\/\.]/),
                        b;
                    unitType = UnitType.toUnitType(unitType);

                    var unitTemplate = {
                        type: unitType,
                        power: power,
                        order: {
                            // To be filled in at ORDERS state.
                        }
                    };

                    for (b = 0; b < beforePhaseData.moves.length; b++) {
                        if (beforePhaseData.moves[b].r === region[0]) {
                            if (region[1] && beforePhaseData.moves[b].sr) {
                                for (var sr = 0; sr < beforePhaseData.moves[b].sr.length; sr++) {
                                    if (region[1].toUpperCase() === beforePhaseData.moves[b].sr[sr].r.toUpperCase()) {
                                        beforePhaseData.moves[b].sr[sr].unit = unitTemplate;
                                        break;
                                    }
                                }
                            }
                            else {
                                beforePhaseData.moves[b].unit = unitTemplate;
                                break;
                            }
                        }
                    }

                    // If no region found, push it.
                    if (b === beforePhaseData.moves.length) {
                        var newRegion = {
                            r: region[0]
                        };

                        if (region[1])
                            newRegion.sr = [ { r: region[1].toUpperCase(), unit: unitTemplate } ];
                        else
                            newRegion.unit = unitTemplate;

                        beforePhaseData.moves.push(newRegion);
                    }
                    break;

                case UnitTestSubstateType.ORDERS:
                    var unitLocation,
                        unitType,
                        unitAction,
                        power,
                        unitTarget,
                        unitTargetTarget,
                        order;

                    if (line.toUpperCase().indexOf('BUILD') > 0 || line.toUpperCase().indexOf('REMOVE') > 0) {
                        match = line.match(buildOrdersReg);
                        power = match[1][0];
                        unitAction = OrderType.toOrderType(match[2]);
                        unitType = match[3];
                        unitLocation = match[4].toUpperCase().split(/[\/\.]/);
                        var subregion = null;

                        // Province may have been defined in PRESTATE. Query moves first.
                        for (var r = 0; r < beforePhaseData.moves.length; r++) {
                            if (beforePhaseData.moves[r].r === unitLocation[0].toUpperCase()) {
                                order = beforePhaseData.moves[r];
                                if (order.sr && unitLocation[1])
                                    subregion = order.sr[unitLocation[1].toUpperCase()];
                                break;
                            }
                        }

                        // A power cannot build somewhere it doesn't own.
                        // A power cannot disband something it doesn't own.
                        if ((unitAction === 'build' && power === order.sc) ||
                            (order && unitAction === 'disband' && power === order.unit.power)) {
                            if (!order) {
                                order = {
                                    r: unitLocation[0].toUpperCase()
                                };
                                beforePhaseData.moves.push(order);
                            }

                            if (subregion) {
                                order.sr = order.sr || [];
                                var subregionOrder = {
                                    r: unitLocation[1].toUpperCase(),
                                    unit: {
                                        power: power,
                                        order: {
                                            action: unitAction
                                        }
                                    }
                                };

                                if (unitType)
                                    subregionOrder.unit.order.type = UnitType.toUnitType(unitType);

                                order.sr.push(subregionOrder);
                            }
                            else {
                                order.unit = {
                                    power: power,
                                    order: {
                                        action: unitAction
                                    }
                                };

                                if (unitType)
                                    order.unit.order.type = UnitType.toUnitType(unitType);
                            }
                        }
                        else {
                            winston.debug('Ignoring line; power does not own unit or region: ' + line);
                        }
                    }
                    else {
                        match = line.match(ordersReg);
                        power = match[1][0]; // Only the first initial is relevant.
                        unitLocation = match[2].toUpperCase().split(/[\/\.]/);
                        unitAction = match[3];
                        unitTarget = match[4];
                        unitTargetTarget = match[5];

                        if (unitTarget)
                            unitTarget = unitTarget.toUpperCase().split(/[\/\.]/);
                        if (unitTargetTarget)
                            unitTargetTarget = unitTargetTarget.toUpperCase().split(/[\/\.]/);

                        // It is assumed a corresponding unit was declared in PRESTATE.
                        for (var b = 0; b < beforePhaseData.moves.length; b++) {
                            if (beforePhaseData.moves[b].r !== unitLocation[0])
                                continue;

                            // Only unit owners can command their units (!)
                            // TODO: Refactor such that subregions/regions use same code
                            if (beforePhaseData.moves[b].sr && unitLocation[1]) {
                                for (var sr = 0; sr < beforePhaseData.moves[b].sr.length; sr++) {
                                    if (unitLocation[1] === beforePhaseData.moves[b].sr[sr].r) {
                                        if (beforePhaseData.moves[b].sr[sr].unit && beforePhaseData.moves[b].sr[sr].unit.power === power) {
                                            beforePhaseData.moves[b].sr[sr].unit.order.action = OrderType.toOrderType(unitAction);
                                            if (beforePhaseData.moves[b].sr[sr].unit.order.action !== 'hold')
                                                beforePhaseData.moves[b].sr[sr].unit.order.y1 = unitTarget.join('/');
                                            if (unitTargetTarget) // i.e., target unit exists and is also not holding
                                                beforePhaseData.moves[b].sr[sr].unit.order.y2 = unitTargetTarget.join('/');
                                        }

                                        break;
                                    }
                                }
                            }

                            if (beforePhaseData.moves[b].unit && beforePhaseData.moves[b].unit.power === power) {
                                beforePhaseData.moves[b].unit.power = power;
                                beforePhaseData.moves[b].unit.order.action = OrderType.toOrderType(unitAction);
                                if (beforePhaseData.moves[b].unit.order.action !== 'hold')
                                    beforePhaseData.moves[b].unit.order.y1 = unitTarget.join('/');
                                if (unitTargetTarget) // i.e., target unit exists and is also not holding
                                    beforePhaseData.moves[b].unit.order.y2 = unitTargetTarget.join('/');
                            }
                            else {
                                winston.debug('Ignoring line; power does not own unit: ' + line);
                            }
                            break;
                        }
                    }
                    break;

                case UnitTestSubstateType.POSTSTATE:
                    match = line.match(stateReg);
                    var power = match[1][0], // only the first initial is relevant
                        unitType = match[2],
                        region = match[3].toUpperCase().split(/[\/\.]/),
                        b;
                    unitType = UnitType.toUnitType(unitType);
                    var unitTemplate = {
                        type: unitType,
                        power: power
                    };

                    for (b = 0; b < expectedPhaseData.moves.length; b++) {
                        if (expectedPhaseData.moves[b].r === region[0]) {
                            if (region[1]) { // Append as subregion.
                                expectedPhaseData.sr = expectedPhaseData.sr || [];
                                for (var sr = 0; sr < expectedPhaseData.sr.length; sr++) {
                                    if (expectedPhaseData.sr[sr].r === region[1]) {
                                        expectedPhaseData.sr[sr].unit = unitTemplate;
                                        break;
                                    }
                                }
                            }
                            else { // Append as region.
                                expectedPhaseData.unit = unitTemplate;
                            }

                            break;
                        }
                    }

                    // if no region found, push it.
                    if (b === expectedPhaseData.moves.length) {
                        var newRegion = {
                            r: region[0].toUpperCase()
                        };

                        if (region[1])
                            newRegion.sr = [ { r: region[1], unit: unitTemplate } ];
                        else
                            newRegion.unit = unitTemplate;
                        expectedPhaseData.moves.push(newRegion);
                    }
                    break;

                case UnitTestSubstateType.POSTSTATE_DISLODGED:
                    match = line.match(stateReg);
                    var power = match[1][0], // only the first initial is relevant
                        unitType = match[2],
                        region = match[3].toUpperCase().split(/[\/\.]/),
                        subregion = null;

                        for (var b = 0; b < expectedPhaseData.moves.length; b++) {
                            if (expectedPhaseData.moves[b].r === region[0]) {
                                if (region[1]) {
                                    expectedPhaseData.moves[b].sr = expectedPhaseData.moves[b].sr || [ ];
                                    for (var sr = 0; sr < expectedPhaseData.moves[b].sr.length; sr++) {
                                        if (region[1] === expectedPhaseData.moves[b].sr[sr].r) {
                                            subregion = expectedPhaseData.moves[b].sr[sr];
                                            break;
                                        }
                                    }

                                    if (subregion) {
                                        subregion.dislodged = {
                                            power: power,
                                            type: unitType
                                        };
                                    }
                                }
                                else {
                                    expectedPhaseData.moves[b].dislodged = {
                                        power: power,
                                        type: UnitType.toUnitType(unitType)
                                    };
                                }

                                break;
                            }
                        }

                    break;

                case UnitTestSubstateType.POSTSTATE_RESULTS:
                    break;
            }
        }
    } catch (ex) {
        winston.error('Failure processing line \'' + line + '\': ' + ex);
        throw ex;
    }
});

stream.on('end', function() {
    // Run all tests.
    describe('DATC', function() {
        try {
        while (itQueue.length > 0)
            (itQueue.shift())();
        } catch (ex) { winston.error(ex); }
    });
});
