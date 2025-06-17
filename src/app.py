from flask import Flask, jsonify, request
import sqlite3
from datetime import datetime

app = Flask(__name__)

def get_db_connection():
    conn = sqlite3.connect('trips.sqlite')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/public_transport/city/<city>/closest_departures', methods=['GET'])
def get_closest_departures(city):
    start_coordinates = request.args.get('start_coordinates')
    end_coordinates = request.args.get('end_coordinates')
    start_time = request.args.get('start_time')
    limit = request.args.get('limit', default=3, type=int)

    conn = get_db_connection()
    query = """
    SELECT st.trip_id, t.route_id, t.trip_headsign, s.stop_name, s.stop_lat, s.stop_lon, st.arrival_time, st.departure_time
    FROM stop_times st
    JOIN stops s ON st.stop_id = s.stop_id
    JOIN trips t ON st.trip_id = t.trip_id
    WHERE time(st.arrival_time) >= time(?)
    ORDER BY time(st.arrival_time)
    LIMIT ?
    """
    departures = conn.execute(query, (start_time[11:19], limit)).fetchall()
    conn.close()

    response = {
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

    for row in departures:
        arrival_iso = f"{start_time[:10]}T{row['arrival_time']}Z"
        departure_iso = f"{start_time[:10]}T{row['departure_time']}Z"
        response["departures"].append({
            "trip_id": row["trip_id"],
            "route_id": row["route_id"],
            "trip_headsign": row["trip_headsign"],
            "stop": {
                "name": row["stop_name"],
                "coordinates": {
                    "latitude": row["stop_lat"],
                    "longitude": row["stop_lon"]
                },
                "arrival_time": arrival_iso,
                "departure_time": departure_iso
            }
        })

    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)
