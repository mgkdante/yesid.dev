import re

# Letter paths data - each letter has multiple paths (main + drips)
letters = {
    'T': [
        'M915.46,418.83q9.1,1.83,9.11,9.12v.45q0,8.66-18.68,12.3-20.49,7.74-20.49,10.48a203,203,0,0,1,15,42.36l3.19,16.86q0,7.41-9.57,9.11-9.67,0-11.39-20.95-5.92-23.81-13.21-36.9l-1.37-.92h-.45q-19.47,10-26,10-8.08-.91-10.48-10.48,0-7.07,11.85-11.39l5.47.46,37.35-20.51Q892.34,425.22,915.46,418.83Z',
        'M907.39,426.55v35.8a5.14,5.14,0,1,0,10.27,0v-35.8Z',
        'M853.39,450.6v21.08a5.14,5.14,0,0,0,10.28,0V450.6Z',
        'M891,512.16V548a5.14,5.14,0,0,0,10.28,0V512.16Z',
    ],
    'H': [
        'M320.11,223.2q9.56,0,9.56,20.49,1.26,35.54,2.74,35.54l-.46,5.92q.92,30.53,2.73,41.91,0,6.84-9.56,9.11-8.78,0-10-14.12l-1.36-26h-.46q-41.44,3.42-45.55,9.57l3.64,16.86q0,6.83-9.57,9.11-8.76,0-11.38-18.68-.69-2.38-5.47-5a9.85,9.85,0,0,1-2.73-6.38v-.91q0-1.71,2.73-7.74v-.46q-11.38-35.76-11.39-38.27,0-6.49,9.11-9.11,9.1,0,12.76,19.59,6.83,20.84,7.74,21.41h.46q31.54-8.76,48.74-9.11l-1.82-40.55Q310.54,223.2,320.11,223.2Z',
        'M314.74,324.33v35.81a5.14,5.14,0,0,0,10.28,0V324.33Z',
        'M254.44,304.36v35.81a5.14,5.14,0,1,0,10.27,0V304.36Z',
        'M284.54,290.14v14.53a5.14,5.14,0,1,0,10.27,0V290.14Z',
    ],
    'E': [
        'M771.39,36.12h4.44q7.63,0,10,7.4v1.82q0,7.75-10,8.66-24.48,0-63.55,7.06,3.19,23.23,4,23.23,16.4-4.44,45.56-10.13,10,2.39,10,8.77-3.42,9.67-11.39,9.68-37.69,7.4-43.73,10.48,1.82,32,6,32l3.53.91h4.9q4.09,0,38.95-14.92l18.34-6.6q9.22,2.51,9.22,9.22,0,8.43-21.41,14-28,12.3-40.32,15.71l-5.24.92q-22.77,0-28.47-19.25-2.61-15-5.69-60.93L693,56.73q4.66-14.91,13.55-14.92l5.69.8Q754.09,36.12,771.39,36.12Z',
        'M745.37,140.9V162a5.14,5.14,0,1,0,10.28,0V140.9Z',
        'M723.83,146.65v35.8a5.14,5.14,0,1,0,10.28,0v-35.8Z',
        'M723.83,43.19v19.6a5.14,5.14,0,0,0,10.28,0V43.19Z',
        'M775.05,42v35.8a5.14,5.14,0,1,0,10.27,0V42Z',
    ],
    'N': [
        'M198.25,415.19q10,0,10,19.59,0,18.23,5.46,48.29v2.73q0,5.81-8.65,10.93c-1.83.23-2.73.54-2.73.91q-3.19,0-21.87-12.75l-33.71-18.68V468q15.48,34.07,15.49,36.45-2.28,9.11-10,9.11h-.45q-6.72,0-12.76-17.77-17.31-40.54-23.23-46.46l-.91-4.11q2.5-10.92,10-10.93,2.73,0,10.93,5.47,16.17,7.41,55.58,30.07h.91v-.46a383.63,383.63,0,0,1-3.19-46Q189.13,417.24,198.25,415.19Z',
        'M199.09,483.07v21.08a5.14,5.14,0,0,0,10.28,0V483.07Z',
        'M173.29,475.71v35.8a5.14,5.14,0,1,0,10.27,0v-35.8Z',
        'M122.36,443.92v35.8a5.14,5.14,0,1,0,10.27,0v-35.8Z',
    ],
    'D': [
        'M570,63.34q42.36,4.44,56,9.11,26.88,9.67,34.63,18.22,1.13,0,2.27,5.47-3.18,12-21.41,27.79a222.19,222.19,0,0,1-48.29,29.15l-2.73.46q-9.57-1.93-9.57-8.66l.46-5.92q-19.14-47.84-22.78-64.23Q558.59,67.22,570,63.34Zm10.48,19.59v.91q13.32,38,17.76,46,13.44-5.7,36.91-24.14,4.54-5.7,4.55-7.29Q631,92.5,606.88,86.57Z',
        'M598.55,141.29v35.8a5.14,5.14,0,1,0,10.28,0v-35.8Z',
        'M593.41,77.86v20.4a5.14,5.14,0,0,0,10.28,0V77.86Z',
        'M616.32,130.28v14.53a5.14,5.14,0,1,0,10.28,0V130.28Z',
    ],
}

