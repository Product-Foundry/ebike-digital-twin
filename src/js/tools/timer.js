function startTimer(seconds, container, ebike) {
    let startTime, timer, obj, ms = seconds * 1000,
        display = document.getElementById(container);
    obj = {};
    obj.resume = function () {
        startTime = new Date().getTime();
        timer = setInterval(obj.step, 1000); // adjust this number to affect granularity
        // lower numbers are more accurate, but more CPU-expensive
    };
    obj.pause = function () {
        ms = obj.step();
        clearInterval(timer);
    };
    obj.stop = function () {
        ms = seconds * 1000;
        clearInterval(timer);
        display.innerHTML = "0:0:0";
    };
    obj.step = function () {
        let now = Math.max(0, ms + (new Date().getTime() - startTime)),
            m = Math.floor(now / 60000), s = Math.floor(now / 1000) % 60, mis = Math.floor(now % 1000);
        s = (s < 10 ? "0" : "") + s;
        // display.innerHTML = m + ":" + s + ":" + mis;
        display.innerHTML = m + ":" + s;
        if (now == 0) {
            clearInterval(timer);
            obj.resume = function () { };
            // if( oncomplete) oncomplete();
        }
        const right = $(".digital-twin .right")[0];
        const ss = ebike.supportSetting;
        const sfg = $("input:radio[name ='btnradiofg']:checked").val();
        const srg = $("input:radio[name ='btnradiorg']:checked").val();
        const ssg = $("input:radio[name ='btnradiosg']:checked").val();
        const cad = ebike.cadenceSensor.reading;
        const tor = ebike.torqueSensor.reading;
        const rpm = ebike.rpm;
        const curr = ebike.motor.current;


        // $(right).append("<div>" +
        //     "{time: " + m + ":" + s + ":" + mis + "ss: 0, sfg: 0, srg: 0, ssg: 0, cad: " + cad + ", tor: " + tor + ", rpm: " + rpm + ", curr: " + curr + "}</div>")
        $(right).append("<div>" +
            m + ":" + s + "," + ss + " ," +
            // sfg + " ," + srg + ", " + ssg + "," +
            cad + "," + tor + "," + rpm + "," + curr + "</div>")

        return now;
    };
    obj.resume();
    return obj;
}