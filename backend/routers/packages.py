import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import settings

router = APIRouter(prefix="/api/packages", tags=["packages"])


class PackageSummary(BaseModel):
    slug: str
    name: str
    description: str
    word_count: int
    category: str


class PackageDetail(BaseModel):
    slug: str
    name: str
    description: str
    words: list[str]
    category: str


def _packages_dir():
    return settings.data_dir / "packages"


@router.get("", response_model=list[PackageSummary])
def list_packages():
    pkgs = []
    for path in sorted(_packages_dir().glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            pkgs.append(PackageSummary(
                slug=path.stem,
                name=data["name"],
                description=data["description"],
                word_count=len(data["words"]),
                category=data.get("category", ""),
            ))
        except Exception:
            continue
    return pkgs


@router.get("/{slug}", response_model=PackageDetail)
def get_package(slug: str):
    path = _packages_dir() / f"{slug}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Package not found")
    data = json.loads(path.read_text(encoding="utf-8"))
    return PackageDetail(
        slug=slug,
        name=data["name"],
        description=data["description"],
        words=data["words"],
        category=data.get("category", ""),
    )
