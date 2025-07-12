FROM python:3.11-slim

# set working directory
WORKDIR /app

# copy requirements file and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Expose port FastAPI listens on (default 8000)
EXPOSE 8000


# Command to run FastAPI with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
