const bip39Words = require('./bip39.js');
const { ethers } = require('ethers');

// Function to convert hex string to binary
function hexToBinary(hexString) {
    return BigInt('0x' + hexString).toString(2).padStart(hexString.length * 4, '0');
}

// Function to convert binary string to words using BIP39 wordlist
function binaryToWords(binaryString) {
    const wordList = [];
    for (let i = 0; i < binaryString.length; i += 11) {
        const binaryChunk = binaryString.slice(i, i + 11);
        const wordIndex = parseInt(binaryChunk, 2);
        wordList.push(bip39Words[wordIndex]);
    }
    return wordList;
}

// Main function to generate words from block hash
function generateWordsFromHash(blockHash) {
    // Remove '0x' if it exists
    if (blockHash.startsWith('0x')) {
        blockHash = blockHash.slice(2);
    }

    // Convert block hash to binary
    const binaryString = hexToBinary(blockHash);

    // Generate words from binary string
    const words = binaryToWords(binaryString);

    return words;
}

// Example usage:
const blockHash = '0000000000000000000ae659f9b4e1f8f0c9f0e9f01a1e9010b7c8de28a6d1ed'; // Example hash
const words = generateWordsFromHash(blockHash);

// console.log('Generated BIP39 words:', words.join(' '));


const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');

provider.on('block', async (blockNumber) => {
    const block = await provider.getBlock(blockNumber);
    const blockHash = block.hash;
    const words = generateWordsFromHash(blockHash);
    console.log('***********************************');
    console.log('Block number:', blockNumber);
    console.log('Block hash:', blockHash);
    console.log('-----------------------------------');
    console.log(words.join(' '));
    console.log('-----------------------------------');
});