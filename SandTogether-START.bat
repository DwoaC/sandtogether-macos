@echo off
title SandTogether by Kamil Padula
rem Umiesc ten plik w glownym folderze gry Sandustry (obok Sandustry.exe).
rem Usuwa app.asar jesli Steam go odtworzyl (inaczej gra zaladuje wersje bez moda),
rem po czym uruchamia gre.
if exist "%~dp0resources\app.asar" (
    echo Steam odtworzyl app.asar - usuwam, zeby mod dzialal...
    del /f /q "%~dp0resources\app.asar"
)
start "" "%~dp0Sandustry.exe"
