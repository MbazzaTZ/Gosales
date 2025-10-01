# Project Blueprint

## Overview

This project is a sales and stock dashboard that provides a comprehensive overview of sales performance, inventory status, and team metrics. It features a main dashboard with key performance indicators (KPIs), detailed views for team leaders and DSRs, and a secure admin panel for managing data and users. A key feature is the in-page editor, allowing authorized users to edit content directly on the page.

## Features

### Main Dashboard

*   **Sales Overview**: Displays monthly sales targets, MTD actuals, and daily targets.
*   **Performance Gauges**: Visualizes MTD performance against targets.
*   **Inventory Snapshot**: Shows stock levels, including received, sold, and in-hand quantities.
*   **SHOWMAX Sales Focus**: Tracks performance for a specific product.
*   **Charts**: Includes a sales growth chart and a stock breakdown chart.
*   **Time Metrics**: Displays the current date, working days, and remaining work days.

### Teamleader & Captain Dashboard

*   Provides a tabular view of team leader performance, including monthly targets, MTD actuals, and performance percentages.

### DSR Performance Dashboard

*   Displays a detailed table of DSR performance, including sales data, stock status, and other relevant KPIs.

### Inventory Status Dashboard

*   Provides a detailed breakdown of inventory status, including smart card numbers, DSR assignments, and payment status.

### In-Page Content Management

*   **Role-Based Access**: Firebase Authentication secures the application, managing user sign-in and sign-out. Only users with the `admin` or `editor` role have access to protected areas.
*   **Editor Mode**: A toggle button allows authorized users to enter "Editor Mode," which makes designated text elements on the main page editable using the `contentEditable` attribute.
*   **Content Persistence**: Edits made in Editor Mode are saved to a `content` collection in Firestore. This content is loaded dynamically when any user visits the page, ensuring that changes are live for everyone.
*   **Save Functionality**: A floating "Save Changes" button appears in Editor Mode to write the updated content back to Firestore.

### Admin Panel

*   **Secure Access**: The admin panel is only accessible to logged-in users with the `admin` or `editor` role.
*   **Team Management**: 
    *   **Add Team Members**: A form to add new team members (Team Leader, Captain, DSR) to a `team` collection in Firestore.
    *   **View Team**: A table that displays all current team members from the database.
*   **Data Management**: Allows administrators to upload and manage data for stock, sales, and targets.
    *   **CSV Uploads**: Forms to upload CSV files for stock, sales, and targets directly to Firestore.
    *   **Manual Data Entry**: Forms to manually submit individual sales records, update stock, set targets, and add general KPIs.

## Project Status

*   **Phase 1: Implement Firebase Authentication & User Roles**: **COMPLETED**
    *   Firebase Authentication is fully integrated.
    *   A `users` collection manages roles (`admin`, `editor`).
    *   A secure login system is in place for the admin panel.

*   **Phase 2: Create the "Editor Mode"**: **COMPLETED**
    *   An "Editor Mode" toggle is available for authorized users on the main page.
    *   `contentEditable` is used to allow direct in-page editing.
    *   A "Save Changes" button has been implemented.

*   **Phase 3: Connect Content to Firestore**: **COMPLETED**
    *   Static text from the main dashboard is now stored and fetched from the `content` collection in Firestore.
    *   The "Save Changes" functionality correctly updates the content in Firestore.

*   **Phase 4: Add Team Management**: **COMPLETED**
    *   A "Team Management" section has been added to the admin panel.
    *   Functionality to add and view team members is implemented and connected to the `team` collection in Firestore.
