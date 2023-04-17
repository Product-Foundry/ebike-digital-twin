/* Special segments of a path with speed / time / goods restrictions  */
define('js/town/AscClient', [], function () {

    function AscClient() {
        this.location = null;
        this.enclosingZone = null;
        this.toRestore = null;
        this.classifications = [
            "NARROW_PATHWAY_ZONE", "ROUNDABOUT_ZONE", "PRIORITY_JUNCTION_ZONE",
            "MOBILITY_HUB_ZONE", "CONSTRUCTION_ZONE",
            "PARK_PATHWAY_ZONE", "SCHOOL_ZONE", "SHARED_ROADWAY_ZONE"
        ];
        this.protocols = ["SPEED_LIMIT"];
        this.assetTypes = [
            "BUS", "ELECTRIC_STEP", "E_BIKE", "CAR", "SPEED_PEDELEC",
            "ELECTRIC_CAR", "TRUCK", "MOTORCYCLE", "BIKE"
        ]
    }

    AscClient.prototype.checkRestrictions = function (ebike, callback) {
        const payload = {
            "latitude": ebike.asc.location.latitude,
            "longitude": ebike.asc.location.longitude,
            "assetType": "E_BIKE",
            "speedMps": 3,
            "assetId": "ebike1",
            "name": "my bike",
            "gpsEnabled": true,
            "correlationId": "e59ef62e-91ad-4822-a7b4-9045128eb10c"
        }

        let xhttp = new XMLHttpRequest();
        xhttp.open("POST", "https://api.wayflow.eu/v1/ARUNA/location/ebike1/restrictions", true);
        xhttp.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
        xhttp.onreadystatechange = (obj) => {
            if (obj.currentTarget.readyState == 4 && obj.currentTarget.status == 200) {
                const res = JSON.parse(xhttp.responseText);
                // {
                //     "epochTimestamp": 1681294034920,
                //     "assetType": "E_BIKE",
                //     "latitude": 52.37425,
                //     "longitude": 4.8867089,
                //     "speedMps": 3,
                //     "estimatedSpeedMps": -1,
                //     "name": "my bike",
                //     "assetId": "ebike1",
                //     "zoneName": "test1",
                //     "ascStatus": "ASC_NON_COMPLNT",
                //     "protocol": "SPEED_LIMIT",
                //     "classification": "SCHOOL_ZONE",
                //     "speedLimitKph": 10,
                //     "correlationId": "e59ef62e-91ad-4822-a7b4-9045128eb10c"
                // }
                if (res.ascStatus !== "ASC_DEFAULT") {
                    
                    this.enclosingZone = res.classification;
                    if (res.ascStatus === "ASC_COMPLNT") {
                        if(this.enclosingZone === null) {
                            console.log(res.ascStatus);
                        }
                        // inside zone, but compliant
                    } else if (res.ascStatus === "ASC_NON_COMPLNT") {
                        // nudge
                        if(this.enclosingZone === null) {
                            console.log(res.ascStatus);
                        }
                        const toRestoreSet = this.toRestore !== null? true: false;
                        if (toRestoreSet === false) {
                            this.toRestore = ebike.motor.current;
                        }
                        ebike.motor.current = 0;
                        ebike.flagNc(res);
                    } else if (res.ascStatus === "ASC_APPRCH") {
                        ebike.notifyApproach(res);
                    }
                } else {
                    if(this.enclosingZone !== null) {
                        console.log(res.ascStatus);
                    }
                    if (this.toRestore !== null && this.toRestore !== ebike.motor.current) {
                        ebike.motor.current = this.toRestore;
                    }
                    this.enclosingZone = null;
                }
                callback();
            }
        };
        xhttp.send(JSON.stringify(payload));

    }

    return AscClient;

})