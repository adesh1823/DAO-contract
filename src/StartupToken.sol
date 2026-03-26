
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StartupToken is ERC20, Ownable {



    constructor(string memory name, string memory symbol, address initialOwner) 
        ERC20(name, symbol)
        Ownable(initialOwner)   // pass owner here
    {}


    function burnFrom(address from, uint256 amount) external onlyOwner {
    _burn(from, amount);
}
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external onlyOwner {
        _burn(address(this), amount);
    }
}