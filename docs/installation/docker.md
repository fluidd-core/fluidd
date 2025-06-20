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

We have an [official docker image](https://github.com/fluidd-core/fluidd/pkgs/container/fluidd),
serving Fluidd by default on port 80.

For those who have specific security requirements and need/want to run an
unpriviledged container, we also have an [unprivileged docker image](https://github.com/fluidd-core/fluidd/pkgs/container/fluidd-unprivileged)
available, serving Fluidd by default on port 8080.

You can override the default port where Fluidd will be served by setting the
`PORT` environment variable when starting the docker container.

Both of these docker images are updated for each release and on each commit.

This is a list of the available docker image tags:

- `latest`: points to the most recent release
- `v*.*.*`: points to a specific release
- `latest-master`: points to the most recent commit to the "master" branch
- `latest-develop`: points to the most recent commit to the "develop" branch
- `sha-<hash>`: points to a specific git commit hash

[View on GitHub Container registry](https://github.com/fluidd-core/fluidd/pkgs/container/fluidd){: .btn .fs-5 .mb-4 .mb-md-0 }
