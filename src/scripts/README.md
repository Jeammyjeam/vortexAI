# VORTEX AI GRID - Admin Scripts

This directory contains command-line scripts for performing administrative tasks that are not suitable for the main application UI, such as bootstrapping the first admin user.

## `set-admin.mjs`

This script grants a user the `admin` role by setting a custom claim on their Firebase Authentication account. This is a necessary first step to allow a user to perform protected actions, like approving or rejecting products.

### Prerequisites

1.  **Service Account Key**: You must have a Firebase service account key. You can download this from your Firebase Project Settings > Service accounts.
2.  **Environment Variable**: You must set the `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable. The recommended way is to create a `.env.local` file in the root of the project and add your service account key as a JSON string:
    ```
    FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", "project_id": "...", ...}'
    ```

### Usage

Run the script from the root of your project using `npm run set-admin`, passing the user's email address as an argument.

```bash
npm run set-admin -- user.email@example.com
```

If successful, the script will confirm that the admin claim has been set. The user will need to sign out and sign back in for the new claim to be reflected in their ID token.
