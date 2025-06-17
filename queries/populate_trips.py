
import sqlite3
import csv

# Connect to SQLite database (creates it if it doesn't exist)
conn = sqlite3.connect('trips.sqlite')
cursor = conn.cursor()

# Create the 'trips' table if it doesn't exist
cursor.execute('''
CREATE TABLE IF NOT EXISTS trips (
 route_id TEXT,
 service_id INTEGER,
 trip_id TEXT,
 trip_headsign TEXT,
 direction_id INTEGER,
 shape_id INTEGER,
 brigade_id INTEGER,
 vehicle_id INTEGER,
 variant_id INTEGER
)
''')

# Read the CSV file and insert data
with open('OtwartyWroclaw_rozklad_jazdy_GTFS/trips.txt', 'r', encoding='utf-8') as csvfile:
 csvreader = csv.reader(csvfile)
 next(csvreader) # Skip header
 for row in csvreader:
    cursor.execute('''
    INSERT INTO trips (
    route_id, service_id, trip_id, trip_headsign,
    direction_id, shape_id, brigade_id, vehicle_id, variant_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', row)

# Commit and close
conn.commit()
conn.close()

print("✅ Data successfully inserted into 'trips' table in 'trips.sqlite'.")
