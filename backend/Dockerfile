FROM python:3.12-slim
WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY catalog.json .
RUN useradd --create-home appuser && mkdir -p /srv/data && chown appuser /srv/data
USER appuser
EXPOSE 8000
# Deploy behind your platform's HTTPS proxy, which supplies the forwarded client address.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
