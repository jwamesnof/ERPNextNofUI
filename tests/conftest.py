import os


def pytest_configure(config):
    """Default to live ERP unless explicitly overridden."""
    os.environ.setdefault("USE_LIVE_ERP", "true")
