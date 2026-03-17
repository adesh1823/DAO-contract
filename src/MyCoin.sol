// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GovernanceToken is ERC20Votes, ERC20Permit, Ownable {

    constructor()
        ERC20("MyGovernanceToken", "MGT")
        ERC20Permit("MyGovernanceToken")
        Ownable(msg.sender)
    {
        // no premint — tokens only minted via dao.deposit()
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }
}