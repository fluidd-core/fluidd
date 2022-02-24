---
layout: default
title: Console
parent: Features
nav_order: 6
permalink: /features/console
---

# Console
{: .no_toc }

---

Fluidd's console has a bunch of hidden features;

1. Hit the ↑ up and ↓ down arrow keys to scroll through your console history.
   This history is saved across sessions!

2. The console has autocomplete, built in! Start typing, and hit the TAB key
   to retrieve a list of available commands.

3. Known commands in the console are clickable! Try clicking a command, and
   you'll see it appear in the console entry text area.

4. Want to know a full list of klipper commands? Type `help` and hit return!

5. You can filter the console output the way you'd like!
   Head on over to the console settings tab to configure custom filters.
   Currently, the following types of filters are supported:
   * `contains` - Outputs only messages that contain the given string (case insensitive)
   * `starts with` - Outputs only messages that start with the given string (case insensitive)
   * `expression` - Outputs only messages that match the given [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) (e.g. `Klipper state: .*`) (case sensitive)

![screenshot](/assets/images/console.png)
