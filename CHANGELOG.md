# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-06-29

### Added

- **Dashboard data visualization**: Chart.js integration for job statistics
  - 7-day trend line chart showing job status progression (completed/processing/pending/failed)
  - Doughnut chart for status distribution with percentage tooltips
  - Skeleton loading / error retry / empty states for chart section
- **Backend**: `GET /api/jobs/stats` — daily job aggregation endpoint
  - Returns per-day counts (pending/processing/completed/failed) for the last N days
  - Supports `?days=N` parameter (1-90, default 7)
  - 5 tests covering empty response, aggregation, auth, days param, invalid input
- **API Layer**: `JobStatsResponse`, `DailyJobCounts` types and `getJobStats()` function
- **Dependency**: chart.js ^4.5.1 added to package.json

## [0.3.0] - 2026-06-29

### Added

- **File upload**: Drag-and-drop file upload zone for .txt/.md files on Generate page
  - Backend: `POST /api/v1/aggregator/upload` — upload file as new article
  - Frontend: `FileUploadZone` component with drag/drop, click select, progress indicator
  - Uploaded articles immediately available for video generation in content selector
- **Batch operations**: Content page now supports multi-select (checkbox) and batch delete
  - Backend: `POST /api/articles/batch-delete` — delete multiple articles at once
  - Select all / deselect all toggle in content page header
  - Confirmation dialog before batch delete
- **Data export**: CSV and JSON export for content and publish pages
  - Backend: `GET /api/articles/export?format=csv|json` and `GET /api/jobs/export?format=csv|json`
  - Frontend: Export dropdown in content page and publish page header
  - Pure browser download with proper Content-Disposition headers

### Added (backend)

- `feature_gates.yaml`: Added `file_upload`, `batch_operations`, `data_export` feature gates (tier 1)
- `routers/dashboard.py`: Added upload endpoint with file type validation (.txt/.md)
- `routers/aggregator.py`: Added batch-delete and export endpoints
- `routers/jobs.py`: Added jobs export endpoint
- `tests/test_v0_3_0_features.py`: 14 tests covering all new endpoints

## [0.2.0] - 2026-06-29

### Added

- **Responsive layout**: Sidebar collapses to hamburger menu on mobile (<1024px)
- **Dark mode toggle**: Sun/Moon button in sidebar and mobile top bar
- **Page transitions**: Fade-in animation on route change
- **ThemeProvider SSR fix**: Provides default context during static generation (fixes useTheme crash)

### Changed

- Login page: Responsive width (w-96 -> w-full max-w-sm) for mobile
- Main content padding: Responsive p-4 (mobile) / p-6 (desktop)
- ThemeProvider: Context now available during SSR to support static page generation

## [0.2.0] - 2026-06-27

### Added

- **Admin Provider Management Page** (`/admin/providers`): Full CRUD for LLM provider configs
  - Add/edit/delete providers with encrypted API key storage
  - Provider listing with status badges and search
- **User Provider Config Page** (`/settings/providers`): View connected LLM providers
- **Admin Users Management Page** (`/admin/users`): User list with pagination/filter/search
  - User detail modal with subscription info and usage stats
  - Status toggle (activate/deactivate users)
  - Plan badge color coding (free/basic/pro/enterprise)
- **Subscription Display** on Settings page: Plan badge, usage progress bar, upgrade CTA
- **API Layer**: getAdminUsers, getAdminUser, toggleUserStatus, getUserUsage, getUserSubscription

### Changed

- AppLayout sidebar: Added `/admin/users` and `/admin/providers` navigation links

## [0.1.1] - 2026-06-26

### Changed
- register() 请求支持邮箱可选
- request() 错误处理优化：自动解析 FastAPI 422，展示可读消息而非 JSON 原文

## [0.1.0] - 2026-06-26

