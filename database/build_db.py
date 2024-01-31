from dotenv import load_dotenv
import os
from typing import Dict, Optional, List
import psycopg2
import logging
import requests
import time

load_dotenv()

logging.basicConfig(
    level=logging.DEBUG,  # Set the logging level
    format='%(asctime)s - %(levelname)s - %(message)s',  # Set the format of log messages
)


logger = logging.getLogger()


class BuildDB:

    _access_token: Optional[str] = None
    activities: Optional[List[dict]] = None
    activities_detailed: Optional[List[dict]] = None
    connection: Optional[psycopg2.extensions.connection] = None
    cursor: Optional[psycopg2.extensions.cursor] = None
    activity_id: Optional[List[int]] = None
    laps: Optional[List[List[dict]]] = None
    _existing_ids: Optional[List[int]] = None
    DATABASE_URL = f"postgresql://postgres:postgres@postgres:5432/postgres"

    @property
    def client_id(self) -> str:
        return os.environ.get("CLIENT_ID")

    @property
    def client_secret(self) -> str:
        return os.environ.get("CLIENT_SECRET")

    @property
    def refresh_token(self) -> str:
        return os.environ.get("REFRESH_TOKEN")

    @property
    def auth_link(self) -> str:
        return "https://www.strava.com/oauth/token"

    @property
    def _header(self) -> Dict[str, str]:
        return {"Authorization": "Bearer " + self._access_token}

    @property
    def existing_ids(self) -> List[int]:
        return self._existing_ids

    def get_existing_ids(self):
        try:
            logging.info("Collecting existing ids from metadata table")
            self.cursor.execute("SELECT id FROM metadata")
            values: List[tuple] = self.cursor.fetchall()
            self._existing_ids = [int(value[0]) for value in values]
            return self
        except Exception as e:
            logging.error(f"Error getting existing ids: {e}. Returning empty list instead.")
            self._existing_ids = []
            return self

    def create_connection(self) -> "BuildDB":
        retries: int = 5
        delay: int = 5
        while retries > 0:
            try:
                logger.info(f"Creating Database Connection to {self.DATABASE_URL}")
                self.connection = psycopg2.connect(self.DATABASE_URL)
                logger.info(f"Connection Successful at {self.DATABASE_URL}")
                return self
            except psycopg2.OperationalError as e:
                logging.error(f"Error connecting to database: {e} - retrying in {delay} seconds")
                retries -= 1
                time.sleep(delay)
        else:
            logging.error(f"Max retries exceeding when attempting to connect to postgres database {self.DATABASE_URL}")
            raise psycopg2.OperationalError

    def create_cursor(self) -> "BuildDB":
        logging.info("Creating Database Cursor Object")
        self.cursor = self.connection.cursor()
        logging.info("Cursor Object Created")
        return self

    def fetch_access_token(self) -> "BuildDB":
        logging.info("Fetching access token")
        payload: Dict[str, str] = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": self.refresh_token,
            "grant_type": "refresh_token",
            "f": "json",
        }
        try:
            response = requests.post(self.auth_link, data=payload, verify=False)
            logging.debug(f"{response}")
            self._access_token: str = response.json()["access_token"]
        except Exception as e:
            logging.debug(f"{self.client_id}, {self.client_secret}, {self.refresh_token}")
            logger.info(f"Error requesting access token: {e}")
        if self._access_token:
            logging.info("Access token fetched successfully")
        return self

    def _fetch_data(self, url: str, page_count: int) -> dict:
        param: Dict[str, int] = {"per_page": page_count, "page": 1}
        response = requests.get(url, headers=self._header, params=param)
        return response.json()

    def get_activities(self):
        logging.info("Fetching activity id's")
        self.activities = self._fetch_data(f"https://www.strava.com/api/v3/athlete/activities", 10)
        self.activity_id = [item["id"] for item in self.activities if item["type"] == "Run"]
        logging.info("Activities fetched successfully")
        return self

    def get_laps(self):
        logging.info("Fetching individual activities")
        self.activities_detailed = [
            self._fetch_data(f"https://www.strava.com/api/v3/activities/{activity_id}", 1)
            for activity_id in self.activity_id
        ]
        self.laps = [
            item["laps"] for item in self.activities_detailed
        ]
        logging.info("Laps fetched successfully")
        return self

    def create_metadata_table(self) -> "BuildDB":
        logging.info("Creating metadata table")
        self.cursor.execute("CREATE TABLE IF NOT EXISTS metadata ("
                            "id TEXT, "
                            "name TEXT, "
                            "start_date DATE, "
                            "type TEXT"
                            ");")
        return self

    def create_laps_table(self) -> "BuildDB":
        logging.info("Creating laps table")
        self.cursor.execute("CREATE TABLE IF NOT EXISTS laps ("
                            "id TEXT, "
                            "pace_zone TEXT, "
                            "average_heartrate FLOAT, "
                            "name TEXT, "
                            "distance FLOAT, "
                            "elapsed_time INT"
                            ");")
        return self

    def upload_activity_metadata(self) -> "BuildDB":
        logging.info("Uploading activity metadata to metadata table")
        insert_query: str = """
            INSERT INTO metadata (id, name, start_date, type)
            VALUES (%s, %s, %s, %s)
        """
        count: int = 0
        for activity in self.activities_detailed:
            if activity["id"] not in self.existing_ids:
                logging.info(f"Uploading metadata for {activity['id']}")
                values = (
                    str(activity["id"]), activity["name"], activity["start_date"], activity["type"]
                )
                try:
                    self.cursor.execute(insert_query, values)
                except Exception as e:
                    logging.debug(f"{values}")
                    logging.error(f"Error uploading to database table metadata {e}")
                count += 1

        self.connection.commit()
        logging.info(f"Activity metadata uploaded successfully - total laps uploaded: {count}")
        return self


    def upload_laps(self) -> "BuildDB":
        logging.info("Uploading laps to laps table")
        insert_query: str = """
            INSERT INTO laps (id, pace_zone, average_heartrate, name, distance, elapsed_time)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        count: int = 0
        for idx, laps in zip(self.activity_id, self.laps):
            if idx not in self.existing_ids:
                logging.info(f"Uploading laps for {idx}")
                for lap in laps:
                    values = (
                        str(idx),
                        lap["pace_zone"],
                        lap["average_heartrate"],
                        lap["name"],
                        lap["distance"],
                        lap["elapsed_time"]
                    )
                    self.cursor.execute(insert_query, values)
                    count += 1

        self.connection.commit()
        logging.info(f"Laps uploaded to laps table successfully - total laps uploaded: {count}")
        return self

    def close_cursor(self) -> "BuildDB":
        logging.info("Closing cursor object")
        self.cursor.close()
        return self

    def close_connection(self) -> "BuildDB":
        logging.info("Closing database connection")
        self.connection.close()
        return self


if __name__ == "__main__":
    db_builder = BuildDB()
    (db_builder.create_connection()
     .create_cursor()
     .create_metadata_table()
     .create_laps_table()
     .get_existing_ids()
     .fetch_access_token()
     .get_activities()
     .get_laps()
     .upload_activity_metadata()
     .upload_laps()
     .close_cursor()
     .close_connection()
     )