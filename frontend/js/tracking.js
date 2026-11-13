
/* SR University SmartBus - Simulated Route Tracking */

// ========================================
// 1. BUS DETAILS AND SIMULATED STOPS
// ========================================

const collegeLocation = [17.9840, 79.5300];

const busLocations = {
    "12": {
        name: "Bus 12",
        driver: "Ramesh Kumar",
        destination: "Rangasaipet",
        stops: [
            { name: "Kakatiya Medical College", location: [18.0022, 79.5899] },
            { name: "Nirmala Mall", location: [17.9950, 79.5860] },
            { name: "Ekashila Nagar", location: [17.9646, 79.5990] },
            { name: "Rangasaipet", location: [17.9927, 79.6008] }
        ]
    },

    "15": {
        name: "Bus 15",
        driver: "Suresh Reddy",
        destination: "Warangal",
        stops: [
            { name: "Pochamma Maidan", location: [17.9882, 79.6008] },
            { name: "Kashibugga", location: [17.9860, 79.5940] },
            { name: "Labour Colony", location: [17.9740, 79.5850] },
            { name: "Warangal", location: [17.9950, 79.6000] }
        ]
    },

    "18": {
        name: "Bus 18",
        driver: "Mahesh Rao",
        destination: "Karimnagar",
        stops: [
            { name: "Peacock Pride Restaurant", location: [18.4250, 79.1350] },
            { name: "Sri Geetha Bhavan", location: [18.4320, 79.1300] },
            { name: "SRR Government Arts and Science College", location: [18.4380, 79.1280] },
            { name: "Karimnagar", location: [18.4386, 79.1287] }
        ]
    },

    "20": {
        name: "Bus 20",
        driver: "Raju",
        destination: "Hanamkonda",
        stops: [
            { name: "Hasanparthy", location: [18.0704, 79.5223] },
            { name: "Q-Cross, Peddammagadda", location: [18.0050, 79.5580] },
            { name: "Hanamkonda", location: [18.0020, 79.5585] }
        ]
    },

    "25": {
        name: "Bus 25",
        driver: "Chiru",
        destination: "Kazipet",
        stops: [
            { name: "Bhavani Theatre", location: [17.9810, 79.5130] },
            { name: "Kazipet Town", location: [17.9807, 79.5132] },
            { name: "Kazipet F Cabin", location: [17.9740, 79.5060] },
            { name: "Kazipet", location: [17.9820, 79.4750] }
        ]
    }
};

// ========================================
// 2. MAP SETUP
// ========================================

const mapElement = document.getElementById("map");

