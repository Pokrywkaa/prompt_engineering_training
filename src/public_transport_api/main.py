# from flask import Flask
# from flask_cors import CORS


# from controllers.departures_controller import departures_bp
# from controllers.trips_controller import trips_bp


# app = Flask(__name__)

# CORS(app)


# app.register_blueprint(departures_bp)
# app.register_blueprint(trips_bp)


# @app.route("/")
# def index():
#     return "Welcome to the Public Transport API for Wrocław!"

"""
Example Flask application demonstrating the required endpoints:

GET /public_transport/city/{city}/closest_departures

GET /public_transport/city/{city}/trip/{trip_id}

Important Notes/Assumptions:

This code uses a naive approach for: (a) Location-based filtering of stops within a search radius. (b) Determining if a trip is "heading toward" the specified destination. (c) Time handling (we assume date/time conversions as needed).

The "database_path" should be replaced with the path to your SQLite database file.

The schema references the columns shown in the question for 'stops', 'stop_times', and 'trips'.

In a larger production project, you would split this code into multiple files/modules, add robust error handling, logging, caching, etc. """

import logging
import math
import sqlite3
from flask import Flask, request, jsonify, abort
from pathlib import Path

app = Flask("app")
logger = logging.getLogger("backend")
logger.setLevel(logging.DEBUG)



DATABASE_PATH = Path(__file__) / ".." / ".." / ".." / 'trips.sqlite'
# DATABASE_PATH = 'trips.sqlite'

VALID_CITY = "Wroclaw"

