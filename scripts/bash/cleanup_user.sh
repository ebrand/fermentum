#!/bin/bash

# Fermentum User Cleanup Script
# This script removes all records for a specific user across all tables

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection settings
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-fermentum}"
DB_USER="${DB_USER:-fermentum}"
DB_PASSWORD="${DB_PASSWORD:-dev_password_123}"

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [USER_ID|EMAIL]"
    echo ""
    echo "Examples:"
    echo "  $0 56a7427b-87e8-4af6-ba31-2aef83228956"
    echo "  $0 eric.d.brand@gmail.com"
    echo ""
    echo "This script will permanently delete ALL data for the specified user including:"
    echo "  - User record"
    echo "  - All tenant relationships"
    echo "  - All owned tenants and their breweries"
    echo "  - All employee records"
    echo "  - All invitations sent to/from the user"
    echo "  - All payment methods for owned tenants"
    echo ""
    echo "Environment variables:"
    echo "  DB_HOST     (default: localhost)"
    echo "  DB_PORT     (default: 5432)"
    echo "  DB_NAME     (default: fermentum)"
    echo "  DB_USER     (default: fermentum)"
    echo "  DB_PASSWORD (default: dev_password_123)"
}

# Function to validate UUID format
is_valid_uuid() {
    local uuid="$1"
    if [[ $uuid =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to validate email format
is_valid_email() {
    local email="$1"
    if [[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to get user ID from email
get_user_id_from_email() {
    local email="$1"
    local user_id

    user_id=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT \"UserId\" FROM \"User\" WHERE \"Email\" = '$email';" | tr -d ' ')

    if [[ -z "$user_id" ]]; then
        return 1
    fi

    echo "$user_id"
    return 0
}

# Function to get user info
get_user_info() {
    local user_id="$1"

    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
        "SELECT \"UserId\", \"Email\", \"FirstName\", \"LastName\" FROM \"User\" WHERE \"UserId\" = '$user_id';"
}

# Function to show what will be deleted
show_deletion_preview() {
    local user_id="$1"

    print_info "Analyzing data to be deleted for user: $user_id"

    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        -- Show user info
        SELECT 'USER RECORD:' as category, \"Email\", \"FirstName\", \"LastName\" FROM \"User\" WHERE \"UserId\" = '$user_id'
        UNION ALL
        -- Show tenant relationships
        SELECT 'TENANT RELATIONSHIPS:' as category,
               CONCAT(t.\"Name\", ' (', ut.\"Role\", ')') as \"Email\",
               CASE WHEN ut.\"IsActive\" THEN 'Active' ELSE 'Inactive' END as \"FirstName\",
               '' as \"LastName\"
        FROM \"User_Tenant\" ut
        JOIN \"Tenant\" t ON ut.\"TenantId\" = t.\"TenantId\"
        WHERE ut.\"UserId\" = '$user_id'
        UNION ALL
        -- Show owned tenants and breweries
        SELECT 'OWNED BREWERIES:' as category,
               CONCAT(t.\"Name\", ' / ', b.\"Name\") as \"Email\",
               '' as \"FirstName\",
               '' as \"LastName\"
        FROM \"User_Tenant\" ut
        JOIN \"Tenant\" t ON ut.\"TenantId\" = t.\"TenantId\"
        JOIN \"Brewery\" b ON t.\"TenantId\" = b.\"TenantId\"
        WHERE ut.\"UserId\" = '$user_id' AND ut.\"Role\" = 'owner'
        UNION ALL
        -- Show employee records
        SELECT 'EMPLOYEE RECORDS:' as category,
               CONCAT(e.\"FirstName\", ' ', e.\"LastName\") as \"Email\",
               CASE WHEN e.\"IsActive\" THEN 'Active' ELSE 'Inactive' END as \"FirstName\",
               '' as \"LastName\"
        FROM \"Employee\" e
        WHERE e.\"UserId\" = '$user_id';
    "
}

# Function to perform the cleanup
perform_cleanup() {
    local user_id="$1"
    local sql_file="$(dirname "$0")/../sql/cleanup_user.sql"

    if [[ ! -f "$sql_file" ]]; then
        print_error "SQL cleanup script not found: $sql_file"
        exit 1
    fi

    # Replace the placeholder with the actual user ID
    local temp_sql=$(mktemp)
    sed "s/USER_ID_PLACEHOLDER/$user_id/g" "$sql_file" > "$temp_sql"

    print_info "Executing cleanup script..."

    # Execute the cleanup
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$temp_sql"; then
        print_success "User cleanup completed successfully!"
    else
        print_error "Cleanup failed. Check the error messages above."
        rm -f "$temp_sql"
        exit 1
    fi

    # Clean up temp file
    rm -f "$temp_sql"
}

# Main script logic
main() {
    local identifier="$1"
    local user_id=""

    # Check if identifier was provided
    if [[ -z "$identifier" ]]; then
        print_error "No user identifier provided."
        show_usage
        exit 1
    fi

    # Check if it's a help request
    if [[ "$identifier" == "-h" || "$identifier" == "--help" ]]; then
        show_usage
        exit 0
    fi

    print_info "Fermentum User Cleanup Script"
    print_info "============================="

    # Determine if identifier is UUID or email
    if is_valid_uuid "$identifier"; then
        user_id="$identifier"
        print_info "Using provided User ID: $user_id"
    elif is_valid_email "$identifier"; then
        print_info "Looking up User ID for email: $identifier"
        if user_id=$(get_user_id_from_email "$identifier"); then
            print_info "Found User ID: $user_id"
        else
            print_error "No user found with email: $identifier"
            exit 1
        fi
    else
        print_error "Invalid identifier format. Must be a valid UUID or email address."
        show_usage
        exit 1
    fi

    # Verify user exists
    print_info "Verifying user exists..."
    if ! get_user_info "$user_id" | grep -q "$user_id"; then
        print_error "User with ID $user_id not found in database."
        exit 1
    fi

    # Show user info
    print_info "User found:"
    get_user_info "$user_id"

    # Show what will be deleted
    show_deletion_preview "$user_id"

    # Confirm deletion
    print_warning "This will PERMANENTLY DELETE all data for this user!"
    print_warning "This action cannot be undone."
    echo -n "Are you sure you want to proceed? (type 'yes' to confirm): "
    read -r confirmation

    if [[ "$confirmation" != "yes" ]]; then
        print_info "Cleanup cancelled."
        exit 0
    fi

    # Perform the cleanup
    perform_cleanup "$user_id"
}

# Run the main function
main "$@"