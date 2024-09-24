const { ethers } = require('ethers');
const cliProgress = require('cli-progress');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Updated to use the Polygon RPC provider
const provider = new ethers.JsonRpcProvider('https://polygon.llamarpc.com/');

// Parse CLI arguments for block number
const argv = yargs(hideBin(process.argv))
  .option('block', {
    alias: 'b',
    type: 'string',
    description: 'Starting block (absolute number or relative offset, e.g., -5)',
    default: 'latest',
  })
  .argv;

// Race parameters
const totalDistance = 100;  // Total distance horses need to travel
const numHorses = 12;        // Number of horses
const chunkSize = 2;        // Bytes per chunk for horse pace
const delay = 3000;         // Delay between block fetches in ms

// Helper function to split the hash into 2-byte chunks
function splitHashToPace(hash, numHorses) {
  const paces = [];
  for (let i = 0; i < numHorses; i++) {
    const chunk = hash.slice(i * chunkSize * 2, (i + 1) * chunkSize * 2); // 2-byte chunk
    paces.push(parseInt(chunk, 16) % 10); // Reduce chunk to manageable speed (0-9)
  }
  return paces;
}

// Horse class to track progress
class Horse {
  constructor(name, bar) {
    this.name = name;
    this.distance = 0;
    this.bar = bar;
  }

  updateProgress(pace, multiplier) {
    this.distance += pace * multiplier;
    this.bar.update(this.distance);
  }

  hasWon() {
    return this.distance >= totalDistance;
  }
}

async function getStartingBlock(blockArg) {
  if (blockArg === 'latest') {
    return await provider.getBlockNumber();
  }
  
  const currentBlock = await provider.getBlockNumber();
  const relativeMatch = /^-?\d+$/.test(blockArg);
  
  if (relativeMatch) {
    // Handle relative block offsets
    const offset = parseInt(blockArg, 10);
    return Math.max(currentBlock + offset, 0);  // Ensure block number is non-negative
  } else if (/^\d+$/.test(blockArg)) {
    // Handle absolute block numbers
    return parseInt(blockArg, 10);
  } else {
    throw new Error("Invalid block argument. Use an absolute block number or a relative offset (e.g., -5).");
  }
}

async function race() {
  // Create a multi-bar instance
  const multiBar = new cliProgress.MultiBar({
    clearOnComplete: false,
    hideCursor: true,
    format: '{name} [{bar}] {percentage}% | {value}/{total} Distance',
    barGlue: '🐎', // Use the horse emoji as the progress bar glue
  }, cliProgress.Presets.shades_classic);

  const horses = Array.from({ length: numHorses }, (_, i) => {
    // pad the horse number with 0s for alignment
    const name = `Horse ${String(i + 1).padStart(2, '0')}`;
    const bar = multiBar.create(totalDistance, 0, { name});
    return new Horse(`Horse ${i + 1}`, bar);
  });

  let winner = null;

  // Determine the starting block based on input
  const startingBlock = await getStartingBlock(argv.block);
  let currentBlock = startingBlock;

  // Initial catch-up loop
  while (!winner && currentBlock <= (await provider.getBlockNumber())) {
    const block = await provider.getBlock(currentBlock);
    if (!block) {
      console.log(`Block ${currentBlock} not found.`);
      break;
    }

    const hash = block.hash.slice(2); // Get rid of '0x' prefix
    const paces = splitHashToPace(hash, numHorses);

    // Convert BigInt to Number for gas usage calculation
    const gasUsed = Number(block.gasUsed);
    const gasLimit = Number(block.gasLimit);

    // Calculate the gas usage percentage to use as a multiplier
    const gasMultiplier = gasUsed / gasLimit;

    horses.forEach((horse, idx) => {
      horse.updateProgress(paces[idx], gasMultiplier);
      if (horse.hasWon() && !winner) {
        winner = horse.name;
      }
    });

    if (!winner) {
      currentBlock++;  // Increment block number for the next iteration
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  if (winner) {
    multiBar.stop();
    console.log(`🏆 ${winner} wins the race!`);
    return;
  }

  // Switch to event-driven blocks after catching up
  provider.on('block', (newBlockNumber) => {
    provider.getBlock(newBlockNumber).then((block) => {
      if (!block) return;

      const hash = block.hash.slice(2); // Get rid of '0x' prefix
      const paces = splitHashToPace(hash, numHorses);

      // Convert BigInt to Number for gas usage calculation
      const gasUsed = Number(block.gasUsed);
      const gasLimit = Number(block.gasLimit);

      // Calculate the gas usage percentage to use as a multiplier
      const gasMultiplier = gasUsed / gasLimit;

      horses.forEach((horse, idx) => {
        horse.updateProgress(paces[idx], gasMultiplier);
        if (horse.hasWon() && !winner) {
          winner = horse.name;
        }
      });

      if (winner) {
        multiBar.stop();
        console.log(`🏆 ${winner} wins the race!`);
        provider.removeAllListeners('block');
      }
    }).catch(console.error);
  });
}

race().catch(console.error);
