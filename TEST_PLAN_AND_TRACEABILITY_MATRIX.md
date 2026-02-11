# Test Plan & Traceability Matrix
**Project**: ERPNext Promise Calculator UI  
**Version**: 1.0  
**Date**: February 5, 2026  
**Test Framework**: Playwright + Python (pytest)

---

## 1. TEST PLAN

### 1.1 Test Objectives
- Verify the OTP Promise Calculator functions correctly across multiple browsers and devices
- Ensure data validation and error handling work as expected
- Validate integration between frontend and backend APIs
- Confirm UI responsiveness across different screen resolutions
- Test end-to-end user journeys for manual and sales order workflows

### 1.2 Scope

#### In Scope:
- ✅ Promise Calculator page functionality
- ✅ Manual order entry workflow
- ✅ Sales Order ID lookup workflow
- ✅ Item code validation
- ✅ Date picker and weekend exclusion logic
- ✅ API integration (mocked in CI)
- ✅ Results display and calculations
- ✅ Cross-browser compatibility (Chrome, Firefox)
- ✅ Responsive design (Desktop, Tablet, Mobile)

#### Out of Scope:
- ❌ Backend API implementation tests
- ❌ Database integration tests
- ❌ Performance/load testing
- ❌ Security/penetration testing
- ❌ Accessibility compliance (WCAG)

### 1.3 Test Strategy

#### Test Types:
1. **Smoke Tests** - Basic page load and critical path validation
2. **Component Tests** - Individual UI component behavior and edge cases
3. **Journey Tests** - End-to-end user workflow scenarios
4. **Cross-Browser Tests** - Chrome and Firefox compatibility
5. **Responsive Tests** - Desktop, Tablet, and Mobile resolutions

#### Test Execution:
- **Local**: Run on developer machine before commits
- **CI/CD**: Automated execution on GitHub Actions
- **Manual**: Exploratory testing for new features

### 1.4 Test Environment

| Environment | Configuration |
|-------------|---------------|
| **Local** | Windows 10/11, Node.js 18+, Python 3.11+ |
| **CI/CD** | Ubuntu Latest, GitHub Actions |
| **Browsers** | Chrome (latest), Firefox (latest) |
| **Resolutions** | Desktop (1920×1080), Tablet (768×1024), Mobile (375×667) |
| **Tunnel** | Ngrok (for local app testing in CI) |

### 1.5 Test Schedule

| Phase | Activity | Duration |
|-------|----------|----------|
| **Phase 1** | Smoke Tests | Continuous |
| **Phase 2** | Component Tests | Per feature |
| **Phase 3** | Journey Tests | Per sprint |
| **Phase 4** | Regression Tests | Before release |
| **Phase 5** | Cross-Browser Tests | Weekly |

### 1.6 Test Deliverables
- ✅ Test cases (Python test files)
- ✅ Test execution reports (Allure reports)
- ✅ Bug reports (GitHub Issues)
- ✅ Traceability matrix (this document)
- ✅ CI/CD pipeline configuration

### 1.7 Entry/Exit Criteria

#### Entry Criteria:
- Development environment set up
- Application builds successfully
- Test data/mocks available
- Test environment accessible

#### Exit Criteria:
- All test cases executed
- Pass rate ≥ 95%
- All critical/blocker bugs fixed
- Test reports generated and reviewed

---

## 2. TRACEABILITY MATRIX

### 2.1 Smoke Tests (Basic Functionality)

| Test ID | Test Case | Requirement | Test Method | File | Status |
|---------|-----------|-------------|-------------|------|--------|
| SMK-01 | App loads and displays page | FR-001 | Automated | `journeys.py::test_smoke_01` | ✅ Pass |
| SMK-02 | Sidebar visible on desktop | FR-002 | Automated | `journeys.py::test_smoke_02` | ✅ Pass |
| SMK-03 | API health badge shows status | FR-003 | Automated | `journeys.py::test_smoke_03` | ✅ Pass |
| SMK-04 | Promise Calculator heading visible | FR-004 | Automated | `journeys.py::test_smoke_04` | ✅ Pass |

