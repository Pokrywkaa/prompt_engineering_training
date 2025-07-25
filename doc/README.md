🎉 **Congratulations** on **successfully completing the warm-up tasks** ✅ and **obtaining the correct password** 🔑!

**Welcome to the second part of the Prompt Engineering Laboratories!** 🧪 This section will build on the **foundations** 🧱 you've established and challenge you with **more complex tasks** 🎯. Here, you'll further **explore the capabilities of LLMs** 🤖 and see how they can be applied to **solve real-world problems efficiently** 💡.

Get ready to **dive deeper** 🌊 and continue your **learning journey** 🚀. **Best of luck** 🍀, and **enjoy the experience**! 😊

## 🗺️ Use Case

The user **selects** a starting and destination point on the map 🗺️. The application **identifies** the nearest stops and their upcoming departures. Based on this information, the app **recommends** the closest stops and the next transportation departures heading towards the specified destination.

---
## 📝 requirements

### 1. Frontend

Create a frontend in plain HTML and JavaScript that allows users to:

* **Select** the starting and destination point.
* **Select** the time of departure (by default, it is now).
* **Trigger** a request by clicking a button to get the nearest departures and their corresponding stops within a range of up to 1 km.
* **Display** a map of Wroclaw where the user can select the start and destination point.
    * **Hint**: You can use the `leaflet.js` framework for that purpose.
* Based on the API results, **display** the names of the stops along with labels for the line, head sign (destination), and departure times. If there are multiple results, they can be shown on separate lines.
* ⭐ **Bonus point I**: **Group** multiple results in the same popup with several lines.
* ⭐ **Bonus point II**: (The frontend) **Display** not only the departures but the route of the selected departure together with the name of the stops within the route.

Below is a mockup of the frontend (But we are sure you can do it much better 🙂)

![frontend mockup](frontend_mockup.png)

---
### 2. Source Data 📁

