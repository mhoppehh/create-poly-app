#!/bin/bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test configuration
TEST_DIR="/test-workspace"
RESULTS_DIR="${TEST_DIR}/results"
TIMEOUT=600  # 10 minutes

# Create results directory
mkdir -p "${RESULTS_DIR}"

# Test scenarios configuration
declare -A TEST_SCENARIOS=(
    ["basic-react"]="react-webapp vite"
    ["react-tailwind"]="react-webapp vite tailwind"
    ["fullstack-basic"]="react-webapp graphql-api vite apollo-server"
    ["fullstack-with-client"]="react-webapp graphql-api vite apollo-server graphql-client"
    ["prisma-app"]="react-webapp graphql-api vite apollo-server prisma"
    ["minimal-web"]="react-webapp vite developer-experience"
)

# Function to run a single test scenario
run_test_scenario() {
    local test_name="$1"
    local features="$2"
    local project_dir="${TEST_DIR}/${test_name}"
    local result_file="${RESULTS_DIR}/${test_name}.json"
    
    log_info "Running test scenario: ${test_name}"
    log_info "Features: ${features}"
    
    # Start timing
    local start_time=$(date +%s)
    
    # Create project directory
    rm -rf "${project_dir}"
    mkdir -p "${project_dir}"
    
    # Prepare test inputs (simulate interactive prompts)
    local inputs_file="${project_dir}/test-inputs.txt"
    cat > "${inputs_file}" << EOF
${test_name}
$(echo "${features}" | tr ' ' '\n')

y
EOF
    
    # Run create-poly-app with test inputs
    local generation_success=false
    local generation_error=""
    local generation_output=""
    
    if timeout ${TIMEOUT} create-poly-app < "${inputs_file}" > "${project_dir}/generation.log" 2>&1; then
        generation_success=true
        generation_output=$(cat "${project_dir}/generation.log")
        log_success "Project generation completed for ${test_name}"
    else
        generation_error="Project generation failed or timed out"
        generation_output=$(cat "${project_dir}/generation.log" 2>/dev/null || echo "No log available")
        log_error "${generation_error}"
    fi
    
    # Calculate generation time
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Initialize test result
    local test_result='{
        "scenario": "'${test_name}'",
        "features": "'${features}'",
        "generation": {
            "success": '${generation_success}',
            "duration": '${duration}',
            "error": "'${generation_error}'",
            "output_length": '$(echo -n "${generation_output}" | wc -c)'
        },
        "validations": {}
    }'
    
    # Run validations if generation was successful
    if [ "${generation_success}" = true ]; then
        local project_path="${project_dir}/${test_name}"
        
        if [ -d "${project_path}" ]; then
            log_info "Running validations for ${test_name}"
            
            # Structure validation
            run_validation "${test_name}" "structure" "${project_path}" "${result_file}"
            
            # Package installation test
            run_validation "${test_name}" "install" "${project_path}" "${result_file}"
            
            # Build test
            run_validation "${test_name}" "build" "${project_path}" "${result_file}"
            
            # Type checking test
            run_validation "${test_name}" "typecheck" "${project_path}" "${result_file}"
        else
            log_error "Generated project directory not found: ${project_path}"
            test_result=$(echo "${test_result}" | jq '.generation.success = false | .generation.error = "Project directory not found"')
        fi
    fi
    
    # Save final result
    echo "${test_result}" | jq '.' > "${result_file}"
    
    if [ "${generation_success}" = true ]; then
        log_success "Test scenario ${test_name} completed successfully"
        return 0
    else
        log_error "Test scenario ${test_name} failed"
        return 1
    fi
}

# Function to run a specific validation
run_validation() {
    local test_name="$1"
    local validation_type="$2"
    local project_path="$3"
    local result_file="$4"
    
    local start_time=$(date +%s)
    local success=false
    local error=""
    local output=""
    
    cd "${project_path}"
    
    case "${validation_type}" in
        "structure")
            log_info "  → Validating project structure"
            if validate_project_structure; then
                success=true
                output="Project structure is valid"
            else
                error="Invalid project structure"
                output=$(validate_project_structure 2>&1)
            fi
            ;;
            
        "install")
            log_info "  → Testing package installation"
            if timeout 300 pnpm install > install.log 2>&1; then
                success=true
                output="Packages installed successfully"
            else
                error="Package installation failed or timed out"
                output=$(cat install.log 2>/dev/null || echo "No install log available")
            fi
            ;;
            
        "build")
            log_info "  → Testing build process"
            if timeout 180 pnpm build > build.log 2>&1; then
                success=true
                output="Build completed successfully"
            else
                error="Build failed or timed out"
                output=$(cat build.log 2>/dev/null || echo "No build log available")
            fi
            ;;
            
        "typecheck")
            log_info "  → Testing type checking"
            if timeout 120 pnpm type-check > typecheck.log 2>&1; then
                success=true
                output="Type checking passed"
            else
                error="Type checking failed or timed out"
                output=$(cat typecheck.log 2>/dev/null || echo "No typecheck log available")
            fi
            ;;
    esac
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Update result file with validation result
    local validation_result='{
        "success": '${success}',
        "duration": '${duration}',
        "error": "'${error}'",
        "output_length": '$(echo -n "${output}" | wc -c)'
    }'
    
    # Use jq to update the result file
    jq --argjson validation "${validation_result}" \
       '.validations["'${validation_type}'"] = $validation' \
       "${result_file}" > "${result_file}.tmp" && mv "${result_file}.tmp" "${result_file}"
    
    if [ "${success}" = true ]; then
        log_success "  ✓ ${validation_type} validation passed"
    else
        log_error "  ✗ ${validation_type} validation failed: ${error}"
    fi
    
    cd - > /dev/null
}

