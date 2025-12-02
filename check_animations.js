// Quick script to check what animations are actually loaded
// Run this in browser console after game loads

console.log('='.repeat(60));
console.log('CHECKING LOADED ANIMATIONS');
console.log('='.repeat(60));

if (typeof game === 'undefined' || !game.assetLoader) {
    console.error('Game not loaded yet! Make sure the game is running.');
} else {
    const assets = game.assetLoader.assets.sprites;
    
    // Check walking animations
    console.log('\n📁 WALKING ANIMATIONS:');
    const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
    let loaded = 0;
    let missing = 0;
    
    directions.forEach(dir => {
        const key = `char_walk_${dir}_sheet`;
        const sprite = assets[key];
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            console.log(`✅ ${key}: ${sprite.naturalWidth}x${sprite.naturalHeight}px (${sprite.src})`);
            loaded++;
        } else {
            console.warn(`❌ ${key}: MISSING`);
            missing++;
        }
    });
    
    console.log(`\nSummary: ${loaded}/${directions.length} walking animations loaded`);
    
    // Check other animations
    console.log('\n📁 OTHER ANIMATIONS:');
    const otherAnims = [
        { key: 'char_attack_2h_sheet', name: 'Attack 2H' },
        { key: 'char_cast_sheet', name: 'Cast Spell' },
        { key: 'char_hit_sheet', name: 'Get Hit' },
        { key: 'char_death_sheet', name: 'Death' },
        { key: 'char_p1_idle', name: 'Idle P1' },
        { key: 'char_p2_idle', name: 'Idle P2' }
    ];
    
    otherAnims.forEach(anim => {
        const sprite = assets[anim.key];
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            console.log(`✅ ${anim.name} (${anim.key}): ${sprite.naturalWidth}x${sprite.naturalHeight}px`);
        } else {
            console.warn(`❌ ${anim.name} (${anim.key}): MISSING`);
        }
    });
    
    // List ALL loaded sprites
    console.log('\n📁 ALL LOADED SPRITES:');
    Object.keys(assets).sort().forEach(key => {
        const sprite = assets[key];
        if (sprite && sprite.complete) {
            console.log(`  ${key}: ${sprite.naturalWidth}x${sprite.naturalHeight}px`);
        }
    });
    
    console.log('\n' + '='.repeat(60));
}

