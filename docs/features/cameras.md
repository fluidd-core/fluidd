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
file. If you are using the Pi camera, and want to make changes to the default settings, you may need to uncomment and set camera="raspi" instead of auto. Otherwise, it might detect it as a USB camera and apply the settings for the USB camera. This link outlines some of the changes you can make to it: https://community.octoprint.org/t/available-mjpg-streamer-configuration-options/1106

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
