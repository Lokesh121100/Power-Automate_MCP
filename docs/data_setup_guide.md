# Recipient Guide: Setting Up Your App Data

Welcome! You have received the **Intellectual Property & Contract Management** Power App package. Follow these steps to get the app connected to your data and running in your environment.

## 1. Create the SharePoint List
For the app to work, you need a SharePoint list with the exact column names and types listed below.

**List Name**: `IP Technologies` (or any name you prefer, but you will need to point the app to it).

### Required Columns:
| Column Name | Type | Notes |
| :--- | :--- | :--- |
| **Title** | Single line of text | (Built-in Title column) |
| **Description** | Multiple lines of text | Plain text is fine. |
| **InventorName** | Single line of text | Full name of the inventor. |
| **ApplicationStatus** | Single line of text | Values like 'Draft', 'Pending Application', 'Submitted'. |
| **FilingDate** | Date and Time | Set to 'Date Only' for simplicity. |

## 2. Import the App
1. Log in to [make.powerapps.com](https://make.powerapps.com).
2. Go to **Apps** > **Import package (canvas)**.
3. Upload the `.zip` file you received.
4. Set the Import Setup to **"Create as new"** and click **Import**.

## 3. Connect to Your SharePoint List
When you open the app for the first time, you will see some yellow error icons because the previous connections belong to the original owner.

1. In the Power Apps Studio, click the **Data** icon (cylinder) on the left menu.
2. Find the existing `'IP Technologies'` connection and click the **three dots (...)** > **Remove**.
3. Click **Add data** > **SharePoint**.
4. Select your SharePoint Site and the **`IP Technologies`** list you created in Step 1.
5. The error icons should disappear instantly!

## 4. Activate Power Automate Flows (If applicable)
If the app includes automated emails or notifications:

1. In [make.powerapps.com](https://make.powerapps.com), go to **Flows** (or inside your Solution).
2. Look for the flows starting with the app's name.
3. Click **Edit** ✏️ on each flow.
4. You will see a "Connections" prompt. Click **Sign in** or select your account for Outlook/SharePoint.
5. Click **Save**.
6. **Turn On**: Go back to the flow details page and ensured the status is set to **"On"**.

---
> [!TIP]
> **Why am I seeing errors?**
> Power Apps uses unique IDs for data sources. When the app moves to a new environment, it needs you to "introduce" it to your specific SharePoint list so it knows where to save information.
