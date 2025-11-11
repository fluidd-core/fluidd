---
layout: default
title: Cameras
parent: Features
nav_order: 12
permalink: /features/cameras
---

# Cameras
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

Fluidd offers robust support for displaying camera streams, providing users
with real-time monitoring capabilities for their 3D printing projects.

The current supported types are:

- **MJPEG Stream**  
  - Traditional mjpegstream/ustreamer service.
  - Pushes images to Fluidd at the configured resolution and FPS.
  - Requires substantial bandwidth and may encounter issues with unstable
    network connections.

- **MJPEG Adaptive**  
  - Pulls images from the mjpegstream/ustreamer service using the snapshot URL.
  - Allows setting a target FPS, enabling your browser to maintain the intended
    frame rate.
  - A more reliable approach in certain scenarios.

- **UV4L-MJPEG Stream**
  - Similiar to regular MJPEG Stream, however it has lower impact on the browser
    as it doesn't use a worker to read the stream and thus has no FPS
    indication.

- **HLS Stream**  
  - Loads an HLS (HTTP Live Streaming) video stream via [HLS.js](https://hlsjs.video-dev.org/).
  - Utilizes HTML5 video and MediaSource Extensions for playback, requiring a
    modern browser.

- **WebRTC (camera-streamer)**
  - A highly bandwidth-efficient stream type.
  - **IMPORTANT:** Currently only available on Raspberry devices.

- **WebRTC (go2rtc)**  
  - Loads a webrtc stream from go2rtc.
  - Example stream URL: `http(s)://your.domain/webrtc/stream.html?src=trident&mode=webrtc`

- **WebRTC (MediaMTX)**  
  - Loads a webrtc stream from MediaMTX.
  - Example stream URL: `http(s)://your.domain/stream`

- **IP Camera**  
  - Experimental option replacing the `<img>` tag with a `<video>` tag.
  - Use only if your provided URL supports native HTML5 video tags.

- **HTTP Page**  
  - Loads a website, displaying it in place of the camera feed.
  - Allows embedding any web video feed not supported by the aforementioned
    methods.

Visit the UI Settings page to define and configure your cameras.

![screenshot](/assets/images/camera_settings.png)

## Crowsnest support

For optimal performance and feature-rich streaming, we recommend using
**Crowsnest** as your preferred streamer in conjunction with Fluidd.

Crowsnest seamlessly integrates with Fluidd, offering extensive configuration
options tailored for a wide range of devices.

Please check the [Crowsnest documentation](https://crowsnest.mainsail.xyz/) for
more information.
