"""
fassets.py — reads live FAssets parameters from the Coston2 AssetManager contract.

The approach:
  1. Resolve AssetManager address via the Flare Contract Registry (same address on all networks).
  2. Call lightweight named view functions: lotSize(), assetMintingDecimals(), fAsset().
  3. Attempt getSettings() for collateralReservationFeeBIPS — fail gracefully.
  4. All calls run through safe_call so the endpoint never 500s on RPC failures.
"""

from __future__ import annotations

import time

import anyio
from web3 import Web3

from ..config import get_settings

# Same registry on every Flare network
REGISTRY_ADDRESS = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019"

REGISTRY_ABI = [
    {
        "inputs": [{"internalType": "string", "name": "_name", "type": "string"}],
        "name": "getContractAddressByName",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function",
    }
]

ASSET_MANAGER_ABI = [
    {
        "inputs": [],
        "name": "lotSize",
        "outputs": [{"internalType": "uint256", "name": "_lotSizeUBA", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "assetMintingDecimals",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "fAsset",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "getSettings",
        "outputs": [
            {
                "components": [
                    {"internalType": "address", "name": "assetManagerController", "type": "address"},
                    {"internalType": "address", "name": "fAsset", "type": "address"},
                    {"internalType": "address", "name": "agentVaultFactory", "type": "address"},
                    {"internalType": "address", "name": "collateralPoolFactory", "type": "address"},
                    {"internalType": "address", "name": "collateralPoolTokenFactory", "type": "address"},
                    {"internalType": "string", "name": "poolTokenSuffix", "type": "string"},
                    {"internalType": "address", "name": "whitelist", "type": "address"},
                    {"internalType": "address", "name": "agentOwnerRegistry", "type": "address"},
                    {"internalType": "address", "name": "fdcVerification", "type": "address"},
                    {"internalType": "address", "name": "burnAddress", "type": "address"},
                    {"internalType": "address", "name": "priceReader", "type": "address"},
                    {"internalType": "uint8", "name": "assetDecimals", "type": "uint8"},
                    {"internalType": "uint8", "name": "assetMintingDecimals", "type": "uint8"},
                    {"internalType": "bytes32", "name": "chainId", "type": "bytes32"},
                    {"internalType": "uint32", "name": "averageBlockTimeMS", "type": "uint32"},
                    {"internalType": "uint32", "name": "mintingPoolHoldingsRequiredBIPS", "type": "uint32"},
                    {"internalType": "uint16", "name": "collateralReservationFeeBIPS", "type": "uint16"},
                    {"internalType": "uint64", "name": "assetUnitUBA", "type": "uint64"},
                    {"internalType": "uint64", "name": "assetMintingGranularityUBA", "type": "uint64"},
                    {"internalType": "uint64", "name": "lotSizeAMG", "type": "uint64"},
                ],
                "internalType": "struct AssetManagerSettings.Data",
                "name": "",
                "type": "tuple",
            }
        ],
        "stateMutability": "view",
        "type": "function",
    },
]

_am_address_cache: dict[str, str] = {}


def _get_web3() -> Web3:
    settings = get_settings()
    return Web3(Web3.HTTPProvider(settings.flare_rpc_url, request_kwargs={"timeout": 10}))


def _resolve_asset_manager_sync(registry_name: str) -> str:
    cached = _am_address_cache.get(registry_name)
    if cached:
        return cached
    w3 = _get_web3()
    registry = w3.eth.contract(
        address=Web3.to_checksum_address(REGISTRY_ADDRESS), abi=REGISTRY_ABI
    )
    address = registry.functions.getContractAddressByName(registry_name).call()
    _am_address_cache[registry_name] = address
    return address


def _fetch_fassets_params_sync(registry_name: str) -> dict:
    w3 = _get_web3()
    am_address = _resolve_asset_manager_sync(registry_name)
    am = w3.eth.contract(
        address=Web3.to_checksum_address(am_address), abi=ASSET_MANAGER_ABI
    )

    lot_size_uba: int = am.functions.lotSize().call()
    minting_decimals: int = am.functions.assetMintingDecimals().call()
    fasset_token: str = am.functions.fAsset().call()

    crfee_bips: int | None = None
    try:
        s = am.functions.getSettings().call()
        crfee_bips = s.collateralReservationFeeBIPS
    except Exception:
        pass

    # XRP has 6 decimal places (1 XRP = 1,000,000 drops)
    asset_decimals = 6
    lot_size_xrp = lot_size_uba / (10 ** asset_decimals)
    crfee_pct = (crfee_bips / 100) if crfee_bips is not None else None

    return {
        "assetManager": am_address,
        "fAssetToken": fasset_token,
        "lotSizeUBA": lot_size_uba,
        "lotSizeXRP": lot_size_xrp,
        "assetDecimals": asset_decimals,
        "mintingDecimals": minting_decimals,
        "collateralReservationFeeBIPS": crfee_bips,
        "collateralReservationFeePct": crfee_pct,
        "network": "Coston2 (testnet)",
        "fetchedAt": int(time.time()),
        "simulated": False,
        "simulationReason": None,
    }


async def get_ftestxrp_params() -> dict:
    """Read live FTestXRP Asset Manager parameters from Coston2."""
    return await anyio.to_thread.run_sync(
        lambda: _fetch_fassets_params_sync("AssetManagerFXRP")
    )


def simulate_ftestxrp_params() -> dict:
    """Fallback when the Coston2 RPC is unavailable or the contract call fails."""
    return {
        "assetManager": "0x0000000000000000000000000000000000000000",
        "fAssetToken": "0x0000000000000000000000000000000000000000",
        "lotSizeUBA": 20_000_000,
        "lotSizeXRP": 20.0,
        "assetDecimals": 6,
        "mintingDecimals": 6,
        "collateralReservationFeeBIPS": None,
        "collateralReservationFeePct": None,
        "network": "Coston2 (testnet)",
        "fetchedAt": int(time.time()),
        "simulated": True,
        "simulationReason": "Coston2 RPC unavailable or AssetManager call failed",
    }
