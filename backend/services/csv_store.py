import csv
from pathlib import Path
from typing import Optional


class CsvStore:
    def __init__(self, file_path: Path, columns: list[str],
                 column_defaults: dict[str, str] | None = None):
        self.file_path = file_path
        self.columns = columns
        self.column_defaults = column_defaults or {}
        self._ensure_file()

    def _ensure_file(self):
        if not self.file_path.exists():
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.file_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=self.columns)
                writer.writeheader()

    def read_all(self) -> list[dict]:
        with open(self.file_path, "r", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
        if self.column_defaults:
            for row in rows:
                for col, default in self.column_defaults.items():
                    if col not in row or row[col] == "":
                        row[col] = default
        return rows

    def find_by_id(self, id: str) -> Optional[dict]:
        for row in self.read_all():
            if row["id"] == id:
                return row
        return None

    def append(self, row: dict):
        with open(self.file_path, "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=self.columns)
            writer.writerow(row)

    def update(self, id: str, updates: dict) -> Optional[dict]:
        rows = self.read_all()
        updated = None
        for row in rows:
            if row["id"] == id:
                row.update(updates)
                updated = row
                break
        if updated:
            self._write_all(rows)
        return updated

    def delete(self, id: str) -> bool:
        rows = self.read_all()
        filtered = [r for r in rows if r["id"] != id]
        if len(filtered) == len(rows):
            return False
        self._write_all(filtered)
        return True

    def _write_all(self, rows: list[dict]):
        with open(self.file_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=self.columns)
            writer.writeheader()
            writer.writerows(rows)
