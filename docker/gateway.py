"""
BFF for Cloud Run: serves the SPA and proxies /graphql and /api to aether-app using a
Google ID token (service account) on Authorization, while forwarding the browser JWT
via X-Aether-User-Authorization.
"""

from __future__ import annotations

import asyncio
import os
from typing import Iterable

import httpx
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token as google_id_token
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import Response
from starlette.routing import Mount, Route
from starlette.staticfiles import StaticFiles

BACKEND = os.environ.get("AETHER_APP_ORIGIN", "").rstrip("/")
AUDIENCE = (os.environ.get("AETHER_ID_TOKEN_AUDIENCE") or BACKEND).rstrip("/")
STATIC_DIR = os.environ.get("AETHER_STATIC_DIR", "/app/static")

SKIP_HEADERS = frozenset(
    {
        "host",
        "connection",
        "content-length",
        "transfer-encoding",
        "keep-alive",
        "upgrade",
        "proxy-connection",
        # Browser-only; forwarding Origin makes Spring CorsWebFilter reject Cloud Run UI hosts
        # (allowed list is localhost-only). BFF→API is server-side, not a cross-origin browser call.
        "origin",
        "referer",
    }
)


def _fetch_id_token() -> str:
    if not AUDIENCE:
        raise RuntimeError("AETHER_ID_TOKEN_AUDIENCE or AETHER_APP_ORIGIN must be set")
    return google_id_token.fetch_id_token(GoogleRequest(), AUDIENCE)


def _forward_headers(request: Request, id_token: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for key, value in request.headers.items():
        lk = key.lower()
        if lk in SKIP_HEADERS or lk == "authorization":
            continue
        out[key] = value
    auth = request.headers.get("authorization")
    if auth:
        out["X-Aether-User-Authorization"] = auth
    out["Authorization"] = f"Bearer {id_token}"
    return out


async def proxy_to_app(request: Request) -> Response:
    if not BACKEND:
        return Response(
            "Misconfigured: set AETHER_APP_ORIGIN",
            status_code=500,
            media_type="text/plain",
        )
    try:
        id_tok = await asyncio.to_thread(_fetch_id_token)
    except Exception as exc:  # noqa: BLE001
        return Response(
            f"ID token error: {exc}",
            status_code=502,
            media_type="text/plain",
        )

    url = BACKEND + request.url.path
    q = request.url.query
    if q:
        url = f"{url}?{q}"

    body = await request.body()
    headers = _forward_headers(request, id_tok)
    timeout = httpx.Timeout(300.0, connect=30.0)

    async with httpx.AsyncClient(timeout=timeout, follow_redirects=False) as client:
        try:
            r = await client.request(
                request.method,
                url,
                headers=headers,
                content=body if body else None,
            )
        except httpx.RequestError as exc:
            return Response(
                f"Upstream error: {exc}",
                status_code=502,
                media_type="text/plain",
            )

    hop_by_hop = frozenset(
        {
            "connection",
            "keep-alive",
            "proxy-authenticate",
            "proxy-authorization",
            "te",
            "trailers",
            "transfer-encoding",
            "upgrade",
        }
    )
    # Starlette 0.45+ Response expects Mapping[str, str] (calls .items()); list of pairs raises AttributeError.
    resp_headers = {k: v for k, v in r.headers.items() if k.lower() not in hop_by_hop}
    return Response(content=r.content, status_code=r.status_code, headers=resp_headers)


PROXY_METHODS = ("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD")


def _routes() -> Iterable[Route]:
    yield Route("/graphql", endpoint=proxy_to_app, methods=list(PROXY_METHODS))
    yield Route("/api/{path:path}", endpoint=proxy_to_app, methods=list(PROXY_METHODS))


app = Starlette(
    routes=[
        *_routes(),
        Mount("/", app=StaticFiles(directory=STATIC_DIR, html=True), name="static"),
    ],
)
