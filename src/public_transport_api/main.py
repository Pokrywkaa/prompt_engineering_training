from pathlib import Path

from controllers.departures_controller import departures_bp
from controllers.trips_controller import trips_bp
from flask import Flask, render_template
from flask_cors import CORS

template_folder = Path(__file__).parent.parent.parent / "frontend"
static_folder = template_folder / "static"

app = Flask(
    __name__,
    static_folder=static_folder.resolve(),
    template_folder=template_folder.resolve(),
)

CORS(app)


app.register_blueprint(departures_bp)
app.register_blueprint(trips_bp)


@app.route("/")
def index():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True, port=5002)