**Requirements Coverage**: 4/4 (100%)

---

### 2.2 Journey Tests (End-to-End Workflows)

#### 2.2.1 Journey A: Manual Order Entry

| Test ID | Test Case | Requirement | Test Method | File | Status |
|---------|-----------|-------------|-------------|------|--------|
| JRN-A-01 | Complete manual order flow with multiple items | FR-010, FR-011, FR-012 | Automated | `journeys.py::test_journey_01` | ✅ Pass |
| JRN-A-02 | Manual order with single item and evaluate | FR-010, FR-012 | Automated | `journeys.py::test_journey_02` | ✅ Pass |
| JRN-A-03 | Manual order with different warehouses | FR-010, FR-013 | Automated | `journeys.py::test_journey_03` | ✅ Pass |

**Requirements Coverage**: FR-010, FR-011, FR-012, FR-013 (4/4 = 100%)

#### 2.2.2 Journey B: From Sales Order ID

| Test ID | Test Case | Requirement | Test Method | File | Status |
|---------|-----------|-------------|-------------|------|--------|
| JRN-B-01 | Load sales order and evaluate | FR-020, FR-021 | Automated | `journeys.py::test_journey_04` | ✅ Pass |
| JRN-B-02 | Switch between sales orders | FR-020, FR-022 | Automated | `journeys.py::test_journey_05` | ✅ Pass |
| JRN-B-03 | Clear sales order selection | FR-020, FR-023 | Automated | `journeys.py::test_journey_06` | ✅ Pass |
| JRN-B-04 | Auto-fill items from sales order | FR-020, FR-024 | Automated | `journeys.py::test_journey_07` | ✅ Pass |

**Requirements Coverage**: FR-020, FR-021, FR-022, FR-023, FR-024 (5/5 = 100%)

---

### 2.3 Component Tests (UI Components & Edge Cases)

#### 2.3.1 Calendar Component

| Test ID | Test Case | Requirement | Test Method | File | Status |
|---------|-----------|-------------|-------------|------|--------|
| CMP-CAL-01 | Weekends highlighted and disabled | FR-030 | Automated | `components.py::test_calendar_01` | ✅ Pass |
| CMP-CAL-02 | No weekends toggle functional | FR-031 | Automated | `components.py::test_calendar_02` | ✅ Pass |
| CMP-CAL-03 | No weekends affects calculation | FR-031 | Automated | `components.py::test_calendar_03` | ✅ Pass |
| CMP-CAL-04 | Date selection reflected in form | FR-032 | Automated | `components.py::test_calendar_04` | ✅ Pass |

**Requirements Coverage**: FR-030, FR-031, FR-032 (3/3 = 100%)

#### 2.3.2 Sales Order Combobox

| Test ID | Test Case | Requirement | Test Method | File | Status |
|---------|-----------|-------------|-------------|------|--------|
| CMP-CMB-01 | Open dropdown and view all sales orders | FR-040 | Automated | `components.py::test_combobox_01` | ✅ Pass |
| CMP-CMB-02 | Sales order IDs sorted numerically | FR-041 | Automated | `components.py::test_combobox_02` | ✅ Pass |
| CMP-CMB-03 | Filter dropdown by typing | FR-042 | Automated | `components.py::test_combobox_03` | ✅ Pass |
| CMP-CMB-04 | Clear selection removes value | FR-043 | Automated | `components.py::test_combobox_04` | ✅ Pass |

**Requirements Coverage**: FR-040, FR-041, FR-042, FR-043 (4/4 = 100%)

#### 2.3.3 Item Code Input Field

