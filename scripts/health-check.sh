#!/bin/bash

# PlaneMail System Health Check Script
# This script verifies that all components of the PlaneMail system are working correctly

echo "🔍 PlaneMail System Health Check"
echo "================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a service is running
check_service() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "Checking $name... "
    
    if response=$(curl -s "$url" 2>/dev/null); then
        if [[ "$response" == *"$expected"* ]]; then
            echo -e "${GREEN}✅ OK${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  Unexpected response${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Failed${NC}"
        return 1
    fi
}

# Function to check if a port is in use
check_port() {
    local port=$1
    local service=$2
    
    echo -n "Checking $service (port $port)... "
    
    if lsof -ti:$port > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Running${NC}"
        return 0
    else
        echo -e "${RED}❌ Not running${NC}"
        return 1
    fi
}

# Check Redis
echo -e "${BLUE}📊 Infrastructure${NC}"
echo -n "Checking Redis... "
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
    redis_ok=1
else
    echo -e "${RED}❌ Failed${NC}"
    redis_ok=0
fi

echo ""

# Check services
echo -e "${BLUE}🚀 Services${NC}"
check_port 3001 "Queue Service"
queue_port=$?

if [ $queue_port -eq 0 ]; then
    check_service "Queue Service Health" "http://localhost:3001/health" "healthy"
    queue_health=$?
    
    check_service "Queue Service Stats" "http://localhost:3001/api/queue/stats" "success"
    queue_stats=$?
else
    queue_health=0
    queue_stats=0
fi

check_port 3000 "Web App"
web_port=$?

echo ""

# Check build system
echo -e "${BLUE}🔨 Build System${NC}"
echo -n "Checking shared package build... "
if npm run build -w @planemail/shared > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
    shared_build=1
else
    echo -e "${RED}❌ Failed${NC}"
    shared_build=0
fi

echo -n "Checking queue service build... "
if npm run build -w @planemail/queue-service > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
    queue_build=1
else
    echo -e "${RED}❌ Failed${NC}"
    queue_build=0
fi

echo ""

# Summary
echo -e "${BLUE}📋 Summary${NC}"
total_checks=7
passed_checks=0

[ $redis_ok -eq 1 ] && ((passed_checks++))
[ $queue_port -eq 0 ] && ((passed_checks++))
[ $queue_health -eq 0 ] && ((passed_checks++))
[ $queue_stats -eq 0 ] && ((passed_checks++))
[ $web_port -eq 0 ] && ((passed_checks++))
[ $shared_build -eq 1 ] && ((passed_checks++))
[ $queue_build -eq 1 ] && ((passed_checks++))

echo "Passed: $passed_checks/$total_checks checks"

if [ $passed_checks -eq $total_checks ]; then
    echo -e "${GREEN}🎉 All systems operational!${NC}"
    exit 0
elif [ $passed_checks -ge 5 ]; then
    echo -e "${YELLOW}⚠️  Most systems operational with minor issues${NC}"
    exit 0
else
    echo -e "${RED}❌ Multiple system failures detected${NC}"
    echo ""
    echo -e "${YELLOW}💡 Quick fixes:${NC}"
    [ $redis_ok -eq 0 ] && echo "  • Start Redis: brew services start redis"
    [ $queue_port -ne 0 ] && echo "  • Start Queue Service: npm run dev -w @planemail/queue-service"
    [ $web_port -ne 0 ] && echo "  • Start Web App: npm run dev -w nextn"
    exit 1
fi
