---
title: Authorization
---

# Authorization

Fluidd supports JWT authorization through Moonraker's authentication endpoints.

## API Keys

Moonraker stores API keys in its internal database. To retrieve your API key:

- From a trusted client, navigate to `http://{moonraker-host}/access/api_key`
- Or run `~/moonraker/scripts/fetch-apikey.sh` on the host machine

## Setup

If authorization is not yet enabled:

1. Open Fluidd and go to **Settings → Authorization**
2. Click **Add User** and create your first user account with a username and password
3. Once a user exists, login is required when `force_logins: true` is set in
   `moonraker.conf`, or when the connecting client is not in `trusted_clients`.
   See [Understanding forced logins](#understanding-forced-logins) for details.
4. By default, trusted clients (LAN IPs) bypass the login screen while
   `force_logins` remains `false` — adjust these settings if you want local
   connections to always require logging in.

If you're locked out, see the [Lost Password](#lost-password) section.

## Understanding forced logins

The `force_logins` setting controls how Moonraker handles authentication:

| `force_logins` | Users defined? | Behavior                                            |
|----------------|----------------|-----------------------------------------------------|
| `false`        | —              | Relies on `trusted_clients` first                   |
| `true`         | No             | Falls back to `trusted_clients`                     |
| `true`         | Yes            | Ignores `trusted_clients`, requires authentication  |

A fresh installation has your client trusted by default. You can confirm this
by checking your currently authenticated user.

![Authentication settings showing a trusted user entry](/assets/images/auth_trusted.png)

## Lost Password

Lost your only password? You need to revert to a trusted setup. You can do this
by editing your `moonraker.conf` and turning `force_logins` to `false`.

## LDAP Configuration

Fluidd supports LDAP authentication through Moonraker's `[ldap]` component,
enabling centralized login with Active Directory or any LDAP-compatible server.
For the full configuration reference, see the
[Moonraker LDAP documentation](https://moonraker.readthedocs.io/en/latest/configuration/#ldap).

Two Fluidd-specific steps after configuring `[ldap]` in Moonraker:

- Remove `trusted_clients:` from `[authorization]` to require authentication
  from all clients, including local ones.
- Set `default_source: ldap` in `[authorization]` to make LDAP the default
  login interface.

!!! tip "Secrets file location"
    Store the secrets file in a separate directory from `moonraker.conf`
    (e.g. `~/klipper_secure/moonraker_secure.json`) — Moonraker enforces this
    as a security requirement.

![Login page showing multiple authentication source options](/assets/images/auth_login_multisource.png)
![Login source selector dropdown listing LDAP and local options](/assets/images/auth_login_multisource_select.png)

### Common LDAP Issues

- **"LDAP connection refused"** — verify the LDAP server address and port
  (default: 389 for LDAP, 636 for LDAPS)
- **"Invalid credentials"** — check the bind DN and password in `moonraker.conf`
- **User can log in but has no access** — ensure the user is in the correct LDAP
  group (if `group_dn` is configured)
- **SSL/TLS errors** — for LDAPS, ensure the certificate is trusted on the
  Moonraker host
