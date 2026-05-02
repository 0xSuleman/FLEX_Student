#!/usr/bin/env bash
# ============================================================================
# Integration tests: Faculty <-> Student end-to-end flow against live backend.
#
# Pre-req:  docker compose up -d  (Spring backend + MySQL must be healthy)
# Run:      ./test-faculty-student-flow.sh
#
# Tests cover: auth (good + bad), role gating, faculty endpoints,
# the full BLE attendance lifecycle (open -> student polls -> mark ->
# idempotent re-mark -> close -> persistence visible to student).
# ============================================================================

API="http://localhost:${API_PORT:-8090}/api"
PASS=0
FAIL=0
FAILED_NAMES=()

# ---- helpers ---------------------------------------------------------------
RED=$'\033[31m'; GREEN=$'\033[32m'; YEL=$'\033[33m'; CYAN=$'\033[36m'; DIM=$'\033[2m'; RST=$'\033[0m'

assert() {
  local desc="$1"; local cond="$2"
  if eval "$cond" >/dev/null 2>&1; then
    printf "  ${GREEN}PASS${RST}  %s\n" "$desc"
    PASS=$((PASS+1))
  else
    printf "  ${RED}FAIL${RST}  %s\n" "$desc"
    FAIL=$((FAIL+1))
    FAILED_NAMES+=("$desc")
  fi
}

# Pull a JSON value via python3. Usage: jget '<json>' '["key"]'  or  '[0]["nested"]'
jget() {
  python3 -c '
import sys, json
try:
  d = json.loads(sys.argv[1] or "null")
  print(eval("d" + sys.argv[2]))
except Exception:
  sys.exit(1)
' "$1" "$2" 2>/dev/null
}

section() { printf "\n${CYAN}=== %s ===${RST}\n" "$*"; }

http_status() { echo "$1" | head -n1 | awk '{print $2}'; }

# Curl that returns "<status>\n<body>"
api() {
  local method="$1" path="$2" token="${3:-}" body="${4:-}"
  local args=(-s -o /tmp/_resp.json -w "%{http_code}" -X "$method" "$API$path"
              -H "Content-Type: application/json")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  [ -n "$body" ]  && args+=(-d "$body")
  local code; code=$(curl "${args[@]}")
  echo "$code"
  cat /tmp/_resp.json
}

# ---- preflight -------------------------------------------------------------
section "Preflight"
PING=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{}')
if [ "$PING" = "000" ]; then
  echo "  ${RED}!! Backend at $API is unreachable. Run: docker compose up -d${RST}"
  exit 2
fi
echo "  Backend reachable (login probe returned $PING)"

# Wipe any leftover OPEN sessions from prior runs by closing them via DB?
# Skipping — close logic is idempotent on already-closed sessions, and a
# fresh `docker compose down -v && up --build` gives a clean slate.

# ============================================================================
section "1. Faculty login"
# ============================================================================
RESP=$(curl -s -X POST "$API/auth/staff-login" -H 'Content-Type: application/json' \
  -d '{"username":"zeeshan.rana","password":"password123","role":"faculty"}')
FAC_TOKEN=$(jget "$RESP" '["token"]')
FAC_NAME=$(jget "$RESP" '["name"]')
FAC_ROLE=$(jget "$RESP" '["role"]')
assert "Faculty login returns a non-empty token"        "[ -n '$FAC_TOKEN' ] && [ '$FAC_TOKEN' != 'None' ]"
assert "Faculty role claim is FACULTY"                  "[ '$FAC_ROLE' = 'FACULTY' ]"
assert "Faculty profile name is Zeeshan Ali Rana"        "[ '$FAC_NAME' = 'Zeeshan Ali Rana' ]"
echo "  ${DIM}Faculty token prefix: ${FAC_TOKEN:0:24}...${RST}"

# Also pull the second faculty so we can later test ownership rejection.
RESP=$(curl -s -X POST "$API/auth/staff-login" -H 'Content-Type: application/json' \
  -d '{"username":"hammad.afzal","password":"password123","role":"faculty"}')
FAC2_TOKEN=$(jget "$RESP" '["token"]')
assert "Second faculty (hammad.afzal) login succeeds"   "[ -n '$FAC2_TOKEN' ] && [ '$FAC2_TOKEN' != 'None' ]"

# ============================================================================
section "2. Student login"
# ============================================================================
RESP=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"rollNumber":"24L-3072","password":"password123"}')
STU_TOKEN=$(jget "$RESP" '["token"]')
STU_NAME=$(jget "$RESP" '["name"]')
STU_SECTION=$(jget "$RESP" '["section"]')
assert "Student 24L-3072 login returns a token"         "[ -n '$STU_TOKEN' ] && [ '$STU_TOKEN' != 'None' ]"
assert "Student is in section BSE-243A"                 "[ '$STU_SECTION' = 'BSE-243A' ]"
echo "  ${DIM}Student: $STU_NAME ($STU_SECTION)${RST}"

# Different student (24L-3091) should be in a *different* section (BSE-243C),
# so any session for BSE-243A must NOT appear in their open-sessions list.
RESP=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"rollNumber":"24L-3091","password":"student123"}')
STU2_TOKEN=$(jget "$RESP" '["token"]')
STU2_SECTION=$(jget "$RESP" '["section"]')
assert "Other student 24L-3091 login succeeds"          "[ -n '$STU2_TOKEN' ] && [ '$STU2_TOKEN' != 'None' ]"
assert "Other student is in a *different* section"      "[ '$STU2_SECTION' != '$STU_SECTION' ]"

