FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1

# Install system dependencies required for Playwright and its browser binaries
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    curl \
    ca-certificates \
    build-essential \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libgbm1 \
    libasound2 \
    libxrandr2 \
    libxss1 \
    libpangocairo-1.0-0 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY cloudrun/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers
RUN python -m playwright install --with-deps

# Copy the scraper application code
COPY cloudrun /app

# Set the command to run the scraper
CMD ["python", "scraper_cloudrun.py"]
