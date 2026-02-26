# Exporting Your Power App as a Package

This guide will help you export your "Intellectual Property & Contract Management System" app as a shareable package for users outside your organization.

## Steps to Export

### 1. Locate the App
1. Go to [make.powerapps.com](https://make.powerapps.com).
2. Ensure you are in the correct **Environment**.
3. Select **Apps** from the left-hand menu.

### 2. Initiate Export
1. Find your app (**FinalDashboardScreen** or similar).
2. Click the **three dots (...)** next to the app name.
3. Select **Export package (preview)**.

### 3. Configure the Package
1. **Name Your Package**: Give it a clear name (e.g., `IP_Contract_Management_v1.7`).
2. **Review Resources**: Look at the "Review Package Content" section.
    - **App**: Set this to "Create as new" (default for sharing with others).
    - **SharePoint/Dataverse Connections**: These will be marked as "Select during import". Leave them as they are. This ensures the recipient can connect to their own data sources.

### 4. Download
1. Click the **Export** button at the bottom right.
2. A `.zip` file will download to your computer.

## How to Share
1. Send the downloaded `.zip` file to the person outside your organization.
2. They will need to:
    - Go to their own Power Apps portal.
    - Click **Apps** > **Import package (canvas)**.
    - Upload your `.zip` file.
    - Connect the app to their own data sources (or a copy of your SharePoint list).

## The Advanced Way: Using Solutions (Recommended for Flows)

If your app uses **Power Automate flows**, exporting as a "Solution" is the professional method. This bundles the app and its flows together so they stay connected.

### 1. Create a Solution
1. In [make.powerapps.com](https://make.powerapps.com), click **Solutions** on the left menu.
2. Click **+ New solution**. Give it a name like `IP_Management_System`.
3. Select a **Publisher** (you can create a default one). Click **Create**.

### 2. Add Your Components
1. Open your new solution.
2. Click **Add existing** > **App** > **Canvas app** and select your dashboard.
3. Click **Add existing** > **Automation** > **Cloud flow** and select any flows you use.

### 3. Export the Solution
1. In the Solutions list, select your solution and click **Export**.
2. Select **Unmanaged** (best for sharing with others who want to edit/customize).
3. Click **Export** and download the `.zip`.

## Why use Solutions?
- **Everything stays connected**: The recipient won't have to manually hunt for the flows.
- **Dependency Tracking**: Power Apps will warn you if you forgot to include a specific flow or table.
- **Professional Deployment**: This is the industry standard for moving apps between "Development" and "Production" environments.

---

> [!IMPORTANT]
> **What about the SharePoint List?**
> The package contains the **App Design** but not the **Actual SharePoint List**. When the recipient opens the app:
> 
> 1. **Option A: Shared Data**: If you want them to use **your** data, you must share the SharePoint Site and List with them (as a Guest user).
> 2. **Option B: Independent Copy**: If they want their own data, they must create a SharePoint list in **their own site** with the **exact same column names**. 
>    - They will then need to delete the "broken" data source in the app and add their new list as a connection.
