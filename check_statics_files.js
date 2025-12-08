// Quick script to check if statics files exist
import { existsSync } from 'fs';
import { join } from 'path';

const uoPath = 'Ultima Online Classic';
const assetsPath = 'assets/mul';

const files = [
    { name: 'statics0.mul', uo: join(uoPath, 'statics0.mul'), assets: join(assetsPath, 'statics0.mul') },
    { name: 'staidx0.mul', uo: join(uoPath, 'staidx0.mul'), assets: join(assetsPath, 'staidx0.mul') }
];

console.log('Checking statics files...\n');

for (const file of files) {
    const uoExists = existsSync(file.uo);
    const assetsExists = existsSync(file.assets);
    
    console.log(`${file.name}:`);
    console.log(`  UO Classic folder: ${uoExists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  assets/mul folder:  ${assetsExists ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (uoExists && !assetsExists) {
        console.log(`  ⚠️  Need to copy from UO Classic to assets/mul/`);
    }
    console.log('');
}











