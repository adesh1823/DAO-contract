// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/VentureDAO.sol";
import "../src/StartupContract.sol";
import "../src/StartupToken.sol";
import "../src/IGovernanceToken.sol";

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ─────────────────────────────────────────────────────────────────────────────
// Mock governance token
// Concrete ERC20Votes that satisfies IGovernanceToken.
// ─────────────────────────────────────────────────────────────────────────────
contract MockGovernanceToken is ERC20, ERC20Permit, ERC20Votes, Ownable, IGovernanceToken {
    constructor() ERC20("GovToken", "GOV") ERC20Permit("GovToken") Ownable(msg.sender) {}

    // IGovernanceToken — mint has no OZ conflict, external is fine
    function mint(address to, uint256 amount) external override(IGovernanceToken) onlyOwner {
        _mint(to, amount);
    }

    // Must be public to match Votes.delegate(public virtual)
    function delegate(address delegatee) public override(IGovernanceToken, Votes) {
        _delegate(msg.sender, delegatee);
    }

    // Must be public to match Votes.getPastVotes(public view virtual)
    function getPastVotes(address account, uint256 blockNumber)
        public view override(IGovernanceToken, Votes) returns (uint256)
    {
        return super.getPastVotes(account, blockNumber);
    }

    // Must be public to match Votes.getPastTotalSupply(public view virtual)
    function getPastTotalSupply(uint256 blockNumber)
        public view override(IGovernanceToken, Votes) returns (uint256)
    {
        return super.getPastTotalSupply(blockNumber);
    }

    function _update(address from, address to, uint256 value)
        internal override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public view override(ERC20Permit, Nonces) returns (uint256)
    {
        return super.nonces(owner);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test contract
// ─────────────────────────────────────────────────────────────────────────────
contract VentureDAOTest is Test {

    // ── contracts ──────────────────────────────────────────────────────────
    MockGovernanceToken internal govToken;
    VentureDAO          internal dao;

    // ── actors — assigned in setUp(), NOT at declaration
    //    makeAddr() calls vm cheatcodes which are unavailable at init time
    address internal alice;
    address internal bob;
    address internal carol;
    address internal founder;

    // ── constants ──────────────────────────────────────────────────────────
    uint256 internal constant FUNDING       = 1 ether;
    uint256 internal constant VALUATION     = 10 ether;
    uint256 internal constant VOTING_PERIOD = 120; // seconds (matches contract)

    // ── setup ──────────────────────────────────────────────────────────────
    function setUp() public {
        // Assign actors here — vm cheatcodes are live inside setUp
        alice   = makeAddr("alice");
        bob     = makeAddr("bob");
        carol   = makeAddr("carol");
        founder = makeAddr("founder");

        govToken = new MockGovernanceToken();
        dao      = new VentureDAO(address(govToken));
        // Transfer ownership so the DAO can call mint() — matches real deployment
        govToken.transferOwnership(address(dao));

        vm.deal(alice,   10 ether);
        vm.deal(bob,     10 ether);
        vm.deal(carol,   10 ether);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────

    function _deposit(address user, uint256 amount) internal {
        vm.prank(user);
        dao.deposit{value: amount}();
        // VentureDAO.deposit() calls govToken.delegate(msg.sender) where
        // msg.sender is the DAO, not the user — so the user's own tokens
        // are never delegated. The user must self-delegate directly.
        vm.prank(user);
        govToken.delegate(user);
        // Mine a block so the checkpoint is finalised before any snapshot
        vm.roll(block.number + 1);
    }

    function _submitProposal(
        address _founder,
        uint256 _funding,
        uint256 _valuation,
        string memory _desc
    ) internal returns (uint256 id) {
        dao.submitProposal(_founder, _funding, _valuation, _desc);
        return dao.proposalCount();
    }

    function _rollAndWarp(uint256 blocks, uint256 secs) internal {
        vm.roll(block.number + blocks);
        vm.warp(block.timestamp + secs);
    }

    /// @dev Read a full Proposal struct without relying on tuple destructuring.
    ///      The public getter returns a tuple; we capture every field by name
    ///      to avoid the 12-slot blank-comma destructure that breaks on string.
    function _getProposal(uint256 id)
        internal view
        returns (VentureDAO.Proposal memory p)
    {
        (
            p.founder,
            p.fundingAmount,
            p.valuation,
            p.description,
            p.snapshotBlock,
            p.voteStart,
            p.voteEnd,
            p.forVotes,
            p.againstVotes,
            p.executed,
            p.startupContract,
            p.startupToken
        ) = dao.proposals(id);
    }

    // ── scenario builders ─────────────────────────────────────────────────

    /// alice=2 ETH, bob=1 ETH deposited; proposal submitted; 1 extra block mined
    function _setupVoteScenario() internal returns (uint256 proposalId) {
        _deposit(alice, 2 ether); // mines a block internally after delegating
        _deposit(bob,   1 ether); // mines a block internally after delegating

        // snapshotBlock is set here; checkpoints already finalised by _deposit
        proposalId = _submitProposal(founder, FUNDING, VALUATION, "Vote test");

        // Mine one more block so snapshotBlock is strictly in the past for getPastVotes
        vm.roll(block.number + 1);
    }

    /// approved proposal (alice outweighs bob) past voting end
    function _setupApprovedProposal() internal returns (uint256 proposalId) {
        _deposit(alice, 2 ether);
        _deposit(bob,   1 ether);

        proposalId = _submitProposal(founder, FUNDING, VALUATION, "Execute test");
        vm.roll(block.number + 1);

        vm.prank(alice); dao.vote(proposalId, true);
        vm.prank(bob);   dao.vote(proposalId, false);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);
    }

    /// deployed startup contract after a successful proposal execution
    function _deployedStartup()
        internal
        returns (StartupContract sc, uint256 proposalId)
    {
        proposalId = _setupApprovedProposal();
        dao.executeProposal(proposalId);

        (address scAddr, ) = dao.getStartupAddresses(proposalId);
        sc = StartupContract(payable(scAddr));
    }

    // ═════════════════════════════════════════════════════════════════════
    // 1. DEPOSIT
    // ═════════════════════════════════════════════════════════════════════

    function test_Deposit_MintsGovTokens() public {
        _deposit(alice, 2 ether);
        assertEq(govToken.balanceOf(alice), 2 ether);
    }

    function test_Deposit_SelfDelegates() public {
        // _deposit() explicitly self-delegates the user after the DAO deposit,
        // because VentureDAO.deposit() calls delegate(msg.sender) where
        // msg.sender is the DAO — so we correct it in the helper.
        _deposit(alice, 1 ether);
        assertEq(govToken.delegates(alice), alice);
    }

    function test_Deposit_RevertsOnZeroValue() public {
        vm.prank(alice);
        vm.expectRevert("Send ETH");
        dao.deposit{value: 0}();
    }

    function test_Deposit_UpdatesTreasuryBalance() public {
        _deposit(alice, 3 ether);
        assertEq(dao.getTreasuryBalance(), 3 ether);
    }

    function test_Deposit_MultipleUsers_AccumulatesTreasury() public {
        _deposit(alice, 1 ether);
        _deposit(bob,   2 ether);
        assertEq(dao.getTreasuryBalance(), 3 ether);
    }

    // ═════════════════════════════════════════════════════════════════════
    // 2. SUBMIT PROPOSAL
    // ═════════════════════════════════════════════════════════════════════

    function test_SubmitProposal_IncrementsCount() public {
        _submitProposal(founder, FUNDING, VALUATION, "Test");
        assertEq(dao.proposalCount(), 1);
    }

    function test_SubmitProposal_StoresFounderAndAmounts() public {
        uint256 id = _submitProposal(founder, FUNDING, VALUATION, "My Startup");
        VentureDAO.Proposal memory p = _getProposal(id);

        assertEq(p.founder,       founder);
        assertEq(p.fundingAmount, FUNDING);
        assertEq(p.valuation,     VALUATION);
        assertFalse(p.executed);
    }

    function test_SubmitProposal_StoresDescription() public {
        uint256 id = _submitProposal(founder, FUNDING, VALUATION, "My Startup");
        VentureDAO.Proposal memory p = _getProposal(id);
        assertEq(p.description, "My Startup");
    }

    function test_SubmitProposal_VoteWindowIsCorrect() public {
        uint256 id = _submitProposal(founder, FUNDING, VALUATION, "window");
        VentureDAO.Proposal memory p = _getProposal(id);
        assertEq(p.voteEnd, p.voteStart + VOTING_PERIOD);
    }

    function test_SubmitProposal_SnapshotIsCurrentBlock() public {
        uint256 blockBefore = block.number;
        uint256 id = _submitProposal(founder, FUNDING, VALUATION, "snap");
        VentureDAO.Proposal memory p = _getProposal(id);
        assertEq(p.snapshotBlock, blockBefore);
    }

    function test_SubmitProposal_StartupAddressesAreZero() public {
        uint256 id = _submitProposal(founder, FUNDING, VALUATION, "zero addrs");
        VentureDAO.Proposal memory p = _getProposal(id);
        assertEq(p.startupContract, address(0));
        assertEq(p.startupToken,    address(0));
    }

    function test_SubmitProposal_MultipleProposalsUniqueIds() public {
        uint256 id1 = _submitProposal(founder, FUNDING,     VALUATION,     "first");
        uint256 id2 = _submitProposal(founder, 2 * FUNDING, VALUATION * 2, "second");
        assertTrue(id1 != id2);
        assertEq(dao.proposalCount(), 2);
    }

    // ═════════════════════════════════════════════════════════════════════
    // 3. VOTE
    // ═════════════════════════════════════════════════════════════════════

    function test_Vote_ForVotesAccumulated() public {
        uint256 id = _setupVoteScenario();
        vm.prank(alice);
        dao.vote(id, true);

        VentureDAO.Proposal memory p = _getProposal(id);
        assertEq(p.forVotes, 2 ether);
    }

    function test_Vote_AgainstVotesAccumulated() public {
        uint256 id = _setupVoteScenario();
        vm.prank(bob);
        dao.vote(id, false);

        VentureDAO.Proposal memory p = _getProposal(id);
        assertEq(p.againstVotes, 1 ether);
    }

    function test_Vote_BothSidesAccumulate() public {
        uint256 id = _setupVoteScenario();
        vm.prank(alice); dao.vote(id, true);
        vm.prank(bob);   dao.vote(id, false);

        VentureDAO.Proposal memory p = _getProposal(id);
        assertEq(p.forVotes,     2 ether);
        assertEq(p.againstVotes, 1 ether);
    }

    function test_Vote_HasVotedFlagSet() public {
        uint256 id = _setupVoteScenario();
        vm.prank(alice);
        dao.vote(id, true);

        assertTrue(dao.hasVoted(id, alice));
        assertFalse(dao.hasVoted(id, bob));
    }

    function test_Vote_RevertsIfAlreadyVoted() public {
        uint256 id = _setupVoteScenario();
        vm.prank(alice); dao.vote(id, true);

        vm.prank(alice);
        vm.expectRevert("Already voted");
        dao.vote(id, true);
    }

    function test_Vote_RevertsAfterVotingPeriod() public {
        uint256 id = _setupVoteScenario();
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        vm.prank(alice);
        vm.expectRevert("Voting ended");
        dao.vote(id, true);
    }

    function test_Vote_RevertsWithNoVotingPower() public {
        uint256 id = _setupVoteScenario();

        vm.prank(carol); // never deposited
        vm.expectRevert("No voting power at snapshot");
        dao.vote(id, true);
    }

    // ═════════════════════════════════════════════════════════════════════
    // 4. EXECUTE PROPOSAL
    // ═════════════════════════════════════════════════════════════════════

    function test_Execute_DeploysStartupContract() public {
        uint256 id = _setupApprovedProposal();
        dao.executeProposal(id);

        (address sc, ) = dao.getStartupAddresses(id);
        assertTrue(sc != address(0));
    }

    function test_Execute_DeploysStartupToken() public {
        uint256 id = _setupApprovedProposal();
        dao.executeProposal(id);

        (, address st) = dao.getStartupAddresses(id);
        assertTrue(st != address(0));
    }

    function test_Execute_MarksProposalExecuted() public {
        uint256 id = _setupApprovedProposal();
        dao.executeProposal(id);

        VentureDAO.Proposal memory p = _getProposal(id);
        assertTrue(p.executed);
    }

    function test_Execute_TransfersFundsToStartupContract() public {
        uint256 id = _setupApprovedProposal();
        dao.executeProposal(id);

        (address sc, ) = dao.getStartupAddresses(id);
        assertEq(sc.balance, FUNDING);
    }

    function test_Execute_ReducesTreasuryBalance() public {
        uint256 id = _setupApprovedProposal();
        uint256 before = dao.getTreasuryBalance();
        dao.executeProposal(id);
        assertEq(dao.getTreasuryBalance(), before - FUNDING);
    }

    function test_Execute_RevertsBeforeVotingEnds() public {
        _deposit(alice, 2 ether);
        uint256 id = _submitProposal(founder, FUNDING, VALUATION, "too early");
        vm.roll(block.number + 1); // make snapshot past so vote() works

        vm.prank(alice);
        dao.vote(id, true);

        // do NOT advance past voting end
        vm.expectRevert("Voting not ended");
        dao.executeProposal(id);
    }

    function test_Execute_RevertsIfAlreadyExecuted() public {
        uint256 id = _setupApprovedProposal();
        dao.executeProposal(id);

        vm.expectRevert("Already executed");
        dao.executeProposal(id);
    }

    function test_Execute_RevertsIfProposalRejected() public {
        _deposit(alice, 1 ether);
        _deposit(bob,   2 ether);

        _rollAndWarp(1, 0);
        uint256 id = _submitProposal(founder, FUNDING, VALUATION, "fail vote");
        _rollAndWarp(1, 0);

        vm.prank(alice); dao.vote(id, true);
        vm.prank(bob);   dao.vote(id, false); // majority against

        vm.warp(block.timestamp + VOTING_PERIOD + 1);
        vm.expectRevert("Proposal not approved");
        dao.executeProposal(id);
    }

    function test_Execute_RevertsOnInsufficientTreasury() public {
        _deposit(alice, 0.5 ether); // treasury < FUNDING

        uint256 id = _submitProposal(founder, FUNDING, VALUATION, "broke");
        vm.roll(block.number + 1);

        vm.prank(alice);
        dao.vote(id, true);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);
        vm.expectRevert("Insufficient treasury");
        dao.executeProposal(id);
    }

    // ═════════════════════════════════════════════════════════════════════
    // 5. STARTUP CONTRACT — claimTokens
    // ═════════════════════════════════════════════════════════════════════

    function test_ClaimTokens_AliceReceivesProportionalTokens() public {
        (StartupContract sc, ) = _deployedStartup();

        vm.prank(alice);
        sc.claimTokens();

        // alice owns 2/3 of govToken supply → gets 2/3 of valuation in startup tokens
        uint256 expected = (2 ether * VALUATION) / 3 ether;
        assertApproxEqAbs(
            StartupToken(sc.getStartupToken()).balanceOf(alice),
            expected,
            1 // allow 1-wei rounding
        );
    }

    function test_ClaimTokens_BobReceivesProportionalTokens() public {
        (StartupContract sc, ) = _deployedStartup();

        vm.prank(bob);
        sc.claimTokens();

        uint256 expected = (1 ether * VALUATION) / 3 ether;
        assertApproxEqAbs(
            StartupToken(sc.getStartupToken()).balanceOf(bob),
            expected,
            1
        );
    }

    function test_ClaimTokens_BothInvestorsCanClaim() public {
        (StartupContract sc, ) = _deployedStartup();
        StartupToken st = StartupToken(sc.getStartupToken());

        vm.prank(alice); sc.claimTokens();
        vm.prank(bob);   sc.claimTokens();

        assertTrue(st.balanceOf(alice) > 0);
        assertTrue(st.balanceOf(bob)   > 0);
    }

    function test_ClaimTokens_RevertsOnDoubleClaim() public {
        (StartupContract sc, ) = _deployedStartup();

        vm.prank(alice);
        sc.claimTokens();

        vm.prank(alice);
        vm.expectRevert("Already claimed");
        sc.claimTokens();
    }

    function test_ClaimTokens_RevertsForNonInvestor() public {
        (StartupContract sc, ) = _deployedStartup();

        vm.prank(carol);
        vm.expectRevert("No voting power at snapshot");
        sc.claimTokens();
    }

    function test_ClaimTokens_HasClaimedFlagSet() public {
        (StartupContract sc, ) = _deployedStartup();

        assertFalse(sc.hasClaimed(alice));
        vm.prank(alice);
        sc.claimTokens();
        assertTrue(sc.hasClaimed(alice));
    }

    // ═════════════════════════════════════════════════════════════════════
    // 6. STARTUP CONTRACT — withdrawFunding
    // ═════════════════════════════════════════════════════════════════════

    function test_WithdrawFunding_FounderReceivesFullBalance() public {
        (StartupContract sc, ) = _deployedStartup();

        uint256 before = founder.balance;
        vm.prank(founder);
        sc.withdrawFunding();

        assertEq(founder.balance,     before + FUNDING);
        assertEq(address(sc).balance, 0);
    }

    function test_WithdrawFunding_RevertsForNonFounder() public {
        (StartupContract sc, ) = _deployedStartup();

        vm.prank(alice);
        vm.expectRevert("Only founder can withdraw");
        sc.withdrawFunding();
    }

    function test_WithdrawFunding_RevertsIfAlreadyWithdrawn() public {
        (StartupContract sc, ) = _deployedStartup();

        vm.prank(founder); sc.withdrawFunding();

        vm.prank(founder);
        vm.expectRevert("No funds to withdraw");
        sc.withdrawFunding();
    }

    // ═════════════════════════════════════════════════════════════════════
    // 7. STARTUP TOKEN — access control
    // ═════════════════════════════════════════════════════════════════════

    function test_StartupToken_OnlyOwnerCanMint() public {
        (StartupContract sc, ) = _deployedStartup();
        StartupToken st = StartupToken(sc.getStartupToken());

        vm.prank(alice);
        vm.expectRevert(); // OwnableUnauthorizedAccount
        st.mint(alice, 100);
    }

    function test_StartupToken_OnlyOwnerCanBurn() public {
        (StartupContract sc, ) = _deployedStartup();
        StartupToken st = StartupToken(sc.getStartupToken());

        vm.prank(alice);
        vm.expectRevert(); // OwnableUnauthorizedAccount
        st.burn(100);
    }

    function test_StartupToken_OwnerIsStartupContract() public {
        (StartupContract sc, ) = _deployedStartup();
        StartupToken st = StartupToken(sc.getStartupToken());
        assertEq(st.owner(), address(sc));
    }

    // ═════════════════════════════════════════════════════════════════════
    // 8. VIEW HELPERS
    // ═════════════════════════════════════════════════════════════════════

    function test_GetTreasuryBalance_ReflectsDeposits() public {
        _deposit(alice, 5 ether);
        assertEq(dao.getTreasuryBalance(), 5 ether);
    }

    function test_GetStartupAddresses_ZeroBeforeExecution() public {
        uint256 id = _submitProposal(founder, FUNDING, VALUATION, "not yet");
        (address sc, address st) = dao.getStartupAddresses(id);
        assertEq(sc, address(0));
        assertEq(st, address(0));
    }

    function test_GetStartupAddresses_PopulatedAfterExecution() public {
        uint256 id = _setupApprovedProposal();
        dao.executeProposal(id);

        (address sc, address st) = dao.getStartupAddresses(id);
        assertTrue(sc != address(0));
        assertTrue(st != address(0));
    }

    // ═════════════════════════════════════════════════════════════════════
    // 9. FUZZ TESTS
    // ═════════════════════════════════════════════════════════════════════

    /// Any non-zero deposit mints exactly that many govTokens
    function testFuzz_Deposit_MintsExactGovTokens(uint96 amount) public {
        vm.assume(amount > 0);
        vm.deal(alice, amount);
        vm.prank(alice);
        dao.deposit{value: amount}();
        assertEq(govToken.balanceOf(alice), amount);
    }

    /// proposalCount always increments by exactly 1 per submit
    function testFuzz_SubmitProposal_CountAlwaysIncrements(uint8 n) public {
        vm.assume(n > 0 && n <= 20);
        for (uint8 i = 0; i < n; i++) {
            dao.submitProposal(founder, FUNDING, VALUATION, "fuzz");
        }
        assertEq(dao.proposalCount(), n);
    }
}
