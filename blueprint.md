
# Sales & Stock Dashboard Blueprint

## 1. Overview

This document outlines the architecture, design, and features of the Sales & Stock Dashboard, a web application built with modern HTML, CSS, and JavaScript, and integrated with Firebase for real-time data management. The application provides a comprehensive overview of sales performance against set targets, with role-based views for different user levels.

---

## 2. Project State & Features

This section details all style, design, and features implemented in the application from the initial version to the current version.

### 2.1. Core Architecture: The Data Pipeline Model (v2)

The application's logic, managed entirely in `js/main.js`, has been completely overhauled to a robust, professional-grade architecture. The new model ensures stability, predictability, and data integrity by separating concerns into a clear, three-step data pipeline.

1.  **Fetch Data:** A dedicated set of functions (`fetchAllData`) is responsible for fetching all necessary data from Firebase (KPIs, personnel, etc.) in a single, atomic operation. This guarantees that the application is always working with a complete and consistent dataset.

2.  **Process & Calculate:** A centralized "brain" (`processAndRender` and `calculateAllMetrics`) takes the raw data from the fetch step and performs *all* metric calculations for every dashboard. This creates a single, clean, and complete snapshot of the application's state, eliminating the risk of partial or inconsistent calculations.

3.  **Render UI:** A set of "dumb" rendering functions (`renderAllDashboards`, `renderMainDashboard`, etc.) takes the final, calculated data and applies it directly to the HTML. These functions do no calculation; they only update text and styles, ensuring a fast and predictable UI update.

### 2.2. Real-Time Updates

- **Guaranteed Synchronization:** The application uses real-time listeners on all relevant Firebase collections. When any data changes, the *entire* data pipeline is re-run. This ensures that the dashboards are not just updated, but completely recalculated and re-rendered from a fresh, consistent state, guaranteeing that all metrics are always in sync.

### 2.3. Design & User Interface

- **Theme:** A modern dark theme with a color palette centered around dark blue-grays (`#1f2937`), accented with green (`#10b981`), yellow (`#f59e0b`), and red (`#ef4444`).
- **Header:** A responsive header that separates primary action buttons ("KPI & Targets", "Inventory", "Logout") from the main title.
- **Navigation:** A sub-navigation bar provides access to different dashboard views. The active view is highlighted with a green background. All navigation is handled client-side without page reloads.
- **Cards:** Data is presented in "cards" with a consistent design, rounded corners, and subtle shadows for a clean, organized look.

### 2.4. Dashboard Features

- **Main Dashboard:** Displays high-level, aggregate KPIs, including MTD sales, daily sales, monthly targets, and required run rate.
- **Performance Dashboards (Teamleader, Captain, DE, DSR):** Provide filtered views of performance metrics tailored to specific roles, showing individual and team-level achievements against targets.
- **Daily Sales Log:** A fully integrated grid for entering and saving daily sales figures for all personnel. Changes saved here trigger the real-time data pipeline, ensuring immediate and consistent updates across the entire application.

## 3. Current Action Plan

- **Status:** **COMPLETE.** The application's core JavaScript logic has been successfully overhauled. The new architecture is stable, reliable, and ensures data integrity. The project is now in a healthy and maintainable state.
