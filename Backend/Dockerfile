FROM python:3.11-slim

WORKDIR /app

# Cài đặt dependency
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ source
COPY . .

# Copy file JSON key (nếu dùng Firebase/Google API)
COPY config/config_sheet.json /app/config_sheet.json

# Expose port
EXPOSE 8000

# Chạy với Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
