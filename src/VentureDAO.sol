// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./StartupContract.sol";
import "./IGovernanceToken.sol";

contract VentureDAO {

    IGovernanceToken public govToken;
    uint256 public proposalCount;
    uint256 public constant VOTING_PERIOD = 120;

    struct Proposal {
        address founder;
        uint256 fundingAmount;
        uint256 valuation;
        string description;
        uint256 snapshotBlock;
        uint256 voteStart;
        uint256 voteEnd;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        address startupContract;
        address startupToken;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    constructor(address existingGovToken) {
        govToken = IGovernanceToken(existingGovToken);
    }

    function deposit() external payable {
        require(msg.value > 0, "Send ETH");
        govToken.mint(msg.sender, msg.value);
        govToken.delegate(msg.sender);
    }

    function submitProposal(
        address _founder,
        uint256 _fundingAmount,
        uint256 _valuation,
        string memory _description
    ) external {
        proposalCount++;
        proposals[proposalCount] = Proposal({
            founder: _founder,
            fundingAmount: _fundingAmount,
            valuation: _valuation,
            description: _description,
            snapshotBlock: block.number,
            voteStart: block.timestamp,
            voteEnd: block.timestamp + VOTING_PERIOD,
            forVotes: 0,
            againstVotes: 0,
            executed: false,
            startupContract: address(0),
            startupToken: address(0)
        });
    }

    function vote(uint256 proposalId, bool support) external {
        require(block.timestamp < proposals[proposalId].voteEnd, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        uint256 votingPower = govToken.getPastVotes(msg.sender, proposals[proposalId].snapshotBlock);
        require(votingPower > 0, "No voting power at snapshot");

        if (support) {
            proposals[proposalId].forVotes += votingPower;
        } else {
            proposals[proposalId].againstVotes += votingPower;
        }

        hasVoted[proposalId][msg.sender] = true;
    }

    function executeProposal(uint256 proposalId) external {
        require(block.timestamp >= proposals[proposalId].voteEnd, "Voting not ended");
        require(!proposals[proposalId].executed, "Already executed");
        require(proposals[proposalId].forVotes > proposals[proposalId].againstVotes, "Proposal not approved");
        require(address(this).balance >= proposals[proposalId].fundingAmount, "Insufficient treasury");

        proposals[proposalId].executed = true;

        address startupAddr = address(new StartupContract{value: proposals[proposalId].fundingAmount}(
            proposals[proposalId].founder,
            proposals[proposalId].valuation,
            proposals[proposalId].fundingAmount,
            address(govToken),
            proposals[proposalId].snapshotBlock
        ));

        proposals[proposalId].startupContract = startupAddr;
        proposals[proposalId].startupToken = StartupContract(startupAddr).getStartupToken();
    }

    function getTreasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getStartupAddresses(uint256 proposalId) external view returns (address, address) {
        return (proposals[proposalId].startupContract, proposals[proposalId].startupToken);
    }
}