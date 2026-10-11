#!/usr/bin/env python3
"""
Print the Dot Pad's button presses, to confirm which buttons the game can use.

Usage (Dot Pad on USB, no other app using it):
    python3 tools/listen-keys.py            # auto-picks /dev/cu.usbserial-*0
Press each button (◀, F1, F2, F3, F4, ▶); press Ctrl+C to stop.

Protocol per NVDA's open-source Dot Pad driver: 115200 baud, packets
AA 55 <len:2> <dest> <cmd:2> <seq> <data…> <checksum>; key notifications are
commands 0x0302 (scroll/panning), 0x0312 (perkins), 0x0322 (routing),
0x0332 (function keys).
"""
import glob, os, select, struct, sys, termios, time

NAMES = {0x0302: 'panning', 0x0312: 'perkins', 0x0322: 'routing', 0x0332: 'function'}

def open_port(path):
    fd = os.open(path, os.O_RDWR | os.O_NOCTTY | os.O_NONBLOCK)
    a = termios.tcgetattr(fd)
    a[0] = a[1] = a[3] = 0
    a[2] = termios.CS8 | termios.CREAD | termios.CLOCAL
    a[4] = a[5] = termios.B115200
    termios.tcsetattr(fd, termios.TCSANOW, a)
    return fd

ports = sys.argv[1:] or sorted(p for p in glob.glob('/dev/cu.usbserial-*') if p.endswith('0'))
if not ports:
    sys.exit('No Dot Pad serial port found. Is it plugged into the left (data) port and switched on?')
fd = open_port(ports[0])
print(f'Listening on {ports[0]} — press the Dot Pad buttons (Ctrl+C to stop)…')
buf = bytearray()
try:
    while True:
        if select.select([fd], [], [], 0.2)[0]:
            buf += os.read(fd, 1024)
        while len(buf) >= 4:
            if buf[0] != 0xAA or buf[1] != 0x55:
                del buf[0]
                continue
            n = struct.unpack('>H', bytes(buf[2:4]))[0]
            if len(buf) < 4 + n:
                break
            body = bytes(buf[4:4 + n]); del buf[:4 + n]
            cmd = (body[1] << 8) | body[2]
            data = body[4:-1]
            if cmd in NAMES:
                state = 'released' if not any(data) else f'pressed  bits={data.hex()}'
                print(f'{time.strftime("%H:%M:%S")}  {NAMES[cmd]:<8} {state}')
except KeyboardInterrupt:
    pass
finally:
    os.close(fd)