# ============================================================================
section "3. Bad credentials"
# ============================================================================
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"rollNumber":"24L-3072","password":"wrong"}')
assert "Wrong student password returns non-2xx"         "[ '$CODE' != '200' ] && [ '$CODE' != '201' ]"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/staff-login" -H 'Content-Type: application/json' \
  -d '{"username":"zeeshan.rana","password":"wrong","role":"faculty"}')
assert "Wrong faculty password returns non-2xx"         "[ '$CODE' != '200' ] && [ '$CODE' != '201' ]"

# ============================================================================
section "4. Faculty endpoints — own data"
# ============================================================================
RESP=$(curl -s -H "Authorization: Bearer $FAC_TOKEN" "$API/faculty/me")
assert "GET /faculty/me works for FACULTY"              "echo '$RESP' | grep -q 'zeeshan.rana'"

RESP=$(curl -s -H "Authorization: Bearer $FAC_TOKEN" "$API/faculty/courses?semester=Spring%202026")
COURSE_COUNT=$(echo "$RESP" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))' 2>/dev/null)
assert "Faculty has at least one assigned section"      "[ -n '$COURSE_COUNT' ] && [ '$COURSE_COUNT' -ge 1 ]"

# Find Zeeshan's CS3001 BSE-243A section ID — that's where 24L-3072 is enrolled.
FAC_SECTION_ID=$(echo "$RESP" | python3 -c '
import sys, json
arr = json.load(sys.stdin)
for s in arr:
  if s.get("courseCode") == "CS3001" and s.get("section") == "BSE-243A":
    print(s["id"]); break
' 2>/dev/null)
assert "Faculty owns CS3001 · BSE-243A"                 "[ -n '$FAC_SECTION_ID' ]"
echo "  ${DIM}facultySectionId = $FAC_SECTION_ID${RST}"

RESP=$(curl -s -H "Authorization: Bearer $FAC_TOKEN" "$API/faculty/sections/$FAC_SECTION_ID/roster")
ROSTER_COUNT=$(echo "$RESP" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))' 2>/dev/null)
assert "Roster for own section returns >=1 student"     "[ -n '$ROSTER_COUNT' ] && [ '$ROSTER_COUNT' -ge 1 ]"
assert "Roster includes 24L-3072"                       "echo '$RESP' | grep -q '24L-3072'"

# ============================================================================
section "5. Role gating"
# ============================================================================
CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $STU_TOKEN" "$API/faculty/courses")
assert "Student token is REJECTED by /api/faculty/*"    "[ '$CODE' = '403' ]"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $FAC_TOKEN" "$API/student/attendance/open-sessions")
assert "Faculty token is REJECTED by /api/student/*"    "[ '$CODE' = '403' ] || [ '$CODE' = '500' ]"

# Hammad does NOT own Zeeshan's section — should be rejected.
CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $FAC2_TOKEN" "$API/faculty/sections/$FAC_SECTION_ID/roster")
assert "Other faculty cannot read someone else's roster" "[ '$CODE' = '403' ] || [ '$CODE' = '500' ]"

# ============================================================================
section "6. BLE attendance — initial state"
# ============================================================================
RESP=$(curl -s -H "Authorization: Bearer $STU_TOKEN" "$API/student/attendance/open-sessions")
INIT_COUNT=$(echo "$RESP" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))' 2>/dev/null)
echo "  ${DIM}Pre-test open sessions for student: $INIT_COUNT${RST}"

# ============================================================================
section "7. Faculty opens an attendance session"
# ============================================================================
OPEN_RESP=$(curl -s -X POST "$API/faculty/attendance/sessions" \
  -H "Authorization: Bearer $FAC_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"facultySectionId\":$FAC_SECTION_ID,\"topic\":\"INTEGRATION TEST · iterative models\",\"durationMinutes\":15}")
SESSION_ID=$(jget "$OPEN_RESP" '["id"]')
SESSION_STATUS=$(jget "$OPEN_RESP" '["status"]')
SESSION_TOKEN=$(jget "$OPEN_RESP" '["sessionToken"]')
assert "POST /faculty/attendance/sessions returns id"   "[ -n '$SESSION_ID' ] && [ '$SESSION_ID' != 'None' ]"
assert "New session status = OPEN"                      "[ '$SESSION_STATUS' = 'OPEN' ]"
assert "Session token has BLE- prefix"                  "echo '$SESSION_TOKEN' | grep -q '^BLE-'"
echo "  ${DIM}sessionId = $SESSION_ID  token = $SESSION_TOKEN${RST}"

# ============================================================================
section "8. Student sees the open session in their poll"
# ============================================================================
RESP=$(curl -s -H "Authorization: Bearer $STU_TOKEN" "$API/student/attendance/open-sessions")
NEW_COUNT=$(echo "$RESP" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))' 2>/dev/null)
assert "Student now sees one more open session"         "[ -n '$NEW_COUNT' ] && [ '$NEW_COUNT' -gt $INIT_COUNT ]"
assert "Open session lists CS3001 / BSE-243A"           "echo '$RESP' | grep -q '\"courseCode\":\"CS3001\"' && echo '$RESP' | grep -q '\"section\":\"BSE-243A\"'"
assert "Student is NOT yet marked"                      "echo '$RESP' | grep -q '\"alreadyMarked\":false'"

