#!/bin/bash
# Literature search utility script
# Usage: ./search.sh "query" [--max-results N] [--year-from YEAR]

QUERY="$1"
MAX_RESULTS=${3:-10}
YEAR_FROM=${4:-""}

echo "Searching for: $QUERY"
echo "Max results: $MAX_RESULTS"
echo "Year from: ${YEAR_FROM:-any}"

# Call the literature search API
curl -s -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"$QUERY\",\"maxResults\":$MAX_RESULTS}\" \
  | jq '.'
