// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

library ECDSA {
    function recover(bytes32 hash, bytes memory signature) internal pure returns (address) {
        if (signature.length != 65) revert("ECDSA: invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }
        if (v < 27) v += 27;
        if (v != 27 && v != 28) revert("ECDSA: invalid signature 'v' value");
        return ecrecover(hash, v, r, s);
    }
}

contract RewardClaimer {
    // Immutable config
    IERC20 public immutable token;
    uint256 public immutable CHAIN_ID;

    // Owner and signer
    address public owner;
    address public signer;

    // EIP-712 constants
    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public constant CLAIM_TYPEHASH = keccak256(
        "Claim(uint256 roundId,uint256 fid,address recipient,uint256 amount,uint8 prizeType,uint256 nonce,uint256 expiry)"
    );

    // Anti-double-claim
    mapping(bytes32 => bool) public claimed;

    // Events
    event Claimed(uint256 roundId, uint256 fid, address indexed recipient, uint256 amount, uint8 prizeType);
    event Rescue(address indexed to, uint256 amount);
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(address _token, address _signer, uint256 chainId) {
        require(_token != address(0), "token=0");
        require(_signer != address(0), "signer=0");
        token = IERC20(_token);
        signer = _signer;
        owner = msg.sender;
        CHAIN_ID = chainId;
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                // EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes("RewardClaimer")),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );
    }

    function setSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "signer=0");
        emit SignerUpdated(signer, _signer);
        signer = _signer;
    }

    function rescue(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "to=0");
        require(token.transfer(to, amount), "transfer fail");
        emit Rescue(to, amount);
    }

    function claim(
        uint256 roundId,
        uint256 fid,
        address recipient,
        uint256 amount,
        uint8 prizeType,
        uint256 nonce,
        uint256 expiry,
        bytes calldata signature
    ) external {
        require(block.timestamp <= expiry, "expired");
        require(recipient != address(0), "recipient=0");

        // struct hash
        bytes32 structHash = keccak256(
            abi.encode(CLAIM_TYPEHASH, roundId, fid, recipient, amount, prizeType, nonce, expiry)
        );

        // full EIP-712 digest
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));

        require(!claimed[digest], "already claimed");
        address recovered = ECDSA.recover(digest, signature);
        require(recovered == signer, "bad sig");

        claimed[digest] = true;
        require(token.transfer(recipient, amount), "transfer fail");
        emit Claimed(roundId, fid, recipient, amount, prizeType);
    }
}
