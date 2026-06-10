@echo off
chcp 65001 >nul
echo ============================================
echo   张雪峰 AI 志愿填报系统（整蛊版）
echo   本地服务器启动中...
echo ============================================
echo.
echo   打开浏览器访问: http://localhost:8765
echo   按 Ctrl+C 停止服务器
echo.
cd /d "%~dp0"
python -m http.server 8765
pause
