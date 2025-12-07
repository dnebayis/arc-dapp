// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ArcNameRegistry
 * @dev Registry for .arc domain names on ARC Network
 * Allows users to register human-readable names that resolve to wallet addresses
 */
contract ArcNameRegistry {
    // Storage
    mapping(string => address) public nameToOwner;      // "alice" => 0x123...
    mapping(address => string) public ownerToName;      // 0x123... => "alice"
    mapping(string => bool) public nameExists;          // Check if name is registered
    mapping(string => uint256) public registrationTime; // Timestamp of registration
    
    // Pricing (in USDC with 18 decimals - native on ARC)
    uint256 public registrationFee = 0.1 ether; // 0.1 USDC
    
    // Contract owner
    address public owner;
    
    // Events
    event NameRegistered(string indexed name, address indexed owner, uint256 timestamp);
    event NameTransferred(string indexed name, address indexed from, address indexed to);
    event NameReleased(string indexed name, address indexed previousOwner);
    event FeeUpdated(uint256 newFee);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }
    
    /**
     * @dev Register a new .arc name
     * @param name The name to register (without .arc suffix)
     */
    function register(string memory name) public payable {
        require(msg.value >= registrationFee, "Insufficient fee");
        require(!nameExists[name], "Name already taken");
        require(bytes(name).length >= 3 && bytes(name).length <= 32, "Name must be 3-32 characters");
        require(isValidName(name), "Invalid characters (use a-z, 0-9, hyphen only)");
        
        // If user already has a name, release it first
        if (bytes(ownerToName[msg.sender]).length > 0) {
            _release(ownerToName[msg.sender]);
        }
        
        // Register new name
        nameToOwner[name] = msg.sender;
        ownerToName[msg.sender] = name;
        nameExists[name] = true;
        registrationTime[name] = block.timestamp;
        
        emit NameRegistered(name, msg.sender, block.timestamp);
        
        // Refund excess payment
        if (msg.value > registrationFee) {
            payable(msg.sender).transfer(msg.value - registrationFee);
        }
    }
    
    /**
     * @dev Transfer your name to another address
     * @param to The address to transfer the name to
     */
    function transfer(address to) public {
        string memory name = ownerToName[msg.sender];
        require(bytes(name).length > 0, "You don't own a name");
        require(to != address(0), "Invalid recipient address");
        require(to != msg.sender, "Cannot transfer to yourself");
        
        // Release recipient's current name if they have one
        if (bytes(ownerToName[to]).length > 0) {
            _release(ownerToName[to]);
        }
        
        // Transfer ownership
        nameToOwner[name] = to;
        ownerToName[to] = name;
        delete ownerToName[msg.sender];
        
        emit NameTransferred(name, msg.sender, to);
    }
    
    /**
     * @dev Release your name (make it available again)
     */
    function release() public {
        string memory name = ownerToName[msg.sender];
        require(bytes(name).length > 0, "You don't own a name");
        _release(name);
    }
    
    /**
     * @dev Internal function to release a name
     * @param name The name to release
     */
    function _release(string memory name) private {
        address previousOwner = nameToOwner[name];
        
        delete nameToOwner[name];
        delete ownerToName[previousOwner];
        delete nameExists[name];
        delete registrationTime[name];
        
        emit NameReleased(name, previousOwner);
    }
    
    /**
     * @dev Resolve a name to its owner address
     * @param name The name to resolve
     * @return The owner's address (0x0 if not registered)
     */
    function resolve(string memory name) public view returns (address) {
        return nameToOwner[name];
    }
    
    /**
     * @dev Reverse resolve: get name from address
     * @param addr The address to look up
     * @return The name owned by this address (empty string if none)
     */
    function reverseResolve(address addr) public view returns (string memory) {
        return ownerToName[addr];
    }
    
    /**
     * @dev Check if a name is available for registration
     * @param name The name to check
     * @return true if available, false if taken or invalid
     */
    function isAvailable(string memory name) public view returns (bool) {
        if (nameExists[name]) return false;
        if (bytes(name).length < 3 || bytes(name).length > 32) return false;
        return isValidName(name);
    }
    
    /**
     * @dev Validate name format (alphanumeric and hyphens only, lowercase)
     * @param name The name to validate
     * @return true if valid, false otherwise
     */
    function isValidName(string memory name) public pure returns (bool) {
        bytes memory b = bytes(name);
        
        // Check first and last character (cannot be hyphen)
        if (b[0] == 0x2D || b[b.length - 1] == 0x2D) return false;
        
        for (uint i = 0; i < b.length; i++) {
            bytes1 char = b[i];
            
            // Allow: 0-9, a-z, hyphen
            if (!(
                (char >= 0x30 && char <= 0x39) || // 0-9
                (char >= 0x61 && char <= 0x7A) || // a-z
                char == 0x2D                       // hyphen (-)
            )) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * @dev Get detailed information about a name
     * @param name The name to query
     * @return owner_ The current owner
     * @return registered Timestamp when registered
     * @return isRegistered Whether the name is registered
     */
    function getNameInfo(string memory name) public view returns (
        address owner_,
        uint256 registered,
        bool isRegistered
    ) {
        return (
            nameToOwner[name],
            registrationTime[name],
            nameExists[name]
        );
    }
    
    /**
     * @dev Update registration fee (owner only)
     * @param newFee The new fee in USDC (18 decimals)
     */
    function setRegistrationFee(uint256 newFee) public onlyOwner {
        registrationFee = newFee;
        emit FeeUpdated(newFee);
    }
    
    /**
     * @dev Withdraw collected fees (owner only)
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner).transfer(balance);
    }
    
    /**
     * @dev Get contract balance
     * @return Current USDC balance
     */
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
