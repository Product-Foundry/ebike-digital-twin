/* Reads csv data
 */
define('js/runner/DataFileReader', [], function () {

  function DataFileReader(f) {
    if (f.type) {
      let reader = new FileReader();
      reader.onload = () => {
        if (f.type === "application/json") {
          this.jsonToEvents(reader.result);
        } else {
          this.textToEvents(reader.result);
        }
      };
      reader.readAsText(f);

      reader.onerror = () => {
        console.log(reader.error);
      };
    } else {
      const rawFile = new XMLHttpRequest();
      rawFile.open("GET", f, false);
      rawFile.onreadystatechange = () => {
        if (rawFile.readyState === 4) {
          if (rawFile.status === 200 || rawFile.status == 0) {
            this.textToEvents(rawFile.responseText);
          }
        }
      }
      rawFile.send(null);
    }
  }

  DataFileReader.prototype.textToEvents = function (text) {
    this.events = text.split("\r\n").filter(l => l.length).map(l => {
      const e = l.split(",");
      return {
        bikeSpecification: e[0],
        timestamp: e[1],
        numRotation: e[2],
      }
    }).flat();
  }

  DataFileReader.prototype.jsonToEvents = function (text) {
    const content = JSON.parse(text);
    this.events = content.points.map(c => {
      return {
        latitude: c.lat,
        longitude: c.lng
      }
    })
  }

  DataFileReader.prototype.getEvents = function () {
    return this.events;
  };

  return DataFileReader;
});