| Test ID | Test Case | Requirement | Test Method | File | Status |
|---------|-----------|-------------|-------------|------|--------|
| CMP-ITM-01 | Valid item code accepted | FR-050 | Automated | `components.py::test_item_input_01` | ✅ Pass |
| CMP-ITM-02 | Multiple valid codes added | FR-050 | Automated | `components.py::test_item_input_02` | ✅ Pass |
| CMP-ITM-03 | Invalid code rejected | FR-051 | Automated | `components.py::test_item_input_03` | ✅ Pass |
| CMP-ITM-04 | All valid codes accepted | FR-050 | Automated | `components.py::test_item_input_04` | ✅ Pass |

**Requirements Coverage**: FR-050, FR-051 (2/2 = 100%)

#### 2.3.4 Results Panel

| Test ID | Test Case | Requirement | Test Method | File | Status |
|---------|-----------|-------------|-------------|------|--------|
| CMP-RES-01 | Promise date displayed | FR-060 | Automated | `components.py::test_results_01` | ✅ Pass |
| CMP-RES-02 | Confidence level displayed | FR-061 | Automated | `components.py::test_results_02` | ✅ Pass |
| CMP-RES-03 | Fulfillment status displayed | FR-062 | Automated | `components.py::test_results_03` | ✅ Pass |

**Requirements Coverage**: FR-060, FR-061, FR-062 (3/3 = 100%)

---

### 2.4 Cross-Browser Tests

| Test ID | Browser | Resolution | Test Suite | Status |
|---------|---------|------------|------------|--------|
| XB-01 | Chrome | Desktop (1920×1080) | All Tests | ✅ CI |
| XB-02 | Chrome | Tablet (768×1024) | All Tests | ✅ CI |
| XB-03 | Chrome | Mobile (375×667) | All Tests | ✅ CI |
| XB-04 | Firefox | Desktop (1920×1080) | All Tests | ✅ CI |
| XB-05 | Firefox | Tablet (768×1024) | All Tests | ✅ CI |
| XB-06 | Firefox | Mobile (375×667) | All Tests | ✅ CI |

**Cross-Browser Coverage**: 6 configurations (Chrome + Firefox × 3 resolutions)

---

## 3. REQUIREMENTS SUMMARY

### 3.1 Functional Requirements

| Req ID | Requirement Description | Test Cases | Status |
|--------|------------------------|------------|--------|
| FR-001 | Application loads successfully | SMK-01 | ✅ Covered |
| FR-002 | Sidebar navigation visible | SMK-02 | ✅ Covered |
| FR-003 | API health status indicator | SMK-03 | ✅ Covered |
| FR-004 | Page heading displayed | SMK-04 | ✅ Covered |
| FR-010 | Manual order entry mode | JRN-A-01, JRN-A-02, JRN-A-03 | ✅ Covered |
| FR-011 | Add multiple items to order | JRN-A-01 | ✅ Covered |
| FR-012 | Evaluate promise for manual order | JRN-A-01, JRN-A-02 | ✅ Covered |
| FR-013 | Select warehouse for items | JRN-A-03 | ✅ Covered |
| FR-020 | Sales order lookup mode | JRN-B-01, JRN-B-02, JRN-B-03, JRN-B-04 | ✅ Covered |
| FR-021 | Load and evaluate sales order | JRN-B-01 | ✅ Covered |
| FR-022 | Switch between sales orders | JRN-B-02 | ✅ Covered |
| FR-023 | Clear sales order selection | JRN-B-03 | ✅ Covered |
| FR-024 | Auto-populate items from SO | JRN-B-04 | ✅ Covered |
| FR-030 | Weekend highlighting in calendar | CMP-CAL-01 | ✅ Covered |
| FR-031 | Weekend exclusion toggle | CMP-CAL-02, CMP-CAL-03 | ✅ Covered |
| FR-032 | Date selection updates form | CMP-CAL-04 | ✅ Covered |
| FR-040 | Display sales orders in dropdown | CMP-CMB-01 | ✅ Covered |
| FR-041 | Sort sales orders numerically | CMP-CMB-02 | ✅ Covered |
| FR-042 | Filter sales orders by search | CMP-CMB-03 | ✅ Covered |
| FR-043 | Clear combobox selection | CMP-CMB-04 | ✅ Covered |
| FR-050 | Accept valid item codes | CMP-ITM-01, CMP-ITM-02, CMP-ITM-04 | ✅ Covered |
| FR-051 | Reject invalid item codes | CMP-ITM-03 | ✅ Covered |
| FR-060 | Display promise date | CMP-RES-01 | ✅ Covered |
| FR-061 | Display confidence level | CMP-RES-02 | ✅ Covered |
| FR-062 | Display fulfillment status | CMP-RES-03 | ✅ Covered |