# Other student (different section) should NOT see this session.
RESP2=$(curl -s -H "Authorization: Bearer $STU2_TOKEN" "$API/student/attendance/open-sessions")
HAS_LEAK=$(echo "$RESP2" | python3 -c "
import sys, json
arr = json.load(sys.stdin)
print('YES' if any(s.get('sessionId') == int('$SESSION_ID') for s in arr) else 'NO')
" 2>/dev/null)
assert "Student in different section does NOT see this session" "[ '$HAS_LEAK' = 'NO' ]"

# ============================================================================
section "9. Student marks attendance"
# ============================================================================
RESP=$(curl -s -X POST "$API/student/attendance/mark" \
  -H "Authorization: Bearer $STU_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"sessionId\":$SESSION_ID}")
MARKED=$(jget "$RESP" '["alreadyMarked"]')
assert "Mark request returns alreadyMarked=true"        "[ '$MARKED' = 'True' ]"

# ============================================================================
section "10. Idempotency — re-mark must not duplicate"
# ============================================================================
RESP=$(curl -s -X POST "$API/student/attendance/mark" \
  -H "Authorization: Bearer $STU_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"sessionId\":$SESSION_ID}")
MARKED=$(jget "$RESP" '["alreadyMarked"]')
assert "Re-marking still returns alreadyMarked=true"    "[ '$MARKED' = 'True' ]"

# After mark, the open-sessions poll should still list it but flagged marked.
RESP=$(curl -s -H "Authorization: Bearer $STU_TOKEN" "$API/student/attendance/open-sessions")
assert "After marking, alreadyMarked flips to true in poll" "echo '$RESP' | grep -q '\"alreadyMarked\":true'"

# ============================================================================
section "11. Other student (different section) cannot mark this session"
# ============================================================================
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/student/attendance/mark" \
  -H "Authorization: Bearer $STU2_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"sessionId\":$SESSION_ID}")
assert "Non-enrolled student gets 403/500 on mark"      "[ '$CODE' = '403' ] || [ '$CODE' = '500' ]"

# ============================================================================
section "12. Faculty closes the session"
# ============================================================================
RESP=$(curl -s -X POST "$API/faculty/attendance/sessions/$SESSION_ID/close" \
  -H "Authorization: Bearer $FAC_TOKEN" -H 'Content-Type: application/json' \
  -d '{"marks":[]}')
CLOSED_STATUS=$(jget "$RESP" '["status"]')
CLOSED_AT=$(jget "$RESP" '["closedAt"]')
assert "Close response status = CLOSED"                 "[ '$CLOSED_STATUS' = 'CLOSED' ]"
assert "closedAt is populated"                          "[ -n '$CLOSED_AT' ] && [ '$CLOSED_AT' != 'None' ]"

# After close, the session should disappear from the student's open-sessions.
RESP=$(curl -s -H "Authorization: Bearer $STU_TOKEN" "$API/student/attendance/open-sessions")
STILL_OPEN=$(echo "$RESP" | python3 -c "
import sys, json
arr = json.load(sys.stdin)
print('YES' if any(s.get('sessionId') == int('$SESSION_ID') for s in arr) else 'NO')
" 2>/dev/null)
assert "Closed session disappears from student poll"     "[ '$STILL_OPEN' = 'NO' ]"

# ============================================================================
section "13. Marking a CLOSED session is rejected"
# ============================================================================
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/student/attendance/mark" \
  -H "Authorization: Bearer $STU_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"sessionId\":$SESSION_ID}")
assert "Marking after close returns non-2xx"            "[ '$CODE' != '200' ]"

