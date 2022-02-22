---
layout: default
title: Cameras
parent: Features
nav_order: 10
permalink: /features/cameras
---

# Cameras
{: .no_toc }

---

Fluidd (and FluiddPI) has built in support for web cameras.

On older versions of FluiddPI (pre 1.15) you can edit the file found here;
`/boot/fluiddpi.txt`.

Versions of FluiddPI after 1.14 allow configuring your cameras from the same
place as your other configuration files, and can be found in the `webcam.txt`
file.

In both cases, Instructions are contained within the files.

You can add up to four cameras to display on your dashboard.

Currently supported types are;

- MJPEG Stream
  This is the traditional mjpegstream service. The service pushes images to
  fluidd at the configured resolution and FPS you have setup. This requires
  a lot of bandwidth, and can cause issues with unstable network connections.

- MJPEG Adaptive
  This will PULL images from the mjpegstream service, using the snapshot URL.
  You can set a target FPS, and your browser will try to keep up with the
  intended target. This can be a more reliable approach for some.

- IP Camera
  This is an experimental option. Effectively, it swaps out the `<img>` tag
  for a `<video>` tag. You should only use this if you can provide a URL
  that supports native HTML5 video tags.

Head on over to the UI Settings page to define your cameras.

![screenshot](/assets/images/camera_settings.png)

# Setting up multiple cameras on FluiddPi

Up to four cameras are supported by the stock configuration.
In order to make them work, you need to

1. Copy the `webcam.txt` configuration file into a new one 
   matching the `webcam*.txt` wildcard.
   Make sure each configuration file points to a different camera.
   For example, one configuration file might have `camera="usb"` and
   the other one `camera="auto"`.
   Make any other adjustments if needed.
3. Make sure each configuration file has a different port settings.
   By default `mjpg_streamer` will listen on port `8080`.
   Up to four cameras are supported by the default nginx configuration,
   from port `8080` to `8083`. Configure it by setting up
   the `camera_http_options` parameter.
   Example: `camera_http_options="-n -p 8081"`
4. Restart webcamd either via the tools drawer in the top right of the UI
   or via SSH: `sudo systemctl restart webcamd`.
   Alternatively, you could restart your device.
6. Add a new camera in the fluidd web interface.
   Camera URL should be `webcam1/?action=stream` for the streamer on port 8081;
   `webcam2/?action=stream` for port 8082;
   `webcam3/?action=stream` for port 8083.
