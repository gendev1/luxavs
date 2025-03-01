// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title Interface for managing service tasks in the Lux protocol
/// @dev Handles task creation, responses, and task-related data storage
interface ILuxServiceManager {
    // ============ Events ============

    /// @dev Emitted when a new task is created in the system
    /// @param taskIndex The unique identifier for the task
    /// @param task The task struct containing task details
    event NewTaskCreated(uint32 indexed taskIndex, Task task);

    /// @dev Emitted when an operator responds to an existing task
    /// @param taskIndex The unique identifier of the responded task
    /// @param task The task struct containing task details
    /// @param operator The address of the responding operator
    event TaskResponded(uint32 indexed taskIndex, Task task, address operator);

    // ============ Structs ============

    /// @dev Contains core task data and metadata
    struct Task {
        // Hash of the task's image data
        bytes32 imageHash;
        // Hash of any additional task metadata
        bytes32 metadataHash;
        // Type identifier for the document (0-255)
        uint8 documentType;
        // Block number when task was created for timing reference
        uint32 taskCreatedBlock;
    }

    // ============ View Functions ============

    /// @dev Returns the most recent task number
    /// @return The latest task number in the sequence
    function latestTaskNum() external view returns (uint32);

    /// @dev Retrieves the hash for a specific task by index
    /// @param taskIndex The index of the task to query
    /// @return The composite hash of the task data
    function allTaskHashes(
        uint32 taskIndex
    ) external view returns (bytes32);

    /// @dev Gets the response data for a specific task and operator
    /// @param operator The address of the responding operator
    /// @param taskIndex The index of the task
    /// @return Response data as bytes
    function allTaskResponses(
        address operator,
        uint32 taskIndex
    ) external view returns (bytes memory);

    // ============ State-Changing Functions ============

    /// @dev Creates a new task in the system
    /// @param imageHash Hash of the task's image content
    /// @param metadataHash Hash of the task's metadata
    /// @param documentType Type identifier for the document
    /// @return The newly created task struct
    function createNewTask(
        bytes32 imageHash,
        bytes32 metadataHash,
        uint8 documentType
    ) external returns (Task memory);

    /// @dev Submits a response to an existing task
    /// @param task The task being responded to
    /// @param referenceTaskIndex Index of the referenced task
    /// @param signature Cryptographic signature of the response
    function respondToTask(
        Task calldata task,
        uint32 referenceTaskIndex,
        bytes calldata signature
    ) external;

    /// @dev Get a specific task by index
    /// @param taskIndex The task index to retrieve
    /// @return The task data
    function getTask(
        uint32 taskIndex
    ) external view returns (Task memory);
}
