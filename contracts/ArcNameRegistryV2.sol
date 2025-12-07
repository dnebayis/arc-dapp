// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ArcNameRegistryV2
 * @dev ENS-inspired registry for .arc domain names on ARC Network
 * Supports multiple names per address, hierarchical structure, and resolver pattern
 */

// Interface for resolvers
interface IResolver {
    function addr(bytes32 node) external view returns (address);
    function setAddr(bytes32 node, address addr) external;
}

contract ArcNameRegistryV2 {
    // Core registry storage (ENS-style)
    struct Record {
        address owner;
        address resolver;
        uint64 ttl;
    }
    
    mapping(bytes32 => Record) records;
    mapping(address => mapping(address => bool)) operators; // Approval for all
    
    // Name registration tracking
    mapping(bytes32 => uint256) public registrationTime;
    mapping(bytes32 => bool) public nameExists;
    
    // Reverse lookup: address => list of owned names
    mapping(address => bytes32[]) public ownerToNames;
    mapping(bytes32 => uint256) private nameIndexInOwner; // For efficient removal
    
    // Pricing
    uint256 public registrationFee = 0.1 ether; // 0.1 USDC
    address public contractOwner;
    
    // Events (ENS-compatible)
    event NewOwner(bytes32 indexed node, bytes32 indexed label, address owner);
    event Transfer(bytes32 indexed node, address owner);
    event NewResolver(bytes32 indexed node, address resolver);
    event NewTTL(bytes32 indexed node, uint64 ttl);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    
    // Custom events
    event NameRegistered(string name, bytes32 indexed node, address indexed owner, uint256 timestamp);
    event NameReleased(bytes32 indexed node, address indexed previousOwner);
    
    modifier authorised(bytes32 node) {
        address owner = records[node].owner;
        require(owner == msg.sender || operators[owner][msg.sender], "Not authorised");
        _;
    }
    
    modifier onlyContractOwner() {
        require(msg.sender == contractOwner, "Not contract owner");
        _;
    }
    
    constructor() {
        contractOwner = msg.sender;
    }
    
    /**
     * @dev Generate namehash for a .arc name (ENS-style)
     * @param name The name to hash (without .arc)
     * @return The namehash
     */
    function namehash(string memory name) public pure returns (bytes32) {
        bytes32 node = 0x0000000000000000000000000000000000000000000000000000000000000000;
        
        // Hash .arc TLD
        node = keccak256(abi.encodePacked(node, keccak256(abi.encodePacked("arc"))));
        
        // Hash the name
        if (bytes(name).length > 0) {
            node = keccak256(abi.encodePacked(node, keccak256(abi.encodePacked(name))));
        }
        
        return node;
    }
    
    /**
     * @dev Register a new .arc name (supports multiple names per address)
     * @param name The name to register (without .arc suffix)
     */
    function register(string memory name) public payable {
        require(msg.value >= registrationFee, "Insufficient fee");
        require(bytes(name).length >= 3 && bytes(name).length <= 32, "Name must be 3-32 characters");
        require(isValidName(name), "Invalid characters (use a-z, 0-9, hyphen only)");
        
        bytes32 node = namehash(name);
        require(!nameExists[node], "Name already taken");
        
        // Register the name
        records[node] = Record({
            owner: msg.sender,
            resolver: address(0),
            ttl: 0
        });
        
        nameExists[node] = true;
        registrationTime[node] = block.timestamp;
        
        // Add to owner's name list
        nameIndexInOwner[node] = ownerToNames[msg.sender].length;
        ownerToNames[msg.sender].push(node);
        
        emit NameRegistered(name, node, msg.sender, block.timestamp);
        emit NewOwner(node, keccak256(abi.encodePacked(name)), msg.sender);
        emit Transfer(node, msg.sender);
        
        // Refund excess payment
        if (msg.value > registrationFee) {
            payable(msg.sender).transfer(msg.value - registrationFee);
        }
    }
    
    /**
     * @dev Set the owner of a name (ENS-compatible)
     * @param node The namehash of the name
     * @param newOwner The new owner address
     */
    function setOwner(bytes32 node, address newOwner) public authorised(node) {
        require(newOwner != address(0), "Invalid address");
        
        address oldOwner = records[node].owner;
        
        // Remove from old owner's list
        _removeNameFromOwner(oldOwner, node);
        
        // Add to new owner's list
        nameIndexInOwner[node] = ownerToNames[newOwner].length;
        ownerToNames[newOwner].push(node);
        
        records[node].owner = newOwner;
        emit Transfer(node, newOwner);
    }
    
    /**
     * @dev Set the resolver for a name (ENS-compatible)
     * @param node The namehash of the name
     * @param resolver The resolver address
     */
    function setResolver(bytes32 node, address resolver) public authorised(node) {
        records[node].resolver = resolver;
        emit NewResolver(node, resolver);
    }
    
    /**
     * @dev Set TTL for a name (ENS-compatible)
     * @param node The namehash of the name
     * @param ttl The TTL value
     */
    function setTTL(bytes32 node, uint64 ttl) public authorised(node) {
        records[node].ttl = ttl;
        emit NewTTL(node, ttl);
    }
    
    /**
     * @dev Enable/disable approval for all names (ENS-compatible)
     * @param operator The operator address
     * @param approved Whether to approve or revoke
     */
    function setApprovalForAll(address operator, bool approved) public {
        operators[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    /**
     * @dev Get owner of a name (ENS-compatible)
     * @param node The namehash of the name
     * @return The owner address
     */
    function owner(bytes32 node) public view returns (address) {
        return records[node].owner;
    }
    
    /**
     * @dev Get resolver of a name (ENS-compatible)
     * @param node The namehash of the name
     * @return The resolver address
     */
    function resolver(bytes32 node) public view returns (address) {
        return records[node].resolver;
    }
    
    /**
     * @dev Get TTL of a name (ENS-compatible)
     * @param node The namehash of the name
     * @return The TTL value
     */
    function ttl(bytes32 node) public view returns (uint64) {
        return records[node].ttl;
    }
    
    /**
     * @dev Check if record exists (ENS-compatible)
     * @param node The namehash of the name
     * @return Whether the record exists
     */
    function recordExists(bytes32 node) public view returns (bool) {
        return nameExists[node];
    }
    
    /**
     * @dev Check if operator is approved (ENS-compatible)
     * @param owner The owner address
     * @param operator The operator address
     * @return Whether approved
     */
    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return operators[owner][operator];
    }
    
    /**
     * @dev Resolve a name to its owner address (simplified)
     * @param name The name to resolve
     * @return The owner's address
     */
    function resolve(string memory name) public view returns (address) {
        bytes32 node = namehash(name);
        return records[node].owner;
    }
    
    /**
     * @dev Get all names owned by an address
     * @param addr The address to query
     * @return Array of namehashes owned by this address
     */
    function getOwnedNames(address addr) public view returns (bytes32[] memory) {
        return ownerToNames[addr];
    }
    
    /**
     * @dev Get count of names owned by an address
     * @param addr The address to query
     * @return Number of names owned
     */
    function getOwnedNamesCount(address addr) public view returns (uint256) {
        return ownerToNames[addr].length;
    }
    
    /**
     * @dev Release a name (make it available again)
     * @param node The namehash of the name to release
     */
    function release(bytes32 node) public authorised(node) {
        address previousOwner = records[node].owner;
        
        // Remove from owner's list
        _removeNameFromOwner(previousOwner, node);
        
        // Clear record
        delete records[node];
        delete nameExists[node];
        delete registrationTime[node];
        
        emit NameReleased(node, previousOwner);
        emit Transfer(node, address(0));
    }
    
    /**
     * @dev Internal function to remove name from owner's list
     * @param owner The owner address
     * @param node The namehash to remove
     */
    function _removeNameFromOwner(address owner, bytes32 node) private {
        uint256 index = nameIndexInOwner[node];
        uint256 lastIndex = ownerToNames[owner].length - 1;
        
        if (index != lastIndex) {
            bytes32 lastNode = ownerToNames[owner][lastIndex];
            ownerToNames[owner][index] = lastNode;
            nameIndexInOwner[lastNode] = index;
        }
        
        ownerToNames[owner].pop();
        delete nameIndexInOwner[node];
    }
    
    /**
     * @dev Check if a name is available for registration
     * @param name The name to check
     * @return true if available, false if taken or invalid
     */
    function isAvailable(string memory name) public view returns (bool) {
        bytes32 node = namehash(name);
        if (nameExists[node]) return false;
        if (bytes(name).length < 3 || bytes(name).length > 32) return false;
        return isValidName(name);
    }
    
    /**
     * @dev Validate name format
     * @param name The name to validate
     * @return true if valid, false otherwise
     */
    function isValidName(string memory name) public pure returns (bool) {
        bytes memory b = bytes(name);
        
        if (b[0] == 0x2D || b[b.length - 1] == 0x2D) return false;
        
        for (uint i = 0; i < b.length; i++) {
            bytes1 char = b[i];
            if (!(
                (char >= 0x30 && char <= 0x39) || // 0-9
                (char >= 0x61 && char <= 0x7A) || // a-z
                char == 0x2D                       // hyphen
            )) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * @dev Update registration fee (owner only)
     * @param newFee The new fee in USDC
     */
    function setRegistrationFee(uint256 newFee) public onlyContractOwner {
        registrationFee = newFee;
    }
    
    /**
     * @dev Withdraw collected fees (owner only)
     */
    function withdraw() public onlyContractOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(contractOwner).transfer(balance);
    }
}
