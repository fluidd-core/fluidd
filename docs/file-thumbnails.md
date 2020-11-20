# File Thumbnails

## PrusaSlicer & SuperSlicer

Both PrusaSlicer and SuperSlicer allow configuration of thumbnails to be generated alongside your `gcode`. Each slicer has a slightly different configuration.

Fluidd's recommended thumbnails should be the following sizes;
```
300x300 - For the larger previews.
48x48   - For the smaller file thumbs.
```
#### PrusaSlicer

- With PrusaSlicer open, click `Help -> Show Configuration Folder`.
- Navigate to the `printer` folder, and open the appropriate printer profile.
- Find the line labelled `thumbnails` and update to the following;

```
thumbnails = 48x48, 300x300
```

- Now, restart PrusaSlicer, slice a file - and take a look at it in Fluidd!

#### SuperSlicer

- With SuperSlicer open, click through to `Printer Settings -> General` and find the Thumbnails section.
- In the `Small` section add `x: 48, y: 48`, and in the `Large` section add `x: 300, y: 300`
- The Color override and Bed on Thumbnail options are personal preference, but having the Bed on Thumbnail option unticked looks the best!
- Now, restart SuperSlicer, slice a file - and take a look at it in Fluidd!

<img src="images/FluiddThumbsExample.png" width="699" />
