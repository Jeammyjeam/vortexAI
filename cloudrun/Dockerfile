# Use the official Playwright image
FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the port the server will run on
EXPOSE 8080

# Set the entrypoint to run the server
CMD ["python", "scraper_cloudrun.py"]
