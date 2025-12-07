// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleStorage {
    address public owner;
    uint256 public value;
    string public text;
    
    event ValueUpdated(uint256 newValue, address updatedBy);
    event TextUpdated(string newText, address updatedBy);
    
    constructor() {
        owner = msg.sender;
    }
    
    function setValue(uint256 _value) public {
        value = _value;
        emit ValueUpdated(_value, msg.sender);
    }
    
    function setText(string memory _text) public {
        text = _text;
        emit TextUpdated(_text, msg.sender);
    }
    
    function getInfo() public view returns (address, uint256, string memory) {
        return (owner, value, text);
    }
}
