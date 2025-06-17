from pathlib import Path

from flask import Flask, jsonify, render_template, request
from models import get_closest_departures, get_trip_details

template_folder = Path(__file__).parent.parent / "frontend"
static_folder = template_folder / "static"

app = Flask(
    __name__,
    static_folder=static_folder.resolve(),
    template_folder=template_folder.resolve(),
)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/public_transport/city/<city>/trip/<trip_id>")
def trip_details(city, trip_id):
    trip, stops = get_trip_details(trip_id)
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    return jsonify(
        {
            "metadata": {
                "self": request.path,
                "city": city,
                "query_parameters": {"trip_id": trip_id},
            },
            "trip_details": {
                "trip_id": trip["trip_id"],
                "route_id": trip["route_id"],
                "trip_headsign": trip["trip_headsign"],
                "stops": [
                    {
                        "name": stop["stop_name"],
                        "coordinates": {
                            "latitude": stop["stop_lat"],
                            "longitude": stop["stop_lon"],
                        },
                        "arrival_time": f"2025-04-02T{stop['arrival_time']}Z",
                        "departure_time": f"2025-04-02T{stop['departure_time']}Z",
                    }
                    for stop in stops
                ],
            },
        }
    )


@app.route("/public_transport/city/<city>/closest_departures")
def closest_departures(city):
    try:
        start_coords = request.args.get("start_coordinates")
        end_coords = request.args.get("end_coordinates")
        start_time = request.args.get("start_time")
        limit = int(request.args.get("limit", 3))

        start_lat, start_lon = map(float, start_coords.split(","))
        end_lat, end_lon = map(float, end_coords.split(","))

        departures = get_closest_departures(
            start_lat, start_lon, end_lat, end_lon, start_time, limit
        )

        return jsonify(
            {
                "metadata": {
                    "self": request.full_path,
                    "city": city,
                    "query_parameters": {
                        "start_coordinates": start_coords,
                        "end_coordinates": end_coords,
                        "start_time": start_time,
                        "limit": limit,
                    },
                },
                "departures": departures,
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True, port=5002)
