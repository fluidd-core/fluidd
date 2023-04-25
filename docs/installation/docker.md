---
layout: default
title: Docker
parent: Installation
nav_order: 2
permalink: /installation/docker
---

# Docker
{: .no_toc }

---

Fluidd can be hosted with Docker. This is considered an advanced install, but
gives you the benefit of hosting a single instance of Fluidd, and having it
connect to multiple printers.

The docker image is updated automatically with each release of Fluidd, and
on each commit to the "master" or "develop" branches.

This is a list of the available docker image tags:

- `latest`: points to the most recent release
- `v*.*.*`: points to a specific release
- `latest-master`: points to the most recent commit to the "master" branch
- `latest-develop`: points to the most recent commit to the "develop" branch
- `sha-<hash>`: points to a specific git commit hash

[View on GitHub Container registry](https://github.com/fluidd-core/fluidd/pkgs/container/fluidd){: .btn .fs-5 .mb-4 .mb-md-0 }
