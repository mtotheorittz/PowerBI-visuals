#Hexbin Scatterplot Release Notes

## Known Issues

- Visual will not render on Power BI iOS app or Safari in MacOS

## 0.9.7

- Fixed issue where visuals are affected by actions made under other Hexbin Scatterplot visuals in the same report
- Bin size now based on container width instead of pixels and defaults to 10%

## 0.9.6

- Fixed issue with overlapping Y axis labels
- Accounted for dots potentially blending with rug when the two overlap
- Fixed issue where visual would not refresh if Details, X Axis, or Y Axis removed
- Fixed issue with rendering with incomplete data
- Fixed Format Options for "Display" where initially turning off one option would turn off all three
- Dots appear darker
- Added notification when required fields not present: Details, X Axis, Y Axis
- Added notification when the height or width are too small to render the visual properly

## 0.9.5

Not released to Gallery, internal changes only 

## 0.9.4 

Initial release to [Custom Visuals Gallery](https://app.powerbi.com/visuals/)
