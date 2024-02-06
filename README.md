# strava_app
This is a sandbox application for me to learn new things e.g. data engineering, DevOps etc.

The aim of the application is to allow my partner to be able to average over certain laps (splits) in her marathon training.

Strava's API allows users to request times for individual laps in a running workout but the actual application does not allow users to investigate the times for each lap in a workout. My application allows users to select laps from a dropdown and generate minute/mile, predicted 5k time, total distance, and total duration for those laps. 

I am experimenting with running application with docker compose, kubernetes, and terraform.

As of 06/02/24 the application can be started by running:

``docker compose up --build``

and then accessing http://localhost:5001 to open the frontend.

The backend api can also be accessed on http://localhost:8000/api/activities and http://localhost:8000/api/laps.