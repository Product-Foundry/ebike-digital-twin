/* eBike Speed
 */
define('js/mechanics/MachinePropagation', [], function () {

  function MachinePropagation(bike, timestamp, numRotations) {
    // this.bike = new BicycleSpecification(bike);
    // this.timestamp = timestamp;
    // this.wheelRotations = numRotations;
    // this.speed = Math.round(this.calculateBikeSpeed(numRotations))/10000;
  }

  MachinePropagation.prototype.calculateBikeSpeed = function (numRotations) {
    return this.bike.etrtoSpecification.circumference * numRotations;
  }

  return MachinePropagation;
});