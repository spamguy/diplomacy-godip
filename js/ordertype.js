module.exports = {
    UNKNOWN: 0,
    HOLD: 1,
    MOVE: 2,
    SUPPORT: 3,
    CONVOY: 4,
    BUILD: 5,
    DISBAND: 6,

    toOrderType: function(name) {
        switch (name.toString().toUpperCase()) {
            case '1':
            case 'H':
            case 'HOLD':
            case 'HOLDS':
                return 'hold';
            case '2':
            case '-':
                return 'move';
            case '3':
            case 'S':
            case 'SUPPORT':
            case 'SUPPORTS':
                return 'support';
            case '4':
            case 'C':
            case 'CONVOY':
            case 'CONVOYS':
                return 'convoy';
            case '5':
            case 'BUILD':
            case 'BUILDS':
                return 'build';
            case '6':
            case 'REMOVE':
            case 'REMOVES':
            case 'DISBAND':
            case 'DISBANDS':
                return 'disband';
            default:
                throw new Error('No order type corresponds to ' + name);
        }
    }
};