def get_db_connection():
    """
    Returns a new SQLite connection to the data store.
    The caller is responsible for closing it.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row # enables dict-like cursor
    return conn


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Returns approximate distance in kilometers between two lat/lon points
    using a simplified Haversine formula approach.
    Because the problem states "No need to specify distance formula,"
    any approach is acceptable. This is just a commonly used one.
    """
    R = 6371.0 # Earth radius in kilometers
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat/2) ** 2
    + math.cos(math.radians(lat1))
    * math.cos(math.radians(lat2))
    * math.sin(d_lon/2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c


def fetch_stops_in_radius(conn, start_lat, start_lon, radius_km=1.0):
    """
    Returns a list of stop records (stop_id, stop_name, stop_lat, stop_lon)
    that lie within 'radius_km' of the (start_lat, start_lon).
    """
    # 1) Get all stops
    stops_query = """
    SELECT stop_id, stop_name, stop_lat, stop_lon
    FROM stops
    """
    cursor = conn.execute(stops_query)
    stop_rows = cursor.fetchall()

    # 2) Filter by distance
    nearby_stops = []
    for row in stop_rows:
        try:
            s_lat = float(row["stop_lat"])
            s_lon = float(row["stop_lon"])
        except (ValueError, TypeError):
            # In case any coordinate data is invalid, skip
            continue
        dist = haversine_distance(start_lat, start_lon, s_lat, s_lon)
        if dist <= radius_km:
            # Include the row plus the distance
            nearby_stops.append({
                "stop_id": row["stop_id"],
                "stop_name": row["stop_name"],
                "stop_lat": s_lat,
                "stop_lon": s_lon,
                "distance": dist
            })

    # Sort by distance ascending
    nearby_stops.sort(key=lambda x: x["distance"])
    return nearby_stops


def is_trip_heading_toward(conn, trip_id, start_coords, end_coords):
    """
    A very naive approach to check if a trip is (approximately) going
    "towards" the destination. We’ll compare the distance of the route’s
    final stop to the end_coords vs. the start_coords.

    For a simpler approach, we:
    1) Get the last stop (by stop_sequence maximum) for this trip
    2) Compare that last stop's distance to `end_coords` vs. `start_coords`
    3) If it's closer to `end_coords` than `start_coords`, we consider
        it "heading toward" the destination
    """
    stop_times_query = """
        SELECT stops.stop_id, stops.stop_name, stops.stop_lat, stops.stop_lon, stop_times.stop_sequence
        FROM stop_times
        JOIN stops ON stop_times.stop_id = stops.stop_id
        WHERE stop_times.trip_id = ?
        ORDER BY CAST(stop_times.stop_sequence AS INTEGER) DESC
        LIMIT 1
    """
    cursor = conn.execute(stop_times_query, (trip_id,))
    last_stop = cursor.fetchone()
    if not last_stop:
        # If we can't fetch any stop, consider it not heading that way
        return False

    # Compare distances
    try:
        last_stop_lat = float(last_stop["stop_lat"])
        last_stop_lon = float(last_stop["stop_lon"])
    except (ValueError, TypeError):
        return False

    start_dist = haversine_distance(
        float(start_coords[0]), float(start_coords[1]),
        last_stop_lat, last_stop_lon
    )
    end_dist = haversine_distance(
        float(end_coords[0]), float(end_coords[1]),
        last_stop_lat, last_stop_lon
    )
    return end_dist < start_dist


def fetch_upcoming_departures_for_stop(conn, stop_id, start_time):
    """
    Fetches trip departure info from a single stop on or after the given start_time
    (very naive approach: we ignore date & just compare HH:MM:SS).
    We'll need to parse the user's start_time (ISO) and match times in 'stop_times'.
    """
    # Extract just HH:MM:SS from the incoming ISO 8601 if possible
    # e.g. "2025-04-02T08:30:00Z" -> "08:30:00"
    # Note: we rely on consistent formatting.
    time_part = start_time[ start_time.index("T")+1 : start_time.rfind("Z") ]
    # "08:30:00"
    hour_min_sec = time_part.split(".")[0] # remove any fraction if exist
    hour_min_sec = hour_min_sec.split("+")[0] # remove timezone if exist
    hhmmss = hour_min_sec[0:8] # simplistic approach

    query = """
        SELECT
            st.trip_id,
            st.arrival_time,
            st.departure_time,
            t.route_id,
            t.trip_headsign
        FROM stop_times st
        JOIN trips t ON st.trip_id = t.trip_id
        WHERE st.stop_id = ?
        AND st.departure_time >= ?
        ORDER BY st.departure_time ASC
        LIMIT 20
    """
    cursor = conn.execute(query, (stop_id, hhmmss))
    rows = cursor.fetchall()

    departures = []
    for row in rows:
        departures.append({
            "trip_id": row["trip_id"],
            "route_id": row["route_id"],
            "trip_headsign": row["trip_headsign"],
            "arrival_time": row["arrival_time"],
            "departure_time": row["departure_time"]
        })
    return departures

@app.route("/public_transport/city/<city>/closest_departures", methods=["GET"])
def api_closest_departures(city):
    # 1) Validate city
    if city != VALID_CITY:
        return abort(404, description=f"City '{city}' is not supported.")

    # 2) Parse query parameters
    start_coordinates = request.args.get("start_coordinates")
    end_coordinates   = request.args.get("end_coordinates")
    start_time        = request.args.get("start_time")
    limit             = request.args.get("limit", default="5")

    # Required
    if not start_coordinates or not end_coordinates:
        return abort(400, description="Missing required query params 'start_coordinates' or 'end_coordinates'.")

    # Default start_time if omitted
    if not start_time:
        start_time = "2025-04-02T08:00:00Z"

    try:
        limit = int(limit)
    except ValueError:
        return abort(400, description="Query param 'limit' must be integer.")

    # Parse coords
    try:
        start_lat, start_lon = [float(x.strip()) for x in start_coordinates.split(",")]
        end_lat, end_lon     = [float(x.strip()) for x in end_coordinates.split(",")]
    except (ValueError, IndexError):
        return abort(400, description="Invalid coordinates format. Must be 'lat,lon'.")

    # Extract "HH:MM:SS" from the user’s start_time (naive approach)
    # e.g. "2025-04-02T08:30:00Z" => "08:30:00"
    # In real usage you'd also check for time zones, next-day, etc.
    hhmmss = start_time.split("T")[1].replace("Z","")
    # If there's any fraction or timezone, remove it:
    hhmmss = hhmmss.split(".")[0].split("+")[0]

    # 3) Connect to DB
    conn = get_db_connection()

    # 4) BOUNDING BOX: avoid scanning all stops
    # ~1 km => ~0.009 degrees latitude (roughly)
    search_radius_km = 1.0
    delta = 0.009 * search_radius_km
    lat_min = start_lat - delta
    lat_max = start_lat + delta
    lon_min = start_lon - delta
    lon_max = start_lon + delta

    # Fetch candidate stops in bounding box
    sql_stops_bbox = """
        SELECT stop_id, stop_name, stop_lat, stop_lon
        FROM stops
        WHERE stop_lat BETWEEN ? AND ?
        AND stop_lon BETWEEN ? AND ?
    """
    stops_cursor = conn.execute(sql_stops_bbox, (lat_min, lat_max, lon_min, lon_max))
    candidate_stops = stops_cursor.fetchall()

    nearby_stops = []
    for row in candidate_stops:
        try:
            s_lat = float(row["stop_lat"])
            s_lon = float(row["stop_lon"])
        except (ValueError, TypeError):
            continue
        dist_km = haversine_distance(start_lat, start_lon, s_lat, s_lon)
        if dist_km <= search_radius_km:
            nearby_stops.append({
                "stop_id": row["stop_id"],
                "stop_name": row["stop_name"],
                "stop_lat": s_lat,
                "stop_lon": s_lon,
                "distance": dist_km
            })

    # If no stops are nearby, return empty
    if not nearby_stops:
        resp = {
            "metadata": {
                "self": request.url,
                "city": city,
                "query_parameters": {
                    "start_coordinates": start_coordinates,
                    "end_coordinates": end_coordinates,
                    "start_time": start_time,
                    "limit": limit
                }
            },
            "departures": []
        }
        conn.close()
        return jsonify(resp), 200

    # Sort the nearby stops by distance
    nearby_stops.sort(key=lambda x: x["distance"])

    # 5) Single query for upcoming departures from all these stops
    #    Build an IN clause for the stop_id set
    nearby_stop_ids = [s["stop_id"] for s in nearby_stops]
    placeholders = ",".join(["?"] * len(nearby_stop_ids))  # e.g. "?,?,?" if 3 stops
    sql_departures = f"""
        SELECT 
            st.trip_id,
            st.arrival_time,
            st.departure_time,
            st.stop_id,
            t.route_id,
            t.trip_headsign
        FROM stop_times st
        JOIN trips t ON st.trip_id = t.trip_id
        WHERE st.stop_id IN ({placeholders})
        AND st.departure_time >= ?
        ORDER BY st.departure_time ASC
        LIMIT 10000
    """
    # We do a large LIMIT to prevent runaway queries. Adjust as needed.
    params = nearby_stop_ids + [hhmmss]
    dep_cursor = conn.execute(sql_departures, params)
    all_departures = dep_cursor.fetchall()

    if not all_departures:
        # No upcoming departures => empty
        resp = {
            "metadata": {
                "self": request.url,
                "city": city,
                "query_parameters": {
                    "start_coordinates": start_coordinates,
                    "end_coordinates": end_coordinates,
                    "start_time": start_time,
                    "limit": limit
                }
            },
            "departures": []
        }
        conn.close()
        return jsonify(resp), 200

    # 6) For each trip_id, we need the location of its final stop to see if
    #    it's heading generally "closer" to the end.
    #    We'll gather unique trip_ids, then fetch final-stop coords in one query.
    trip_ids = list({row["trip_id"] for row in all_departures})

    placeholders_trips = ",".join(["?"] * len(trip_ids))
    sql_final_stop = f"""
        SELECT 
            st.trip_id,
            s.stop_lat AS final_stop_lat,
            s.stop_lon AS final_stop_lon
        FROM stop_times st
        JOIN stops s ON st.stop_id = s.stop_id
        WHERE (st.trip_id, CAST(st.stop_sequence AS INTEGER)) IN (
            SELECT trip_id, MAX(CAST(stop_sequence AS INTEGER))
            FROM stop_times
            WHERE trip_id IN ({placeholders_trips})
            GROUP BY trip_id
        )
    """
    final_cursor = conn.execute(sql_final_stop, trip_ids)
    final_stops_data = final_cursor.fetchall()

    # Put final-stop lat/lon in a dictionary: { trip_id: (lat, lon) }
    final_stop_map = {}
    for row in final_stops_data:
        t_id = row["trip_id"]
        try:
            latf = float(row["final_stop_lat"])
            lonf = float(row["final_stop_lon"])
            final_stop_map[t_id] = (latf, lonf)
        except (ValueError, TypeError):
            final_stop_map[t_id] = None

    conn.close()

    # 7) Filter departures for "heading toward" the end
    #    We'll check if final_stop is closer to the end than to the start.
    def is_heading_toward(t_id):
        coords = final_stop_map.get(t_id)
        if not coords:
            return False
        last_lat, last_lon = coords
        dist_from_start = haversine_distance(start_lat, start_lon, last_lat, last_lon)
        dist_from_end   = haversine_distance(end_lat, end_lon, last_lat, last_lon)
        return dist_from_end < dist_from_start

    # Convert all_departures to final structure
    # We'll merge them with the nearby_stops data to get stop_name & distance
    # so we can do a final sort & limit.

    # First, build a quick map: stop_id => (stop_name, lat, lon, distance)
    stop_map = { st["stop_id"]: st for st in nearby_stops }

    result_list = []
    for row in all_departures:
        trip_id = row["trip_id"]
        if not is_heading_toward(trip_id):
            continue
        sid  = row["stop_id"]
        info = stop_map.get(sid)  # Could be None if data mismatch
        if not info:
            continue
        
        # We'll store the departure item
        result_item = {
            "trip_id": trip_id,
            "route_id": row["route_id"],
            "trip_headsign": row["trip_headsign"],
            "stop": {
                "name": info["stop_name"],
                "coordinates": {
                    "latitude": info["stop_lat"],
                    "longitude": info["stop_lon"]
                },
                # Reconstruct ISO 8601
                "arrival_time": f"{start_time[:10]}T{row['arrival_time']}Z",
                "departure_time": f"{start_time[:10]}T{row['departure_time']}Z"
            },
            "distance_from_start": info["distance"]  # optional, for sort
        }
        result_list.append(result_item)

    # 8) Sort the final results by distance from start, then by earliest departure
    #    We already have distance_from_start. We'll also parse HH:MM:SS for departure sorting
    def parse_time(t_str):
        # "HH:MM:SS" -> (HH, MM, SS)
        h, m, s = t_str.split(":")
        return int(h)*3600 + int(m)*60 + int(s)

    def sort_key(item):
        dist = item["distance_from_start"]
        # item["stop"]["departure_time"] looks like YYYY-MM-DDTHH:MM:SSZ
        # We'll cut out the time portion => HH:MM:SS from substring
        dep_time_str = item["stop"]["departure_time"][11:19]  # "HH:MM:SS"
        t_val = parse_time(dep_time_str)
        return (dist, t_val)

    result_list.sort(key=sort_key)

    # 9) Limit the final results
    result_list = result_list[:limit]

    # 10) Build the JSON response
    query_parameters = {
        "start_coordinates": start_coordinates,
        "end_coordinates": end_coordinates,
        "start_time": start_time,
        "limit": limit
    }

    self_url = (
        f"/public_transport/city/{city}/closest_departures_optimized"
        f"?start_coordinates={start_coordinates}"
        f"&end_coordinates={end_coordinates}"
        f"&start_time={start_time}"
        f"&limit={limit}"
    )

    response_body = {
        "metadata": {
            "self": self_url,
            "city": city,
            "query_parameters": query_parameters
        },
        "departures": [
            # drop 'distance_from_start' from final output if you want
            {k: v for k, v in item.items() if k != "distance_from_start"}
            for item in result_list
        ]
    }

    return jsonify(response_body), 200

@app.route("/")
def index():
    return "Welcome to the Public Transport API for Wrocław!"



@app.route("/public_transport/city/<city>/trip/<trip_id>", methods=["GET"])
def api_trip_details(city, trip_id):
    # 1) Validate city
    if city != VALID_CITY:
        return abort(404, description=f"City '{city}' is not supported.")

    # 2) Query DB for trip details
    conn = get_db_connection()

    # First, fetch the trip row from 'trips'
    trip_query = """
        SELECT route_id, trip_headsign
        FROM trips
        WHERE trip_id = ?
        LIMIT 1
    """
    cursor = conn.execute(trip_query, (trip_id,))
    trip_row = cursor.fetchone()

    if not trip_row:
        conn.close()
        return abort(404, description=f"Trip '{trip_id}' not found for city: {city}")

    route_id = trip_row["route_id"]
    trip_headsign = trip_row["trip_headsign"]

    # Next, fetch all stops for this trip (ordered by stop_sequence)
    stops_query = """
        SELECT st.stop_id, st.arrival_time, st.departure_time,
            stops.stop_name, stops.stop_lat, stops.stop_lon,
            st.stop_sequence
        FROM stop_times st
            JOIN stops ON st.stop_id = stops.stop_id
        WHERE st.trip_id = ?
        ORDER BY CAST(st.stop_sequence AS INTEGER) ASC
    """
    cursor = conn.execute(stops_query, (trip_id,))
    stop_rows = cursor.fetchall()

    # Build the "stops" list
    stops_list = []
    for row in stop_rows:
        # We'll assume some date if we wanted to build an ISO string. For now, just pass times.
        stops_list.append({
            "name": row["stop_name"],
            "coordinates": {
                "latitude": float(row["stop_lat"]) if row["stop_lat"] else 0.0,
                "longitude": float(row["stop_lon"]) if row["stop_lon"] else 0.0
            },
            # In a real scenario, you’d merge date/time properly or confirm service validity.
            "arrival_time": row["arrival_time"],
            "departure_time": row["departure_time"]
        })

    conn.close()

    # 3) Construct response
    self_url = f"/public_transport/city/{city}/trip/{trip_id}"
    response_body = {
        "metadata": {
            "self": self_url,
            "city": city,
            "query_parameters": {
                "trip_id": trip_id
            }
        },
        "trip_details": {
            "trip_id": trip_id,
            "route_id": route_id,
            "trip_headsign": trip_headsign,
            "stops": stops_list
        }
    }
    return jsonify(response_body), 200

if __name__ == "__main__":
    app.run(debug=True, port=5001)
