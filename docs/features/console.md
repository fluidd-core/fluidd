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

Fluidd's console comes with these some sophisticated features:

- **Effortless History Navigation**  
  - Scroll through your console history using the <kbd>&uarr;</kbd> and
    <kbd>&darr;</kbd> keys.
  - Benefit from intelligent history preservation across sessions for a
    seamless workflow.

- **Intelligent Autocomplete Functionality**  
  - Harness the power of built-in autocomplete by initiating a command and
    using the <kbd>Tab</kbd> key.

- **Clickable Commands**
  - Click any known command, and watch it populate the console text entry area.

- **Klipper Commands Listing**
  - Gain insights into Klipper commands with ease by typing `help` and hitting
    return to access an extensive list of available commands.

- **Tailored Console Output**
  - Visit the Console Settings to configure custom filters, including:
    - `contains`: Hides messages containing the specified string (case
      insensitive).
    - `starts with`: Hides messages that commence with the given string (case
      insensitive).
    - `expression` - Filters messages matching the provided [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)  
      (e.g. `probe at [\d\.,]+ is z=[01]\.\d+`) (case sensitive)

![screenshot](/assets/images/console.png)
