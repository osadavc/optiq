from pathlib import Path
from dotenv import load_dotenv


def load_environment():
    """Load environment variables from the parent directory's .env.local file"""
    parent_dir = Path(__file__).parent.parent
    env_path = parent_dir / ".env.local"

    if env_path.exists():
        load_dotenv(env_path)
    else:
        env_fallback = parent_dir / ".env"
        if env_fallback.exists():
            load_dotenv(env_fallback)


if __name__ == "__main__":
    load_environment()
