---
title: Cameras
---

# Cameras

Fluidd offers robust support for displaying camera streams, providing users
with real-time monitoring capabilities for their 3D printing projects.

The current supported types are:

| Type                         | Description                                                                                                                    |
|------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| **MJPEG Stream**             | Traditional mjpegstream/ustreamer service. Pushes images at the configured resolution and FPS. Requires substantial bandwidth. |
| **MJPEG Adaptive**           | Pulls images from the mjpegstream/ustreamer snapshot URL at a target FPS. More reliable on unstable connections.               |
| **UV4L-MJPEG Stream**        | Similar to MJPEG Stream but with lower browser impact — no worker thread, no FPS indication.                                   |
| **HLS Stream**               | Loads an HLS video stream via [HLS.js](https://hlsjs.video-dev.org/). Requires a modern browser with MediaSource Extensions.   |
| **WebRTC (camera-streamer)** | Highly bandwidth-efficient stream. Currently only available on Raspberry devices.                                              |
| **WebRTC (go2rtc)**          | Loads a WebRTC stream from go2rtc.                                                                                             |
| **WebRTC (MediaMTX)**        | Loads a WebRTC stream from MediaMTX.                                                                                           |
| **IP Camera**                | Experimental — replaces the `<img>` tag with a `<video>` tag. Use only if your URL supports native HTML5 video.                |
| **HTTP Page**                | Loads a website in place of the camera feed. Use for embedding video feeds not supported by the other methods.                 |

Visit the UI Settings page to define and configure your cameras.

![screenshot](/assets/images/camera_settings.png)

## Crowsnest support

For optimal performance and feature-rich streaming, we recommend using
**Crowsnest** as your preferred streamer in conjunction with Fluidd.

Crowsnest seamlessly integrates with Fluidd, offering extensive configuration
options tailored for a wide range of devices.

Please check the [Crowsnest documentation](https://crowsnest.mainsail.xyz/) for
more information.
