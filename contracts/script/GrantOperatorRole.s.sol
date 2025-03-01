// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/Test.sol";
import {stdJson} from "forge-std/StdJson.sol";

import {LuxServiceManager} from "../src/LuxServiceManager.sol";
import {AuthenticationController} from "../src/AuthenticationController.sol";
import {SimpleAccessControl} from "./deploylux.s.sol";

/// @title GrantOperatorRole
/// @notice A script to grant OPERATOR_ROLE to an address for LuxServiceManager and AuthenticationController
contract GrantOperatorRole is Script {
    using stdJson for string;

    // Deployed contract addresses
    address public luxServiceManager;
    address public authenticationController;
    address public accessControl;

    // Configuration
    address public owner;
    address public operatorAddress;

    // Roles
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // Function selectors
    bytes4 private constant HAS_ROLE_SELECTOR = bytes4(keccak256("hasRole(bytes32,address)"));
    bytes4 private constant GRANT_ROLE_SELECTOR = bytes4(keccak256("grantRole(bytes32,address)"));

    function setUp() public {
        // Get deployer address from private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        owner = vm.addr(deployerPrivateKey);

        // Set operator address from command line or env or default to owner
        operatorAddress = vm.envOr("OPERATOR_ADDRESS", owner);

        // Load contract addresses from deployment file or environment variables
        loadDeploymentAddresses();

        console2.log("Owner address:", owner);
        console2.log("Operator address to grant role to:", operatorAddress);
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console2.log("===== Granting OPERATOR_ROLE =====");

        // Check and grant OPERATOR_ROLE in LuxServiceManager
        checkAndGrantOperatorRoleInLuxServiceManager();

        // Check and grant OPERATOR_ROLE in AuthenticationController
        checkAndGrantOperatorRoleInAuthenticationController();

        vm.stopBroadcast();

        console2.log("===== Role Assignment Complete =====");
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
                authenticationController = vm.parseJsonAddress(json, ".authenticationController");
                accessControl = vm.parseJsonAddress(json, ".accessControl");
            } catch {
                // If direct format fails, try using deployment.{contract} format
                try vm.parseJsonAddress(json, ".deployment.luxServiceManager") returns (
                    address addr
                ) {
                    console2.log("Found nested deployment format in JSON");
                    luxServiceManager = addr;
                    authenticationController =
                        vm.parseJsonAddress(json, ".deployment.authenticationController");
                    accessControl = vm.parseJsonAddress(json, ".deployment.accessControl");
                } catch {
                    // Last attempt - try with contracts.{contract} format
                    try vm.parseJsonAddress(json, ".contracts.luxServiceManager") returns (
                        address addr
                    ) {
                        console2.log("Found contracts format in JSON");
                        luxServiceManager = addr;
                        authenticationController =
                            vm.parseJsonAddress(json, ".contracts.authenticationController");
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

        // Verify addresses
        require(luxServiceManager != address(0), "LuxServiceManager address not set");
        console2.log("- LuxServiceManager:", luxServiceManager);

        if (authenticationController == address(0)) {
            console2.log(
                "WARNING: AuthenticationController address not set, will only grant role in LuxServiceManager"
            );
        } else {
            console2.log("- AuthenticationController:", authenticationController);
        }

        if (accessControl == address(0)) {
            console2.log(
                "WARNING: AccessControl address not set, will try direct role grant on contracts"
            );
        } else {
            console2.log("- AccessControl:", accessControl);
        }
    }

    function loadFromEnvironment() internal {
        luxServiceManager = vm.envAddress("LUX_SERVICE_MANAGER_ADDRESS");
        authenticationController = vm.envAddress("AUTHENTICATION_CONTROLLER_ADDRESS");
        accessControl = vm.envAddress("ACCESS_CONTROL_ADDRESS");
    }

    function checkAndGrantOperatorRoleInLuxServiceManager() internal {
        console2.log("\nChecking OPERATOR_ROLE in LuxServiceManager...");

        // Check if operator already has the role
        bool hasRole = false;

        // First try via AccessControl if available
        if (accessControl != address(0)) {
            try SimpleAccessControl(accessControl).hasRole(OPERATOR_ROLE, operatorAddress) returns (
                bool result
            ) {
                hasRole = result;
                console2.log("Checked role via AccessControl contract, has role:", hasRole);
            } catch {
                console2.log("Failed to check role via AccessControl, will try direct check");
            }
        }

        // Try direct check if AccessControl check failed or not available
        if (accessControl == address(0)) {
            (bool success, bytes memory data) = luxServiceManager.staticcall(
                abi.encodeWithSelector(HAS_ROLE_SELECTOR, OPERATOR_ROLE, operatorAddress)
            );

            if (success) {
                hasRole = abi.decode(data, (bool));
                console2.log("Checked role directly on LuxServiceManager, has role:", hasRole);
            } else {
                console2.log("Failed to check role directly, assuming role not granted");
            }
        }

        // Grant role if not already assigned
        if (!hasRole) {
            console2.log("Granting OPERATOR_ROLE to operator in LuxServiceManager");

            // Try granting via AccessControl if available
            if (accessControl != address(0)) {
                try SimpleAccessControl(accessControl).grantRole(OPERATOR_ROLE, operatorAddress) {
                    console2.log("Successfully granted role via AccessControl");
                } catch {
                    console2.log("Failed to grant role via AccessControl, will try direct grant");
                }
            }

            // Try direct grant if AccessControl grant failed or not available
            if (accessControl == address(0)) {
                // Attempt to call grantRole on LuxServiceManager directly
                (bool success,) = luxServiceManager.call(
                    abi.encodeWithSelector(GRANT_ROLE_SELECTOR, OPERATOR_ROLE, operatorAddress)
                );

                if (success) {
                    console2.log("Successfully granted role directly on LuxServiceManager");
                } else {
                    console2.log("Failed to grant role directly on LuxServiceManager");
                }
            }

            // Verify role was granted
            bool hasRoleAfter = false;

            if (accessControl != address(0)) {
                try SimpleAccessControl(accessControl).hasRole(OPERATOR_ROLE, operatorAddress)
                returns (bool result) {
                    hasRoleAfter = result;
                } catch {}
            } else {
                (bool success, bytes memory data) = luxServiceManager.staticcall(
                    abi.encodeWithSelector(HAS_ROLE_SELECTOR, OPERATOR_ROLE, operatorAddress)
                );
                if (success) {
                    hasRoleAfter = abi.decode(data, (bool));
                }
            }

            if (hasRoleAfter) {
                console2.log("[SUCCESS] OPERATOR_ROLE successfully granted in LuxServiceManager");
            } else {
                console2.log("[FAILED] Failed to verify role was granted in LuxServiceManager");
            }
        } else {
            console2.log("[SUCCESS] Operator already has OPERATOR_ROLE in LuxServiceManager");
        }
    }

    function checkAndGrantOperatorRoleInAuthenticationController() internal {
        if (authenticationController == address(0)) {
            console2.log("\nSkipping AuthenticationController (address not set)");
            return;
        }

        console2.log("\nChecking OPERATOR_ROLE in AuthenticationController...");

        // Check if operator already has the role
        bool hasRole = false;

        try AuthenticationController(authenticationController).hasRole(
            OPERATOR_ROLE, operatorAddress
        ) returns (bool result) {
            hasRole = result;
            console2.log("Checked role on AuthenticationController, has role:", hasRole);
        } catch {
            console2.log(
                "Failed to check role on AuthenticationController, assuming role not granted"
            );
        }

        // Grant role if not already assigned
        if (!hasRole) {
            console2.log("Granting OPERATOR_ROLE to operator in AuthenticationController");

            try AuthenticationController(authenticationController).grantRole(
                OPERATOR_ROLE, operatorAddress
            ) {
                console2.log(
                    "[SUCCESS] Successfully granted OPERATOR_ROLE in AuthenticationController"
                );
            } catch {
                console2.log("[FAILED] Failed to grant OPERATOR_ROLE in AuthenticationController");
            }

            // Verify role was granted
            bool hasRoleAfter = false;

            try AuthenticationController(authenticationController).hasRole(
                OPERATOR_ROLE, operatorAddress
            ) returns (bool result) {
                hasRoleAfter = result;
            } catch {}

            if (hasRoleAfter) {
                console2.log(
                    "[SUCCESS] OPERATOR_ROLE successfully verified in AuthenticationController"
                );
            } else {
                console2.log(
                    "[FAILED] Failed to verify role was granted in AuthenticationController"
                );
            }
        } else {
            console2.log("[SUCCESS] Operator already has OPERATOR_ROLE in AuthenticationController");
        }
    }
}
