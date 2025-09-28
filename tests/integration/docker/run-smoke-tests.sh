#!/bin/bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Smoke test configuration
SMOKE_TESTS_DIR="/test-workspace/smoke-tests"
RESULTS_DIR="/test-workspace/smoke-results"
TIMEOUT=300  # 5 minutes per test

mkdir -p "${RESULTS_DIR}"

# Define smoke test scenarios (minimal validation)
declare -A SMOKE_SCENARIOS=(
    ["minimal-react"]="react-webapp vite"
    ["react-tailwind"]="react-webapp vite tailwind"
    ["basic-fullstack"]="react-webapp graphql-api vite apollo-server"
)

run_smoke_test() {
    local test_name="$1"
    local features="$2"
    local project_dir="${RESULTS_DIR}/${test_name}"
    
    log_info "Running smoke test: ${test_name}"
    
    rm -rf "${project_dir}"
    mkdir -p "${project_dir}"
    
    # Create minimal test inputs
    local inputs_file="${project_dir}/inputs.txt"
    cat > "${inputs_file}" << EOF
${test_name}
$(echo "${features}" | tr ' ' '\n')

y
EOF
    
    # Run create-poly-app
    local start_time=$(date +%s)
    if timeout ${TIMEOUT} create-poly-app < "${inputs_file}" > "${project_dir}/output.log" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_success "✓ ${test_name} generated successfully (${duration}s)"
        
        # Quick validation - check if main files exist
        local project_path="${project_dir}/${test_name}"
        if [ -f "${project_path}/package.json" ] && [ -f "${project_path}/pnpm-workspace.yaml" ]; then
            log_success "✓ ${test_name} structure validation passed"
            return 0
        else
            log_error "✗ ${test_name} missing essential files"
            return 1
        fi
    else
        log_error "✗ ${test_name} generation failed or timed out"
        return 1
    fi
}

main() {
    log_info "Starting smoke tests"
    
    local failed_tests=0
    local total_tests=${#SMOKE_SCENARIOS[@]}
    
    for test_name in "${!SMOKE_SCENARIOS[@]}"; do
        if ! run_smoke_test "${test_name}" "${SMOKE_SCENARIOS[${test_name}]}"; then
            failed_tests=$((failed_tests + 1))
        fi
        echo "---"
    done
    
    local passed_tests=$((total_tests - failed_tests))
    
    log_info "Smoke test results: ${passed_tests}/${total_tests} passed"
    
    if [ "${failed_tests}" -eq 0 ]; then
        log_success "All smoke tests passed!"
        exit 0
    else
        log_error "${failed_tests} smoke tests failed"
        exit 1
    fi
}

# Install jq if needed
if ! command -v jq &> /dev/null; then
    apk add --no-cache jq
fi

main "$@"