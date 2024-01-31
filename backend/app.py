from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Tuple, Optional
import psycopg2
import logging

logging.basicConfig(
    level=logging.DEBUG,  # Set the logging level
    format='%(asctime)s - %(levelname)s - %(message)s',  # Set the format of log messages
)


logger = logging.getLogger()


app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:5001",
    "http://0.0.0.0:5001",
    "http://0.0.0.0",
    "http://frontend"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

class ReadDB:
    connection: Optional[psycopg2.extensions.connection] = None
    cursor: Optional[psycopg2.extensions.cursor] = None
    metadata_columns: List[str] = ["id", "name", "start_date", "type"]
    laps_columns: List[str] = ["id", "pace_zone", "average_heartrate", "name", "distance", "elapsed_time"]
    DATABASE_URL = f"postgresql://postgres:postgres@postgres/postgres"

    def create_connection(self) -> "BuildDB":
        try:
            logger.info("Creating Database Connection")
            self.connection = psycopg2.connect(self.DATABASE_URL)
            logger.info("Connection Successful")
        except psycopg2.Error as e:
            logging.error(f"Error connecting to database: {e}")
        return self

    def create_cursor(self) -> "BuildDB":
        logging.info("Creating Database Cursor Object")
        self.cursor = self.connection.cursor()
        logging.info("Cursor Object Created")
        return self

    def read_activities(self):
        self.cursor.execute("SELECT * FROM metadata")
        values: List[Tuple[str, str, str, str]] = self.cursor.fetchall()
        return [{key: value for key, value in zip(self.metadata_columns, v)} for v in values]

    def read_laps(self):
        self.cursor.execute("SELECT * FROM laps")
        values: List[Tuple[str, str, str, str]] = self.cursor.fetchall()
        return [{key: value for key, value in zip(self.laps_columns, v)} for v in values]

    def read_single_activity(self, activity_id: str):
        self.cursor.execute(f"SELECT * FROM metadata WHERE id = '{activity_id}'")
        values: List[Tuple[str, str, float, str, float, int]] = self.cursor.fetchall()
        return [{key: value for key, value in zip(self.metadata_columns, v)} for v in values]

    def read_laps_from_single_activity(self, activity_id: str):
        self.cursor.execute(f"SELECT * FROM laps WHERE id = '{activity_id}'")
        values: List[Tuple[str, str, float, str, float, int]] = self.cursor.fetchall()
        return [{key: value for key, value in zip(self.laps_columns, v)} for v in values]

    def close_cursor(self) -> "BuildDB":
        logging.info("Closing cursor object")
        self.cursor.close()
        return self

    def close_connection(self) -> "BuildDB":
        logging.info("Closing database connection")
        self.connection.close()
        return self

db_reader = ReadDB().create_connection().create_cursor()


@app.get("/")
def ping():
    return {"status": "ok"}


@app.get("/api/activities")
def read_activities():
    activities = db_reader.read_activities()
    return activities

@app.get("/api/laps")
def read_laps():
    laps = db_reader.read_laps()
    return laps

@app.get("/api/activities/{activity_id}")
def read_single_activity(activity_id: str):
    laps = db_reader.read_single_activity(activity_id)
    return laps

@app.get("/api/laps/{activity_id}")
def read_laps_from_single_activity(activity_id: str):
    laps = db_reader.read_laps_from_single_activity(activity_id)
    return laps

@app.get("api/shutdown")
def shutdown():
    db_reader.close_cursor().close_connection()