# ============================================================================
section "14. Persistence — student sees the new lecture in their attendance"
# ============================================================================
RESP=$(curl -s -H "Authorization: Bearer $STU_TOKEN" "$API/attendance?semester=Spring%202026")
# Look for CS3001 entry that contains a record with method Bluetooth.
HAS_BLE=$(echo "$RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
def find():
  for course in data:
    if course.get('courseCode') != 'CS3001': continue
    for r in course.get('records', []):
      if r.get('method') == 'Bluetooth' and r.get('presence') == 'P':
        return True
  return False
print('YES' if find() else 'NO')
" 2>/dev/null)
assert "Student attendance log shows new BLE-marked lecture" "[ '$HAS_BLE' = 'YES' ]"

# Other student (different section) attendance for CS3001 should NOT be marked
# Bluetooth Present from this session — they weren't even in the same section.
RESP2=$(curl -s -H "Authorization: Bearer $STU2_TOKEN" "$API/attendance?semester=Spring%202026")
ABSENT_COUNT=$(echo "$RESP2" | python3 -c "
import sys, json
data = json.load(sys.stdin)
n = 0
for course in data:
  for r in course.get('records', []):
    if r.get('method') == 'Auto' and r.get('presence') == 'A':
      n += 1
print(n)
" 2>/dev/null)
echo "  ${DIM}Other student (different section) auto-absent rows: $ABSENT_COUNT${RST}"
# This is informational, not a strict assertion — depends on whether the other
# student is in any section of one of Zeeshan's courses.

# ============================================================================
section "15. Faculty close is idempotent on a closed session"
# ============================================================================
RESP=$(curl -s -X POST "$API/faculty/attendance/sessions/$SESSION_ID/close" \
  -H "Authorization: Bearer $FAC_TOKEN" -H 'Content-Type: application/json' \
  -d '{"marks":[]}')
SECOND_STATUS=$(jget "$RESP" '["status"]')
assert "Re-closing returns CLOSED (idempotent)"         "[ '$SECOND_STATUS' = 'CLOSED' ]"

# ============================================================================
section "16. Live session marks endpoint (powers BLE polling)"
# ============================================================================
RESP=$(curl -s -X POST "$API/faculty/attendance/sessions" \
  -H "Authorization: Bearer $FAC_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"facultySectionId\":$FAC_SECTION_ID,\"topic\":\"LIVE MARKS TEST\",\"durationMinutes\":15}")
LIVE_SID=$(jget "$RESP" '["id"]')
assert "Second session opens with new id"                "[ -n '$LIVE_SID' ] && [ '$LIVE_SID' != '$SESSION_ID' ]"

RESP=$(curl -s -H "Authorization: Bearer $FAC_TOKEN" "$API/faculty/attendance/sessions/$LIVE_SID/marks")
PRE_MARKED=$(echo "$RESP" | python3 -c "
import sys, json
arr = json.load(sys.stdin)
print(sum(1 for m in arr if m.get('presence')))
" 2>/dev/null)
assert "Live-marks snapshot starts with 0 marked"        "[ '$PRE_MARKED' = '0' ]"

curl -s -o /dev/null -X POST "$API/student/attendance/mark" \
  -H "Authorization: Bearer $STU_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"sessionId\":$LIVE_SID}"

RESP=$(curl -s -H "Authorization: Bearer $FAC_TOKEN" "$API/faculty/attendance/sessions/$LIVE_SID/marks")
POST_MARKED=$(echo "$RESP" | python3 -c "
import sys, json
arr = json.load(sys.stdin)
print(sum(1 for m in arr if m.get('presence') == 'P' and m.get('method') == 'Bluetooth'))
" 2>/dev/null)
assert "Live-marks snapshot now shows 1 BLE-marked student" "[ '$POST_MARKED' = '1' ]"

LIVE_LEN=$(echo "$RESP" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))' 2>/dev/null)
assert "Live snapshot covers every enrolled student"     "[ -n '$LIVE_LEN' ] && [ '$LIVE_LEN' -eq $ROSTER_COUNT ]"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $FAC2_TOKEN" "$API/faculty/attendance/sessions/$LIVE_SID/marks")
assert "Other faculty cannot read someone else's live marks" "[ '$CODE' = '403' ] || [ '$CODE' = '500' ]"

curl -s -o /dev/null -X POST "$API/faculty/attendance/sessions/$LIVE_SID/close" \
  -H "Authorization: Bearer $FAC_TOKEN" -H 'Content-Type: application/json' -d '{"marks":[]}'

# ============================================================================
section "17. Manual attendance flow (open → close with explicit marks)"
# ============================================================================
RESP=$(curl -s -X POST "$API/faculty/attendance/sessions" \
  -H "Authorization: Bearer $FAC_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"facultySectionId\":$FAC_SECTION_ID,\"topic\":\"MANUAL TEST\",\"durationMinutes\":5}")
MAN_SID=$(jget "$RESP" '["id"]')
assert "Manual session opens"                            "[ -n '$MAN_SID' ] && [ '$MAN_SID' != 'None' ]"

ENROLL_IDS=$(curl -s -H "Authorization: Bearer $FAC_TOKEN" "$API/faculty/sections/$FAC_SECTION_ID/roster" \
  | python3 -c "import sys,json;print(' '.join(str(r['enrollmentId']) for r in json.load(sys.stdin)))" 2>/dev/null)

MARKS_JSON=$(python3 -c "
import json, sys
ids = sys.argv[1].split()
marks = []
for i, eid in enumerate(ids):
  marks.append({'enrollmentId': int(eid), 'presence': 'A' if i == 0 else 'P', 'method': 'Manual'})
print(json.dumps({'marks': marks}))
" "$ENROLL_IDS" 2>/dev/null)

RESP=$(curl -s -X POST "$API/faculty/attendance/sessions/$MAN_SID/close" \
  -H "Authorization: Bearer $FAC_TOKEN" -H 'Content-Type: application/json' -d "$MARKS_JSON")
MAN_STATUS=$(jget "$RESP" '["status"]')
assert "Manual session closes successfully"              "[ '$MAN_STATUS' = 'CLOSED' ]"

RESP=$(curl -s -H "Authorization: Bearer $STU_TOKEN" "$API/attendance?semester=Spring%202026")
HAS_MAN=$(echo "$RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
def find():
  for course in data:
    if course.get('courseCode') != 'CS3001': continue
    for r in course.get('records', []):
      if r.get('method') == 'Manual':
        return True
  return False
print('YES' if find() else 'NO')
" 2>/dev/null)
assert "Student sees a Manual-method record after close"  "[ '$HAS_MAN' = 'YES' ]"

# ============================================================================
section "M1. HOD login"
# ============================================================================
RESP=$(curl -s -X POST "$API/auth/staff-login" -H 'Content-Type: application/json' \
  -d '{"username":"hod.cs","password":"password123","role":"hod"}')
HOD_TOKEN=$(jget "$RESP" '["token"]')
HOD_ROLE=$(jget "$RESP" '["role"]')
assert "HOD login returns a non-empty token"            "[ -n '$HOD_TOKEN' ] && [ '$HOD_TOKEN' != 'None' ]"
assert "HOD role claim is HOD"                          "[ '$HOD_ROLE' = 'HOD' ]"

# ============================================================================
section "M2. Faculty defines marks instruments"
# ============================================================================
cat > /tmp/_inst.json <<'JSON'
{
  "instruments": [
    {"id": null, "category": "QUIZ",        "name": "Quiz 1",      "displayOrder": 0,
      "components": [{"id": null, "name": "Q1", "maxMarks": 10, "weightage": 10, "displayOrder": 0}]},
    {"id": null, "category": "ASSIGNMENT",  "name": "Assignment 1","displayOrder": 1,
      "components": [{"id": null, "name": "Q1", "maxMarks": 20, "weightage": 10, "displayOrder": 0}]},
    {"id": null, "category": "SESSIONAL_1", "name": "Sessional 1", "displayOrder": 2,
      "components": [{"id": null, "name": "Q1", "maxMarks": 25, "weightage": 15, "displayOrder": 0}]},
    {"id": null, "category": "SESSIONAL_2", "name": "Sessional 2", "displayOrder": 3,
      "components": [{"id": null, "name": "Q1", "maxMarks": 25, "weightage": 15, "displayOrder": 0}]},
    {"id": null, "category": "FINAL",       "name": "Final Exam",  "displayOrder": 4,
      "components": [{"id": null, "name": "Q1", "maxMarks": 50, "weightage": 50, "displayOrder": 0}]}
  ]
}
JSON
CODE=$(curl -s -o /tmp/_resp.json -w "%{http_code}" -X PUT "$API/faculty/sections/$FAC_SECTION_ID/marks/instruments" \
  -H "Authorization: Bearer $FAC_TOKEN" -H 'Content-Type: application/json' \
  -d @/tmp/_inst.json)
RESP=$(cat /tmp/_resp.json)
echo "  ${DIM}DEBUG: HTTP=$CODE FAC_SECTION_ID=$FAC_SECTION_ID body_len=${#RESP}${RST}"
[ "$CODE" != "200" ] && echo "  ${YEL}body: ${RESP:0:300}${RST}"
INS_COUNT=$(echo "$RESP" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)["instruments"]))' 2>/dev/null)
assert "Saved 5 instruments back"                        "[ '$INS_COUNT' = '5' ]"
QUIZ_PUBLISHED=$(echo "$RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for ins in d['instruments']:
  if ins['category']=='QUIZ' and ins['publishState']=='PUBLISHED':
    print('YES'); break
else: print('NO')" 2>/dev/null)
assert "Mid-sem (QUIZ) auto-publishes on save (req 3.4.4)" "[ '$QUIZ_PUBLISHED' = 'YES' ]"
FINAL_DRAFT=$(echo "$RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for ins in d['instruments']:
  if ins['category']=='FINAL' and ins['publishState']=='DRAFT':
    print('YES'); break
else: print('NO')" 2>/dev/null)
assert "FINAL stays DRAFT until HOD approves (req 3.4.5)"  "[ '$FINAL_DRAFT' = 'YES' ]"

# Capture every component's ID + maxMarks so we can fill all 5 instruments —
# the grade-submission gate requires no missing scores anywhere.
ALL_COMPS=$(echo "$RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
out=[]
for ins in d['instruments']:
  for c in ins['components']:
    out.append(f\"{c['id']}:{c['maxMarks']}\")
print(','.join(out))" 2>/dev/null)
QUIZ_COMP_ID=$(echo "$RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for ins in d['instruments']:
  if ins['name']=='Quiz 1':
    print(ins['components'][0]['id']); break" 2>/dev/null)
FINAL_COMP_ID=$(echo "$RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for ins in d['instruments']:
  if ins['category']=='FINAL':
    print(ins['components'][0]['id']); break" 2>/dev/null)
assert "Captured 5 component IDs"                        "[ \$(echo '$ALL_COMPS' | tr ',' '\n' | wc -l | tr -d ' ') = '5' ]"

# Need an enrollment ID for our test student (24L-3072, in this section).
ROSTER=$(curl -s -H "Authorization: Bearer $FAC_TOKEN" "$API/faculty/sections/$FAC_SECTION_ID/roster")
ENROLL_ID=$(echo "$ROSTER" | python3 -c "
import sys,json
arr=json.load(sys.stdin)
for r in arr:
  if r.get('rollNo')=='24L-3072':
    print(r['enrollmentId']); break" 2>/dev/null)
assert "Found enrollment ID for 24L-3072"                "[ -n '$ENROLL_ID' ]"

# ============================================================================
section "M3. Faculty enters mid-sem + final scores for our student"
# ============================================================================
ROSTER_IDS=$(echo "$ROSTER" | python3 -c '
import sys,json
print(",".join(str(r["enrollmentId"]) for r in json.load(sys.stdin)))' 2>/dev/null)
SCORE_BODY=$(python3 -c "
import json
ids='$ROSTER_IDS'.split(',')
comps=[(int(p.split(':')[0]), float(p.split(':')[1])) for p in '$ALL_COMPS'.split(',')]
scores=[]
for i, eid in enumerate(ids):
  for cid, mx in comps:
    # Score = 70-95% of max, varied per (student, component)
    obt = round(mx * (0.70 + 0.05 * ((i + cid) % 6)), 1)
    scores.append({'componentId': cid, 'enrollmentId': int(eid), 'obtained': obt})
print(json.dumps({'scores': scores}))
")
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$API/faculty/sections/$FAC_SECTION_ID/marks/scores" \
  -H "Authorization: Bearer $FAC_TOKEN" -H 'Content-Type: application/json' \
  -d "$SCORE_BODY")
assert "PUT scores returns 204"                          "[ '$CODE' = '204' ]"

# ============================================================================
section "M4. Student sees mid-sem only (req 3.4.4 / 3.4.5)"
# ============================================================================
RESP=$(curl -s -H "Authorization: Bearer $STU_TOKEN" "$API/marks?semester=Spring%202026")
HAS_QUIZ=$(echo "$RESP" | python3 -c "
import sys,json
data=json.load(sys.stdin)
for c in data:
  if c['courseCode']!='CS3001': continue
  for e in c.get('evaluations', []):
    if e.get('evaluationType')=='QUIZ' and e.get('obtained') is not None:
      print('YES'); sys.exit()
print('NO')" 2>/dev/null)
HAS_FINAL=$(echo "$RESP" | python3 -c "
import sys,json
data=json.load(sys.stdin)
for c in data:
  if c['courseCode']!='CS3001': continue
  for e in c.get('evaluations', []):
    if e.get('evaluationType')=='FINAL' and 'Final Exam · Q1' in (e.get('evaluationName') or ''):
      print('YES'); sys.exit()
print('NO')" 2>/dev/null)
assert "Student sees QUIZ marks immediately"             "[ '$HAS_QUIZ' = 'YES' ]"
assert "Student does NOT see FINAL row pre-approval"     "[ '$HAS_FINAL' = 'NO' ]"

# ============================================================================
section "M5. Excel template download + structure validation"
# ============================================================================
TEMPL_FILE=$(mktemp -t marks-template.XXXXXX.xlsx)
HTTP_CODE=$(curl -s -o "$TEMPL_FILE" -w "%{http_code}" \
  -H "Authorization: Bearer $FAC_TOKEN" \
  "$API/faculty/sections/$FAC_SECTION_ID/marks/template")
assert "GET /marks/template returns 200"                 "[ '$HTTP_CODE' = '200' ]"
assert "Template is a real xlsx (PK header)"             "head -c 2 '$TEMPL_FILE' | grep -q 'PK'"
assert "Template file size > 5 KB"                       "[ \$(wc -c < '$TEMPL_FILE') -gt 5000 ]"

# Tampered file = a random non-template xlsx → must be rejected by 4.5.4 logic.
TAMPER_FILE=$(mktemp -t bad-upload.XXXXXX.xlsx)
printf 'PKnotreallyanxlsx' > "$TAMPER_FILE"
RESP=$(curl -s -X POST "$API/faculty/sections/$FAC_SECTION_ID/marks/upload" \
  -H "Authorization: Bearer $FAC_TOKEN" -F "file=@$TAMPER_FILE")
TAMPER_OK=$(echo "$RESP" | python3 -c 'import sys,json
try: print(json.load(sys.stdin).get("ok"))
except: print("err")' 2>/dev/null)
assert "Tampered/non-xlsx upload rejected (req 4.5.4)"   "[ '$TAMPER_OK' = 'False' ] || [ '$TAMPER_OK' = 'err' ]"

# Round-trip: upload the freshly-downloaded template back unchanged → must succeed.
RESP=$(curl -s -X POST "$API/faculty/sections/$FAC_SECTION_ID/marks/upload" \
  -H "Authorization: Bearer $FAC_TOKEN" -F "file=@$TEMPL_FILE")
ROUND_OK=$(echo "$RESP" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("ok"))' 2>/dev/null)
assert "Untouched template round-trip succeeds"          "[ '$ROUND_OK' = 'True' ]"
rm -f "$TEMPL_FILE" "$TAMPER_FILE"

# ============================================================================
section "M6. Faculty submits grade list to HOD"
# ============================================================================
PREV=$(curl -s -H "Authorization: Bearer $FAC_TOKEN" "$API/faculty/sections/$FAC_SECTION_ID/grades")
TOTAL_W=$(echo "$PREV" | python3 -c 'import sys,json;print(json.load(sys.stdin)["totalWeight"])' 2>/dev/null)
assert "Grade preview shows total weight = 100"          "[ '$TOTAL_W' = '100.0' ]"
READY=$(echo "$PREV" | python3 -c 'import sys,json;print(json.load(sys.stdin)["readyToSubmit"])' 2>/dev/null)
# Some non-test-student rows may have missing scores; we filled scores for everyone above
# so this should be true. If false, dump blockers for diagnosis.
if [ "$READY" != "True" ]; then
  echo "  ${YEL}!! readyToSubmit=$READY · blockers:$(echo "$PREV" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("blockers"))')${RST}"
fi
assert "Grade list ready to submit"                      "[ '$READY' = 'True' ]"

SUBMIT=$(curl -s -X POST "$API/faculty/sections/$FAC_SECTION_ID/grades/submit" \
  -H "Authorization: Bearer $FAC_TOKEN")
SUB_STATE=$(echo "$SUBMIT" | python3 -c 'import sys,json;print(json.load(sys.stdin)["state"])' 2>/dev/null)
assert "Submission state is SUBMITTED"                   "[ '$SUB_STATE' = 'SUBMITTED' ]"

# ============================================================================
section "M7. HOD sees pending submission and approves"
# ============================================================================
PENDING=$(curl -s -H "Authorization: Bearer $HOD_TOKEN" "$API/hod/grade-approvals")
SUB_ID=$(echo "$PENDING" | python3 -c "
import sys,json
arr=json.load(sys.stdin)
for it in arr:
  if it['list']['sectionId']==$FAC_SECTION_ID:
    print(it['submissionId']); break" 2>/dev/null)
assert "HOD sees our submission in pending list"         "[ -n '$SUB_ID' ]"

DECISION=$(curl -s -X POST "$API/hod/grade-approvals/$SUB_ID/approve" \
  -H "Authorization: Bearer $HOD_TOKEN" -H 'Content-Type: application/json' \
  -d '{"remarks":"Looks good"}')
DEC_STATE=$(echo "$DECISION" | python3 -c 'import sys,json;print(json.load(sys.stdin)["state"])' 2>/dev/null)
assert "HOD approval flips state to APPROVED"            "[ '$DEC_STATE' = 'APPROVED' ]"

# ============================================================================
section "M8. Student now sees FINAL row + final grade"
# ============================================================================
RESP=$(curl -s -H "Authorization: Bearer $STU_TOKEN" "$API/marks?semester=Spring%202026")
HAS_FINAL=$(echo "$RESP" | python3 -c "
import sys,json
data=json.load(sys.stdin)
for c in data:
  if c['courseCode']!='CS3001': continue
  for e in c.get('evaluations', []):
    if e.get('evaluationType')=='FINAL' and 'Final Exam · Q1' in (e.get('evaluationName') or ''):
      print('YES'); sys.exit()
print('NO')" 2>/dev/null)
assert "Student now sees FINAL row post-approval"        "[ '$HAS_FINAL' = 'YES' ]"

# ============================================================================
section "W1. Withdrawal flow — student → faculty → HOD"
# ============================================================================
# Pre-state: student must have a course in the section. We use 24L-3072 / CS3001.
# Submit withdrawal as the student.
WITHDRAW_RESP=$(curl -s -X POST "$API/requests/withdraw" \
  -H "Authorization: Bearer $STU_TOKEN" \
  -F 'courses=["CS3001"]')
assert "Student withdraw POST returned a message"        "echo '$WITHDRAW_RESP' | grep -q 'message'"

# Faculty sees the pending withdrawal.
FAC_W=$(curl -s -H "Authorization: Bearer $FAC_TOKEN" "$API/faculty/withdrawals")
W_ID=$(echo "$FAC_W" | python3 -c "
import sys,json
arr=json.load(sys.stdin)
for w in arr:
  if w.get('studentRollNo')=='24L-3072' and w.get('courseCode')=='CS3001':
    print(w['id']); break" 2>/dev/null)
assert "Faculty sees the pending withdrawal"             "[ -n '$W_ID' ]"

# Faculty recommends APPROVE → routes to HOD.
RECO=$(curl -s -X POST "$API/faculty/withdrawals/$W_ID/recommend" \
  -H "Authorization: Bearer $FAC_TOKEN" -H 'Content-Type: application/json' \
  -d '{"action":"APPROVE","remarks":"Medical case verified"}')
RECO_STATE=$(echo "$RECO" | python3 -c 'import sys,json;print(json.load(sys.stdin)["state"])' 2>/dev/null)
assert "Faculty Approve forwards to HOD (state=PENDING_HOD)" "[ '$RECO_STATE' = 'PENDING_HOD' ]"

# HOD sees it.
HOD_W=$(curl -s -H "Authorization: Bearer $HOD_TOKEN" "$API/hod/withdrawals")
HOD_HAS=$(echo "$HOD_W" | python3 -c "
import sys,json
arr=json.load(sys.stdin)
print('YES' if any(w.get('id')==$W_ID for w in arr) else 'NO')" 2>/dev/null)
assert "HOD sees the forwarded withdrawal"               "[ '$HOD_HAS' = 'YES' ]"

# HOD approves.
HOD_DEC=$(curl -s -X POST "$API/hod/withdrawals/$W_ID/decide" \
  -H "Authorization: Bearer $HOD_TOKEN" -H 'Content-Type: application/json' \
  -d '{"action":"APPROVE","remarks":"Approved"}')
HOD_STATE=$(echo "$HOD_DEC" | python3 -c 'import sys,json;print(json.load(sys.stdin)["state"])' 2>/dev/null)
assert "HOD Approve flips state to APPROVED"             "[ '$HOD_STATE' = 'APPROVED' ]"

# Student-side: enrollment grade should be 'W' on the affected course.
STU_ENR=$(curl -s -H "Authorization: Bearer $STU_TOKEN" "$API/enrollments?semester=Spring+2026")
HAS_W=$(echo "$STU_ENR" | python3 -c "
import sys,json
arr=json.load(sys.stdin)
for e in arr:
  if e.get('courseCode')=='CS3001' and e.get('grade')=='W':
    print('YES'); sys.exit()
print('NO')" 2>/dev/null)
assert "Student CS3001 enrollment marked grade=W"        "[ '$HAS_W' = 'YES' ]"

# ============================================================================
section "R1. Retake flow — student → HOD"
# ============================================================================
# Submit retake as student (CS3002 SESSIONAL_1, since CS3001 is now W).
RET_RESP=$(curl -s -X POST "$API/requests/retake" \
  -H "Authorization: Bearer $STU_TOKEN" \
  -F 'semester=Spring 2026' -F 'evalType=SESSIONAL_1' -F 'courses=["CS3002"]' \
  -F 'reason=Was sick during sessional')
assert "Student retake POST returned a message"          "echo '$RET_RESP' | grep -q 'message'"

# HOD sees it.
HOD_R=$(curl -s -H "Authorization: Bearer $HOD_TOKEN" "$API/hod/retakes")
RET_ID=$(echo "$HOD_R" | python3 -c "
import sys,json
arr=json.load(sys.stdin)
for r in arr:
  if r.get('studentRollNo')=='24L-3072' and r.get('courseCode')=='CS3002':
    print(r['id']); break" 2>/dev/null)
assert "HOD sees the pending retake request"             "[ -n '$RET_ID' ]"

# HOD approves.
RET_DEC=$(curl -s -X POST "$API/hod/retakes/$RET_ID/decide" \
  -H "Authorization: Bearer $HOD_TOKEN" -H 'Content-Type: application/json' \
  -d '{"action":"APPROVE","remarks":"OK"}')
RET_STATE=$(echo "$RET_DEC" | python3 -c 'import sys,json;print(json.load(sys.stdin)["status"])' 2>/dev/null)
assert "HOD Approve flips retake to APPROVED"            "[ '$RET_STATE' = 'APPROVED' ]"

# ============================================================================
section "X1. Faculty timetable + feedback summary"
# ============================================================================
TT=$(curl -s -H "Authorization: Bearer $FAC_TOKEN" "$API/faculty/timetable?semester=Spring%202026")
TT_COUNT=$(echo "$TT" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))' 2>/dev/null)
assert "Faculty timetable returns >=1 row"               "[ '$TT_COUNT' -ge 1 ]"

FB=$(curl -s -H "Authorization: Bearer $FAC_TOKEN" "$API/faculty/feedback?semester=Spring%202026")
FB_COUNT=$(echo "$FB" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))' 2>/dev/null)
assert "Faculty feedback returns >=1 section row"        "[ '$FB_COUNT' -ge 1 ]"
assert "Feedback row has ratingHistogram + responseRate" "echo '$FB' | python3 -c \"import sys,json;f=json.load(sys.stdin)[0];[f[k] for k in ('ratingHistogram','responseRate','averageRating')]\""

# ============================================================================
section "X2. HOD overview endpoints"
# ============================================================================
HOD_DASH=$(curl -s -H "Authorization: Bearer $HOD_TOKEN" "$API/hod/dashboard")
assert "HOD dashboard has all expected counters"         "echo '$HOD_DASH' | python3 -c \"import sys,json;d=json.load(sys.stdin);[d[k] for k in ('pendingGradeApprovals','pendingWithdrawals','pendingRetakes','totalSections','totalFaculty','currentSemester')]\""

HOD_SEC=$(curl -s -H "Authorization: Bearer $HOD_TOKEN" "$API/hod/sections")
HOD_SEC_COUNT=$(echo "$HOD_SEC" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))' 2>/dev/null)
assert "HOD sections returns >=1"                        "[ '$HOD_SEC_COUNT' -ge 1 ]"

HOD_MON=$(curl -s -H "Authorization: Bearer $HOD_TOKEN" "$API/hod/monitoring")
HOD_MON_COUNT=$(echo "$HOD_MON" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))' 2>/dev/null)
assert "HOD monitoring returns >=1 row with avgAttendance" "[ '$HOD_MON_COUNT' -ge 1 ]"

# ============================================================================
section "X3. Cross-role gating"
# ============================================================================
CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $FAC_TOKEN" "$API/hod/withdrawals")
assert "Faculty token rejected on /api/hod/*"            "[ '$CODE' = '403' ]"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $HOD_TOKEN" "$API/faculty/withdrawals")
assert "HOD token rejected on /api/faculty/*"            "[ '$CODE' = '403' ]"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $STU_TOKEN" "$API/hod/dashboard")
assert "Student token rejected on /api/hod/*"            "[ '$CODE' = '403' ]"

# ============================================================================
# Summary
# ============================================================================
TOTAL=$((PASS+FAIL))
printf "\n${CYAN}=== Summary ===${RST}\n"
printf "  ${GREEN}PASS: %d${RST}\n" "$PASS"
printf "  ${RED}FAIL: %d${RST}\n" "$FAIL"
printf "  TOTAL: %d\n" "$TOTAL"
if [ "$FAIL" -gt 0 ]; then
  printf "\n${RED}Failures:${RST}\n"
  for f in "${FAILED_NAMES[@]}"; do
    printf "  - %s\n" "$f"
  done
  exit 1
fi
printf "\n${GREEN}All tests passed.${RST}\n"
