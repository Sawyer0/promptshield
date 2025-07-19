@echo off
REM Comprehensive Test Runner for PromptShield CLI Commands (Windows)
REM Tests all commands using examples and rulepacks files

setlocal enabledelayedexpansion

REM Configuration
set EXAMPLES_DIR=examples
set RULEPACKS_DIR=rulepacks
set OUTPUT_DIR=tests\fixtures\output
set LOG_FILE=test-results.log

REM Ensure output directory exists
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

echo 🚀 PromptShield Command Test Suite
echo ==================================
echo.

REM Clear log file
echo. > "%LOG_FILE%"

echo 📋 Test Categories:
echo 1. Basic Scanning Tests
echo 2. Output Format Tests
echo 3. Filtering Tests
echo 4. Processing Options Tests
echo 5. List Command Tests
echo 6. Init Command Tests
echo 7. Error Handling Tests
echo 8. Performance Tests
echo 9. Integration Tests
echo.

REM Function to run a test
:run_test
set test_name=%~1
set command=%~2

echo Testing: %test_name%
%command% >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ %test_name%
    echo ✅ %test_name% >> "%LOG_FILE%"
) else (
    echo ❌ %test_name%
    echo ❌ %test_name% >> "%LOG_FILE%"
)
goto :eof

REM =============================================================================
REM 1. BASIC SCANNING TESTS
REM =============================================================================
echo 🔍 1. Basic Scanning Tests
echo ------------------------------------------------

call :run_test "Scan sample-data.json with PII rules" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --output json"
call :run_test "Scan ai_output.txt with PII rules" "npx promptshield scan \"%EXAMPLES_DIR%\ai_output.txt\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --output json"
call :run_test "Scan prompt-injection-attacks.json with prompt-injection rules" "npx promptshield scan \"%EXAMPLES_DIR%\prompt-injection-attacks.json\" --rulepack \"%RULEPACKS_DIR%\prompt-injection.yaml\" --output json"
call :run_test "Scan hamed-test.json with hamed.yaml rules" "npx promptshield scan \"%EXAMPLES_DIR%\hamed-test.json\" --rulepack \"%EXAMPLES_DIR%\hamed.yaml\" --output json"
call :run_test "Scan real-world-injections.json with prompt-injection rules" "npx promptshield scan \"%EXAMPLES_DIR%\real-world-injections.json\" --rulepack \"%RULEPACKS_DIR%\prompt-injection.yaml\" --output json"

REM =============================================================================
REM 2. OUTPUT FORMAT TESTS
REM =============================================================================
echo 📄 2. Output Format Tests
echo ------------------------------------------------

call :run_test "Output JSON format" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --output json"
call :run_test "Output Markdown format" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --output markdown"
call :run_test "Output CSV format" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --output csv"
call :run_test "Output to file" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --output json --output-file \"%OUTPUT_DIR%\test-output.json\""

REM =============================================================================
REM 3. FILTERING TESTS
REM =============================================================================
echo 🔍 3. Filtering Tests
echo ------------------------------------------------

call :run_test "Filter by severity (high)" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --severity high --output json"
call :run_test "Filter by category (pii)" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --category pii --output json"
call :run_test "Limit violations" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --max-violations 2 --output json"
call :run_test "Pagination test" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --offset 0 --limit 5 --output json"

REM =============================================================================
REM 4. PROCESSING OPTIONS TESTS
REM =============================================================================
echo ⚙️  4. Processing Options Tests
echo ------------------------------------------------

call :run_test "Scan specific fields" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --fields prompt,response --output json"
call :run_test "Scan entire object" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --scan-entire-object --output json"
call :run_test "NDJSON mode" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --ndjson --output json"
call :run_test "Max depth setting" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --max-depth 3 --output json"

REM =============================================================================
REM 5. LIST COMMAND TESTS
REM =============================================================================
echo 📋 5. List Command Tests
echo ------------------------------------------------

call :run_test "List all rulepacks" "npx promptshield list"
call :run_test "List rules from specific rulepack" "npx promptshield list --rulepack \"%RULEPACKS_DIR%\pii.yaml\""
call :run_test "Filter by category" "npx promptshield list --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --category pii"
call :run_test "Filter by severity" "npx promptshield list --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --severity high"
call :run_test "Show only enabled rules" "npx promptshield list --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --enabled-only"

REM =============================================================================
REM 6. INIT COMMAND TESTS
REM =============================================================================
echo 🆕 6. Init Command Tests
echo ------------------------------------------------

