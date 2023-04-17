/* Torque measured at crank or rear wheel  */
define('js/mechanics/TorqueSensor', [], function () {

    function TorqueSensor() {
        this.position = null;
        this.reading = null;
        this.timestamp = null;
    }

    return TorqueSensor;
})