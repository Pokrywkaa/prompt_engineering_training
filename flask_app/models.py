from database import get_db_connection
from utils import haversine
from datetime import datetime

def get_trip_details(trip_id):
    conn = get_db_connection()
    trip = conn.execute('SELECT * FROM trips WHERE trip_id = ?', (trip_id,)).fetchone()
    stop_times = conn.execute(
        '''SELECT st.*, s.stop_name, s.stop_lat, s.stop_lon
           FROM stop_times st
           JOIN stops s ON st.stop_id = s.stop_id
           WHERE st.trip_id = ?
           ORDER BY st.stop_sequence ASC''', (trip_id,)
    ).fetchall()
    conn.close()
    return trip, stop_times

def get_closest_departures(start_lat, start_lon, end_lat, end_lon, start_time, limit=3):
    conn = get_db_connection()
    # Load all stops with coordinates
    stops = conn.execute('SELECT * FROM stops').fetchall()

    # Compute distance from start to each stop
    nearby_stops = sorted([
        {
            "stop": stop,
            "distance": haversine(
                start_lat, start_lon,
                float(stop['stop_lat']), float(stop['stop_lon'])
            )
        } for stop in stops
    ], key=lambda x: x['distance'])[:20]


    # Check which trips go through those stops after the specified time
    matching_departures = []
    for item in nearby_stops:
        stop = item["stop"]
        rows = conn.execute(
            '''SELECT st.*, t.route_id, t.trip_headsign
               FROM stop_times st
               JOIN trips t ON st.trip_id = t.trip_id
               WHERE st.stop_id = ?
               AND time(st.departure_time) >= time(?)
               ORDER BY st.departure_time ASC''',
            (stop['stop_id'], start_time)
        ).fetchall()
        for row in rows:
            matching_departures.append({
                "trip_id": row["trip_id"],
                "route_id": row["route_id"],
                "trip_headsign": row["trip_headsign"],
                "stop": {
                    "name": stop["stop_name"],
                    "coordinates": {
                        "latitude": stop["stop_lat"],
                        "longitude": stop["stop_lon"]
                    },
                    "arrival_time": f"{start_time[:10]}T{row['arrival_time']}Z",
                    "departure_time": f"{start_time[:10]}T{row['departure_time']}Z"
                }
            })
            if len(matching_departures) >= limit:
                conn.close()
                return matching_departures
    conn.close()
    return matching_departures
