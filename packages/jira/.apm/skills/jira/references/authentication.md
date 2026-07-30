# Jira Authentication

Jira authentication uses an Atlassian API token stored in 1Password. Never paste the token into chat or expose it in terminal output.

## User Setup

1. Create an API token at <https://id.atlassian.com/manage-profile/security/api-tokens>.
2. In 1Password, create a **Login** item.
3. Set its username to your Jira email address (`firstname.lastname@weareyuma.com`).
4. Store the API token in the item's password field.
5. From the item's three-dot menu, select **Copy Item UUID** and provide only that UUID to the agent.

## Agent Login

Pass the supplied item UUID to the bundled login script:

```bash
scripts/login.sh '<1password-item-uuid>'
```

The script reads the Login item's username and password, pipes the password directly to `acli`, and verifies the login. It never prints the password or places it in a command argument. The user may need to approve 1Password access with Touch ID.