def get_bbox(paths):
    """Get approximate bounding box from path coordinates."""
    all_x, all_y = [], []
    for d in paths:
        # Extract all numbers from the path
        nums = [float(x) for x in re.findall(r'[-+]?(?:\d+\.?\d*|\.\d+)', d)]
        # Parse M commands for positions
        tokens = re.findall(r'[MLHVCSQTAZmlhvcsqtaz]|[-+]?(?:\d+\.?\d*|\.\d+)', d)
        cmd = 'M'
        i = 0
        while i < len(tokens):
            t = tokens[i]
            if t.isalpha():
                cmd = t
                i += 1
                continue
            try:
                val = float(t)
            except ValueError:
                i += 1
                continue

            if cmd in ('M', 'L', 'C', 'S', 'Q', 'T'):
                if i + 1 < len(tokens):
                    try:
                        y = float(tokens[i + 1])
                        all_x.append(val)
                        all_y.append(y)
                        i += 2
                        continue
                    except (ValueError, IndexError):
                        pass
            elif cmd == 'H':
                all_x.append(val)
            elif cmd == 'V':
                all_y.append(val)
            elif cmd == 'Z' or cmd == 'z':
                pass
            i += 1

    return (min(all_x), min(all_y), max(all_x), max(all_y))

# Compute bounding boxes
bboxes = {}
for letter, paths in letters.items():
    bbox = get_bbox(paths)
    bboxes[letter] = bbox
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    print(f"{letter}: bbox=({bbox[0]:.1f},{bbox[1]:.1f},{bbox[2]:.1f},{bbox[3]:.1f}) size={w:.1f}x{h:.1f}")

sizes = {}
for letter in letters:
    bbox = bboxes[letter]
    sizes[letter] = (bbox[2] - bbox[0], bbox[3] - bbox[1])

# Layout — tight like real graffiti
gap = 10
line_gap = 15

line1 = ['T', 'H', 'E']
line2 = ['E', 'N', 'D']

line1_width = sum(sizes[l][0] for l in line1) + gap * 2
line1_height = max(sizes[l][1] for l in line1)
line2_width = sum(sizes[l][0] for l in line2) + gap * 2
line2_height = max(sizes[l][1] for l in line2)

total_width = max(line1_width, line2_width)
total_height = line1_height + line_gap + line2_height

print(f"\nLayout: {total_width:.1f} x {total_height:.1f}")

# Build SVG
pad = 5
parts = []
parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad} {-pad} {total_width + pad*2:.1f} {total_height + pad*2:.1f}" fill="none" stroke="none" stroke-width="0">')

# Line 1
x_cursor = 0
for letter in line1:
    bbox = bboxes[letter]
    tx = x_cursor - bbox[0]
    ty = -bbox[1]
    parts.append(f'  <g data-letter="{letter}" transform="translate({tx:.2f},{ty:.2f})">')
    for path_d in letters[letter]:
        parts.append(f'    <path d="{path_d}"/>')
    parts.append('  </g>')
    x_cursor += sizes[letter][0] + gap

# Line 2
x_cursor = 0
y_off = line1_height + line_gap
for letter in line2:
    bbox = bboxes[letter]
    tx = x_cursor - bbox[0]
    ty = y_off - bbox[1]
    parts.append(f'  <g data-letter="{letter}" transform="translate({tx:.2f},{ty:.2f})">')
    for path_d in letters[letter]:
        parts.append(f'    <path d="{path_d}"/>')
    parts.append('  </g>')
    x_cursor += sizes[letter][0] + gap

parts.append('</svg>')

svg = '\n'.join(parts)
outpath = 'static/svg/graffiti/the-end.svg'
with open(outpath, 'w') as f:
    f.write(svg)

print(f"\nWrote {len(svg)} chars to {outpath}")
