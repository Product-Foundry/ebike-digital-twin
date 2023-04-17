/* Crank rpm reader */
define('js/mechanics/CadenceSensor', [], function () {

    function CadenceSensor() {
        this.position = null;
        this.reading = null;
        this.timestamp = null;
    }

    return CadenceSensor;

})