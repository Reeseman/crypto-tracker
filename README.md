# Crypto Tracker

## Overview

If:
- Your coins are not stored in one location
- Your coins are stored securely in wallets
- You don't want to sign in to a bunch of services just to view your coins
- You don't want to need a web browser or app to view your coins
- You're a long term hodler and only want to occasionally check your coins
- You want a simple command line app to check your coins
- You're interested in the generalized status of your coins

Then this is the place for you! This script is a dead-simple way to check the status of all your coins, from the command line, in a completely secure manner. 

## Internals

I almost never write in JS, so I am probably really bad at code convention, best practices etc. But basically, all it uses is `request` and `fs`. We hit a free crypto api endpoint to get our data. You do not store any coins here at all, but just let the script know what you know you have, somewhere, and what price you purchased at. 

## Example

Once set up, the output looks like this:
![Terminal Output](https://i.imgur.com/cVWEES4.png)
For me, this has been really handy! So I figure why not publish it to git.

## Setup

1. Set up `npm`. I'm using v7.0.10 but you could probably use many versions.
2. Run `npm install`.
3. Set up `purchases.json`. You can start by copying `purchases-example.json`. You can input everything you own there, purchase by purchase.
4. Optional: set up `targets.json`. This file contains some price points you're hoping to sell at, as a reminder. You can start by copying  `targets-example.json`. You can put in as many target values you want to hit in there.
5. Optional: set up tax rate variable in `index.js`. I assume it's going to be something like 20%. You can figure this one out on your own.
6. Optional but recommended: set up a bash alias for the script. Mine is just `crypto`. The command to run the script is `node /my/path/to/crypto-tracker/index.js` , so in my bash rc, I have `alias crypto="node /my/path/to/crypto-tracker/index.js"`.
