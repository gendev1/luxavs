require('dotenv').config();
const fs = require('fs');
const path = require('path');
const ethers = require('ethers');

// Environment Configuration
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const LUX_SERVICE_MANAGER_ADDRESS = process.env.LUX_SERVICE_MANAGER_ADDRESS;
const AUTHENTICATION_CONTROLLER_ADDRESS = process.env.AUTHENTICATION_CONTROLLER_ADDRESS;

// Utility functions
function printBoxed(message) {
    const lines = message.split('\n');
    const maxLength = Math.max(...lines.map((line) => line.length));
    const border = '═'.repeat(maxLength + 4);

    console.log(`╔${border}╗`);
    for (const line of lines) {
        const padding = ' '.repeat(maxLength - line.length);
        console.log(`║ ${line}${padding} ║`);
    }
    console.log(`╚${border}╝`);
}

async function main() {
    printBoxed('Lux Protocol Address Checker');

    try {
        // Connect to the network
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const operatorAddress = wallet.address;

        const network = await provider.getNetwork();
        console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
        console.log(`Current block: ${await provider.getBlockNumber()}`);
        console.log(`Wallet address: ${operatorAddress}`);
        console.log(`Wallet balance: ${ethers.utils.formatEther(await provider.getBalance(operatorAddress))} ETH\n`);

        // Check LuxServiceManager
        const luxServiceManagerPath = path.join(__dirname, 'abis', 'LuxServiceManager.json');
        if (!LUX_SERVICE_MANAGER_ADDRESS) {
            console.error('❌ LUX_SERVICE_MANAGER_ADDRESS not set in .env file\n');
        } else if (!fs.existsSync(luxServiceManagerPath)) {
            console.error(`❌ LuxServiceManager ABI file not found at: ${luxServiceManagerPath}\n`);
        } else {
            console.log(`✅ LuxServiceManager address: ${LUX_SERVICE_MANAGER_ADDRESS}`);

            try {
                const luxAbi = JSON.parse(fs.readFileSync(luxServiceManagerPath, 'utf8'));
                const luxServiceManager = new ethers.Contract(LUX_SERVICE_MANAGER_ADDRESS, luxAbi, wallet);

                // Verify the contract has code
                const code = await provider.getCode(LUX_SERVICE_MANAGER_ADDRESS);
                if (code === '0x') {
                    console.error('❌ No contract deployed at LuxServiceManager address!\n');
                } else {
                    console.log('✅ Contract code found at address\n');

                    // Check if the contract has the expected functions
                    try {
                        // Try getting task count
                        let taskCount;
                        try {
                            if (typeof luxServiceManager.taskCount === 'function') {
                                taskCount = await luxServiceManager.taskCount();
                                console.log(`✅ Found taskCount(): ${taskCount.toString()}`);
                            } else if (typeof luxServiceManager.latestTaskNum === 'function') {
                                taskCount = await luxServiceManager.latestTaskNum();
                                console.log(`✅ Found latestTaskNum(): ${taskCount.toString()}`);
                            } else {
                                console.error('❌ Could not find taskCount() or latestTaskNum() function');
                            }
                        } catch (error) {
                            console.error(`❌ Failed to get task count: ${error.message}`);
                        }

                        // Check operator role
                        try {
                            const OPERATOR_ROLE = '0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929';
                            const hasRole = await luxServiceManager.hasRole(OPERATOR_ROLE, operatorAddress);
                            console.log(`${hasRole ? '✅' : '❌'} Operator role in LuxServiceManager: ${hasRole}`);

                            if (!hasRole) {
                                console.log('   To grant OPERATOR_ROLE, run: ./operator/grant-operator-role.sh');
                            }
                        } catch (error) {
                            console.error(`❌ Failed to check operator role: ${error.message}`);
                        }
                    } catch (error) {
                        console.error(`❌ Error calling contract functions: ${error.message}`);
                    }
                }
            } catch (error) {
                console.error(`❌ Failed to initialize LuxServiceManager contract: ${error.message}\n`);
            }
        }

        // Check AuthenticationController
        const authControllerPath = path.join(__dirname, 'abis', 'AuthenticationController.json');
        if (!AUTHENTICATION_CONTROLLER_ADDRESS) {
            console.error('❌ AUTHENTICATION_CONTROLLER_ADDRESS not set in .env file\n');
        } else if (!fs.existsSync(authControllerPath)) {
            console.error(`❌ AuthenticationController ABI file not found at: ${authControllerPath}\n`);
        } else {
            console.log(`\n✅ AuthenticationController address: ${AUTHENTICATION_CONTROLLER_ADDRESS}`);

            try {
                const authAbi = JSON.parse(fs.readFileSync(authControllerPath, 'utf8'));
                const authController = new ethers.Contract(AUTHENTICATION_CONTROLLER_ADDRESS, authAbi, wallet);

                // Verify the contract has code
                const code = await provider.getCode(AUTHENTICATION_CONTROLLER_ADDRESS);
                if (code === '0x') {
                    console.error('❌ No contract deployed at AuthenticationController address!\n');
                } else {
                    console.log('✅ Contract code found at address\n');

                    // Check operator role
                    try {
                        const OPERATOR_ROLE = '0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929';
                        const hasRole = await authController.hasRole(OPERATOR_ROLE, operatorAddress);
                        console.log(`${hasRole ? '✅' : '❌'} Operator role in AuthenticationController: ${hasRole}`);

                        if (!hasRole) {
                            console.log('   To grant OPERATOR_ROLE, run: ./operator/grant-operator-role.sh');
                        }
                    } catch (error) {
                        console.error(`❌ Failed to check operator role: ${error.message}`);
                    }
                }
            } catch (error) {
                console.error(`❌ Failed to initialize AuthenticationController contract: ${error.message}\n`);
            }
        }

        // Check ABI files
        console.log('\n--- Checking for required ABI files ---');
        const abiDir = path.join(__dirname, 'abis');
        if (!fs.existsSync(abiDir)) {
            console.error(`❌ ABI directory does not exist: ${abiDir}`);
            console.log('   Create it with: mkdir -p operator/ai-authenticator/abis');
        } else {
            console.log(`✅ ABI directory exists: ${abiDir}`);

            // Check LuxServiceManager ABI
            if (fs.existsSync(luxServiceManagerPath)) {
                console.log('✅ LuxServiceManager ABI file exists');

                try {
                    const abi = JSON.parse(fs.readFileSync(luxServiceManagerPath, 'utf8'));
                    const hasGetTask =
                        Array.isArray(abi) && abi.some((item) => (typeof item === 'object' && item.name === 'getTask') || (typeof item === 'string' && item.includes('getTask')));

                    console.log(`${hasGetTask ? '✅' : '❌'} ABI ${hasGetTask ? 'contains' : 'missing'} getTask function`);
                } catch (error) {
                    console.error(`❌ Failed to parse LuxServiceManager ABI: ${error.message}`);
                }
            } else {
                console.error(`❌ LuxServiceManager ABI file missing: ${luxServiceManagerPath}`);
                console.log('   Copy ABI from your contract artifacts to this location');
            }

            // Check AuthenticationController ABI
            if (fs.existsSync(authControllerPath)) {
                console.log('✅ AuthenticationController ABI file exists');
            } else {
                console.error(`❌ AuthenticationController ABI file missing: ${authControllerPath}`);
                console.log('   Copy ABI from your contract artifacts to this location');
            }
        }

        console.log('\n--- Environment Variables ---');
        console.log(`RPC_URL: ${RPC_URL ? '✅ Set' : '❌ Not set'}`);
        console.log(`PRIVATE_KEY: ${PRIVATE_KEY ? '✅ Set' : '❌ Not set'}`);
        console.log(`LUX_SERVICE_MANAGER_ADDRESS: ${LUX_SERVICE_MANAGER_ADDRESS ? '✅ Set' : '❌ Not set'}`);
        console.log(`AUTHENTICATION_CONTROLLER_ADDRESS: ${AUTHENTICATION_CONTROLLER_ADDRESS ? '✅ Set' : '❌ Not set'}`);
    } catch (error) {
        console.error(`\n❌ ERROR: ${error.message}`);
    }
}

// Run the main function
main().catch((error) => {
    console.error('Fatal error:', error?.reason || error?.message || error);
    process.exit(1);
});
