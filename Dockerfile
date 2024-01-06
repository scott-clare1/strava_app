FROM python:3.8-slim
WORKDIR /app
COPY ./requirements.txt /app
RUN pip install -r requirements.txt
COPY src /app
EXPOSE 5000
ENV FLASK_APP=app.py
CMD ["flask", "run", "--host", "0.0.0.0"]
