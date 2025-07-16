@echo off
REM PromptShield - Run All Commands Script (Windows)
REM This script demonstrates all available PromptShield commands

setlocal enabledelayedexpansion

echo === PromptShield Command Test Script ===

REM Check if we're in the right directory
if not exist "package.json" (
    echo Error: Please run this script from the project root directory
    exit /b 1
)

if not exist "src" (
    echo Error: Please run this script from the project root directory
    exit /b 1
)

REM Build the project first
echo.
echo === Building Project ===
echo Running: npm run build
call npm run build
if errorlevel 1 (
    echo Build failed!
    exit /b 1
)

REM Create output directory
if not exist "output" mkdir output

echo.
echo === 1. LIST COMMANDS ===

echo Running: List all available RulePacks
call bin\promptshield list
if errorlevel 1 goto :error

echo Running: List rules from PII RulePack
call bin\promptshield list --rulepack rulepacks\pii.yaml
if errorlevel 1 goto :error

echo Running: List only enabled rules
call bin\promptshield list --enabled-only
if errorlevel 1 goto :error

echo.
echo === 2. VALIDATE COMMANDS ===

echo Running: Validate sample JSON file
call bin\promptshield validate tests\fixtures\sample.json
if errorlevel 1 goto :error

echo Running: Validate with basic schema
call bin\promptshield validate tests\fixtures\sample.json --schema basic
if errorlevel 1 goto :error

echo Running: Validate with JSON output
call bin\promptshield validate tests\fixtures\sample.json --output json
if errorlevel 1 goto :error

echo.
echo === 3. SCAN COMMANDS - Basic Scanning ===

echo Running: Scan sample JSON file (default markdown output)
call bin\promptshield scan tests\fixtures\sample.json
if errorlevel 1 goto :error

echo Running: Scan with JSON output
call bin\promptshield scan tests\fixtures\sample.json --output json
if errorlevel 1 goto :error

echo Running: Scan with CSV output
call bin\promptshield scan tests\fixtures\sample.json --output csv
if errorlevel 1 goto :error

echo Running: Scan with table output
call bin\promptshield scan tests\fixtures\sample.json --output table
if errorlevel 1 goto :error

echo Running: Scan with HTML output
call bin\promptshield scan tests\fixtures\sample.json --output html
if errorlevel 1 goto :error

echo Running: Scan with NDJSON output
call bin\promptshield scan tests\fixtures\sample.json --output ndjson
if errorlevel 1 goto :error

echo.
echo === 4. SCAN COMMANDS - Advanced Options ===

echo Running: Scan with custom RulePack
call bin\promptshield scan tests\fixtures\sample.json --rulepack rulepacks\pii.yaml
if errorlevel 1 goto :error

echo Running: Scan with severity filtering
call bin\promptshield scan tests\fixtures\multiple-severities.json --severity high,medium
if errorlevel 1 goto :error

echo Running: Scan with category filtering
call bin\promptshield scan tests\fixtures\multiple-categories.json --category pii,bias
if errorlevel 1 goto :error

echo Running: Scan with output to file
call bin\promptshield scan tests\fixtures\sample.json --output json --output-file output\scan-result.json
if errorlevel 1 goto :error

echo.
echo === 5. SCAN COMMANDS - Performance & Large Files ===

echo Running: Scan large result set with streaming
call bin\promptshield scan tests\fixtures\large-result-set.json --output ndjson --output-file output\large-result.ndjson
if errorlevel 1 goto :error

echo Running: Scan with NDJSON input
call bin\promptshield scan tests\fixtures\large-result-set.ndjson --ndjson
if errorlevel 1 goto :error

echo Running: Scan with memory optimization
call bin\promptshield scan tests\fixtures\large-result-set.json --max-objects 100 --streaming-threshold 500
if errorlevel 1 goto :error

echo.
echo === 6. SCAN COMMANDS - Schema Validation ===

echo Running: Scan with basic schema validation
call bin\promptshield scan tests\fixtures\sample.json --schema basic
if errorlevel 1 goto :error

echo Running: Scan with extended schema validation
call bin\promptshield scan tests\fixtures\schema-extended.json --schema extended
if errorlevel 1 goto :error

echo.
echo === 7. SCAN COMMANDS - Debug & Verbose Options ===

echo Running: Scan with debug mode
call bin\promptshield scan tests\fixtures\sample.json --debug
if errorlevel 1 goto :error

echo Running: Scan with verbose output
call bin\promptshield scan tests\fixtures\sample.json --verbose
if errorlevel 1 goto :error

echo Running: Scan with quiet mode
call bin\promptshield scan tests\fixtures\sample.json --quiet
if errorlevel 1 goto :error

echo.
echo === 8. SCAN COMMANDS - Error Handling ===

echo Running: Scan malformed JSON (should show errors)
call bin\promptshield scan tests\fixtures\malformed.json
if errorlevel 1 goto :error

echo Running: Scan with strict mode
call bin\promptshield scan tests\fixtures\sample.json --strict
if errorlevel 1 goto :error

echo.
echo === 9. CREATE COMMANDS ===

echo Running: Create basic RulePack
call bin\promptshield create my-test-pack --template basic --description "Test RulePack" --category test
if errorlevel 1 goto :error

echo Running: Create PII RulePack
call bin\promptshield create my-pii-pack --template pii --description "PII Detection Pack" --category pii
if errorlevel 1 goto :error

echo.
echo === 10. UPDATE COMMANDS ===

echo Running: Update RulePacks
call bin\promptshield update
if errorlevel 1 goto :error

echo Running: Force update RulePacks
call bin\promptshield update --force
if errorlevel 1 goto :error

echo.
echo === 11. COMPREHENSIVE TEST SCENARIOS ===

echo Running: Test nested JSON scanning
call bin\promptshield scan tests\fixtures\nested.json --scan-entire-object --max-depth 3
if errorlevel 1 goto :error

echo Running: Test keyword-based scanning
call bin\promptshield scan tests\fixtures\keyword-test.json --rulepack rulepacks\pii.yaml
if errorlevel 1 goto :error

echo Running: Test compression scenarios
call bin\promptshield scan tests\fixtures\compression-test.json --compress gzip --compression-level 9
if errorlevel 1 goto :error

echo Running: Test multiple output formats
for %%f in (json markdown csv table html ndjson) do (
    echo Testing %%f output format...
    call bin\promptshield scan tests\fixtures\sample.json --output %%f --output-file output\test-%%f
    if errorlevel 1 goto :error
)

echo.
echo === 12. CLEANUP ===

echo Running: Cleaning up test RulePacks
del /f /q rulepacks\my-test-pack.yaml 2>nul
del /f /q rulepacks\my-pii-pack.yaml 2>nul

echo.
echo === 13. SUMMARY ===

echo All commands executed successfully!
echo Output files created in: output\
echo Test RulePacks cleaned up

REM Show output directory contents
echo.
echo Generated output files:
dir output\ 2>nul || echo No output files generated

echo.
echo ✅ All PromptShield commands tested successfully!
goto :end

:error
echo.
echo ❌ Command failed!
exit /b 1

:end
echo.
echo Script completed successfully.