if (mapElement && typeof L !== "undefined") {

    const map = L.map("map").setView(collegeLocation, 12);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    // ========================================
    // 3. MAP ICONS AND ROUTE COLORS
    // ========================================

    const collegeIcon = L.divIcon({
        html: '<div style="font-size:32px;">🏫</div>',
        className: "emoji-map-icon",
        iconSize: [40, 40],
        iconAnchor: [20, 35]
    });

    const busIcon = L.divIcon({
        html: '<div style="font-size:30px;">🚌</div>',
        className: "emoji-map-icon",
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    const stopIcon = L.divIcon({
        html: '<div style="font-size:25px;">📍</div>',
        className: "emoji-map-icon",
        iconSize: [35, 35],
        iconAnchor: [17, 30]
    });

    const routeColors = {
        "12": "blue",
        "15": "green",
        "18": "red",
        "20": "orange",
        "25": "purple"
    };

    L.marker(collegeLocation, { icon: collegeIcon })
        .addTo(map)
        .bindPopup("SR University - Starting Point");

    // ========================================
    // 4. TRACKING VARIABLES
    // ========================================

    const busMarkers = {};
    const routeLayers = {};
    const stopMarkers = {};
    const busRoutes = {};
    const busProgress = {};

    const AVERAGE_SPEED_KMH = 30;
    const UPDATE_INTERVAL = 3000;

    let selectedBusId = null;

    // ========================================
    // 5. DISTANCE CALCULATION
    // ========================================

    function calculateDistance(point1, point2) {

        const earthRadius = 6371;

        const lat1 = point1[0] * Math.PI / 180;
        const lat2 = point2[0] * Math.PI / 180;

        const differenceLat =
            (point2[0] - point1[0]) * Math.PI / 180;

        const differenceLng =
            (point2[1] - point1[1]) * Math.PI / 180;

        const a =
            Math.sin(differenceLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(differenceLng / 2) ** 2;

        return earthRadius * 2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );
    }

    // ========================================
    // 6. CREATE A SMOOTH SIMULATED ROUTE
    // ========================================

    function createSimulatedRoute(waypoints) {

        const route = [];

        for (let i = 0; i < waypoints.length - 1; i++) {

            const start = waypoints[i];
            const end = waypoints[i + 1];

            const steps = 30;

            for (let j = 0; j < steps; j++) {

                const fraction = j / steps;

                route.push([
                    start[0] + (end[0] - start[0]) * fraction,
                    start[1] + (end[1] - start[1]) * fraction
                ]);
            }
        }

        route.push(waypoints[waypoints.length - 1]);

        return route;
    }

    // ========================================
    // 7. GET BUS POSITION
    // ========================================

    function getPositionOnRoute(route, progress) {

        const index = Math.min(
            Math.floor(progress),
            route.length - 2
        );

        const fraction = progress - index;

        const point1 = route[index];
        const point2 = route[index + 1];

        return [
            point1[0] + (point2[0] - point1[0]) * fraction,
            point1[1] + (point2[1] - point1[1]) * fraction
        ];
    }

    // ========================================
    // 8. CALCULATE REMAINING DISTANCE
    // ========================================

    function getRemainingDistance(route, progress) {

        if (!route || route.length < 2) {
            return 0;
        }

        if (progress >= route.length - 1) {
            return 0;
        }

        const index = Math.floor(progress);

        const currentPosition =
            getPositionOnRoute(route, progress);

        let distance = calculateDistance(
            currentPosition,
            route[index + 1]
        );

        for (let i = index + 1; i < route.length - 1; i++) {

            distance += calculateDistance(
                route[i],
                route[i + 1]
            );
        }

        return distance;
    }

    // ========================================
    // 9. CREATE BUS MARKERS
    // ========================================

    Object.keys(busLocations).forEach(function(busId) {

        const bus = busLocations[busId];

        busMarkers[busId] = L.marker(
            collegeLocation,
            { icon: busIcon }
        )
            .addTo(map)
            .bindPopup(bus.name + " - " + bus.destination);

        stopMarkers[busId] = [];
    });

    // ========================================
    // 10. DRAW SIMULATED ROUTES
    // ========================================

    function drawSimulatedRoute(busId) {

        const bus = busLocations[busId];

        const waypoints = [
            collegeLocation,
            ...bus.stops.map(stop => stop.location)
        ];

        const route = createSimulatedRoute(waypoints);

        busRoutes[busId] = route;
        busProgress[busId] = 0;

        routeLayers[busId] = L.polyline(route, {
            color: routeColors[busId],
            weight: 5,
            opacity: 0.85,
            dashArray: "10, 8"
        }).addTo(map);

        // Add stop markers
        bus.stops.forEach(function(stop, index) {

            const marker = L.marker(
                stop.location,
                { icon: stopIcon }
            )
                .addTo(map)
                .bindPopup(
                    "<b>" + bus.name + "</b><br>" +
                    "Stop " + (index + 1) + ": " + stop.name
                );

            marker.bindTooltip(stop.name, {
                direction: "top"
            });

            stopMarkers[busId].push(marker);
        });

        console.log(
            "Simulated route created for Bus " + busId
        );
    }

    // ========================================
    // 11. UPDATE BUS INFORMATION
    // ========================================

    function updateBusInformation(busId) {

        const bus = busLocations[busId];
        const route = busRoutes[busId];

        if (!bus || !route) {
            return;
        }

        const progress = busProgress[busId];

        const remainingDistance =
            getRemainingDistance(route, progress);

        const arrivalMinutes =
            (remainingDistance / AVERAGE_SPEED_KMH) * 60;

        document.getElementById("distance").textContent =
            remainingDistance.toFixed(2) + " km";

        document.getElementById("arrivalTime").textContent =
            remainingDistance <= 0.01
                ? "Arrived"
                : Math.ceil(arrivalMinutes) + " minutes";

        document.getElementById("nextStop").textContent =
            bus.destination;

        document.getElementById("busStatus").textContent =
            remainingDistance <= 0.01
                ? "Reached Destination"
                : "Active";
    }

    // ========================================
    // 12. SELECT BUS
    // ========================================

    window.showSelectedBusOnMap = function(busId) {

        selectedBusId = String(busId);

        const bus = busLocations[selectedBusId];

        if (!bus || !busMarkers[selectedBusId]) {
            console.log("Bus not found:", selectedBusId);
            return;
        }

        busMarkers[selectedBusId]
            .bindPopup(bus.name + " - " + bus.destination)
            .openPopup();

        if (routeLayers[selectedBusId]) {

            map.fitBounds(
                routeLayers[selectedBusId].getBounds(),
                { padding: [30, 30] }
            );
        }

        updateBusInformation(selectedBusId);
    };

    // ========================================
    // 13. LOAD ALL SIMULATED ROUTES
    // ========================================

    Object.keys(busLocations).forEach(function(busId) {
        drawSimulatedRoute(busId);
    });

    console.log("All simulated bus routes are ready.");

    // ========================================
    // 14. SIMULATE BUS MOVEMENT
    // ========================================

    setInterval(function() {

        Object.keys(busRoutes).forEach(function(busId) {

            const route = busRoutes[busId];

            if (!route || route.length < 2) {
                return;
            }

            const currentProgress = busProgress[busId];

            const remainingDistance =
                getRemainingDistance(route, currentProgress);

            const travelDistance =
                (AVERAGE_SPEED_KMH / 3600) *
                (UPDATE_INTERVAL / 1000);

            if (remainingDistance > travelDistance) {

                let distanceToMove = travelDistance;
                let newProgress = currentProgress;

                while (
                    distanceToMove > 0 &&
                    newProgress < route.length - 1
                ) {

                    const index = Math.floor(newProgress);

                    const point = getPositionOnRoute(
                        route,
                        newProgress
                    );

                    const nextPoint = route[index + 1];

                    const segmentDistance =
                        calculateDistance(point, nextPoint);

                    if (segmentDistance <= 0) {
                        newProgress = index + 1;
                        continue;
                    }

                    if (segmentDistance <= distanceToMove) {

                        distanceToMove -= segmentDistance;
                        newProgress = index + 1;

                    } else {

                        newProgress +=
                            distanceToMove / segmentDistance;

                        distanceToMove = 0;
                    }
                }

                busProgress[busId] = Math.min(
                    newProgress,
                    route.length - 1
                );

            } else {

                busProgress[busId] = route.length - 1;
            }

            const newLocation = getPositionOnRoute(
                route,
                busProgress[busId]
            );

            busMarkers[busId].setLatLng(newLocation);

            if (selectedBusId === busId) {

                updateBusInformation(busId);
                map.panTo(newLocation);
            }
        });

    }, UPDATE_INTERVAL);

    // ========================================
    // 15. FIX MAP SIZE
    // ========================================

    setTimeout(function() {
        map.invalidateSize();
    }, 500);
}
