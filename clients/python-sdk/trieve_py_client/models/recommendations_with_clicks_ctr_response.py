# coding: utf-8

"""
    Trieve API

    Trieve OpenAPI Specification. This document describes all of the operations available through the Trieve API.

    The version of the OpenAPI document: 0.11.9
    Contact: developers@trieve.ai
    Generated by OpenAPI Generator (https://openapi-generator.tech)

    Do not edit the class manually.
"""  # noqa: E501


from __future__ import annotations
import pprint
import re  # noqa: F401
import json

from pydantic import BaseModel, ConfigDict, StrictInt, StrictStr
from typing import Any, ClassVar, Dict, List, Optional
from trieve_py_client.models.chunk_metadata import ChunkMetadata
from typing import Optional, Set
from typing_extensions import Self

class RecommendationsWithClicksCTRResponse(BaseModel):
    """
    RecommendationsWithClicksCTRResponse
    """ # noqa: E501
    clicked_chunks: List[ChunkMetadata]
    created_at: StrictStr
    negative_ids: Optional[List[StrictStr]] = None
    negative_tracking_ids: Optional[List[StrictStr]] = None
    positions: List[StrictInt]
    positive_ids: Optional[List[StrictStr]] = None
    positive_tracking_ids: Optional[List[StrictStr]] = None
    __properties: ClassVar[List[str]] = ["clicked_chunks", "created_at", "negative_ids", "negative_tracking_ids", "positions", "positive_ids", "positive_tracking_ids"]

    model_config = ConfigDict(
        populate_by_name=True,
        validate_assignment=True,
        protected_namespaces=(),
    )


    def to_str(self) -> str:
        """Returns the string representation of the model using alias"""
        return pprint.pformat(self.model_dump(by_alias=True))

    def to_json(self) -> str:
        """Returns the JSON representation of the model using alias"""
        # TODO: pydantic v2: use .model_dump_json(by_alias=True, exclude_unset=True) instead
        return json.dumps(self.to_dict())

    @classmethod
    def from_json(cls, json_str: str) -> Optional[Self]:
        """Create an instance of RecommendationsWithClicksCTRResponse from a JSON string"""
        return cls.from_dict(json.loads(json_str))

    def to_dict(self) -> Dict[str, Any]:
        """Return the dictionary representation of the model using alias.

        This has the following differences from calling pydantic's
        `self.model_dump(by_alias=True)`:

        * `None` is only added to the output dict for nullable fields that
          were set at model initialization. Other fields with value `None`
          are ignored.
        """
        excluded_fields: Set[str] = set([
        ])

        _dict = self.model_dump(
            by_alias=True,
            exclude=excluded_fields,
            exclude_none=True,
        )
        # override the default output from pydantic by calling `to_dict()` of each item in clicked_chunks (list)
        _items = []
        if self.clicked_chunks:
            for _item in self.clicked_chunks:
                if _item:
                    _items.append(_item.to_dict())
            _dict['clicked_chunks'] = _items
        # set to None if negative_ids (nullable) is None
        # and model_fields_set contains the field
        if self.negative_ids is None and "negative_ids" in self.model_fields_set:
            _dict['negative_ids'] = None

        # set to None if negative_tracking_ids (nullable) is None
        # and model_fields_set contains the field
        if self.negative_tracking_ids is None and "negative_tracking_ids" in self.model_fields_set:
            _dict['negative_tracking_ids'] = None

        # set to None if positive_ids (nullable) is None
        # and model_fields_set contains the field
        if self.positive_ids is None and "positive_ids" in self.model_fields_set:
            _dict['positive_ids'] = None

        # set to None if positive_tracking_ids (nullable) is None
        # and model_fields_set contains the field
        if self.positive_tracking_ids is None and "positive_tracking_ids" in self.model_fields_set:
            _dict['positive_tracking_ids'] = None

        return _dict

    @classmethod
    def from_dict(cls, obj: Optional[Dict[str, Any]]) -> Optional[Self]:
        """Create an instance of RecommendationsWithClicksCTRResponse from a dict"""
        if obj is None:
            return None

        if not isinstance(obj, dict):
            return cls.model_validate(obj)

        _obj = cls.model_validate({
            "clicked_chunks": [ChunkMetadata.from_dict(_item) for _item in obj["clicked_chunks"]] if obj.get("clicked_chunks") is not None else None,
            "created_at": obj.get("created_at"),
            "negative_ids": obj.get("negative_ids"),
            "negative_tracking_ids": obj.get("negative_tracking_ids"),
            "positions": obj.get("positions"),
            "positive_ids": obj.get("positive_ids"),
            "positive_tracking_ids": obj.get("positive_tracking_ids")
        })
        return _obj