call :run_test "Create basic rulepack" "npx promptshield init \"%OUTPUT_DIR%\test-basic.yaml\" --template basic"
call :run_test "Create PII rulepack" "npx promptshield init \"%OUTPUT_DIR%\test-pii.yaml\" --template pii"
call :run_test "Create security rulepack" "npx promptshield init \"%OUTPUT_DIR%\test-security.yaml\" --template security"
call :run_test "Create bias rulepack" "npx promptshield init \"%OUTPUT_DIR%\test-bias.yaml\" --template bias"
call :run_test "Create compliance rulepack" "npx promptshield init \"%OUTPUT_DIR%\test-compliance.yaml\" --template compliance"
call :run_test "Create with description" "npx promptshield init \"%OUTPUT_DIR%\test-desc.yaml\" --template basic --description \"Test rulepack\""
call :run_test "Create with category" "npx promptshield init \"%OUTPUT_DIR%\test-cat.yaml\" --template basic --category \"test\""
call :run_test "Force overwrite" "npx promptshield init \"%OUTPUT_DIR%\test-force.yaml\" --template basic --force"
call :run_test "Verbose output" "npx promptshield init \"%OUTPUT_DIR%\test-verbose.yaml\" --template basic --verbose"
call :run_test "Quiet output" "npx promptshield init \"%OUTPUT_DIR%\test-quiet.yaml\" --template basic --quiet"

REM =============================================================================
REM 7. ERROR HANDLING TESTS
REM =============================================================================
echo 🚨 7. Error Handling Tests
echo ------------------------------------------------

call :run_test "Handle non-existent input file" "npx promptshield scan \"non-existent-file.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --output json"
call :run_test "Handle non-existent rulepack" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"non-existent-rulepack.yaml\" --output json"
call :run_test "Handle invalid severity" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --severity invalid --output json"
call :run_test "Handle invalid category" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --category invalid --output json"

REM =============================================================================
REM 8. PERFORMANCE TESTS
REM =============================================================================
echo ⚡ 8. Performance Tests
echo ------------------------------------------------

call :run_test "Large file processing" "npx promptshield scan \"%EXAMPLES_DIR%\hamed-test.json\" --rulepack \"%EXAMPLES_DIR%\hamed.yaml\" --output json"
call :run_test "Parallel processing" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --parallel --output json"
call :run_test "Streaming threshold" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --streaming-threshold 1 --output json"
call :run_test "Memory warning threshold" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --memory-warning-threshold 0.5 --output json"

REM =============================================================================
REM 9. INTEGRATION TESTS
REM =============================================================================
echo 🔗 9. Integration Tests
echo ------------------------------------------------

call :run_test "Multiple rulepacks test" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --output json && npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\bias.yaml\" --output json"
call :run_test "Compression test" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --output json --output-file \"%OUTPUT_DIR%\compressed.json.gz\" --compress gzip"
call :run_test "Stdin input test" "echo Hello! My email is john.doe@company.com and SSN is 123-45-6789 | npx promptshield scan - --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --output json"
call :run_test "Quiet mode test" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --quiet --output json"
call :run_test "Verbose mode test" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --verbose --output json"
call :run_test "Debug mode test" "npx promptshield scan \"%EXAMPLES_DIR%\sample-data.json\" --rulepack \"%RULEPACKS_DIR%\pii.yaml\" --debug --output json"

REM =============================================================================
REM SUMMARY
REM =============================================================================
echo.
echo 📊 Test Summary
echo ==================

REM Count results (simple approach for Windows)
set /a total_tests=0
set /a passed_tests=0
set /a failed_tests=0

for /f "tokens=*" %%i in ('findstr /c:"Testing:" "%LOG_FILE%" 2^>nul') do set /a total_tests+=1
for /f "tokens=*" %%i in ('findstr /c:"✅" "%LOG_FILE%" 2^>nul') do set /a passed_tests+=1
for /f "tokens=*" %%i in ('findstr /c:"❌" "%LOG_FILE%" 2^>nul') do set /a failed_tests+=1

echo Total tests run: %total_tests%
echo Passed: %passed_tests%
echo Failed: %failed_tests%

if %failed_tests% equ 0 (
    echo 🎉 All tests passed!
    exit /b 0
) else (
    echo ❌ Some tests failed. Check %LOG_FILE% for details.
    echo.
    echo Failed tests:
    findstr /c:"❌" "%LOG_FILE%" 2>nul || echo No failed tests found in log
    exit /b 1
)
