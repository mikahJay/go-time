# Makefile to install and start all services for local development

AUTH_DIR=services/auth-server
RESOURCE_DIR=services/resource-server
APP_DIR=app

AUTH_PORT?=3000
RESOURCE_PORT?=4000
VITE_PORT?=5173

.PHONY: install-all install-auth install-resource install-app start-all start-auth start-resource start-app

install-all: install-auth install-resource install-app

install-auth:
	cd $(AUTH_DIR) && npm install

install-resource:
	cd $(RESOURCE_DIR) && npm install

install-app:
	cd $(APP_DIR) && npm install

start-all: start-auth start-resource start-app

# Run tests for each service
test-all: test-auth test-resource test-app

test-auth:
	@echo "Running auth-server tests"
	@npm --prefix $(AUTH_DIR) test -- --coverage

test-resource:
	@echo "Running resource-server tests"
	@npm --prefix $(RESOURCE_DIR) test -- --coverage

test-app:
	@echo "Running app tests"
	@npm --prefix $(APP_DIR) test -- --coverage

# Start auth-server on $(AUTH_PORT)
start-auth:
	@echo "Starting auth-server on port $(AUTH_PORT)"
	(cd $(AUTH_DIR) && PORT=$(AUTH_PORT) npm start) &

# Start resource-server on $(RESOURCE_PORT)
start-resource:
	@echo "Starting resource-server on port $(RESOURCE_PORT)"
	(cd $(RESOURCE_DIR) && PORT=$(RESOURCE_PORT) npm start) &

# Start app (Vite) on $(VITE_PORT)
start-app:
	@echo "Starting React app (Vite) on port $(VITE_PORT)"
	(cd $(APP_DIR) && npm run dev -- --port $(VITE_PORT)) &

# Stop background services started by this Makefile (POSIX)
# This uses pkill to terminate node and vite processes by command match.
# On Windows, run the corresponding Task Manager/PowerShell commands or use WSL/Git Bash.
stop-all:
	@echo "Stopping auth-server, resource-server, and Vite (POSIX)"
	-pkill -f "services/auth-server/server.js" || true
	-pkill -f "services/resource-server/server.js" || true
	-pkill -f "vite" || true

# Convenience: bring everything up after installing deps
up: install-all start-all

# Note: This Makefile assumes a POSIX-like shell. On Windows use WSL, Git Bash, or run commands individually.
