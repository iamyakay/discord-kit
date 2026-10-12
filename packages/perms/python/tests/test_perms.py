import json
from pathlib import Path

import pytest

from iamyakay_perms import (
    add,
    can_manage_role,
    decode,
    encode,
    explain,
    has,
    invite_url,
    remove,
    resolve,
)

VECTORS_PATH = (
    Path(__file__).parent.parent.parent.parent.parent
    / "shared"
    / "test-vectors"
    / "perms.json"
)
vectors = json.loads(VECTORS_PATH.read_text())


class TestEncode:
    @pytest.mark.parametrize("vector", vectors["encode"])
    def test_encode(self, vector: dict) -> None:
        assert str(encode(vector["input"])) == vector["output"]

    def test_unknown_permission(self) -> None:
        with pytest.raises(ValueError, match="unknown permission: FAKE_PERMISSION"):
            encode(["FAKE_PERMISSION"])


class TestDecode:
    @pytest.mark.parametrize("vector", vectors["decode"])
    def test_decode(self, vector: dict) -> None:
        result = decode(int(vector["input"]))
        assert sorted(result) == sorted(vector["output"])


class TestHas:
    @pytest.mark.parametrize("vector", vectors["has"])
    def test_has(self, vector: dict) -> None:
        assert has(int(vector["permissions"]), vector["permission"]) == vector["output"]

    def test_unknown_permission(self) -> None:
        with pytest.raises(ValueError, match="unknown permission: FAKE_PERMISSION"):
            has(0, "FAKE_PERMISSION")


class TestAdd:
    @pytest.mark.parametrize("vector", vectors["add"])
    def test_add(self, vector: dict) -> None:
        assert str(add(int(vector["permissions"]), *vector["toAdd"])) == vector["output"]

    def test_unknown_permission(self) -> None:
        with pytest.raises(ValueError, match="unknown permission: FAKE_PERMISSION"):
            add(0, "FAKE_PERMISSION")


class TestRemove:
    @pytest.mark.parametrize("vector", vectors["remove"])
    def test_remove(self, vector: dict) -> None:
        assert str(remove(int(vector["permissions"]), *vector["toRemove"])) == vector["output"]

    def test_unknown_permission(self) -> None:
        with pytest.raises(ValueError, match="unknown permission: FAKE_PERMISSION"):
            remove(0, "FAKE_PERMISSION")


class TestCanManageRole:
    @pytest.mark.parametrize("vector", vectors["canManageRole"])
    def test_can_manage_role(self, vector: dict) -> None:
        assert (
            can_manage_role(
                vector["actor"],
                vector["target"],
                vector["guild"],
            )
            == vector["output"]
        )


class TestResolve:
    @pytest.mark.parametrize("vector", vectors["resolve"])
    def test_resolve(self, vector: dict) -> None:
        assert (
            str(
                resolve(
                    vector["member"],
                    vector["channel"],
                    vector["guild"],
                )
            )
            == vector["output"]
        )


class TestExplain:
    @pytest.mark.parametrize("vector", vectors["explain"])
    def test_explain(self, vector: dict) -> None:
        result = explain(
            vector["member"],
            vector["channel"],
            vector["guild"],
            vector["permission"],
        )
        assert result == vector["output"]


class TestInviteUrl:
    @pytest.mark.parametrize("vector", vectors["inviteUrl"])
    def test_invite_url(self, vector: dict) -> None:
        assert invite_url(vector["clientId"], vector.get("options")) == vector["output"]
