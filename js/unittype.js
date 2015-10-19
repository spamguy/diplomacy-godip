module.exports = {
    ARMY: 1,
    FLEET: 2,

    toUnitType: function(name) {
        switch (name.toString().toUpperCase()) {
            case '1':
            case 'A':
            case 'ARMY':
                return this.ARMY;
            case '2':
            case 'F':
            case 'FLEET':
                return this.FLEET;
            default:
                throw new Error('No unit type corresponds to ' + name);
        }
    }
};
