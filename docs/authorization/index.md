---
layout: default
title: Authorization
nav_order: 5
has_children: false
permalink: /authorization
---

# Authorization
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

Fluidd supports JWT authorization through moonrakers authentication endpoints.

## Setup

- If you have a fluiddpi install from version 1.15+, then simply add a new user
with Fluidd, after which time you'll be prompted for authorization.

- If you have an older fluiddpi install,  add `force_logins` to your moonraker configuration. After restarting moonraker, add a user.

```sh
 [authorization]
 force_logins: true
```

## Forced Logins?

1. With `forced_logins` set to `true` and with no users defined - moonraker defaults
to your `trusted_clients:` setup.

2. With `forced_logins` set to `true` and with one or more users defined - moonraker
will ignore your `trusted_clients:` setup, and require authorization credentials.

3. With `forced_logins` set to `false`, moonraker will always rely on your
`trusted_clients:` setup first.

Under default conditions, a fresh installation would have your client trusted.
You can confirm this by noting your currently authenticated user.

## Lost password?

Lost your only password? You need to revert to a trusted setup. You can do this
by editing your `moonraker.conf` and turning `forced_logins` to `false`.


![screenshot](/assets/images/auth_trusted.png)

{: .fs-6 .fw-300 }
