"""Convert E3NG DXF to SVG files for Fluidd theme."""
import ezdxf
import sys

def dxf_to_svg_paths(dxf_path):
    """Extract all LWPOLYLINE entities from DXF and convert to SVG path data."""
    doc = ezdxf.readfile(dxf_path)
    msp = doc.modelspace()

    paths = []
    all_x = []
    all_y = []

    for entity in msp:
        if entity.dxftype() == 'LWPOLYLINE':
            points = list(entity.get_points(format='xy'))
            is_closed = entity.close

            if len(points) < 2:
                continue

            # Collect all coordinates for bounding box
            for x, y in points:
                all_x.append(x)
                all_y.append(y)

            # Build SVG path
            d = f"M {points[0][0]:.3f} {points[0][1]:.3f}"
            for x, y in points[1:]:
                d += f" L {x:.3f} {y:.3f}"
            if is_closed:
                d += " Z"

            paths.append(d)

    # Calculate bounding box
    min_x = min(all_x)
    max_x = max(all_x)
    min_y = min(all_y)
    max_y = max(all_y)

    width = max_x - min_x
    height = max_y - min_y

    # Add padding (5%)
    pad = max(width, height) * 0.05

    return paths, min_x - pad, min_y - pad, width + 2*pad, height + 2*pad

def create_logo_svg(paths, vb_x, vb_y, vb_w, vb_h, output_path):
    """Create the toolbar logo SVG (multi-color with green faces and gray edges)."""
    # DXF Y-axis is inverted relative to SVG
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb_x:.3f} {vb_y:.3f} {vb_w:.3f} {vb_h:.3f}">\n'
    svg += f'  <g transform="scale(1,-1) translate(0,{-(2*vb_y + vb_h):.3f})">\n'

    for i, d in enumerate(paths):
        svg += f'    <path d="{d}" fill="#3D7A2E" stroke="#BCBCBC" stroke-width="0.3" />\n'

    svg += '  </g>\n'
    svg += '</svg>\n'

    with open(output_path, 'w') as f:
        f.write(svg)
    print(f"Wrote {output_path} ({len(paths)} paths)")

def create_icon_svg(paths, vb_x, vb_y, vb_w, vb_h, output_path):
    """Create the sidebar nav icon SVG (uses CSS variables for theming)."""
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb_x:.3f} {vb_y:.3f} {vb_w:.3f} {vb_h:.3f}">\n'
    svg += f'  <g transform="scale(1,-1) translate(0,{-(2*vb_y + vb_h):.3f})">\n'

    for i, d in enumerate(paths):
        svg += f'    <path d="{d}" fill="var(--v-primary-base, #3D7A2E)" stroke="var(--v-primary-offset-base, #BCBCBC)" stroke-width="0.3" />\n'

    svg += '  </g>\n'
    svg += '</svg>\n'

    with open(output_path, 'w') as f:
        f.write(svg)
    print(f"Wrote {output_path} ({len(paths)} paths)")

if __name__ == '__main__':
    dxf_path = r"E:\claude\personal\e3ng.dxf"

    paths, vb_x, vb_y, vb_w, vb_h = dxf_to_svg_paths(dxf_path)
    print(f"Found {len(paths)} polylines")
    print(f"Bounding box: ({vb_x:.1f}, {vb_y:.1f}) size ({vb_w:.1f} x {vb_h:.1f})")

    create_logo_svg(paths, vb_x, vb_y, vb_w, vb_h,
                    r"E:\claude\personal\fluidd\public\logo_e3ng.svg")
    create_icon_svg(paths, vb_x, vb_y, vb_w, vb_h,
                    r"E:\claude\personal\fluidd\public\icon_e3ng.svg")