* **Use** the zip file provided by the teacher or **download** it from [Wroclaw Public Transport Data](https://opendata.cui.wroclaw.pl/dataset/rozkladjazdytransportupublicznegoplik_data).
* Within the zip, there are several CSV files. For this exercise, we are interested in the files: `trips.csv`, `stops.csv`, and `stop_times.csv`.
    * `trips.csv`: Contains information about multiple departures for each line, associated with the head sign, vehicle type, and other fields.
    * `stops.csv`: Contains all stops used by MPK in Wroclaw with their associated coordinates.
    * `stop_times.csv`: Provides timetable information for each trip, indicating expected arrival and departure times from each stop.

---
### 3. Relational Database 🗄️

* **Import** the mentioned CSV files into a relational database so it can be queried by the backend.
* **Use** whatever engine you prefer. `SQLite` is a good and open-source option.
* **Hint**: If you find issues when selecting from an `SQLite` table created by importing the CSV (related to columns not existing that actually exist), it is likely due to non-visible symbols in the column names. Use the attached script `sqlite_schema_fix.sql` to fix it.

---
### 4. Backend ⚙️

* **Create** a backend in Python that connects to the mentioned database and exposes a **REST API** used by the frontend.
* **Hint**: You can use the `Flask` framework for the API and the `sqlite3` built-in Python package for accessing the database (if you are using `SQLite`). But if you know a better approach, feel free to go for it.
* The backend shall **implement** the endpoints detailed in the API section.

### 5. API Documentation

#### `GET /public_transport/city/{city}/closest_departures`

Retrieves the closest public transport departures that move the user towards their specified destination.

**Description:**

This endpoint returns a list of upcoming public transport departures from stops near the user's starting location. The departures are filtered to include only those lines that are generally heading towards the user's destination (lines starting in the opposite direction are excluded). The results are sorted by the distance of the departure stop from the `start_coordinates`, with the closest stops listed first. Note that this endpoint identifies departures heading in the correct general direction but does not guarantee that a specific line is the most optimal or direct route to the `end_coordinates`.

---

**Parameters:**

#### Path Parameters:

| Parameter | Type   | Required | Description                                           | Accepted Values |
| :-------- | :----- | :------- | :---------------------------------------------------- | :-------------- |
| `city`    | string | Yes      | The city for which to find public transport options. | "wroclaw"       |

#### Query Parameters:

| Parameter           | Type   | Required | Default      | Description                                                                    | Example Format      |
| :------------------ | :----- | :------- | :----------- | :----------------------------------------------------------------------------- | :------------------ |
| `start_coordinates` | string | Yes      | N/A          | Geolocation coordinates (latitude,longitude) where the user starts the trip. | `51.1079,17.0385`   |
| `end_coordinates`   | string | Yes      | N/A          | Geolocation coordinates (latitude,longitude) where the user wants to end the trip. | `51.1141,17.0301`   |
| `start_time`        | string | No       | Current time | The ISO 8601 date-time at which the user starts the trip.                  | `2025-04-02T08:30:00Z` |
| `limit`             | integer| No       | 5            | The maximum number of departures to return.                                    | `3`                 |

---

**Responses:**

#### `200 OK` - Successful Response

The response includes metadata about the request and a list of departures.

**Response Body Structure:**

* `metadata`: (object) Contains details of the request parameters.
    * `self`: (string) The request URL.
    * `city`: (string) The city specified in the request.
    * `query_parameters`: (object) The query parameters received in the request.
        * `start_coordinates`: (string)
        * `end_coordinates`: (string)
        * `start_time`: (string) ISO 8601 date-time.
        * `limit`: (integer)
* `departures`: (array) A list of departure objects.
    * `trip_id`: (string) Identifier for the trip (from the `trips` table).
    * `route_id`: (string) Identifier for the route (from the `trips` table).
    * `trip_headsign`: (string) The destination sign displayed on the vehicle (from the `trips` table).
    * `stop`: (object) Details of the departure stop.
        * `name`: (string) Name of the stop (from the `stops` table).
        * `coordinates`: (object) Geolocation of the stop.
            * `latitude`: (number)
            * `longitude`: (number)
        * `arrival_time`: (string) ISO 8601 date-time of arrival at the stop (from `stop_times` table).
        * `departure_time`: (string) ISO 8601 date-time of departure from the stop (from `stop_times` table).

**Example Response:**

```json
{
    "metadata": {
        "self": "/public_transport/city/wroclaw/closest_departures?start_coordinates=51.1079,17.0385&end_coordinates=51.1141,17.0301&start_time=2025-04-02T08:30:00Z&limit=3",
        "city": "wroclaw",
        "query_parameters": {
            "start_coordinates": "51.1079,17.0385",
            "end_coordinates": "51.1141,17.0301",
            "start_time": "2025-04-02T08:30:00Z",
            "limit": 3
        }
    },
    "departures": [
        {
            "trip_id": "3_14613060",
            "route_id": "A",
            "trip_headsign": "KOSZAROWA (Szpital)",
            "stop": {
                "name": "Plac Grunwaldzki",
                "coordinates": {
                    "latitude": 51.1092,
                    "longitude": 17.0415
                },
                "arrival_time": "2025-04-02T08:34:00Z",
                "departure_time": "2025-04-02T08:35:00Z"
            }
        },
        {
            "trip_id": "3_14613109",
            "route_id": "B",
            "trip_headsign": "Dworzec Główny",
            "stop": {
                "name": "Renoma",
                "coordinates": {
                    "latitude": 51.1040,
                    "longitude": 17.0280
                },
                "arrival_time": "2025-04-02T08:39:00Z",
                "departure_time": "2025-04-02T08:40:00Z"
            }
        },
        {
            "trip_id": "3_14613222",
            "route_id": "C",
            "trip_headsign": "Klecina",
            "stop": {
                "name": "Dominikański",
                "coordinates": {
                    "latitude": 51.1099,
                    "longitude": 17.0335
                },
                "arrival_time": "2025-04-02T08:44:00Z",
                "departure_time": "2025-04-02T08:45:00Z"
            }
        }
    ]
}
```


**Possible Error Responses:**

* **`400 Bad Request`**
    * **Reason:** The request was malformed, such as missing required parameters or parameters having incorrect data types.

* **`404 Not Found`**
    * **Reason:** The specified city is not supported.

* **`500 Internal Server Error`**
    * **Reason:** An unexpected error occurred on the server while processing the request.


#### `GET /public_transport/city/{city}/trip/{trip_id}`

Retrieves detailed information about a specific public transport trip, including its route, headsign, and a list of all stops with their respective arrival and departure times.

**Description:**

This endpoint provides comprehensive details for a single public transport trip identified by its unique `trip_id`. The information returned includes the trip's route identifier, the headsign displayed on the vehicle, and an ordered list of all stops along the trip, complete with their names, geographical coordinates, and scheduled arrival and departure times.

---

**Parameters:**

#### Path Parameters:

| Parameter | Type   | Required | Description                                                    | Accepted Values | Example      |
| :-------- | :----- | :------- | :------------------------------------------------------------- | :-------------- | :----------- |
| `city`    | string | Yes      | The city for which trip details are requested.                 | "wroclaw"       | `wroclaw`    |
| `trip_id` | string | Yes      | The unique identifier of the trip whose details are requested. |                 | `3_14613060` |

#### Query Parameters:

None.

---

**Responses:**

#### `200 OK` - Successful Response

The response includes metadata about the request and the detailed information for the specified trip.

**Response Body Structure:**

* `metadata`: (object) Contains details of the request.
    * `self`: (string) The request URL.
    * `city`: (string) The city specified in the request.
    * `query_parameters`: (object) *Note: In the provided example, `trip_id` is shown here. Typically, path parameters are not repeated in `query_parameters` metadata.*
        * `trip_id`: (string) The trip ID from the request.
* `trip_details`: (object) Contains the detailed information for the trip.
    * `trip_id`: (string) Identifier for the trip.
    * `route_id`: (string) Identifier for the route.
    * `trip_headsign`: (string) The destination sign displayed on the vehicle.
    * `stops`: (array) An ordered list of stop objects for the trip.
        * `name`: (string) Name of the stop.
        * `coordinates`: (object) Geolocation of the stop.
            * `latitude`: (number)
            * `longitude`: (number)
        * `arrival_time`: (string) ISO 8601 date-time of arrival at the stop.
        * `departure_time`: (string) ISO 8601 date-time of departure from the stop.

**Example Response:**

```json
{
    "metadata": {
      "self": "/public_transport/city/wroclaw/trip/3_14613060",
      "city": "wroclaw",
      "trip_id": "3_14613060"
    },
    "trip_details": {
        "trip_id": "3_14613060",
        "route_id": "A",
        "trip_headsign": "KRZYKI",
        "stops": [
            {
                "name": "Plac Grunwaldzki",
                "coordinates": {
                    "latitude": 51.1092,
                    "longitude": 17.0415
                },
                "arrival_time": "2025-04-02T08:34:00Z",
                "departure_time": "2025-04-02T08:35:00Z"
            },
            {
                "name": "Renoma",
                "coordinates": {
                    "latitude": 51.1040,
                    "longitude": 17.0280
                },
                "arrival_time": "2025-04-02T08:39:00Z",
                "departure_time": "2025-04-02T08:40:00Z"
            },
            {
                "name": "Dominikański",
                "coordinates": {
                    "latitude": 51.1099,
                    "longitude": 17.0335
                },
                "arrival_time": "2025-04-02T08:44:00Z",
                "departure_time": "2025-04-02T08:45:00Z"
            }
        ]
    }
}
```

**Possible Error Responses:**

* **`400 Bad Request`**
    * **Reason:** The request was malformed, such as missing required parameters or parameters having incorrect data types.

* **`404 Not Found`**
    * **Reason:** The specified city is not supported and/or the trip_id is not valid.

* **`500 Internal Server Error`**
    * **Reason:** An unexpected error occurred on the server while processing the request.

### 6. Unit tests

- The backend code shall be unit tested by using your prefer python library for that purpose. The SQL code can be placed in a separate class and mocked during the test.
- The frontend code can be tested by using the jasmine framework. Put the javascript code in a separate file and the tests in another one to keep it clean.

## ✅ Tasks

### 1. Data Preparation and Analysis
* **Download** the public transport data `.zip` file as specified in the "Source Data" section.
* **Extract** the required CSV files: `trips.csv`, `stops.csv`, and `stop_times.csv`.
* **Analyze** these files to understand their structure, content, and relationships relevant to the project requirements.

---
### 2. Database Setup
* **Choose** a suitable relational database engine (e.g., `SQLite` as suggested).
* **Import** the data from these CSV files into the structured database tables. Come out with a way of automatically detect the schema form the data.
* **Verify** data integrity after import.

---
### 3. Backend API Development
* **Develop** a backend application in Python (e.g., using `Flask` or a framework of your choice).
* **Establish** a robust connection from the backend to the database populated in Task 2.
* **Implement** and **expose** the following REST API endpoints as detailed in the "API Documentation" section:
    * `GET /public_transport/city/{city}/closest_departures`: To find nearby departures towards a destination.
    * `GET /public_transport/city/{city}/trip/{trip_id}`: To retrieve details for a specific trip.
* Ensure endpoints handle request parameters and return responses in the specified formats.

---
### 4. Frontend Development
* **Create** a user-facing web application using plain HTML, CSS, and JavaScript.
* **Implement** the primary user interface components:
    * An interactive map of Wrocław (e.g., using `leaflet.js`) for users to visually select start and destination coordinates.
    * Input fields for selecting the desired departure time (defaulting to the current time).
    * An input field for specifying the `limit` on the number of departures to retrieve.
    * A button to trigger the data retrieval process by calling the backend API.
* **Develop** functionality to:
    * Send requests to the `closest_departures` backend endpoint with the user-selected parameters.
    * Clearly **display** the retrieved departure information, including for each result: stop name, line identifier, trip headsign (destination), and scheduled departure time.
    * Handle and present multiple results effectively.

---
### 5. Unit Testing
* **Write** unit tests for major components of the backend Python code. Focus on testing business logic, data processing, and API endpoint request/response handling (consider mocking database interactions).
* **Write** unit tests for the frontend JavaScript code. Focus on testing user interaction logic, API communication, and dynamic display of data.

## ⭐ Bonus Tasks

* **Implement Configurable Search Range:**
    * **Frontend:** Add a user interface element (e.g., a dropdown menu) allowing users to select a preferred search radius for finding the closest departure points (e.g., `100m`, `500m`, `1km`, `2km`, `5km`).
    * **Backend:** Modify the `GET /public_transport/city/{city}/closest_departures` endpoint to accept a new request parameter for the search radius and filter results accordingly.

* **Add Transportation Mode Icons to Map:**
    * **Frontend:** Visually distinguish different means of transportation on the map by using relevant icons (e.g., icons for walking segments, bus routes, tram lines) when displaying routes or departures.

* **Group Identical Departures:**
    * **Frontend:** If multiple distinct transport lines depart from the **same stop** at the **exact same scheduled time** heading to the **same headsign**, consider grouping them in the display for a cleaner interface.

* **Visualize Full Trip Route:**
    * **Frontend:** Upon selecting a specific departure, display its entire route on the map, clearly marking the path and indicating all intermediate stop names as points along the line.

* **Display Walking Distance and Route:**
    * **Backend:** If not already present, ensure the API response for closest departures includes the calculated walking distance from the user's starting point to the recommended departure stop.
    * **Frontend:** Display this walking distance to the user and visually represent the walking path (e.g., as a dotted line) on the map from the user's specified start location to the departure stop.

* **Implement Location Search Boxes:**
    * **Frontend:** Add text input fields (search boxes) for both the start and destination points, allowing users to search for locations by name (e.g., stop names, points of interest).
    * **Backend:** Develop a new API endpoint that queries the `stops` table (and potentially other geographic data) to provide auto-suggestions or search results based on the text entered by the user.


## 💡 Hints

You are a Vibe Coder! 🚀 Don't hesitate to use your AI chat assistant 💬 for support with *literally everything* that comes to your mind throughout this project. It can be a valuable resource for:

* **Developing Code:** Assisting with Python, JavaScript, SQL, or debugging.
* **Database Management:** Helping with schema design, data import processes, and writing queries.
* **Infrastructure Setup (if needed):** Providing commands for setting up your development environment or tools.
* **Algorithm Design:** Offering hints, ideas, or explanations for algorithms and data structures.
* **Problem-Solving Approaches:** Brainstorming different strategies to tackle specific challenges.
* **Clarifying Concepts:** Helping you understand any part of the project requirements or technologies involved.
* ...and anything else where you feel an extra "mind" could help!

## 🏗️ Project Skeleton: Your Starting Point

To help you hit the ground running, we've provided a basic project skeleton for both the backend and frontend components. This skeleton is a launchpad, not a complete solution, and will require significant development to meet the project requirements.

---

### 🗄️ Database: Initial Setup

* **Current State:** The provided database has been minimally populated, containing only **one sample record from each of the required CSV files** (`trips.csv`, `stops.csv`, `stop_times.csv`). This is primarily to demonstrate basic table structure and connectivity.
* **Your Task:** You will need to **fully populate the database**. This involves either:
    * **Recreating the database** (recommended) by creating an import process to load the *entire dataset* from all relevant CSV files.
    * **Augmenting the existing database** by implementing scripts or procedures to import the remaining data into the existing tables.
---

### 🖥️ Frontend: Basic API Test Interface

* **Current State:** The frontend skeleton includes a very basic implementation. Its main purpose is to demonstrate **how to call the backend API endpoints** and display the raw JSON response. This helps verify end-to-end connectivity.
* **Your Task:** You need to **develop the complete frontend user interface and functionality** as detailed in the "Frontend Requirements" section. This includes:
    * **Replacing the JSON display:** Implement all visual elements (map, input controls, results list, popups, etc.).
    * **Map Integration:** Integrate `leaflet.js` to display an interactive map of Wroclaw, allowing users to select start and destination points by clicking.
    * **User Inputs:** Create controls for departure time, maximum results, search range (bonus), and potentially text-based location search (bonus).
    * **Dynamic Data Display:** Parse the API responses and present the departure and trip information in a user-friendly format (stop names, line details, headsigns, departure times, route visualizations on the map).
    * **API Call Logic:** You can reuse the foundational logic for making API calls but will need to significantly extend it to handle different parameters, parse complex responses, manage application state, and implement robust error handling.
    * **Implementing Bonus Features:** If tackling bonus tasks, integrate features like configurable search ranges, route drawing, and grouped popups.

---

### ⚙️ Backend: Mocked API Endpoints

* **Current State:** The backend skeleton contains the two required API endpoints:
    * `GET /public_transport/city/{city}/closest_departures`
    * `GET /public_transport/city/{city}/trip/{trip_id}`
      However, these endpoints have **mocked implementations**. They currently return a minimal, hardcoded response (e.g., the first row from the database and some static sample data) and do not perform any real data processing or database queries based on input parameters.
* **Your Task:** You need to **implement the full logic for both API endpoints**. This involves:
    * **Querying Data:** Write efficient SQL queries (or use an ORM) to:
        * For `closest_departures`: Find nearby stops based on `start_coordinates` and `range`, filter lines heading towards `end_coordinates` (if provided), consider `start_time`, and sort/limit results.
        * For `trip_details`: Retrieve all stops, arrival/departure times, and route information for the given `trip_id`.
    * **Data Processing:** Perform any necessary calculations (e.g., distance, time differences) and data transformations to match the specified API response format.
    * **Controller and Service Logic:** Adapt or completely rewrite the provided controller and service modules (or your chosen architectural pattern) to incorporate this new logic, replacing all mocked behavior. Ensure proper handling of path and query parameters.

## 🏆 Scoring Criteria

Below are the criteria used for scoring, along with their respective weights and detailed descriptions for qualitative assessments.

---

* **Tasks Completed (60%)**
    * This score is based on the percentage of assigned tasks that were successfully completed.

---

* **Team Organization (20%)**
    * **Score:** 1-5
    * A qualitative assessment of how the team was organized and collaborated.
        * **1:** No organization at all. Either a "one-man army" approach or a chaotic "everyone doing everything" scenario with no clear roles or coordination.
        * **5:** The ideal organization. Clear roles, no overlaps in effort, strong team support, and an environment where "love and generosity is in the air!"

---

* **Aesthetic (10%)**
    * **Score:** 1-5
    * A qualitative assessment of the visual appeal and user experience of the output.
        * **1:** Awful design. Difficult to look at or use.
        * **5:** The essence of beauty. Visually stunning, intuitive, and a pleasure to interact with.

---

* **Code Design and Quality (10%)**
    * **Score:** 1-5
    * A qualitative assessment of the structure, readability, and maintainability of the codebase.
        * **1:** Assembler code is more readable than this. Spaghetti code, poor practices, difficult to understand or modify.
        * **5:** Uncle Bob will cry of joy when looking at your code. Clean, well-structured, follows best practices, highly readable, and maintainable.


