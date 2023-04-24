define('main', ['js/runner/DataFileReader',
  'js/mechanics/MachinePropagation',
  'js/spec/SpecRealizer',
  'js/tools/Draggable',
  'js/tools/Gsap',
  'js/spec/BicycleSpecification',
  'js/runner/EventStack',
  'js/tools/chart',
],
  function (DataFileReader, MachinePropagation, SpecRealizer, Draggable, gsap, BicycleSpecification, EventStack, Chart) {
    gsap.gsap.registerPlugin(Draggable);
    const bs = new BicycleSpecification();
    const eventStack = new EventStack();
    let timer, ebike;
    // function range(size, startAt = 0, interval = 1) {
    //   return [...Array(size).keys()].map(i => (i + startAt) * interval);
    // }
    const chart = new Chart(document.getElementById('chart-container-1'), {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Ebike via ASC zone',
          data: eventStack.history.map(eState => {
            return {
              x: eState.asc.timestamp,
              y: eState.motor.current,
              loc: eState.asc.location
            }
          }),
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        ]
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: (item) => {
                return `${item.raw.y} A at  ${item.raw.x} (${item.raw.loc.latitude}, ${item.raw.loc.longitude})`
              }
            },
          },
        },
        animation: {
          y: {
            duration: 0,
            from: 0
          }
        },
        onClick: (e) => {
        }
      }
    });

    function printState() {
      $(".selected-model")[0].innerHTML = JSON.stringify(ebike, null, 2);
    }
    function getValues(dvalues, u) {
      let values = [], unit = u ? u : 1;
      if (dvalues.indexOf("[") > -1) {
        const start = parseInt(dvalues.substring(1, dvalues.indexOf("-")));
        const end = parseInt(dvalues.substring(dvalues.indexOf("-") + 1, dvalues.length));
        for (let i = start; i <= end; i += unit) {
          values.push(i);
        }
      } else {
        values = inputslider.dataset.values.split(',')
      }
      return values;
    }

    $(".loading-indicator").attr("style", "display: none !important")

    document.querySelectorAll('.inputslider').forEach(
      (inputslider) => {
        let unit = 1;
        if (inputslider.dataset.unit) {
          unit = parseInt(inputslider.dataset.unit);
        }
        let values = getValues(inputslider.dataset.values, unit);

        let value = parseFloat(inputslider.dataset.value),
          min = parseFloat(values.first()),
          max = parseFloat(values.last()),
          input = inputslider.querySelector('input'),
          area = inputslider.querySelector('.area'),
          knob = inputslider.querySelector('.knob'),
          fill = inputslider.querySelector('.fill');


        values.forEach(
          (value, i) => {
            values[i] = value = parseFloat(value);

            let span = document.createElement('span');
            span.innerText = value;
            span.setAttribute('data-value', value);

            if (i == 0) {
              span.addClass('selected');
              input.value = value;
            }

            span.style.left = gsap.gsap.utils.mapRange(min, max, 0, 100, value) + '%';

            inputslider.querySelector('.values').appendChild(span);
          }
        );
        Draggable.default.create(knob, {
          type: 'x',
          edgeResistance: 1,
          bounds: area,
          throwProps: false,
          // onDrag: function () {
          //   handleInputslider(this, false, unit);
          // },
          onDragEnd: function () {
            handleInputslider(this, false, unit);
          }
        }
        );
      }
    );

    function handleInputslider(instance, snap, unit) {

      let inputslider = instance.target.closest('.inputslider'),
        fill = inputslider.querySelector('.fill'),
        values = getValues(inputslider.dataset.values, unit),
        min = parseFloat(values.first()),
        max = parseFloat(values.last()),
        xPercent = gsap.gsap.utils.mapRange(0, instance.maxX, 0, 100, instance.x),
        relativeValue = gsap.gsap.utils.mapRange(0, instance.maxX, min, max, instance.x),
        finalValue = gsap.gsap.utils.snap(values, relativeValue),
        snapX = gsap.gsap.utils.mapRange(min, max, 0, instance.maxX, finalValue),
        fillWidth = gsap.gsap.utils.mapRange(0, instance.maxX, 0, 100, snapX);

      if (snap) {
        gsap.gsap.to(instance.target, { duration: .2, x: snapX });
        gsap.gsap.to(fill, { duration: .2, width: fillWidth + '%' });
      } else {
        values.forEach(
          (value, i) => {
            values[i] = parseFloat(value);
          }
        );
      }
      fill.style.width = xPercent + '%';
      inputslider.querySelectorAll('.values span').forEach(
        (span) => {
          if (parseFloat(span.dataset.value) == finalValue) {
            span.addClass('selected');
          } else {
            span.removeClass('selected');
          }
        }
      );

      inputslider.querySelector('input').value = finalValue;
      if (inputslider.id === "torqueSensor") ebike.setTorqueReading(finalValue);
      else if (inputslider.id === "cadenceSensor") ebike.setCadenceReading(finalValue);
      else if (inputslider.id === "currentSensor") ebike.setMotorCurrent(finalValue);
      else if (inputslider.id === "rpmSensor") ebike.setRpm(finalValue);
      printState();
    }
    $("#start").on("click", function (e) {
      e.stopPropagation();
      e.preventDefault();
      const start = $(e.currentTarget);
      if (start.hasClass("started")) {
        start.removeClass("started");
        start.addClass("btn-primary");
        start.removeClass("btn-secondary");
        start[0].innerHTML = "Start";
        $("#pause").attr("disabled", true);
        timer.stop();
      } else {
        start.addClass("started");
        start.removeClass("btn-primary");
        start.addClass("btn-secondary");
        start[0].innerHTML = "Stop";

        timer = startTimer(0, "timer", ebike);
        $("#pause").removeAttr("disabled");
        $("#pause").off("click");
        $("#pause").on("click", function (event) {
          event.stopPropagation();
          event.preventDefault();
          const el = $(event.currentTarget);
          const paused = el.hasClass("paused")
          if (!paused) {
            timer.pause();
            el.addClass("paused");
            el.removeClass("btn-primary");
            el.addClass("btn-danger");
            el[0].innerHTML = "Resume";
          } else {
            timer.resume();
            el.removeClass("paused");
            el.addClass("btn-primary");
            el.removeClass("btn-danger");
            el[0].innerHTML = "Pause";

          }
        })
      }
    })

    const ebikeSelector = $("#ebike-model-selector");
    ebikeSelector.append("<option value=''></option>");
    const models = bs.getAllSpecs();
    models.forEach(m => ebikeSelector.append("<option value='" + JSON.stringify(m) + "'>" + m.name + "</option>"));
    ebikeSelector.on("change", function (e) {
      $(".loading-indicator").show();
      const optionSelected = JSON.parse($(this).val());
      const specRealizer = new SpecRealizer(optionSelected.id);
      ebike = specRealizer.getEbikeEntity();
      ebike.init();
      printState();
      // Hide all
      $(".secondary-gear").addClass("d-none");
      $(".derailleur").addClass("d-none");
      $(".secondary-gear").addClass("d-none");
      if (ebike.rearShiftingSystem) {
        if (ebike.rearShiftingSystem.type === "derailleur") {
          $(".rear-derailleur").removeClass("d-none");
          $("div.rear-derailleur").empty();
          const cassette = ebike.rearShiftingSystem.cassette.split(",");
          cassette.forEach(function (t, i) {
            $("div.rear-derailleur").append(
              '<input type="radio" class="btn-check rear-gear-input" name="btnradiorg" id="btnradiorg' + i + '" ' +
              'autocomplete="off" value="' + t + '"> ' +
              '<label class="btn btn-outline-primary" for="btnradiorg' + i + '">' + (i + 1) + " " + t + '</label> ');

          })
          $(".rear-gear-input").on("change", function () {
            ebike.setSelectedGear("rear", parseFloat(this.value));
            printState();

          })

          $(".front-derailleur").addClass("d-none");
          $(".secondary-gear").addClass("d-none");
        } else {
          // Hub
          $(".secondary-gear").removeClass("d-none");
          $(".rear.derailleur").addClass("d-none");
          if (ebike.rearShiftingSystem.type === "hub") {
            const availableSG = ebike.rearShiftingSystem.availableGearRatios.split(",");
            $("div.secondary-gear").empty();
            availableSG.forEach((sg, i) => {
              $("div.secondary-gear").append(
                '<input type="radio" class="btn-check secondary-gear-input" name="btnradiosg" id="btnradiosg' + (i + 1) + '"' +
                'autocomplete="off" value="' + sg + '" >' +
                '<label class="btn btn-outline-primary" for="btnradiosg' + (i + 1) + '">' + (i + 1) + " " + sg + '</label>'
              )
            })
            $(".secondary-gear-input").on("change", function () {
              ebike.setSelectedGear("rear", parseFloat(this.value));
              printState();
            })
          }
        }
      }
      if (ebike.frontShiftingSystem) {
        if (ebike.frontShiftingSystem.type === "derailleur") {
          $(".front-derailleur").removeClass("d-none");
          $(".secondary-gear").addClass("d-none");
          const cassette = ebike.frontShiftingSystem.cassette.split(",");
          $("div.front-derailleur").empty();
          cassette.forEach(function (t, i) {
            $("div.front-derailleur").append(
              '<input type="radio" class="btn-check front-gear-input" name="btnradiofg" id="btnradiofg' + (i + 1) + '" ' +
              'autocomplete="off" value="' + t + '"> ' +
              '<label class="btn btn-outline-primary" for="btnradiofg' + (i + 1) + '">' + (i + 1) + " " + t + '</label> ');
          })
          $(".front-gear-input").on("change", function () {
            ebike.setSelectedGear("front", parseFloat(this.value));
            printState();
          })
        } else {
          // Hub in the front
          $(".secondary-gear").removeClass("d-none");
          $(".front-derailleur").addClass("d-none");
          const availableSG = ebike.frontShiftingSystem.availableGearRatios.split(",");
          $("div.secondary-gear").empty();
          availableSG.forEach((sg, i) => {
            $("div.secondary-gear").append(
              '<input type="radio" class="btn-check secondary-gear-input" name="btnradiosg" id="btnradiosg' + (i + 1) + '"' +
              'autocomplete="off" value="' + sg + '" >' +
              '<label class="btn btn-outline-primary" for="btnradiosg' + (i + 1) + '">' + (i + 1) + " " + sg + '</label>'
            )
          })
          $(".secondary-gear-input").on("change", function () {
            ebike.setSelectedGear("front", parseFloat(this.value));
            printState();
          })
        }
      }
      const availableSS = ebike.availableSupportSettings.split(",");
      $(".support-setting").empty();
      availableSS.forEach(ss => {
        $(".support-setting").append(
          '<input type="radio" class="btn-check support-setting-input" name="btnradioss" id="btnradioss' + ss + '"' +
          'autocomplete = "off" value = "' + ss + '" >' +
          '<label class="btn btn-outline-primary" for="btnradioss' + ss + '">' + ss + '</label>'
        )
      })
      $(".support-setting-input").on("change", function () {
        ebike.supportSetting = parseInt(this.value);
        printState();

      })
      $(".asc-input").on("change", function () {
      })
      $(".loading-indicator").attr("style", "display: none !important");

    })

    const fileInput = $(".files")
    const reportTable = $("#assets tbody");
    let mpArray = new Array();

    $(fileInput).on('change', (e) => {
      const { files } = e.target;
      const f = new DataFileReader(files[0]);
      const check = function () {
        const events = f.getEvents();
        // if (events) {
        //   events.forEach((event, i) => {
        //     mpArray[i] = new MachinePropagation(event.bikeSpecification, event.timestamp, event.numRotation);
        //   });
        //   mpArray.forEach(a => {
        //     const tr = $("<tr></tr>")
        //     $(tr).append("<td>" + a.bike.etrtoSpecification.etrtoValue + "</td>")
        //       .append("<td>" + new Date(a.timestamp * 1000).toTimeString().split(" ")[0] + "</td>")
        //       .append("<td>" + a.wheelRotations + " pm </td>")
        //       .append("<td>" + a.speed + " kmph </td>")
        //     $(reportTable).append(tr)
        //   })
        //   return;
        // }
        if (events) {
          const readAsEvents = setInterval(function () {
            if (events.length === 0) {
              clearInterval(readAsEvents);
              console.log("Chart complete");
            } else {
              function callback() {
                chart.data.labels.push(ebike.asc.timestamp);
                chart.data.datasets.forEach((dataset) => {
                  dataset.data.push({
                    x: ebike.asc.timestamp,
                    y: ebike.motor.current,
                    loc: ebike.asc.location
                  });
                });
                chart.update();
              }
              ebike.setLocation(events.shift(), callback);
              eventStack.push(ebike);
            }
          }, 100)
        }
        setTimeout(check, 1000);
      }

      check();


    });


  });