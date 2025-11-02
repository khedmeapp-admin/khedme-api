@echo off
echo 🔄 Updating provider info...

curl -X POST "http://localhost:10000/api/providers/update" ^
  -H "Content-Type: application/json" ^
  -d "{\"id\":1,\"full_name\":\"Ali Hassan\",\"category_id\":2,\"district_id\":5,\"phone\":\"70123456\"}"

echo.
pause
