@echo off
echo Installing Node.js dependencies...
npm install

echo Installing Python dependencies...
pip install -r requirements.txt

echo Starting Node.js server...
start cmd /k "node server.js"

echo Starting Python agent...
start cmd /k "python agent.py"

echo Opening application in browser...
timeout /t 5
start http://localhost:3000

echo Application started! Press any key to exit this window.
pause 