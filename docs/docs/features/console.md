---
title: Console
---

# Console

Fluidd's console lets you send G-code commands to Klipper and view responses
in real time.

## History

Use ++arrow-up++ and ++arrow-down++ to scroll through previously entered
commands. History is preserved across sessions.

## Autocomplete

Start typing a command and press ++tab++ to autocomplete. If multiple matches
exist, they are printed to the console output.

## Clickable commands

Click any known command in the output to copy it into the input field.

## Command reference

Type `help` and press ++enter++ to list all available Klipper commands.

## Output filters

Configure custom filters in Console Settings to hide unwanted messages:

| Filter        | Description                                                                                                                                              |
|---------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| `contains`    | Hides messages containing the specified string (case insensitive)                                                                                        |
| `starts with` | Hides messages starting with the given string (case insensitive)                                                                                         |
| `expression`  | Hides messages matching a [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) (case sensitive) |

![screenshot](/assets/images/console.png)
