#!/bin/sh

# Color definitions for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to display help information
show_help() {
    echo "${YELLOW}=====================================${NC}"
    echo "  PROJECT HELPER SCRIPT"
    echo "${YELLOW}=====================================${NC}"
    echo ""
    echo "Usage: ./1.ops/helper.sh <category> <action>"
    echo "Or:    ./1.ops/helper.sh --help | -h"
    echo ""
    echo "Categories:"
    echo "  ${GREEN}dev${NC}    - Development tasks"
    echo "  ${GREEN}build${NC}  - Build process tasks"
    echo "  ${GREEN}cicd${NC}   - CI/CD pipeline tasks"
    echo ""
    echo "Actions for '${GREEN}dev${NC}':"
    echo "  start-server   - Starts the live development server."
    echo "  watch-sass     - Watches Sass files for changes (not implemented yet)."
    echo "  watch-tailwind - Watches Tailwind CSS for changes (not implemented yet)."
    echo ""
    echo "Actions for '${GREEN}build${NC}':"
    echo "  compile-sass   - Compiles Sass to CSS (not implemented yet)."
    echo "  build-tailwind - Compiles Tailwind CSS (not implemented yet)."
    echo "  minify-js      - Minifies JavaScript (not implemented yet)."
    echo "  minify-css     - Minifies CSS (not implemented yet)."
    echo ""
    echo "Actions for '${GREEN}cicd${NC}':"
    echo "  lint           - Runs the linter (not implemented yet)."
    echo "  test           - Runs tests (not implemented yet)."
    echo "  deploy         - Deploys to production (not implemented yet)."
    echo ""
}

# Check for help flag or insufficient arguments
if [ "$#" -eq 0 ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

# Assign arguments to variables
category="$1"
action="$2"

# Process the category and action
case "$category" in
    dev)
        case "$action" in
            start-server)
                echo "Starting live server..."
                if [ -f ./1.ops/build.sh ]; then
                    sh ./1.ops/build.sh start
                else
                    echo "${RED}Error: build.sh not found in 1.ops/${NC}" >&2
                    exit 1
                fi
                ;;
            watch-sass)
                echo "${YELLOW}Watching Sass... (Not implemented yet)${NC}"
                echo "Example: sass --watch 3.sass:."
                ;;
            watch-tailwind)
                echo "${YELLOW}Watching Tailwind CSS... (Not implemented yet)${NC}"
                echo "Example: npx tailwindcss -i ./input.css -o ./output.css --watch"
                ;;
            *)
                echo "${RED}Invalid dev action: $action${NC}" >&2
                show_help
                exit 1
                ;;
        esac
        ;;
    build)
        case "$action" in
            compile-sass)
                echo "${YELLOW}Sass compilation is not implemented yet.${NC}"
                ;;
            build-tailwind)
                echo "${YELLOW}Building Tailwind CSS... (Not implemented yet)${NC}"
                echo "Example: npx tailwindcss -i ./input.css -o ./output.css --minify"
                ;;
            minify-js)
                echo "${YELLOW}JavaScript minification is not implemented yet.${NC}"
                ;;
            minify-css)
                echo "${YELLOW}CSS minification is not implemented yet.${NC}"
                ;;
            *)
                echo "${RED}Invalid build action: $action${NC}" >&2
                show_help
                exit 1
                ;;
        esac
        ;;
    cicd)
        case "$action" in
            lint)
                echo "${YELLOW}Linter is not implemented yet.${NC}"
                ;;
            test)
                echo "${YELLOW}Tests are not implemented yet.${NC}"
                ;;
            deploy)
                echo "${YELLOW}Deployment is not implemented yet.${NC}"
                ;;
            *)
                echo "${RED}Invalid CI/CD action: $action${NC}" >&2
                show_help
                exit 1
                ;;
        esac
        ;;
    *)
        echo "${RED}Invalid category: $category${NC}" >&2
        show_help
        exit 1
        ;;
esac