**Total Requirements**: 23  
**Requirements Covered**: 23  
**Coverage**: 100% ✅

---

## 4. TEST EXECUTION SUMMARY

### 4.1 Test Statistics

| Category              | Total | Pass | Fail | Skip | Pass Rate |
|-----------------------|-------|------|------|------|-----------|
| **Smoke Tests**       | 4     | 4    | 0    | 0    | 100%      |
| **Journey Tests**     | 7     | 7    | 0    | 0    | 100%      |
| **Component Tests**   | 15    | 15   | 0    | 0    | 100%      |
| **Cross-Browser**     | 6     | 6    | 0    | 0    | 100%      |
| **Total**             | 32    | 32   | 0    | 0    | **100%** ✅ |

### 4.2 CI/CD Integration

| Aspect | Implementation | Status |
|--------|----------------|--------|
| **Framework** | Playwright + pytest | ✅ |
| **CI Platform** | GitHub Actions | ✅ |
| **Browsers** | Chrome, Firefox | ✅ |
| **Resolutions** | Desktop, Tablet, Mobile | ✅ |
| **Parallel Execution** | 6 jobs (2 browsers × 3 resolutions) | ✅ |
| **Reporting** | Allure Reports | ✅ |
| **Report Publishing** | GitHub Pages | ✅ |
| **Tunnel Support** | Ngrok integration | ✅ |
| **Mock Handling** | API mocks in tests | ✅ |
| **Ngrok Warning** | Auto-handled in base page | ✅ |

---

## 5. RISK ASSESSMENT

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Ngrok downtime | High | Low | Fallback to local dev server in CI |
| Browser version changes | Medium | Medium | Use latest stable versions, update regularly |
| Flaky tests due to timing | Medium | Medium | Increased timeouts, explicit waits |
| API mock outdated | High | Low | Regular sync with backend team |
| Network latency in CI | Low | Medium | Generous timeouts in CI environment |

---

## 6. TEST MAINTENANCE

### 6.1 When to Update Tests

- ✅ New feature added → Add new test cases
- ✅ UI component changed → Update selectors
- ✅ API contract changed → Update mocks
- ✅ Bug fixed → Add regression test
- ✅ Requirement changed → Update traceability matrix

### 6.2 Test Review Schedule

- **Weekly**: Review failing tests
- **Sprint End**: Update test documentation
- **Release**: Full regression suite execution
- **Quarterly**: Review and refactor test code

---

## 7. REFERENCES

- **Test Files**: 
  - [`tests/journeys.py`](tests/journeys.py) - Journey and smoke tests
  - [`tests/components.py`](tests/components.py) - Component tests
  - [`tests/pages/`](tests/pages/) - Page object models
  - [`tests/mocks/`](tests/mocks/) - API mock data

- **CI/CD**: 
  - [`.github/workflows/test.yml`](.github/workflows/test.yml) - GitHub Actions workflow

- **Reports**: 
  - Allure Reports published to GitHub Pages
  - Test artifacts in GitHub Actions

---

## 8. APPROVAL

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Test Lead | ________ | ________ | ________ |
| Project Manager | ________ | ________ | ________ |
| QA Manager | ________ | ________ | ________ |

---

**Document Version**: 1.0  
**Last Updated**: February 5, 2026  
**Next Review**: March 5, 2026
