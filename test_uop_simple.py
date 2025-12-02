"""Simple test to verify UOP file reading works"""
from pathlib import Path
import struct

uop_file = Path('Ultima Online Classic/map0LegacyMUL.uop')
print(f"Testing: {uop_file}")
print(f"Exists: {uop_file.exists()}")

if uop_file.exists():
    print(f"Size: {uop_file.stat().st_size / 1024 / 1024:.1f} MB")
    with open(uop_file, 'rb') as f:
        magic = f.read(4)
        print(f"Magic: {magic} ({'OK' if magic == b'MYP\x00' else 'FAIL'})")
        if magic == b'MYP\x00':
            version = struct.unpack('<I', f.read(4))[0]
            print(f"Version: {version}")
            print("✅ UOP file is readable!")