# Function to validate project structure
validate_project_structure() {
    local required_files=("package.json" "pnpm-workspace.yaml")
    
    for file in "${required_files[@]}"; do
        if [ ! -f "${file}" ]; then
            echo "Missing required file: ${file}"
            return 1
        fi
    done
    
    # Check if package.json is valid JSON
    if ! jq . package.json > /dev/null 2>&1; then
        echo "Invalid package.json format"
        return 1
    fi
    
    # Check if workspaces are defined
    if ! jq -e '.workspaces' package.json > /dev/null; then
        echo "No workspaces defined in package.json"
        return 1
    fi
    
    return 0
}

# Function to generate summary report
generate_summary_report() {
    local summary_file="${RESULTS_DIR}/summary.json"
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    
    log_info "Generating summary report"
    
    # Initialize summary
    echo '{"timestamp": "'$(date -Iseconds)'", "results": [], "summary": {}}' > "${summary_file}"
    
    # Process each result file
    for result_file in "${RESULTS_DIR}"/*.json; do
        if [ "$(basename "${result_file}")" = "summary.json" ]; then
            continue
        fi
        
        if [ -f "${result_file}" ]; then
            total_tests=$((total_tests + 1))
            
            local generation_success=$(jq -r '.generation.success' "${result_file}")
            local all_validations_passed=true
            
            # Check if all validations passed
            local validation_keys=$(jq -r '.validations | keys[]' "${result_file}" 2>/dev/null || echo "")
            for key in ${validation_keys}; do
                local validation_success=$(jq -r ".validations.${key}.success" "${result_file}")
                if [ "${validation_success}" != "true" ]; then
                    all_validations_passed=false
                    break
                fi
            done
            
            if [ "${generation_success}" = "true" ] && [ "${all_validations_passed}" = "true" ]; then
                passed_tests=$((passed_tests + 1))
            else
                failed_tests=$((failed_tests + 1))
            fi
            
            # Add result to summary
            jq --slurpfile result "${result_file}" '.results += $result' "${summary_file}" > "${summary_file}.tmp" && mv "${summary_file}.tmp" "${summary_file}"
        fi
    done
    
    # Update summary statistics
    jq --arg total "${total_tests}" --arg passed "${passed_tests}" --arg failed "${failed_tests}" \
       '.summary = {"total": ($total | tonumber), "passed": ($passed | tonumber), "failed": ($failed | tonumber), "success_rate": (if ($total | tonumber) > 0 then (($passed | tonumber) / ($total | tonumber) * 100) else 0 end)}' \
       "${summary_file}" > "${summary_file}.tmp" && mv "${summary_file}.tmp" "${summary_file}"
    
    log_info "Summary: ${passed_tests}/${total_tests} tests passed"
    
    if [ "${failed_tests}" -eq 0 ]; then
        log_success "All tests passed!"
        return 0
    else
        log_error "${failed_tests} tests failed"
        return 1
    fi
}

# Main execution
main() {
    log_info "Starting integration tests"
    log_info "Test directory: ${TEST_DIR}"
    
    local overall_success=true
    
    # Run all test scenarios
    for test_name in "${!TEST_SCENARIOS[@]}"; do
        if ! run_test_scenario "${test_name}" "${TEST_SCENARIOS[${test_name}]}"; then
            overall_success=false
        fi
        echo "---"
    done
    
    # Generate summary report
    if ! generate_summary_report; then
        overall_success=false
    fi
    
    # Print final summary
    if [ "${overall_success}" = true ]; then
        log_success "All integration tests completed successfully"
        exit 0
    else
        log_error "Some integration tests failed"
        exit 1
    fi
}

# Install jq if not available
if ! command -v jq &> /dev/null; then
    log_info "Installing jq for JSON processing"
    apk add --no-cache jq
fi

# Run main function
main "$@"