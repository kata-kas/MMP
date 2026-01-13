# MMP Feature Documentation

## Table of Contents
1. [Project Management](#project-management)
2. [Asset Management](#asset-management)
3. [File Discovery & Processing](#file-discovery--processing)
4. [File Enrichment](#file-enrichment)
5. [Printer Integration](#printer-integration)
6. [Downloader Integration](#downloader-integration)
7. [Tag Management](#tag-management)
8. [Temporary File Management](#temporary-file-management)
9. [System Configuration](#system-configuration)
10. [Event System & Real-time Updates](#event-system--real-time-updates)
11. [Slicer Integration](#slicer-integration)
12. [UI Features](#ui-features)

---

## Project Management

### 1.1 Create New Project

**Flow:**
1. User uploads files via multipart form (`POST /api/projects`)
2. Form includes:
   - `files[]`: One or more files to upload
   - `payload`: JSON with project metadata (name, description, default_image_name, tags)
3. Backend creates project folder in library path
4. Files are copied to project folder
5. Project initialization:
   - Creates project entity with UUID
   - Discovers assets using flat asset discoverer
   - Processes each asset (enrichment, rendering)
   - Saves project to database
6. Returns project UUID

**API Endpoint:** `POST /api/projects`

**UI Component:** `CreateProject.tsx`

---

### 1.2 List Projects

**Flow:**
1. User requests project list (`GET /api/projects/list`)
2. Backend queries database for all projects
3. Returns array of project objects with metadata

**API Endpoint:** `GET /api/projects/list`

**UI Component:** `ProjectsList.tsx`

---

### 1.3 View Project Details

**Flow:**
1. User navigates to project page (`GET /api/projects/:uuid`)
2. Backend fetches project from database by UUID
3. Returns project with all associated assets, tags, and metadata
4. UI displays project information, assets grid, and project operations

**API Endpoint:** `GET /api/projects/:uuid`

**UI Component:** `ProjectPage.tsx`

---

### 1.4 Edit Project

**Flow:**
1. User modifies project metadata (name, description, tags)
2. Submits changes via `POST /api/projects/:uuid`
3. If project name changed:
   - Backend moves project folder to new location
   - Updates database with new path
4. Updates project metadata in database
5. Returns updated project

**API Endpoint:** `POST /api/projects/:uuid`

**UI Component:** `EditProject.tsx`

---

### 1.5 Delete Project

**Flow:**
1. User confirms deletion (`POST /api/projects/:uuid/delete`)
2. Backend:
   - Fetches project from database
   - Deletes project folder and all contents from filesystem
   - Removes project record from database
3. Returns success status

**API Endpoint:** `POST /api/projects/:uuid/delete`

**UI Component:** `DeleteBtn.tsx`

---

### 1.6 Move Project

**Flow:**
1. User changes project path (`POST /api/projects/:uuid/move`)
2. Backend:
   - Validates new path
   - Moves project folder to new location
   - Updates database with new path
3. Returns updated project UUID and path

**API Endpoint:** `POST /api/projects/:uuid/move`

**UI Component:** `ProjectOperations.tsx`

---

### 1.7 Set Main Image

**Flow:**
1. User selects an asset as main project image
2. Submits via `POST /api/projects/:uuid/image`
3. Backend:
   - Updates project's `DefaultImageID` field
   - Saves to database
4. Returns updated project UUID and image ID

**API Endpoint:** `POST /api/projects/:uuid/image`

**UI Component:** `SetAsMain.tsx`

---

### 1.8 Discover Project Assets

**Flow:**
1. User triggers discovery for a project (`GET /api/projects/:uuid/discover`)
2. Backend:
   - Fetches project from database
   - Runs flat asset discovery on project folder
   - Initializes newly discovered assets
   - Processes assets (enrichment, rendering)
   - Updates database
3. Returns success status

**API Endpoint:** `GET /api/projects/:uuid/discover`

**UI Component:** `DiscoverBtn.tsx`

---

### 1.9 Import Project from File System

**Flow:**
1. User selects a folder path from available paths
2. System provides list of undiscovered paths (`GET /api/system/paths`)
3. User selects path and imports
4. Backend:
   - Creates project from selected path
   - Runs discovery and initialization
   - Saves to database

**API Endpoint:** `GET /api/system/paths`, `POST /api/projects`

**UI Component:** `ImportProject.tsx`

---

## Asset Management

### 2.1 List Project Assets

**Flow:**
1. User views project page
2. UI requests assets (`GET /api/projects/:uuid/assets`)
3. Backend queries database for all assets belonging to project
4. Returns array of asset objects
5. UI displays assets in grid with filtering by type

**API Endpoint:** `GET /api/projects/:uuid/assets`

**UI Component:** `ProjectPageBody.tsx`, `ProjectAssetsTypeFilter.tsx`

---

### 2.2 Add Asset to Project

**Flow:**
1. User uploads file via multipart form (`POST /api/projects/:uuid/assets`)
2. Form includes:
   - `files[]`: File to upload
   - Asset metadata (name, project UUID)
3. Backend:
   - Saves file to project folder
   - Initializes asset (detects type, extracts metadata)
   - Processes asset (enrichment, rendering if applicable)
   - Saves asset to database
4. Returns success status

**API Endpoint:** `POST /api/projects/:uuid/assets`

**UI Component:** `AddAsset.tsx`

---

### 2.3 View Asset Details

**Flow:**
1. User clicks on asset
2. UI requests asset details (`GET /api/projects/:uuid/assets/:id`)
3. Backend fetches asset from database
4. Returns asset with all metadata
5. UI displays asset details, 3D viewer (if model), or image viewer

**API Endpoint:** `GET /api/projects/:uuid/assets/:id`

**UI Component:** `AssetDetails.tsx`, `ModelDetailPane.tsx`

---

### 2.4 Download Asset File

**Flow:**
1. User clicks download button
2. UI requests file (`GET /api/projects/:uuid/assets/:id/file`)
3. Backend:
   - Fetches asset from database
   - Reads file from filesystem
   - Streams file to client
4. Browser downloads file

**API Endpoint:** `GET /api/projects/:uuid/assets/:id/file`

**UI Component:** `DownloadBtn.tsx`

---

### 2.5 Delete Asset

**Flow:**
1. User confirms deletion (`POST /api/projects/:uuid/assets/:id/delete`)
2. Backend:
   - Fetches asset from database
   - Deletes file from filesystem
   - Removes asset record from database
   - Removes associated rendered images if any
3. Returns success status

**API Endpoint:** `POST /api/projects/:uuid/assets/:id/delete`

**UI Component:** `DropDownMenu.tsx`

---

## File Discovery & Processing

### 3.1 Automatic Library Discovery

**Flow:**
1. On server startup, background goroutine runs
2. Scans library path recursively (`ProcessFolder`)
3. Deep project discovery:
   - Identifies project folders (directories containing 3D files)
   - Creates processable project objects
4. Project initialization (parallel, max 10 concurrent):
   - Creates project entity
   - Flat asset discovery within project folder
   - Asset initialization and processing
   - Saves to database
5. Logs completion

**Trigger:** Server startup

**Code:** `core/processing/processing.go:ProcessFolder`

---

### 3.2 Manual Discovery Trigger

**Flow:**
1. User triggers discovery from settings (`GET /api/system/discovery`)
2. Backend starts discovery in background goroutine
3. Same process as automatic discovery
4. Publishes discovery events via SSE

**API Endpoint:** `GET /api/system/discovery`

**UI Component:** `ServerOperations.tsx`

---

### 3.3 Project Deep Discovery

**Flow:**
1. Scans directory recursively
2. Identifies project boundaries:
   - Directories containing 3D model files (.stl, .obj, .3mf, etc.)
   - Each project folder becomes a processable project
3. Returns list of processable projects

**Code:** `core/processing/discovery/project_deep_discovery.go`

---

### 3.4 Asset Flat Discovery

**Flow:**
1. Scans project folder (non-recursive)
2. Identifies files by extension:
   - 3D models: .stl, .obj, .3mf, .step, etc.
   - Images: .jpg, .png, .gif, etc.
   - G-code: .gcode
   - Other supported formats
3. Returns list of processable assets

**Code:** `core/processing/discovery/asset_flat_discovery.go`

---

### 3.5 Asset Initialization

**Flow:**
1. Creates asset entity from file
2. Detects asset type from extension
3. Extracts metadata:
   - File size, modification date
   - For images: dimensions, EXIF data
   - For models: basic geometry info
4. Saves asset to database
5. Triggers enrichment process

**Code:** `core/processing/initialization/asset.go`

---

### 3.6 Project Initialization

**Flow:**
1. Creates project entity
2. Extracts project name from folder name
3. Runs asset discovery
4. Initializes all discovered assets
5. Processes assets (enrichment)
6. Saves project and assets to database

**Code:** `core/processing/initialization/project.go`

---

## File Enrichment

### 4.1 STL Rendering

**Flow:**
1. Asset with `.stl` extension triggers renderer
2. STL Renderer:
   - Loads STL file
   - Generates preview image using configured render settings
   - Saves rendered image to assets folder
   - Creates new asset entity for rendered image
3. Returns processable asset for rendered image

**Renderer:** `core/processing/enrichment/renderStl.go`

**Configuration:**
- Model color: `MODEL_RENDER_COLOR`
- Background color: `MODEL_BACKGROUND_COLOR`
- Worker count: `MAX_RENDER_WORKERS`

---

### 4.2 G-code Rendering

**Flow:**
1. Asset with `.gcode` extension triggers renderer
2. G-code Renderer:
   - Parses G-code file
   - Generates preview image showing print path
   - Saves rendered image
   - Creates asset entity for rendered image
3. Returns processable asset for rendered image

**Renderer:** `core/processing/enrichment/renderGcode.go`

---

### 4.3 G-code Parsing

**Flow:**
1. Asset with `.gcode` extension triggers parser
2. G-code Parser:
   - Parses G-code commands
   - Extracts metadata:
     - Print time estimates
     - Layer count
     - Filament usage
     - Temperature settings
   - Updates asset metadata in database

**Parser:** `core/processing/enrichment/parseGCode.go`

---

### 4.4 3MF Extraction

**Flow:**
1. Asset with `.3mf` extension triggers extractor
2. 3MF Extractor:
   - Opens 3MF archive
   - Extracts embedded files:
     - Model files (.stl, .obj)
     - Thumbnails
     - Metadata files
   - Creates processable assets for each extracted file
3. Returns list of processable assets

**Extractor:** `core/processing/enrichment/3mfExtractor.go`

---

### 4.5 Enrichment Orchestration

**Flow:**
1. After asset initialization, enrichment process runs
2. Checks asset extension against registered processors:
   - Renderers: Generate preview images
   - Parsers: Extract metadata
   - Extractors: Extract embedded files
3. Processes asset through all applicable processors
4. Creates new assets for generated/extracted files
5. Saves all assets to database

**Code:** `core/processing/enrichment/enrichment.go`

---

## Printer Integration

### 5.1 Add Printer

**Flow:**
1. User fills printer form (`POST /api/printers`)
2. Form includes:
   - Name
   - Address (IP/hostname)
   - Type (klipper/octoPrint)
   - API key (for OctoPrint)
   - Camera URL (optional)
3. Backend:
   - Creates printer entity with UUID
   - Saves to state and persists to file
4. Returns created printer

**API Endpoint:** `POST /api/printers`

**UI Component:** `AddPrinter.tsx`, `PrinterForm.tsx`

---

### 5.2 List Printers

**Flow:**
1. User views printers page
2. UI requests printers (`GET /api/printers`)
3. Backend returns all printers from state
4. UI displays printer list with status widgets

**API Endpoint:** `GET /api/printers`

**UI Component:** `PrintersPage.tsx`

---

### 5.3 View Printer Details

**Flow:**
1. User navigates to printer page
2. UI requests printer (`GET /api/printers/:uuid`)
3. Backend returns printer from state
4. UI displays printer information, status widgets, and controls

**API Endpoint:** `GET /api/printers/:uuid`

**UI Component:** `EditPrinterPage.tsx`

---

### 5.4 Edit Printer

**Flow:**
1. User modifies printer settings
2. Submits via `POST /api/printers/:uuid`
3. Backend:
   - Updates printer in state
   - Persists to file
4. Returns updated printer

**API Endpoint:** `POST /api/printers/:uuid`

**UI Component:** `PrinterForm.tsx`

---

### 5.5 Delete Printer

**Flow:**
1. User confirms deletion (`POST /api/printers/:uuid/delete`)
2. Backend:
   - Removes printer from state
   - Persists changes
3. Returns deleted printer

**API Endpoint:** `POST /api/printers/:uuid/delete`

**UI Component:** `EditPrinterPage.tsx`

---

### 5.6 Test Printer Connection

**Flow:**
1. User tests connection (`POST /api/printers/test`)
2. Backend:
   - For Klipper: Tests WebSocket connection
   - For OctoPrint: Tests API connection
   - Updates printer status
3. Returns printer with connection status

**API Endpoint:** `POST /api/printers/test`

**UI Component:** `PrinterForm.tsx`

---

### 5.7 Send File to Printer

**Flow:**
1. User selects asset and printer
2. UI requests send (`POST /api/printers/:uuid/send/:id`)
3. Backend:
   - Fetches asset from database
   - For Klipper: Uploads via Moonraker API
   - For OctoPrint: Uploads via OctoPrint API
4. Returns success status

**API Endpoint:** `POST /api/printers/:uuid/send/:id`

**UI Component:** `SendToPrinterBtn.tsx`

---

### 5.8 Klipper Integration

**Flow:**
1. Connects to Klipper via WebSocket (`ws://address/websocket`)
2. Subscribes to printer objects:
   - Heaters (bed, extruder)
   - Print stats
   - Display status
3. Receives real-time status updates
4. Publishes updates via event system

**Code:** `core/integrations/klipper/statePublisher.go`

**Features:**
- Temperature monitoring (bed, extruder)
- Print progress tracking
- Job status (filename, duration, progress)
- Display messages

---

### 5.9 OctoPrint Integration

**Flow:**
1. Connects to OctoPrint API (`http://address/api`)
2. Uses API key for authentication
3. Uploads files via file upload endpoint
4. Monitors print status via API polling

**Code:** `core/integrations/octorpint/api.go`

---

### 5.10 Printer Status Streaming

**Flow:**
1. UI subscribes to printer events (`POST /api/printers/:uuid/subscribe/:session`)
2. Backend:
   - Gets state publisher for printer
   - Subscribes session to printer event stream
3. Real-time updates:
   - Temperature changes
   - Print progress
   - Job status changes
4. UI receives updates via SSE and updates widgets

**API Endpoint:** `POST /api/printers/:uuid/subscribe/:session`

**UI Components:** `PrinterWidget.tsx`, `BedTemp.tsx`, `ExtruderTemp.tsx`, `PrintProgress.tsx`

---

### 5.11 Printer Camera Stream

**Flow:**
1. User views printer camera
2. UI requests stream (`GET /api/printers/:uuid/stream`)
3. Backend:
   - Proxies camera URL stream
   - Streams video to client
4. UI displays video stream

**API Endpoint:** `GET /api/printers/:uuid/stream`

**UI Component:** (Camera viewer in printer page)

---

## Downloader Integration

### 6.1 Download from Thingiverse

**Flow:**
1. User provides Thingiverse URL (`POST /api/downloader/fetch`)
2. Backend:
   - Parses URL (supports `thingiverse.com` or `thing:` protocol)
   - Fetches project page
   - Extracts metadata (title, description, tags)
   - Downloads model files
   - Downloads images
   - Creates project with metadata
   - Initializes assets
   - Saves to database
3. Returns success status

**API Endpoint:** `POST /api/downloader/fetch`

**Code:** `core/downloader/thingiverse/thingiverse.go`

**Configuration:**
- `THINGIVERSE_TOKEN`: Optional API token

---

### 6.2 Download from MakerWorld

**Flow:**
1. User provides MakerWorld URL and cookies (`POST /api/downloader/fetch`)
2. Backend:
   - Parses MakerWorld page HTML
   - Extracts metadata from `__NEXT_DATA__` script tag
   - Downloads:
     - Cover image
     - Model files (.3mf, .stl, etc.)
     - Design pictures
     - 3MF instances (with rate limiting delays)
   - Creates project with metadata and tags
   - Initializes all assets
   - Saves to database
3. Returns success status

**API Endpoint:** `POST /api/downloader/fetch`

**Code:** `core/downloader/makerworld/makerworld.go`

**Features:**
- Rate limiting (3-6 second delays between requests)
- Cookie-based authentication
- User-agent spoofing
- 3MF instance extraction

---

### 6.3 Batch Download

**Flow:**
1. User provides multiple URLs (comma-separated or array)
2. Backend processes each URL:
   - Detects platform (Thingiverse/MakerWorld)
   - Routes to appropriate downloader
   - Processes sequentially
3. Returns success after all downloads complete

**API Endpoint:** `POST /api/downloader/fetch`

---

## Tag Management

### 7.1 List Tags

**Flow:**
1. User views tags
2. UI requests tags (`GET /api/tags`)
3. Backend queries database for all tags
4. Returns array of tag objects

**API Endpoint:** `GET /api/tags`

**UI Component:** (Used in project forms)

---

### 7.2 Add Tags to Project

**Flow:**
1. User adds tags when creating/editing project
2. Tags are included in project payload
3. Backend:
   - Creates tag entities if they don't exist
   - Associates tags with project
   - Saves to database

**API Endpoint:** `POST /api/projects` or `POST /api/projects/:uuid`

---

### 7.3 Filter Projects by Tags

**Flow:**
1. User selects tags in filter
2. UI filters project list client-side
3. Displays matching projects

**UI Component:** `ProjectFilter.tsx`, `ProjectFilterCard.tsx`

---

## Temporary File Management

### 8.1 List Temporary Files

**Flow:**
1. User views temp files page
2. UI requests temp files (`GET /api/tempfiles`)
3. Backend returns all temp files from state
4. UI displays temp files with project suggestions

**API Endpoint:** `GET /api/tempfiles`

**UI Component:** `TempFiles.tsx`

---

### 8.2 Automatic Temp File Discovery

**Flow:**
1. On server startup, background process runs
2. Scans temp directory (`/data/temp`)
3. For each file:
   - Creates temp file entity
   - Attempts to match with projects:
     - Matches by project name (token from filename)
     - Matches by project tags
   - Stores matches for UI suggestions
4. Stores in state

**Code:** `core/processing/tempDiscovery.go`

**Trigger:** Server startup

---

### 8.3 Upload via Slicer API

**Flow:**
1. Slicer uploads file (`POST /upload`)
2. Backend:
   - Saves file to temp directory
   - If new file, runs temp discovery
   - Publishes `tempfile.new` event
3. UI receives notification and shows temp file

**API Endpoint:** `POST /upload` (Slicer endpoint)

**Code:** `core/integrations/slicer/endpoints.go`

**Event:** `tempfile.new`

---

### 8.4 Move Temp File to Project

**Flow:**
1. User selects project for temp file
2. UI requests move (`POST /api/tempfiles/:uuid/move`)
3. Backend:
   - Moves file from temp to project folder
   - Initializes asset
   - Processes asset (enrichment)
   - Removes from temp files state
4. Returns success status

**API Endpoint:** `POST /api/tempfiles/:uuid/move`

**UI Component:** `ProjectSelect.tsx`

---

### 8.5 Delete Temp File

**Flow:**
1. User confirms deletion (`POST /api/tempfiles/:uuid/delete`)
2. Backend:
   - Deletes file from temp directory
   - Removes from state
3. Returns success status

**API Endpoint:** `POST /api/tempfiles/:uuid/delete`

**UI Component:** `TempFiles.tsx`

---

## System Configuration

### 9.1 Get System Settings

**Flow:**
1. User views settings page
2. UI requests settings (`GET /api/system/settings`)
3. Backend returns runtime configuration
4. UI displays settings form

**API Endpoint:** `GET /api/system/settings`

**UI Component:** `SettingsPage.tsx`, `SettingsForm.tsx`

**Settings Include:**
- Library path
- Data path
- Server port
- Render settings (colors, workers)
- Integration settings
- Blacklist patterns

---

### 9.2 Save System Settings

**Flow:**
1. User modifies settings
2. UI submits (`POST /api/system/settings`)
3. Backend:
   - Validates configuration
   - Saves to config file
   - Updates runtime configuration
4. Returns saved settings

**API Endpoint:** `POST /api/system/settings`

**UI Component:** `SettingsForm.tsx`

**Sections:**
- Core: Basic paths and server settings
- Library: Library path and blacklist
- Render: Model rendering settings
- Integrations: Printer and downloader settings
- Server: Advanced server operations

---

### 9.3 Get Available Paths

**Flow:**
1. User imports project
2. UI requests paths (`GET /api/system/paths`)
3. Backend:
   - Scans library directory
   - Finds directories not yet registered as projects
   - Returns sorted list of paths
4. UI displays path selector

**API Endpoint:** `GET /api/system/paths`

**UI Component:** `ImportProject.tsx`

---

### 9.4 Get Asset Types

**Flow:**
1. UI requests asset types (`GET /api/assettypes`)
2. Backend returns registered asset types from state
3. UI uses for filtering and display

**API Endpoint:** `GET /api/assettypes`

**UI Component:** `ProjectAssetsTypeFilter.tsx`

---

## Event System & Real-time Updates

### 10.1 SSE Connection

**Flow:**
1. UI connects to SSE endpoint (`GET /api/events`)
2. Backend:
   - Creates session UUID
   - Establishes SSE connection
   - Sends connection event with session ID
3. UI stores session ID for subscriptions

**API Endpoint:** `GET /api/events`

**UI Code:** `SSEProvider.tsx`, `SubscriptionManager.ts`

---

### 10.2 Subscribe to Events

**Flow:**
1. UI component subscribes to event (`POST /api/system/events/subscribe/:session`)
2. Backend:
   - Registers subscription
   - Associates event pattern with session
3. When event occurs:
   - Backend publishes to all subscribed sessions
   - UI receives event via SSE
   - Component callback executes

**API Endpoint:** `POST /api/system/events/subscribe/:session`

**Event Types:**
- `system.state.project.event`: Project updates
- `system.state.asset.event`: Asset updates
- `system.state.discovery.scan`: Discovery progress
- `printer.update.{uuid}`: Printer status updates
- `tempfile.new`: New temp file

---

### 10.3 Unsubscribe from Events

**Flow:**
1. Component unmounts or changes
2. UI unsubscribes (`POST /api/system/events/unsubscribe/:session`)
3. Backend removes subscription
4. Events no longer sent to session

**API Endpoint:** `POST /api/system/events/unsubscribe/:session`

---

### 10.4 Real-time Project Updates

**Flow:**
1. Project changes (create, update, delete)
2. Backend publishes `system.state.project.event`
3. UI components subscribed to project events receive update
4. Components refresh project data

**UI Components:** `Refresher.tsx` (project page)

---

### 10.5 Real-time Asset Updates

**Flow:**
1. Asset changes (add, delete, update)
2. Backend publishes `system.state.asset.event`
3. UI shows notification
4. User can refresh to see changes

**UI Components:** `Refresher.tsx` (project page body)

---

### 10.6 Discovery Progress Notifications

**Flow:**
1. Discovery starts
2. Backend publishes `system.state.discovery.scan` with state "started"
3. UI shows loading notification
4. Discovery completes
5. Backend publishes event with state "finished"
6. UI updates notification to success

**UI Component:** `DiscoveryNotifications.tsx`

---

### 10.7 New Project Notifications

**Flow:**
1. New project created
2. Backend publishes `project.new` event
3. UI shows notification with link to project

**UI Component:** `NewProjectNotification.tsx`

---

### 10.8 New Temp File Notifications

**Flow:**
1. Temp file discovered or uploaded
2. Backend publishes `tempfile.new` event
3. UI shows notification

**UI Component:** `NewTempfileNotification.tsx`

---

## Slicer Integration

### 11.1 Slicer API Compatibility

**Flow:**
1. Slicer connects to MMP as if it were OctoPrint
2. MMP provides compatible endpoints:
   - `GET /api/version`: Returns version info
   - `GET /api/info`: Returns system info
   - `POST /upload`: Accepts file uploads
3. Uploaded files go to temp directory
4. Auto-discovery matches files to projects

**API Endpoints:**
- `GET /api/version`
- `GET /api/info`
- `POST /upload`

**Code:** `core/integrations/slicer/endpoints.go`

---

## UI Features

### 12.1 Dashboard

**Flow:**
1. User navigates to dashboard
2. UI displays configurable widgets:
   - Printer status widgets
   - Project statistics
   - Recent activity
3. Widgets can be added/removed/reordered
4. Widgets subscribe to real-time updates

**UI Component:** `Dashboard.tsx`, `DashboardProvider.tsx`

**Widget Types:**
- Printer table widget
- Individual printer widgets

---

### 12.2 Project List View

**Flow:**
1. User navigates to projects page
2. UI displays grid of project cards
3. Features:
   - Project thumbnail (main image)
   - Project name and description
   - Tag display
   - Filter by tags
   - Search functionality
4. Clicking card navigates to project page

**UI Component:** `ProjectsPage.tsx`, `ProjectCard.tsx`, `ProjectFilter.tsx`

---

### 12.3 Project Detail View

**Flow:**
1. User navigates to project page
2. UI displays:
   - Project header with name, description, tags
   - Project operations (edit, delete, discover, move)
   - Assets grid with type filtering
   - Asset detail pane (when selected)
3. Real-time updates refresh view automatically

**UI Component:** `ProjectPage.tsx`, `ProjectPageBody.tsx`

---

### 12.4 Asset Viewer

**Flow:**
1. User selects asset
2. UI displays asset details:
   - For 3D models: 3D viewer with controls
   - For images: Image viewer with zoom
   - For G-code: Preview image
   - Metadata display
3. Actions available:
   - Download
   - Set as main image
   - Delete

**UI Component:** `AssetDetails.tsx`, `ModelDetailPane.tsx`

---

### 12.5 Printer Management

**Flow:**
1. User navigates to printers page
2. UI displays:
   - List of configured printers
   - Add printer button
   - Printer status widgets
3. Clicking printer navigates to edit page
4. Edit page shows:
   - Printer configuration form
   - Status widgets (temperature, progress)
   - Camera stream (if configured)
   - Send file button

**UI Component:** `PrintersPage.tsx`, `EditPrinterPage.tsx`, `PrinterWidget.tsx`

---

### 12.6 Settings Management

**Flow:**
1. User navigates to settings page
2. UI displays settings form with sections:
   - Core: Basic configuration
   - Library: Library settings
   - Render: Rendering configuration
   - Integrations: External service settings
   - Server: Server operations
   - Experimental: Experimental features
3. User modifies settings and saves
4. Settings persist to config file

**UI Component:** `SettingsPage.tsx`, `SettingsForm.tsx`

---

### 12.7 Temp Files Management

**Flow:**
1. User navigates to temp files page
2. UI displays:
   - List of temp files
   - Project suggestions for each file
   - Move to project selector
   - Delete button
3. User can:
   - Move file to project (creates asset)
   - Delete file
   - View file details

**UI Component:** `TempFiles.tsx`, `ProjectSelect.tsx`

---

### 12.8 Navigation

**Flow:**
1. UI provides navigation bar with:
   - Dashboard
   - Projects
   - Printers
   - Temp Files
   - Settings
2. Navigation persists across pages
3. Active route highlighted

**UI Component:** `NavBar.tsx`

---

### 12.9 Error Handling

**Flow:**
1. API errors occur
2. Axios interceptor catches errors
3. UI displays error notification
4. User can retry or navigate away

**UI Component:** `AxiosErrorHandler.tsx`

---

### 12.10 Real-time Status Indicators

**Flow:**
1. SSE connection status displayed
2. Connection icon shows:
   - Connected (green)
   - Connecting (yellow)
   - Disconnected (red)
3. Updates in real-time

**UI Component:** `StatusIcon.tsx`

---

## Technical Details

### Database Schema

**Projects:**
- UUID (primary key)
- Name
- Path
- Description
- DefaultImageID
- ExternalLink
- Tags (many-to-many)
- Created/Updated timestamps

**Assets:**
- ID (primary key)
- ProjectUUID (foreign key)
- Name
- Extension
- AssetType
- Metadata (JSON)
- Created/Updated timestamps

**Tags:**
- ID (primary key)
- Value
- Projects (many-to-many)

**TempFiles:**
- UUID (primary key)
- Name
- ProjectMatches (array of UUIDs)
- Created timestamp

### State Management

**In-Memory State:**
- Printers (map by UUID)
- TempFiles (map by UUID)
- AssetTypes (loaded from database)

**Persistent State:**
- Projects (database)
- Assets (database)
- Tags (database)
- Printers (JSON file)
- Configuration (TOML file)

### File Structure

**Library Path:**
- `/library/{project_path}/{project_name}/`
  - Asset files
  - Rendered images (in assets subfolder)

**Data Path:**
- `/data/data.db` - SQLite database
- `/data/temp/` - Temporary files
- `/data/assets/` - Processed assets cache
- `/data/printers.json` - Printer configuration
- `/data/config.toml` - System configuration

### Event Patterns

**System Events:**
- `system.state.project.event` - Project changes
- `system.state.asset.event` - Asset changes
- `system.state.discovery.scan` - Discovery progress

**Printer Events:**
- `printer.update.{uuid}` - Printer status updates

**File Events:**
- `tempfile.new` - New temp file
- `project.new` - New project created

---

## API Endpoint Summary

### Projects
- `GET /api/projects` - Index (placeholder)
- `GET /api/projects/list` - List all projects
- `GET /api/projects/:uuid` - Get project details
- `POST /api/projects` - Create project
- `POST /api/projects/:uuid` - Update project
- `POST /api/projects/:uuid/delete` - Delete project
- `POST /api/projects/:uuid/move` - Move project
- `POST /api/projects/:uuid/image` - Set main image
- `GET /api/projects/:uuid/discover` - Discover assets

### Assets
- `GET /api/projects/:uuid/assets` - List project assets
- `POST /api/projects/:uuid/assets` - Add asset
- `GET /api/projects/:uuid/assets/:id` - Get asset details
- `GET /api/projects/:uuid/assets/:id/file` - Download asset file
- `POST /api/projects/:uuid/assets/:id/delete` - Delete asset

### Printers
- `GET /api/printers` - List printers
- `GET /api/printers/:uuid` - Get printer details
- `POST /api/printers` - Create printer
- `POST /api/printers/:uuid` - Update printer
- `POST /api/printers/:uuid/delete` - Delete printer
- `POST /api/printers/test` - Test connection
- `POST /api/printers/:uuid/send/:id` - Send file to printer
- `GET /api/printers/:uuid/stream` - Camera stream
- `POST /api/printers/:uuid/subscribe/:session` - Subscribe to updates
- `POST /api/printers/:uuid/unsubscribe/:session` - Unsubscribe

### System
- `GET /api/system/settings` - Get settings
- `POST /api/system/settings` - Save settings
- `GET /api/system/paths` - Get available paths
- `GET /api/system/discovery` - Trigger discovery
- `GET /api/system/events/subscribe/:session` - Subscribe to events
- `GET /api/system/events/unsubscribe/:session` - Unsubscribe

### Tags
- `GET /api/tags` - List all tags

### Temp Files
- `GET /api/tempfiles` - List temp files
- `POST /api/tempfiles/:uuid/move` - Move to project
- `POST /api/tempfiles/:uuid/delete` - Delete temp file

### Downloader
- `POST /api/downloader/fetch` - Download from external source

### Asset Types
- `GET /api/assettypes` - List asset types

### Events
- `GET /api/events` - SSE connection endpoint

### Slicer (OctoPrint-compatible)
- `GET /api/version` - Version info
- `GET /api/info` - System info
- `POST /upload` - Upload file

---

## Configuration Options

### Environment Variables
- `DATA_PATH` - Data directory path
- `LIBRARY_PATH` - Library directory path
- `THINGIVERSE_TOKEN` - Thingiverse API token (optional)
- `PORT` - Server port (default: 8000)
- `MAX_RENDER_WORKERS` - Render worker count (default: 5)
- `MODEL_RENDER_COLOR` - Model render color (hex)
- `MODEL_BACKGROUND_COLOR` - Background color (hex)

### Config File (config.toml)
- Server configuration
- Library settings
- Render settings
- Integration settings
- Blacklist patterns

---

## Workflow Examples

### Complete Project Creation Flow
1. User uploads files via UI
2. Backend creates project folder
3. Files saved to project folder
4. Project initialized
5. Assets discovered and initialized
6. Assets enriched (rendered, parsed, extracted)
7. Project saved to database
8. UI receives notification
9. User views project with all assets

### Complete Print Flow
1. User selects project asset
2. User selects printer
3. File sent to printer
4. Printer receives file
5. Real-time status updates via WebSocket
6. UI displays print progress
7. User monitors temperature and progress
8. Print completes

### Complete Download Flow
1. User provides MakerWorld URL
2. Backend fetches page and extracts metadata
3. Downloads all model files and images
4. Creates project with metadata
5. Initializes all assets
6. Enriches assets (renders, extracts)
7. Saves to database
8. UI shows new project notification
9. User views downloaded project

---

This document provides a comprehensive overview of all features in the MMP system with detailed flows for each feature.
