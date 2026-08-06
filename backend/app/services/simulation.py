from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Awaitable, Callable, Generic, TypeVar

logger = logging.getLogger("ai_asset_router.simulation")

T = TypeVar("T")


@dataclass
class SafeResult(Generic[T]):
    data: T
    simulated: bool
    reason: str | None


async def safe_call(
    live: Callable[[], Awaitable[T]],
    simulate: Callable[[], T],
    *,
    label: str,
) -> SafeResult[T]:
    """
    Try a real integration; on ANY failure (missing API key, network error, timeout,
    unexpected upstream response shape) fall back to a realistic simulated value
    instead of surfacing an error to the UI.

    Product requirement: the demo must always produce a usable result, so every
    external dependency in this app is called through here. Callers get back
    `simulated` + `reason` so the frontend can render a clear "Simulated" badge
    rather than silently presenting fake data as real.
    """
    try:
        return SafeResult(data=await live(), simulated=False, reason=None)
    except Exception as exc:  # noqa: BLE001 - intentional catch-all degrade-to-simulation boundary
        logger.warning(
            "live call '%s' failed (%s: %s) — falling back to simulated data",
            label,
            type(exc).__name__,
            exc,
        )
        return SafeResult(
            data=simulate(),
            simulated=True,
            reason=f"{type(exc).__name__}: {exc}",
        )
