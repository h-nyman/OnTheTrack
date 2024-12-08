const stationForm = document.getElementById("stationsearch"); // Grab form DOM element for searching station
const stationURL = "https://rata.digitraffic.fi/api/v1/metadata/stations"; // API endpoint for retrieving station metadata, including station names and shortcodes

stationForm.addEventListener("submit", (e) => { // event triggered when user submits form
    e.preventDefault() // prevent default form submission
    fetch(stationURL) // fetch station metadata from the API
        .then((response) => { //handle response
            if (!response.ok) { // check if response is ok
                alert("Network response error"); // handle failed network request with an error
            }
            return response.json(); // parse and return the response as JSON
        })
        .then((stations) => { // handle parsed stations
            for (let station of stations) { // iterate over stations
                if (station.stationName.toLowerCase().includes(stationForm.station.value.toLowerCase())) { // find first station that matches input
                    stationInformation(station.stationShortCode, stations); // call stationInformation() with the matched station's shortcode
                    document.getElementById("stationOutput").innerHTML = `<p>STATION: ${station.stationName.toUpperCase()}</p>`; // prints name of given station
                    return station;  // exit the loop after finding the station
                }
            }
            alert("No station found"); // error message if no station matches the input
        })
        .catch((error) => { // handle error
            console.error("error", error); // log any errors to the console
        });
});

function stationInformation(stationShortCode, stations) {
    fetch("https://rata.digitraffic.fi/api/v1/live-trains/station/" + stationShortCode + "?arrived_trains=0&arriving_trains=0&departed_trains=2&departing_trains=5&include_nonstopping=false&train_categories=Commuter,Long-distance")
        // fetch station metadata from the API by using station shortcode, only commuter and long-distance trains that stop at the station
        .then((response) => { // handle response
            if (!response.ok) { // check if response is ok
                alert("Network response error"); // handle failed network request with an error
            }
            return response.json(); // parse and return the response as JSON
        })
        .then((liveTrains) => { // handle parsed station information

            let outPut = "<table><tr><th>Scheduled Time</th><th>End Station</th><th>Track</th><th>Train number</th><th>Type of train</th></tr>";
            // initialize the table structure with headers for scheduled time, end station, track, train number, and train type.

            const rows = liveTrains.map(trainDeparture => toRow(trainDeparture, stationShortCode, stations)) // transform live train data into table rows using the toRow function, filtering relevant information.
            rows.sort((rowa, rowb) => rowa.time.localeCompare(rowb.time)) //sorts rows according to departure time in ascending order

            rows.forEach(row => { // iterate over rows to populate table rows
                outPut += '<tr>'; // begin a new table row
                outPut += '<td>' + row.time + '</td>'; // add the scheduled tim to the row
                outPut += '<td>' + row.destination + '</td>'; // add the end station to the row
                outPut += '<td>' + row.track + '</td>'; // add what track the train leaves from to the row
                outPut += '<td>' + row.trainNumber + '</td>'; // add train number to the row
                outPut += '<td>' + row.trainType + '</td>'; // add type of train to the row
                outPut += '</tr>'; // end the table row
            })
            // append all rows to the table structure and include information retrieved from the API.

            outPut += '</table>'; // closes table
            document.getElementById("output").innerHTML = outPut; // prints table
        })
        .catch((error) => { // handle error
            console.error("error", error); // log any errors to the console
        });
}

function toHelsinkiTime(isoDate) {
    return new Date(isoDate).toLocaleString('sv-FI', { // convert the ISO date string to Helsinki local time and format it as a string
        timeZone: 'Europe/Helsinki', // specify timeZone Europe/Helsinki
        hour: '2-digit', // use two digits when displaying hour
        minute: '2-digit', // use two digits when displaying minute
        hour12: false // use the 24-hour clock format
    });
}

function toRow(trainDeparture, departureStation, stations) {
    const departureTimeTable = trainDeparture.timeTableRows.find(timeTableRow => timeTableRow.stationShortCode === departureStation) // find the timetable for the train station
    const endStation = trainDeparture.timeTableRows[trainDeparture.timeTableRows.length - 1] // find the last station in the train's timetable, which is the end station

    return { // return object containing the following information
        "time": toHelsinkiTime(departureTimeTable.scheduledTime), // add scheduled departure time that has been converted to Helsinki time
        "destination": stations.find(station => station.stationShortCode === endStation.stationShortCode).stationName, // add end station for train
        "track": departureTimeTable.commercialTrack, // add track where train departs from at the station
        "trainNumber": trainDeparture.trainNumber, // add train number
        "trainType": trainDeparture.trainType, // add type of train
    };
}
