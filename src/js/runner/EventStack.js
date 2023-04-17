/* Stacks ebike entity state for every event */
define('js/runner/EventStack', [], function () {

    function EventStack() {
        this.history = [];
    }

    EventStack.prototype.push = function (ebike) {
        this.history.push(ebike);
    }

    return EventStack;

})