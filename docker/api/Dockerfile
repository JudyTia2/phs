# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies that might be needed by your Python packages
# For example, for psycopg2 you might need: RUN apt-get update && apt-get install -y postgresql-client

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create a non-root user to run the application
RUN addgroup --system app && adduser --system --group app
USER app

# The command to run the application will be specified in the docker-compose.yml