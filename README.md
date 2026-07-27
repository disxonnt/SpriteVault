# Sprite Vault

A tracker for the Fortnite sprite collection - all 91 sprites and variants, built from scratch instead of using one of the generic checklist sites everyone else uses.

**Live:** https://disxonnt.github.io/SpriteVault/

## What's in here

This repo is just a static site, no frameworks or build step, everything runs straight in the browser:

- `index.html` - page structure
- `style.css` - the whole look, dark theme with a holo shimmer effect on the rarer sprites
- `app.js` - all the logic, filtering, saving progress, image export, share links
- `data.js` - the actual sprite list, names, themes, rarities
- `sprites/` - every sprite image
- `siteimages/` - pfp and branding stuff

## Features

Tracks collection progress and mastery progress separately with their own progress bars. You mark something collected by clicking it, mastered by right clicking it (or holding it down if you're on your phone).

Can filter the grid by theme, rarity, or owned/unowned, plus a search bar if you're looking for something specific. There's also a toggle to hide anything you've already mastered so you can focus on what's left, and one to group everything by theme instead of scrolling one long list.

Four buttons at the top let you spit out a downloadable image of your missing sprites, your full collection, unmastered stuff, or just your mastered ones. Useful for posting progress without screenshotting the whole page.

There's also a share button - it packs your current collection into a link, and anyone who opens it sees a read-only view of what you've got. Doesn't touch anything on their end.

Everything saves in your browser automatically. No accounts, no database, nothing leaves your device unless you hit share.

Rarity data (Rare/Epic/Legendary/Mythic/Special) is pulled from fortnite.gg, not guessed.

## Who made this

disxonnt - https://www.youtube.com/@disxonnt

creator code: disxonnt

Sprite trading discord: https://discord.gg/uXeSdqbsPf

Unofficial fan project, nothing to do with Epic Games.
