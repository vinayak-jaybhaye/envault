#!/bin/bash

# Usage:
# Upload:   ./envvault.sh upload <api_url> <passphrase> <project_name> <file>
# Download: ./envvault.sh download <api_url> <passphrase> <project_name>
# Health:   ./envvault.sh health <api_url>

upload() {
  API_URL="$1"
  PASSPHRASE="$2"
  PROJECT="$3"
  FILE="$4"

  if [[ -z "$API_URL" || -z "$PASSPHRASE" || -z "$PROJECT" || -z "$FILE" ]]; then
    echo "❌ Missing arguments for upload"
    echo "Usage: upload <api_url> <passphrase> <project_name> <file>"
    exit 1
  fi

  if [[ ! -f "$FILE" ]]; then
    echo "❌ File '$FILE' not found"
    exit 1
  fi

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/cli-upload" \
    -F "passphrase=$PASSPHRASE" \
    -F "project_name=$PROJECT" \
    -F "file=@$FILE")

  BODY=$(echo "$RESPONSE" | head -n1)
  CODE=$(echo "$RESPONSE" | tail -n1)

  if [[ "$CODE" == "200" ]]; then
    echo "✅ Upload successful"
  else
    echo "❌ Upload failed (HTTP $CODE): $BODY"
  fi
}

download() {
  API_URL="$1"
  PASSPHRASE="$2"
  PROJECT="$3"
  OUTPUT="${PROJECT}.env"

  if [[ -z "$API_URL" || -z "$PASSPHRASE" || -z "$PROJECT" ]]; then
    echo "❌ Missing arguments for download"
    echo "Usage: download <api_url> <passphrase> <project_name>"
    exit 1
  fi

  HTTP_RESPONSE=$(curl -s -w "%{http_code}" -o "$OUTPUT" -X POST "$API_URL/cli-download" \
    -H "Content-Type: application/json" \
    -d "{\"passphrase\":\"$PASSPHRASE\", \"project_name\":\"$PROJECT\"}")

  if [[ "$HTTP_RESPONSE" == "200" ]]; then
    echo "✅ Decrypted .env file saved as $OUTPUT"
  else
    rm -f "$OUTPUT"  # Remove partial file if error
    echo "❌ Download failed (HTTP $HTTP_RESPONSE)"
  fi
}


health() {
  API_URL="$1"

  if [[ -z "$API_URL" ]]; then
    echo "❌ Missing argument for health"
    echo "Usage: health <api_url>"
    exit 1
  fi

  RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/health")
  BODY=$(echo "$RESPONSE" | head -n1)
  CODE=$(echo "$RESPONSE" | tail -n1)

  if [[ "$CODE" == "200" ]]; then
    echo "✅ API is healthy: $BODY"
  else
    echo "❌ Health check failed (HTTP $CODE): $BODY"
  fi
}

case "$1" in
  upload)
    shift
    upload "$@"
    ;;
  download)
    shift
    download "$@"
    ;;
  health)
    shift
    health "$@"
    ;;
  *)
    echo "Usage:"
    echo "  $0 upload <api_url> <passphrase> <project_name> <file>"
    echo "  $0 download <api_url> <passphrase> <project_name>"
    echo "  $0 health <api_url>"
    exit 1
    ;;
esac
