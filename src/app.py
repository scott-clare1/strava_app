from flask import Flask, jsonify
from dotenv import load_dotenv
import os
import requests
from flask_cors import CORS
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

load_dotenv()
app = Flask(__name__)
CORS(app)


def fetch_data(url, header):
    param = {"per_page": 10, "page": 1}
    response = requests.get(url, headers=header, params=param)
    return response.json()


@app.route("/api/data", methods=["GET"])
def get_data():
    auth_link = "https://www.strava.com/oauth/token"
    client_id = os.environ.get("CLIENT_ID")
    client_secret = os.environ.get("CLIENT_SECRET")
    refresh_token = os.environ.get("REFRESH_TOKEN")
    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
        "f": "json",
    }
    resposne = requests.post(auth_link, data=payload, verify=False)
    access_token = resposne.json()["access_token"]
    header = {"Authorization": "Bearer " + access_token}
    activities = fetch_data(f"https://www.strava.com/api/v3/athlete/activities", header)
    activities_detailed = [
        fetch_data(f"https://www.strava.com/api/v3/activities/{activity['id']}", header)
        for activity in activities
    ]

    return jsonify(activities_detailed)


if __name__ == "__main__":
    app.run(debug=True)
