// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/Test.sol";
import {stdJson} from "forge-std/StdJson.sol";

import {LuxServiceManager} from "../src/LuxServiceManager.sol";
import {SimpleAccessControl} from "./deploylux.s.sol";

/// @title CreateTask
/// @notice A simple script to create a test task in the LuxServiceManager
contract CreateTask is Script {
    using stdJson for string;

    // Deployed contract addresses
    address public luxServiceManager;
    address public accessControl;

    // Configuration
    address public owner;

    // Roles
    bytes32 public constant TASK_CREATOR_ROLE = keccak256("TASK_CREATOR_ROLE");

    // Function selectors
    bytes4 private constant HAS_ROLE_SELECTOR = bytes4(keccak256("hasRole(bytes32,address)"));
    bytes4 private constant GRANT_ROLE_SELECTOR = bytes4(keccak256("grantRole(bytes32,address)"));

    function setUp() public {
        // Get deployer address from private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        owner = vm.addr(deployerPrivateKey);

        // Load contract addresses from deployment file or environment variables
        loadDeploymentAddresses();

        console2.log("Task creator address:", owner);
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console2.log("===== Creating Test Task =====");

        // 1. Ensure we have the TASK_CREATOR_ROLE
        ensureTaskCreatorRole();

        // 2. Get current task count
        uint32 currentTaskNum = LuxServiceManager(luxServiceManager).latestTaskNum();
        console2.log("Current task count:", currentTaskNum);

        // 3. Increase the rate limit to avoid RateLimitExceeded error
        // Check current rate limit
        uint8 currentRateLimit = LuxServiceManager(luxServiceManager).maxTasksPerBlockPerUser();
        console2.log("Current rate limit:", currentRateLimit);

        // Increase rate limit if needed
        if (currentRateLimit < 10) {
            console2.log("Increasing rate limit to 10 tasks per block...");
            LuxServiceManager(luxServiceManager).setMaxTasksPerBlockPerUser(10);
            console2.log(
                "New rate limit:", LuxServiceManager(luxServiceManager).maxTasksPerBlockPerUser()
            );
        }

        // 4. Create a new task
        bytes32 imageHash = keccak256(abi.encodePacked("test-image", block.timestamp));
        bytes32 metadataHash = keccak256(abi.encodePacked("test-metadata", block.timestamp));
        uint8 documentType = 1; // Just pick type 1 for testing

        console2.log("Creating task with:");
        console2.log("- Image Hash:", vm.toString(imageHash));
        console2.log("- Metadata Hash:", vm.toString(metadataHash));
        console2.log("- Document Type:", documentType);

        LuxServiceManager.Task memory newTask = LuxServiceManager(luxServiceManager).createNewTask(
            imageHash, metadataHash, documentType
        );

        console2.log("Task created successfully!");
        console2.log("Task created at block:", newTask.taskCreatedBlock);

        // 5. Verify the task was created
        uint32 newTaskNum = LuxServiceManager(luxServiceManager).latestTaskNum();
        console2.log("New task count:", newTaskNum);

        if (newTaskNum > currentTaskNum) {
            console2.log("Task count increased, task was created successfully!");

            // Try to get the task details
            uint32 taskIndex = newTaskNum - 1;
            LuxServiceManager.Task memory task =
                LuxServiceManager(luxServiceManager).getTask(taskIndex);

            console2.log("Task details:");
            console2.log("- Task Index:", taskIndex);
            console2.log("- Image Hash:", vm.toString(task.imageHash));
            console2.log("- Metadata Hash:", vm.toString(task.metadataHash));
            console2.log("- Document Type:", task.documentType);
            console2.log("- Created Block:", task.taskCreatedBlock);
        } else {
            console2.log("Task count did not increase as expected!");
        }

        vm.stopBroadcast();

        console2.log("===== Task Creation Complete =====");
    }

    function loadDeploymentAddresses() internal {
        // First check for deployment JSON
        string memory deploymentPath =
            string.concat("deployments/", vm.toString(block.chainid), ".json");

        if (vm.exists(deploymentPath)) {
            console2.log("Loading addresses from deployment file:", deploymentPath);
            string memory json = vm.readFile(deploymentPath);

            // Try multiple JSON formats in sequence using try/catch
            try vm.parseJsonAddress(json, ".luxServiceManager") returns (address addr) {
                console2.log("Found direct key format in JSON");
                luxServiceManager = addr;
                accessControl = vm.parseJsonAddress(json, ".accessControl");
            } catch {
                // If direct format fails, try using deployment.{contract} format
                try vm.parseJsonAddress(json, ".deployment.luxServiceManager") returns (
                    address addr
                ) {
                    console2.log("Found nested deployment format in JSON");
                    luxServiceManager = addr;
                    accessControl = vm.parseJsonAddress(json, ".deployment.accessControl");
                } catch {
                    // Last attempt - try with contracts.{contract} format
                    try vm.parseJsonAddress(json, ".contracts.luxServiceManager") returns (
                        address addr
                    ) {
                        console2.log("Found contracts format in JSON");
                        luxServiceManager = addr;
                        accessControl = vm.parseJsonAddress(json, ".contracts.accessControl");
                    } catch {
                        console2.log(
                            "Could not parse JSON deployment file, using environment variables"
                        );
                        loadFromEnvironment();
                    }
                }
            }
        } else {
            // Otherwise, try to load from environment variables
            console2.log("No deployment file found, loading from environment variables");
            loadFromEnvironment();
        }

        require(luxServiceManager != address(0), "LuxServiceManager address not set");
        require(accessControl != address(0), "AccessControl address not set");

        console2.log("Using addresses:");
        console2.log("- LuxServiceManager:", luxServiceManager);
        console2.log("- AccessControl:", accessControl);
    }

    function loadFromEnvironment() internal {
        luxServiceManager = vm.envAddress("LUX_SERVICE_MANAGER_ADDRESS");
        accessControl = vm.envAddress("ACCESS_CONTROL_ADDRESS");
    }

    function ensureTaskCreatorRole() internal {
        // Check if has role without try/catch
        bool hasRole;
        (bool success, bytes memory data) = accessControl.staticcall(
            abi.encodeWithSelector(HAS_ROLE_SELECTOR, TASK_CREATOR_ROLE, owner)
        );

        if (success) {
            hasRole = abi.decode(data, (bool));
        }

        if (!hasRole) {
            console2.log("Granting TASK_CREATOR_ROLE to:", owner);
            SimpleAccessControl(accessControl).grantRole(TASK_CREATOR_ROLE, owner);
        } else {
            console2.log("Already has TASK_CREATOR_ROLE");
        }
    }
}
